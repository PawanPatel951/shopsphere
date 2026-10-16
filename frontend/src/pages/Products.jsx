
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  ShoppingBag,
  ArrowUpDown,
  RotateCcw,
  Package,
  ArrowRight,
} from "lucide-react";

import ProductCard from "../components/ProductCard";
import useProducts, {
  getProductCategory,
  getProductName,
  getProductPrice,
} from "../hooks/useProducts";

export default function Products() {
  const { products, loading, error } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get("category") || "";
  const urlSearch = searchParams.get("search") || "";
  const urlSort = searchParams.get("sort") || "newest";

  const [search, setSearch] = useState(urlSearch);
  const [sort, setSort] = useState(urlSort);

  // URL change hone par search aur sort state sync rakho.
  useEffect(() => {
    setSearch(urlSearch);
    setSort(urlSort);
  }, [urlSearch, urlSort]);

  // Category names ko consistently compare karo.
  function normalizeCategory(value) {
    return String(value || "")
      .trim()
      .toLocaleLowerCase()
      .replace(/\s+/g, " ");
  }

  const filteredProducts = useMemo(() => {
    let list = [...products];

    const query = urlSearch.trim().toLowerCase();
    const selectedCategory = normalizeCategory(category);

    // Category filter
    if (selectedCategory) {
      list = list.filter((product) => {
        const productCategory = normalizeCategory(
          getProductCategory(product)
        );

        return productCategory === selectedCategory;
      });
    }

    // Search filter
    if (query) {
      list = list.filter((product) =>
        `${getProductName(product)} ${getProductCategory(product)}`
          .toLowerCase()
          .includes(query)
      );
    }

    // Sorting
    if (urlSort === "price-low") {
      list.sort(
        (a, b) => getProductPrice(a) - getProductPrice(b)
      );
    } else if (urlSort === "price-high") {
      list.sort(
        (a, b) => getProductPrice(b) - getProductPrice(a)
      );
    } else if (urlSort === "name") {
      list.sort((a, b) =>
        getProductName(a).localeCompare(getProductName(b))
      );
    } else {
      list.sort(
        (a, b) =>
          new Date(
            b.createdAt || b.created_at || b.dateAdded || 0
          ).getTime() -
          new Date(
            a.createdAt || a.created_at || a.dateAdded || 0
          ).getTime()
      );
    }

    return list;
  }, [products, category, urlSearch, urlSort]);

  // Current URL parameters ko preserve karke filters update karo.
  function applyFilters() {
    const params = new URLSearchParams(searchParams);

    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }

    if (sort !== "newest") {
      params.set("sort", sort);
    } else {
      params.delete("sort");
    }

    setSearchParams(params);
  }

  function resetFilters() {
    setSearch("");
    setSort("newest");

    // Sirf search aur sort reset honge; category preserve rahegi.
    const params = new URLSearchParams(searchParams);
    params.delete("search");
    params.delete("sort");

    setSearchParams(params);
  }

  function clearCategory() {
    const params = new URLSearchParams(searchParams);
    params.delete("category");
    setSearchParams(params);
  }

  return (
    <main className="min-h-screen bg-[#faf9f7]">
      {/* Breadcrumb */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-10">
          <p className="text-sm text-slate-500">
            <Link to="/" className="hover:text-violet-700">
              Home
            </Link>

            <span className="mx-2">/</span>

            <Link
              to="/products"
              className="hover:text-violet-700"
            >
              Shop
            </Link>

            {category && (
              <>
                <span className="mx-2">/</span>
                <span className="font-semibold text-violet-700">
                  {category}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Hero */}
      <section className="overflow-hidden bg-gradient-to-r from-violet-100 via-purple-50 to-rose-100">
        <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 md:py-16 lg:px-10">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.25em] text-violet-700">
                ShopNest Collection
              </p>

              <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                {category ? (
                  <>
                    Explore
                    <span className="block break-words text-violet-700">
                      {category}
                    </span>
                  </>
                ) : (
                  <>
                    Find your next
                    <span className="block text-violet-700">
                      favorite thing.
                    </span>
                  </>
                )}
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                {category
                  ? `Discover products from our ${category} collection.`
                  : "Discover fashion, electronics, beauty essentials and home products in one convenient place."}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#product-list"
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-6 py-3 font-bold text-white transition hover:bg-violet-800"
                >
                  Explore Products
                  <ArrowRight size={17} />
                </a>

                {category && (
                  <button
                    type="button"
                    onClick={clearCategory}
                    className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-6 py-3 font-bold text-slate-800 transition hover:bg-violet-50"
                  >
                    <ShoppingBag size={17} />
                    All Categories
                  </button>
                )}

                {!category && (
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-6 py-3 font-bold text-slate-800 transition hover:bg-violet-50"
                  >
                    <ShoppingBag size={17} />
                    Home
                  </Link>
                )}
              </div>
            </div>

            <div className="hidden h-44 w-44 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-white/70 text-violet-700 shadow-sm md:flex lg:h-52 lg:w-52">
              <Package size={86} strokeWidth={1.2} />
            </div>
          </div>
        </div>
      </section>

      {/* Product Catalogue */}
      <section
        id="product-list"
        className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 md:py-12 lg:px-10"
      >
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-violet-700">
              Explore Our Store
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              {category || "All Products"}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {loading
                ? "Loading products..."
                : `${filteredProducts.length} products found`}
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ShoppingBag size={18} />
            Your next favorite is waiting.
          </div>
        </div>

        {/* Search and Sorting */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto_auto]">
            <form
              className="relative"
              onSubmit={(event) => {
                event.preventDefault();
                applyFilters();
              }}
            >
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products by name..."
                className="h-12 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              />
            </form>

            <div className="relative">
              <ArrowUpDown
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-violet-500"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>

            <button
              type="button"
              onClick={applyFilters}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-bold text-white transition hover:bg-violet-800"
            >
              <SlidersHorizontal size={16} />
              Apply
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <RotateCcw size={15} />
              Reset
            </button>
          </div>
        </div>

        {/* Products */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse overflow-hidden rounded-2xl bg-white"
              >
                <div className="aspect-square bg-slate-200" />
                <div className="space-y-3 p-4">
                  <div className="h-3 w-1/3 rounded bg-slate-200" />
                  <div className="h-4 rounded bg-slate-200" />
                  <div className="h-9 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="font-bold text-red-700">{error}</p>
            <p className="mt-2 text-sm text-red-600">
              Backend server aur API URL check karo.
            </p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={
                  product._id ||
                  product.id ||
                  product.productId ||
                  index
                }
                product={product}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
            <ShoppingBag
              size={42}
              className="mx-auto text-slate-300"
            />

            <h3 className="mt-4 text-xl font-black text-slate-800">
              No products found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {category
                ? `There are no products in "${category}" right now.`
                : "Try another search or reset your filters."}
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSort("newest");
                setSearchParams({});
              }}
              className="mt-5 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-800"
            >
              View All Products
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
