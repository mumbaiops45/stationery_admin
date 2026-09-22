"use client";

import { useRouter } from "next/navigation";

import { Badge, Button, Card } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";

function initials(name) {
  return String(name || "A")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}

/**
 * One label / value line.
 *
 * The bottom border is unconditional: every row is followed by something —
 * another row, or the sign-out block that closes the card.
 */
function Row({ label, children }) {
  return (
    <div className="flex flex-col gap-1 border-b border-line px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-ink-soft">{label}</span>
      <span className="min-w-0 truncate text-sm font-medium text-ink">{children}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function endSession() {
    await logout();
    router.replace("/login");
  }

  return (
    /* One centred column, one card. This page is a single short read, so
       splitting it across sections only added borders between four lines. */
    <div className="mx-auto w-full max-w-xl space-y-5">
      <header className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Profile</h1>
        <p className="mt-1 text-sm text-ink-soft">
          The account you are signed in with.
        </p>
      </header>

      <Card>
        <div className="flex flex-col items-center border-b border-line px-6 py-8 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-purple text-lg font-semibold tracking-wide text-white">
            {initials(user?.name)}
          </span>

          <p className="mt-4 max-w-full truncate text-base font-semibold text-ink">
            {user?.name || "Admin"}
          </p>
          <p className="mt-0.5 max-w-full truncate text-sm text-ink-soft">
            {user?.email || "—"}
          </p>

          <p className="mt-4 flex flex-wrap justify-center gap-2">
            <Badge>{user?.role || "admin"}</Badge>
            <Badge tone={user?.isActive === false ? "danger" : "success"}>
              {user?.isActive === false ? "Disabled" : "Active"}
            </Badge>
          </p>
        </div>

        <Row label="Name">{user?.name || "—"}</Row>
        <Row label="Email">{user?.email || "—"}</Row>
        <Row label="Phone">{user?.phone || "Not provided"}</Row>
        <Row label="Member since">
          {user?.createdAt ? formatDateTime(user.createdAt) : "—"}
        </Row>

        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <span className="min-w-0">
            <span className="block text-sm font-medium text-ink">
              Sign out of this browser
            </span>
            <span className="block text-xs text-ink-soft">
              Revokes the refresh token stored here.
            </span>
          </span>
          <Button variant="secondary" onClick={endSession}>
            Sign out
          </Button>
        </div>
      </Card>
    </div>
  );
}
