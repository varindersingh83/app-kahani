import { Router, type IRouter } from "express";
import { requireUser } from "../services/auth/requireUser";
import { createInMemoryPrivateAssetStore } from "../services/assets/privateAssetStore";

export const privateAssetStore = createInMemoryPrivateAssetStore();
const router: IRouter = Router();

router.get("/assets/:assetId", async (req, res) => {
  const user = requireUser(req);
  if (!user) {
    res.status(401).json({ message: "Sign in is required." });
    return;
  }

  const asset = await privateAssetStore.readForOwner({
    assetId: req.params.assetId,
    ownerUserId: user.userId,
  });
  if (!asset) {
    res.status(404).json({ message: "Asset not found." });
    return;
  }

  res.setHeader("Cache-Control", "private, no-store");
  res.type(asset.contentType).send(asset.body);
});

export default router;
