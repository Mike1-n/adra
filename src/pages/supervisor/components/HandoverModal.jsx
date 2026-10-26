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
  assignments = [],
  activeSupervisor,
  onConfirmHandover
}) {
  const toast = useToast();
  const [recipientType, setRecipientType] = useState('assigned_worker'); // 'assigned_worker' | 'beneficiary' | 'other_worker' | 'custom'
  const [selectedRecipientName, setSelectedRecipientName] = useState('');
  const [customWorkerName, setCustomWorkerName] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Match corresponding assignment from assignments list if available
  const matchedAssignment = useMemo(() => {
    if (!item) return null;
    return assignments.find(
      a => (item.linked_request_id && a.id === item.linked_request_id) ||
           (item.request_code && a.request_code === item.request_code) ||
           (item.waybill_number && a.waybill_number === item.waybill_number) ||
           (item.request_id && a.id === item.request_id) ||
           (item.id && a.id === item.id) ||
           (item.beneficiary_name && a.beneficiary_name === item.beneficiary_name)
    );
  }, [item, assignments]);

  // Derive assigned field worker name for this case
  const assignedWorker = useMemo(() => {
    const raw =
      item?.assigned_field_worker_name ||
      matchedAssignment?.assigned_field_worker_name ||
      matchedAssignment?.goods_collected_by ||
      item?.goods_collected_by ||
      item?.field_worker_name ||
      '';
    if (!raw || raw.toLowerCase().includes('pending') || raw.toLowerCase().includes('unassigned')) {
      return '';
    }
    return raw.trim();
  }, [item, matchedAssignment]);

  // Derive beneficiary name for this case
  const beneficiaryName = useMemo(() => {
    const raw =
      item?.beneficiary_name ||
      matchedAssignment?.beneficiary_name ||
      item?.recipient_name ||
      '';
    if (!raw) return '';
    return raw.replace(/\s*\([^)]*\)\s*$/, '').trim();
  }, [item, matchedAssignment]);

  useEffect(() => {
    if (isOpen && item) {
      if (assignedWorker) {
        setRecipientType('assigned_worker');
        setSelectedRecipientName(assignedWorker);
      } else if (beneficiaryName) {
        setRecipientType('beneficiary');
        setSelectedRecipientName(beneficiaryName);
      } else if (fieldWorkers.length > 0) {
        setRecipientType('other_worker');
        setSelectedRecipientName(fieldWorkers[0].name || fieldWorkers[0].full_name || 'Field Officer');
      } else {
        setRecipientType('other_worker');
        setSelectedRecipientName('Field Officer');
      }
      setCustomWorkerName('');
      setHandoverNotes('');
    }
  }, [isOpen, item, assignedWorker, beneficiaryName, fieldWorkers]);

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

  const finalRecipientName = (
    recipientType === 'assigned_worker'
      ? (assignedWorker || selectedRecipientName || 'Assigned Field Worker')
      : recipientType === 'beneficiary'
      ? (beneficiaryName || selectedRecipientName || 'Beneficiary')
      : recipientType === 'custom'
      ? customWorkerName.trim()
      : selectedRecipientName.trim()
  ) || 'Field Officer';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!finalRecipientName) {
      toast.error('Please select the receiving field worker or beneficiary.');
      return;
    }

    try {
      setIsSubmitting(true);
      const isBeneficiaryRecipient = recipientType === 'beneficiary';
      const formattedRecipient = isBeneficiaryRecipient
        ? `${finalRecipientName} (Beneficiary - Direct Collection)`
        : finalRecipientName;

      await onConfirmHandover(item, formattedRecipient, handoverNotes);
      toast.success(`Relief supplies handed over to ${finalRecipientName}!`);
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
                Handover Cargo Custody
              </h2>
              <p className="text-[11px] text-blue-200 mt-0.5">
                Release to Assigned Field Worker or Direct to Beneficiary
              </p>
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

            {beneficiaryName && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Beneficiary:</span>
                <span className="font-black text-slate-900 truncate max-w-[220px]">
                  {beneficiaryName}
                </span>
              </div>
            )}

            {item.driver_name && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px] text-slate-500">
                <span>Transported by:</span>
                <span className="font-medium text-slate-700">
                  {item.driver_name} ({item.vehicle_reg || 'SSD Logistics'})
                </span>
              </div>
            )}
          </div>

          {/* Primary Recipient Selection: Assigned Field Worker vs Beneficiary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>Receiving Recipient *</span>
              </label>

              {recipientType !== 'other_worker' && recipientType !== 'custom' && (
                <button
                  type="button"
                  onClick={() => {
                    setRecipientType('other_worker');
                    if (fieldWorkers.length > 0) {
                      setSelectedRecipientName(fieldWorkers[0].name || fieldWorkers[0].full_name || 'Agnes Dawa');
                    }
                  }}
                  className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                  Other field worker
                </button>
              )}
            </div>

            {/* Quick-Select Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Card 1: Assigned Field Worker */}
              <button
                type="button"
                onClick={() => {
                  setRecipientType('assigned_worker');
                  setSelectedRecipientName(assignedWorker || 'Assigned Field Worker');
                }}
                className={`p-3 rounded-xl border text-left transition cursor-pointer relative overflow-hidden ${
                  recipientType === 'assigned_worker'
                    ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/25 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    Assigned Field Worker
                  </span>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    recipientType === 'assigned_worker' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                  }`}>
                    {recipientType === 'assigned_worker' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="font-black text-slate-900 text-sm mt-1.5 truncate">
                  {assignedWorker || 'Simon Kiden (Field Officer)'}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                  Takes custody for field distribution
                </p>
              </button>

              {/* Card 2: Beneficiary Direct Collection */}
              <button
                type="button"
                onClick={() => {
                  setRecipientType('beneficiary');
                  setSelectedRecipientName(beneficiaryName || 'Beneficiary');
                }}
                className={`p-3 rounded-xl border text-left transition cursor-pointer relative overflow-hidden ${
                  recipientType === 'beneficiary'
                    ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/25 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#006B56] flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-[#006B56]" />
                    Beneficiary (Direct)
                  </span>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    recipientType === 'beneficiary' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                  }`}>
                    {recipientType === 'beneficiary' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="font-black text-slate-900 text-sm mt-1.5 truncate">
                  {beneficiaryName || 'DAVID KAJE (Beneficiary)'}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                  Beneficiary collects directly at Hub
                </p>
              </button>
            </div>

            {/* Other Team Member Dropdown or Custom Input */}
            {(recipientType === 'other_worker' || recipientType === 'custom') && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    Select Other Field Worker:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRecipientType(recipientType === 'custom' ? 'other_worker' : 'custom')}
                      className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      {recipientType === 'custom' ? 'Pick from list' : 'Type custom name'}
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (assignedWorker) {
                          setRecipientType('assigned_worker');
                          setSelectedRecipientName(assignedWorker);
                        } else if (beneficiaryName) {
                          setRecipientType('beneficiary');
                          setSelectedRecipientName(beneficiaryName);
                        }
                      }}
                      className="text-[10px] font-bold text-slate-600 hover:underline cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {recipientType === 'custom' ? (
                  <input
                    type="text"
                    value={customWorkerName}
                    onChange={(e) => setCustomWorkerName(e.target.value)}
                    placeholder="Enter full name of field worker collecting cargo..."
                    className="w-full px-3 py-2 rounded-xl border border-blue-300 focus:border-blue-600 outline-hidden font-bold text-slate-900 text-xs bg-white"
                    autoFocus
                    required
                  />
                ) : (
                  <select
                    value={selectedRecipientName}
                    onChange={(e) => setSelectedRecipientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 outline-hidden font-bold text-slate-900 text-xs bg-white cursor-pointer"
                  >
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
                )}
              </div>
            )}
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
              <span className="text-[10px] text-blue-800 font-semibold block mt-0.5">
                Recipient: <span className="font-black text-slate-900">{finalRecipientName}</span> {recipientType === 'beneficiary' ? '(Beneficiary)' : '(Field Worker)'}
              </span>
            </div>
            <div className="text-right shrink-0">
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
              placeholder="e.g. Inspected packages; verified identity; loaded into field vehicle or handed directly to beneficiary in good condition."
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
              className={`px-5 py-2.5 rounded-xl text-white font-black text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg transition cursor-pointer active:scale-98 disabled:opacity-50 ${
                recipientType === 'beneficiary'
                  ? 'bg-[#006B56] hover:bg-[#005544]'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Recording Handover...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Confirm Handover to {finalRecipientName.split(' ')[0]}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
