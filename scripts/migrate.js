import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Auto-read .env file if DATABASE_URL is not set in process environment
function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^DATABASE_URL=(.*)$/m);
    if (match) return match[1].trim().replace(/^["']|["']$/g, '');
  }
  return null;
}

const connectionString = getDatabaseUrl();

async function runMigrations() {
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL not found in environment or .env file.');
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
    console.log('✅ Schema executed successfully!');

    console.log('🌱 Reading seed.sql...');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('🚀 Executing seed.sql (Sample projects, beneficiaries, indicators, finances)...');
    await client.query(seedSql);
    console.log('✅ Seed records inserted successfully!');

    console.log('\n🎉 ALL 12 DATABASE TABLES AND SEED RECORDS ARE SYNCHRONIZED ON SUPABASE!');
  } catch (err) {
    console.error('❌ Error executing database migration:', err);
  } finally {
    await client.end();
  }
}

runMigrations();
