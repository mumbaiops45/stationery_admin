"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/icons";
import { Brand, initials } from "@/components/layout/Brand";
import { NAV_SECTIONS, isActivePath } from "@/config/nav";

function NavLink({ item, onNavigate }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-brand-purple text-white shadow-sm"
          : "text-ink-soft hover:bg-canvas hover:text-ink"
      }`}
    >
      <Icon
        name={item.icon}
        className={`h-5 w-5 shrink-0 transition-colors ${
          active ? "text-white" : "text-ink-soft group-hover:text-brand-purple"
        }`}
      />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.soon ? (
        <span
          title="Waiting on the API"
          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
            active ? "bg-white/20 text-white" : "bg-canvas text-ink-soft"
          }`}
        >
          Soon
        </span>
      ) : null}
    </Link>
  );
}

/**
 * The admin sidebar: brand, the nav sections from @/config/nav, the signed-in
 * account card and sign-out.
 *
 * It is `fixed` below `lg` and slides in over a scrim; from `lg` up it is a
 * static column. All of its state (open / close) is owned by AdminShell.
 */
export function Sidebar({ open, onClose, user, onLogout }) {
  return (
    <>
      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-line bg-card transition-transform duration-300 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-line px-5">
          <Brand />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-soft hover:bg-canvas hover:text-ink lg:hidden"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {NAV_SECTIONS.map((section) => (
            <div key={section.id} className="mb-1 space-y-1">
              {section.title ? (
                <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                  {section.title}
                </p>
              ) : null}
              {section.items.map((item) => (
                <NavLink key={item.href} item={item} onNavigate={onClose} />
              ))}
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-line p-3">
          <Link
            href="/profile"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-canvas"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-purple/10 text-xs font-semibold text-brand-purple">
              {initials(user?.name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-ink">
                {user?.name || "Admin"}
              </span>
              <span className="block truncate text-xs text-ink-soft">
                {user?.email}
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={onLogout}
            className="group mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-canvas hover:text-brand-coral"
          >
            <Icon
              name="logout"
              className="h-5 w-5 shrink-0 transition-colors group-hover:text-brand-coral"
            />
            Logout
          </button>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-30 cursor-default bg-ink/30 lg:hidden"
        />
      ) : null}
    </>
  );
}
