import express from "express";
import { getSalesReport } from "../controllers/reportsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Only administrators can view store-wide sales reports.
const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
  }

  next();
};

router.get("/", protect, adminOnly, getSalesReport);

export default router;
