"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * List state for a paginated resource: data, loading, error, query params.
 *
 * `loading` is only flipped from event handlers (setParams / refetch) and from
 * the request callbacks — never synchronously inside the effect — so the list
 * stays visible while a new page is fetched instead of flashing empty.
 *
 * `fetcher` must be a stable reference (a service method, not an inline
 * arrow), since it is an effect dependency.
 */
export function useResource(fetcher, initialParams = {}) {
  const [params, setParamsState] = useState(initialParams);
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({
    items: [],
    total: 0,
    page: 1,
    pages: 1,
    limit: initialParams.limit || 10,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    fetcher(params, { signal: controller.signal })
      .then((result) => {
        if (!active) return;
        setState({ ...result, loading: false, error: null });
      })
      .catch((error) => {
        if (!active || error.name === "AbortError") return;
        setState((prev) => ({
          ...prev,
          items: [],
          total: 0,
          loading: false,
          error: error.message || "Could not load this list.",
        }));
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [fetcher, params, tick]);

  const setParams = useCallback((patch) => {
    setState((prev) => ({ ...prev, loading: true }));
    setParamsState((prev) => ({
      ...prev,
      ...(typeof patch === "function" ? patch(prev) : patch),
    }));
  }, []);

  const refetch = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true }));
    setTick((n) => n + 1);
  }, []);

  const setPage = useCallback((page) => setParams({ page }), [setParams]);

  const setSearch = useCallback(
    (search) => setParams({ search, page: 1 }),
    [setParams],
  );

  return { ...state, params, setParams, setPage, setSearch, refetch };
}

/** Wraps create/update/delete calls with pending + error state. */
export function useMutation() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (action) => {
    setPending(true);
    setError(null);
    try {
      const result = await action();
      setPending(false);
      return { ok: true, result };
    } catch (err) {
      const message = err.message || "Something went wrong.";
      setPending(false);
      setError(message);
      return { ok: false, message };
    }
  }, []);

  return { run, pending, error, clearError: () => setError(null) };
}
