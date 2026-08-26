import { api, createEndpointResolver } from "@/lib/api";
import { toNumber } from "@/lib/format";

/**
 * The inventory router mounts `protect` + `adminOnly` on the whole router and
 * answers "/" for the list. Its mount path is not visible from this repo, so
 * the candidates are probed once. Pin it with NEXT_PUBLIC_INVENTORY_PATH.
 */
const endpoint = createEndpointResolver(
  process.env.NEXT_PUBLIC_INVENTORY_PATH
    ? [process.env.NEXT_PUBLIC_INVENTORY_PATH]
    : ["/admin/inventory", "/inventory"],
);

export const getInventoryPath = endpoint.path;

/**
 * The controller's own banding: 0 is out, 1-10 is low, above 10 is in stock.
 * Anything here that disagrees would label rows differently from the filter
 * that produced them.
 */
export const LOW_STOCK_AT = 10;

export const STOCK_STATUSES = [
  { value: "all", label: "All stock levels" },
  { value: "in_stock", label: "In stock" },
  { value: "low_stock", label: `Low stock (1-${LOW_STOCK_AT})` },
  { value: "out_of_stock", label: "Out of stock" },
];

/** The controller clamps `limit` to 100. */
export const PAGE_SIZES = [20, 50, 100];

export function stockState(stock) {
  const level = toNumber(stock);
  if (level <= 0) return "out";
  return level <= LOW_STOCK_AT ? "low" : "in";
}

export const STOCK_STATE_META = {
  out: { label: "Out of stock", tone: "danger" },
  low: { label: "Low", tone: "warning" },
  in: { label: "In stock", tone: "success" },
};

/* ------------------------------------------------------------------ */
/* Normalisation                                                       */
/* ------------------------------------------------------------------ */

function normalizeProduct(row = {}) {
  return {
    id: row._id || row.id,
    kind: "product",
    name: row.name || "—",
    context: row.category?.name || "Uncategorised",
    price: toNumber(row.price),
    stock: toNumber(row.stock),
    hasVariants: row.hasVariants === true,
    isActive: row.isActive !== false,
  };
}

/** Variant attributes arrive as a Map/object, e.g. { size: "A5" }. */
function describeAttributes(attributes) {
  if (!attributes || typeof attributes !== "object") return "";
  return Object.entries(attributes)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" · ");
}

function normalizeVariant(row = {}) {
  const attributes = describeAttributes(row.attributes);

  return {
    id: row._id || row.id,
    kind: "variant",
    name: row.name || attributes || "—",
    context: row.product?.name || "Orphaned variant",
    attributes,
    price: toNumber(row.price),
    stock: toNumber(row.stock),
    hasVariants: false,
    isActive: row.isActive !== false,
  };
}

/**
 * The inventory envelope is unlike the other lists: two independent
 * collections, each with its own total, under one `page`/`limit`.
 *
 * The result keeps the useResource contract at the top level (products, the
 * primary list) and carries the variant list alongside, so the page can swap
 * between them without a second request.
 */
function normalizeInventory(payload) {
  const data = payload?.data ?? payload ?? {};
  const meta = data.pagination || {};

  const limit = toNumber(meta.limit) || 20;
  const page = toNumber(meta.page) || 1;

  const products = {
    items: Array.isArray(data.products) ? data.products.map(normalizeProduct) : [],
    total: toNumber(meta.products?.total),
    pages: Math.max(toNumber(meta.products?.totalPages), 1),
  };

  const variants = {
    items: Array.isArray(data.variants) ? data.variants.map(normalizeVariant) : [],
    total: toNumber(meta.variants?.total),
    pages: Math.max(toNumber(meta.variants?.totalPages), 1),
  };

  return {
    // useResource contract
    items: products.items,
    total: products.total,
    pages: products.pages,
    page,
    limit,
    // both lists, addressed by name
    products,
    variants,
    filters: data.filters || {},
  };
}

export const inventoryService = {
  /** GET <mount>/ — search, stockStatus, page, limit. */
  list: async (params = {}, options) =>
    normalizeInventory(
      await endpoint.get({
        ...options,
        params: {
          search: params.search,
          stockStatus: params.stockStatus,
          page: params.page,
          limit: params.limit,
        },
      }),
    ),

  /**
   * PATCH <mount>/product/:id — { stock }.
   * 400 when the product has variants: their stock is authoritative.
   */
  setProductStock: (productId, stock) =>
    api.patch(`${endpoint.path()}/product/${productId}`, { stock: Number(stock) }),

  /** PATCH <mount>/variant/:id — { stock }. */
  setVariantStock: (variantId, stock) =>
    api.patch(`${endpoint.path()}/variant/${variantId}`, { stock: Number(stock) }),
};
