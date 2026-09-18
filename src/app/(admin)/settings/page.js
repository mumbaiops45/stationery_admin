"use client";

import { useEffect, useState } from "react";

import {
  Alert,
  Button,
  Card,
  Field,
  FormSection,
  InputPrefix,
  PageHeader,
  SearchInput,
} from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { useMutation } from "@/hooks/useResource";
import { settingService } from "@/services/setting.service";
import { productService } from "@/services/product.service";

/**
 * Store-wide values, both read live by checkout (utils/orderStock.js on the
 * API) with no redeploy needed: the flat delivery fee / free-shipping
 * subtotal, and the subtotal that unlocks a free gift pick. There is no
 * third payment method here — this store only ever takes payment online
 * through Razorpay.
 */
export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <PageHeader
        title="Settings"
        subtitle="Controls checkout pricing — changes apply immediately, no redeploy needed."
      />

      <ShippingSettings />
      <GiftSettings />
    </div>
  );
}

function ShippingSettings() {
  const [form, setForm] = useState({
    shippingCharge: "",
    freeShippingThreshold: "",
    expressShippingCharge: "",
    sameDayDeliveryCharge: "",
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [saved, setSaved] = useState(false);
  const { run, pending, error, clearError } = useMutation();

  useEffect(() => {
    let active = true;

    settingService
      .getShipping()
      .then((payload) => {
        if (!active) return;
        const data = payload?.data || {};
        setForm({
          shippingCharge: String(data.shippingCharge ?? ""),
          freeShippingThreshold: String(data.freeShippingThreshold ?? ""),
          expressShippingCharge: String(data.expressShippingCharge ?? ""),
          sameDayDeliveryCharge: String(data.sameDayDeliveryCharge ?? ""),
        });
      })
      .catch((err) => {
        if (active) setLoadError(err.message || "Could not load shipping settings.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function setField(key) {
    return (event) => {
      setSaved(false);
      setValidationError("");
      clearError();
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };
  }

  async function save(event) {
    event.preventDefault();
    setSaved(false);
    setValidationError("");

    const fields = [
      ["shippingCharge", "Default shipping"],
      ["freeShippingThreshold", "Free shipping over"],
      ["expressShippingCharge", "Express shipping"],
      ["sameDayDeliveryCharge", "Same-day delivery"],
    ];

    const parsed = {};
    for (const [key, label] of fields) {
      const value = Number(form[key]);
      if (!Number.isFinite(value) || value < 0) {
        setValidationError(`${label} must be a number ≥ 0.`);
        return;
      }
      parsed[key] = value;
    }

    const { ok } = await run(() => settingService.updateShipping(parsed));
    if (ok) setSaved(true);
  }

  return (
    <Card>
      {loading ? (
        <p className="px-6 py-8 text-sm text-ink-soft">Loading…</p>
      ) : (
        <form onSubmit={save} className="space-y-5 p-6">
          <Alert>{loadError}</Alert>
          <Alert>{validationError || error}</Alert>
          {saved ? <Alert tone="info">Shipping settings saved.</Alert> : null}

          <FormSection
            title="Delivery fee"
            description="Charged on every order below the free-shipping threshold. Set the threshold to 0 to always charge the fee."
            columns={2}
          >
            <Field label="Default shipping" required hint="charged below the threshold">
              <InputPrefix
                prefix="₹"
                type="number"
                min="0"
                step="1"
                required
                value={form.shippingCharge}
                onChange={setField("shippingCharge")}
              />
            </Field>

            <Field label="Free shipping over" required hint="subtotal, not total">
              <InputPrefix
                prefix="₹"
                type="number"
                min="0"
                step="1"
                required
                value={form.freeShippingThreshold}
                onChange={setField("freeShippingThreshold")}
              />
            </Field>

            <Field label="Express shipping" required hint="not yet selectable at checkout">
              <InputPrefix
                prefix="₹"
                type="number"
                min="0"
                step="1"
                required
                value={form.expressShippingCharge}
                onChange={setField("expressShippingCharge")}
              />
            </Field>

            <Field label="Same-day delivery" required hint="not yet selectable at checkout">
              <InputPrefix
                prefix="₹"
                type="number"
                min="0"
                step="1"
                required
                value={form.sameDayDeliveryCharge}
                onChange={setField("sameDayDeliveryCharge")}
              />
            </Field>
          </FormSection>

          <div className="flex justify-end">
            <Button type="submit" loading={pending}>
              Save changes
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

function GiftSettings() {
  const [freeGiftThreshold, setFreeGiftThreshold] = useState("");
  // The one product given away — null means "not configured yet", not "no
  // product exists". Cleared explicitly via the Remove button below.
  const [giftProduct, setGiftProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [saved, setSaved] = useState(false);
  const { run, pending, error, clearError } = useMutation();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    let active = true;

    settingService
      .getGift()
      .then((payload) => {
        if (!active) return;
        const data = payload?.data || {};
        setFreeGiftThreshold(String(data.freeGiftThreshold ?? ""));
        setGiftProduct(data.freeGiftProduct || null);
      })
      .catch((err) => {
        if (active) setLoadError(err.message || "Could not load gift settings.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Debounced product search, only while the picker is open (i.e. once the
  // admin has typed something — no point listing products before then).
  // Every setState below runs inside the timer callback, never synchronously
  // in the effect body, so a fast typist never triggers a cascading render.
  useEffect(() => {
    let active = true;
    const trimmed = query.trim();

    const timer = setTimeout(() => {
      if (!active) return;

      if (!trimmed) {
        setResults([]);
        setSearchError("");
        setSearching(false);
        return;
      }

      setSearching(true);

      productService
        .list({ search: trimmed, isActive: "true", limit: 8 })
        .then((result) => {
          if (active) setResults(result.items);
        })
        .catch((err) => {
          if (active) setSearchError(err.message || "Could not search products.");
        })
        .finally(() => {
          if (active) setSearching(false);
        });
    }, trimmed ? 300 : 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  function setThresholdField(event) {
    setSaved(false);
    setValidationError("");
    clearError();
    setFreeGiftThreshold(event.target.value);
  }

  function pickProduct(product) {
    setSaved(false);
    setGiftProduct({ id: product._id || product.id, name: product.name, image: product.image?.url || "" });
    setQuery("");
    setResults([]);
  }

  function removeProduct() {
    setSaved(false);
    setGiftProduct(null);
  }

  async function save(event) {
    event.preventDefault();
    setSaved(false);
    setValidationError("");

    const value = Number(freeGiftThreshold);

    if (!Number.isFinite(value) || value < 0) {
      setValidationError("Free gift threshold must be a number ≥ 0.");
      return;
    }

    const { ok } = await run(() =>
      settingService.updateGift({
        freeGiftThreshold: value,
        freeGiftProductId: giftProduct?.id || "",
      }),
    );
    if (ok) setSaved(true);
  }

  return (
    <Card>
      {loading ? (
        <p className="px-6 py-8 text-sm text-ink-soft">Loading…</p>
      ) : (
        <form onSubmit={save} className="space-y-5 p-6">
          <Alert>{loadError}</Alert>
          <Alert>{validationError || error}</Alert>
          {saved ? <Alert tone="info">Gift settings saved.</Alert> : null}

          <FormSection
            title="Free gift"
            description="Orders at or above this subtotal get this one product attached automatically — the customer does not pick, there is no picker to show them."
          >
            <Field label="Free gift over" required hint="subtotal, not total">
              <InputPrefix
                prefix="₹"
                type="number"
                min="0"
                step="1"
                required
                value={freeGiftThreshold}
                onChange={setThresholdField}
              />
            </Field>

            <Field label="Gift product" hint={giftProduct ? undefined : "not configured — no gift will be attached"}>
              {giftProduct ? (
                <div className="flex items-center gap-3 rounded-lg border border-line bg-card px-3 py-2.5">
                  {giftProduct.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={giftProduct.image}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-md border border-line bg-white object-contain"
                    />
                  ) : (
                    <span className="h-9 w-9 shrink-0 rounded-md border border-dashed border-line" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                    {giftProduct.name}
                  </span>
                  <Button type="button" size="sm" variant="ghost" onClick={removeProduct}>
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <SearchInput
                    size="sm"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search products by name…"
                  />
                  <Alert>{searchError}</Alert>
                  {searching ? (
                    <p className="px-1 text-xs text-ink-soft">Searching…</p>
                  ) : results.length > 0 ? (
                    <ul className="divide-y divide-line rounded-lg border border-line">
                      {results.map((product) => (
                        <li key={product._id || product.id}>
                          <button
                            type="button"
                            onClick={() => pickProduct(product)}
                            className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-canvas"
                          >
                            {product.image?.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.image.url}
                                alt=""
                                className="h-8 w-8 shrink-0 rounded-md border border-line bg-white object-contain"
                              />
                            ) : (
                              <span className="h-8 w-8 shrink-0 rounded-md border border-dashed border-line" />
                            )}
                            <span className="min-w-0 flex-1 truncate text-sm text-ink">
                              {product.name}
                            </span>
                            <span className="shrink-0 text-xs text-ink-soft">
                              {formatMoney(product.price)}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : query.trim() ? (
                    <p className="px-1 text-xs text-ink-soft">
                      No products match &quot;{query.trim()}&quot;.
                    </p>
                  ) : null}
                </div>
              )}
            </Field>
          </FormSection>

          <div className="flex justify-end">
            <Button type="submit" loading={pending}>
              Save changes
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
