// Simple stroked stationery glyphs used for the drifting background doodles
// and the small marks inside the form.

export function Pencil(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" {...props}>
      <path
        d="M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19l-4 1z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14.5 6.5l3 3" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function Paperclip(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" {...props}>
      <path
        d="M20 11.5l-8.2 8.2a5 5 0 01-7.1-7.1l9-9a3.4 3.4 0 114.8 4.8l-9 9a1.8 1.8 0 11-2.5-2.5l7.8-7.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Notebook(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" {...props}>
      <rect
        x="5"
        y="3"
        width="15"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path
        d="M9 3v18M12 8h5M12 12h5"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Ruler(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" {...props}>
      <rect
        x="2"
        y="8"
        width="20"
        height="8"
        rx="1.5"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path
        d="M6 8v3M10 8v4M14 8v3M18 8v4"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Scissors(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" {...props}>
      <circle cx="6" cy="18" r="2.5" stroke="currentColor" />
      <circle cx="6" cy="6" r="2.5" stroke="currentColor" />
      <path
        d="M8.2 7.6L20 18M8.2 16.4L20 6"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PushPin(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" {...props}>
      <path
        d="M9 3h6l-1 5 3.5 3.5H6.5L10 8 9 3z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path d="M12 11.5V21" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function Eraser(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" {...props}>
      <path
        d="M4.7 15.3l7.6-7.6a2 2 0 012.8 0l3.2 3.2a2 2 0 010 2.8L13.6 19H8.1a1.4 1.4 0 01-1-.4l-2.4-2.4a1.3 1.3 0 010-1.9z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path d="M9.4 10.6l5.5 5.5" stroke="currentColor" strokeLinecap="round" />
      <path d="M9 20h11" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function Sharpener(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" {...props}>
      <path
        d="M4.5 7.5h15l-1.4 10a1.6 1.6 0 01-1.6 1.4H7.5a1.6 1.6 0 01-1.6-1.4l-1.4-10z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path d="M7.8 11.5h8.4" stroke="currentColor" strokeLinecap="round" />
      <path
        d="M10.5 15.2h3l-1.5 2.4-1.5-2.4z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Crayon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" {...props}>
      <path
        d="M12 2.6l3.2 4.6V19a1.8 1.8 0 01-1.8 1.8h-2.8A1.8 1.8 0 018.8 19V7.2L12 2.6z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path d="M8.8 9.6h6.4M8.8 12.4h6.4" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function GlueStick(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" {...props}>
      <rect x="7.5" y="8" width="9" height="12.5" rx="1.6" stroke="currentColor" />
      <path
        d="M9.5 8V4.6A1.6 1.6 0 0111 3h2a1.6 1.6 0 011.6 1.6V8"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path d="M7.5 12h9" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function StickyNote(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" {...props}>
      <path
        d="M5 4.5h14v9.4l-5.6 5.6H5V4.5z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path
        d="M19 13.9h-4a1.6 1.6 0 00-1.6 1.6v4"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path d="M8 8.5h7M8 11.5h4" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function Compass(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" {...props}>
      <circle cx="12" cy="4.6" r="1.8" stroke="currentColor" />
      <path
        d="M10.9 6.2L6.2 19.6M13.1 6.2L17.8 19.6"
        stroke="currentColor"
        strokeLinecap="round"
      />
      <path d="M9.2 14h5.6" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function Envelope(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" />
      <path
        d="M3.5 6.5L12 13l8.5-6.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Lock(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" {...props}>
      <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" />
      <path
        d="M8 10V7.5a4 4 0 018 0V10"
        stroke="currentColor"
        strokeLinecap="round"
      />
      <circle cx="12" cy="15" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function Eye({ closed = false, ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" {...props}>
      <path
        d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" />
      {closed ? (
        <path d="M4 20L20 4" stroke="currentColor" strokeLinecap="round" />
      ) : null}
    </svg>
  );
}

export function Basket(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" {...props}>
      <path
        d="M3.5 9h17l-1.7 9.2a2 2 0 01-2 1.8H7.2a2 2 0 01-2-1.8L3.5 9z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 9l2.2-5M15.5 9l-2.2-5"
        stroke="currentColor"
        strokeLinecap="round"
      />
      <path d="M10 13v3M14 13v3" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function Parcel(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" {...props}>
      <path
        d="M12 3l8.5 4.4v9.2L12 21l-8.5-4.4V7.4L12 3z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 7.4L12 11.8l8.5-4.4M12 11.8V21"
        stroke="currentColor"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Truck(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" {...props}>
      <path
        d="M2.5 7.5A1.5 1.5 0 014 6h9.5v10.5H2.5v-9z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 10H17l3.5 3.2v3.3h-7V10z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="17.5" r="1.8" stroke="currentColor" />
      <circle cx="16.5" cy="17.5" r="1.8" stroke="currentColor" />
    </svg>
  );
}
