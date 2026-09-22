/**
 * The admin icon set.
 *
 * Every glyph is a 24×24 stroked outline that inherits `currentColor`, so a
 * caller only ever sets a size class and a text colour:
 *
 *   <Icon name="orders" className="h-5 w-5" />
 *   <Dashboard className="h-4 w-4 text-brand-purple" />
 *
 * Add a glyph here rather than inlining <svg> in a page — the nav config and
 * the stat tiles both look icons up by name.
 */

function Glyph({ children, className = "h-5 w-5", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

export function Dashboard(props) {
  return (
    <Glyph {...props}>
      <path d="M3.5 10.6L12 4l8.5 6.6" />
      <path d="M5.5 9.6V19a1 1 0 001 1h11a1 1 0 001-1V9.6" />
      <path d="M9.5 20v-5.5h5V20" />
    </Glyph>
  );
}

export function Products(props) {
  return (
    <Glyph {...props}>
      <path d="M12 3l8.5 4.4v9.2L12 21l-8.5-4.4V7.4L12 3z" />
      <path d="M3.5 7.4L12 11.8l8.5-4.4M12 11.8V21" />
    </Glyph>
  );
}

export function Categories(props) {
  return (
    <Glyph {...props}>
      <path d="M4 5.5A1.5 1.5 0 015.5 4h3.6a1 1 0 01.8.4L11 6h7.5A1.5 1.5 0 0120 7.5v11A1.5 1.5 0 0118.5 20h-13A1.5 1.5 0 014 18.5v-13z" />
      <path d="M4 9.5h16" />
    </Glyph>
  );
}

export function Inventory(props) {
  return (
    <Glyph {...props}>
      <rect x="3" y="4" width="8" height="7" rx="1.2" />
      <rect x="13" y="4" width="8" height="7" rx="1.2" />
      <rect x="3" y="13" width="8" height="7" rx="1.2" />
      <rect x="13" y="13" width="8" height="7" rx="1.2" />
      <path d="M6 4v7M16 13v7" />
    </Glyph>
  );
}

export function Orders(props) {
  return (
    <Glyph {...props}>
      <path d="M3 4h2.2l1.6 9.2a1.6 1.6 0 001.6 1.3h7.7a1.6 1.6 0 001.6-1.2L19 7H6" />
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="17" cy="19" r="1.5" />
    </Glyph>
  );
}

export function Payments(props) {
  return (
    <Glyph {...props}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 9.5h19" />
      <path d="M6 14.5h3.5" />
    </Glyph>
  );
}

export function Users(props) {
  return (
    <Glyph {...props}>
      <circle cx="9.5" cy="8" r="3.2" />
      <path d="M3.5 19a6 6 0 0112 0" />
      <path d="M16.2 5.2a3.2 3.2 0 010 5.6M17.5 19a6 6 0 00-1.6-4.1" />
    </Glyph>
  );
}

export function Banner(props) {
  return (
    <Glyph {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="1.6" />
      <circle cx="8.3" cy="10" r="1.6" />
      <path d="M4 16.2l4.2-4.2a1.4 1.4 0 011.9 0l3.6 3.6M13.3 14l1.6-1.6a1.4 1.4 0 011.9 0L20 15.6" />
    </Glyph>
  );
}

export function Reports(props) {
  return (
    <Glyph {...props}>
      <path d="M4 20h16" />
      <path d="M7 20v-5.5M12 20V5.5M17 20v-8.5" />
    </Glyph>
  );
}

export function Settings(props) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="2.8" />
      <path d="M19.4 14.2a1.4 1.4 0 00.3 1.5l.1.1a1.7 1.7 0 11-2.4 2.4l-.1-.1a1.4 1.4 0 00-2.4 1v.2a1.7 1.7 0 11-3.4 0v-.1a1.4 1.4 0 00-2.4-1l-.1.1a1.7 1.7 0 11-2.4-2.4l.1-.1a1.4 1.4 0 00-1-2.4h-.2a1.7 1.7 0 110-3.4h.1a1.4 1.4 0 001-2.4l-.1-.1a1.7 1.7 0 112.4-2.4l.1.1a1.4 1.4 0 002.4-1v-.2a1.7 1.7 0 113.4 0v.1a1.4 1.4 0 002.4 1l.1-.1a1.7 1.7 0 112.4 2.4l-.1.1a1.4 1.4 0 001 2.4h.2a1.7 1.7 0 110 3.4h-.1a1.4 1.4 0 00-1.3.8z" />
    </Glyph>
  );
}

export function Logout(props) {
  return (
    <Glyph {...props}>
      <path d="M15 12H4m0 0l3.5-3.5M4 12l3.5 3.5" />
      <path d="M10 5.5V5a2 2 0 012-2h6a2 2 0 012 2v14a2 2 0 01-2 2h-6a2 2 0 01-2-2v-.5" />
    </Glyph>
  );
}

export function Profile(props) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0115 0" />
    </Glyph>
  );
}

/* ------------------------------------------------------------------ */
/* Chrome                                                              */
/* ------------------------------------------------------------------ */

export function Menu(props) {
  return (
    <Glyph strokeWidth="1.8" {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Glyph>
  );
}

export function Close(props) {
  return (
    <Glyph strokeWidth="1.8" {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Glyph>
  );
}

export function ChevronDown(props) {
  return (
    <Glyph strokeWidth="1.8" {...props}>
      <path d="M7 10l5 5 5-5" />
    </Glyph>
  );
}

export function Search(props) {
  return (
    <Glyph {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M15.8 15.8L20 20" />
    </Glyph>
  );
}

export function Currency(props) {
  return (
    <Glyph {...props}>
      <path d="M12 4v16" />
      <path d="M15.5 7.5A3 3 0 0012.5 6h-1a2.5 2.5 0 000 5h1a2.5 2.5 0 010 5h-1a3 3 0 01-3-1.5" />
    </Glyph>
  );
}

export function Warning(props) {
  return (
    <Glyph {...props}>
      <path d="M12 4l9 16H3l9-16z" />
      <path d="M12 10v4M12 17.2v.4" />
    </Glyph>
  );
}

export function Plug(props) {
  return (
    <Glyph {...props}>
      <path d="M9 3v5M15 3v5" />
      <path d="M6.5 8h11v3a5.5 5.5 0 01-11 0V8z" />
      <path d="M12 16.5V21" />
    </Glyph>
  );
}


/* ------------------------------------------------------------------ */
/* Row actions and pagination                                          */
/* ------------------------------------------------------------------ */

export function Edit(props) {
  return (
    <Glyph {...props}>
      <path d="M4 20h4.5L19 9.5a2.12 2.12 0 00-3-3L5.5 17 4 20z" />
      <path d="M14.5 6.5l3 3" />
    </Glyph>
  );
}

export function Trash(props) {
  return (
    <Glyph {...props}>
      <path d="M4 7h16" />
      <path d="M9.5 7V5.5A1.5 1.5 0 0111 4h2a1.5 1.5 0 011.5 1.5V7" />
      <path d="M6.5 7l.8 11.1A2 2 0 009.3 20h5.4a2 2 0 002-1.9L17.5 7" />
      <path d="M10.5 11v5M13.5 11v5" />
    </Glyph>
  );
}

export function Eye(props) {
  return (
    <Glyph {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </Glyph>
  );
}

export function Layers(props) {
  return (
    <Glyph {...props}>
      <path d="M12 3l8.5 4.2L12 11.4 3.5 7.2 12 3z" />
      <path d="M3.5 12L12 16.2 20.5 12" />
      <path d="M3.5 16.5L12 20.7l8.5-4.2" />
    </Glyph>
  );
}

export function ChevronLeft(props) {
  return (
    <Glyph strokeWidth="1.8" {...props}>
      <path d="M14 7l-5 5 5 5" />
    </Glyph>
  );
}

export function ChevronRight(props) {
  return (
    <Glyph strokeWidth="1.8" {...props}>
      <path d="M10 7l5 5-5 5" />
    </Glyph>
  );
}

export function Check(props) {
  return (
    <Glyph strokeWidth="2" {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Glyph>
  );
}

export function Download(props) {
  return (
    <Glyph {...props}>
      <path d="M12 4v11M8 11.5l4 4 4-4" />
      <path d="M4.5 16.5V18a1.5 1.5 0 001.5 1.5h12a1.5 1.5 0 001.5-1.5v-1.5" />
    </Glyph>
  );
}

/** Every glyph, keyed by the name the nav config and pages use. */
export const ICONS = {
  dashboard: Dashboard,
  products: Products,
  categories: Categories,
  inventory: Inventory,
  banner: Banner,
  orders: Orders,
  payments: Payments,
  users: Users,
  reports: Reports,
  settings: Settings,
  logout: Logout,
  profile: Profile,
  menu: Menu,
  close: Close,
  chevronDown: ChevronDown,
  search: Search,
  currency: Currency,
  warning: Warning,
  plug: Plug,
  edit: Edit,
  trash: Trash,
  eye: Eye,
  layers: Layers,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  check: Check,
  download: Download,
};

/** Renders a glyph by name; unknown names render nothing rather than crash. */
export function Icon({ name, ...props }) {
  const Glyphs = ICONS[name];
  return Glyphs ? <Glyphs {...props} /> : null;
}
