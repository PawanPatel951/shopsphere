
import { useCallback, useEffect, useState } from "react";
import {
  TicketPercent,
  Plus,
  Pencil,
  Trash2,
  Power,
  RefreshCw,
  X,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const emptyForm = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "10",
  minOrderAmount: "0",
  maxDiscount: "",
  startsAt: new Date().toISOString().slice(0, 16),
  expiresAt: "",
  usageLimit: "",
  isActive: true,
};

const formatPrice = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const dateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );
  return local.toISOString().slice(0, 16);
};

function AdminCoupons() {
  const { token, authLoading, isAuthenticated } = useAuth();

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const request = useCallback(
    async (path, options = {}) => {
      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Request failed.");
      }

      return data;
    },
    [token]
  );

  const loadCoupons = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const data = await request("/coupons");
      setCoupons(Array.isArray(data.coupons) ? data.coupons : []);
    } catch (err) {
      setError(err.message || "Unable to load coupons.");
    } finally {
      setLoading(false);
    }
  }, [request, token]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && token) {
      loadCoupons();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, token, loadCoupons]);

  const resetForm = () => {
    setForm({
      ...emptyForm,
      startsAt: dateInputValue(new Date()),
    });
    setEditingId("");
    setShowForm(false);
  };

  const startEdit = (coupon) => {
    setForm({
      code: coupon.code || "",
      description: coupon.description || "",
      discountType: coupon.discountType || "percentage",
      discountValue: String(coupon.discountValue ?? 10),
      minOrderAmount: String(coupon.minOrderAmount ?? 0),
      maxDiscount:
        coupon.maxDiscount == null ? "" : String(coupon.maxDiscount),
      startsAt: dateInputValue(coupon.startsAt),
      expiresAt: dateInputValue(coupon.expiresAt),
      usageLimit:
        coupon.usageLimit == null ? "" : String(coupon.usageLimit),
      isActive: Boolean(coupon.isActive),
    });

    setEditingId(coupon._id);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "discountType" && value === "fixed"
        ? { maxDiscount: "" }
        : {}),
    }));
  };

  const saveCoupon = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount || 0),
        maxDiscount:
          form.maxDiscount === "" ? null : Number(form.maxDiscount),
        usageLimit:
          form.usageLimit === "" ? null : Number(form.usageLimit),
        startsAt: new Date(form.startsAt).toISOString(),
        expiresAt: new Date(form.expiresAt).toISOString(),
      };

      const data = await request(
        editingId ? `/coupons/${editingId}` : "/coupons",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );

      setSuccess(data.message || "Coupon saved successfully.");
      resetForm();
      await loadCoupons();
    } catch (err) {
      setError(err.message || "Unable to save coupon.");
    } finally {
      setSaving(false);
    }
  };

  const toggleCoupon = async (coupon) => {
    setError("");
    setSuccess("");

    try {
      const data = await request(`/coupons/${coupon._id}/toggle`, {
        method: "PATCH",
      });

      setSuccess(data.message || "Coupon status updated.");
      await loadCoupons();
    } catch (err) {
      setError(err.message || "Unable to update coupon.");
    }
  };

  const removeCoupon = async (coupon) => {
    if (
      !window.confirm(
        `Delete coupon "${coupon.code}"? This cannot be undone.`
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const data = await request(`/coupons/${coupon._id}`, {
        method: "DELETE",
      });

      setSuccess(data.message || "Coupon deleted.");
      await loadCoupons();
    } catch (err) {
      setError(err.message || "Unable to delete coupon.");
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <RefreshCw className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Please log in
        </h1>
        <p className="mt-2 text-gray-500">
          Sign in with your administrator account to manage coupons.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-600">
              <TicketPercent size={18} />
              PROMOTIONS
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Coupons & Discounts
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Create offers, manage expiry dates and control coupon usage.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadCoupons}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              <RefreshCw size={17} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
                setEditingId("");
                setForm({
                  ...emptyForm,
                  startsAt: dateInputValue(new Date()),
                });
                setShowForm(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <Plus size={18} />
              Create Coupon
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
            {success}
          </div>
        )}

        {showForm && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingId ? "Edit Coupon" : "Create New Coupon"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Fields marked with * are required.
                </p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveCoupon} className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
              <label className="block text-sm font-semibold text-gray-700">
                Coupon Code *
                <input
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="[A-Za-z0-9_-]+"
                  placeholder="SAVE10"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 uppercase outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="block text-sm font-semibold text-gray-700">
                Discount Type *
                <select
                  name="discountType"
                  value={form.discountType}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 outline-none focus:border-indigo-500"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed amount (₹)</option>
                </select>
              </label>

              <label className="block text-sm font-semibold text-gray-700">
                Discount Value *
                <input
                  name="discountValue"
                  type="number"
                  value={form.discountValue}
                  onChange={handleChange}
                  required
                  min="0.01"
                  max={form.discountType === "percentage" ? 100 : undefined}
                  step="0.01"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-indigo-500"
                />
              </label>

              <label className="block text-sm font-semibold text-gray-700">
                Minimum Order (₹)
                <input
                  name="minOrderAmount"
                  type="number"
                  value={form.minOrderAmount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-indigo-500"
                />
              </label>

              <label className="block text-sm font-semibold text-gray-700">
                Maximum Discount (₹)
                <input
                  name="maxDiscount"
                  type="number"
                  value={form.maxDiscount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  disabled={form.discountType !== "percentage"}
                  placeholder="No cap"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-indigo-500 disabled:bg-gray-100"
                />
              </label>

              <label className="block text-sm font-semibold text-gray-700">
                Total Usage Limit
                <input
                  name="usageLimit"
                  type="number"
                  value={form.usageLimit}
                  onChange={handleChange}
                  min="1"
                  step="1"
                  placeholder="Unlimited"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-indigo-500"
                />
              </label>

              <label className="block text-sm font-semibold text-gray-700">
                Start Date & Time *
                <input
                  name="startsAt"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-indigo-500"
                />
              </label>

              <label className="block text-sm font-semibold text-gray-700">
                Expiry Date & Time *
                <input
                  name="expiresAt"
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={handleChange}
                  required
                  min={form.startsAt}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-indigo-500"
                />
              </label>

              <label className="block text-sm font-semibold text-gray-700 sm:col-span-2 lg:col-span-3">
                Description
                <input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  maxLength={200}
                  placeholder="Save on your next purchase"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-indigo-500"
                />
              </label>

              <label className="flex items-center gap-3 text-sm font-semibold text-gray-700 sm:col-span-2 lg:col-span-3">
                <input
                  name="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 accent-indigo-600"
                />
                Coupon is active
              </label>

              <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Save Changes"
                    : "Create Coupon"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Coupons</p>
            <p className="mt-2 text-3xl font-extrabold text-gray-900">
              {coupons.length}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Active Coupons</p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-600">
              {coupons.filter((coupon) => coupon.isActive).length}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Inactive Coupons</p>
            <p className="mt-2 text-3xl font-extrabold text-gray-500">
              {coupons.filter((coupon) => !coupon.isActive).length}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
            <h2 className="font-bold text-gray-900">All Coupons</h2>
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 text-gray-500">
              <RefreshCw size={20} className="animate-spin" />
              Loading coupons...
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
              <TicketPercent size={40} className="text-gray-300" />
              <p className="mt-3 font-semibold text-gray-800">
                No coupons created yet
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Create your first coupon to start offering discounts.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Coupon</th>
                    <th className="px-5 py-4">Discount</th>
                    <th className="px-5 py-4">Minimum Order</th>
                    <th className="px-5 py-4">Usage</th>
                    <th className="px-5 py-4">Expiry</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coupons.map((coupon) => {
                    const expired =
                      new Date(coupon.expiresAt).getTime() < Date.now();

                    return (
                      <tr key={coupon._id} className="hover:bg-gray-50/70">
                        <td className="px-5 py-4">
                          <p className="font-extrabold tracking-wide text-indigo-700">
                            {coupon.code}
                          </p>
                          <p className="mt-1 max-w-48 truncate text-xs text-gray-500">
                            {coupon.description || "No description"}
                          </p>
                        </td>
                        <td className="px-5 py-4 font-semibold text-gray-900">
                          {coupon.discountType === "percentage"
                            ? `${coupon.discountValue}%`
                            : formatPrice(coupon.discountValue)}
                          {coupon.discountType === "percentage" &&
                            coupon.maxDiscount != null && (
                              <p className="mt-1 text-xs font-normal text-gray-500">
                                Up to {formatPrice(coupon.maxDiscount)}
                              </p>
                            )}
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {formatPrice(coupon.minOrderAmount)}
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {coupon.usedCount || 0} /{" "}
                          {coupon.usageLimit ?? "∞"}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays size={15} />
                            {new Date(coupon.expiresAt).toLocaleDateString()}
                          </span>
                          {expired && (
                            <p className="mt-1 text-xs font-semibold text-red-600">
                              Expired
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                              coupon.isActive && !expired
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {expired
                              ? "Expired"
                              : coupon.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              title="Edit coupon"
                              onClick={() => startEdit(coupon)}
                              className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"
                            >
                              <Pencil size={17} />
                            </button>
                            <button
                              type="button"
                              title={coupon.isActive ? "Deactivate" : "Activate"}
                              onClick={() => toggleCoupon(coupon)}
                              className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                            >
                              <Power size={17} />
                            </button>
                            <button
                              type="button"
                              title="Delete coupon"
                              onClick={() => removeCoupon(coupon)}
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminCoupons;
