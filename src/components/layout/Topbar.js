"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Icon } from "@/components/icons";
import { initials } from "@/components/layout/Brand";
import { findNavItem } from "@/config/nav";

function AccountMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);

  // Close on any outside click, and on Escape.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    window.addEventListener("click", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-xl border border-line px-2.5 py-1.5 transition-colors hover:bg-canvas"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-purple text-[11px] font-semibold text-white">
          {initials(user?.name)}
        </span>
        <span className="hidden max-w-32 truncate text-sm font-medium text-ink sm:block">
          {user?.name || "Admin"}
        </span>
        <Icon name="chevronDown" className="h-4 w-4 text-ink-soft" />
      </button>

      {open ? (
        <div
          role="menu"
          onClick={(event) => event.stopPropagation()}
          className="animate-drop-in absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-card shadow-lg"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-medium text-ink">
              {user?.name || "Admin"}
            </p>
            <p className="truncate text-xs text-ink-soft">{user?.email}</p>
          </div>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink transition-colors hover:bg-canvas"
          >
            <Icon name="profile" className="h-4 w-4 text-ink-soft" />
            Profile
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2.5 border-t border-line px-4 py-2.5 text-left text-sm text-brand-coral transition-colors hover:bg-canvas"
          >
            <Icon name="logout" className="h-4 w-4" />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Sticky header: drawer toggle, the current section's title, account menu. */
export function Topbar({ onOpenNav, user, onLogout }) {
  const pathname = usePathname();
  const current = findNavItem(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-card/90 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenNav}
          aria-label="Open navigation"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-ink transition-colors hover:bg-canvas lg:hidden"
        >
          <Icon name="menu" className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-ink">
            {current?.label || "Admin"}
          </h1>
          <p className="truncate text-xs text-ink-soft">
            ChoiceKraft · right choice to success
          </p>
        </div>
      </div>

      <AccountMenu user={user} onLogout={onLogout} />
    </header>
  );
}
