import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Invoice, InvoiceDirection, InvoiceStatus } from '@entities/invoice.entity';
import { OkcSale } from '@entities/okc-sale.entity';
import { CashEntry, CashEntryType } from '@entities/cash-entry.entity';
import { Order, OrderStatus } from '@entities/order.entity';
import { Party } from '@entities/party.entity';
import { ProductVariant } from '@entities/product-variant.entity';
import { ReportsQueryDto } from '@modules/accounting/dto/accounting.dto';
import { money, parseMoney } from '@modules/accounting/money';

@Injectable()
export class ReportsService {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async turnover(query: ReportsQueryDto) {
    const { from, to } = this.range(query);
    const invoices = await this.em
      .createQueryBuilder(Invoice, 'i')
      .where('i.direction = :dir', { dir: InvoiceDirection.SALES })
      .andWhere('i.status NOT IN (:...skip)', {
        skip: [InvoiceStatus.CANCELLED, InvoiceStatus.DRAFT],
      })
      .andWhere('i.issue_date BETWEEN :from AND :to', { from, to })
      .getMany();

    const okc = await this.em
      .createQueryBuilder(OkcSale, 's')
      .where('s.sale_date BETWEEN :from AND :to', { from, to })
      .getMany();

    const web = await this.em
      .createQueryBuilder(Order, 'o')
      .where('o.status IN (:...st)', {
        st: [
          OrderStatus.PAID,
          OrderStatus.PROCESSING,
          OrderStatus.SHIPPED,
          OrderStatus.DELIVERED,
        ],
      })
      .andWhere('o.created_at >= :from', { from: `${from}T00:00:00.000Z` })
      .andWhere('o.created_at < :to', { to: `${to}T23:59:59.999Z` })
      .getMany();

    /** Manuel kasa girişi (ÖKC/PayTR eşlemesi çift sayılmasın). */
    const cashRegister = await this.em
      .createQueryBuilder(CashEntry, 'e')
      .where('e.type = :t', { t: CashEntryType.IN })
      .andWhere("(e.source IS NULL OR e.source = 'manual')")
      .andWhere('e.entry_date BETWEEN :from AND :to', { from, to })
      .getMany();

    const invoiceTotal = invoices.reduce((s, i) => s + parseMoney(i.total), 0);
    const invoiceVat = invoices.reduce((s, i) => s + parseMoney(i.taxAmount), 0);
    const okcTotal = okc.reduce((s, i) => s + parseMoney(i.total), 0);
    const okcVat = okc.reduce((s, i) => s + parseMoney(i.taxAmount), 0);
    const okcCash = okc.reduce((s, i) => s + parseMoney(i.cashAmount), 0);
    const okcCard = okc.reduce((s, i) => s + parseMoney(i.cardAmount), 0);
    const webTotal = web.reduce((s, i) => s + parseMoney(i.total), 0);
    const cashTotal = cashRegister.reduce((s, i) => s + parseMoney(i.amount), 0);

    return {
      from,
      to,
      web: { count: web.length, total: money(webTotal) },
      invoices: { count: invoices.length, total: money(invoiceTotal), vat: money(invoiceVat) },
      okc: {
        count: okc.length,
        total: money(okcTotal),
        vat: money(okcVat),
        cash: money(okcCash),
        card: money(okcCard),
      },
      cashRegister: { count: cashRegister.length, total: money(cashTotal) },
      combined: money(invoiceTotal + okcTotal + cashTotal),
    };
  }

  async vat(query: ReportsQueryDto) {
    const { from, to } = this.range(query);
    const sales = await this.em
      .createQueryBuilder(Invoice, 'i')
      .where('i.direction = :dir', { dir: InvoiceDirection.SALES })
      .andWhere('i.status NOT IN (:...skip)', {
        skip: [InvoiceStatus.CANCELLED],
      })
      .andWhere('i.issue_date BETWEEN :from AND :to', { from, to })
      .getMany();
    const purchases = await this.em
      .createQueryBuilder(Invoice, 'i')
      .where('i.direction = :dir', { dir: InvoiceDirection.PURCHASE })
      .andWhere('i.status NOT IN (:...skip)', {
        skip: [InvoiceStatus.CANCELLED],
      })
      .andWhere('i.issue_date BETWEEN :from AND :to', { from, to })
      .getMany();
    const output = sales.reduce((s, i) => s + parseMoney(i.taxAmount), 0);
    const input = purchases.reduce((s, i) => s + parseMoney(i.taxAmount), 0);
    return {
      from,
      to,
      outputVat: money(output),
      inputVat: money(input),
      payable: money(output - input),
    };
  }

  async cashBook(query: ReportsQueryDto) {
    const { from, to } = this.range(query);
    const entries = await this.em
      .createQueryBuilder(CashEntry, 'e')
      .leftJoinAndSelect('e.account', 'account')
      .where('e.entry_date BETWEEN :from AND :to', { from, to })
      .orderBy('e.entry_date', 'ASC')
      .getMany();
    return { from, to, entries };
  }

  async stock() {
    const variants = await this.em.find(ProductVariant, {
      relations: { product: true },
      order: { sku: 'ASC' },
    });
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 30);
    const horizonStr = horizon.toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    return variants.map((v) => {
      const expiresAt = v.expiresAt || v.product?.expiresAt || null;
      return {
        sku: v.sku,
        name: v.product?.name,
        kind: v.product?.kind,
        label: v.weightLabel,
        stock: v.stock,
        barcode: v.barcode || v.product?.barcode || null,
        expiresAt,
        expiringSoon: Boolean(expiresAt && expiresAt <= horizonStr),
        expired: Boolean(expiresAt && expiresAt < today),
      };
    });
  }

  async partyStatement(partyId: string, query: ReportsQueryDto) {
    const party = await this.em.findOne(Party, { where: { id: partyId } });
    const { from, to } = this.range(query);
    const invoices = await this.em
      .createQueryBuilder(Invoice, 'i')
      .leftJoinAndSelect('i.lines', 'lines')
      .where('i.party_id = :partyId', { partyId })
      .andWhere('i.issue_date BETWEEN :from AND :to', { from, to })
      .orderBy('i.issue_date', 'ASC')
      .getMany();
    return { party, from, to, invoices };
  }

  private range(query: ReportsQueryDto): { from: string; to: string } {
    const to = query.to || new Date().toISOString().slice(0, 10);
    const from =
      query.from ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return { from, to };
  }
}
