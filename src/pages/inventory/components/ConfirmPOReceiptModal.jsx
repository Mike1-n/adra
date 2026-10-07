import React, { useState, useEffect } from 'react';
import { X, PackageCheck, FileCheck } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function ConfirmPOReceiptModal({
  isOpen,
  onClose,
  purchaseOrder,
  warehouses = [],
  onConfirmSuccess
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const qty = purchaseOrder ? (Number(purchaseOrder.quantity) || (parseInt(purchaseOrder.items_summary) || 1)) : 1;
  const unit = purchaseOrder?.unit || 'Units';
  const itemName = purchaseOrder?.item_name || purchaseOrder?.items_summary || 'Supplies';

  const [form, setForm] = useState({
    receiving_warehouse: '',
    quantity: '',
    batch_number: '',
    notes: ''
  });

  useEffect(() => {
    if (purchaseOrder && isOpen) {
      setForm({
        receiving_warehouse: purchaseOrder.warehouse_destination || purchaseOrder.destination_warehouse || warehouses[0]?.name || 'Central Equatoria State Depot',
        quantity: qty,
        batch_number: `BATCH-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        notes: ''
      });
    }
  }, [purchaseOrder, isOpen, warehouses, qty]);

  if (!isOpen || !purchaseOrder) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.receiving_warehouse) {
      toast.error('Please select the receiving warehouse.');
      return;
    }
    if (Number(form.quantity) <= 0) {
      toast.error('Please enter a valid received quantity.');
      return;
    }

    setLoading(true);
    try {
      if (onConfirmSuccess) {
        await onConfirmSuccess(purchaseOrder.id, {
          item_name: itemName,
          category: purchaseOrder.category || 'General Supplies',
          unit: unit,
          receiving_warehouse: form.receiving_warehouse,
          quantity: Number(form.quantity) || qty,
          batch_number: form.batch_number || `BATCH-${Date.now().toString().slice(-4)}`,
          notes: form.notes.trim() || `Received in sound condition at ${form.receiving_warehouse}`
        });
      }
      toast.success(`GRN Issued! ${form.quantity} ${unit} credited to ${form.receiving_warehouse}.`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to confirm goods receipt.');
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
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Confirm Goods Receipt (GRN)</h3>
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
            {qty.toLocaleString()} {unit} {itemName}
          </span>
          <span className="font-extrabold text-[#006B56]">
            SSP {Number(purchaseOrder.total_amount).toLocaleString()}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Receiving Depot */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Receiving Depot / Warehouse *
            </label>
            <select
              value={form.receiving_warehouse}
              onChange={(e) => setForm(prev => ({ ...prev, receiving_warehouse: e.target.value }))}
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900"
            >
              {warehouses.map(w => (
                <option key={w.id || w.name} value={w.name}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Received Qty ({unit}) *
              </label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm(prev => ({ ...prev, quantity: e.target.value }))}
                required
                className="w-full px-3 py-2 text-xs font-bold text-slate-900 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-mono"
              />
            </div>

            {/* Batch / Lot */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Batch / Lot #
              </label>
              <input
                type="text"
                value={form.batch_number}
                onChange={(e) => setForm(prev => ({ ...prev, batch_number: e.target.value }))}
                placeholder="BATCH-2026"
                className="w-full px-3 py-2 text-xs font-medium text-slate-900 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none"
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Inspection Notes (Optional)
            </label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g. 100% sound condition, seals intact"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none text-slate-900"
            />
          </div>

          {/* Forwarding to Finance notice */}
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 text-[11px] text-emerald-950 flex items-start gap-2">
            <PackageCheck className="w-4 h-4 text-[#006B56] shrink-0 mt-0.5" />
            <p>
              <strong>Automated Workflow: </strong>Issuing this GRN credits warehouse inventory and automatically forwards the purchase order to <strong>Finance Control</strong> for payment disbursement.
            </p>
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
                <FileCheck className="w-4 h-4" />
              )}
              <span>Confirm GRN & Receive Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
