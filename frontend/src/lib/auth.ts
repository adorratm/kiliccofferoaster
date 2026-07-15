const TOKEN_KEY = "kilic_access_token";
const COOKIE_NAME = "kilic_token";

function canUseDom() {
  return typeof window !== "undefined";
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
