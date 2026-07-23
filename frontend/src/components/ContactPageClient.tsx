"use client";

import { FormEvent, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { submitContact } from "@/lib/api";
import type { SiteSettings } from "@/lib/cms";

type Props = {
  contact: SiteSettings["contact"];
  brandName: string;
  title: string;
  subtitle: string;
};

export function ContactPageClient({
  contact,
  brandName,
  title,
  subtitle,
}: Props) {
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

  const telHref = contact.phone
    ? `tel:${contact.phone.replace(/\s/g, "")}`
    : undefined;
  const mailHref = contact.email ? `mailto:${contact.email}` : undefined;

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
          <h1 className="font-display text-5xl leading-none tracking-tighter md:text-7xl whitespace-pre-line">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-4 max-w-xl font-meta text-xs uppercase tracking-widest text-on-surface-variant">
              {subtitle}
            </p>
          ) : null}
        </div>
      </header>

      <section className="page-shell grid grid-cols-1 gap-12 py-section md:grid-cols-12">
        <div className="flex flex-col gap-10 md:col-span-5">
          <Reveal variant="left">
            <div className="panel-motion industrial-border bg-surface-container-lowest p-8">
              <h3 className="mb-6 font-meta text-xs uppercase tracking-widest text-primary">
                {brandName}
              </h3>
              {contact.locationLabel ? (
                <p className="mb-4 font-display text-2xl leading-tight md:text-3xl">
                  {contact.locationLabel}
                </p>
              ) : null}
              {contact.address ? (
                <div className="border-t border-outline-variant/20 pt-4 font-meta text-xs uppercase leading-relaxed text-on-surface-variant">
                  {contact.address}
                </div>
              ) : null}
              <div className="mt-6 space-y-2 font-meta text-sm uppercase text-secondary">
                {contact.phone ? (
                  <p>
                    <span className="text-on-surface-variant">Telefon · </span>
                    <a href={telHref} className="text-primary hover:underline">
                      {contact.phone}
                    </a>
                  </p>
                ) : null}
                {contact.email ? (
                  <p>
                    <span className="text-on-surface-variant">E-posta · </span>
                    <a href={mailHref} className="text-primary hover:underline">
                      {contact.email}
                    </a>
                  </p>
                ) : null}
              </div>
            </div>
          </Reveal>

          {contact.hours ? (
            <Reveal variant="left" delay={90}>
              <div className="panel-motion industrial-border p-8">
                <h3 className="mb-6 font-meta text-xs uppercase tracking-widest text-primary">
                  Çalışma saatleri
                </h3>
                <p className="font-meta text-sm uppercase leading-relaxed text-secondary">
                  {contact.hours}
                </p>
              </div>
            </Reveal>
          ) : null}
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
              <button
                type="submit"
                disabled={loading}
                className="btn-cta py-4 text-xs"
              >
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
