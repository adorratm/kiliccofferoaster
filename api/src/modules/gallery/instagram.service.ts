import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type IgMedia = {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
};

type IgMediaResponse = {
  data?: IgMedia[];
  paging?: { next?: string };
  error?: { message: string };
};

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('instagram.accessToken'));
  }

  profileUrl(): string {
    const username =
      this.config.get<string>('instagram.username') || 'kiliccoffeeroaster';
    return `https://www.instagram.com/${username.replace(/^@/, '')}/`;
  }

  private accessToken(): string | null {
    return this.config.get<string>('instagram.accessToken') || null;
  }

  private mediaBase(path: 'media' | 'stories'): string {
    const userId = this.config.get<string>('instagram.userId');
    if (userId) {
      return `https://graph.instagram.com/v21.0/${userId}/${path}`;
    }
    return `https://graph.instagram.com/v21.0/me/${path}`;
  }

  async fetchRecentMedia(limit = 24): Promise<IgMedia[]> {
    const token = this.accessToken();
    if (!token) return [];

    const fields =
      'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
    const url = `${this.mediaBase('media')}?fields=${fields}&limit=${Math.min(limit, 50)}&access_token=${encodeURIComponent(token)}`;
    return this.paginateMedia(url, limit, true);
  }

  /** Aktif Instagram hikayeleri (≈24 saat). Kalıcı DB’ye yazılmaz. */
  async fetchStories(): Promise<IgMedia[]> {
    const token = this.accessToken();
    if (!token) return [];

    const fields =
      'id,media_type,media_url,thumbnail_url,permalink,timestamp';
    const url = `${this.mediaBase('stories')}?fields=${fields}&access_token=${encodeURIComponent(token)}`;

    try {
      const res = await fetch(url);
      const json = (await res.json()) as IgMediaResponse;
      if (!res.ok || json.error) {
        this.logger.warn(
          `Instagram stories: ${json.error?.message || res.statusText}`,
        );
        return [];
      }
      return (json.data || []).filter(
        (row) => row.media_url || row.thumbnail_url,
      );
    } catch (err) {
      this.logger.warn(
        `Instagram stories fetch failed: ${err instanceof Error ? err.message : err}`,
      );
      return [];
    }
  }

  private async paginateMedia(
    startUrl: string,
    limit: number,
    throwIfEmptyError: boolean,
  ): Promise<IgMedia[]> {
    const items: IgMedia[] = [];
    let nextUrl: string | undefined = startUrl;

    while (nextUrl && items.length < limit) {
      const res = await fetch(nextUrl);
      const json = (await res.json()) as IgMediaResponse;
      if (!res.ok || json.error) {
        const msg =
          json.error?.message || res.statusText || 'Instagram API hatası';
        this.logger.warn(`Instagram API: ${msg}`);
        if (throwIfEmptyError && items.length === 0) {
          throw new BadRequestException(`Instagram API: ${msg}`);
        }
        break;
      }
      for (const row of json.data || []) {
        if (row.media_url || row.thumbnail_url) {
          items.push(row);
        }
        if (items.length >= limit) break;
      }
      nextUrl = json.paging?.next;
    }

    return items.slice(0, limit);
  }
}
