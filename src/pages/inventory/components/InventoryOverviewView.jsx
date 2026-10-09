import React, { useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  Truck,
  Building2,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Layers,
  ChevronRight,
  Plus,
  PackagePlus,
  SlidersHorizontal,
  ShoppingCart
} from 'lucide-react';

export function InventoryOverviewView({
  inventory = [],
  warehouses = [],
  dispatches = [],
  purchaseOrders = [],
  onNavigateTab,
  onOpenReceiveModal,
  onOpenAdjustModal,
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

  // Aggregated depot stock
  const depotBreakdown = useMemo(() => {
    const map = {};
    warehouses.forEach(w => {
      map[w.name] = {
        name: w.name,
        location: w.location || w.state || 'South Sudan',
        count: 0,
        units: 0
      };
    });

    inventory.forEach(item => {
      const whName = item.warehouse || 'Juba Central Warehouse';
      if (!map[whName]) {
        map[whName] = { name: whName, location: 'State Depot', count: 0, units: 0 };
      }
      map[whName].count += 1;
      map[whName].units += Number(item.quantity) || 0;
    });

    return Object.values(map).slice(0, 4);
  }, [warehouses, inventory]);

  return (
    <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-200">
      
      {/* 1. TOP 4 COMPACT EXECUTIVE KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        
        {/* Metric 1: Total Stock Units */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('stock')}
          className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center justify-between group active:scale-[0.99]"
        >
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Total Units
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">
                {totalUnits.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 hidden sm:block truncate mt-0.5">
              {warehouses.length || 10} State Depots
            </span>
          </div>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 ml-1.5 group-hover:scale-105 transition">
            <Layers className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
        </div>

        {/* Metric 2: Low Stock Alerts */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('stock')}
          className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border shadow-2xs transition cursor-pointer flex items-center justify-between group active:scale-[0.99] ${
            lowStockItems.length > 0 
              ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-100/60' 
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block truncate">
              Low Stock
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg sm:text-2xl font-black text-amber-950 leading-tight">
                {lowStockItems.length}
              </span>
              <span className="text-[10px] sm:text-xs font-black text-amber-900">Alerts</span>
            </div>
            <span className="text-[10px] text-amber-800/90 font-medium hidden sm:block truncate mt-0.5">
              Requires Action
            </span>
          </div>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 ml-1.5 shadow-xs group-hover:scale-105 transition">
            <AlertTriangle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
        </div>

        {/* Metric 3: Active Convoys */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('dispatches')}
          className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center justify-between group active:scale-[0.99]"
        >
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Convoys
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg sm:text-2xl font-black text-blue-900 leading-tight">
                {inTransitDispatches.length}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500">Transit</span>
            </div>
            <span className="text-[10px] text-blue-700 font-medium hidden sm:block truncate mt-0.5">
              Active Waybills
            </span>
          </div>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 ml-1.5 group-hover:scale-105 transition">
            <Truck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
        </div>

        {/* Metric 4: State Depots */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('warehouses')}
          className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center justify-between group active:scale-[0.99]"
        >
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Depots
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">
                {warehouses.length || 10}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500">Hubs</span>
            </div>
            <span className="text-[10px] text-[#006B56] font-medium hidden sm:block truncate mt-0.5">
              South Sudan
            </span>
          </div>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-50 text-[#006B56] flex items-center justify-center shrink-0 ml-1.5 group-hover:scale-105 transition">
            <Building2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
        </div>

      </div>

      {/* 2. QUICK ACTIONS BAR */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Quick Actions
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Receive Stock */}
          <button
            type="button"
            onClick={() => onOpenReceiveModal && onOpenReceiveModal()}
            className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 text-emerald-950 flex items-center gap-2 sm:gap-2.5 transition cursor-pointer active:scale-95 text-left group"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#006B56] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition">
              <PackagePlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold block truncate leading-tight text-slate-900">Receive Stock</span>
              <span className="text-[10px] text-emerald-700 font-medium block truncate">GRN Inward</span>
            </div>
          </button>

          {/* Issue Waybill */}
          <button
            type="button"
            onClick={() => onOpenCreateDispatchModal && onOpenCreateDispatchModal()}
            className="p-2 sm:p-2.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 text-blue-950 flex items-center gap-2 sm:gap-2.5 transition cursor-pointer active:scale-95 text-left group"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition">
              <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold block truncate leading-tight text-slate-900">Issue Waybill</span>
              <span className="text-[10px] text-blue-700 font-medium block truncate">Field Dispatch</span>
            </div>
          </button>

          {/* Adjust Count */}
          <button
            type="button"
            onClick={() => onOpenAdjustModal && onOpenAdjustModal()}
            className="p-2 sm:p-2.5 rounded-xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 text-amber-950 flex items-center gap-2 sm:gap-2.5 transition cursor-pointer active:scale-95 text-left group"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition">
              <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold block truncate leading-tight text-slate-900">Adjust Count</span>
              <span className="text-[10px] text-amber-800 font-medium block truncate">Audit / Balance</span>
            </div>
          </button>

          {/* Request Supplies */}
          <button
            type="button"
            onClick={() => onOpenCreatePOModal && onOpenCreatePOModal()}
            className="p-2 sm:p-2.5 rounded-xl bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200 text-purple-950 flex items-center gap-2 sm:gap-2.5 transition cursor-pointer active:scale-95 text-left group"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition">
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold block truncate leading-tight text-slate-900">Request PO</span>
              <span className="text-[10px] text-purple-700 font-medium block truncate">Supplier Order</span>
            </div>
          </button>
        </div>
      </div>

      {/* 3. OPERATIONAL DASHBOARD: ACTIVE CONVOYS & DISPATCHES */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4 text-blue-700" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">Active Convoys & Transit</h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate hidden sm:block">Real-time field shipments en route</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('dispatches')}
            className="text-xs font-bold text-[#006B56] hover:underline cursor-pointer"
          >
            All Waybills
          </button>
        </div>

        {inTransitDispatches.length === 0 ? (
          <div className="p-3 sm:p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Truck className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-600 font-semibold truncate">No active field convoys currently en route</span>
            </div>
            <button
              type="button"
              onClick={() => onOpenCreateDispatchModal && onOpenCreateDispatchModal()}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-2xs flex items-center gap-1 shrink-0 transition cursor-pointer active:scale-95"
            >
              <Plus className="w-3 h-3" />
              <span>Issue Waybill</span>
            </button>
          </div>
        ) : (
          <div className="space-y-1.5 sm:space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {inTransitDispatches.map((disp, idx) => (
                <div
                  key={disp.id || disp.waybill_number || idx}
                  className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-black text-blue-950">
                      #{disp.waybill_number || `WB-2026-00${idx + 1}`}
                    </span>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-amber-200 text-amber-950 rounded">
                      In Transit
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-700">
                    <p className="font-bold truncate">{disp.items_summary || disp.cargo_description || 'Humanitarian Supplies'}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5 flex items-center gap-1 truncate">
                      <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                      <span className="truncate">Dest: <strong>{disp.destination_hub || disp.payam || 'Field Hub'}</strong></span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => onOpenCreateDispatchModal && onOpenCreateDispatchModal()}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300/80 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Issue New Waybill</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. STATE DEPOTS NETWORK SUMMARY (Compact / High-density) */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Building2 className="w-4 h-4 text-[#006B56] shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">State Relief Depots</h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('warehouses')}
            className="text-xs font-bold text-[#006B56] hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
          >
            <span>All {warehouses.length || 10}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {depotBreakdown.map((wh, idx) => (
            <div
              key={wh.name || idx}
              onClick={() => onNavigateTab && onNavigateTab('warehouses')}
              className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-slate-50/80 border border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-50/20 transition cursor-pointer space-y-0.5"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold text-slate-900 truncate block">{wh.name}</span>
                <span className="text-[9px] font-mono font-black text-emerald-800 bg-emerald-100/80 px-1 py-0.2 rounded shrink-0">
                  {wh.units > 0 ? `${wh.units.toLocaleString()}` : '0'}
                </span>
              </div>
              <p className="text-[9px] text-slate-400 flex items-center gap-1 truncate">
                <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                <span className="truncate">{wh.location}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

