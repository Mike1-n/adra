import React, { useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  Truck,
  Building2,
  PackagePlus,
  ShoppingCart,
  ChevronRight
} from 'lucide-react';

export function InventoryOverviewView({
  inventory = [],
  warehouses = [],
  dispatches = [],
  purchaseOrders = [],
  approvedRequests = [],
  onNavigateTab,
  onOpenReceiveModal,
  onOpenCreateDispatchModal,
  onOpenCreatePOModal
}) {
  // Normalize item names
  const normalizeKey = (str) => (str || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, '').trim();

  // Metrics
  const totalCommodities = useMemo(() => {
    return new Set(inventory.map(i => normalizeKey(i.item_name))).size;
  }, [inventory]);

  const totalUnits = useMemo(() => {
    return inventory.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  }, [inventory]);

  const lowStockItems = useMemo(() => {
    return inventory.filter(i => 
      i.status === 'Low Stock' || 
      i.status === 'Out of Stock' || 
      (Number(i.quantity) > 0 && Number(i.quantity) < (Number(i.min_threshold) || 10)) ||
      Number(i.quantity) <= 0
    );
  }, [inventory]);

  const inTransitDispatches = useMemo(() => {
    return dispatches.filter(d => 
      d.status === 'In Transit' || 
      d.dispatch_status === 'In Transit' ||
      d.status === 'IN_TRANSIT'
    );
  }, [dispatches]);

  // Depots sorted by active stock
  const activeDepots = useMemo(() => {
    const map = {};
    warehouses.forEach(w => {
      map[w.name] = {
        name: w.name,
        location: w.location || w.state || 'South Sudan',
        units: 0
      };
    });

    inventory.forEach(item => {
      const whName = item.warehouse || 'Juba Central Warehouse';
      if (!map[whName]) {
        map[whName] = { name: whName, location: 'State Depot', units: 0 };
      }
      map[whName].units += Number(item.quantity) || 0;
    });

    const list = Object.values(map);
    const withStock = list.filter(w => w.units > 0).sort((a, b) => b.units - a.units);
    if (withStock.length > 0) return withStock.slice(0, 4);
    return list.slice(0, 3);
  }, [warehouses, inventory]);

  return (
    <div className="space-y-3 sm:space-y-4">
      
      {/* 1. Four Independent Vibrant KPI Metric Cards (Matching PM Overview Style) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        
        {/* Card 1: Total Units (Emerald) */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('stock')}
          className="bg-emerald-50/70 rounded-2xl p-3.5 border border-emerald-300 shadow-2xs hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-950">Total Units</span>
            <div className="w-8 h-8 rounded-xl bg-[#006B56] text-white flex items-center justify-center shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
              <Package className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-black text-emerald-950 tracking-tight">
              {totalUnits.toLocaleString()}
            </span>
            <span className="text-[10px] font-black text-emerald-900 bg-emerald-200/70 px-2 py-0.5 rounded-md">
              {totalCommodities} Commodities
            </span>
          </div>
        </div>

        {/* Card 2: Low Stock (Amber) */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('stock')}
          className="bg-amber-50/70 rounded-2xl p-3.5 border border-amber-300 shadow-2xs hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-950">Low Stock</span>
            <div className={`w-8 h-8 rounded-xl text-white flex items-center justify-center shadow-2xs shrink-0 group-hover:scale-105 transition-transform ${
              lowStockItems.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-black text-amber-950 tracking-tight">
              {lowStockItems.length}
            </span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
              lowStockItems.length > 0
                ? 'text-amber-900 bg-amber-200/80 border border-amber-300'
                : 'text-slate-600 bg-slate-200/70'
            }`}>
              {lowStockItems.length > 0 ? 'Requires action' : 'All normal'}
            </span>
          </div>
        </div>

        {/* Card 3: Active Convoys (Blue) */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('dispatches')}
          className="bg-blue-50/70 rounded-2xl p-3.5 border border-blue-300 shadow-2xs hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-950">Active Convoys</span>
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
              <Truck className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-black text-blue-950 tracking-tight">
              {inTransitDispatches.length}
            </span>
            <span className="text-[10px] font-black text-blue-900 bg-blue-200/70 px-2 py-0.5 rounded-md">
              In transit
            </span>
          </div>
        </div>

        {/* Card 4: State Depots (Teal) */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('warehouses')}
          className="bg-teal-50/70 rounded-2xl p-3.5 border border-teal-300 shadow-2xs hover:shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-950">State Depots</span>
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
              <Building2 className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-black text-teal-950 tracking-tight">
              {warehouses.length || 10}
            </span>
            <span className="text-[10px] font-black text-teal-900 bg-teal-200/70 px-2 py-0.5 rounded-md">
              Regional hubs
            </span>
          </div>
        </div>

      </div>

      {/* 2. Compact Quick Actions Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
          Quick Actions
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onOpenReceiveModal && onOpenReceiveModal()}
            className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#006B56] font-semibold text-xs transition cursor-pointer active:scale-98"
          >
            <PackagePlus className="w-4 h-4 shrink-0" />
            <span className="truncate">Receive Stock</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab ? onNavigateTab('dispatches') : (onOpenCreateDispatchModal && onOpenCreateDispatchModal())}
            className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition cursor-pointer active:scale-98"
            title="Aid Dispatches & Waybills"
          >
            <Truck className="w-4 h-4 shrink-0" />
            <span className="truncate">Dispatches & Waybills</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenCreatePOModal && onOpenCreatePOModal()}
            className="flex items-center gap-2 p-2.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs transition cursor-pointer active:scale-98"
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span className="truncate">Request PO</span>
          </button>
        </div>
      </div>

      {/* 3. State Relief Depots */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 sm:p-4">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#006B56]" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              State Relief Depots
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('warehouses')}
            className="text-xs font-semibold text-[#006B56] hover:underline cursor-pointer"
          >
            All {warehouses.length || 10} →
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {activeDepots.map((wh, idx) => (
            <div
              key={wh.name || idx}
              onClick={() => onNavigateTab && onNavigateTab('warehouses')}
              className="py-2 flex items-center justify-between gap-2 hover:bg-slate-50 px-1 rounded transition cursor-pointer"
            >
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-900 block truncate">
                  {wh.name}
                </span>
                <span className="text-[11px] text-slate-400 block truncate">
                  {wh.location}
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-[#006B56] bg-emerald-50 px-2 py-0.5 rounded shrink-0">
                {wh.units.toLocaleString()} units
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
