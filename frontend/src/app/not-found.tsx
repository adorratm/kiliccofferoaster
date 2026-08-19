import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sayfa bulunamadı",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="page-shell py-24 md:py-32">
      <p className="font-meta text-xs uppercase tracking-[0.2em] text-primary">
        404
      </p>
      <h1 className="mt-4 font-display text-5xl leading-none tracking-tighter md:text-7xl">
        Sayfa bulunamadı
      </h1>
      <p className="mt-6 max-w-xl text-secondary">
        Aradığınız sayfa taşınmış veya yayından kalkmış olabilir. Katalogdan
        devam edebilirsiniz.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/urunler"
          className="border border-primary bg-primary px-5 py-3 font-meta text-xs uppercase tracking-widest text-on-primary"
        >
          Kavrumlar
        </Link>
        <Link
          href="/"
          className="border border-outline-variant/40 px-5 py-3 font-meta text-xs uppercase tracking-widest text-secondary"
        >
          Ana sayfa
        </Link>
      </div>
    </div>
  );
}
