"use client";

import { useCallback, useEffect, useState } from "react";

import { variantService } from "@/services/variant.service";
import { useMutation } from "@/hooks/useResource";

/**
 * The variants of one product.
 *
 * Not built on useResource: the list is keyed by a product id that changes as
 * the user opens different rows, rather than by query params. `loadedFor`
 * tracks which product the held items belong to, so `loading` and `items` are
 * derived rather than written from inside the effect — the previous product's
 * variants never flash in the panel of the next one.
 */
export function useVariants(productId) {
  const [state, setState] = useState({ loadedFor: null, items: [], error: null });
  const [tick, setTick] = useState(0);
  const { run, pending, error: saveError, clearError } = useMutation();

  useEffect(() => {
    if (!productId) return undefined;

    const controller = new AbortController();
    let active = true;

    variantService
      .list(productId, { signal: controller.signal })
      .then((items) => {
        if (active) setState({ loadedFor: productId, items, error: null });
      })
      .catch((error) => {
        if (!active || error.name === "AbortError") return;
        setState({
          loadedFor: productId,
          items: [],
          error: error.message || "Could not load variants.",
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [productId, tick]);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  const create = useCallback(
    async (data) => {
      const outcome = await run(() => variantService.create(productId, data));
      if (outcome.ok) refetch();
      return outcome;
    },
    [run, productId, refetch],
  );

  const update = useCallback(
    async (variantId, data) => {
      const outcome = await run(() =>
        variantService.update(productId, variantId, data),
      );
      if (outcome.ok) refetch();
      return outcome;
    },
    [run, productId, refetch],
  );

  const remove = useCallback(
    async (variantId) => {
      const outcome = await run(() => variantService.remove(productId, variantId));
      if (outcome.ok) refetch();
      return outcome;
    },
    [run, productId, refetch],
  );

  const matches = state.loadedFor === productId;

  return {
    items: matches ? state.items : [],
    loading: Boolean(productId) && !matches,
    error: matches ? state.error : null,
    refetch,
    create,
    update,
    remove,
    saving: pending,
    saveError,
    clearError,
  };
}
