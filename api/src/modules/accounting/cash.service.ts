import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { CashAccount, CashAccountKind } from '@entities/cash-account.entity';
import { CashEntry, CashEntryType } from '@entities/cash-entry.entity';
import { Invoice } from '@entities/invoice.entity';
import { Payment, PaymentStatus } from '@entities/payment.entity';
import {
  CashEntryQueryDto,
  CreateCashAccountDto,
  CreateCashEntryDto,
  UpdateCashAccountDto,
} from '@modules/accounting/dto/accounting.dto';
import { money, parseMoney } from '@modules/accounting/money';
import {
  paginateResult,
  PaginatedResult,
} from '@common/utils/pagination';

@Injectable()
export class CashService {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async ensureDefaults(): Promise<void> {
    const count = await this.em.count(CashAccount);
    if (count > 0) return;
    const defaults: { name: string; kind: CashAccountKind }[] = [
      { name: 'Nakit Kasa', kind: CashAccountKind.CASH },
      { name: 'Banka', kind: CashAccountKind.BANK },
      { name: 'PayTR', kind: CashAccountKind.PAYTR },
      { name: 'POS / ÖKC Kart', kind: CashAccountKind.POS },
    ];
    for (const row of defaults) {
      await this.em.save(this.em.create(CashAccount, row));
    }
  }

  async listAccounts(): Promise<CashAccount[]> {
    await this.ensureDefaults();
    return this.em.find(CashAccount, { order: { name: 'ASC' } });
  }

  async createAccount(dto: CreateCashAccountDto): Promise<CashAccount> {
    return this.em.save(
      this.em.create(CashAccount, {
        name: dto.name,
        kind: dto.kind,
        openingBalance: money(dto.openingBalance ?? 0),
        isActive: dto.isActive ?? true,
        clientId: dto.clientId ?? null,
      }),
    );
  }

  async updateAccount(
    id: string,
    dto: UpdateCashAccountDto,
  ): Promise<CashAccount> {
    const row = await this.em.findOne(CashAccount, { where: { id } });
    if (!row) throw new NotFoundException('Kasa bulunamadı');
    Object.assign(row, dto);
    if (dto.openingBalance != null) {
      row.openingBalance = money(dto.openingBalance);
    }
    return this.em.save(row);
  }

  async listEntries(
    query: CashEntryQueryDto,
  ): Promise<PaginatedResult<CashEntry>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 200) : 50;
    const qb = this.em
      .createQueryBuilder(CashEntry, 'e')
      .leftJoinAndSelect('e.account', 'account')
      .leftJoinAndSelect('e.party', 'party')
      .leftJoinAndSelect('e.invoice', 'invoice');
    if (query.accountId) {
      qb.andWhere('e.account_id = :accountId', { accountId: query.accountId });
    }
    if (query.from) {
      qb.andWhere('e.entry_date >= :from', { from: query.from });
    }
    if (query.to) {
      qb.andWhere('e.entry_date <= :to', { to: query.to });
    }
    if (query.q?.trim()) {
      qb.andWhere('COALESCE(e.description, \'\') ILIKE :q', {
        q: `%${query.q.trim()}%`,
      });
    }
    qb.orderBy('e.entry_date', 'DESC').addOrderBy('e.created_at', 'DESC');
    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return paginateResult(items, total, page, limit);
  }

  async createEntry(dto: CreateCashEntryDto): Promise<CashEntry> {
    const account = await this.em.findOne(CashAccount, {
      where: { id: dto.accountId },
    });
    if (!account) throw new NotFoundException('Kasa bulunamadı');
    const entry = await this.em.save(
      this.em.create(CashEntry, {
        accountId: dto.accountId,
        type: dto.type,
        amount: money(dto.amount),
        entryDate: dto.entryDate,
        description: dto.description ?? null,
        partyId: dto.partyId ?? null,
        invoiceId: dto.invoiceId ?? null,
        clientId: dto.clientId ?? null,
        category: dto.category ?? null,
        source: 'manual',
      }),
    );
    if (dto.invoiceId) {
      await this.applyInvoicePayment(dto.invoiceId);
    }
    return entry;
  }

  async accountBalances() {
    const accounts = await this.listAccounts();
    const rows = [];
    for (const account of accounts) {
      const raw = await this.em
        .createQueryBuilder(CashEntry, 'e')
        .select(
          `COALESCE(SUM(CASE WHEN e.type = 'in' THEN e.amount ELSE -e.amount END), 0)`,
          'sum',
        )
        .where('e.account_id = :id', { id: account.id })
        .getRawOne<{ sum: string }>();
      rows.push({
        ...account,
        balance: money(parseMoney(account.openingBalance) + parseMoney(raw?.sum)),
      });
    }
    return rows;
  }

  /** PayTR başarılı ödemeleri kasa hareketi olarak işler (çift kayıt yok). */
  async syncPaytrPayments(): Promise<{ imported: number }> {
    await this.ensureDefaults();
    const paytr = await this.em.findOne(CashAccount, {
      where: { kind: CashAccountKind.PAYTR },
    });
    if (!paytr) return { imported: 0 };
    const payments = await this.em.find(Payment, {
      where: { status: PaymentStatus.SUCCESS, provider: 'paytr' },
    });
    let imported = 0;
    for (const payment of payments) {
      const exists = await this.em.findOne(CashEntry, {
        where: { source: 'paytr', sourceId: payment.id },
      });
      if (exists) continue;
      await this.em.save(
        this.em.create(CashEntry, {
          accountId: paytr.id,
          type: CashEntryType.IN,
          amount: payment.amount,
          entryDate: payment.createdAt.toISOString().slice(0, 10),
          description: `PayTR ${payment.paymentId || payment.id}`,
          source: 'paytr',
          sourceId: payment.id,
        }),
      );
      imported += 1;
    }
    return { imported };
  }

  private async applyInvoicePayment(invoiceId: string): Promise<void> {
    const invoice = await this.em.findOne(Invoice, { where: { id: invoiceId } });
    if (!invoice) return;
    const raw = await this.em
      .createQueryBuilder(CashEntry, 'e')
      .select(
        `COALESCE(SUM(CASE WHEN e.type = 'in' THEN e.amount ELSE -e.amount END), 0)`,
        'sum',
      )
      .where('e.invoice_id = :id', { id: invoiceId })
      .getRawOne<{ sum: string }>();
    invoice.paidAmount = money(parseMoney(raw?.sum));
    await this.em.save(invoice);
  }
}
