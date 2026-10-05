import React from 'react';
import { X, Printer, Truck, ShieldCheck, CheckCircle2, QrCode, FileText, MapPin, Calendar, User } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function WaybillDetailModal({
  isOpen,
  onClose,
  dispatch,
  onUpdateStatus
}) {
  const toast = useToast();

  if (!isOpen || !dispatch) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleMarkDelivered = async () => {
    try {
      if (onUpdateStatus) {
        await onUpdateStatus(dispatch.id, 'Delivered to Distribution Point', 'Delivered and verified by receiving depot staff');
      }
      toast.success('Waybill status updated to Delivered!');
      onClose();
    } catch (e) {
      toast.error('Failed to update status.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Top Bar (Hidden on print) */}
        <div className="bg-slate-900 p-4 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Official Humanitarian Waybill Manifest</span>
            <span className="font-mono text-xs text-slate-400">[{dispatch.waybill_number}]</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Waybill</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official Waybill Document */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-800 text-xs font-sans">
          
          {/* Document Header with ADRA Crest & Waybill Token */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#006B56] text-white flex items-center justify-center font-extrabold text-sm">
                  A
                </div>
                <div>
                  <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
                    ADRA SOUTH SUDAN
                  </h1>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Logistics & Relief Distribution Department
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 mt-2">
                Compound B, Juba Central Industrial Area • Juba, South Sudan
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-md font-mono font-extrabold text-xs bg-slate-100 border border-slate-300 text-slate-900">
                {dispatch.waybill_number}
              </span>
              <div className="mt-1.5 flex items-center justify-end gap-1.5 text-[11px] font-bold text-emerald-800">
                <QrCode className="w-3.5 h-3.5" />
                <span className="font-mono">{dispatch.dispatch_token}</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Date: {dispatch.dispatch_date}
              </span>
            </div>
          </div>

          {/* Logistics Routing Summary */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Origin Facility</span>
              <span className="font-bold text-slate-900 text-xs block">{dispatch.origin_warehouse}</span>
              <span className="text-[11px] text-slate-500">Authorized Release by: {dispatch.released_by}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Destination Point</span>
              <span className="font-bold text-slate-900 text-xs block">{dispatch.destination}</span>
              <span className="text-[11px] text-slate-500">Project: {dispatch.project_name}</span>
            </div>
          </div>

          {/* Convoy & Driver Metadata */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl border border-slate-200 text-[11px]">
            <div>
              <span className="text-slate-400 font-medium block">Transport Mode:</span>
              <span className="font-bold text-slate-800">{dispatch.transport_mode}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Vehicle / Reg No:</span>
              <span className="font-bold font-mono text-slate-800">{dispatch.vehicle_reg}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Driver / Sat Contact:</span>
              <span className="font-bold text-slate-800">{dispatch.driver_name} ({dispatch.driver_phone || 'N/A'})</span>
            </div>
          </div>

          {/* Commodities Manifest Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Staged Commodities Manifest
            </h4>
            <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-[11px] font-bold border-b border-slate-200">
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Commodity Description</th>
                  <th className="py-2 px-3 text-right">Quantity</th>
                  <th className="py-2 px-3 text-right">Unit</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dispatch.items?.map((item, idx) => (
                  <tr key={idx} className="text-xs">
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{item.item_name}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-800 font-mono">
                      {Number(item.quantity).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{item.unit}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Dispatched
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Security / Notes */}
          {dispatch.notes && (
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-950">
              <span className="font-bold block mb-0.5">Special Instructions / UN Security Clearance:</span>
              <p>{dispatch.notes}</p>
            </div>
          )}

          {/* Signature Sign-Off Matrix */}
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-200 text-[11px]">
            <div className="space-y-4">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block mb-1">
                  1. Dispatched & Certified By (Warehouse Manager):
                </span>
                <p className="font-bold text-slate-900">{dispatch.released_by || 'Gabriel Majok'}</p>
                <div className="mt-4 border-b border-slate-300 w-48" />
                <span className="text-[10px] text-slate-400 block mt-1">Signature & Official Stamp</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block mb-1">
                  2. Received & Verified By (Field Distribution Officer):
                </span>
                <p className="font-bold text-slate-900">{dispatch.received_by || 'Field Logistics Officer'}</p>
                <div className="mt-4 border-b border-slate-300 w-48" />
                <span className="text-[10px] text-slate-400 block mt-1">Signature & Date Received</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions (Hidden on print) */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Digital verification QR token active</span>
          </div>

          <div className="flex items-center gap-2">
            {dispatch.status !== 'Delivered to Distribution Point' && (
              <button
                type="button"
                onClick={handleMarkDelivered}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Delivered</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
