import React, { useState, useMemo } from 'react';
import {
  Truck,
  Search,
  ShieldCheck,
  Building2,
  Radio,
  Zap,
  CheckCircle2,
  Wrench,
  Layers,
  DollarSign
} from 'lucide-react';

export function InventoryResourcesView({
  resources = [],
  warehouses = []
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        (r.name || '').toLowerCase().includes(q) ||
        (r.category || '').toLowerCase().includes(q) ||
        (r.warehouse || '').toLowerCase().includes(q) ||
        (r.programme || '').toLowerCase().includes(q) ||
        (r.assigned_driver || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;

      return true;
    });
  }, [resources, searchTerm, categoryFilter]);

  const categories = useMemo(() => {
    const set = new Set();
    resources.forEach(r => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set).sort();
  }, [resources]);

  const stats = useMemo(() => {
    const totalAssets = resources.length;
    const totalVal = resources.reduce((sum, r) => sum + ((Number(r.quantity_available) || 1) * (Number(r.unit_cost) || 0)), 0);
    const operationalCount = resources.filter(r => (r.status || '').toLowerCase().includes('operat') || (r.status || '').toLowerCase().includes('normal') || (r.status || '').toLowerCase().includes('deploy')).length;
    const maintenanceCount = resources.filter(r => (r.status || '').toLowerCase().includes('maint') || (r.status || '').toLowerCase().includes('low')).length;

    return { totalAssets, totalVal, operationalCount, maintenanceCount };
  }, [resources]);

  const getCategoryIcon = (cat = '') => {
    const lower = cat.toLowerCase();
    if (lower.includes('fleet') || lower.includes('truck') || lower.includes('transport')) return <Truck className="w-4 h-4 text-blue-600" />;
    if (lower.includes('wash') || lower.includes('water')) return <Layers className="w-4 h-4 text-teal-600" />;
    if (lower.includes('cold') || lower.includes('vaccine') || lower.includes('health')) return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
    if (lower.includes('comm') || lower.includes('starlink')) return <Radio className="w-4 h-4 text-indigo-600" />;
    if (lower.includes('power') || lower.includes('generator')) return <Zap className="w-4 h-4 text-amber-600" />;
    return <Building2 className="w-4 h-4 text-slate-600" />;
  };

  const operationalPct = stats.totalAssets > 0 ? Math.round((stats.operationalCount / stats.totalAssets) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-5">
      
      {/* 1. METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Fleet & Assets
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-slate-900">{stats.totalAssets}</span>
              <span className="text-xs font-semibold text-slate-500">Units</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">Equipment & fleet</span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 ml-2">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Asset Value
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-slate-900">${stats.totalVal.toLocaleString()}</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-teal-600 block truncate">Humanitarian capital</span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 ml-2">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Mission Ready
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-emerald-900">{stats.operationalCount}</span>
              <span className="text-xs font-semibold text-emerald-700">Ready</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-emerald-600 block truncate">{operationalPct}% active</span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-[#006B56] flex items-center justify-center shrink-0 ml-2">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Maintenance
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-amber-900">{stats.maintenanceCount}</span>
              <span className="text-xs font-semibold text-amber-700">Units</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-amber-600 block truncate">Servicing queue</span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 ml-2">
            <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* 2. CONTROLS TOOLBAR */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search trucks, cold chains, generators, or asset..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900 transition"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-[#006B56]"
        >
          <option value="ALL">🚜 All Asset Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* 3. ASSET CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {filteredResources.map(r => (
          <div
            key={r.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4.5 shadow-xs hover:border-slate-300 transition space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                    {getCategoryIcon(r.category)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs leading-snug truncate">{r.name}</h4>
                    <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-0.5">
                      {r.category}
                    </span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                  (r.status || '').toLowerCase().includes('normal') || (r.status || '').toLowerCase().includes('operat') || (r.status || '').toLowerCase().includes('deploy')
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {r.status || 'Operational'}
                </span>
              </div>

              {/* Assignment Details */}
              <div className="p-2.5 rounded-xl bg-slate-50 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Base Depot:</span>
                  <span className="font-semibold text-slate-800 text-right truncate max-w-[160px]">{r.warehouse || 'Unassigned'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Programme:</span>
                  <span className="font-medium text-slate-700 text-right truncate max-w-[160px]">{r.programme || 'General Relief'}</span>
                </div>
                {r.assigned_driver && r.assigned_driver !== 'N/A' && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Operator:</span>
                    <span className="font-bold text-indigo-900 truncate max-w-[160px]">{r.assigned_driver}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Value & Quantity */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Unit Value</span>
                <span className="font-black text-slate-900 font-mono">
                  ${Number(r.unit_cost || 0).toLocaleString()}
                </span>
              </div>

              <div className="text-right">
                <span className="text-slate-400 text-[10px] block">Available</span>
                <span className="font-black text-[#006B56] font-mono">
                  {r.quantity_available || 1} {r.unit || 'Units'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
