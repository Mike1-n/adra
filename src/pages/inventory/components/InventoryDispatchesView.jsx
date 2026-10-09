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
  ArrowRight,
  User,
  PackagePlus,
  ChevronDown,
  ChevronUp,
  Tag,
  Sparkles,
  Phone,
  LayoutGrid,
  List,
  ExternalLink,
  Box,
  Download
} from 'lucide-react';
import { exportWaybillPDF } from '../../../lib/reportGenerator';

export function InventoryDispatchesView({
  dispatches = [],
  approvedRequests = [],
  statusFilter: externalStatusFilter,
  onStatusFilterChange,
  onOpenCreateDispatchModal,
  onOpenWaybillDetail,
  onUpdateDispatchStatus
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [internalStatusFilter, setInternalStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // Default to table form
  const statusFilter = externalStatusFilter !== undefined ? externalStatusFilter : internalStatusFilter;
  const setStatusFilter = onStatusFilterChange || setInternalStatusFilter;

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

      const st = (d.status || '').toLowerCase().trim();
      const dst = (d.dispatch_status || '').toLowerCase().trim();
      const isInTransit = st === 'in transit' || st === 'warehouse_dispatched' || st.includes('transit') || dst === 'in transit';
      const isDelivered = st.includes('deliver') || st.includes('arrived') || st === 'goods_arrived_at_hub' || dst.includes('arrived');
      const isStaged = st.includes('stage') || st.includes('draft') || st.includes('pend');

      if (statusFilter === 'IN_TRANSIT' && !isInTransit) return false;
      if (statusFilter === 'DELIVERED' && !isDelivered) return false;
      if (statusFilter === 'STAGED' && !isStaged) return false;

      return true;
    });
  }, [dispatches, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const totalWaybills = dispatches.length;
    const inTransitCount = dispatches.filter(d => {
      const st = (d.status || '').toLowerCase().trim();
      const dst = (d.dispatch_status || '').toLowerCase().trim();
      return st === 'in transit' || st === 'warehouse_dispatched' || st.includes('transit') || dst === 'in transit';
    }).length;
    const deliveredCount = dispatches.filter(d => {
      const st = (d.status || '').toLowerCase().trim();
      const dst = (d.dispatch_status || '').toLowerCase().trim();
      return st.includes('deliver') || st.includes('arrived') || st === 'goods_arrived_at_hub' || dst.includes('arrived');
    }).length;
    const stagedCount = dispatches.filter(d => {
      const st = (d.status || '').toLowerCase().trim();
      return st.includes('stage') || st.includes('draft') || st.includes('pend');
    }).length;

    return { totalWaybills, inTransitCount, deliveredCount, stagedCount };
  }, [dispatches]);

  return (
    <div className="space-y-4 sm:space-y-5">
      
      {/* 1. METRICS SUMMARY ROW (CLICKABLE STAT CARDS WITH DISTINCT COLOURS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        
        {/* Metric 1: Total Waybills (Blue Theme) */}
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between shadow-2xs ${
            statusFilter === 'ALL'
              ? 'bg-blue-100/80 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-blue-50/50 border-blue-200/80 hover:bg-blue-50 hover:border-blue-300'
          }`}
        >
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-blue-700 uppercase tracking-wider block truncate">
              Total Waybills
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-blue-950">{stats.totalWaybills}</span>
              <span className="text-xs font-bold text-blue-600">Manifests</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-blue-500/90 block truncate">Aid convoys issued</span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 ml-2 shadow-xs">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </button>

        {/* Metric 2: In Transit (Amber Theme) */}
        <button
          type="button"
          onClick={() => setStatusFilter('IN_TRANSIT')}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between shadow-2xs ${
            statusFilter === 'IN_TRANSIT'
              ? 'bg-amber-100/80 border-amber-400 ring-2 ring-amber-500/20'
              : 'bg-amber-50/50 border-amber-200/80 hover:bg-amber-50 hover:border-amber-300'
          }`}
        >
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-amber-800 uppercase tracking-wider block truncate">
              In Transit
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-amber-950">{stats.inTransitCount}</span>
              <span className="text-xs font-bold text-amber-700">En Route</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-amber-600/90 block truncate">Active field convoys</span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 ml-2 shadow-xs">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </button>

        {/* Metric 3: Delivered (Emerald Theme) */}
        <button
          type="button"
          onClick={() => setStatusFilter('DELIVERED')}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between shadow-2xs ${
            statusFilter === 'DELIVERED'
              ? 'bg-emerald-100/80 border-emerald-400 ring-2 ring-emerald-500/20'
              : 'bg-emerald-50/50 border-emerald-200/80 hover:bg-emerald-50 hover:border-emerald-300'
          }`}
        >
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider block truncate">
              Delivered
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-emerald-950">{stats.deliveredCount}</span>
              <span className="text-xs font-bold text-emerald-700">Verified</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-emerald-600/90 block truncate">Confirmed receipt</span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#006B56] text-white flex items-center justify-center shrink-0 ml-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </button>

        {/* Metric 4: Staged at Depot (Purple Theme) */}
        <button
          type="button"
          onClick={() => setStatusFilter('STAGED')}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between shadow-2xs ${
            statusFilter === 'STAGED'
              ? 'bg-purple-100/80 border-purple-400 ring-2 ring-purple-500/20'
              : 'bg-purple-50/50 border-purple-200/80 hover:bg-purple-50 hover:border-purple-300'
          }`}
        >
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-purple-800 uppercase tracking-wider block truncate">
              Staged at Depot
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-purple-950">{approvedRequests.length || stats.stagedCount}</span>
              <span className="text-xs font-bold text-purple-700">Ready</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-purple-600/90 block truncate">
              {approvedRequests.length > 0 ? `${approvedRequests.length} PM-Authorized` : 'Loading bay queued'}
            </span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 ml-2 shadow-xs">
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </button>
      </div>

      {/* 2. SEARCH & ACTIVE FILTER BAR & VIEW TOGGLE */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search waybill #, driver, truck, or destination..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900 transition"
          />
        </div>

        {/* Right side controls: Active Filter & Layout Toggle */}
        <div className="flex items-center gap-2.5">
          {/* Active Filter Indicator */}
          {statusFilter !== 'ALL' && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Filter:</span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                statusFilter === 'IN_TRANSIT'
                  ? 'bg-amber-100 text-amber-950 border border-amber-300'
                  : statusFilter === 'DELIVERED'
                  ? 'bg-emerald-100 text-[#006B56] border border-emerald-300'
                  : 'bg-purple-100 text-purple-950 border border-purple-300'
              }`}>
                <span>{statusFilter === 'IN_TRANSIT' ? 'In Transit' : statusFilter === 'DELIVERED' ? 'Delivered' : 'Staged'}</span>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className="hover:opacity-75 font-black ml-0.5 cursor-pointer"
                  title="Clear filter"
                >
                  ×
                </button>
              </span>
            </div>
          )}

          {/* Grid / Table View Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Manifest Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. DISPATCH MANIFESTS (CARDS OR TABLE VIEW) */}
      {filteredDispatches.length === 0 ? (
        <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-6">
          <Truck className="w-10 h-10 mx-auto mb-2.5 text-slate-300 stroke-[1.5]" />
          <p className="font-bold text-slate-700 text-sm">No waybill dispatch manifests match your search.</p>
          <p className="text-xs text-slate-400 mt-1">Click "Issue Waybill" to stage relief items for transport.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* ULTRA-CLEAN COMPACT TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Waybill #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Driver</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDispatches.map(d => {
                  const st = (d.status || '').toLowerCase().trim();
                  const dst = (d.dispatch_status || '').toLowerCase().trim();
                  const isDelivered = st.includes('deliver') || st.includes('arrived') || st.includes('confirmed') || st === 'goods_arrived_at_hub' || dst.includes('arrived');
                  const isInTransit = st === 'in transit' || st === 'warehouse_dispatched' || st.includes('transit') || dst === 'in transit';

                  const totalQty = d.items?.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0) || 0;
                  const unit = d.items?.[0]?.unit || 'Items';

                  return (
                    <tr
                      key={d.id}
                      onClick={() => onOpenWaybillDetail(d)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      {/* Waybill # */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {d.waybill_number}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {d.dispatch_date || 'N/A'}
                      </td>

                      {/* Destination */}
                      <td className="py-3 px-4 max-w-[200px] text-slate-800 font-medium truncate">
                        {d.destination || 'Field Centre'}
                      </td>

                      {/* Driver */}
                      <td className="py-3 px-4 text-slate-800 whitespace-nowrap">
                        {d.driver_name || 'N/A'}
                      </td>

                      {/* Vehicle */}
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {d.vehicle_reg || 'N/A'}
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-4 font-mono font-bold text-[#006B56] whitespace-nowrap">
                        {totalQty > 0 ? `${totalQty.toLocaleString()} ${unit}` : '1 Bundle'}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                          isDelivered
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : isInTransit
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : 'bg-blue-50 text-blue-900 border border-blue-200'
                        }`}>
                          {isInTransit && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                          {isDelivered && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          <span>{isDelivered ? 'Delivered' : isInTransit ? 'In Transit' : d.status || 'Active'}</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenWaybillDetail(d)}
                            className="px-2.5 py-1 rounded-lg bg-[#006B56] hover:bg-[#005242] text-white font-semibold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                            title="View Waybill Details"
                          >
                            <FileText className="w-3 h-3" />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => exportWaybillPDF(d)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                            title="Download PDF Waybill Receipt"
                          >
                            <Download className="w-3 h-3 text-emerald-700" />
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID / CARDS VIEW (CLEAN, SPACIOUS, UNCLUTTERED) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {filteredDispatches.map(d => {
            const st = (d.status || '').toLowerCase().trim();
            const dst = (d.dispatch_status || '').toLowerCase().trim();
            const isDelivered = st.includes('deliver') || st.includes('arrived') || st.includes('confirmed') || st === 'goods_arrived_at_hub' || dst.includes('arrived');
            const isInTransit = st === 'in transit' || st === 'warehouse_dispatched' || st.includes('transit') || dst === 'in transit';

            return (
              <div
                key={d.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between overflow-hidden"
              >
                {/* 1. CARD TOP BANNER & HEADER */}
                <div>
                  {/* Top Status Accent Bar */}
                  <div className={`h-1.5 w-full ${
                    isDelivered ? 'bg-emerald-500' : isInTransit ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />

                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Header Row: Waybill ID, QR Token & Status Badge */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-slate-900 text-sm sm:text-base tracking-tight">
                            {d.waybill_number}
                          </span>
                          {d.dispatch_token && (
                            <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <QrCode className="w-3 h-3 text-[#006B56]" />
                              {d.dispatch_token}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Dispatched: <strong className="text-slate-700 font-semibold">{d.dispatch_date || 'Today'}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Prominent Status Pill */}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 shrink-0 shadow-2xs ${
                        isDelivered
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : isInTransit
                          ? 'bg-amber-50 text-amber-900 border border-amber-300'
                          : 'bg-blue-50 text-blue-900 border border-blue-300'
                      }`}>
                        {isInTransit ? (
                          <>
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            <span>In Transit</span>
                          </>
                        ) : isDelivered ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Delivered</span>
                          </>
                        ) : (
                          <>
                            <Truck className="w-3.5 h-3.5 text-blue-600" />
                            <span>{d.status || 'Staged'}</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* 2. ROUTING TRANSIT VISUALIZATION */}
                    <div className="bg-gradient-to-r from-slate-50 via-slate-50/50 to-emerald-50/30 p-3.5 rounded-xl border border-slate-200/80">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                        {/* Origin Depot */}
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            <Building2 className="w-3 h-3 text-slate-500" />
                            <span>Origin Depot</span>
                          </div>
                          <div className="font-semibold text-xs text-slate-800">
                            {d.origin_warehouse || 'Central Equatoria State Depot'}
                          </div>
                        </div>

                        {/* Destination */}
                        <div className="space-y-0.5 sm:text-right">
                          <div className="flex items-center sm:justify-end gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[#006B56]">
                            <MapPin className="w-3 h-3 text-red-500" />
                            <span>Relief Destination Hub</span>
                          </div>
                          <div className="font-bold text-xs text-slate-900">
                            {d.destination || 'Field Relief Distribution Centre'}
                          </div>
                        </div>
                      </div>

                      {/* Recipient / Beneficiary tag if specified */}
                      {(d.beneficiary_name || d.supervisor_name) && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                          {d.beneficiary_name && (
                            <span className="flex items-center gap-1 font-medium">
                              <Tag className="w-3 h-3 text-emerald-600" />
                              Aid Allocation: <strong className="text-slate-800">{d.beneficiary_name}</strong>
                            </span>
                          )}
                          {d.supervisor_name && (
                            <span className="flex items-center gap-1 text-slate-500 ml-auto">
                              <User className="w-3 h-3 text-slate-400" />
                              Receiving Supervisor: <strong className="text-slate-700">{d.supervisor_name}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 3. CONVOY FLEET & DRIVER BAR */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 shrink-0">
                          <Truck className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vehicle</span>
                          <span className="font-mono font-bold text-slate-900 truncate block">
                            {d.vehicle_reg || 'SSD-481-LOG'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Driver</span>
                          <span className="font-bold text-slate-900 truncate block">
                            {d.driver_name || 'Deng Bol'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 4. CARGO MANIFEST COMMODITIES */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Box className="w-3.5 h-3.5 text-slate-400" />
                          Cargo Payload ({d.items?.length || 0} {d.items?.length === 1 ? 'Commodity' : 'Commodities'})
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {d.items && d.items.length > 0 ? (
                          d.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span className="font-medium text-xs text-slate-800 truncate">
                                  {item.item_name}
                                </span>
                              </div>
                              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-emerald-50 text-[#006B56] border border-emerald-200 shrink-0 ml-2">
                                {Number(item.quantity).toLocaleString()} {item.unit || 'Units'}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-400 italic p-2 bg-slate-50 rounded-lg">
                            Standard relief aid bundle
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. CARD FOOTER: DISPATCHER + ACTIONS */}
                <div className="p-3.5 sm:p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 truncate flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      Released by: <strong className="text-slate-800">{d.released_by || 'Gabriel Majok (Inventory Manager)'}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => exportWaybillPDF(d)}
                      className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-700" />
                      <span>PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenWaybillDetail(d)}
                      className="px-4 py-2 rounded-xl bg-[#006B56] hover:bg-[#005242] text-white font-bold text-xs flex items-center gap-2 shadow-2xs hover:shadow transition cursor-pointer shrink-0"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-200" />
                      <span>View Waybill</span>
                    </button>
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

