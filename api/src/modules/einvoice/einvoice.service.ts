import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Invoice } from '@entities/invoice.entity';
import {
  EinvoiceGateway,
  EinvoiceSendResult,
  TaxpayerCheckResult,
} from '@modules/einvoice/einvoice.gateway';
import { MockEinvoiceAdapter } from '@modules/einvoice/mock.adapter';
import { TurkcellEinvoiceAdapter } from '@modules/einvoice/turkcell.adapter';

@Injectable()
export class EinvoiceService extends EinvoiceGateway {
  constructor(
    private readonly config: ConfigService,
    private readonly mock: MockEinvoiceAdapter,
    private readonly turkcell: TurkcellEinvoiceAdapter,
  ) {
    super();
  }

  private get adapter(): EinvoiceGateway {
    const mock =
      this.config.get<boolean>('einvoice.mock') ??
      !this.config.get<string>('einvoice.turkcell.apiKey');
    return mock ? this.mock : this.turkcell;
  }

  sendInvoice(invoice: Invoice): Promise<EinvoiceSendResult> {
    return this.adapter.sendInvoice(invoice);
  }

  checkTaxpayer(vkn: string): Promise<TaxpayerCheckResult> {
    return this.adapter.checkTaxpayer(vkn);
  }

  fetchStatus(ettn: string): Promise<EinvoiceSendResult> {
    return this.adapter.fetchStatus(ettn);
  }

  listInbox(): Promise<Record<string, unknown>[]> {
    return this.adapter.listInbox();
  }
}
