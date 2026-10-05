import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal, AlertTriangle, ArrowRightLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function StockAdjustmentModal({
  isOpen,
  onClose,
  inventoryItems = [],
  warehouses = [],
  selectedItem = null,
  onAdjustSuccess
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const initialItemId = selectedItem?.id || inventoryItems[0]?.id || '';

  const [form, setForm] = useState({
    item_id: initialItemId,
    adjustment_type: 'DAMAGE_SPOILAGE', // 'DAMAGE_SPOILAGE' | 'COUNT_RECONCILIATION' | 'WRITE_OFF' | 'TRANSFER'
    quantity_change: '',
    target_warehouse: '',
    reason: ''
  });

  useEffect(() => {
    if (isOpen) {
      const targetItem = selectedItem || inventoryItems[0];
      const initialId = targetItem?.id || '';
      const otherWh = warehouses.find(w => w.name !== targetItem?.warehouse)?.name || warehouses[1]?.name || warehouses[0]?.name || '';
      setForm({
        item_id: initialId,
        adjustment_type: 'DAMAGE_SPOILAGE',
        quantity_change: '',
        target_warehouse: otherWh,
        reason: ''
      });
    }
  }, [isOpen, selectedItem, inventoryItems, warehouses]);

  if (!isOpen) return null;

  const activeItem = inventoryItems.find(i => i.id === form.item_id) || selectedItem || inventoryItems[0];
  const currentItem = activeItem;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.item_id) {
      toast.error('Please select an inventory item.');
      return;
    }
    const qty = Number(form.quantity_change);
    if (!qty || isNaN(qty)) {
      toast.error('Please enter a non-zero quantity change.');
      return;
    }

    if (form.adjustment_type === 'TRANSFER' && !form.target_warehouse) {
      toast.error('Please select a destination warehouse.');
      return;
    }

    if (form.adjustment_type === 'TRANSFER' && form.target_warehouse === activeItem?.warehouse) {
      toast.error('Target warehouse must be different from source warehouse.');
      return;
    }

    if (qty > 0 && (form.adjustment_type === 'DAMAGE_SPOILAGE' || form.adjustment_type === 'WRITE_OFF')) {
      toast.warning('Damage and write-offs should be entered as negative deductions (e.g. -10). Converting automatically.');
    }

    const adjustedQty = (form.adjustment_type === 'DAMAGE_SPOILAGE' || form.adjustment_type === 'WRITE_OFF' || form.adjustment_type === 'TRANSFER')
      ? -Math.abs(qty)
      : qty;

    if (activeItem && Math.abs(adjustedQty) > (activeItem.quantity || 0) && adjustedQty < 0) {
      toast.error(`Cannot deduct more than available quantity on hand (${activeItem.quantity} ${activeItem.unit}).`);
      return;
    }

    setLoading(true);
    try {
      if (onAdjustSuccess) {
        await onAdjustSuccess({
          item_id: form.item_id,
          adjustment_type: form.adjustment_type,
          quantity_change: adjustedQty,
          target_warehouse: form.target_warehouse,
          reason: form.reason
        });
      }
      toast.success('Stock adjustment processed and audit trail recorded.');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to process adjustment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20">
              <SlidersHorizontal className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Stock Reconciliation & Adjustment
              </h3>
              <p className="text-xs text-amber-100/80 mt-0.5">
                Record damage write-offs, physical count reconciliations, or inter-warehouse transfers.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Item Selector */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">Select Item to Adjust <span className="text-rose-500">*</span></label>
            <select
              value={form.item_id}
              onChange={(e) => setForm({ ...form, item_id: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-amber-600 outline-none font-medium"
              required
            >
              {inventoryItems.map(i => (
                <option key={i.id} value={i.id}>
                  {i.item_name} — Current: {i.quantity} {i.unit} ({i.warehouse})
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Banner */}
          {activeItem && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Location</span>
                <span className="font-bold text-slate-800 text-xs">{activeItem.warehouse}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Balance on Hand</span>
                <span className="font-extrabold text-[#006B56] text-sm font-mono">
                  {activeItem.quantity?.toLocaleString()} {activeItem.unit}
                </span>
              </div>
            </div>
          )}

          {/* Adjustment Type */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">Reason / Operation Type <span className="text-rose-500">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, adjustment_type: 'DAMAGE_SPOILAGE' })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                  form.adjustment_type === 'DAMAGE_SPOILAGE'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Damaged / Expired</span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal">Deducts damaged or expired goods</span>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, adjustment_type: 'COUNT_RECONCILIATION' })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                  form.adjustment_type === 'COUNT_RECONCILIATION'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Count Audit Variance</span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal">Variance found during physical stock count</span>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, adjustment_type: 'TRANSFER' })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                  form.adjustment_type === 'TRANSFER'
                    ? 'border-teal-500 bg-teal-50 text-teal-950 font-bold ring-2 ring-teal-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700">
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Depot Transfer</span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal">Move stock to another state warehouse</span>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, adjustment_type: 'WRITE_OFF' })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                  form.adjustment_type === 'WRITE_OFF'
                    ? 'border-rose-500 bg-rose-50 text-rose-950 font-bold ring-2 ring-rose-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                  <X className="w-4 h-4" />
                  <span>Wastage / Write-Off</span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal">Write off unrecoverable stock</span>
              </button>
            </div>
          </div>

          {/* If Transfer, show target warehouse */}
          {form.adjustment_type === 'TRANSFER' && (
            <div className="space-y-1 p-3 rounded-2xl bg-teal-50/60 border border-teal-200">
              <label className="block font-bold text-teal-950">Destination State Warehouse <span className="text-rose-500">*</span></label>
              <select
                value={form.target_warehouse}
                onChange={(e) => setForm({ ...form, target_warehouse: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-teal-300 bg-white text-slate-800 font-medium outline-none"
                required
              >
                {warehouses.filter(w => w.name !== activeItem?.warehouse).map(w => (
                  <option key={w.id || w.code} value={w.name}>
                    {w.name} ({w.state})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quantity Change */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700 flex items-center justify-between">
              <span>Quantity to Adjust ({activeItem?.unit || 'Units'}) <span className="text-rose-500">*</span></span>
              {form.adjustment_type === 'COUNT_RECONCILIATION' && (
                <span className="text-[10px] text-slate-400">Use positive (+) or negative (-) numbers</span>
              )}
            </label>
            <input
              type="number"
              value={form.quantity_change}
              onChange={(e) => setForm({ ...form, quantity_change: e.target.value })}
              placeholder={form.adjustment_type === 'COUNT_RECONCILIATION' ? 'e.g. -20 or +50' : 'e.g. 15'}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-amber-600 outline-none font-bold text-sm"
              required
            />
          </div>

          {/* Justification / Notes */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">Audit Justification & Reason <span className="text-rose-500">*</span></label>
            <textarea
              rows={2}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="e.g. Physical stock take conducted on Oct 4th by Logistics Audit team."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-amber-600 outline-none resize-none font-medium"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold flex items-center gap-2 shadow-xs transition active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Processing...' : 'Apply Stock Adjustment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
