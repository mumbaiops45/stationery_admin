"use client";

import { useState } from "react";

import { Icon } from "@/components/icons";
import {
  Alert,
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  Field,
  FormSection,
  IconButton,
  Input,
  InputPrefix,
  Modal,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Textarea,
} from "@/components/ui";
import ImageUpload from "@/components/ImageUpload";
import { VariantsModal } from "@/components/VariantsModal";
import { formatDateTime, formatMoney, toNumber } from "@/lib/format";
import { exportRowsToExcel, todayStamp } from "@/lib/excel";
import { fetchAllPages } from "@/lib/fetchAllPages";
import { useCategoryOptions } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { PAGE_SIZES, PRODUCT_SORTS, productService } from "@/services/product.service";

/**
 * Query defaults. Every filter key is present from the start so `setParams`
 * only ever merges — an unset filter is "" and lib/api drops it from the
 * query string rather than sending `category=undefined`.
 */
const INITIAL_PARAMS = {
  page: 1,
  limit: 20,
  search: "",
  category: "",
  isActive: "",
  minPrice: "",
  maxPrice: "",
  inStock: "",
  sort: "newest",
};

/** Filters the user can clear, for the "N active" count. */
const CLEARABLE = [
  "search",
  "category",
  "isActive",
  "minPrice",
  "maxPrice",
  "inStock",
];

/** The subset kept behind the "More filters" disclosure. */
const ADVANCED = ["minPrice", "maxPrice", "inStock"];

const BLANK = {
  name: "",
  slug: "",
  price: "",
  compareAtPrice: "",
  stock: "",
  category: "",
  description: "",
  image: "",
};

export default function ProductsPage() {
  const products = useProducts(INITIAL_PARAMS);
  // Active categories only: the product controller rejects an inactive one,
  // so offering it in either dropdown would just produce a 400.
  const categories = useCategoryOptions();

  // Free-text filters are held locally and applied on submit; the selects
  // apply immediately but carry the draft along, so a half-typed price range
  // is not thrown away by changing the category.
  const [draft, setDraft] = useState({ search: "", minPrice: "", maxPrice: "" });
  // Price and stock sit behind a disclosure so the common case — search,
  // category, status, sort — stays on one line.
  const [showMore, setShowMore] = useState(false);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [formError, setFormError] = useState("");
  const [confirming, setConfirming] = useState(null);
  const [managing, setManaging] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  function apply(patch = {}) {
    products.setParams({
      search: draft.search.trim(),
      minPrice: draft.minPrice,
      maxPrice: draft.maxPrice,
      ...patch,
      page: 1,
    });
  }

  function resetFilters() {
    setDraft({ search: "", minPrice: "", maxPrice: "" });
    products.setParams(INITIAL_PARAMS);
  }

  async function handleExport() {
    setExporting(true);
    setExportError("");
    try {
      const rows = await fetchAllPages(productService.list, products.params);
      await exportRowsToExcel({
        fileName: `products-${todayStamp()}.xlsx`,
        sheetName: "Products",
        columns: [
          { header: "Name", key: "name", width: 32 },
          { header: "Slug", key: "slug", width: 28 },
          { header: "Category", key: "category", width: 20 },
          { header: "Price (₹)", key: "price", width: 14, numFmt: "#,##0.00", align: "right" },
          {
            header: "Compare price (₹)",
            key: "compareAtPrice",
            width: 18,
            numFmt: "#,##0.00",
            align: "right",
          },
          { header: "Stock", key: "stock", width: 14, align: "right" },
          { header: "Has variants", key: "hasVariants", width: 14 },
          { header: "Status", key: "status", width: 12 },
          { header: "Created", key: "createdAt", width: 20 },
        ],
        rows: rows.map((product) => ({
          name: product.name || "",
          slug: product.slug || "",
          category: product.category?.name || product.categoryName || "",
          price: toNumber(product.price),
          compareAtPrice:
            product.compareAtPrice != null ? toNumber(product.compareAtPrice) : "",
          stock: product.hasVariants ? "Per variant" : toNumber(product.stock ?? 0),
          hasVariants: product.hasVariants ? "Yes" : "No",
          status: product.isActive === false ? "Inactive" : "Active",
          createdAt: product.createdAt ? formatDateTime(product.createdAt) : "",
        })),
      });
    } catch (err) {
      setExportError(err.message || "Could not build the Excel file.");
    } finally {
      setExporting(false);
    }
  }

  const activeFilters =
    CLEARABLE.filter((key) => products.params[key]).length +
    (products.params.sort && products.params.sort !== "newest" ? 1 : 0);

  const advancedFilters = ADVANCED.filter((key) => products.params[key]).length;

  /* ---------------------------------------------------------------- */
  /* Form                                                              */
  /* ---------------------------------------------------------------- */

  function openCreate() {
    setForm(BLANK);
    setFormError("");
    setEditing({});
  }

  function openEdit(product) {
    setForm({
      name: product.name || "",
      slug: product.slug || "",
      price: product.price ?? "",
      compareAtPrice: product.compareAtPrice ?? "",
      stock: product.stock ?? 0,
      category: product.category?._id || product.category || "",
      description: product.description || "",
      image: product.image?.url || "",
    });
    setFormError("");
    setEditing(product);
  }

  async function handleSave(event) {
    event.preventDefault();

    // These mirror the controller's own checks, so a mistake is caught before
    // the round trip rather than coming back as a 400.
    if (form.name.trim().length < 2) {
      setFormError("Name must be at least 2 characters.");
      return;
    }
    if (!form.description.trim()) {
      setFormError("Description is required.");
      return;
    }
    if (!form.category) {
      setFormError("Pick a category.");
      return;
    }
    if (form.price === "" || Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
      setFormError("Enter a price of zero or more.");
      return;
    }
    if (
      form.compareAtPrice !== "" &&
      Number(form.compareAtPrice) < Number(form.price)
    ) {
      setFormError("Compare price must be at least the selling price.");
      return;
    }
    if (form.stock !== "" && Number(form.stock) < 0) {
      setFormError("Stock cannot be negative.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim(),
      category: form.category,
      price: Number(form.price),
      // null is how the API clears a compare price; undefined would leave the
      // existing one untouched on update.
      compareAtPrice:
        form.compareAtPrice === "" ? null : Number(form.compareAtPrice),
      stock: form.stock === "" ? 0 : Number(form.stock),
      image: { url: form.image.trim() },
      // hasVariants is deliberately not sent: createVariant sets it and
      // deleting the last variant clears it, so the API owns the flag. Sending
      // it from here would let a product edit silently contradict the variants
      // that actually exist.
    };

    const id = editing?._id || editing?.id;
    const outcome = id
      ? await products.update(id, payload)
      : await products.create(payload);

    if (outcome.ok) setEditing(null);
    else setFormError(outcome.message);
  }

  async function handleDelete() {
    const id = confirming?._id || confirming?.id;
    const outcome = await products.remove(id);
    if (outcome.ok) setConfirming(null);
  }

  const isEditing = Boolean(editing?._id || editing?.id);

  /* ---------------------------------------------------------------- */
  /* Table                                                             */
  /* ---------------------------------------------------------------- */

  const columns = [
    {
      key: "name",
      header: "Product",
      render: (row) => (
        <span className="flex items-center gap-3">
          {row.image?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.image.url}
              alt=""
              className="h-10 w-10 shrink-0 rounded-lg border border-line bg-white object-contain"
            />
          ) : (
            <span className="h-10 w-10 shrink-0 rounded-lg border border-dashed border-line" />
          )}
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="truncate font-medium text-ink">{row.name || "—"}</span>
              {row.hasVariants ? <Badge>Variants</Badge> : null}
            </span>
            {row.slug ? (
              <span className="block truncate font-mono text-xs text-ink-soft">
                {row.slug}
              </span>
            ) : null}
          </span>
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (row) => (
        <span className="text-ink-soft">
          {row.category?.name || row.categoryName || "—"}
        </span>
      ),
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      render: (row) => (
        <span className="block">
          <span className="font-medium text-ink">{formatMoney(row.price)}</span>
          {row.compareAtPrice ? (
            <span className="block text-xs text-ink-soft line-through">
              {formatMoney(row.compareAtPrice)}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      align: "right",
      render: (row) => {
        // A product with variants carries its stock on the variants, so the
        // number on the product itself is not the one to alarm about.
        if (row.hasVariants) {
          return <span className="text-xs text-ink-soft">Per variant</span>;
        }
        const stock = Number(row.stock ?? 0);
        return (
          <Badge tone={stock <= 0 ? "danger" : stock <= 5 ? "warning" : "success"}>
            {stock}
          </Badge>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <button
          type="button"
          onClick={() => products.setStatus(row._id || row.id, row.isActive === false)}
          title="Toggle availability"
        >
          <Badge tone={row.isActive === false ? "danger" : "success"}>
            {row.isActive === false ? "Inactive" : "Active"}
          </Badge>
        </button>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <span className="flex justify-end gap-0.5">
          <IconButton
            icon="layers"
            // The variant routes read through the product and require it to be
            // active, so this can only 404 on a hidden product.
            disabled={row.isActive === false}
            label={
              row.isActive === false
                ? "Reactivate the product to manage its variants"
                : "Manage variants"
            }
            onClick={() => setManaging(row)}
          />
          <IconButton
            icon="edit"
            tone="brand"
            label={`Edit ${row.name}`}
            onClick={() => openEdit(row)}
          />
          <IconButton
            icon="trash"
            tone="danger"
            label={`Delete ${row.name}`}
            onClick={() => setConfirming(row)}
          />
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products"
        subtitle="Everything on the shelf, with prices and stock levels."
        actions={<Button onClick={openCreate}>New product</Button>}
      />

      <Alert>{products.error}</Alert>
      <Alert>{exportError}</Alert>

      <Card
        title="All products"
        description={`${products.total} total`}
        actions={
          <span className="flex items-center gap-2">
            <Button size="sm" variant="secondary" loading={exporting} onClick={handleExport}>
              <Icon name="download" className="h-4 w-4" />
              Download Excel
            </Button>
            {activeFilters > 0 ? (
              <Button size="sm" variant="ghost" onClick={resetFilters}>
                Clear {activeFilters} filter{activeFilters === 1 ? "" : "s"}
              </Button>
            ) : null}
          </span>
        }
      >
        {/* Filter toolbar */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            apply();
          }}
          className="border-b border-line px-4 py-2.5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              size="sm"
              value={draft.search}
              onChange={(event) => setDraft({ ...draft, search: event.target.value })}
              placeholder="Search products"
              className="min-w-[160px] flex-1"
            />

            {/* Widths live on the wrapper: the controls themselves are w-full. */}
            <div className="w-40 shrink-0">
              <Select
                size="sm"
                value={products.params.category || ""}
                onChange={(event) => apply({ category: event.target.value })}
              >
                <option value="">All categories</option>
                {categories.items.map((category) => (
                  <option
                    key={category._id || category.id}
                    value={category._id || category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="w-32 shrink-0">
              <Select
                size="sm"
                value={products.params.isActive ?? ""}
                onChange={(event) => apply({ isActive: event.target.value })}
              >
                <option value="">All status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
            </div>

            <div className="w-40 shrink-0">
              <Select
                size="sm"
                value={products.params.sort || "newest"}
                onChange={(event) => apply({ sort: event.target.value })}
              >
                {PRODUCT_SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <Button
              type="button"
              size="sm"
              variant={showMore || advancedFilters > 0 ? "primary" : "secondary"}
              onClick={() => setShowMore((open) => !open)}
            >
              Filters{advancedFilters > 0 ? ` · ${advancedFilters}` : ""}
            </Button>

            {activeFilters > 0 ? (
              <Button type="button" size="sm" variant="ghost" onClick={resetFilters}>
                Clear
              </Button>
            ) : null}
          </div>

          {showMore ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-line pt-2.5">
              <span className="text-xs font-medium text-ink-soft">Price</span>
              <InputPrefix
                size="sm"
                prefix="₹"
                type="number"
                min="0"
                step="1"
                value={draft.minPrice}
                onChange={(event) =>
                  setDraft({ ...draft, minPrice: event.target.value })
                }
                placeholder="Min"
                className="w-24"
              />
              <span className="text-xs text-ink-soft">to</span>
              <InputPrefix
                size="sm"
                prefix="₹"
                type="number"
                min="0"
                step="1"
                value={draft.maxPrice}
                onChange={(event) =>
                  setDraft({ ...draft, maxPrice: event.target.value })
                }
                placeholder="Max"
                className="w-24"
              />

              <div className="w-36 shrink-0">
                <Select
                  size="sm"
                  value={products.params.inStock ?? ""}
                  onChange={(event) => apply({ inStock: event.target.value })}
                >
                  <option value="">Any stock</option>
                  <option value="true">In stock</option>
                  <option value="false">Out of stock</option>
                </Select>
              </div>

              <Button type="submit" size="sm" variant="secondary">
                Apply
              </Button>

              <span className="ml-auto flex items-center gap-2 text-xs text-ink-soft">
                Per page
                <span className="w-20">
                  <Select
                    size="sm"
                    value={products.params.limit || 20}
                    onChange={(event) => apply({ limit: Number(event.target.value) })}
                  >
                    {PAGE_SIZES.map((pageSize) => (
                      <option key={pageSize} value={pageSize}>
                        {pageSize}
                      </option>
                    ))}
                  </Select>
                </span>
              </span>
            </div>
          ) : null}
        </form>

        <DataTable
          columns={columns}
          rows={products.items}
          rowKey={(row) => row._id || row.id}
          loading={products.loading}
          empty={
            <EmptyState
              title="No products found"
              description={
                activeFilters > 0
                  ? "No product matches these filters. Try widening them."
                  : "Use New product to add the first item to the catalogue."
              }
              action={
                activeFilters > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3"
                    variant="secondary"
                    onClick={resetFilters}
                  >
                    Clear filters
                  </Button>
                ) : null
              }
            />
          }
        />
        <Pagination
          page={products.page}
          pages={products.pages}
          total={products.total}
          onChange={products.setPage}
        />
      </Card>

      {/* Create / edit */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        size="lg"
        title={isEditing ? "Edit product" : "New product"}
        description={
          isEditing
            ? "Update the details, pricing and stock for this product."
            : "Add an item to the catalogue. Fields marked * are required."
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" form="product-form" loading={products.saving}>
              {isEditing ? "Save changes" : "Create product"}
            </Button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSave} className="space-y-6">
          <Alert>{formError}</Alert>

          <FormSection
            title="Details"
            description="What the product is called and where it sits."
            columns={2}
          >
            <Field label="Name" required className="sm:col-span-2">
              <Input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="A5 spiral notebook"
                autoFocus
              />
            </Field>

            <Field label="Category" required>
              <Select
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
              >
                <option value="">Select a category</option>
                {categories.items.map((category) => (
                  <option
                    key={category._id || category.id}
                    value={category._id || category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Slug" hint="Derived from the name if left blank">
              <Input
                value={form.slug}
                onChange={(event) => setForm({ ...form, slug: event.target.value })}
                placeholder="a5-spiral-notebook"
              />
            </Field>

            <Field label="Description" required className="sm:col-span-2">
              <Textarea
                rows={3}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="80 pages, ruled, hard cover."
              />
            </Field>
          </FormSection>

          <FormSection
            title="Pricing and stock"
            description="Compare price is struck through in the shop."
            columns={2}
          >
            <Field label="Price" required>
              <InputPrefix
                prefix="₹"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                placeholder="120.00"
              />
            </Field>

            <Field
              label="Compare price"
              hint="Optional, at least the price"
            >
              <InputPrefix
                prefix="₹"
                type="number"
                min="0"
                step="0.01"
                value={form.compareAtPrice}
                onChange={(event) =>
                  setForm({ ...form, compareAtPrice: event.target.value })
                }
                placeholder="150.00"
              />
            </Field>

            <Field
              label="Stock on hand"
              className="sm:col-span-2"
              hint={editing?.hasVariants ? "Tracked on each variant" : undefined}
            >
              <Input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(event) => setForm({ ...form, stock: event.target.value })}
                placeholder="24"
                disabled={editing?.hasVariants === true}
              />
            </Field>

            {/* Not an input: the API sets hasVariants when the first variant
                is created and clears it when the last is deleted. */}
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-canvas/60 px-4 py-3 sm:col-span-2">
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-ink">
                  {editing?.hasVariants
                    ? "Stock is tracked per variant"
                    : "Stock is tracked on the product"}
                </span>
                <span className="block text-xs text-ink-soft">
                  {isEditing
                    ? "Adding the first variant switches this over; deleting the last one switches it back."
                    : "Create the product first, then add variants to it."}
                </span>
              </span>
              {isEditing ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setManaging(editing);
                    setEditing(null);
                  }}
                >
                  Manage variants
                </Button>
              ) : null}
            </div>
          </FormSection>

          <FormSection title="Image" description="Shown on the product card.">
            <ImageUpload
              label="Product image"
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
            />
          </FormSection>
        </form>
      </Modal>

      <VariantsModal product={managing} onClose={() => setManaging(null)} />

      {/* Delete confirmation */}
      <Modal
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title="Delete product"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={products.saving} onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          Delete <span className="font-semibold text-ink">{confirming?.name}</span>?
          The API soft-deletes it, so it is hidden from the shop rather than
          destroyed.
        </p>
        <Alert>{products.saveError}</Alert>
      </Modal>
    </div>
  );
}
