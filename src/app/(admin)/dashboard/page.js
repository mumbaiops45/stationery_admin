"use client";

import Link from "next/link";

import { Icon } from "@/components/icons";
import {
  Alert,
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  Skeleton,
  StatTile,
} from "@/components/ui";
import {
  formatMoney,
  formatMoneyCompact,
  formatNumber,
  formatRelative,
} from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { orderStatusMeta, paymentStatusMeta } from "@/services/order.service";

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

const BAR_TONES = {
  purple: "bg-brand-purple",
  teal: "bg-brand-teal",
  blue: "bg-brand-blue",
  yellow: "bg-brand-yellow",
  coral: "bg-brand-coral",
};

/** One labelled bar in the order pipeline. */
function BarRow({ label, count, share, tone = "purple" }) {
  return (
    <li>
      <span className="flex items-baseline justify-between gap-3 text-sm">
        <span className="truncate text-ink">{label}</span>
        <span className="shrink-0 text-ink-soft">
          <span className="font-mono text-xs">{share}%</span>
          <span className="ml-2 font-semibold text-ink">{formatNumber(count)}</span>
        </span>
      </span>
      <span className="mt-1.5 block h-2 w-full overflow-hidden rounded-full bg-canvas">
        <span
          className={`block h-full rounded-full transition-all duration-500 ${
            BAR_TONES[tone] || BAR_TONES.purple
          }`}
          style={{ width: `${Math.min(Math.max(share, count > 0 ? 3 : 0), 100)}%` }}
        />
      </span>
    </li>
  );
}

/** A label / value line inside a summary card. */
function MetricRow({ label, value, tone }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="flex min-w-0 items-center gap-2 text-ink-soft">
        {tone ? (
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              BAR_TONES[tone] || BAR_TONES.purple
            }`}
          />
        ) : null}
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 font-semibold text-ink">{value}</span>
    </li>
  );
}

function TileSkeletons({ count = 4 }) {
  return Array.from({ length: count }, (_, n) => (
    <div key={n} className="rounded-2xl border border-line bg-card p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-7 w-16" />
      <Skeleton className="mt-2 h-3 w-32" />
    </div>
  ));
}

function ListSkeleton({ rows = 5 }) {
  return (
    <ul className="space-y-4">
      {Array.from({ length: rows }, (_, n) => (
        <li key={n}>
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="mt-2 h-2 w-full rounded-full" />
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Recent orders table                                                 */
/* ------------------------------------------------------------------ */

function recentOrderColumns(currency) {
  return [
    {
      key: "order",
      header: "Order",
      render: (order) => (
        <span className="block">
          <span className="block font-mono text-xs font-semibold text-ink">
            {order.orderNumber}
          </span>
          <span className="block text-xs text-ink-soft">
            {formatRelative(order.createdAt)}
          </span>
        </span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (order) => (
        <span className="block min-w-0">
          <span className="block truncate text-sm text-ink">{order.customerName}</span>
          {order.customerEmail ? (
            <span className="block truncate text-xs text-ink-soft">
              {order.customerEmail}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (order) => {
        const meta = orderStatusMeta(order.orderStatus);
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: "payment",
      header: "Payment",
      render: (order) => {
        const meta = paymentStatusMeta(order.paymentStatus);
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (order) => (
        <span className="font-semibold text-ink">
          {formatMoney(order.total, currency)}
        </span>
      ),
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const { user } = useAuth();
  const { stats, derived, error, loading, refreshing, refresh, loadedAt } =
    useDashboard();

  const firstName = user?.name ? user.name.split(" ")[0] : null;
  const currency = stats?.sales.currency || "INR";

  // A first load that failed leaves nothing to render. Show why and offer a
  // retry, rather than tiles full of zeroes or a skeleton that never resolves.
  if (!stats && !loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`Welcome back${firstName ? `, ${firstName}` : ""}`}
          subtitle="Here is where the store stands right now."
        />
        <Alert>{error}</Alert>
        <Card>
          <EmptyState
            title="The dashboard could not be loaded"
            description="The admin counters come from a single endpoint. Check that the API is reachable and that this account still has admin access."
            action={
              <Button className="mt-3" loading={refreshing} onClick={() => refresh()}>
                Try again
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back${firstName ? `, ${firstName}` : ""}`}
        subtitle={
          loadedAt
            ? `Store activity as of ${formatRelative(loadedAt)}.`
            : "Here is where the store stands right now."
        }
        actions={
          <>
            <Button variant="secondary" loading={refreshing} onClick={() => refresh()}>
              Refresh
            </Button>
            <Link href="/products">
              <Button>New product</Button>
            </Link>
          </>
        }
      />

      <Alert>{error}</Alert>

      {/* Headline counters */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <TileSkeletons />
        ) : (
          <>
            <StatTile
              label="Total sales"
              value={formatMoneyCompact(stats.sales.total, currency)}
              note={`${formatNumber(stats.payments.captured)} captured payments`}
              icon="currency"
              tone="teal"
              href="/payments"
            />
            <StatTile
              label="Orders"
              value={formatNumber(stats.orders.total)}
              note={`${formatNumber(derived.orders.open)} still in progress`}
              icon="orders"
              tone="purple"
              href="/orders"
            />
            <StatTile
              label="Products"
              value={formatNumber(stats.products.total)}
              note={`${formatNumber(stats.products.active)} active · ${formatNumber(
                stats.variants.total,
              )} variants`}
              icon="products"
              tone="blue"
              href="/products"
            />
            <StatTile
              label="Customers"
              value={formatNumber(stats.users.customers)}
              note={`${formatNumber(stats.users.active)} active · ${formatNumber(
                stats.users.admins,
              )} admins`}
              icon="users"
              tone="yellow"
              href="/users"
            />
          </>
        )}
      </div>

      {/* Pipeline + payments */}
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card
            title="Order pipeline"
            description="Where every order currently sits"
            bodyClass="px-5 py-4"
            actions={
              <Link
                href="/orders"
                className="text-sm font-medium text-brand-purple hover:underline"
              >
                Manage
              </Link>
            }
          >
            {loading ? (
              <ListSkeleton rows={6} />
            ) : stats.orders.total === 0 ? (
              <EmptyState
                title="No orders yet"
                description="Once the storefront takes its first order it appears here."
              />
            ) : (
              <>
                <ul className="space-y-3.5">
                  {derived.orders.stages.map((stage) => (
                    <BarRow
                      key={stage.key}
                      label={stage.label}
                      count={stage.count}
                      share={stage.share}
                      tone={stage.tone}
                    />
                  ))}
                </ul>

                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-center">
                  <div>
                    <p className="text-lg font-semibold text-ink">
                      {formatNumber(derived.orders.open)}
                    </p>
                    <p className="text-xs text-ink-soft">Open</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-brand-teal">
                      {derived.orders.deliveredRate}%
                    </p>
                    <p className="text-xs text-ink-soft">Delivered</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-brand-coral">
                      {derived.orders.cancelledRate}%
                    </p>
                    <p className="text-xs text-ink-soft">Cancelled</p>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>

        <Card title="Payments" description="Settlement health" bodyClass="px-5 py-4">
          {loading ? (
            <ListSkeleton rows={4} />
          ) : (
            <>
              <p className="text-2xl font-semibold tracking-tight text-ink">
                {formatMoney(stats.sales.total, currency)}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                Captured revenue ·{" "}
                {formatMoney(derived.sales.averageOrderValue, currency)} average order
              </p>

              <ul className="mt-4 divide-y divide-line border-t border-line">
                <MetricRow
                  label="Captured"
                  tone="teal"
                  value={formatNumber(stats.payments.captured)}
                />
                <MetricRow
                  label="Failed"
                  tone="coral"
                  value={formatNumber(stats.payments.failed)}
                />
                <MetricRow
                  label="Refunded"
                  tone="yellow"
                  value={formatNumber(stats.payments.refunded)}
                />
              </ul>

              <p className="mt-3 rounded-xl bg-canvas px-3 py-2 text-xs text-ink-soft">
                {derived.payments.successRate}% of{" "}
                {formatNumber(derived.payments.attempts)} payment attempts were captured.
              </p>
            </>
          )}
        </Card>
      </div>

      {/* Recent orders + inventory */}
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card
            title="Recent orders"
            description="The five most recent orders"
            actions={
              <Link
                href="/orders"
                className="text-sm font-medium text-brand-purple hover:underline"
              >
                View all
              </Link>
            }
          >
            <DataTable
              columns={recentOrderColumns(currency)}
              rows={stats?.recentOrders || []}
              rowKey={(order) => order.id}
              loading={loading}
              empty={
                <EmptyState
                  title="No recent orders"
                  description="New orders show up here as soon as they are placed."
                />
              }
            />
          </Card>
        </div>

        <Card
          title="Inventory health"
          description="Products and variants needing a restock"
          bodyClass="px-5 py-4"
          actions={
            <Link
              href="/inventory"
              className="text-sm font-medium text-brand-purple hover:underline"
            >
              Restock
            </Link>
          }
        >
          {loading ? (
            <ListSkeleton rows={4} />
          ) : (
            <>
              <div
                className={`flex items-center gap-3 rounded-xl px-3.5 py-3 ${
                  derived.inventory.alerts > 0
                    ? "bg-brand-coral/10 text-brand-coral"
                    : "bg-brand-teal/10 text-brand-teal"
                }`}
              >
                <Icon
                  name={derived.inventory.alerts > 0 ? "warning" : "inventory"}
                  className="h-5 w-5 shrink-0"
                />
                <span className="text-sm font-medium">
                  {derived.inventory.alerts > 0
                    ? `${formatNumber(derived.inventory.alerts)} items need attention`
                    : "Every item is well stocked"}
                </span>
              </div>

              <ul className="mt-3 divide-y divide-line">
                <MetricRow
                  label="Out of stock"
                  tone="coral"
                  value={formatNumber(derived.inventory.outOfStock)}
                />
                <MetricRow
                  label="Low stock"
                  tone="yellow"
                  value={formatNumber(derived.inventory.lowStock)}
                />
                <MetricRow
                  label="Inactive products"
                  value={formatNumber(stats.products.inactive)}
                />
                <MetricRow
                  label="Variants tracked"
                  value={formatNumber(stats.variants.total)}
                />
                <MetricRow
                  label="Suspended accounts"
                  value={formatNumber(stats.users.inactive)}
                />
              </ul>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
