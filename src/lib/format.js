/**
 * Display helpers shared by the dashboard, reports and inventory screens.
 *
 * Everything here is defensive: the API is the source of truth, but a missing
 * or malformed number must never blank out a whole card.
 */

/** A finite number, or 0. Use before any arithmetic on API values. */
export function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

/** 1 234 → "1,234" */
export function formatNumber(value) {
  return toNumber(value).toLocaleString();
}

/**
 * Money with the currency the API reported (the dashboard sends "INR").
 * Falls back to a plain 2-decimal number when the code is unknown to Intl.
 */
export function formatMoney(value, currency = "INR") {
  const amount = toNumber(value);

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}

/** Compact money for tiles where the full number would wrap: "₹1.3L" style. */
export function formatMoneyCompact(value, currency = "INR") {
  const amount = toNumber(value);
  if (amount < 100000) return formatMoney(amount, currency);

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return formatMoney(amount, currency);
  }
}

/** "26 Aug 2026, 14:05" — undefined dates render as an em dash. */
export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "3h ago" / "2d ago" — for the recent-orders list. */
export function formatRelative(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const seconds = Math.max(Math.round((Date.now() - date.getTime()) / 1000), 0);

  const units = [
    ["y", 31536000],
    ["mo", 2592000],
    ["d", 86400],
    ["h", 3600],
    ["m", 60],
  ];

  for (const [suffix, size] of units) {
    if (seconds >= size) return `${Math.floor(seconds / size)}${suffix} ago`;
  }

  return "just now";
}

/** Share of a total as a rounded percentage, guarding divide-by-zero. */
export function percent(part, total) {
  const whole = toNumber(total);
  if (whole <= 0) return 0;
  return Math.round((toNumber(part) / whole) * 100);
}
