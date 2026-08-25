"use client";

import { useEffect, useMemo, useState } from "react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { formatMoney } from "@/lib/format";
import {
  availableGrindOptions,
  type GrindValue,
} from "@/lib/grind";
import { sortByWeightLabel } from "@/lib/weight-sort";
import type { Product, ProductVariant } from "@/lib/types";

type Props = {
  product: Product;
};

export function ProductBuyBox({ product }: Props) {
  const variants = useMemo(
    () =>
      sortByWeightLabel(
        (product.variants || []).filter((v) => v.isActive !== false),
      ),
    [product.variants],
  );
  const grindChoices = useMemo(
    () =>
      availableGrindOptions(
        product.kind,
        product.allowWholeBean,
        product.allowGround,
      ),
    [product.kind, product.allowWholeBean, product.allowGround],
  );
  const [variantId, setVariantId] = useState<string | null>(
    variants[0]?.id ?? null,
  );
  const [grind, setGrind] = useState<GrindValue>(
    () => grindChoices[0]?.value ?? "whole_bean",
  );

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
      variants.length > 0 &&
      !variants.some((v) => v.id === variantId)
    ) {
      setVariantId(variants[0].id);
    }
  }, [variants, variantId]);

  const showGrindPicker = grindChoices.length > 0;
  const resolvedGrind =
    grindChoices.length > 0
      ? grindChoices.some((g) => g.value === grind)
        ? grind
        : grindChoices[0].value
      : null;

  const selected: ProductVariant | undefined =
    variants.find((v) => v.id === variantId) || variants[0];
  const displayPrice =
    selected?.price ?? product.salePrice ?? product.basePrice;
  const compareAt =
    (selected as ProductVariant & { compareAtPrice?: string })
      ?.compareAtPrice ?? product.compareAtPrice;
  const stock = selected != null ? selected.stock : product.stock;
  const outOfStock = stock <= 0;
  const disabled = outOfStock;

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
            {variants.map((v) => {
              const active = (selected?.id || variantId) === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariantId(v.id)}
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
            })}
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
          </p>
        ) : null}
      </div>

      <div className="flex items-stretch gap-3">
        <div className="flex-1">
          <AddToCartButton
            productId={product.id}
            variantId={selected?.id}
            grindOption={resolvedGrind}
            disabled={disabled}
            productName={product.name}
            price={Number(displayPrice)}
            label={outOfStock ? "Stokta yok" : "Satın Almayı Başlat"}
          />
        </div>
        <FavoriteButton productId={product.id} size="lg" />
      </div>
    </div>
  );
}
