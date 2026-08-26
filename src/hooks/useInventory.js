"use client";

import { useCallback, useState } from "react";

import { inventoryService } from "@/services/inventory.service";
import { useMutation, useResource } from "@/hooks/useResource";

/**
 * Stock levels for products and variants.
 *
 * One request returns both lists, so switching tabs costs nothing. `savingId`
 * tracks the row being written rather than a single global flag, so editing
 * one row does not freeze the rest of the table.
 */
const EMPTY_LIST = { items: [], total: 0, pages: 1 };

export function useInventory(initialParams) {
  const list = useResource(inventoryService.list, initialParams);
  const { run, pending, error, clearError } = useMutation();
  const [savingId, setSavingId] = useState(null);

  const save = useCallback(
    async (row, stock) => {
      setSavingId(row.id);

      const outcome = await run(() =>
        row.kind === "variant"
          ? inventoryService.setVariantStock(row.id, stock)
          : inventoryService.setProductStock(row.id, stock),
      );

      setSavingId(null);
      if (outcome.ok) list.refetch();
      return outcome;
    },
    [run, list],
  );

  return {
    ...list,
    // useResource seeds its state with the plain list contract only, so these
    // two are absent until the first response arrives — and absent again if
    // that response errors. Defaulting them here means a consumer can read
    // `inventory.products.total` on the very first render.
    products: list.products ?? EMPTY_LIST,
    variants: list.variants ?? EMPTY_LIST,
    save,
    savingId,
    saving: pending,
    saveError: error,
    clearError,
  };
}
