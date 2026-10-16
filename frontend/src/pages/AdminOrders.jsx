
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  RefreshCw,
  Eye,
  Package,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  X,
  ChevronDown,
  ShoppingBag,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-violet-100 text-violet-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

const getStatus = (status) => {
  const value = String(status || "Pending").toLowerCase();

  return (
    ORDER_STATUSES.find(
      (item) => item.toLowerCase() === value
    ) || "Pending"
  );
};

const getOrderId = (order) =>
  order?._id || order?.id || order?.orderId || "";

const getCustomer = (order) => {
  const customer = order?.user || order?.customer || {};

  if (typeof customer === "string") {
    return {
      name: order?.customerName || "Customer",
      email: order?.customerEmail || "",
      phone: order?.phone || "",
    };
  }

  return {
    name:
      customer?.name ||
      customer?.fullName ||
      order?.customerName ||
      order?.shippingAddress?.name ||
      "Customer",

    email:
      customer?.email ||
      order?.customerEmail ||
      order?.shippingAddress?.email ||
      "",

    phone:
      customer?.phone ||
      customer?.mobile ||
      order?.phone ||
      order?.shippingAddress?.phone ||
      "",
  };
};

const getItems = (order) =>
  Array.isArray(order?.items)
    ? order.items
    : Array.isArray(order?.orderItems)
      ? order.orderItems
      : [];

const getProductName = (item) => {
  const product = item?.product;

  if (typeof product === "string") {
    return item?.name || item?.title || "Product";
  }

  return (
    item?.name ||
    item?.title ||
    product?.name ||
    product?.title ||
    "Product"
  );
};

const getQuantity = (item) =>
  Number(item?.quantity ?? item?.qty ?? 1);

const getPrice = (item) =>
  Number(
    item?.price ??
      item?.product?.price ??
      item?.salePrice ??
      item?.unitPrice ??
      0
  );

const getTotal = (order) => {
  const total = Number(
    order?.totalAmount ??
      order?.totalPrice ??
      order?.grandTotal ??
      order?.total ??
      order?.amount ??
      0
  );

  return Number.isFinite(total) ? total : 0;
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getErrorMessage = (data, fallback) =>
  data?.message || data?.error || fallback;

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        `Request failed with status ${response.status}.`
      )
    );
  }

  if (data?.success === false) {
    throw new Error(
      getErrorMessage(data, "The request was unsuccessful.")
    );
  }

  return data;
}

function StatusBadge({ status }) {
  const normalizedStatus = getStatus(status);

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
        STATUS_STYLES[normalizedStatus.toLowerCase()]
      }`}
    >
      {normalizedStatus}
    </span>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-bold text-gray-900">
            {value}
          </h3>
        </div>

        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const { token, isAuthenticated, authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [notice, setNotice] = useState("");

  // Load orders using the logged-in user's Bearer token.
  const fetchOrders = useCallback(
    async (isRefresh = false) => {
      if (authLoading) return;

      if (!token || !isAuthenticated) {
        setOrders([]);
        setError("Please log in to view orders.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setNotice("");

      try {
        const response = await fetch(`${API_URL}/orders`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await readResponse(response);

        const orderList = Array.isArray(data)
          ? data
          : Array.isArray(data?.orders)
            ? data.orders
            : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data?.data?.orders)
                ? data.data.orders
                : null;

        if (!orderList) {
          throw new Error(
            "Orders API returned an unexpected response format."
          );
        }

        setOrders(orderList);

        setSelectedOrder((current) => {
          if (!current) return null;

          const currentId = getOrderId(current);

          return (
            orderList.find(
              (order) => getOrderId(order) === currentId
            ) || null
          );
        });
      } catch (err) {
        console.error("Fetch orders error:", err);

        setError(
          err.message ||
            "Something went wrong while loading orders."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, isAuthenticated, authLoading]
  );

  useEffect(() => {
    if (!authLoading) {
      fetchOrders();
    }
  }, [fetchOrders, authLoading]);

  // Dashboard statistics.
  const stats = useMemo(() => {
    const pending = orders.filter(
      (order) => getStatus(order.status) === "Pending"
    ).length;

    const processing = orders.filter(
      (order) => getStatus(order.status) === "Processing"
    ).length;

    const shipped = orders.filter(
      (order) => getStatus(order.status) === "Shipped"
    ).length;

    const delivered = orders.filter(
      (order) => getStatus(order.status) === "Delivered"
    ).length;

    const sales = orders
      .filter(
        (order) => getStatus(order.status) !== "Cancelled"
      )
      .reduce((sum, order) => sum + getTotal(order), 0);

    return {
      pending,
      processing,
      shipped,
      delivered,
      sales,
    };
  }, [orders]);

  // Search and filter orders.
  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return [...orders]
      .filter((order) => {
        if (
          statusFilter !== "All" &&
          getStatus(order.status) !== statusFilter
        ) {
          return false;
        }

        if (!term) return true;

        const customer = getCustomer(order);
        const orderId = String(getOrderId(order));

        return [
          orderId,
          orderId.slice(-8),
          customer.name,
          customer.email,
          customer.phone,
          order?.shippingAddress?.city,
        ].some((value) =>
          String(value || "").toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        const dateA = new Date(
          a?.createdAt || a?.orderDate || 0
        ).getTime();

        const dateB = new Date(
          b?.createdAt || b?.orderDate || 0
        ).getTime();

        return dateB - dateA;
      });
  }, [orders, search, statusFilter]);

  // Update order status using the same Bearer token.
  const updateOrderStatus = async (order, nextStatus) => {
    const orderId = getOrderId(order);

    if (!token || !isAuthenticated) {
      setError("Please log in before updating an order.");
      return;
    }

    if (!orderId || !nextStatus) {
      setError("Order ID or status is missing.");
      return;
    }

    const previousStatus = getStatus(order.status);

    if (previousStatus === nextStatus) return;

    setUpdatingOrderId(orderId);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API_URL}/orders/${encodeURIComponent(orderId)}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const data = await readResponse(response);

      const updatedOrder =
        data?.order ||
        data?.data?.order ||
        (data?.data &&
        typeof data.data === "object" &&
        !Array.isArray(data.data)
          ? data.data
          : null);

      const finalStatus = getStatus(
        updatedOrder?.status || nextStatus
      );

      setOrders((currentOrders) =>
        currentOrders.map((item) => {
          if (getOrderId(item) !== orderId) return item;

          return {
            ...item,
            ...(updatedOrder || {}),
            status: finalStatus,
          };
        })
      );

      setSelectedOrder((current) => {
        if (!current || getOrderId(current) !== orderId) {
          return current;
        }

        return {
          ...current,
          ...(updatedOrder || {}),
          status: finalStatus,
        };
      });

      setNotice(`Order status updated to ${finalStatus}.`);
    } catch (err) {
      console.error("Update order status error:", err);

      setError(
        err.message || "Failed to update order status."
      );
    } finally {
      setUpdatingOrderId("");
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-600">
          <RefreshCw
            size={24}
            className="animate-spin text-indigo-600"
          />
          <span>Verifying your login...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700">
                <ShoppingBag size={25} />
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Orders Management
              </h1>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              View customer orders and manage order statuses.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchOrders(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                Something went wrong
              </p>
              <p className="mt-1 break-words">{error}</p>
            </div>

            <button
              type="button"
              aria-label="Dismiss error"
              onClick={() => setError("")}
              className="rounded-lg p-1 hover:bg-red-100"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Success message */}
        {notice && (
          <div
            role="status"
            className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700"
          >
            <CheckCircle size={19} />
            <span>{notice}</span>
          </div>
        )}

        {/* Statistics */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Orders"
            value={orders.length}
            icon={Package}
            color="bg-indigo-100 text-indigo-700"
          />

          <StatCard
            title="Pending Orders"
            value={stats.pending}
            icon={Clock}
            color="bg-amber-100 text-amber-700"
          />

          <StatCard
            title="Processing Orders"
            value={stats.processing}
            icon={Truck}
            color="bg-blue-100 text-blue-700"
          />

          <StatCard
            title="Delivered Orders"
            value={stats.delivered}
            icon={CheckCircle}
            color="bg-emerald-100 text-emerald-700"
          />
        </div>

        {/* Sales summary */}
        <div className="mb-7 flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-sm font-medium text-indigo-100">
              Order Sales Total
            </p>

            <h2 className="mt-1 text-3xl font-bold">
              {formatCurrency(stats.sales)}
            </h2>

            <p className="mt-2 text-xs text-indigo-100">
              Excludes cancelled orders; based on loaded orders.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-white/90">
            <Truck size={19} />
            <span>{stats.shipped} orders shipped</span>
          </div>
        </div>

        {/* Search and filters */}
        <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search order ID, customer, email or phone..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="relative lg:w-56">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="All">All statuses</option>

                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <span>
              Showing {filteredOrders.length} of {orders.length} orders
            </span>

            {(search || statusFilter !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                }}
                className="font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Orders table */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-bold text-gray-900">
              All Orders
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Review orders and update their status.
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-gray-500">
              <RefreshCw
                size={30}
                className="animate-spin text-indigo-600"
              />
              <p className="text-sm">Loading orders...</p>
            </div>
          ) : error && orders.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
              <AlertCircle
                size={36}
                className="text-red-400"
              />
              <p className="font-semibold text-gray-800">
                Could not load orders
              </p>
              <button
                type="button"
                onClick={() => fetchOrders()}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Try again
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="rounded-2xl bg-gray-100 p-4 text-gray-400">
                <ShoppingBag size={32} />
              </div>

              <p className="font-semibold text-gray-800">
                No orders found
              </p>

              <p className="max-w-sm text-sm text-gray-500">
                {orders.length === 0
                  ? "Orders will appear here when customers place them."
                  : "Try changing your search or status filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Order
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Customer
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Date
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Items
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Total
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Status
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => {
                    const id = getOrderId(order);
                    const customer = getCustomer(order);
                    const items = getItems(order);
                    const status = getStatus(order.status);
                    const isUpdating = updatingOrderId === id;

                    return (
                      <tr
                        key={
                          id ||
                          `${customer.name}-${order.createdAt}`
                        }
                        className="transition hover:bg-gray-50/80"
                      >
                        <td className="px-5 py-4">
                          <p className="font-bold text-gray-900">
                            #
                            {String(id)
                              .slice(-8)
                              .toUpperCase() || "—"}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {id
                              ? "Order placed"
                              : "Missing order ID"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-800">
                            {customer.name}
                          </p>

                          <p className="mt-1 max-w-48 truncate text-xs text-gray-500">
                            {customer.email ||
                              customer.phone ||
                              "No contact details"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {formatDate(
                            order.createdAt || order.orderDate
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-lg bg-gray-100 px-2.5 py-1 font-medium text-gray-700">
                            {items.reduce(
                              (sum, item) =>
                                sum + getQuantity(item),
                              0
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-bold text-gray-900">
                          {formatCurrency(getTotal(order))}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-col items-start gap-2">
                            <StatusBadge status={status} />

                            <select
                              aria-label={`Update status for order ${id}`}
                              value={status}
                              disabled={isUpdating || !id}
                              onChange={(event) =>
                                updateOrderStatus(
                                  order,
                                  event.target.value
                                )
                              }
                              className="max-w-36 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-indigo-500 disabled:cursor-wait disabled:opacity-60"
                            >
                              {ORDER_STATUSES.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>

                            {isUpdating && (
                              <span className="text-xs text-indigo-600">
                                Updating...
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                          >
                            <Eye size={15} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order details modal */}
        {selectedOrder && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedOrder(null);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="order-details-title"
              className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4 sm:px-6">
                <div>
                  <h2
                    id="order-details-title"
                    className="text-lg font-bold text-gray-900"
                  >
                    Order Details
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    #
                    {String(getOrderId(selectedOrder))
                      .slice(-8)
                      .toUpperCase()}
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close order details"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                >
                  <X size={21} />
                </button>
              </div>

              <div className="space-y-6 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      Order date
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {formatDate(
                        selectedOrder.createdAt ||
                          selectedOrder.orderDate
                      )}
                    </p>
                  </div>

                  <StatusBadge status={selectedOrder.status} />
                </div>

                <section>
                  <h3 className="mb-3 font-bold text-gray-900">
                    Customer Information
                  </h3>

                  <div className="grid gap-3 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="mt-1 break-words text-sm font-medium text-gray-900">
                        {getCustomer(selectedOrder).name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="mt-1 break-all text-sm font-medium text-gray-900">
                        {getCustomer(selectedOrder).email || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {getCustomer(selectedOrder).phone || "—"}
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="mb-3 font-bold text-gray-900">
                    Order Items
                  </h3>

                  {getItems(selectedOrder).length === 0 ? (
                    <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                      No item details are available for this order.
                    </p>
                  ) : (
                    <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
                      {getItems(selectedOrder).map(
                        (item, index) => (
                          <div
                            key={
                              item?._id ||
                              item?.id ||
                              `${getProductName(item)}-${index}`
                            }
                            className="flex items-start justify-between gap-4 p-4"
                          >
                            <div className="min-w-0">
                              <p className="break-words text-sm font-semibold text-gray-900">
                                {getProductName(item)}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                Quantity: {getQuantity(item)}
                              </p>
                            </div>

                            <p className="shrink-0 text-sm font-semibold text-gray-900">
                              {formatCurrency(
                                getPrice(item) *
                                  getQuantity(item)
                              )}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="mb-3 font-bold text-gray-900">
                    Shipping Address
                  </h3>

                  <div className="rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                    {(() => {
                      const address =
                        selectedOrder.shippingAddress ||
                        selectedOrder.address;

                      if (!address) {
                        return "No shipping address available.";
                      }

                      if (typeof address === "string") {
                        return address;
                      }

                      return (
                        [
                          address.name,
                          address.addressLine1 || address.street,
                          address.addressLine2,
                          address.city,
                          address.state,
                          address.postalCode || address.zipCode,
                          address.country,
                        ]
                          .filter(Boolean)
                          .join(", ") ||
                        "No shipping address available."
                      );
                    })()}
                  </div>
                </section>

                <div className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-gray-600">
                      Order Total
                    </span>

                    <span className="text-xl font-bold text-gray-900">
                      {formatCurrency(getTotal(selectedOrder))}
                    </span>
                  </div>
                </div>

                <section>
                  <label
                    htmlFor="modal-order-status"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Update Order Status
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <select
                      id="modal-order-status"
                      value={getStatus(selectedOrder.status)}
                      disabled={
                        updatingOrderId ===
                        getOrderId(selectedOrder)
                      }
                      onChange={(event) =>
                        updateOrderStatus(
                          selectedOrder,
                          event.target.value
                        )
                      }
                      className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>

                    {updatingOrderId ===
                      getOrderId(selectedOrder) && (
                      <span className="flex items-center gap-2 text-sm text-indigo-600">
                        <RefreshCw
                          size={16}
                          className="animate-spin"
                        />
                        Updating...
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    Status changes are saved through the backend API.
                  </p>
                </section>
              </div>

              <div className="border-t border-gray-100 p-5 sm:px-6">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
