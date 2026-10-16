
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const API_ORIGIN = API_URL.replace(/\/api$/, "");

const initialForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  stock: "0",
};

function getImageUrl(image) {
  if (!image || typeof image !== "string") return "";

  const value = image.trim();
  if (!value) return "";

  // Full URL: keep unchanged.
  if (/^https?:\/\//i.test(value)) return value;

  // Remove leading slashes, then use the backend origin.
  const relativePath = value.replace(/^\/+/, "");

  return `${API_ORIGIN}/${relativePath}`;
}

function ProductImage({ image, name, preview = false }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [image]);

  const imageUrl = getImageUrl(image);

  if (!imageUrl || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-sm text-gray-400 ${
          preview ? "h-40 w-40 rounded-lg" : "h-48 w-full"
        }`}
      >
        Image not available
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name || "Product"}
      className={
        preview
          ? "h-40 w-40 rounded-lg border border-gray-200 bg-gray-50 object-cover"
          : "h-48 w-full bg-gray-100 object-cover"
      }
      onError={() => setFailed(true)}
    />
  );
}

function AdminProducts() {
  const { token } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load products
  const loadProducts = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/products?limit=100`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Products load nahi hue.");
      }

      setProducts(data.products || []);
    } catch (err) {
      setError(err.message || "Products load karne mein error aaya.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load categories
  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);

    try {
      const response = await fetch(`${API_URL}/categories`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Categories load nahi hui.");
      }

      setCategories(data.categories || []);
    } catch (err) {
      setError(err.message || "Categories load nahi hui.");
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  // Release temporary object URLs
  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Form changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // Select image
  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    setError("");
    setSuccess("");

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Sirf JPG, PNG, WEBP aur GIF image select karein.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image ka size 5 MB se kam hona chahiye.");
      event.target.value = "";
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Reset form
  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setImageFile(null);
    setImagePreview("");

    const input = document.getElementById("imageFile");
    if (input) input.value = "";
  };

  // Add or update product
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Session nahi mila. Dobara login karein.");
      return;
    }

    const name = form.name.trim();
    const description = form.description.trim();
    const category = form.category.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!name || !description || !category) {
      setError("Name, description aur category required hain.");
      return;
    }

    if (
      form.price.trim() === "" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError("Valid price enter karein.");
      return;
    }

    if (
      form.stock.trim() === "" ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setError("Stock non-negative whole number hona chahiye.");
      return;
    }

    if (!categories.some((item) => item.name === category)) {
      setError("Dropdown se valid category select karein.");
      return;
    }

    setSaving(true);

    try {
      const payload = new FormData();

      payload.append("name", name);
      payload.append("description", description);
      payload.append("price", String(price));
      payload.append("category", category);
      payload.append("stock", String(stock));

      if (imageFile) {
        payload.append("image", imageFile);
      }

      const isEditing = Boolean(editingId);
      const url = isEditing
        ? `${API_URL}/products/${editingId}`
        : `${API_URL}/products`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Product save nahi hua.");
      }

      setSuccess(
        isEditing
          ? "Product successfully update ho gaya!"
          : "Product successfully add ho gaya!"
      );

      resetForm();
      await loadProducts();
    } catch (err) {
      setError(err.message || "Product save karte waqt error aaya.");
    } finally {
      setSaving(false);
    }
  };

  // Edit product and show existing image
  const handleEdit = (product) => {
    setError("");
    setSuccess("");

    setEditingId(product._id);

    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      category: product.category || "",
      stock: String(product.stock ?? 0),
    });

    setImageFile(null);
    setImagePreview(product.image ? getImageUrl(product.image) : "");

    const input = document.getElementById("imageFile");
    if (input) input.value = "";

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete product
  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Kya aap "${product.name}" ko permanently delete karna chahte hain?`
    );

    if (!confirmed) return;

    if (!token) {
      setError("Session nahi mila. Dobara login karein.");
      return;
    }

    setError("");
    setSuccess("");
    setDeletingId(product._id);

    try {
      const response = await fetch(
        `${API_URL}/products/${product._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Product delete nahi hua.");
      }

      if (editingId === product._id) {
        resetForm();
      }

      setSuccess("Product successfully delete ho gaya!");
      await loadProducts();
    } catch (err) {
      setError(err.message || "Product delete karte waqt error aaya.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Admin Product Management
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Products add, update, view aur delete karein.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        {/* Product Form */}
        <section className="mb-8 rounded-xl bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Product" : "Add New Product"}
            </h2>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                  Product Name *
                </label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  maxLength={150}
                  placeholder="Cotton T-Shirt"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="category" className="mb-1 block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  disabled={categoriesLoading || categories.length === 0}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 disabled:bg-gray-100"
                >
                  <option value="">
                    {categoriesLoading
                      ? "Loading categories..."
                      : categories.length === 0
                        ? "No categories available"
                        : "Select Category"}
                  </option>

                  {categories.map((item) => (
                    <option key={item._id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="price" className="mb-1 block text-sm font-medium text-gray-700">
                  Price (₹) *
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  required
                  placeholder="499"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="stock" className="mb-1 block text-sm font-medium text-gray-700">
                  Stock Quantity *
                </label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label htmlFor="imageFile" className="mb-1 block text-sm font-medium text-gray-700">
                Product Image
              </label>

              <input
                id="imageFile"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
              />

              <p className="mt-1 text-xs text-gray-500">
                JPG, PNG, WEBP ya GIF. Maximum 5 MB.
                {editingId && " Nayi image select nahi karne par purani image rahegi."}
              </p>

              {imagePreview && (
                <div className="mt-3">
                  {imageFile ? (
                    <img
                      src={imagePreview}
                      alt="Selected product preview"
                      className="h-40 w-40 rounded-lg border border-gray-200 object-cover"
                    />
                  ) : (
                    <ProductImage
                      image={imagePreview}
                      name={form.name}
                      preview
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      // Clearing the preview does not delete an already
                      // saved image from the backend.
                      setImageFile(null);
                      setImagePreview("");

                      const input = document.getElementById("imageFile");
                      if (input) input.value = "";
                    }}
                    className="mt-2 text-sm text-red-600 hover:underline"
                  >
                    Clear preview
                  </button>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                maxLength={3000}
                rows={4}
                placeholder="Product details..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving || categoriesLoading || categories.length === 0}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : editingId ? "Update Product" : "Add Product"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Product Catalogue */}
        <section className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Product Catalogue
              </h2>
              <p className="text-sm text-gray-500">
                {products.length} product(s) loaded
              </p>
            </div>

            <button
              type="button"
              onClick={loadProducts}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <p className="py-8 text-center text-gray-500">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="py-8 text-center text-gray-500">Abhi koi product nahi hai.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <article
                  key={product._id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                >
                  <ProductImage image={product.image} name={product.name} />

                  <div className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                      {product.category}
                    </p>

                    <h3 className="mt-1 font-semibold text-gray-900">
                      {product.name}
                    </h3>

                    <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                      {product.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span className="text-lg font-bold text-gray-900">
                        ₹{Number(product.price).toLocaleString("en-IN")}
                      </span>
                      <span className="text-sm text-gray-500">
                        Stock: {product.stock}
                      </span>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(product)}
                        disabled={Boolean(deletingId)}
                        className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        disabled={Boolean(deletingId)}
                        className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletingId === product._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default AdminProducts;
