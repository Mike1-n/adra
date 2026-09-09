import React, { useState } from 'react';
import {
  UserCheck,
  Save,
  MapPin,
  Phone,
  Users,
  AlertTriangle,
  Shield,
  HeartHandshake,
  Calendar
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { db } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

export function BeneficiaryProfileView({ beneficiary, onProfileUpdated }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: beneficiary?.full_name || 'Mary Nyambura',
    phone_number: beneficiary?.phone_number || '+254-718-920114',
    location: beneficiary?.location || 'Lodwar Central, Turkana West',
    household_size: beneficiary?.household_size || 5,
    gender: beneficiary?.gender || 'Female',
    date_of_birth: beneficiary?.date_of_birth || '1989-06-18',
    vulnerability_category: beneficiary?.vulnerability_category || 'Female-headed Household',
    emergency_contact: beneficiary?.emergency_contact || 'Peter Lokidor (+254-722-114455)',
    primary_needs: beneficiary?.primary_needs || ['Food Rations', 'Clean Water']
  });

  const availableNeeds = [
    'Food Rations',
    'Clean Water',
    'Agricultural Seeds & Tools',
    'Emergency Cash Transfer',
    'Shelter & Blankets',
    'Medical Assistance',
    'Education Support'
  ];

  const handleToggleNeed = (need) => {
    setFormData(prev => {
      const exists = prev.primary_needs.includes(need);
      return {
        ...prev,
        primary_needs: exists
          ? prev.primary_needs.filter(n => n !== need)
          : [...prev.primary_needs, need]
      };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (beneficiary?.id) {
        await db.updateBeneficiary(beneficiary.id, formData);
      }
      toast.success('Beneficiary profile updated successfully!');
      if (onProfileUpdated) onProfileUpdated(formData);
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-emerald-600" />
          My Beneficiary Profile & Household Information
        </h2>
        <p className="text-xs text-slate-500">
          Review your registered identity details and update your household headcount, contact phone, and living settlement
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Verification Status Banner */}
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xs text-emerald-950">Official ADRA Verified Profile</h4>
                <span className="font-mono text-xs font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-500/30">
                  {beneficiary?.beneficiary_code || 'BEN-2025-007'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Registered under Project: {beneficiary?.project_name || 'Drought Resilience & Climate-Smart Agriculture'}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-sm shrink-0">
            {beneficiary?.verification_status || 'Verified Active'}
          </span>
        </div>

        {/* Section 1: Personal Identification */}
        <div className="adra-card p-6 bg-white border-slate-800 space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
            Personal Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Registered Legal Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="adra-input text-xs"
                required
              />
              <span className="text-[10px] text-slate-400">Must match your National ID or Community elder register</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="adra-input text-xs"
                placeholder="+254-700-000000"
                required
              />
              <span className="text-[10px] text-slate-400">Used for M-Pesa mobile cash stipends and distribution SMS</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="adra-select text-xs"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="adra-input text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Household & Settlement Info */}
        <div className="adra-card p-6 bg-white border-slate-800 space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
            Household & Location
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Settlement / Village / Ward Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="adra-input text-xs"
                placeholder="e.g. Lodwar Central, Turkana West"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Household Size (Total Members Supported)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.household_size}
                onChange={(e) => setFormData({ ...formData, household_size: Number(e.target.value) })}
                className="adra-input text-xs"
                required
              />
              <span className="text-[10px] text-slate-400">Determines ration quota and allocation size</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vulnerability Category
              </label>
              <select
                value={formData.vulnerability_category}
                onChange={(e) => setFormData({ ...formData, vulnerability_category: e.target.value })}
                className="adra-select text-xs"
              >
                <option value="Female-headed Household">Female-headed Household</option>
                <option value="Elderly">Elderly (60+ living alone)</option>
                <option value="Persons with Disability">Persons with Disability (PWD)</option>
                <option value="Internally Displaced Person (IDP)">Internally Displaced Person (IDP)</option>
                <option value="Extremely Poor Household">Extremely Poor Household</option>
                <option value="Youth at Risk">Youth at Risk</option>
                <option value="Child-headed Household">Child-headed Household</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Emergency Contact (Authorized Proxy)
              </label>
              <input
                type="text"
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                className="adra-input text-xs"
                placeholder="Name and Phone Number"
              />
              <span className="text-[10px] text-slate-400">Authorized to collect rations if you are ill or absent</span>
            </div>
          </div>
        </div>

        {/* Section 3: Priority Household Needs */}
        <div className="adra-card p-6 bg-white border-slate-800 space-y-3 shadow-sm">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
            Priority Household Assistance Needs
          </h3>
          <p className="text-xs text-slate-500">
            Select the key areas where your family currently requires humanitarian support:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {availableNeeds.map(need => {
              const checked = formData.primary_needs.includes(need);
              return (
                <label
                  key={need}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition ${
                    checked
                      ? 'bg-emerald-50 border-emerald-500/40 text-emerald-950 font-semibold'
                      : 'bg-slate-850 border-slate-800 text-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleNeed(need)}
                    className="accent-emerald-600 w-4 h-4 rounded"
                  />
                  <span>{need}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            icon={Save}
            className="px-6 py-2.5 shadow-md shadow-emerald-600/20"
          >
            Save Profile Updates
          </Button>
        </div>
      </form>
    </div>
  );
}
