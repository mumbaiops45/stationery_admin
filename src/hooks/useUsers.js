"use client";

import { useCallback } from "react";

import { userService } from "@/services/user.service";
import { useMutation, useResource } from "@/hooks/useResource";

/**
 * The admin user list.
 *
 * Role is the only writable field the API exposes — there is no create-user
 * route and nothing that toggles `isActive` — so `setRole` is the one
 * mutation here.
 */
export function useUsers(initialParams) {
  const list = useResource(userService.list, initialParams);
  const { run, pending, error, clearError } = useMutation();

  const setRole = useCallback(
    async (userId, role) => {
      const outcome = await run(() => userService.setRole(userId, role));
      if (outcome.ok) list.refetch();
      return outcome;
    },
    [run, list],
  );

  return {
    ...list,
    setRole,
    saving: pending,
    saveError: error,
    clearError,
  };
}
