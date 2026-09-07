import type { Entry } from "./types";

/** Stable series order: first appearance in the earliest snapshot, by rank.
 * Colors must follow the entity, never its current rank. */
export function buildSeriesOrder(history: { entries: Entry[] }[]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const snap of history) {
    const sorted = [...snap.entries].sort((a, b) => a.rank - b.rank);
    for (const e of sorted) {
      if (!seen.has(e.user_guid)) {
        seen.add(e.user_guid);
        order.push(e.user_guid);
      }
    }
  }
  return order;
}

/** Round a max value up to a "nice" number for axis ticks (0, 500, 1000, ...). */
export function niceCeiling(value: number, steps = 5): number {
  if (value <= 0) return steps;
  const rough = value / steps;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const residual = rough / magnitude;
  let niceResidual: number;
  if (residual > 5) niceResidual = 10;
  else if (residual > 2) niceResidual = 5;
  else if (residual > 1) niceResidual = 2;
  else niceResidual = 1;
  const step = niceResidual * magnitude;
  return Math.ceil(value / step) * step;
}

export function formatPoints(value: number): string {
  return Math.round(value).toLocaleString("uk-UA");
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
}

export function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("uk-UA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
