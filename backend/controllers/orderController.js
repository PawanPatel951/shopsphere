
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Coupon from "../models/Coupon.js";

const createOrderNumber = () =>
  `SN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

const isValidPhone = (phone) => /^[0-9]{10}$/.test(phone);
const isValidPincode = (pincode) => /^[0-9]{6}$/.test(pincode);

const ALLOWED_ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const roundMoney = (amount) =>
  Math.round((Number(amount) + Number.EPSILON) * 100) / 100;

const makeClientError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/* =====================================================
   CREATE ORDER — CUSTOMER
   POST /api/orders
===================================================== */
export const createOrder = async (req, res) => {
  const reservedProducts = [];
  let reservedCouponId = null;
  let savedOrder = null;

  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Please log in to place an order.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty.",
      });
    }

    if (items.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Too many different products in one order.",
      });
    }

    if (paymentMethod && paymentMethod !== "COD") {
      return res.status(400).json({
        success: false,
        message: "Currently only Cash on Delivery is supported.",
      });
    }

    const address = {
      fullName: String(shippingAddress?.fullName || "").trim(),
      email: String(shippingAddress?.email || "").trim().toLowerCase(),
      phone: String(shippingAddress?.phone || "").trim(),
      address: String(shippingAddress?.address || "").trim(),
      city: String(shippingAddress?.city || "").trim(),
      state: String(shippingAddress?.state || "").trim(),
      pincode: String(shippingAddress?.pincode || "").trim(),
    };

    if (
      !address.fullName ||
      !address.address ||
      !address.city ||
      !address.state
    ) {
      return res.status(400).json({
        success: false,
        message: "Please complete your delivery address.",
      });
    }

    if (!isValidPhone(address.phone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number.",
      });
    }

    if (!isValidPincode(address.pincode)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 6-digit PIN code.",
      });
    }

    // Combine duplicate products and validate quantities.
    const quantityMap = new Map();

    for (const item of items) {
      const productId = String(item.productId || item.id || "");

      if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({
          success: false,
          message: "An item in your cart has an invalid product ID.",
        });
      }

      const quantity = Number(item.quantity);

      if (
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > 99
      ) {
        return res.status(400).json({
          success: false,
          message: "Product quantity must be between 1 and 99.",
        });
      }

      const nextQuantity = (quantityMap.get(productId) || 0) + quantity;

      if (nextQuantity > 99) {
        return res.status(400).json({
          success: false,
          message: "Maximum quantity per product is 99.",
        });
      }

      quantityMap.set(productId, nextQuantity);
    }

    const productIds = [...quantityMap.keys()];

    // Never trust product prices sent by the frontend.
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    });

    const productMap = new Map(
      products.map((product) => [String(product._id), product])
    );

    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more products are no longer available.",
      });
    }

    let subtotal = 0;

    const orderItems = productIds.map((productId) => {
      const product = productMap.get(productId);
      const quantity = quantityMap.get(productId);
      const price = Number(product.price);

      if (!Number.isFinite(price) || price < 0) {
        throw makeClientError(`Invalid price for ${product.name}.`, 409);
      }

      if (Number(product.stock) < quantity) {
        throw makeClientError(
          `Insufficient stock for ${product.name}. Available: ${product.stock}.`,
          409
        );
      }

      subtotal += price * quantity;

      return {
        product: product._id,
        name: product.name,
        image: product.image || "",
        price,
        quantity,
      };
    });

    subtotal = roundMoney(subtotal);

    // Coupon code comes from Checkout, but discount is always
    // recalculated from the database on the server.
    const couponCode = String(req.body.couponCode || "")
      .trim()
      .toUpperCase();

    let coupon = null;
    let discount = 0;
    let discountPercentage = 0;

    if (couponCode) {
      const now = new Date();

      coupon = await Coupon.findOne({ code: couponCode, isActive: true });

      if (!coupon) {
        throw makeClientError("Invalid or inactive coupon.");
      }

      if (coupon.startsAt && new Date(coupon.startsAt) > now) {
        throw makeClientError("This coupon is not active yet.");
      }

      if (!coupon.expiresAt || new Date(coupon.expiresAt) <= now) {
        throw makeClientError("This coupon has expired.");
      }

      if (subtotal < Number(coupon.minOrderAmount || 0)) {
        throw makeClientError(
          `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}.`
        );
      }

      if (
        coupon.usageLimit != null &&
        Number(coupon.usedCount || 0) >= Number(coupon.usageLimit)
      ) {
        throw makeClientError("This coupon usage limit has been reached.");
      }

      if (coupon.discountType === "percentage") {
        const percentage = Number(coupon.discountValue);

        if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
          throw makeClientError("Coupon percentage is invalid.");
        }

        discountPercentage = percentage;
        discount = (subtotal * percentage) / 100;

        if (coupon.maxDiscount != null) {
          discount = Math.min(discount, Number(coupon.maxDiscount));
        }
      } else if (coupon.discountType === "fixed") {
        const fixedValue = Number(coupon.discountValue);

        if (!Number.isFinite(fixedValue) || fixedValue <= 0) {
          throw makeClientError("Coupon discount amount is invalid.");
        }

        discount = fixedValue;
      } else {
        throw makeClientError("Unsupported coupon discount type.");
      }

      discount = roundMoney(Math.min(subtotal, Math.max(0, discount)));

      // Atomically reserve a use so simultaneous orders cannot
      // exceed the coupon's usage limit.
      const usageConditions = [
        { usageLimit: null },
        { usageLimit: { $exists: false } },
        { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
      ];

      const reservedCoupon = await Coupon.findOneAndUpdate(
        {
          _id: coupon._id,
          isActive: true,
          startsAt: { $lte: now },
          expiresAt: { $gt: now },
          minOrderAmount: { $lte: subtotal },
          $or: usageConditions,
        },
        { $inc: { usedCount: 1 } },
        { new: true }
      );

      if (!reservedCoupon) {
        throw makeClientError(
          "This coupon is no longer available. Please apply another coupon."
        );
      }

      reservedCouponId = reservedCoupon._id;
    }

    const totalAmount = roundMoney(Math.max(0, subtotal - discount));

    // Reserve stock with atomic updates.
    for (const item of orderItems) {
      const reserved = await Product.findOneAndUpdate(
        {
          _id: item.product,
          isActive: true,
          stock: { $gte: item.quantity },
        },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!reserved) {
        throw makeClientError(
          `Stock changed while placing your order for ${item.name}. Please try again.`,
          409
        );
      }

      reservedProducts.push({
        productId: item.product,
        quantity: item.quantity,
      });
    }

    savedOrder = await Order.create({
      orderNumber: createOrderNumber(),
      user: req.user._id,
      items: orderItems,
      shippingAddress: address,
      subtotal,
      couponCode: coupon ? coupon.code : "",
      discountPercentage,
      discount,
      discountAmount: discount,
      totalAmount,
      paymentMethod: "COD",
      paymentStatus: "Pending",
      orderStatus: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order: savedOrder,
    });
  } catch (error) {
    // Restore stock if the order was not saved.
    if (!savedOrder && reservedProducts.length > 0) {
      await Promise.all(
        reservedProducts.map(({ productId, quantity }) =>
          Product.updateOne(
            { _id: productId },
            { $inc: { stock: quantity } }
          ).catch((rollbackError) => {
            console.error("Stock rollback failed:", rollbackError.message);
          })
        )
      );
    }

    // Release the coupon reservation if order creation failed.
    if (!savedOrder && reservedCouponId) {
      await Coupon.updateOne(
        { _id: reservedCouponId, usedCount: { $gt: 0 } },
        { $inc: { usedCount: -1 } }
      ).catch((rollbackError) => {
        console.error("Coupon usage rollback failed:", rollbackError.message);
      });
    }

    console.error("Create order error:", error.message);

    const statusCode = error.statusCode || 500;
    const isExpectedError = statusCode >= 400 && statusCode < 500;

    return res.status(statusCode).json({
      success: false,
      message: isExpectedError
        ? error.message
        : "Unable to place order. Please try again.",
    });
  }
};

/* =====================================================
   GET MY ORDERS — CUSTOMER
===================================================== */
export const getMyOrders = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Please log in to view your orders.",
      });
    }

    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Get my orders error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load your orders.",
    });
  }
};

/* =====================================================
   GET MY ORDER BY ID — CUSTOMER
===================================================== */
export const getMyOrderById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Get order by ID error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load order details.",
    });
  }
};

/* =====================================================
   GET ALL ORDERS — ADMIN
===================================================== */
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get all orders error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load orders.",
    });
  }
};

/* =====================================================
   UPDATE ORDER STATUS — ADMIN
===================================================== */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    if (!ALLOWED_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
        allowedStatuses: ALLOWED_ORDER_STATUSES,
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    order.orderStatus = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update order status.",
    });
  }
};
