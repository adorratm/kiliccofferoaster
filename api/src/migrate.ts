import 'reflect-metadata';
import { AppDataSource } from '@database/data-source';

async function run() {
  console.log('[migrate] Connecting…');
  const ds = await AppDataSource.initialize();
  try {
    console.log('[migrate] Running pending migrations…');
    const applied = await ds.runMigrations({ transaction: 'each' });
    if (applied.length === 0) {
      console.log('[migrate] No pending migrations.');
    } else {
      console.log(`[migrate] Applied ${applied.length} migration(s):`);
      for (const m of applied) {
        console.log(`  - ${m.name}`);
      }
    }
  } finally {
    await ds.destroy();
  }
  console.log('[migrate] Done.');
}

run().catch((err) => {
  console.error('[migrate] FAILED:', err);
  process.exit(1);
});
