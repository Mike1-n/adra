import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Send, Building2, MapPin, Package } from 'lucide-react';
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
    supplier_id: '',
    supplier_name: '',
    supplier_email: '',
    supplier_phone: '',
    category: 'General Humanitarian Supplies',
    item_name: '',
    quantity: '',
    unit: 'Bags',
    warehouse_destination: 'Central Equatoria State Depot',
    expected_delivery: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (suppliers.length > 0 && !form.supplier_id && !form.supplier_name) {
        const first = suppliers[0];
        setForm(prev => ({
          ...prev,
          supplier_id: first.id,
          supplier_name: first.company_name,
          supplier_email: first.email || '',
          supplier_phone: first.phone || '',
          category: first.category || prev.category
        }));
      }
    }
  }, [isOpen, suppliers]);

  useEffect(() => {
    if (warehouses.length > 0 && !form.warehouse_destination) {
      setForm(prev => ({ ...prev, warehouse_destination: warehouses[0].name }));
    }
  }, [warehouses]);

  if (!isOpen) return null;

  const handleSupplierSelect = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setForm(prev => ({
        ...prev,
        supplier_id: '',
        supplier_name: '',
        supplier_email: '',
        supplier_phone: ''
      }));
      return;
    }
    const sup = suppliers.find(s => s.id === val || s.company_name === val);
    if (sup) {
      setForm(prev => ({
        ...prev,
        supplier_id: sup.id,
        supplier_name: sup.company_name,
        supplier_email: sup.email || '',
        supplier_phone: sup.phone || '',
        category: sup.category || prev.category
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplier_name.trim()) {
      toast.warning('Please select a supplier.');
      return;
    }
    if (!form.item_name.trim()) {
      toast.warning('Please enter the commodity or item name.');
      return;
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      toast.warning('Please enter a valid quantity.');
      return;
    }

    const summary = `${form.quantity}x ${form.unit || 'Units'} ${form.item_name}`;

    setLoading(true);
    try {
      if (onPOSuccess) {
        await onPOSuccess({
          ...form,
          quantity: Number(form.quantity),
          items_summary: summary,
          total_amount: 0,
          stage: 1,
          status: 'Pending Supplier Supply'
        });
      }
      toast.success(`Supply request sent to ${form.supplier_name}`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create purchase order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-4 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#006B56] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-bold">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight">Request Supplies (Create PO)</h3>
              <p className="text-[11px] text-white/80">Issue an official purchase request to a supplier</p>
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

        {/* Streamlined Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          
          {/* 1. Supplier / Vendor */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Supplier / Vendor *
            </label>
            {suppliers.length > 0 ? (
              <div className="space-y-1.5">
                <select
                  value={form.supplier_id || (form.supplier_name ? '__custom__' : '')}
                  onChange={handleSupplierSelect}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#006B56] focus:bg-white outline-none font-bold text-slate-900 cursor-pointer"
                >
                  <option value="" disabled>-- Select a Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.company_name}
                    </option>
                  ))}
                  <option value="__custom__">+ Enter Custom Supplier...</option>
                </select>

                {!form.supplier_id && (
                  <input
                    type="text"
                    value={form.supplier_name}
                    onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
                    placeholder="Enter supplier company name"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#006B56] focus:bg-white outline-none font-medium text-slate-900"
                    required
                  />
                )}
              </div>
            ) : (
              <input
                type="text"
                value={form.supplier_name}
                onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
                placeholder="e.g. Pan-Africa Nutrition & Feeds Ltd"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#006B56] focus:bg-white outline-none font-medium text-slate-900"
                required
              />
            )}
          </div>

          {/* 2. Commodity / Item Name */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Commodity / Supplies Requested *
            </label>
            <input
              type="text"
              value={form.item_name}
              onChange={(e) => setForm({ ...form, item_name: e.target.value })}
              placeholder="e.g. Fortified Maize Flour, Tarpaulins, Water Kits"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#006B56] focus:bg-white outline-none font-medium text-slate-900"
              required
            />
          </div>

          {/* 3. Quantity & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="e.g. 400"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#006B56] focus:bg-white outline-none font-bold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Unit
              </label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#006B56] focus:bg-white outline-none font-medium text-slate-900 cursor-pointer"
              >
                <option value="Bags">Bags</option>
                <option value="Boxes">Boxes</option>
                <option value="Cartons">Cartons</option>
                <option value="Kits">Kits</option>
                <option value="Pieces">Pieces</option>
                <option value="Metric Tons (MT)">Metric Tons (MT)</option>
                <option value="Litres">Litres</option>
                <option value="Units">Units</option>
              </select>
            </div>
          </div>

          {/* 4. Receiving Depot Destination */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Receiving Warehouse Depot *
            </label>
            <select
              value={form.warehouse_destination}
              onChange={(e) => setForm({ ...form, warehouse_destination: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#006B56] focus:bg-white outline-none font-medium text-slate-900"
            >
              {warehouses.length > 0 ? (
                warehouses.map(w => (
                  <option key={w.id || w.name} value={w.name}>{w.name}</option>
                ))
              ) : (
                <>
                  <option value="Central Equatoria State Depot">Central Equatoria State Depot</option>
                  <option value="Eastern Equatoria State Depot">Eastern Equatoria State Depot</option>
                  <option value="Upper Nile State Depot">Upper Nile State Depot</option>
                  <option value="Jonglei State Depot">Jonglei State Depot</option>
                  <option value="Western Bahr el Ghazal State Depot">Western Bahr el Ghazal State Depot</option>
                </>
              )}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Submitting...' : 'Send Supply Request'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
