import { Invoice } from '@entities/invoice.entity';

export type EinvoiceSendResult = {
  accepted: boolean;
  ettn?: string | null;
  gibUuid?: string | null;
  providerStatus?: string | null;
  raw?: Record<string, unknown> | null;
  message?: string;
};

export type TaxpayerCheckResult = {
  vkn: string;
  isEinvoice: boolean;
  title?: string | null;
  alias?: string | null;
};

export abstract class EinvoiceGateway {
  abstract sendInvoice(invoice: Invoice): Promise<EinvoiceSendResult>;
  abstract checkTaxpayer(vkn: string): Promise<TaxpayerCheckResult>;
  abstract fetchStatus(ettn: string): Promise<EinvoiceSendResult>;
  abstract listInbox(): Promise<Record<string, unknown>[]>;
}
