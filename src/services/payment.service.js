import { ApiError, createEndpointResolver } from "@/lib/api";
import { toNumber } from "@/lib/format";

/**
 * The admin payment router mounts `protect` + `adminOnly` on the whole router
 * and answers "/" for the list. `/admin/payments` matches the convention the
 * other admin routers already follow on this API.
 */
const endpoint = createEndpointResolver(
  process.env.NEXT_PUBLIC_PAYMENTS_PATH
    ? [process.env.NEXT_PUBLIC_PAYMENTS_PATH]
    : ["/admin/payments", "/payments"],
);

export const getPaymentsPath = endpoint.path;

/**
 * The Payment model's own enum — five values.
 *
 * Note this is NOT the same set as Order.paymentStatus, which only permits
 * captured / failed / refunded. A payment exists from the moment checkout
 * starts; an order only exists once one is captured.
 */
export const PAYMENT_STATUSES = [
  { value: "created", label: "Created", tone: "neutral" },
  { value: "authorized", label: "Authorized", tone: "warning" },
  { value: "captured", label: "Captured", tone: "success" },
  { value: "failed", label: "Failed", tone: "danger" },
  { value: "refunded", label: "Refunded", tone: "warning" },
];

export const PAYMENT_SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

/** The controller clamps `limit` to 100. */
export const PAGE_SIZES = [20, 50, 100];

export function paymentStatusMeta(status) {
  return (
    PAYMENT_STATUSES.find((entry) => entry.value === status) || {
      value: status,
      label: String(status || "Unknown").replace(/_/g, " "),
      tone: "neutral",
    }
  );
}

/* ------------------------------------------------------------------ */
/* Normalisation                                                       */
/* ------------------------------------------------------------------ */

/**
 * `razorpaySignature` never arrives — it is `select: false` on the schema and
 * excluded again by the controller — so there is nothing sensitive to strip.
 * This only flattens the populated user and fills the nullable fields.
 */
function normalizePayment(payment = {}) {
  const user = payment.user || {};

  return {
    id: payment._id || payment.id,
    razorpayOrderId: payment.razorpayOrderId || "",
    // Null until Razorpay hands one back, so a "created" row has no payment id.
    razorpayPaymentId: payment.razorpayPaymentId || "",

    customer: {
      id: user._id || user.id || null,
      name: user.name || "Deleted customer",
      email: user.email || "",
      phone: user.phone || "",
    },

    amount: toNumber(payment.amount),
    currency: payment.currency || "INR",
    status: payment.status || "created",
    failureReason: payment.failureReason || "",
    verifiedAt: payment.verifiedAt || null,
    createdAt: payment.createdAt || null,
    updatedAt: payment.updatedAt || null,
  };
}

function assertAdminEnvelope(payload) {
  if (!payload?.data?.pagination) {
    throw new ApiError(
      `${endpoint.path()} did not answer with the admin payment list. Set NEXT_PUBLIC_PAYMENTS_PATH to the route the admin payment router is mounted on.`,
      0,
      payload,
    );
  }
  return payload;
}

export const paymentService = {
  /**
   * GET <mount>/ — status, sort, page, limit, and `search`, which matches the
   * Razorpay order or payment id only. Not the customer, not the amount.
   */
  list: async (params = {}, options) => {
    const payload = assertAdminEnvelope(
      await endpoint.get({
        ...options,
        params: {
          search: params.search,
          status: params.status,
          sort: params.sort,
          page: params.page,
          limit: params.limit,
        },
      }),
    );

    const data = payload.data;
    const meta = data.pagination || {};

    return {
      items: Array.isArray(data.payments) ? data.payments.map(normalizePayment) : [],
      total: toNumber(meta.totalPayments),
      page: toNumber(meta.page) || 1,
      pages: Math.max(toNumber(meta.totalPages), 1),
      limit: toNumber(meta.limit) || 20,
      filters: data.filters || {},
    };
  },
};
