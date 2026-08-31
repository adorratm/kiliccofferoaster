'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Settings = {
  companyTitle: string;
  vkn?: string | null;
  taxOffice?: string | null;
  address?: string | null;
  city?: string | null;
  earchivePrefix: string;
  einvoicePrefix: string;
  autoEmailInvoiceOnGib?: boolean;
};

const FIELDS: {
  key: Exclude<keyof Settings, 'autoEmailInvoiceOnGib'>;
  label: string;
  required?: boolean;
}[] = [
  { key: 'companyTitle', label: 'Unvan', required: true },
  { key: 'vkn', label: 'VKN' },
  { key: 'taxOffice', label: 'Vergi dairesi' },
  { key: 'address', label: 'Adres' },
  { key: 'city', label: 'Şehir' },
  { key: 'earchivePrefix', label: 'e-Arşiv ön ek' },
  { key: 'einvoicePrefix', label: 'e-Fatura ön ek' },
];

export default function AccountingSettingsPage() {
  const [form, setForm] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void api<Settings>('/accounting/settings')
      .then(setForm)
      .catch(() =>
        setForm({
          companyTitle: '',
          earchivePrefix: '',
          einvoicePrefix: '',
        }),
      );
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const saved = await api<Settings>('/accounting/settings', {
        method: 'PATCH',
        body: {
          companyTitle: form.companyTitle,
          vkn: form.vkn || null,
          taxOffice: form.taxOffice || null,
          address: form.address || null,
          city: form.city || null,
          earchivePrefix: form.earchivePrefix,
          einvoicePrefix: form.einvoicePrefix,
          autoEmailInvoiceOnGib: Boolean(form.autoEmailInvoiceOnGib),
        },
      });
      setForm(saved);
      setMessage('Muhasebe ayarları kaydedildi');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  }

  if (!form) return <p className="text-sm text-muted">Yükleniyor…</p>;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Muhasebe ayarları</h2>
        <p className="text-sm text-muted">
          Firma bilgileri ve e-belge ön ekleri (GİB).
        </p>
      </div>

      {error ? (
        <p className="border border-danger/40 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="border border-accent/40 px-3 py-2 text-sm text-accent">
          {message}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-3 border border-border-muted p-4">
        {FIELDS.map(({ key, label, required }) => (
          <label key={key} className="block text-sm">
            <span className="mono text-[10px] uppercase text-muted">{label}</span>
            <input
              required={required}
              value={form[key] ?? ''}
              onChange={(e) =>
                setForm((f) => (f ? { ...f, [key]: e.target.value } : f))
              }
              className="mt-1 w-full border border-border-muted bg-background px-3 py-2"
            />
          </label>
        ))}
        <label className="flex items-start gap-3 border border-border-muted px-3 py-3 text-sm">
          <input
            type="checkbox"
            checked={Boolean(form.autoEmailInvoiceOnGib)}
            onChange={(e) =>
              setForm((f) =>
                f ? { ...f, autoEmailInvoiceOnGib: e.target.checked } : f,
              )
            }
            className="mt-1"
          />
          <span>
            <span className="font-medium">GİB sonrası otomatik müşteri e-postası</span>
            <span className="mt-1 block text-xs text-muted">
              Sistemden GİB’e başarıyla gönderilen e-Arşiv/e-Fatura için müşteriye
              markalı e-posta gider (HTML ek). Kapalıyken yalnızca sipariş sayfasından
              manuel gönderim yapılır.
            </span>
          </span>
        </label>
        <button
          type="submit"
          disabled={saving}
          className="btn-motion bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </form>
    </div>
  );
}
