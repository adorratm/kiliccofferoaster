"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/types";
import {
  buildWhatsAppUrl,
  resolveWhatsAppPhone,
} from "@/lib/whatsapp";

type Props = {
  products: Product[];
  brandName: string;
  whatsappEnabled?: boolean;
  whatsappPhone?: string | null;
};

type Taste = "bold" | "balanced" | "fruity" | "chocolate";
type Method = "espresso" | "filter" | "french" | "moka" | "turkish";
type Acidity = "low" | "medium" | "high";

const TASTE: { id: Taste; label: string }[] = [
  { id: "bold", label: "Sert / yoğun" },
  { id: "balanced", label: "Dengeli" },
  { id: "fruity", label: "Meyvemsi" },
  { id: "chocolate", label: "Çikolatalı / fındıklı" },
];

const METHOD: { id: Method; label: string }[] = [
  { id: "espresso", label: "Espresso" },
  { id: "filter", label: "V60 / filtre" },
  { id: "french", label: "French Press" },
  { id: "moka", label: "Moka Pot" },
  { id: "turkish", label: "Türk kahvesi" },
];

const ACIDITY: { id: Acidity; label: string }[] = [
  { id: "low", label: "Düşük" },
  { id: "medium", label: "Orta" },
  { id: "high", label: "Yüksek" },
];

/** Demleme yöntemi → ürün kind / kategori slug */
const METHOD_KINDS: Record<Method, string[]> = {
  espresso: ["coffee_espresso"],
  filter: ["coffee_filter"],
  french: ["coffee_filter"],
  moka: ["coffee_espresso"],
  turkish: ["coffee_turkish"],
};

const METHOD_CATEGORY_SLUGS: Record<Method, string[]> = {
  espresso: ["espresso"],
  filter: ["filtre-kahve"],
  french: ["filtre-kahve"],
  moka: ["espresso"],
  turkish: ["turk-kahvesi"],
};

function productMatchesMethod(p: Product, method: Method): boolean {
  const kinds = METHOD_KINDS[method];
  if (p.kind && kinds.includes(p.kind)) return true;
  const slug = p.category?.slug;
  if (slug && METHOD_CATEGORY_SLUGS[method].includes(slug)) return true;
  return false;
}

function scoreProduct(
  p: Product,
  taste: Taste,
  method: Method,
  acidity: Acidity,
): number {
  const notes = (p.flavorNotes || []).join(" ").toLocaleLowerCase("tr-TR");
  const roast = (p.roastLevel || "").toLocaleLowerCase("tr-TR");
  const name = `${p.name} ${p.shortDescription || ""}`.toLocaleLowerCase("tr-TR");
  const blob = `${notes} ${roast} ${name}`;
  let score = 0;

  // Demleme yöntemi: kind/kategori ana sinyal (metin yan bonus)
  if (productMatchesMethod(p, method)) {
    score += 12;
  } else {
    return -1;
  }

  if (taste === "fruity" && /(meyve|berry|çilek|narenciye|floral|çiçek)/.test(blob))
    score += 3;
  if (taste === "chocolate" && /(çikolata|kakao|fındık|karamel|nut)/.test(blob))
    score += 3;
  if (taste === "bold" && /(dark|koyu|yoğun|bitter|espresso|gövde)/.test(blob))
    score += 3;
  if (taste === "balanced" && /(dengeli|balanced|yumuşak|smooth)/.test(blob))
    score += 2;

  if (method === "espresso" && /(espresso|crema|shot)/.test(blob)) score += 2;
  if (method === "filter" && /(filtre|v60|pour|aydınlık|floral)/.test(blob))
    score += 2;
  if (method === "turkish" && /(türk|ince|cezve)/.test(blob)) score += 2;
  if (method === "french" && /(french|press|gövde|full)/.test(blob)) score += 1;
  if (method === "moka" && /(moka|espresso|yoğun)/.test(blob)) score += 1;

  if (acidity === "high" && /(asit|bright|narenciye|meyve)/.test(blob)) score += 2;
  if (acidity === "low" && /(düşük asit|yumuşak|çikolata|fındık)/.test(blob))
    score += 2;
  if (acidity === "medium") score += 1;

  if (p.isFeatured) score += 1;
  return score;
}

export function CoffeeFinder({
  products,
  brandName,
  whatsappEnabled = true,
  whatsappPhone,
}: Props) {
  const [step, setStep] = useState(0);
  const [taste, setTaste] = useState<Taste | null>(null);
  const [method, setMethod] = useState<Method | null>(null);
  const [acidity, setAcidity] = useState<Acidity | null>(null);

  const results = useMemo(() => {
    if (!taste || !method || !acidity) return [];
    return [...products]
      .map((p) => ({
        product: p,
        score: scoreProduct(p, taste, method, acidity),
      }))
      .filter((r) => r.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((r) => r.product);
  }, [products, taste, method, acidity]);

  const phone = resolveWhatsAppPhone({ whatsappPhone });
  const waHref =
    whatsappEnabled && results[0]
      ? buildWhatsAppUrl(
          phone,
          `Merhaba, kahve seçicide "${results[0].name}" önerildi. Bu kavrum hakkında danışmak istiyorum.`,
        )
      : null;

  function pickTaste(id: Taste) {
    setTaste(id);
    setStep(1);
  }
  function pickMethod(id: Method) {
    setMethod(id);
    setStep(2);
  }
  function pickAcidity(id: Acidity) {
    setAcidity(id);
    setStep(3);
  }

  return (
    <section className="page-shell py-section">
      {step < 3 ? (
        <div className="max-w-2xl">
          <p className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant">
            Adım {step + 1} / 3
          </p>
          <h2 className="mt-2 font-display text-3xl uppercase md:text-4xl">
            {step === 0 && "Nasıl içiyorsunuz?"}
            {step === 1 && "Nasıl demliyorsunuz?"}
            {step === 2 && "Asidite tercihiniz?"}
          </h2>
          <div className="mt-8 flex flex-col gap-3">
            {(step === 0 ? TASTE : step === 1 ? METHOD : ACIDITY).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  if (step === 0) pickTaste(opt.id as Taste);
                  else if (step === 1) pickMethod(opt.id as Method);
                  else pickAcidity(opt.id as Acidity);
                }}
                className="border border-outline-variant/40 px-5 py-4 text-left font-meta text-xs uppercase tracking-widest text-on-surface transition-colors hover:border-primary hover:text-primary"
              >
                {opt.label}
              </button>
            ))}
          </div>
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="btn-ghost mt-6 px-5 py-3 text-xs"
            >
              Geri
            </button>
          ) : null}
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-meta text-[10px] uppercase tracking-widest text-primary">
                Öneri hazır
              </p>
              <h2 className="mt-2 font-display text-3xl uppercase md:text-4xl">
                {results[0]
                  ? `Sana ${results[0].name} öneriyoruz`
                  : "Koleksiyonu inceleyin"}
              </h2>
              <p className="mt-3 max-w-xl font-meta text-xs uppercase text-on-surface-variant">
                {brandName} · tercihinize yakın kavrumlar
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep(0);
                  setTaste(null);
                  setMethod(null);
                  setAcidity(null);
                }}
                className="btn-ghost px-5 py-3 text-xs"
              >
                Yeniden başla
              </button>
              {waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-cta px-5 py-3 text-xs"
                >
                  WhatsApp ile danış
                </a>
              ) : null}
            </div>
          </div>

          {results.length ? (
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <p className="mt-8 font-meta text-sm uppercase text-secondary">
              Bu demleme yöntemine uygun aktif ürün yok.{" "}
              <Link href="/urunler" className="text-primary underline">
                Tüm kavrumlar
              </Link>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
