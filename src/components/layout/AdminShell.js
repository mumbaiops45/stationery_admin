"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useAuth } from "@/hooks/useAuth";

/**
 * The chrome every admin page sits inside: sidebar + header + main.
 *
 * It owns the only piece of layout state — whether the mobile drawer is open —
 * so Sidebar and Topbar stay presentational.
 */
export function AdminShell({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [navOpen, setNavOpen] = useState(false);

  // A route change always closes the drawer, including on back/forward where
  // no link was clicked. Adjusted during render rather than in an effect, so
  // the drawer never paints open for a frame on the new route.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setNavOpen(false);
  }

  // The drawer is an overlay on small screens, so the page behind it must not
  // scroll underneath.
  useEffect(() => {
    if (!navOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [navOpen]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen flex-1 bg-canvas">
      <Sidebar
        open={navOpen}
        onClose={() => setNavOpen(false)}
        user={user}
        onLogout={handleLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onOpenNav={() => setNavOpen(true)}
          user={user}
          onLogout={handleLogout}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
