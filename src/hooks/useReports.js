"use client";

import { useCallback, useEffect, useState } from "react";

import { reportService } from "@/services/report.service";

/**
 * The overview report for one period.
 *
 * `loadedFor` records which period the held report belongs to, so `loading`
 * and `report` are derived rather than written from inside the effect. The
 * previous period's report stays on screen while the next one loads — held at
 * reduced opacity by the page — instead of the charts collapsing to skeletons
 * on every period change.
 */
export function useReports(initialPeriod = "30d") {
  const [period, setPeriod] = useState(initialPeriod);
  const [state, setState] = useState({ loadedFor: null, report: null, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    reportService
      .getOverview(period, { signal: controller.signal })
      .then((report) => {
        if (active) setState({ loadedFor: period, report, error: null });
      })
      .catch((error) => {
        if (!active || error.name === "AbortError") return;
        setState({
          loadedFor: period,
          report: null,
          error: error.message || "Could not load the report.",
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [period, tick]);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  const current = state.loadedFor === period;

  return {
    period,
    setPeriod,
    refresh,
    report: state.report,
    error: current ? state.error : null,
    /** Nothing to show yet. */
    loading: !state.report && !state.error,
    /** A newer period is in flight behind numbers already on screen. */
    refreshing: !current && Boolean(state.report),
  };
}
