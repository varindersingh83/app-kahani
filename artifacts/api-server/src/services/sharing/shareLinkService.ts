import { randomBytes } from "node:crypto";

export type ShareLink = {
  token: string;
  assetId: string;
  ownerUserId: string;
  expiresAt: string;
  revokedAt?: string;
  accessCount: number;
  redactedTitle: string;
};

export type ShareLinkAccess =
  | {
      allowed: true;
      link: ShareLink;
      redactedTitle: string;
    }
  | {
      allowed: false;
      reason: "not_found" | "expired" | "revoked";
    };

export function createShareLinkService(input: { now?: () => Date } = {}) {
  const links = new Map<string, ShareLink>();
  const now = input.now ?? (() => new Date());

  return {
    create(input: {
      assetId: string;
      ownerUserId: string;
      title?: string;
      ttlHours?: number;
    }) {
      const token = randomBytes(18).toString("base64url");
      const expiresAt = new Date(
        now().getTime() + (input.ttlHours ?? 24) * 60 * 60 * 1000,
      ).toISOString();
      const link: ShareLink = {
        token,
        assetId: input.assetId,
        ownerUserId: input.ownerUserId,
        expiresAt,
        accessCount: 0,
        redactedTitle: redactSharedTitle(input.title),
      };
      links.set(token, link);
      return link;
    },
    access(token: string): ShareLinkAccess {
      const link = links.get(token);
      if (!link) return { allowed: false, reason: "not_found" };
      if (link.revokedAt) return { allowed: false, reason: "revoked" };
      if (new Date(link.expiresAt).getTime() <= now().getTime()) {
        return { allowed: false, reason: "expired" };
      }
      link.accessCount += 1;
      return { allowed: true, link, redactedTitle: link.redactedTitle };
    },
    revoke(input: { token: string; ownerUserId: string }) {
      const link = links.get(input.token);
      if (!link || link.ownerUserId !== input.ownerUserId) return false;
      link.revokedAt = now().toISOString();
      return true;
    },
  };
}

function redactSharedTitle(title?: string) {
  if (!title?.trim()) return "A Kahani story";
  return title.replace(/\b[A-Z][a-z]{1,}\b/g, "a child");
}
