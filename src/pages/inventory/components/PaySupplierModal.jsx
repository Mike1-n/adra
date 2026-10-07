import React, { useState, useEffect } from 'react';
import { X, Landmark, Receipt, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function PaySupplierModal({
  isOpen,
  onClose,
  purchaseOrder,
  supplier,
  onPaySuccess
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    payment_method: 'Bank Wire Transfer (Stanbic Bank)',
    payment_reference: '',
    payment_voucher_number: '',
    paid_amount: '',
    notes: ''
  });

  useEffect(() => {
    if (purchaseOrder && isOpen) {
      setForm({
        payment_method: supplier?.bank_name ? `Bank Transfer (${supplier.bank_name})` : 'Bank Wire (Stanbic Bank South Sudan)',
        payment_reference: `TX-EFT-${Date.now().toString().slice(-6)}`,
        payment_voucher_number: `PV-SS-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        paid_amount: purchaseOrder.total_amount || '',
        notes: ''
      });
    }
  }, [purchaseOrder, supplier, isOpen]);

  if (!isOpen || !purchaseOrder) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.paid_amount || Number(form.paid_amount) <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }
    if (!form.payment_reference.trim()) {
      toast.error('Please specify a transaction or EFT reference.');
      return;
    }

    setLoading(true);
    try {
      if (onPaySuccess) {
        await onPaySuccess(purchaseOrder.id, {
          ...form,
          paid_amount: Number(form.paid_amount),
          paid_date: new Date().toISOString().split('T')[0]
        });
      }
      toast.success(`Payment of SSP ${Number(form.paid_amount).toLocaleString()} disbursed to ${purchaseOrder.supplier_name}!`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to record supplier payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-4 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Clean Header */}
        <div className="bg-[#006B56] px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Pay Supplier & Settle PO</h3>
              <p className="text-xs text-white/80">{purchaseOrder.po_number} &bull; {purchaseOrder.supplier_name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clean Summary Bar */}
        <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900">
            Invoice: <strong className="text-blue-700 font-mono">{purchaseOrder.supplier_invoice_number || 'INV-SUP'}</strong>
          </span>
          <span className="font-bold text-slate-700">
            GRN: <strong className="text-[#006B56] font-mono">{purchaseOrder.grn_number || 'Confirmed'}</strong>
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="grid grid-cols-2 gap-3">
            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Disbursement (SSP) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">SSP</span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={form.paid_amount}
                  onChange={(e) => setForm(prev => ({ ...prev, paid_amount: e.target.value }))}
                  required
                  className="w-full pl-11 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Channel *
              </label>
              <select
                value={form.payment_method}
                onChange={(e) => setForm(prev => ({ ...prev, payment_method: e.target.value }))}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900"
              >
                <option value="Bank Wire (Stanbic Bank)">Bank Wire (Stanbic Bank)</option>
                <option value="Direct EFT (Equity Bank)">Direct EFT (Equity Bank)</option>
                <option value="Direct EFT (KCB Bank)">Direct EFT (KCB Bank)</option>
                <option value="m-Gurush Mobile Money">m-Gurush Mobile Money</option>
                <option value="Cheque Disbursement">Bank Certified Cheque</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Reference */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tx / EFT Reference *
              </label>
              <input
                type="text"
                value={form.payment_reference}
                onChange={(e) => setForm(prev => ({ ...prev, payment_reference: e.target.value }))}
                required
                placeholder="TX-EFT-001"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-mono font-bold text-slate-900"
              />
            </div>

            {/* Voucher */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Voucher # *
              </label>
              <input
                type="text"
                value={form.payment_voucher_number}
                onChange={(e) => setForm(prev => ({ ...prev, payment_voucher_number: e.target.value }))}
                required
                placeholder="PV-SS-2026-001"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-mono font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-[#006B56] hover:bg-[#005443] rounded-xl shadow-xs transition active:scale-[0.99] cursor-pointer flex items-center gap-1.5"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Confirm & Settle Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
