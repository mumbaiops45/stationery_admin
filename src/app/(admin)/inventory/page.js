"use client";

import { useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  IconButton,
  Input,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Skeleton,
  StatTile,
} from "@/components/ui";
import { formatMoney, formatNumber } from "@/lib/format";
import { useDashboard } from "@/hooks/useDashboard";
import { useInventory } from "@/hooks/useInventory";
import {
  LOW_STOCK_AT,
  PAGE_SIZES,
  STOCK_STATE_META,
  STOCK_STATUSES,
  stockState,
} from "@/services/inventory.service";

const INITIAL_PARAMS = {
  page: 1,
  limit: 20,
  search: "",
  stockStatus: "all",
};

const TABS = [
  { id: "products", label: "Products" },
  { id: "variants", label: "Variants" },
];

export default function InventoryPage() {
  const inventory = useInventory(INITIAL_PARAMS);
  // The per-status totals are counted across the whole catalogue by the
  // dashboard endpoint; the inventory list only knows its own filter.
  const { stats, derived, loading: summaryLoading } = useDashboard();

  const [tab, setTab] = useState("products");
  const [query, setQuery] = useState("");
  // Edited-but-unsaved stock values, keyed by row id.
  const [drafts, setDrafts] = useState({});

  const active = tab === "variants" ? inventory.variants : inventory.products;

  function apply(patch = {}) {
    setDrafts({});
    inventory.setParams({ search: query.trim(), ...patch, page: 1 });
  }

  function switchTab(next) {
    setTab(next);
    setDrafts({});
    // Both lists came back in the same response, but they paginate
    // independently — page 3 of variants is not page 3 of products.
    if (inventory.params.page !== 1) inventory.setParams({ page: 1 });
  }

  async function saveRow(row) {
    const outcome = await inventory.save(row, drafts[row.id]);
    if (outcome.ok) {
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
    }
  }

  const activeFilters =
    (inventory.params.search ? 1 : 0) +
    (inventory.params.stockStatus && inventory.params.stockStatus !== "all" ? 1 : 0);

  /* ---------------------------------------------------------------- */
  /* Table                                                             */
  /* ---------------------------------------------------------------- */

  const columns = [
    {
      key: "item",
      header: tab === "variants" ? "Variant" : "Product",
      render: (row) => (
        <span className="block min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="truncate font-medium text-ink">{row.name}</span>
            {row.isActive ? null : <Badge tone="danger">Inactive</Badge>}
          </span>
          <span className="block truncate text-xs text-ink-soft">{row.context}</span>
        </span>
      ),
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      render: (row) => (
        <span className="text-ink-soft">{formatMoney(row.price)}</span>
      ),
    },
    {
      key: "level",
      header: "Level",
      render: (row) => {
        // A product with variants has no stock of its own to judge.
        if (row.hasVariants) {
          return <span className="text-xs text-ink-soft">Per variant</span>;
        }
        const meta = STOCK_STATE_META[stockState(row.stock)];
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: "stock",
      header: "On hand",
      align: "right",
      render: (row) => {
        // The API rejects a parent-stock write on a product with variants.
        if (row.hasVariants) {
          return <span className="text-xs text-ink-soft">—</span>;
        }

        const draft = drafts[row.id];
        const value = draft ?? String(row.stock);
        const dirty = draft !== undefined && Number(draft) !== row.stock;
        const invalid = dirty && (draft === "" || Number(draft) < 0);

        return (
          <span className="flex items-center justify-end gap-2">
            <span className="w-20">
              <Input
                size="sm"
                type="number"
                min="0"
                step="1"
                value={value}
                onChange={(event) =>
                  setDrafts({ ...drafts, [row.id]: event.target.value })
                }
                className="text-right"
                aria-label={`Stock for ${row.name}`}
              />
            </span>
            <IconButton
              type="button"
              icon="check"
              tone="brand"
              label={`Save stock for ${row.name}`}
              className={dirty && !invalid ? "bg-brand-purple/10 text-brand-purple" : ""}
              disabled={!dirty || invalid}
              loading={inventory.savingId === row.id}
              onClick={() => saveRow(row)}
            />
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory"
        subtitle={`Stock across the catalogue. Anything from 1 to ${LOW_STOCK_AT} counts as low.`}
      />

      <Alert>{inventory.error || inventory.saveError}</Alert>

      {/* Catalogue-wide totals */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryLoading ? (
          [0, 1, 2, 3].map((n) => (
            <div key={n} className="rounded-2xl border border-line bg-card p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-4 h-7 w-16" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
          ))
        ) : stats ? (
          <>
            <StatTile
              label="Out of stock"
              value={formatNumber(derived.inventory.outOfStock)}
              note={`${formatNumber(stats.products.outOfStock)} products · ${formatNumber(
                stats.variants.outOfStock,
              )} variants`}
              icon="warning"
              tone="coral"
            />
            <StatTile
              label="Low stock"
              value={formatNumber(derived.inventory.lowStock)}
              note={`${formatNumber(stats.products.lowStock)} products · ${formatNumber(
                stats.variants.lowStock,
              )} variants`}
              icon="inventory"
              tone="yellow"
            />
            <StatTile
              label="Products"
              value={formatNumber(stats.products.total)}
              note={`${formatNumber(stats.products.active)} active`}
              icon="products"
              tone="blue"
              href="/products"
            />
            <StatTile
              label="Variants"
              value={formatNumber(stats.variants.total)}
              note="Each carries its own stock"
              icon="categories"
              tone="teal"
            />
          </>
        ) : null}
      </div>

      <Card
        title="Stock levels"
        description={`${active.total} ${tab === "variants" ? "variants" : "products"} match`}
        actions={
          <span className="flex rounded-lg border border-line bg-canvas p-0.5">
            {TABS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => switchTab(entry.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tab === entry.id
                    ? "bg-card text-ink shadow-sm"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {entry.label}
              </button>
            ))}
          </span>
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
            placeholder={
              tab === "variants" ? "Search variant names" : "Search product names"
            }
            className="min-w-[160px] flex-1"
          />

          {/* Widths live on the wrapper: the controls themselves are w-full. */}
          <div className="w-44 shrink-0">
            <Select
              size="sm"
              value={inventory.params.stockStatus || "all"}
              onChange={(event) => apply({ stockStatus: event.target.value })}
            >
              {STOCK_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {activeFilters > 0 ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setQuery("");
                inventory.setParams(INITIAL_PARAMS);
              }}
            >
              Clear
            </Button>
          ) : null}

          <span className="ml-auto flex items-center gap-2 text-xs text-ink-soft">
            Per page
            <span className="w-20">
              <Select
                size="sm"
                value={inventory.params.limit || 20}
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
          rows={active.items}
          rowKey={(row) => row.id}
          loading={inventory.loading}
          empty={
            <EmptyState
              title={`No ${tab} found`}
              description={
                activeFilters > 0
                  ? "Nothing matches these filters. Try widening them."
                  : tab === "variants"
                    ? "No product variants exist yet."
                    : "Add products to start tracking stock."
              }
            />
          }
        />
        <Pagination
          page={inventory.page}
          pages={active.pages}
          total={active.total}
          onChange={(page) => {
            setDrafts({});
            inventory.setPage(page);
          }}
        />
      </Card>
    </div>
  );
}
