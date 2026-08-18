import { api } from './api';
import { clearOutbox, enqueue, listOutbox, pendingCount } from './db';

export { enqueue, pendingCount };

export async function flushOutbox(): Promise<number> {
  const rows = await listOutbox();
  if (!rows.length) return 0;
  const mutations = rows.map((row) => ({
    clientId: row.id,
    collection: row.collection,
    action: row.action,
    payload: JSON.parse(row.payload) as Record<string, unknown>,
    updatedAt: row.updated_at,
  }));
  const result = await api<{ accepted: string[] }>('/accounting/sync/push', {
    method: 'POST',
    body: { deviceId: 'mobile', mutations },
  });
  if (result.accepted?.length) await clearOutbox(result.accepted);
  return result.accepted?.length || 0;
}
