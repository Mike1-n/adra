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

  // Helper to extract clean beneficiary name without nested long addresses
  const getCleanBeneficiaryName = (rawName) => {
    if (!rawName) return '';
    const cleaned = String(rawName).replace(/\s*\([^)]*(?:Juba|Central|South Sudan|Boma|Area|Field|Payam|County|State)[^)]*\)/gi, '').trim();
    return cleaned || String(rawName).trim();
  };

  // Unify official dispatches and PM-approved requests into a single manifests list
  const allManifests = useMemo(() => {
    const pendingList = (approvedRequests || []).map(r => {
      const reqCode = r.request_code || r.tracking_number || r.id;
      const numDigits = String(reqCode).replace(/[^0-9]/g, '');
      const codeDigits = numDigits.length >= 4 ? numDigits.slice(-5) : '63214';
      const destination = r.location || [r.county, r.payam].filter(Boolean).join(', ') || r.state || 'Field Centre';
      const ben = r.beneficiary_name || r.full_name || 'Beneficiary';
      const benId = r.beneficiary_code || r.beneficiary_id || r.national_id || r.id_number || '';
      const cat = r.category || r.assistance_type || 'Relief Commodities';
      const supervisor = r.assigned_supervisor_name || 'Assigned Supervisor';
      const worker = r.assigned_field_worker_name || 'Field Officer';

      return {
        id: `pending-wb-${r.id || reqCode}`,
        waybill_number: `WB-PEND-${codeDigits}`,
        is_pending_waybill: true,
        request_data: r,
        linked_request_id: r.id || reqCode,
        request_code: reqCode,
        dispatch_date: r.reviewed_at ? r.reviewed_at.split('T')[0] : (r.created_at ? r.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
        origin_warehouse: r.preferred_depot || 'Juba Central Logistics Base',
        destination: destination,
        beneficiary_name: benId ? `${ben} (${benId})` : ben,
        beneficiary_code: benId,
        driver_name: 'Pending Assignment',
        driver_phone: 'N/A',
        vehicle_reg: 'ADRA Logistics Fleet (Queued)',
        status: 'Pending Aid Waybill',
        dispatch_status: 'Pending Waybill',
        items: [
          {
            item_name: cat,
            quantity: r.household_members ? Number(r.household_members) : 1,
            unit: r.household_members ? 'HH Pack' : 'Kit'
          }
        ],
        notes: `PM Grace Ochieng approved request #${reqCode}. Ready for waybill dispatch.`,
        assigned_supervisor_name: supervisor,
        assigned_field_worker_name: worker
      };
    });

    // Deduplicate by unique waybill number and request ID so rows never repeat
    const combined = [...dispatches, ...pendingList];
    const seenWaybills = new Set();
    const seenRequestCodes = new Set();
    const uniqueManifests = [];

    for (const item of combined) {
      if (!item) continue;
      const wbKey = (item.waybill_number || '').trim().toLowerCase();
      const reqKey = String(item.request_code || item.linked_request_id || '').trim().toLowerCase();
      const idKey = String(item.id || '').trim().toLowerCase();

      // Skip duplicate waybill numbers
      if (wbKey && seenWaybills.has(wbKey)) {
        continue;
      }
      // Skip duplicate IDs
      if (idKey && seenWaybills.has(idKey)) {
        continue;
      }
      // If an issued waybill dispatch already exists for this request, skip the duplicate pending stub
      if (item.is_pending_waybill && reqKey && seenRequestCodes.has(reqKey)) {
        continue;
      }

      if (wbKey) seenWaybills.add(wbKey);
      if (idKey) seenWaybills.add(idKey);
      if (reqKey) seenRequestCodes.add(reqKey);

      uniqueManifests.push(item);
    }

    return uniqueManifests;
  }, [dispatches, approvedRequests]);

  const filteredDispatches = useMemo(() => {
    return allManifests.filter(d => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        (d.waybill_number || '').toLowerCase().includes(q) ||
        (d.request_code || '').toLowerCase().includes(q) ||
        (d.destination || '').toLowerCase().includes(q) ||
        (d.origin_warehouse || '').toLowerCase().includes(q) ||
        (d.driver_name || '').toLowerCase().includes(q) ||
        (d.vehicle_reg || '').toLowerCase().includes(q) ||
        (d.beneficiary_name || '').toLowerCase().includes(q) ||
        (d.status || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const st = (d.status || '').toLowerCase().trim();
      const dst = (d.dispatch_status || '').toLowerCase().trim();
      const isPending = Boolean(d.is_pending_waybill) || st.includes('pend') || st.includes('stage') || st.includes('draft');
      const isInTransit = !isPending && (st === 'in transit' || st === 'warehouse_dispatched' || st.includes('transit') || dst === 'in transit');
      const isDelivered = !isPending && (st.includes('deliver') || st.includes('arrived') || st === 'goods_arrived_at_hub' || dst.includes('arrived'));

      if (statusFilter === 'PENDING' && !isPending) return false;
      if (statusFilter === 'STAGED' && !isPending) return false;
      if (statusFilter === 'IN_TRANSIT' && !isInTransit) return false;
      if (statusFilter === 'DELIVERED' && !isDelivered) return false;

      return true;
    });
  }, [allManifests, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const totalWaybills = allManifests.length;
    const pendingCount = allManifests.filter(d => 
      Boolean(d.is_pending_waybill) || (d.status || '').toLowerCase().includes('pend') || (d.status || '').toLowerCase().includes('stage')
    ).length;
    const inTransitCount = allManifests.filter(d => {
      if (d.is_pending_waybill) return false;
      const st = (d.status || '').toLowerCase().trim();
      const dst = (d.dispatch_status || '').toLowerCase().trim();
      return st === 'in transit' || st === 'warehouse_dispatched' || st.includes('transit') || dst === 'in transit';
    }).length;
    const deliveredCount = allManifests.filter(d => {
      if (d.is_pending_waybill) return false;
      const st = (d.status || '').toLowerCase().trim();
      const dst = (d.dispatch_status || '').toLowerCase().trim();
      return st.includes('deliver') || st.includes('arrived') || st === 'goods_arrived_at_hub' || dst.includes('arrived');
    }).length;

    return { totalWaybills, pendingCount, inTransitCount, deliveredCount };
  }, [allManifests]);

  return (
    <div className="space-y-4 sm:space-y-5 max-w-full overflow-x-hidden">
      
      {/* 1. METRICS SUMMARY ROW (CLICKABLE STAT CARDS WITH DISTINCT COLOURS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        
        {/* Metric 1: Total Waybills (Blue Theme) */}
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between shadow-2xs min-w-0 overflow-hidden ${
            statusFilter === 'ALL'
              ? 'bg-blue-100/80 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-blue-50/50 border-blue-200/80 hover:bg-blue-50 hover:border-blue-300'
          }`}
        >
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-blue-700 uppercase tracking-wider block truncate">
              Total Waybills
            </span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-lg sm:text-xl font-black text-blue-950">{stats.totalWaybills}</span>
              <span className="text-xs font-bold text-blue-600">Manifests</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-blue-500/90 block truncate">Aid convoys issued</span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 ml-2 shadow-xs">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </button>

        {/* Metric 2: Pending Aid Waybills (Orange Theme) */}
        <button
          type="button"
          onClick={() => setStatusFilter('PENDING')}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between shadow-2xs min-w-0 overflow-hidden ${
            statusFilter === 'PENDING' || statusFilter === 'STAGED'
              ? 'bg-orange-100/90 border-orange-400 ring-2 ring-orange-500/20'
              : 'bg-orange-50/50 border-orange-200/80 hover:bg-orange-50 hover:border-orange-300'
          }`}
        >
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-orange-900 uppercase tracking-wider block truncate">
              Pending Aid Waybills
            </span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-lg sm:text-xl font-black text-orange-950">{stats.pendingCount}</span>
              <span className="text-xs font-bold text-orange-700">Awaiting Dispatch</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-orange-700/90 block truncate">
              {approvedRequests.length > 0 ? `${approvedRequests.length} PM-Authorized` : 'Depot queue cleared'}
            </span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 ml-2 shadow-xs">
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </button>

        {/* Metric 3: In Transit (Amber Theme) */}
        <button
          type="button"
          onClick={() => setStatusFilter('IN_TRANSIT')}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between shadow-2xs min-w-0 overflow-hidden ${
            statusFilter === 'IN_TRANSIT'
              ? 'bg-amber-100/80 border-amber-400 ring-2 ring-amber-500/20'
              : 'bg-amber-50/50 border-amber-200/80 hover:bg-amber-50 hover:border-amber-300'
          }`}
        >
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-amber-800 uppercase tracking-wider block truncate">
              In Transit
            </span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-lg sm:text-xl font-black text-amber-950">{stats.inTransitCount}</span>
              <span className="text-xs font-bold text-amber-700">En Route</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-amber-600/90 block truncate">Active field convoys</span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 ml-2 shadow-xs">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </button>

        {/* Metric 4: Delivered (Emerald Theme) */}
        <button
          type="button"
          onClick={() => setStatusFilter('DELIVERED')}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between shadow-2xs min-w-0 overflow-hidden ${
            statusFilter === 'DELIVERED'
              ? 'bg-emerald-100/80 border-emerald-400 ring-2 ring-emerald-500/20'
              : 'bg-emerald-50/50 border-emerald-200/80 hover:bg-emerald-50 hover:border-emerald-300'
          }`}
        >
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider block truncate">
              Delivered
            </span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-lg sm:text-xl font-black text-emerald-950">{stats.deliveredCount}</span>
              <span className="text-xs font-bold text-emerald-700">Verified</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-emerald-600/90 block truncate">Confirmed receipt</span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#006B56] text-white flex items-center justify-center shrink-0 ml-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </button>
      </div>

      {/* 2. SEARCH & ACTIVE FILTER BAR & VIEW TOGGLE */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[180px] max-w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search waybill #, request #, driver, or destination..."
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
                  : 'bg-orange-100 text-orange-950 border border-orange-300'
              }`}>
                <span>{statusFilter === 'IN_TRANSIT' ? 'In Transit' : statusFilter === 'DELIVERED' ? 'Delivered' : 'Pending Aid Waybill'}</span>
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
        /* ULTRA-CLEAN COMPACT TABLE VIEW & MOBILE CARDS */
        <>
          {/* MOBILE PHONE MODE (< md): FULL-WIDTH WAYBILL CARDS THAT NEVER SCROLL HORIZONTALLY */}
          <div className="md:hidden space-y-3">
            {filteredDispatches.map(d => {
              const isPending = Boolean(d.is_pending_waybill);
              const st = (d.status || '').toLowerCase().trim();
              const dst = (d.dispatch_status || '').toLowerCase().trim();
              const isDelivered = !isPending && (st.includes('deliver') || st.includes('arrived') || st.includes('confirmed') || st === 'goods_arrived_at_hub' || dst.includes('arrived'));
              const isInTransit = !isPending && (st === 'in transit' || st === 'warehouse_dispatched' || st.includes('transit') || dst === 'in transit');
              const totalQty = d.items?.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0) || 0;
              const unit = d.items?.[0]?.unit || 'Items';
              const cleanBenName = getCleanBeneficiaryName(d.beneficiary_name || d.request_data?.beneficiary_name);

              return (
                <div
                  key={d.id}
                  onClick={() => {
                    if (isPending) {
                      onOpenCreateDispatchModal && onOpenCreateDispatchModal(d.request_data);
                    } else {
                      onOpenWaybillDetail(d);
                    }
                  }}
                  className={`bg-white rounded-xl border p-3.5 space-y-3 shadow-2xs transition active:scale-[0.99] cursor-pointer w-full max-w-full overflow-hidden ${
                    isPending ? 'border-orange-300 ring-1 ring-orange-400/30' : 'border-slate-200/90'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-black text-sm text-black tracking-tight shrink-0">
                          {d.waybill_number}
                        </span>
                        {(d.request_code || d.linked_request_id) && (
                          <span className="font-mono text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 font-bold shrink-0">
                            Req: {d.request_code || d.linked_request_id}
                          </span>
                        )}
                        {cleanBenName && (
                          <span className="text-xs font-bold text-[#006B56] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 inline-flex items-center gap-1 max-w-[190px] sm:max-w-[260px] truncate shrink-0">
                            <User className="w-3 h-3 text-[#006B56] shrink-0" />
                            <span className="truncate">{cleanBenName}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{d.dispatch_date || 'Today'}</span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isPending ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 bg-orange-100 text-orange-950 border border-orange-300 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
                          <span>Pending</span>
                        </span>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          isDelivered
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : isInTransit
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : 'bg-blue-50 text-blue-900 border border-blue-200'
                        }`}>
                          {isInTransit && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />}
                          {isDelivered && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                          <span>{isDelivered ? 'Delivered' : isInTransit ? 'In Transit' : d.status || 'Active'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body: Destination, Driver, Qty */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-[#006B56] shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Destination Hub
                        </span>
                        <p className="font-semibold text-slate-800 text-xs leading-snug break-words">
                          {d.destination || 'Field Relief Hub'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100 min-w-0">
                        <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block flex items-center gap-1">
                          <Package className="w-3 h-3 text-emerald-600 shrink-0" /> Quantity
                        </span>
                        <p className="font-black text-[#006B56] text-xs mt-0.5 truncate">
                          {totalQty > 0 ? `${totalQty.toLocaleString()} ${unit}` : '1 Bundle'}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 min-w-0">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                          <Truck className="w-3 h-3 text-slate-400 shrink-0" /> Transport
                        </span>
                        <p className="font-bold text-slate-800 text-xs truncate mt-0.5">
                          {d.driver_name || 'Assigned Driver'}
                        </p>
                        <p className="font-mono text-[10px] text-slate-500 mt-0.5 truncate">
                          {d.vehicle_reg || 'SSD Logistics'}
                        </p>
                      </div>
                    </div>

                    {/* Collected by Worker Note */}
                    {((d.status || '').toLowerCase().includes('collect') || d.collected_by) && (
                      <div className="bg-blue-50/80 p-2.5 rounded-lg border border-blue-200 flex items-center gap-2 min-w-0">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <div className="min-w-0 flex-1 text-xs">
                          <span className="text-[10px] text-blue-700 font-bold uppercase block">Handed Over To Field Worker</span>
                          <span className="font-black text-blue-950 truncate block">
                            {d.collected_by || d.goods_collected_by || d.assigned_field_worker_name || 'Field Officer'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-1 flex items-center gap-2 border-t border-slate-100" onClick={e => e.stopPropagation()}>
                    {isPending ? (
                      <button
                        type="button"
                        onClick={() => onOpenCreateDispatchModal && onOpenCreateDispatchModal(d.request_data)}
                        className="w-full py-2.5 rounded-lg bg-black hover:bg-slate-800 text-white font-black text-xs inline-flex items-center justify-center gap-1.5 transition active:scale-95 shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Issue Waybill</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenWaybillDetail(d)}
                          className="flex-1 py-2.5 rounded-lg bg-[#006B56] hover:bg-[#005242] text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => exportWaybillPDF(d)}
                          className="px-3 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer inline-flex items-center justify-center gap-1 text-xs font-bold shrink-0"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-700" />
                          <span>PDF</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* TABLET & DESKTOP (>= md) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-black font-black border-b border-slate-200 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3 sm:px-4">Waybill #</th>
                    <th className="py-3 px-3 sm:px-4 hidden md:table-cell">Date</th>
                    <th className="py-3 px-3 sm:px-4">Destination</th>
                    <th className="py-3 px-3 sm:px-4 hidden lg:table-cell">Driver</th>
                    <th className="py-3 px-3 sm:px-4 hidden xl:table-cell">Vehicle</th>
                    <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">Qty</th>
                    <th className="py-3 px-2 sm:px-4 text-center">Status</th>
                    <th className="py-3 px-3 sm:px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDispatches.map(d => {
                    const isPending = Boolean(d.is_pending_waybill);
                    const st = (d.status || '').toLowerCase().trim();
                    const dst = (d.dispatch_status || '').toLowerCase().trim();
                    const isDelivered = !isPending && (st.includes('deliver') || st.includes('arrived') || st.includes('confirmed') || st === 'goods_arrived_at_hub' || dst.includes('arrived'));
                    const isInTransit = !isPending && (st === 'in transit' || st === 'warehouse_dispatched' || st.includes('transit') || dst === 'in transit');

                    const totalQty = d.items?.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0) || 0;
                    const unit = d.items?.[0]?.unit || 'Items';
                    const cleanBenName = getCleanBeneficiaryName(d.beneficiary_name || d.request_data?.beneficiary_name);

                    return (
                      <tr
                        key={d.id}
                        onClick={() => {
                          if (isPending) {
                            onOpenCreateDispatchModal && onOpenCreateDispatchModal(d.request_data);
                          } else {
                            onOpenWaybillDetail(d);
                          }
                        }}
                        className="hover:bg-slate-50/80 transition cursor-pointer"
                      >
                        {/* Waybill # */}
                        <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-black text-xs sm:text-sm text-black tracking-tight">
                                {d.waybill_number}
                              </span>
                              {(d.request_code || d.linked_request_id) && (
                                <span className="font-mono text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 font-bold">
                                  Req: {d.request_code || d.linked_request_id}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                              <span>{d.dispatch_date || 'Today'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-3 sm:px-4 text-slate-600 whitespace-nowrap hidden md:table-cell">
                          {d.dispatch_date || 'N/A'}
                        </td>

                        {/* Destination */}
                        <td className="py-3 px-3 sm:px-4 max-w-[180px] lg:max-w-[240px]">
                          <div className="text-slate-900 font-bold truncate text-xs" title={d.destination}>
                            {d.destination || 'Field Centre'}
                          </div>
                          {cleanBenName && (
                            <div className="text-[10px] text-[#006B56] font-semibold truncate flex items-center gap-1 mt-0.5" title={cleanBenName}>
                              <User className="w-2.5 h-2.5 text-[#006B56]" />
                              <span className="truncate">{cleanBenName}</span>
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500 truncate lg:hidden mt-0.5">
                            {isPending ? (
                              <span className="text-slate-400 italic">Depot staging</span>
                            ) : d.driver_name ? (
                              <span className="text-slate-600 font-medium">Driver: {d.driver_name}</span>
                            ) : null}
                          </div>
                        </td>

                        {/* Driver */}
                        <td className="py-3 px-3 sm:px-4 whitespace-nowrap hidden lg:table-cell">
                          {isPending ? (
                            <span className="text-[11px] font-medium text-slate-500 italic bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200">
                              Awaiting Driver
                            </span>
                          ) : (
                            <span className="text-slate-800 font-medium">{d.driver_name || 'N/A'}</span>
                          )}
                        </td>

                        {/* Vehicle */}
                        <td className="py-3 px-3 sm:px-4 font-mono whitespace-nowrap hidden xl:table-cell">
                          {isPending ? (
                            <span className="text-[11px] font-medium text-slate-500 italic">
                              Depot Staging
                            </span>
                          ) : (
                            <span className="text-slate-600">{d.vehicle_reg || 'N/A'}</span>
                          )}
                        </td>

                        {/* Quantity */}
                        <td className="py-3 px-3 sm:px-4 font-mono font-bold text-[#006B56] whitespace-nowrap hidden sm:table-cell">
                          {totalQty > 0 ? `${totalQty.toLocaleString()} ${unit}` : '1 Bundle'}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-2 sm:px-4 text-center whitespace-nowrap">
                          {isPending ? (
                            <span className="px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black inline-flex items-center gap-1 bg-orange-100 text-orange-950 border border-orange-300 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
                              <span>Pending</span>
                            </span>
                          ) : (
                            <div>
                              <span className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold inline-flex items-center gap-1 ${
                                isDelivered
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : isInTransit
                                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                  : 'bg-blue-50 text-blue-900 border border-blue-200'
                              }`}>
                                {isInTransit && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />}
                                {isDelivered && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                                <span>{isDelivered ? 'Delivered' : isInTransit ? 'In Transit' : d.status || 'Active'}</span>
                              </span>

                              {((d.status || '').toLowerCase().includes('collect') || d.collected_by) && (
                                <div className="text-[10px] font-bold text-blue-900 mt-1 flex items-center justify-center gap-1">
                                  <User className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                                  <span className="truncate max-w-[140px]" title={`Collected by: ${d.collected_by || d.goods_collected_by || d.assigned_field_worker_name}`}>
                                    {d.collected_by || d.goods_collected_by || d.assigned_field_worker_name || 'Field Officer'}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending ? (
                              <button
                                type="button"
                                onClick={() => onOpenCreateDispatchModal && onOpenCreateDispatchModal(d.request_data)}
                                className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-black hover:bg-slate-800 text-white font-black text-xs inline-flex items-center gap-1 transition active:scale-95 shadow-2xs cursor-pointer"
                                title="Issue Official Waybill for this Request"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Issue Waybill</span>
                              </button>
                            ) : (
                              <>
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
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* GRID / CARDS VIEW (CLEAN, SPACIOUS, UNCLUTTERED) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {filteredDispatches.map(d => {
            const isPending = Boolean(d.is_pending_waybill);
            const st = (d.status || '').toLowerCase().trim();
            const dst = (d.dispatch_status || '').toLowerCase().trim();
            const isDelivered = !isPending && (st.includes('deliver') || st.includes('arrived') || st.includes('confirmed') || st === 'goods_arrived_at_hub' || dst.includes('arrived'));
            const isInTransit = !isPending && (st === 'in transit' || st === 'warehouse_dispatched' || st.includes('transit') || dst === 'in transit');
            const cleanBenName = getCleanBeneficiaryName(d.beneficiary_name || d.request_data?.beneficiary_name);

            return (
              <div
                key={d.id}
                className={`bg-white rounded-2xl border shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                  isPending ? 'border-orange-300 ring-1 ring-orange-400/30' : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* 1. CARD TOP BANNER & HEADER */}
                <div>
                  {/* Top Status Accent Bar */}
                  <div className={`h-1.5 w-full ${
                    isPending ? 'bg-orange-500' : isDelivered ? 'bg-emerald-500' : isInTransit ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />

                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Header Row: Waybill ID, QR Token & Status Badge */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-sm sm:text-base tracking-tight text-black">
                            {d.waybill_number}
                          </span>
                          {(d.request_code || d.linked_request_id) && (
                            <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-md">
                              Request #{d.request_code || d.linked_request_id}
                            </span>
                          )}
                          {cleanBenName && (
                            <span className="text-xs font-bold text-[#006B56] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1 max-w-[200px] truncate">
                              <User className="w-3 h-3 text-[#006B56] shrink-0" />
                              <span className="truncate">{cleanBenName}</span>
                            </span>
                          )}
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
                            {isPending ? 'PM Approved: ' : 'Dispatched: '}
                            <strong className="text-slate-700 font-semibold">{d.dispatch_date || 'Today'}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Prominent Status Pill */}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 shrink-0 shadow-2xs ${
                        isPending
                          ? 'bg-orange-100 text-orange-950 border border-orange-300'
                          : isDelivered
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : isInTransit
                          ? 'bg-amber-50 text-amber-900 border border-amber-300'
                          : 'bg-blue-50 text-blue-900 border border-blue-300'
                      }`}>
                        {isPending ? (
                          <>
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                            <span className="font-black">Pending Aid Waybill</span>
                          </>
                        ) : isInTransit ? (
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
                    {isPending ? (
                      <button
                        type="button"
                        onClick={() => onOpenCreateDispatchModal && onOpenCreateDispatchModal(d.request_data)}
                        className="px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white font-black text-xs flex items-center gap-1.5 shadow-2xs hover:shadow transition active:scale-95 cursor-pointer ml-auto"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Issue Waybill & Assign Convoy</span>
                      </button>
                    ) : (
                      <>
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
                      </>
                    )}
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

