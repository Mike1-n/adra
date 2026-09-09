import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env manually
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        if (key && values.length > 0) {
          process.env[key.trim()] = values.join('=').trim();
        }
      }
    });
  }
} catch (e) {
  console.error('Error reading .env file:', e.message);
}

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

const USERS_TO_SEED = [
  {
    email: 'admin@adra.org',
    password: 'Password123!',
    full_name: 'Dr. Elizabeth Warren',
    role: 'Administrator',
    phone: '+211-920-000001',
    department: 'Executive Country Leadership',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    email: 'project.officer@adra.org',
    password: 'Password123!',
    full_name: 'John Mwangi',
    role: 'Project Officer',
    phone: '+211-920-000004',
    department: 'Humanitarian Operations',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    email: 'finance.officer@adra.org',
    password: 'Password123!',
    full_name: 'Alex Morgan',
    role: 'Finance Officer',
    phone: '+211-920-000006',
    department: 'Financial Control & Grants',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  },
  {
    email: 'program.manager@adra.org',
    password: 'Password123!',
    full_name: 'Grace Ochieng',
    role: 'Program Manager',
    phone: '+211-920-000002',
    department: 'Emergency Response & Programs',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    email: 'field.worker@adra.org',
    password: 'Password123!',
    full_name: 'Amina Abdi',
    role: 'Field Worker',
    phone: '+211-920-000005',
    department: 'Community Mobilization',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80'
  },
  {
    email: 'mary.nyambura@adra.community',
    password: 'Password123!',
    full_name: 'Mary Nyambura',
    role: 'Beneficiary',
    phone: '+254-718-920114',
    department: 'Community Self-Help Group (Lodwar)',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  }
];

async function run() {
  if (!connectionString) {
    console.error('DATABASE_URL not set in .env');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL!');

    // Ensure extensions
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // Update role constraint in public.profiles to accept all roles
    await client.query(`
      ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
      ALTER TABLE public.profiles 
      ADD CONSTRAINT profiles_role_check 
      CHECK (role IN ('Administrator', 'Program Manager', 'Supervisor', 'Project Officer', 'Field Worker', 'Finance Officer', 'M&E Officer', 'Supplier', 'Donor', 'Beneficiary'));
    `);

    // Enable RLS and add public read policy so frontend can look up profiles for login
    await client.query(`
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow anon and auth read on profiles" ON public.profiles;
      CREATE POLICY "Allow anon and auth read on profiles" ON public.profiles FOR SELECT TO public USING (true);
      
      DROP POLICY IF EXISTS "Allow anon and auth read on beneficiaries" ON public.beneficiaries;
      CREATE POLICY "Allow anon and auth read on beneficiaries" ON public.beneficiaries FOR SELECT TO public USING (true);
    `);
    console.log('Configured RLS policies for profiles and beneficiaries.');

    // Seed each user
    for (const u of USERS_TO_SEED) {
      console.log(`Processing user: ${u.email} (${u.role})...`);

      // Check auth.users
      const userRes = await client.query('SELECT id FROM auth.users WHERE email = $1;', [u.email]);
      let userId;

      if (userRes.rows.length > 0) {
        userId = userRes.rows[0].id;
        await client.query(`
          UPDATE auth.users 
          SET encrypted_password = crypt($1, gen_salt('bf')),
              updated_at = NOW(),
              email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
              raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
              raw_user_meta_data = jsonb_build_object('full_name', $2::text, 'role', $3::text)
          WHERE id = $4;
        `, [u.password, u.full_name, u.role, userId]);
      } else {
        const insertRes = await client.query(`
          INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            aud,
            role,
            created_at,
            updated_at
          ) VALUES (
            gen_random_uuid(),
            '00000000-0000-0000-0000-000000000000',
            $1,
            crypt($2, gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('full_name', $3::text, 'role', $4::text),
            'authenticated',
            'authenticated',
            NOW(),
            NOW()
          )
          RETURNING id;
        `, [u.email, u.password, u.full_name, u.role]);

        userId = insertRes.rows[0].id;
      }

      // Upsert into public.profiles
      await client.query(`
        INSERT INTO public.profiles (
          id,
          email,
          full_name,
          role,
          phone,
          department,
          avatar_url,
          is_active,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          role = EXCLUDED.role,
          phone = EXCLUDED.phone,
          department = EXCLUDED.department,
          avatar_url = EXCLUDED.avatar_url,
          is_active = true,
          updated_at = NOW();
      `, [userId, u.email, u.full_name, u.role, u.phone, u.department, u.avatar]);
    }

    // Ensure Mary Nyambura (ADRA-SS-000125) exists in public.beneficiaries
    const maryCheck = await client.query(`SELECT id FROM public.beneficiaries WHERE beneficiary_code = 'ADRA-SS-000125';`);
    if (maryCheck.rows.length === 0) {
      // Get first project id
      const projRes = await client.query('SELECT id FROM public.projects LIMIT 1;');
      const projId = projRes.rows[0]?.id;

      await client.query(`
        INSERT INTO public.beneficiaries (
          id,
          beneficiary_code,
          full_name,
          gender,
          date_of_birth,
          age,
          phone_number,
          location,
          vulnerability_category,
          registration_date,
          project_id
        ) VALUES (
          gen_random_uuid(),
          'ADRA-SS-000125',
          'Mary Nyambura',
          'Female',
          '1989-06-18',
          36,
          '+254-718-920114',
          'Lodwar Central, Turkana West',
          'Female-headed Household',
          '2025-01-20',
          $1
        );
      `, [projId]);
      console.log('Inserted Mary Nyambura (ADRA-SS-000125) into public.beneficiaries.');
    }

    // Verify all profiles in Supabase
    const finalProfiles = await client.query(`
      SELECT id, email, full_name, role, phone, department 
      FROM public.profiles 
      ORDER BY role = 'Administrator' DESC, email;
    `);

    console.log('\n================== VERIFIED SUPABASE PROFILES ==================');
    console.table(finalProfiles.rows);
    console.log('================================================================');

  } catch (err) {
    console.error('Error during Supabase setup:', err);
  } finally {
    await client.end();
  }
}

run();
