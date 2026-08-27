import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountingAndCatalog1782000000000 implements MigrationInterface {
  name = 'AccountingAndCatalog1782000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
        ADD COLUMN IF NOT EXISTS "kind" varchar(40) NOT NULL DEFAULT 'other',
        ADD COLUMN IF NOT EXISTS "unit" varchar(20) NOT NULL DEFAULT 'adet',
        ADD COLUMN IF NOT EXISTS "vat_rate" decimal(5,2) NOT NULL DEFAULT 20
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "users_role_enum" ADD VALUE 'staff';
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "users_role_enum" ADD VALUE 'accountant';
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "parties_type_enum" AS ENUM ('customer', 'supplier');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "parties" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "type" "parties_type_enum" NOT NULL,
        "title" varchar(200) NOT NULL,
        "tax_number" varchar(11),
        "tax_office" varchar(120),
        "email" varchar(255),
        "phone" varchar(40),
        "address" varchar(300),
        "city" varchar(80),
        "district" varchar(20),
        "is_einvoice" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "balance" decimal(14,2) NOT NULL DEFAULT 0,
        "client_id" varchar(80),
        "notes" text,
        CONSTRAINT "PK_parties" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_parties_tax_number" ON "parties" ("tax_number")`,
    );

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "invoices_direction_enum" AS ENUM ('sales', 'purchase');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "invoices_status_enum" AS ENUM (
          'draft', 'queued', 'sent', 'accepted', 'rejected', 'cancelled'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "invoices_edocument_type_enum" AS ENUM ('earchive', 'einvoice', 'none');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoices" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "invoice_number" varchar(40) NOT NULL,
        "direction" "invoices_direction_enum" NOT NULL,
        "status" "invoices_status_enum" NOT NULL DEFAULT 'draft',
        "edocument_type" "invoices_edocument_type_enum" NOT NULL DEFAULT 'none',
        "party_id" uuid,
        "order_id" uuid,
        "issue_date" date NOT NULL,
        "due_date" date,
        "currency" varchar(3) NOT NULL DEFAULT 'TRY',
        "subtotal" decimal(14,2) NOT NULL DEFAULT 0,
        "tax_amount" decimal(14,2) NOT NULL DEFAULT 0,
        "total" decimal(14,2) NOT NULL DEFAULT 0,
        "paid_amount" decimal(14,2) NOT NULL DEFAULT 0,
        "notes" text,
        "ettn" varchar(80),
        "gib_uuid" varchar(80),
        "provider_status" varchar(80),
        "provider_payload" jsonb,
        "queued_at" TIMESTAMPTZ,
        "sent_at" TIMESTAMPTZ,
        "client_id" varchar(80),
        CONSTRAINT "PK_invoices" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_invoices_number" UNIQUE ("invoice_number"),
        CONSTRAINT "FK_invoices_party" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_invoices_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoice_lines" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "invoice_id" uuid NOT NULL,
        "sort_order" int NOT NULL DEFAULT 0,
        "description" varchar(300) NOT NULL,
        "product_id" uuid,
        "variant_id" uuid,
        "quantity" decimal(12,3) NOT NULL DEFAULT 1,
        "unit" varchar(20) NOT NULL DEFAULT 'adet',
        "unit_price" decimal(14,4) NOT NULL,
        "vat_rate" decimal(5,2) NOT NULL DEFAULT 20,
        "line_net" decimal(14,2) NOT NULL DEFAULT 0,
        "line_vat" decimal(14,2) NOT NULL DEFAULT 0,
        "line_total" decimal(14,2) NOT NULL DEFAULT 0,
        CONSTRAINT "PK_invoice_lines" PRIMARY KEY ("id"),
        CONSTRAINT "FK_invoice_lines_invoice" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_invoice_lines_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_invoice_lines_variant" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "cash_accounts_kind_enum" AS ENUM ('cash', 'bank', 'paytr', 'pos');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cash_accounts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "name" varchar(120) NOT NULL,
        "kind" "cash_accounts_kind_enum" NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'TRY',
        "opening_balance" decimal(14,2) NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "client_id" varchar(80),
        CONSTRAINT "PK_cash_accounts" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "cash_entries_type_enum" AS ENUM ('in', 'out');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cash_entries" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "account_id" uuid NOT NULL,
        "type" "cash_entries_type_enum" NOT NULL,
        "amount" decimal(14,2) NOT NULL,
        "entry_date" date NOT NULL,
        "description" varchar(240),
        "party_id" uuid,
        "invoice_id" uuid,
        "source" varchar(40),
        "source_id" varchar(80),
        "client_id" varchar(80),
        CONSTRAINT "PK_cash_entries" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cash_entries_account" FOREIGN KEY ("account_id") REFERENCES "cash_accounts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cash_entries_party" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_cash_entries_invoice" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_cash_entries_date" ON "cash_entries" ("entry_date")`,
    );

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "stock_movements_type_enum" AS ENUM (
          'in', 'out', 'count', 'sale', 'return', 'purchase'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stock_movements" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "product_id" uuid,
        "variant_id" uuid,
        "type" "stock_movements_type_enum" NOT NULL,
        "quantity" int NOT NULL,
        "balance_after" int,
        "source" varchar(40),
        "source_id" varchar(80),
        "note" varchar(240),
        "client_id" varchar(80),
        CONSTRAINT "PK_stock_movements" PRIMARY KEY ("id"),
        CONSTRAINT "FK_stock_movements_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_stock_movements_variant" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_stock_movements_source" ON "stock_movements" ("source_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "okc_sales" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "external_key" varchar(120) NOT NULL,
        "sale_date" date NOT NULL,
        "z_no" varchar(40),
        "receipt_no" varchar(40),
        "total" decimal(14,2) NOT NULL,
        "tax_amount" decimal(14,2) NOT NULL DEFAULT 0,
        "cash_amount" decimal(14,2) NOT NULL DEFAULT 0,
        "card_amount" decimal(14,2) NOT NULL DEFAULT 0,
        "item_count" int,
        "description" text,
        "raw" jsonb,
        "cash_entry_id" uuid,
        "client_id" varchar(80),
        CONSTRAINT "PK_okc_sales" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_okc_sales_external_key" UNIQUE ("external_key")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "accounting_settings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "company_title" varchar(200) NOT NULL DEFAULT 'Kılıç Coffee Roaster',
        "vkn" varchar(11),
        "tax_office" varchar(120),
        "address" varchar(300),
        "city" varchar(80),
        "earchive_prefix" varchar(8) NOT NULL DEFAULT 'ARC',
        "einvoice_prefix" varchar(8) NOT NULL DEFAULT 'INV'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "accounting_settings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "okc_sales"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stock_movements"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "stock_movements_type_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cash_entries"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "cash_entries_type_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cash_accounts"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "cash_accounts_kind_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoice_lines"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "invoices_edocument_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "invoices_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "invoices_direction_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "parties"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "parties_type_enum"`);
    await queryRunner.query(`
      ALTER TABLE "products"
        DROP COLUMN IF EXISTS "kind",
        DROP COLUMN IF EXISTS "unit",
        DROP COLUMN IF EXISTS "vat_rate"
    `);
  }
}
