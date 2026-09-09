import React, { useState } from 'react';
import {
  UserPlus,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  User,
  Phone,
  Home,
  Lock,
  Sparkles,
  QrCode,
  FileCheck2,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { db } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

export function BeneficiarySignUpWizard({ onBackToLogin, onRegistrationComplete }) {
  const { login } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState(1); // 1: Personal, 2: Contact, 3: Household, 4: Password & Terms, 5: System Verification, 6: ID Generated
  const [submitting, setSubmitting] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState(null);
  const [registeredData, setRegisteredData] = useState(null);

  const [formData, setFormData] = useState({
    // Step 1: Basic Personal Info
    first_name: '',
    middle_name: '',
    last_name: '',
    id_number: '',
    national_id: '',
    full_name: '',
    gender: 'Female',
    date_of_birth: '1992-06-15',
    
    // Step 2: Contact Info
    phone_number: '',
    email: '',

    // Step 3: Household & Community Info
    location: 'Lodwar Central, Turkana West',
    household_size: 5,
    vulnerability_category: 'Female-headed Household',
    priority_needs: 'Food Rations & Clean Water',
    emergency_contact_name: '',
    emergency_contact_phone: '',

    // Step 4: Password & Terms
    password: 'Password123!',
    confirm_password: 'Password123!',
    accept_terms: false
  });

  const vulnerabilityOptions = [
    'Female-headed Household',
    'Elderly (60+ years living alone)',
    'Persons with Disability (PWD)',
    'Internally Displaced Household (IDP)',
    'Child-headed Household',
    'Drought-Affected Smallholder',
    'General Community Member'
  ];

  // Validation before advancing
  const handleNext = () => {
    if (step === 1) {
      if (!formData.first_name.trim() || !formData.last_name.trim()) {
        toast.warning('Please enter your First Name and Last Name');
        return;
      }
      if (!formData.id_number.trim() && !formData.national_id.trim()) {
        toast.warning('Please enter your ID Number');
        return;
      }
      const full = [formData.first_name.trim(), formData.middle_name?.trim(), formData.last_name.trim()]
        .filter(Boolean)
        .join(' ');
      setFormData(prev => ({
        ...prev,
        full_name: full,
        national_id: prev.id_number || prev.national_id
      }));
      setStep(2);
    } else if (step === 2) {
      if (!formData.phone_number.trim()) {
        toast.warning('Please provide a mobile phone number');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!formData.location.trim()) {
        toast.warning('Please enter your community / settlement location');
        return;
      }
      setStep(4);
    }
  };

  // Step 4: Submit Registration and run Account & Beneficiary Verification
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.accept_terms) {
      toast.warning('You must accept the ADRA Terms & Conditions to register.');
      return;
    }
    if (formData.password.length < 6) {
      toast.warning('Password must be at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setStep(5); // Show automated system verification & duplicate check animation

    try {
      // Simulate automated database verification check
      await new Promise(r => setTimeout(r, 1200));

      const result = await db.registerBeneficiaryAccount(formData);
      setRegisteredData(result);
      setDuplicateResult(result.dupCheck);

      if (result.dupCheck?.isDuplicate) {
        toast.warning('Possible duplicate detected: Flagged for field review.');
      } else {
        toast.success(`Verification passed! Beneficiary ID: ${result.beneficiary.beneficiary_code}`);
      }

      setStep(6); // Show generated Beneficiary ID
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Registration failed.');
      setStep(4);
    } finally {
      setSubmitting(false);
    }
  };

  // Step 6: Log in and enter dashboard
  const handleEnterDashboard = async () => {
    if (registeredData) {
      try {
        await login(registeredData.user.email, registeredData.user.password);
        if (onRegistrationComplete) onRegistrationComplete(registeredData.beneficiary);
      } catch (err) {
        toast.info('Please sign in with your phone or email.');
        if (onBackToLogin) onBackToLogin();
      }
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-4 sm:p-6 bg-white text-slate-900">
      {/* Top Header with Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {step > 1 && step <= 4 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onBackToLogin}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Login
            </button>
          )}

          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {step <= 4 ? `Step ${step} of 4` : step === 5 ? 'Verifying' : 'Issued'}
            </span>
          </div>
        </div>

        {/* Step Progress Indicators */}
        {step <= 4 && (
          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'bg-emerald-600'
                    : s < step
                    ? 'bg-emerald-300'
                    : 'bg-slate-100'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main Step Content */}
      <div className="my-auto py-6">
        {/* STEP 1: Basic Personal Information */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                Step 1: Identity
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Personal Information
              </h2>
              <p className="text-xs text-slate-500">
                Enter your official name as shown on community records or national documents.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="e.g. Mary"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={formData.middle_name}
                    onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                    placeholder="e.g. Nyambura"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="e.g. Lokidor"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ID Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.id_number}
                    onChange={(e) => setFormData({ ...formData, id_number: e.target.value, national_id: e.target.value })}
                    placeholder="National / Refugee ID"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other / Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleNext}
              className="w-full py-3 text-xs font-bold shadow-md shadow-emerald-600/20 mt-4"
            >
              Continue to Contact Info <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* STEP 2: Contact Information */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                Step 2: Reachability
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Contact Information
              </h2>
              <p className="text-xs text-slate-500">
                Provide your mobile number to receive dispatch SMS alerts and collection tokens.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="e.g. +254-718-920114"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  National ID / Refugee Reg No.
                </label>
                <input
                  type="text"
                  value={formData.national_id}
                  onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                  placeholder="e.g. 29481023 or REF-99120"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@adra.community (Auto-assigned if blank)"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleNext}
              className="w-full py-3 text-xs font-bold shadow-md shadow-emerald-600/20 mt-4"
            >
              Continue to Household Info <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* STEP 3: Household / Community Information */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                Step 3: Eligibility Context
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Household & Community Info
              </h2>
              <p className="text-xs text-slate-500">
                This data allows ADRA field workers to determine your family ration volume.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Settlement / Ward / County <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Lodwar Central, Turkana West"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Total Household Members (Including you)
                </label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={formData.household_size}
                  onChange={(e) => setFormData({ ...formData, household_size: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vulnerability Classification
                </label>
                <select
                  value={formData.vulnerability_category}
                  onChange={(e) => setFormData({ ...formData, vulnerability_category: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500"
                >
                  {vulnerabilityOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-800 block">
                  Secondary Representative (Proxy for Aid Collection)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    placeholder="Proxy Full Name"
                    className="px-3 py-2 text-[11px] rounded-lg border border-slate-200 bg-white text-slate-900"
                  />
                  <input
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                    placeholder="Proxy Phone"
                    className="px-3 py-2 text-[11px] rounded-lg border border-slate-200 bg-white text-slate-900"
                  />
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleNext}
              className="w-full py-3 text-xs font-bold shadow-md shadow-emerald-600/20 mt-4"
            >
              Continue to Security & Terms <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* STEP 4: Password & Terms */}
        {step === 4 && (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                Step 4: Account Security
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Password & Agreement
              </h2>
              <p className="text-xs text-slate-500">
                Create a secure password to access your requests and collection tokens.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Create Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  placeholder="Repeat password"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              {/* Terms Checkbox */}
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.accept_terms}
                    onChange={(e) => setFormData({ ...formData, accept_terms: e.target.checked })}
                    className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    required
                  />
                  <span className="text-[11px] text-slate-700 leading-snug">
                    I agree to the <span className="font-bold text-emerald-800">ADRA Beneficiary Terms & Data Protection Policy</span>. I certify that all information submitted is true.
                  </span>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
              className="w-full py-3 text-xs font-bold shadow-md shadow-emerald-600/20 mt-4"
            >
              Submit Registration <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>
        )}

        {/* STEP 5: Automated Verification & Duplicate Check Animation */}
        {step === 5 && (
          <div className="text-center py-12 space-y-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto animate-pulse">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                System Verification in Progress
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Checking ADRA central database for existing profiles, phone records, and issuing your official Beneficiary ID...
              </p>
            </div>
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}

        {/* STEP 6: Beneficiary ID Generated Card (e.g. ADRA-SS-000125) */}
        {step === 6 && registeredData && (
          <div className="space-y-5 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/30">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Account Verification Pending
              </h3>
              <p className="text-xs text-slate-500">
                Your details have been registered. As we await administrator verification, your account is in pending status.
              </p>
            </div>

            {/* Duplicate Flag Alert if detected */}
            {duplicateResult?.isDuplicate ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-left text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-950 block">Flagged for Field Review</span>
                  <p className="text-[11px] text-amber-800">{duplicateResult.reason}</p>
                  <p className="text-[10px] text-amber-700 mt-1">
                    An ADRA field worker will review your household at the next verification clinic.
                  </p>
                </div>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Account Verification Pending
              </div>
            )}

            {/* Official Digital ID Pass */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white shadow-xl text-left relative overflow-hidden border border-emerald-500">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-500/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white text-emerald-800 font-black text-xs flex items-center justify-center">
                    A
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-tight">ADRA Relief Pass</span>
                    <span className="text-[10px] text-emerald-200">Adventist Development & Relief</span>
                  </div>
                </div>
                <QrCode className="w-6 h-6 text-white/90" />
              </div>

              <div className="py-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-200 block">Registered Beneficiary</span>
                <span className="text-base font-extrabold tracking-tight block">
                  {registeredData.beneficiary.full_name}
                </span>

                <div className="pt-3 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] uppercase text-emerald-200 block">Unique ID Number</span>
                    <span className="font-mono text-sm font-black tracking-wider text-white">
                      {registeredData.beneficiary.beneficiary_code}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-emerald-200 block">Household</span>
                    <span className="text-xs font-bold text-white">
                      {registeredData.beneficiary.household_size} Family Members
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-500/40 flex items-center justify-between text-[10px] text-emerald-200">
                <span>{registeredData.beneficiary.location}</span>
                <span className="font-mono">{registeredData.beneficiary.qr_token}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={onBackToLogin}
              className="w-full py-3 text-xs font-bold shadow-lg shadow-emerald-600/30 mt-2"
            >
              Return to Log In (Account Verification Pending) <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pt-4 border-t border-slate-100">
        <p className="text-[11px] text-slate-400">
          Already enrolled?{' '}
          <button
            type="button"
            onClick={onBackToLogin}
            className="font-bold text-emerald-700 hover:underline cursor-pointer"
          >
            Sign in to existing account
          </button>
        </p>
      </div>
    </div>
  );
}
