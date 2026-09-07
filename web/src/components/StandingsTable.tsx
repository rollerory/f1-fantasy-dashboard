import type { Entry } from "../types";
import { formatPoints } from "../lib";

function TrendBadge({ trend }: { trend: number }) {
  if (trend === 0) {
    return <span className="trend trend-flat">—</span>;
  }
  const up = trend > 0;
  return (
    <span className={up ? "trend trend-up" : "trend trend-down"}>
      {up ? "▲" : "▼"} {Math.abs(trend)}
    </span>
  );
}

export function StandingsTable({ entries }: { entries: Entry[] }) {
  const sorted = [...entries].sort((a, b) => a.rank - b.rank);
  return (
    <div className="table-card">
      <table className="standings">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Учасник</th>
            <th scope="col">Команда</th>
            <th scope="col">Очки</th>
            <th scope="col">Тренд</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((e) => (
            <tr key={e.user_guid}>
              <td className="num">{e.rank}</td>
              <td>{e.user_name}</td>
              <td className="muted">{e.team_name}</td>
              <td className="num">{formatPoints(e.points)}</td>
              <td>
                <TrendBadge trend={e.trend} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
