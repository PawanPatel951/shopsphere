import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Eye,
  Package,
  Check,
  Tag,
} from "lucide-react";

import WishlistButton from "./WishlistButton";
import { useCart } from "../context/CartContext";

import {
  getProductId,
  getProductName,
  getProductPrice,
  getOriginalPrice,
  getProductImage,
  getProductCategory,
  getDiscount,
  getImageUrl,
  formatPrice,
} from "../hooks/useProducts";

export default function ProductCard({
  product,
  index = 0,
  variant = "default",
  rank,
}) {
  const { addToCart } = useCart();

  const [imageFailed, setImageFailed] = useState(false);
  const [added, setAdded] = useState(false);

  const id = getProductId(product);
  const name = getProductName(product);
  const price = getProductPrice(product);
  const originalPrice = getOriginalPrice(product);
  const discount = getDiscount(product);
  const image = getImageUrl(getProductImage(product));
  const category = getProductCategory(product);

  function handleAddToCart() {
    addToCart({
      ...product,
      id,
      price,
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  const isOffer = variant === "offer";
  const isBestSeller = variant === "bestSeller";

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
        isOffer
          ? "border-rose-100 hover:border-rose-200"
          : isBestSeller
            ? "border-amber-100 hover:border-amber-200"
            : "border-slate-100 hover:border-violet-200"
      }`}
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <div
        className={`relative overflow-hidden ${
          isBestSeller
            ? "aspect-[4/4.5] bg-amber-50"
            : isOffer
              ? "aspect-[4/4.5] bg-rose-50"
              : "aspect-[4/4.5] bg-slate-50"
        }`}
      >
        {image && !imageFailed ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
            <Package size={36} strokeWidth={1.3} />
            <span className="text-xs">Image unavailable</span>
          </div>
        )}

        {discount > 0 && (
          <span
            className={`absolute left-3 top-3 rounded-lg px-2.5 py-1 text-xs font-extrabold text-white ${
              isOffer
                ? "bg-rose-600"
                : "bg-violet-700"
            }`}
          >
            {discount}% OFF
          </span>
        )}

        {isBestSeller && rank && (
          <span className="absolute left-3 top-3 rounded-lg bg-amber-400 px-2.5 py-1 text-xs font-extrabold text-amber-950">
            #{rank} BESTSELLER
          </span>
        )}

        <div className="absolute right-3 top-3">
          <WishlistButton product={product} />
        </div>

        <Link
          to={`/product/${id}`}
          aria-label={`View ${name}`}
          className="absolute bottom-3 right-3 flex h-10 w-10 translate-y-2 items-center justify-center rounded-xl bg-white text-slate-700 opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100 hover:bg-violet-700 hover:text-white"
        >
          <Eye size={18} />
        </Link>
      </div>

      <div className="p-4">
        <p
          className={`mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.15em] ${
            isOffer
              ? "text-rose-600"
              : isBestSeller
                ? "text-amber-700"
                : "text-violet-600"
          }`}
        >
          {category}
        </p>

        <Link
          to={`/product/${id}`}
          className="line-clamp-2 min-h-11 text-sm font-bold text-slate-800 transition hover:text-violet-700"
        >
          {name}
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-lg font-black text-slate-900">
            {formatPrice(price)}
          </span>

          {originalPrice > price && (
            <span className="text-xs text-slate-400 line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold text-white transition ${
            added
              ? "bg-emerald-600"
              : isOffer
                ? "bg-rose-600 hover:bg-rose-700"
                : isBestSeller
                  ? "bg-amber-500 text-amber-950 hover:bg-amber-400"
                  : "bg-slate-900 hover:bg-violet-700"
          }`}
        >
          {added ? (
            <>
              <Check size={17} />
              Added to Cart
            </>
          ) : (
            <>
              <ShoppingCart size={17} />
              Add to Cart
            </>
          )}
        </button>
      </div>
    </article>
  );
}