/**
 * Mirrors the slug the API derives from a name, so a form can preview or
 * auto-fill it before the request round-trips. Shared by every form with a
 * name → slug pair (Categories, Products), rather than duplicated per page.
 */
export function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
