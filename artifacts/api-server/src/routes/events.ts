import { Router, type IRouter } from "express";
import { addClient } from "../lib/events";

const router: IRouter = Router();

// Public SSE stream. Clients subscribe here to receive a `content-changed`
// event whenever any content is created, updated, deleted or reordered.
router.get("/events", (req, res): void => {
  addClient(req, res);
});

export default router;
