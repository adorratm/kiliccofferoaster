"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMe } from "@/lib/api";
import { consumeAuthNext, isOpsRole, setToken } from "@/lib/auth";
import { fetchCart } from "@/lib/cart";
import { isDesktopApp, OPS_PROTOCOL } from "@/lib/downloads";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    const oauthError = params.get("error");
    if (oauthError) {
      router.replace(`/giris?error=${encodeURIComponent(oauthError)}`);
      return;
    }
    if (token) {
      setToken(token);
      const next = consumeAuthNext("/hesabim");
      void (async () => {
        if (isDesktopApp()) {
          try {
            const me = await getMe(token);
            if (isOpsRole(me.role)) {
              window.location.href = OPS_PROTOCOL;
              return;
            }
          } catch {
            /* vitrin hesabı */
          }
        }
        await fetchCart().catch(() => null);
        router.replace(next);
      })();
      return;
    }
    router.replace("/giris");
  }, [params, router]);

  return (
    <main className="flex min-h-[50vh] items-center justify-center px-6 font-mono text-sm tracking-widest text-on-surface-variant animate-fade-up">
      OTURUM_DOGRULANIYOR...
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[50vh] items-center justify-center font-mono text-sm">
          YUKLENIYOR...
        </main>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
