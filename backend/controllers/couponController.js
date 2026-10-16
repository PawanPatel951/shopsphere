
import Coupon from "../models/Coupon.js";
import {
  validateCoupon,
} from "../utils/couponService.js";

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const normalizeCode = (code) =>
  String(code || "").trim().toUpperCase();

function validateCouponInput(body) {
  const {
    code,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscount,
    startsAt,
    expiresAt,
    usageLimit,
  } = body;

  const value = Number(discountValue);
  const minimum = Number(minOrderAmount ?? 0);
  const maximum =
    maxDiscount === "" || maxDiscount == null
      ? null
      : Number(maxDiscount);
  const limit =
    usageLimit === "" || usageLimit == null
      ? null
      : Number(usageLimit);

  if (!/^[A-Z0-9_-]{3,30}$/i.test(String(code || "").trim())) {
    throw new Error(
      "Coupon code must be 3–30 characters using letters, numbers, _ or -."
    );
  }

  if (!["percentage", "fixed"].includes(discountType)) {
    throw new Error("Choose percentage or fixed discount.");
  }

  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    (discountType === "percentage" && value > 100)
  ) {
    throw new Error("Invalid discount value.");
  }

  if (!Number.isFinite(minimum) || minimum < 0) {
    throw new Error("Minimum order amount cannot be negative.");
  }

  if (
    maximum !== null &&
    (!Number.isFinite(maximum) || maximum < 0)
  ) {
    throw new Error("Maximum discount must be zero or greater.");
  }

  if (
    limit !== null &&
    (!Number.isInteger(limit) || limit < 1)
  ) {
    throw new Error("Usage limit must be a positive whole number.");
  }

  const start = new Date(startsAt || Date.now());
  const end = new Date(expiresAt);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) {
    throw new Error("Please provide valid start and expiry dates.");
  }

  return {
    code: normalizeCode(code),
    discountType,
    discountValue: value,
    minOrderAmount: minimum,
    maxDiscount: maximum,
    startsAt: start,
    expiresAt: end,
    usageLimit: limit,
  };
}

// POST /api/coupons/validate
export const validateCouponCode = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;

  const result = await validateCoupon(code, subtotal);

  res.json({
    success: true,
    message: "Coupon applied successfully.",
    coupon: {
      code: result.coupon.code,
      description: result.coupon.description,
      discountType: result.coupon.discountType,
      discountValue: result.coupon.discountValue,
      minOrderAmount: result.coupon.minOrderAmount,
      maxDiscount: result.coupon.maxDiscount,
    },
    subtotal: result.subtotal,
    discount: result.discount,
    total: result.total,
  });
});

// GET /api/coupons — admin
export const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find()
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, coupons });
});

// POST /api/coupons — admin
export const createCoupon = asyncHandler(async (req, res) => {
  const input = validateCouponInput(req.body);

  const existing = await Coupon.findOne({ code: input.code });

  if (existing) {
    return res.status(409).json({
      success: false,
      message: "A coupon with this code already exists.",
    });
  }

  const coupon = await Coupon.create({
    ...input,
    description: String(req.body.description || "").trim(),
    isActive: req.body.isActive !== false,
  });

  res.status(201).json({
    success: true,
    message: "Coupon created successfully.",
    coupon,
  });
});

// PUT /api/coupons/:id — admin
export const updateCoupon = asyncHandler(async (req, res) => {
  const input = validateCouponInput(req.body);

  const duplicate = await Coupon.findOne({
    code: input.code,
    _id: { $ne: req.params.id },
  });

  if (duplicate) {
    return res.status(409).json({
      success: false,
      message: "This coupon code is already in use.",
    });
  }

  const coupon = await Coupon.findByIdAndUpdate(
    req.params.id,
    {
      ...input,
      description: String(req.body.description || "").trim(),
      isActive: req.body.isActive !== false,
    },
    { new: true, runValidators: true }
  );

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: "Coupon not found.",
    });
  }

  res.json({
    success: true,
    message: "Coupon updated successfully.",
    coupon,
  });
});

// PATCH /api/coupons/:id/toggle — admin
export const toggleCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: "Coupon not found.",
    });
  }

  coupon.isActive = !coupon.isActive;
  await coupon.save();

  res.json({
    success: true,
    message: `Coupon ${coupon.isActive ? "activated" : "deactivated"}.`,
    coupon,
  });
});

// DELETE /api/coupons/:id — admin
export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: "Coupon not found.",
    });
  }

  res.json({
    success: true,
    message: "Coupon deleted successfully.",
  });
});
