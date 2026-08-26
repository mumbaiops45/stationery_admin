"use client";

import { useEffect, useMemo } from "react";

import { percent, toNumber } from "@/lib/format";
import { OPEN_ORDER_KEYS, ORDER_STAGES } from "@/services/dashboard.service";
import { useDashboardStore } from "@/store/dashboard.store";

/**
 * Everything the raw counters imply, derived once per payload.
 *
 * The API returns counts only, so anything comparative — rates, shares, an
 * average order value — is worked out here rather than in the markup.
 */
function derive(stats) {
  if (!stats) return null;

  const { orders, payments, products, variants, sales } = stats;

  const open = OPEN_ORDER_KEYS.reduce((sum, key) => sum + toNumber(orders[key]), 0);

  const stages = ORDER_STAGES.map((stage) => ({
    ...stage,
    count: toNumber(orders[stage.key]),
    share: percent(orders[stage.key], orders.total),
  }));

  const paymentAttempts =
    payments.captured + payments.failed + payments.refunded;

  return {
    orders: {
      open,
      stages,
      // The pipeline bar only shows what is still moving.
      activeStages: stages.filter((stage) => OPEN_ORDER_KEYS.includes(stage.key)),
      deliveredRate: percent(orders.delivered, orders.total),
      cancelledRate: percent(orders.cancelled, orders.total),
    },

    payments: {
      attempts: paymentAttempts,
      successRate: percent(payments.captured, paymentAttempts),
      failureRate: percent(payments.failed, paymentAttempts),
    },

    sales: {
      // Sales are summed over captured, non-cancelled orders, so that is the
      // right denominator for an average — not every order ever placed.
      averageOrderValue: payments.captured
        ? sales.total / payments.captured
        : 0,
    },

    inventory: {
      // A product and a variant are separate rows to restock, so alerts add up
      // across both rather than being deduplicated.
      lowStock: products.lowStock + variants.lowStock,
      outOfStock: products.outOfStock + variants.outOfStock,
      alerts:
        products.lowStock +
        products.outOfStock +
        variants.lowStock +
        variants.outOfStock,
    },

    users: {
      activeRate: percent(stats.users.active, stats.users.total),
    },
  };
}

/**
 * Reads the admin dashboard counters.
 *
 * Fetches on mount through the shared store, so mounting this in two places
 * costs one request. Pass `{ auto: false }` to fetch manually instead.
 */
export function useDashboard({ auto = true } = {}) {
  const stats = useDashboardStore((s) => s.stats);
  const status = useDashboardStore((s) => s.status);
  const error = useDashboardStore((s) => s.error);
  const loadedAt = useDashboardStore((s) => s.loadedAt);
  const load = useDashboardStore((s) => s.load);
  const refresh = useDashboardStore((s) => s.refresh);
  const clearError = useDashboardStore((s) => s.clearError);

  useEffect(() => {
    if (auto) load();
  }, [auto, load]);

  const derived = useMemo(() => derive(stats), [stats]);

  return {
    stats,
    derived,
    status,
    error,
    loadedAt,
    refresh,
    clearError,
    /**
     * Nothing to render yet — covers "idle" (the effect has not run) as well
     * as an in-flight first request, but never an outright failure: with no
     * stats and no pending request the page shows the error, not a skeleton
     * that would spin forever.
     */
    loading: !stats && status !== "error",
    /** A reload behind numbers that are already on screen. */
    refreshing: status === "loading" && Boolean(stats),
  };
}
