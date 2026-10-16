import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Package,
  ShoppingBag,
  Truck,
  LoaderCircle,
  Sparkles,
  PartyPopper,
  TicketPercent,
  X,
} from "lucide-react";

import confetti from "canvas-confetti";
import AOS from "aos";
import "aos/dist/aos.css";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const initialAddress = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

function formatPrice(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

const inputClass =
  "mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-300 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

function Checkout() {
  const {
    cartItems = [],
    clearCart,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    getDiscountAmount,
    getFinalTotal,
  } = useCart();

  const { token, user } = useAuth();

  const [formData, setFormData] = useState({
    ...initialAddress,
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.mobile || "",
  });

  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [placedOrder, setPlacedOrder] = useState(null);

  const [pinLoading, setPinLoading] = useState(false);
  const [pinMessage, setPinMessage] = useState("");

  // Coupon UI state. Actual applied coupon is stored in CartContext.
  const [couponCode, setCouponCode] = useState(
    appliedCoupon?.code || ""
  );
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponMessage, setCouponMessage] = useState("");

  // Initialize AOS
  useEffect(() => {
    AOS.init({
      duration: 700,
      easing: "ease-out-cubic",
      once: true,
      offset: 40,
      mirror: false,
    });

    AOS.refreshHard();
  }, []);

  // Refresh animations when checkout content changes
  useEffect(() => {
    AOS.refreshHard();
  }, [placedOrder, cartItems.length]);

  // Keep the coupon input synchronized with the shared cart context
  useEffect(() => {
    setCouponCode(appliedCoupon?.code || "");
  }, [appliedCoupon]);

  // PIN code lookup: automatically fill city and state
  useEffect(() => {
    const pincode = formData.pincode.trim();

    if (!/^[0-9]{6}$/.test(pincode)) {
      setPinLoading(false);
      setPinMessage("");
      return undefined;
    }

    const controller = new AbortController();

    const lookupPincode = async () => {
      setPinLoading(true);
      setPinMessage("");

      try {
        const response = await fetch(
          `https://api.postalpincode.in/pincode/${pincode}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("PIN lookup failed");
        }

        const result = await response.json();
        const offices = result?.[0]?.PostOffice;

        if (
          result?.[0]?.Status !== "Success" ||
          !Array.isArray(offices) ||
          offices.length === 0
        ) {
          setPinMessage(
            "PIN code nahi mila. City aur State manually bharein."
          );
          return;
        }

        const office = offices[0];

        setFormData((current) => {
          if (current.pincode !== pincode) {
            return current;
          }

          return {
            ...current,
            city: office.District || office.Name || current.city,
            state: office.State || current.state,
          };
        });

        setPinMessage(
          `Location found: ${
            office.District || office.Name
          }, ${office.State}`
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          setPinMessage(
            "Location fetch nahi hui. City aur State manually bharein."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setPinLoading(false);
        }
      }
    };

    lookupPincode();

    return () => controller.abort();
  }, [formData.pincode]);

  // Calculate subtotal
  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (total, item) =>
          total +
          Number(item.price || 0) * Number(item.quantity || 0),
        0
      ),
    [cartItems]
  );

  // Calculate total quantity
  const totalQuantity = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
      ),
    [cartItems]
  );

  // Coupon discount and total are calculated by CartContext.
  // Fallbacks keep the page safe if a context helper is missing.
  const discountAmount = Math.min(
    subtotal,
    Math.max(
      0,
      Number(
        typeof getDiscountAmount === "function"
          ? getDiscountAmount()
          : appliedCoupon?.discount || 0
      ) || 0
    )
  );

  const displayedTotal = Math.max(
    0,
    Number(
      typeof getFinalTotal === "function"
        ? getFinalTotal()
        : subtotal - discountAmount
    ) || 0
  );

  // Input handler
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  // Apply coupon after backend validation
  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();

    if (!token) {
      setCouponError("Please log in before applying a coupon.");
      setCouponMessage("");
      return;
    }

    if (!code) {
      setCouponError("Please enter a coupon code.");
      setCouponMessage("");
      return;
    }

    if (subtotal <= 0) {
      setCouponError(
        "Your order subtotal must be greater than zero."
      );
      setCouponMessage("");
      return;
    }

    setCouponLoading(true);
    setCouponError("");
    setCouponMessage("");

    try {
      const response = await fetch(
        `${API_URL}/coupons/validate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            code,
            subtotal,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success !== true) {
        throw new Error(
          data.message || "Unable to apply coupon."
        );
      }

      const discount = Number(data.discount);
      const returnedCode = String(
        data.coupon?.code || code
      ).trim().toUpperCase();

      if (
        !Number.isFinite(discount) ||
        discount <= 0 ||
        discount > subtotal
      ) {
        throw new Error(
          "The server returned an invalid discount."
        );
      }

      // This endpoint returns the final discount amount in rupees.
      const result = applyCoupon({
        code: returnedCode,
        discount,
        discountType: "fixed",
        subtotalAtApplication: subtotal,
      });

      if (!result?.success) {
        throw new Error(
          result?.message || "Unable to apply coupon."
        );
      }

      setCouponCode(returnedCode);
      setCouponMessage("Coupon applied successfully!");
      setCouponError("");
    } catch (err) {
      setCouponMessage("");
      setCouponError(
        err.message || "Unable to apply coupon."
      );
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode("");
    setCouponError("");
    setCouponMessage("");
  };

  // Remove a coupon if the cart subtotal changes
  useEffect(() => {
    if (
      appliedCoupon?.subtotalAtApplication != null &&
      Number(appliedCoupon.subtotalAtApplication) !== subtotal
    ) {
      removeCoupon();
      setCouponCode("");
      setCouponMessage("");
      setCouponError(
        "Your cart total changed. Please apply the coupon again."
      );
    }
  }, [subtotal, appliedCoupon, removeCoupon]);

  // Celebrate successful order placement
  useEffect(() => {
    if (!placedOrder) {
      return undefined;
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    const timer = setTimeout(() => {
      AOS.refreshHard();

      if (
        window.matchMedia("(prefers-reduced-motion: reduce)")
          .matches
      ) {
        return;
      }

      confetti({
        particleCount: 100,
        spread: 75,
        startVelocity: 38,
        origin: { x: 0.5, y: 0.55 },
        zIndex: 9999,
      });

      setTimeout(() => {
        confetti({
          particleCount: 40,
          angle: 60,
          spread: 60,
          origin: { x: 0.05, y: 0.65 },
          zIndex: 9999,
        });

        confetti({
          particleCount: 40,
          angle: 120,
          spread: 60,
          origin: { x: 0.95, y: 0.65 },
          zIndex: 9999,
        });
      }, 250);
    }, 350);

    return () => clearTimeout(timer);
  }, [placedOrder]);

  // Submit order
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (placingOrder) {
      return;
    }

    if (!token) {
      setError("Please log in before placing your order.");
      return;
    }

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (
      !formData.fullName.trim() ||
      !formData.address.trim() ||
      !formData.city.trim() ||
      !formData.state.trim()
    ) {
      setError(
        "Please complete all required delivery details."
      );
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.phone.trim())) {
      setError(
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    if (!/^[0-9]{6}$/.test(formData.pincode.trim())) {
      setError("Please enter a valid 6-digit PIN code.");
      return;
    }

    if (
      appliedCoupon?.subtotalAtApplication != null &&
      Number(appliedCoupon.subtotalAtApplication) !== subtotal
    ) {
      removeCoupon();
      setCouponCode("");
      setError(
        "Your cart total changed. Please reapply your coupon."
      );
      return;
    }

    const items = cartItems.map((item) => ({
      productId: item._id || item.id || item.productId,
      quantity: Number(item.quantity || 1),
    }));

    if (
      items.some(
        (item) =>
          !item.productId ||
          !Number.isSafeInteger(item.quantity) ||
          item.quantity < 1
      )
    ) {
      setError(
        "A cart item is invalid. Please update your cart."
      );
      return;
    }

    setPlacingOrder(true);

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items,
          shippingAddress: {
            fullName: formData.fullName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            address: formData.address.trim(),
            city: formData.city.trim(),
            state: formData.state.trim(),
            pincode: formData.pincode.trim(),
          },
          paymentMethod: "COD",
          couponCode: appliedCoupon?.code || "",
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success || !data.order) {
        throw new Error(
          data.message || "Unable to place your order."
        );
      }

      setPlacedOrder(data.order);
      clearCart();
    } catch (err) {
      setError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  // SUCCESS SCREEN
  if (placedOrder) {
    return (
      <main className="flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-indigo-50 px-4 py-12">
        <section
          data-aos="zoom-in"
          data-aos-duration="900"
          className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white bg-white p-7 text-center shadow-2xl shadow-emerald-900/10 sm:p-12"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 animate-pulse rounded-full bg-emerald-100/70 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 animate-pulse rounded-full bg-indigo-100/70 blur-3xl" />

          <div className="relative">
            <div
              data-aos="zoom-in"
              data-aos-delay="150"
              className="mx-auto flex h-24 w-24 animate-[bounce_1s_ease-in-out_1] items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-100"
            >
              <CheckCircle2 size={58} strokeWidth={2.5} />
            </div>

            <div
              data-aos="fade-up"
              data-aos-delay="200"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-700"
            >
              <Sparkles size={15} />
              Order Confirmed
            </div>

            <h1
              data-aos="fade-up"
              data-aos-delay="300"
              className="mt-5 text-3xl font-black leading-tight text-gray-900 sm:text-4xl"
            >
              Thank you for your order!
            </h1>

            <p
              data-aos="fade-up"
              data-aos-delay="400"
              className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500"
            >
              Great news! Your order has been placed successfully.
              Get ready to receive your favourite products.
            </p>

            <div
              data-aos="fade-up"
              data-aos-delay="450"
              className="mt-8 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-indigo-50 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-6"
            >
              <div className="flex items-center justify-center gap-2 text-emerald-700">
                <Package size={20} />
                <span className="text-sm font-bold">
                  Order Details
                </span>
              </div>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Order Number
              </p>

              <p className="mt-2 break-all text-xl font-extrabold text-indigo-800">
                {placedOrder.orderNumber || placedOrder._id}
              </p>

              <div className="my-5 border-t border-dashed border-emerald-200" />

              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-gray-500">
                  Payment Method
                </span>
                <span className="font-bold text-gray-900">
                  Cash on Delivery
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                <span className="text-gray-500">
                  Payment Status
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                  {placedOrder.paymentStatus || "Pending"}
                </span>
              </div>

              {Number(placedOrder.discountAmount || 0) > 0 && (
                <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-500">
                    Coupon Discount
                    {placedOrder.couponCode
                      ? ` (${placedOrder.couponCode})`
                      : ""}
                  </span>
                  <span className="font-semibold text-emerald-700">
                    -{formatPrice(placedOrder.discountAmount)}
                  </span>
                </div>
              )}

              <div className="mt-5 flex items-end justify-between gap-3 border-t border-emerald-100 pt-5">
                <span className="font-semibold text-gray-600">
                  Order Total
                </span>
                <span className="text-3xl font-black text-emerald-700">
                  {formatPrice(placedOrder.totalAmount)}
                </span>
              </div>
            </div>

            <div
              data-aos="fade-up"
              data-aos-delay="500"
              className="mt-5 flex items-start gap-3 rounded-xl bg-gray-50 p-4 text-left"
            >
              <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
                <Truck size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">
                  What's next?
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Your order is now in our system. You can continue
                  shopping while we prepare your order.
                </p>
              </div>
            </div>

            <div
              data-aos="fade-up"
              data-aos-delay="550"
              className="mt-7 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                to="/products"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all duration-300 hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-xl active:scale-95"
              >
                <ShoppingBag size={18} />
                Continue Shopping
              </Link>

              <Link
                to="/"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3.5 text-sm font-bold text-gray-700 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:bg-indigo-50 active:scale-95"
              >
                Back to Home
                <ArrowRight size={17} />
              </Link>
            </div>

            <p
              data-aos="fade-up"
              data-aos-delay="600"
              className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400"
            >
              <PartyPopper size={15} />
              Thank you for choosing ShopNest!
            </p>
          </div>
        </section>
      </main>
    );
  }

  // LOGIN REQUIRED
  if (!token) {
    return (
      <main className="flex min-h-[65vh] items-center justify-center bg-gray-50 px-4 py-12">
        <section
          data-aos="zoom-in"
          className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-lg"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <ShieldCheck size={36} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-900">
            Login required
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            Please log in to your ShopNest account before placing an order.
          </p>

          <Link
            to="/login"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-indigo-700"
          >
            Log In
          </Link>
        </section>
      </main>
    );
  }

  // EMPTY CART
  if (cartItems.length === 0) {
    return (
      <main className="flex min-h-[65vh] items-center justify-center bg-gray-50 px-4 py-12">
        <section
          data-aos="zoom-in"
          className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-lg"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <ShoppingBag size={36} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-900">
            Your cart is empty
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            Add some products to your cart before checkout.
          </p>

          <Link
            to="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-indigo-700"
          >
            <ArrowLeft size={17} />
            Browse Products
          </Link>
        </section>
      </main>
    );
  }

  // CHECKOUT SCREEN
  return (
    <main className="min-h-screen overflow-hidden bg-gray-50 pb-16">
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-r from-indigo-700 via-indigo-700 to-purple-700 px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-purple-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl" data-aos="fade-up">
          <Link
            to="/cart"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-indigo-100 transition-all duration-300 hover:-translate-x-1 hover:text-white"
          >
            <ArrowLeft size={17} />
            Back to Cart
          </Link>

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200">
            ShopNest Secure Checkout
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Complete Your Order
          </h1>

          <p className="mt-3 max-w-2xl text-indigo-100">
            Enter your delivery information to place your order.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div
            role="alert"
            data-aos="fade-down"
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700"
          >
            <span className="text-lg">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-3">
            {/* DELIVERY ADDRESS */}
            <section
              data-aos="fade-right"
              className="space-y-6 lg:col-span-2"
            >
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-7">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-transform duration-300 hover:rotate-6 hover:scale-110">
                    <MapPin size={22} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Delivery Address
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Where should we deliver your order?
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div data-aos="fade-up" data-aos-delay="50">
                    <label
                      htmlFor="fullName"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Full Name *
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      maxLength={100}
                      autoComplete="name"
                      placeholder="Enter your full name"
                      className={inputClass}
                    />
                  </div>

                  <div data-aos="fade-up" data-aos-delay="100">
                    <label
                      htmlFor="phone"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Mobile Number *
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      value={formData.phone}
                      onChange={(event) => {
                        setFormData((current) => ({
                          ...current,
                          phone: event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 10),
                        }));

                        if (error) setError("");
                      }}
                      required
                      pattern="[0-9]{10}"
                      maxLength={10}
                      autoComplete="tel"
                      placeholder="10-digit mobile number"
                      className={inputClass}
                    />
                  </div>

                  <div
                    className="sm:col-span-2"
                    data-aos="fade-up"
                    data-aos-delay="150"
                  >
                    <label
                      htmlFor="email"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      maxLength={150}
                      autoComplete="email"
                      placeholder="you@example.com (optional)"
                      className={inputClass}
                    />
                  </div>

                  <div
                    className="sm:col-span-2"
                    data-aos="fade-up"
                    data-aos-delay="200"
                  >
                    <label
                      htmlFor="address"
                      className="text-sm font-semibold text-gray-700"
                    >
                      House / Street Address *
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      maxLength={500}
                      rows={3}
                      autoComplete="street-address"
                      placeholder="House number, street, landmark..."
                      className={inputClass}
                    />
                  </div>

                  {/* PIN CODE */}
                  <div data-aos="fade-up" data-aos-delay="250">
                    <label
                      htmlFor="pincode"
                      className="text-sm font-semibold text-gray-700"
                    >
                      PIN Code *
                    </label>
                    <input
                      id="pincode"
                      name="pincode"
                      type="text"
                      inputMode="numeric"
                      value={formData.pincode}
                      onChange={(event) => {
                        const value = event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6);

                        setFormData((current) => ({
                          ...current,
                          pincode: value,
                          ...(value.length !== 6
                            ? { city: "", state: "" }
                            : {}),
                        }));

                        setPinMessage("");
                        if (error) setError("");
                      }}
                      required
                      pattern="[0-9]{6}"
                      maxLength={6}
                      autoComplete="postal-code"
                      placeholder="Enter 6-digit PIN code"
                      className={inputClass}
                    />

                    {pinLoading && (
                      <p
                        className="mt-2 flex items-center gap-2 text-xs text-indigo-600"
                        role="status"
                      >
                        <LoaderCircle
                          size={15}
                          className="animate-spin"
                        />
                        Finding City and State...
                      </p>
                    )}

                    {!pinLoading && pinMessage && (
                      <p
                        className={`mt-2 text-xs ${
                          pinMessage.startsWith("Location found")
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                        role="status"
                      >
                        {pinMessage}
                      </p>
                    )}
                  </div>

                  {/* CITY */}
                  <div data-aos="fade-up" data-aos-delay="300">
                    <label
                      htmlFor="city"
                      className="text-sm font-semibold text-gray-700"
                    >
                      City / District *
                    </label>
                    <input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      maxLength={100}
                      autoComplete="address-level2"
                      placeholder="Auto-filled from PIN code"
                      className={inputClass}
                    />
                  </div>

                  {/* STATE */}
                  <div
                    className="sm:col-span-2"
                    data-aos="fade-up"
                    data-aos-delay="350"
                  >
                    <label
                      htmlFor="state"
                      className="text-sm font-semibold text-gray-700"
                    >
                      State *
                    </label>
                    <input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      maxLength={100}
                      autoComplete="address-level1"
                      placeholder="Auto-filled from PIN code"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* PAYMENT METHOD */}
              <div
                data-aos="fade-up"
                data-aos-delay="150"
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md sm:p-7"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Truck size={22} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Payment Method
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Select your payment option.
                    </p>
                  </div>
                </div>

                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border-2 border-indigo-500 bg-indigo-50/60 p-4 transition-all duration-300 hover:bg-indigo-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked
                    readOnly
                    className="mt-1 accent-indigo-600"
                  />

                  <div className="flex-1">
                    <p className="font-bold text-gray-900">
                      Cash on Delivery (COD)
                    </p>
                    <p className="mt-1 text-sm leading-5 text-gray-500">
                      Pay when your order is delivered.
                    </p>
                  </div>

                  <CheckCircle2
                    size={21}
                    className="shrink-0 text-indigo-600"
                  />
                </label>
              </div>
            </section>

            {/* ORDER SUMMARY */}
            <aside
              data-aos="fade-left"
              data-aos-delay="200"
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg sm:p-6 lg:sticky lg:top-24"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <ShoppingBag size={21} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Order Summary
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {totalQuantity}{" "}
                    {totalQuantity === 1 ? "item" : "items"} in your order
                  </p>
                </div>
              </div>

              <div className="mt-5 max-h-72 space-y-4 overflow-y-auto pr-1">
                {cartItems.map((item, index) => (
                  <div
                    key={
                      item._id ||
                      item.id ||
                      item.productId ||
                      index
                    }
                    data-aos="fade-up"
                    data-aos-delay={Math.min(index * 60, 300)}
                    className="flex items-start justify-between gap-3 border-b border-gray-50 pb-4 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-gray-800">
                        {item.name || "Product"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Qty: {item.quantity || 1} ×{" "}
                        {formatPrice(item.price)}
                      </p>
                    </div>

                    <p className="shrink-0 text-sm font-bold text-gray-900">
                      {formatPrice(
                        Number(item.price || 0) *
                          Number(item.quantity || 0)
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {/* COUPON SECTION */}
              <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <TicketPercent
                    size={20}
                    className="text-indigo-600"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Coupon & Discounts
                    </h3>
                    <p className="text-xs text-gray-500">
                      Apply a coupon to save on your order.
                    </p>
                  </div>
                </div>

                {appliedCoupon ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <CheckCircle2
                          size={18}
                          className="shrink-0 text-emerald-600"
                        />

                        <div className="min-w-0">
                          <p className="break-all text-sm font-bold text-emerald-800">
                            {appliedCoupon.code}
                          </p>
                          <p className="text-xs text-emerald-700">
                            You saved {formatPrice(discountAmount)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        aria-label="Remove coupon"
                        title="Remove coupon"
                        className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-red-600"
                      >
                        <X size={17} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(event) => {
                        setCouponCode(
                          event.target.value.toUpperCase()
                        );
                        setCouponError("");
                        setCouponMessage("");
                      }}
                      maxLength={30}
                      autoComplete="off"
                      placeholder="Enter coupon code"
                      aria-label="Coupon code"
                      className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm uppercase outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />

                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={
                        couponLoading || !couponCode.trim()
                      }
                      className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {couponLoading ? (
                        <LoaderCircle
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>
                )}

                {couponError && (
                  <p
                    role="alert"
                    className="mt-2 text-xs font-medium text-red-600"
                  >
                    {couponError}
                  </p>
                )}

                {couponMessage && appliedCoupon && (
                  <p
                    role="status"
                    className="mt-2 text-xs font-medium text-emerald-700"
                  >
                    {couponMessage}
                  </p>
                )}
              </div>

              {/* PRICE SUMMARY */}
              <div className="mt-5 space-y-3 border-t border-gray-100 pt-5">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-emerald-700">
                      Coupon Discount ({appliedCoupon.code})
                    </span>
                    <span className="font-semibold text-emerald-700">
                      -{formatPrice(discountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-gray-500">Delivery</span>
                  <span className="font-semibold text-emerald-600">
                    Free
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-5">
                <span className="font-bold text-gray-900">
                  Total
                </span>
                <span className="text-2xl font-black text-indigo-700">
                  {formatPrice(displayedTotal)}
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-gray-500">
                Final pricing and coupon eligibility must be verified
                by the server when the order is placed.
              </p>

              <button
                type="submit"
                disabled={
                  placingOrder || cartItems.length === 0
                }
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all duration-300 hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {placingOrder ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                    Placing Order...
                  </>
                ) : (
                  <>
                    Place Order
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-500">
                <ShieldCheck
                  size={16}
                  className="text-emerald-600"
                />
                Your order is submitted securely.
              </div>
            </aside>
          </div>
        </form>
      </div>
    </main>
  );
}

export default Checkout;
