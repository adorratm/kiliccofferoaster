"use client";

import { FormEvent, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { submitContact } from "@/lib/api";
import { WORKSHOP_ADDRESS } from "@/lib/format";

export default function ContactPage() {
  const [form, setForm] = useState({
    senderName: "",
    senderEmail: "",
    protocolType: "general",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    try {
      await submitContact(form);
      setStatus("ok");
      setForm({
        senderName: "",
        senderEmail: "",
        protocolType: "general",
        message: "",
      });
    } catch {
      setStatus("err");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <header className="page-shell border-b border-outline-variant/20 pb-10 pt-16 md:pt-24">
        <div className="page-enter">
          <div className="mb-4 flex items-baseline gap-4">
            <span className="font-meta text-xs uppercase tracking-widest text-primary">
              [ Status: Online ]
            </span>
            <div className="h-px grow bg-outline-variant/20" />
          </div>
          <h1 className="font-display text-5xl leading-none tracking-tighter md:text-7xl">
            Communications
            <br />
            Protocol
          </h1>
          <p className="mt-4 max-w-xl font-meta text-xs uppercase tracking-widest text-on-surface-variant">
            Kılıç kavurma operasyonlarına doğrudan bağlantı. Teknik sorular, toptan
            talep ve lojistik koordinasyon.
          </p>
        </div>
      </header>

      <section className="page-shell grid grid-cols-1 gap-12 py-section md:grid-cols-12">
        <div className="flex flex-col gap-10 md:col-span-5">
          <Reveal variant="left">
            <div className="panel-motion industrial-border bg-surface-container-lowest p-8">
              <h3 className="mb-6 font-meta text-xs uppercase tracking-widest text-primary">
                Kılıç_HQ_Coordinates
              </h3>
              <p className="font-display text-2xl leading-tight md:text-3xl">
                Ayrancılar Mah.
                <br />
                Değirmen Cad. No:55A
                <br />
                Torbalı / İzmir
              </p>
              <div className="mt-4 border-t border-outline-variant/20 pt-4 font-meta text-xs uppercase text-on-surface-variant">
                {WORKSHOP_ADDRESS}
              </div>
            </div>
          </Reveal>

          <Reveal variant="left" delay={90}>
            <div className="panel-motion industrial-border p-8">
              <h3 className="mb-6 font-meta text-xs uppercase tracking-widest text-primary">
                Operational Hours
              </h3>
              <div className="space-y-3 font-meta text-sm uppercase text-secondary">
                <div className="flex justify-between border-b border-outline-variant/20 pb-3">
                  <span>Pazartesi — Cumartesi</span>
                  <span className="text-primary">08:00 — 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Pazar</span>
                  <span>Kapalı</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="md:col-span-7" variant="right" delay={80}>
          <form
            onSubmit={onSubmit}
            className="panel-motion industrial-border bg-surface-container-low p-6 md:p-10"
          >
            <div className="grid gap-5">
              <div>
                <label className="field-label">Ad Soyad</label>
                <input
                  required
                  className="field-input"
                  value={form.senderName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, senderName: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="field-label">E-posta</label>
                <input
                  required
                  type="email"
                  className="field-input"
                  value={form.senderEmail}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, senderEmail: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="field-label">Protokol Tipi</label>
                <select
                  className="field-input"
                  value={form.protocolType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, protocolType: e.target.value }))
                  }
                >
                  <option value="general">Genel</option>
                  <option value="wholesale">Toptan</option>
                  <option value="logistics">Lojistik</option>
                  <option value="technical">Teknik</option>
                </select>
              </div>
              <div>
                <label className="field-label">Mesaj</label>
                <textarea
                  required
                  rows={6}
                  className="field-input resize-y"
                  value={form.message}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, message: e.target.value }))
                  }
                />
              </div>
              <button type="submit" disabled={loading} className="btn-cta py-4 text-xs">
                {loading ? "Gönderiliyor…" : "Uplink Gönder"}
              </button>
              {status === "ok" ? (
                <p className="font-meta text-xs uppercase text-primary">
                  Mesaj alındı.
                </p>
              ) : null}
              {status === "err" ? (
                <p className="font-meta text-xs uppercase text-error">
                  Gönderim başarısız. Daha sonra tekrar deneyin.
                </p>
              ) : null}
            </div>
          </form>
        </Reveal>
      </section>
    </div>
  );
}
