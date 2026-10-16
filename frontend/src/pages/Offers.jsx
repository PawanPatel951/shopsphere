import { useEffect, useState } from "react";
import {
  Tag,
  ArrowRight,
  RefreshCw,
  BadgePercent,
} from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function Offers() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/products`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Products load nahi ho paye.");
        }

        const result = await response.json();
        const list = Array.isArray(result)
          ? result
          : result.products || result.data || [];

        setProducts(list);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchProducts();
    return () => controller.abort();
  }, []);

  const offerProducts = [...products]
    .map((product) => {
      const originalPrice = Number(
        product.originalPrice ?? product.price ?? 0
      );

      const salePrice = Number(
        product.discountPrice ??
          product.salePrice ??
          product.offerPrice ??
          product.price ??
          0
      );

      const explicitDiscount = Number(
        product.discountPercentage ?? product.discount ?? 0
      );

      const hasDiscount =
        originalPrice > 0 &&
        salePrice > 0 &&
        salePrice < originalPrice;

      const hasOfferFlag =
        product.isOnSale === true ||
        product.isOffer === true ||
        product.onSale === true;

      const discountPercentage = hasDiscount
        ? Math.round(
            ((originalPrice - salePrice) / originalPrice) * 100
          )
        : explicitDiscount;

      return {
        ...product,
        _offerEligible: hasDiscount || hasOfferFlag,
        _offerDiscount: discountPercentage,
      };
    })
    .filter((product) => product._offerEligible)
    .sort((a, b) => b._offerDiscount - a._offerDiscount);

  return (
    <div className="min-h-screen bg-rose-50/50">
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-700 via-pink-600 to-orange-500 px-5 py-16 text-white md:px-10 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-bold">
              <BadgePercent size={18} />
              LIMITED-TIME DEALS
            </span>

            <h1 className="mt-6 text-4xl font-black leading-tight md:text-6xl">
              Special Offers
              <span className="block text-rose-100">
                Just for You
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-white/90 md:text-lg">
              Find deals on selected products and enjoy more
              value on your favorite picks.
            </p>

            <Link
              to="/products"
              className="mt-7 inline-flex items-center gap-3 rounded-xl bg-white px-6 py-3.5 font-extrabold text-rose-700 transition hover:bg-rose-50"
            >
              Explore All Products
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-yellow-300/20 blur-3xl" />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="mb-8">
          <p className="text-sm font-extrabold uppercase tracking-widest text-rose-600">
            Deals & Discounts
          </p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">
            Products on Offer
          </h2>
          <p className="mt-2 text-slate-500">
            Only products with offer or discount details are listed.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-2xl bg-rose-100"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="font-semibold text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-3 font-bold text-white"
            >
              <RefreshCw size={17} /> Retry
            </button>
          </div>
        ) : offerProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-rose-200 bg-white px-5 py-16 text-center">
            <Tag className="mx-auto text-rose-500" size={38} />
            <h3 className="mt-4 text-xl font-bold text-slate-900">
              No Active Offers
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-slate-500">
              Offers will appear here when products have a lower
              sale price than their original price or an active
              offer flag.
            </p>
            <Link
              to="/products"
              className="mt-5 inline-flex rounded-xl bg-rose-600 px-5 py-3 font-bold text-white"
            >
              Shop All Products
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-5 text-sm text-slate-500">
              {offerProducts.length} products on offer
            </p>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {offerProducts.map((product) => (
                <ProductCard
                  key={product._id || product.id || product.productId}
                  product={product}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default Offers;
