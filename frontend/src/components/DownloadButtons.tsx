"use client";

import { useEffect, useState } from "react";
import { DOWNLOADS, isInAppShell } from "@/lib/downloads";
import { Reveal } from "@/components/Reveal";

type Card = {
  id: string;
  platform: string;
  title: string;
  body: string;
  href: string;
  label: string;
  pending?: boolean;
};

export function DownloadButtons() {
  const [inApp, setInApp] = useState(false);
  useEffect(() => {
    setInApp(isInAppShell());
  }, []);

  if (inApp) {
    return (
      <p className="mt-12 font-meta text-xs uppercase text-secondary">
        Bu uygulamadasınız. İndirme sayfası tarayıcıda görünür.
      </p>
    );
  }

  const cards: Card[] = [
    {
      id: "win",
      platform: "01 // Windows",
      title: "Masaüstü",
      body: "Kurulum sihirbazı ile yükleyin. Mağaza açılır; personel paneli ayrı menüdedir.",
      href: DOWNLOADS.windows,
      label: "Windows kurulumunu indir",
    },
    {
      id: "mac",
      platform: "02 // macOS",
      title: "Mac",
      body: "DMG’yi açıp uygulamayı Applications’a sürükleyin. Intel ve Apple Silicon.",
      href: DOWNLOADS.mac,
      label: "macOS kurulumunu indir",
      pending: !DOWNLOADS.mac,
    },
    {
      id: "and",
      platform: "03 // Android",
      title: "Telefon / tablet",
      body: "Play Store veya APK ile kurun. Kahve siparişi sitedeki akışın aynısıdır.",
      href: DOWNLOADS.playStore || DOWNLOADS.androidApk,
      label: DOWNLOADS.playStore ? "Google Play" : "Android APK indir",
      pending: !DOWNLOADS.playStore && !DOWNLOADS.androidApk,
    },
    {
      id: "ios",
      platform: "04 // iPhone / iPad",
      title: "App Store",
      body: "TestFlight veya App Store bağlantısı yayın sonrası burada olur.",
      href: DOWNLOADS.appStore,
      label: "App Store",
      pending: !DOWNLOADS.appStore,
    },
  ];

  return (
    <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, i) => (
        <Reveal key={card.id} delay={i * 80} variant="up">
          <article className="industrial-border flex h-full flex-col bg-surface-container-low p-6">
            <p className="font-meta text-[10px] uppercase tracking-[0.2em] text-primary/70">
              {card.platform}
            </p>
            <h2 className="mt-3 font-display text-2xl">{card.title}</h2>
            <p className="mt-4 flex-1 font-meta text-[11px] uppercase leading-relaxed text-secondary">
              {card.body}
            </p>
            {card.pending || !card.href ? (
              <p className="mt-8 font-meta text-[11px] uppercase text-secondary">
                Paket hazır olunca bu düğme aktif olur. Build sonrası dosyayı{" "}
                <span className="text-primary">/downloads</span> klasörüne veya
                CDN adresine koyun.
              </p>
            ) : (
              <a
                href={card.href}
                className="btn-cta mt-8 inline-flex justify-center px-5 py-3 text-xs"
              >
                {card.label}
              </a>
            )}
          </article>
        </Reveal>
      ))}
    </div>
  );
}
