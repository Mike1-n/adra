import React, { useMemo } from 'react';
import {
  Building2,
  MapPin,
  User,
  Phone,
  ShieldCheck,
  ThermometerSnowflake
} from 'lucide-react';

export function InventoryWarehousesView({
  warehouses = [],
  inventory = []
}) {
  // Aggregate stock counts per warehouse dynamically
  const warehouseStats = useMemo(() => {
    const map = {};
    inventory.forEach(item => {
      const whName = item.warehouse || '';
      if (!whName) return;
      if (!map[whName]) {
        map[whName] = { itemCount: 0, totalUnits: 0, totalValue: 0 };
      }
      map[whName].itemCount += 1;
      map[whName].totalUnits += Number(item.quantity) || 0;
      map[whName].totalValue += (Number(item.quantity) || 0) * (Number(item.unit_cost) || 0);
    });
    return map;
  }, [inventory]);

  return (
    <div className="space-y-4 sm:space-y-5">
      
      {/* Intro Header */}
      <div className="bg-white p-4 sm:p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#006B56]" />
            ADRA South Sudan State Logistics Network
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Capacity tracking, cold chains, and commodity staging across state relief depots.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{warehouses.length} Active Depots</span>
          </div>
        </div>
      </div>

      {/* Warehouse Cards Grid */}
      {warehouses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center text-slate-400">
          <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="font-bold text-slate-700 text-sm">No State Warehouses or Relief Depots Found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Warehouses added to your database or registered will appear here with live storage metrics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {warehouses.map(w => {
          const stats = warehouseStats[w.name] || {
            itemCount: 0,
            totalUnits: 0,
            totalValue: 0
          };

          const utilization = w.utilized_pct !== undefined ? w.utilized_pct : 0;
          const isHighUtilization = utilization >= 85;

          return (
            <div
              key={w.id || w.code}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition space-y-3.5 sm:space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                
                {/* Hub Header */}
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {w.code || 'WH-SS'}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1 tracking-tight truncate">
                      {w.name}
                    </h4>
                    <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      {w.state} • {w.location}
                    </span>
                  </div>

                  {w.cold_chain_available && (
                    <span className="p-2 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 shrink-0 ml-2" title="Solar Cold Chain Active">
                      <ThermometerSnowflake className="w-4 h-4" />
                    </span>
                  )}
                </div>

                {/* Capacity Progress Bar */}
                <div className="p-3 rounded-xl bg-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Storage Capacity</span>
                    <span className={`font-black font-mono ${isHighUtilization ? 'text-rose-600' : 'text-slate-800'}`}>
                      {utilization}% {w.total_capacity_sqft ? `(${w.total_capacity_sqft.toLocaleString()} sq ft)` : ''}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHighUtilization ? 'bg-rose-500' : utilization > 70 ? 'bg-amber-500' : 'bg-[#006B56]'
                      }`}
                      style={{ width: `${Math.min(100, utilization)}%` }}
                    />
                  </div>
                </div>

                {/* Warehouse Manager & Contact */}
                <div className="space-y-1 text-xs text-slate-600 pt-1">
                  {w.manager_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Manager:
                      </span>
                      <span className="font-bold text-slate-900">{w.manager_name}</span>
                    </div>
                  )}
                  {w.manager_phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        Contact:
                      </span>
                      <span className="font-mono text-slate-700 text-[11px]">{w.manager_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Stock Metric Pills */}
              <div className="pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-emerald-50/60">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block">Stocked SKUs</span>
                  <span className="font-black text-emerald-950 font-mono text-sm">
                    {stats.itemCount} SKUs
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-teal-50/60 text-right">
                  <span className="text-[10px] text-teal-800 font-bold uppercase block">Depot Value</span>
                  <span className="font-black text-teal-950 font-mono text-sm">
                    ${stats.totalValue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
