import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, db } from '../lib/supabase';
import { demoAccounts } from '../lib/mockData';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Start with unauthenticated user so the Login / Sign Up page is the first page shown
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('adra_current_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null; // Prompt Login / Sign Up first
  });

  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('adra_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('adra_current_user');
    }
  }, [currentUser]);

  // Handle Supabase live auth state change if configured
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setCurrentUser({
            id: session.user.id,
            email: session.user.email,
            full_name: profile.full_name || session.user.email,
            role: profile.role || 'Project Officer',
            department: profile.department || 'Operations',
            avatar: profile.avatar_url || demoAccounts[1].avatar
          });
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (identifier, password) => {
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
        beneficiary: 'mary.nyambura@adra.community'
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

            // Verify account status
            if (profile && profile.role !== 'Administrator') {
              const isPending = profile.status === 'Pending Verification' || profile.is_active === false;
              if (isPending) {
                await supabase.auth.signOut();
                throw new Error('Account verification pending: As we await administrator verification, your account is in pending status. You will be able to log in once your account has been reviewed and approved.');
              }
              if (profile.status === 'Deactivated' || profile.status === 'Suspended') {
                await supabase.auth.signOut();
                throw new Error('This account has been deactivated. Please contact an ADRA Administrator.');
              }
            }

            const userObj = {
              id: data.user.id,
              email: data.user.email,
              full_name: profile?.full_name || data.user.email,
              role: profile?.role || 'Administrator',
              department: profile?.department || 'Operations',
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
        } catch (supabaseErr) {
          if (supabaseErr.message && (supabaseErr.message.includes('pending') || supabaseErr.message.includes('deactivated'))) {
            throw supabaseErr;
          }
          // If Supabase auth error is about wrong credentials or other issues, fall through to db.authenticateUser
        }
      }

      // 2. Query ADRA database directly (profiles / beneficiaries / demoAccounts)
      const userObj = await db.authenticateUser(cleanIdent, password);
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
      if (signupData.accountType === 'Beneficiary') {
        const res = await db.registerBeneficiaryAccount(signupData);
        const userObj = res.user || res.account || res;

        // Optionally register with Supabase GoTrue
        if (isSupabaseConfigured && supabase && res.beneficiary?.email && signupData.password) {
          try {
            await supabase.auth.signUp({
              email: res.beneficiary.email,
              password: signupData.password || 'Password123!',
              options: {
                data: {
                  full_name: signupData.full_name,
                  role: 'Beneficiary'
                }
              }
            });
          } catch (e) {
            console.warn('Supabase auth signup notice:', e?.message);
          }
        }

        toast.info(`Account verification pending: As we await administrator verification, ID ${res.beneficiary?.beneficiary_code || 'new ID'} has been registered.`);
        return { ...userObj, beneficiary: res.beneficiary };
      } else {
        const newUser = await db.createUser({
          email: signupData.email,
          password: signupData.password || 'Password123!',
          full_name: signupData.full_name,
          first_name: signupData.first_name,
          middle_name: signupData.middle_name,
          last_name: signupData.last_name,
          id_number: signupData.id_number || signupData.national_id,
          national_id: signupData.id_number || signupData.national_id,
          phone: signupData.phone_number || signupData.phone,
          role: signupData.role || 'Project Officer',
          department: signupData.department || 'Field Operations'
        });

        // Optionally register with Supabase GoTrue
        if (isSupabaseConfigured && supabase && signupData.email && signupData.password) {
          try {
            await supabase.auth.signUp({
              email: signupData.email,
              password: signupData.password || 'Password123!',
              options: {
                data: {
                  full_name: signupData.full_name,
                  role: signupData.role || 'Project Officer'
                }
              }
            });
          } catch (e) {
            console.warn('Supabase auth signup notice:', e?.message);
          }
        }

        toast.info(`Account verification pending: As we await administrator verification, account for ${newUser.full_name} is under review.`);
        return newUser;
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    if (currentUser) {
      db.logAudit({ action: 'AUTH', module: 'Authentication', details: `User logged out: ${currentUser.email || currentUser.full_name}` });
    }
    setCurrentUser(null);
    localStorage.removeItem('adra_current_user');
    toast.info('You have been logged out.');
  };

  // Quick switch role helper for presentation / viva defense
  const quickSwitchRole = async (roleName) => {
    try {
      const users = await db.getUsers();
      const target = users.find(a => a.role === roleName) || demoAccounts.find(a => a.role === roleName) || demoAccounts[0];
      setCurrentUser(target);
      db.logAudit({ action: 'AUTH', module: 'Role Switch', details: `Switched role to ${roleName}` });
      toast.info(`Switched view to ${target.role}: ${target.full_name}`);
      return target;
    } catch (e) {
      const fallback = demoAccounts.find(a => a.role === roleName) || demoAccounts[0];
      setCurrentUser(fallback);
      return fallback;
    }
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
        quickSwitchRole,
        hasPermission,
        demoAccounts,
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
