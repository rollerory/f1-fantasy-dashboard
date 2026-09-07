import { useMemo } from "react";
import "./App.css";
import { useJson } from "./useJson";
import { buildSeriesOrder, formatFullDate, formatPoints } from "./lib";
import { RankChart } from "./components/RankChart";
import { GpResultsBoard } from "./components/GpResultsBoard";
import { StandingsTable } from "./components/StandingsTable";
import { StatTile } from "./components/StatTile";
import type { Snapshot, GpSnapshot, GpNames } from "./types";

const LEAGUE_URL = "https://fantasy.formula1.com/en/leagues/leaderboard/private/12834205";

function App() {
  const { data, error, loading } = useJson<Snapshot[]>("data/history.json");
  const { data: gpData } = useJson<GpSnapshot[]>("data/gp_history.json");
  const { data: gpNamesData } = useJson<GpNames>("data/gp_names.json");
  const gpNames = gpNamesData ?? {};

  const history = useMemo(() => {
    if (!data) return [];
    return [...data].sort(
      (a, b) => new Date(a.fetched_at).getTime() - new Date(b.fetched_at).getTime()
    );
  }, [data]);

  const gpHistory = useMemo(() => {
    if (!gpData) return [];
    return [...gpData].sort((a, b) => a.gp_id - b.gp_id);
  }, [gpData]);

  const latest = history[history.length - 1];
  const seriesOrder = useMemo(() => buildSeriesOrder(history), [history]);
  const names = useMemo(() => {
    const m = new Map<string, string>();
    for (const snap of history) {
      for (const e of snap.entries) m.set(e.user_guid, e.user_name);
    }
    for (const snap of gpHistory) {
      for (const e of snap.entries) if (!m.has(e.user_guid)) m.set(e.user_guid, e.user_name);
    }
    return m;
  }, [history, gpHistory]);

  const sortedLatest = latest ? [...latest.entries].sort((a, b) => a.rank - b.rank) : [];
  const leader = sortedLatest[0];
  const runnerUp = sortedLatest[1];
  const gap = leader && runnerUp ? leader.points - runnerUp.points : null;

  return (
    <div className="page">
      <header className="page-header">
        <h1>F1 Fantasy — наша ліга</h1>
        <a className="league-link" href={LEAGUE_URL} target="_blank" rel="noreferrer">
          Відкрити лігу на fantasy.formula1.com ↗
        </a>
      </header>

      {loading && <p className="status">Завантаження даних…</p>}
      {error && (
        <p className="status status-error">
          Не вдалося завантажити data/history.json ({error}).
        </p>
      )}

      {latest && (
        <>
          <div className="stat-row">
            <StatTile label="Лідер ліги" value={leader.user_name} sub={`${formatPoints(leader.points)} очок`} />
            <StatTile
              label="Відрив від 2-го місця"
              value={gap !== null ? `${formatPoints(gap)} очок` : "—"}
              sub={runnerUp ? runnerUp.user_name : undefined}
            />
            <StatTile label="Останнє оновлення" value={formatFullDate(latest.fetched_at)} />
          </div>

          {gpHistory.length > 0 && (
            <section>
              <h2>Динаміка позицій за сезон</h2>
              <RankChart gpHistory={gpHistory} seriesOrder={seriesOrder} names={names} gpNames={gpNames} />
            </section>
          )}

          {gpHistory.length > 0 && (
            <section>
              <h2>Результати по Гран-прі</h2>
              <GpResultsBoard gpHistory={gpHistory} seriesOrder={seriesOrder} gpNames={gpNames} />
            </section>
          )}

          <section>
            <h2>Поточна турнірна таблиця</h2>
            <StandingsTable entries={latest.entries} />
          </section>
        </>
      )}
    </div>
  );
}

export default App;
