
import { useState } from "react";
import { TicketPercent, CheckCircle2, X, LoaderCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const formatPrice = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

function CouponBox({
  subtotal = 0,
  appliedCoupon = null,
  onApply,
  onRemove,
}) {
  const { token } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const applyCoupon = async (event) => {
    event.preventDefault();

    if (!token) {
      setError("Please log in before applying a coupon.");
      return;
    }

    if (!code.trim()) {
      setError("Please enter a coupon code.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/coupons/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          subtotal: Number(subtotal),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to apply coupon.");
      }

      onApply?.(data);
      setCode(data.coupon?.code || code.trim().toUpperCase());
      setMessage("Coupon applied successfully.");
    } catch (err) {
      setError(err.message || "Unable to apply coupon.");
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setError("");
    setMessage("");
    setCode("");
    onRemove?.();
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <TicketPercent size={21} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Apply Coupon</h3>
          <p className="text-xs text-gray-500">
            Enter a coupon code to save on your order.
          </p>
        </div>
      </div>

      {appliedCoupon ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <CheckCircle2
                size={20}
                className="mt-0.5 shrink-0 text-emerald-600"
              />
              <div>
                <p className="font-extrabold tracking-wide text-emerald-800">
                  {appliedCoupon.coupon?.code || appliedCoupon.code}
                </p>
                <p className="mt-1 text-sm text-emerald-700">
                  You saved {formatPrice(appliedCoupon.discount)}.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={removeCoupon}
              className="rounded-lg p-1 text-gray-500 hover:bg-white hover:text-red-600"
              aria-label="Remove coupon"
              title="Remove coupon"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={applyCoupon}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            autoComplete="off"
            maxLength={30}
            className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm uppercase outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <LoaderCircle size={17} className="animate-spin" />}
            {loading ? "Checking..." : "Apply"}
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {message && appliedCoupon && (
        <p className="mt-3 text-sm font-medium text-emerald-700">
          {message}
        </p>
      )}
    </section>
  );
}

export default CouponBox;
