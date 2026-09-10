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
  Clock
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
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

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
        id_number: signupForm.id_number.trim()
      });
      // Store pending account data to render verification notice screen
      setPendingAccountData({
        ...newUser,
        full_name: fullName,
        accountType: signupType,
        id_number: signupForm.id_number.trim(),
        identifier: signupType === 'Beneficiary' ? signupForm.phone_number : signupForm.email
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
    <div className="min-h-screen w-full bg-slate-100 sm:py-6 flex flex-col items-center justify-center font-sans overflow-x-hidden">
      {/* MOBILE DEVICE CONTAINER (Matches Uploaded Mockup) */}
      <div className="w-full sm:max-w-[420px] bg-white min-h-screen sm:min-h-[880px] sm:rounded-[44px] sm:border-[10px] sm:border-slate-800 sm:shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* 1. STATUS BAR (9:41, Signal, Wi-Fi, Battery) */}
        <div className="pt-3 px-7 pb-2 flex items-center justify-between text-xs font-semibold text-slate-800 shrink-0 z-30 absolute top-0 left-0 right-0">
          <span className="font-bold text-[13px] tracking-tight">9:41</span>
          
          <div className="flex items-center gap-1.5">
            {/* Cellular signal bars */}
            <div className="flex items-end gap-0.5 h-3">
              <span className="w-0.5 h-1 bg-slate-800 rounded-xs" />
              <span className="w-0.5 h-1.5 bg-slate-800 rounded-xs" />
              <span className="w-0.5 h-2 bg-slate-800 rounded-xs" />
              <span className="w-0.5 h-2.5 bg-slate-800 rounded-xs" />
            </div>

            {/* Wi-Fi Icon */}
            <svg className="w-3.5 h-3.5 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.55a11 11 0 0 1 14.08 0" />
              <path d="M1.42 9a16 16 0 0 1 21.16 0" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3" />
            </svg>

            {/* Battery Indicator */}
            <div className="w-5 h-2.5 rounded-[3px] border border-slate-800 p-0.5 flex items-center">
              <div className="w-3/4 h-full bg-slate-800 rounded-xs" />
            </div>
          </div>
        </div>

        {/* 2. HERO IMAGE HEADER WITH OVERLAY */}
        <div className="relative w-full h-[320px] shrink-0 overflow-hidden">
          {/* Humanitarian Photo */}
          <img
            src="/images/adra_hero_south_sudan.jpg"
            alt="ADRA Humanitarian Field Work"
            className="w-full h-full object-cover object-center"
          />

          {/* Soft Gradient Overlay for Logo Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/50 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/60 to-transparent pointer-events-none" />

          {/* Brand Logo & South Sudan Motto */}
          <div className="absolute top-12 left-6 z-10 space-y-2">
            <div className="flex items-center gap-2.5">
              {/* ADRA Circle Logo SVG */}
              <svg viewBox="0 0 100 100" className="w-12 h-12 text-[#006B56] shrink-0 drop-shadow-xs" fill="currentColor">
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

              <div>
                <span className="font-extrabold text-2xl tracking-tight text-[#006B56] leading-none block font-serif">
                  ADRA
                </span>
                <span className="text-xs font-bold tracking-wide text-[#006B56] block mt-0.5">
                  South Sudan
                </span>
              </div>
            </div>

            {/* Motto */}
            <div className="space-y-0.5 text-xs italic font-semibold text-[#006B56] tracking-tight leading-snug pt-1">
              <p>Serving communities.</p>
              <p>Restoring hope.</p>
              <p>Transforming lives.</p>
            </div>
          </div>
        </div>

        {/* 3. WHITE FORM CARD (Sliding up with rounded top) */}
        <div className="flex-1 bg-white rounded-t-[32px] -mt-8 relative z-20 px-6 pt-6 pb-6 flex flex-col justify-between shadow-lg">
          <div>
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
                {/* Form Title & Subtitle */}
                <div className="mb-5">
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {isSignUp ? 'Create Account' : 'Welcome Back'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed font-normal">
                    {isSignUp
                      ? 'Register your profile to access ADRA humanitarian assistance.'
                      : 'Log in to your ADRA account to access your services and track your requests.'}
                  </p>
                </div>

                {/* Account Verification Pending Notice if triggered */}
                {pendingNotice && !isSignUp && (
                  <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5 animate-in fade-in duration-200">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-amber-950">Account Verification Pending</span>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                        {pendingNotice}
                      </p>
                    </div>
                  </div>
                )}

                {/* A. LOGIN FORM */}
            {!isSignUp ? (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                {/* Identifier Input */}
                <div>
                  <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/15 transition">
                    <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Phone number or Email address"
                      className="w-full pl-11 pr-4 py-3.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/15 transition">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
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
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? (
                        <Eye className="w-4 h-4" strokeWidth={1.5} />
                      ) : (
                        <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                      )}
                    </button>
                  </div>

                  {/* Forgot Password */}
                  <div className="text-right mt-1.5">
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(true)}
                      className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                {/* Log In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-[0.99] cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Authenticating with Database...' : 'Log In'}</span>
                  {!loading && <ArrowRight className="w-4 h-4 ml-0.5" />}
                </button>

                {/* "or" Divider */}
                <div className="relative my-3 flex items-center justify-center">
                  <div className="w-full border-t border-slate-200" />
                  <span className="absolute bg-white px-3 text-[11px] text-slate-400 font-medium">
                    or
                  </span>
                </div>

                {/* Create Account Secondary Button */}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="w-full py-3 rounded-xl border border-[#006B56] bg-white hover:bg-emerald-50/50 text-[#006B56] font-bold text-xs flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-[#006B56]" />
                  <span>Create Account</span>
                </button>
              </form>
            ) : (
              /* B. SIGN UP FORM */
              <form onSubmit={handleSignupSubmit} className="space-y-3">
                {/* Account Type Selector */}
                <div className="grid grid-cols-2 gap-2 pb-1">
                  <button
                    type="button"
                    onClick={() => setSignupType('Beneficiary')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      signupType === 'Beneficiary'
                        ? 'bg-emerald-50 border-emerald-600 text-[#006B56] ring-1 ring-emerald-600'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <HeartHandshake className="w-3.5 h-3.5" />
                    <span>Beneficiary</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignupType('Staff')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      signupType === 'Staff'
                        ? 'bg-emerald-50 border-emerald-600 text-[#006B56] ring-1 ring-emerald-600'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>ADRA Staff</span>
                  </button>
                </div>

                {/* 1. First Name & Middle Name */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative rounded-xl border border-slate-200 bg-white focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-500/20">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={signupForm.first_name}
                      onChange={(e) => setSignupForm({ ...signupForm, first_name: e.target.value })}
                      placeholder="First Name *"
                      className="w-full pl-8 pr-2 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                      required
                    />
                  </div>

                  <div className="relative rounded-xl border border-slate-200 bg-white focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-500/20">
                    <input
                      type="text"
                      value={signupForm.middle_name}
                      onChange={(e) => setSignupForm({ ...signupForm, middle_name: e.target.value })}
                      placeholder="Middle Name"
                      className="w-full px-3 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                    />
                  </div>
                </div>

                {/* 2. Last Name & ID Number */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative rounded-xl border border-slate-200 bg-white focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-500/20">
                    <input
                      type="text"
                      value={signupForm.last_name}
                      onChange={(e) => setSignupForm({ ...signupForm, last_name: e.target.value })}
                      placeholder="Last Name *"
                      className="w-full px-3 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                      required
                    />
                  </div>

                  <div className="relative rounded-xl border border-slate-200 bg-white focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-500/20">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={signupForm.id_number}
                      onChange={(e) => setSignupForm({ ...signupForm, id_number: e.target.value })}
                      placeholder="ID Number *"
                      className="w-full pl-8 pr-2 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                {/* 3. Beneficiary-specific parameters */}
                {signupType === 'Beneficiary' ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative rounded-xl border border-slate-200 bg-white focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-500/20">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={signupForm.phone_number}
                          onChange={(e) => setSignupForm({ ...signupForm, phone_number: e.target.value })}
                          placeholder="Phone (0920...) *"
                          className="w-full pl-8 pr-2 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                          required
                        />
                      </div>

                      <input
                        type="number"
                        min="1"
                        max="25"
                        value={signupForm.household_size}
                        onChange={(e) => setSignupForm({ ...signupForm, household_size: e.target.value })}
                        placeholder="Family size"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={signupForm.location}
                        onChange={(e) => setSignupForm({ ...signupForm, location: e.target.value })}
                        className="w-full px-2.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-transparent outline-none font-medium"
                      >
                        <option value="Juba Central, South Sudan">Juba Central</option>
                        <option value="Malakal, South Sudan">Malakal</option>
                        <option value="Wau, South Sudan">Wau</option>
                        <option value="Yambio, South Sudan">Yambio</option>
                        <option value="Bor, South Sudan">Bor</option>
                        <option value="Bentiu, South Sudan">Bentiu</option>
                        <option value="Aweil, South Sudan">Aweil</option>
                      </select>

                      <select
                        value={signupForm.vulnerability_category}
                        onChange={(e) => setSignupForm({ ...signupForm, vulnerability_category: e.target.value })}
                        className="w-full px-2 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-transparent outline-none font-medium truncate"
                      >
                        <option value="Female-headed household">Female-headed HH</option>
                        <option value="Internally Displaced Person (IDP)">Displaced / IDP</option>
                        <option value="Person with Disability (PWD)">Person w/ Disability</option>
                        <option value="Elderly Guardian">Elderly Guardian</option>
                        <option value="Child-headed household">Child-headed HH</option>
                        <option value="General Community Member">General Community</option>
                      </select>
                    </div>
                  </>
                ) : (
                  /* Staff-specific parameters */
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative rounded-xl border border-slate-200 bg-white focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-500/20">
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={signupForm.email}
                          onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                          placeholder="Official Email *"
                          className="w-full pl-8 pr-2 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                          required
                        />
                      </div>

                      <div className="relative rounded-xl border border-slate-200 bg-white focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-500/20">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={signupForm.phone_number}
                          onChange={(e) => setSignupForm({ ...signupForm, phone_number: e.target.value })}
                          placeholder="Phone (Optional)"
                          className="w-full pl-8 pr-2 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={signupForm.role}
                        onChange={(e) => setSignupForm({ ...signupForm, role: e.target.value })}
                        className="w-full px-2.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-transparent outline-none font-medium"
                      >
                        <option value="Project Officer">Project Officer</option>
                        <option value="Finance Officer">Finance Officer</option>
                        <option value="M&E Officer">M&E Officer</option>
                        <option value="Field Worker">Field Worker</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="Program Manager">Program Manager</option>
                      </select>

                      <input
                        type="text"
                        value={signupForm.department}
                        onChange={(e) => setSignupForm({ ...signupForm, department: e.target.value })}
                        placeholder="Department"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                      />
                    </div>
                  </>
                )}

                {/* Password Fields */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="password"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    placeholder="Create Password"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                    required
                  />

                  <input
                    type="password"
                    value={signupForm.confirm_password}
                    onChange={(e) => setSignupForm({ ...signupForm, confirm_password: e.target.value })}
                    placeholder="Confirm Password"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                    required
                  />
                </div>

                {/* Submit Sign Up */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-[0.99] cursor-pointer disabled:opacity-50"
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

            {/* Need Help? Support Card (Exact Match to Screenshot) */}
            <div
              onClick={() => setIsHelpModalOpen(true)}
              className="mt-4 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between cursor-pointer hover:bg-emerald-100/60 transition group"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[#006B56] shrink-0" strokeWidth={2} />
                <div>
                  <p className="text-xs font-bold text-emerald-950 leading-tight">
                    Need help?
                  </p>
                  <p className="text-[11px] text-emerald-800/80 leading-tight mt-0.5">
                    Visit our Help Centre or contact ADRA.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>

            {/* 1-Click Academic Defense Quick Logins (Collapsible) */}
            <div className="mt-3 pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-emerald-700 transition cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>{showDemoAccounts ? 'Hide Demo Presets' : 'Quick Role Logins (Academic Presets)'}</span>
              </button>

              {showDemoAccounts && (
                <div className="grid grid-cols-2 gap-1.5 mt-2 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200 text-left">
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleQuickLogin(acc)}
                      className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                        acc.role === 'Beneficiary'
                          ? 'bg-emerald-50/80 border-emerald-300 hover:bg-emerald-100/70'
                          : 'bg-white hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <span className="font-bold text-slate-900 block truncate text-[10px] flex items-center justify-between">
                        {acc.role}
                        {acc.role === 'Beneficiary' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                      </span>
                      <span className="text-[9px] text-slate-500 truncate block">
                        {acc.full_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Footer (Exact Match to Screenshot) */}
          <div className="mt-4 text-center">
            <p className="text-[10px] text-slate-400 font-medium">
              ADRA South Sudan | Making a difference together
            </p>
          </div>

          {/* iPhone Home Indicator Bar */}
          <div className="w-32 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 shrink-0" />
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
