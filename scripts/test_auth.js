import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [k, ...v] = trimmed.split('=');
      if (k) process.env[k.trim()] = v.join('=').trim();
    }
  });
} catch (e) {}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const connectionString = process.env.DATABASE_URL;

async function check() {
  console.log('1. Checking Postgres direct connection...');
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  console.log('2. Querying public.profiles from Postgres:');
  const profRes = await client.query('SELECT * FROM public.profiles WHERE email = $1', ['admin@adra.org']);
  console.log('Admin in public.profiles:', profRes.rows);

  console.log('3. Testing Supabase JS client query to public.profiles with anon key...');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: clientProfiles, error: clientErr } = await supabase.from('profiles').select('*');
  if (clientErr) {
    console.error('Anon client select error:', clientErr.message);
  } else {
    console.log('SUCCESS! Profiles fetched via Supabase Client:');
    console.table(clientProfiles);
  }

  console.log('4. Testing Supabase JS client query to public.beneficiaries with anon key...');
  const { data: clientBens, error: benErr } = await supabase.from('beneficiaries').select('*');
  if (benErr) {
    console.error('Anon client beneficiaries error:', benErr.message);
  } else {
    console.log(`SUCCESS! ${clientBens.length} beneficiaries fetched via Supabase Client.`);
  }

  await client.end();
}

check().catch(console.error);
