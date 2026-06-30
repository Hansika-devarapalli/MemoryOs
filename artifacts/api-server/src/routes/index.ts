import { Router, type IRouter } from "express";
import healthRouter from "./health";
import documentsRouter from "./documents";
import searchRouter from "./search";
import indexingRouter from "./indexing";
import statsRouter from "./stats";
import timelineRouter from "./timeline";

const router: IRouter = Router();

router.use(healthRouter);
router.use(documentsRouter);
router.use(searchRouter);
router.use(indexingRouter);
router.use(statsRouter);
router.use(timelineRouter);

export default router;
