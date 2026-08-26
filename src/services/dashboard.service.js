import { createEndpointResolver } from "@/lib/api";
import { toNumber } from "@/lib/format";

/**
 * GET the admin dashboard counters.
 *
 * The API mounts adminDashboard.routes behind `protect` + `adminOnly` and the
 * router itself only answers "/", so the whole endpoint is the mount path. The
 * mount is not visible from this repo, hence the candidate list: the first
 * path that does not answer 404 wins and is remembered for the session. Set
 * NEXT_PUBLIC_DASHBOARD_PATH to pin it explicitly.
 */
const endpoint = createEndpointResolver(
  process.env.NEXT_PUBLIC_DASHBOARD_PATH
    ? [process.env.NEXT_PUBLIC_DASHBOARD_PATH]
    : ["/admin/dashboard", "/dashboard"],
);

/** The path that answered last — useful in an error message. */
export const getDashboardPath = endpoint.path;

/* ------------------------------------------------------------------ */
/* Status metadata                                                     */
/* ------------------------------------------------------------------ */

/**
 * The order lifecycle, in the order the controller counts it. `key` matches
 * the field on `data.orders`; `value` matches Order.orderStatus on the API.
 */
export const ORDER_STAGES = [
  { key: "confirmed", value: "confirmed", label: "Confirmed", tone: "blue" },
  { key: "processing", value: "processing", label: "Processing", tone: "purple" },
  { key: "shipped", value: "shipped", label: "Shipped", tone: "teal" },
  {
    key: "outForDelivery",
    value: "out_for_delivery",
    label: "Out for delivery",
    tone: "yellow",
  },
  { key: "delivered", value: "delivered", label: "Delivered", tone: "teal" },
  { key: "cancelled", value: "cancelled", label: "Cancelled", tone: "coral" },
];

/** Everything that is neither delivered nor cancelled still needs attention. */
export const OPEN_ORDER_KEYS = [
  "confirmed",
  "processing",
  "shipped",
  "outForDelivery",
];

/* ------------------------------------------------------------------ */
/* Normalisation                                                       */
/* ------------------------------------------------------------------ */

/**
 * Reshapes one recent order into what a table row needs, so the page never
 * reaches into `order.user?.name` and crashes on a deleted customer.
 */
function normalizeRecentOrder(order = {}) {
  const user = order.user || {};

  return {
    id: order._id || order.id || order.orderNumber,
    orderNumber: order.orderNumber || "—",
    customerName: user.name || "Deleted customer",
    customerEmail: user.email || "",
    total: toNumber(order.total),
    orderStatus: order.orderStatus || "pending",
    paymentStatus: order.paymentStatus || "pending",
    createdAt: order.createdAt || null,
  };
}

/**
 * Flattens the dashboard envelope into a shape with every key present.
 *
 * The controller adds sections over time (variants arrived after products);
 * defaulting every group here means a page can read `stats.variants.lowStock`
 * without optional chaining and without rendering `undefined`.
 */
export function normalizeDashboard(payload) {
  const data = payload?.data ?? payload ?? {};

  const users = data.users || {};
  const products = data.products || {};
  const variants = data.variants || {};
  const orders = data.orders || {};
  const payments = data.payments || {};
  const sales = data.sales || {};

  return {
    users: {
      total: toNumber(users.total),
      customers: toNumber(users.customers),
      admins: toNumber(users.admins),
      active: toNumber(users.active),
      inactive: toNumber(users.inactive),
    },

    products: {
      total: toNumber(products.total),
      active: toNumber(products.active),
      inactive: toNumber(products.inactive),
      lowStock: toNumber(products.lowStock),
      outOfStock: toNumber(products.outOfStock),
    },

    variants: {
      total: toNumber(variants.total),
      lowStock: toNumber(variants.lowStock),
      outOfStock: toNumber(variants.outOfStock),
    },

    orders: {
      total: toNumber(orders.total),
      confirmed: toNumber(orders.confirmed),
      processing: toNumber(orders.processing),
      shipped: toNumber(orders.shipped),
      outForDelivery: toNumber(orders.outForDelivery),
      delivered: toNumber(orders.delivered),
      cancelled: toNumber(orders.cancelled),
    },

    payments: {
      captured: toNumber(payments.captured),
      failed: toNumber(payments.failed),
      refunded: toNumber(payments.refunded),
    },

    sales: {
      total: toNumber(sales.total),
      currency: sales.currency || "INR",
    },

    recentOrders: Array.isArray(data.recentOrders)
      ? data.recentOrders.map(normalizeRecentOrder)
      : [],
  };
}

export const dashboardService = {
  /** GET <mount>/ — every admin counter in one call. */
  getStats: async (options) => normalizeDashboard(await endpoint.get(options)),
};
