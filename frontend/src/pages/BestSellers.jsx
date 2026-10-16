import { useEffect, useState } from "react";
import {
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Trophy,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function BestSellers() {
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

  const bestSellers = [...products].sort((a, b) => {
    const soldA = Number(
      a.soldCount ?? a.totalSold ?? a.sales ?? 0
    );

    const soldB = Number(
      b.soldCount ?? b.totalSold ?? b.sales ?? 0
    );

    return soldB - soldA;
  });

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950" />

        <div className="absolute -right-20 -top-20 -z-10 h-80 w-80 rounded-full bg-amber-400/15 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 md:grid-cols-2 md:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-xs font-extrabold tracking-widest text-amber-200">
              <Trophy size={16} />
              CUSTOMER FAVORITES
            </div>

            <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl md:text-6xl">
              Loved by Many.
              <span className="mt-2 block text-amber-300">
                Made for You.
              </span>
            </h1>

            <p className="mt-5 max-w-lg leading-7 text-slate-300">
              Discover standout picks across fashion, electronics,
              beauty and home essentials—all in one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 font-bold text-slate-950 transition hover:bg-amber-300"
              >
                Explore Products
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
              >
                Home
              </Link>
            </div>
          </div>

          <div className="hidden md:flex md:justify-end">
            <div className="relative flex h-64 w-64 items-center justify-center rounded-full border border-amber-300/20 bg-white/5 sm:h-80 sm:w-80">
              <div className="absolute inset-5 rounded-full border border-dashed border-amber-300/30" />
              <div className="flex h-36 w-36 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-300 to-orange-500 shadow-2xl shadow-amber-500/20 sm:h-44 sm:w-44">
                <ShoppingBag
                  size={88}
                  strokeWidth={1.3}
                  className="text-slate-950"
                />
              </div>
              <div className="absolute right-0 top-10 rounded-2xl bg-white p-3 text-slate-900 shadow-xl">
                <Sparkles className="text-amber-500" size={25} />
              </div>
              <div className="absolute bottom-8 left-0 rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold">
                Your next favorite
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-8 md:py-16">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.2em] text-amber-700">
              <TrendingUp size={16} />
              Trending Collection
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              Popular Picks
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
              Find something you will love from our curated collection.
            </p>
          </div>

          <Link
            to="/products"
            className="inline-flex w-fit items-center gap-2 font-bold text-slate-900 transition hover:text-amber-700"
          >
            Shop All
            <ArrowRight size={17} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
            <p className="font-semibold text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white"
            >
              <RefreshCw size={17} />
              Try Again
            </button>
          </div>
        ) : bestSellers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-16 text-center">
            <ShoppingBag
              className="mx-auto text-slate-400"
              size={42}
            />
            <h3 className="mt-4 text-xl font-bold text-slate-900">
              Products Coming Soon
            </h3>
            <p className="mt-2 text-slate-500">
              New products will appear here when available.
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white"
            >
              Back to Home
              <ArrowRight size={17} />
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-5 text-sm text-slate-500">
              {bestSellers.length} products to explore
            </p>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {bestSellers.map((product, index) => (
                <ProductCard
                  key={
                    product._id ||
                    product.id ||
                    product.productId ||
                    index
                  }
                  product={product}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default BestSellers;
