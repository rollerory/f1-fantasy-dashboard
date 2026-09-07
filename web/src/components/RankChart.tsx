import { useMemo, useRef, useState } from "react";
import type { GpNames } from "../types";
import { computeCumulativeStandings, formatPoints } from "../lib";
import { isDarkMode, seriesColor } from "../palette";
import type { GpSnapshot } from "../types";

interface Props {
  gpHistory: GpSnapshot[];
  seriesOrder: string[];
  names: Map<string, string>;
  gpNames: GpNames;
}

const WIDTH = 860;
const HEIGHT = 400;
const PAD = { top: 16, right: 24, bottom: 32, left: 176 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

function gpLabel(gpNames: GpNames, gpId: number): string {
  return gpNames[String(gpId)] ?? `ГП №${gpId}`;
}

export function RankChart({ gpHistory, seriesOrder, names, gpNames }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const dark = isDarkMode();

  const standings = useMemo(() => computeCumulativeStandings(gpHistory), [gpHistory]);
  const n = standings.length;
  const participantCount = seriesOrder.length || 1;

  const xAt = (i: number) => (n > 1 ? PAD.left + (i / (n - 1)) * PLOT_W : PAD.left + PLOT_W / 2);
  const yForRank = (rank: number) => PAD.top + ((rank - 0.5) / participantCount) * PLOT_H;

  const colorFor = (guid: string) => seriesColor(seriesOrder.indexOf(guid), dark);

  const seriesLines = useMemo(() => {
    return seriesOrder.map((guid) => {
      const pts = standings
        .map((s, i) => {
          const st = s.standings.get(guid);
          return st ? { x: xAt(i), y: yForRank(st.rank), rank: st.rank, points: st.points } : null;
        })
        .filter((p): p is { x: number; y: number; rank: number; points: number } => p !== null);
      const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
      return { guid, pts, d };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [standings, seriesOrder]);

  const leftOrder = useMemo(() => {
    const last = standings[standings.length - 1];
    if (!last) return seriesOrder;
    return [...seriesOrder].sort(
      (a, b) => (last.standings.get(a)?.rank ?? 99) - (last.standings.get(b)?.rank ?? 99)
    );
  }, [standings, seriesOrder]);

  function handleMove(e: React.PointerEvent<SVGRectElement>) {
    const svg = svgRef.current;
    if (!svg || n === 0) return;
    const rect = svg.getBoundingClientRect();
    const scale = WIDTH / rect.width;
    const px = (e.clientX - rect.left) * scale;
    let nearest = 0;
    let best = Infinity;
    standings.forEach((_, i) => {
      const d = Math.abs(xAt(i) - px);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    setHoverIdx(nearest);
  }

  const hoverStanding = hoverIdx !== null ? standings[hoverIdx] : null;
  const hoverRows =
    hoverStanding &&
    seriesOrder
      .map((guid) => {
        const st = hoverStanding.standings.get(guid);
        return st ? { guid, name: names.get(guid) ?? guid, ...st } : null;
      })
      .filter((r): r is { guid: string; name: string; points: number; rank: number } => r !== null)
      .sort((a, b) => a.rank - b.rank);

  const labelStride = n <= 8 ? 1 : Math.ceil(n / 8);

  return (
    <div className="chart-card">
      <div className="chart-svg-wrap">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Позиції учасників у загальному заліку після кожного Гран-прі"
          className="chart-svg"
        >
          {Array.from({ length: participantCount }, (_, i) => i + 1).map((rank) => (
            <line
              key={rank}
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={yForRank(rank)}
              y2={yForRank(rank)}
              className="gridline"
            />
          ))}

          {leftOrder.map((guid) => {
            const rank = standings[standings.length - 1]?.standings.get(guid)?.rank;
            if (rank === undefined) return null;
            return (
              <g key={guid}>
                <circle cx={14} cy={yForRank(rank)} r={4} fill={colorFor(guid)} />
                <text x={26} y={yForRank(rank)} className="rank-label" dy="0.32em">
                  {names.get(guid) ?? guid}
                </text>
              </g>
            );
          })}

          {gpHistory.length > 0 &&
            standings.map((s, i) =>
              i % labelStride === 0 ? (
                <text
                  key={s.gp.gp_id}
                  x={xAt(i)}
                  y={PAD.top + PLOT_H + 18}
                  className="axis-label"
                  textAnchor="middle"
                >
                  {gpLabel(gpNames, s.gp.gp_id).replace(" GP", "")}
                </text>
              ) : null
            )}

          {seriesLines.map(({ guid, pts, d }) => (
            <g key={guid}>
              {pts.length > 1 && (
                <path
                  d={d}
                  fill="none"
                  stroke={colorFor(guid)}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {pts.map((p, i) => {
                const isLast = i === pts.length - 1;
                return (
                  <g key={i}>
                    {isLast && (
                      <circle cx={p.x} cy={p.y} r={9} fill="none" stroke={colorFor(guid)} strokeWidth={2} />
                    )}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={5}
                      fill={colorFor(guid)}
                      stroke="var(--surface-1)"
                      strokeWidth={2}
                    />
                  </g>
                );
              })}
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

        {hoverStanding && hoverRows && (
          <div className="tooltip" style={{ left: `${(xAt(hoverIdx!) / WIDTH) * 100}%` }}>
            <div className="tooltip-date">{gpLabel(gpNames, hoverStanding.gp.gp_id)}</div>
            {hoverRows.map((r) => (
              <div className="tooltip-row" key={r.guid}>
                <span className="tooltip-key" style={{ background: colorFor(r.guid) }} />
                <span className="tooltip-name">{r.name}</span>
                <span className="tooltip-value">
                  #{r.rank} <small>{formatPoints(r.points)}</small>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
