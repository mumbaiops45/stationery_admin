import { create } from "zustand";

import { ApiError } from "@/lib/api";
import { dashboardService, getDashboardPath } from "@/services/dashboard.service";
import { useAuthStore } from "@/store/auth.store";

/**
 * The dashboard counters live in a store rather than in the page because
 * several places want them: the dashboard itself, the reports screen, and the
 * sidebar badges later on. Keeping one copy means one request per visit
 * instead of one per consumer.
 *
 * `load()` is idempotent while a request is in flight — mounting three
 * consumers at once still only hits the API once.
 */

/** Counters older than this are refetched when a consumer mounts again. */
const STALE_AFTER_MS = 60_000;

let inFlight = null;

const EMPTY = {
  stats: null,
  status: "idle", // idle | loading | ready | error
  error: null,
  loadedAt: null,
};

function messageFor(error) {
  if (error instanceof ApiError && error.status === 404) {
    return `The dashboard endpoint was not found at ${getDashboardPath()}. Set NEXT_PUBLIC_DASHBOARD_PATH to the route the API mounts it on.`;
  }
  if (error instanceof ApiError && error.status === 403) {
    return "This account is not allowed to read the admin dashboard.";
  }
  return error?.message || "Could not load the dashboard.";
}

export const useDashboardStore = create((set, get) => ({
  ...EMPTY,

  /**
   * Fetches the counters.
   *
   * @param {object}  [options]
   * @param {boolean} [options.force] refetch even if the cache is still fresh
   */
  load: async ({ force = false } = {}) => {
    const { status, loadedAt } = get();

    if (inFlight) return inFlight;

    const fresh = loadedAt && Date.now() - loadedAt < STALE_AFTER_MS;
    if (!force && status === "ready" && fresh) return get().stats;

    // Keep the previous numbers on screen while refreshing, so a manual
    // refresh does not blank the tiles.
    set({ status: "loading", error: null });

    inFlight = (async () => {
      try {
        const stats = await dashboardService.getStats();
        set({ stats, status: "ready", error: null, loadedAt: Date.now() });
        return stats;
      } catch (error) {
        if (error?.name === "AbortError") return get().stats;
        set({ status: "error", error: messageFor(error) });
        return null;
      } finally {
        inFlight = null;
      }
    })();

    return inFlight;
  },

  refresh: () => get().load({ force: true }),

  /** Drops the cache — called when the session ends. */
  reset: () => {
    inFlight = null;
    set({ ...EMPTY });
  },

  clearError: () => set({ error: null }),
}));

// Admin counters belong to a session. When it ends, so do they — otherwise the
// next admin to sign in on this tab sees the previous one's numbers first.
useAuthStore.subscribe((state, previous) => {
  if (previous?.status === "authenticated" && state.status !== "authenticated") {
    useDashboardStore.getState().reset();
  }
});
