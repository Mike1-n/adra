import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [k, ...v] = trimmed.split('=');
    if (k) process.env[k.trim()] = v.join('=').trim();
  }
});

async function run() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log('Connected to Supabase PostgreSQL...');

  // 1. Get first project id
  const projRes = await client.query('SELECT id FROM public.projects LIMIT 1');
  const projId = projRes.rows[0]?.id;

  // 2. Check if mmm nnn ggg is already in beneficiaries
  const mmmProfile = await client.query("SELECT * FROM public.profiles WHERE full_name ILIKE '%mmm%' LIMIT 1");
  if (mmmProfile.rows.length > 0) {
    const p = mmmProfile.rows[0];
    const mmmBenCheck = await client.query("SELECT id FROM public.beneficiaries WHERE full_name = $1", [p.full_name]);
    if (mmmBenCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO public.beneficiaries (
          id,
          beneficiary_code,
          full_name,
          gender,
          date_of_birth,
          age,
          phone_number,
          national_id,
          location,
          vulnerability_category,
          registration_date,
          verification_status,
          project_id
        ) VALUES (
          gen_random_uuid(),
          'ADRA-SS-000128',
          $1,
          'Female',
          '1996-05-20',
          29,
          $2,
          $3,
          'Juba Central, South Sudan',
          'Female-headed Household',
          CURRENT_DATE,
          'Pending Verification',
          $4
        );
      `, [p.full_name, p.phone || '+211-920-000088', p.national_id || '34567', projId]);
      console.log('Inserted pending beneficiary for user mmm nnn ggg (ADRA-SS-000128).');
    } else {
      await client.query(`
        UPDATE public.beneficiaries 
        SET verification_status = 'Pending Verification' 
        WHERE full_name = $1;
      `, [p.full_name]);
      console.log('Updated verification_status for mmm nnn ggg to Pending Verification.');
    }
  }

  // 3. Ensure Deng Majok Garang and Amina Halima Hussein exist in public.beneficiaries as Pending Verification
  const pBens = [
    {
      code: 'ADRA-SS-000126',
      name: 'Deng Majok Garang',
      gender: 'Male',
      dob: '1982-11-14',
      age: 43,
      phone: '+254-719-882211',
      nid: '31849201',
      loc: 'Kakuma Camp 3, Turkana West',
      vuln: 'Internally Displaced Person (IDP)',
      status: 'Pending Verification'
    },
    {
      code: 'ADRA-SS-000127',
      name: 'Amina Halima Hussein',
      gender: 'Female',
      dob: '1995-04-03',
      age: 30,
      phone: '+254-728-445566',
      nid: '28941054',
      loc: 'Garissa Central Sub-county',
      vuln: 'Female-headed Household',
      status: 'Pending Verification'
    }
  ];

  for (const b of pBens) {
    const exists = await client.query('SELECT id FROM public.beneficiaries WHERE beneficiary_code = $1', [b.code]);
    if (exists.rows.length === 0) {
      await client.query(`
        INSERT INTO public.beneficiaries (
          id,
          beneficiary_code,
          full_name,
          gender,
          date_of_birth,
          age,
          phone_number,
          national_id,
          location,
          vulnerability_category,
          registration_date,
          verification_status,
          project_id
        ) VALUES (
          gen_random_uuid(),
          $1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE, $10, $11
        );
      `, [b.code, b.name, b.gender, b.dob, b.age, b.phone, b.nid, b.loc, b.vuln, b.status, projId]);
      console.log(`Inserted pending beneficiary: ${b.name} (${b.code})`);
    } else {
      await client.query(`
        UPDATE public.beneficiaries 
        SET verification_status = $1 
        WHERE beneficiary_code = $2;
      `, [b.status, b.code]);
      console.log(`Updated pending beneficiary: ${b.name} (${b.code})`);
    }
  }

  const finalCheck = await client.query(`
    SELECT beneficiary_code, full_name, location, vulnerability_category, verification_status 
    FROM public.beneficiaries 
    ORDER BY verification_status = 'Pending Verification' DESC, beneficiary_code;
  `);
  console.log('\n========= BENEFICIARIES IN SUPABASE =========');
  console.table(finalCheck.rows);

  await client.end();
}

run().catch(console.error);
