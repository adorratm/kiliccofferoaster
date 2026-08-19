import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import * as pg from 'pg';
import { ALL_ENTITIES } from '@database/entities';
import { ALL_MIGRATIONS } from '@database/migrations';

config({ path: join(process.cwd(), '..', '.env') });
config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  driver: pg,
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT || 5432),
  username: process.env.POSTGRES_USER || 'kilic',
  password: process.env.POSTGRES_PASSWORD || 'kilic_secret',
  database: process.env.POSTGRES_DB || 'kiliccoffeeroaster',
  entities: ALL_ENTITIES,
  migrations: ALL_MIGRATIONS,
  migrationsTransactionMode: 'each',
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === 'true',
});
