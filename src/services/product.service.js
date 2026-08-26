import { api, normalizeList } from "@/lib/api";

const RESOURCE = "/products";

/** Sort keys the API's `sort` switch understands. */
export const PRODUCT_SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
];

/** The API clamps `limit` to 100, so 100 is the largest page worth offering. */
export const PAGE_SIZES = [20, 50, 100];

export const productService = {
  /**
   * GET /products/admin/all — the admin listing, which unlike the public one
   * also returns inactive products.
   *
   * Honoured by getAdminProducts today: search, category (ObjectId only — it
   * does not resolve slugs the way the public route does), isActive, page,
   * limit. minPrice / maxPrice / inStock / sort are sent because the public
   * getProducts already implements them and the admin route is expected to
   * pick them up; until it does, the controller ignores them.
   */
  list: async (params = {}, options) => {
    const payload = await api.get(`${RESOURCE}/admin/all`, {
      ...options,
      params: {
        search: params.search,
        category: params.category,
        isActive: params.isActive,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        inStock: params.inStock,
        sort: params.sort,
        page: params.page,
        limit: params.limit,
      },
    });
    return normalizeList(payload, "products");
  },

  /** GET /products/:id — public route, so it 404s on an inactive product. */
  get: (id) => api.get(`${RESOURCE}/${id}`),

  /**
   * POST /products
   *
   * Required: name, description, category (ObjectId of an active category),
   * price. Optional: slug (derived from name when omitted), compareAtPrice
   * (must be >= price, or null), image.url, stock (defaults to 0),
   * hasVariants (defaults to false).
   */
  create: (data) => api.post(RESOURCE, data),

  /** PUT /products/:id — every field is optional; only what is sent changes. */
  update: (id, data) => api.put(`${RESOURCE}/${id}`, data),

  /** PATCH /products/:id/status — { isActive } must be a real boolean. */
  setStatus: (id, isActive) =>
    api.patch(`${RESOURCE}/${id}/status`, { isActive }),

  /** DELETE /products/:id — soft delete: sets isActive false. */
  remove: (id) => api.delete(`${RESOURCE}/${id}`),
};
