export type AuthUser = {
  id: string;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
  hasPassword?: boolean;
  opsAccessPending?: boolean;
};

export const OPS_ROLES = ['admin', 'staff', 'accountant'] as const;

const TOKEN_KEY = 'ops_token';
const USER_KEY = 'ops_user';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isOpsRole(role: string): boolean {
  return (OPS_ROLES as readonly string[]).includes(role);
}

export async function apiUrl(): Promise<string> {
  if (window.ops?.getApiUrl) return window.ops.getApiUrl();
  return 'http://localhost:4000';
}

function messageFromBody(text: string): string {
  try {
    const json = JSON.parse(text) as { message?: string | string[] };
    if (Array.isArray(json.message)) return json.message[0] || text;
    if (typeof json.message === 'string') return json.message;
  } catch {
    /* ham metin */
  }
  return text;
}

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  const base = await apiUrl();
  const token = options.token ?? getToken();
  const res = await fetch(`${base}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(messageFromBody(text) || res.statusText, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function apiFormData<T>(
  path: string,
  form: FormData,
  options: { method?: string; token?: string } = {},
): Promise<T> {
  const base = await apiUrl();
  const token = options.token ?? getToken();
  const res = await fetch(`${base}${path}`, {
    method: options.method || 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(messageFromBody(text) || res.statusText, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function uploadMedia(
  file: File,
  options?: { alt?: string; folder?: string },
): Promise<{ id: string; url: string; filename: string }> {
  const base = await apiUrl();
  const token = getToken();
  const form = new FormData();
  form.append('file', file);
  if (options?.alt) form.append('alt', options.alt);
  if (options?.folder) form.append('folder', options.folder);

  const res = await fetch(`${base}/media/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(messageFromBody(text) || res.statusText, res.status);
  }

  return (await res.json()) as { id: string; url: string; filename: string };
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export async function applySession(
  token: string,
  user: AuthUser,
  password?: string,
): Promise<void> {
  if (!isOpsRole(user.role)) {
    throw new Error('Bu hesap ön muhasebe için yetkili değil. Staff / admin kullanın.');
  }
  setSession(token, user);
  if (window.ops?.saveOfflineSession) {
    await window.ops.saveOfflineSession({
      email: user.email,
      token,
      user,
      password,
    });
  }
}
