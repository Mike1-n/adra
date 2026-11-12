import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, db } from '../lib/supabase';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    const applySession = async (session) => {
      if (!session?.user) {
        if (active) setCurrentUser(null);
        return;
      }

      try {
        let { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        if (error) throw error;

        if (!profile && session.user.email) {
          const { data: profByEmail } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', session.user.email)
            .maybeSingle();
          if (profByEmail) {
            profile = profByEmail;
            try {
              await supabase.from('profiles').update({ id: session.user.id }).eq('email', session.user.email);
            } catch (_) {}
          }
        }

        if (!profile) {
          throw new Error('No ADRA profile is linked to this Supabase Auth account.');
        }

        const status = String(profile.status || '').toLowerCase();
        const beneficiaryStatus = String(profile.verification_status || '').toLowerCase();
        if (
          !profile.role ||
          profile.is_active === false ||
          ['deactivated', 'suspended', 'inactive', 'disabled', 'terminated'].includes(status) ||
          status.includes('pending') ||
          status.includes('reject') ||
          beneficiaryStatus.includes('pending') ||
          beneficiaryStatus.includes('reject')
        ) {
          throw new Error('This account is not active. Contact an ADRA Administrator.');
        }

        const location = profile.location ||
          (profile.department?.startsWith('Community (') ? profile.department.slice(11, -1) : undefined);
        if (active) {
          setCurrentUser({
            id: session.user.id,
            email: session.user.email,
            donor_id: profile.donor_id || null,
            full_name: profile.full_name || session.user.email,
            role: profile.role,
            department: profile.department || 'Operations',
            location,
            avatar: profile.avatar_url || '',
            phone: profile.phone,
            status: profile.status || 'Active',
            is_active: profile.is_active
          });
        }
      } catch (error) {
        console.error('Unable to load Supabase Auth profile:', error);
        if (active) setCurrentUser(null);
        void supabase.auth.signOut();
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session).finally(() => {
        if (active) setLoading(false);
      });
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (identifier, password) => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase Auth is not configured. Set the Supabase project URL and anon key before signing in.');
      }

      const email = String(identifier || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Enter the email address registered to this Supabase Auth account.');
      }
      if (!password) throw new Error('Enter your password.');

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('Supabase Auth did not return an authenticated user.');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profile) {
        await supabase.auth.signOut();
        throw new Error('No ADRA profile is linked to this Supabase Auth account. Ask an Administrator to provision the account.');
      }

      const status = String(profile.status || '').toLowerCase();
      const beneficiaryStatus = String(profile.verification_status || '').toLowerCase();
      if (
        !profile.role ||
        profile.is_active === false ||
        ['deactivated', 'suspended', 'inactive', 'disabled', 'terminated'].includes(status) ||
        status.includes('pending') ||
        status.includes('reject') ||
        beneficiaryStatus.includes('pending') ||
        beneficiaryStatus.includes('reject')
      ) {
        await supabase.auth.signOut();
        throw new Error('This account is not active. Contact an ADRA Administrator.');
      }

      const location = profile.location ||
        (profile.department?.startsWith('Community (') ? profile.department.slice(11, -1) : undefined);
      const user = {
        id: data.user.id,
        email: data.user.email,
        donor_id: profile.donor_id || null,
        full_name: profile.full_name || data.user.email,
        role: profile.role,
        department: profile.department || 'Operations',
        location,
        avatar: profile.avatar_url || '',
        phone: profile.phone,
        status: profile.status || 'Active',
        is_active: profile.is_active
      };

      setCurrentUser(user);
      toast.success(`Welcome back, ${user.full_name} (${user.role})!`);
      return user;
    } catch (error) {
      toast.error(error.message || 'Supabase sign-in failed.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const legacyLogin = async (identifier, password) => {
    setLoading(true);
    try {
      const cleanIdent = (identifier || '').trim();
      const cleanLower = cleanIdent.toLowerCase();

      // Resolve shortcuts or lookup user to find their registered email
      const ROLE_SHORTCUT_EMAILS = {
        admin: 'admin@adra.org',
        administrator: 'admin@adra.org',
        supervisor: 'supervisor@adra.org',
        manager: 'program.manager@adra.org',
        pm: 'program.manager@adra.org',
        'program manager': 'program.manager@adra.org',
        'programme manager': 'program.manager@adra.org',
        officer: 'project.officer@adra.org',
        po: 'project.officer@adra.org',
        'project officer': 'project.officer@adra.org',
        finance: 'finance.officer@adra.org',
        fo: 'finance.officer@adra.org',
        'finance officer': 'finance.officer@adra.org',
        field: 'field.worker@adra.org',
        worker: 'field.worker@adra.org',
        'field worker': 'field.worker@adra.org',
        inventory: 'inventory.manager@adra.org',
        'inventory manager': 'inventory.manager@adra.org',
        im: 'inventory.manager@adra.org',
        logistics: 'inventory.manager@adra.org',
        warehouse: 'inventory.manager@adra.org',
        beneficiary: 'mary.nyambura@adra.community',
        supplier: 'procurement@africasupplies.com',
        vendor: 'procurement@africasupplies.com',
        donor: 'sjenkins@usaid.gov',
        usaid: 'sjenkins@usaid.gov',
        echo: 'm.dupont@ec.europa.eu'
      };

      let candidateEmail = cleanIdent.includes('@') ? cleanIdent : ROLE_SHORTCUT_EMAILS[cleanLower];

      // If not a shortcut, try quick lookup in database users for matching phone/name/code
      if (!candidateEmail) {
        try {
          const users = await db.getUsers();
          const matched = users.find(u => {
            const uUser = (u.email || '').split('@')[0].toLowerCase();
            const uName = (u.full_name || '').toLowerCase();
            const uNat = (u.national_id || u.id_number || '').toLowerCase();
            const uPhone = (u.phone || u.phone_number || '').replace(/\D/g, '');
            const idDigits = cleanIdent.replace(/\D/g, '');
            return uUser === cleanLower ||
                   uName === cleanLower ||
                   uNat === cleanLower ||
                   (idDigits.length >= 6 && uPhone.endsWith(idDigits));
          });
          if (matched?.email) {
            candidateEmail = matched.email;
          }
        } catch (e) {
          // Continue to normal auth
        }
      }

      const isDonorAuthAttempt = ['donor', 'usaid'].includes(cleanLower) ||
        candidateEmail?.toLowerCase() === 'sjenkins@usaid.gov';

      // 1. Try Supabase Auth if configured and we have an email
      if (isSupabaseConfigured && supabase && candidateEmail && candidateEmail.includes('@')) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: candidateEmail,
            password
          });

          if (!error && data?.user) {
            // Fetch profile
            let profile = null;
            try {
              const { data: prof } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .maybeSingle();
              profile = prof;
            } catch (err) {
              // fallback
            }

            if (!profile && data.user.email) {
              try {
                const { data: prof } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('email', data.user.email)
                  .maybeSingle();
                profile = prof;
              } catch (err) {
                // fallback
              }
            }

            if (!profile) {
              await supabase.auth.signOut();
              throw new Error('No ADRA profile is linked to this Supabase Auth account. Ask an Administrator to create the account.');
            }

            if (isDonorAuthAttempt && profile?.role !== 'Donor') {
              await supabase.auth.signOut();
              throw new Error('The Supabase account is missing a Donor profile. Ask an administrator to link this Auth user to the donor record.');
            }

            // Verify account status
            const isDemoAccount = demoAccounts.some(d => d.email?.toLowerCase() === (profile?.email || data.user.email)?.toLowerCase()) ||
              (profile?.email || data.user.email)?.toLowerCase() === 'admin@adra.org' ||
              (profile?.email || data.user.email)?.toLowerCase() === 'mary.nyambura@adra.community';

            if (profile && profile.role !== 'Administrator' && !isDemoAccount) {
              if (profile.status === 'Deactivated' || profile.status === 'Suspended') {
                await supabase.auth.signOut();
                throw new Error('This account has been deactivated. Please contact an ADRA Administrator.');
              }

              // Beneficiary rejection check
              const benStatus = (profile.status || profile.verification_status || '').toLowerCase();
              if (benStatus.includes('reject')) {
                await supabase.auth.signOut();
                throw new Error('Your beneficiary registration was rejected by the administrator. Please contact your nearest ADRA field office.');
              }

              // Check if approved by administrator
              const userStatus = (profile.status || '').toLowerCase();
              const isApproved = (
                (userStatus === 'active' || profile.is_active === true) &&
                !userStatus.includes('pending') &&
                !benStatus.includes('pending')
              );

              if (!isApproved) {
                await supabase.auth.signOut();
                throw new Error('Your account is pending administrator approval. You will not have access until an administrator reviews and approves your account.');
              }
            }

            const loc = profile?.location || (profile?.department?.startsWith('Community (') ? profile.department.slice(11, -1) : undefined);
            const userObj = {
              id: data.user.id,
              email: data.user.email,
              donor_id: profile?.donor_id || null,
              full_name: profile?.full_name || data.user.email,
              role: profile.role,
              department: profile?.department || 'Operations',
              location: loc,
              avatar: profile?.avatar_url || demoAccounts[0].avatar,
              phone: profile?.phone,
              status: profile?.status || 'Active',
              is_active: profile?.is_active ?? true
            };

            setCurrentUser(userObj);
            await db.logAudit({
              action: 'AUTH',
              module: 'Authentication',
              details: `User logged in via Supabase Auth: ${userObj.email} (${userObj.role})`
            });
            toast.success(`Welcome back, ${userObj.full_name} (${userObj.role})!`);
            return userObj;
          }

          if (isDonorAuthAttempt && (error || !data?.user)) {
            throw new Error(error?.message || 'Supabase did not return an authenticated user.');
          }
          if (error) throw error;
        } catch (supabaseErr) {
          if (isDonorAuthAttempt) {
            throw new Error(`Donor sign-in requires a Supabase Auth account. ${supabaseErr.message || 'Check the account and password, then try again.'}`);
          }
          // Accounts registered before auto-confirm was enabled will have unconfirmed
          // emails — fall through to ADRA DB auth so they can still log in.
          const isEmailNotConfirmed = (supabaseErr.message || '').toLowerCase().includes('email not confirmed') ||
            (supabaseErr.message || '').toLowerCase().includes('email_not_confirmed');
          if (!isEmailNotConfirmed) {
            if (supabaseErr.message && (
              supabaseErr.message.includes('deactivated') ||
              supabaseErr.message.includes('pending administrator approval') ||
              supabaseErr.message.includes('rejected')
            )) {
              throw supabaseErr;
            }
            throw new Error(supabaseErr.message || 'Supabase sign-in failed.');
          }
          // isEmailNotConfirmed → fall through to db.authenticateUser below
        }
      }

      if (isDonorAuthAttempt) {
        throw new Error('Donor sign-in requires a configured Supabase Auth account. Demo and role-switched logins cannot send database inquiries.');
      }

      // 2. Query ADRA database directly (profiles / beneficiaries / demoAccounts)
      const userObj = await db.authenticateUser(candidateEmail || cleanIdent, password);
      setCurrentUser(userObj);
      toast.success(`Welcome back, ${userObj.full_name} (${userObj.role})!`);
      return userObj;
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check credentials.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (signupData) => {
    setLoading(true);
    try {
      const email = (signupData.email || '').trim().toLowerCase();
      const password = signupData.password || 'Password123!';
      const fullName = (signupData.full_name || '').trim();
      const role = signupData.accountType === 'Beneficiary' ? 'Beneficiary' : (signupData.role || 'Beneficiary');

      let authUserId = null;

      // 1. Create user in Supabase Auth GoTrue first
      if (isSupabaseConfigured && supabase && email) {
        try {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                role
              }
            }
          });

          if (authError) {
            const msg = (authError.message || '').toLowerCase();
            if (msg.includes('already registered') || msg.includes('unique constraint') || msg.includes('user already exists')) {
              throw new Error('An account with this email address already exists. Please log in.');
            }
            console.warn('Supabase auth signup notice:', authError.message);
          } else if (authData?.user) {
            authUserId = authData.user.id;
          }
        } catch (authErr) {
          if (authErr.message?.includes('already exists')) throw authErr;
          console.warn('Supabase signUp warning:', authErr.message);
        }
      }

      // 2. Register beneficiary or general account in database with matching ID & Pending Verification status
      let result;
      if (signupData.accountType === 'Beneficiary') {
        const res = await db.registerBeneficiaryAccount({
          ...signupData,
          email,
          user_id: authUserId,
          id: authUserId,
          status: 'Pending Verification',
          verification_status: 'Pending Verification',
          is_active: false,
          self_register: true
        });
        result = res.user || res.account || res;
      } else {
        const newUser = await db.createUser({
          id: authUserId,
          email,
          password,
          full_name: fullName,
          first_name: signupData.first_name,
          middle_name: signupData.middle_name,
          last_name: signupData.last_name,
          id_number: signupData.id_number || signupData.national_id,
          national_id: signupData.id_number || signupData.national_id,
          phone: signupData.phone_number || signupData.phone,
          role,
          department: signupData.department || (role === 'Beneficiary' ? 'Community' : 'Field Operations'),
          status: 'Pending Verification',
          verification_status: 'Pending Verification',
          is_active: false,
          self_register: true
        });
        result = newUser;
      }

      // 3. Clear transient browser session from signUp so user lands cleanly on Login
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.auth.signOut();
        } catch (_) {}
      }

      toast.info(`Account registered for ${fullName}! Your profile requires administrator verification before you can log in.`, 6000);
      return result;
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) await supabase.auth.signOut();
    setCurrentUser(null);
    toast.info('You have been logged out.');
  };

  const quickSwitchRole = async () => {
    toast.error('Role switching is disabled. Sign in with the Supabase Auth account for the required role.');
    return null;
  };

  const updateCurrentUser = (updates) => {
    setCurrentUser(prev => (prev ? { ...prev, ...updates } : updates));
  };

  const hasPermission = (allowedRoles) => {
    if (!currentUser) return false;
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(currentUser.role);
  };

  const roleHelpers = {
    isAdmin: currentUser?.role === 'Administrator',
    isProgramManager: currentUser?.role === 'Program Manager',
    isSupervisor: currentUser?.role === 'Supervisor',
    isProjectOfficer: currentUser?.role === 'Project Officer',
    isFieldWorker: currentUser?.role === 'Field Worker',
    isFinanceOfficer: currentUser?.role === 'Finance Officer',
    isInventoryManager: currentUser?.role === 'Inventory Manager' || currentUser?.role === 'Logistics Officer',
    isSupplier: currentUser?.role === 'Supplier',
    isDonor: currentUser?.role === 'Donor',
    isBeneficiary: currentUser?.role === 'Beneficiary',
    isMEOfficer: currentUser?.role === 'M&E Officer',
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        signup,
        logout,
        updateCurrentUser,
        quickSwitchRole,
        hasPermission,
        ...roleHelpers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
