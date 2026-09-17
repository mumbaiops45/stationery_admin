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
  Modal,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Skeleton,
  StatTile,
} from "@/components/ui";
import { formatDateTime, formatMoney, formatNumber, formatRelative } from "@/lib/format";
import { useDashboard } from "@/hooks/useDashboard";
import { useOrders } from "@/hooks/useOrders";
import {
  ORDER_SORTS,
  ORDER_STATUSES,
  PAGE_SIZES,
  PAYMENT_STATUSES,
  orderStatusMeta,
  orderTotals,
  paymentStatusMeta,
} from "@/services/order.service";

const INITIAL_PARAMS = {
  page: 1,
  limit: 20,
  search: "",
  orderStatus: "all",
  paymentStatus: "all",
  sort: "newest",
};

/** Initials for the customer avatar, e.g. "Asha Rao" → "AR". */
function initials(name) {
  return String(name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}

export default function OrdersPage() {
  const orders = useOrders(INITIAL_PARAMS);
  // Store-wide totals; the list only knows its own filter.
  const { stats, derived, loading: summaryLoading } = useDashboard();

  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState(null);

  function apply(patch = {}) {
    orders.setParams({ search: query.trim(), ...patch, page: 1 });
  }

  function resetFilters() {
    setQuery("");
    orders.setParams(INITIAL_PARAMS);
  }

  const activeFilters =
    (orders.params.search ? 1 : 0) +
    (orders.params.orderStatus !== "all" ? 1 : 0) +
    (orders.params.paymentStatus !== "all" ? 1 : 0) +
    (orders.params.sort !== "newest" ? 1 : 0);

  const columns = [
    {
      key: "order",
      header: "Order",
      render: (row) => (
        <span className="block">
          <span className="block font-mono text-xs font-semibold text-ink">
            {row.orderNumber}
          </span>
          <span className="block text-xs text-ink-soft" title={formatDateTime(row.createdAt)}>
            {formatRelative(row.createdAt)}
          </span>
        </span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (row) => (
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-purple/10 text-[11px] font-semibold text-brand-purple">
            {initials(row.customer.name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm text-ink">{row.customer.name}</span>
            <span className="block truncate text-xs text-ink-soft">
              {row.customer.email || row.customer.phone || "—"}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "items",
      header: "Items",
      align: "right",
      render: (row) => (
        <span className="text-ink-soft">{formatNumber(row.itemCount)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const meta = orderStatusMeta(row.orderStatus);
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: "payment",
      header: "Payment",
      render: (row) => {
        const meta = paymentStatusMeta(row.paymentStatus);
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (row) => (
        <span className="font-semibold text-ink">{formatMoney(row.total)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <IconButton
          icon="eye"
          tone="brand"
          label={`View order ${row.orderNumber}`}
          onClick={() => setViewing(row)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Orders"
        subtitle="Every order placed through the storefront."
      />

      <Alert>{orders.error}</Alert>

      {/* Store-wide totals */}
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
              label="All orders"
              value={formatNumber(stats.orders.total)}
              note={`${formatNumber(stats.orders.delivered)} delivered`}
              icon="orders"
              tone="purple"
            />
            <StatTile
              label="In progress"
              value={formatNumber(derived.orders.open)}
              note="Confirmed through out for delivery"
              icon="inventory"
              tone="blue"
            />
            <StatTile
              label="Cancelled"
              value={formatNumber(stats.orders.cancelled)}
              note={`${derived.orders.cancelledRate}% of all orders`}
              icon="warning"
              tone="coral"
            />
            <StatTile
              label="Revenue"
              value={formatMoney(stats.sales.total, stats.sales.currency)}
              note={`${formatNumber(stats.payments.captured)} captured payments`}
              icon="currency"
              tone="teal"
              href="/payments"
            />
          </>
        ) : null}
      </div>

      <Card title="All orders" description={`${orders.total} total`}>
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
            placeholder="Search order number"
            className="min-w-[160px] flex-1"
          />

          {/* Widths live on the wrapper: the controls themselves are w-full. */}
          <div className="w-40 shrink-0">
            <Select
              size="sm"
              value={orders.params.orderStatus || "all"}
              onChange={(event) => apply({ orderStatus: event.target.value })}
            >
              <option value="all">All statuses</option>
              {ORDER_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-36 shrink-0">
            <Select
              size="sm"
              value={orders.params.paymentStatus || "all"}
              onChange={(event) => apply({ paymentStatus: event.target.value })}
            >
              <option value="all">All payments</option>
              {PAYMENT_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-36 shrink-0">
            <Select
              size="sm"
              value={orders.params.sort || "newest"}
              onChange={(event) => apply({ sort: event.target.value })}
            >
              {ORDER_SORTS.map((option) => (
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
                value={orders.params.limit || 20}
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
          rows={orders.items}
          rowKey={(row) => row.id}
          loading={orders.loading}
          empty={
            <EmptyState
              title="No orders found"
              description={
                activeFilters > 0
                  ? "No order matches these filters. Note that search matches the order number only."
                  : "Orders placed through the storefront appear here."
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
          page={orders.page}
          pages={orders.pages}
          total={orders.total}
          onChange={orders.setPage}
        />
      </Card>

      {/* Detail — rendered from the row, since the API has no admin
          GET /orders/:id and the list already returns the whole document. */}
      <Modal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        size="lg"
        title={viewing ? `Order ${viewing.orderNumber}` : ""}
        description={viewing ? formatDateTime(viewing.createdAt) : ""}
        footer={
          <Button variant="secondary" onClick={() => setViewing(null)}>
            Close
          </Button>
        }
      >
        {viewing ? (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge tone={orderStatusMeta(viewing.orderStatus).tone}>
                {orderStatusMeta(viewing.orderStatus).label}
              </Badge>
              <Badge tone={paymentStatusMeta(viewing.paymentStatus).tone}>
                Payment: {paymentStatusMeta(viewing.paymentStatus).label}
              </Badge>
              {viewing.deliveredAt ? (
                <Badge tone="success">
                  Delivered {formatRelative(viewing.deliveredAt)}
                </Badge>
              ) : null}
              {viewing.cancelledAt ? (
                <Badge tone="danger">
                  Cancelled {formatRelative(viewing.cancelledAt)}
                </Badge>
              ) : null}
            </div>

            {/* Items */}
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                Items
              </h3>
              <ul className="mt-2.5 divide-y divide-line rounded-xl border border-line">
                {viewing.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-3.5 py-3">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-lg border border-line bg-white object-contain"
                      />
                    ) : (
                      <span className="h-10 w-10 shrink-0 rounded-lg border border-dashed border-line" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {item.name}
                      </span>
                      <span className="block truncate text-xs text-ink-soft">
                        {item.variantName ? `${item.variantName} · ` : ""}
                        {formatMoney(item.price)} × {item.quantity}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-ink">
                      {formatMoney(item.itemTotal)}
                    </span>
                  </li>
                ))}
              </ul>

              <ul className="mt-3 space-y-1.5 text-sm">
                {orderTotals(viewing).map((line) => (
                  <li
                    key={line.label}
                    className={`flex justify-between gap-4 ${
                      line.strong
                        ? "border-t border-line pt-1.5 font-semibold text-ink"
                        : "text-ink-soft"
                    }`}
                  >
                    <span>{line.label}</span>
                    <span>{line.value}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Customer */}
              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                  Customer
                </h3>
                <div className="mt-2.5 rounded-xl border border-line bg-canvas/60 px-3.5 py-3 text-sm">
                  <p className="font-medium text-ink">{viewing.customer.name}</p>
                  {viewing.customer.email ? (
                    <p className="mt-0.5 break-all text-xs text-ink-soft">
                      {viewing.customer.email}
                    </p>
                  ) : null}
                  {viewing.customer.phone ? (
                    <p className="text-xs text-ink-soft">{viewing.customer.phone}</p>
                  ) : null}
                </div>
              </section>

              {/* Shipping */}
              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                  Ship to
                </h3>
                <div className="mt-2.5 rounded-xl border border-line bg-canvas/60 px-3.5 py-3 text-sm">
                  <p className="font-medium text-ink">{viewing.address.name}</p>
                  {viewing.address.lines.map((line) => (
                    <p key={line} className="text-xs text-ink-soft">
                      {line}
                    </p>
                  ))}
                  <p className="text-xs text-ink-soft">
                    {[viewing.address.city, viewing.address.state, viewing.address.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p className="text-xs text-ink-soft">{viewing.address.country}</p>
                  {viewing.address.phone ? (
                    <p className="mt-1 text-xs text-ink-soft">{viewing.address.phone}</p>
                  ) : null}
                </div>
              </section>
            </div>

            {/* Payment references */}
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                Payment reference
              </h3>
              <dl className="mt-2.5 space-y-1.5 rounded-xl border border-line bg-canvas/60 px-3.5 py-3 text-xs">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-soft">Razorpay order</dt>
                  <dd className="break-all font-mono text-ink">
                    {viewing.payment.razorpayOrderId || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-soft">Razorpay payment</dt>
                  <dd className="break-all font-mono text-ink">
                    {viewing.payment.razorpayPaymentId || "—"}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
