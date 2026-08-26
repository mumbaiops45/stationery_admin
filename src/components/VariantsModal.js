"use client";

import { useState } from "react";

import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Field,
  IconButton,
  Input,
  InputPrefix,
  Modal,
  Spinner,
} from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { useVariants } from "@/hooks/useVariants";

const BLANK = {
  name: "",
  price: "",
  compareAtPrice: "",
  stock: "",
  attributes: [{ key: "", value: "" }],
};

/** Attribute rows → the plain object the API stores. */
function toAttributes(rows) {
  const attributes = {};
  for (const row of rows) {
    const key = row.key.trim();
    if (key) attributes[key] = row.value.trim();
  }
  return attributes;
}

/** The stored object → editable rows, always with one blank row to type in. */
function toRows(attributes) {
  const rows = Object.entries(attributes || {}).map(([key, value]) => ({
    key,
    value: String(value ?? ""),
  }));
  return rows.length ? rows : [{ key: "", value: "" }];
}

/**
 * Manage the variants of one product.
 *
 * `product` is the row from the product list; passing null closes the modal.
 */
export function VariantsModal({ product, onClose }) {
  const productId = product?._id || product?.id || null;
  const variants = useVariants(productId);

  const [editing, setEditing] = useState(null); // null | {} | variant
  const [form, setForm] = useState(BLANK);
  const [formError, setFormError] = useState("");
  const [confirming, setConfirming] = useState(null);

  const editingId = editing?.id ?? null;
  const confirmingId = confirming?.id ?? null;

  function openCreate() {
    setForm(BLANK);
    setFormError("");
    variants.clearError();
    setEditing({});
  }

  function openEdit(variant) {
    setForm({
      name: variant.name,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice ?? "",
      stock: variant.stock,
      attributes: toRows(variant.attributes),
    });
    setFormError("");
    variants.clearError();
    setEditing(variant);
  }

  async function handleSave(event) {
    event.preventDefault();

    // Mirrors the controller so a mistake is caught before the round trip.
    if (!form.name.trim()) {
      setFormError("Variant name is required.");
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
      setFormError("Compare price must be at least the variant price.");
      return;
    }
    if (form.stock !== "" && Number(form.stock) < 0) {
      setFormError("Stock cannot be negative.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      compareAtPrice:
        form.compareAtPrice === "" ? null : Number(form.compareAtPrice),
      stock: form.stock === "" ? 0 : Number(form.stock),
      attributes: toAttributes(form.attributes),
    };

    const outcome = editingId
      ? await variants.update(editingId, payload)
      : await variants.create(payload);

    if (outcome.ok) setEditing(null);
    else setFormError(outcome.message);
  }

  async function handleDelete() {
    if (!confirmingId) return;
    const outcome = await variants.remove(confirmingId);
    if (outcome.ok) setConfirming(null);
  }

  /**
   * Read the ids here, optionally, rather than inside the callbacks.
   *
   * The React Compiler lifts a callback's property reads into the memo-cache
   * comparison it emits at the top of the component, which runs on every
   * render — including the ones where these are still null. `confirming.id`
   * inside handleDelete became `$[13] !== confirming.id` in the render body
   * and threw before the dialog had ever been opened.
   */
  const isEditing = Boolean(editingId);

  return (
    <>
      <Modal
        open={product !== null}
        onClose={onClose}
        size="lg"
        title={product ? `Variants — ${product.name}` : ""}
        description="Size, colour or pack options. Each carries its own price and stock."
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button onClick={openCreate}>Add variant</Button>
          </>
        }
      >
        <Alert>{variants.error}</Alert>

        {variants.loading ? (
          <div className="grid place-items-center py-12">
            <Spinner className="h-6 w-6 text-brand-purple" />
          </div>
        ) : variants.items.length === 0 ? (
          <EmptyState
            title="No variants yet"
            description="Add one and this product starts tracking stock per variant instead of on the product itself."
          />
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {variants.items.map((variant) => (
              <li
                key={variant.id}
                className="flex flex-wrap items-center gap-3 px-3.5 py-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-ink">
                      {variant.name}
                    </span>
                    {variant.isActive ? null : <Badge tone="danger">Inactive</Badge>}
                  </span>
                  {variant.attributesLabel ? (
                    <span className="block truncate text-xs text-ink-soft">
                      {variant.attributesLabel}
                    </span>
                  ) : null}
                </span>

                <span className="shrink-0 text-right">
                  <span className="block text-sm font-medium text-ink">
                    {formatMoney(variant.price)}
                  </span>
                  {variant.compareAtPrice ? (
                    <span className="block text-xs text-ink-soft line-through">
                      {formatMoney(variant.compareAtPrice)}
                    </span>
                  ) : null}
                </span>

                <Badge
                  tone={
                    variant.stock <= 0
                      ? "danger"
                      : variant.stock <= 10
                        ? "warning"
                        : "success"
                  }
                >
                  {variant.stock} in stock
                </Badge>

                <span className="flex shrink-0 gap-0.5">
                  <IconButton
                    icon="edit"
                    tone="brand"
                    label={`Edit ${variant.name}`}
                    onClick={() => openEdit(variant)}
                  />
                  <IconButton
                    icon="trash"
                    tone="danger"
                    label={`Delete ${variant.name}`}
                    onClick={() => setConfirming(variant)}
                  />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {/* Create / edit a variant */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={isEditing ? "Edit variant" : "New variant"}
        description={
          isEditing
            ? "Update this option's price, stock and attributes."
            : "Name it the way a shopper would pick it, e.g. \"A5 — Ruled\"."
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" form="variant-form" loading={variants.saving}>
              {isEditing ? "Save changes" : "Create variant"}
            </Button>
          </>
        }
      >
        <form id="variant-form" onSubmit={handleSave} className="space-y-4">
          <Alert>{formError}</Alert>

          <Field label="Name" required>
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="A5 — Ruled"
              autoFocus
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
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

            <Field label="Compare price" hint="Optional">
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
          </div>

          <Field label="Stock on hand">
            <Input
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={(event) => setForm({ ...form, stock: event.target.value })}
              placeholder="24"
            />
          </Field>

          {/* Attributes — free-form key/value on the model */}
          <fieldset>
            <legend className="mb-1.5 text-[13px] font-semibold text-ink">
              Attributes
            </legend>
            <p className="mb-2 text-xs text-ink-soft">
              What makes this option different, e.g. size / A5. Blank rows are
              ignored.
            </p>

            <div className="space-y-2">
              {form.attributes.map((row, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    size="sm"
                    value={row.key}
                    onChange={(event) => {
                      const next = [...form.attributes];
                      next[index] = { ...row, key: event.target.value };
                      setForm({ ...form, attributes: next });
                    }}
                    placeholder="size"
                  />
                  <Input
                    size="sm"
                    value={row.value}
                    onChange={(event) => {
                      const next = [...form.attributes];
                      next[index] = { ...row, value: event.target.value };
                      setForm({ ...form, attributes: next });
                    }}
                    placeholder="A5"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label="Remove attribute"
                    disabled={form.attributes.length === 1}
                    onClick={() =>
                      setForm({
                        ...form,
                        attributes: form.attributes.filter((_, i) => i !== index),
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="mt-2"
              onClick={() =>
                setForm({
                  ...form,
                  attributes: [...form.attributes, { key: "", value: "" }],
                })
              }
            >
              Add attribute
            </Button>
          </fieldset>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title="Delete variant"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={variants.saving} onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          Delete <span className="font-semibold text-ink">{confirming?.name}</span>?
          The API soft-deletes it, but the variant list only ever returns active
          variants — so this one cannot be listed or restored from here
          afterwards. Deleting the last variant hands stock back to the product
          itself.
        </p>
        <Alert>{variants.saveError}</Alert>
      </Modal>
    </>
  );
}
