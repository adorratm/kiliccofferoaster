import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { SiteSetting } from '@entities/site-setting.entity';
import { ContentSection } from '@entities/content-section.entity';
import {
  BulkSiteSettingsDto,
  CreateContentSectionDto,
  UpdateContentSectionDto,
} from '@modules/cms/dto/cms.dto';

@Injectable()
export class CmsService {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async getPublicSettings(): Promise<Record<string, Record<string, unknown>>> {
    const rows = await this.em.find(SiteSetting, {
      order: { key: 'ASC' },
    });
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  }

  async listSettingsAdmin(): Promise<SiteSetting[]> {
    return this.em.find(SiteSetting, { order: { key: 'ASC' } });
  }

  async upsertSettings(dto: BulkSiteSettingsDto): Promise<SiteSetting[]> {
    const saved: SiteSetting[] = [];
    for (const item of dto.settings) {
      let row = await this.em.findOne(SiteSetting, {
        where: { key: item.key },
      });
      if (!row) {
        row = this.em.create(SiteSetting, {
          key: item.key,
          value: item.value,
          group: item.group ?? null,
          description: item.description ?? null,
        });
      } else {
        row.value = item.value;
        row.group = item.group ?? row.group;
        row.description = item.description ?? row.description;
      }
      saved.push(await this.em.save(row));
    }
    return saved;
  }

  async getPublicSections(page?: string): Promise<ContentSection[]> {
    const qb = this.em
      .createQueryBuilder(ContentSection, 's')
      .where('s.is_published = :published', { published: true })
      .orderBy('s.sort_order', 'ASC')
      .addOrderBy('s.section_key', 'ASC');

    if (page) {
      qb.andWhere('s.page = :page', { page });
    }

    return qb.getMany();
  }

  async listSectionsAdmin(page?: string): Promise<ContentSection[]> {
    const where = page ? { page } : {};
    return this.em.find(ContentSection, {
      where,
      order: { sortOrder: 'ASC', sectionKey: 'ASC' },
    });
  }

  async createSection(dto: CreateContentSectionDto): Promise<ContentSection> {
    const section = this.em.create(ContentSection, {
      page: dto.page,
      sectionKey: dto.sectionKey,
      title: dto.title ?? null,
      content: dto.content,
      sortOrder: dto.sortOrder ?? 0,
      isPublished: dto.isPublished ?? true,
    });
    return this.em.save(section);
  }

  async updateSection(
    id: string,
    dto: UpdateContentSectionDto,
  ): Promise<ContentSection> {
    const section = await this.em.findOne(ContentSection, { where: { id } });
    if (!section) {
      throw new NotFoundException('İçerik bölümü bulunamadı');
    }
    Object.assign(section, dto);
    return this.em.save(section);
  }

  async removeSection(id: string): Promise<void> {
    const section = await this.em.findOne(ContentSection, { where: { id } });
    if (!section) {
      throw new NotFoundException('İçerik bölümü bulunamadı');
    }
    await this.em.remove(section);
  }
}
