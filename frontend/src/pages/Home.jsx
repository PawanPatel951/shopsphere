import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

import {
  ArrowRight,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Headphones,
  Sparkles,
  Package,
  RefreshCw,
  CheckCircle2,
  Clock3,
  Award,
  Star,
  Gift,
  RotateCcw,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Shirt,
  Smartphone,
  House,
  Watch,
  Laptop,
  Baby,
  Dumbbell,
  Armchair,
  Footprints,
  Gem,
  BookOpen,
  CookingPot,
  Heart,
  Monitor,
  Flower2,
  Tags,
  
} from "lucide-react";

import WishlistButton from "../components/WishlistButton";
import { useCart } from "../context/CartContext";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

/* =========================
   HERO SLIDES
========================= */

const heroSlides = [
  {
    tag: "LIMITED TIME OFFER",
    title: "Shop More,",
    highlight: "Save More",
    description:
      "Explore top quality products at unbeatable prices.",
    button: "Explore Collection",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=85",
    background:
      "from-[#f9e7f6] via-[#f2e7ff] to-[#e4e5ff]",
    discount: "UP TO 50% OFF",
  },
  {
    tag: "NEW SEASON • NEW STYLE",
    title: "Find Your",
    highlight: "Everyday Style",
    description:
      "Fresh fashion, accessories and little things you'll love.",
    button: "Shop New Arrivals",
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=85",
    background:
      "from-[#fce8e8] via-[#f9e9f5] to-[#eee5ff]",
    discount: "NEW ARRIVALS",
  },
  {
    tag: "YOUR FAVORITES, ALL IN ONE PLACE",
    title: "Discover More,",
    highlight: "Live Better",
    description:
      "Shop your favorites and make every day feel special.",
    button: "Start Shopping",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85",
    background:
      "from-[#e7f2ff] via-[#f0eaff] to-[#fce7f3]",
    discount: "SPECIAL PICKS",
  },
];

/* =========================
   MOVING OFFER TEXT
========================= */

const tickerItems = [
  "FREE SHIPPING ON SELECT ORDERS",
  "FRESH FINDS, GREAT PRICES",
  "DISCOVER NEW ARRIVALS",
  "SHOP YOUR FAVORITES",
  "EASY AND SECURE CHECKOUT",
];

/* =========================
   SERVICE BENEFITS
========================= */

const benefits = [
  {
    icon: Truck,
    title: "Free Shipping",
    text: "On selected orders",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    text: "Simple return experience",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    text: "Safe checkout",
  },
  {
    icon: Award,
    title: "Premium Quality",
    text: "Carefully selected products",
  },
];

/* =========================
   CATEGORY ICONS
========================= */

const categoryIconList = [
  {
    keywords: ["fashion", "clothing", "cloth", "apparel", "men", "women"],
    icon: Shirt,
    color: "bg-pink-50 text-pink-600",
  },
  {
    keywords: ["mobile", "phone", "smartphone", "electronics"],
    icon: Smartphone,
    color: "bg-blue-50 text-blue-600",
  },
  {
    keywords: ["home", "decor", "decoration", "living"],
    icon: House,
    color: "bg-amber-50 text-amber-600",
  },
  {
    keywords: ["beauty", "makeup", "cosmetic", "skin"],
    icon: Sparkles,
    color: "bg-purple-50 text-purple-600",
  },
  {
    keywords: ["watch", "watches", "clock"],
    icon: Watch,
    color: "bg-orange-50 text-orange-600",
  },
  {
    keywords: ["laptop", "computer", "pc"],
    icon: Laptop,
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    keywords: ["baby", "kids", "children", "toys"],
    icon: Baby,
    color: "bg-yellow-50 text-yellow-600",
  },
  {
    keywords: ["fitness", "gym", "sports", "sport"],
    icon: Dumbbell,
    color: "bg-green-50 text-green-600",
  },
  {
    keywords: ["furniture", "chair", "sofa"],
    icon: Armchair,
    color: "bg-rose-50 text-rose-600",
  },
  {
    keywords: ["shoes", "footwear", "sneaker"],
    icon: Footprints,
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    keywords: ["jewellery", "jewelry", "gold", "ring"],
    icon: Gem,
    color: "bg-fuchsia-50 text-fuchsia-600",
  },
  {
    keywords: ["book", "books", "education", "stationery"],
    icon: BookOpen,
    color: "bg-teal-50 text-teal-600",
  },
  {
    keywords: ["kitchen", "cookware", "cooking"],
    icon: CookingPot,
    color: "bg-red-50 text-red-600",
  },
  {
    keywords: ["flower", "garden", "plant"],
    icon: Flower2,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    keywords: ["monitor", "screen", "display"],
    icon: Monitor,
    color: "bg-sky-50 text-sky-600",
  },
];

function getCategoryIcon(categoryName = "") {
  const name = categoryName.toLowerCase();

  return (
    categoryIconList.find(({ keywords }) =>
      keywords.some((keyword) => name.includes(keyword))
    ) || {
      icon: ShoppingBag,
      color: "bg-violet-50 text-violet-600",
    }
  );
}

/* =========================
   HELPER FUNCTIONS
========================= */

function getImageUrl(image) {
  if (!image || typeof image !== "string") return "";

  const value = image.trim();

  if (/^(https?:|data:|blob:)/i.test(value)) {
    return value;
  }

  return `${API_ORIGIN}/${value.replace(/^\/+/, "")}`;
}

function getProductImage(product) {
  return (
    product?.image ||
    product?.imageUrl ||
    product?.thumbnail ||
    product?.images?.[0] ||
    ""
  );
}

function getProductId(product) {
  return product?._id || product?.id || product?.productId;
}

function getStock(product) {
  const value = product?.stock ?? product?.quantity;

  if (value === undefined || value === null || value === "") {
    return null;
  }

  const stock = Number(value);

  return Number.isFinite(stock) ? stock : null;
}

function formatPrice(price) {
  const value = Number(price);

  return Number.isFinite(value)
    ? `₹${value.toLocaleString("en-IN")}`
    : "Price unavailable";
}

function getCategoryName(product) {
  return typeof product?.category === "string"
    ? product.category
    : product?.category?.name || "ShopNest";
}

/* =========================
   PRODUCT IMAGE
========================= */

function ProductImage({ image, name }) {
  const [failed, setFailed] = useState(false);
  const imageUrl = getImageUrl(image);

  useEffect(() => {
    setFailed(false);
  }, [image]);

  if (!imageUrl || failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#f5f2f8] text-slate-400">
        <Package size={38} strokeWidth={1.3} />
        <span className="text-xs">Product image</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name || "ShopNest product"}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
    />
  );
}

/* =========================
   SECTION HEADING
========================= */

function SectionHeading({
  eyebrow,
  title,
  description,
  link = "/products",
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-violet-600">
          {eyebrow}
        </p>

        <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h2>

        {description && (
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>

      <Link
        to={link}
        className="inline-flex w-fit items-center gap-2 text-sm font-bold text-violet-700 hover:text-pink-600"
      >
        View All <ArrowRight size={16} />
      </Link>
    </div>
  );
}

/* =========================
   PRODUCT LOADER
========================= */

function LoadingProducts() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
        <div
          key={n}
          className="overflow-hidden rounded-2xl bg-white p-2 shadow-sm"
        >
          <div className="aspect-square animate-pulse rounded-xl bg-slate-200" />

          <div className="space-y-3 p-2">
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="h-4 animate-pulse rounded bg-slate-200" />
            <div className="h-8 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================
   ERROR MESSAGE
========================= */

function ErrorMessage({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-white px-5 py-10 text-center">
      <Package size={36} className="mx-auto text-red-400" />

      <p className="mt-3 font-bold text-slate-800">
        Unable to load content
      </p>

      <p className="mt-2 text-sm text-slate-500">{message}</p>

      <button
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-violet-700"
      >
        <RefreshCw size={16} />
        Try again
      </button>
    </div>
  );
}

/* =========================
   HOME PAGE
========================= */

export default function Home() {
  const { addToCart } = useCart();

  const [activeSlide, setActiveSlide] = useState(0);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [categoryError, setCategoryError] = useState("");
  const [productError, setProductError] = useState("");

  const [retryCount, setRetryCount] = useState(0);
  const [addedProductId, setAddedProductId] = useState(null);

  const currentSlide = heroSlides[activeSlide];

  /* HERO AUTO SLIDER */

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  /* AOS ANIMATION */

  useEffect(() => {
    AOS.init({
      duration: 650,
      easing: "ease-out-cubic",
      once: true,
      offset: 50,
    });

    return () => AOS.refreshHard();
  }, []);

  /* FETCH CATEGORIES AND PRODUCTS */

  useEffect(() => {
    const controller = new AbortController();

    async function load(
      endpoint,
      setter,
      setLoading,
      setError,
      field
    ) {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_URL}/${endpoint}`, {
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || `Unable to load ${endpoint}`
          );
        }

        const list = Array.isArray(data)
          ? data
          : data[field] || [];

        setter(list.filter((item) => item.isActive !== false));
      } catch (error) {
        if (error.name !== "AbortError") {
          setError(error.message || `Unable to load ${endpoint}`);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load(
      "categories",
      setCategories,
      setLoadingCategories,
      setCategoryError,
      "categories"
    );

    load(
      "products",
      setProducts,
      setLoadingProducts,
      setProductError,
      "products"
    );

    return () => controller.abort();
  }, [retryCount]);

  useEffect(() => {
    if (!loadingCategories && !loadingProducts) {
      AOS.refresh();
    }
  }, [
    loadingCategories,
    loadingProducts,
    categories.length,
    products.length,
  ]);

  /* ADD TO CART */

  function handleAddToCart(product) {
    const productId = getProductId(product);
    const stock = getStock(product);

    if (!productId) {
      return window.alert(
        "This product cannot be added to the cart."
      );
    }

    if (stock !== null && stock <= 0) {
      return window.alert(
        "This product is currently out of stock."
      );
    }

    try {
      addToCart({
        ...product,
        id: productId,
        price: Number(product.price || 0),
      });

      setAddedProductId(productId);

      window.setTimeout(() => {
        setAddedProductId((current) =>
          current === productId ? null : current
        );
      }, 1800);
    } catch {
      window.alert(
        "Unable to add this product. Please try again."
      );
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#fcfbfd] text-slate-900">
      {/* =========================
          HERO SLIDER
      ========================= */}

      <section className="w-full px-1 pb-2 pt-2 sm:px-3 lg:px-4">
        <div
          className={`relative isolate overflow-hidden rounded-[26px] bg-gradient-to-r ${currentSlide.background} shadow-sm`}
        >
          <div className="grid min-h-[370px] items-center gap-3 md:grid-cols-[0.95fr_1.05fr] lg:min-h-[440px]">
            <div
              key={activeSlide}
              className="relative z-10 px-6 py-8 sm:px-10 lg:px-14"
            >
              <span className="inline-flex rounded-full bg-white/75 px-3 py-2 text-[10px] font-extrabold tracking-wider text-violet-800 shadow-sm sm:text-xs">
                <Sparkles size={14} className="mr-2" />
                {currentSlide.tag}
              </span>

              <h1 className="mt-5 text-4xl font-black leading-[1.04] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                {currentSlide.title}

                <span className="mt-1 block bg-gradient-to-r from-violet-700 to-pink-600 bg-clip-text text-transparent">
                  {currentSlide.highlight}
                </span>
              </h1>

              <p className="mt-4 max-w-md text-sm leading-6 text-slate-700 sm:text-base">
                {currentSlide.description}
              </p>

              <Link
                to="/products"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700 sm:text-sm"
              >
                {currentSlide.button}
                <ArrowRight size={17} />
              </Link>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-xs font-bold text-slate-700">
                <span className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-violet-700" />
                  Secure shopping
                </span>

                <span className="flex items-center gap-2">
                  <Truck size={18} className="text-violet-700" />
                  Easy delivery
                </span>

                <span className="flex items-center gap-2">
                  <RotateCcw size={18} className="text-violet-700" />
                  Easy returns
                </span>
              </div>
            </div>

            <div className="relative flex min-h-[260px] items-center justify-center self-stretch px-5 pb-8 md:min-h-0 md:pb-0">
              <div className="absolute right-[8%] top-[10%] h-52 w-52 rounded-full bg-violet-400/35 blur-2xl sm:h-72 sm:w-72" />

              <div className="relative h-[260px] w-full max-w-[500px] sm:h-[330px] lg:h-[390px]">
                <img
                  key={currentSlide.image}
                  src={currentSlide.image}
                  alt="Featured shopping collection"
                  className="h-full w-full rounded-[42%_42%_18%_18%] object-cover object-center shadow-2xl ring-8 ring-white/30"
                />

                <div className="absolute right-0 top-2 flex h-20 w-20 rotate-6 flex-col items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-pink-500 text-center text-[10px] font-black text-white shadow-xl sm:right-2 sm:h-24 sm:w-24 sm:text-xs">
                  {currentSlide.discount}
                </div>
              </div>
            </div>
          </div>

          <button
            aria-label="Previous slide"
            onClick={() =>
              setActiveSlide(
                (activeSlide - 1 + heroSlides.length) %
                  heroSlides.length
              )
            }
            className="absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow hover:bg-white"
          >
            <ChevronLeft size={21} />
          </button>

          <button
            aria-label="Next slide"
            onClick={() =>
              setActiveSlide(
                (activeSlide + 1) % heroSlides.length
              )
            }
            className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow hover:bg-white"
          >
            <ChevronRight size={21} />
          </button>

          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.tag}
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => setActiveSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  activeSlide === index
                    ? "w-7 bg-violet-700"
                    : "w-2 bg-violet-300"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          MOVING OFFER TICKER
      ========================= */}

      <section className="w-full px-1 py-2 sm:px-3 lg:px-4">
        <div className="overflow-hidden rounded-lg bg-[#17123f] py-3 text-white">
          <div className="flex w-max animate-[shopnest-marquee_28s_linear_infinite] hover:[animation-play-state:paused]">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                className="flex shrink-0 items-center"
              >
                {tickerItems.map((item, index) => (
                  <span
                    key={`${copy}-${index}`}
                    className="mx-5 inline-flex items-center whitespace-nowrap text-[11px] font-extrabold tracking-wide sm:mx-8 sm:text-xs"
                  >
                    {item}
                    <Sparkles
                      size={13}
                      className="ml-8 text-pink-300"
                    />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          SERVICE STRIP
      ========================= */}

      <section className="w-full px-1 py-2 sm:px-3 lg:px-4">
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:grid-cols-4 sm:p-4">
          {benefits.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="flex items-center gap-3 p-2"
            >
              <span className="rounded-xl bg-violet-50 p-2 text-violet-700">
                <Icon size={20} />
              </span>

              <div>
                <p className="text-xs font-extrabold">{title}</p>
                <p className="mt-1 text-[10px] text-slate-500 sm:text-xs">
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================
          SHOP BY CATEGORY
          LUCIDE ICONS
      ========================= */}

      <section
        id="categories"
        className="w-full px-2 py-8 sm:px-4 lg:px-6"
      >
        <div className="mb-6 text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-violet-600">
            Find your favorites
          </p>

          <h2 className="mt-2 text-2xl font-black sm:text-3xl">
            Shop By Category
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            A little something for every style and every space.
          </p>
        </div>

        {loadingCategories ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((number) => (
              <div
                key={number}
                className="h-36 animate-pulse rounded-2xl bg-slate-200"
              />
            ))}
          </div>
        ) : categoryError ? (
          <ErrorMessage
            message={categoryError}
            onRetry={() => setRetryCount((n) => n + 1)}
          />
        ) : categories.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center">
            <ShoppingBag
              size={36}
              className="mx-auto text-slate-400"
            />

            <p className="mt-3 text-sm text-slate-500">
              No categories yet. Add categories from your admin dashboard.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
            {categories.slice(0, 12).map((category) => {
              const categoryName = category.name || "Category";
              const { icon: CategoryIcon, color } =
                getCategoryIcon(categoryName);

              return (
                <Link
                  key={
                    category._id ||
                    category.id ||
                    category.name
                  }
                  to="/products"
                  className="group flex min-h-[155px] min-w-0 flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white px-3 py-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg"
                >
                  <div
                    className={`mb-3 flex h-[72px] w-[72px] items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:bg-violet-600 group-hover:text-white ${color}`}
                  >
                    <CategoryIcon
                      size={34}
                      strokeWidth={1.7}
                    />
                  </div>

                  <h3 className="line-clamp-2 text-xs font-extrabold text-slate-800 transition group-hover:text-violet-700 sm:text-sm">
                    {categoryName}
                  </h3>

                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 transition group-hover:text-violet-700">
                    Shop now
                    <ArrowRight size={12} />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* =========================
          BEST SELLERS
      ========================= */}

      <section
        id="products"
        className="w-full bg-white py-8 sm:py-10"
      >
        <div className="w-full px-2 sm:px-4 lg:px-6">
          <SectionHeading
            eyebrow="Customer favorites"
            title="Best Sellers"
            description="Discover popular picks from our latest collection."
          />

          {loadingProducts ? (
            <LoadingProducts />
          ) : productError ? (
            <ErrorMessage
              message={productError}
              onRetry={() => setRetryCount((n) => n + 1)}
            />
          ) : products.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-10 text-center">
              <ShoppingBag
                size={38}
                className="mx-auto text-slate-400"
              />

              <h3 className="mt-3 font-extrabold">
                Products coming soon
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Add products in your admin dashboard to display them here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {products.slice(0, 8).map((product, index) => {
                const id = getProductId(product);
                const stock = getStock(product);
                const outOfStock =
                  stock !== null && stock <= 0;
                const justAdded = addedProductId === id;

                return (
                  <article
                    key={id || product.name || index}
                    className="group min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                    data-aos="fade-up"
                  >
                    <div className="relative aspect-square overflow-hidden bg-[#f6f3f7]">
                      <ProductImage
                        image={getProductImage(product)}
                        name={product.name}
                      />

                      <div className="absolute right-2 top-2 z-10">
                        <WishlistButton product={product} />
                      </div>

                      {index < 2 && (
                        <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-extrabold text-violet-700 shadow-sm">
                          {index === 0
                            ? "BESTSELLER"
                            : "TRENDING"}
                        </span>
                      )}

                      {outOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                          <span className="rounded-full bg-slate-900 px-3 py-2 text-xs font-bold text-white">
                            Out of stock
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 sm:p-4">
                      <p className="truncate text-[10px] font-bold uppercase tracking-wider text-violet-600">
                        {getCategoryName(product)}
                      </p>

                      <h3 className="mt-2 line-clamp-2 min-h-10 text-xs font-bold leading-5 text-slate-800 group-hover:text-violet-700 sm:text-sm">
                        {product.name || "Product"}
                      </h3>

                      {product.description && (
                        <p className="mt-1 line-clamp-2 text-[10px] text-slate-500 sm:text-xs">
                          {product.description}
                        </p>
                      )}

                      <div className="mt-3 flex min-h-7 items-center justify-between gap-1">
                        <span className="text-sm font-black text-slate-900 sm:text-lg">
                          {formatPrice(product.price)}
                        </span>

                        {stock !== null && (
                          <span
                            className={`text-[9px] font-bold ${
                              outOfStock
                                ? "text-red-500"
                                : "text-emerald-600"
                            }`}
                          >
                            {outOfStock
                              ? "Unavailable"
                              : "In stock"}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-0.5 text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={12}
                            fill="currentColor"
                          />
                        ))}

                        <span className="ml-1 text-[10px] text-slate-500">
                          Popular pick
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={outOfStock || justAdded}
                        onClick={() => handleAddToCart(product)}
                        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-[11px] font-extrabold transition sm:py-3 sm:text-xs ${
                          outOfStock
                            ? "cursor-not-allowed bg-slate-100 text-slate-400"
                            : justAdded
                            ? "bg-emerald-600 text-white"
                            : "bg-[#17123f] text-white hover:bg-violet-600"
                        }`}
                      >
                        {justAdded ? (
                          <>
                            <CheckCircle2 size={15} />
                            Added to Cart
                          </>
                        ) : outOfStock ? (
                          "Out of Stock"
                        ) : (
                          <>
                            <ShoppingBag size={15} />
                            Add to Cart
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loadingProducts &&
            !productError &&
            products.length > 8 && (
              <div className="mt-8 text-center">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-extrabold text-white hover:bg-violet-700"
                >
                  Explore All Products
                  <ArrowRight size={17} />
                </Link>
              </div>
            )}
        </div>
      </section>

      {/* =========================
          PROMO BANNERS
      ========================= */}

      <section className="w-full px-2 py-6 sm:px-4 lg:px-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            to="/products"
            className="group relative isolate overflow-hidden rounded-2xl bg-gradient-to-r from-[#eee7ff] to-[#f8eafa] p-5 sm:p-7"
          >
            <div className="absolute -right-2 bottom-0 -z-10 opacity-25 transition group-hover:scale-110">
              <Gift size={150} strokeWidth={1.1} />
            </div>

            <p className="text-xs font-extrabold text-violet-700">
              EXCLUSIVE OFFER FOR YOU!
            </p>

            <h2 className="mt-2 max-w-xs text-3xl font-black text-violet-900 sm:text-4xl">
              Get 15% OFF
            </h2>

            <p className="mt-2 text-sm font-semibold text-slate-700">
              On your first order
            </p>

            <div className="mt-5 inline-flex rounded-lg bg-white px-4 py-2 text-xs font-extrabold text-slate-800 shadow-sm">
              USE CODE:
              <span className="ml-2 text-violet-700">
                FIRST15
              </span>
            </div>
          </Link>

          <Link
            to="/products"
            className="group relative isolate overflow-hidden rounded-2xl bg-gradient-to-r from-[#ffe8e9] to-[#fff1e8] p-5 sm:p-7"
          >
            <div className="absolute -right-1 bottom-0 -z-10 opacity-25 transition group-hover:scale-110">
              <Clock3 size={150} strokeWidth={1.1} />
            </div>

            <p className="text-xs font-extrabold text-rose-600">
              DEAL OF THE DAY
            </p>

            <h2 className="mt-2 max-w-xs text-3xl font-black text-slate-900 sm:text-4xl">
              Great Finds. Better Prices.
            </h2>

            <p className="mt-2 text-sm text-slate-700">
              Hurry up and explore today's picks.
            </p>

            <span className="mt-5 inline-flex items-center gap-2 rounded-lg bg-rose-500 px-5 py-3 text-xs font-extrabold text-white group-hover:bg-rose-600">
              SHOP NOW
              <ArrowRight size={16} />
            </span>
          </Link>
        </div>
      </section>

      {/* =========================
          REWARDS STRIP
      ========================= */}

      <section className="w-full px-2 pb-6 sm:px-4 lg:px-6">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-[#17123f] px-5 py-6 text-white sm:flex-row sm:items-center sm:px-8">
          <div className="flex items-center gap-4">
            <Gift size={36} className="text-amber-300" />

            <div>
              <h2 className="text-lg font-black sm:text-xl">
                Join ShopNest Rewards
              </h2>

              <p className="mt-1 text-xs text-white/75 sm:text-sm">
                Discover special picks and enjoy a better shopping experience.
              </p>
            </div>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center gap-2 rounded-lg border border-violet-300 px-5 py-3 text-xs font-extrabold hover:bg-white/10"
          >
            EXPLORE NOW
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* =========================
          TRUST BENEFITS
      ========================= */}

      <section className="border-y border-slate-100 bg-white">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-4 px-4 py-6 sm:grid-cols-4 sm:px-6 lg:px-10">
          {[
            {
              icon: Truck,
              title: "Track Your Order",
              text: "Stay updated on delivery",
            },
            {
              icon: Award,
              title: "Best Price Promise",
              text: "Great value every day",
            },
            {
              icon: CreditCard,
              title: "Flexible Payment",
              text: "Convenient payment options",
            },
            {
              icon: Headphones,
              title: "Customer Support",
              text: "We're here to help",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="flex items-center gap-3"
            >
              <Icon
                size={22}
                className="shrink-0 text-violet-700"
              />

              <div>
                <p className="text-xs font-extrabold">{title}</p>

                <p className="mt-1 text-[10px] text-slate-500 sm:text-xs">
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MOVING TEXT ANIMATION */}

      <style>{`
        @keyframes shopnest-marquee {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </main>
  );
}