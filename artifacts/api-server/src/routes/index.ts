import { Router, type IRouter } from "express";
import booksRouter from "./books";
import healthRouter from "./health";
import storiesRouter from "./stories";
import { requireUser } from "../middlewares/requireUser";

const router: IRouter = Router();

router.use(healthRouter);
router.use(requireUser);
router.use(booksRouter);
router.use(storiesRouter);

export default router;
