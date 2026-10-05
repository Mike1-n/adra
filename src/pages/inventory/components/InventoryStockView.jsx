import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  SlidersHorizontal,
  PackagePlus,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  Trash2,
  Tag,
  MapPin,
  XCircle,
  Filter
} from 'lucide-react';

export function InventoryStockView({
  inventory = [],
  warehouses = [],
  onOpenReceiveModal,
  onOpenAdjustModal,
  onDeleteItem,
  onClearAllStock
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'LOW_STOCK' | 'IN_STOCK' | 'OUT_OF_STOCK'

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set();
    inventory.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set).sort();
  }, [inventory]);

  // Unified items display:
  // - When selectedWarehouse === 'ALL', aggregate commodity rows across all depots and calculate total quantity.
  // - When selectedWarehouse !== 'ALL', filter down to that specific depot.
  const displayItems = useMemo(() => {
    if (selectedWarehouse !== 'ALL') {
      return inventory.filter(item => {
        if (item.warehouse !== selectedWarehouse) return false;
        if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
        const q = searchTerm.toLowerCase();
        const matchesSearch =
          (item.item_name || '').toLowerCase().includes(q) ||
          (item.sku || '').toLowerCase().includes(q) ||
          (item.batch_number || '').toLowerCase().includes(q) ||
          (item.category || '').toLowerCase().includes(q);

        if (!matchesSearch) return false;

        if (statusFilter === 'LOW_STOCK') {
          return item.status === 'Low Stock' || (item.quantity > 0 && item.quantity < (item.min_threshold || 10));
        }
        if (statusFilter === 'OUT_OF_STOCK') {
          return item.quantity <= 0 || item.status === 'Out of Stock';
        }
        if (statusFilter === 'IN_STOCK') {
          return item.quantity >= (item.min_threshold || 10);
        }

        return true;
      });
    }

    // Normalization helper for consistent aggregation across state depots
    const normalizeKey = (str) => (str || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, '').trim();

    // When "ALL" is selected: aggregate total counts across all depots for each commodity
    const map = new Map();
    inventory.forEach(item => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return;
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        (item.item_name || '').toLowerCase().includes(q) ||
        (item.sku || '').toLowerCase().includes(q) ||
        (item.batch_number || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q);

      if (!matchesSearch) return;

      const normKey = normalizeKey(item.item_name) || (item.sku || '').toLowerCase();
      if (!map.has(normKey)) {
        map.set(normKey, {
          ...item,
          quantity: Number(item.quantity) || 0,
          min_threshold: Number(item.min_threshold) || 10,
          depot_count: item.warehouse ? 1 : 0,
          depots: item.warehouse ? [item.warehouse] : []
        });
      } else {
        const existing = map.get(normKey);
        existing.quantity += Number(item.quantity) || 0;
        existing.min_threshold += Number(item.min_threshold) || 10;
        // Prefer more descriptive name if available
        if (item.item_name && item.item_name.length > existing.item_name.length) {
          existing.item_name = item.item_name;
          existing.unit = item.unit || existing.unit;
        }
        if (item.warehouse && !existing.depots.includes(item.warehouse)) {
          existing.depots.push(item.warehouse);
          existing.depot_count += 1;
        }
      }
    });

    const aggregated = Array.from(map.values()).map(item => {
      const isOut = item.quantity <= 0;
      const isLow = item.quantity > 0 && item.quantity < (item.min_threshold || 10);
      return {
        ...item,
        status: isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'
      };
    });

    if (statusFilter === 'LOW_STOCK') {
      return aggregated.filter(i => i.status === 'Low Stock');
    }
    if (statusFilter === 'OUT_OF_STOCK') {
      return aggregated.filter(i => i.status === 'Out of Stock');
    }
    if (statusFilter === 'IN_STOCK') {
      return aggregated.filter(i => i.status === 'In Stock');
    }

    return aggregated;
  }, [inventory, selectedWarehouse, selectedCategory, searchTerm, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const normalizeKey = (str) => (str || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, '').trim();
    const totalCommodities = new Set(inventory.map(i => normalizeKey(i.item_name))).size;
    const totalUnits = inventory.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
    const lowStockCount = inventory.filter(i => i.status === 'Low Stock' || (i.quantity > 0 && i.quantity < (i.min_threshold || 10))).length;
    const outOfStockCount = inventory.filter(i => i.quantity <= 0).length;

    return { totalCommodities, totalUnits, lowStockCount, outOfStockCount };
  }, [inventory]);

  return (
    <div className="space-y-4 sm:space-y-5">
      
      {/* 1. KEY METRICS SUMMARY ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Metric 1: Total SKUs */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Commodity Types
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-slate-900">{stats.totalCommodities || displayItems.length}</span>
              <span className="text-xs font-semibold text-slate-500">Items</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">Registered relief lines</span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-[#006B56] flex items-center justify-center shrink-0 ml-2">
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Metric 2: Total Units Available */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Total Stock Units
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-slate-900">{stats.totalUnits.toLocaleString()}</span>
              <span className="text-xs font-semibold text-slate-500">Units</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-[#006B56] font-medium block truncate">
              {selectedWarehouse !== 'ALL' ? `At ${selectedWarehouse}` : 'Across all 10 State Depots'}
            </span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 ml-2">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Metric 3: Low Stock Alerts */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'LOW_STOCK' ? 'ALL' : 'LOW_STOCK')}
          className={`p-3.5 sm:p-4 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition ${
            statusFilter === 'LOW_STOCK'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200/80 hover:border-amber-200'
          }`}
        >
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 uppercase tracking-wider block truncate">
              Low Stock Alerts
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-amber-900">{stats.lowStockCount}</span>
              <span className="text-xs font-semibold text-amber-700">Depleted</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-amber-600 block truncate">Tap to filter</span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 ml-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Metric 4: Active Hubs */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              State Relief Depots
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-slate-900">{warehouses.length}</span>
              <span className="text-xs font-semibold text-slate-500">Hubs</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">South Sudan network</span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 ml-2">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* 2. STREAMLINED SEARCH & CONTROLS TOOLBAR */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search commodity name, SKU, batch, or category..."
              className="w-full pl-9 pr-14 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px] font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {onClearAllStock && inventory.length > 0 && (
              <button
                type="button"
                onClick={onClearAllStock}
                className="px-3 sm:px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Clear and reset all stock items to empty catalog"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Clear Stock</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenAdjustModal}
              className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
              <span>Adjust Count</span>
            </button>

            <button
              type="button"
              onClick={onOpenReceiveModal}
              className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-[0.99] cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Receive Stock</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            {/* Warehouse / Depot Selector */}
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full sm:w-auto px-2.5 sm:px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-[#006B56]"
            >
              <option value="ALL">🏢 All State Depots (Aggregated)</option>
              {warehouses.map(w => (
                <option key={w.id || w.code} value={w.name}>
                  {w.name}
                </option>
              ))}
            </select>

            {/* Category Selector */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto px-2.5 sm:px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-[#006B56]"
            >
              <option value="ALL">📦 All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0 ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({displayItems.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('IN_STOCK')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0 ${
                statusFilter === 'IN_STOCK' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-800 hover:text-emerald-950'
              }`}
            >
              In Stock
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('LOW_STOCK')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0 ${
                statusFilter === 'LOW_STOCK' ? 'bg-amber-500 text-white shadow-2xs' : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              Low Stock
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('OUT_OF_STOCK')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0 ${
                statusFilter === 'OUT_OF_STOCK' ? 'bg-rose-600 text-white shadow-2xs' : 'text-rose-800 hover:text-rose-950'
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>
      </div>

      {/* 3. RESPONSIVE COMMODITY TABLE VIEW */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 sm:py-3 px-3 sm:px-4">Commodity & SKU</th>
                <th className="hidden sm:table-cell py-2.5 sm:py-3 px-3 sm:px-4">Category</th>
                {/* Depot column only shown when filtered by a specific depot */}
                {selectedWarehouse !== 'ALL' && (
                  <th className="py-2.5 sm:py-3 px-3 sm:px-4">Depot</th>
                )}
                <th className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">Available Qty</th>
                <th className="hidden lg:table-cell py-2.5 sm:py-3 px-3 sm:px-4">Batch / Expiry</th>
                <th className="py-2.5 sm:py-3 px-2 sm:px-4 text-center">Status</th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {displayItems.length === 0 ? (
                <tr>
                  <td colSpan={selectedWarehouse !== 'ALL' ? 7 : 6} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600 text-xs sm:text-sm">No commodities match your filter criteria.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting the search keywords or category selection.</p>
                  </td>
                </tr>
              ) : (
                displayItems.map((item) => {
                  const isLow = item.status === 'Low Stock' || (item.quantity > 0 && item.quantity < (item.min_threshold || 10));
                  const isOut = item.quantity <= 0;
                  const isExpiringSoon = item.expiry_date && item.expiry_date !== 'N/A' && new Date(item.expiry_date) < new Date(Date.now() + 90 * 24 * 3600 * 1000);

                  return (
                    <tr key={item.id || item.item_name} className="hover:bg-slate-50/80 transition group">
                      
                      {/* Commodity Name & SKU */}
                      <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                        <div className="min-w-[140px] max-w-[240px] sm:max-w-[320px]">
                          <span className="font-bold text-slate-900 block group-hover:text-[#006B56] transition leading-tight text-xs sm:text-[13px]">
                            {item.item_name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                            {item.sku || item.id}
                          </span>
                        </div>
                      </td>

                      {/* Category (sm and above) */}
                      <td className="hidden sm:table-cell py-2.5 sm:py-3 px-3 sm:px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-medium bg-slate-100 text-slate-700 whitespace-nowrap">
                          {item.category || 'General'}
                        </span>
                      </td>

                      {/* Depot Location (Only when a specific warehouse is filtered) */}
                      {selectedWarehouse !== 'ALL' && (
                        <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                          <span className="text-slate-700 font-medium truncate max-w-[140px] sm:max-w-[180px] block text-[11px] sm:text-xs">
                            {item.warehouse}
                          </span>
                        </td>
                      )}

                      {/* Available Quantity */}
                      <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right font-mono">
                        <span className={`font-extrabold text-xs sm:text-sm ${
                          isOut ? 'text-rose-600' : isLow ? 'text-amber-700' : 'text-slate-900'
                        }`}>
                          {Number(item.quantity).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1 font-sans font-medium">{item.unit || 'units'}</span>
                        <span className="text-[10px] text-slate-400 block font-sans">
                          {selectedWarehouse === 'ALL' 
                            ? (item.depot_count > 1 ? `In ${item.depot_count} State Depots` : 'Total in Network')
                            : `Min: ${item.min_threshold || 10}`
                          }
                        </span>
                      </td>

                      {/* Batch & Expiry (lg and above) */}
                      <td className="hidden lg:table-cell py-2.5 sm:py-3 px-3 sm:px-4 whitespace-nowrap">
                        <div>
                          <span className="font-mono text-[10px] sm:text-[11px] text-slate-600 block">
                            {item.batch_number || '—'}
                          </span>
                          <span className={`text-[10px] flex items-center gap-1 ${
                            isExpiringSoon ? 'text-rose-600 font-bold' : 'text-slate-400'
                          }`}>
                            <Calendar className="w-3 h-3 shrink-0" />
                            {item.expiry_date || 'No Expiry'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 sm:py-3 px-2 sm:px-4 text-center whitespace-nowrap">
                        {isOut ? (
                          <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                            <span>Low Stock</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                            <span>In Stock</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 sm:py-3 px-2 sm:px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenAdjustModal(item)}
                            title="Adjust stock count"
                            className="p-1 sm:p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition cursor-pointer"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteItem && (
                            <button
                              type="button"
                              onClick={() => onDeleteItem(item.id)}
                              title="Delete SKU"
                              className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
