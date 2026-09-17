"use client";

import { useCallback } from "react";

import { bannerService } from "@/services/banner.service";
import { useMutation, useResource } from "@/hooks/useResource";

/** Defaults matching the admin controller's own: position-sorted, 10 a page. */
const DEFAULTS = {
  page: 1,
  limit: 10,
  search: "",
  type: "",
  status: "",
  sort: "position_asc",
};

export function useBanners(initialParams = DEFAULTS) {
  const list = useResource(bannerService.list, initialParams);
  const { run, pending, error, clearError } = useMutation();

  const create = useCallback(
    async (data) => {
      const outcome = await run(() => bannerService.create(data));
      if (outcome.ok) list.refetch();
      return outcome;
    },
    [run, list],
  );

  const update = useCallback(
    async (id, data) => {
      const outcome = await run(() => bannerService.update(id, data));
      if (outcome.ok) list.refetch();
      return outcome;
    },
    [run, list],
  );

  const remove = useCallback(
    async (id) => {
      const outcome = await run(() => bannerService.remove(id));
      if (outcome.ok) list.refetch();
      return outcome;
    },
    [run, list],
  );

  const setStatus = useCallback(
    async (id, isActive) => {
      const outcome = await run(() => bannerService.setStatus(id, isActive));
      if (outcome.ok) list.refetch();
      return outcome;
    },
    [run, list],
  );

  return {
    ...list,
    create,
    update,
    remove,
    setStatus,
    saving: pending,
    saveError: error,
    clearError,
  };
}
