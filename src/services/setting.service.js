import { api } from "@/lib/api";

/**
 * Store-wide settings the checkout pricing reads live — no redeploy needed
 * when the admin changes them. Mounted at /api/admin/settings (app.js), with
 * `/shipping` and `/gift` as its only two routes.
 */
const RESOURCE = "/admin/settings";

export const settingService = {
  /** GET /admin/settings/shipping — { shippingCharge, freeShippingThreshold, expressShippingCharge, sameDayDeliveryCharge }. */
  getShipping: () => api.get(`${RESOURCE}/shipping`),

  /** PUT /admin/settings/shipping — either field is optional; only what is sent changes. */
  updateShipping: (data) => api.put(`${RESOURCE}/shipping`, data),

  /** GET /admin/settings/gift — { freeGiftThreshold, freeGiftProduct: {id,name,image} | null }. */
  getGift: () => api.get(`${RESOURCE}/gift`),

  /** PUT /admin/settings/gift — { freeGiftThreshold?, freeGiftProductId? } (empty string clears the gift). */
  updateGift: (data) => api.put(`${RESOURCE}/gift`, data),
};
