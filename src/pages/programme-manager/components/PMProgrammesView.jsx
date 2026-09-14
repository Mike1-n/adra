import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  Package,
  ArrowUpRight,
  Filter,
  Eye,
  Activity,
  Calendar,
  Building,
  ChevronRight,
  X,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';

export function PMProgrammesView({
  programmes = [],
  requests = [],
  resources = [],
  onSelectProgramme
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedProgramme, setSelectedProgramme] = useState(null);

  // Compute metrics per programme
  const programmesWithMetrics = useMemo(() => {
    return programmes.map(p => {
      const progReqs = requests.filter(r => r.program_name === p.name || r.program_id === p.id);
      const activeRequests = progReqs.filter(r => r.status !== 'Completed' && r.status !== 'Fulfilled' && r.status !== 'Rejected').length;
      const completedRequests = progReqs.filter(r => r.status === 'Completed' || r.status === 'Fulfilled').length;
      const activeBeneficiaries = new Set(progReqs.map(r => r.beneficiary_id)).size;

      // Related resources
      const progResources = resources.filter(res => res.program_id === p.id || res.program_name === p.name);
      const totalResourceUnits = progResources.reduce((acc, r) => acc + (Number(r.quantity_available) || 0), 0);

      return {
        ...p,
        activeRequests,
        completedRequests,
        activeBeneficiaries: activeBeneficiaries > 0 ? activeBeneficiaries : (p.reached_beneficiaries || 1200),
        totalResourceUnits,
        progResources,
        progReqs
      };
    });
  }, [programmes, requests, resources]);

  const filteredProgrammes = useMemo(() => {
    return programmesWithMetrics.filter(p => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = (p.name || '').toLowerCase().includes(query);
        const matchesCode = (p.code || '').toLowerCase().includes(query);
        const matchesType = (p.type || p.sector || '').toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesType) return false;
      }
      if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
      return true;
    });
  }, [programmesWithMetrics, searchTerm, filterStatus]);

  return (
    <div className="space-y-3.5">
      {/* Search & Filter Header */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search programs, sectors, codes..."
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
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 text-xs border border-slate-200/90 rounded-2xl bg-white font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#006B56] shadow-xs"
        >
          <option value="ALL">All Status</option>
          <option value="Active">Active</option>
          <option value="Planned">Planned</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Programmes Mobile Cards List */}
      <div className="space-y-3">
        {filteredProgrammes.map((prog) => {
          const reachPct = prog.target_beneficiaries
            ? Math.min(100, Math.round((prog.activeBeneficiaries / prog.target_beneficiaries) * 100))
            : 64;

          return (
            <div
              key={prog.id}
              className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      {prog.code || prog.program_code || 'ADRA-PRG'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {prog.sector || prog.type || 'Humanitarian'}
                    </span>
                  </div>
                  <h3 className="font-black text-sm text-slate-900 mt-1">
                    {prog.name}
                  </h3>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                  prog.status === 'Active' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' : 'bg-slate-100 text-slate-700'
                }`}>
                  {prog.status || 'Active'}
                </span>
              </div>

              {/* Progress & Stats Card */}
              <div className="p-3 bg-slate-50 rounded-2xl space-y-2 text-xs">
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-500 font-semibold">Beneficiary Progress</span>
                    <span className="font-bold text-slate-800">{reachPct}% ({prog.activeBeneficiaries?.toLocaleString() || 0} reached)</span>
                  </div>
                  <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#006B56] h-full rounded-full transition-all duration-300"
                      style={{ width: `${reachPct}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/80 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Open Requests</span>
                    <span className="font-bold text-slate-800">{prog.activeRequests} active</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Depot Stock</span>
                    <span className="font-bold text-slate-800">{prog.totalResourceUnits} units</span>
                  </div>
                </div>
              </div>

              {/* Bottom Card Actions */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedProgramme(prog)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center gap-1 text-xs"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Dossier</span>
                </button>

                {onSelectProgramme && (
                  <button
                    type="button"
                    onClick={() => onSelectProgramme(prog)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#006B56] hover:bg-emerald-800 text-white font-bold transition active:scale-95 flex items-center gap-1 text-xs"
                  >
                    <span>Filter Scope</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Programme Details Modal */}
      {selectedProgramme && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  {selectedProgramme.code || 'ADRA-PRG'}
                </span>
                <h3 className="font-black text-base text-slate-900 mt-1">{selectedProgramme.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProgramme(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">
                {selectedProgramme.description || 'Targeted emergency relief, food aid, and basic human welfare support in South Sudan priority zones.'}
              </p>

              <div className="p-3 bg-slate-50 rounded-2xl space-y-2 border border-slate-200/80">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Sector:</span>
                  <span className="font-bold text-slate-900">{selectedProgramme.sector || selectedProgramme.type || 'Emergency Relief'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Budget Allocated:</span>
                  <span className="font-bold text-[#006B56]">{formatCurrency(selectedProgramme.budget || 250000)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Target Beneficiaries:</span>
                  <span className="font-bold text-slate-900">{selectedProgramme.target_beneficiaries?.toLocaleString() || '15,000 Individuals'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Status:</span>
                  <span className="font-bold text-emerald-800">{selectedProgramme.status || 'Active'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (onSelectProgramme) onSelectProgramme(selectedProgramme);
                  setSelectedProgramme(null);
                }}
                className="w-full py-2.5 bg-[#006B56] hover:bg-emerald-800 text-white font-bold rounded-2xl shadow-xs transition text-xs"
              >
                Filter Operations by this Programme
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PMProgrammesView;
