import type { Entry, GpSnapshot } from "../types";
import { formatPoints } from "../lib";
import { Helmet } from "./Helmet";

interface Props {
  gp: GpSnapshot;
  gpName: string;
  colorFor: (guid: string) => string;
}

const PODIUM_ORDER = [2, 1, 3]; // visual left-to-right, matching broadcast graphics

function PodiumSlot({ entry, colorFor }: { entry: Entry; colorFor: (guid: string) => string }) {
  const color = colorFor(entry.user_guid);
  return (
    <div className={`podium-slot podium-slot-${entry.rank}`} style={{ ["--slot-color" as string]: color }}>
      <span className="podium-rank">{entry.rank}</span>
      <Helmet color={color} size={entry.rank === 1 ? 64 : 48} />
      <span className="podium-name">{entry.user_name}</span>
      <span className="podium-points">
        {formatPoints(entry.points)} <small>PTS</small>
      </span>
    </div>
  );
}

export function GpResultCard({ gp, gpName, colorFor }: Props) {
  const sorted = [...gp.entries].sort((a, b) => a.rank - b.rank);
  const podium = PODIUM_ORDER.map((rank) => sorted.find((e) => e.rank === rank)).filter(
    (e): e is Entry => e !== undefined
  );
  const rest = sorted.filter((e) => e.rank > 3);

  return (
    <div className="gp-card">
      <div className="gp-card-header">
        <span className="gp-round">ROUND {gp.gp_id}</span>
        <span className="gp-name">{gpName}</span>
      </div>

      <div className="podium-row">
        {podium.map((e) => (
          <PodiumSlot key={e.user_guid} entry={e} colorFor={colorFor} />
        ))}
      </div>

      <div className="gp-list">
        {rest.map((e) => (
          <div className="gp-list-row" key={e.user_guid}>
            <span className="gp-list-rank">{e.rank}</span>
            <span className="gp-list-swatch" style={{ background: colorFor(e.user_guid) }} />
            <span className="gp-list-name">{e.user_name}</span>
            <span className="gp-list-points">{formatPoints(e.points)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
