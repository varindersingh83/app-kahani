import { Router, type IRouter } from "express";
import { requireUser } from "../services/auth/requireUser";
import { privateAssetStore } from "./assets";
import { createShareLinkService } from "../services/sharing/shareLinkService";

export const shareLinkService = createShareLinkService();
const router: IRouter = Router();

router.post("/share-links", async (req, res) => {
  const user = requireUser(req);
  if (!user) {
    res.status(401).json({ message: "Sign in is required." });
    return;
  }

  const assetId = typeof req.body?.assetId === "string" ? req.body.assetId : "";
  const asset = await privateAssetStore.readForOwner({
    assetId,
    ownerUserId: user.userId,
  });
  if (!asset) {
    res.status(404).json({ message: "Asset not found." });
    return;
  }

  const link = shareLinkService.create({
    assetId: asset.id,
    ownerUserId: user.userId,
    title: typeof req.body?.title === "string" ? req.body.title : undefined,
  });

  res.status(201).json({
    token: link.token,
    expiresAt: link.expiresAt,
  });
});

router.get("/share-links/:token", async (req, res) => {
  const access = shareLinkService.access(req.params.token);
  if (!access.allowed) {
    res.status(404).json({ message: "Share link not found." });
    return;
  }

  const asset = await privateAssetStore.readForShare(access.link.assetId);
  if (!asset) {
    res.status(404).json({ message: "Share link not found." });
    return;
  }

  res.setHeader("Cache-Control", "no-store");
  res.json({
    title: access.redactedTitle,
    assetKind: asset.assetKind,
    assetId: asset.id,
  });
});

router.post("/share-links/:token/revoke", async (req, res) => {
  const user = requireUser(req);
  if (!user) {
    res.status(401).json({ message: "Sign in is required." });
    return;
  }

  if (!shareLinkService.revoke({ token: req.params.token, ownerUserId: user.userId })) {
    res.status(404).json({ message: "Share link not found." });
    return;
  }

  res.status(204).send();
});

export default router;
