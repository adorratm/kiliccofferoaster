import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { LegalDocument } from '@entities/legal-document.entity';
import { CookieConsentLog } from '@entities/cookie-consent-log.entity';
import {
  CreateLegalDocumentDto,
  UpdateLegalDocumentDto,
  CreateCookieConsentDto,
} from '@modules/legal/dto/legal.dto';

@Injectable()
export class LegalService {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async listAllAdmin(): Promise<LegalDocument[]> {
    return this.em.find(LegalDocument, {
      order: { slug: 'ASC', publishedAt: 'DESC' },
    });
  }

  async getLatestPublished(slug: string): Promise<LegalDocument> {
    const docs = await this.em.find(LegalDocument, {
      where: { slug, isPublished: true },
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
      take: 1,
    });
    const doc = docs[0];
    if (!doc) {
      throw new NotFoundException('Yasal belge bulunamadı');
    }
    return doc;
  }

  async create(dto: CreateLegalDocumentDto): Promise<LegalDocument> {
    const doc = this.em.create(LegalDocument, {
      slug: dto.slug,
      title: dto.title,
      content: dto.content,
      version: dto.version,
      isPublished: dto.isPublished ?? false,
      publishedAt: dto.isPublished ? new Date() : null,
      locale: dto.locale ?? 'tr',
    });
    return this.em.save(doc);
  }

  async update(id: string, dto: UpdateLegalDocumentDto): Promise<LegalDocument> {
    const doc = await this.em.findOne(LegalDocument, { where: { id } });
    if (!doc) {
      throw new NotFoundException('Yasal belge bulunamadı');
    }
    const wasPublished = doc.isPublished;
    Object.assign(doc, dto);
    if (dto.isPublished === true && !wasPublished) {
      doc.publishedAt = new Date();
    }
    if (dto.isPublished === false) {
      doc.publishedAt = null;
    }
    return this.em.save(doc);
  }

  async remove(id: string): Promise<void> {
    const doc = await this.em.findOne(LegalDocument, { where: { id } });
    if (!doc) {
      throw new NotFoundException('Yasal belge bulunamadı');
    }
    await this.em.remove(doc);
  }

  async createCookieConsent(
    dto: CreateCookieConsentDto,
  ): Promise<CookieConsentLog> {
    const log = this.em.create(CookieConsentLog, {
      sessionId: dto.sessionId || `anon-${Date.now()}`,
      userId: dto.userId ?? null,
      necessary: dto.necessary ?? true,
      analytics: dto.analytics ?? false,
      marketing: dto.marketing ?? false,
      userAgent: dto.userAgent ?? null,
      ipHash: dto.ipHash ?? null,
    });
    return this.em.save(log);
  }
}
