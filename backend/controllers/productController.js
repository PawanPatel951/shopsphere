
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import Product from "../models/Product.js";

const uploadDir = path.join(process.cwd(), "uploads");

// Remove an uploaded file if product creation fails.
const removeUploadedFile = (filename) => {
  if (!filename) return;

  const safeName = path.basename(filename);
  const filePath = path.join(uploadDir, safeName);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Image cleanup error:", error.message);
  }
};

// Supports uploaded files and existing HTTP/HTTPS image URLs.
const getImageValue = (req) => {
  if (req.file) {
    return `/uploads/${req.file.filename}`;
  }

  if (typeof req.body.image === "string") {
    return req.body.image.trim();
  }

  return "";
};

const isValidImageValue = (value) => {
  if (typeof value !== "string") return false;
  if (!value.trim()) return true;

  // Locally uploaded images
  if (value.startsWith("/uploads/")) {
    const filename = value.slice("/uploads/".length);

    return (
      Boolean(filename) &&
      path.basename(filename) === filename &&
      !filename.includes("..")
    );
  }

  // Existing remote images
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

// Escape special regex characters
const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ==========================================
// GET /api/products
// Public: Get active products
// Supports search, category and pagination
// ==========================================
export const getProducts = async (req, res) => {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 12)
    );

    const filter = { isActive: true };

    if (
      typeof req.query.category === "string" &&
      req.query.category.trim()
    ) {
      filter.category = {
        $regex: escapeRegex(req.query.category.trim()),
        $options: "i",
      };
    }

    if (
      typeof req.query.search === "string" &&
      req.query.search.trim()
    ) {
      const search = escapeRegex(req.query.search.trim());

      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get products error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch products.",
    });
  }
};

// ==========================================
// GET /api/products/:id
// Public: Get one active product
// ==========================================
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findOne({
      _id: id,
      isActive: true,
    }).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get product error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch product.",
    });
  }
};

// ==========================================
// POST /api/products
// Admin only: Create product with image upload
// ==========================================
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock = 0 } = req.body;
    const image = getImageValue(req);

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      typeof category !== "string" ||
      !category.trim() ||
      price === undefined ||
      price === null ||
      price === ""
    ) {
      removeUploadedFile(req.file?.filename);

      return res.status(400).json({
        success: false,
        message: "Name, description, price and category are required.",
      });
    }

    if (!isValidImageValue(image)) {
      removeUploadedFile(req.file?.filename);

      return res.status(400).json({
        success: false,
        message: "Please provide a valid image file or HTTP/HTTPS URL.",
      });
    }

    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      removeUploadedFile(req.file?.filename);

      return res.status(400).json({
        success: false,
        message: "Price must be a valid non-negative number.",
      });
    }

    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      removeUploadedFile(req.file?.filename);

      return res.status(400).json({
        success: false,
        message: "Stock must be a non-negative whole number.",
      });
    }

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price: parsedPrice,
      image,
      category: category.trim(),
      stock: parsedStock,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product,
    });
  } catch (error) {
    removeUploadedFile(req.file?.filename);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create product error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create product.",
    });
  }
};

// ==========================================
// PUT /api/products/:id
// Admin only: Update product and optional image
// ==========================================
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      removeUploadedFile(req.file?.filename);

      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "price",
      "category",
      "stock",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.hasOwn(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    // Use a new uploaded image if provided.
    // Otherwise allow an explicit image field to update/clear a URL.
    if (req.file) {
      updates.image = `/uploads/${req.file.filename}`;
    } else if (Object.hasOwn(req.body, "image")) {
      updates.image = req.body.image;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide product fields to update.",
      });
    }

    for (const field of ["name", "description", "category"]) {
      if (field in updates) {
        if (
          typeof updates[field] !== "string" ||
          !updates[field].trim()
        ) {
          removeUploadedFile(req.file?.filename);

          return res.status(400).json({
            success: false,
            message: `${field} must be a non-empty string.`,
          });
        }

        updates[field] = updates[field].trim();
      }
    }

    if ("price" in updates) {
      const price = Number(updates.price);

      if (
        updates.price === "" ||
        updates.price === null ||
        !Number.isFinite(price) ||
        price < 0
      ) {
        removeUploadedFile(req.file?.filename);

        return res.status(400).json({
          success: false,
          message: "Price must be a valid non-negative number.",
        });
      }

      updates.price = price;
    }

    if ("stock" in updates) {
      const stock = Number(updates.stock);

      if (
        updates.stock === "" ||
        updates.stock === null ||
        !Number.isInteger(stock) ||
        stock < 0
      ) {
        removeUploadedFile(req.file?.filename);

        return res.status(400).json({
          success: false,
          message: "Stock must be a non-negative whole number.",
        });
      }

      updates.stock = stock;
    }

    if ("image" in updates && !isValidImageValue(updates.image)) {
      removeUploadedFile(req.file?.filename);

      return res.status(400).json({
        success: false,
        message: "Please provide a valid image file or HTTP/HTTPS URL.",
      });
    }

    if ("image" in updates && typeof updates.image === "string") {
      updates.image = updates.image.trim();
    }

    const product = await Product.findOneAndUpdate(
      {
        _id: id,
        isActive: true,
      },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      removeUploadedFile(req.file?.filename);

      return res.status(404).json({
        success: false,
        message: "Active product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    removeUploadedFile(req.file?.filename);

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update product error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update product.",
    });
  }
};

// ==========================================
// DELETE /api/products/:id
// Admin only: Permanently delete product
// ==========================================
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Remove only locally uploaded images.
    if (product.image?.startsWith("/uploads/")) {
      removeUploadedFile(path.basename(product.image));
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("Delete product error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete product.",
    });
  }
};
