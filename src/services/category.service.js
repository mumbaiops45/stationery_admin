import { api, normalizeList } from "@/lib/api";

const RESOURCE = "/categories";

/** Sort keys the admin controller's `sort` switch understands. */
export const CATEGORY_SORTS = [
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

/** The admin controller clamps `limit` to 100. */
export const PAGE_SIZES = [10, 20, 50, 100];

/**
 * Mirrors the slug the controller would build from a name.
 *
 * createCategory takes a supplied `slug` verbatim (`slug || generated`) and
 * only normalises the one it derives itself, so a slug typed with spaces or
 * capitals would be stored as-is and never match a lookup. Normalising here
 * keeps both paths identical. updateCategory does normalise, so this is
 * belt-and-braces on that route.
 *
 * Re-exported from @/lib/slug so Products' form can share the exact same
 * derivation without importing it from an unrelated service.
 */
export { slugify } from "@/lib/slug";

export const categoryService = {
  /**
   * GET /categories/admin/all — search, status, sort, page, limit.
   *
   * `status` is a string here ("active" / "inactive"), not the boolean-ish
   * `isActive` the product route takes. Anything else means "all".
   */
  list: async (params = {}, options) => {
    const payload = await api.get(`${RESOURCE}/admin/all`, {
      ...options,
      params: {
        search: params.search,
        status: params.status,
        sort: params.sort,
        page: params.page,
        limit: params.limit,
      },
    });
    return normalizeList(payload, "categories");
  },

  /**
   * GET /categories — the public route: every active category, name-sorted,
   * unpaginated. This is what a product form's dropdown needs, since the API
   * rejects a product whose category is inactive.
   */
  listActive: async (params, options) => {
    const payload = await api.get(RESOURCE, options);
    return normalizeList(payload, "categories");
  },

  /** GET /categories/:id — public, so it 404s on an inactive category. */
  get: (id) => api.get(`${RESOURCE}/${id}`),

  /**
   * POST /categories — { name, slug?, description?, image: { url } }.
   * 409 when the name or the slug is already taken.
   */
  create: (data) => api.post(RESOURCE, data),

  /** PUT /categories/:id — every field optional; only what is sent changes. */
  update: (id, data) => api.put(`${RESOURCE}/${id}`, data),

  /** PATCH /categories/:id/status — { isActive } must be a real boolean. */
  setStatus: (id, isActive) =>
    api.patch(`${RESOURCE}/${id}/status`, { isActive }),

  /** DELETE /categories/:id — soft delete: sets isActive false. */
  remove: (id) => api.delete(`${RESOURCE}/${id}`),
};
