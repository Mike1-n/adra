import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldAlert,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export function AdminLogin({ onLoginSuccess }) {
  const { login, logout, loading } = useAuth();
  const toast = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

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
          await logout();
          setErrorMessage('Administrator Privileges Required');
          toast.error('Administrator Privileges Required');
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
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4 pt-safe pb-safe font-sans">
      {/* Clean Auth Card identical to standard Login page */}
      <div className="w-full sm:max-w-[400px] bg-white rounded-3xl shadow-xl border border-slate-100 p-7 flex flex-col justify-between">
        <div className="w-full">
          {/* Centered Official ADRA Logo & Title */}
          <div className="pt-2 pb-1 text-center">
            <div className="flex items-center justify-center mb-3">
              <img
                src="/images/adra-logo-expanded.png"
                alt="ADRA Logo"
                className="h-16 w-auto object-contain"
              />
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Admin Login
            </p>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="my-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 flex items-start gap-2.5 animate-in fade-in duration-200">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-rose-950">
                  {errorMessage === 'Administrator Privileges Required'
                    ? 'Administrator Privileges Required'
                    : 'Authentication Failed'}
                </span>
                <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                  {errorMessage === 'Administrator Privileges Required'
                    ? 'Access to the Admin Portal is restricted to authorized System Administrators only.'
                    : errorMessage}
                </p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 mt-4">
            {/* Email Address input */}
            <div>
              <div className="relative rounded-2xl bg-[#F4F5F7] border border-slate-200/70 focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/15 transition">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
                <input
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Email Address"
                  className="w-full pl-11 pr-4 py-3.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                  required
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <div className="relative rounded-2xl bg-[#F4F5F7] border border-slate-200/70 focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/15 transition">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-11 pr-11 py-3.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? (
                    <Eye className="w-4 h-4" strokeWidth={1.75} />
                  ) : (
                    <EyeOff className="w-4 h-4" strokeWidth={1.75} />
                  )}
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className="text-center mt-2.5">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs font-semibold text-[#006B56] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {/* Log In Button (Pill Button) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || isSubmitting}
                className="w-full py-3.5 rounded-full bg-[#006B56] hover:bg-[#005443] text-white font-bold text-xs tracking-wide shadow-xs transition active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {isSubmitting || loading ? 'Authenticating...' : 'Log In'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Forgot Your Password?</h3>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              For security, administrator password resets must be requested through your local ADRA system administrator or IT security desk.
            </p>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
              <p className="font-bold text-emerald-950">Quick Verification Tip:</p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Administrator demo account uses password: <code className="font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-200">admin123</code>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#006B56] text-white font-bold text-xs hover:bg-[#005443] transition cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLogin;
