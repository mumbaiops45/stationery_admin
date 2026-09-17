import { api, normalizeList } from "@/lib/api";

const RESOURCE = "/banners";

/**
 * The two placements the controller accepts for `type`.
 *
 * "homepage" only uses image + description + discount; "offer" is the full
 * card and also takes title, link and buttonText — title is required there.
 */
export const BANNER_TYPES = [
  { value: "homepage", label: "Homepage" },
  { value: "offer", label: "Offer" },
];

/** Sort keys the admin controller's `sort` switch understands. */
export const BANNER_SORTS = [
  { value: "position_asc", label: "Position: low to high" },
  { value: "position_desc", label: "Position: high to low" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

/** The admin controller clamps `limit` to 100. */
export const PAGE_SIZES = [10, 20, 50, 100];

export const bannerService = {
  /** GET /banners/admin/all — search, type, status, sort, page, limit. */
  list: async (params = {}, options) => {
    const payload = await api.get(`${RESOURCE}/admin/all`, {
      ...options,
      params: {
        search: params.search,
        type: params.type,
        status: params.status,
        sort: params.sort,
        page: params.page,
        limit: params.limit,
      },
    });
    return normalizeList(payload, "banners");
  },

  /** GET /banners/:id — admin only, unlike the public route. */
  get: (id) => api.get(`${RESOURCE}/${id}`),

  /**
   * POST /banners — `image` is the raw picked value (an https URL, or a
   * base64 data URL from the inline upload fallback); the API resolves it to
   * Cloudinary itself. `title` is required when `type` is "offer".
   */
  create: (data) => api.post(RESOURCE, data),

  /** PUT /banners/:id — every field is optional; only what is sent changes. */
  update: (id, data) => api.put(`${RESOURCE}/${id}`, data),

  /** PATCH /banners/:id/status — { isActive } must be a real boolean. */
  setStatus: (id, isActive) =>
    api.patch(`${RESOURCE}/${id}/status`, { isActive }),

  /** PATCH /banners/admin/reorder — { items: [{ id, position }] }. */
  reorder: (items) => api.patch(`${RESOURCE}/admin/reorder`, { items }),

  /** DELETE /banners/:id — hard delete; the Cloudinary asset goes with it. */
  remove: (id) => api.delete(`${RESOURCE}/${id}`),
};
