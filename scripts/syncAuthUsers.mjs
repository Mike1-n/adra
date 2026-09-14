import pkg from 'pg';
const { Client } = pkg;
import { createClient } from '@supabase/supabase-js';

const connectionString = 'postgresql://postgres.evlemsqjesgijytwtsyf:0713695022Grace@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

const url = 'https://evlemsqjesgijytwtsyf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2bGVtc3FqZXNnaWp5dHd0c3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3ODYwMzcsImV4cCI6MjEwNDM2MjAzN30.6c2bdzJy6wyA9tHLKbrTrX4vYN_DenuWEulZEqN3FRg';
const supabase = createClient(url, key);

async function sync() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database...');

    // 1. Ensure pgcrypto extension
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

    // 2. Sync public.profiles into auth.users
    const syncUsersQuery = `
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at,
        is_sso_user,
        deleted_at,
        is_anonymous
      )
      SELECT
        '00000000-0000-0000-0000-000000000000'::uuid,
        p.id,
        'authenticated',
        'authenticated',
        LOWER(TRIM(p.email)),
        '$2a$10$9TZYA95lD8p8971FgWqdBuDRLCjSgWPTss4/bzutcT0Geet56fpJi', -- Bcrypt for Password123!
        NOW(),
        NULL,
        '',
        NULL,
        '',
        NULL,
        '',
        '',
        NULL,
        NULL,
        '{"provider":"email","providers":["email"]}'::jsonb,
        json_build_object(
          'sub', p.id::text,
          'email', LOWER(TRIM(p.email)),
          'email_verified', true,
          'phone_verified', false,
          'full_name', p.full_name,
          'role', p.role
        )::jsonb,
        NULL,
        COALESCE(p.created_at, NOW()),
        NOW(),
        p.phone,
        NULL,
        '',
        '',
        NULL,
        '',
        0,
        NULL,
        '',
        NULL,
        false,
        NULL,
        false
      FROM public.profiles p
      WHERE p.email IS NOT NULL AND p.email != ''
      ON CONFLICT (id) DO UPDATE
      SET
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = NOW(),
        confirmation_token = '',
        recovery_token = '',
        email_change_token_new = '',
        email_change = '',
        raw_app_meta_data = EXCLUDED.raw_app_meta_data,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data,
        updated_at = NOW();
    `;
    const userResult = await client.query(syncUsersQuery);
    console.log(`Synced users: ${userResult.rowCount} rows inserted/updated in auth.users.`);

    // 3. Fix any NULL tokens in auth.users
    await client.query(`
      UPDATE auth.users
      SET 
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change = COALESCE(email_change, ''),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW());
    `);
    console.log('Fixed NULL tokens across all auth.users.');

    // 4. Sync auth.identities
    const syncIdentitiesQuery = `
      INSERT INTO auth.identities (
        id,
        provider_id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      )
      SELECT
        gen_random_uuid(),
        u.id::text,
        u.id,
        json_build_object(
          'sub', u.id::text,
          'email', u.email,
          'email_verified', true,
          'phone_verified', false
        )::jsonb,
        'email',
        NOW(),
        NOW(),
        NOW()
      FROM auth.users u
      WHERE u.id NOT IN (SELECT user_id FROM auth.identities WHERE provider = 'email');
    `;
    const idResult = await client.query(syncIdentitiesQuery);
    console.log(`Synced identities: ${idResult.rowCount} rows added to auth.identities.`);

    // 5. Update existing identities with proper sub and email
    await client.query(`
      UPDATE auth.identities i
      SET identity_data = json_build_object(
        'sub', u.id::text,
        'email', u.email,
        'email_verified', true,
        'phone_verified', false
      )::jsonb
      FROM auth.users u
      WHERE i.user_id = u.id AND i.provider = 'email';
    `);
    console.log('Updated existing identities data.');

    // 6. Test login via Supabase client for multiple roles
    console.log('\n--- Verifying Supabase Auth Sign In for All Core Roles ---');
    const testAccounts = [
      'admin@adra.org',
      'program.manager@adra.org',
      'supervisor@adra.org',
      'project.officer@adra.org',
      'finance.officer@adra.org',
      'field.worker@adra.org',
      'mary.nyambura@adra.community'
    ];

    for (const email of testAccounts) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: 'Password123!'
      });
      if (error) {
        console.error(`❌ ${email}: ${error.message}`);
      } else {
        console.log(`✅ ${email}: Sign in SUCCESSFUL (User ID: ${data.user.id})`);
      }
    }

    const authCount = await client.query('SELECT count(*) FROM auth.users;');
    const profCount = await client.query('SELECT count(*) FROM public.profiles;');
    console.log(`\nFinal Counts -> auth.users: ${authCount.rows[0].count} | public.profiles: ${profCount.rows[0].count}`);

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

sync();
