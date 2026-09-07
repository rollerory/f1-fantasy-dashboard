import { useMemo, useRef, useState } from "react";
import type { GpSnapshot, GpNames } from "../types";
import { formatPoints, niceCeiling } from "../lib";
import { isDarkMode, seriesColor } from "../palette";

interface Props {
  gpHistory: GpSnapshot[];
  seriesOrder: string[];
  names: Map<string, string>;
  gpNames: GpNames;
}

const WIDTH = 760;
const HEIGHT = 380;
const PAD = { top: 20, right: 24, bottom: 44, left: 56 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

function gpLabel(gpNames: GpNames, gp: GpSnapshot): string {
  return gpNames[String(gp.gp_id)] ?? `ГП №${gp.gp_id}`;
}

export function GpPointsChart({ gpHistory, seriesOrder, names, gpNames }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const dark = isDarkMode();

  const n = gpHistory.length;
  const xAt = (i: number) => (n > 1 ? PAD.left + (i / (n - 1)) * PLOT_W : PAD.left + PLOT_W / 2);

  const maxPoints = useMemo(() => {
    let m = 0;
    for (const s of gpHistory) for (const e of s.entries) m = Math.max(m, e.points);
    return m;
  }, [gpHistory]);
  const yMax = niceCeiling(maxPoints || 50);
  const yAt = (v: number) => PAD.top + PLOT_H - (v / yMax) * PLOT_H;

  const seriesPaths = useMemo(() => {
    return seriesOrder.map((guid, slot) => {
      const pts: { x: number; y: number; points: number }[] = [];
      gpHistory.forEach((snap, i) => {
        const entry = snap.entries.find((e) => e.user_guid === guid);
        if (entry) pts.push({ x: xAt(i), y: yAt(entry.points), points: entry.points });
      });
      const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
      return { guid, slot, pts, d };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpHistory, seriesOrder, yMax]);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f));

  function handleMove(e: React.PointerEvent<SVGRectElement>) {
    const svg = svgRef.current;
    if (!svg || n === 0) return;
    const rect = svg.getBoundingClientRect();
    const scale = WIDTH / rect.width;
    const px = (e.clientX - rect.left) * scale;
    let nearest = 0;
    let best = Infinity;
    gpHistory.forEach((_, i) => {
      const d = Math.abs(xAt(i) - px);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    setHoverIdx(nearest);
  }

  const hoverSnap = hoverIdx !== null ? gpHistory[hoverIdx] : null;
  const hoverRows =
    hoverSnap &&
    seriesOrder
      .map((guid, slot) => {
        const entry = hoverSnap.entries.find((e) => e.user_guid === guid);
        return entry ? { guid, slot, name: names.get(guid) ?? guid, points: entry.points } : null;
      })
      .filter((r): r is { guid: string; slot: number; name: string; points: number } => r !== null)
      .sort((a, b) => b.points - a.points);

  // Show every x label if few GPs, thin them out otherwise so they don't collide.
  const labelStride = n <= 8 ? 1 : Math.ceil(n / 8);

  return (
    <div className="chart-card">
      <div className="chart-svg-wrap">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Очки учасників по кожному Гран-прі"
          className="chart-svg"
        >
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={yAt(t)} y2={yAt(t)} className="gridline" />
              <text x={PAD.left - 10} y={yAt(t)} className="axis-label" textAnchor="end" dy="0.32em">
                {formatPoints(t)}
              </text>
            </g>
          ))}
          <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={PAD.top + PLOT_H} className="axis-line" />
          <line
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={PAD.top + PLOT_H}
            y2={PAD.top + PLOT_H}
            className="axis-line"
          />

          {gpHistory.map((gp, i) =>
            i % labelStride === 0 ? (
              <text
                key={gp.gp_id}
                x={xAt(i)}
                y={PAD.top + PLOT_H + 16}
                className="axis-label"
                textAnchor="middle"
              >
                {gpLabel(gpNames, gp).replace(" GP", "")}
              </text>
            ) : null
          )}

          {seriesPaths.map(({ guid, slot, pts, d }) => (
            <g key={guid}>
              {pts.length > 1 && (
                <path
                  d={d}
                  fill="none"
                  stroke={seriesColor(slot, dark)}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {pts.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={5}
                  fill={seriesColor(slot, dark)}
                  stroke="var(--surface-1)"
                  strokeWidth={2}
                />
              ))}
            </g>
          ))}

          {hoverIdx !== null && (
            <line
              x1={xAt(hoverIdx)}
              x2={xAt(hoverIdx)}
              y1={PAD.top}
              y2={PAD.top + PLOT_H}
              className="crosshair"
            />
          )}

          <rect
            x={PAD.left}
            y={PAD.top}
            width={PLOT_W}
            height={PLOT_H}
            fill="transparent"
            onPointerMove={handleMove}
            onPointerLeave={() => setHoverIdx(null)}
          />
        </svg>

        {hoverSnap && hoverRows && (
          <div className="tooltip" style={{ left: `${(xAt(hoverIdx!) / WIDTH) * 100}%` }}>
            <div className="tooltip-date">{gpLabel(gpNames, hoverSnap)}</div>
            {hoverRows.map((r) => (
              <div className="tooltip-row" key={r.guid}>
                <span className="tooltip-key" style={{ background: seriesColor(r.slot, dark) }} />
                <span className="tooltip-name">{r.name}</span>
                <span className="tooltip-value">{formatPoints(r.points)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="legend">
        {seriesOrder.map((guid, slot) => (
          <span className="legend-item" key={guid}>
            <span className="legend-swatch" style={{ background: seriesColor(slot, dark) }} />
            {names.get(guid) ?? guid}
          </span>
        ))}
      </div>
    </div>
  );
}
