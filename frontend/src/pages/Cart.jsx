
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ShieldCheck,
  Truck,
  PackageCheck,
  Tag,
  X,
} from "lucide-react";

import { useCart } from "../context/CartContext";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

function getImageUrl(image) {
  if (!image) return "";

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return `${API_ORIGIN}/${image.replace(/^\/+/, "")}`;
}

function formatPrice(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function CartProductImage({ image, name }) {
  const [imageError, setImageError] = useState(false);

  const imageUrl = getImageUrl(image);

  return (
    <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 sm:h-32 sm:w-32">
      {imageUrl && !imageError ? (
        <img
          src={imageUrl}
          alt={name || "Product"}
          loading="lazy"
          onError={() => setImageError(true)}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
        />
      ) : (
        <ShoppingBag size={35} className="text-gray-300" />
      )}
    </div>
  );
}

function Cart() {
  const {
    cartItems = [],
    updateQuantity,
    removeFromCart,
    clearCart,
    getSubtotal,
    getDiscountAmount,
    getFinalTotal,
    appliedCoupon,
  } = useCart();

  const [removingId, setRemovingId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const subtotalFromItems = useMemo(() => {
    return cartItems.reduce((total, item) => {
      return (
        total +
        Number(item.price || 0) * Number(item.quantity || 0)
      );
    }, 0);
  }, [cartItems]);

  const subtotal =
    typeof getSubtotal === "function"
      ? Number(getSubtotal())
      : subtotalFromItems;

  const discount =
    typeof getDiscountAmount === "function"
      ? Number(getDiscountAmount())
      : 0;

  const calculatedTotal = Math.max(0, subtotal - discount);

  const finalTotal =
    typeof getFinalTotal === "function"
      ? Number(getFinalTotal())
      : calculatedTotal;

  const totalItems = cartItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  const handleQuantityChange = (item, delta) => {
    const productId = item._id || item.id || item.productId;

    if (!productId) return;

    const currentQuantity = Number(item.quantity || 1);
    const nextQuantity = currentQuantity + delta;

    if (nextQuantity < 1) return;

    // Respect stock limits when stock is available.
    if (
      delta > 0 &&
      item.stock != null &&
      nextQuantity > Number(item.stock)
    ) {
      return;
    }

    updateQuantity(productId, delta);
  };

  const handleRemove = (item) => {
    const productId = item._id || item.id || item.productId;

    if (!productId) return;

    setRemovingId(String(productId));

    removeFromCart(productId);

    setRemovingId(null);
  };

  const handleClearCart = () => {
    clearCart();
    setShowClearConfirm(false);
  };

  const couponLabel =
    typeof appliedCoupon === "string"
      ? appliedCoupon
      : appliedCoupon?.code || appliedCoupon?.name || "";

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <section className="bg-gradient-to-r from-indigo-700 to-purple-700 px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl" data-aos="fade-up">
          <Link
            to="/products"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-indigo-100 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Continue Shopping
          </Link>

          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-200">
            ShopNest
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Your Shopping Cart
          </h1>

          <p className="mt-3 text-indigo-100">
            Review your items and manage your order before checkout.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {cartItems.length === 0 ? (
          /* Empty cart */
          <section
            data-aos="zoom-in"
            className="rounded-3xl border border-gray-100 bg-white px-5 py-16 text-center shadow-sm sm:py-20"
          >
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <ShoppingCart size={42} strokeWidth={1.5} />
            </div>

            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
              Looks like you haven't added anything yet. Explore our
              collection and find something you love.
            </p>

            <Link
              to="/products"
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-indigo-700 active:scale-95"
            >
              <ShoppingBag size={18} />
              Explore Products
              <ArrowRight size={17} />
            </Link>
          </section>
        ) : (
          <>
            {/* Cart title and clear action */}
            <div
              data-aos="fade-up"
              className="mb-6 flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  Cart Items
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-50"
              >
                <Trash2 size={16} />
                Clear Cart
              </button>
            </div>

            {/* Clear cart confirmation */}
            {showClearConfirm && (
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="clear-cart-title"
                className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-red-100 bg-red-50 p-5 sm:flex-row sm:items-center"
              >
                <div>
                  <h3
                    id="clear-cart-title"
                    className="font-bold text-gray-900"
                  >
                    Remove all items?
                  </h3>

                  <p className="mt-1 text-sm text-gray-600">
                    This will empty your entire shopping cart.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleClearCart}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-3">
              {/* Product list */}
              <section className="space-y-4 lg:col-span-2">
                {cartItems.map((item, index) => {
                  const productId =
                    item._id || item.id || item.productId;

                  const quantity = Number(item.quantity || 1);
                  const price = Number(item.price || 0);
                  const lineTotal = price * quantity;

                  const isRemoving =
                    removingId === String(productId);

                  const isAtStockLimit =
                    item.stock != null &&
                    quantity >= Number(item.stock);

                  return (
                    <article
                      key={productId}
                      data-aos="fade-up"
                      data-aos-delay={Math.min(index * 80, 240)}
                      className="group flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:border-indigo-100 hover:shadow-md sm:flex-row sm:items-center sm:p-5"
                    >
                      <CartProductImage
                        image={item.image}
                        name={item.name}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="break-words text-base font-bold text-gray-900 transition-colors group-hover:text-indigo-700 sm:text-lg">
                              {item.name || "Product"}
                            </h3>

                            {item.category && (
                              <p className="mt-1 text-xs font-medium text-gray-500">
                                {item.category}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemove(item)}
                            disabled={isRemoving}
                            aria-label={`Remove ${item.name || "product"}`}
                            title="Remove item"
                            className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <p className="mt-3 text-sm text-gray-500">
                          Unit price:{" "}
                          <span className="font-semibold text-gray-700">
                            {formatPrice(price)}
                          </span>
                        </p>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                          {/* Quantity controls */}
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Quantity
                            </p>

                            <div className="inline-flex items-center rounded-xl border border-gray-200 bg-gray-50 p-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuantityChange(item, -1)
                                }
                                disabled={quantity <= 1}
                                aria-label="Decrease quantity"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-700 transition hover:bg-white hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <Minus size={15} />
                              </button>

                              <span
                                aria-live="polite"
                                className="min-w-10 px-2 text-center text-sm font-bold text-gray-900"
                              >
                                {quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  handleQuantityChange(item, 1)
                                }
                                disabled={isAtStockLimit}
                                aria-label="Increase quantity"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-700 transition hover:bg-white hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <Plus size={15} />
                              </button>
                            </div>

                            {isAtStockLimit && (
                              <p className="mt-1 text-xs text-amber-600">
                                Maximum available stock reached
                              </p>
                            )}
                          </div>

                          {/* Line total */}
                          <div className="text-right">
                            <p className="text-xs font-medium text-gray-500">
                              Item total
                            </p>

                            <p className="mt-1 text-lg font-extrabold text-indigo-700">
                              {formatPrice(lineTotal)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>

              {/* Order summary */}
              <aside
                data-aos="fade-left"
                data-aos-delay="150"
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24"
              >
                <h2 className="text-xl font-bold text-gray-900">
                  Order Summary
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Review your order total
                </p>

                <div className="mt-6 space-y-4 border-b border-gray-100 pb-5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-500">
                      Subtotal ({totalItems} items)
                    </span>

                    <span className="font-semibold text-gray-900">
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 text-emerald-700">
                        <Tag size={15} />
                        Discount
                        {couponLabel && (
                          <span className="text-xs">
                            ({couponLabel})
                          </span>
                        )}
                      </span>

                      <span className="font-semibold text-emerald-700">
                        -{formatPrice(discount)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-500">
                      Delivery
                    </span>

                    <span className="font-semibold text-emerald-700">
                      Free
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 py-5">
                  <span className="font-bold text-gray-900">
                    Total Amount
                  </span>

                  <span className="text-2xl font-extrabold text-indigo-700">
                    {formatPrice(finalTotal)}
                  </span>
                </div>

                <Link
                  to="/checkout"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-indigo-700 active:scale-95"
                >
                  Proceed to Checkout
                  <ArrowRight size={18} />
                </Link>

                <Link
                  to="/products"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <ArrowLeft size={16} />
                  Continue Shopping
                </Link>

                {/* Reassurance */}
                <div className="mt-6 space-y-4 border-t border-gray-100 pt-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <ShieldCheck size={20} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        Secure Shopping
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Your shopping experience matters to us.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Truck size={20} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        Delivery Information
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Delivery details are confirmed at checkout.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                      <PackageCheck size={20} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        Order Overview
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Check quantities before proceeding.
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default Cart;
