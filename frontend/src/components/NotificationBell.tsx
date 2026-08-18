"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchInbox,
  fetchNotificationPrefs,
  fetchUnreadCount,
  markInboxAllRead,
  markInboxRead,
  type InboxItem,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  connectNotifySocket,
  requestBrowserPushPermission,
  showBrowserNotification,
} from "@/lib/inbox";

export function NotificationBell({
  listHref = "/hesabim/bildirimler",
}: {
  listHref?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<InboxItem[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    function load() {
      const t = getToken();
      if (!t) return;
      void fetchUnreadCount(t)
        .then((r) => setUnread(r.count))
        .catch(() => undefined);
      void fetchInbox(t, 1)
        .then((r) => setItems(r.items.slice(0, 8)))
        .catch(() => undefined);
    }

    load();
    const poll = setInterval(load, 40000);
    void fetchNotificationPrefs(token)
      .then((p) => {
        if (p.pushEnabled) return requestBrowserPushPermission();
      })
      .catch(() => undefined);
    const socket = connectNotifySocket(token);
    socket.on("notify:new", (row: InboxItem) => {
      setItems((prev) => [row, ...prev].slice(0, 8));
      setUnread((n) => n + 1);
      void fetchNotificationPrefs(token)
        .then((p) => {
          if (p.pushEnabled) showBrowserNotification(row);
        })
        .catch(() => undefined);
    });
    return () => {
      clearInterval(poll);
      socket.disconnect();
    };
  }, []);

  async function openItem(item: InboxItem) {
    const token = getToken();
    if (token && !item.readAt) {
      await markInboxRead(token, item.id).catch(() => undefined);
      setUnread((n) => Math.max(0, n - 1));
      setItems((prev) =>
        prev.map((r) =>
          r.id === item.id ? { ...r, readAt: new Date().toISOString() } : r,
        ),
      );
    }
    setOpen(false);
    if (item.href) router.push(item.href);
  }

  async function readAll() {
    const token = getToken();
    if (!token) return;
    await markInboxAllRead(token).catch(() => undefined);
    setUnread(0);
    setItems((prev) =>
      prev.map((r) => ({ ...r, readAt: r.readAt || new Date().toISOString() })),
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative text-primary transition-opacity hover:opacity-80"
        aria-label="Bildirimler"
      >
        <BellIcon />
        {unread > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 min-w-4 bg-cta px-1 text-center text-[9px] text-on-cta">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-70 mt-3 w-[min(100vw-2rem,20rem)] border border-outline-variant/40 bg-surface-container-lowest p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-meta text-[10px] uppercase tracking-widest text-secondary">
              Bildirimler
            </p>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => void readAll()}
                className="font-meta text-[10px] uppercase text-primary"
              >
                Tümünü oku
              </button>
            ) : null}
          </div>
          {!items.length ? (
            <p className="py-4 font-meta text-[11px] uppercase text-secondary">
              Bildirim yok
            </p>
          ) : (
            <ul className="max-h-80 space-y-1 overflow-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => void openItem(item)}
                    className={`block w-full px-2 py-2 text-left hover:bg-surface-container ${
                      item.readAt ? "opacity-60" : ""
                    }`}
                  >
                    <p className="text-sm text-on-surface">{item.title}</p>
                    <p className="font-meta text-[11px] text-secondary">{item.body}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={listHref}
            onClick={() => setOpen(false)}
            className="mt-2 block border-t border-outline-variant/30 pt-2 text-center font-meta text-[10px] uppercase tracking-widest text-primary"
          >
            Tümü ve ayarlar
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M10 20a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
