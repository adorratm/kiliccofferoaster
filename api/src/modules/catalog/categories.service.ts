import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Category } from '@entities/category.entity';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '@modules/catalog/dto/catalog.dto';

@Injectable()
export class CategoriesService {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async findAllPublic(): Promise<Category[]> {
    return this.em.find(Category, {
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findAllAdmin(): Promise<Category[]> {
    return this.em.find(Category, {
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.em.findOne(Category, {
      where: { slug, isActive: true },
    });
    if (!category) {
      throw new NotFoundException('Kategori bulunamadı');
    }
    return category;
  }

  async findById(id: string): Promise<Category> {
    const category = await this.em.findOne(Category, { where: { id } });
    if (!category) {
      throw new NotFoundException('Kategori bulunamadı');
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const exists = await this.em.findOne(Category, {
      where: { slug: dto.slug },
    });
    if (exists) {
      throw new ConflictException('Bu slug zaten kullanılıyor');
    }
    const category = this.em.create(Category, {
      ...dto,
      description: dto.description ?? null,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    });
    return this.em.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(id);
    if (dto.slug && dto.slug !== category.slug) {
      const exists = await this.em.findOne(Category, {
        where: { slug: dto.slug },
      });
      if (exists) {
        throw new ConflictException('Bu slug zaten kullanılıyor');
      }
    }
    Object.assign(category, dto);
    return this.em.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findById(id);
    await this.em.remove(category);
  }
}
