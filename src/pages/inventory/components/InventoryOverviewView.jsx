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
      
      {/* 1. Unified KPI Metric Strip */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          
          {/* Total Units */}
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('stock')}
            className="p-3 sm:p-4 text-left hover:bg-slate-50/80 transition cursor-pointer"
          >
            <span className="text-[11px] font-semibold text-slate-500 block">Total Units</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 leading-tight block mt-0.5">
              {totalUnits.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
              {totalCommodities} Commodities
            </span>
          </button>

          {/* Low Stock Alerts */}
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('stock')}
            className="p-3 sm:p-4 text-left hover:bg-slate-50/80 transition cursor-pointer"
          >
            <span className="text-[11px] font-semibold text-slate-500 block">Low Stock</span>
            <span className={`text-xl sm:text-2xl font-black leading-tight block mt-0.5 ${
              lowStockItems.length > 0 ? 'text-amber-600' : 'text-slate-900'
            }`}>
              {lowStockItems.length}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
              {lowStockItems.length > 0 ? 'Requires action' : 'All normal'}
            </span>
          </button>

          {/* Active Convoys */}
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('dispatches')}
            className="p-3 sm:p-4 text-left hover:bg-slate-50/80 transition cursor-pointer"
          >
            <span className="text-[11px] font-semibold text-slate-500 block">Active Convoys</span>
            <span className="text-xl sm:text-2xl font-black text-blue-700 leading-tight block mt-0.5">
              {inTransitDispatches.length}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
              In transit
            </span>
          </button>

          {/* State Depots */}
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('warehouses')}
            className="p-3 sm:p-4 text-left hover:bg-slate-50/80 transition cursor-pointer"
          >
            <span className="text-[11px] font-semibold text-slate-500 block">State Depots</span>
            <span className="text-xl sm:text-2xl font-black text-[#006B56] leading-tight block mt-0.5">
              {warehouses.length || 10}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
              Regional hubs
            </span>
          </button>

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
            onClick={() => onOpenCreateDispatchModal && onOpenCreateDispatchModal()}
            className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition cursor-pointer active:scale-98"
          >
            <Truck className="w-4 h-4 shrink-0" />
            <span className="truncate">Issue Waybill</span>
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
