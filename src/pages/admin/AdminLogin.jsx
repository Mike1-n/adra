import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdraLogo } from '../../components/common/AdraLogo';

export function AdminLogin({ onLoginSuccess }) {
  const { login, loading } = useAuth();
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-900 font-sans selection:bg-emerald-600 selection:text-white">
      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6">
        {/* Logo and Title inside the card */}
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <AdraLogo isCollapsed={false} subtitle="Admin" description="" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Admin Login
          </h1>
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
                Sign In
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Subtle Bottom Footer */}
      <footer className="mt-8 text-center text-[11px] text-slate-400">
        ADRA Enterprise Management System &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default AdminLogin;
