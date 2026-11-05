import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function seedSupplierUser() {
  try {
    const passwordHash = '$2a$10$9TZYA95lD8p8971FgWqdBuDRLCjSgWPTss4/bzutcT0Geet56fpJi'; // bcrypt for Password123!

    const suppliersToSeed = [
      { email: 'orders@nutriset.fr', name: 'Claire Dubois', company: 'Nutriset Humanitarian Nutrition', phone: '+33-2-35-12-34-56' },
      { email: 'dlado@equatorial-logistics.ss', name: 'David Lado', company: 'Equatorial Relief Logistics Ltd', phone: '+211-921-112233' },
      { email: 'contact@simlawseeds-ss.org', name: 'Agnes Wani', company: 'Simlaw Certified Seeds South Sudan', phone: '+211-922-334455' },
      { email: 'peter.jok@davis-shirtliff.com', name: 'Eng. Peter Jok', company: 'Davis & Shirtliff Water Technologies SS', phone: '+211-923-556677' },
      { email: 'supply@jubamedpharma.ss', name: 'Dr. Stephen Taban', company: 'Juba Medical & Pharmaceuticals Supply', phone: '+211-924-778899' },
      { email: 'riverine@nilebarges.com', name: 'Capt. Maker Deng', company: 'Nile River Barges & Heavy Logistics', phone: '+211-925-990011' },
      { email: 'info@panafricanutrition.org', name: 'Grace Mwangi', company: 'Pan-Africa Nutrition & Emergency Feeds', phone: '+254-722-114477' },
      { email: 'solutions@easolar-water.ss', name: 'Eng. Joseph Lagu', company: 'East Africa Solar & Borehole Solutions', phone: '+211-926-443322' },
      { email: 'procurement@africasupplies.com', name: 'Hassan Gedi', company: 'Equatorial Relief Logistics', phone: '+211-920-000007' }
    ];

    for (const sup of suppliersToSeed) {
      let supUid;
      const sUser = await pool.query('SELECT id FROM auth.users WHERE email = $1', [sup.email]);
      if (sUser.rows.length === 0) {
        const ins = await pool.query(`
          INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
          ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            $1,
            $2,
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            $3::jsonb,
            NOW(),
            NOW()
          ) RETURNING id
        `, [sup.email, passwordHash, JSON.stringify({ role: 'Supplier', email: sup.email, full_name: sup.name })]);
        supUid = ins.rows[0].id;
        console.log(`Created auth.users for ${sup.email} (${supUid})`);
      } else {
        supUid = sUser.rows[0].id;
        // Ensure password and email_confirmed_at are set
        await pool.query(`
          UPDATE auth.users
          SET encrypted_password = $2, email_confirmed_at = COALESCE(email_confirmed_at, NOW())
          WHERE id = $1
        `, [supUid, passwordHash]);
        console.log(`Existing auth.users updated for ${sup.email} (${supUid})`);
      }

      const sProf = await pool.query('SELECT id FROM public.profiles WHERE email = $1', [sup.email]);
      if (sProf.rows.length === 0) {
        await pool.query(`
          INSERT INTO public.profiles (
            id, email, full_name, role, phone, department, is_active, status, password, created_at, updated_at
          ) VALUES (
            $1, $2, $3, 'Supplier', $4, $5, true, 'Active', 'Password123!', NOW(), NOW()
          )
        `, [supUid, sup.email, sup.name, sup.phone, sup.company]);
        console.log(`Created public.profiles for ${sup.email}`);
      } else {
        await pool.query(`
          UPDATE public.profiles
          SET full_name = $2, role = 'Supplier', phone = $3, department = $4, is_active = true, status = 'Active', password = 'Password123!'
          WHERE email = $1
        `, [sup.email, sup.name, sup.phone, sup.company]);
        console.log(`Updated public.profiles for ${sup.email}`);
      }

      // Ensure auth.identities record exists
      const sIdent = await pool.query('SELECT id FROM auth.identities WHERE user_id = $1::uuid', [supUid]);
      if (sIdent.rows.length === 0) {
        await pool.query(`
          INSERT INTO auth.identities (
            provider_id, user_id, identity_data, provider, created_at, updated_at, id
          ) VALUES (
            $1::text, $2::uuid, $3::jsonb, 'email', NOW(), NOW(), gen_random_uuid()
          )
        `, [supUid, supUid, JSON.stringify({ sub: supUid, email: sup.email, email_verified: true, phone_verified: false })]);
        console.log(`Created auth.identities for ${sup.email}`);
      }
    }
    console.log('All suppliers seeded and confirmed successfully in database!');
  } catch (err) {
    console.error('Error seeding suppliers:', err);
  } finally {
    await pool.end();
  }
}

seedSupplierUser();
