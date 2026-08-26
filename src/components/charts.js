"use client";

import { useState } from "react";

/**
 * Small SVG chart set, built to fixed mark specs:
 *
 *   line 2px round-capped · area fill 10% · markers r>=4 with a 2px surface
 *   ring · bars capped at 24px with a 4px rounded data-end and square at the
 *   baseline · gridlines hairline, solid, one step off surface.
 *
 * Every chart here plots ONE series. Two measures of different scale get two
 * charts, never two y-axes on one plot — the alignment of a second scale is
 * arbitrary and invents a correlation the data does not contain.
 *
 * Strokes use vector-effect="non-scaling-stroke" so a 2px line stays 2px at
 * any container width.
 */

const GRID = "var(--chart-grid)";
const SURFACE = "var(--card)";

/** Round an axis maximum up to 1/2/5 × a power of ten. */
function niceMax(value) {
  if (!(value > 0)) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = value / magnitude;
  const rounded = step <= 1 ? 1 : step <= 2 ? 2 : step <= 5 ? 5 : 10;
  return rounded * magnitude;
}

/** Square at the baseline, 4px rounded at the data-end. */
function columnPath(x, y, width, height, radius = 4) {
  const r = Math.max(Math.min(radius, width / 2, height), 0);
  const bottom = y + height;
  return `M${x},${bottom} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${bottom} Z`;
}

/** Horizontal twin: square at the axis, 4px rounded at the tip. */
function barPath(x, y, width, height, radius = 4) {
  const r = Math.max(Math.min(radius, width, height / 2), 0);
  return `M${x},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height - r} Q${x + width},${y + height} ${x + width - r},${y + height} L${x},${y + height} Z`;
}

/** "2026-08-20" → "20 Aug", without constructing a Date per render. */
function shortDate(iso) {
  if (!iso) return "";
  const [, month, day] = iso.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${Number(day)} ${months[Number(month) - 1] || ""}`.trim();
}

/** Floating readout. Positioned in the container, not the SVG. */
function Tooltip({ x, title, rows }) {
  return (
    <div
      className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-lg border border-line bg-card px-2.5 py-1.5 text-xs shadow-lg"
      style={{ left: `${Math.min(Math.max(x, 12), 88)}%` }}
    >
      <p className="font-semibold text-ink">{title}</p>
      {rows.map((row) => (
        <p key={row.label} className="mt-0.5 whitespace-nowrap text-ink-soft">
          {row.label}: <span className="font-medium text-ink">{row.value}</span>
        </p>
      ))}
    </div>
  );
}

/** Shared y-axis furniture: 4 hairlines with rounded, right-aligned ticks. */
function Grid({ max, pad, innerW, innerH, format }) {
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <g>
      {ticks.map((ratio) => {
        const y = pad.top + innerH - ratio * innerH;
        return (
          <g key={ratio}>
            <line
              x1={pad.left}
              x2={pad.left + innerW}
              y1={y}
              y2={y}
              stroke={GRID}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={pad.left - 8}
              y={y + 3.5}
              textAnchor="end"
              className="fill-ink-soft text-[10px] tabular-nums"
            >
              {format(max * ratio)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Area + line over time — one series                                  */
/* ------------------------------------------------------------------ */

const W = 720;
const H = 200;
const PAD = { top: 14, right: 14, bottom: 26, left: 52 };

export function TimeAreaChart({ data, color, formatValue, valueKey = "value", label }) {
  const [hover, setHover] = useState(null);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const max = niceMax(Math.max(...data.map((d) => d[valueKey]), 0));

  // A single point has no span to divide by — centre it.
  const xAt = (index) =>
    data.length < 2 ? PAD.left + innerW / 2 : PAD.left + (index / (data.length - 1)) * innerW;
  const yAt = (value) => PAD.top + innerH - (value / max) * innerH;

  const points = data.map((day, index) => `${xAt(index)},${yAt(day[valueKey])}`);
  const line = points.length ? `M${points.join(" L")}` : "";
  const area = points.length
    ? `${line} L${xAt(data.length - 1)},${PAD.top + innerH} L${xAt(0)},${PAD.top + innerH} Z`
    : "";

  const last = data[data.length - 1];
  const active = hover === null ? null : data[hover];

  function trackPointer(event) {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / box.width;
    // Map the pointer into plot space, then to the nearest point index.
    const plotRatio = (ratio * W - PAD.left) / innerW;
    const index = Math.round(plotRatio * Math.max(data.length - 1, 1));
    setHover(Math.min(Math.max(index, 0), data.length - 1));
  }

  return (
    <div className="relative">
      {active ? (
        <Tooltip
          x={((xAt(hover) / W) * 100)}
          title={shortDate(active.date)}
          rows={[{ label, value: formatValue(active[valueKey]) }]}
        />
      ) : null}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        // No fixed height: the viewBox aspect sizes it, so the plot never
        // letterboxes inside a narrower card. The x-axis band is inside H.
        className="w-full"
        role="img"
        aria-label={`${label} over time`}
        onMouseMove={trackPointer}
        onMouseLeave={() => setHover(null)}
      >
        <Grid max={max} pad={PAD} innerW={innerW} innerH={innerH} format={formatValue} />

        <path d={area} fill={color} opacity="0.1" />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Endpoint marker only — never a dot on every point. */}
        {last ? (
          <circle
            cx={xAt(data.length - 1)}
            cy={yAt(last[valueKey])}
            r="4"
            fill={color}
            stroke={SURFACE}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}

        {/* Crosshair */}
        {active ? (
          <g>
            <line
              x1={xAt(hover)}
              x2={xAt(hover)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              stroke={color}
              strokeWidth="1"
              opacity="0.5"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={xAt(hover)}
              cy={yAt(active[valueKey])}
              r="4.5"
              fill={color}
              stroke={SURFACE}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ) : null}

        {/* First / last date only — enough to anchor the span. */}
        <text
          x={PAD.left}
          y={H - 6}
          className="fill-ink-soft text-[10px]"
          textAnchor="start"
        >
          {shortDate(data[0]?.date)}
        </text>
        <text
          x={PAD.left + innerW}
          y={H - 6}
          className="fill-ink-soft text-[10px]"
          textAnchor="end"
        >
          {shortDate(last?.date)}
        </text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Columns over time — one series                                      */
/* ------------------------------------------------------------------ */

export function TimeColumnChart({ data, color, formatValue, valueKey = "value", label }) {
  const [hover, setHover] = useState(null);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const max = niceMax(Math.max(...data.map((d) => d[valueKey]), 0));

  const band = innerW / Math.max(data.length, 1);
  // Capped at 24px, and never wider than the band less a 2px surface gap.
  const width = Math.max(Math.min(24, band - 2), 1);

  return (
    <div className="relative">
      {hover !== null && data[hover] ? (
        <Tooltip
          x={((PAD.left + band * (hover + 0.5)) / W) * 100}
          title={shortDate(data[hover].date)}
          rows={[{ label, value: formatValue(data[hover][valueKey]) }]}
        />
      ) : null}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        // No fixed height: the viewBox aspect sizes it, so the plot never
        // letterboxes inside a narrower card. The x-axis band is inside H.
        className="w-full"
        role="img"
        aria-label={`${label} over time`}
        onMouseLeave={() => setHover(null)}
      >
        <Grid max={max} pad={PAD} innerW={innerW} innerH={innerH} format={formatValue} />

        {data.map((day, index) => {
          const height = (day[valueKey] / max) * innerH;
          const x = PAD.left + band * (index + 0.5) - width / 2;
          const y = PAD.top + innerH - height;

          return (
            <g key={day.date || index}>
              {/* Hit target spans the whole band, so a 1px column is hoverable. */}
              <rect
                x={PAD.left + band * index}
                y={PAD.top}
                width={band}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHover(index)}
              />
              <path
                d={columnPath(x, y, width, Math.max(height, 0))}
                fill={color}
                opacity={hover === null || hover === index ? 1 : 0.45}
                pointerEvents="none"
              />
            </g>
          );
        })}

        <text x={PAD.left} y={H - 6} className="fill-ink-soft text-[10px]" textAnchor="start">
          {shortDate(data[0]?.date)}
        </text>
        <text
          x={PAD.left + innerW}
          y={H - 6}
          className="fill-ink-soft text-[10px]"
          textAnchor="end"
        >
          {shortDate(data[data.length - 1]?.date)}
        </text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ranked horizontal bars — one measure, one hue                       */
/* ------------------------------------------------------------------ */

/**
 * One colour for every bar. Shading each bar by its own value would
 * double-encode length as hue and burn the only free channel on information
 * the bar length already carries.
 */
export function RankedBarChart({ rows, color, formatValue }) {
  const max = Math.max(...rows.map((row) => row.value), 0) || 1;

  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.id || row.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-ink">{row.label}</span>
            {/* Value at the tip — as text, in an ink token, never the hue. */}
            <span className="shrink-0 font-medium tabular-nums text-ink">
              {formatValue(row.value)}
            </span>
          </div>

          {/* Plain elements rather than a stretched SVG: a non-uniform scale
              turns a 4px corner radius into a lozenge. */}
          <span
            className="mt-1.5 block h-2 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: GRID }}
          >
            <span
              className="block h-full rounded-r-[4px] transition-[width] duration-500"
              style={{
                width: `${Math.max((row.value / max) * 100, 1)}%`,
                backgroundColor: color,
              }}
            />
          </span>

          {row.note ? <p className="mt-1 text-xs text-ink-soft">{row.note}</p> : null}
        </li>
      ))}
    </ul>
  );
}
