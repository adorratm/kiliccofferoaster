"use client";

import { FormEvent, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { submitContact } from "@/lib/api";
import type { SiteSettings } from "@/lib/cms";
import {
  buildWhatsAppUrl,
  resolveWhatsAppPhone,
} from "@/lib/whatsapp";

type Props = {
  contact: SiteSettings["contact"];
  whatsapp: SiteSettings["whatsapp"];
  brandName: string;
};

export function WholesalePageClient({
  contact,
  whatsapp,
  brandName,
}: Props) {
  const [form, setForm] = useState({
    senderName: "",
    senderEmail: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [loading, setLoading] = useState(false);

  const waHref = whatsapp.enabled
    ? buildWhatsAppUrl(
        resolveWhatsAppPhone({
          whatsappPhone: whatsapp.phone,
          contactPhone: contact.phone,
        }),
        `Merhaba, ${brandName} toptan / işletme kahve tedariki hakkında yazıyorum. Ücretsiz numune talebim var.`,
      )
    : undefined;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    try {
      await submitContact({
        ...form,
        protocolType: "wholesale",
      });
      setStatus("ok");
      setForm({ senderName: "", senderEmail: "", message: "" });
    } catch {
      setStatus("err");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <header className="page-shell border-b border-outline-variant/20 pb-10 pt-16 md:pt-24">
        <p className="font-meta text-xs uppercase tracking-widest text-primary">
          [ B2B · Supply ]
        </p>
        <h1 className="mt-4 font-display text-5xl leading-none tracking-tighter md:text-7xl">
          Toptan kahve
          <br />
          tedariki
        </h1>
        <p className="mt-4 max-w-xl font-meta text-xs uppercase leading-relaxed tracking-widest text-on-surface-variant">
          Cafe, restoran, otel ve ofisler için Ayrancılar’da kavrulan specialty
          kahve. Ücretsiz numune ve düzenli tedarik için yazın.
        </p>
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cta mt-8 inline-flex px-6 py-3 text-xs"
          >
            WhatsApp ile yaz
          </a>
        ) : null}
      </header>

      <section className="page-shell grid grid-cols-1 gap-12 py-section md:grid-cols-12">
        <Reveal className="md:col-span-5" variant="left">
          <div className="industrial-border bg-surface-container-lowest p-8">
            <h2 className="font-meta text-xs uppercase tracking-widest text-primary">
              Neden biz?
            </h2>
            <ul className="mt-6 space-y-4 font-meta text-xs uppercase leading-relaxed text-secondary">
              <li>Taze kavrum · Torbalı / Ayrancılar atölye</li>
              <li>Espresso & filtre için profil seçenekleri</li>
              <li>Ücretsiz numune bırakabiliriz</li>
              <li>Düzenli B2B teslimat</li>
            </ul>
            {contact.phone ? (
              <p className="mt-8 font-meta text-sm uppercase text-on-surface">
                Tel · {contact.phone}
              </p>
            ) : null}
          </div>
        </Reveal>

        <Reveal className="md:col-span-7" variant="right" delay={80}>
          <form
            onSubmit={onSubmit}
            className="industrial-border bg-surface-container-low p-6 md:p-10"
          >
            <div className="grid gap-5">
              <div>
                <label className="field-label">İşletme / ad soyad</label>
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
                <label className="field-label">Talep</label>
                <textarea
                  required
                  rows={5}
                  className="field-input resize-y"
                  placeholder="Aylık kg, demleme tipi, numune isteği…"
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
                {loading ? "Gönderiliyor…" : "Toptan talep gönder"}
              </button>
              {status === "ok" ? (
                <p className="font-meta text-xs uppercase text-primary">
                  Talebiniz alındı. En kısa sürede dönüş yapacağız.
                </p>
              ) : null}
              {status === "err" ? (
                <p className="font-meta text-xs uppercase text-error">
                  Gönderim başarısız. WhatsApp’tan yazabilirsiniz.
                </p>
              ) : null}
            </div>
          </form>
        </Reveal>
      </section>
    </div>
  );
}
