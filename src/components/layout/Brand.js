import Image from "next/image";

/** The logo lockup shown at the top of the sidebar. */
export function Brand({ compact = false }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-white">
        <Image
          src="/logo.png"
          alt="ChoiceKraft"
          width={200}
          height={190}
          className="h-6 w-6 object-contain"
          priority
        />
      </span>
      {compact ? null : (
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold tracking-tight text-ink">
            ChoiceKraft
          </span>
          <span className="block truncate text-[10px] tracking-wide text-ink-soft">
            Right choice to success
          </span>
        </span>
      )}
    </span>
  );
}

/** Two-letter fallback avatar, shared by the sidebar card and the header. */
export function initials(name) {
  return (
    (name || "Admin")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "A"
  );
}
