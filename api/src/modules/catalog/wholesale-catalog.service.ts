import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { EntityManager, In } from 'typeorm';
import { COFFEE_KINDS } from '@common/constants/grind-options';
import {
  paginateResult,
  PaginatedResult,
} from '@common/utils/pagination';
import { sortByWeightLabel } from '@common/utils/weight-sort';
import { Party } from '@entities/party.entity';
import { Product } from '@entities/product.entity';
import { ProductVariant } from '@entities/product-variant.entity';
import { SiteSetting } from '@entities/site-setting.entity';
import { WholesaleCatalog } from '@entities/wholesale-catalog.entity';
import { WholesaleCatalogPrice } from '@entities/wholesale-catalog-price.entity';
import {
  CreateWholesaleCatalogDto,
  UpdateWholesaleCatalogDto,
  WholesaleCatalogPriceInputDto,
  WholesaleCatalogQueryDto,
} from '@modules/catalog/dto/wholesale-catalog.dto';

export type WholesaleCatalogItem = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  originCountry: string | null;
  originRegion: string | null;
  altitude: string | null;
  process: string | null;
  varietal: string | null;
  roastLevel: string | null;
  flavorNotes: string[];
  roastedAt: string | null;
  kind: string;
  currency: string;
  basePrice: string;
  imageUrl: string | null;
  category: { name: string; slug: string } | null;
  variants: Array<{
    weightLabel: string;
    price: string;
    listPrice?: string;
    isCustomPrice?: boolean;
  }>;
};

export type WholesaleCatalogListItem = {
  id: string;
  businessName: string;
  partyId: string | null;
  partyTitle: string | null;
  token: string;
  isEnabled: boolean;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  instagram: string | null;
  notes: string | null;
  sharePath: string;
  shareUrl: string;
  priceCount: number;
  createdAt: string;
  updatedAt: string;
};

export type WholesaleCatalogAdminDetail = WholesaleCatalogListItem & {
  products: Array<{
    id: string;
    name: string;
    slug: string;
    kind: string;
    currency: string;
    categoryName: string | null;
    variants: Array<{
      id: string;
      weightLabel: string;
      listPrice: string;
      customPrice: string | null;
    }>;
  }>;
};

@Injectable()
export class WholesaleCatalogService {
  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly config: ConfigService,
  ) {}

  private generateToken(): string {
    return randomBytes(24).toString('base64url');
  }

  private sharePath(token: string): string {
    return `/katalog/${token}`;
  }

  private shareUrl(token: string): string {
    const base = (
      this.config.get<string>('frontendUrl') || 'http://localhost:3000'
    ).replace(/\/$/, '');
    return `${base}${this.sharePath(token)}`;
  }

  private normalizeOptional(value?: string | null): string | null {
    if (value === null || value === undefined) return null;
    const trimmed = String(value).trim();
    return trimmed || null;
  }

  private toListItem(
    catalog: WholesaleCatalog,
    priceCount = 0,
  ): WholesaleCatalogListItem {
    return {
      id: catalog.id,
      businessName: catalog.businessName,
      partyId: catalog.partyId,
      partyTitle: catalog.party?.title ?? null,
      token: catalog.token,
      isEnabled: catalog.isEnabled,
      contactPerson: catalog.contactPerson,
      phone: catalog.phone,
      email: catalog.email,
      address: catalog.address,
      website: catalog.website,
      instagram: catalog.instagram,
      notes: catalog.notes,
      sharePath: this.sharePath(catalog.token),
      shareUrl: this.shareUrl(catalog.token),
      priceCount,
      createdAt: new Date(catalog.createdAt).toISOString(),
      updatedAt: new Date(catalog.updatedAt).toISOString(),
    };
  }

  async listAdmin(
    query: WholesaleCatalogQueryDto = {},
  ): Promise<PaginatedResult<WholesaleCatalogListItem>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit =
      query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 50;

    const qb = this.em
      .createQueryBuilder(WholesaleCatalog, 'c')
      .leftJoinAndSelect('c.party', 'party')
      .orderBy('c.updated_at', 'DESC');

    if (query.q?.trim()) {
      const q = `%${query.q.trim()}%`;
      qb.andWhere(
        `(
          c.business_name ILIKE :q OR
          COALESCE(party.title, '') ILIKE :q OR
          COALESCE(c.notes, '') ILIKE :q OR
          COALESCE(c.contact_person, '') ILIKE :q OR
          COALESCE(c.phone, '') ILIKE :q OR
          COALESCE(c.email, '') ILIKE :q OR
          COALESCE(c.address, '') ILIKE :q OR
          COALESCE(c.website, '') ILIKE :q OR
          COALESCE(c.instagram, '') ILIKE :q
        )`,
        { q },
      );
    }

    const [rows, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const countMap = new Map<string, number>();
    if (rows.length) {
      const counts: Array<{ catalogId: string; cnt: string }> =
        await this.em
          .createQueryBuilder(WholesaleCatalogPrice, 'pr')
          .select('pr.catalog_id', 'catalogId')
          .addSelect('COUNT(*)', 'cnt')
          .where('pr.catalog_id IN (:...ids)', {
            ids: rows.map((r) => r.id),
          })
          .groupBy('pr.catalog_id')
          .getRawMany();
      for (const row of counts) {
        countMap.set(row.catalogId, Number(row.cnt) || 0);
      }
    }

    const items = rows.map((row) =>
      this.toListItem(row, countMap.get(row.id) || 0),
    );

    return paginateResult(items, total, page, limit);
  }

  async getAdminDetail(id: string): Promise<WholesaleCatalogAdminDetail> {
    const catalog = await this.em.findOne(WholesaleCatalog, {
      where: { id },
      relations: { party: true, prices: true },
    });
    if (!catalog) throw new NotFoundException('Katalog bulunamadı');

    const overrideMap = new Map(
      (catalog.prices || []).map((p) => [p.variantId, p.price]),
    );

    const products = await this.loadCoffeeProducts();
    const matrix = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      kind: p.kind,
      currency: p.currency || 'TRY',
      categoryName: p.category?.name ?? null,
      variants: sortByWeightLabel(
        (p.variants || []).filter((v) => v.isActive),
      ).map((v) => ({
        id: v.id,
        weightLabel: v.weightLabel,
        listPrice: v.price,
        customPrice: overrideMap.get(v.id) ?? null,
      })),
    }));

    return {
      ...this.toListItem(catalog, catalog.prices?.length || 0),
      products: matrix,
    };
  }

  async create(
    dto: CreateWholesaleCatalogDto,
  ): Promise<WholesaleCatalogAdminDetail> {
    let partyId: string | null = dto.partyId ?? null;
    let businessName = dto.businessName.trim();
    let contactPerson = this.normalizeOptional(dto.contactPerson);
    let phone = this.normalizeOptional(dto.phone);
    let email = this.normalizeOptional(dto.email);
    let address = this.normalizeOptional(dto.address);
    let website = this.normalizeOptional(dto.website);
    let instagram = this.normalizeOptional(dto.instagram);

    if (partyId) {
      const party = await this.em.findOne(Party, { where: { id: partyId } });
      if (!party) throw new NotFoundException('Cari bulunamadı');
      if (!businessName) businessName = party.title;
      partyId = party.id;
      if (!phone) phone = this.normalizeOptional(party.phone);
      if (!email) email = this.normalizeOptional(party.email);
      if (!address) {
        address = this.normalizeOptional(
          [party.address, party.district, party.city].filter(Boolean).join(', '),
        );
      }
    }

    if (businessName.length < 2) {
      throw new BadRequestException('İşletme adı gerekli');
    }

    const catalog = this.em.create(WholesaleCatalog, {
      partyId,
      businessName,
      token: this.generateToken(),
      isEnabled: dto.isEnabled ?? true,
      contactPerson,
      phone,
      email,
      address,
      website,
      instagram,
      notes: this.normalizeOptional(dto.notes),
    });
    await this.em.save(catalog);
    return this.getAdminDetail(catalog.id);
  }

  async update(
    id: string,
    dto: UpdateWholesaleCatalogDto,
  ): Promise<WholesaleCatalogAdminDetail> {
    const catalog = await this.em.findOne(WholesaleCatalog, {
      where: { id },
    });
    if (!catalog) throw new NotFoundException('Katalog bulunamadı');

    if (dto.partyId !== undefined) {
      if (dto.partyId === null || dto.partyId === '') {
        catalog.partyId = null;
      } else {
        const party = await this.em.findOne(Party, {
          where: { id: dto.partyId },
        });
        if (!party) throw new NotFoundException('Cari bulunamadı');
        catalog.partyId = party.id;
        if (!dto.businessName?.trim()) {
          catalog.businessName = party.title;
        }
      }
    }

    if (dto.businessName !== undefined) {
      const name = dto.businessName.trim();
      if (name.length < 2) {
        throw new BadRequestException('İşletme adı gerekli');
      }
      catalog.businessName = name;
    }

    if (dto.contactPerson !== undefined) {
      catalog.contactPerson = this.normalizeOptional(dto.contactPerson);
    }
    if (dto.phone !== undefined) {
      catalog.phone = this.normalizeOptional(dto.phone);
    }
    if (dto.email !== undefined) {
      catalog.email = this.normalizeOptional(dto.email);
    }
    if (dto.address !== undefined) {
      catalog.address = this.normalizeOptional(dto.address);
    }
    if (dto.website !== undefined) {
      catalog.website = this.normalizeOptional(dto.website);
    }
    if (dto.instagram !== undefined) {
      catalog.instagram = this.normalizeOptional(dto.instagram);
    }

    if (dto.notes !== undefined) {
      catalog.notes = this.normalizeOptional(dto.notes);
    }

    if (typeof dto.isEnabled === 'boolean') {
      catalog.isEnabled = dto.isEnabled;
    }

    await this.em.save(catalog);

    if (dto.prices) {
      await this.syncPrices(catalog.id, dto.prices);
    }

    return this.getAdminDetail(catalog.id);
  }

  private async syncPrices(
    catalogId: string,
    inputs: WholesaleCatalogPriceInputDto[],
  ): Promise<void> {
    const variantIds = [...new Set(inputs.map((i) => i.variantId))];
    if (!variantIds.length) return;

    const variants = await this.em.find(ProductVariant, {
      where: { id: In(variantIds) },
    });
    const validIds = new Set(variants.map((v) => v.id));

    for (const input of inputs) {
      if (!validIds.has(input.variantId)) {
        throw new BadRequestException(
          `Geçersiz varyant: ${input.variantId}`,
        );
      }

      const raw = input.price;
      const shouldClear =
        raw === null ||
        raw === undefined ||
        (typeof raw === 'string' && raw.trim() === '');

      const existing = await this.em.findOne(WholesaleCatalogPrice, {
        where: { catalogId, variantId: input.variantId },
      });

      if (shouldClear) {
        if (existing) await this.em.remove(existing);
        continue;
      }

      const price = String(raw).trim().replace(',', '.');
      const num = Number(price);
      if (!Number.isFinite(num) || num < 0) {
        throw new BadRequestException(`Geçersiz fiyat: ${raw}`);
      }
      const normalized = num.toFixed(2);

      if (existing) {
        existing.price = normalized;
        await this.em.save(existing);
      } else {
        await this.em.save(
          this.em.create(WholesaleCatalogPrice, {
            catalogId,
            variantId: input.variantId,
            price: normalized,
          }),
        );
      }
    }
  }

  async regenerateToken(id: string): Promise<WholesaleCatalogAdminDetail> {
    const catalog = await this.em.findOne(WholesaleCatalog, {
      where: { id },
    });
    if (!catalog) throw new NotFoundException('Katalog bulunamadı');
    catalog.token = this.generateToken();
    await this.em.save(catalog);
    return this.getAdminDetail(catalog.id);
  }

  async remove(id: string): Promise<void> {
    const catalog = await this.em.findOne(WholesaleCatalog, {
      where: { id },
    });
    if (!catalog) throw new NotFoundException('Katalog bulunamadı');
    await this.em.remove(catalog);
  }

  private async loadCoffeeProducts(): Promise<Product[]> {
    return this.em
      .createQueryBuilder(Product, 'p')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoinAndSelect('p.variants', 'variants')
      .where('p.is_active = true')
      .andWhere('p.kind IN (:...coffeeKinds)', {
        coffeeKinds: [...COFFEE_KINDS],
      })
      .orderBy('category.sort_order', 'ASC', 'NULLS LAST')
      .addOrderBy('p.name', 'ASC')
      .getMany();
  }

  private async brandName(): Promise<string> {
    const brandRow = await this.em.findOne(SiteSetting, {
      where: { key: 'brand' },
    });
    if (
      brandRow &&
      typeof brandRow.value?.name === 'string' &&
      brandRow.value.name.trim()
    ) {
      return brandRow.value.name.trim();
    }
    return 'Kılıç Coffee Roaster';
  }

  async getPublicCatalog(token: string): Promise<{
    brandName: string;
    businessName: string;
    updatedAt: string | null;
    items: WholesaleCatalogItem[];
  }> {
    const trimmed = (token || '').trim();
    if (!trimmed) throw new NotFoundException('Katalog bulunamadı');

    const catalog = await this.em.findOne(WholesaleCatalog, {
      where: { token: trimmed },
      relations: { prices: true },
    });
    if (!catalog || !catalog.isEnabled) {
      throw new NotFoundException('Katalog bulunamadı');
    }

    const overrideMap = new Map(
      (catalog.prices || []).map((p) => [p.variantId, p.price]),
    );

    const products = await this.loadCoffeeProducts();
    const items: WholesaleCatalogItem[] = products.map((p) => {
      const variants = sortByWeightLabel(
        (p.variants || []).filter((v) => v.isActive),
      ).map((v) => {
        const custom = overrideMap.get(v.id);
        const price = custom ?? v.price;
        return {
          weightLabel: v.weightLabel,
          price,
          listPrice: v.price,
          isCustomPrice: custom != null,
        };
      });

      const first = variants[0];
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription,
        originCountry: p.originCountry,
        originRegion: p.originRegion,
        altitude: p.altitude,
        process: p.process,
        varietal: p.varietal,
        roastLevel: p.roastLevel,
        flavorNotes: p.flavorNotes || [],
        roastedAt: p.roastedAt,
        kind: p.kind,
        currency: p.currency || 'TRY',
        basePrice: first?.price ?? p.basePrice,
        imageUrl: p.imageUrl,
        category: p.category
          ? { name: p.category.name, slug: p.category.slug }
          : null,
        variants,
      };
    });

    return {
      brandName: await this.brandName(),
      businessName: catalog.businessName,
      updatedAt: catalog.updatedAt
        ? new Date(catalog.updatedAt).toISOString()
        : null,
      items,
    };
  }
}
