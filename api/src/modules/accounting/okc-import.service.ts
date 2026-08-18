import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { OkcSale } from '@entities/okc-sale.entity';
import { CashAccount, CashAccountKind } from '@entities/cash-account.entity';
import { CashEntry, CashEntryType } from '@entities/cash-entry.entity';
import { ImportOkcDto } from '@modules/accounting/dto/accounting.dto';
import { CashService } from '@modules/accounting/cash.service';
import { money } from '@modules/accounting/money';
import {
  paginateResult,
  PaginatedResult,
} from '@common/utils/pagination';
import { AccountingQueryDto } from '@modules/accounting/dto/accounting.dto';

@Injectable()
export class OkcImportService {
  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly cash: CashService,
  ) {}

  async list(query: AccountingQueryDto): Promise<PaginatedResult<OkcSale>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 200) : 50;
    const qb = this.em.createQueryBuilder(OkcSale, 's');
    if (query.q?.trim()) {
      qb.andWhere(
        `(COALESCE(s.receipt_no, '') ILIKE :q OR COALESCE(s.z_no, '') ILIKE :q OR s.external_key ILIKE :q)`,
        { q: `%${query.q.trim()}%` },
      );
    }
    qb.orderBy('s.sale_date', 'DESC').addOrderBy('s.created_at', 'DESC');
    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return paginateResult(items, total, page, limit);
  }

  async importRows(dto: ImportOkcDto): Promise<{ imported: number; skipped: number }> {
    await this.cash.ensureDefaults();
    const cashAccount = await this.em.findOne(CashAccount, {
      where: { kind: CashAccountKind.CASH },
    });
    const posAccount = await this.em.findOne(CashAccount, {
      where: { kind: CashAccountKind.POS },
    });
    let imported = 0;
    let skipped = 0;
    for (const row of dto.rows) {
      const exists = await this.em.findOne(OkcSale, {
        where: { externalKey: row.externalKey },
      });
      if (exists) {
        skipped += 1;
        continue;
      }
      const sale = await this.em.save(
        this.em.create(OkcSale, {
          externalKey: row.externalKey,
          saleDate: row.saleDate,
          zNo: row.zNo ?? null,
          receiptNo: row.receiptNo ?? null,
          total: money(row.total),
          taxAmount: money(row.taxAmount ?? 0),
          cashAmount: money(row.cashAmount ?? 0),
          cardAmount: money(row.cardAmount ?? 0),
          itemCount: row.itemCount ?? null,
          description: row.description ?? null,
        }),
      );
      if (cashAccount && Number(row.cashAmount ?? 0) > 0) {
        const entry = await this.em.save(
          this.em.create(CashEntry, {
            accountId: cashAccount.id,
            type: CashEntryType.IN,
            amount: money(row.cashAmount || 0),
            entryDate: row.saleDate,
            description: `ÖKC nakit ${row.receiptNo || row.externalKey}`,
            source: 'okc',
            sourceId: sale.id,
          }),
        );
        sale.cashEntryId = entry.id;
        await this.em.save(sale);
      }
      if (posAccount && Number(row.cardAmount ?? 0) > 0) {
        await this.em.save(
          this.em.create(CashEntry, {
            accountId: posAccount.id,
            type: CashEntryType.IN,
            amount: money(row.cardAmount || 0),
            entryDate: row.saleDate,
            description: `ÖKC kart ${row.receiptNo || row.externalKey}`,
            source: 'okc',
            sourceId: sale.id,
          }),
        );
      }
      imported += 1;
    }
    return { imported, skipped };
  }
}
