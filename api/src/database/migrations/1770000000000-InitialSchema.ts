import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * İlk şema: production'da synchronize kapalıyken bu migration kullanılır.
 * Geliştirmede TypeORM synchronize da entity'leri oluşturabilir.
 * Bu dosya referans / boş başlangıçtır; şema için:
 *   yarn migration:generate src/database/migrations/SyncSchema
 * komutu DB ayaktayken çalıştırılmalıdır.
 */
export class InitialSchema1770000000000 implements MigrationInterface {
  name = 'InitialSchema1770000000000';

  public async up(_queryRunner: QueryRunner): Promise<void> {
    // Entity synchronize veya generate edilen migration ile doldurulur.
    // Boş up: seed öncesi geliştirme ortamında synchronize=true tercih edilir.
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // no-op
  }
}
