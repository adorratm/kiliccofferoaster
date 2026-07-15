import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export type UploadResult = {
  key: string;
  url: string;
  provider: 's3' | 'local';
};

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client | null;
  private readonly bucket: string;
  private readonly region: string;
  private readonly cdnUrl: string;
  private readonly localDir: string;
  private readonly apiUrl: string;

  constructor(private readonly config: ConfigService) {
    this.region = this.config.get<string>('aws.region') || 'eu-central-1';
    this.bucket = this.config.get<string>('aws.s3Bucket') || '';
    this.cdnUrl = (this.config.get<string>('aws.cdnUrl') || '').replace(
      /\/$/,
      '',
    );
    this.apiUrl = (this.config.get<string>('apiUrl') || 'http://localhost:4000').replace(
      /\/$/,
      '',
    );
    this.localDir = join(process.cwd(), 'uploads');

    const accessKey = this.config.get<string>('aws.accessKeyId');
    const secretKey = this.config.get<string>('aws.secretAccessKey');

    this.s3 =
      this.bucket && accessKey && secretKey
        ? new S3Client({
            region: this.region,
            credentials: {
              accessKeyId: accessKey,
              secretAccessKey: secretKey,
            },
          })
        : null;

    if (!this.s3) {
      this.logger.warn(
        'AWS S3 yapılandırılmadı — görseller yerel uploads/ klasörüne kaydedilecek',
      );
    }
  }

  isS3Enabled(): boolean {
    return this.s3 !== null;
  }

  buildKey(folder: string, filename: string): string {
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
    const date = new Date().toISOString().slice(0, 10);
    return `${folder}/${date}/${randomUUID()}-${safeName}`;
  }

  async upload(
    buffer: Buffer,
    key: string,
    mimeType: string,
  ): Promise<UploadResult> {
    if (this.s3) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );

      const url = this.cdnUrl
        ? `${this.cdnUrl}/${key}`
        : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

      return { key, url, provider: 's3' };
    }

    await mkdir(this.localDir, { recursive: true });
    const filePath = join(this.localDir, key.replace(/\//g, '_'));
    await writeFile(filePath, buffer);

    return {
      key,
      url: `${this.apiUrl}/uploads/${key.replace(/\//g, '_')}`,
      provider: 'local',
    };
  }

  async delete(key: string, provider: string): Promise<void> {
    if (provider === 's3' && this.s3) {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return;
    }

    const filePath = join(this.localDir, key.replace(/\//g, '_'));
    try {
      await unlink(filePath);
    } catch {
      // ignore missing local files
    }
  }
}
