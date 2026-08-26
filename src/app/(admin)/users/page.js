"use client";

import { useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  Field,
  IconButton,
  Modal,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Skeleton,
  StatTile,
} from "@/components/ui";
import { formatDateTime, formatNumber, formatRelative } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useUsers } from "@/hooks/useUsers";
import {
  PAGE_SIZES,
  ROLES,
  ROLE_FILTERS,
  STATUS_FILTERS,
  USER_SORTS,
  roleMeta,
} from "@/services/user.service";

const INITIAL_PARAMS = {
  page: 1,
  limit: 20,
  search: "",
  role: "all",
  status: "all",
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

export default function UsersPage() {
  const users = useUsers(INITIAL_PARAMS);
  const { stats, loading: summaryLoading } = useDashboard();
  const { user: me } = useAuth();

  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState(null);
  const [roleDraft, setRoleDraft] = useState("");

  const myId = me?._id || me?.id || null;
  // Read off nullable state here, not inside saveRole: the React Compiler
  // hoists a callback's property reads into the render body, where `viewing`
  // is still null until a row is opened.
  const viewingId = viewing?.id ?? null;
  const isMe = viewing ? String(viewing.id) === String(myId) : false;

  function apply(patch = {}) {
    users.setParams({ search: query.trim(), ...patch, page: 1 });
  }

  function resetFilters() {
    setQuery("");
    users.setParams(INITIAL_PARAMS);
  }

  function openUser(row) {
    setRoleDraft(row.role);
    users.clearError();
    setViewing(row);
  }

  async function saveRole() {
    if (!viewingId) return;
    const outcome = await users.setRole(viewingId, roleDraft);
    // `viewing` is a snapshot of the row, so patch it here rather than waiting
    // for the refetch — and the modal keeps working even when the new role
    // filters the user out of the list that comes back.
    if (outcome.ok) setViewing({ ...viewing, role: roleDraft });
  }

  const activeFilters =
    (users.params.search ? 1 : 0) +
    (users.params.role !== "all" ? 1 : 0) +
    (users.params.status !== "all" ? 1 : 0) +
    (users.params.sort !== "newest" ? 1 : 0);

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-purple/10 text-[11px] font-semibold text-brand-purple">
            {initials(row.name)}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="truncate font-medium text-ink">{row.name}</span>
              {String(row.id) === String(myId) ? <Badge>You</Badge> : null}
            </span>
            <span className="block truncate text-xs text-ink-soft">
              {row.email || row.phone || "—"}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (row) => {
        const meta = roleMeta(row.role);
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge tone={row.isActive ? "success" : "danger"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "verified",
      header: "Email",
      render: (row) =>
        row.isVerified ? (
          <Badge tone="success">Verified</Badge>
        ) : (
          <Badge tone="warning">Unverified</Badge>
        ),
    },
    {
      key: "joined",
      header: "Joined",
      render: (row) => (
        <span className="text-xs text-ink-soft" title={formatDateTime(row.createdAt)}>
          {formatRelative(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <IconButton
          icon="eye"
          tone="brand"
          label={`View ${row.name}`}
          onClick={() => openUser(row)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users"
        subtitle="Everyone with an account, and what they are allowed to do."
      />

      <Alert>{users.error}</Alert>

      {/* Store-wide totals */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryLoading ? (
          [0, 1, 2, 3].map((n) => (
            <div key={n} className="rounded-2xl border border-line bg-card p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-4 h-7 w-16" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
          ))
        ) : stats ? (
          <>
            <StatTile
              label="All accounts"
              value={formatNumber(stats.users.total)}
              note={`${formatNumber(stats.users.active)} active`}
              icon="users"
              tone="purple"
            />
            <StatTile
              label="Customers"
              value={formatNumber(stats.users.customers)}
              note="Can place orders"
              icon="orders"
              tone="blue"
            />
            <StatTile
              label="Admins"
              value={formatNumber(stats.users.admins)}
              note="Full access to this console"
              icon="settings"
              tone="yellow"
            />
            <StatTile
              label="Inactive"
              value={formatNumber(stats.users.inactive)}
              note="Suspended accounts"
              icon="warning"
              tone="coral"
            />
          </>
        ) : null}
      </div>

      <Card title="All users" description={`${users.total} total`}>
        {/* Filter toolbar */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            apply();
          }}
          className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5"
        >
          <SearchInput
            size="sm"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email or phone"
            className="min-w-[160px] flex-1"
          />

          {/* Widths live on the wrapper: the controls themselves are w-full. */}
          <div className="w-36 shrink-0">
            <Select
              size="sm"
              value={users.params.role || "all"}
              onChange={(event) => apply({ role: event.target.value })}
            >
              {ROLE_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-32 shrink-0">
            <Select
              size="sm"
              value={users.params.status || "all"}
              onChange={(event) => apply({ status: event.target.value })}
            >
              {STATUS_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-36 shrink-0">
            <Select
              size="sm"
              value={users.params.sort || "newest"}
              onChange={(event) => apply({ sort: event.target.value })}
            >
              {USER_SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {activeFilters > 0 ? (
            <Button type="button" size="sm" variant="ghost" onClick={resetFilters}>
              Clear
            </Button>
          ) : null}

          <span className="ml-auto flex items-center gap-2 text-xs text-ink-soft">
            Per page
            <span className="w-20">
              <Select
                size="sm"
                value={users.params.limit || 20}
                onChange={(event) => apply({ limit: Number(event.target.value) })}
              >
                {PAGE_SIZES.map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </Select>
            </span>
          </span>
        </form>

        <DataTable
          columns={columns}
          rows={users.items}
          rowKey={(row) => row.id}
          loading={users.loading}
          empty={
            <EmptyState
              title="No users found"
              description={
                activeFilters > 0
                  ? "No account matches these filters. Try widening them."
                  : "Accounts created through the storefront appear here."
              }
              action={
                activeFilters > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3"
                    variant="secondary"
                    onClick={resetFilters}
                  >
                    Clear filters
                  </Button>
                ) : null
              }
            />
          }
        />
        <Pagination
          page={users.page}
          pages={users.pages}
          total={users.total}
          onChange={users.setPage}
        />
      </Card>

      {/* Detail — rendered from the row, since the API has no admin
          GET /users/:id and the list already returns the whole document. */}
      <Modal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing ? viewing.name : ""}
        description={viewing ? viewing.email : ""}
        footer={
          <Button variant="secondary" onClick={() => setViewing(null)}>
            Close
          </Button>
        }
      >
        {viewing ? (
          <div className="space-y-5">
            <dl className="divide-y divide-line rounded-xl border border-line">
              {[
                { label: "Name", value: viewing.name },
                { label: "Email", value: viewing.email || "—" },
                { label: "Phone", value: viewing.phone || "Not provided" },
                {
                  label: "Role",
                  value: <Badge tone={roleMeta(viewing.role).tone}>{roleMeta(viewing.role).label}</Badge>,
                },
                {
                  label: "Account",
                  value: (
                    <Badge tone={viewing.isActive ? "success" : "danger"}>
                      {viewing.isActive ? "Active" : "Inactive"}
                    </Badge>
                  ),
                },
                {
                  label: "Email verified",
                  value: (
                    <Badge tone={viewing.isVerified ? "success" : "warning"}>
                      {viewing.isVerified ? "Verified" : "Unverified"}
                    </Badge>
                  ),
                },
                { label: "Joined", value: formatDateTime(viewing.createdAt) },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-4 px-3.5 py-2.5 text-sm"
                >
                  <dt className="text-ink-soft">{row.label}</dt>
                  <dd className="min-w-0 truncate text-right font-medium text-ink">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Role is the only field the API lets an admin write. */}
            <section className="rounded-xl border border-line bg-canvas/60 px-4 py-3.5">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                Change role
              </h3>

              <Alert>{users.saveError}</Alert>

              {isMe ? (
                <p className="mt-2 text-sm text-ink-soft">
                  This is your own account. The API refuses to let an admin
                  change their own role, so ask another admin to do it.
                </p>
              ) : (
                <>
                  <div className="mt-3 flex flex-wrap items-end gap-2">
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
                      disabled={roleDraft === viewing.role}
                      loading={users.saving}
                      onClick={saveRole}
                    >
                      Save role
                    </Button>
                  </div>

                  {roleDraft === "admin" && viewing.role !== "admin" ? (
                    <p className="mt-2.5 rounded-lg border border-brand-orange/30 bg-brand-orange/10 px-3 py-2 text-xs text-brand-orange">
                      An admin gets full access to this console — the catalogue,
                      every order and every account.
                    </p>
                  ) : null}
                </>
              )}
            </section>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
