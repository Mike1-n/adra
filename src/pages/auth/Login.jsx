import React, { useState } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  UserPlus,
  ShieldCheck,
  ChevronRight,
  Phone,
  Mail,
  Building,
  HeartHandshake,
  HelpCircle,
  X,
  Sparkles,
  Database,
  CheckCircle2,
  CreditCard,
  Clock,
  MapPin,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export function Login({ onLoginSuccess }) {
  const { login, signup, demoAccounts, loading } = useAuth();
  const toast = useToast();

  // Mode: 'login' | 'signup'
  const [isSignUp, setIsSignUp] = useState(false);
  const [pendingAccountData, setPendingAccountData] = useState(null);
  const [pendingNotice, setPendingNotice] = useState(null);

  // Form State - Login
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form State - Sign Up (First Name, Middle Name, Last Name, ID Number, plus remaining parameters)
  const [signupType, setSignupType] = useState('Beneficiary'); // 'Beneficiary' | 'Staff'
  const [signupForm, setSignupForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    id_number: '',
    email: '',
    phone_number: '',
    location: 'Juba Central, South Sudan',
    household_size: 4,
    vulnerability_category: 'Female-headed household',
    role: 'Project Officer',
    department: 'Humanitarian Response',
    password: '',
    confirm_password: ''
  });

  // Modals
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Submit Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.warning('Please enter your phone number, email, or Beneficiary ID and password.');
      return;
    }

    try {
      setPendingNotice(null);
      const user = await login(identifier, password);
      if (onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      if (err.message && (err.message.toLowerCase().includes('pending') || err.message.toLowerCase().includes('verification'))) {
        setPendingNotice('Account verification pending: As we await administrator verification, your account cannot log in yet. You will be able to log in once your account has been reviewed and approved.');
      }
    }
  };

  // Submit Sign Up
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!signupForm.first_name?.trim() || !signupForm.last_name?.trim()) {
      toast.warning('Please enter your First Name and Last Name.');
      return;
    }

    if (!signupForm.id_number?.trim()) {
      toast.warning('Please enter your ID Number (National / Refugee / Staff ID).');
      return;
    }

    if (!signupForm.password) {
      toast.warning('Please enter a password.');
      return;
    }

    if (signupForm.password !== signupForm.confirm_password) {
      toast.error('Passwords do not match.');
      return;
    }

    if (signupType === 'Beneficiary' && !signupForm.phone_number?.trim()) {
      toast.warning('Please provide a mobile phone number for aid notifications.');
      return;
    }

    if (signupType === 'Staff' && !signupForm.email?.trim()) {
      toast.warning('Please provide an official work email address.');
      return;
    }

    const fullName = [signupForm.first_name?.trim(), signupForm.middle_name?.trim(), signupForm.last_name?.trim()]
      .filter(Boolean)
      .join(' ');

    try {
      const newUser = await signup({
        accountType: signupType,
        ...signupForm,
        full_name: fullName,
        national_id: signupForm.id_number.trim(),
        id_number: signupForm.id_number.trim(),
        email: signupForm.email?.trim() || ''
      });
      // Store pending account data to render verification notice screen
      setPendingAccountData({
        ...newUser,
        full_name: fullName,
        accountType: signupType,
        id_number: signupForm.id_number.trim(),
        identifier: signupForm.email?.trim() || (signupType === 'Beneficiary' ? signupForm.phone_number : signupForm.email)
      });
    } catch (err) {
      // Error handled in AuthContext
    }
  };

  // Quick 1-Click login helper for defense / evaluation
  const handleQuickLogin = async (acc) => {
    setIdentifier(acc.email);
    setPassword('Password123!');
    try {
      const user = await login(acc.email, 'Password123!');
      if (onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      // Error handled in AuthContext
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      {/* Clean Auth Card (Non-scrollable on Login, clean & centered) */}
      <div className={`w-full sm:max-w-[400px] bg-white rounded-3xl shadow-xl border border-slate-100 p-7 flex flex-col justify-between ${isSignUp ? 'max-h-[92vh] overflow-y-auto' : ''}`}>
        <div className="w-full">
            {/* If Sign Up, show compact brand bar with Back to Login button */}
            {isSignUp && (
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 100 100" className="w-7 h-7 text-[#006B56] shrink-0" fill="currentColor">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="6" />
                    <circle cx="50" cy="28" r="6" />
                    <circle cx="33" cy="40" r="5.5" />
                    <circle cx="67" cy="40" r="5.5" />
                    <path d="M50,38c-6,0-12,4-14,9a18,18,0,0,0,28,0C62,42,56,38,50,38Z" />
                    <path d="M33,48c-4,0-8,3-10,6a15,15,0,0,0,19,0C39,51,36,48,33,48Z" />
                    <path d="M67,48c-4,0-8,3-10,6a15,15,0,0,0,19,0C75,51,71,48,67,48Z" />
                    <path d="M28,68 Q50,60 72,68" stroke="currentColor" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                    <path d="M22,76 Q50,68 78,76" stroke="currentColor" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                  </svg>
                  <span className="font-extrabold text-lg tracking-tight text-[#006B56] font-serif">
                    ADRA
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer py-1 px-2.5 rounded-lg hover:bg-slate-100 transition"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Back to Login</span>
                </button>
              </div>
            )}

            {pendingAccountData ? (
              <div className="space-y-4 py-1 animate-in fade-in zoom-in-95 duration-200">
                {/* Shield / Clock Icon Header */}
                <div className="text-center space-y-2">
                  <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping opacity-75" />
                    <div className="relative w-14 h-14 rounded-full bg-amber-50 border-2 border-amber-400 flex items-center justify-center text-amber-600 shadow-xs">
                      <Clock className="w-7 h-7" strokeWidth={2} />
                    </div>
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200 uppercase tracking-wide">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Account Verification Pending
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-2">
                      Account Verification Pending
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Your details have been submitted. As we await administrator verification, your account is in pending status.
                    </p>
                  </div>
                </div>

                {/* Account Details Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500 text-[11px]">Full Name:</span>
                    <span className="font-bold text-slate-900 text-right">{pendingAccountData.full_name}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500 text-[11px]">Account Role:</span>
                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {pendingAccountData.accountType === 'Beneficiary' ? 'Community Beneficiary' : (pendingAccountData.role || 'Staff')}
                    </span>
                  </div>
                  {pendingAccountData.id_number && (
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-slate-500 text-[11px]">ID / Refugee No:</span>
                      <span className="font-mono font-semibold text-slate-800">{pendingAccountData.id_number}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500 text-[11px]">Login Identifier:</span>
                    <span className="font-medium text-slate-900">{pendingAccountData.identifier}</span>
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-slate-500 text-[11px]">Status:</span>
                    <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Account Verification Pending
                    </span>
                  </div>
                </div>

                {/* Safeguarding Security Note */}
                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 text-[11px] text-amber-900 flex items-start gap-2 leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    To safeguard humanitarian aid distribution in South Sudan, accounts remain inactive until verified by our Field Administrator team.
                  </span>
                </div>

                {/* Back to Login Action */}
                <button
                  type="button"
                  onClick={() => {
                    if (pendingAccountData?.identifier) {
                      setIdentifier(pendingAccountData.identifier);
                    }
                    setPendingNotice('Account verification pending: As we await administrator verification, your account is in pending status.');
                    setPendingAccountData(null);
                    setIsSignUp(false);
                  }}
                  className="w-full py-3.5 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-[0.99] cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  <span>Return to Log In</span>
                </button>
              </div>
            ) : (
              <>
                {/* Form Header (Distinct for Login vs Sign Up) */}
                {!isSignUp ? (
                  <div className="pt-2 pb-1 text-center">
                    {/* Centered ADRA Emblem Logo + Wordmark */}
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <svg viewBox="0 0 100 100" className="w-12 h-12 text-[#006B56] shrink-0" fill="currentColor">
                        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="6" />
                        <circle cx="50" cy="28" r="6" />
                        <circle cx="33" cy="40" r="5.5" />
                        <circle cx="67" cy="40" r="5.5" />
                        <path d="M50,38c-6,0-12,4-14,9a18,18,0,0,0,28,0C62,42,56,38,50,38Z" />
                        <path d="M33,48c-4,0-8,3-10,6a15,15,0,0,0,19,0C39,51,36,48,33,48Z" />
                        <path d="M67,48c-4,0-8,3-10,6a15,15,0,0,0,19,0C75,51,71,48,67,48Z" />
                        <path d="M28,68 Q50,60 72,68" stroke="currentColor" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                        <path d="M22,76 Q50,68 78,76" stroke="currentColor" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                      </svg>
                      <span className="font-extrabold text-3xl tracking-tight text-[#006B56] font-serif">
                        ADRA
                      </span>
                    </div>

                    {/* Welcome Back & Humanitarian Assistance App */}
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      Welcome Back
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Humanitarian Assistance App
                    </p>
                  </div>
                ) : (
                  <div className="mb-4">
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      Create Account
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed font-normal">
                      Register your profile to access ADRA humanitarian assistance.
                    </p>
                  </div>
                )}

                {/* Account Verification Pending Notice if triggered */}
                {pendingNotice && !isSignUp && (
                  <div className="my-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5 animate-in fade-in duration-200">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-amber-950">Account Verification Pending</span>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                        {pendingNotice}
                      </p>
                    </div>
                  </div>
                )}

                {/* A. LOGIN FORM (100% Mockup Match) */}
                {!isSignUp ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-3.5 mt-4">
                    {/* Phone/Email input */}
                    <div>
                      <div className="relative rounded-2xl bg-[#F4F5F7] border border-slate-200/70 focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/15 transition">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
                        <input
                          type="text"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="Phone/Email"
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

                      {/* Forgot Password? Link (Centered) */}
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
                        disabled={loading}
                        className="w-full py-3.5 rounded-full bg-[#006B56] hover:bg-[#005443] text-white font-bold text-xs tracking-wide shadow-xs transition active:scale-[0.99] cursor-pointer disabled:opacity-50"
                      >
                        {loading ? 'Authenticating...' : 'Log In'}
                      </button>
                    </div>

                    {/* OR Divider */}
                    <div className="relative my-4 flex items-center justify-center">
                      <div className="w-full border-t border-slate-200" />
                      <span className="absolute bg-white px-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        OR
                      </span>
                    </div>

                    {/* Create Account Link */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setIsSignUp(true)}
                        className="text-xs font-bold text-[#006B56] hover:underline cursor-pointer"
                      >
                        Create Account
                      </button>
                    </div>
                  </form>
                ) : (
              /* B. SIGN UP FORM (Vertical arrangement with labels above inputs) */
              <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                {/* 1. First Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/15 transition">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={signupForm.first_name}
                      onChange={(e) => setSignupForm({ ...signupForm, first_name: e.target.value })}
                      placeholder="Enter your first name"
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                {/* 2. Middle Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Middle Name <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/15 transition">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={signupForm.middle_name}
                      onChange={(e) => setSignupForm({ ...signupForm, middle_name: e.target.value })}
                      placeholder="Enter middle name (optional)"
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                    />
                  </div>
                </div>

                {/* 3. Last Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/15 transition">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={signupForm.last_name}
                      onChange={(e) => setSignupForm({ ...signupForm, last_name: e.target.value })}
                      placeholder="Enter your last name"
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                {/* 4. National ID / Identification Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    National ID / Identification Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/15 transition">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={signupForm.id_number}
                      onChange={(e) => setSignupForm({ ...signupForm, id_number: e.target.value })}
                      placeholder="e.g. SSD-90821-X or National ID"
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                {/* 5. Email Address (Vertical with label above for both Beneficiary and Staff) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Email Address {signupType === 'Staff' ? (
                      <span className="text-rose-500">*</span>
                    ) : (
                      <span className="text-slate-400 font-normal">(Optional)</span>
                    )}
                  </label>
                  <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/15 transition">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      placeholder={signupType === 'Staff' ? 'official.email@adra.org' : 'name@example.com'}
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                      required={signupType === 'Staff'}
                    />
                  </div>
                </div>

                {/* 6. Phone Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Phone Number {signupType === 'Beneficiary' ? (
                      <span className="text-rose-500">*</span>
                    ) : (
                      <span className="text-slate-400 font-normal">(Optional)</span>
                    )}
                  </label>
                  <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/15 transition">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={signupForm.phone_number}
                      onChange={(e) => setSignupForm({ ...signupForm, phone_number: e.target.value })}
                      placeholder="e.g. 0920 123 456"
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                      required={signupType === 'Beneficiary'}
                    />
                  </div>
                </div>

                {/* 7. Beneficiary-specific parameters */}
                {signupType === 'Beneficiary' ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Household Size (Family Members) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/15 transition">
                        <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          min="1"
                          max="25"
                          value={signupForm.household_size}
                          onChange={(e) => setSignupForm({ ...signupForm, household_size: e.target.value })}
                          placeholder="Number of family members (e.g. 4)"
                          className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Location / County <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/15 transition">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={signupForm.location}
                          onChange={(e) => setSignupForm({ ...signupForm, location: e.target.value })}
                          className="w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 bg-transparent outline-none font-medium cursor-pointer"
                        >
                          <option value="Juba Central, South Sudan">Juba Central, South Sudan</option>
                          <option value="Malakal, South Sudan">Malakal, South Sudan</option>
                          <option value="Wau, South Sudan">Wau, South Sudan</option>
                          <option value="Yambio, South Sudan">Yambio, South Sudan</option>
                          <option value="Bor, South Sudan">Bor, South Sudan</option>
                          <option value="Bentiu, South Sudan">Bentiu, South Sudan</option>
                          <option value="Aweil, South Sudan">Aweil, South Sudan</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Vulnerability Category <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/15 transition">
                        <HeartHandshake className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={signupForm.vulnerability_category}
                          onChange={(e) => setSignupForm({ ...signupForm, vulnerability_category: e.target.value })}
                          className="w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 bg-transparent outline-none font-medium cursor-pointer"
                        >
                          <option value="Female-headed household">Female-headed household</option>
                          <option value="Internally Displaced Person (IDP)">Internally Displaced Person (IDP)</option>
                          <option value="Person with Disability (PWD)">Person with Disability (PWD)</option>
                          <option value="Elderly Guardian">Elderly Guardian</option>
                          <option value="Child-headed household">Child-headed household</option>
                          <option value="General Community Member">General Community Member</option>
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Staff-specific parameters */
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Staff Role / Position <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/15 transition">
                        <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={signupForm.role}
                          onChange={(e) => setSignupForm({ ...signupForm, role: e.target.value })}
                          className="w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 bg-transparent outline-none font-medium cursor-pointer"
                        >
                          <option value="Project Officer">Project Officer</option>
                          <option value="Finance Officer">Finance Officer</option>
                          <option value="M&E Officer">M&E Officer</option>
                          <option value="Field Worker">Field Worker</option>
                          <option value="Supervisor">Supervisor</option>
                          <option value="Program Manager">Program Manager</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Department <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/15 transition">
                        <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={signupForm.department}
                          onChange={(e) => setSignupForm({ ...signupForm, department: e.target.value })}
                          placeholder="e.g. Humanitarian Response / Field Ops"
                          className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* 8. Password Fields */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Create Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/15 transition">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      placeholder="Enter a secure password"
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/15 transition">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={signupForm.confirm_password}
                      onChange={(e) => setSignupForm({ ...signupForm, confirm_password: e.target.value })}
                      placeholder="Confirm your password"
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Submit Sign Up */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 mt-2 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-[0.99] cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Registering...' : 'Complete Registration →'}</span>
                </button>

                {/* Return to Log In */}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="w-full py-2.5 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-bold text-center cursor-pointer"
                >
                  Already have an account? <span className="text-[#006B56] underline">Log In</span>
                </button>
              </form>
            )}
          </>
        )}

          </div>

          {/* Contact Us Link at Bottom */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsHelpModalOpen(true)}
              className="text-xs font-semibold text-slate-500 hover:text-[#006B56] hover:underline cursor-pointer transition"
            >
              Contact Us
            </button>
          </div>
        </div>

        {/* HELP CENTER MODAL */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-[#006B56]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">ADRA South Sudan Help Centre</h3>
                  <p className="text-[11px] text-slate-500">Humanitarian Support & Safeguarding</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">📞 24/7 Toll-Free Emergency Hotline</span>
                <p className="text-emerald-800 font-extrabold text-sm">0800-720-112</p>
                <span className="text-[10px] text-slate-500">Free call from all mobile networks in South Sudan & Kenya</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">🏢 National Country Office</span>
                <p className="text-[11px] text-slate-700">ADRA South Sudan Compound, Juba</p>
                <p className="text-[11px] text-slate-500">Email: support@adra-southsudan.org</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                <span className="font-bold text-emerald-950 block">💡 Account & Registration Help</span>
                <p className="text-[11px] text-emerald-900">
                  Beneficiaries can log in using either their registered phone number, national ID, or official Beneficiary ID (e.g. <code>ADRA-SS-000125</code>).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsHelpModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
            >
              Close Help Centre
            </button>
          </div>
        </div>
      )}

      {/* FORGOT PASSWORD MODAL */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Forgot Your Password?</h3>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              For security in humanitarian areas, password resets are processed via your registered phone number or directly by your local ADRA field officer at distribution checkpoints.
            </p>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
              <p className="font-bold text-emerald-950">Quick Verification Tip:</p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                All preloaded demonstration accounts use the password: <code className="font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-200">Password123!</code>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#006B56] text-white font-bold text-xs hover:bg-[#005443] transition"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
