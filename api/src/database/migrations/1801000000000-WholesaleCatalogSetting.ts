import { MigrationInterface, QueryRunner } from 'typeorm';
import { randomBytes } from 'crypto';

/**
 * Toptan işletmelere paylaşılan gizli katalog linki için site_settings kaydı.
 * Token public /cms/settings yanıtında filtrelenir.
 */
export class WholesaleCatalogSetting1801000000000
  implements MigrationInterface
{
  name = 'WholesaleCatalogSetting1801000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const token = randomBytes(24).toString('base64url');
    const value = JSON.stringify({ token, enabled: true });

    await queryRunner.query(
      `
      INSERT INTO site_settings (id, key, value, "group", description, created_at, updated_at)
      SELECT gen_random_uuid(),
             'wholesale_catalog',
             $1::jsonb,
             'private',
             'Toptan katalog paylaşım tokenı (public CMS ayarlarında görünmez)',
             now(),
             now()
      WHERE NOT EXISTS (SELECT 1 FROM site_settings WHERE key = 'wholesale_catalog')
      `,
      [value],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM site_settings WHERE key = 'wholesale_catalog'`,
    );
  }
}
