"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Icon } from "@/components/icons";
import {
  Alert,
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  IconButton,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Skeleton,
  StatTile,
} from "@/components/ui";
import { formatDateTime, formatNumber, formatRelative } from "@/lib/format";
import { exportRowsToExcel, todayStamp } from "@/lib/excel";
import { fetchAllPages } from "@/lib/fetchAllPages";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useUsers } from "@/hooks/useUsers";
import {
  PAGE_SIZES,
  ROLE_FILTERS,
  STATUS_FILTERS,
  USER_SORTS,
  roleMeta,
  userService,
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
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const myId = me?._id || me?.id || null;

  function apply(patch = {}) {
    users.setParams({ search: query.trim(), ...patch, page: 1 });
  }

  function resetFilters() {
    setQuery("");
    users.setParams(INITIAL_PARAMS);
  }

  async function handleExport() {
    setExporting(true);
    setExportError("");
    try {
      const rows = await fetchAllPages(userService.list, users.params);
      await exportRowsToExcel({
        fileName: `users-${todayStamp()}.xlsx`,
        sheetName: "Users",
        columns: [
          { header: "Name", key: "name", width: 24 },
          { header: "Email", key: "email", width: 30 },
          { header: "Phone", key: "phone", width: 16 },
          { header: "Role", key: "role", width: 12 },
          { header: "Status", key: "status", width: 12 },
          { header: "Joined", key: "createdAt", width: 20 },
        ],
        rows: rows.map((user) => ({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          role: roleMeta(user.role).label,
          status: user.isActive ? "Active" : "Inactive",
          createdAt: user.createdAt ? formatDateTime(user.createdAt) : "",
        })),
      });
    } catch (err) {
      setExportError(err.message || "Could not build the Excel file.");
    } finally {
      setExporting(false);
    }
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
          onClick={() => router.push(`/users/${row.id}`)}
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
      <Alert>{exportError}</Alert>

      {/* Store-wide totals */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <Card
        title="All users"
        description={`${users.total} total`}
        actions={
          <Button size="sm" variant="secondary" loading={exporting} onClick={handleExport}>
            <Icon name="download" className="h-4 w-4" />
            Download Excel
          </Button>
        }
      >
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
    </div>
  );
}
