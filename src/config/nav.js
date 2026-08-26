/**
 * The single source of truth for the admin navigation.
 *
 * The sidebar, the mobile drawer and the header title all read this list, so a
 * new section is added here — never by editing the layout.
 *
 *   section.title  small caps label above the group (null = no label)
 *   item.href      route the link points at
 *   item.label     text in the sidebar and the header
 *   item.icon      key into `ICONS` in @/components/icons
 *   item.exact     match the pathname exactly instead of by prefix
 *   item.soon      route exists but the API behind it does not yet
 */
export const NAV_SECTIONS = [
  {
    id: "manage",
    title: "Menu",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/products", label: "Products", icon: "products" },
      { href: "/categories", label: "Categories", icon: "categories" },
      { href: "/inventory", label: "Inventory", icon: "inventory" },
      { href: "/orders", label: "Orders", icon: "orders" },
      { href: "/payments", label: "Payments", icon: "payments" },
      { href: "/users", label: "Users", icon: "users" },
    ],
  },
  {
    id: "insights",
    title: "Insights",
    items: [{ href: "/reports", label: "Reports", icon: "reports" }],
  },
  {
    id: "system",
    title: "System",
    items: [{ href: "/profile", label: "Profile", icon: "profile" }],
  },
];

/** Flat list of every navigable item, in sidebar order. */
export const NAV_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);

export function isActivePath(pathname, item) {
  if (!pathname) return false;
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** The nav item a pathname belongs to — used for the header title. */
export function findNavItem(pathname) {
  return NAV_ITEMS.find((item) => isActivePath(pathname, item)) || null;
}
