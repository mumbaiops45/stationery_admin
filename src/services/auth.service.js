import { api } from "@/lib/api";

/**
 * Only the endpoints an admin console needs.
 *
 * register / forgot-password / reset-password / verify-email exist on the API
 * but are customer-facing, so they are deliberately not wired up here.
 *
 * The three below were confirmed live by probe — each answers 401 rather than
 * the Express 404 page — and note the methods: change-password is a PATCH,
 * not the POST or PUT you might expect.
 */
export const authService = {
  /** POST /auth/login — { email, password } */
  login: (credentials) =>
    api.post("/auth/login", credentials, {
      auth: false,
      retryOnUnauthorized: false,
    }),

  /** GET /auth/me — current admin, using the in-memory access token */
  me: () => api.get("/auth/me"),

  /** POST /auth/logout — revokes the refresh token and clears the cookie */
  logout: () =>
    api.post("/auth/logout", null, {
      auth: false,
      retryOnUnauthorized: false,
    }),

  /**
   * PATCH /auth/change-password
   *
   * The field names here are the conventional pair and are not confirmed
   * against the controller — if it reads `oldPassword`, this is the one line
   * to change. The 8-character minimum mirrors the User schema.
   */
  changePassword: ({ currentPassword, newPassword }) =>
    api.patch("/auth/change-password", { currentPassword, newPassword }),

  /** POST /auth/logout-all — revokes every refresh token for this account */
  logoutAll: () => api.post("/auth/logout-all"),

  /** POST /auth/send-verification — re-sends the verification email */
  sendVerification: () => api.post("/auth/send-verification"),
};
