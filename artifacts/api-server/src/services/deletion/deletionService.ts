import type { AuthenticatedUser } from "../auth/requireUser";
import { buildAuditEvent, type AuditEvent } from "../audit/auditService";

export type DeletionRequest = {
  id: string;
  userId: string;
  status: "queued" | "completed" | "failed";
  requestedAt: string;
  reauthenticatedAt: string;
};

export type DeletionRepository = {
  create(input: Omit<DeletionRequest, "id" | "status" | "requestedAt">): Promise<DeletionRequest>;
  latest(userId: string): Promise<DeletionRequest | null>;
};

export type DeletionDecision =
  | { allowed: true; request: DeletionRequest; auditEvent: AuditEvent }
  | {
      allowed: false;
      status: 401 | 403;
      code: "auth_required" | "fresh_reauth_required";
      message: string;
    };

const REAUTH_FRESHNESS_MS = 10 * 60 * 1000;

export function createInMemoryDeletionRepository(): DeletionRepository {
  const requests: DeletionRequest[] = [];

  return {
    async create(input) {
      const request: DeletionRequest = {
        ...input,
        id: `del_${requests.length + 1}`,
        status: "queued",
        requestedAt: new Date().toISOString(),
      };
      requests.push(request);
      return request;
    },
    async latest(userId) {
      return requests.filter((request) => request.userId === userId).at(-1) ?? null;
    },
  };
}

export function createDeletionService(input: {
  repository?: DeletionRepository;
  now?: () => Date;
} = {}) {
  const repository = input.repository ?? createInMemoryDeletionRepository();
  const now = input.now ?? (() => new Date());

  return {
    async requestDeletion(request: {
      user: AuthenticatedUser | null;
      reauthenticatedAt?: string;
    }): Promise<DeletionDecision> {
      if (!request.user) {
        return {
          allowed: false,
          status: 401,
          code: "auth_required",
          message: "Sign in is required.",
        };
      }

      const reauthenticatedAt = request.reauthenticatedAt;
      if (!reauthenticatedAt || !isFreshReauth(reauthenticatedAt, now())) {
        return {
          allowed: false,
          status: 403,
          code: "fresh_reauth_required",
          message: "Fresh re-authentication is required before account deletion.",
        };
      }

      const deletionRequest = await repository.create({
        userId: request.user.userId,
        reauthenticatedAt,
      });

      return {
        allowed: true,
        request: deletionRequest,
        auditEvent: buildAuditEvent({
          actorUserId: request.user.userId,
          eventType: "account.deletion_requested",
          targetType: "user",
          targetId: request.user.userId,
          metadata: {
            source: "account_route",
            deletionRequestStatus: deletionRequest.status,
          },
        }),
      };
    },
    latestDeletionRequest(userId: string) {
      return repository.latest(userId);
    },
  };
}

function isFreshReauth(reauthenticatedAt: string | undefined, now: Date) {
  if (!reauthenticatedAt) return false;
  const parsed = new Date(reauthenticatedAt);
  if (Number.isNaN(parsed.getTime())) return false;
  const ageMs = now.getTime() - parsed.getTime();
  return ageMs >= 0 && ageMs <= REAUTH_FRESHNESS_MS;
}
