"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { isInAppShell } from "@/lib/downloads";
import { readCookieConsent } from "@/lib/cookie-consent";
import {
  DEFAULT_WHATSAPP_PHONE,
  DEFAULT_WHATSAPP_SETTINGS,
  buildWhatsAppUrl,
  type WhatsAppPreset,
} from "@/lib/whatsapp";

type Props = {
  enabled?: boolean;
  phone?: string | null;
  brandName?: string;
  greeting?: string;
  presets?: WhatsAppPreset[];
};

function openWhatsApp(phone: string | null | undefined, text: string) {
  const url = buildWhatsAppUrl(phone, text);
  window.open(url, "_blank", "noopener,noreferrer");
}

export function WhatsAppChat({
  enabled = true,
  phone = DEFAULT_WHATSAPP_PHONE,
  brandName = "Kılıç Coffee Roaster",
  greeting = DEFAULT_WHATSAPP_SETTINGS.greeting,
  presets = DEFAULT_WHATSAPP_SETTINGS.presets,
}: Props) {
  const [open, setOpen] = useState(false);
  const [liftForCookie, setLiftForCookie] = useState(false);
  const [custom, setCustom] = useState("");
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function syncCookieLift() {
      if (isInAppShell()) {
        setLiftForCookie(false);
        return;
      }
      setLiftForCookie(!readCookieConsent());
    }
    syncCookieLift();
    window.addEventListener("kilic:cookie-consent", syncCookieLift);
    window.addEventListener("storage", syncCookieLift);
    return () => {
      window.removeEventListener("kilic:cookie-consent", syncCookieLift);
      window.removeEventListener("storage", syncCookieLift);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    function onPointer(e: MouseEvent) {
      const t = e.target as Node;
      if (
        panelRef.current?.contains(t) ||
        toggleRef.current?.contains(t)
      ) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  if (!enabled) return null;

  function sendPreset(preset: WhatsAppPreset) {
    openWhatsApp(phone, preset.message);
    setOpen(false);
  }

  function onCustomSubmit(e: FormEvent) {
    e.preventDefault();
    const text =
      custom.trim() ||
      `Merhaba, ${brandName} hakkında yazıyorum.`;
    openWhatsApp(phone, text);
    setCustom("");
    setOpen(false);
  }

  const bottomClass = liftForCookie ? "bottom-36 sm:bottom-40" : "bottom-6";
  const list = presets.length
    ? presets
    : DEFAULT_WHATSAPP_SETTINGS.presets;

  return (
    <div
      className={`pointer-events-none fixed right-4 z-50 flex flex-col items-end gap-3 sm:right-6 ${bottomClass}`}
    >
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-label="WhatsApp sohbet"
          className="pointer-events-auto banner-enter w-[min(100vw-2rem,22rem)] overflow-hidden border border-outline-variant/40 bg-surface-container-lowest shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
        >
          <div className="flex items-start justify-between gap-3 border-b border-outline-variant/25 bg-surface-container-low px-4 py-3">
            <div>
              <p className="font-meta text-[10px] uppercase tracking-widest text-primary">
                [ Channel: WhatsApp ]
              </p>
              <p className="mt-1 font-display text-xl leading-none tracking-tight text-on-surface">
                Canlı destek
              </p>
              <p className="mt-2 font-meta text-[10px] uppercase leading-relaxed text-on-surface-variant">
                Hazır soru seçin veya yazın · {phone}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="font-meta text-[10px] uppercase tracking-widest text-secondary hover:text-primary"
              aria-label="Sohbeti kapat"
            >
              Kapat
            </button>
          </div>

          <div className="space-y-3 px-4 py-4">
            <div className="industrial-border bg-surface-container px-3 py-3">
              <p className="font-meta text-[11px] uppercase leading-relaxed text-secondary">
                {greeting}
              </p>
            </div>

            <ul className="flex flex-col gap-2">
              {list.map((preset, index) => (
                <li key={`${preset.label}-${index}`}>
                  <button
                    type="button"
                    onClick={() => sendPreset(preset)}
                    className="w-full border border-outline-variant/35 bg-surface px-3 py-2.5 text-left font-meta text-[11px] uppercase tracking-widest text-on-surface transition-colors hover:border-primary hover:text-primary"
                  >
                    {preset.label}
                  </button>
                </li>
              ))}
            </ul>

            <form
              onSubmit={onCustomSubmit}
              className="space-y-2 border-t border-outline-variant/20 pt-3"
            >
              <label className="field-label" htmlFor={`${panelId}-msg`}>
                Kendi mesajınız
              </label>
              <textarea
                id={`${panelId}-msg`}
                rows={3}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Mesajınızı yazın…"
                className="field-input resize-y text-sm normal-case tracking-normal"
              />
              <button type="submit" className="btn-cta w-full py-3 text-xs">
                WhatsApp&apos;ta gönder
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto flex items-center gap-3 border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 font-meta text-[11px] uppercase tracking-widest text-primary transition-colors hover:border-primary"
      >
        <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
          <span className="absolute inset-0 motion-safe:animate-ping rounded-full bg-primary/50" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
        {open ? "Kapat" : "WhatsApp"}
      </button>
    </div>
  );
}
