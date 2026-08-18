import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Invoice } from '@entities/invoice.entity';
import {
  EinvoiceGateway,
  EinvoiceSendResult,
  TaxpayerCheckResult,
} from '@modules/einvoice/einvoice.gateway';

@Injectable()
export class MockEinvoiceAdapter extends EinvoiceGateway {
  private readonly logger = new Logger(MockEinvoiceAdapter.name);

  async sendInvoice(invoice: Invoice): Promise<EinvoiceSendResult> {
    const ettn = randomUUID();
    this.logger.warn(
      `Mock e-belge gönderimi: ${invoice.invoiceNumber} → ${ettn}`,
    );
    return {
      accepted: true,
      ettn,
      gibUuid: ettn,
      providerStatus: 'mock_sent',
      raw: { mock: true, invoiceNumber: invoice.invoiceNumber },
      message: 'Mock: GİB’e gitmedi, yerel kabul',
    };
  }

  async checkTaxpayer(vkn: string): Promise<TaxpayerCheckResult> {
    const trimmed = (vkn || '').replace(/\D/g, '');
    return {
      vkn: trimmed,
      isEinvoice: trimmed.length === 10,
      title: null,
      alias: null,
    };
  }

  async fetchStatus(ettn: string): Promise<EinvoiceSendResult> {
    return {
      accepted: true,
      ettn,
      gibUuid: ettn,
      providerStatus: 'mock_accepted',
      raw: { mock: true },
    };
  }

  async listInbox(): Promise<Record<string, unknown>[]> {
    return [];
  }
}
