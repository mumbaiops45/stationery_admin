"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { Icon } from "@/components/icons";

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

const BUTTON_VARIANTS = {
  primary:
    "bg-brand-purple text-white hover:bg-brand-indigo disabled:opacity-60",
  secondary:
    "border border-line bg-card text-ink hover:bg-canvas disabled:opacity-60",
  danger:
    "bg-brand-coral text-white hover:brightness-95 disabled:opacity-60",
  ghost: "text-ink-soft hover:bg-canvas hover:text-ink disabled:opacity-60",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple disabled:cursor-not-allowed ${
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm"
      } ${BUTTON_VARIANTS[variant]} ${className}`}
    >
      {loading ? <Spinner className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

/**
 * Square icon-only button for table row actions.
 *
 * `label` is required and is not decoration: an icon alone has no accessible
 * name, so it becomes both the `aria-label` and the hover tooltip. The glyph
 * is 16px; the box is 36px on touch screens and tightens to 32px from `sm`
 * up, where a pointer makes the smaller target comfortable.
 */
export function IconButton({
  icon,
  label,
  tone = "neutral",
  className = "",
  disabled,
  loading = false,
  ...props
}) {
  const tones = {
    neutral: "text-ink-soft hover:bg-canvas hover:text-ink",
    brand: "text-ink-soft hover:bg-brand-purple/10 hover:text-brand-purple",
    danger: "text-ink-soft hover:bg-brand-coral/10 hover:text-brand-coral",
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-label={label}
      title={label}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors focus-visible:outline-2 sm:h-8 sm:w-8 focus-visible:outline-offset-2 focus-visible:outline-brand-purple disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ${tones[tone]} ${className}`}
    >
      {loading ? <Spinner className="h-4 w-4" /> : <Icon name={icon} className="h-4 w-4" />}
    </button>
  );
}

export function Spinner({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={`animate-spin ${className}`} fill="none">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        className="opacity-30"
      />
      <path
        d="M21 12a9 9 0 00-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Form controls                                                       */
/* ------------------------------------------------------------------ */

export function Field({ label, error, hint, required, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-baseline gap-1.5">
        <span className="text-[13px] font-semibold text-ink">{label}</span>
        {required ? (
          <span className="text-[13px] leading-none text-brand-coral">*</span>
        ) : null}
        {hint && !error ? (
          <span className="ml-auto text-[11px] text-ink-soft">{hint}</span>
        ) : null}
      </span>
      {children}
      {error ? (
        <span className="animate-drop-in mt-1.5 block text-xs font-medium text-brand-coral">
          {error}
        </span>
      ) : null}
    </label>
  );
}

/** A titled block of related fields inside a form. */
export function FormSection({ title, description, children, columns = 1 }) {
  return (
    <section className="border-b border-line pb-5 last:border-0 last:pb-0">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
        {title}
      </h3>
      {description ? (
        <p className="mt-1 text-xs text-ink-soft/80">{description}</p>
      ) : null}
      <div
        className={`mt-3.5 grid gap-4 ${
          columns === 2 ? "sm:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {children}
      </div>
    </section>
  );
}

/**
 * A focused `<input type="number">` steps its own value on a wheel scroll, so
 * scrolling the page with the pointer over the field silently edits it — a
 * typed 50 lands as 48 with no keystroke behind it. Dropping focus first
 * leaves the value alone and lets the scroll through to the page.
 */
function noWheelStep(type, onWheel) {
  if (type !== "number") return onWheel;

  return (event) => {
    event.currentTarget.blur();
    onWheel?.(event);
  };
}

/** Input with a fixed leading token, e.g. a currency symbol. */
export function InputPrefix({
  prefix,
  className = "",
  size = "md",
  onWheel,
  ...props
}) {
  const compact = size === "sm";

  return (
    <span
      className={`flex items-stretch overflow-hidden rounded-lg border border-line bg-card transition-all duration-200 focus-within:border-brand-purple focus-within:ring-2 focus-within:ring-brand-purple/15 ${className}`}
    >
      <span
        className={`grid place-items-center border-r border-line bg-canvas font-medium text-ink-soft ${
          compact ? "px-2 text-base sm:text-[13px]" : "px-3 text-base sm:text-sm"
        }`}
      >
        {prefix}
      </span>
      <input
        {...props}
        onWheel={noWheelStep(props.type, onWheel)}
        className={`w-full min-w-0 bg-transparent text-ink outline-none placeholder:text-ink-soft/50 disabled:opacity-60 ${
          compact
            ? "px-2.5 py-1.5 text-base sm:text-[13px]"
            : "px-3 py-2.5 text-base sm:text-sm"
        }`}
      />
    </span>
  );
}

const CONTROL =
  "w-full rounded-lg border border-line bg-card text-ink outline-none transition-all duration-200 placeholder:text-ink-soft/50 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/15 disabled:cursor-not-allowed disabled:bg-canvas disabled:opacity-70 dark:bg-white/[0.04]";

/**
 * Two heights: `md` inside forms, `sm` for dense toolbars and filter bars.
 *
 * `size` is destructured off rather than spread — `<input size>` and
 * `<select size>` are real HTML attributes that expect a number.
 */
/**
 * Mobile Safari force-zooms the page when a focused control's font-size is
 * under 16px, and does not zoom back out on blur. So every control is 16px
 * on phones and drops to the dense desktop size from `sm` up.
 */
const CONTROL_SIZES = {
  md: "px-3 py-2.5 text-base sm:text-sm",
  sm: "px-2.5 py-1.5 text-base sm:text-[13px]",
};

export function Input({ className = "", size = "md", onWheel, ...props }) {
  return (
    <input
      {...props}
      onWheel={noWheelStep(props.type, onWheel)}
      className={`${CONTROL} ${CONTROL_SIZES[size]} ${className}`}
    />
  );
}

export function Textarea({ className = "", size = "md", ...props }) {
  return (
    <textarea {...props} className={`${CONTROL} ${CONTROL_SIZES[size]} ${className}`} />
  );
}

export function Select({ className = "", size = "md", children, ...props }) {
  return (
    <select {...props} className={`${CONTROL} ${CONTROL_SIZES[size]} ${className}`}>
      {children}
    </select>
  );
}

/* ------------------------------------------------------------------ */
/* Feedback                                                            */
/* ------------------------------------------------------------------ */

export function Alert({ children, tone = "error" }) {
  if (!children) return null;
  const tones = {
    error: "border-brand-coral/40 bg-brand-coral/10 text-brand-coral",
    info: "border-line bg-canvas text-ink-soft",
  };
  return (
    <p
      role="alert"
      className={`animate-drop-in rounded-xl border px-3.5 py-2.5 text-sm ${tones[tone]}`}
    >
      {children}
    </p>
  );
}

export function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "border-line bg-canvas text-ink-soft",
    success: "border-brand-teal/30 bg-brand-teal/10 text-brand-teal",
    warning: "border-brand-orange/30 bg-brand-orange/10 text-brand-orange",
    danger: "border-brand-coral/30 bg-brand-coral/10 text-brand-coral",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-ink-soft">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
}) {
  const panelRef = useRef(null);

  // Called from the Escape handler below, always the latest `onClose` —
  // read via a ref rather than a dependency, so a caller passing a fresh
  // `() => ...` closure on every render (every call site does) never
  // reruns the effect beneath it.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  /**
   * Escape closes, Tab stays inside the dialog, and the page behind is frozen.
   * Without the scroll lock a touch drag inside the modal chains to the page
   * underneath, which is then left at a new scroll position once it closes.
   *
   * This must only run when the dialog actually opens or closes — not on
   * every render the open dialog happens to cause (typing into a field it
   * contains, for one) — since re-running it mid-render re-steals focus to
   * the panel and drops whatever the caret was in.
   */
  useEffect(() => {
    if (!open) return;

    const opener = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    // The panel itself takes focus, so Tab starts inside rather than on the
    // scrim, and a screen reader lands on the title.
    panelRef.current?.focus();

    const FOCUSABLE =
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

    const onKey = (event) => {
      if (event.key === "Escape") {
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const items = panelRef.current.querySelectorAll(FOCUSABLE);
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !panelRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      // Hand focus back to whatever opened the dialog, rather than dropping a
      // keyboard user at the top of the page.
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink/40 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`animate-page-in relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-2xl outline-none ${
          size === "lg" ? "max-w-2xl" : "max-w-lg"
        }`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-ink">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-xs text-ink-soft">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          {children}
        </div>

        {footer ? (
          <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-line bg-canvas/60 px-5 py-4 sm:px-6">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Table + pagination                                                  */
/* ------------------------------------------------------------------ */

/**
 * Below `sm` a 640px-wide table can only be read by scrolling sideways, and
 * the column that lands off-screen is always the last one — the row actions.
 * So phones get the same columns stacked into a card per row instead.
 *
 * The split is derived from the column list rather than configured per page:
 * the first column identifies the row and leads the card, any column with no
 * header is chrome (row actions) and sits opposite it, and the rest become
 * labelled pairs.
 */
function CardList({ columns, rows, rowKey }) {
  const [primary, ...rest] = columns;
  if (!primary) return null;

  const actions = rest.filter((column) => !column.header);
  const details = rest.filter((column) => column.header);

  return (
    <ul className="divide-y divide-line sm:hidden">
      {rows.map((row) => (
        <li key={rowKey(row)} className="px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">{primary.render(row)}</div>
            {actions.length ? (
              <div className="flex shrink-0 items-center gap-1">
                {actions.map((column) => (
                  <span key={column.key}>{column.render(row)}</span>
                ))}
              </div>
            ) : null}
          </div>

          {details.length ? (
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
              {details.map((column) => (
                <div key={column.key} className="min-w-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                    {column.header}
                  </dt>
                  <dd className="mt-1 min-w-0 text-sm text-ink">
                    {column.render(row)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function DataTable({ columns, rows, rowKey, loading, empty }) {
  return (
    <div className="relative">
      {loading ? (
        <div className="absolute inset-0 z-10 grid place-items-center bg-card/60 backdrop-blur-[1px]">
          <Spinner className="h-6 w-6 text-brand-purple" />
        </div>
      ) : null}

      {rows.length === 0 && !loading ? (
        empty
      ) : (
        <>
          <CardList columns={columns} rows={rows} rowKey={rowKey} />

          {/* The sideways scroll is kept for tablets and up, where the table
              is only a little wider than the viewport. */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-soft ${
                        column.align === "right" ? "text-right" : ""
                      }`}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    className="border-b border-line/70 transition-colors last:border-0 hover:bg-canvas/60"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 text-ink ${
                          column.align === "right" ? "text-right" : ""
                        }`}
                      >
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export function Pagination({ page, pages, total, onChange }) {
  if (!total) return null;

  const lastPage = Math.max(pages, 1);

  return (
    <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-xs text-ink-soft sm:text-sm">
      <span className="tabular-nums">
        Page {page} of {lastPage} · {total} total
      </span>
      <div className="flex items-center gap-1">
        <IconButton
          icon="chevronLeft"
          label="Previous page"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        />
        <IconButton
          icon="chevronRight"
          label="Next page"
          disabled={page >= lastPage}
          onClick={() => onChange(page + 1)}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page furniture                                                      */
/* ------------------------------------------------------------------ */

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({ title, description, actions, children, bodyClass = "" }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-[0_1px_2px_rgba(43,35,80,0.04)]">
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>
            {description ? (
              <p className="mt-0.5 truncate text-xs text-ink-soft">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </header>
      ) : null}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

export function SearchInput({ className = "", size = "md", ...props }) {
  const compact = size === "sm";

  return (
    <span className={`relative block ${className}`}>
      <svg
        viewBox="0 0 24 24"
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-soft ${
          compact ? "left-2.5 h-3.5 w-3.5" : "left-3.5 h-4 w-4"
        }`}
        fill="none"
      >
        <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M16 16l4 4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      <input
        {...props}
        className={`w-full rounded-lg border border-line bg-card text-ink outline-none transition-all duration-200 placeholder:text-ink-soft/60 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/15 ${
          compact ? "py-1.5 pl-8 pr-2.5 text-[13px]" : "py-2.5 pl-10 pr-3.5 text-sm"
        }`}
      />
    </span>
  );
}

export function Skeleton({ className = "h-4 w-full" }) {
  return <span className={`block animate-pulse rounded-md bg-line ${className}`} />;
}

/**
 * Icon + number tile used across the dashboard, reports and inventory.
 *
 * `icon` is either a name from @/components/icons ("products") or, for the
 * older call sites, raw <path> children rendered inside a 24×24 svg.
 */
export function StatTile({ label, value, note, icon, tone = "purple", href }) {
  const tones = {
    purple: "bg-brand-purple/10 text-brand-purple",
    teal: "bg-brand-teal/10 text-brand-teal",
    blue: "bg-brand-blue/10 text-brand-blue",
    yellow: "bg-brand-yellow/15 text-brand-orange",
    coral: "bg-brand-coral/10 text-brand-coral",
  };

  // A tile that links must navigate client-side, so it renders as <Link>.
  const Wrapper = href ? Link : "div";

  return (
    <Wrapper
      href={href}
      className={`block rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(43,35,80,0.04)] transition-all duration-200 ${
        href ? "hover:-translate-y-0.5 hover:border-brand-purple/40 hover:shadow-md" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-ink-soft">{label}</span>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
          {typeof icon === "string" ? (
            <Icon name={icon} className="h-5 w-5" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              {icon}
            </svg>
          )}
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">{value}</p>
      {note ? <p className="mt-1 text-xs text-ink-soft">{note}</p> : null}
    </Wrapper>
  );
}

/* ------------------------------------------------------------------ */
/* Not-yet-wired sections                                              */
/* ------------------------------------------------------------------ */

/**
 * Placeholder body for a section whose route and design exist but whose API
 * endpoint does not yet. `points` lists what the screen will do once the
 * endpoint lands, so the page is a spec rather than a dead end.
 */
export function ComingSoon({ icon = "plug", title, description, points = [], endpoint }) {
  return (
    <Card bodyClass="px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-xl text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-purple/10 text-brand-purple">
          <Icon name={icon} className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-ink">{title}</h2>
        <p className="mt-1.5 text-sm text-ink-soft">{description}</p>

        {endpoint ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1.5 font-mono text-xs text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-yellow" />
            waiting on {endpoint}
          </p>
        ) : null}

        {points.length ? (
          <ul className="mt-6 space-y-2.5 text-left">
            {points.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2.5 rounded-xl border border-line bg-canvas/60 px-4 py-2.5 text-sm text-ink"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-purple" />
                {point}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Card>
  );
}
