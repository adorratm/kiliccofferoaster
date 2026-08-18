import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import {
  EDocumentType,
  Invoice,
  InvoiceDirection,
  InvoiceStatus,
} from '@entities/invoice.entity';
import { InvoiceLine } from '@entities/invoice-line.entity';
import { Party } from '@entities/party.entity';
import { Product } from '@entities/product.entity';
import { Order } from '@entities/order.entity';
import { OrderItem } from '@entities/order-item.entity';
import { AccountingSettings } from '@entities/accounting-settings.entity';
import {
  CreateInvoiceDto,
  InvoiceLineInputDto,
  InvoiceQueryDto,
  UpdateInvoiceDto,
} from '@modules/accounting/dto/accounting.dto';
import { lineFromGross, money, parseMoney } from '@modules/accounting/money';
import {
  paginateResult,
  PaginatedResult,
} from '@common/utils/pagination';
import { EinvoiceGateway } from '@modules/einvoice/einvoice.gateway';
import { StockLedgerService } from '@modules/accounting/stock-ledger.service';
import { StockMovementType } from '@entities/stock-movement.entity';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly einvoice: EinvoiceGateway,
    private readonly stock: StockLedgerService,
  ) {}

  async list(query: InvoiceQueryDto): Promise<PaginatedResult<Invoice>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 200) : 50;
    const qb = this.em
      .createQueryBuilder(Invoice, 'i')
      .leftJoinAndSelect('i.party', 'party')
      .leftJoinAndSelect('i.lines', 'lines');
    if (query.direction) {
      qb.andWhere('i.direction = :direction', { direction: query.direction });
    }
    if (query.status) {
      qb.andWhere('i.status = :status', { status: query.status });
    }
    if (query.partyId) {
      qb.andWhere('i.party_id = :partyId', { partyId: query.partyId });
    }
    if (query.q?.trim()) {
      const q = `%${query.q.trim()}%`;
      qb.andWhere(
        `(i.invoice_number ILIKE :q OR COALESCE(party.title, '') ILIKE :q)`,
        { q },
      );
    }
    qb.orderBy('i.issue_date', 'DESC').addOrderBy('i.created_at', 'DESC');
    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return paginateResult(items, total, page, limit);
  }

  async findOne(id: string): Promise<Invoice> {
    const row = await this.em.findOne(Invoice, {
      where: { id },
      relations: { party: true, lines: true, order: true },
    });
    if (!row) throw new NotFoundException('Fatura bulunamadı');
    return row;
  }

  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    if (!dto.lines?.length) {
      throw new BadRequestException('Faturada en az bir satır olmalı');
    }
    const invoiceNumber = await this.nextNumber(dto.direction);
    const edocumentType = await this.resolveEdocumentType(dto);
    const { subtotal, taxAmount, total, lines } = await this.buildLines(dto.lines);

    const invoice = this.em.create(Invoice, {
      invoiceNumber,
      direction: dto.direction,
      status: InvoiceStatus.DRAFT,
      edocumentType,
      partyId: dto.partyId ?? null,
      orderId: dto.orderId ?? null,
      issueDate: dto.issueDate,
      dueDate: dto.dueDate ?? null,
      currency: 'TRY',
      subtotal,
      taxAmount,
      total,
      paidAmount: '0.00',
      notes: dto.notes ?? null,
      clientId: dto.clientId ?? null,
    });
    const saved = await this.em.save(invoice);
    for (const line of lines) {
      line.invoiceId = saved.id;
      await this.em.save(line);
    }
    await this.applyStock(saved.id, dto.direction, 'create');
    await this.touchPartyBalance(saved.partyId);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOne(id);
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Yalnızca taslak faturalar güncellenir');
    }
    if (dto.lines) {
      if (!dto.lines.length) {
        throw new BadRequestException('Faturada en az bir satır olmalı');
      }
      await this.applyStock(invoice.id, invoice.direction, 'revert');
      await this.em.delete(InvoiceLine, { invoiceId: invoice.id });
      const built = await this.buildLines(dto.lines);
      invoice.subtotal = built.subtotal;
      invoice.taxAmount = built.taxAmount;
      invoice.total = built.total;
      for (const line of built.lines) {
        line.invoiceId = invoice.id;
        await this.em.save(line);
      }
    }
    if (dto.partyId !== undefined) invoice.partyId = dto.partyId || null;
    if (dto.issueDate) invoice.issueDate = dto.issueDate;
    if (dto.dueDate !== undefined) invoice.dueDate = dto.dueDate || null;
    if (dto.notes !== undefined) invoice.notes = dto.notes || null;
    if (dto.edocumentType) invoice.edocumentType = dto.edocumentType;
    if (dto.orderId !== undefined) invoice.orderId = dto.orderId || null;
    await this.em.save(invoice);
    if (dto.lines) {
      await this.applyStock(invoice.id, invoice.direction, 'create');
    }
    await this.touchPartyBalance(invoice.partyId);
    return this.findOne(invoice.id);
  }

  async queue(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Yalnızca taslak kuyruğa alınır');
    }
    if (invoice.edocumentType === EDocumentType.NONE) {
      throw new BadRequestException(
        'e-belge tipi yok; GİB gönderimi için e-arşiv veya e-fatura seçin',
      );
    }
    invoice.status = InvoiceStatus.QUEUED;
    invoice.queuedAt = new Date();
    await this.em.save(invoice);
    return this.findOne(id);
  }

  async send(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);
    if (
      invoice.status !== InvoiceStatus.DRAFT &&
      invoice.status !== InvoiceStatus.QUEUED &&
      invoice.status !== InvoiceStatus.REJECTED
    ) {
      throw new BadRequestException('Bu fatura gönderilemez');
    }
    if (invoice.edocumentType === EDocumentType.NONE) {
      throw new BadRequestException('e-belge tipi yok');
    }
    const result = await this.einvoice.sendInvoice(invoice);
    invoice.status = result.accepted
      ? InvoiceStatus.SENT
      : InvoiceStatus.REJECTED;
    invoice.ettn = result.ettn ?? invoice.ettn;
    invoice.gibUuid = result.gibUuid ?? invoice.gibUuid;
    invoice.providerStatus = result.providerStatus ?? invoice.providerStatus;
    invoice.providerPayload = result.raw ?? invoice.providerPayload;
    invoice.sentAt = result.accepted ? new Date() : invoice.sentAt;
    if (result.accepted) {
      invoice.status = InvoiceStatus.SENT;
    }
    await this.em.save(invoice);
    return this.findOne(id);
  }

  async cancel(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);
    if (
      invoice.status === InvoiceStatus.SENT ||
      invoice.status === InvoiceStatus.ACCEPTED
    ) {
      throw new BadRequestException(
        'GİB’e gitmiş fatura bu ekrandan iptal edilmez',
      );
    }
    await this.applyStock(invoice.id, invoice.direction, 'revert');
    invoice.status = InvoiceStatus.CANCELLED;
    await this.em.save(invoice);
    await this.touchPartyBalance(invoice.partyId);
    return this.findOne(id);
  }

  async fromOrder(orderId: string): Promise<Invoice> {
    const existing = await this.em.findOne(Invoice, { where: { orderId } });
    if (existing) return this.findOne(existing.id);
    const order = await this.em.findOne(Order, {
      where: { id: orderId },
      relations: { items: true },
    });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');
    const lines: InvoiceLineInputDto[] = (order.items || []).map(
      (item: OrderItem) => ({
        description: [item.productName, item.variantLabel, item.grindLabel]
          .filter(Boolean)
          .join(' · '),
        productId: item.productId ?? undefined,
        variantId: item.variantId ?? undefined,
        quantity: item.quantity,
        unit: 'adet',
        unitPrice: parseMoney(item.unitPrice),
        vatRate: 20,
      }),
    );
    return this.create({
      direction: InvoiceDirection.SALES,
      edocumentType: EDocumentType.EARCHIVE,
      orderId: order.id,
      issueDate: new Date().toISOString().slice(0, 10),
      notes: `Web siparişi ${order.orderNumber}`,
      lines,
    });
  }

  async printModel(id: string) {
    const invoice = await this.findOne(id);
    const settings = await this.getSettings();
    return { invoice, settings };
  }

  private async resolveEdocumentType(
    dto: CreateInvoiceDto,
  ): Promise<EDocumentType> {
    if (dto.edocumentType) return dto.edocumentType;
    if (dto.direction === InvoiceDirection.PURCHASE) {
      return EDocumentType.NONE;
    }
    if (!dto.partyId) return EDocumentType.EARCHIVE;
    const party = await this.em.findOne(Party, { where: { id: dto.partyId } });
    if (party?.isEinvoice || party?.taxNumber) {
      const check = await this.einvoice.checkTaxpayer(party.taxNumber || '');
      return check.isEinvoice ? EDocumentType.EINVOICE : EDocumentType.EARCHIVE;
    }
    return EDocumentType.EARCHIVE;
  }

  private async buildLines(input: InvoiceLineInputDto[]): Promise<{
    subtotal: string;
    taxAmount: string;
    total: string;
    lines: InvoiceLine[];
  }> {
    const lines: InvoiceLine[] = [];
    let subtotal = 0;
    let tax = 0;
    let total = 0;
    for (let i = 0; i < input.length; i++) {
      const row = input[i];
      let vatRate = row.vatRate ?? 20;
      let unit = row.unit ?? 'adet';
      if (row.productId) {
        const product = await this.em.findOne(Product, {
          where: { id: row.productId },
        });
        if (product) {
          if (row.vatRate == null) vatRate = parseMoney(product.vatRate);
          if (!row.unit) unit = product.unit;
        }
      }
      const calc = lineFromGross({
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        vatRate,
      });
      subtotal += parseMoney(calc.lineNet);
      tax += parseMoney(calc.lineVat);
      total += parseMoney(calc.lineTotal);
      lines.push(
        this.em.create(InvoiceLine, {
          sortOrder: i,
          description: row.description,
          productId: row.productId ?? null,
          variantId: row.variantId ?? null,
          quantity: String(row.quantity),
          unit,
          unitPrice: money(row.unitPrice),
          vatRate: money(vatRate),
          lineNet: calc.lineNet,
          lineVat: calc.lineVat,
          lineTotal: calc.lineTotal,
        }),
      );
    }
    return {
      subtotal: money(subtotal),
      taxAmount: money(tax),
      total: money(total),
      lines,
    };
  }

  private async nextNumber(direction: InvoiceDirection): Promise<string> {
    const prefix = direction === InvoiceDirection.SALES ? 'SAT' : 'ALS';
    const year = new Date().getFullYear();
    const like = `${prefix}-${year}-%`;
    const last = await this.em
      .createQueryBuilder(Invoice, 'i')
      .where('i.invoice_number LIKE :like', { like })
      .orderBy('i.invoice_number', 'DESC')
      .getOne();
    const next = last
      ? Number(last.invoiceNumber.split('-').pop() || '0') + 1
      : 1;
    return `${prefix}-${year}-${String(next).padStart(4, '0')}`;
  }

  private async applyStock(
    invoiceId: string,
    direction: InvoiceDirection,
    mode: 'create' | 'revert',
  ): Promise<void> {
    const invoice = await this.em.findOne(Invoice, {
      where: { id: invoiceId },
      relations: { lines: true },
    });
    if (!invoice?.lines?.length) return;
    if (invoice.orderId) return;
    const sign =
      direction === InvoiceDirection.SALES
        ? mode === 'create'
          ? -1
          : 1
        : mode === 'create'
          ? 1
          : -1;
    const type =
      direction === InvoiceDirection.SALES
        ? mode === 'create'
          ? StockMovementType.SALE
          : StockMovementType.RETURN
        : mode === 'create'
          ? StockMovementType.PURCHASE
          : StockMovementType.OUT;
    for (const line of invoice.lines) {
      if (!line.productId && !line.variantId) continue;
      const qty = Math.round(parseMoney(line.quantity)) * sign;
      if (!qty) continue;
      await this.stock.record({
        productId: line.productId,
        variantId: line.variantId,
        type,
        quantity: qty,
        source: 'invoice',
        sourceId: invoice.id,
        note: invoice.invoiceNumber,
      });
    }
  }

  private async touchPartyBalance(partyId: string | null): Promise<void> {
    if (!partyId) return;
    const sales = await this.em
      .createQueryBuilder(Invoice, 'i')
      .select('COALESCE(SUM(i.total), 0)', 'sum')
      .where('i.party_id = :partyId', { partyId })
      .andWhere('i.direction = :dir', { dir: InvoiceDirection.SALES })
      .andWhere('i.status NOT IN (:...skip)', {
        skip: [InvoiceStatus.CANCELLED],
      })
      .getRawOne<{ sum: string }>();
    const purchases = await this.em
      .createQueryBuilder(Invoice, 'i')
      .select('COALESCE(SUM(i.total), 0)', 'sum')
      .where('i.party_id = :partyId', { partyId })
      .andWhere('i.direction = :dir', { dir: InvoiceDirection.PURCHASE })
      .andWhere('i.status NOT IN (:...skip)', {
        skip: [InvoiceStatus.CANCELLED],
      })
      .getRawOne<{ sum: string }>();
    const paid = await this.em.query(
      `
      SELECT COALESCE(SUM(
        CASE WHEN type = 'in' THEN amount ELSE -amount END
      ), 0) AS sum
      FROM cash_entries WHERE party_id = $1
      `,
      [partyId],
    );
    const party = await this.em.findOne(Party, { where: { id: partyId } });
    if (!party) return;
    const balance =
      parseMoney(sales?.sum) -
      parseMoney(purchases?.sum) -
      parseMoney(paid?.[0]?.sum);
    party.balance = money(balance);
    await this.em.save(party);
  }

  async getSettings(): Promise<AccountingSettings> {
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
