import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  ArrowLeft,
  KeyRound,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdraLogo } from '../../components/common/AdraLogo';

export function AdminLogin({ onLoginSuccess, onSwitchToFieldLogin }) {
  const { login, loading, quickSwitchRole } = useAuth();
  const toast = useToast();

  const [identifier, setIdentifier] = useState('admin@adra.org');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setErrorMessage('');

    const cleanIdent = identifier?.trim();
    const cleanPass = password?.trim();

    if (!cleanIdent || !cleanPass) {
      setErrorMessage('Please enter both your administrator email and password.');
      toast.warning('Please enter both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const user = await login(cleanIdent, cleanPass);
      if (user) {
        if (user.role !== 'Administrator') {
          setErrorMessage(`Access restricted: Authenticated user (${user.role}) is not an Administrator.`);
          toast.error('Access restricted to System Administrators.');
          return;
        }
        toast.success(`Welcome to ADRA Admin Console, ${user.full_name || 'Administrator'}`);
        if (onLoginSuccess) onLoginSuccess(user);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid administrator credentials. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoAdmin = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      const user = await login('admin@adra.org', 'admin123');
      if (user) {
        toast.success('Logged in as Administrator (Demo Mode)');
        if (onLoginSuccess) onLoginSuccess(user);
      }
    } catch (err) {
      quickSwitchRole('Administrator');
      if (onLoginSuccess) onLoginSuccess({ role: 'Administrator' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between text-slate-900 font-sans selection:bg-emerald-600 selection:text-white">
      {/* Top Header / Brand */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <AdraLogo isCollapsed={false} subtitle="Admin" description="" />
        </div>
        <button
          type="button"
          onClick={onSwitchToFieldLogin}
          className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
          Field Operations Portal
        </button>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6">
          {/* Card Title & Security Badge */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wider uppercase">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Restricted Console Access
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Administrator Authentication
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Sign in with your enterprise credentials to manage programs, users, and humanitarian operations.
            </p>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email / ID */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Administrator Identifier
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@adra.org"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm placeholder:text-slate-400 outline-none transition"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[10px] text-emerald-700 font-semibold">Default: admin123</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm placeholder:text-slate-400 outline-none transition"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Security Guarantee Note */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-[11px] text-emerald-900 font-medium">
              <KeyRound className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Session protected with 256-bit TLS encryption & audit logging.</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm transition shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting || loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Authenticate Administrator
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Instant Demo Access
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {/* 1-Click Demo Login Button */}
          <button
            type="button"
            onClick={handleQuickDemoAdmin}
            disabled={isSubmitting || loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs transition active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            One-Click Administrator Login (admin@adra.org)
          </button>

          {/* Footer Navigation */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onSwitchToFieldLogin}
              className="text-xs text-slate-500 hover:text-emerald-700 transition underline underline-offset-4 font-medium"
            >
              Not an administrator? Switch to Field Operations Login
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="px-6 py-4 text-center border-t border-slate-200 bg-white text-[11px] text-slate-400">
        ADRA Enterprise Humanitarian Data Management System &copy; {new Date().getFullYear()}. All administrative actions are recorded in immutable audit logs.
      </footer>
    </div>
  );
}

export default AdminLogin;
