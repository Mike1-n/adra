import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read from DATABASE_URL environment variable or configure via terminal
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

async function runMigrations() {
  if (!connectionString) {
    console.log('ℹ️ Usage: Set DATABASE_URL and run `node scripts/migrate.js`');
    console.log('Example: DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@[HOST]:6543/postgres" node scripts/migrate.js');
    process.exit(1);
  }

  console.log('🔄 Connecting to Supabase PostgreSQL database...');
  
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully to Supabase PostgreSQL!');

    const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
    const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql');

    console.log('📄 Reading schema.sql...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('🚀 Executing schema.sql (Tables, Indexes, RLS Policies, Triggers)...');
    await client.query(schemaSql);
    console.log('✅ Schema executed and tables created successfully!');

    console.log('🌱 Reading seed.sql...');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('🚀 Executing seed.sql (Sample projects, beneficiaries, indicators, finances)...');
    await client.query(seedSql);
    console.log('✅ Seed records inserted successfully!');

    console.log('\n🎉 ALL 12 DATABASE TABLES AND SEED RECORDS ARE LIVE ON YOUR SUPABASE INSTANCE!');
  } catch (err) {
    console.error('❌ Error executing database migration:', err);
  } finally {
    await client.end();
  }
}

runMigrations();
