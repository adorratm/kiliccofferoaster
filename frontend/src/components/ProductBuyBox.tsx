"use client";

import { useEffect, useMemo, useState } from "react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { formatMoney } from "@/lib/format";
import {
  availableGrindOptions,
  type GrindValue,
} from "@/lib/grind";
import {
  availableRoastOptions,
  roastLabel,
  showRoastPicker,
  type RoastValue,
} from "@/lib/roast";
import { sortByWeightLabel } from "@/lib/weight-sort";
import type { Product, ProductVariant } from "@/lib/types";
import {
  DEFAULT_WHATSAPP_PHONE,
  buildWhatsAppUrl,
  productWhatsAppMessage,
} from "@/lib/whatsapp";

type Props = {
  product: Product;
  whatsappEnabled?: boolean;
  whatsappPhone?: string | null;
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const GRIND_LABELS: Record<string, string> = {
  whole_bean: "Çekirdek",
  ground: "Öğütülmüş",
};

function uniqueSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function ProductBuyBox({
  product,
  whatsappEnabled = true,
  whatsappPhone = DEFAULT_WHATSAPP_PHONE,
}: Props) {
  const variants = useMemo(
    () =>
      sortByWeightLabel(
        (product.variants || []).filter((v) => v.isActive !== false),
      ),
    [product.variants],
  );

  /** Yeni model: satırda grind/roast dolu → kombinasyon SKU */
  const structured = useMemo(
    () => variants.some((v) => v.grindOption || v.roastOption),
    [variants],
  );

  const weightLabels = useMemo(
    () => uniqueSorted(variants.map((v) => v.weightLabel)),
    [variants],
  );

  const productGrindChoices = useMemo(
    () =>
      availableGrindOptions(
        product.kind,
        product.allowWholeBean,
        product.allowGround,
      ),
    [product.kind, product.allowWholeBean, product.allowGround],
  );
  const productRoastChoices = useMemo(
    () =>
      availableRoastOptions(
        product.kind,
        product.allowRoastMediumDark,
        product.allowRoastDark,
      ),
    [product.kind, product.allowRoastMediumDark, product.allowRoastDark],
  );

  const [weightLabel, setWeightLabel] = useState<string>(
    () => weightLabels[0] || variants[0]?.weightLabel || "",
  );
  const [grind, setGrind] = useState<GrindValue>(
    () =>
      (variants.find((v) => v.grindOption)?.grindOption as GrindValue) ||
      productGrindChoices[0]?.value ||
      "whole_bean",
  );
  const [roast, setRoast] = useState<RoastValue>(
    () =>
      (variants.find((v) => v.roastOption)?.roastOption as RoastValue) ||
      productRoastChoices[0]?.value ||
      "orta",
  );
  const [legacyVariantId, setLegacyVariantId] = useState<string | null>(
    variants[0]?.id ?? null,
  );

  const grindChoices = useMemo(() => {
    if (!structured) return productGrindChoices;
    const forWeight = variants.filter((v) => v.weightLabel === weightLabel);
    const values = uniqueSorted(
      forWeight.map((v) => v.grindOption || "").filter(Boolean),
    ) as GrindValue[];
    if (values.length === 0) return productGrindChoices;
    return values.map((value) => ({
      value,
      label: GRIND_LABELS[value] || value,
    }));
  }, [structured, variants, weightLabel, productGrindChoices]);

  const roastChoices = useMemo(() => {
    if (!structured) return productRoastChoices;
    const forCombo = variants.filter(
      (v) =>
        v.weightLabel === weightLabel &&
        (!grind || !v.grindOption || v.grindOption === grind),
    );
    const values = uniqueSorted(
      forCombo.map((v) => v.roastOption || "").filter(Boolean),
    ) as RoastValue[];
    if (values.length === 0) return productRoastChoices;
    return values.map((value) => ({
      value,
      label: roastLabel(value),
    }));
  }, [structured, variants, weightLabel, grind, productRoastChoices]);

  useEffect(() => {
    if (weightLabels.length && !weightLabels.includes(weightLabel)) {
      setWeightLabel(weightLabels[0]);
    }
  }, [weightLabels, weightLabel]);

  useEffect(() => {
    if (
      grindChoices.length > 0 &&
      !grindChoices.some((g) => g.value === grind)
    ) {
      setGrind(grindChoices[0].value);
    }
  }, [grindChoices, grind]);

  useEffect(() => {
    if (
      roastChoices.length > 0 &&
      !roastChoices.some((r) => r.value === roast)
    ) {
      setRoast(roastChoices[0].value);
    }
  }, [roastChoices, roast]);

  useEffect(() => {
    if (
      !structured &&
      variants.length > 0 &&
      !variants.some((v) => v.id === legacyVariantId)
    ) {
      setLegacyVariantId(variants[0].id);
    }
  }, [structured, variants, legacyVariantId]);

  const resolvedGrind =
    grindChoices.length > 0
      ? grindChoices.some((g) => g.value === grind)
        ? grind
        : grindChoices[0].value
      : null;
  const resolvedRoast =
    roastChoices.length > 0
      ? roastChoices.some((r) => r.value === roast)
        ? roast
        : roastChoices[0].value
      : null;

  const selected: ProductVariant | undefined = structured
    ? variants.find(
        (v) =>
          v.weightLabel === weightLabel &&
          (!resolvedGrind ||
            !v.grindOption ||
            v.grindOption === resolvedGrind) &&
          (!resolvedRoast ||
            !v.roastOption ||
            v.roastOption === resolvedRoast),
      ) || variants.find((v) => v.weightLabel === weightLabel)
    : variants.find((v) => v.id === legacyVariantId) || variants[0];

  const showGrindPicker = grindChoices.length > 0;
  const roastPickerVisible = structured
    ? roastChoices.length > 1 ||
      (product.kind === "coffee_espresso" && roastChoices.length > 0)
    : showRoastPicker(product.kind, roastChoices.length);

  const displayPrice =
    selected?.price ?? product.salePrice ?? product.basePrice;
  const compareAt =
    (selected as ProductVariant & { compareAtPrice?: string })
      ?.compareAtPrice ?? product.compareAtPrice;
  const stock = selected != null ? selected.stock : product.stock;
  const outOfStock = stock <= 0;
  const disabled = outOfStock || (structured && !selected);

  return (
    <div className="space-y-6">
      {product.campaignName ? (
        <p className="font-meta text-[10px] uppercase tracking-widest text-primary">
          Kampanya · {product.campaignName}
        </p>
      ) : null}

      {variants.length > 0 ? (
        <div>
          <p className="mb-2 font-meta text-[10px] uppercase tracking-widest text-on-surface-variant">
            Ağırlık
          </p>
          <div className="flex flex-wrap gap-2">
            {(structured ? weightLabels : variants.map((v) => v.id)).map(
              (key) => {
                if (structured) {
                  const label = key;
                  const active = weightLabel === label;
                  const anyStock = variants.some(
                    (v) => v.weightLabel === label && v.stock > 0,
                  );
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setWeightLabel(label)}
                      className={`border px-4 py-2 font-meta text-[11px] uppercase tracking-widest transition-colors ${
                        active
                          ? "border-primary bg-primary text-white"
                          : "border-outline-variant/40 hover:border-primary"
                      }`}
                    >
                      {label}
                      {!anyStock ? " · Yok" : ""}
                    </button>
                  );
                }
                const v = variants.find((row) => row.id === key);
                if (!v) return null;
                const active = (selected?.id || legacyVariantId) === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setLegacyVariantId(v.id)}
                    className={`border px-4 py-2 font-meta text-[11px] uppercase tracking-widest transition-colors ${
                      active
                        ? "border-primary bg-primary text-white"
                        : "border-outline-variant/40 hover:border-primary"
                    }`}
                  >
                    {v.weightLabel}
                    {v.stock <= 0 ? " · Yok" : ""}
                  </button>
                );
              },
            )}
          </div>
        </div>
      ) : null}

      {showGrindPicker ? (
        <div>
          <p className="mb-2 font-meta text-[10px] uppercase tracking-widest text-on-surface-variant">
            Öğütme tercihi
          </p>
          <div className="flex flex-wrap gap-2">
            {grindChoices.map((g) => {
              const active = grind === g.value;
              return (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGrind(g.value)}
                  className={`border px-4 py-2 font-meta text-[11px] uppercase tracking-widest transition-colors ${
                    active
                      ? "border-primary bg-primary text-white"
                      : "border-outline-variant/40 hover:border-primary"
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {roastPickerVisible ? (
        <div>
          <p className="mb-2 font-meta text-[10px] uppercase tracking-widest text-on-surface-variant">
            Kavrum
          </p>
          <div className="flex flex-wrap gap-2">
            {roastChoices.map((r) => {
              const active = roast === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRoast(r.value)}
                  className={`border px-4 py-2 font-meta text-[11px] uppercase tracking-widest transition-colors ${
                    active
                      ? "border-primary bg-primary text-white"
                      : "border-outline-variant/40 hover:border-primary"
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-meta text-[10px] uppercase text-on-surface-variant">
            Fiyat
          </p>
          <div className="flex flex-wrap items-baseline gap-3">
            <p className="font-display text-3xl text-primary">
              {formatMoney(displayPrice, product.currency)}
            </p>
            {compareAt && Number(compareAt) > Number(displayPrice) ? (
              <p className="font-meta text-sm uppercase text-secondary line-through">
                {formatMoney(compareAt, product.currency)}
              </p>
            ) : null}
          </div>
          <p className="mt-1 font-meta text-[10px] uppercase text-secondary">
            Stok {outOfStock ? "yok" : `[${stock}]`}
          </p>
        </div>
        {selected?.weightLabel ? (
          <p className="font-meta text-[11px] uppercase text-secondary">
            {selected.weightLabel}
            {selected.grindOption
              ? ` · ${GRIND_LABELS[selected.grindOption] || selected.grindOption}`
              : ""}
            {selected.roastOption
              ? ` · ${roastLabel(selected.roastOption)}`
              : ""}
          </p>
        ) : null}
      </div>

      <div className="flex items-stretch gap-3">
        <div className="flex-1">
          <AddToCartButton
            productId={product.id}
            variantId={selected?.id}
            grindOption={resolvedGrind || selected?.grindOption || null}
            roastOption={resolvedRoast || selected?.roastOption || null}
            disabled={disabled}
            productName={product.name}
            price={Number(displayPrice)}
            label={outOfStock ? "Stokta yok" : "Satın Almayı Başlat"}
          />
        </div>
        <FavoriteButton productId={product.id} size="lg" />
      </div>

      {whatsappEnabled ? (
        <a
          href={buildWhatsAppUrl(
            whatsappPhone,
            productWhatsAppMessage(
              product.name,
              `${SITE_URL}/urunler/${product.slug}`,
            ),
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost flex w-full items-center justify-center px-4 py-3 text-xs"
        >
          WhatsApp ile sor
        </a>
      ) : null}
    </div>
  );
}
