import { Router, type IRouter } from "express";
import accountRouter from "./account";
import assetsRouter from "./assets";
import booksRouter from "./books";
import healthRouter from "./health";
import shareLinksRouter from "./shareLinks";
import storiesRouter from "./stories";

const router: IRouter = Router();

router.use(healthRouter);
router.use(accountRouter);
router.use(assetsRouter);
router.use(shareLinksRouter);
router.use(booksRouter);
router.use(storiesRouter);

export default router;
