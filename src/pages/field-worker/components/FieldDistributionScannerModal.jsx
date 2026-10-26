import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  ChevronDown,
  Package,
  FileCheck,
  PenTool,
  RotateCcw,
  Lock
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function FieldDistributionScannerModal({
  isOpen,
  onClose,
  worker = {},
  onConfirmDistribution,
  tasks = [],
  selectedTask = null
}) {
  const toast = useToast();
  const [selectedTaskItem, setSelectedTaskItem] = useState(null);
  
  // Recipient Confirmation States
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientRelationship, setRecipientRelationship] = useState('Self (Household Head)');
  const [beneficiaryConfirmedReceipt, setBeneficiaryConfirmedReceipt] = useState(true);
  const [disbursementNotes, setDisbursementNotes] = useState('Aid package inspected and physically received in full by beneficiary.');
  
  // Signature Canvas state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  
  const [itemsChecked, setItemsChecked] = useState({
    identity_confirmed: true,
    goods_inspected: true,
    quantities_verified: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTaskAlreadyDistributed = (t) => {
    if (!t) return false;
    return t.status === 'Distributed' || 
           t.status === 'Completed' ||
           t.dispatch_status === 'Distributed' ||
           Boolean(t.distributed_at) ||
           Boolean(t.distribution_date) ||
           Boolean(t.distribution_confirmed);
  };

  // Prioritize active (undelivered) tasks
  const pendingTasks = tasks.filter(t => !isTaskAlreadyDistributed(t));

  useEffect(() => {
    if (selectedTask) {
      setSelectedTaskItem(selectedTask);
      setRecipientName(selectedTask.beneficiary_name || '');
      setRecipientPhone(selectedTask.phone || selectedTask.beneficiary_phone || '');
    } else if (pendingTasks.length > 0) {
      setSelectedTaskItem(pendingTasks[0]);
      setRecipientName(pendingTasks[0].beneficiary_name || '');
      setRecipientPhone(pendingTasks[0].phone || pendingTasks[0].beneficiary_phone || '');
    } else if (tasks.length > 0) {
      setSelectedTaskItem(tasks[0]);
      setRecipientName(tasks[0].beneficiary_name || '');
      setRecipientPhone(tasks[0].phone || tasks[0].beneficiary_phone || '');
    } else {
      setSelectedTaskItem(null);
    }
    setHasSignature(false);
  }, [selectedTask, isOpen, tasks]);

  // Handle canvas drawing for beneficiary signature
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  if (!isOpen) return null;

  const handleSelectTask = (taskId) => {
    const found = tasks.find(t => t.id === taskId || t.request_code === taskId || t.waybill_number === taskId);
    if (found) {
      setSelectedTaskItem(found);
      setRecipientName(found.beneficiary_name || '');
      setRecipientPhone(found.phone || found.beneficiary_phone || '');
      clearSignature();
    }
  };

  const isSelectedAlreadyDelivered = isTaskAlreadyDistributed(selectedTaskItem);

  const handleConfirmDisbursement = async () => {
    if (!selectedTaskItem) {
      toast.error('Please select an active distribution task.');
      return;
    }

    if (isSelectedAlreadyDelivered) {
      toast.error('This item has already been distributed and confirmed. Duplicate distribution is blocked.');
      return;
    }

    if (!recipientName.trim()) {
      toast.error('Please enter the recipient full name.');
      return;
    }

    if (!beneficiaryConfirmedReceipt) {
      toast.error('The beneficiary confirmation checkbox must be checked to confirm handover.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirmDistribution({
        requestId: selectedTaskItem.id,
        requestCode: selectedTaskItem.request_code,
        waybillNumber: selectedTaskItem.waybill_number,
        beneficiaryId: selectedTaskItem.beneficiary_id || selectedTaskItem.beneficiary_code,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        recipientRelationship: recipientRelationship,
        recipientSignature: hasSignature ? 'Beneficiary Digital Signature Verified' : 'Beneficiary Confirmed Physical Handover',
        notes: disbursementNotes || 'Aid package distributed and handed over directly to beneficiary.',
        workerName: worker.name || 'Field Officer',
        workerId: worker.id || 'fw-1',
        itemsDistributed: selectedTaskItem.items?.length > 0
          ? selectedTaskItem.items.map(i => `${i.quantity} ${i.unit || ''} ${i.item_name}`).join(', ')
          : (selectedTaskItem.category || 'Emergency Relief Package')
      });
      
      toast.success(`Aid package confirmed delivered and received by ${recipientName}!`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to record distribution');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* 1. MODAL HEADER */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-800 via-[#006B56] to-teal-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <PackageCheck className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Handover Relief Goods</h2>
              <p className="text-[10px] text-emerald-100/80">Beneficiary Delivery & Receipt Confirmation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. MODAL BODY */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs flex-1">
          
          {/* TASK SELECTION (Only when no preselected task & multiple tasks available) */}
          {!selectedTask && tasks.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-700 shrink-0">Case:</label>
              <div className="relative flex-1">
                <select
                  value={selectedTaskItem?.id || selectedTaskItem?.request_code || ''}
                  onChange={(e) => handleSelectTask(e.target.value)}
                  className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none pr-7 cursor-pointer"
                >
                  {tasks.map(t => (
                    <option key={t.id || t.request_code} value={t.id || t.request_code}>
                      {t.beneficiary_name} — #{t.request_code} ({t.payam || 'Payam'})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          {/* ALREADY DISTRIBUTED WARNING BANNER */}
          {isSelectedAlreadyDelivered && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2 text-amber-900 text-xs">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-950 block">Distribution Already Completed</span>
                <p className="text-[11px] leading-snug">
                  Handed over to <strong>{selectedTaskItem.recipient_name || selectedTaskItem.beneficiary_name}</strong> on {selectedTaskItem.distributed_at ? new Date(selectedTaskItem.distributed_at).toLocaleDateString('en-GB') : 'a previous date'}.
                </p>
              </div>
            </div>
          )}

          {/* BENEFICIARY & COMMODITY SUMMARY CARD */}
          {selectedTaskItem && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-sm">
                      {selectedTaskItem.beneficiary_name}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      #{selectedTaskItem.request_code}
                    </span>
                    {selectedTaskItem.waybill_number && (
                      <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {selectedTaskItem.waybill_number}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{selectedTaskItem.payam || selectedTaskItem.location || 'Eastern Equatoria'} • Household: {selectedTaskItem.household_members || 6} Members</span>
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  isSelectedAlreadyDelivered ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-[#006B56]'
                }`}>
                  {isSelectedAlreadyDelivered ? 'Delivered' : 'Ready'}
                </span>
              </div>

              {/* Commodities list - clean inline chips */}
              <div className="pt-1.5 border-t border-slate-200 flex items-center gap-1.5 flex-wrap text-[11px]">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Package className="w-3 h-3 text-[#006B56]" />
                  <span>Items:</span>
                </span>
                {selectedTaskItem.items && selectedTaskItem.items.length > 0 ? (
                  selectedTaskItem.items.map((item, idx) => (
                    <span key={idx} className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-semibold text-slate-800 text-[10px]">
                      {item.quantity} {item.unit || ''} {item.item_name}
                    </span>
                  ))
                ) : (
                  <span className="font-semibold text-slate-700">
                    {selectedTaskItem.category || 'Humanitarian Relief Package'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* BENEFICIARY RECEIPT FORM FIELDS */}
          <div className="space-y-2.5">
            {/* Recipient Name & Relationship in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  disabled={isSelectedAlreadyDelivered}
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 outline-none focus:border-[#006B56]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Relationship to Household
                </label>
                <select
                  disabled={isSelectedAlreadyDelivered}
                  value={recipientRelationship}
                  onChange={(e) => setRecipientRelationship(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 outline-none focus:border-[#006B56] cursor-pointer"
                >
                  <option value="Self (Household Head)">Self (Household Head)</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Adult Family Member / Dependent">Adult Family Member</option>
                  <option value="Authorized Caregiver / Community Leader">Community Leader / Rep</option>
                </select>
              </div>
            </div>

            {/* Phone & Remarks in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Phone / ID (Optional)
                </label>
                <input
                  type="text"
                  disabled={isSelectedAlreadyDelivered}
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="Phone or ID #"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 outline-none focus:border-[#006B56]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Remarks (Optional)
                </label>
                <input
                  type="text"
                  disabled={isSelectedAlreadyDelivered}
                  placeholder="Optional field notes"
                  value={disbursementNotes}
                  onChange={(e) => setDisbursementNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-[#006B56]"
                />
              </div>
            </div>

            {/* Physical Handover Confirmation Checkbox */}
            <label className="flex items-center gap-2 p-2 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-[11px] text-emerald-950 font-bold cursor-pointer select-none">
              <input
                type="checkbox"
                disabled={isSelectedAlreadyDelivered}
                checked={beneficiaryConfirmedReceipt}
                onChange={(e) => setBeneficiaryConfirmedReceipt(e.target.checked)}
                className="rounded text-[#006B56] focus:ring-[#006B56] cursor-pointer w-4 h-4 shrink-0"
              />
              <span>Goods physically received in full by {recipientName || 'beneficiary'}.</span>
            </label>

            {/* Signature / Mark Canvas (Optional, compact) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                  <PenTool className="w-3 h-3 text-[#006B56]" />
                  <span>Signature / Mark (Optional)</span>
                </label>
                {hasSignature && !isSelectedAlreadyDelivered && (
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-[10px] text-slate-500 hover:text-rose-600 font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
              <div className="border border-slate-300 rounded-lg overflow-hidden bg-white relative">
                <canvas
                  ref={canvasRef}
                  width={380}
                  height={60}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className={`w-full h-[55px] bg-white cursor-crosshair touch-none ${
                    isSelectedAlreadyDelivered ? 'opacity-50 pointer-events-none' : ''
                  }`}
                />
                {!hasSignature && !isSelectedAlreadyDelivered && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-[10px] text-slate-400 font-medium italic">
                    Sign or draw mark here
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* 3. MODAL FOOTER */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedTaskItem || isSelectedAlreadyDelivered || isSubmitting || !beneficiaryConfirmedReceipt}
            onClick={handleConfirmDisbursement}
            className="px-4 py-1.5 bg-[#006B56] hover:bg-[#005544] disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : isSelectedAlreadyDelivered ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Already Delivered</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Handover</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
