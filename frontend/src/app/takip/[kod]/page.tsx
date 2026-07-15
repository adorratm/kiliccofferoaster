"use client";

import { useParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Reveal } from "@/components/Reveal";
import { API_BASE, trackShipment } from "@/lib/api";
import type { TrackingResult } from "@/lib/types";

function normalizeResult(data: TrackingResult): TrackingResult {
  const events = (data.events || []).map((ev) => {
    const raw = ev as { at?: string; date?: string; description: string; location?: string };
    return {
      at: raw.at || raw.date || "",
      description: raw.description,
      location: raw.location,
    };
  });
  return { ...data, events };
}

export default function TrackingPage() {
  const params = useParams<{ kod: string }>();
  const [code, setCode] = useState(params.kod || "");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  async function lookup(value: string) {
    setLoading(true);
    setError(null);
    const data = await trackShipment(value);
    if (!data) {
      setResult(null);
      setError(
        value === "ornek"
          ? "Takip kodu girin. Örnek sayfa boş sonuç gösterebilir."
          : "Kargo kaydı bulunamadı.",
      );
    } else {
      setResult(normalizeResult(data));
    }
    setLoading(false);
  }

  useEffect(() => {
    if (params.kod) {
      setCode(params.kod);
      void lookup(params.kod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.kod]);

  useEffect(() => {
    const trackingCode = (params.kod || code || "").trim();
    if (!trackingCode || trackingCode === "ornek") {
      return;
    }

    const socket = io(`${API_BASE}/tracking`, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setLive(true);
      socket.emit("track:subscribe", { code: trackingCode });
    });

    socket.on("disconnect", () => setLive(false));

    socket.on("track:update", (payload: TrackingResult) => {
      setResult((prev) =>
        normalizeResult({
          code: payload.code || trackingCode,
          status: payload.status,
          provider: payload.provider || prev?.provider,
          trackingUrl: payload.trackingUrl ?? prev?.trackingUrl,
          events: payload.events?.length ? payload.events : prev?.events,
          order: payload.order || prev?.order,
        }),
      );
      setError(null);
      setLoading(false);
    });

    return () => {
      socket.emit("track:unsubscribe", { code: trackingCode });
      socket.disconnect();
      socketRef.current = null;
      setLive(false);
    };
  }, [params.kod, code]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    window.history.replaceState(
      null,
      "",
      `/takip/${encodeURIComponent(code.trim())}`,
    );
    await lookup(code.trim());
  }

  return (
    <div className="page-shell py-16 md:py-24">
      <div className="page-enter">
        <div className="mb-2 flex items-center gap-3 font-meta text-xs uppercase tracking-widest text-primary">
          <span>Logistics / Track</span>
          {live ? (
            <span className="animate-pulse-line border border-primary/40 px-2 py-0.5 text-[10px] text-primary">
              Live
            </span>
          ) : null}
        </div>
        <h1 className="font-display text-4xl md:text-6xl">Kargo Takip</h1>
      </div>

      <Reveal className="mt-10" delay={80}>
        <form
          onSubmit={onSubmit}
          className="flex max-w-xl flex-col gap-4 sm:flex-row"
        >
          <input
            className="field-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Takip kodu"
          />
          <button type="submit" className="btn-cta px-8 py-4 text-xs">
            Sorgula
          </button>
        </form>
      </Reveal>

      <Reveal className="mt-10" variant="scale" delay={120}>
        <div className="industrial-border bg-surface-container-low p-6 md:p-10">
          {loading ? (
            <p className="font-meta text-xs uppercase text-secondary">
              Sorgulanıyor…
            </p>
          ) : error ? (
            <p className="font-meta text-xs uppercase text-error">{error}</p>
          ) : result ? (
            <div className="space-y-6">
              <div>
                <div className="font-meta text-[11px] uppercase text-on-surface-variant">
                  Kod
                </div>
                <div className="font-display text-3xl">{result.code}</div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Meta label="Durum" value={result.status} />
                <Meta label="Sağlayıcı" value={result.provider || "—"} />
                <Meta label="Sipariş" value={result.order?.orderNumber || "—"} />
              </div>
              {result.trackingUrl ? (
                <a
                  href={result.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block font-meta text-xs uppercase text-primary underline"
                >
                  Sağlayıcı sayfası
                </a>
              ) : null}
              {result.events?.length ? (
                <ul className="divide-y divide-outline-variant/20 border-t border-outline-variant/20">
                  {result.events.map((ev, i) => (
                    <li
                      key={`${ev.at}-${i}`}
                      className="row-motion py-4 font-meta text-xs uppercase"
                    >
                      <div className="text-primary">{ev.at}</div>
                      <div className="mt-1 text-secondary">{ev.description}</div>
                      {ev.location ? (
                        <div className="mt-1 text-on-surface-variant">
                          {ev.location}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </Reveal>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-meta text-[10px] uppercase text-on-surface-variant">
        {label}
      </div>
      <div className="mt-1 font-meta text-sm uppercase text-on-surface">
        {value}
      </div>
    </div>
  );
}
