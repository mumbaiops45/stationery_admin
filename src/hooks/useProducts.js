"use client";

import { useCallback } from "react";

import { productService } from "@/services/product.service";
import { useMutation, useResource } from "@/hooks/useResource";

export function useProducts(initialParams = { page: 1, limit: 10, search: "" }) {
  const list = useResource(productService.list, initialParams);
  const { run, pending, error, clearError } = useMutation();

  const create = useCallback(
    async (data) => {
      const outcome = await run(() => productService.create(data));
      if (outcome.ok) list.refetch();
      return outcome;
    },
    [run, list],
  );

  const update = useCallback(
    async (id, data) => {
      const outcome = await run(() => productService.update(id, data));
      if (outcome.ok) list.refetch();
      return outcome;
    },
    [run, list],
  );

  const remove = useCallback(
    async (id) => {
      const outcome = await run(() => productService.remove(id));
      if (outcome.ok) list.refetch();
      return outcome;
    },
    [run, list],
  );

  const setStatus = useCallback(
    async (id, isActive) => {
      const outcome = await run(() => productService.setStatus(id, isActive));
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
