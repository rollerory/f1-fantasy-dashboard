import { useEffect, useState } from "react";
import type { Snapshot } from "./types";

interface HistoryState {
  data: Snapshot[] | null;
  error: string | null;
  loading: boolean;
}

export function useHistory(): HistoryState {
  const [state, setState] = useState<HistoryState>({
    data: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    const url = `${import.meta.env.BASE_URL}data/history.json`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Snapshot[]>;
      })
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ data: null, error: String(err), loading: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
