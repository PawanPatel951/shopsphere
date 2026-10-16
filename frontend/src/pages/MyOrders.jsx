import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function MyOrders() {
  const { token, isAuthenticated, authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !token) {
      setOrders([]);
      setError("Please log in to view your orders.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadOrders() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_URL}/orders/my-orders`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
          throw new Error(
            "Your session is not authorized. Please log out and log in again."
          );
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              data.error ||
              `Unable to load orders (HTTP ${response.status}).`
          );
        }

        // Supports common API response formats.
        const orderList = Array.isArray(data)
          ? data
          : Array.isArray(data.orders)
            ? data.orders
            : Array.isArray(data.data)
              ? data.data
              : Array.isArray(data.data?.orders)
                ? data.data.orders
                : [];

        setOrders(orderList);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Something went wrong while loading orders.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => controller.abort();
  }, [token, isAuthenticated, authLoading]);

  if (authLoading || loading) {
    return (
      <main className="mx-auto min-h-[60vh] max-w-6xl px-4 py-12">
        <h1 className="mb-6 text-3xl font-bold">My Orders</h1>
        <div className="rounded-xl border border-gray-200 p-8 text-center dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-300">
            Loading your orders...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[60vh] max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Orders
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View your purchases and check order status.
          </p>
        </div>

        <Link
          to="/products"
          className="rounded-lg bg-black px-5 py-3 font-medium text-white transition hover:opacity-80 dark:bg-white dark:text-black"
        >
          Continue Shopping
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-300 bg-red-50 p-5 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          <h2 className="font-semibold">Could not load orders</h2>
          <p className="mt-2">{error}</p>

          {!isAuthenticated && (
            <Link
              to="/login"
              className="mt-4 inline-block font-semibold underline"
            >
              Log in
            </Link>
          )}
        </div>
      )}

      {!error && orders.length === 0 && (
        <section className="rounded-2xl border border-gray-200 px-5 py-14 text-center dark:border-gray-700">
          <div className="mb-4 text-5xl" aria-hidden="true">
            📦
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            No orders yet
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Once you place an order, it will appear here.
          </p>
          <Link
            to="/products"
            className="mt-6 inline-block rounded-lg bg-black px-6 py-3 font-medium text-white hover:opacity-80 dark:bg-white dark:text-black"
          >
            Browse Products
          </Link>
        </section>
      )}

      {!error && orders.length > 0 && (
        <div className="space-y-5">
          {orders.map((order, index) => {
            const id = order._id || order.id || order.orderId || index;
            const orderNumber =
              order.orderNumber || order.orderId || String(id);

            const total =
              order.totalAmount ??
              order.grandTotal ??
              order.total ??
              order.totalPrice ??
              0;

            const status =
              order.orderStatus || order.status || "Processing";

            const orderDate = order.createdAt || order.orderDate;

            const items = Array.isArray(order.items)
              ? order.items
              : Array.isArray(order.products)
                ? order.products
                : [];

            return (
              <article
                key={id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Order Number
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                      #{orderNumber}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {orderDate
                        ? new Date(orderDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Date unavailable"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Total Amount
                    </p>
                    <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                      ₹{Number(total).toLocaleString("en-IN")}
                    </p>
                    <span className="mt-2 inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-medium capitalize text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                      {String(status).replace(/[_-]/g, " ")}
                    </span>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="mt-5 border-t border-gray-200 pt-4 dark:border-gray-700">
                    <p className="mb-3 font-semibold text-gray-800 dark:text-gray-200">
                      Items ({items.length})
                    </p>

                    <div className="space-y-2">
                      {items.map((item, itemIndex) => {
                        const product =
                          item.product?.name ||
                          item.productName ||
                          item.name ||
                          "Product";

                        const quantity = item.quantity ?? item.qty ?? 1;

                        return (
                          <div
                            key={item._id || item.id || itemIndex}
                            className="flex items-center justify-between gap-3 text-sm"
                          >
                            <span className="text-gray-600 dark:text-gray-300">
                              {product} × {quantity}
                            </span>

                            {(item.price != null ||
                              item.subtotal != null) && (
                              <span className="font-medium text-gray-800 dark:text-gray-200">
                                ₹
                                {Number(
                                  item.subtotal ??
                                    Number(item.price) * Number(quantity)
                                ).toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-5 border-t border-gray-200 pt-4 dark:border-gray-700">
                  <Link
                    to={`/orders/${id}`}
                    className="font-semibold text-gray-900 underline underline-offset-4 hover:opacity-70 dark:text-white"
                  >
                    View Order Details →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
