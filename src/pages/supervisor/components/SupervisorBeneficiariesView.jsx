import React, { useState } from 'react';
import {
  Users,
  Search,
  MapPin,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  FileText,
  Gift
} from 'lucide-react';

export function SupervisorBeneficiariesView({
  beneficiaries = [],
  assignments = [],
  selectedBeneficiaryId = null,
  onBack
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBeneficiary, setActiveBeneficiary] = useState(() => {
    if (selectedBeneficiaryId) {
      return beneficiaries.find(b => b.id === selectedBeneficiaryId || b.beneficiary_code === selectedBeneficiaryId) || null;
    }
    return null;
  });

  const filteredBens = beneficiaries.filter(b => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (b.full_name || '').toLowerCase().includes(q) ||
      (b.beneficiary_code || '').toLowerCase().includes(q) ||
      (b.location || '').toLowerCase().includes(q) ||
      (b.phone_number || '').toLowerCase().includes(q)
    );
  });

  if (activeBeneficiary) {
    const benAssignments = assignments.filter(
      a => a.beneficiary_id === activeBeneficiary.id || a.beneficiary_code === activeBeneficiary.beneficiary_code || a.beneficiary_name === activeBeneficiary.full_name
    );

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#006B56] to-[#004D3D] text-white p-4 sticky top-0 z-30 shadow-md flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveBeneficiary(null)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold leading-tight">Beneficiary Case Profile</h1>
              <p className="text-xs text-emerald-200/90 font-mono">{activeBeneficiary.beneficiary_code}</p>
            </div>
          </div>

          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-100 border border-emerald-300/30">
            {activeBeneficiary.verification_status || 'Verified Active'}
          </span>
        </div>

        {/* Details Content */}
        <div className="p-4 space-y-4 flex-1 pb-24 max-w-xl mx-auto w-full">
          
          {/* Main Profile Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-4">
            <div className="flex items-center space-x-4">
              <img
                src={activeBeneficiary.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}
                alt={activeBeneficiary.full_name}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#006B56]/20 shadow-xs"
              />
              <div>
                <h2 className="text-lg font-bold text-slate-900">{activeBeneficiary.full_name}</h2>
                <p className="text-xs text-[#006B56] font-bold">Household Head &bull; {activeBeneficiary.gender || 'Female'}</p>
                <p className="text-xs text-slate-500 mt-0.5">{activeBeneficiary.vulnerability_category || 'General Humanitarian Aid'}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Household Size:</span>
                <span className="font-bold text-slate-800">{activeBeneficiary.household_size || 6} Registered Members</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Operational Location:</span>
                <span className="font-bold text-slate-800">{activeBeneficiary.location || 'Kapoeta South, Eastern Equatoria'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Contact Phone:</span>
                <span className="font-bold text-[#006B56]">{activeBeneficiary.phone_number || '+211-920-000000'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Registration Date:</span>
                <span className="font-mono text-slate-700">{activeBeneficiary.registration_date || '2025-01-10'}</span>
              </div>
            </div>
          </div>

          {/* Assistance Requests Linked */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-[#006B56]" />
              <span>Assistance Requests ({benAssignments.length})</span>
            </h3>

            {benAssignments.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No active assistance requests recorded for this beneficiary.</p>
            ) : (
              <div className="space-y-2">
                {benAssignments.map(req => (
                  <div key={req.id || req.request_code} className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-[#006B56] font-mono">{req.request_code}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">{req.status}</span>
                    </div>
                    <p className="font-medium text-slate-800">{req.assistance_type || req.category}</p>
                    <p className="text-[11px] text-slate-500">Officer: {req.assigned_field_worker_name || 'Pending'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-24">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Beneficiary Case Index</h2>
            <p className="text-xs text-slate-500">Assigned households under supervision</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-[#006B56]/10 text-[#006B56] rounded-xl border border-[#006B56]/20">
            {beneficiaries.length} Verified
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID code, location, phone..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B56]"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {filteredBens.map(b => (
          <div
            key={b.id || b.beneficiary_code}
            onClick={() => setActiveBeneficiary(b)}
            className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <img
                src={b.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}
                alt={b.full_name}
                className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">{b.full_name}</h3>
                <p className="text-xs text-[#006B56] font-mono">{b.beneficiary_code}</p>
                <p className="text-[11px] text-slate-500 flex items-center space-x-1 truncate mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{b.location || 'Kapoeta South, Eastern Equatoria'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {b.verification_status || 'Verified'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
