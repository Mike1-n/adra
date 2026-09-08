import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, db } from '../lib/supabase';
import { demoAccounts } from '../lib/mockData';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Default to Administrator account for instant first-look satisfaction
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('adra_current_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return demoAccounts[0]; // Administrator
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

  const login = async (email, password) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
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
        toast.success(`Welcome back, ${userObj.full_name}!`);
        return userObj;
      }

      // Offline / Mock Demo Auth
      const matched = demoAccounts.find(a => a.email.toLowerCase() === email.toLowerCase());
      if (matched && password === 'Password123!') {
        setCurrentUser(matched);
        db.logAudit({ action: 'AUTH', module: 'Authentication', details: `User logged in (Demo): ${matched.email}` });
        toast.success(`Logged in as ${matched.full_name} (${matched.role})`);
        return matched;
      } else if (matched) {
        throw new Error('Invalid password. Hint: Password123!');
      } else {
        // Create dynamic user for testing
        const customUser = {
          id: `usr_${Date.now()}`,
          email,
          full_name: email.split('@')[0].toUpperCase(),
          role: 'Project Officer',
          department: 'Field Operations',
          avatar: demoAccounts[1].avatar
        };
        setCurrentUser(customUser);
        toast.success(`Logged in as ${customUser.full_name}`);
        return customUser;
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    if (currentUser) {
      db.logAudit({ action: 'AUTH', module: 'Authentication', details: `User logged out: ${currentUser.email}` });
    }
    setCurrentUser(null);
    localStorage.removeItem('adra_current_user');
    toast.info('You have been logged out.');
  };

  // Quick switch role helper for presentation / viva defense
  const quickSwitchRole = (roleName) => {
    const target = demoAccounts.find(a => a.role === roleName) || demoAccounts[0];
    setCurrentUser(target);
    db.logAudit({ action: 'AUTH', module: 'Role Switch', details: `Switched demo role to ${roleName}` });
    toast.info(`Switched view to ${target.role}: ${target.full_name}`);
  };

  const hasPermission = (allowedRoles) => {
    if (!currentUser) return false;
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(currentUser.role);
  };

  const roleHelpers = {
    isAdmin: currentUser?.role === 'Administrator',
    isProjectOfficer: currentUser?.role === 'Project Officer',
    isFinanceOfficer: currentUser?.role === 'Finance Officer',
    isMEOfficer: currentUser?.role === 'M&E Officer',
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
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
