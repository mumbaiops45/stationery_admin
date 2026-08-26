import { api } from "@/lib/api";
import { toNumber } from "@/lib/format";

/**
 * Variants hang off a product: /products/:productId/variants, mounted at the
 * API root (confirmed — the route answers with JSON, not the Express 404
 * page). The two GETs are public; create, update, status and delete are
 * admin-only.
 */
const base = (productId) => `/products/${productId}/variants`;

/** Attributes are free-form on the model — { size: "A5", colour: "red" }. */
export function describeAttributes(attributes) {
  if (!attributes || typeof attributes !== "object") return "";
  return Object.entries(attributes)
    .filter(([key]) => key)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" · ");
}

function normalizeVariant(variant = {}) {
  const attributes =
    variant.attributes && typeof variant.attributes === "object"
      ? variant.attributes
      : {};

  return {
    id: variant._id || variant.id,
    productId: variant.product?._id || variant.product || null,
    name: variant.name || "—",
    price: toNumber(variant.price),
    compareAtPrice:
      variant.compareAtPrice === null || variant.compareAtPrice === undefined
        ? null
        : toNumber(variant.compareAtPrice),
    stock: toNumber(variant.stock),
    attributes,
    attributesLabel: describeAttributes(attributes),
    isActive: variant.isActive !== false,
  };
}

export const variantService = {
  /**
   * GET /products/:productId/variants
   *
   * Public, and it filters on `isActive: true` for both the product and its
   * variants. Two consequences for an admin screen: variants of a hidden
   * product 404, and a soft-deleted variant can never be listed again — so
   * nothing can reach updateVariantStatus to bring one back.
   */
  list: async (productId, options) => {
    const payload = await api.get(base(productId), options);
    const variants = payload?.data?.variants;
    return Array.isArray(variants) ? variants.map(normalizeVariant) : [];
  },

  /**
   * POST /products/:productId/variants — { name, price } required;
   * compareAtPrice (>= price, or null), stock (defaults 0) and attributes
   * optional. The controller flips the product's `hasVariants` to true.
   */
  create: (productId, data) => api.post(base(productId), data),

  /** PUT /products/:productId/variants/:variantId */
  update: (productId, variantId, data) =>
    api.put(`${base(productId)}/${variantId}`, data),

  /** PATCH /products/:productId/variants/:variantId/status — { isActive } */
  setStatus: (productId, variantId, isActive) =>
    api.patch(`${base(productId)}/${variantId}/status`, { isActive }),

  /**
   * DELETE /products/:productId/variants/:variantId — soft delete. When the
   * last active variant goes, the controller clears the product's
   * `hasVariants` flag.
   */
  remove: (productId, variantId) =>
    api.delete(`${base(productId)}/${variantId}`),
};
