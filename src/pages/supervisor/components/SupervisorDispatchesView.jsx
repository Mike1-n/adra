import React, { useState, useMemo } from 'react';
import {
  Truck,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  ShieldCheck,
  Package,
  QrCode,
  FileText,
  User,
  PackageCheck,
  Download,
  Building2,
  Tag,
  Eye,
  UserCheck
} from 'lucide-react';
import { exportWaybillPDF } from '../../../lib/reportGenerator';

export function SupervisorDispatchesView({
  dispatches = [],
  assignments = [],
  statusFilter = 'ALL',
  onStatusFilterChange,
  onConfirmArrival,
  onHandoverToWorker,
  onOpenWaybillDetail,
  activeSupervisorName = 'Emmanuel Adeyemi'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [internalFilter, setInternalFilter] = useState('ALL');
  
  // Use parent filter if passed, otherwise internal
  const activeFilter = statusFilter || internalFilter;

  const setFilter = (newFilter) => {
    setInternalFilter(newFilter);
    if (onStatusFilterChange) {
      onStatusFilterChange(newFilter);
    }
  };

  // Filter dispatches for this supervisor/state
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
      const isCol = st.includes('collect') || dst.includes('collect');
      const isArr = !isCol && (st.includes('deliver') || st.includes('arrived') || st.includes('confirmed') || st === 'goods_arrived_at_hub' || dst.includes('arrived'));
      const isTrans = !isCol && !isArr && (st === 'in transit' || st === 'warehouse_dispatched' || st.includes('transit') || dst === 'in transit' || Boolean(d.waybill_number));

      if (activeFilter === 'IN_TRANSIT' && !isTrans) return false;
      if (activeFilter === 'ARRIVED' && !isArr) return false;
      if (activeFilter === 'COLLECTED' && !isCol) return false;

      return true;
    });
  }, [dispatches, searchTerm, activeFilter]);

  // Statistics
  const stats = useMemo(() => {
    let inTransit = 0;
    let arrived = 0;
    let collected = 0;

    dispatches.forEach(d => {
      const st = (d.status || '').toLowerCase().trim();
      const dst = (d.dispatch_status || '').toLowerCase().trim();
      const isCol = st.includes('collect') || dst.includes('collect');
      const isArr = !isCol && (st.includes('deliver') || st.includes('arrived') || st.includes('confirmed') || st === 'goods_arrived_at_hub' || dst.includes('arrived'));
      const isTrans = !isCol && !isArr && (st === 'in transit' || st === 'warehouse_dispatched' || st.includes('transit') || dst === 'in transit' || Boolean(d.waybill_number));

      if (isCol) {
        collected++;
      } else if (isArr) {
        arrived++;
      } else if (isTrans) {
        inTransit++;
      }
    });

    return { total: dispatches.length, inTransit, arrived, collected };
  }, [dispatches]);

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-150">
      
      {/* 1. TOP METRICS SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* All Dispatches */}
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            activeFilter === 'ALL'
              ? 'bg-[#006B56]/10 border-[#006B56] ring-2 ring-[#006B56]/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${activeFilter === 'ALL' ? 'text-[#006B56]' : 'text-slate-500'}`}>
              All
            </span>
            <Truck className={`w-3.5 h-3.5 ${activeFilter === 'ALL' ? 'text-[#006B56]' : 'text-slate-400'}`} />
          </div>
          <div className="mt-1">
            <span className={`text-xl font-black ${activeFilter === 'ALL' ? 'text-[#006B56]' : 'text-slate-900'}`}>{stats.total}</span>
            <span className={`text-[10px] block truncate font-medium ${activeFilter === 'ALL' ? 'text-[#006B56]' : 'text-slate-400'}`}>Waybills</span>
          </div>
        </button>

        {/* In Transit */}
        <button
          type="button"
          onClick={() => setFilter('IN_TRANSIT')}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            activeFilter === 'IN_TRANSIT'
              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${activeFilter === 'IN_TRANSIT' ? 'text-amber-800' : 'text-slate-500'}`}>
              In Transit
            </span>
            <Clock className={`w-3.5 h-3.5 ${activeFilter === 'IN_TRANSIT' ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <div className="mt-1">
            <span className={`text-xl font-black ${activeFilter === 'IN_TRANSIT' ? 'text-amber-900' : 'text-slate-900'}`}>{stats.inTransit}</span>
            <span className={`text-[10px] block truncate font-medium ${activeFilter === 'IN_TRANSIT' ? 'text-amber-700' : 'text-slate-400'}`}>En Route</span>
          </div>
        </button>

        {/* Arrived at Hub */}
        <button
          type="button"
          onClick={() => setFilter('ARRIVED')}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            activeFilter === 'ARRIVED'
              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${activeFilter === 'ARRIVED' ? 'text-emerald-800' : 'text-slate-500'}`}>
              Arrived
            </span>
            <CheckCircle2 className={`w-3.5 h-3.5 ${activeFilter === 'ARRIVED' ? 'text-emerald-600' : 'text-slate-400'}`} />
          </div>
          <div className="mt-1">
            <span className={`text-xl font-black ${activeFilter === 'ARRIVED' ? 'text-emerald-900' : 'text-slate-900'}`}>{stats.arrived}</span>
            <span className={`text-[10px] block truncate font-medium ${activeFilter === 'ARRIVED' ? 'text-emerald-700' : 'text-slate-400'}`}>Verified</span>
          </div>
        </button>

        {/* Collected by Field Worker */}
        <button
          type="button"
          onClick={() => setFilter('COLLECTED')}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            activeFilter === 'COLLECTED'
              ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${activeFilter === 'COLLECTED' ? 'text-blue-800' : 'text-slate-500'}`}>
              Collected
            </span>
            <UserCheck className={`w-3.5 h-3.5 ${activeFilter === 'COLLECTED' ? 'text-blue-600' : 'text-slate-400'}`} />
          </div>
          <div className="mt-1">
            <span className={`text-xl font-black ${activeFilter === 'COLLECTED' ? 'text-blue-900' : 'text-slate-900'}`}>{stats.collected}</span>
            <span className={`text-[10px] block truncate font-medium ${activeFilter === 'COLLECTED' ? 'text-blue-700' : 'text-slate-400'}`}>With Worker</span>
          </div>
        </button>
      </div>

      {/* 2. SEARCH BAR & ACTIVE FILTER BAR */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search waybill #, truck, driver, or location..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900 transition"
          />
        </div>

        {activeFilter !== 'ALL' && (
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold shrink-0 transition cursor-pointer"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* 3. DISPATCHES TABLE (SIMPLIFIED & CLEAN) */}
      {filteredDispatches.length === 0 ? (
        <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-6">
          <Truck className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
          <p className="font-bold text-slate-700 text-sm">No aid dispatches match your filter.</p>
          <p className="text-xs text-slate-400 mt-0.5">Dispatches released by Inventory will appear here.</p>
        </div>
      ) : (
        <>
          {/* MOBILE PHONE MODE (< sm): FULL-WIDTH RESPONSIVE CARDS */}
          <div className="sm:hidden space-y-3">
            {filteredDispatches.map((d) => {
              const st = (d.status || '').toLowerCase().trim();
              const dst = (d.dispatch_status || '').toLowerCase().trim();
              const isCollected = st.includes('collect') || dst.includes('collect');
              const isDelivered =
                !isCollected && (
                  st.includes('deliver') ||
                  st.includes('arrived') ||
                  st.includes('confirmed') ||
                  st === 'goods_arrived_at_hub' ||
                  dst.includes('arrived')
                );
              const isInTransit = !isCollected && !isDelivered;

              const totalQty = d.items?.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0) || 0;
              const primaryItemName = d.items?.[0]?.item_name || 'Relief Cargo';
              const unit = d.items?.[0]?.unit || 'Units';

              const matchedAssignment = assignments.find(
                a => (d.linked_request_id && a.id === d.linked_request_id) ||
                     (d.request_code && a.request_code === d.request_code) ||
                     (d.waybill_number && a.waybill_number === d.waybill_number) ||
                     (d.request_id && a.id === d.request_id) ||
                     (d.beneficiary_name && a.beneficiary_name === d.beneficiary_name)
              );

              const collectorName =
                d.collected_by ||
                d.goods_collected_by ||
                matchedAssignment?.goods_collected_by ||
                matchedAssignment?.assigned_field_worker_name ||
                d.assigned_field_worker_name ||
                d.recipient_name;

              return (
                <div
                  key={d.id || d.waybill_number}
                  className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3.5 space-y-3"
                >
                  {/* Card Header: Waybill # & Status Badge */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <span className="font-mono font-black text-slate-900 text-sm tracking-tight block">
                        {d.waybill_number}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{d.dispatch_date || 'Today'}</span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 shrink-0 ${
                        isCollected
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : isDelivered
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-900 border border-amber-200'
                      }`}
                    >
                      {isInTransit && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />}
                      {isDelivered && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                      {isCollected && <UserCheck className="w-3 h-3 text-blue-600 shrink-0" />}
                      <span>{isCollected ? 'Collected' : isDelivered ? 'Arrived' : 'In Transit'}</span>
                    </span>
                  </div>

                  {/* Card Body Details: Destination, Cargo, Transport */}
                  <div className="space-y-2 text-xs">
                    {/* Destination Hub */}
                    <div className="flex items-start gap-2 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                      <MapPin className="w-3.5 h-3.5 text-[#006B56] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Destination Hub
                        </span>
                        <p className="font-semibold text-slate-800 text-xs leading-snug break-words">
                          {d.destination || 'Field Relief Hub'}
                        </p>
                      </div>
                    </div>

                    {/* Cargo & Transport Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Cargo */}
                      <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                        <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block flex items-center gap-1">
                          <Package className="w-3 h-3 text-emerald-600" /> Cargo
                        </span>
                        <p className="font-black text-[#006B56] text-xs mt-0.5">
                          {totalQty > 0 ? `${totalQty.toLocaleString()} ${unit}` : 'Relief Bundle'}
                        </p>
                        <p className="text-[10px] text-slate-600 font-medium truncate mt-0.5" title={primaryItemName}>
                          {primaryItemName}
                        </p>
                      </div>

                      {/* Transport */}
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                          <Truck className="w-3 h-3 text-slate-400" /> Driver & Vehicle
                        </span>
                        <p className="font-bold text-slate-800 text-xs truncate mt-0.5">
                          {d.driver_name || 'Deng Bol'}
                        </p>
                        <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                          {d.vehicle_reg || 'SSD-481-LOG'}
                        </p>
                      </div>
                    </div>

                    {/* Collected / Handed Over to Field Worker Details */}
                    {isCollected && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/60 p-3 rounded-xl border border-blue-200/90 flex items-start gap-2.5 shadow-2xs">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1 text-xs">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="text-[10px] text-blue-800 font-black uppercase tracking-wider">
                              Handed Over to Field Worker
                            </span>
                            {d.collected_at && (
                              <span className="text-[10px] text-blue-600 font-semibold bg-blue-100/70 px-1.5 py-0.2 rounded">
                                {new Date(d.collected_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className="font-black text-blue-950 text-sm mt-0.5 break-words">
                            {collectorName || d.collected_by || 'Field Worker'}
                          </p>
                          <div className="flex items-center gap-1 text-[11px] text-blue-700 mt-1">
                            <span>Authorized by:</span>
                            <span className="font-bold text-slate-800">
                              {d.handed_over_by || d.goods_handed_over_by || activeSupervisorName}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-1 flex items-center gap-2 border-t border-slate-100">
                    {isInTransit && onConfirmArrival && (
                      <button
                        type="button"
                        onClick={() => onConfirmArrival(d)}
                        className="flex-1 py-2 bg-[#006B56] hover:bg-[#005544] text-white text-xs font-bold rounded-lg shadow-2xs inline-flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>Confirm Arrived</span>
                      </button>
                    )}

                    {isDelivered && onHandoverToWorker && (
                      <button
                        type="button"
                        onClick={() => onHandoverToWorker(d)}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs inline-flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Handover</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => exportWaybillPDF(d)}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer inline-flex items-center justify-center"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4 text-emerald-700" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenWaybillDetail && onOpenWaybillDetail(d)}
                      className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer inline-flex items-center justify-center gap-1"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TABLET & DESKTOP MODE (>= sm): MULTI-COLUMN DATA TABLE */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-3.5">Waybill #</th>
                    <th className="py-3 px-3.5">Destination Hub</th>
                    <th className="py-3 px-3.5">Driver & Vehicle</th>
                    <th className="py-3 px-3.5">Cargo</th>
                    <th className="py-3 px-3.5 text-center">Status</th>
                    <th className="py-3 px-3.5 text-right w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDispatches.map((d) => {
                    const st = (d.status || '').toLowerCase().trim();
                    const dst = (d.dispatch_status || '').toLowerCase().trim();
                    const isCollected = st.includes('collect') || dst.includes('collect');
                    const isDelivered =
                      !isCollected && (
                        st.includes('deliver') ||
                        st.includes('arrived') ||
                        st.includes('confirmed') ||
                        st === 'goods_arrived_at_hub' ||
                        dst.includes('arrived')
                      );
                    const isInTransit = !isCollected && !isDelivered;

                    const totalQty = d.items?.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0) || 0;
                    const primaryItemName = d.items?.[0]?.item_name || 'Relief Cargo';
                    const unit = d.items?.[0]?.unit || 'Units';

                    const matchedAssignment = assignments.find(
                      a => (d.linked_request_id && a.id === d.linked_request_id) ||
                           (d.request_code && a.request_code === d.request_code) ||
                           (d.waybill_number && a.waybill_number === d.waybill_number) ||
                           (d.request_id && a.id === d.request_id) ||
                           (d.beneficiary_name && a.beneficiary_name === d.beneficiary_name)
                    );

                    const collectorName =
                      d.collected_by ||
                      d.goods_collected_by ||
                      matchedAssignment?.goods_collected_by ||
                      matchedAssignment?.assigned_field_worker_name ||
                      d.assigned_field_worker_name ||
                      d.recipient_name;

                    return (
                      <tr
                        key={d.id || d.waybill_number}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        {/* Waybill # */}
                        <td className="py-3 px-3.5">
                          <div className="font-mono font-bold text-slate-900 text-sm">
                            {d.waybill_number}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {d.dispatch_date || 'Today'}
                          </div>
                        </td>

                        {/* Destination Hub */}
                        <td className="py-3 px-3.5">
                          <div className="font-medium text-slate-800 truncate max-w-[200px]" title={d.destination || 'Hub'}>
                            {d.destination || 'Field Relief Hub'}
                          </div>
                        </td>

                        {/* Driver & Vehicle */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="font-medium text-slate-800">
                            {d.driver_name || 'Deng Bol'}
                          </div>
                          <div className="font-mono text-[10px] text-slate-500">
                            {d.vehicle_reg || 'SSD-481-LOG'}
                          </div>
                        </td>

                        {/* Cargo */}
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-[#006B56]">
                            {totalQty > 0 ? `${totalQty.toLocaleString()} ${unit}` : 'Relief Bundle'}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[170px]" title={primaryItemName}>
                            {primaryItemName}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              isCollected
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : isDelivered
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-900 border border-amber-200'
                            }`}
                          >
                            {isInTransit && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />}
                            {isDelivered && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                            {isCollected && <UserCheck className="w-3 h-3 text-blue-600 shrink-0" />}
                            <span>{isCollected ? 'Collected' : isDelivered ? 'Arrived' : 'In Transit'}</span>
                          </span>

                          {isCollected && (
                            <div className="mt-1 text-center">
                              <div className="text-[11px] text-blue-950 font-black flex items-center justify-center gap-1">
                                <User className="w-3 h-3 text-blue-600 shrink-0" />
                                <span className="truncate max-w-[160px]" title={`Handed over to: ${collectorName || d.collected_by}`}>
                                  {collectorName || d.collected_by || 'Field Worker'}
                                </span>
                              </div>
                              <div className="text-[9px] text-slate-400 font-semibold">
                                By: {d.handed_over_by || d.goods_handed_over_by || activeSupervisorName}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {isInTransit && onConfirmArrival && (
                              <button
                                type="button"
                                onClick={() => onConfirmArrival(d)}
                                className="px-2.5 py-1 bg-[#006B56] hover:bg-[#005544] text-white text-[11px] font-bold rounded-lg shadow-2xs inline-flex items-center gap-1 transition cursor-pointer active:scale-95"
                                title="Confirm Goods Arrived at Hub"
                              >
                                <PackageCheck className="w-3.5 h-3.5" />
                                <span>Arrived</span>
                              </button>
                            )}

                            {isDelivered && onHandoverToWorker && (
                              <button
                                type="button"
                                onClick={() => onHandoverToWorker(d)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg shadow-2xs inline-flex items-center gap-1 transition cursor-pointer active:scale-95"
                                title="Handover to Field Worker (Mark Collected)"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Handover</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => exportWaybillPDF(d)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                              title="Download PDF Waybill Receipt"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-700" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onOpenWaybillDetail && onOpenWaybillDetail(d)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer"
                              title="View Full Waybill Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
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
        </>
      )}
    </div>
  );
}
