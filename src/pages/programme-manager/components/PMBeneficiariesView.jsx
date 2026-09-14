import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MapPin,
  Calendar,
  Phone,
  Layers,
  Clock,
  Eye,
  X,
  Lock,
  UserCheck,
  Home,
  Check
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

export function PMBeneficiariesView({
  beneficiaries = [],
  requests = [],
  programmes = [],
  onSelectRequest
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('ALL');
  const [filterProgramme, setFilterProgramme] = useState('ALL');
  const [filterVerification, setFilterVerification] = useState('ALL');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);

  // States list
  const statesList = useMemo(() => {
    const s = new Set();
    beneficiaries.forEach(b => {
      if (b.state) s.add(b.state);
    });
    return Array.from(s).sort();
  }, [beneficiaries]);

  // Filtered beneficiaries
  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter(b => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = (b.full_name || b.name || '').toLowerCase().includes(query);
        const matchesId = (b.id || b.individual_id || b.beneficiary_code || '').toLowerCase().includes(query);
        const matchesPhone = (b.phone || b.phone_number || '').includes(query);
        if (!matchesName && !matchesId && !matchesPhone) return false;
      }

      if (filterState !== 'ALL' && b.state !== filterState) return false;
      if (filterVerification !== 'ALL') {
        const isVerified = b.verified || b.status === 'Verified Active' || b.verification_status === 'Verified Active';
        if (filterVerification === 'Verified' && !isVerified) return false;
        if (filterVerification === 'Unverified' && isVerified) return false;
      }

      if (filterProgramme !== 'ALL') {
        const hasReq = requests.some(r => 
          (r.beneficiary_id === b.id || r.beneficiary_id === b.individual_id) &&
          (r.program_name === filterProgramme || r.program_id === filterProgramme)
        );
        if (!hasReq) return false;
      }

      return true;
    });
  }, [beneficiaries, requests, searchTerm, filterState, filterVerification, filterProgramme]);

  // Beneficiary requests and history
  const getBeneficiaryData = (bId) => {
    const allReqs = requests.filter(r => r.beneficiary_id === bId);
    const activeReqs = allReqs.filter(r => r.status !== 'Completed' && r.status !== 'Fulfilled' && r.status !== 'Rejected');
    const completedReqs = allReqs.filter(r => r.status === 'Completed' || r.status === 'Fulfilled');
    const participatedPrograms = Array.from(new Set(allReqs.map(r => r.program_name || 'Emergency Relief')));
    return { allReqs, activeReqs, completedReqs, participatedPrograms };
  };

  return (
    <div className="space-y-3.5">
      {/* Search & State Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search beneficiary name, ID, phone..."
            className="w-full pl-9 pr-8 py-2.5 text-xs bg-white border border-slate-200/90 rounded-2xl focus:ring-2 focus:ring-[#006B56] outline-none shadow-xs font-semibold"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <select
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
          className="px-3 py-2.5 text-xs border border-slate-200/90 rounded-2xl bg-white font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#006B56] shadow-xs"
        >
          <option value="ALL">All States</option>
          {statesList.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Beneficiaries Mobile List */}
      <div className="space-y-2.5">
        {filteredBeneficiaries.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-3xl border border-slate-200/90 p-6 text-slate-400">
            <Users className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
            <p className="font-bold text-xs text-slate-600">No beneficiaries match search criteria</p>
          </div>
        ) : (
          filteredBeneficiaries.map(ben => {
            const { allReqs, activeReqs, completedReqs } = getBeneficiaryData(ben.id);

            return (
              <div
                key={ben.id}
                className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      {ben.beneficiary_code || ben.id}
                    </span>
                    <h4 className="font-black text-sm text-slate-900 truncate mt-0.5">
                      {ben.full_name || ben.name}
                    </h4>
                    <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{ben.county ? `${ben.county}, ${ben.state || ''}` : (ben.location || 'South Sudan')}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-200 shrink-0">
                    Verified
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-semibold">Household Size</span>
                    <span className="font-bold text-slate-800">{ben.household_size || 5} Members</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-semibold">Assistance Logs</span>
                    <span className="font-bold text-[#006B56]">{allReqs.length} Aid Records</span>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setSelectedBeneficiary(ben)}
                      className="px-3 py-1.5 bg-slate-200/70 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition"
                    >
                      History →
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Beneficiary History Sheet */}
      {selectedBeneficiary && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="font-mono text-[10px] font-bold text-slate-400">
                  {selectedBeneficiary.beneficiary_code || selectedBeneficiary.id}
                </span>
                <h3 className="font-black text-base text-slate-900">{selectedBeneficiary.full_name || selectedBeneficiary.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBeneficiary(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Assistance History List */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-700">Assistance Requests & Deliveries:</h4>
              {(() => {
                const { allReqs } = getBeneficiaryData(selectedBeneficiary.id);
                if (allReqs.length === 0) {
                  return <p className="text-slate-400 italic">No previous assistance records recorded.</p>;
                }
                return allReqs.map(r => (
                  <div key={r.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{r.assistance_type || r.category || 'Humanitarian Aid'}</div>
                      <div className="text-[10px] text-slate-500">{formatDate(r.created_at)} • {r.status}</div>
                    </div>
                    {onSelectRequest && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectRequest(r);
                          setSelectedBeneficiary(null);
                        }}
                        className="text-xs font-bold text-[#006B56] hover:underline"
                      >
                        Inspect
                      </button>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PMBeneficiariesView;
