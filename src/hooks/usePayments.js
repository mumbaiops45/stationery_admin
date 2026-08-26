"use client";

import { paymentService } from "@/services/payment.service";
import { useResource } from "@/hooks/useResource";

/**
 * The admin payment list.
 *
 * Read-only: the router exposes two GETs and nothing that writes, which is
 * right — a payment's state belongs to Razorpay, not to this console.
 */
export function usePayments(initialParams) {
  return useResource(paymentService.list, initialParams);
}
