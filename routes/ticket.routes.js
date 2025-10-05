import express from "express";
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  getBreachedTickets,
} from "../controllers/ticket.controller.js";

import { protect, authorize } from "../middleware/auth.middleware.js";
import { rateLimiter } from "../middleware/ratelimit.middleware.js";
import { idempotency } from "../middleware/idempotency.middleware.js";

import commentRoutes from "./comment.routes.js";

const router = express.Router();


router.use("/:id/comments", protect, commentRoutes);

router.post("/", protect, rateLimiter, idempotency, createTicket);

router.get("/", protect, rateLimiter, getTickets);

router.get("/:id", protect, rateLimiter, getTicketById);

router.patch("/:id", protect, rateLimiter, updateTicket);

router.get("/breached/list", protect, authorize("agent", "admin"), getBreachedTickets);

export default router;
