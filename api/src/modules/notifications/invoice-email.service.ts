import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Order } from '@entities/order.entity';
import {
  EDocumentType,
  Invoice,
  InvoiceStatus,
} from '@entities/invoice.entity';
import { AccountingSettings } from '@entities/accounting-settings.entity';
import {
  NotificationChannel,
  NotificationLog,
  NotificationStatus,
} from '@entities/notification-log.entity';
import { EmailProvider } from '@modules/notifications/providers/email.provider';
import {
  buildInvoiceSentEmail,
  resolveFrontendUrl,
} from '@modules/notifications/notification.templates';
import { buildInvoicePrintHtml } from '@modules/accounting/invoice-html';
import {
  htmlToPdfBuffer,
  prepareInvoiceAttachment,
  type InvoiceEmailAttachment,
} from '@modules/accounting/invoice-file.util';

export type { InvoiceEmailAttachment };

@Injectable()
export class InvoiceEmailService {
  private readonly logger = new Logger(InvoiceEmailService.name);

  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly email: EmailProvider,
    private readonly config: ConfigService,
  ) {}

  async sendForOrder(input: {
    orderId: string;
    invoiceNumber: string;
    edocumentType: 'earchive' | 'einvoice';
    attachment: InvoiceEmailAttachment;
    recipientEmail?: string;
    invoiceId?: string;
  }): Promise<NotificationLog> {
    const order = await this.em.findOne(Order, {
      where: { id: input.orderId },
      relations: { items: true },
    });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');
    const to = (input.recipientEmail || order.customerEmail || '').trim();
    if (!to) {
      throw new BadRequestException('Siparişte müşteri e-postası yok');
    }
    return this.send({
      order,
      invoiceNumber: input.invoiceNumber.trim(),
      edocumentType: input.edocumentType,
      attachment: input.attachment,
      recipientEmail: to,
      invoiceId: input.invoiceId ?? null,
      source: 'manual',
    });
  }

  async sendForInvoice(
    invoiceId: string,
    attachment: InvoiceEmailAttachment,
    recipientEmail?: string,
  ): Promise<NotificationLog> {
    const invoice = await this.em.findOne(Invoice, {
      where: { id: invoiceId },
      relations: { order: { items: true }, party: true, lines: true },
    });
    if (!invoice) throw new NotFoundException('Fatura bulunamadı');
    if (
      invoice.edocumentType !== EDocumentType.EARCHIVE &&
      invoice.edocumentType !== EDocumentType.EINVOICE
    ) {
      throw new BadRequestException(
        'Yalnızca e-Arşiv veya e-Fatura müşteriye gönderilebilir',
      );
    }
    if (!invoice.order) {
      throw new BadRequestException('Faturada bağlı sipariş yok');
    }
    return this.send({
      order: invoice.order,
      invoiceNumber: invoice.invoiceNumber,
      edocumentType:
        invoice.edocumentType === EDocumentType.EINVOICE
          ? 'einvoice'
          : 'earchive',
      attachment,
      recipientEmail: recipientEmail?.trim() || undefined,
      invoiceId: invoice.id,
      source: 'manual',
    });
  }

  /** GİB gönderimi sonrası — ayar açıksa ve daha önce gönderilmediyse. */
  async tryAutoSendAfterGib(invoiceId: string): Promise<NotificationLog | null> {
    const invoice = await this.em.findOne(Invoice, {
      where: { id: invoiceId },
      relations: { order: { items: true }, party: true, lines: true },
    });
    if (!invoice?.orderId || !invoice.order) return null;
    if (
      invoice.edocumentType !== EDocumentType.EARCHIVE &&
      invoice.edocumentType !== EDocumentType.EINVOICE
    ) {
      return null;
    }
    if (
      invoice.status !== InvoiceStatus.SENT &&
      invoice.status !== InvoiceStatus.ACCEPTED
    ) {
      return null;
    }

    const settings = await this.getSettings();
    if (!settings.autoEmailInvoiceOnGib) return null;

    const already = await this.em
      .createQueryBuilder(NotificationLog, 'n')
      .where('n.order_id = :orderId', { orderId: invoice.orderId })
      .andWhere('n.template = :template', { template: 'invoice_sent' })
      .andWhere('n.status = :status', { status: NotificationStatus.SENT })
      .andWhere(`n.payload->>'invoiceId' = :invoiceId`, {
        invoiceId: invoice.id,
      })
      .getOne();
    if (already) return null;

    const html = buildInvoicePrintHtml({ invoice, settings });
    const safeNo = invoice.invoiceNumber.replace(/[^\w.-]+/g, '_');
    let attachment: InvoiceEmailAttachment;
    try {
      const pdf = await htmlToPdfBuffer(html);
      attachment = {
        filename: `${safeNo}.pdf`,
        content: pdf,
        contentType: 'application/pdf',
      };
    } catch {
      attachment = {
        filename: `${safeNo}.html`,
        content: Buffer.from(html, 'utf-8'),
        contentType: 'text/html',
      };
    }

    try {
      return await this.send({
        order: invoice.order,
        invoiceNumber: invoice.invoiceNumber,
        edocumentType:
          invoice.edocumentType === EDocumentType.EINVOICE
            ? 'einvoice'
            : 'earchive',
        attachment,
        invoiceId: invoice.id,
        source: 'auto_gib',
      });
    } catch (err) {
      this.logger.warn(
        `Auto invoice email failed for ${invoice.invoiceNumber}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return null;
    }
  }

  async prepareAndSendForOrder(input: {
    orderId: string;
    invoiceNumber?: string;
    edocumentType: 'earchive' | 'einvoice';
    file: { buffer: Buffer; mimetype?: string; originalname?: string };
    recipientEmail?: string;
    invoiceId?: string;
  }): Promise<NotificationLog> {
    const prepared = await prepareInvoiceAttachment(input.file);
    const invoiceNumber =
      input.invoiceNumber?.trim() || prepared.suggestedInvoiceNumber;
    if (!invoiceNumber) {
      throw new BadRequestException(
        'Fatura numarası gerekli (ZIP/HTML içinden otomatik bulunamadı)',
      );
    }
    return this.sendForOrder({
      orderId: input.orderId,
      invoiceNumber,
      edocumentType: input.edocumentType,
      attachment: prepared.attachment,
      recipientEmail: input.recipientEmail,
      invoiceId: input.invoiceId,
    });
  }

  async prepareAndSendForInvoice(
    invoiceId: string,
    file: { buffer: Buffer; mimetype?: string; originalname?: string },
    recipientEmail?: string,
  ): Promise<NotificationLog> {
    const prepared = await prepareInvoiceAttachment(file);
    const invoice = await this.em.findOne(Invoice, {
      where: { id: invoiceId },
      relations: { order: { items: true }, party: true, lines: true },
    });
    if (!invoice) throw new NotFoundException('Fatura bulunamadı');
    const invoiceNumber =
      invoice.invoiceNumber || prepared.suggestedInvoiceNumber;
    if (!invoiceNumber) {
      throw new BadRequestException('Fatura numarası belirlenemedi');
    }
    if (!invoice.order) {
      throw new BadRequestException('Faturada bağlı sipariş yok');
    }
    if (
      invoice.edocumentType !== EDocumentType.EARCHIVE &&
      invoice.edocumentType !== EDocumentType.EINVOICE
    ) {
      throw new BadRequestException(
        'Yalnızca e-Arşiv veya e-Fatura müşteriye gönderilebilir',
      );
    }
    return this.send({
      order: invoice.order,
      invoiceNumber,
      edocumentType:
        invoice.edocumentType === EDocumentType.EINVOICE
          ? 'einvoice'
          : 'earchive',
      attachment: prepared.attachment,
      recipientEmail: recipientEmail?.trim() || undefined,
      invoiceId: invoice.id,
      source: 'manual',
    });
  }

  static prepareAttachment(file: {
    buffer: Buffer;
    mimetype?: string;
    originalname?: string;
  }) {
    return prepareInvoiceAttachment(file);
  }

  private async send(input: {
    order: Order;
    invoiceNumber: string;
    edocumentType: 'earchive' | 'einvoice';
    attachment: InvoiceEmailAttachment;
    recipientEmail?: string;
    invoiceId?: string | null;
    source: 'manual' | 'auto_gib';
  }): Promise<NotificationLog> {
    const to = (input.recipientEmail || input.order.customerEmail || '').trim();
    if (!to) {
      throw new BadRequestException('Alıcı e-postası yok');
    }

    const frontendUrl = resolveFrontendUrl(this.config);
    const content = buildInvoiceSentEmail({
      name: input.order.customerName || 'Merhaba',
      orderNumber: input.order.orderNumber,
      invoiceNumber: input.invoiceNumber,
      edocumentType: input.edocumentType,
      ordersUrl: `${frontendUrl}/hesabim`,
    });

    const log = this.em.create(NotificationLog, {
      channel: NotificationChannel.EMAIL,
      recipient: to,
      template: 'invoice_sent',
      orderId: input.order.id,
      shipmentId: null,
      status: NotificationStatus.PENDING,
      payload: {
        invoiceNumber: input.invoiceNumber,
        invoiceId: input.invoiceId ?? null,
        edocumentType: input.edocumentType,
        source: input.source,
        attachmentName: input.attachment.filename,
      },
    });
    await this.em.save(log);

    try {
      const result = await this.email.send({
        to,
        subject: content.subject,
        html: content.html,
        text: content.text,
        attachments: [input.attachment],
      });
      log.status = NotificationStatus.SENT;
      log.providerMessageId = result.id ?? null;
      await this.em.save(log);
      return log;
    } catch (err) {
      log.status = NotificationStatus.FAILED;
      log.errorMessage = err instanceof Error ? err.message : String(err);
      await this.em.save(log);
      throw err;
    }
  }

  private async getSettings(): Promise<AccountingSettings> {
    let row = await this.em.findOne(AccountingSettings, { where: {} });
    if (!row) {
      row = await this.em.save(
        this.em.create(AccountingSettings, {
          companyTitle: 'Kılıç Coffee Roaster',
        }),
      );
    }
    return row;
  }
}
