"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AccountTabs } from "@/components/AccountTabs";
import {
  fetchInbox,
  fetchNotificationPrefs,
  markInboxAllRead,
  markInboxRead,
  updateNotificationPrefs,
  type InboxItem,
  type NotificationPrefs,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import { requestBrowserPushPermission } from "@/lib/inbox";

const CUSTOMER_TOGGLES: { key: keyof NotificationPrefs; label: string }[] = [
  { key: "inAppEnabled", label: "Uygulama içi bildirimler" },
  { key: "pushEnabled", label: "Tarayıcı bildirimleri" },
  { key: "ordersEnabled", label: "Siparişler" },
  { key: "shippingEnabled", label: "Kargo" },
  { key: "returnsEnabled", label: "İade / iptal" },
  { key: "accountEnabled", label: "Hesap" },
  { key: "marketingEnabled", label: "Sepet hatırlatmaları" },
];

export default function AccountNotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const token = getToken();
    if (!token) {
      router.replace("/giris?next=/hesabim/bildirimler");
      return;
    }
    try {
      const [inbox, p] = await Promise.all([
        fetchInbox(token),
        fetchNotificationPrefs(token),
      ]);
      setItems(inbox.items);
      setPrefs(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggle(key: keyof NotificationPrefs, value: boolean) {
    const token = getToken();
    if (!token || !prefs) return;
    if (key === "pushEnabled" && value) {
      const ok = await requestBrowserPushPermission();
      if (!ok) return;
    }
    const next = await updateNotificationPrefs(token, { [key]: value });
    setPrefs(next);
  }

  async function openItem(item: InboxItem) {
    const token = getToken();
    if (token && !item.readAt)
      await markInboxRead(token, item.id).catch(() => undefined);
    if (item.href) router.push(item.href);
    else void load();
  }

  return (
    <div className="page-shell py-16 md:py-24">
      <div className="mb-2 font-meta text-xs uppercase tracking-widest text-primary">
        Hesap / Bildirimler
      </div>
      <h1 className="font-display text-4xl">Hesabım</h1>
      <p className="mt-3 font-meta text-xs uppercase text-secondary">
        Bildirimler
      </p>

      <AccountTabs active="bildirimler" />

      {error ? (
        <p className="mt-6 font-meta text-sm uppercase text-error">{error}</p>
      ) : null}

      {prefs ? (
        <section className="mt-10 max-w-xl space-y-3">
          <h2 className="font-display text-2xl">Tercihler</h2>
          {CUSTOMER_TOGGLES.map((row) => (
            <label
              key={row.key}
              className="flex cursor-pointer items-center justify-between gap-4 border border-outline-variant/30 px-4 py-3"
            >
              <span className="font-meta text-xs uppercase">{row.label}</span>
              <input
                type="checkbox"
                checked={Boolean(prefs[row.key])}
                onChange={(e) => void toggle(row.key, e.target.checked)}
              />
            </label>
          ))}
        </section>
      ) : null}

      <section className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl">Gelen kutusu</h2>
          <button
            type="button"
            onClick={() => {
              const token = getToken();
              if (token) void markInboxAllRead(token).then(() => load());
            }}
            className="font-meta text-[11px] uppercase text-primary"
          >
            Tümünü okundu işaretle
          </button>
        </div>
        {!items.length ? (
          <p className="font-meta text-xs uppercase text-secondary">
            Bildirim yok
          </p>
        ) : (
          <ul className="divide-y divide-outline-variant/20 border border-outline-variant/20">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => void openItem(item)}
                  className={`block w-full px-5 py-4 text-left hover:bg-surface-container-low ${
                    item.readAt ? "opacity-60" : ""
                  }`}
                >
                  <p className="text-sm">{item.title}</p>
                  <p className="mt-1 font-meta text-[11px] text-secondary">
                    {item.body}
                  </p>
                  {item.createdAt ? (
                    <p className="mt-1 font-meta text-[10px] uppercase text-secondary">
                      {new Date(item.createdAt).toLocaleString("tr-TR")}
                    </p>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
