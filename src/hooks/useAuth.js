"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/store/auth.store";

/** Session state + actions. */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const submitting = useAuthStore((s) => s.submitting);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const clearError = useAuthStore((s) => s.clearError);

  return {
    user,
    status,
    error,
    submitting,
    login,
    logout,
    clearError,
    isAuthenticated: status === "authenticated",
    isChecking: status === "idle" || status === "checking",
  };
}

/** Restores the session from the refresh cookie once per page load. */
export function useSessionBootstrap() {
  const status = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    if (status === "idle") bootstrap();
  }, [status, bootstrap]);

  return status;
}

/** Guards the admin pages: bounces guests to /login. */
export function useRequireAuth() {
  const router = useRouter();
  const status = useSessionBootstrap();

  useEffect(() => {
    if (status === "guest") router.replace("/login");
  }, [status, router]);

  return status;
}

/** Keeps a signed-in admin from sitting on the login page. */
export function useRedirectIfAuthenticated(target = "/dashboard") {
  const router = useRouter();
  const status = useSessionBootstrap();

  useEffect(() => {
    if (status === "authenticated") router.replace(target);
  }, [status, router, target]);

  return status;
}
