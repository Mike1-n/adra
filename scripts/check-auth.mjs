import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const identAdmin = await pool.query("SELECT * FROM auth.identities WHERE email = 'admin@adra.org'");
    console.log('Admin identity:', identAdmin.rows[0]);

    const identNutri = await pool.query("SELECT * FROM auth.identities WHERE email = 'orders@nutriset.fr'");
    console.log('Nutriset identity:', identNutri.rows[0]);

    // Check if tokens being null was the issue
    await pool.query(`
      UPDATE auth.users
      SET confirmation_token = '',
          recovery_token = '',
          email_change_token_new = '',
          email_change = '',
          phone_change = '',
          phone_change_token = '',
          reauthentication_token = '',
          email_change_token_current = '',
          raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
          raw_user_meta_data = json_build_object('sub', id, 'role', 'Supplier', 'email', email, 'full_name', 'Claire Dubois', 'email_verified', true, 'phone_verified', false)::jsonb
      WHERE email = 'orders@nutriset.fr'
    `);
    console.log('Updated tokens on auth.users for Nutriset');
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
check();
