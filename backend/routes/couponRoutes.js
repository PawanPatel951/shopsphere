
import express from "express";
import {
  validateCouponCode,
  getCoupons,
  createCoupon,
  updateCoupon,
  toggleCoupon,
  deleteCoupon,
} from "../controllers/couponController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const adminOnly = (req, res, next) => {
  if (String(req.user?.role || "").toLowerCase() !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
  }

  next();
};

// Validate a coupon at checkout.
router.post("/validate", protect, validateCouponCode);

// Admin-only management endpoints.
router.get("/", protect, adminOnly, getCoupons);
router.post("/", protect, adminOnly, createCoupon);
router.put("/:id", protect, adminOnly, updateCoupon);
router.patch("/:id/toggle", protect, adminOnly, toggleCoupon);
router.delete("/:id", protect, adminOnly, deleteCoupon);

export default router;
