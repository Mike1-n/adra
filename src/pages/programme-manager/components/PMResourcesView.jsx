import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  AlertTriangle,
  CheckCircle2,
  Building,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  TrendingDown,
  Warehouse
} from 'lucide-react';

export function PMResourcesView({
  resources = [],
  programmes = []
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterWarehouse, setFilterWarehouse] = useState('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Categories & Warehouses
  const { categories, warehouses } = useMemo(() => {
    const cat = new Set();
    const wh = new Set();
    resources.forEach(r => {
      if (r.category) cat.add(r.category);
      if (r.warehouse) wh.add(r.warehouse);
    });
    return {
      categories: Array.from(cat).sort(),
      warehouses: Array.from(wh).sort()
    };
  }, [resources]);

  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = (r.name || '').toLowerCase().includes(q);
        const matchesProg = (r.program_name || '').toLowerCase().includes(q);
        const matchesWh = (r.warehouse || '').toLowerCase().includes(q);
        if (!matchesName && !matchesProg && !matchesWh) return false;
      }
      if (filterCategory !== 'ALL' && r.category !== filterCategory) return false;
      if (filterWarehouse !== 'ALL' && r.warehouse !== filterWarehouse) return false;
      if (onlyLowStock && !r.is_low_stock) return false;
      return true;
    });
  }, [resources, searchTerm, filterCategory, filterWarehouse, onlyLowStock]);

  const lowStockCount = useMemo(() => {
    return resources.filter(r => r.is_low_stock).length;
  }, [resources]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-[#006B56]" />
            Programme Commodities & Resource Inventories
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Track warehouse stock levels, commodities allocated for field distribution, burn rates, and replenishment thresholds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lowStockCount > 0 && (
            <button
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                onlyLowStock
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {lowStockCount} Low-Stock Alerts
            </button>
          )}
          <span className="text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <strong>{filteredResources.length}</strong> Tracked Commodities
          </span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search commodity, programme, or warehouse..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006B56] outline-none"
          />
        </div>

        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006B56] outline-none bg-white text-slate-700"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterWarehouse}
            onChange={(e) => setFilterWarehouse(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006B56] outline-none bg-white text-slate-700"
          >
            <option value="ALL">All Warehouses / Depots</option>
            {warehouses.map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Resources Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Resource Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Programme</th>
                <th className="py-3.5 px-4">Warehouse</th>
                <th className="py-3.5 px-4">Available</th>
                <th className="py-3.5 px-4">Allocated</th>
                <th className="py-3.5 px-4">Distributed</th>
                <th className="py-3.5 px-4">Remaining</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-500">
                    <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700">No resources match your filters</p>
                  </td>
                </tr>
              ) : (
                filteredResources.map((res) => {
                  const available = Number(res.quantity_available) || 0;
                  const allocated = Number(res.quantity_allocated) || 0;
                  const distributed = Number(res.quantity_distributed) || 0;
                  const remaining = Math.max(0, available - allocated);
                  const isLow = res.is_low_stock || remaining < (res.low_stock_threshold || 100);

                  return (
                    <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">{res.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">ID: {res.id}</div>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-700">
                        {res.category}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-emerald-800">
                        {res.program_name}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                          {res.warehouse}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-xs text-slate-800">
                        {available.toLocaleString()} <span className="text-[11px] text-slate-400 font-normal">{res.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-amber-700 font-semibold">
                        {allocated.toLocaleString()} <span className="text-[11px] text-slate-400 font-normal">{res.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-emerald-700 font-semibold">
                        {distributed.toLocaleString()} <span className="text-[11px] text-slate-400 font-normal">{res.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-xs font-bold text-slate-900">
                        {remaining.toLocaleString()} <span className="text-[11px] text-slate-400 font-normal">{res.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Healthy
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
