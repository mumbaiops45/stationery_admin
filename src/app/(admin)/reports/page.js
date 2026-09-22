"use client";

import { useState } from "react";

import { Icon } from "@/components/icons";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
  StatTile,
} from "@/components/ui";
import { RankedBarChart, TimeAreaChart, TimeColumnChart } from "@/components/charts";
import {
  formatDateTime,
  formatMoney,
  formatMoneyCompact,
  formatNumber,
  percent,
} from "@/lib/format";
import { exportReportToExcel } from "@/lib/reportExport";
import { useReports } from "@/hooks/useReports";
import { PERIODS } from "@/services/report.service";

/** Axis ticks stay compact; tooltips and tables carry the exact figure. */
function compact(value) {
  const n = Number(value) || 0;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(Math.round(n));
}

export default function ReportsPage() {
  const { period, setPeriod, report, error, loading, refreshing } = useReports();
  const [showTable, setShowTable] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const periodLabel =
    PERIODS.find((entry) => entry.value === period)?.label || period;

  async function handleExport() {
    if (!report) return;
    setExporting(true);
    setExportError("");
    try {
      await exportReportToExcel(report, { periodLabel });
    } catch (err) {
      setExportError(err.message || "Could not build the Excel file.");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Reports" subtitle="How the store has been trading." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((n) => (
            <div key={n} className="rounded-2xl border border-line bg-card p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-4 h-7 w-16" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
          ))}
        </div>
        <div className="h-64 rounded-2xl border border-line bg-card" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-5">
        <PageHeader title="Reports" subtitle="How the store has been trading." />
        <Alert>{error}</Alert>
      </div>
    );
  }

  const { summary, revenue, payments, dailySales, topProducts } = report;
  const deliveredRate = percent(summary.deliveredOrders, summary.totalOrders);
  const cancelledRate = percent(summary.cancelledOrders, summary.totalOrders);
  const paymentTotal = payments.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        subtitle={
          report.period.from
            ? `${formatDateTime(report.period.from)} — ${formatDateTime(report.period.to)}`
            : "How the store has been trading."
        }
      />

      <Alert>{error}</Alert>
      <Alert>{exportError}</Alert>

      {/* One filter row, above everything it scopes. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-ink-soft">Period</span>
        <span className="flex rounded-lg border border-line bg-canvas p-0.5">
          {PERIODS.map((entry) => (
            <button
              key={entry.value}
              type="button"
              onClick={() => setPeriod(entry.value)}
              aria-pressed={period === entry.value}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                period === entry.value
                  ? "bg-card text-ink shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {entry.label}
            </button>
          ))}
        </span>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="ml-auto"
          disabled={!report}
          loading={exporting}
          onClick={handleExport}
        >
          <Icon name="download" className="h-4 w-4" />
          Download Excel
        </Button>
      </div>

      {/* Holding the previous render at reduced opacity beats a skeleton
          flash: no layout jump when the period changes. */}
      <div
        className={`space-y-5 transition-opacity duration-200 ${
          refreshing ? "opacity-50" : "opacity-100"
        }`}
      >
        {/* Hero figure — exactly one per view. */}
        <Card bodyClass="px-5 py-6 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-ink-soft">
                Revenue · last {periodLabel}
              </p>
              <p className="mt-1 text-5xl font-semibold tracking-tight text-ink">
                {formatMoney(revenue.total)}
              </p>
              <p className="mt-1.5 text-sm text-ink-soft">
                {formatMoney(revenue.subtotal)} in goods ·{" "}
                {formatMoney(revenue.shipping)} shipping
              </p>
            </div>
            <dl className="flex gap-6">
              <div>
                <dt className="text-xs text-ink-soft">Orders</dt>
                <dd className="mt-0.5 text-xl font-semibold text-ink">
                  {formatNumber(summary.totalOrders)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-soft">Delivered</dt>
                <dd className="mt-0.5 text-xl font-semibold text-brand-teal">
                  {deliveredRate}%
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-soft">Cancelled</dt>
                <dd className="mt-0.5 text-xl font-semibold text-brand-coral">
                  {cancelledRate}%
                </dd>
              </div>
            </dl>
          </div>
        </Card>

        {/* Catalogue context — counts, so tiles rather than charts. */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Customers"
            value={formatNumber(summary.totalCustomers)}
            note="All time"
            icon="users"
            tone="purple"
            href="/users"
          />
          <StatTile
            label="Products"
            value={formatNumber(summary.totalProducts)}
            note="All time"
            icon="products"
            tone="blue"
            href="/products"
          />
          <StatTile
            label="Categories"
            value={formatNumber(summary.totalCategories)}
            note="All time"
            icon="categories"
            tone="teal"
            href="/categories"
          />
          <StatTile
            label="Cancelled orders"
            value={formatNumber(summary.cancelledOrders)}
            note={`of ${formatNumber(summary.totalOrders)} this period`}
            icon="warning"
            tone="coral"
          />
        </div>

        {/* Revenue and orders share a period but not a scale, so they get two
            charts rather than two y-axes on one plot. */}
        {dailySales.length === 0 ? (
          <Card title="Daily trading" description={`Last ${periodLabel}`}>
            <EmptyState
              title="No captured sales in this period"
              description="Only captured, non-cancelled orders count towards these charts. Try a longer period."
            />
          </Card>
        ) : (
          <>
            <div className="grid gap-5 xl:grid-cols-2">
              <Card
                title="Revenue per day"
                description={`Captured orders · last ${periodLabel}`}
                bodyClass="px-3 pb-2 pt-4"
              >
                <TimeAreaChart
                  data={dailySales}
                  valueKey="revenue"
                  color="var(--chart-revenue)"
                  formatValue={compact}
                  label="Revenue"
                />
              </Card>

              <Card
                title="Orders per day"
                description={`Captured orders · last ${periodLabel}`}
                bodyClass="px-3 pb-2 pt-4"
              >
                <TimeColumnChart
                  data={dailySales}
                  valueKey="orders"
                  color="var(--chart-orders)"
                  formatValue={compact}
                  label="Orders"
                />
              </Card>
            </div>

            {/* The table twin: every plotted value, reachable without colour
                or hover. */}
            <Card
              title="Daily figures"
              description={`${dailySales.length} trading days`}
              actions={
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowTable((open) => !open)}
                >
                  {showTable ? "Hide table" : "Show table"}
                </Button>
              }
              bodyClass={showTable ? "" : "hidden"}
            >
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-line">
                      <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
                        Date
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-ink-soft">
                        Orders
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-ink-soft">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailySales.map((day) => (
                      <tr key={day.date} className="border-b border-line/70 last:border-0">
                        <td className="px-4 py-2 font-mono text-xs text-ink">{day.date}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-ink">
                          {formatNumber(day.orders)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-ink">
                          {formatMoney(day.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        <div className="grid gap-5 xl:grid-cols-2">
          {/* Ranked magnitude — one hue for every bar. */}
          <Card
            title="Top products"
            description={`By units sold · last ${periodLabel}`}
            bodyClass="px-5 py-4"
          >
            {topProducts.length === 0 ? (
              <EmptyState
                title="Nothing sold yet"
                description="Products appear here once an order containing them is captured."
              />
            ) : (
              <RankedBarChart
                color="var(--chart-revenue)"
                formatValue={(value) => `${formatNumber(value)} sold`}
                rows={topProducts.map((product) => ({
                  id: product.id,
                  label: product.name,
                  value: product.quantity,
                  note: `${formatMoney(product.revenue)} revenue`,
                }))}
              />
            )}
          </Card>

          {/* Five statuses with two figures each: a table reads better than
              any chart, and status colours stay on the badges. */}
          <Card
            title="Payment attempts"
            description={`${formatNumber(paymentTotal)} in the last ${periodLabel}`}
          >
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Status
                  </th>
                  <th className="px-5 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Count
                  </th>
                  <th className="px-5 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((row) => (
                  <tr key={row.key} className="border-b border-line/70 last:border-0">
                    <td className="px-5 py-2.5">
                      <Badge tone={row.tone}>{row.label}</Badge>
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-ink">
                      {formatNumber(row.count)}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-ink">
                      {formatMoneyCompact(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
