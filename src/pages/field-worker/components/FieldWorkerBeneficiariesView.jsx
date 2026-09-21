import React, { useState, useMemo } from 'react';
import {
  Search,
  Users,
  UserPlus,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Shield,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export function FieldWorkerBeneficiariesView({
  beneficiaries = [],
  worker = {},
  onOpenRegisterBeneficiary,
  onStartAuditForBeneficiary
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter(b => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || (
        (b.full_name && b.full_name.toLowerCase().includes(q)) ||
        (b.beneficiary_code && b.beneficiary_code.toLowerCase().includes(q)) ||
        (b.location && b.location.toLowerCase().includes(q)) ||
        (b.phone_number && b.phone_number.includes(q))
      );

      const matchCat = filterCategory === 'all' || b.vulnerability_category === filterCategory;
      return matchQuery && matchCat;
    });
  }, [beneficiaries, searchQuery, filterCategory]);

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      
      {/* HEADER & SEARCH */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Community Household Registry</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enrolled beneficiaries across {worker.payam || 'Kapoeta Town'}, {worker.county || 'Kapoeta South'}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenRegisterBeneficiary}
            className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1.5 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Register Household
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by code, household name, phone, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-purple-600 outline-none transition"
          />
        </div>
      </div>

      {/* BENEFICIARIES LIST */}
      {filteredBeneficiaries.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No households found</h3>
          <p className="text-xs text-slate-500">Try changing your search term or enroll a new household.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBeneficiaries.map(ben => (
            <div
              key={ben.id || ben.beneficiary_code}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3 hover:shadow-xs transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">{ben.full_name}</h3>
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {ben.beneficiary_code}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{ben.location || 'Eastern Equatoria'} • {ben.phone_number || 'No phone'}</span>
                  </p>
                </div>

                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                  (ben.verification_status || ben.status) === 'Verified' || (ben.verification_status || '').includes('Verified')
                    ? 'bg-emerald-100 text-[#006B56]'
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  {ben.verification_status || ben.status || 'Pending Audit'}
                </span>
              </div>

              {/* Tag & Vulnerability */}
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Vulnerability Group:</span>
                  <span className="font-bold text-slate-800">{ben.vulnerability_category || 'General Community'}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block">Family Size:</span>
                  <span className="font-bold text-slate-800">{ben.household_members || 6} Members</span>
                </div>
              </div>

              {/* Footer action */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Enrolled: {ben.enrolled_date ? new Date(ben.enrolled_date).toLocaleDateString() : 'Sep 2026'}
                </span>

                <button
                  type="button"
                  onClick={() => onStartAuditForBeneficiary(ben)}
                  className="px-3 py-1.5 bg-[#006B56] hover:bg-[#005a48] text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  Conduct Audit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
