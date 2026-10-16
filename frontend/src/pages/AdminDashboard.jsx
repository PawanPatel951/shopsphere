
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  Package,
  FolderOpen,
  ShoppingBag,
  IndianRupee,
  RefreshCw,
  ArrowUpRight,
  Boxes,
  AlertCircle,
  Clock3,
  CheckCircle2,
  LayoutDashboard,
} from "lucide-react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

// Format currency in Indian Rupees
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

// Format date
const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Safely extract arrays from API responses
const getArray = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.products)) return response.products;
  if (Array.isArray(response?.categories)) return response.categories;
  if (Array.isArray(response?.orders)) return response.orders;
  if (Array.isArray(response?.results)) return response.results;

  return [];
};

// Get order total
const getOrderAmount = (order) =>
  Number(
    order?.totalAmount ??
      order?.totalPrice ??
      order?.grandTotal ??
      order?.amount ??
      order?.total ??
      0
  );

// Get order status
const getOrderStatus = (order) =>
  String(order?.orderStatus ?? order?.status ?? "Pending");

// Status badge styling
const statusStyle = (status) => {
  const value = String(status).toLowerCase();

  if (["delivered", "completed", "success"].includes(value)) {
    return "bg-green-50 text-green-700";
  }

  if (["cancelled", "canceled", "failed"].includes(value)) {
    return "bg-red-50 text-red-700";
  }

  if (
    ["shipped", "dispatch", "out for delivery"].includes(value)
  ) {
    return "bg-blue-50 text-blue-700";
  }

  if (
    ["processing", "confirmed", "paid"].includes(value)
  ) {
    return "bg-indigo-50 text-indigo-700";
  }

  return "bg-amber-50 text-amber-700";
};

// Statistics card
function StatCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <h2 className="mt-3 break-words text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {value}
          </h2>

          <p className="mt-2 text-xs text-gray-500">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color}`}
        >
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  // Authentication from your existing AuthContext
  const { token, authLoading, isAuthenticated } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState([]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(
    async (isRefresh = false) => {
      // Wait until AuthContext verifies the saved session
      if (authLoading) return;

      if (!isAuthenticated || !token) {
        setProducts(null);
        setCategories(null);
        setOrders(null);
        setErrors([
          "Authentication required. Please log in again.",
        ]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrors([]);

      const endpoints = [
        {
          name: "Products",
          path: "/products",
          setter: setProducts,
        },
        {
          name: "Categories",
          path: "/categories",
          setter: setCategories,
        },
        {
          name: "Orders",
          path: "/orders",
          setter: setOrders,
        },
      ];

      const failedRequests = [];

      try {
        await Promise.all(
          endpoints.map(
            async ({ name, path, setter }) => {
              try {
                const response = await fetch(
                  `${API_URL}${path}`,
                  {
                    method: "GET",
                    headers: {
                      Accept: "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );

                const data = await response
                  .json()
                  .catch(() => ({}));

                if (!response.ok) {
                  throw new Error(
                    data.message ||
                      `Request failed (${response.status})`
                  );
                }

                if (data.success === false) {
                  throw new Error(
                    data.message || "Request failed"
                  );
                }

                setter(getArray(data));
              } catch (error) {
                console.error(
                  `Fetch ${name} error:`,
                  error.message
                );

                failedRequests.push(
                  `${name}: ${error.message}`
                );

                setter(null);
              }
            }
          )
        );

        setErrors(failedRequests);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, authLoading, isAuthenticated]
  );

  // Load data after authentication finishes
  useEffect(() => {
    if (!authLoading) {
      fetchDashboardData();
    }
  }, [authLoading, fetchDashboardData]);

  // Dashboard calculations
  const productCount = products?.length ?? 0;
  const categoryCount = categories?.length ?? 0;
  const orderCount = orders?.length ?? 0;

  const totalSales = (orders ?? [])
    .filter((order) => {
      const status = getOrderStatus(order).toLowerCase();

      return ![
        "cancelled",
        "canceled",
        "failed",
      ].includes(status);
    })
    .reduce(
      (sum, order) => sum + getOrderAmount(order),
      0
    );

  const pendingOrders = (orders ?? []).filter((order) =>
    [
      "pending",
      "processing",
      "confirmed",
    ].includes(getOrderStatus(order).toLowerCase())
  ).length;

  const lowStockProducts = (products ?? []).filter(
    (product) => {
      const stock = Number(
        product?.stock ?? product?.quantity
      );

      return (
        Number.isFinite(stock) &&
        stock > 0 &&
        stock <= 5
      );
    }
  ).length;

  const recentOrders = [...(orders ?? [])]
    .sort((a, b) => {
      const dateA = new Date(
        a?.createdAt ?? a?.orderDate ?? a?.date ?? 0
      ).getTime();

      const dateB = new Date(
        b?.createdAt ?? b?.orderDate ?? b?.date ?? 0
      ).getTime();

      return dateB - dateA;
    })
    .slice(0, 5);

  const orderId = (order) =>
    order?._id ?? order?.id ?? order?.orderId ?? "—";

  const orderCustomer = (order) =>
    order?.user?.name ??
    order?.customer?.name ??
    order?.customerName ??
    order?.userName ??
    order?.shippingAddress?.fullName ??
    order?.shippingAddress?.name ??
    "Customer";

  // Dashboard UI
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <LayoutDashboard size={16} />
              <span>ShopNest</span>
              <span>/</span>
              <span className="text-indigo-600">
                Admin Dashboard
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Manage your store and monitor its performance.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={
              loading || refreshing || authLoading
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                refreshing ? "animate-spin" : ""
              }
            />

            {refreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {/* API Warnings */}
        {errors.length > 0 && (
          <div
            role="alert"
            className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
          >
            <AlertCircle
              className="mt-0.5 shrink-0 text-amber-600"
              size={20}
            />

            <div>
              <p className="font-semibold text-amber-900">
                Some dashboard data could not be loaded.
              </p>

              <ul className="mt-2 space-y-1 text-sm text-amber-800">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>

              <p className="mt-2 text-xs text-amber-800">
                Check your login session, API routes and
                backend connection.
              </p>
            </div>
          </div>
        )}

        {/* Store Overview */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Store Overview
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Current data from your store API.
            </p>
          </div>

          {loading || authLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-36 animate-pulse rounded-2xl border border-gray-100 bg-white"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Products"
                value={
                  products === null
                    ? "—"
                    : productCount.toLocaleString("en-IN")
                }
                subtitle="Products in your catalog"
                icon={Package}
                color="bg-indigo-50 text-indigo-600"
              />

              <StatCard
                title="Total Categories"
                value={
                  categories === null
                    ? "—"
                    : categoryCount.toLocaleString("en-IN")
                }
                subtitle="Available product categories"
                icon={FolderOpen}
                color="bg-purple-50 text-purple-600"
              />

              <StatCard
                title="Total Orders"
                value={
                  orders === null
                    ? "—"
                    : orderCount.toLocaleString("en-IN")
                }
                subtitle="Orders returned by the API"
                icon={ShoppingBag}
                color="bg-blue-50 text-blue-600"
              />

              <StatCard
                title="Total Sales"
                value={
                  orders === null
                    ? "—"
                    : formatCurrency(totalSales)
                }
                subtitle="Non-cancelled order totals"
                icon={IndianRupee}
                color="bg-green-50 text-green-600"
              />
            </div>
          )}
        </section>

        {/* Secondary Summary */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Pending / Processing Orders
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {loading || orders === null
                  ? "—"
                  : pendingOrders}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Orders needing attention
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock3 size={23} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Low Stock Products
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {loading || products === null
                  ? "—"
                  : lowStockProducts}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Products with stock from 1 to 5
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Boxes size={23} />
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Jump directly to store management.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              to="/admin/products"
              className="group flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Package size={23} />
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">
                    Manage Products
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Add, edit and remove products.
                  </p>
                </div>
              </div>

              <ArrowUpRight
                size={20}
                className="shrink-0 text-gray-400 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-indigo-600"
              />
            </Link>

            <Link
              to="/admin/categories"
              className="group flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-purple-200 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <FolderOpen size={23} />
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">
                    Manage Categories
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Organize your product categories.
                  </p>
                </div>
              </div>

              <ArrowUpRight
                size={20}
                className="shrink-0 text-gray-400 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-purple-600"
              />
            </Link>
          </div>
        </section>

        {/* Recent Orders */}
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Recent Orders
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Latest orders returned by your backend.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <ShoppingBag size={15} />
              Latest {Math.min(recentOrders.length, 5)} orders
            </div>
          </div>

          {loading || authLoading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-12 animate-pulse rounded-lg bg-gray-100"
                />
              ))}
            </div>
          ) : orders === null ? (
            <div className="p-10 text-center">
              <AlertCircle
                className="mx-auto text-amber-500"
                size={32}
              />

              <p className="mt-3 font-semibold text-gray-800">
                Orders could not be loaded.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Verify your login and GET /api/orders access.
              </p>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="p-10 text-center">
              <ShoppingBag
                className="mx-auto text-gray-300"
                size={36}
              />

              <p className="mt-3 font-semibold text-gray-800">
                No orders found
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Orders will appear here when available in
                your database.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Orders Table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-6 py-4 font-semibold">
                        Order ID
                      </th>
                      <th className="px-6 py-4 font-semibold">
                        Customer
                      </th>
                      <th className="px-6 py-4 font-semibold">
                        Date
                      </th>
                      <th className="px-6 py-4 font-semibold">
                        Amount
                      </th>
                      <th className="px-6 py-4 font-semibold">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {recentOrders.map((order, index) => {
                      const status = getOrderStatus(order);

                      return (
                        <tr
                          key={`${orderId(order)}-${index}`}
                          className="transition hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                            #{String(orderId(order)).slice(-8)}
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-700">
                            {orderCustomer(order)}
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDate(
                              order?.createdAt ??
                                order?.orderDate ??
                                order?.date
                            )}
                          </td>

                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            {formatCurrency(
                              getOrderAmount(order)
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(status)}`}
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Orders Cards */}
              <div className="divide-y divide-gray-100 md:hidden">
                {recentOrders.map((order, index) => {
                  const status = getOrderStatus(order);

                  return (
                    <div
                      key={`${orderId(order)}-${index}`}
                      className="space-y-3 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            Order #
                            {String(orderId(order)).slice(-8)}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {orderCustomer(order)}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(status)}`}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-gray-500">
                          {formatDate(
                            order?.createdAt ??
                              order?.orderDate ??
                              order?.date
                          )}
                        </span>

                        <span className="font-bold text-gray-900">
                          {formatCurrency(
                            getOrderAmount(order)
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 sm:px-6">
            <p className="text-xs text-gray-500">
              <CheckCircle2
                size={14}
                className="mr-1 inline text-green-600"
              />
              Dashboard data is fetched from your configured API.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;