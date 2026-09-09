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
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: identifier, password });
        if (!error && data?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const userObj = {
            id: data.user.id,
            email: data.user.email,
            full_name: profile?.full_name || data.user.email,
            role: profile?.role || 'Administrator',
            department: profile?.department || 'Operations',
            avatar: profile?.avatar_url || demoAccounts[0].avatar
          };

          setCurrentUser(userObj);
          db.logAudit({ action: 'AUTH', module: 'Authentication', details: `User logged in: ${userObj.email}` });
          toast.success(`Welcome back, ${userObj.full_name} (${userObj.role})!`);
          return userObj;
        }
      }

      // Query ADRA database directly (adra_users / adra_beneficiaries)
      const userObj = await db.authenticateUser(identifier, password);
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
        const userObj = res.user || res.account;
        toast.info(`Account verification pending: As we await administrator verification, ID ${res.beneficiary.beneficiary_code} has been registered.`);
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
