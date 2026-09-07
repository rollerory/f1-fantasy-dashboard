import { useEffect, useState } from "react";

interface JsonState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export function useJson<T>(path: string): JsonState<T> {
  const [state, setState] = useState<JsonState<T>>({
    data: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    const url = `${import.meta.env.BASE_URL}${path}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<T>;
      })
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, error: String(err), loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  return state;
}
