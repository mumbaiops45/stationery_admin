"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { Icon } from "@/components/icons";
import {
  Alert,
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  Field,
  PageHeader,
  Pagination,
  Select,
  Skeleton,
  StatTile,
} from "@/components/ui";
import { formatDateTime, formatMoney, formatNumber, formatRelative } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { useOrders } from "@/hooks/useOrders";
import { useMutation } from "@/hooks/useResource";
import { ROLES, roleMeta, userService } from "@/services/user.service";
import { ORDER_SORTS, orderStatusMeta, paymentStatusMeta } from "@/services/order.service";

const ORDERS_INITIAL_PARAMS = {
  page: 1,
  limit: 10,
  sort: "newest",
};

function initials(name) {
  return String(name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: me } = useAuth();

  // `loadedFor` derives loading rather than setting it imperatively — the
  // same shape useResource/useReports already use elsewhere in this app.
  const [detail, setDetail] = useState({ loadedFor: null, user: null, stats: null, error: null });
  const [roleDraft, setRoleDraft] = useState("");
  const role = useMutation();
  const status = useMutation();

  // Every order this user has ever placed, paginated — not just a capped
  // "recent 5", since this is now a full page rather than a cramped modal.
  const orders = useOrders({ ...ORDERS_INITIAL_PARAMS, userId: id });

  useEffect(() => {
    if (!id) return undefined;

    let active = true;

    userService
      .get(id)
      .then((result) => {
        if (!active) return;
        setDetail({ loadedFor: id, user: result.user, stats: result.stats, error: null });
        setRoleDraft(result.user.role);
      })
      .catch((error) => {
        if (active) {
          setDetail({
            loadedFor: id,
            user: null,
            stats: null,
            error: error.message || "Could not load this account.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  const loading = detail.loadedFor !== id;
  const user = detail.user;
  const myId = me?._id || me?.id || null;
  const isMe = user ? String(user.id) === String(myId) : false;

  async function saveRole() {
    if (!user) return;
    const outcome = await role.run(() => userService.setRole(user.id, roleDraft));
    if (outcome.ok) setDetail((current) => ({ ...current, user: { ...user, role: roleDraft } }));
  }

  async function toggleStatus() {
    if (!user) return;
    const nextActive = !user.isActive;
    const outcome = await status.run(() => userService.setStatus(user.id, nextActive));
    if (outcome.ok) {
      setDetail((current) => ({ ...current, user: { ...user, isActive: nextActive } }));
    }
  }

  const columns = [
    {
      key: "order",
      header: "Order",
      render: (row) => (
        <span className="block">
          <span className="block font-mono text-xs font-semibold text-ink">
            {row.orderNumber}
          </span>
          <span className="block text-xs text-ink-soft">{formatDateTime(row.createdAt)}</span>
        </span>
      ),
    },
    {
      key: "items",
      header: "Products",
      render: (row) => (
        <span className="block max-w-xs">
          <span className="block text-ink">
            {formatNumber(row.itemCount)} item{row.itemCount === 1 ? "" : "s"}
          </span>
          <span className="block truncate text-xs text-ink-soft">
            {row.items.map((item) => item.name).join(", ") || "—"}
          </span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const meta = orderStatusMeta(row.orderStatus);
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: "payment",
      header: "Payment",
      render: (row) => {
        const meta = paymentStatusMeta(row.paymentStatus);
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (row) => <span className="font-semibold text-ink">{formatMoney(row.total)}</span>,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Loading…" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-5">
        <PageHeader title="Account not found" />
        <Alert>{detail.error}</Alert>
        <Button variant="secondary" onClick={() => router.push("/users")}>
          Back to users
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={user.name}
        subtitle={user.email || user.phone || "No contact on file"}
        actions={
          <Link href="/users">
            <Button variant="secondary">
              <Icon name="chevronLeft" className="h-4 w-4" />
              Back to users
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Orders"
          value={formatNumber(detail.stats.orderCount)}
          note="All time"
          icon="orders"
          tone="purple"
        />
        <StatTile
          label="Total spent"
          value={formatMoney(detail.stats.totalSpent)}
          note="Excludes cancelled orders"
          icon="currency"
          tone="teal"
        />
        <StatTile
          label="Role"
          value={roleMeta(user.role).label}
          note={isMe ? "This is you" : "Set below"}
          icon="settings"
          tone="yellow"
        />
        <StatTile
          label="Joined"
          value={formatRelative(user.createdAt)}
          note={formatDateTime(user.createdAt)}
          icon="profile"
          tone="blue"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-1">
          <Card title="Account">
            <dl className="divide-y divide-line">
              {[
                { label: "Name", value: user.name },
                { label: "Email", value: user.email || "—" },
                { label: "Phone", value: user.phone || "Not provided" },
                {
                  label: "Status",
                  value: (
                    <button
                      type="button"
                      onClick={isMe ? undefined : toggleStatus}
                      disabled={isMe || status.pending}
                      title={isMe ? "You cannot suspend your own account" : "Toggle account status"}
                    >
                      <Badge tone={user.isActive ? "success" : "danger"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </button>
                  ),
                },
                { label: "Joined", value: formatDateTime(user.createdAt) },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-4 px-5 py-2.5 text-sm"
                >
                  <dt className="text-ink-soft">{row.label}</dt>
                  <dd className="min-w-0 truncate text-right font-medium text-ink">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card title="Change role" bodyClass="px-5 py-4">
            <Alert>{role.error}</Alert>
            <Alert>{status.error}</Alert>

            {isMe ? (
              <p className="text-sm text-ink-soft">
                This is your own account. The API refuses to let an admin change
                their own role, so ask another admin to do it.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-end gap-2">
                  <Field label="Role" className="min-w-[160px] flex-1">
                    <Select
                      size="sm"
                      value={roleDraft}
                      onChange={(event) => setRoleDraft(event.target.value)}
                    >
                      {ROLES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Button
                    size="sm"
                    disabled={roleDraft === user.role}
                    loading={role.pending}
                    onClick={saveRole}
                  >
                    Save role
                  </Button>
                </div>

                {roleDraft === "admin" && user.role !== "admin" ? (
                  <p className="mt-2.5 rounded-lg border border-brand-orange/30 bg-brand-orange/10 px-3 py-2 text-xs text-brand-orange">
                    An admin gets full access to this console — the catalogue,
                    every order and every account.
                  </p>
                ) : null}
              </>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card title="Order history" description={`${orders.total} order${orders.total === 1 ? "" : "s"}`}>
            <div className="flex items-center justify-end gap-2 border-b border-line px-4 py-2.5">
              <span className="text-xs font-medium text-ink-soft">Sort</span>
              <span className="w-40">
                <Select
                  size="sm"
                  value={orders.params.sort || "newest"}
                  onChange={(event) => orders.setParams({ sort: event.target.value, page: 1 })}
                >
                  {ORDER_SORTS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </span>
            </div>

            <DataTable
              columns={columns}
              rows={orders.items}
              rowKey={(row) => row.id}
              loading={orders.loading}
              empty={
                <EmptyState
                  title="No orders yet"
                  description={`${user.name} has not placed an order through the storefront.`}
                />
              }
            />
            <Pagination
              page={orders.page}
              pages={orders.pages}
              total={orders.total}
              onChange={(page) => orders.setParams({ page })}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
