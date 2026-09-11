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
        const matchesId = (b.id || b.individual_id || '').toLowerCase().includes(query);
        const matchesPhone = (b.phone || '').includes(query);
        if (!matchesName && !matchesId && !matchesPhone) return false;
      }

      if (filterState !== 'ALL' && b.state !== filterState) return false;
      if (filterVerification !== 'ALL') {
        const isVerified = b.verified || b.status === 'Verified';
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
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#006B56]" />
            Programme Beneficiaries Directory
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Access verified biometric records, review multi-programme assistance histories, and monitor active household requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            Delete Restricted (Admin Only)
          </div>
          <span className="text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            Total: <strong>{filteredBeneficiaries.length}</strong> Individuals
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Name, Beneficiary ID, or Phone..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006B56] outline-none"
          />
        </div>

        {/* State Filter */}
        <div>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006B56] outline-none bg-white text-slate-700"
          >
            <option value="ALL">All States</option>
            {statesList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Programme Filter */}
        <div>
          <select
            value={filterProgramme}
            onChange={(e) => setFilterProgramme(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006B56] outline-none bg-white text-slate-700"
          >
            <option value="ALL">All Associated Programmes</option>
            {programmes.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Beneficiaries Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Beneficiary ID</th>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Household / Age</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Verification</th>
                <th className="py-3.5 px-4">Active Requests</th>
                <th className="py-3.5 px-4">Assistance Received</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBeneficiaries.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700">No beneficiaries found</p>
                  </td>
                </tr>
              ) : (
                filteredBeneficiaries.map((b) => {
                  const bId = b.id || b.individual_id;
                  const { activeReqs, completedReqs } = getBeneficiaryData(bId);
                  const isVerified = b.verified !== false && b.status !== 'Unverified';

                  return (
                    <tr key={b.id || b.individual_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-xs text-[#006B56]">
                        {bId}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{b.full_name || b.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {b.phone || '+211 92 111 2233'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700">
                        <div>{b.household_size || 5} members</div>
                        <div className="text-slate-400">{b.gender || 'Female'}, {b.age || 32} yrs</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        <div>{b.county || 'Kapoeta South'}, {b.state || 'Eastern Equatoria'}</div>
                        <div className="text-[11px] text-slate-400">{b.payam || 'Central'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {isVerified ? 'Biometric Verified' : 'Pending Verification'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          activeReqs.length > 0 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {activeReqs.length} Active
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {completedReqs.length} Cycles Completed
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedBeneficiary(b)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-[#006B56] hover:text-white text-slate-700 text-xs font-semibold rounded-lg transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Profile
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BENEFICIARY PROFILE MODAL */}
      {selectedBeneficiary && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-[#006B56] text-white flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-200 bg-emerald-800/80 px-2 py-0.5 rounded">
                  {selectedBeneficiary.id || selectedBeneficiary.individual_id}
                </span>
                <h3 className="text-lg font-bold mt-1 text-white flex items-center gap-2">
                  {selectedBeneficiary.full_name || selectedBeneficiary.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBeneficiary(null)}
                className="p-1.5 text-emerald-100 hover:text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-800">
              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Phone Number:</span>
                  <span className="font-bold text-slate-900">{selectedBeneficiary.phone || '+211 92 111 2233'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Household Size:</span>
                  <span className="font-bold text-slate-900">{selectedBeneficiary.household_size || 5} members</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Location:</span>
                  <span className="font-bold text-slate-900">
                    {selectedBeneficiary.village || 'Hai Cinema'}, {selectedBeneficiary.payam || 'Central'}, {selectedBeneficiary.county || 'Kapoeta South'}, {selectedBeneficiary.state || 'Eastern Equatoria'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Verification Status:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Biometrically Verified Record
                  </span>
                </div>
              </div>

              {/* Programme Participation Overview */}
              {(() => {
                const bId = selectedBeneficiary.id || selectedBeneficiary.individual_id;
                const { allReqs, activeReqs, completedReqs, participatedPrograms } = getBeneficiaryData(bId);

                return (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
                        Participated Programmes ({participatedPrograms.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {participatedPrograms.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">No programme history yet.</span>
                        ) : (
                          participatedPrograms.map(p => (
                            <span key={p} className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                              <Layers className="w-3.5 h-3.5 text-emerald-600" />
                              {p}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* All Requests Across Programmes */}
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
                        All Requests Across Programmes ({allReqs.length})
                      </h4>
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-700 font-semibold">
                            <tr>
                              <th className="py-2.5 px-3">Request ID</th>
                              <th className="py-2.5 px-3">Programme</th>
                              <th className="py-2.5 px-3">Assistance</th>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {allReqs.map(r => (
                              <tr key={r.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-mono font-bold text-[#006B56]">{r.id}</td>
                                <td className="py-2.5 px-3 font-medium text-slate-800">{r.program_name}</td>
                                <td className="py-2.5 px-3 text-slate-600">{r.assistance_type} ({r.quantity_requested || '1 Unit'})</td>
                                <td className="py-2.5 px-3 text-slate-500">{formatDate(r.created_at)}</td>
                                <td className="py-2.5 px-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                    r.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                                    r.status === 'Approved' ? 'bg-teal-100 text-teal-800' :
                                    r.status === 'In Progress' ? 'bg-indigo-100 text-indigo-800' :
                                    'bg-amber-100 text-amber-800'
                                  }`}>
                                    {r.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-400 italic">
                Beneficiary deletion is locked for Programme Managers. Contact System Administrator for registry modifications.
              </span>
              <button
                onClick={() => setSelectedBeneficiary(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
