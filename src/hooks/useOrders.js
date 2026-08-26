"use client";

import { orderService } from "@/services/order.service";
import { useResource } from "@/hooks/useResource";

/**
 * The admin order list.
 *
 * Read-only: the API exposes GET only, with no status-update route, so there
 * is no mutation to wrap. Each row carries the whole order document, which is
 * what lets the detail panel open without a second request.
 */
export function useOrders(initialParams) {
  return useResource(orderService.list, initialParams);
}
