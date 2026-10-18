import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  UserCheck,
  Package,
  MapPin,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  User,
  FileText
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function HandoverModal({
  isOpen,
  onClose,
  item,
  fieldWorkers = [],
  activeSupervisor,
  onConfirmHandover
}) {
  const toast = useToast();
  const [selectedWorkerName, setSelectedWorkerName] = useState('');
  const [customWorkerName, setCustomWorkerName] = useState('');
  const [useCustomWorker, setUseCustomWorker] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive initial field worker if one is linked to the assignment or request
  const defaultWorker = useMemo(() => {
    if (!item) return '';
    return (
      item.assigned_field_worker_name ||
      item.goods_collected_by ||
      item.field_worker_name ||
      ''
    );
  }, [item]);

  useEffect(() => {
    if (isOpen && item) {
      if (defaultWorker && !defaultWorker.toLowerCase().includes('pending') && !defaultWorker.toLowerCase().includes('unassigned')) {
        setSelectedWorkerName(defaultWorker);
        setUseCustomWorker(false);
      } else if (fieldWorkers.length > 0) {
        setSelectedWorkerName(fieldWorkers[0].name || fieldWorkers[0].full_name || 'Agnes Dawa');
        setUseCustomWorker(false);
      } else {
        setSelectedWorkerName('Agnes Dawa');
      }
      setCustomWorkerName('');
      setHandoverNotes('');
    }
  }, [isOpen, item, defaultWorker, fieldWorkers]);

  if (!isOpen || !item) return null;

  const waybillNo = item.waybill_number || item.request_code || item.id || 'WAYBILL-SS-2026';
  const supervisorName = activeSupervisor?.name || activeSupervisor?.full_name || 'Emmanuel Adeyemi (Supervisor)';
  const destination = item.destination || item.location || 'Field Relief Hub';
  
  // Commodity count and items
  const items = item.items && item.items.length > 0 ? item.items : [
    { item_name: item.commodity_name || 'Humanitarian Relief Items', quantity: item.quantity || 1, unit: item.unit || 'Kit' }
  ];
  const totalQty = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const primaryItemName = items[0]?.item_name || 'Emergency Relief Supplies';
  const primaryUnit = items[0]?.unit || 'Units';

  const finalWorkerName = (useCustomWorker ? customWorkerName.trim() : selectedWorkerName.trim()) || 'Field Officer';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!finalWorkerName) {
      toast.error('Please select or specify the field worker receiving the relief goods.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirmHandover(item, finalWorkerName, handoverNotes);
      toast.success(`Relief commodities handed over to ${finalWorkerName}!`);
      onClose();
    } catch (err) {
      console.error('Error confirming handover:', err);
      toast.error(err.message || 'Failed to record handover.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-4 sm:p-5 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-white/20 px-2 py-0.5 rounded text-white">
                  {waybillNo}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                  Custody Handover
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                Handover Cargo to Field Worker
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
          
          {/* Cargo & Hub Context Box */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Destination Hub:</span>
              <span className="font-bold text-slate-800 text-right truncate max-w-[240px] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#006B56]" />
                {destination}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Relief Cargo:</span>
              <span className="font-black text-[#006B56] text-xs flex items-center gap-1">
                <Package className="w-3.5 h-3.5" />
                {totalQty > 0 ? `${totalQty.toLocaleString()} ${primaryUnit}` : '1 Bundle'} • {primaryItemName}
              </span>
            </div>

            {item.driver_name && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px] text-slate-500">
                <span>Transported by:</span>
                <span className="font-medium text-slate-700">
                  {item.driver_name} ({item.vehicle_reg || 'SSD Logistics'})
                </span>
              </div>
            )}
          </div>

          {/* Field Worker Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1 text-blue-900">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Receiving Field Worker *
              </span>
              <button
                type="button"
                onClick={() => setUseCustomWorker(!useCustomWorker)}
                className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 underline cursor-pointer"
              >
                {useCustomWorker ? 'Select from team list' : 'Type custom name'}
              </button>
            </label>

            {useCustomWorker ? (
              <input
                type="text"
                value={customWorkerName}
                onChange={(e) => setCustomWorkerName(e.target.value)}
                placeholder="Enter full name of field worker collecting cargo..."
                className="w-full px-3 py-2.5 rounded-xl border border-blue-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden font-semibold text-slate-900 text-xs transition bg-blue-50/20"
                autoFocus
                required
              />
            ) : (
              <div className="relative">
                <select
                  value={selectedWorkerName}
                  onChange={(e) => setSelectedWorkerName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden font-bold text-slate-900 text-xs transition bg-white appearance-none cursor-pointer"
                  required
                >
                  {defaultWorker && !fieldWorkers.some(w => (w.name || w.full_name) === defaultWorker) && (
                    <option value={defaultWorker}>
                      ★ Assigned Worker: {defaultWorker}
                    </option>
                  )}
                  {fieldWorkers.map(w => {
                    const name = w.name || w.full_name;
                    return (
                      <option key={w.id || name} value={name}>
                        {name} {w.county ? `(${w.county})` : ''} {w.phone ? `— ${w.phone}` : ''}
                      </option>
                    );
                  })}
                  {fieldWorkers.length === 0 && (
                    <>
                      <option value="Agnes Dawa">Agnes Dawa (Juba Field Officer)</option>
                      <option value="John Garang">John Garang (Juba Field Worker)</option>
                      <option value="Peter Taban">Peter Taban (Relief Officer)</option>
                      <option value="Mary Achol">Mary Achol (Distribution Agent)</option>
                    </>
                  )}
                </select>
              </div>
            )}
            <p className="text-[10px] text-slate-500 italic">
              This field worker takes formal custody of the supplies to conduct final beneficiary distribution.
            </p>
          </div>

          {/* Supervisor Authorization Box */}
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                Authorized Handover By (Supervisor):
              </span>
              <span className="font-extrabold text-blue-950 text-xs block mt-0.5">
                {supervisorName}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-medium text-blue-600 block">Date & Time</span>
              <span className="font-mono text-[10px] text-slate-600 font-bold block">
                {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} • Today
              </span>
            </div>
          </div>

          {/* Handover Verification Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">
              Handover Remarks / Verification Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={handoverNotes}
              onChange={(e) => setHandoverNotes(e.target.value)}
              placeholder="e.g. Inspected packages; loaded into field vehicle SSD-102-DIST. In good condition."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden text-xs text-slate-800 transition"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg transition cursor-pointer active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Recording Handover...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Confirm Handover to {finalWorkerName.split(' ')[0]}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
