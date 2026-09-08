import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Users,
  Target,
  DollarSign,
  FolderKanban
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export function Login({ onLoginSuccess }) {
  const { login, demoAccounts, loading } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('admin@adra.org');
  const [password, setPassword] = useState('Password123!');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning('Please enter email and password.');
      return;
    }

    try {
      await login(email, password);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      toast.error(err.message || 'Login failed.');
    }
  };

  const handleQuickLogin = async (account) => {
    setEmail(account.email);
    setPassword('Password123!');
    try {
      await login(account.email, 'Password123!');
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      toast.error(err.message || 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-xl shadow-emerald-950/50 border border-emerald-400/30 text-white font-extrabold text-2xl mb-1">
            A
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            ADRA Management System
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Centralized humanitarian project tracking, beneficiary enrollment, M&E and grants reporting
          </p>
        </div>

        {/* Login Card */}
        <div className="adra-card p-6 border-slate-800 bg-slate-900/90 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@adra.org"
                  className="adra-input pl-9 text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="adra-input pl-9 text-xs"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full py-2.5 text-sm font-semibold"
            >
              Sign In to System
            </Button>
          </form>

          {/* 1-Click Demo Logins for Academic Defense */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span className="font-semibold text-emerald-400 flex items-center gap-1 text-[11px]">
                <Sparkles className="w-3.5 h-3.5" /> 1-Click Role Logins
              </span>
              <span className="text-[10px] text-slate-500 uppercase">Examiner Preset</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleQuickLogin(acc)}
                  className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left transition text-xs group"
                >
                  <span className="font-semibold text-slate-200 block truncate group-hover:text-emerald-300 text-[11px]">
                    {acc.role}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate block">
                    {acc.full_name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-500">
          ADRA Development Management System • University Academic Software Project
        </p>
      </div>
    </div>
  );
}
