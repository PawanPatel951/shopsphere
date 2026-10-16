import Order from "../models/Order.js";

const getAmount = (order) =>
  Number(
    order.totalAmount ??
      order.totalPrice ??
      order.grandTotal ??
      order.amount ??
      order.total ??
      0
  );

const getStatus = (order) =>
  String(order.orderStatus ?? order.status ?? "Pending");

const isCancelled = (order) =>
  ["cancelled", "canceled"].includes(
    getStatus(order).toLowerCase()
  );

const getDateKey = (date) => {
  const d = new Date(date);

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};

export const getSalesReport = async (req, res) => {
  try {
    const { from, to } = req.query;

    const filter = {};

    if (from || to) {
      filter.createdAt = {};

      if (from) {
        const start = new Date(`${from}T00:00:00.000Z`);

        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid start date.",
          });
        }

        filter.createdAt.$gte = start;
      }

      if (to) {
        const end = new Date(`${to}T23:59:59.999Z`);

        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date.",
          });
        }

        filter.createdAt.$lte = end;
      }

      if (
        filter.createdAt.$gte &&
        filter.createdAt.$lte &&
        filter.createdAt.$gte > filter.createdAt.$lte
      ) {
        return res.status(400).json({
          success: false,
          message: "Start date must be before end date.",
        });
      }
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const cancelledOrders = orders.filter(isCancelled);
    const validOrders = orders.filter(
      (order) => !isCancelled(order)
    );

    const totalSales = validOrders.reduce(
      (sum, order) => sum + getAmount(order),
      0
    );

    const totalOrders = orders.length;
    const averageOrderValue =
      validOrders.length > 0
        ? totalSales / validOrders.length
        : 0;

    const statusMap = {};

    for (const order of orders) {
      const status = getStatus(order);

      statusMap[status] = (statusMap[status] || 0) + 1;
    }

    const statusBreakdown = Object.entries(statusMap).map(
      ([status, count]) => ({
        status,
        count,
      })
    );

    // Build daily sales for the selected date range.
    // When no date range is supplied, show the latest 30 days.
    const now = new Date();
    const defaultStart = new Date(now);

    defaultStart.setDate(defaultStart.getDate() - 29);
    defaultStart.setHours(0, 0, 0, 0);

    const reportStart = from
      ? new Date(`${from}T00:00:00`)
      : defaultStart;

    const reportEnd = to
      ? new Date(`${to}T23:59:59.999`)
      : now;

    const dailyMap = new Map();

    for (
      const cursor = new Date(reportStart);
      cursor <= reportEnd;
      cursor.setDate(cursor.getDate() + 1)
    ) {
      dailyMap.set(getDateKey(cursor), {
        date: getDateKey(cursor),
        sales: 0,
        orders: 0,
      });
    }

    for (const order of validOrders) {
      const date = new Date(order.createdAt);
      const key = getDateKey(date);

      if (!dailyMap.has(key)) {
        dailyMap.set(key, {
          date: key,
          sales: 0,
          orders: 0,
        });
      }

      const item = dailyMap.get(key);
      item.sales += getAmount(order);
      item.orders += 1;
    }

    const dailySales = [...dailyMap.values()].sort(
      (a, b) => a.date.localeCompare(b.date)
    );

    // Top-selling products, where order items are available.
    const productMap = new Map();

    for (const order of validOrders) {
      const items = order.items ?? order.orderItems ?? [];

      for (const item of items) {
        const name =
          item.name ??
          item.productName ??
          item.product?.name ??
          "Product";

        const quantity = Number(
          item.quantity ?? item.qty ?? 1
        );

        const price = Number(
          item.price ??
            item.unitPrice ??
            item.product?.price ??
            0
        );

        const current = productMap.get(name) || {
          name,
          quantity: 0,
          revenue: 0,
        };

        current.quantity += quantity;
        current.revenue += quantity * price;

        productMap.set(name, current);
      }
    }

    const topProducts = [...productMap.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      summary: {
        totalSales,
        totalOrders,
        validOrders: validOrders.length,
        cancelledOrders: cancelledOrders.length,
        averageOrderValue,
      },
      dailySales,
      statusBreakdown,
      topProducts,
      orders: orders.map((order) => ({
        _id: order._id,
        orderStatus: getStatus(order),
        totalAmount: getAmount(order),
        createdAt: order.createdAt,
        customer:
          order.user?.name ??
          order.customer?.name ??
          order.customerName ??
          "Customer",
      })),
    });
  } catch (error) {
    console.error("Sales report error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate sales report.",
    });
  }
};
