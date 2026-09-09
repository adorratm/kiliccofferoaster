"use client";

import { productKindLabel } from "@/lib/catalog-seo";
import { formatMoney, productImage } from "@/lib/format";

export type WholesaleCatalogItem = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  originCountry: string | null;
  originRegion: string | null;
  altitude: string | null;
  process: string | null;
  varietal: string | null;
  roastLevel: string | null;
  flavorNotes: string[];
  roastedAt: string | null;
  kind: string;
  currency: string;
  basePrice: string;
  imageUrl: string | null;
  category: { name: string; slug: string } | null;
  variants: Array<{ weightLabel: string; price: string }>;
};

export type WholesaleCatalogResponse = {
  brandName: string;
  businessName: string;
  updatedAt: string | null;
  items: WholesaleCatalogItem[];
};

type Props = {
  catalog: WholesaleCatalogResponse;
  contactPhone?: string;
  contactEmail?: string;
};

function metaBits(item: WholesaleCatalogItem): string[] {
  const bits: string[] = [];
  if (item.originCountry || item.originRegion) {
    bits.push(
      [item.originRegion, item.originCountry].filter(Boolean).join(", "),
    );
  }
  if (item.process) bits.push(item.process);
  if (item.varietal) bits.push(item.varietal);
  if (item.roastLevel) bits.push(`${item.roastLevel} kavrum`);
  if (item.altitude) bits.push(item.altitude);
  return bits;
}

export function WholesaleCatalogClient({
  catalog,
  contactPhone,
  contactEmail,
}: Props) {
  const grouped = new Map<string, WholesaleCatalogItem[]>();
  for (const item of catalog.items) {
    const key = item.category?.name || productKindLabel(item.kind) || "Kahve";
    const list = grouped.get(key) || [];
    list.push(item);
    grouped.set(key, list);
  }

  const updatedLabel = catalog.updatedAt
    ? new Date(catalog.updatedAt).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="border-b border-outline-variant/40 pb-8">
        <p className="font-meta text-[10px] uppercase tracking-[0.28em] text-primary/80">
          Toptan · İşletme
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-on-surface sm:text-5xl">
          {catalog.brandName}
        </h1>
        {catalog.businessName ? (
          <p className="mt-2 font-meta text-xs uppercase tracking-[0.2em] text-primary">
            {catalog.businessName} için özel fiyat listesi
          </p>
        ) : null}
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant sm:text-base">
          Kavrulmuş kahve fiyat listesi ve tadım notaları. Bu sayfa yalnızca size
          özel paylaşılan link ile görüntülenir.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 font-meta text-[11px] uppercase tracking-widest text-secondary">
          {updatedLabel ? <span>Güncelleme · {updatedLabel}</span> : null}
          <span>{catalog.items.length} kahve</span>
          {contactPhone ? <span>{contactPhone}</span> : null}
          {contactEmail ? <span>{contactEmail}</span> : null}
        </div>
      </header>

      {catalog.items.length === 0 ? (
        <p className="mt-12 text-sm text-on-surface-variant">
          Şu an listelenecek aktif kahve bulunmuyor.
        </p>
      ) : (
        <div className="mt-10 space-y-14">
          {[...grouped.entries()].map(([groupName, items]) => (
            <section key={groupName}>
              <h2 className="font-display text-2xl tracking-tight text-on-surface">
                {groupName}
              </h2>
              <ul className="mt-6 divide-y divide-outline-variant/30 border-y border-outline-variant/30">
                {items.map((item) => {
                  const bits = metaBits(item);
                  const kind = productKindLabel(item.kind);
                  return (
                    <li
                      key={item.id}
                      className="grid gap-5 py-7 sm:grid-cols-[5.5rem_1fr] sm:gap-6"
                    >
                      <div className="relative aspect-square w-[5.5rem] overflow-hidden bg-surface-container-high sm:w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={productImage(item.imageUrl, item.slug)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="font-display text-xl tracking-tight text-on-surface">
                            {item.name}
                          </h3>
                          {kind ? (
                            <span className="font-meta text-[10px] uppercase tracking-widest text-primary/70">
                              {kind}
                            </span>
                          ) : null}
                        </div>
                        {bits.length > 0 ? (
                          <p className="mt-1 text-xs text-secondary">
                            {bits.join(" · ")}
                          </p>
                        ) : null}
                        {item.shortDescription ? (
                          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                            {item.shortDescription}
                          </p>
                        ) : null}
                        {item.flavorNotes?.length ? (
                          <div className="mt-3">
                            <p className="font-meta text-[10px] uppercase tracking-[0.2em] text-primary/70">
                              Tadım notaları
                            </p>
                            <p className="mt-1 text-sm text-on-surface">
                              {item.flavorNotes.join(" · ")}
                            </p>
                          </div>
                        ) : null}
                        <div className="mt-4">
                          <p className="font-meta text-[10px] uppercase tracking-[0.2em] text-primary/70">
                            Fiyatlar
                          </p>
                          {item.variants.length > 0 ? (
                            <dl className="mt-2 grid gap-1.5 sm:grid-cols-2">
                              {item.variants.map((v) => (
                                <div
                                  key={`${item.id}-${v.weightLabel}`}
                                  className="flex items-baseline justify-between gap-3 border-b border-outline-variant/20 pb-1.5 text-sm"
                                >
                                  <dt className="text-secondary">
                                    {v.weightLabel}
                                  </dt>
                                  <dd className="font-medium tabular-nums text-on-surface">
                                    {formatMoney(v.price, item.currency)}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          ) : (
                            <p className="mt-2 text-sm tabular-nums text-on-surface">
                              {formatMoney(item.basePrice, item.currency)}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <footer className="mt-14 border-t border-outline-variant/40 pt-6 text-xs leading-relaxed text-secondary">
        Fiyatlar bilgilendirme amaçlıdır ve önceden haber verilmeksizin
        değişebilir. Toptan sipariş ve özel gramaj için iletişime geçin.
      </footer>
    </div>
  );
}
