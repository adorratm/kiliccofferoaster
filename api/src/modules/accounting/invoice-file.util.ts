import { BadRequestException, Logger } from '@nestjs/common';
import AdmZip from 'adm-zip';
import puppeteer from 'puppeteer';

export type InvoiceEmailAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
};

const logger = new Logger('InvoiceFileUtil');

const ZIP_MIME = new Set([
  'application/zip',
  'application/x-zip-compressed',
  'multipart/x-zip',
]);

export type PreparedInvoiceAttachment = {
  attachment: InvoiceEmailAttachment;
  suggestedInvoiceNumber?: string;
};

type DocumentKind = 'html' | 'xml';

function basename(entryName: string): string {
  return entryName.split('/').pop()?.split('\\').pop() || 'fatura';
}

function isIgnoredZipEntry(name: string): boolean {
  return /^\._|__MACOSX|\.DS_Store/i.test(name);
}

/** ZIP: önce HTML, yoksa XML. */
export function extractDocumentFromZip(buffer: Buffer): {
  content: string;
  filename: string;
  kind: DocumentKind;
} {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries().filter((e) => !e.isDirectory);

  const htmlEntries = entries.filter(
    (e) => /\.html?$/i.test(e.entryName) && !isIgnoredZipEntry(e.entryName),
  );
  const xmlEntries = entries.filter(
    (e) => /\.xml$/i.test(e.entryName) && !isIgnoredZipEntry(e.entryName),
  );

  const pick = (list: AdmZip.IZipEntry[]) => list[0];

  const htmlEntry = pick(htmlEntries);
  if (htmlEntry) {
    return {
      content: htmlEntry.getData().toString('utf8'),
      filename: basename(htmlEntry.entryName),
      kind: 'html',
    };
  }

  const xmlEntry = pick(xmlEntries);
  if (xmlEntry) {
    return {
      content: xmlEntry.getData().toString('utf8'),
      filename: basename(xmlEntry.entryName),
      kind: 'xml',
    };
  }

  throw new BadRequestException('ZIP içinde HTML veya XML dosyası bulunamadı');
}

/** @deprecated extractDocumentFromZip kullanın */
export function extractHtmlFromZip(buffer: Buffer): {
  html: string;
  filename: string;
} {
  const doc = extractDocumentFromZip(buffer);
  if (doc.kind !== 'html') {
    throw new BadRequestException('ZIP içinde HTML dosyası bulunamadı');
  }
  return { html: doc.content, filename: doc.filename };
}

function xmlTagAll(xml: string, tag: string): string[] {
  const re = new RegExp(
    `<(?:[\\w-]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${tag}>`,
    'gi',
  );
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const val = m[1]?.replace(/<[^>]+>/g, '').trim();
    if (val) out.push(val);
  }
  return out;
}

function xmlTagFirst(xml: string, tag: string): string | null {
  return xmlTagAll(xml, tag)[0] ?? null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** GİB UBL-TR XML → yazdırılabilir HTML */
export function xmlInvoiceToHtml(xml: string): string {
  const invoiceNumber = xmlTagFirst(xml, 'ID') || '—';
  const issueDate = xmlTagFirst(xml, 'IssueDate') || '—';
  const currency = xmlTagFirst(xml, 'DocumentCurrencyCode') || 'TRY';

  const supplierNames = xmlTagAll(xml, 'Name');
  const supplier = supplierNames[0] || '—';
  const customer = supplierNames[1] || '—';

  const lineBlocks = xml.match(
    /<(?:[\w-]+:)?InvoiceLine[\s\S]*?<\/(?:[\w-]+:)?InvoiceLine>/gi,
  ) || [];

  const rows = lineBlocks.length
    ? lineBlocks
        .map((block) => {
          const qty = xmlTagFirst(block, 'InvoicedQuantity') || '1';
          const unit = xmlTagFirst(block, 'PriceAmount') || '—';
          const total = xmlTagFirst(block, 'LineExtensionAmount') || '—';
          const name = xmlTagFirst(block, 'Name') || 'Kalem';
          return `<tr>
            <td>${escapeHtml(name)}</td>
            <td>${escapeHtml(qty)}</td>
            <td>${escapeHtml(unit)} ${escapeHtml(currency)}</td>
            <td>${escapeHtml(total)} ${escapeHtml(currency)}</td>
          </tr>`;
        })
        .join('')
    : `<tr><td colspan="4">Kalem bilgisi XML içinde bulunamadı</td></tr>`;

  const tax = xmlTagFirst(xml, 'TaxAmount') || '—';
  const subtotal = xmlTagFirst(xml, 'LineExtensionAmount') || '—';
  const total =
    xmlTagFirst(xml, 'PayableAmount') ||
    xmlTagFirst(xml, 'TaxInclusiveAmount') ||
    '—';

  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"/>
<title>${escapeHtml(invoiceNumber)}</title>
<style>
body{font-family:Inter,system-ui,sans-serif;background:#fff;color:#1a1410;padding:32px}
h1{font-size:18px;letter-spacing:.08em;text-transform:uppercase}
table{width:100%;border-collapse:collapse;margin-top:20px}
td,th{border:1px solid #ccc;padding:8px;font-size:13px;text-align:left}
.meta{color:#666;font-size:12px;text-transform:uppercase;letter-spacing:.1em}
</style></head><body>
<p class="meta">Kılıç Coffee Roaster // e-Arşiv (XML)</p>
<h1>${escapeHtml(invoiceNumber)}</h1>
<p>Tarih: ${escapeHtml(issueDate)} · ${escapeHtml(currency)}</p>
<p><strong>Satıcı:</strong> ${escapeHtml(supplier)}</p>
<p><strong>Alıcı:</strong> ${escapeHtml(customer)}</p>
<table>
<thead><tr><th>Açıklama</th><th>Miktar</th><th>Birim fiyat</th><th>Toplam</th></tr></thead>
<tbody>${rows}</tbody>
</table>
<p>Ara toplam: ${escapeHtml(subtotal)} ${escapeHtml(currency)} · KDV: ${escapeHtml(tax)} ${escapeHtml(currency)}</p>
<p><strong>Genel toplam: ${escapeHtml(total)} ${escapeHtml(currency)}</strong></p>
</body></html>`;
}

export function guessInvoiceNumber(
  content: string,
  filename: string,
  kind: DocumentKind = 'html',
): string | null {
  const base = filename.replace(/\.(html?|xml)$/i, '').trim();
  if (/^[A-Z]{2,4}\d{4,}/i.test(base)) return base.toUpperCase();
  if (/^[A-Z0-9][A-Z0-9-]{7,}$/i.test(base)) return base.toUpperCase();

  if (kind === 'xml') {
    const xmlId = xmlTagFirst(content, 'ID');
    if (xmlId) return xmlId.toUpperCase();
  }

  const patterns = [
    /Fatura\s*(?:No|Numarası)?[:\s]*([A-Z0-9-]+)/i,
    /Belge\s*(?:No|Numarası)?[:\s]*([A-Z0-9-]+)/i,
    /e-?Arşiv[^<]{0,40}?([A-Z]{2,4}\d{13,})/i,
    /"invoiceNumber"\s*:\s*"([^"]+)"/i,
  ];
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim().toUpperCase();
  }
  return null;
}

function documentToHtml(content: string, kind: DocumentKind): string {
  return kind === 'xml' ? xmlInvoiceToHtml(content) : content;
}

export async function htmlToPdfBuffer(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: 'load',
      timeout: 45_000,
    });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

async function documentToPdfAttachment(
  content: string,
  baseName: string,
  kind: DocumentKind,
): Promise<InvoiceEmailAttachment> {
  const html = documentToHtml(content, kind);
  const safe = baseName.replace(/[^\w.-]+/g, '_') || 'fatura';
  try {
    const pdf = await htmlToPdfBuffer(html);
    return {
      filename: `${safe}.pdf`,
      content: pdf,
      contentType: 'application/pdf',
    };
  } catch (err) {
    logger.warn(
      `${kind.toUpperCase()}→PDF dönüşümü başarısız, HTML ek olarak gönderilecek: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return {
      filename: `${safe}.html`,
      content: Buffer.from(html, 'utf-8'),
      contentType: 'text/html',
    };
  }
}

export async function prepareInvoiceAttachment(file: {
  buffer: Buffer;
  mimetype?: string;
  originalname?: string;
}): Promise<PreparedInvoiceAttachment> {
  if (!file?.buffer?.length) {
    throw new BadRequestException('Dosya gerekli');
  }

  const mime = (file.mimetype || '').toLowerCase();
  const name = (file.originalname || 'fatura').trim();
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const isZip = ext === 'zip' || ZIP_MIME.has(mime);

  if (isZip) {
    const doc = extractDocumentFromZip(file.buffer);
    const base =
      doc.filename.replace(/\.(html?|xml)$/i, '') || 'fatura';
    return {
      attachment: await documentToPdfAttachment(doc.content, base, doc.kind),
      suggestedInvoiceNumber:
        guessInvoiceNumber(doc.content, doc.filename, doc.kind) ?? undefined,
    };
  }

  if (ext === 'html' || ext === 'htm' || mime === 'text/html') {
    const content = file.buffer.toString('utf-8');
    const base = name.replace(/\.html?$/i, '') || 'fatura';
    return {
      attachment: await documentToPdfAttachment(content, base, 'html'),
      suggestedInvoiceNumber:
        guessInvoiceNumber(content, name, 'html') ?? undefined,
    };
  }

  if (
    ext === 'xml' ||
    mime === 'text/xml' ||
    mime === 'application/xml'
  ) {
    const content = file.buffer.toString('utf-8');
    const base = name.replace(/\.xml$/i, '') || 'fatura';
    return {
      attachment: await documentToPdfAttachment(content, base, 'xml'),
      suggestedInvoiceNumber:
        guessInvoiceNumber(content, name, 'xml') ?? undefined,
    };
  }

  if (ext === 'pdf' || mime === 'application/pdf') {
    return {
      attachment: {
        filename: name.includes('.') ? name : `${name}.pdf`,
        content: file.buffer,
        contentType: 'application/pdf',
      },
    };
  }

  throw new BadRequestException(
    'GİB ZIP, HTML, XML veya PDF yükleyin (.zip, .html, .xml, .pdf)',
  );
}
