import { EDocumentType, Invoice } from '@entities/invoice.entity';
import { AccountingSettings } from '@entities/accounting-settings.entity';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function invoiceDocumentLabel(invoice: Invoice): string {
  if (invoice.edocumentType === EDocumentType.NONE) return 'Satış Fişi';
  if (invoice.edocumentType === EDocumentType.EINVOICE) return 'e-Fatura';
  return 'e-Arşiv Fatura';
}

export function buildInvoicePrintHtml(input: {
  invoice: Invoice;
  settings: AccountingSettings;
}): string {
  const { invoice, settings } = input;
  const isReceipt = invoice.edocumentType === EDocumentType.NONE;
  const docLabel = invoiceDocumentLabel(invoice);
  const lines = (invoice.lines || [])
    .map(
      (l) =>
        `<tr><td>${escapeHtml(l.description)}</td><td>${l.quantity}</td><td>${l.unitPrice}</td><td>${l.vatRate}%</td><td>${l.lineTotal}</td></tr>`,
    )
    .join('');

  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"/><title>${escapeHtml(invoice.invoiceNumber)}</title>
<style>
body{font-family:Inter,system-ui,sans-serif;background:#131313;color:#e5e2e1;padding:32px}
h1{letter-spacing:.08em;text-transform:uppercase;font-size:18px}
table{width:100%;border-collapse:collapse;margin-top:24px}
td,th{border:1px solid #57423d;padding:8px;text-align:left;font-size:13px}
.meta{color:#a58b84;font-size:12px;letter-spacing:.12em;text-transform:uppercase}
.accent{color:#cc5b3e}
</style></head><body>
<p class="meta">Kılıç Coffee Roaster // ${escapeHtml(docLabel)}</p>
<h1>${escapeHtml(settings.companyTitle)}</h1>
<p>${escapeHtml(invoice.invoiceNumber)} · ${invoice.issueDate} · <span class="accent">${escapeHtml(docLabel)}</span></p>
<p>Cari: ${escapeHtml(invoice.party?.title || '—')} ${invoice.party?.taxNumber || ''}</p>
<table><thead><tr><th>Açıklama</th><th>Miktar</th><th>Birim</th><th>KDV</th><th>Toplam</th></tr></thead>
<tbody>${lines}</tbody></table>
<p>Ara ${invoice.subtotal} · KDV ${invoice.taxAmount} · <strong>Genel ${invoice.total} ${invoice.currency}</strong></p>
<p class="meta">${isReceipt ? 'İç satış fişi · GİB gönderimi yok' : `GİB durumu: ${invoice.status}`}</p>
</body></html>`;
}
