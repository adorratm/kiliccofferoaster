import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Party } from '@entities/party.entity';
import { Invoice } from '@entities/invoice.entity';
import { CashAccount } from '@entities/cash-account.entity';
import { CashEntry } from '@entities/cash-entry.entity';
import { StockMovement } from '@entities/stock-movement.entity';
import { OkcSale } from '@entities/okc-sale.entity';
import {
  SyncPullDto,
  SyncPushDto,
} from '@modules/accounting/dto/accounting.dto';
import { PartiesService } from '@modules/accounting/parties.service';
import { InvoicesService } from '@modules/accounting/invoices.service';
import { CashService } from '@modules/accounting/cash.service';
import { StockLedgerService } from '@modules/accounting/stock-ledger.service';
import { OkcImportService } from '@modules/accounting/okc-import.service';
import { CreateInvoiceDto, CreatePartyDto } from '@modules/accounting/dto/accounting.dto';
import { PartyType } from '@entities/party.entity';
import { InvoiceDirection } from '@entities/invoice.entity';
import { CashAccountKind } from '@entities/cash-account.entity';
import { CashEntryType } from '@entities/cash-entry.entity';
import { StockMovementType } from '@entities/stock-movement.entity';

@Injectable()
export class SyncService {
  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly parties: PartiesService,
    private readonly invoices: InvoicesService,
    private readonly cash: CashService,
    private readonly stock: StockLedgerService,
    private readonly okc: OkcImportService,
  ) {}

  async push(dto: SyncPushDto) {
    const accepted: string[] = [];
    const conflicts: { clientId: string; reason: string }[] = [];
    const rejected: { clientId: string; reason: string }[] = [];

    for (const mutation of dto.mutations) {
      try {
        if (mutation.action === 'delete') {
          await this.deleteMutation(mutation.collection, mutation.payload);
          accepted.push(mutation.clientId);
          continue;
        }
        await this.upsertMutation(mutation.collection, mutation.payload);
        accepted.push(mutation.clientId);
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        if (reason.includes('çakışma') || reason.includes('conflict')) {
          conflicts.push({ clientId: mutation.clientId, reason });
        } else {
          rejected.push({ clientId: mutation.clientId, reason });
        }
      }
    }

    return { accepted, conflicts, rejected, serverTime: new Date().toISOString() };
  }

  async pull(query: SyncPullDto) {
    const since = query.since ? new Date(query.since) : new Date(0);

    const newer = <T extends { updatedAt: Date }>(rows: T[]) =>
      rows.filter((r) => r.updatedAt > since);

    const [parties, invoices, cashAccounts, cashEntries, stockMovements, okcSales] =
      await Promise.all([
        this.em.find(Party),
        this.em.find(Invoice, { relations: { lines: true, party: true } }),
        this.em.find(CashAccount),
        this.em.find(CashEntry),
        this.em.find(StockMovement),
        this.em.find(OkcSale),
      ]);

    return {
      serverTime: new Date().toISOString(),
      records: {
        parties: newer(parties),
        invoices: newer(invoices),
        cash_accounts: newer(cashAccounts),
        cash_entries: newer(cashEntries),
        stock_movements: newer(stockMovements),
        okc_sales: newer(okcSales),
      },
    };
  }

  private async upsertMutation(
    collection: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const clientId = typeof payload.clientId === 'string' ? payload.clientId : undefined;
    switch (collection) {
      case 'parties': {
        const existing = clientId
          ? await this.em.findOne(Party, { where: { clientId } })
          : null;
        const dto = payload as unknown as CreatePartyDto;
        if (existing) {
          await this.parties.update(existing.id, dto);
        } else {
          await this.parties.create({
            ...dto,
            type: (dto.type as PartyType) || PartyType.CUSTOMER,
            title: dto.title || 'Cari',
            clientId,
          });
        }
        return;
      }
      case 'invoices': {
        const existing = clientId
          ? await this.em.findOne(Invoice, { where: { clientId } })
          : null;
        const dto = payload as unknown as CreateInvoiceDto;
        if (existing) {
          await this.invoices.update(existing.id, dto);
        } else {
          await this.invoices.create({
            ...dto,
            direction: dto.direction || InvoiceDirection.SALES,
            issueDate:
              dto.issueDate || new Date().toISOString().slice(0, 10),
            lines: dto.lines || [],
            clientId,
          });
        }
        return;
      }
      case 'cash_accounts': {
        const existing = clientId
          ? await this.em.findOne(CashAccount, { where: { clientId } })
          : null;
        if (existing) {
          await this.cash.updateAccount(existing.id, {
            name: String(payload.name || existing.name),
            kind: (payload.kind as CashAccountKind) || existing.kind,
          });
        } else {
          await this.cash.createAccount({
            name: String(payload.name || 'Kasa'),
            kind: (payload.kind as CashAccountKind) || CashAccountKind.CASH,
            clientId,
          });
        }
        return;
      }
      case 'cash_entries': {
        const existing = clientId
          ? await this.em.findOne(CashEntry, { where: { clientId } })
          : null;
        if (existing) return;
        await this.cash.createEntry({
          accountId: String(payload.accountId),
          type: (payload.type as CashEntryType) || CashEntryType.IN,
          amount: Number(payload.amount),
          entryDate: String(
            payload.entryDate || new Date().toISOString().slice(0, 10),
          ),
          description: payload.description ? String(payload.description) : undefined,
          partyId: payload.partyId ? String(payload.partyId) : undefined,
          invoiceId: payload.invoiceId ? String(payload.invoiceId) : undefined,
          category: payload.category ? String(payload.category) : undefined,
          clientId,
        });
        return;
      }
      case 'stock_movements': {
        const existing = clientId
          ? await this.em.findOne(StockMovement, { where: { clientId } })
          : null;
        if (existing) return;
        await this.stock.create({
          productId: payload.productId ? String(payload.productId) : undefined,
          variantId: payload.variantId ? String(payload.variantId) : undefined,
          type: (payload.type as StockMovementType) || StockMovementType.IN,
          quantity: Number(payload.quantity),
          note: payload.note ? String(payload.note) : undefined,
          clientId,
        });
        return;
      }
      case 'okc_sales': {
        await this.okc.importRows({
          rows: [
            {
              externalKey: String(payload.externalKey),
              saleDate: String(payload.saleDate),
              total: Number(payload.total),
              taxAmount: Number(payload.taxAmount || 0),
              cashAmount: Number(payload.cashAmount || 0),
              cardAmount: Number(payload.cardAmount || 0),
              zNo: payload.zNo ? String(payload.zNo) : undefined,
              receiptNo: payload.receiptNo
                ? String(payload.receiptNo)
                : undefined,
            },
          ],
        });
        return;
      }
      default:
        throw new Error(`Bilinmeyen koleksiyon: ${collection}`);
    }
  }

  private async deleteMutation(
    collection: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const id = typeof payload.id === 'string' ? payload.id : null;
    const clientId = typeof payload.clientId === 'string' ? payload.clientId : null;
    if (collection === 'parties') {
      const row = id
        ? await this.em.findOne(Party, { where: { id } })
        : clientId
          ? await this.em.findOne(Party, { where: { clientId } })
          : null;
      if (row) await this.parties.remove(row.id);
    }
  }
}
