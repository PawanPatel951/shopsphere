import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, CalendarDays, IndianRupee, ShoppingBag, TrendingUp, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const dateValue = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const dateInputValue = (date) => {
  const d = new Date(date);
  const local = new Date(
    d.getTime() - d.getTimezoneOffset() * 60000
  );
  return local.toISOString().slice(0, 10);
};

const getRange = (range) => {
  const end = new Date();
  const start = new Date();

  if (range === "today") {
    // Same date for start and end.
  } else if (range === "7") {
    start.setDate(start.getDate() - 6);
  } else {
    start.setDate(start.getDate() - 29);
  }

  return {
    from: dateInputValue(start),
    to: dateInputValue(end),
  };
};

const statusColor = (status) => {
  const value = String(status).toLowerCase();

  if (value === "delivered") return "bg-emerald-500";
  if (value === "cancelled" || value === "canceled") return "bg-red-500";
  if (value === "shipped") return "bg-blue-500";
  if (value === "processing") return "bg-indigo-500";

  return "bg-amber-500";
};

function SummaryCard({ title, value, subtitle, icon: Icon, tone }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-3 break-words text-2xl font-bold text-gray-900">
            {value}
          </p>
          <p className="mt-2 text-xs text-gray-500">{subtitle}</p>
        </div>

        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function Reports() {
  const { token, authLoading, isAuthenticated } = useAuth();

  const initialRange = useMemo(() => getRange("30"), []);

  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [range, setRange] = useState("30");

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReport = useCallback(async () => {
    if (authLoading) return;

    if (!isAuthenticated || !token) {
      setError("Please log in with your admin account.");
      setReport(null);
      setLoading(false);
      return;
    }

    if (from && to && from > to) {
      setError("Start date must be before end date.");
      setReport(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const response = await fetch(
        `${API_URL}/reports?${params.toString()}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || `Request failed (${response.status})`
        );
      }

      setReport(data);
    } catch (err) {
      setError(err.message || "Could not load sales report.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, token, from, to]);

  useEffect(() => {
    if (!authLoading) fetchReport();
  }, [authLoading, fetchReport]);

  const applyPreset = (value) => {
    setRange(value);

    if (value === "custom") return;

    const dates = getRange(value);
    setFrom(dates.from);
    setTo(dates.to);
  };

  const exportCSV = () => {
    if (!report) return;

    const rows = [
      ["Sales Report"],
      ["From", from, "To", to],
      [],
      ["Summary"],
      ["Total Sales", report.summary?.totalSales ?? 0],
      ["Total Orders", report.summary?.totalOrders ?? 0],
      ["Valid Orders", report.summary?.validOrders ?? 0],
      ["Cancelled Orders", report.summary?.cancelledOrders ?? 0],
      ["Average Order Value", report.summary?.averageOrderValue ?? 0],
      [],
      ["Daily Sales"],
      ["Date", "Sales", "Orders"],
      ...(report.dailySales ?? []).map((item) => [
        item.date,
        item.sales,
        item.orders,
      ]),
      [],
      ["Order Status"],
      ["Status", "Count"],
      ...(report.statusBreakdown ?? []).map((item) => [
        item.status,
        item.count,
      ]),
      [],
      ["Top Products"],
      ["Product", "Quantity", "Revenue"],
      ...(report.topProducts ?? []).map((item) => [
        item.name,
        item.quantity,
        item.revenue,
      ]),
      [],
      ["Orders"],
      ["Order ID", "Customer", "Date", "Status", "Amount"],
      ...(report.orders ?? []).map((order) => [
        order._id,
        order.customer,
        order.createdAt,
        order.orderStatus,
        order.totalAmount,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? "");
            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `shopnest-sales-report-${from}-to-${to}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const dailySales = report?.dailySales ?? [];
  const statusBreakdown = report?.statusBreakdown ?? [];
  const topProducts = report?.topProducts ?? [];

  const maxSales = Math.max(
    1,
    ...dailySales.map((item) => Number(item.sales) || 0)
  );

  const maxProductQuantity = Math.max(
    1,
    ...topProducts.map((item) => Number(item.quantity) || 0)
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm text-gray-500">
              ShopNest / Admin / Reports
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Sales & Reports
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Track store sales, orders and performance.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchReport}
              disabled={loading || authLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              onClick={exportCSV}
              disabled={!report || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Date Filters */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays size={19} className="text-indigo-600" />
            <h2 className="font-bold text-gray-900">Report Period</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              ["today", "Today"],
              ["7", "Last 7 Days"],
              ["30", "Last 30 Days"],
              ["custom", "Custom Range"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => applyPreset(value)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  range === value
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
            <label className="block text-sm font-medium text-gray-700">
              From
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(event) => {
                  setRange("custom");
                  setFrom(event.target.value);
                }}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <label className="block text-sm font-medium text-gray-700">
              To
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(event) => {
                  setRange("custom");
                  setTo(event.target.value);
                }}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <button
              onClick={fetchReport}
              disabled={loading || authLoading}
              className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
            >
              Apply Filters
            </button>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div role="alert" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle size={19} className="shrink-0" />
            <div>
              <p className="font-semibold">Report could not be loaded</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-36 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : report ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Total Sales"
              value={money(report.summary?.totalSales)}
              subtitle="Excludes cancelled orders"
              icon={IndianRupee}
              tone="bg-emerald-50 text-emerald-600"
            />
            <SummaryCard
              title="Total Orders"
              value={report.summary?.totalOrders ?? 0}
              subtitle="All orders in this period"
              icon={ShoppingBag}
              tone="bg-indigo-50 text-indigo-600"
            />
            <SummaryCard
              title="Average Order Value"
              value={money(report.summary?.averageOrderValue)}
              subtitle="Per non-cancelled order"
              icon={TrendingUp}
              tone="bg-blue-50 text-blue-600"
            />
            <SummaryCard
              title="Cancelled Orders"
              value={report.summary?.cancelledOrders ?? 0}
              subtitle="Cancelled in this period"
              icon={XCircle}
              tone="bg-red-50 text-red-600"
            />
          </div>
        ) : null}

        {/* Daily Sales Chart */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Daily Sales</h2>
            <p className="mt-1 text-sm text-gray-500">
              Sales value for each date in the selected period.
            </p>
          </div>

          {loading ? (
            <div className="h-56 animate-pulse rounded-xl bg-gray-50" />
          ) : dailySales.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">
              No daily sales data available.
            </p>
          ) : (
            <div className="overflow-x-auto pb-2">
              <div className="flex h-64 min-w-max items-end gap-3 border-b border-gray-200 px-2">
                {dailySales.map((item) => {
                  const height = Math.max(
                    3,
                    (Number(item.sales || 0) / maxSales) * 100
                  );

                  return (
                    <div
                      key={item.date}
                      className="flex h-full w-12 flex-col items-center justify-end gap-2"
                      title={`${item.date}: ${money(item.sales)} (${item.orders} orders)`}
                    >
                      <span className="max-w-16 truncate text-[10px] font-medium text-gray-500">
                        {money(item.sales)}
                      </span>
                      <div className="flex h-40 w-full items-end">
                        <div
                          className="w-full rounded-t-lg bg-indigo-500 transition-all hover:bg-indigo-700"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="pb-2 text-[10px] text-gray-500">
                        {item.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Status and Top Products */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-gray-900">Order Status</h2>
            <p className="mt-1 text-sm text-gray-500">
              Breakdown of orders by current status.
            </p>

            {loading ? (
              <div className="mt-6 h-32 animate-pulse rounded-xl bg-gray-50" />
            ) : statusBreakdown.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-500">
                No order status data available.
              </p>
            ) : (
              <div className="mt-6 space-y-5">
                {statusBreakdown.map((item) => {
                  const total = report?.summary?.totalOrders || 1;
                  const percent = (item.count / total) * 100;

                  return (
                    <div key={item.status}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-gray-700">{item.status}</span>
                        <span className="text-gray-500">
                          {item.count} ({Math.round(percent)}%)
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${statusColor(item.status)}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-gray-900">Top Products</h2>
            <p className="mt-1 text-sm text-gray-500">
              Ranked by quantity sold in the selected period.
            </p>

            {loading ? (
              <div className="mt-6 h-32 animate-pulse rounded-xl bg-gray-50" />
            ) : topProducts.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-500">
                No product item details found for this period.
              </p>
            ) : (
              <div className="mt-6 space-y-5">
                {topProducts.map((item) => (
                  <div key={item.name}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium text-gray-700">
                        {item.name}
                      </span>
                      <span className="shrink-0 text-gray-500">
                        {item.quantity} sold
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-purple-500"
                        style={{
                          width: `${Math.max(
                            2,
                            (item.quantity / maxProductQuantity) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Revenue: {money(item.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Recent Orders */}
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5 sm:px-6">
            <h2 className="text-lg font-bold text-gray-900">Orders Report</h2>
            <p className="mt-1 text-sm text-gray-500">
              Order records included in the selected report.
            </p>
          </div>

          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-10 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : (report?.orders ?? []).length === 0 ? (
            <p className="p-10 text-center text-sm text-gray-500">
              No orders found for this period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Order ID</th>
                    <th className="px-5 py-4 font-semibold">Customer</th>
                    <th className="px-5 py-4 font-semibold">Date</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(report?.orders ?? []).map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-800">
                        #{String(order._id).slice(-8)}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {order.customer}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                        {dateValue(order.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          String(order.orderStatus).toLowerCase() === "delivered"
                            ? "bg-emerald-50 text-emerald-700"
                            : String(order.orderStatus).toLowerCase() === "cancelled"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                        }`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-gray-900">
                        {money(order.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="text-xs text-gray-500">
          Sales figures are calculated from saved orders. Confirm your
          payment and refund rules before using these figures for accounting.
        </p>
      </div>
    </div>
  );
}

export default Reports;
