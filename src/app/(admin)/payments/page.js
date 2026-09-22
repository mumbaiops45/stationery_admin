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
  IconButton,
  Modal,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
} from "@/components/ui";
import { formatDateTime, formatMoney, formatRelative } from "@/lib/format";
import { exportRowsToExcel, todayStamp } from "@/lib/excel";
import { fetchAllPages } from "@/lib/fetchAllPages";
import { usePayments } from "@/hooks/usePayments";
import {
  PAGE_SIZES,
  PAYMENT_SORTS,
  PAYMENT_STATUSES,
  paymentService,
  paymentStatusMeta,
} from "@/services/payment.service";

const INITIAL_PARAMS = {
  page: 1,
  limit: 20,
  search: "",
  status: "all",
  sort: "newest",
};

function initials(name) {
  return String(name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}

export default function PaymentsPage() {
  const payments = usePayments(INITIAL_PARAMS);

  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  function apply(patch = {}) {
    payments.setParams({ search: query.trim(), ...patch, page: 1 });
  }

  function resetFilters() {
    setQuery("");
    payments.setParams(INITIAL_PARAMS);
  }

  async function handleExport() {
    setExporting(true);
    setExportError("");
    try {
      const rows = await fetchAllPages(paymentService.list, payments.params);
      await exportRowsToExcel({
        fileName: `payments-${todayStamp()}.xlsx`,
        sheetName: "Payments",
        columns: [
          { header: "Razorpay order ID", key: "razorpayOrderId", width: 26 },
          { header: "Razorpay payment ID", key: "razorpayPaymentId", width: 26 },
          { header: "Customer", key: "customerName", width: 22 },
          { header: "Email", key: "customerEmail", width: 26 },
          { header: "Phone", key: "customerPhone", width: 16 },
          { header: "Amount (₹)", key: "amount", width: 14, numFmt: "#,##0.00", align: "right" },
          { header: "Currency", key: "currency", width: 10 },
          { header: "Status", key: "status", width: 14 },
          { header: "Failure reason", key: "failureReason", width: 28 },
          { header: "Verified at", key: "verifiedAt", width: 20 },
          { header: "Created", key: "createdAt", width: 20 },
        ],
        rows: rows.map((payment) => ({
          razorpayOrderId: payment.razorpayOrderId || "",
          razorpayPaymentId: payment.razorpayPaymentId || "",
          customerName: payment.customer.name || "",
          customerEmail: payment.customer.email || "",
          customerPhone: payment.customer.phone || "",
          amount: payment.amount,
          currency: payment.currency || "INR",
          status: paymentStatusMeta(payment.status).label,
          failureReason: payment.failureReason || "",
          verifiedAt: payment.verifiedAt ? formatDateTime(payment.verifiedAt) : "",
          createdAt: payment.createdAt ? formatDateTime(payment.createdAt) : "",
        })),
      });
    } catch (err) {
      setExportError(err.message || "Could not build the Excel file.");
    } finally {
      setExporting(false);
    }
  }

  const activeFilters =
    (payments.params.search ? 1 : 0) +
    (payments.params.status !== "all" ? 1 : 0) +
    (payments.params.sort !== "newest" ? 1 : 0);

  const columns = [
    {
      key: "reference",
      header: "Reference",
      render: (row) => (
        <span className="block min-w-0">
          <span className="block truncate font-mono text-xs font-semibold text-ink">
            {row.razorpayPaymentId || row.razorpayOrderId}
          </span>
          <span
            className="block text-xs text-ink-soft"
            title={formatDateTime(row.createdAt)}
          >
            {row.razorpayPaymentId ? "payment id" : "order id — not paid yet"} ·{" "}
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
      key: "status",
      header: "Status",
      render: (row) => {
        const meta = paymentStatusMeta(row.status);
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: "verified",
      header: "Verified",
      render: (row) => (
        <span className="text-xs text-ink-soft">
          {row.verifiedAt ? formatRelative(row.verifiedAt) : "—"}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (row) => (
        <span className="font-semibold text-ink">
          {formatMoney(row.amount, row.currency)}
        </span>
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
          label={`View payment ${row.razorpayPaymentId || row.razorpayOrderId}`}
          onClick={() => setViewing(row)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payments"
        subtitle="Every Razorpay attempt, including the ones that never became an order."
      />

      <Alert>{payments.error}</Alert>
      <Alert>{exportError}</Alert>

      <Card
        title="All payments"
        description={`${payments.total} total`}
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
            placeholder="Search Razorpay order or payment id"
            className="min-w-[160px] flex-1"
          />

          {/* Widths live on the wrapper: the controls themselves are w-full. */}
          <div className="w-36 shrink-0">
            <Select
              size="sm"
              value={payments.params.status || "all"}
              onChange={(event) => apply({ status: event.target.value })}
            >
              <option value="all">All statuses</option>
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
              value={payments.params.sort || "newest"}
              onChange={(event) => apply({ sort: event.target.value })}
            >
              {PAYMENT_SORTS.map((option) => (
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
                value={payments.params.limit || 20}
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
          rows={payments.items}
          rowKey={(row) => row.id}
          loading={payments.loading}
          empty={
            <EmptyState
              title="No payments found"
              description={
                activeFilters > 0
                  ? "Nothing matches these filters. Note that search matches the Razorpay ids only."
                  : "Checkout attempts appear here as soon as one is started."
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
          page={payments.page}
          pages={payments.pages}
          total={payments.total}
          onChange={payments.setPage}
        />
      </Card>

      {/* Detail — rendered from the row. GET <mount>/:id exists and returns
          the same fields, so it would only add a round trip; it is the
          endpoint to use if payments ever get their own deep-linked route. */}
      <Modal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title="Payment"
        description={viewing ? formatDateTime(viewing.createdAt) : ""}
        footer={
          <Button variant="secondary" onClick={() => setViewing(null)}>
            Close
          </Button>
        }
      >
        {viewing ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-line bg-canvas/60 px-4 py-3.5 text-center">
              <p className="text-2xl font-semibold tracking-tight text-ink">
                {formatMoney(viewing.amount, viewing.currency)}
              </p>
              <p className="mt-1.5">
                <Badge tone={paymentStatusMeta(viewing.status).tone}>
                  {paymentStatusMeta(viewing.status).label}
                </Badge>
              </p>
            </div>

            {viewing.failureReason ? (
              <Alert>{viewing.failureReason}</Alert>
            ) : null}

            <dl className="divide-y divide-line rounded-xl border border-line">
              {[
                { label: "Customer", value: viewing.customer.name },
                { label: "Email", value: viewing.customer.email || "—" },
                { label: "Phone", value: viewing.customer.phone || "—" },
                {
                  label: "Verified",
                  value: viewing.verifiedAt
                    ? formatDateTime(viewing.verifiedAt)
                    : "Not verified",
                },
                { label: "Created", value: formatDateTime(viewing.createdAt) },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-4 px-3.5 py-2.5 text-sm"
                >
                  <dt className="text-ink-soft">{row.label}</dt>
                  <dd className="min-w-0 truncate text-right font-medium text-ink">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>

            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                Razorpay reference
              </h3>
              <dl className="mt-2.5 space-y-1.5 rounded-xl border border-line bg-canvas/60 px-3.5 py-3 text-xs">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-soft">Order id</dt>
                  <dd className="break-all font-mono text-ink">
                    {viewing.razorpayOrderId || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-soft">Payment id</dt>
                  <dd className="break-all font-mono text-ink">
                    {viewing.razorpayPaymentId || "Not issued"}
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
