import React, { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Shield,
  Layers,
  CheckCircle2,
  Save,
  Lock,
  Sparkles
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function SupervisorProfileView({
  currentUser,
  onUpdateProfile
}) {
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: currentUser?.full_name || 'Emmanuel Adeyemi',
    phone: currentUser?.phone || '+211-920-000003',
    email: currentUser?.email || 'supervisor@adra.org',
    department: currentUser?.department || 'Field Operations & Supervisory',
    operational_area: currentUser?.department?.replace('Field Operations & Supervisory (', '').replace(')', '') || currentUser?.state || 'South Sudan State Operations Hub',
    programme: 'Humanitarian Emergency Assistance & Resilience'
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (onUpdateProfile) {
        await onUpdateProfile(currentUser?.id, {
          full_name: formData.full_name,
          phone: formData.phone,
          email: formData.email,
          department: formData.department
        });
      }
      toast.success('Profile details updated successfully.');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      
      {/* Header Profile Card */}
      <div className="bg-gradient-to-r from-[#006B56] to-[#004D3D] text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex items-center space-x-4">
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
            alt={formData.full_name}
            className="w-18 h-18 rounded-2xl object-cover border-2 border-white/30 shadow-md"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold leading-tight">{formData.full_name}</h2>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            </div>
            <p className="text-xs text-emerald-200 font-bold mt-0.5">Role: Field Quality & Operations Supervisor</p>
            <p className="text-[11px] text-white/80 font-mono mt-1">ID: SUP-SS-001 &bull; Active</p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Personal & Operational Information
          </h3>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs font-bold text-[#006B56] hover:underline"
          >
            {isEditing ? 'Cancel' : 'Edit Details'}
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-500 font-medium mb-1">Full Name</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className={`w-full p-2.5 rounded-xl border text-slate-800 ${
                isEditing ? 'border-[#006B56] bg-white ring-2 ring-[#006B56]/20' : 'border-slate-200 bg-slate-50'
              }`}
            />
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Contact Phone</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`w-full p-2.5 rounded-xl border text-slate-800 ${
                isEditing ? 'border-[#006B56] bg-white ring-2 ring-[#006B56]/20' : 'border-slate-200 bg-slate-50'
              }`}
            />
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Official Email</label>
            <input
              type="email"
              disabled={!isEditing}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full p-2.5 rounded-xl border text-slate-800 ${
                isEditing ? 'border-[#006B56] bg-white ring-2 ring-[#006B56]/20' : 'border-slate-200 bg-slate-50'
              }`}
            />
          </div>

          {/* Immutable Role Field */}
          <div>
            <label className="block text-slate-500 font-medium mb-1 flex items-center justify-between">
              <span>Assigned User Role</span>
              <span className="text-[10px] text-amber-600 font-bold flex items-center space-x-1">
                <Lock className="w-3 h-3" />
                <span>Protected Role</span>
              </span>
            </label>
            <div className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-bold flex items-center justify-between">
              <span>Supervisor</span>
              <Shield className="w-4 h-4 text-[#006B56]" />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Assigned Operational Area</label>
            <div className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium">
              {formData.operational_area}
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Primary Programme Sector</label>
            <div className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium">
              {formData.programme}
            </div>
          </div>

          {isEditing && (
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-[#006B56] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md hover:bg-[#005544] transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          )}
        </form>
      </div>

    </div>
  );
}
