import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Trash2,
  Heart,
  ArrowLeft,
  ShoppingBag,
} from "lucide-react";

import { useWishlist } from "../context/WishlistContext";
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

function WishlistPage() {
  const {
    wishlist,
    removeFromWishlist,
    clearWishlist,
  } = useWishlist();

  const { addToCart } = useCart();

  const handleAddToCart = (product) => {
    const productId =
      product._id ?? product.id ?? product.productId;

    if (productId == null) return;

    addToCart({
      ...product,
      id: productId,
      price: Number(product.price || 0),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            to="/products"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-white/80 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Continue Shopping
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <Heart
                  size={30}
                  className="fill-pink-300 text-pink-300"
                />

                <h1 className="text-3xl font-extrabold sm:text-4xl">
                  My Wishlist
                </h1>
              </div>

              <p className="text-white/80">
                Save your favourite products and shop them
                whenever you want.
              </p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 px-6 py-4 backdrop-blur-sm">
              <p className="text-sm text-white/80">
                Saved Products
              </p>

              <p className="mt-1 text-3xl font-extrabold">
                {wishlist.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Empty wishlist */}
        {wishlist.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white px-5 py-16 text-center shadow-sm sm:py-20">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-pink-50">
              <Heart
                size={44}
                className="text-pink-400"
              />
            </div>

            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Your wishlist is empty
            </h2>

            <p className="mx-auto mt-3 max-w-md text-gray-500">
              You haven't saved any products yet. Explore
              our collection and tap the heart icon to save
              your favourites.
            </p>

            <Link
              to="/products"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700"
            >
              <ShoppingBag size={19} />
              Explore Products
            </Link>
          </div>
        ) : (
          <>
            {/* Wishlist toolbar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Your Favourite Items
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {wishlist.length}{" "}
                  {wishlist.length === 1
                    ? "product"
                    : "products"}{" "}
                  saved
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to clear your entire wishlist?"
                    )
                  ) {
                    clearWishlist();
                  }
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <Trash2 size={16} />
                Clear Wishlist
              </button>
            </div>

            {/* Product grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {wishlist.map((product) => {
                const productId =
                  product._id ??
                  product.id ??
                  product.productId;

                const outOfStock =
                  Number(product.stock ?? 0) <= 0;

                return (
                  <article
                    key={String(productId)}
                    className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* Image */}
                    <div className="relative flex h-56 items-center justify-center overflow-hidden bg-gray-100">
                      {product.image ? (
                        <img
                          src={getImageUrl(product.image)}
                          alt={product.name || "Product"}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(event) => {
                            event.currentTarget.style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <span className="text-7xl">
                          🛍️
                        </span>
                      )}

                      <span className="absolute left-3 top-3 max-w-[65%] truncate rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">
                        {typeof product.category === "object"
                          ? product.category?.name || "General"
                          : product.category || "General"}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          removeFromWishlist(productId)
                        }
                        aria-label={`Remove ${product.name || "product"} from wishlist`}
                        title="Remove from Wishlist"
                        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-red-500 shadow-md transition hover:scale-110 hover:bg-red-50 active:scale-95"
                      >
                        <Heart
                          size={20}
                          className="fill-red-500"
                        />
                      </button>
                    </div>

                    {/* Details */}
                    <div className="p-5">
                      <h3 className="truncate text-lg font-bold text-gray-900 transition-colors group-hover:text-indigo-700">
                        {product.name || "Unnamed Product"}
                      </h3>

                      <p className="mt-2 min-h-10 text-sm leading-5 text-gray-500">
                        {product.description ||
                          "Discover this product from our collection."}
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-xl font-extrabold text-gray-900">
                          ₹
                          {Number(
                            product.price || 0
                          ).toLocaleString("en-IN")}
                        </span>

                        <span
                          className={`text-xs font-semibold ${
                            outOfStock
                              ? "text-red-500"
                              : "text-green-600"
                          }`}
                        >
                          {outOfStock
                            ? "Out of Stock"
                            : "In Stock"}
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            removeFromWishlist(productId)
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                          Remove
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          disabled={outOfStock}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-400"
                        >
                          <ShoppingCart size={16} />
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default WishlistPage;

