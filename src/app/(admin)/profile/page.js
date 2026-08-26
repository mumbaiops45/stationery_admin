"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
} from "@/components/ui";
import { Icon } from "@/components/icons";
import { formatDateTime } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@/hooks/useResource";
import { authService } from "@/services/auth.service";

/** The User schema's own minimum. */
const MIN_PASSWORD = 8;

const BLANK_PASSWORD = { current: "", next: "", confirm: "" };

function initials(name) {
  return String(name || "A")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}

/** One label / value line in the details card. */
function Row({ label, children }) {
  return (
    <div className="flex flex-col gap-1 border-b border-line px-5 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-ink-soft">{label}</span>
      <span className="min-w-0 truncate text-sm font-medium text-ink">{children}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const { run, pending, error, clearError } = useMutation();
  const [form, setForm] = useState(BLANK_PASSWORD);
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState("");

  async function endSession() {
    await logout();
    router.replace("/login");
  }

  async function handleChangePassword(event) {
    event.preventDefault();
    setDone("");
    clearError();

    if (!form.current) {
      setFormError("Enter your current password.");
      return;
    }
    if (form.next.length < MIN_PASSWORD) {
      setFormError(`New password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (form.next === form.current) {
      setFormError("The new password matches your current one.");
      return;
    }
    if (form.next !== form.confirm) {
      setFormError("The two new passwords do not match.");
      return;
    }

    setFormError("");
    setBusy("password");

    const outcome = await run(() =>
      authService.changePassword({
        currentPassword: form.current,
        newPassword: form.next,
      }),
    );

    setBusy("");
    if (outcome.ok) {
      setForm(BLANK_PASSWORD);
      setDone("Password changed.");
    }
  }

  async function handleResendVerification() {
    setDone("");
    clearError();
    setBusy("verify");
    const outcome = await run(() => authService.sendVerification());
    setBusy("");
    if (outcome.ok) setDone("Verification email sent.");
  }

  async function handleLogoutEverywhere() {
    setDone("");
    clearError();
    setBusy("logout-all");
    const outcome = await run(() => authService.logoutAll());
    setBusy("");
    // Every refresh token is gone, including this browser's — the session is
    // already dead, so leave rather than sit on a page that cannot refresh.
    if (outcome.ok) await endSession();
  }

  const verified = user?.isVerified === true;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Profile"
        subtitle="The account you are signed in with, and what you can change about it."
      />

      {done ? <Alert tone="info">{done}</Alert> : null}
      <Alert>{error}</Alert>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Identity */}
        <div className="space-y-5 lg:col-span-2">
          <Card bodyClass="">
            {/* The wordmark gradient, reused as a cover strip. */}
            <div className="brand-gradient h-20" />
            <div className="-mt-10 px-5 pb-5">
              <span className="grid h-20 w-20 place-items-center rounded-2xl border-4 border-card bg-brand-purple text-2xl font-semibold text-white shadow-sm">
                {initials(user?.name)}
              </span>
              <p className="mt-3 truncate text-lg font-semibold text-ink">
                {user?.name || "Admin"}
              </p>
              <p className="truncate text-sm text-ink-soft">{user?.email || "—"}</p>
              <p className="mt-3 flex flex-wrap gap-2">
                <Badge tone="warning">{user?.role || "admin"}</Badge>
                <Badge tone={verified ? "success" : "warning"}>
                  {verified ? "Email verified" : "Email unverified"}
                </Badge>
                <Badge tone={user?.isActive === false ? "danger" : "success"}>
                  {user?.isActive === false ? "Disabled" : "Active"}
                </Badge>
              </p>
            </div>
          </Card>

          <Card title="Account details">
            <Row label="Name">{user?.name || "—"}</Row>
            <Row label="Email">{user?.email || "—"}</Row>
            <Row label="Phone">{user?.phone || "Not provided"}</Row>
            <Row label="Member since">
              {user?.createdAt ? formatDateTime(user.createdAt) : "—"}
            </Row>
          </Card>

          {/* No endpoint writes these, so say so rather than showing a form
              that cannot save. */}
          <p className="flex items-start gap-2 rounded-xl border border-line bg-canvas/60 px-4 py-3 text-xs text-ink-soft">
            <Icon name="warning" className="mt-0.5 h-4 w-4 shrink-0" />
            Your name and phone are read-only here — the API has no endpoint
            that updates an account&apos;s own profile. Another admin can change
            your role from Users.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-5 lg:col-span-3">
          <Card
            title="Change password"
            description={`At least ${MIN_PASSWORD} characters, matching the account schema`}
            bodyClass="px-5 py-4"
          >
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Alert>{formError}</Alert>

              <Field label="Current password" required>
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={form.current}
                  onChange={(event) =>
                    setForm({ ...form, current: event.target.value })
                  }
                  placeholder="••••••••"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="New password" required>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={form.next}
                    onChange={(event) =>
                      setForm({ ...form, next: event.target.value })
                    }
                    placeholder="••••••••"
                  />
                </Field>

                <Field
                  label="Confirm new password"
                  required
                  error={
                    form.confirm && form.confirm !== form.next
                      ? "Does not match"
                      : undefined
                  }
                >
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={form.confirm}
                    onChange={(event) =>
                      setForm({ ...form, confirm: event.target.value })
                    }
                    placeholder="••••••••"
                  />
                </Field>
              </div>

              <Button type="submit" loading={pending && busy === "password"}>
                Change password
              </Button>
            </form>
          </Card>

          {verified ? null : (
            <Card
              title="Verify your email"
              description="Unverified accounts can still sign in, but the address is unconfirmed"
              bodyClass="px-5 py-4"
            >
              <p className="text-sm text-ink-soft">
                We can send the verification link to{" "}
                <span className="font-medium text-ink">{user?.email}</span> again.
              </p>
              <Button
                variant="secondary"
                className="mt-3"
                loading={pending && busy === "verify"}
                onClick={handleResendVerification}
              >
                Resend verification email
              </Button>
            </Card>
          )}

          <Card title="Sessions" bodyClass="divide-y divide-line">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
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

            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">
                  Sign out everywhere
                </span>
                <span className="block text-xs text-ink-soft">
                  Ends every session on every device, including this one.
                </span>
              </span>
              <Button
                variant="danger"
                loading={pending && busy === "logout-all"}
                onClick={handleLogoutEverywhere}
              >
                Sign out everywhere
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
