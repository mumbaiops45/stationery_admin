import { ApiError, api, createEndpointResolver } from "@/lib/api";
import { toNumber } from "@/lib/format";

/**
 * The admin user router mounts `protect` + `adminOnly` on the whole router
 * and answers "/" for the list. Its mount path is not visible from this repo.
 *
 * `/admin/users` is tried first: a bare `/users` is likely a customer profile
 * route, which would answer 200 rather than 404. `assertAdminEnvelope` below
 * rejects anything that is not the paginated admin list.
 */
const endpoint = createEndpointResolver(
  process.env.NEXT_PUBLIC_USERS_PATH
    ? [process.env.NEXT_PUBLIC_USERS_PATH]
    : ["/admin/users", "/users"],
);

export const getUsersPath = endpoint.path;

/** The only two values the model's enum and updateUserRole accept. */
export const ROLES = [
  { value: "customer", label: "Customer", tone: "neutral" },
  { value: "admin", label: "Admin", tone: "warning" },
];

export const ROLE_FILTERS = [
  { value: "all", label: "All roles" },
  { value: "customer", label: "Customers" },
  { value: "admin", label: "Admins" },
];

export const STATUS_FILTERS = [
  { value: "all", label: "All status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const USER_SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

/** The controller clamps `limit` to 100. */
export const PAGE_SIZES = [20, 50, 100];

export function roleMeta(role) {
  return (
    ROLES.find((entry) => entry.value === role) || {
      value: role,
      label: String(role || "Unknown"),
      tone: "neutral",
    }
  );
}

/* ------------------------------------------------------------------ */
/* Normalisation                                                       */
/* ------------------------------------------------------------------ */

/**
 * The list already omits every credential field via `.select("-password …")`,
 * so there is nothing sensitive to strip here — this only flattens the shape
 * and fills the gaps, since `phone` is optional on the model.
 */
function normalizeUser(user = {}) {
  return {
    id: user._id || user.id,
    name: user.name || "—",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "customer",
    isActive: user.isActive !== false,
    isVerified: user.isVerified === true,
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
  };
}

function assertAdminEnvelope(payload) {
  if (!payload?.data?.pagination) {
    throw new ApiError(
      `${endpoint.path()} did not answer with the admin user list. Set NEXT_PUBLIC_USERS_PATH to the route the admin user router is mounted on.`,
      0,
      payload,
    );
  }
  return payload;
}

export const userService = {
  /** GET <mount>/ — search (name, email or phone), role, status, sort. */
  list: async (params = {}, options) => {
    const payload = assertAdminEnvelope(
      await endpoint.get({
        ...options,
        params: {
          search: params.search,
          role: params.role,
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
      items: Array.isArray(data.users) ? data.users.map(normalizeUser) : [],
      total: toNumber(meta.totalUsers),
      page: toNumber(meta.page) || 1,
      pages: Math.max(toNumber(meta.totalPages), 1),
      limit: toNumber(meta.limit) || 20,
      filters: data.filters || {},
    };
  },

  /**
   * PATCH <mount>/:userId/role — { role }.
   *
   * The controller refuses to change the caller's own role, so the UI hides
   * that control on the signed-in admin's own row rather than offering an
   * action that can only 400.
   */
  setRole: (userId, role) =>
    api.patch(`${endpoint.path()}/${userId}/role`, { role }),

  /**
   * PATCH <mount>/:userId/status — { isActive }. Refused on the caller's own
   * account, same reasoning as setRole above.
   */
  setStatus: (userId, isActive) =>
    api.patch(`${endpoint.path()}/${userId}/status`, { isActive }),

  /**
   * GET <mount>/:userId — one user plus an order summary the controller
   * computes server-side (orderCount, totalSpent) so it stays correct beyond
   * whatever page of orders the detail view happens to have loaded.
   */
  get: async (userId, options) => {
    const payload = await api.get(`${endpoint.path()}/${userId}`, options);
    const data = payload?.data || {};

    return {
      user: normalizeUser(data.user || {}),
      stats: {
        orderCount: toNumber(data.stats?.orderCount),
        totalSpent: toNumber(data.stats?.totalSpent),
      },
    };
  },
};
