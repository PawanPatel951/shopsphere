
import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  ShoppingBag,
  Search,
  Heart,
  ShoppingCart,
  UserRound,
  Menu,
  X,
  ChevronDown,
  Tag,
  Sparkles,
  TrendingUp,
  LogOut,
  Package,
  Phone,
  Home,
  LayoutDashboard,
} from "lucide-react";

import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const navigation = [
  { label: "Home", to: "/", icon: Home },
  { label: "Shop", to: "/products", icon: ShoppingBag },
  {
    label: "New Arrivals",
    to: "/products/new-arrivals",
    icon: Sparkles,
  },
  {
    label: "Best Sellers",
    to: "/products/best-sellers",
    icon: TrendingUp,
  },
  {
    label: "Offers",
    to: "/products/offers",
    icon: Tag,
    highlight: true,
  },
];

function getCount(data) {
  if (typeof data === "number") return data;

  if (Array.isArray(data)) {
    return data.reduce(
      (total, item) =>
        total + Math.max(0, Number(item?.quantity) || 1),
      0
    );
  }

  if (!data || typeof data !== "object") return 0;

  if (Array.isArray(data.items)) return getCount(data.items);
  if (Array.isArray(data.cart)) return getCount(data.cart);
  if (Array.isArray(data.wishlistItems)) {
    return data.wishlistItems.length;
  }
  if (Array.isArray(data.wishlist)) {
    return data.wishlist.length;
  }

  return (
    Number(
      data.cartCount ?? data.wishlistCount ?? data.count ?? 0
    ) || 0
  );
}

function getCategoryName(category) {
  return typeof category === "string"
    ? category
    : category?.name || category?.title || "Category";
}

function getCategoryId(category) {
  return category?._id || category?.id || getCategoryName(category);
}

function getBadgeClass() {
  return "absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white ring-2 ring-white";
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const cartData = useCart();
  const wishlistData = useWishlist();

  const { user, isAuthenticated, logout } = useAuth();

  // Only authenticated administrators see the dashboard link.
  const isAdmin =
    isAuthenticated &&
    String(user?.role || "").toLowerCase() === "admin";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState(
    new URLSearchParams(location.search).get("search") || ""
  );
  const [categories, setCategories] = useState([]);

  const cartCount = getCount(
    cartData?.cartCount ??
      cartData?.cart ??
      cartData?.items ??
      cartData?.cartItems ??
      []
  );

  const wishlistCount = getCount(
    wishlistData?.wishlistCount ??
      wishlistData?.wishlist ??
      wishlistData?.wishlistItems ??
      wishlistData?.items ??
      []
  );

  useEffect(() => {
    setMobileOpen(false);
    setCategoryOpen(false);
    setAccountOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    setSearchText(
      new URLSearchParams(location.search).get("search") || ""
    );
  }, [location.search]);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const response = await fetch(`${API_URL}/categories`);

        if (!response.ok) return;

        const result = await response.json();

        const list = Array.isArray(result)
          ? result
          : result.categories || result.data || [];

        if (active) {
          setCategories(Array.isArray(list) ? list : []);
        }
      } catch (error) {
        console.error("Could not load categories:", error);
      }
    }

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  function handleSearch(event) {
    event.preventDefault();

    const query = searchText.trim();

    if (!query) {
      navigate("/products");
    } else {
      navigate(`/products?search=${encodeURIComponent(query)}`);
    }

    setMobileOpen(false);
    setSearchOpen(false);
  }

  function handleLogout() {
    logout();
    setAccountOpen(false);
    setMobileOpen(false);
    navigate("/login", { replace: true });
  }

  function openLogin() {
    setAccountOpen(false);
    setMobileOpen(false);
    navigate("/login");
  }

  const badgeClass = getBadgeClass();

  function renderNavLinks(mobile = false) {
    return navigation.map((item) => {
      const Icon = item.icon;

      return (
        <NavLink
          key={item.label}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            mobile
              ? `flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-violet-100 text-violet-800"
                    : item.highlight
                      ? "bg-pink-50 text-pink-600"
                      : "bg-slate-50 text-slate-700 hover:bg-violet-50 hover:text-violet-700"
                }`
              : `flex items-center gap-1.5 whitespace-nowrap py-3.5 text-sm font-semibold transition ${
                  isActive
                    ? "text-violet-700"
                    : item.highlight
                      ? "text-pink-600 hover:text-pink-700"
                      : "text-slate-600 hover:text-violet-700"
                }`
          }
        >
          <Icon size={16} />
          {item.label}
        </NavLink>
      );
    });
  }

  function renderCategoryLinks(mobile = false) {
    if (!categories.length) {
      return (
        <p className="px-3 py-3 text-xs text-slate-400">
          No categories available
        </p>
      );
    }

    return categories.map((category) => {
      const name = getCategoryName(category);

      return (
        <Link
          key={getCategoryId(category)}
          to={`/products?category=${encodeURIComponent(name)}`}
          onClick={() => {
            setCategoryOpen(false);
            setMobileOpen(false);
          }}
          className={
            mobile
              ? "block rounded-xl px-3 py-3 text-sm text-slate-600 hover:bg-violet-50 hover:text-violet-700"
              : "block rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
          }
        >
          {name}
        </Link>
      );
    });
  }

  function renderAccountLinks(mobile = false) {
    if (isAuthenticated) {
      return (
        <>
          {/* Admin Dashboard: admin accounts only */}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => {
                setAccountOpen(false);
                setMobileOpen(false);
              }}
              className={
                mobile
                  ? "flex items-center justify-center gap-2 rounded-xl bg-violet-100 px-3 py-3 text-sm font-bold text-violet-800 transition hover:bg-violet-200"
                  : "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-violet-700 transition hover:bg-violet-50"
              }
            >
              <LayoutDashboard size={17} />
              Admin Dashboard
            </Link>
          )}

          <Link
            to="/orders"
            onClick={() => {
              setAccountOpen(false);
              setMobileOpen(false);
            }}
            className={
              mobile
                ? "flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700"
                : "flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700"
            }
          >
            <Package size={17} />
            My Orders
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className={
              mobile
                ? "flex items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-3 text-sm font-semibold text-red-600"
                : "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-red-600 hover:bg-red-50"
            }
          >
            <LogOut size={17} />
            Logout
          </button>
        </>
      );
    }

    return (
      <>
        <button
          type="button"
          onClick={openLogin}
          className={
            mobile
              ? "rounded-xl bg-violet-700 px-3 py-3 text-center text-sm font-bold text-white"
              : "mt-2 block w-full rounded-xl bg-violet-700 px-3 py-2.5 text-center text-sm font-bold text-white hover:bg-violet-800"
          }
        >
          Login
        </button>

        <Link
          to="/register"
          onClick={() => {
            setAccountOpen(false);
            setMobileOpen(false);
          }}
          className={
            mobile
              ? "rounded-xl border border-slate-200 px-3 py-3 text-center text-sm font-bold text-slate-700"
              : "mt-1 block rounded-xl px-3 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-violet-50"
          }
        >
          Create Account
        </Link>
      </>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
      {/* Announcement bar */}
      <div className="bg-gradient-to-r from-violet-700 via-purple-600 to-pink-600 px-3 py-2 text-center text-[11px] font-bold tracking-wide text-white sm:text-xs">
        <span className="mr-2">✦</span>
        SPECIAL OFFERS • FRESH FINDS • GREAT PRICES
        <span className="ml-2">✦</span>
      </div>

      {/* Main navbar */}
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2"
          aria-label="ShopNest Home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 text-white shadow-md shadow-violet-200">
            <ShoppingBag size={22} strokeWidth={2.3} />
          </span>

          <span className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
            Shop<span className="text-violet-700">Nest</span>
          </span>
        </Link>

        {/* Desktop search */}
        <form
          onSubmit={handleSearch}
          className="mx-auto hidden max-w-xl flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-100 md:flex"
        >
          <Search size={19} className="shrink-0 text-slate-400" />

          <input
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search products, categories..."
            className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            aria-label="Search products"
          />

          <button
            type="submit"
            className="rounded-lg bg-violet-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-800"
          >
            Search
          </button>
        </form>

        {/* Desktop actions */}
        <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex lg:gap-4">
          <Link
            to="/wishlist"
            className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
            aria-label={`Wishlist, ${wishlistCount} items`}
          >
            <Heart size={22} />
            {wishlistCount > 0 && (
              <span className={badgeClass}>
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>

          <Link
            to="/cart"
            className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
            aria-label={`Cart, ${cartCount} items`}
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className={badgeClass}>
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          {/* Account dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((value) => !value)}
              aria-expanded={accountOpen}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-slate-700 transition hover:border-violet-300 hover:bg-violet-50"
            >
              <UserRound size={20} />

              <span className="hidden max-w-28 truncate text-sm font-bold lg:inline">
                {user?.name || user?.username || "Account"}
              </span>

              <ChevronDown
                size={15}
                className={`transition ${
                  accountOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {accountOpen && (
              <div className="absolute right-0 top-full mt-3 w-56 overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
                <div className="border-b border-slate-100 px-3 py-3">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {user?.name || user?.username || "Welcome to ShopNest"}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {user?.email || "Manage your account"}
                  </p>

                  {isAdmin && (
                    <span className="mt-2 inline-flex rounded-full bg-violet-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                      Administrator
                    </span>
                  )}
                </div>

                <div className="space-y-1 pt-1">
                  {renderAccountLinks()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile actions */}
        <div className="ml-auto flex shrink-0 items-center gap-1 md:hidden">
          <button
            type="button"
            onClick={() => setSearchOpen((value) => !value)}
            aria-label="Search"
            className="rounded-xl p-2 text-slate-600 hover:bg-violet-50 hover:text-violet-700"
          >
            {searchOpen ? <X size={21} /> : <Search size={21} />}
          </button>

          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="relative rounded-xl p-2 text-slate-600 hover:bg-violet-50 hover:text-violet-700"
          >
            <Heart size={21} />
            {wishlistCount > 0 && (
              <span className={badgeClass}>
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>

          <Link
            to="/cart"
            aria-label="Cart"
            className="relative rounded-xl p-2 text-slate-600 hover:bg-violet-50 hover:text-violet-700"
          >
            <ShoppingCart size={21} />
            {cartCount > 0 && (
              <span className={badgeClass}>
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="rounded-xl p-2 text-slate-700 hover:bg-violet-50"
          >
            {mobileOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </div>

      {/* Expandable mobile search */}
      {searchOpen && (
        <form
          onSubmit={handleSearch}
          className="border-t border-slate-100 bg-white px-4 py-3 md:hidden"
        >
          <div className="mx-auto flex max-w-3xl items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-violet-400">
            <Search size={18} className="shrink-0 text-slate-400" />

            <input
              autoFocus
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search products..."
              className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
            />

            <button
              type="submit"
              className="rounded-lg bg-violet-700 px-3 py-2 text-xs font-bold text-white"
            >
              Search
            </button>
          </div>
        </form>
      )}

      {/* Desktop navigation */}
      <nav className="hidden border-t border-slate-100 md:block">
        <div className="mx-auto flex max-w-[1600px] items-center justify-center gap-5 px-6 lg:gap-9">
          {renderNavLinks()}

          {/* Categories dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setCategoryOpen(true)}
            onMouseLeave={() => setCategoryOpen(false)}
          >
            <button
              type="button"
              onClick={() => setCategoryOpen((value) => !value)}
              aria-expanded={categoryOpen}
              className="flex items-center gap-1.5 py-3.5 text-sm font-semibold text-slate-600 transition hover:text-violet-700"
            >
              Categories
              <ChevronDown
                size={15}
                className={`transition ${
                  categoryOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {categoryOpen && (
              <div className="absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
                <Link
                  to="/products"
                  onClick={() => setCategoryOpen(false)}
                  className="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-violet-700 hover:bg-violet-50"
                >
                  <ShoppingBag size={17} />
                  All Products
                </Link>

                {renderCategoryLinks()}
              </div>
            )}
          </div>

          <Link
            to="/contact"
            className="flex items-center gap-1.5 whitespace-nowrap py-3.5 text-sm font-semibold text-slate-600 transition hover:text-violet-700"
          >
            <Phone size={15} />
            Contact
          </Link>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="border-t border-slate-100 bg-white px-4 py-4 shadow-lg md:hidden">
          <div className="grid grid-cols-2 gap-2">
            {renderNavLinks(true)}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="mb-2 px-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Shop by category
            </p>

            <Link
              to="/products"
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-3 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-50"
            >
              All Products
            </Link>

            {renderCategoryLinks(true)}

            <Link
              to="/#contact"
              onClick={() => setMobileOpen(false)}
              className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-violet-50"
            >
              <Phone size={17} />
              Contact Us
            </Link>

            <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
              {isAuthenticated && (
                <div className="rounded-xl border border-slate-100 px-3 py-3">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {user?.name || user?.username || "Account"}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {user?.email || ""}
                  </p>
                </div>
              )}

              {renderAccountLinks(true)}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
