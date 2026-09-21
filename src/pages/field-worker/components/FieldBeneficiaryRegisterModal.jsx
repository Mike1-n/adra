import React, { useState } from 'react';
import {
  X,
  UserPlus,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Phone,
  Mail,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function FieldBeneficiaryRegisterModal({
  isOpen,
  onClose,
  worker = {},
  onRegisterBeneficiary
}) {
  const toast = useToast();

  const [formData, setFormData] = useState({
    full_name: '',
    national_id: '',
    phone_number: '',
    email: '',
    state: worker.state || 'Eastern Equatoria',
    county: worker.county || 'Kapoeta South',
    payam: worker.payam || 'Kapoeta Town',
    boma: worker.boma || 'Machi',
    village_area: 'Hai Malakal South',
    gender: 'Female',
    age: 38,
    vulnerability_category: 'Female-Headed Household',
    household_members: 6,
    children_under_5: 2,
    elderly_members: 1,
    disabled_members: 0,
    requested_assistance: 'Emergency Food Basket & Clean Water Purification',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      toast.error('Please enter the household head legal name.');
      return;
    }

    try {
      setIsSubmitting(true);
      const generatedCode = `ADRA-SS-000${Math.floor(140 + Math.random() * 850)}`;
      const regEmail = formData.email.trim() || `${generatedCode.toLowerCase()}@adra.community`;

      await onRegisterBeneficiary({
        ...formData,
        beneficiary_code: generatedCode,
        email: regEmail,
        location: `${formData.county}, ${formData.payam}, ${formData.boma}`,
        registered_by: `${worker.name || 'John Deng'} (Field Officer)`,
        status: 'Pending Verification',
        verification_status: 'Pending Verification',
        enrolled_date: new Date().toISOString()
      });

      toast.success(`Registered household ${formData.full_name} (${generatedCode})!`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to register household');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-2.5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full h-full max-h-[96%] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* HEADER */}
        <div className="p-4 bg-gradient-to-r from-purple-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shadow-inner">
              <UserPlus className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">On-Site Household Registration</h2>
              <p className="text-[11px] text-purple-100/90">Enroll unassisted vulnerable families in rural bomas</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <Users className="w-4 h-4 text-purple-700" />
              1. Household Head Identity
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Amina Lado Taban"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">National ID / Refugee Token</label>
                <input
                  type="text"
                  value={formData.national_id}
                  onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                  placeholder="e.g. SSD-994821"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+211-9..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Vulnerability Category</label>
                <select
                  value={formData.vulnerability_category}
                  onChange={(e) => setFormData({ ...formData, vulnerability_category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                >
                  <option>Female-Headed Household</option>
                  <option>Internally Displaced Person (IDP)</option>
                  <option>Returnee Household</option>
                  <option>Child-Headed Household</option>
                  <option>Household with Disabilities</option>
                  <option>Elderly Vulnerable Person</option>
                  <option>Host Community - Extreme Poverty</option>
                </select>
              </div>
            </div>
          </div>

          {/* LOCATION */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <MapPin className="w-4 h-4 text-purple-700" />
              2. Coverage Location
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">County</label>
                <input
                  type="text"
                  value={formData.county}
                  onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Payam</label>
                <input
                  type="text"
                  value={formData.payam}
                  onChange={(e) => setFormData({ ...formData, payam: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Boma</label>
                <input
                  type="text"
                  value={formData.boma}
                  onChange={(e) => setFormData({ ...formData, boma: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                />
              </div>
            </div>
          </div>

          {/* FAMILY COMPOSITION */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-700" />
              3. Family Composition & Immediate Need
            </h3>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Total Members</label>
                <input
                  type="number"
                  min="1"
                  value={formData.household_members}
                  onChange={(e) => setFormData({ ...formData, household_members: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Under 5 yrs</label>
                <input
                  type="number"
                  min="0"
                  value={formData.children_under_5}
                  onChange={(e) => setFormData({ ...formData, children_under_5: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Elderly (60+)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.elderly_members}
                  onChange={(e) => setFormData({ ...formData, elderly_members: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Requested Humanitarian Assistance</label>
              <input
                type="text"
                value={formData.requested_assistance}
                onChange={(e) => setFormData({ ...formData, requested_assistance: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
              />
            </div>
          </div>

          {/* SUBMIT BUTTONS */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enrolling...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Register Household
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
