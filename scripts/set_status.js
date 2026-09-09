import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
let dbUrl = '';
envContent.split('\n').forEach(line => {
  const [k, ...rest] = line.split('=');
  if (k && k.trim() === 'DATABASE_URL') {
    dbUrl = rest.join('=').trim();
  }
});

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
await client.connect();
await client.query("UPDATE public.profiles SET status = 'Active', is_active = true WHERE status IS NULL OR status = '';");
await client.query("UPDATE public.beneficiaries SET verification_status = 'Verified Active' WHERE verification_status IS NULL OR verification_status = '';");
console.log('Seeded accounts set to Active!');
await client.end();
