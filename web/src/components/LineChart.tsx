import { useMemo, useRef, useState } from "react";
import type { Snapshot } from "../types";
import { formatFullDate, formatPoints, niceCeiling } from "../lib";
import { isDarkMode, seriesColor } from "../palette";

interface Props {
  history: Snapshot[];
  seriesOrder: string[];
  names: Map<string, string>;
}

const WIDTH = 760;
const HEIGHT = 380;
const PAD = { top: 20, right: 24, bottom: 32, left: 56 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

export function LineChart({ history, seriesOrder, names }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const dark = isDarkMode();

  const times = history.map((s) => new Date(s.fetched_at).getTime());
  const tMin = times[0] ?? 0;
  const tMax = times[times.length - 1] ?? 1;
  const tSpan = tMax - tMin || 1;

  const xAt = (i: number) =>
    history.length > 1 ? PAD.left + ((times[i] - tMin) / tSpan) * PLOT_W : PAD.left + PLOT_W / 2;

  const maxPoints = useMemo(() => {
    let m = 0;
    for (const s of history) for (const e of s.entries) m = Math.max(m, e.points);
    return m;
  }, [history]);
  const yMax = niceCeiling(maxPoints || 100);
  const yAt = (v: number) => PAD.top + PLOT_H - (v / yMax) * PLOT_H;

  const seriesPaths = useMemo(() => {
    return seriesOrder.map((guid, slot) => {
      const pts: { x: number; y: number; points: number }[] = [];
      history.forEach((snap, i) => {
        const entry = snap.entries.find((e) => e.user_guid === guid);
        if (entry) pts.push({ x: xAt(i), y: yAt(entry.points), points: entry.points });
      });
      const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
      return { guid, slot, pts, d };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, seriesOrder, yMax]);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f));

  function handleMove(e: React.PointerEvent<SVGRectElement>) {
    const svg = svgRef.current;
    if (!svg || history.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const scale = WIDTH / rect.width;
    const px = (e.clientX - rect.left) * scale;
    let nearest = 0;
    let best = Infinity;
    history.forEach((_, i) => {
      const d = Math.abs(xAt(i) - px);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    setHoverIdx(nearest);
  }

  const hoverSnap = hoverIdx !== null ? history[hoverIdx] : null;
  const hoverRows =
    hoverSnap &&
    seriesOrder
      .map((guid, slot) => {
        const entry = hoverSnap.entries.find((e) => e.user_guid === guid);
        return entry ? { guid, slot, name: names.get(guid) ?? guid, points: entry.points } : null;
      })
      .filter((r): r is { guid: string; slot: number; name: string; points: number } => r !== null)
      .sort((a, b) => b.points - a.points);

  return (
    <div className="chart-card">
      <div className="chart-svg-wrap">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Динаміка очок учасників ліги за час"
          className="chart-svg"
        >
          {yTicks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={yAt(t)}
                y2={yAt(t)}
                className="gridline"
              />
              <text x={PAD.left - 10} y={yAt(t)} className="axis-label" textAnchor="end" dy="0.32em">
                {formatPoints(t)}
              </text>
            </g>
          ))}
          <line
            x1={PAD.left}
            x2={PAD.left}
            y1={PAD.top}
            y2={PAD.top + PLOT_H}
            className="axis-line"
          />
          <line
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={PAD.top + PLOT_H}
            y2={PAD.top + PLOT_H}
            className="axis-line"
          />

          {seriesPaths.map(({ guid, slot, pts, d }) => (
            <g key={guid}>
              {pts.length > 1 && (
                <path d={d} fill="none" stroke={seriesColor(slot, dark)} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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
          <div
            className="tooltip"
            style={{
              left: `${(xAt(hoverIdx!) / WIDTH) * 100}%`,
            }}
          >
            <div className="tooltip-date">{formatFullDate(hoverSnap.fetched_at)}</div>
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
