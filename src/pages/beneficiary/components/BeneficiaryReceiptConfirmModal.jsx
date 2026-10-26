import React, { useState } from 'react';
import {
  X,
  PackageCheck,
  CheckCircle2,
  Package,
  Star,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { db } from '../../../lib/supabase';

export function BeneficiaryReceiptConfirmModal({
  isOpen,
  onClose,
  request,
  onConfirmed
}) {
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [condition, setCondition] = useState('Complete & Undamaged');
  const [feedback, setFeedback] = useState('All items received in full and verified in good condition.');
  const [isConfirmedChecked, setIsConfirmedChecked] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !request) return null;

  const beneficiaryName = request.recipient_name || request.beneficiary_name || 'Beneficiary';
  const deliveredBy = request.distributed_by || request.assigned_field_worker_name || 'ADRA Field Worker';
  const deliveredDate = request.distributed_at || request.distribution_date || new Date().toISOString();

  const handleConfirm = async () => {
    if (!isConfirmedChecked) {
      toast.error('Please check the confirmation box to verify receipt.');
      return;
    }

    try {
      setIsSubmitting(true);
      await db.confirmBeneficiaryReceipt({
        requestId: request.id,
        requestCode: request.request_code,
        rating,
        condition,
        feedback: feedback.trim() || 'Aid package received in full.',
        confirmedBy: beneficiaryName
      });

      toast.success('Thank you! Your receipt confirmation has been recorded successfully.');
      if (onConfirmed) onConfirmed();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to record confirmation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl w-full max-w-lg flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-800 via-[#006B56] to-teal-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <PackageCheck className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Beneficiary Receipt Confirmation</h2>
              <p className="text-[10px] text-emerald-100/80">Confirm delivery & commodities received</p>
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

        {/* Body */}
        <div className="p-4 space-y-3.5 text-xs overflow-y-auto max-h-[75vh]">
          {/* Summary Card */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-bold text-slate-900 text-sm">{beneficiaryName}</h3>
                  <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    #{request.request_code}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{request.payam || request.location || 'Eastern Equatoria'} • Household: {request.household_members || 6} Members</span>
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                Awaiting Confirmation
              </span>
            </div>

            {/* Handover Officer & Date */}
            <div className="text-[11px] text-slate-600 flex items-center gap-2 pt-1 border-t border-slate-200/80">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 text-emerald-600" />
                <span>Delivered by: <strong>{deliveredBy}</strong></span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{new Date(deliveredDate).toLocaleDateString('en-GB')}</span>
              </span>
            </div>

            {/* Commodities List */}
            <div className="pt-1.5 border-t border-slate-200 flex items-center gap-1.5 flex-wrap text-[11px]">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Package className="w-3 h-3 text-[#006B56]" />
                <span>Items:</span>
              </span>
              {request.items && request.items.length > 0 ? (
                request.items.map((item, idx) => (
                  <span key={idx} className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-semibold text-slate-800 text-[10px]">
                    {item.quantity} {item.unit || ''} {item.item_name}
                  </span>
                ))
              ) : (
                <span className="font-semibold text-slate-700">
                  {request.category || 'Humanitarian Relief Package'}
                </span>
              )}
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isConfirmedChecked}
              onChange={(e) => setIsConfirmedChecked(e.target.checked)}
              className="mt-0.5 rounded text-[#006B56] focus:ring-[#006B56] cursor-pointer w-4 h-4 shrink-0"
            />
            <div className="text-emerald-950">
              <span className="font-bold block text-xs">
                I confirm receipt of these relief supplies
              </span>
              <p className="text-[11px] text-emerald-800 leading-snug mt-0.5">
                I, <strong>{beneficiaryName}</strong>, confirm that the commodities listed above were physically received by my household in full.
              </p>
            </div>
          </label>

          {/* Condition of Goods */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-600 uppercase">
              Condition of Received Goods
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Complete & Undamaged', label: '✓ In Full & Good' },
                { id: 'Partial Items', label: '⚠ Partial Delivery' },
                { id: 'Damaged / Issue', label: '✕ Report Issue' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCondition(opt.id)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold text-center border transition cursor-pointer ${
                    condition === opt.id
                      ? 'bg-emerald-50 text-[#006B56] border-emerald-400 ring-1 ring-emerald-300'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Star Rating */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-600 uppercase">
              Service Rating
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 text-slate-300 hover:text-amber-400 transition cursor-pointer"
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-[11px] font-bold text-slate-600 ml-1.5">
                {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Satisfactory' : 'Needs Improvement'}
              </span>
            </div>
          </div>

          {/* Remarks / Feedback */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-600 uppercase">
              Beneficiary Feedback (Optional)
            </label>
            <input
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. All supplies received in good condition, thank you"
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-[#006B56]"
            />
          </div>
        </div>

        {/* Footer */}
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
            disabled={!isConfirmedChecked || isSubmitting}
            onClick={handleConfirm}
            className="px-4 py-1.5 bg-[#006B56] hover:bg-[#005544] disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Confirming...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Receipt</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
