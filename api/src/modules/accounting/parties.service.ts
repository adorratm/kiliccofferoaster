import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Party } from '@entities/party.entity';
import { Invoice } from '@entities/invoice.entity';
import {
  CreatePartyDto,
  PartyQueryDto,
  UpdatePartyDto,
} from '@modules/accounting/dto/accounting.dto';
import {
  paginateResult,
  PaginatedResult,
} from '@common/utils/pagination';

@Injectable()
export class PartiesService {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async list(query: PartyQueryDto): Promise<PaginatedResult<Party>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 200) : 50;
    const qb = this.em.createQueryBuilder(Party, 'p');
    if (query.type) {
      qb.andWhere('p.type = :type', { type: query.type });
    }
    if (query.q?.trim()) {
      const q = `%${query.q.trim()}%`;
      qb.andWhere(
        `(p.title ILIKE :q OR COALESCE(p.tax_number, '') ILIKE :q OR COALESCE(p.email, '') ILIKE :q)`,
        { q },
      );
    }
    qb.orderBy('p.title', 'ASC');
    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return paginateResult(items, total, page, limit);
  }

  async findOne(id: string): Promise<Party> {
    const row = await this.em.findOne(Party, { where: { id } });
    if (!row) throw new NotFoundException('Cari bulunamadı');
    return row;
  }

  async create(dto: CreatePartyDto): Promise<Party> {
    const row = this.em.create(Party, {
      type: dto.type,
      title: dto.title,
      taxNumber: dto.taxNumber ?? null,
      taxOffice: dto.taxOffice ?? null,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      address: dto.address ?? null,
      city: dto.city ?? null,
      district: dto.district ?? null,
      isEinvoice: dto.isEinvoice ?? false,
      isActive: dto.isActive ?? true,
      notes: dto.notes ?? null,
      clientId: dto.clientId ?? null,
      balance: '0.00',
    });
    return this.em.save(row);
  }

  async update(id: string, dto: UpdatePartyDto): Promise<Party> {
    const row = await this.findOne(id);
    Object.assign(row, {
      ...dto,
      taxNumber: dto.taxNumber !== undefined ? dto.taxNumber || null : row.taxNumber,
      taxOffice: dto.taxOffice !== undefined ? dto.taxOffice || null : row.taxOffice,
      email: dto.email !== undefined ? dto.email || null : row.email,
      phone: dto.phone !== undefined ? dto.phone || null : row.phone,
      address: dto.address !== undefined ? dto.address || null : row.address,
      city: dto.city !== undefined ? dto.city || null : row.city,
      district: dto.district !== undefined ? dto.district || null : row.district,
      notes: dto.notes !== undefined ? dto.notes || null : row.notes,
    });
    return this.em.save(row);
  }

  async remove(id: string): Promise<void> {
    const row = await this.findOne(id);
    await this.em.remove(row);
  }

  async statement(id: string) {
    const party = await this.findOne(id);
    const invoices = await this.em.find(Invoice, {
      where: { partyId: id },
      order: { issueDate: 'DESC', createdAt: 'DESC' },
    });

    const entries = await this.em.query(
      `
      SELECT e.id, e.entry_date, e.type, e.amount, e.description, e.invoice_id
      FROM cash_entries e
      WHERE e.party_id = $1
      ORDER BY e.entry_date DESC, e.created_at DESC
      `,
      [id],
    );

    return { party, invoices, cashEntries: entries };
  }
}
