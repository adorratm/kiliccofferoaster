"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthField, AuthShell } from "@/components/AuthModal";
import { register } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await register({ email, password, firstName, lastName });
      setToken(res.accessToken);
      router.push("/hesabim");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kayıt tamamlanamadı.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell mode="register" error={error}>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <AuthField
            id="firstName"
            label="Ad"
            value={firstName}
            onChange={setFirstName}
            autoComplete="given-name"
          />
          <AuthField
            id="lastName"
            label="Soyad"
            value={lastName}
            onChange={setLastName}
            autoComplete="family-name"
          />
        </div>
        <AuthField
          id="email"
          label="E-posta"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
        />
        <AuthField
          id="password"
          label="Şifre"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
        />
        <button type="submit" disabled={loading} className="btn-cta w-full py-4 text-xs">
          {loading ? "Oluşturuluyor…" : "Hesap Oluştur"}
        </button>
      </form>
    </AuthShell>
  );
}
