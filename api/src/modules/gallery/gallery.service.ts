import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { GalleryItem } from '@entities/gallery-item.entity';
import {
  CreateGalleryItemDto,
  UpdateGalleryItemDto,
} from '@modules/gallery/dto/gallery.dto';
import { InstagramService } from '@modules/gallery/instagram.service';

export type PublicGalleryResponse = {
  instagram: GalleryItem[];
  uploads: GalleryItem[];
  instagramProfile: string;
  instagramConfigured: boolean;
  instagramSyncedAt: string | null;
};

@Injectable()
export class GalleryService {
  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly instagram: InstagramService,
  ) {}

  async findPublic(): Promise<PublicGalleryResponse> {
    const items = await this.em.find(GalleryItem, {
      where: { isVisible: true },
      order: {
        sortOrder: 'ASC',
        publishedAt: 'DESC',
        createdAt: 'DESC',
      },
    });

    const instagram = items.filter((i) => i.source === 'instagram');
    const uploads = items.filter((i) => i.source === 'upload');

    const lastIg = await this.em
      .createQueryBuilder(GalleryItem, 'g')
      .where("g.source = 'instagram'")
      .orderBy('g.updated_at', 'DESC')
      .getOne();

    return {
      instagram,
      uploads,
      instagramProfile: this.instagram.profileUrl(),
      instagramConfigured: this.instagram.isConfigured(),
      instagramSyncedAt: lastIg?.updatedAt?.toISOString() ?? null,
    };
  }

  async findAllAdmin(): Promise<GalleryItem[]> {
    return this.em.find(GalleryItem, {
      order: {
        source: 'ASC',
        sortOrder: 'ASC',
        publishedAt: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  async createUpload(dto: CreateGalleryItemDto): Promise<GalleryItem> {
    const item = this.em.create(GalleryItem, {
      source: 'upload',
      instagramId: null,
      mediaUrl: dto.mediaUrl.trim(),
      thumbnailUrl: dto.thumbnailUrl?.trim() || null,
      permalink: dto.permalink?.trim() || null,
      caption: dto.caption?.trim() || null,
      mediaType: 'IMAGE',
      sortOrder: dto.sortOrder ?? 0,
      isVisible: dto.isVisible ?? true,
      publishedAt: new Date(),
    });
    return this.em.save(item);
  }

  async update(id: string, dto: UpdateGalleryItemDto): Promise<GalleryItem> {
    const item = await this.em.findOne(GalleryItem, { where: { id } });
    if (!item) {
      throw new NotFoundException('Galeri öğesi bulunamadı');
    }
    if (item.source === 'instagram' && dto.mediaUrl) {
      throw new BadRequestException(
        'Instagram gönderilerinin görseli senkronizasyon ile güncellenir',
      );
    }
    Object.assign(item, {
      ...(dto.mediaUrl !== undefined ? { mediaUrl: dto.mediaUrl.trim() } : {}),
      ...(dto.thumbnailUrl !== undefined
        ? { thumbnailUrl: dto.thumbnailUrl?.trim() || null }
        : {}),
      ...(dto.caption !== undefined
        ? { caption: dto.caption?.trim() || null }
        : {}),
      ...(dto.permalink !== undefined
        ? { permalink: dto.permalink?.trim() || null }
        : {}),
      ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      ...(dto.isVisible !== undefined ? { isVisible: dto.isVisible } : {}),
    });
    return this.em.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.em.findOne(GalleryItem, { where: { id } });
    if (!item) {
      throw new NotFoundException('Galeri öğesi bulunamadı');
    }
    await this.em.remove(item);
  }

  async syncInstagram(): Promise<{ synced: number; total: number }> {
    if (!this.instagram.isConfigured()) {
      throw new BadRequestException(
        'Instagram yapılandırılmadı. INSTAGRAM_ACCESS_TOKEN env değişkenini ayarlayın.',
      );
    }

    const remote = await this.instagram.fetchRecentMedia(30);
    let synced = 0;

    for (const [index, row] of remote.entries()) {
      const mediaUrl = row.media_url || row.thumbnail_url;
      if (!mediaUrl) continue;

      let item = await this.em.findOne(GalleryItem, {
        where: { instagramId: row.id },
      });

      const payload = {
        source: 'instagram' as const,
        instagramId: row.id,
        mediaUrl,
        thumbnailUrl: row.thumbnail_url || null,
        permalink: row.permalink || null,
        caption: row.caption?.trim() || null,
        mediaType: row.media_type || 'IMAGE',
        sortOrder: index,
        isVisible: true,
        publishedAt: row.timestamp ? new Date(row.timestamp) : new Date(),
      };

      if (item) {
        Object.assign(item, payload);
      } else {
        item = this.em.create(GalleryItem, payload);
      }
      await this.em.save(item);
      synced += 1;
    }

    return { synced, total: remote.length };
  }
}
