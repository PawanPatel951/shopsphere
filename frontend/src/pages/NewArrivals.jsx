import { useEffect, useState } from "react";
import { Sparkles, ArrowRight, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function NewArrivals() {
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

  const newArrivals = [...products]
    .filter((product) => {
      const date =
        product.createdAt ||
        product.created_at ||
        product.dateAdded;

      return date && !Number.isNaN(new Date(date).getTime());
    })
    .sort((a, b) => {
      const dateA = new Date(
        a.createdAt || a.created_at || a.dateAdded
      ).getTime();

      const dateB = new Date(
        b.createdAt || b.created_at || b.dateAdded
      ).getTime();

      return dateB - dateA;
    });

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-violet-900 to-purple-700 px-5 py-16 text-white md:px-10 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold">
              <Sparkles size={17} />
              JUST LANDED
            </span>

            <h1 className="mt-6 text-4xl font-black leading-tight md:text-6xl">
              Meet Our
              <span className="block text-violet-200">
                New Arrivals
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-violet-100 md:text-lg">
              Discover the newest additions to our collection.
              Fresh finds, beautiful designs and something special
              for everyone.
            </p>

           
<Link
  to="/products"
  className="mt-7 inline-flex items-center gap-3 rounded-xl bg-violet-600 px-6 py-3.5 font-extrabold text-white shadow-lg shadow-violet-600/25 transition-all duration-300 hover:bg-violet-700 hover:shadow-xl"
>
  Explore All Products
  <ArrowRight size={18} />
</Link>

          </div>
        </div>

        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/4 h-64 w-64 rounded-full bg-indigo-300/20 blur-3xl" />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-widest text-violet-600">
              Freshly Added
            </p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">
              Latest Products
            </h2>
            <p className="mt-2 text-slate-500">
              Newest products appear first.
            </p>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center gap-2 font-bold text-violet-700 hover:text-violet-900"
          >
            Shop All <ArrowRight size={17} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-2xl bg-slate-200"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="font-semibold text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-700 px-5 py-3 font-bold text-white"
            >
              <RefreshCw size={17} /> Retry
            </button>
          </div>
        ) : newArrivals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-violet-200 bg-white px-5 py-16 text-center">
            <Sparkles className="mx-auto text-violet-500" size={38} />
            <h3 className="mt-4 text-xl font-bold text-slate-900">
              No New Arrivals Yet
            </h3>
            <p className="mt-2 text-slate-500">
              Add products with a valid creation date to display
              them here.
            </p>
            <Link
              to="/products"
              className="mt-5 inline-flex rounded-xl bg-violet-700 px-5 py-3 font-bold text-white"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-5 text-sm text-slate-500">
              {newArrivals.length} new products
            </p>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {newArrivals.map((product) => (
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

export default NewArrivals;
