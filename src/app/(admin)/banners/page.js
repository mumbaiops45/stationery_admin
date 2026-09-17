"use client";

import { useState } from "react";

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
import { useBanners } from "@/hooks/useBanners";
import {
  BANNER_SORTS,
  BANNER_TYPES,
  PAGE_SIZES,
} from "@/services/banner.service";

/**
 * Query defaults, matching the admin controller's own. Every key is present
 * from the start so `setParams` only ever merges, and lib/api drops the empty
 * ones from the query string.
 */
const INITIAL_PARAMS = {
  page: 1,
  limit: 10,
  search: "",
  type: "",
  status: "",
  sort: "position_asc",
};

const BLANK = {
  type: "homepage",
  title: "",
  description: "",
  discount: "",
  image: "",
  link: "",
  buttonText: "",
  position: "0",
  startDate: "",
  endDate: "",
};

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** yyyy-mm-dd for a date <input>, from whatever shape the API sent back. */
function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export default function BannersPage() {
  const banners = useBanners(INITIAL_PARAMS);

  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null); // null | {} | banner
  const [form, setForm] = useState(BLANK);
  const [formError, setFormError] = useState("");
  const [confirming, setConfirming] = useState(null);

  function apply(patch = {}) {
    banners.setParams({ search: query.trim(), ...patch, page: 1 });
  }

  function resetFilters() {
    setQuery("");
    banners.setParams(INITIAL_PARAMS);
  }

  const activeFilters =
    (banners.params.search ? 1 : 0) +
    (banners.params.type ? 1 : 0) +
    (banners.params.status ? 1 : 0) +
    (banners.params.sort && banners.params.sort !== "position_asc" ? 1 : 0);

  /* ---------------------------------------------------------------- */
  /* Form                                                              */
  /* ---------------------------------------------------------------- */

  function openCreate() {
    setForm(BLANK);
    setFormError("");
    setEditing({});
  }

  function openEdit(banner) {
    setForm({
      type: banner.type || "homepage",
      title: banner.title || "",
      description: banner.description || "",
      discount: banner.discount || "",
      image: banner.image?.url || "",
      link: banner.link || "",
      buttonText: banner.buttonText || "",
      position: String(banner.position ?? 0),
      startDate: toDateInput(banner.startDate),
      endDate: toDateInput(banner.endDate),
    });
    setFormError("");
    setEditing(banner);
  }

  async function handleSave(event) {
    event.preventDefault();

    if (form.type === "offer" && !form.title.trim()) {
      setFormError("Banner title is required for offer banners.");
      return;
    }

    if (!form.image.trim()) {
      setFormError("Banner image is required.");
      return;
    }

    const isOffer = form.type === "offer";

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      discount: form.discount.trim(),
      image: form.image.trim(),
      type: form.type,
      position: Number(form.position) || 0,
      link: isOffer ? form.link.trim() : "",
      buttonText: isOffer ? form.buttonText.trim() : "",
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    };

    const id = editing?._id || editing?.id;
    const outcome = id
      ? await banners.update(id, payload)
      : await banners.create(payload);

    if (outcome.ok) setEditing(null);
    else setFormError(outcome.message);
  }

  async function handleDelete() {
    const id = confirming?._id || confirming?.id;
    const outcome = await banners.remove(id);
    if (outcome.ok) setConfirming(null);
  }

  const isEditing = Boolean(editing?._id || editing?.id);
  const isOfferForm = form.type === "offer";

  /* ---------------------------------------------------------------- */
  /* Table                                                             */
  /* ---------------------------------------------------------------- */

  const columns = [
    {
      key: "banner",
      header: "Banner",
      render: (row) => (
        <span className="flex items-center gap-3">
          {row.image?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.image.url}
              alt=""
              className="h-9 w-14 shrink-0 rounded-lg border border-line bg-white object-cover"
            />
          ) : (
            <span className="h-9 w-14 shrink-0 rounded-lg border border-dashed border-line" />
          )}
          <span className="min-w-0">
            <span className="block truncate font-medium text-ink">
              {row.title || row.description || "Untitled banner"}
            </span>
            {row.discount ? (
              <span className="block truncate text-xs text-ink-soft">
                {row.discount}
              </span>
            ) : null}
          </span>
        </span>
      ),
    },
    {
      key: "type",
      header: "Placement",
      render: (row) => (
        <Badge tone={row.type === "offer" ? "warning" : "neutral"}>
          {row.type === "offer" ? "Offer" : "Homepage"}
        </Badge>
      ),
    },
    {
      key: "schedule",
      header: "Schedule",
      render: (row) => {
        const start = formatDate(row.startDate);
        const end = formatDate(row.endDate);
        if (!start && !end) {
          return <span className="text-ink-soft">Always visible</span>;
        }
        return (
          <span className="text-ink-soft">
            {start || "Now"} → {end || "No end"}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <button
          type="button"
          onClick={() =>
            banners.setStatus(row._id || row.id, row.isActive === false)
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
            label={`Edit ${row.title || "banner"}`}
            onClick={() => openEdit(row)}
          />
          <IconButton
            icon="trash"
            tone="danger"
            label={`Delete ${row.title || "banner"}`}
            onClick={() => setConfirming(row)}
          />
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Banners"
        subtitle="Manage the homepage hero and offer banners shown in the shop."
        actions={<Button onClick={openCreate}>New banner</Button>}
      />

      <Alert>{banners.error}</Alert>

      <Card title="All banners" description={`${banners.total} total`}>
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
            placeholder="Search banners"
            className="min-w-[160px] flex-1"
          />

          {/* Widths live on the wrapper: the controls themselves are w-full. */}
          <div className="w-36 shrink-0">
            <Select
              size="sm"
              value={banners.params.type || ""}
              onChange={(event) => apply({ type: event.target.value })}
            >
              <option value="">All placements</option>
              {BANNER_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-32 shrink-0">
            <Select
              size="sm"
              value={banners.params.status || ""}
              onChange={(event) => apply({ status: event.target.value })}
            >
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>

          <div className="w-44 shrink-0">
            <Select
              size="sm"
              value={banners.params.sort || "position_asc"}
              onChange={(event) => apply({ sort: event.target.value })}
            >
              {BANNER_SORTS.map((option) => (
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
                value={banners.params.limit || 10}
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
          rows={banners.items}
          rowKey={(row) => row._id || row.id}
          loading={banners.loading}
          empty={
            <EmptyState
              title="No banners found"
              description={
                activeFilters > 0
                  ? "No banner matches these filters. Try widening them."
                  : "Use New banner to add a homepage hero or offer banner."
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
          page={banners.page}
          pages={banners.pages}
          total={banners.total}
          onChange={banners.setPage}
        />
      </Card>

      {/* Create / edit */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        size="lg"
        title={isEditing ? "Edit banner" : "New banner"}
        description={
          isEditing
            ? "Update how this banner appears in the shop."
            : "Add a hero banner for the homepage or a promo offer banner."
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" form="banner-form" loading={banners.saving}>
              {isEditing ? "Save changes" : "Create banner"}
            </Button>
          </>
        }
      >
        <form id="banner-form" onSubmit={handleSave} className="space-y-6">
          <Alert>{formError}</Alert>

          <FormSection
            title="Placement"
            description="Homepage banners only need an image, description and discount. Offer banners add a title, link and button."
            columns={2}
          >
            <Field label="Type" required>
              <Select
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value })}
              >
                {BANNER_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Position" hint="Lower shows first">
              <Input
                type="number"
                min="0"
                step="1"
                value={form.position}
                onChange={(event) =>
                  setForm({ ...form, position: event.target.value })
                }
              />
            </Field>
          </FormSection>

          <FormSection title="Details" columns={2}>
            <Field
              label="Title"
              required={isOfferForm}
              className={isOfferForm ? "" : "sm:col-span-2"}
            >
              <Input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Flat 30% off notebooks"
                autoFocus
              />
            </Field>

            {isOfferForm ? (
              <Field label="Discount" hint="Short label shown on the banner">
                <Input
                  value={form.discount}
                  onChange={(event) =>
                    setForm({ ...form, discount: event.target.value })
                  }
                  placeholder="Flat 30% OFF"
                />
              </Field>
            ) : (
              <Field
                label="Discount"
                hint="Short label shown on the banner"
                className="sm:col-span-2"
              >
                <Input
                  value={form.discount}
                  onChange={(event) =>
                    setForm({ ...form, discount: event.target.value })
                  }
                  placeholder="Flat 30% OFF"
                />
              </Field>
            )}

            <Field label="Description" className="sm:col-span-2">
              <Textarea
                rows={3}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="Shown under the title on the banner."
              />
            </Field>

            {isOfferForm ? (
              <>
                <Field label="Link" hint="Where the banner navigates to">
                  <Input
                    value={form.link}
                    onChange={(event) => setForm({ ...form, link: event.target.value })}
                    placeholder="/products/notebooks"
                  />
                </Field>

                <Field label="Button text">
                  <Input
                    value={form.buttonText}
                    onChange={(event) =>
                      setForm({ ...form, buttonText: event.target.value })
                    }
                    placeholder="Shop Now"
                  />
                </Field>
              </>
            ) : null}
          </FormSection>

          <FormSection
            title="Schedule"
            description="Leave blank to show the banner immediately with no expiry."
            columns={2}
          >
            <Field label="Start date">
              <Input
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  setForm({ ...form, startDate: event.target.value })
                }
              />
            </Field>

            <Field label="End date">
              <Input
                type="date"
                value={form.endDate}
                onChange={(event) => setForm({ ...form, endDate: event.target.value })}
              />
            </Field>
          </FormSection>

          <FormSection
            title="Image"
            description="Shown as the banner artwork in the shop."
          >
            <ImageUpload
              label="Banner image"
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
        title="Delete banner"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={banners.saving} onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          Delete{" "}
          <span className="font-semibold text-ink">
            {confirming?.title || confirming?.description || "this banner"}
          </span>
          ? This removes it from the shop and deletes its image — it cannot be
          undone.
        </p>
        <Alert>{banners.saveError}</Alert>
      </Modal>
    </div>
  );
}
