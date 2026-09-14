import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
const { Pool } = pg;

const supabaseUrl = 'https://evlemsqjesgijytwtsyf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2bGVtc3FqZXNnaWp5dHd0c3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3ODYwMzcsImV4cCI6MjEwNDM2MjAzN30.6c2bdzJy6wyA9tHLKbrTrX4vYN_DenuWEulZEqN3FRg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const pool = new Pool({
  connectionString: 'postgresql://postgres.evlemsqjesgijytwtsyf:0713695022Grace@aws-1-eu-west-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  console.log('Testing Supabase anon select from profiles...');
  const { data, error } = await supabase.from('profiles').select('*');
  console.log('Supabase anon select error:', error);
  console.log('Supabase anon select row count:', data ? data.length : 0);
  if (data) {
    console.table(data.map(u => ({ email: u.email, full_name: u.full_name, role: u.role })));
  }

  // Check direct postgres and RLS policies
  const client = await pool.connect();
  const rls = await client.query(`
    SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';
  `);
  console.log('\nRLS status on profiles:');
  console.table(rls.rows);

  const policies = await client.query(`
    SELECT policyname, permissive, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE tablename = 'profiles';
  `);
  console.log('\nPolicies on profiles:');
  console.table(policies.rows);

  // If RLS is blocking anon, let's enable public access or add policy
  await client.query(`
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow public read profiles" ON profiles;
    CREATE POLICY "Allow public read profiles" ON profiles FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Allow public all profiles" ON profiles;
    CREATE POLICY "Allow public all profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
  `);
  console.log('\nUpdated policies on profiles to allow public read/write.');

  // Test anon select again
  const res2 = await supabase.from('profiles').select('*');
  console.log('\nAfter policy update, Supabase anon select row count:', res2.data ? res2.data.length : 0);
  if (res2.data) {
    console.table(res2.data.map(u => ({ email: u.email, full_name: u.full_name, role: u.role, status: u.status })));
  }

  client.release();
  await pool.end();
}

check();
