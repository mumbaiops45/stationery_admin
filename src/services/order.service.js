import { ApiError, createEndpointResolver } from "@/lib/api";
import { formatMoney, toNumber } from "@/lib/format";

/**
 * The admin order router mounts `protect` + `adminOnly` on the whole router
 * and answers "/" for the list. Its mount path is not visible from this repo.
 *
 * `/admin/orders` is tried first on purpose: `/orders` is very likely the
 * customer router (getMyOrders), which would answer 200 with the signed-in
 * admin's *own* orders rather than 404. `assertAdminEnvelope` below catches
 * that case instead of quietly showing the wrong data.
 */
const endpoint = createEndpointResolver(
  process.env.NEXT_PUBLIC_ORDERS_PATH
    ? [process.env.NEXT_PUBLIC_ORDERS_PATH]
    : ["/admin/orders", "/orders"],
);

export const getOrdersPath = endpoint.path;

/* ------------------------------------------------------------------ */
/* Status metadata — these mirror the enums on the Order model          */
/* ------------------------------------------------------------------ */

export const ORDER_STATUSES = [
  { value: "confirmed", label: "Confirmed", tone: "neutral" },
  { value: "processing", label: "Processing", tone: "neutral" },
  { value: "shipped", label: "Shipped", tone: "neutral" },
  { value: "out_for_delivery", label: "Out for delivery", tone: "warning" },
  { value: "delivered", label: "Delivered", tone: "success" },
  { value: "cancelled", label: "Cancelled", tone: "danger" },
];

export const PAYMENT_STATUSES = [
  { value: "captured", label: "Paid", tone: "success" },
  { value: "failed", label: "Failed", tone: "danger" },
  { value: "refunded", label: "Refunded", tone: "warning" },
];

export const ORDER_SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

/** The controller clamps `limit` to 100. */
export const PAGE_SIZES = [20, 50, 100];

function metaFrom(list, value) {
  const found = list.find((entry) => entry.value === value);
  if (found) return found;

  // An enum the model has since grown still renders, just without a tone.
  return {
    value,
    label: String(value || "Unknown").replace(/_/g, " "),
    tone: "neutral",
  };
}

export const orderStatusMeta = (status) => metaFrom(ORDER_STATUSES, status);
export const paymentStatusMeta = (status) => metaFrom(PAYMENT_STATUSES, status);

/* ------------------------------------------------------------------ */
/* Normalisation                                                       */
/* ------------------------------------------------------------------ */

function normalizeItem(item = {}) {
  return {
    id: item._id || item.id,
    productId: item.product?._id || item.product || null,
    name: item.productName || "—",
    image: item.productImage || "",
    variantName: item.variantName || "",
    quantity: toNumber(item.quantity),
    price: toNumber(item.price),
    itemTotal: toNumber(item.itemTotal),
  };
}

/**
 * The admin list returns the whole order document — items, address, payment —
 * so a detail view needs no second request. There is no admin GET /orders/:id
 * on the API, which makes that a requirement rather than an optimisation.
 */
function normalizeOrder(order = {}) {
  const user = order.user || {};
  const address = order.shippingAddress || {};
  const items = Array.isArray(order.items) ? order.items.map(normalizeItem) : [];

  return {
    id: order._id || order.id,
    orderNumber: order.orderNumber || "—",

    customer: {
      id: user._id || user.id || null,
      name: user.name || "Deleted customer",
      email: user.email || "",
      phone: user.phone || "",
    },

    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),

    address: {
      name: address.name || "",
      phone: address.phone || "",
      lines: [address.addressLine1, address.addressLine2].filter(Boolean),
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postalCode || "",
      country: address.country || "",
    },

    subtotal: toNumber(order.subtotal),
    shipping: toNumber(order.shipping),
    total: toNumber(order.total),

    orderStatus: order.orderStatus || "confirmed",
    paymentStatus: order.paymentStatus || "captured",

    payment: {
      // `payment` is populated, so it is the Payment document, not just an id.
      method: order.payment?.method || "",
      razorpayOrderId: order.razorpayOrderId || "",
      razorpayPaymentId: order.razorpayPaymentId || "",
    },

    createdAt: order.createdAt || null,
    cancelledAt: order.cancelledAt || null,
    deliveredAt: order.deliveredAt || null,
  };
}

/**
 * The customer route answers the same 200 with `{ data: { orders } }` and no
 * pagination. Refusing that envelope is what stops a wrong mount path from
 * rendering an admin's personal orders as if they were the whole store's.
 */
function assertAdminEnvelope(payload) {
  if (!payload?.data?.pagination) {
    throw new ApiError(
      `${endpoint.path()} did not answer with the admin order list. Set NEXT_PUBLIC_ORDERS_PATH to the route the admin order router is mounted on.`,
      0,
      payload,
    );
  }
  return payload;
}

export const orderService = {
  /** GET <mount>/ — search (order number), orderStatus, paymentStatus, sort. */
  list: async (params = {}, options) => {
    const payload = assertAdminEnvelope(
      await endpoint.get({
        ...options,
        params: {
          search: params.search,
          orderStatus: params.orderStatus,
          paymentStatus: params.paymentStatus,
          sort: params.sort,
          page: params.page,
          limit: params.limit,
        },
      }),
    );

    const data = payload.data;
    const meta = data.pagination || {};
    const limit = toNumber(meta.limit) || 20;

    return {
      items: Array.isArray(data.orders) ? data.orders.map(normalizeOrder) : [],
      total: toNumber(meta.totalOrders),
      page: toNumber(meta.page) || 1,
      pages: Math.max(toNumber(meta.totalPages), 1),
      limit,
      filters: data.filters || {},
    };
  },
};

/** Subtotal + shipping, spelled out for the detail panel. */
export function orderTotals(order) {
  return [
    { label: "Subtotal", value: formatMoney(order.subtotal) },
    { label: "Shipping", value: formatMoney(order.shipping) },
    { label: "Total", value: formatMoney(order.total), strong: true },
  ];
}
