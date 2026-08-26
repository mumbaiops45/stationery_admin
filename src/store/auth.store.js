import { create } from "zustand";

import {
  ApiError,
  refreshAccessToken,
  setAccessToken,
  setSessionExpiredHandler,
} from "@/lib/api";
import { authService } from "@/services/auth.service";

const ADMIN_ROLES = ["admin"];

function isAdmin(user) {
  if (!user?.role) return false;

  return ADMIN_ROLES.includes(
    String(user.role).toLowerCase()
  );
}

function normalizeUser(payload) {
  return payload?.data?.user || payload?.user || null;
}

export const useAuthStore = create((set, get) => ({
  user: null,
  // idle → the session has not been checked yet
  status: "idle", // idle | checking | authenticated | guest
  error: null,
  submitting: false,

  /**
   * Called once on mount. There is no token in memory after a reload, so ask
   * the API to mint one from the httpOnly refresh cookie, then load the user.
   */
  bootstrap: async () => {
    if (get().status !== "idle") return;
    set({ status: "checking" });

    try {
      await refreshAccessToken();
      const user = normalizeUser(await authService.me());

      if (!isAdmin(user)) {
        setAccessToken(null);
        set({ user: null, status: "guest" });
        return;
      }

      set({ user, status: "authenticated" });
    } catch {
      // No valid cookie — a normal first visit.
      setAccessToken(null);
      set({ user: null, status: "guest" });
    }
  },

  /** POST /auth/login, then keep the access token in memory. */
  login: async ({ email, password }) => {
    set({ submitting: true, error: null });

    try {
      const payload = await authService.login({ email, password });
      const user = normalizeUser(payload);
      const token = payload?.data?.accessToken;

      if (!isAdmin(user)) {
        setAccessToken(null);
        await authService.logout().catch(() => {});
        const message = "This account does not have admin access.";
        set({ submitting: false, error: message, user: null, status: "guest" });
        return { ok: false, message };
      }

      setAccessToken(token);
      set({ user, status: "authenticated", submitting: false, error: null });
      return { ok: true, user };
    } catch (error) {
      // ApiError already carries the API's own message, or the network/CORS
      // explanation built in lib/api.js.
      const message =
        error instanceof ApiError
          ? error.message
          : error.message || "Login failed. Please try again.";
      set({ submitting: false, error: message });
      return { ok: false, message };
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Logging out locally matters more than the request succeeding.
    }
    setAccessToken(null);
    set({ user: null, status: "guest", error: null });
  },

  /** Wipes the session when a refresh fails mid-flight. */
  expire: () => {
    setAccessToken(null);
    set({ user: null, status: "guest" });
  },

  clearError: () => set({ error: null }),
}));

// Let the API layer drop the session when a refresh is rejected.
setSessionExpiredHandler(() => {
  const { status, expire } = useAuthStore.getState();
  if (status === "authenticated") expire();
});
