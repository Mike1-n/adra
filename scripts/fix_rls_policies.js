import pg from 'pg';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const line = envContent.split('\n').find(l => l.startsWith('DATABASE_URL='));
const dbUrl = line.substring('DATABASE_URL='.length).trim();

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
await client.connect();

// Enable insert & update on profiles for public/anon
await client.query(`
  DROP POLICY IF EXISTS "Allow public insert for pending accounts" ON public.profiles;
  CREATE POLICY "Allow public insert for pending accounts"
    ON public.profiles
    FOR INSERT
    TO public
    WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow public update profiles" ON public.profiles;
  CREATE POLICY "Allow public update profiles"
    ON public.profiles
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);
`);

console.log('Successfully updated RLS policies on public.profiles!');
await client.end();
