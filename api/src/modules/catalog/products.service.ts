import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Product } from '@entities/product.entity';
import {
  CreateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from '@modules/catalog/dto/catalog.dto';
import {
  paginateResult,
  PaginatedResult,
} from '@common/utils/pagination';

@Injectable()
export class ProductsService {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async findAllPublic(
    query: ProductQueryDto = {},
  ): Promise<PaginatedResult<Product>> {
    return this.queryProducts({ ...query, includeInactive: false });
  }

  async findAllAdmin(
    query: ProductQueryDto = {},
  ): Promise<PaginatedResult<Product>> {
    return this.queryProducts({
      ...query,
      includeInactive: query.includeInactive ?? true,
    });
  }

  private async queryProducts(
    query: ProductQueryDto,
  ): Promise<PaginatedResult<Product>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 12;
    const sort = query.sort || 'name';
    const orderDir = (query.order || (sort === 'name' ? 'asc' : 'desc')).toUpperCase() as
      | 'ASC'
      | 'DESC';

    const qb = this.em
      .createQueryBuilder(Product, 'p')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoinAndSelect('p.variants', 'variants');

    if (!query.includeInactive) {
      qb.andWhere('p.is_active = true');
    }

    if (query.featured === true) {
      qb.andWhere('p.is_featured = true');
    }

    if (query.categoryId) {
      qb.andWhere('p.category_id = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.categorySlug) {
      qb.andWhere('category.slug = :categorySlug', {
        categorySlug: query.categorySlug,
      });
    }

    if (query.roastLevel) {
      qb.andWhere('p.roast_level ILIKE :roastLevel', {
        roastLevel: `%${query.roastLevel}%`,
      });
    }

    if (query.originCountry) {
      qb.andWhere('p.origin_country ILIKE :originCountry', {
        originCountry: `%${query.originCountry}%`,
      });
    }

    if (query.minPrice != null && !Number.isNaN(query.minPrice)) {
      qb.andWhere('p.base_price >= :minPrice', { minPrice: query.minPrice });
    }

    if (query.maxPrice != null && !Number.isNaN(query.maxPrice)) {
      qb.andWhere('p.base_price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    if (query.q?.trim()) {
      const q = `%${query.q.trim()}%`;
      qb.andWhere(
        `(
          p.name ILIKE :q OR
          p.slug ILIKE :q OR
          p.description ILIKE :q OR
          COALESCE(p.short_description, '') ILIKE :q OR
          COALESCE(p.origin_country, '') ILIKE :q OR
          COALESCE(p.origin_region, '') ILIKE :q OR
          COALESCE(p.process, '') ILIKE :q OR
          COALESCE(p.varietal, '') ILIKE :q OR
          COALESCE(p.batch_id, '') ILIKE :q OR
          COALESCE(p.roast_level, '') ILIKE :q OR
          COALESCE(p.badge, '') ILIKE :q OR
          EXISTS (
            SELECT 1 FROM unnest(p.flavor_notes) AS note
            WHERE note ILIKE :q
          )
        )`,
        { q },
      );
    }

    const sortMap: Record<string, string> = {
      name: 'p.name',
      price: 'p.base_price',
      createdAt: 'p.created_at',
      stock: 'p.stock',
    };
    qb.orderBy(sortMap[sort] || 'p.name', orderDir);

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return paginateResult(items, total, page, limit);
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.em.findOne(Product, {
      where: { slug, isActive: true },
      relations: { category: true, variants: true },
    });
    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }
    return product;
  }

  async findById(id: string): Promise<Product> {
    const product = await this.em.findOne(Product, {
      where: { id },
      relations: { category: true, variants: true },
    });
    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const exists = await this.em.findOne(Product, { where: { slug: dto.slug } });
    if (exists) {
      throw new ConflictException('Bu slug zaten kullanılıyor');
    }
    const product = this.em.create(Product, {
      slug: dto.slug,
      name: dto.name,
      description: dto.description,
      shortDescription: dto.shortDescription ?? null,
      originCountry: dto.originCountry ?? null,
      originRegion: dto.originRegion ?? null,
      altitude: dto.altitude ?? null,
      process: dto.process ?? null,
      varietal: dto.varietal ?? null,
      batchId: dto.batchId ?? null,
      roastLevel: dto.roastLevel ?? null,
      flavorNotes: dto.flavorNotes ?? [],
      flavorGeometry: dto.flavorGeometry ?? null,
      roastLog: dto.roastLog ?? null,
      imageUrl: dto.imageUrl ?? null,
      gallery: dto.gallery ?? [],
      badge: dto.badge ?? null,
      basePrice: dto.basePrice,
      currency: dto.currency ?? 'TRY',
      stock: dto.stock ?? 0,
      isActive: dto.isActive ?? true,
      isFeatured: dto.isFeatured ?? false,
      categoryId: dto.categoryId ?? null,
    });
    return this.em.save(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findById(id);
    if (dto.slug && dto.slug !== product.slug) {
      const exists = await this.em.findOne(Product, {
        where: { slug: dto.slug },
      });
      if (exists) {
        throw new ConflictException('Bu slug zaten kullanılıyor');
      }
    }
    Object.assign(product, {
      ...dto,
      shortDescription:
        dto.shortDescription !== undefined
          ? dto.shortDescription
          : product.shortDescription,
      categoryId:
        dto.categoryId !== undefined ? dto.categoryId : product.categoryId,
    });
    return this.em.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findById(id);
    await this.em.remove(product);
  }
}
