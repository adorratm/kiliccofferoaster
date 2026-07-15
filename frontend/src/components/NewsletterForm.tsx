"use client";

import { FormEvent, useState } from "react";
import { subscribeNewsletter } from "@/lib/api";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    try {
      await subscribeNewsletter(email);
      setStatus("ok");
      setEmail("");
    } catch {
      setStatus("err");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-xl flex-col gap-4 md:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="USER@TERMINAL.COM"
        className="field-input grow text-primary"
      />
      <button type="submit" disabled={loading} className="btn-cta px-8 py-4 text-xs font-bold">
        {loading ? "Gönderiliyor…" : "Abone Ol"}
      </button>
      {status === "ok" ? (
        <p className="w-full font-meta text-[11px] uppercase text-primary md:absolute md:mt-20">
          Kayıt alındı.
        </p>
      ) : null}
      {status === "err" ? (
        <p className="w-full font-meta text-[11px] uppercase text-error md:absolute md:mt-20">
          Abonelik şimdilik tamamlanamadı.
        </p>
      ) : null}
    </form>
  );
}
