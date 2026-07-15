"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { oauthUrl } from "@/lib/api";

type AuthMode = "login" | "register";

type Props = {
  mode: AuthMode;
  children: ReactNode;
  error?: string | null;
  title?: string;
};

export function AuthShell({ mode, children, error, title }: Props) {
  const isLogin = mode === "login";

  return (
    <div className="page-shell mx-auto max-w-xl py-16 md:py-24">
      <div className="page-enter">
        <div className="mb-2 font-meta text-xs uppercase tracking-widest text-primary">
          Auth_Protocol / {isLogin ? "Session_Restore" : "Node_Create"}
        </div>
        <h1 className="font-display text-4xl leading-none md:text-5xl">
          {title || (isLogin ? "Giriş" : "Kayıt")}
        </h1>
        <p className="mt-4 font-meta text-xs uppercase tracking-widest text-secondary">
          E-posta ile devam edin veya sosyal sağlayıcıya bağlanın.
        </p>
      </div>

      <div className="mt-10 industrial-border bg-surface-container-low p-6 md:p-8 animate-fade-up" style={{ animationDelay: "160ms" }}>
        {error ? (
          <div className="mb-6 border border-error/40 bg-error/10 px-4 py-3 font-meta text-xs uppercase text-error">
            {error}
          </div>
        ) : null}
        {children}
        <OAuthLinks />
        <p className="mt-8 font-meta text-[11px] uppercase text-secondary">
          {isLogin ? (
            <>
              Hesabınız yok mu?{" "}
              <Link href="/kayit" className="text-primary underline">
                Kayıt ol
              </Link>
            </>
          ) : (
            <>
              Zaten üye misiniz?{" "}
              <Link href="/giris" className="text-primary underline">
                Giriş yap
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export function OAuthLinks() {
  const providers = [
    { id: "google" as const, label: "Google" },
    { id: "facebook" as const, label: "Facebook" },
    { id: "apple" as const, label: "Apple" },
  ];

  return (
    <div className="mt-8 border-t border-outline-variant/20 pt-8">
      <p className="mb-4 font-meta text-[10px] uppercase tracking-widest text-on-surface-variant">
        Sosyal giriş
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {providers.map((p) => (
          <a
            key={p.id}
            href={oauthUrl(p.id)}
            className="oauth-chip border border-outline-variant/40 px-4 py-3 text-center font-meta text-[11px] uppercase tracking-widest text-secondary hover:border-primary hover:text-primary"
          >
            {p.label}
          </a>
        ))}
      </div>
    </div>
  );
}

export function AuthField({
  label,
  id,
  type = "text",
  value,
  onChange,
  autoComplete,
  required,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="field-input"
      />
    </div>
  );
}
