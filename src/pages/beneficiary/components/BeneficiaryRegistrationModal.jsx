import React, { useState } from 'react';
import {
  UserPlus,
  ShieldCheck,
  CheckCircle,
  MapPin,
  Users,
  Phone,
  Calendar,
  Lock,
  Mail,
  FileText,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { db } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

export function BeneficiaryRegistrationModal({ isOpen, onClose, onSuccess }) {
  const { login } = useAuth();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [registeredResult, setRegisteredResult] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    national_id: '',
    gender: 'Female',
    date_of_birth: '1992-05-14',
    location: 'Lodwar Central, Turkana West',
    household_size: 4,
    vulnerability_category: 'Female-headed Household',
    priority_needs: 'Food Rations & Clean Water',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    password: 'Password123!'
  });

  const vulnerabilityOptions = [
    'Female-headed Household',
    'Elderly (60+ years)',
    'Persons with Disability (PWD)',
    'Internally Displaced Person (IDP)',
    'Child-headed Household',
    'Extremely Poor / Drought-Affected',
    'General Vulnerable Community Member'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone_number) {
      toast.warning('Please complete all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      const email = formData.email || `${formData.full_name.toLowerCase().replace(/\s+/g, '.')}@adra.community`;
      const result = await db.registerBeneficiaryAccount({
        ...formData,
        email
      });

      setRegisteredResult(result);
      toast.success(`Registration successful! Beneficiary ID: ${result.beneficiary.beneficiary_code}`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnterPortal = async () => {
    if (registeredResult) {
      try {
        await login(registeredResult.user.email, registeredResult.user.password || 'Password123!');
        if (onSuccess) onSuccess(registeredResult);
        onClose();
      } catch (err) {
        console.error(err);
        toast.info('Please sign in with your new email.');
        onClose();
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Beneficiary Profile Registration"
      size="lg"
    >
      {!registeredResult ? (
        <form onSubmit={handleSubmit} className="space-y-5 p-1">
          {/* Intro Notice */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-slate-50 border border-emerald-200 text-xs text-slate-700 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">ADRA Community Enrollment Portal</span>
              <p className="text-slate-500 mt-0.5">
                Register your household to receive verified assistance, digital distribution passes, and track aid delivery.
              </p>
            </div>
          </div>

          {/* Section 1: Personal Identification */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              1. Personal Identification
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Halima Hassan Mohamed"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  National ID / Refugee Reg No.
                </label>
                <input
                  type="text"
                  value={formData.national_id}
                  onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                  placeholder="e.g. 29481023 or REF-99120"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="e.g. +254-712-334455"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other / Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Household & Vulnerability */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              2. Household & Vulnerability Criteria
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  County / Ward / Settlement
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Lodwar Central, Turkana West"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Household Members
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.household_size}
                  onChange={(e) => setFormData({ ...formData, household_size: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vulnerability Classification
                </label>
                <select
                  value={formData.vulnerability_category}
                  onChange={(e) => setFormData({ ...formData, vulnerability_category: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500"
                >
                  {vulnerabilityOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Priority Assistance Needed
                </label>
                <input
                  type="text"
                  value={formData.priority_needs}
                  onChange={(e) => setFormData({ ...formData, priority_needs: e.target.value })}
                  placeholder="e.g. Food Rations, Water Purification, Farming Seeds"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Proxy & Account Password */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              3. Proxy Representative & Portal Login
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Secondary Pickup Proxy (Name)
                </label>
                <input
                  type="text"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  placeholder="e.g. Peter Lokidor (Brother)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proxy Mobile Phone
                </label>
                <input
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  placeholder="e.g. +254-722-114455"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Set Portal Access Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Password123!"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
              className="text-xs gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Complete Registration
            </Button>
          </div>
        </form>
      ) : (
        /* Success Screen */
        <div className="text-center py-6 space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md shadow-emerald-600/10">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">Registration Complete!</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your profile has been created and your unique ADRA Beneficiary ID has been issued.
            </p>
          </div>

          {/* Digital ID Display */}
          <div className="max-w-sm mx-auto p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg text-left relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white text-emerald-700 font-black text-xs flex items-center justify-center">
                  A
                </div>
                <span className="text-xs font-bold tracking-wide">ADRA Beneficiary Pass</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/40 text-emerald-100 border border-emerald-400/50">
                Active
              </span>
            </div>

            <div className="py-3 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-200 block">Recipient Name</span>
              <span className="text-base font-bold tracking-tight block">
                {registeredResult.beneficiary.full_name}
              </span>
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-emerald-200 block">Beneficiary ID</span>
                  <span className="font-mono text-sm font-extrabold tracking-wider">
                    {registeredResult.beneficiary.beneficiary_code}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-emerald-200 block">Household</span>
                  <span className="text-xs font-semibold">
                    {registeredResult.beneficiary.household_size} Members
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3">
            <Button
              variant="primary"
              size="md"
              onClick={handleEnterPortal}
              className="px-6 py-2.5 text-xs font-bold gap-2 shadow-lg shadow-emerald-600/30"
            >
              Enter Beneficiary Portal
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
