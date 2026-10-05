import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Building2,
  Calendar,
  ShieldCheck,
  Package,
  QrCode,
  FileText,
  ArrowRight
} from 'lucide-react';

export function InventoryDispatchesView({
  dispatches = [],
  approvedRequests = [],
  onOpenCreateDispatchModal,
  onOpenWaybillDetail,
  onUpdateDispatchStatus
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'IN_TRANSIT' | 'DELIVERED' | 'STAGED'

  const filteredDispatches = useMemo(() => {
    return dispatches.filter(d => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        (d.waybill_number || '').toLowerCase().includes(q) ||
        (d.destination || '').toLowerCase().includes(q) ||
        (d.origin_warehouse || '').toLowerCase().includes(q) ||
        (d.driver_name || '').toLowerCase().includes(q) ||
        (d.vehicle_reg || '').toLowerCase().includes(q) ||
        (d.beneficiary_name || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === 'IN_TRANSIT' && d.status !== 'In Transit') return false;
      if (statusFilter === 'DELIVERED' && !d.status.includes('Delivered')) return false;
      if (statusFilter === 'STAGED' && !d.status.includes('Staged')) return false;

      return true;
    });
  }, [dispatches, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const totalWaybills = dispatches.length;
    const inTransitCount = dispatches.filter(d => d.status === 'In Transit').length;
    const deliveredCount = dispatches.filter(d => d.status.includes('Delivered')).length;
    const stagedCount = dispatches.filter(d => d.status.includes('Staged')).length;

    return { totalWaybills, inTransitCount, deliveredCount, stagedCount };
  }, [dispatches]);

  return (
    <div className="space-y-4 sm:space-y-5">
      
      {/* 1. METRICS SUMMARY ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Total Waybills
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-slate-900">{stats.totalWaybills}</span>
              <span className="text-xs font-semibold text-slate-500">Manifests</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">Aid convoys issued</span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 ml-2">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 uppercase tracking-wider block truncate">
              In Transit
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-amber-900">{stats.inTransitCount}</span>
              <span className="text-xs font-semibold text-amber-700">En Route</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-amber-600 block truncate">Active field convoys</span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 ml-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Delivered
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-emerald-900">{stats.deliveredCount}</span>
              <span className="text-xs font-semibold text-emerald-700">Verified</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-emerald-600 block truncate">Confirmed receipt</span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-[#006B56] flex items-center justify-center shrink-0 ml-2">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Staged at Depot
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-slate-900">{stats.stagedCount}</span>
              <span className="text-xs font-semibold text-slate-500">Ready</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">Loading bay queued</span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 ml-2">
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* 2. SUBTLE PM STAGED REQUESTS BANNER */}
      {approvedRequests.length > 0 && (
        <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs">
                {approvedRequests.length} PM-Authorized Requests Staged
              </h4>
              <p className="text-[11px] text-slate-600">
                Endorsed for distribution and awaiting waybill generation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenCreateDispatchModal}
            className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-2xs transition active:scale-[0.99] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate Waybill</span>
          </button>
        </div>
      )}

      {/* 3. CONTROLS TOOLBAR */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search waybill #, driver, truck, or destination..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900 transition"
          />
        </div>

        {/* Status Filters & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0 ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({dispatches.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('IN_TRANSIT')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0 ${
                statusFilter === 'IN_TRANSIT' ? 'bg-amber-500 text-white shadow-2xs' : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              In Transit ({stats.inTransitCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DELIVERED')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0 ${
                statusFilter === 'DELIVERED' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-800 hover:text-emerald-950'
              }`}
            >
              Delivered ({stats.deliveredCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('STAGED')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0 ${
                statusFilter === 'STAGED' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-indigo-800 hover:text-indigo-950'
              }`}
            >
              Staged ({stats.stagedCount})
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenCreateDispatchModal}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-[0.99] cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Issue Waybill</span>
          </button>
        </div>
      </div>

      {/* 4. DISPATCH MANIFEST CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {filteredDispatches.length === 0 ? (
          <div className="col-span-full py-10 sm:py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-4">
            <Truck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-600 text-xs">No waybill dispatch manifests match your search.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Click "Issue Waybill" to stage relief items for transport.</p>
          </div>
        ) : (
          filteredDispatches.map(d => {
            const isDelivered = d.status.includes('Delivered') || d.status.includes('Confirmed');
            const isInTransit = d.status === 'In Transit';

            return (
              <div
                key={d.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition p-3.5 sm:p-4.5 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-black text-slate-900 text-xs sm:text-sm">
                          {d.waybill_number}
                        </span>
                        {d.dispatch_token && (
                          <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <QrCode className="w-3 h-3 text-[#006B56]" />
                            {d.dispatch_token}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        Dispatched: {d.dispatch_date}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 ${
                      isDelivered
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : isInTransit
                        ? 'bg-amber-50 text-amber-900 border border-amber-200'
                        : 'bg-blue-50 text-blue-900 border border-blue-200'
                    }`}>
                      {isDelivered ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Truck className="w-3 h-3 text-amber-600" />}
                      {d.status}
                    </span>
                  </div>

                  {/* Route & Destination */}
                  <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Origin</span>
                      <span className="font-medium text-slate-700 truncate block">{d.origin_warehouse}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 shrink-0 mx-2" />
                    <div className="text-right min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Destination</span>
                      <span className="font-bold text-slate-900 truncate block">{d.destination}</span>
                    </div>
                  </div>

                  {/* Driver / Transport */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-600 px-0.5">
                    <span>Vehicle: <strong className="font-mono text-slate-800">{d.vehicle_reg || 'N/A'}</strong></span>
                    <span>Driver: <strong className="text-slate-800">{d.driver_name || 'N/A'}</strong></span>
                  </div>

                  {/* Commodities Preview */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                      <span>Line Items ({d.items?.length || 0})</span>
                    </div>
                    <div className="space-y-1 max-h-24 overflow-y-auto pr-0.5">
                      {d.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-50">
                          <span className="font-medium text-slate-700 truncate max-w-[180px] sm:max-w-[200px]">{item.item_name}</span>
                          <span className="font-mono font-bold text-emerald-800 shrink-0 ml-2">
                            {Number(item.quantity).toLocaleString()} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400 truncate max-w-[140px] sm:max-w-none">
                    Released by: <span className="font-medium text-slate-700">{d.released_by || 'Warehouse Officer'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenWaybillDetail(d)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>View Waybill</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
