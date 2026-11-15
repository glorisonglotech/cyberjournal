import { useCallback, useEffect, useRef, useState } from "react";
import { articlesApi, errorMessage, type ArticleFilters } from "../services/api";
import type { ArticleListResponse } from "../types";

interface State {
  data: ArticleListResponse | null;
  loading: boolean;
  error: string | null;
}

export function useArticles(filters: ArticleFilters) {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null });
  const key = JSON.stringify(filters);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await articlesApi.list(JSON.parse(key) as ArticleFilters);
      if (id === requestId.current) setState({ data, loading: false, error: null });
    } catch (error) {
      if (id === requestId.current) {
        setState({ data: null, loading: false, error: errorMessage(error) });
      }
    }
  }, [key]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, refetch: load };
}

export function useDebounced<T>(value: T, delay = 320) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
