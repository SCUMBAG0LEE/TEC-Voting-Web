import { getSql, db } from '../src/db';

async function purge() {
  console.log('🗑️ Purging database...');
  try {
    const sql = getSql();
    await sql`DROP SCHEMA public CASCADE;`;
    await sql`CREATE SCHEMA public;`;
    console.log('✅ Database completely wiped.');
  } catch (error) {
    console.error('❌ Purge failed:', error);
  }
}

purge();
