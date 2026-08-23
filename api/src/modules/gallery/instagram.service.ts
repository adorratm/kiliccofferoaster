import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type IgMedia = {
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

  async fetchRecentMedia(limit = 24): Promise<IgMedia[]> {
    const token = this.config.get<string>('instagram.accessToken');
    if (!token) {
      return [];
    }

    const userId = this.config.get<string>('instagram.userId');
    const base = userId
      ? `https://graph.instagram.com/v21.0/${userId}/media`
      : 'https://graph.instagram.com/me/media';

    const fields =
      'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
    const url = `${base}?fields=${fields}&limit=${Math.min(limit, 50)}&access_token=${encodeURIComponent(token)}`;

    const items: IgMedia[] = [];
    let nextUrl: string | undefined = url;

    while (nextUrl && items.length < limit) {
      const res = await fetch(nextUrl);
      const json = (await res.json()) as IgMediaResponse;
      if (!res.ok || json.error) {
        const msg = json.error?.message || res.statusText || 'Instagram API hatası';
        this.logger.warn(`Instagram API: ${msg}`);
        if (items.length === 0) {
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
