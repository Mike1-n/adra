import React from 'react';
import { X, Printer, Truck, CheckCircle2, QrCode, FileText, MapPin, Calendar, User, Building2, Download, PackageCheck, UserCheck } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { exportWaybillPDF } from '../../../lib/reportGenerator';

export function WaybillDetailModal({
  isOpen,
  onClose,
  dispatch,
  onUpdateStatus,
  onConfirmArrival,
  onHandoverToWorker
}) {
  const toast = useToast();

  if (!isOpen || !dispatch) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    try {
      exportWaybillPDF(dispatch);
      toast.success('Waybill PDF downloaded successfully');
    } catch (e) {
      toast.error('Failed to generate PDF');
    }
  };

  const st = (dispatch.status || '').toLowerCase().trim();
  const dst = (dispatch.dispatch_status || '').toLowerCase().trim();
  const isCollected = st.includes('collect') || dst.includes('collect');
  const isDelivered = !isCollected && (st.includes('deliver') || st.includes('arrived') || st.includes('confirmed') || st === 'goods_arrived_at_hub' || dst.includes('arrived'));
  const isInTransit = !isCollected && !isDelivered;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150 print:shadow-none print:border-none print:rounded-none">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-[#006B56]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono font-black text-slate-900 text-sm sm:text-base">
                  {dispatch.waybill_number}
                </h3>
                {dispatch.dispatch_token && (
                  <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    {dispatch.dispatch_token}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" />
                {dispatch.dispatch_date || 'N/A'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer print:hidden"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer print:hidden"
              title="Print"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer print:hidden"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          
          {/* Status Chip */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-slate-500 font-semibold">Dispatch Status:</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
              isDelivered
                ? 'bg-emerald-100 text-emerald-900'
                : isInTransit
                ? 'bg-amber-100 text-amber-900'
                : 'bg-blue-100 text-blue-900'
            }`}>
              {isInTransit && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
              {isDelivered && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              {isCollected && <UserCheck className="w-3.5 h-3.5 text-blue-600" />}
              <span>{dispatch.status || 'Active'}</span>
            </span>
          </div>

          {/* Collection Banner if collected */}
          {(isCollected || dispatch.collected_by || dispatch.goods_collected_by) && (
            <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="text-slate-500 font-medium">Collected by: </span>
                  <strong className="text-blue-950 font-bold">
                    {dispatch.collected_by || dispatch.goods_collected_by || 'Field Worker'}
                  </strong>
                </div>
              </div>
              {dispatch.collected_at && (
                <span className="text-[10px] text-blue-700 font-mono">
                  {new Date(dispatch.collected_at).toLocaleDateString('en-GB')}
                </span>
              )}
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-slate-700">
            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Origin</span>
              <span className="font-semibold text-slate-900 text-xs block">{dispatch.origin_warehouse || 'Depot'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Destination</span>
              <span className="font-semibold text-slate-900 text-xs block">{dispatch.destination || 'Field Centre'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Driver</span>
              <span className="font-semibold text-slate-900 text-xs block">{dispatch.driver_name || 'N/A'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Vehicle</span>
              <span className="font-mono font-bold text-slate-900 text-xs block">{dispatch.vehicle_reg || 'N/A'}</span>
            </div>
          </div>

          {/* Beneficiary Tag if present */}
          {dispatch.beneficiary_name && (
            <div className="px-3 py-2 rounded-xl bg-emerald-50/60 border border-emerald-100 text-slate-700 flex items-center justify-between text-xs">
              <span className="text-slate-500">Beneficiary Allocation:</span>
              <span className="font-bold text-slate-900">{dispatch.beneficiary_name}</span>
            </div>
          )}

          {/* Items Manifest */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Commodities ({dispatch.items?.length || 0})
            </span>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 overflow-hidden">
              {dispatch.items?.map((item, idx) => (
                <div key={idx} className="p-2.5 bg-white flex items-center justify-between">
                  <span className="font-medium text-slate-800 truncate pr-2">{item.item_name}</span>
                  <span className="font-mono font-bold text-[#006B56] shrink-0">
                    {Number(item.quantity).toLocaleString()} {item.unit || 'pcs'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Released By */}
          {dispatch.released_by && (
            <div className="text-[11px] text-slate-400 text-right">
              Released by: <span className="font-semibold text-slate-700">{dispatch.released_by}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap print:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>PDF</span>
            </button>

            {isInTransit && onConfirmArrival && (
              <button
                type="button"
                onClick={() => onConfirmArrival(dispatch)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-[#006B56] hover:from-emerald-700 hover:to-[#005544] text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer active:scale-98"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Confirm Arrival at Hub</span>
              </button>
            )}

            {isDelivered && onHandoverToWorker && (
              <button
                type="button"
                onClick={() => onHandoverToWorker(dispatch)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer active:scale-98"
              >
                <UserCheck className="w-4 h-4" />
                <span>Handover to Field Officer</span>
              </button>
            )}

            {isCollected && (
              <span className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-bold text-xs flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Collected by Field Worker</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


