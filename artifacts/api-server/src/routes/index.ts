import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import resourcesRouter from "./resources";
import authRouter from "./auth";
import contentRouter from "./content";
import siteTextRouter from "./site-text";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(resourcesRouter);
router.use(authRouter);
router.use(contentRouter);
router.use(siteTextRouter);

export default router;
