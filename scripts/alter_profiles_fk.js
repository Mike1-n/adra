import pg from 'pg';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const line = envContent.split('\n').find(l => l.startsWith('DATABASE_URL='));
const dbUrl = line.substring('DATABASE_URL='.length).trim();

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
await client.connect();

await client.query(`
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
  ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
`);

console.log('Successfully updated profiles schema to allow direct self-registration and admin inserts!');
await client.end();
