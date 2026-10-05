import React, { useState } from 'react';
import { X, ShoppingCart, DollarSign, Calendar, Building2, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function CreatePOModal({
  isOpen,
  onClose,
  suppliers = [],
  warehouses = [],
  onPOSuccess
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    supplier_id: suppliers[0]?.id || '',
    supplier_name: suppliers[0]?.company_name || '',
    category: suppliers[0]?.category || 'Agricultural Inputs',
    items_summary: '',
    total_amount: '',
    warehouse_destination: warehouses[0]?.name || '',
    expected_delivery: '',
    payment_terms: '30 Days Net on Inspection',
    notes: ''
  });

  if (!isOpen) return null;

  const handleSupplierChange = (e) => {
    const sId = e.target.value;
    const sup = suppliers.find(s => s.id === sId);
    if (sup) {
      setForm(prev => ({
        ...prev,
        supplier_id: sup.id,
        supplier_name: sup.company_name,
        category: sup.category || prev.category
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.items_summary.trim()) {
      toast.error('Please specify the commodities ordered in this PO.');
      return;
    }
    if (!form.total_amount || Number(form.total_amount) <= 0) {
      toast.error('Please enter a valid total amount.');
      return;
    }

    setLoading(true);
    try {
      if (onPOSuccess) {
        await onPOSuccess({
          ...form,
          total_amount: Number(form.total_amount)
        });
      }
      toast.success('Purchase order created successfully!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create purchase order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-4 sm:my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#006B56] p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">Create Purchase Order</h3>
              <p className="text-xs text-emerald-100">Issue official PO to approved vendor</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 max-h-[80vh] overflow-y-auto">
          
          {/* Supplier Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Approved Supplier *
            </label>
            {suppliers.length > 0 ? (
              <select
                value={form.supplier_id}
                onChange={handleSupplierChange}
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900"
              >
                <option value="">Select Supplier...</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.company_name} ({s.category})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form.supplier_name}
                onChange={(e) => setForm(prev => ({ ...prev, supplier_name: e.target.value }))}
                placeholder="Enter supplier / vendor company name..."
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900"
              />
            )}
          </div>

          {/* Items Summary */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Items / Commodities Description *
            </label>
            <textarea
              rows="2"
              value={form.items_summary}
              onChange={(e) => setForm(prev => ({ ...prev, items_summary: e.target.value }))}
              required
              placeholder="e.g. 500x Tarpaulins 4x5m UV-Resistant + 200x Heavy-Duty Ropes"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none text-slate-900"
            />
          </div>

          {/* Total Amount & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Total Amount (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={form.total_amount}
                onChange={(e) => setForm(prev => ({ ...prev, total_amount: e.target.value }))}
                required
                placeholder="0.00"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Destination Depot *
              </label>
              {warehouses.length > 0 ? (
                <select
                  value={form.warehouse_destination}
                  onChange={(e) => setForm(prev => ({ ...prev, warehouse_destination: e.target.value }))}
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900"
                >
                  <option value="">Select Destination Depot...</option>
                  {warehouses.map(w => (
                    <option key={w.id || w.code} value={w.name}>
                      {w.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.warehouse_destination}
                  onChange={(e) => setForm(prev => ({ ...prev, warehouse_destination: e.target.value }))}
                  placeholder="e.g. Juba Central Logistics Base"
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900"
                />
              )}
            </div>
          </div>

          {/* Expected Delivery & Payment Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={form.expected_delivery}
                onChange={(e) => setForm(prev => ({ ...prev, expected_delivery: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Terms
              </label>
              <input
                type="text"
                value={form.payment_terms}
                onChange={(e) => setForm(prev => ({ ...prev, payment_terms: e.target.value }))}
                placeholder="e.g. 30 Days Net on GRN"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none text-slate-900"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Creating...' : 'Issue Purchase Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
