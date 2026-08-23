import { MigrationInterface, QueryRunner } from 'typeorm';

export class GalleryUrlText1789000000000 implements MigrationInterface {
  name = 'GalleryUrlText1789000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "gallery_items" ALTER COLUMN "media_url" TYPE text`,
    );
    await queryRunner.query(
      `ALTER TABLE "gallery_items" ALTER COLUMN "thumbnail_url" TYPE text`,
    );
    await queryRunner.query(
      `ALTER TABLE "gallery_items" ALTER COLUMN "permalink" TYPE text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "gallery_items" ALTER COLUMN "permalink" TYPE varchar(800)`,
    );
    await queryRunner.query(
      `ALTER TABLE "gallery_items" ALTER COLUMN "thumbnail_url" TYPE varchar(800)`,
    );
    await queryRunner.query(
      `ALTER TABLE "gallery_items" ALTER COLUMN "media_url" TYPE varchar(800)`,
    );
  }
}
