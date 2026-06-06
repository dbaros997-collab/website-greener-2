import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import resourcesRouter from "./resources";
import authRouter from "./auth";
import contentRouter from "./content";
import siteTextRouter from "./site-text";
import eventsRouter from "./events";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(resourcesRouter);
router.use(authRouter);
router.use(contentRouter);
router.use(siteTextRouter);
router.use(eventsRouter);

export default router;
