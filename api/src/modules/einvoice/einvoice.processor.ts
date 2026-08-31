import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Job } from 'bullmq';
import { Invoice, InvoiceStatus } from '@entities/invoice.entity';
import { EinvoiceService } from '@modules/einvoice/einvoice.service';
import { InvoiceEmailService } from '@modules/notifications/invoice-email.service';
import { QUEUE_EINVOICE } from '@modules/queues/queue.constants';

@Processor(QUEUE_EINVOICE)
export class EinvoiceProcessor extends WorkerHost {
  private readonly logger = new Logger(EinvoiceProcessor.name);

  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly einvoice: EinvoiceService,
    private readonly invoiceEmail: InvoiceEmailService,
  ) {
    super();
  }

  async process(_job: Job): Promise<void> {
    const queued = await this.em.find(Invoice, {
      where: { status: InvoiceStatus.QUEUED },
      relations: { party: true, lines: true },
    });
    for (const invoice of queued) {
      try {
        const result = await this.einvoice.sendInvoice(invoice);
        invoice.status = result.accepted
          ? InvoiceStatus.SENT
          : InvoiceStatus.REJECTED;
        invoice.ettn = result.ettn || invoice.ettn;
        invoice.gibUuid = result.gibUuid || invoice.gibUuid;
        invoice.providerStatus = result.providerStatus || invoice.providerStatus;
        invoice.providerPayload = result.raw || invoice.providerPayload;
        if (result.accepted) invoice.sentAt = new Date();
        await this.em.save(invoice);
        if (result.accepted) {
          await this.invoiceEmail.tryAutoSendAfterGib(invoice.id);
        }
      } catch (err) {
        this.logger.warn(
          `Queued invoice ${invoice.invoiceNumber}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    const sent = await this.em.find(Invoice, {
      where: { status: InvoiceStatus.SENT },
    });
    for (const invoice of sent) {
      if (!invoice.ettn) continue;
      try {
        const result = await this.einvoice.fetchStatus(invoice.ettn);
        if (result.accepted && /accept/i.test(result.providerStatus || '')) {
          invoice.status = InvoiceStatus.ACCEPTED;
        }
        invoice.providerStatus = result.providerStatus || invoice.providerStatus;
        await this.em.save(invoice);
      } catch {
        // polling hatası kuyruğu durdurmasın
      }
    }
  }
}
