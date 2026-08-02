"use client";

import { useCallback, useMemo, useRef, useState } from "react";

export type ChartPoint = {
  label: string;
  value: number;
  muted?: boolean;
  /** Shown in tooltip; falls back to label */
  title?: string;
};

type Tip = {
  x: number;
  y: number;
  title: string;
  value: string;
};

function ChartShell({
  height,
  children,
  tip,
}: {
  height: number;
  children: React.ReactNode;
  tip: Tip | null;
}) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 sm:p-4"
      style={{ minHeight: height }}
    >
      {children}
      {tip ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-lg bg-[var(--moss-deep)] px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{ left: tip.x, top: tip.y }}
        >
          <p className="font-medium tabular-nums">
            {tip.value}
          </p>
          <p className="text-[10px] text-[var(--sidebar-muted)]">{tip.title}</p>
          <span className="absolute left-1/2 top-full -mt-px h-0 w-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-[var(--moss-deep)]" />
        </div>
      ) : null}
    </div>
  );
}

export function LineChart({
  points,
  height = 200,
  valueSuffix = "",
  accent = "var(--moss)",
  threshold,
  valueDigits = 1,
}: {
  points: ChartPoint[];
  height?: number;
  valueSuffix?: string;
  accent?: string;
  threshold?: number;
  valueDigits?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const [active, setActive] = useState<number | null>(null);

  const width = 640;
  const padX = 36;
  const padY = 28;
  const values = points.map((p) => p.value);
  const minV = points.length
    ? Math.min(...values, threshold ?? values[0])
    : 0;
  const maxV = points.length
    ? Math.max(...values, threshold ?? values[0])
    : 1;
  const span = Math.max(maxV - minV, 1);
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const xAt = useCallback(
    (i: number) => {
      if (points.length <= 1) return padX + innerW / 2;
      return padX + (i / (points.length - 1)) * innerW;
    },
    [points.length, innerW],
  );
  const yAt = useCallback(
    (v: number) => padY + ((maxV - v) / span) * innerH,
    [maxV, span, innerH],
  );

  const path = useMemo(
    () =>
      points
        .map(
          (p, i) =>
            `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(p.value).toFixed(1)}`,
        )
        .join(" "),
    [points, xAt, yAt],
  );

  const area = points.length
    ? `${path} L ${xAt(points.length - 1).toFixed(1)} ${padY + innerH} L ${xAt(0).toFixed(1)} ${padY + innerH} Z`
    : "";

  const thresholdY = threshold != null ? yAt(threshold) : null;
  const labelStep = Math.max(1, Math.ceil(points.length / 7));

  function showTip(i: number, clientX: number, clientY: number) {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const p = points[i];
    const formatted =
      valueSuffix === "p" || Number.isInteger(p.value)
        ? String(Math.round(p.value * 10) / 10)
        : p.value.toFixed(valueDigits);
    setActive(i);
    setTip({
      x: clientX - rect.left,
      y: clientY - rect.top,
      title: p.title ?? p.label,
      value: `${formatted}${valueSuffix}`,
    });
  }

  function nearestIndex(svgX: number) {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < points.length; i += 1) {
      const d = Math.abs(xAt(i) - svgX);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  if (points.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-dashed border-[var(--line)] text-sm text-[var(--muted)]"
        style={{ height }}
      >
        No data in this range
      </div>
    );
  }

  return (
    <div ref={wrapRef}>
      <ChartShell height={height} tip={tip}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full touch-none"
          role="img"
          aria-label="Line chart"
          onMouseLeave={() => {
            setTip(null);
            setActive(null);
          }}
          onMouseMove={(e) => {
            const svg = e.currentTarget;
            const rect = svg.getBoundingClientRect();
            const svgX = ((e.clientX - rect.left) / rect.width) * width;
            const i = nearestIndex(svgX);
            showTip(i, e.clientX, e.clientY);
          }}
          onTouchStart={(e) => {
            const t = e.touches[0];
            if (!t) return;
            const svg = e.currentTarget;
            const rect = svg.getBoundingClientRect();
            const svgX = ((t.clientX - rect.left) / rect.width) * width;
            const i = nearestIndex(svgX);
            showTip(i, t.clientX, t.clientY);
          }}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = padY + t * innerH;
            const v = maxV - t * span;
            return (
              <g key={t}>
                <line
                  x1={padX}
                  x2={width - padX}
                  y1={y}
                  y2={y}
                  stroke="var(--line)"
                  strokeWidth={1}
                />
                <text
                  x={padX - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="var(--muted)"
                  fontSize={10}
                >
                  {Math.round(v)}
                  {valueSuffix}
                </text>
              </g>
            );
          })}

          {thresholdY != null ? (
            <line
              x1={padX}
              x2={width - padX}
              y1={thresholdY}
              y2={thresholdY}
              stroke="var(--observe)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          ) : null}

          <path d={area} fill={accent} opacity={0.12} />
          <path
            d={path}
            fill="none"
            stroke={accent}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {points.map((p, i) => (
            <circle
              key={`${p.label}-${i}`}
              cx={xAt(i)}
              cy={yAt(p.value)}
              r={active === i ? 6 : points.length > 40 ? 2.5 : 4}
              fill={p.muted ? "var(--observe)" : accent}
              stroke={active === i ? "white" : "none"}
              strokeWidth={2}
            />
          ))}

          {points.map((p, i) =>
            i % labelStep === 0 || i === points.length - 1 ? (
              <text
                key={`lbl-${i}`}
                x={xAt(i)}
                y={height - 6}
                textAnchor="middle"
                fill="var(--muted)"
                fontSize={10}
              >
                {p.label}
              </text>
            ) : null,
          )}
        </svg>
      </ChartShell>
    </div>
  );
}

export function BarChart({
  points,
  height = 200,
  valueSuffix = "",
  accent = "var(--moss)",
  threshold,
}: {
  points: ChartPoint[];
  height?: number;
  valueSuffix?: string;
  accent?: string;
  threshold?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const [active, setActive] = useState<number | null>(null);

  const width = 640;
  const padX = 36;
  const padY = 28;
  const values = points.map((p) => p.value);
  const minV = Math.min(0, ...values, threshold ?? 0);
  const maxV = Math.max(...values, threshold ?? 0, 1);
  const span = Math.max(maxV - minV, 1);
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const gap = points.length > 20 ? 2 : 4;
  const barW = Math.max(4, innerW / points.length - gap);
  const zeroY = padY + ((maxV - 0) / span) * innerH;

  function xAt(i: number) {
    return padX + i * (innerW / points.length) + gap / 2;
  }
  function yAt(v: number) {
    return padY + ((maxV - v) / span) * innerH;
  }

  const labelStep = Math.max(1, Math.ceil(points.length / 7));
  const thresholdY = threshold != null ? yAt(threshold) : null;

  function showTip(i: number, clientX: number, clientY: number) {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const p = points[i];
    setActive(i);
    setTip({
      x: clientX - rect.left,
      y: clientY - rect.top,
      title: p.title ?? p.label,
      value: `${Math.round(p.value * 10) / 10}${valueSuffix}`,
    });
  }

  if (points.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-dashed border-[var(--line)] text-sm text-[var(--muted)]"
        style={{ height }}
      >
        No data in this range
      </div>
    );
  }

  return (
    <div ref={wrapRef}>
      <ChartShell height={height} tip={tip}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full touch-none"
          role="img"
          aria-label="Bar chart"
          onMouseLeave={() => {
            setTip(null);
            setActive(null);
          }}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = padY + t * innerH;
            const v = maxV - t * span;
            return (
              <g key={t}>
                <line
                  x1={padX}
                  x2={width - padX}
                  y1={y}
                  y2={y}
                  stroke="var(--line)"
                  strokeWidth={1}
                />
                <text
                  x={padX - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="var(--muted)"
                  fontSize={10}
                >
                  {Math.round(v)}
                  {valueSuffix}
                </text>
              </g>
            );
          })}

          {thresholdY != null ? (
            <line
              x1={padX}
              x2={width - padX}
              y1={thresholdY}
              y2={thresholdY}
              stroke="var(--observe)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          ) : null}

          <line
            x1={padX}
            x2={width - padX}
            y1={zeroY}
            y2={zeroY}
            stroke="var(--ink-soft)"
            strokeWidth={1}
            opacity={0.35}
          />

          {points.map((p, i) => {
            const y = yAt(p.value);
            const h = Math.abs(zeroY - y);
            const top = Math.min(y, zeroY);
            return (
              <rect
                key={`${p.label}-${i}`}
                x={xAt(i)}
                y={top}
                width={barW}
                height={Math.max(h, 1)}
                rx={3}
                fill={p.muted ? "var(--observe)" : accent}
                opacity={active === i ? 1 : 0.88}
                className="cursor-pointer"
                onMouseEnter={(e) => showTip(i, e.clientX, e.clientY)}
                onMouseMove={(e) => showTip(i, e.clientX, e.clientY)}
                onTouchStart={(e) => {
                  const t = e.touches[0];
                  if (t) showTip(i, t.clientX, t.clientY);
                }}
              />
            );
          })}

          {points.map((p, i) =>
            i % labelStep === 0 || i === points.length - 1 ? (
              <text
                key={`lbl-${i}`}
                x={xAt(i) + barW / 2}
                y={height - 6}
                textAnchor="middle"
                fill="var(--muted)"
                fontSize={10}
              >
                {p.label}
              </text>
            ) : null,
          )}
        </svg>
      </ChartShell>
    </div>
  );
}
