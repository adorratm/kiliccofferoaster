"use client";

import { io, type Socket } from "socket.io-client";
import { API_BASE } from "@/lib/api";
import type { InboxItem } from "@/lib/api";

export function connectNotifySocket(token: string): Socket {
  return io(`${API_BASE}/notify`, {
    auth: { token },
    // Prod: nginx/CF WS upgrade henüz güvenilir değil — polling yeterli
    transports: ["polling"],
    upgrade: false,
    reconnection: true,
    reconnectionAttempts: 8,
  });
}

export function showBrowserNotification(item: InboxItem) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const n = new Notification(item.title, { body: item.body });
  n.onclick = () => {
    window.focus();
    if (item.href) window.location.href = item.href;
  };
}

export async function requestBrowserPushPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  return (await Notification.requestPermission()) === "granted";
}
