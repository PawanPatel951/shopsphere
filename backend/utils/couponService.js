
import Coupon from "../models/Coupon.js";

export async function validateCoupon(code, subtotal) {
  const normalizedCode = String(code || "")
    .trim()
    .toUpperCase();

  const amount = Number(subtotal);

  if (!normalizedCode) {
    throw new Error("Please enter a coupon code.");
  }

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Invalid order subtotal.");
  }

  const coupon = await Coupon.findOne({
    code: normalizedCode,
  });

  if (!coupon || !coupon.isActive) {
    throw new Error("Invalid or inactive coupon code.");
  }

  const now = new Date();

  if (now < coupon.startsAt) {
    throw new Error("This coupon is not active yet.");
  }

  if (now > coupon.expiresAt) {
    throw new Error("This coupon has expired.");
  }

  if (
    coupon.usageLimit !== null &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    throw new Error("This coupon has reached its usage limit.");
  }

  if (amount < coupon.minOrderAmount) {
    throw new Error(
      `Minimum order amount is ₹${coupon.minOrderAmount}.`
    );
  }

  let discount = 0;

  if (coupon.discountType === "percentage") {
    discount = (amount * coupon.discountValue) / 100;

    if (coupon.maxDiscount !== null) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else {
    discount = coupon.discountValue;
  }

  discount = Math.min(amount, Math.max(0, discount));
  discount = Math.round((discount + Number.EPSILON) * 100) / 100;

  return {
    coupon,
    discount,
    subtotal: amount,
    total: Math.round((amount - discount + Number.EPSILON) * 100) / 100,
  };
}

export async function consumeCoupon(couponId) {
  const coupon = await Coupon.findOneAndUpdate(
    {
      _id: couponId,
      isActive: true,
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
      ],
      startsAt: { $lte: new Date() },
      expiresAt: { $gte: new Date() },
    },
    { $inc: { usedCount: 1 } },
    { new: true }
  );

  if (!coupon) {
    throw new Error("Coupon is no longer available.");
  }

  return coupon;
}
