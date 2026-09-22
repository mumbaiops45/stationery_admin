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
  Modal,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Textarea,
} from "@/components/ui";
import ImageUpload from "@/components/ImageUpload";
import { formatDateTime } from "@/lib/format";
import { exportRowsToExcel, todayStamp } from "@/lib/excel";
import { fetchAllPages } from "@/lib/fetchAllPages";
import { useCategories } from "@/hooks/useCategories";
import {
  CATEGORY_SORTS,
  PAGE_SIZES,
  categoryService,
  slugify,
} from "@/services/category.service";

/**
 * Query defaults, matching the admin controller's own. Every key is present
 * from the start so `setParams` only ever merges, and lib/api drops the empty
 * ones from the query string.
 */
const INITIAL_PARAMS = {
  page: 1,
  limit: 10,
  search: "",
  status: "",
  sort: "name_asc",
};

const BLANK = { name: "", slug: "", description: "", image: "" };

export default function CategoriesPage() {
  const categories = useCategories(INITIAL_PARAMS);

  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null); // null | {} | category
  const [form, setForm] = useState(BLANK);
  const [formError, setFormError] = useState("");
  const [confirming, setConfirming] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  function apply(patch = {}) {
    categories.setParams({ search: query.trim(), ...patch, page: 1 });
  }

  function resetFilters() {
    setQuery("");
    categories.setParams(INITIAL_PARAMS);
  }

  async function handleExport() {
    setExporting(true);
    setExportError("");
    try {
      const rows = await fetchAllPages(categoryService.list, categories.params);
      await exportRowsToExcel({
        fileName: `categories-${todayStamp()}.xlsx`,
        sheetName: "Categories",
        columns: [
          { header: "Name", key: "name", width: 28 },
          { header: "Slug", key: "slug", width: 28 },
          { header: "Description", key: "description", width: 40 },
          { header: "Status", key: "status", width: 12 },
          { header: "Created", key: "createdAt", width: 20 },
        ],
        rows: rows.map((category) => ({
          name: category.name || "",
          slug: category.slug || "",
          description: category.description || "",
          status: category.isActive === false ? "Inactive" : "Active",
          createdAt: category.createdAt ? formatDateTime(category.createdAt) : "",
        })),
      });
    } catch (err) {
      setExportError(err.message || "Could not build the Excel file.");
    } finally {
      setExporting(false);
    }
  }

  const activeFilters =
    (categories.params.search ? 1 : 0) +
    (categories.params.status ? 1 : 0) +
    (categories.params.sort && categories.params.sort !== "name_asc" ? 1 : 0);

  /* ---------------------------------------------------------------- */
  /* Form                                                              */
  /* ---------------------------------------------------------------- */

  function openCreate() {
    setForm(BLANK);
    setFormError("");
    setEditing({});
  }

  function openEdit(category) {
    setForm({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      image: category.image?.url || "",
    });
    setFormError("");
    setEditing(category);
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setFormError("Name is required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      // createCategory stores a supplied slug verbatim, so send it already
      // normalised. Omitted entirely when blank, which lets the API derive it.
      slug: form.slug.trim() ? slugify(form.slug) : undefined,
      description: form.description.trim(),
      image: { url: form.image.trim() },
    };

    const id = editing?._id || editing?.id;
    const outcome = id
      ? await categories.update(id, payload)
      : await categories.create(payload);

    if (outcome.ok) setEditing(null);
    else setFormError(outcome.message);
  }

  async function handleDelete() {
    const id = confirming?._id || confirming?.id;
    const outcome = await categories.remove(id);
    if (outcome.ok) setConfirming(null);
  }

  const isEditing = Boolean(editing?._id || editing?.id);
  const slugPreview = form.slug.trim()
    ? slugify(form.slug)
    : slugify(form.name);

  /* ---------------------------------------------------------------- */
  /* Table                                                             */
  /* ---------------------------------------------------------------- */

  const columns = [
    {
      key: "name",
      header: "Category",
      render: (row) => (
        <span className="flex items-center gap-3">
          {row.image?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.image.url}
              alt=""
              className="h-9 w-9 shrink-0 rounded-lg border border-line bg-white object-contain"
            />
          ) : (
            <span className="h-9 w-9 shrink-0 rounded-lg border border-dashed border-line" />
          )}
          <span className="min-w-0">
            <span className="block truncate font-medium text-ink">
              {row.name || "—"}
            </span>
            <span className="block truncate font-mono text-xs text-ink-soft">
              {row.slug || "—"}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (row) => (
        <span className="block max-w-xs truncate text-ink-soft">
          {row.description || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <button
          type="button"
          onClick={() =>
            categories.setStatus(row._id || row.id, row.isActive === false)
          }
          title="Toggle visibility"
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
        title="Categories"
        subtitle="Group the catalogue so products are easy to find."
        actions={<Button onClick={openCreate}>New category</Button>}
      />

      <Alert>{categories.error}</Alert>
      <Alert>{exportError}</Alert>

      <Card
        title="All categories"
        description={`${categories.total} total`}
        actions={
          <Button size="sm" variant="secondary" loading={exporting} onClick={handleExport}>
            <Icon name="download" className="h-4 w-4" />
            Download Excel
          </Button>
        }
      >
        {/* Filter toolbar */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            apply();
          }}
          className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5"
        >
          <SearchInput
            size="sm"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search categories"
            className="min-w-[160px] flex-1"
          />

          {/* Widths live on the wrapper: the controls themselves are w-full. */}
          <div className="w-32 shrink-0">
            <Select
              size="sm"
              value={categories.params.status || ""}
              onChange={(event) => apply({ status: event.target.value })}
            >
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>

          <div className="w-40 shrink-0">
            <Select
              size="sm"
              value={categories.params.sort || "name_asc"}
              onChange={(event) => apply({ sort: event.target.value })}
            >
              {CATEGORY_SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {activeFilters > 0 ? (
            <Button type="button" size="sm" variant="ghost" onClick={resetFilters}>
              Clear
            </Button>
          ) : null}

          <span className="ml-auto flex items-center gap-2 text-xs text-ink-soft">
            Per page
            <span className="w-20">
              <Select
                size="sm"
                value={categories.params.limit || 10}
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
        </form>

        <DataTable
          columns={columns}
          rows={categories.items}
          rowKey={(row) => row._id || row.id}
          loading={categories.loading}
          empty={
            <EmptyState
              title="No categories found"
              description={
                activeFilters > 0
                  ? "No category matches these filters. Try widening them."
                  : "Use New category to start organising the catalogue."
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
          page={categories.page}
          pages={categories.pages}
          total={categories.total}
          onChange={categories.setPage}
        />
      </Card>

      {/* Create / edit */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        size="lg"
        title={isEditing ? "Edit category" : "New category"}
        description={
          isEditing
            ? "Update how this group appears in the shop."
            : "Group products so the catalogue is easy to browse."
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" form="category-form" loading={categories.saving}>
              {isEditing ? "Save changes" : "Create category"}
            </Button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSave} className="space-y-6">
          <Alert>{formError}</Alert>

          <FormSection
            title="Details"
            description="How the category is named and described."
            columns={2}
          >
            <Field label="Name" required>
              <Input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Notebooks"
                autoFocus
              />
            </Field>

            <Field
              label="Slug"
              hint={slugPreview ? `/${slugPreview}` : "Derived from the name"}
            >
              <Input
                value={form.slug}
                onChange={(event) => setForm({ ...form, slug: event.target.value })}
                placeholder="notebooks"
              />
            </Field>

            <Field label="Description" className="sm:col-span-2">
              <Textarea
                rows={3}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="Ruled, plain and spiral notebooks."
              />
            </Field>
          </FormSection>

          <FormSection
            title="Image"
            description="Shown on the category card in the shop."
          >
            <ImageUpload
              label="Category image"
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
            />
          </FormSection>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title="Delete category"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={categories.saving} onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          Delete <span className="font-semibold text-ink">{confirming?.name}</span>?
          The API soft-deletes it, so it disappears from the shop but stays in
          this list under the Inactive filter. Products already pointing at it
          keep the link.
        </p>
        <Alert>{categories.saveError}</Alert>
      </Modal>
    </div>
  );
}
