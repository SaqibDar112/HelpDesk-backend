import express from "express";
import { addComment } from "../controllers/comment.controller.js";
import { rateLimiter } from "../middleware/ratelimit.middleware.js";

const router = express.Router({ mergeParams: true });

router.post("/", rateLimiter, addComment);

export default router;
