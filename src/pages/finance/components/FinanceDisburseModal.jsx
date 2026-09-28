import React, { useState, useEffect } from 'react';
import {
  Banknote,
  X,
  Smartphone,
  CreditCard,
  Building,
  CheckCircle2,
  Receipt,
  Phone,
  User,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function FinanceDisburseModal({
  isOpen,
  onClose,
  requisition,
  onConfirmDisburse,
  currentUser
}) {
  const toast = useToast();
  const [paymentMethod, setPaymentMethod] = useState('m-Gurush Mobile Money');
  const [voucherReference, setVoucherReference] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (requisition) {
      const rnd = Math.floor(1000 + Math.random() * 9000);
      const txn = Math.floor(1000000 + Math.random() * 9000000);
      const method = requisition.preferred_payout || requisition.payout_channel || 'm-Gurush Mobile Money';
      
      setPaymentMethod(method);
      setVoucherReference(`PV-2026-${rnd}`);
      setTransactionRef(`TXN-MG-${txn}`);
      setNotes(`Field cash facilitation disbursed via ${method} to ${requisition.field_worker_name}. PM Grace authorization verified.`);
    }
  }, [requisition]);

  if (!isOpen || !requisition) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!voucherReference.trim() || !transactionRef.trim()) {
      toast.warning('Please enter valid voucher & transaction references.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmDisburse(requisition.id, {
        voucher_reference: voucherReference,
        transaction_ref: transactionRef,
        payment_method: paymentMethod,
        notes: notes
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const payoutPhone = requisition.payout_phone || requisition.field_worker_phone;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#006B56] to-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Execute Disbursement
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Issue payment voucher & release funds
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Requisition Snapshot */}
        <div className="p-3.5 bg-gradient-to-r from-emerald-50/70 to-teal-50/70 rounded-2xl border border-emerald-200/80 space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Payee Staff:</span>
            <span className="font-bold text-slate-900">{requisition.field_worker_name || 'Field Worker'}</span>
          </div>
          {payoutPhone && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Payout Phone:</span>
              <span className="font-mono font-bold text-slate-800">{payoutPhone}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Requisition Code:</span>
            <span className="font-mono font-bold text-slate-700">{requisition.request_code || requisition.id}</span>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-emerald-200/60">
            <span className="text-slate-600 font-black">Authorized Amount:</span>
            <span className="text-base font-black text-[#006B56]">
              SSP {Number(requisition.amount || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Disbursement Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Payment Method */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Payment Channel / Gateway <span className="text-rose-500">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#006B56]"
            >
              <option value="m-Gurush Mobile Money">m-Gurush Mobile Money (Instant Field Payout)</option>
              <option value="Equity Bank South Sudan">Equity Bank South Sudan (Direct Account Wire)</option>
              <option value="Stanbic Bank South Sudan">Stanbic Bank South Sudan</option>
              <option value="Direct Cash Payout (Kapoeta Field Office)">Direct Cash Payout (Kapoeta / Field Safe)</option>
            </select>
          </div>

          {/* Voucher Ref & Transaction Ref */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Voucher Ref <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={voucherReference}
                onChange={e => setVoucherReference(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#006B56]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Txn / Bank Ref <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={e => setTransactionRef(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#006B56]"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Disbursement Notes & Verification
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#006B56]"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 bg-gradient-to-r from-[#006B56] to-emerald-600 hover:from-[#005242] hover:to-emerald-700 text-white text-xs font-black rounded-2xl shadow-xs transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Confirm & Disburse</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
