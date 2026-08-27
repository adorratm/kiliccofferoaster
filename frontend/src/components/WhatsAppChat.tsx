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
          className="pointer-events-auto banner-enter flex max-h-[min(52dvh,22rem)] w-[min(100vw-2rem,22rem)] flex-col overflow-hidden border border-outline-variant/40 bg-surface-container-lowest shadow-[0_12px_40px_rgba(0,0,0,0.45)] sm:max-h-[min(70vh,28rem)]"
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-outline-variant/25 bg-surface-container-low px-4 py-2.5 sm:py-3">
            <div>
              <p className="font-meta text-[10px] uppercase tracking-widest text-primary">
                [ Channel: WhatsApp ]
              </p>
              <p className="mt-1 font-display text-lg leading-none tracking-tight text-on-surface sm:text-xl">
                Canlı destek
              </p>
              <p className="mt-1.5 hidden font-meta text-[10px] uppercase leading-relaxed text-on-surface-variant sm:block">
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

          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-4 py-3 sm:space-y-3 sm:py-4">
            <div className="industrial-border bg-surface-container px-3 py-2 sm:py-3">
              <p className="font-meta text-[10px] uppercase leading-relaxed text-secondary sm:text-[11px]">
                {greeting}
              </p>
            </div>

            <ul className="flex flex-col gap-1.5 sm:gap-2">
              {list.map((preset, index) => (
                <li key={`${preset.label}-${index}`}>
                  <button
                    type="button"
                    onClick={() => sendPreset(preset)}
                    className="w-full border border-outline-variant/35 bg-surface px-3 py-2 text-left font-meta text-[10px] uppercase tracking-widest text-on-surface transition-colors hover:border-primary hover:text-primary sm:py-2.5 sm:text-[11px]"
                  >
                    {preset.label}
                  </button>
                </li>
              ))}
            </ul>

            <form
              onSubmit={onCustomSubmit}
              className="space-y-2 border-t border-outline-variant/20 pt-2.5 sm:pt-3"
            >
              <label className="field-label" htmlFor={`${panelId}-msg`}>
                Kendi mesajınız
              </label>
              <textarea
                id={`${panelId}-msg`}
                rows={2}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Mesajınızı yazın…"
                className="field-input resize-none text-sm normal-case tracking-normal sm:resize-y"
              />
              <button type="submit" className="btn-cta w-full py-2.5 text-xs sm:py-3">
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
        className="pointer-events-auto flex items-center gap-3 border border-[#25D366]/40 bg-[#25D366] px-4 py-3 font-meta text-[11px] uppercase tracking-widest text-white shadow-[0_8px_24px_rgba(37,211,102,0.35)] transition-colors hover:bg-[#1ebe57]"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0"
          fill="currentColor"
          aria-hidden
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        {open ? "Kapat" : "WhatsApp"}
      </button>
    </div>
  );
}
