import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { Invoice } from '@entities/invoice.entity';
import { EDocumentType } from '@entities/invoice.entity';
import {
  EinvoiceGateway,
  EinvoiceSendResult,
  TaxpayerCheckResult,
} from '@modules/einvoice/einvoice.gateway';

/**
 * Turkcell e-Şirket REST adapter.
 * Uç noktalar env ile override edilir; anahtar yoksa çağıran mock'a düşer.
 * @see https://developer.turkcellesirket.com/pages/overview.html
 */
@Injectable()
export class TurkcellEinvoiceAdapter extends EinvoiceGateway {
  private readonly logger = new Logger(TurkcellEinvoiceAdapter.name);
  private readonly http: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    super();
    const baseURL =
      this.config.get<string>('einvoice.turkcell.baseUrl') ||
      'https://api.turkcellesirket.com';
    const apiKey = this.config.get<string>('einvoice.turkcell.apiKey') || '';
    this.http = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
      },
    });
  }

  async sendInvoice(invoice: Invoice): Promise<EinvoiceSendResult> {
    const profile =
      invoice.edocumentType === EDocumentType.EINVOICE ? 'TEMELFATURA' : 'EARSIVFATURA';
    const body = {
      generalInfoModel: {
        invoiceProfileType:
          invoice.edocumentType === EDocumentType.EINVOICE ? 'eFatura' : 'eArsiv',
        prefix:
          invoice.edocumentType === EDocumentType.EINVOICE ? 'INV' : 'ARC',
        issueDate: invoice.issueDate,
        currency: invoice.currency,
        invoiceNumber: invoice.invoiceNumber,
      },
      currentAccountIdentifier: invoice.party?.taxNumber || '',
      currentAccountName: invoice.party?.title || '',
      lines: (invoice.lines || []).map((line) => ({
        name: line.description,
        quantity: Number(line.quantity),
        unitCode: line.unit,
        unitPrice: Number(line.unitPrice),
        vatRate: Number(line.vatRate),
        lineTotal: Number(line.lineTotal),
      })),
      totals: {
        subtotal: Number(invoice.subtotal),
        vat: Number(invoice.taxAmount),
        total: Number(invoice.total),
      },
      profile,
    };

    try {
      const { data } = await this.http.post('/v1/outgoing-invoices', body);
      const payload = (data ?? {}) as Record<string, unknown>;
      return {
        accepted: true,
        ettn: String(payload.ettn || payload.uuid || payload.id || ''),
        gibUuid: payload.uuid ? String(payload.uuid) : null,
        providerStatus: String(payload.status || 'sent'),
        raw: payload,
      };
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data
          ? JSON.stringify(err.response.data)
          : err.message
        : err instanceof Error
          ? err.message
          : String(err);
      this.logger.error(`Turkcell send failed: ${message}`);
      return {
        accepted: false,
        providerStatus: 'error',
        raw: { error: message },
        message,
      };
    }
  }

  async checkTaxpayer(vkn: string): Promise<TaxpayerCheckResult> {
    const trimmed = (vkn || '').replace(/\D/g, '');
    if (!trimmed) {
      return { vkn: '', isEinvoice: false };
    }
    try {
      const { data } = await this.http.get(`/v1/taxpayers/${trimmed}`);
      const payload = (data ?? {}) as Record<string, unknown>;
      return {
        vkn: trimmed,
        isEinvoice: Boolean(payload.isEinvoice ?? payload.eInvoice),
        title: payload.title ? String(payload.title) : null,
        alias: payload.alias ? String(payload.alias) : null,
      };
    } catch (err) {
      this.logger.warn(
        `Turkcell taxpayer check failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return { vkn: trimmed, isEinvoice: trimmed.length === 10 };
    }
  }

  async fetchStatus(ettn: string): Promise<EinvoiceSendResult> {
    try {
      const { data } = await this.http.get(`/v1/outgoing-invoices/${ettn}`);
      const payload = (data ?? {}) as Record<string, unknown>;
      const status = String(payload.status || '');
      return {
        accepted: /accept|success|sent/i.test(status),
        ettn,
        gibUuid: payload.uuid ? String(payload.uuid) : null,
        providerStatus: status,
        raw: payload,
      };
    } catch (err) {
      return {
        accepted: false,
        ettn,
        providerStatus: 'error',
        raw: {
          error: err instanceof Error ? err.message : String(err),
        },
      };
    }
  }

  async listInbox(): Promise<Record<string, unknown>[]> {
    try {
      const { data } = await this.http.get('/v1/incoming-invoices');
      if (Array.isArray(data)) return data as Record<string, unknown>[];
      if (data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)) {
        return (data as { data: Record<string, unknown>[] }).data;
      }
      return [];
    } catch (err) {
      this.logger.warn(
        `Turkcell inbox failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return [];
    }
  }
}
