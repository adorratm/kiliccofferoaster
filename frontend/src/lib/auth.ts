const TOKEN_KEY = "kilic_access_token";
const COOKIE_NAME = "kilic_token";
const AUTH_NEXT_KEY = "kilic_auth_next";

function canUseDom() {
  return typeof window !== "undefined";
}

/** Açık yönlendirme yolları — open redirect engeli */
export function safeNextPath(
  next: string | null | undefined,
  fallback = "/hesabim",
): string {
  if (!next) return fallback;
  const path = next.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (
    path.startsWith("/giris") ||
    path.startsWith("/kayit") ||
    path.startsWith("/auth")
  ) {
    return fallback;
  }
  return path;
}

export function rememberAuthNext(path: string) {
  if (!canUseDom()) return;
  const safe = safeNextPath(path, "");
  if (safe) window.sessionStorage.setItem(AUTH_NEXT_KEY, safe);
}

export function consumeAuthNext(fallback = "/hesabim"): string {
  if (!canUseDom()) return fallback;
  const raw = window.sessionStorage.getItem(AUTH_NEXT_KEY);
  window.sessionStorage.removeItem(AUTH_NEXT_KEY);
  return safeNextPath(raw, fallback);
}

export function loginPath(next?: string | null): string {
  const safe = safeNextPath(next, "");
  return safe ? `/giris?next=${encodeURIComponent(safe)}` : "/giris";
}

export function getToken(): string | null {
  if (!canUseDom()) return null;
  return (
    window.localStorage.getItem(TOKEN_KEY) ||
    readCookie(COOKIE_NAME) ||
    null
  );
}

export function setToken(token: string) {
  if (!canUseDom()) return;
  window.localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearToken() {
  if (!canUseDom()) return;
  window.localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

export function isAuthenticated() {
  return Boolean(getToken());
}

function readCookie(name: string): string | null {
  if (!canUseDom()) return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.split("=").slice(1).join("="));
}
