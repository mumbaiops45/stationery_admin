import { createEndpointResolver } from "@/lib/api";
import { toNumber } from "@/lib/format";

/**
 * The report router mounts `protect` + `adminOnly` and answers /overview.
 * Confirmed live at /admin/reports/overview (it returns 401, not the Express
 * 404 page, when unauthenticated).
 */
const endpoint = createEndpointResolver(
  process.env.NEXT_PUBLIC_REPORTS_PATH
    ? [process.env.NEXT_PUBLIC_REPORTS_PATH]
    : ["/admin/reports/overview", "/reports/overview"],
);

export const getReportsPath = endpoint.path;

/** The only four the controller accepts; anything else is a 400. */
export const PERIODS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "1y", label: "12 months" },
];

/**
 * Payment statuses in lifecycle order, with the tone each one means.
 *
 * These are status colours, not series colours — they say good/bad, so they
 * are never reused to distinguish one chart series from another.
 */
export const PAYMENT_BREAKDOWN = [
  { key: "created", label: "Created", tone: "neutral" },
  { key: "authorized", label: "Authorized", tone: "warning" },
  { key: "captured", label: "Captured", tone: "success" },
  { key: "failed", label: "Failed", tone: "danger" },
  { key: "refunded", label: "Refunded", tone: "warning" },
];

function bucket(value = {}) {
  return { count: toNumber(value.count), amount: toNumber(value.amount) };
}

/** `_id` is the "%Y-%m-%d" string the $dateToString group produced. */
function normalizeDay(day = {}) {
  return {
    date: day._id || "",
    orders: toNumber(day.orders),
    revenue: toNumber(day.revenue),
  };
}

function normalizeTopProduct(row = {}) {
  return {
    id: row._id || "",
    name: row.productName || "Deleted product",
    quantity: toNumber(row.quantity),
    revenue: toNumber(row.revenue),
  };
}

export function normalizeReport(payload) {
  const data = payload?.data ?? payload ?? {};
  const summary = data.summary || {};
  const revenue = data.revenue || {};
  const payments = data.payments || {};

  const dailySales = Array.isArray(data.dailySales)
    ? data.dailySales.map(normalizeDay)
    : [];

  return {
    period: {
      type: data.period?.type || "30d",
      from: data.period?.from || null,
      to: data.period?.to || null,
    },

    summary: {
      totalCustomers: toNumber(summary.totalCustomers),
      totalProducts: toNumber(summary.totalProducts),
      totalCategories: toNumber(summary.totalCategories),
      totalOrders: toNumber(summary.totalOrders),
      deliveredOrders: toNumber(summary.deliveredOrders),
      cancelledOrders: toNumber(summary.cancelledOrders),
    },

    revenue: {
      total: toNumber(revenue.total),
      subtotal: toNumber(revenue.subtotal),
      shipping: toNumber(revenue.shipping),
    },

    payments: PAYMENT_BREAKDOWN.map((entry) => ({
      ...entry,
      ...bucket(payments[entry.key]),
    })),

    dailySales,
    topProducts: Array.isArray(data.topProducts)
      ? data.topProducts.map(normalizeTopProduct)
      : [],
  };
}

export const reportService = {
  /** GET <mount>/overview?period=7d|30d|90d|1y */
  getOverview: async (period = "30d", options) =>
    normalizeReport(await endpoint.get({ ...options, params: { period } })),
};
