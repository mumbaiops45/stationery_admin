/**
 * Walks every page of a paginated admin list endpoint and returns every row
 * that matches the current filters — not just whatever page is on screen.
 * Backs every "Download Excel" button: an export is expected to hold the
 * whole filtered set, not the 20 rows currently rendered.
 *
 * `listFn` is a service's `list(params, options)`, already shaped to return
 * `{ items, pages }` (every list hook in this app does). `baseParams` is
 * normally the hook's own `params` — its own `page`/`limit` are overridden
 * here, everything else (search, status, sort, …) carries through untouched.
 */
export async function fetchAllPages(listFn, baseParams = {}, { pageSize = 100 } = {}) {
  const first = await listFn({ ...baseParams, page: 1, limit: pageSize });
  const items = [...first.items];
  const pages = Math.max(first.pages || 1, 1);

  for (let page = 2; page <= pages; page += 1) {
    // Sequential on purpose: parallel requests here would just contend for
    // the same rate limit an admin list is not expected to need.
    const next = await listFn({ ...baseParams, page, limit: pageSize });
    items.push(...next.items);
  }

  return items;
}
