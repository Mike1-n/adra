import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const allowedRoles = new Set([
  'Administrator',
  'Program Manager',
  'Programme Manager',
  'Supervisor',
  'Project Officer',
  'Finance Officer',
  'M&E Officer',
  'Inventory Manager',
  'Field Worker',
  'Supplier',
  'Donor',
  'Beneficiary',
  'Compliance Officer',
]);

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  if (typeof error === 'object' && error !== null) {
    const details = error as Record<string, unknown>;
    const message = [details.message, details.details, details.hint]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .join(' ');
    if (message) return message;
  }
  return fallback;
};

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const respond = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  if (request.method !== 'POST') {
    return respond({ error: 'Method not allowed.' }, 405);
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization) {
    return respond({ error: 'Sign in as an administrator to create user accounts.' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('User provisioning function is missing Supabase environment configuration.');
    return respond({ error: 'User provisioning is not configured on the server.' }, 500);
  }

  try {
    const callerClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const accessToken = authorization.replace(/^Bearer\s+/i, '').trim();
    if (!accessToken) {
      return respond({ error: 'Your login session is invalid. Sign in again and retry.' }, 401);
    }

    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser(accessToken);
    if (callerError || !caller) {
      return respond({ error: 'Your login session is invalid. Sign in again and retry.' }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const findAuthUserByEmail = async (email: string) => {
      const { data: userId, error: lookupError } = await adminClient.rpc(
        'lookup_auth_user_id_by_email',
        { lookup_email: email },
      );
      if (lookupError) throw lookupError;
      if (!userId) return null;

      const { data, error } = await adminClient.auth.admin.getUserById(userId);
      if (error) throw error;
      return data.user;
    };
    const { data: callerProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (callerProfile?.role !== 'Administrator') {
      return respond({ error: 'Only an Administrator can create user accounts.' }, 403);
    }

    const payload = await request.json();
    if (payload.action === 'migrate-users') {
      if (!Array.isArray(payload.users) || payload.users.length === 0 || payload.users.length > 25) {
        return respond({ error: 'Submit between 1 and 25 user accounts per migration batch.' }, 400);
      }

      const results: Array<Record<string, string>> = [];

      for (const candidate of payload.users) {
        const email = typeof candidate?.email === 'string' ? candidate.email.trim().toLowerCase() : '';
        const fullName = typeof candidate?.full_name === 'string' ? candidate.full_name.trim() : '';
        const role = typeof candidate?.role === 'string' ? candidate.role : '';
        const password = typeof candidate?.password === 'string' ? candidate.password : '';
        const department = typeof candidate?.department === 'string' ? candidate.department.trim() : '';
        const phone = typeof candidate?.phone === 'string' ? candidate.phone.trim() : null;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !fullName || !allowedRoles.has(role)) {
          results.push({ email: email || '(missing email)', status: 'failed', error: 'This account has invalid email, name, or role data.' });
          continue;
        }

        try {
          let authUser = await findAuthUserByEmail(email);
          let createdByMigration = false;
          if (!authUser) {
            if (password.length < 6) {
              results.push({ email, status: 'failed', error: 'No existing Auth account or usable password was found. Set a password with at least 6 characters and retry.' });
              continue;
            }

            const { data: created, error: createError } = await adminClient.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
              user_metadata: { full_name: fullName, role },
            });
            if (createError) throw createError;
            if (!created.user) throw new Error('Supabase Auth did not return the created user.');
            authUser = created.user;
            createdByMigration = true;
          }

          const { data: existingProfile, error: existingProfileError } = await adminClient
            .from('profiles')
            .select('id')
            .eq('id', authUser.id)
            .maybeSingle();
          if (existingProfileError) throw existingProfileError;

          if (!existingProfile) {
            const donorResult = role === 'Donor'
              ? await adminClient.from('donors').select('id').ilike('email', email)
              : { data: [], error: null };
            if (donorResult.error) throw donorResult.error;
            const donorId = donorResult.data?.length === 1 ? donorResult.data[0].id : null;
            const isActive = candidate.is_active !== false &&
              !['Deactivated', 'Suspended', 'Pending Verification'].includes(candidate.status);

            const { error: insertError } = await adminClient.from('profiles').insert({
              id: authUser.id,
              email,
              full_name: fullName,
              role,
              phone,
              department: department || null,
              is_active: isActive,
              status: candidate.status || (isActive ? 'Active' : 'Pending Verification'),
              donor_id: donorId,
            });

            if (insertError) {
              if (createdByMigration) {
                const { error: cleanupError } = await adminClient.auth.admin.deleteUser(authUser.id);
                if (cleanupError) {
                  console.error('Failed to clean up Auth user after migrated profile creation failed:', cleanupError);
                  throw new Error(`Profile creation failed and the new Auth user could not be removed (user ID ${authUser.id}).`);
                }
              }
              throw insertError;
            }

            results.push({ email, status: createdByMigration ? 'created' : 'profile_linked' });
          } else {
            results.push({ email, status: 'already_linked' });
          }
        } catch (error) {
          console.error(`Failed to migrate user ${email}:`, error);
          results.push({
            email,
            status: 'failed',
            error: getErrorMessage(error, 'Unable to migrate this user.'),
          });
        }
      }

      return respond({ results });
    }

    if (payload.action === 'reset-password') {
      const userId = typeof payload.user_id === 'string' ? payload.user_id : '';
      const password = typeof payload.password === 'string' ? payload.password : '';
      const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
      const fullName = typeof payload.full_name === 'string' ? payload.full_name.trim() : '';
      const role = typeof payload.role === 'string' ? payload.role : '';
      const phone = typeof payload.phone === 'string' ? payload.phone.trim() : null;
      const department = typeof payload.department === 'string' ? payload.department.trim() : '';
      if (!userId && !email) return respond({ error: 'Select a valid user account.' }, 400);
      if (password.length < 6) {
        return respond({ error: 'The new password must be at least 6 characters.' }, 400);
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
      let targetProfile = null;
      if (isUuid) {
        const { data, error } = await adminClient
          .from('profiles')
          .select('id, full_name, email, role, phone, department, status, is_active, donor_id')
          .eq('id', userId)
          .maybeSingle();
        if (error) throw error;
        targetProfile = data;
      }
      if (!targetProfile && email) {
        const { data, error } = await adminClient
          .from('profiles')
          .select('id, full_name, email, role, phone, department, status, is_active, donor_id')
          .ilike('email', email)
          .maybeSingle();
        if (error) throw error;
        targetProfile = data;
      }

      const accountEmail = targetProfile?.email?.toLowerCase() || email;
      if (!accountEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountEmail)) {
        return respond({ error: 'The selected directory entry has no valid email address.' }, 400);
      }

      let authUser = null;
      if (targetProfile) {
        const { data: authData, error: authLookupError } = await adminClient.auth.admin.getUserById(targetProfile.id);
        if (!authLookupError) authUser = authData.user;
      }

      if (!authUser) {
        authUser = await findAuthUserByEmail(accountEmail);
      }

      if (authUser && targetProfile && authUser.id !== targetProfile.id) {
        return respond({
          error: 'This profile email is linked to a different Auth user ID. No password was changed; an administrator must reconcile the duplicate account IDs first.',
        }, 409);
      }
      if (targetProfile && !authUser) {
        const profileRole = String(targetProfile.role || role);
        const profileName = String(targetProfile.full_name || fullName);
        if (!profileName || !allowedRoles.has(profileRole)) {
          return respond({
            error: 'The existing profile is missing a valid name or role. Correct the profile before creating its Auth account.',
          }, 409);
        }

        const { data: created, error: createError } = await adminClient.auth.admin.createUser({
          email: accountEmail,
          password,
          email_confirm: true,
          user_metadata: { full_name: profileName, role: profileRole },
        });
        if (createError) throw createError;
        if (!created.user) throw new Error('Supabase Auth did not return the repaired user account.');

        const { error: relinkError } = await adminClient.rpc('relink_profile_to_auth_user', {
          old_profile_id: targetProfile.id,
          new_auth_user_id: created.user.id,
        });
        if (relinkError) {
          const { error: cleanupError } = await adminClient.auth.admin.deleteUser(created.user.id);
          if (cleanupError) {
            console.error('Failed to clean up Auth user after profile relinking failed:', cleanupError);
            throw new Error(
              `The Auth account was created but the profile could not be relinked and cleanup failed (user ID ${created.user.id}). Contact an administrator.`
            );
          }
          throw relinkError;
        }

        authUser = created.user;
      }

      let createdAuthUser = false;
      const needsPasswordUpdate = Boolean(authUser);
      if (!authUser) {
        if (!fullName || !allowedRoles.has(role)) {
          return respond({
            error: 'This entry is not yet a Supabase account. It needs a valid profile name and role before it can be provisioned.',
          }, 400);
        }
        const { data: created, error: createError } = await adminClient.auth.admin.createUser({
          email: accountEmail,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName, role },
        });
        if (createError) throw createError;
        authUser = created.user;
        createdAuthUser = true;
      }

      if (!authUser) throw new Error('Supabase Auth did not return the user account.');

      if (!targetProfile) {
        if (!fullName || !allowedRoles.has(role)) {
          if (createdAuthUser) {
            await adminClient.auth.admin.deleteUser(authUser.id);
          }
          return respond({ error: 'A valid profile name and role are required to link this Auth account.' }, 400);
        }

        const donorResult = role === 'Donor'
          ? await adminClient.from('donors').select('id').ilike('email', accountEmail)
          : { data: [], error: null };
        if (donorResult.error) throw donorResult.error;
        const donorId = donorResult.data?.length === 1 ? donorResult.data[0].id : null;

        const { error: profileInsertError } = await adminClient.from('profiles').insert({
          id: authUser.id,
          email: accountEmail,
          full_name: fullName,
          role,
          phone,
          department: department || null,
          status: payload.status || (payload.is_active === false ? 'Deactivated' : 'Active'),
          is_active: payload.is_active !== false,
          donor_id: donorId,
        });
        if (profileInsertError) {
          if (createdAuthUser) {
            const { error: cleanupError } = await adminClient.auth.admin.deleteUser(authUser.id);
            if (cleanupError) {
              console.error('Failed to clean up Auth user after password-reset profile creation failed:', cleanupError);
            }
          }
          throw profileInsertError;
        }
      }

      if (needsPasswordUpdate) {
        const { error: passwordError } = await adminClient.auth.admin.updateUserById(authUser.id, { password });
        if (passwordError) throw passwordError;
      }

      return respond({ user: { id: authUser.id, full_name: targetProfile?.full_name || fullName, email: accountEmail } });
    }

    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const password = typeof payload.password === 'string' ? payload.password : '';
    const fullName = typeof payload.full_name === 'string' ? payload.full_name.trim() : '';
    const role = typeof payload.role === 'string' ? payload.role : '';
    const department = typeof payload.department === 'string' ? payload.department.trim() : '';
    const phone = typeof payload.phone === 'string' ? payload.phone.trim() : null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return respond({ error: 'Enter a valid email address.' }, 400);
    }
    if (password.length < 6) {
      return respond({ error: 'The initial password must be at least 6 characters.' }, 400);
    }
    if (!fullName) {
      return respond({ error: 'Enter the user’s full name.' }, 400);
    }
    if (!allowedRoles.has(role)) {
      return respond({ error: 'Select a supported system role.' }, 400);
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });
    if (createError) throw createError;
    if (!created.user) {
      throw new Error('Supabase Auth did not return the created user.');
    }

    const profile = {
      id: created.user.id,
      email,
      full_name: fullName,
      role,
      phone,
      department: department || null,
      is_active: true,
      status: 'Active',
      status: 'Active',
    };
    const { data: savedProfile, error: insertError } = await adminClient
      .from('profiles')
      .insert(profile)
      .select('id, email, full_name, role, phone, department, is_active, created_at, updated_at')
      .single();

    if (insertError) {
      const { error: cleanupError } = await adminClient.auth.admin.deleteUser(created.user.id);
      if (cleanupError) {
        console.error('Failed to clean up Auth user after profile creation failed:', cleanupError);
        throw new Error(`Profile creation failed and the new Auth user could not be removed (user ID ${created.user.id}). Contact an administrator.`);
      }
      throw insertError;
    }

    return respond({ user: savedProfile }, 201);
  } catch (error) {
    console.error('Admin user provisioning failed:', error);
    return respond({ error: getErrorMessage(error, 'Unable to complete the account operation.') }, 400);
  }
});
