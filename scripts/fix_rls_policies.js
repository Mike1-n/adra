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

  -- Enable RLS on beneficiaries with full CRUD policies for anon and authenticated users
  ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Allow anon and auth read on beneficiaries" ON public.beneficiaries;
  CREATE POLICY "Allow anon and auth read on beneficiaries"
    ON public.beneficiaries
    FOR SELECT
    TO public
    USING (true);

  DROP POLICY IF EXISTS "Allow public insert beneficiaries" ON public.beneficiaries;
  CREATE POLICY "Allow public insert beneficiaries"
    ON public.beneficiaries
    FOR INSERT
    TO public
    WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow public update beneficiaries" ON public.beneficiaries;
  CREATE POLICY "Allow public update beneficiaries"
    ON public.beneficiaries
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow public delete beneficiaries" ON public.beneficiaries;
  CREATE POLICY "Allow public delete beneficiaries"
    ON public.beneficiaries
    FOR DELETE
    TO public
    USING (true);
`);

console.log('Successfully updated RLS policies on public.profiles and public.beneficiaries!');
await client.end();
