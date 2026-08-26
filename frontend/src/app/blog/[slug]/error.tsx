"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function BlogPostError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[blog]", error);
  }, [error]);

  return (
    <div className="page-shell py-24 text-center">
      <p className="font-meta text-xs uppercase tracking-widest text-primary">
        Blog
      </p>
      <h1 className="mt-4 font-display text-4xl md:text-5xl">
        Yazı yüklenemedi
      </h1>
      <p className="mx-auto mt-4 max-w-md font-meta text-xs uppercase leading-relaxed text-on-surface-variant">
        Geçici bir hata oluştu. Yenileyin veya diğer yazılara dönün.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <button type="button" onClick={reset} className="btn-cta px-6 py-3 text-xs">
          Yeniden dene
        </button>
        <Link href="/blog" className="btn-ghost px-6 py-3 text-xs">
          Tüm yazılar
        </Link>
      </div>
    </div>
  );
}
