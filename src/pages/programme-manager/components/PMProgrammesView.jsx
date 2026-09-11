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
  ChevronRight
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
        activeBeneficiaries,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#006B56]" />
            Humanitarian Programmes Directory
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Monitor programme performance indicators, beneficiary targets, operational response capacity, and resource allocations.
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <strong>{filteredProgrammes.length}</strong> Active Humanitarian Portfolios
        </span>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by programme name, code, or sector..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006B56] outline-none"
          />
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006B56] outline-none bg-white text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active Programmes</option>
            <option value="Planned">Planned</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Programmes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProgrammes.map(prog => {
          const reachPct = prog.target_beneficiaries
            ? Math.min(100, Math.round((prog.activeBeneficiaries / prog.target_beneficiaries) * 100))
            : 35;

          return (
            <div
              key={prog.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-[#006B56]/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {prog.code || 'ADRA-PRG'}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    prog.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {prog.status || 'Active'}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base leading-snug hover:text-[#006B56] transition-colors">
                  {prog.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {prog.description || 'Targeted emergency relief, food aid, and basic human welfare support in South Sudan priority zones.'}
                </p>

                {/* Progress Towards Target */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500 font-medium">Beneficiary Target Reach:</span>
                    <span className="font-bold text-slate-800">{reachPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#006B56] h-full rounded-full transition-all duration-500"
                      style={{ width: `${reachPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>Active: {prog.activeBeneficiaries.toLocaleString()}</span>
                    <span>Target: {(prog.target_beneficiaries || 15000).toLocaleString()}</span>
                  </div>
                </div>

                {/* Quick Metric Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mt-4 bg-slate-50 p-2.5 rounded-lg text-center text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Active Reqs</span>
                    <span className="font-bold text-amber-700">{prog.activeRequests}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Fulfilled</span>
                    <span className="font-bold text-emerald-700">{prog.completedRequests}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Stock Units</span>
                    <span className="font-bold text-slate-800">{prog.totalResourceUnits.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Action footer */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {prog.sector || prog.type || 'Emergency Response'}
                </span>
                <button
                  onClick={() => setSelectedProgramme(prog)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#006B56] hover:text-[#005242]"
                >
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* PROGRAMME DETAIL MODAL */}
      {selectedProgramme && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#006B56] text-white flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-200 bg-emerald-800/80 px-2 py-0.5 rounded">
                  {selectedProgramme.code}
                </span>
                <h3 className="text-lg font-bold mt-1 text-white">{selectedProgramme.name}</h3>
              </div>
              <button
                onClick={() => setSelectedProgramme(null)}
                className="p-1 text-emerald-100 hover:text-white rounded-lg hover:bg-emerald-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-sm text-slate-800">
              <p className="text-slate-600 text-xs">
                {selectedProgramme.description}
              </p>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block">Sector Classification:</span>
                  <span className="font-bold text-slate-800">{selectedProgramme.sector || selectedProgramme.type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Current Status:</span>
                  <span className="font-bold text-emerald-700">{selectedProgramme.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Target Beneficiaries:</span>
                  <span className="font-bold text-slate-800">{(selectedProgramme.target_beneficiaries || 15000).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Active Verified Households:</span>
                  <span className="font-bold text-slate-800">{selectedProgramme.activeBeneficiaries.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">
                  Allocated Resource Inventories
                </h4>
                {selectedProgramme.progResources && selectedProgramme.progResources.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700 font-semibold">
                        <tr>
                          <th className="py-2 px-3">Item</th>
                          <th className="py-2 px-3">Warehouse</th>
                          <th className="py-2 px-3">Available</th>
                          <th className="py-2 px-3">Allocated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedProgramme.progResources.map(r => (
                          <tr key={r.id}>
                            <td className="py-2 px-3 font-medium text-slate-900">{r.name}</td>
                            <td className="py-2 px-3 text-slate-600">{r.warehouse || 'Juba Central'}</td>
                            <td className="py-2 px-3 font-bold text-emerald-700">{r.quantity_available} {r.unit}</td>
                            <td className="py-2 px-3 text-slate-600">{r.quantity_allocated} {r.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-slate-200">
                    No specific warehouse stock assigned to this programme yet.
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedProgramme(null)}
                className="px-4 py-2 bg-[#006B56] text-white text-xs font-bold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
