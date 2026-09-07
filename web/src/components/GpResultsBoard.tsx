import { useMemo } from "react";
import type { GpNames, GpSnapshot } from "../types";
import { seriesColor } from "../palette";
import { GpResultCard } from "./GpResultCard";

interface Props {
  gpHistory: GpSnapshot[];
  seriesOrder: string[];
  gpNames: GpNames;
}

export function GpResultsBoard({ gpHistory, seriesOrder, gpNames }: Props) {
  const colorMap = useMemo(() => {
    const m = new Map<string, string>();
    seriesOrder.forEach((guid, slot) => m.set(guid, seriesColor(slot, true)));
    return m;
  }, [seriesOrder]);
  const colorFor = (guid: string) => colorMap.get(guid) ?? "#898781";

  const newestFirst = [...gpHistory].sort((a, b) => b.gp_id - a.gp_id);

  return (
    <div className="gp-board">
      {newestFirst.map((gp) => (
        <GpResultCard
          key={gp.gp_id}
          gp={gp}
          gpName={gpNames[String(gp.gp_id)] ?? `Гран-прі №${gp.gp_id}`}
          colorFor={colorFor}
        />
      ))}
    </div>
  );
}
