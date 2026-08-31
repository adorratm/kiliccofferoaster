import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, apiFormData } from '../lib/api';
import {
  asPaged,
  formatMoney,
  inputClass,
  ORDER_STATUS_LABEL,
  ORDER_STATUSES,
} from '../lib/format';

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerEmail: string;
  total: string | number;
  createdAt?: string;
  items?: { productName: string; quantity: number; lineTotal: string | number }[];
};

type LinkedInvoice = {
  id: string;
  invoiceNumber: string;
  edocumentType?: string;
  status: string;
};

export function OrdersPage() {
  const { id: routeId } = useParams<{ id?: string }>();
  const [items, setItems] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [linkedInvoice, setLinkedInvoice] = useState<LinkedInvoice | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [invoiceNumberInput, setInvoiceNumberInput] = useState('');
  const [invoiceDocType, setInvoiceDocType] = useState<'earchive' | 'einvoice'>(
    'earchive',
  );
  const [invoiceEmailBusy, setInvoiceEmailBusy] = useState(false);
  const invoiceFileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const params = new URLSearchParams({ limit: '50', page: '1' });
    if (q.trim()) params.set('q', q.trim());
    if (status) params.set('status', status);
    const data = await api<unknown>(`/orders/admin/all?${params}`);
    setItems(asPaged<Order>(data).items);
  }

  async function open(id: string) {
    const order = await api<Order>(`/orders/${id}`);
    setSelected(order);
    try {
      const inv = await api<{ items: LinkedInvoice[] }>(
        `/accounting/invoices?orderId=${id}&limit=1`,
      );
      setLinkedInvoice(inv.items?.[0] ?? null);
      const row = inv.items?.[0];
      if (row?.invoiceNumber) {
        setInvoiceNumberInput(row.invoiceNumber);
        if (row.edocumentType === 'einvoice') setInvoiceDocType('einvoice');
      }
    } catch {
      setLinkedInvoice(null);
    }
  }

  useEffect(() => {
    void load().catch(() => setError('Siparişler yüklenemedi'));
  }, []);

  useEffect(() => {
    if (routeId) void open(routeId).catch(() => setError('Sipariş yüklenemedi'));
  }, [routeId]);

  async function updateStatus(next: string) {
    if (!selected) return;
    await api(`/orders/${selected.id}/status`, { method: 'PATCH', body: { status: next } });
    await open(selected.id);
    await load();
  }

  async function ensureReceipt() {
    if (!selected) return;
    try {
      const inv = await api<LinkedInvoice>(
        `/accounting/invoices/from-order/${selected.id}`,
        { method: 'POST' },
      );
      setLinkedInvoice(inv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fiş oluşturulamadı');
    }
  }

  async function sendInvoiceEmail() {
    if (!selected) return;
    const file = invoiceFileRef.current?.files?.[0];
    if (!file) {
      setError('GİB ZIP, HTML, XML veya PDF seçin');
      return;
    }
    setInvoiceEmailBusy(true);
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.append('file', file);
      if (invoiceNumberInput.trim()) {
        form.append('invoiceNumber', invoiceNumberInput.trim());
      }
      form.append('edocumentType', invoiceDocType);
      if (linkedInvoice?.id) form.append('invoiceId', linkedInvoice.id);
      await apiFormData(`/orders/${selected.id}/send-invoice-email`, form);
      setMessage(`Fatura e-postası gönderildi: ${selected.customerEmail}`);
      if (invoiceFileRef.current) invoiceFileRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'E-posta gönderilemedi');
    } finally {
      setInvoiceEmailBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-5 gap-6">
      <div className="col-span-3">
        <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">10 // Siparişler</p>
        <h1 className="mt-1 text-2xl font-semibold">Siparişler</h1>
        <div className="mt-4 flex gap-2">
          <input
            placeholder="Ara"
            className={`${inputClass} mt-0`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className={`${inputClass} mt-0 w-48`} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tüm durumlar</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <button className="bg-accent px-4 py-2 text-white" onClick={() => void load()}>
            Filtrele
          </button>
        </div>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        {message ? <p className="mt-2 text-sm text-accent">{message}</p> : null}
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-border-muted text-left text-muted">
              <th className="py-2">No</th>
              <th>Müşteri</th>
              <th>Durum</th>
              <th>Tutar</th>
            </tr>
          </thead>
          <tbody>
            {items.map((o) => (
              <tr
                key={o.id}
                className="cursor-pointer border-b border-border-muted/40 hover:bg-surface"
                onClick={() => void open(o.id)}
              >
                <td className="py-2 mono">{o.orderNumber}</td>
                <td>{o.customerName}</td>
                <td>{ORDER_STATUS_LABEL[o.status] || o.status}</td>
                <td>{formatMoney(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="col-span-2 border border-border-muted bg-surface p-4">
        {!selected ? (
          <p className="text-sm text-muted">Detay için sipariş seçin.</p>
        ) : (
          <>
            <p className="mono text-[10px] uppercase text-muted">{selected.orderNumber}</p>
            <h2 className="mt-1 text-lg font-semibold">{selected.customerName}</h2>
            <p className="text-sm text-muted">{selected.customerEmail}</p>
            <p className="mt-2 text-xl text-accent">{formatMoney(selected.total)}</p>
            <div className="mt-3 border border-border-muted p-3 text-sm">
              <p className="mono text-[10px] uppercase text-muted">Satış fişi</p>
              {linkedInvoice ? (
                <p className="mt-1">
                  <span className="mono">{linkedInvoice.invoiceNumber}</span>
                  <span className="text-muted">
                    {' '}
                    ·{' '}
                    {!linkedInvoice.edocumentType || linkedInvoice.edocumentType === 'none'
                      ? 'Fiş'
                      : linkedInvoice.edocumentType === 'einvoice'
                        ? 'e-Fatura'
                        : 'e-Arşiv'}{' '}
                    · {linkedInvoice.status}
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  className="mt-1 text-accent"
                  onClick={() => void ensureReceipt()}
                >
                  Fiş oluştur
                </button>
              )}
            </div>
            <div className="mt-3 border border-border-muted p-3 text-sm space-y-2">
              <p className="mono text-[10px] uppercase text-muted">
                e-Arşiv müşteriye gönder
              </p>
              <p className="text-xs text-muted">
                GİB ZIP yükleyin — içinden HTML/XML çıkarılıp PDF’e çevrilir. ZIP’ten
              ayırdığınız .html veya .xml dosyasını da yükleyebilirsiniz. Alıcı:{' '}
                {selected.customerEmail}
              </p>
              <input
                className={inputClass}
                placeholder="Fatura no (ZIP’ten otomatik de olabilir)"
                value={invoiceNumberInput}
                onChange={(e) => setInvoiceNumberInput(e.target.value)}
              />
              <select
                className={inputClass}
                value={invoiceDocType}
                onChange={(e) =>
                  setInvoiceDocType(e.target.value as 'earchive' | 'einvoice')
                }
              >
                <option value="earchive">e-Arşiv</option>
                <option value="einvoice">e-Fatura</option>
              </select>
              <input
                ref={invoiceFileRef}
                type="file"
                accept=".zip,.pdf,.html,.htm,.xml,application/zip,application/pdf,text/html,text/xml,application/xml"
                className="block w-full text-xs"
              />
              <button
                type="button"
                disabled={invoiceEmailBusy}
                className="bg-accent px-3 py-2 text-sm text-white disabled:opacity-50"
                onClick={() => void sendInvoiceEmail()}
              >
                {invoiceEmailBusy ? 'Gönderiliyor…' : 'Faturayı e-posta ile gönder'}
              </button>
            </div>
            <select
              className={inputClass}
              value={selected.status}
              onChange={(e) => void updateStatus(e.target.value)}
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <ul className="mt-4 space-y-2 text-sm">
              {(selected.items || []).map((item, i) => (
                <li key={i} className="flex justify-between border-b border-border-muted/40 pb-1">
                  <span>
                    {item.productName} × {item.quantity}
                  </span>
                  <span>{formatMoney(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
