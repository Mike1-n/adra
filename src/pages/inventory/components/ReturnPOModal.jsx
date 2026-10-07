import React, { useState } from 'react';
import { X, RotateCcw, AlertTriangle } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function ReturnPOModal({
  isOpen,
  onClose,
  purchaseOrder,
  onReturnSuccess
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [reason, setReason] = useState('Damaged in Transit / Seals Broken');
  const [notes, setNotes] = useState('');

  if (!isOpen || !purchaseOrder) return null;

  const qty = purchaseOrder ? (Number(purchaseOrder.quantity) || (parseInt(purchaseOrder.items_summary) || 1)) : 1;
  const unit = purchaseOrder?.unit || 'Units';
  const itemName = purchaseOrder?.item_name || purchaseOrder?.items_summary || 'Supplies';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (onReturnSuccess) {
        await onReturnSuccess(purchaseOrder.id, {
          reason,
          notes: notes.trim() || `Consignment failed warehouse receipt inspection: ${reason}.`,
          returned_date: new Date().toISOString().split('T')[0]
        });
      }
      toast.success(`PO ${purchaseOrder.po_number} marked as Rejected & Returned to ${purchaseOrder.supplier_name}.`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to reject and return consignment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-4 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-rose-700 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Return Goods to Supplier</h3>
              <p className="text-xs text-rose-100">{purchaseOrder.po_number} &bull; {purchaseOrder.supplier_name}</p>
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

        {/* Consignment Highlight */}
        <div className="bg-rose-50/60 border-b border-rose-100 px-5 py-3 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900">
            {qty.toLocaleString()} {unit} {itemName}
          </span>
          <span className="text-rose-700 font-bold bg-white px-2 py-0.5 rounded border border-rose-200">
            GRN Rejected
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Primary Reason for Rejection / Return *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs font-medium text-slate-900 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-rose-600 outline-none"
            >
              <option value="Damaged in Transit / Seals Broken">Damaged in Transit / Packaging Broken</option>
              <option value="Substandard Quality / Contaminated">Substandard Quality / Contaminated / Failed QC</option>
              <option value="Expired / Past Shelf-Life Date">Expired / Past Maximum Shelf-Life Date</option>
              <option value="Incorrect Item / Specification Mismatch">Incorrect Item / Specification Mismatch</option>
              <option value="Quantity Shortage / Significant Discrepancy">Quantity Shortage / Significant Discrepancy</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Inspection Notes / Return Details (Optional)
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Moisture damage observed on 50 bags during depot offloading. Vendor instructed to replace lot."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-rose-600 outline-none text-slate-900"
            />
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-2 text-[11px] text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              This will reject the consignment, prevent warehouse stock from being credited, and block Finance payout until the vendor resupplies.
            </span>
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
              className="px-5 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-xs transition active:scale-[0.99] cursor-pointer flex items-center gap-1.5"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              <span>Confirm & Return Goods</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
