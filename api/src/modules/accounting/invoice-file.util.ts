import { BadRequestException, Logger } from '@nestjs/common';
import AdmZip from 'adm-zip';
import puppeteer, { type Browser, type PDFOptions } from 'puppeteer';

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

type PdfOptions = {
  /** Yalnızca GİB otomatik gönderimde HTML yedek ek */
  allowHtmlFallback?: boolean;
};

let browserPromise: Promise<Browser> | null = null;

function puppeteerLaunchOptions(): Parameters<typeof puppeteer.launch>[0] {
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH?.trim() ||
    process.env.CHROME_PATH?.trim() ||
    undefined;
  return {
    headless: true,
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=none',
    ],
  };
}

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch(puppeteerLaunchOptions()).catch((err) => {
      browserPromise = null;
      throw err;
    });
  }
  const browser = await browserPromise;
  if (!browser.connected) {
    browserPromise = null;
    return getBrowser();
  }
  return browser;
}

function basename(entryName: string): string {
  return entryName.split('/').pop()?.split('\\').pop() || 'fatura';
}

function isIgnoredZipEntry(name: string): boolean {
  return /^\._|__MACOSX|\.DS_Store/i.test(name);
}

function sniffDocumentKind(
  buffer: Buffer,
  name: string,
  mime: string,
): 'zip' | 'html' | 'xml' | 'pdf' | null {
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b) {
    return 'zip';
  }
  if (buffer.slice(0, 5).toString('ascii') === '%PDF-') return 'pdf';
  const head = buffer.slice(0, 512).toString('utf8').trimStart();
  if (head.startsWith('<?xml') || /<(?:[\w-]+:)?Invoice[\s>]/i.test(head)) {
    return 'xml';
  }
  if (/<!doctype\s+html/i.test(head) || /<html[\s>]/i.test(head)) {
    return 'html';
  }
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'zip' || ZIP_MIME.has(mime)) return 'zip';
  if (ext === 'pdf' || mime === 'application/pdf') return 'pdf';
  if (ext === 'html' || ext === 'htm' || mime === 'text/html') return 'html';
  if (
    ext === 'xml' ||
    mime === 'text/xml' ||
    mime === 'application/xml'
  ) {
    return 'xml';
  }
  return null;
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

/** GİB HTML — harici script ve uzun beklemeleri kaldır. */
export function sanitizeInvoiceHtml(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
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
  const raw = kind === 'xml' ? xmlInvoiceToHtml(content) : content;
  return sanitizeInvoiceHtml(raw);
}

export async function htmlToPdfBuffer(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      const url = req.url();
      if (
        type === 'document' ||
        type === 'stylesheet' ||
        type === 'font' ||
        url.startsWith('data:') ||
        url.startsWith('blob:')
      ) {
        void req.continue();
      } else {
        void req.abort();
      }
    });

    const safeHtml = sanitizeInvoiceHtml(html);
    await page.setContent(safeHtml, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.emulateMediaType('print');

    const pdfOptions: PDFOptions = {
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    };
    const pdf = await page.pdf(pdfOptions);
    const buf = Buffer.from(pdf);
    if (buf.length < 500) {
      throw new Error('PDF çıktısı çok küçük — dönüşüm başarısız olabilir');
    }
    return buf;
  } finally {
    await page.close().catch(() => undefined);
  }
}

async function documentToPdfAttachment(
  content: string,
  baseName: string,
  kind: DocumentKind,
  pdfOptions: PdfOptions = {},
): Promise<InvoiceEmailAttachment> {
  const html = documentToHtml(content, kind);
  const safe = baseName.replace(/[^\w.-]+/g, '_') || 'fatura';
  try {
    const pdf = await htmlToPdfBuffer(html);
    logger.log(`Fatura PDF oluşturuldu: ${safe}.pdf (${pdf.length} bayt)`);
    return {
      filename: `${safe}.pdf`,
      content: pdf,
      contentType: 'application/pdf',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`${kind.toUpperCase()}→PDF başarısız (${safe}): ${message}`);
    if (pdfOptions.allowHtmlFallback) {
      logger.warn('HTML yedek eki kullanılıyor (otomatik GİB gönderimi)');
      return {
        filename: `${safe}.html`,
        content: Buffer.from(html, 'utf-8'),
        contentType: 'text/html',
      };
    }
    throw new BadRequestException(
      `PDF oluşturulamadı: ${message}. Sunucuda Chromium kurulu olduğundan emin olun (Docker imajı güncel mi?).`,
    );
  }
}

export async function prepareInvoiceAttachment(
  file: {
    buffer: Buffer;
    mimetype?: string;
    originalname?: string;
  },
  pdfOptions: PdfOptions = {},
): Promise<PreparedInvoiceAttachment> {
  if (!file?.buffer?.length) {
    throw new BadRequestException('Dosya gerekli');
  }

  const mime = (file.mimetype || '').toLowerCase();
  const name = (file.originalname || 'fatura').trim();
  const kind = sniffDocumentKind(file.buffer, name, mime);

  if (kind === 'zip') {
    const doc = extractDocumentFromZip(file.buffer);
    const base = doc.filename.replace(/\.(html?|xml)$/i, '') || 'fatura';
    return {
      attachment: await documentToPdfAttachment(
        doc.content,
        base,
        doc.kind,
        pdfOptions,
      ),
      suggestedInvoiceNumber:
        guessInvoiceNumber(doc.content, doc.filename, doc.kind) ?? undefined,
    };
  }

  if (kind === 'html') {
    const content = file.buffer.toString('utf-8');
    const base = name.replace(/\.html?$/i, '') || 'fatura';
    return {
      attachment: await documentToPdfAttachment(
        content,
        base,
        'html',
        pdfOptions,
      ),
      suggestedInvoiceNumber:
        guessInvoiceNumber(content, name, 'html') ?? undefined,
    };
  }

  if (kind === 'xml') {
    const content = file.buffer.toString('utf-8');
    const base = name.replace(/\.xml$/i, '') || 'fatura';
    return {
      attachment: await documentToPdfAttachment(
        content,
        base,
        'xml',
        pdfOptions,
      ),
      suggestedInvoiceNumber:
        guessInvoiceNumber(content, name, 'xml') ?? undefined,
    };
  }

  if (kind === 'pdf') {
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
