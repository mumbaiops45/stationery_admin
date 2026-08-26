"use client";

import { useCallback } from "react";

import { categoryService } from "@/services/category.service";
import { useMutation, useResource } from "@/hooks/useResource";

/** Defaults matching the admin controller's own: name-sorted, 10 a page. */
const DEFAULTS = {
  page: 1,
  limit: 10,
  search: "",
  status: "",
  sort: "name_asc",
};

export function useCategories(initialParams = DEFAULTS) {
  const list = useResource(categoryService.list, initialParams);
  const { run, pending, error, clearError } = useMutation();

  const create = useCallback(
    async (data) => {
      const outcome = await run(() => categoryService.create(data));
      if (outcome.ok) list.refetch();
      return outcome;
    },
    [run, list],
  );

  const update = useCallback(
    async (id, data) => {
      const outcome = await run(() => categoryService.update(id, data));
      if (outcome.ok) list.refetch();
      return outcome;
    },
    [run, list],
  );

  const remove = useCallback(
    async (id) => {
      const outcome = await run(() => categoryService.remove(id));
      if (outcome.ok) list.refetch();
      return outcome;
    },
    [run, list],
  );

  const setStatus = useCallback(
    async (id, isActive) => {
      const outcome = await run(() => categoryService.setStatus(id, isActive));
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

/**
 * Every active category, for a dropdown.
 *
 * Reads the public route rather than the admin list: it is unpaginated, so a
 * shop with 200 categories still gets all of them, and it excludes inactive
 * ones — which the product controller rejects anyway.
 */
export function useCategoryOptions() {
  const { items, loading, error, refetch } = useResource(
    categoryService.listActive,
    {},
  );

  return { items, loading, error, refetch };
}
