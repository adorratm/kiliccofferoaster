import { api, isOnline } from './api';
import type { SyncCollection } from '@kilic/accounting-contracts';

export async function enqueue(
  collection: SyncCollection,
  action: 'upsert' | 'delete',
  payload: Record<string, unknown>,
): Promise<void> {
  const id = (payload.clientId as string) || crypto.randomUUID();
  await window.ops.outboxAdd({
    id,
    collection,
    action,
    payload: JSON.stringify({ ...payload, clientId: id }),
    updated_at: new Date().toISOString(),
  });
}

export async function flushOutbox(): Promise<{ flushed: number; failed: number }> {
  if (!isOnline()) return { flushed: 0, failed: 0 };
  const rows = await window.ops.outboxList();
  if (!rows.length) return { flushed: 0, failed: 0 };
  const mutations = rows.map((row) => ({
    clientId: row.id,
    collection: row.collection,
    action: row.action,
    payload: JSON.parse(row.payload) as Record<string, unknown>,
    updatedAt: row.updated_at,
  }));
  const result = await api<{
    accepted: string[];
    rejected: { clientId: string }[];
  }>('/accounting/sync/push', {
    method: 'POST',
    body: { deviceId: await deviceId(), mutations },
  });
  const done = [...(result.accepted || [])];
  if (done.length) await window.ops.outboxClear(done);
  return { flushed: done.length, failed: result.rejected?.length || 0 };
}

export async function pullAll(): Promise<void> {
  if (!isOnline()) return;
  const since = await window.ops.metaGet('lastPull');
  const data = await api<{
    serverTime: string;
    records: Record<string, unknown[]>;
  }>(`/accounting/sync/pull${since ? `?since=${encodeURIComponent(since)}` : ''}`);
  for (const [collection, rows] of Object.entries(data.records || {})) {
    const existing = (await window.ops.cacheGet(collection)) as { id?: string }[];
    const map = new Map(existing.map((r) => [r.id, r]));
    for (const row of rows) {
      const rec = row as { id?: string };
      if (rec.id) map.set(rec.id, rec);
    }
    await window.ops.cacheSet(collection, [...map.values()]);
  }
  await window.ops.metaSet('lastPull', data.serverTime);
}

async function deviceId(): Promise<string> {
  const existing = await window.ops.metaGet('deviceId');
  if (existing) return existing;
  const id = crypto.randomUUID();
  await window.ops.metaSet('deviceId', id);
  return id;
}

export async function pendingCount(): Promise<number> {
  const rows = await window.ops.outboxList();
  return rows.length;
}
