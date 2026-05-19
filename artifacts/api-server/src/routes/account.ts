import { Router, type IRouter } from "express";
import { requireUser } from "../services/auth/requireUser";
import { createDeletionService } from "../services/deletion/deletionService";

const router: IRouter = Router();
const deletionService = createDeletionService();

router.post("/account/deletion-request", async (req, res) => {
  const reauthenticatedAt = parseReauthenticatedAt(req.body);
  if (!reauthenticatedAt) {
    res.status(400).json({
      message: "A valid reauthenticatedAt timestamp is required.",
      code: "invalid_reauth_timestamp",
    });
    return;
  }

  const decision = await deletionService.requestDeletion({
    user: requireUser(req),
    reauthenticatedAt,
  });

  if (!decision.allowed) {
    res.status(decision.status).json({
      message: decision.message,
      code: decision.code,
    });
    return;
  }

  req.log.info(
    { audit: decision.auditEvent },
    "Account deletion request queued",
  );
  res.status(202).json({
    deletionRequestId: decision.request.id,
    status: decision.request.status,
    requestedAt: decision.request.requestedAt,
  });
});

export default router;

function parseReauthenticatedAt(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const value = (body as { reauthenticatedAt?: unknown }).reauthenticatedAt;
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return value;
}
