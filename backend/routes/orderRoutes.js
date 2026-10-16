import express from "express";

import {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";

import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// All order routes require authentication.
router.use(protect);

// Customer routes
router.post("/", createOrder);
router.get("/my-orders", getMyOrders);

// Admin routes — authentication AND admin authorization required.
router.get("/", adminOnly, getAllOrders);
router.patch("/:id/status", adminOnly, updateOrderStatus);

// Keep this after /my-orders and the admin routes.
router.get("/:id", getMyOrderById);

export default router;