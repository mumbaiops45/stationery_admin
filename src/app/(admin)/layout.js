"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { Spinner } from "@/components/ui";
import { useRequireAuth } from "@/hooks/useAuth";

/**
 * The admin route group only does one thing: hold the session gate.
 * Everything visual lives in <AdminShell>, and the menu itself in
 * @/config/nav.
 */
export default function AdminLayout({ children }) {
  const status = useRequireAuth();

  // Nothing renders until the session is known, so protected data never
  // flashes on screen for a signed-out visitor.
  if (status !== "authenticated") {
    return (
      <div className="grid min-h-screen flex-1 place-items-center bg-canvas">
        <Spinner className="h-7 w-7 text-brand-purple" />
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
