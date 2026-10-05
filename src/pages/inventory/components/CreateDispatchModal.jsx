import React, { useState } from 'react';
import { X, Truck, Plus, Trash2, CheckCircle2, ShieldCheck, MapPin, User, Package } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function CreateDispatchModal({
  isOpen,
  onClose,
  warehouses = [],
  inventoryItems = [],
  approvedRequests = [],
  onDispatchSuccess
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    origin_warehouse: warehouses[0]?.name || '',
    destination: '',
    project_name: 'Emergency Relief Response',
    linked_request_id: '',
    beneficiary_name: '',
    transport_mode: 'ADRA Logistics Fleet Truck',
    vehicle_reg: '',
    driver_name: '',
    driver_phone: '',
    notes: '',
    items: [
      {
        item_id: inventoryItems[0]?.id || '',
        item_name: inventoryItems[0]?.item_name || '',
        quantity: '',
        unit: inventoryItems[0]?.unit || 'Units'
      }
    ]
  });

  if (!isOpen) return null;

  const handleLinkRequest = (e) => {
    const reqId = e.target.value;
    if (!reqId) {
      setForm(prev => ({ ...prev, linked_request_id: '', beneficiary_name: '', destination: '' }));
      return;
    }
    const req = approvedRequests.find(r => r.id === reqId || r.tracking_number === reqId);
    if (req) {
      setForm(prev => ({
        ...prev,
        linked_request_id: req.id || req.tracking_number,
        beneficiary_name: `${req.beneficiary_name || req.full_name || 'Beneficiary'} (${req.location || req.payam || req.state || 'Field'})`,
        destination: `${req.location || req.payam || req.state || 'Field Distribution Hub'} Relief Centre`,
        project_name: req.project_name || req.programme_name || prev.project_name
      }));
    }
  };

  const handleAddItemLine = () => {
    const defaultItem = inventoryItems[0];
    setForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          item_id: defaultItem?.id || '',
          item_name: defaultItem?.item_name || '',
          quantity: '',
          unit: defaultItem?.unit || 'Units'
        }
      ]
    }));
  };

  const handleRemoveItemLine = (idx) => {
    if (form.items.length === 1) {
      toast.warning('A waybill manifest must have at least one commodity line item.');
      return;
    }
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleItemLineChange = (idx, field, val) => {
    const updated = [...form.items];
    if (field === 'item_id') {
      const match = inventoryItems.find(i => i.id === val);
      if (match) {
        updated[idx] = {
          ...updated[idx],
          item_id: match.id,
          item_name: match.item_name,
          unit: match.unit || 'Units'
        };
      }
    } else {
      updated[idx][field] = val;
    }
    setForm(prev => ({ ...prev, items: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.origin_warehouse) {
      toast.error('Please select the origin warehouse depot.');
      return;
    }
    if (!form.destination.trim()) {
      toast.error('Please specify the destination distribution point.');
      return;
    }
    if (form.items.some(i => !i.item_name || !i.quantity || Number(i.quantity) <= 0)) {
      toast.error('Please ensure all commodity lines have valid item names and quantities.');
      return;
    }

    setLoading(true);
    try {
      if (onDispatchSuccess) {
        await onDispatchSuccess({
          ...form,
          items: form.items.map(i => ({
            ...i,
            quantity: Number(i.quantity)
          }))
        });
      }
      toast.success('Waybill generated successfully!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to issue waybill.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-4 sm:my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#006B56] p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">Issue Humanitarian Waybill</h3>
              <p className="text-xs text-emerald-100">Stage aid commodities for transport and dispatch</p>
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Link to Approved PM Request if available */}
          {approvedRequests.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Link to PM-Authorized Assistance Request (Optional)</span>
              </div>
              <select
                value={form.linked_request_id}
                onChange={handleLinkRequest}
                className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-300 bg-white font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- No Direct Link (Manual Logistics Convoy) --</option>
                {approvedRequests.map(r => (
                  <option key={r.id || r.tracking_number} value={r.id || r.tracking_number}>
                    [{r.tracking_number || r.id}] {r.beneficiary_name || r.full_name} — {r.location || r.payam || 'Field'} ({r.category || 'Aid Delivery'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Route Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Origin Warehouse Depot *
              </label>
              <select
                value={form.origin_warehouse}
                onChange={(e) => setForm(prev => ({ ...prev, origin_warehouse: e.target.value }))}
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900"
              >
                <option value="">Select origin depot...</option>
                {warehouses.map(w => (
                  <option key={w.id || w.code} value={w.name}>
                    {w.name} ({w.location})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Destination Distribution Point *
              </label>
              <input
                type="text"
                value={form.destination}
                onChange={(e) => setForm(prev => ({ ...prev, destination: e.target.value }))}
                required
                placeholder="e.g. Kapoeta South Relief Hub"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900"
              >
              </input>
            </div>
          </div>

          {/* Project & Transport Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={form.project_name}
                onChange={(e) => setForm(prev => ({ ...prev, project_name: e.target.value }))}
                placeholder="Project name..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Transport Mode
              </label>
              <select
                value={form.transport_mode}
                onChange={(e) => setForm(prev => ({ ...prev, transport_mode: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900"
              >
                <option value="ADRA Logistics Fleet Truck">ADRA Logistics Fleet Truck</option>
                <option value="UN Humanitarian Road Convoy">UN Humanitarian Road Convoy</option>
                <option value="Riverine Barge Transport">Riverine Barge Transport</option>
                <option value="UNHAS Humanitarian Air Cargo">UNHAS Humanitarian Air Cargo</option>
                <option value="Local Commercial Logistics Partner">Local Commercial Logistics Partner</option>
              </select>
            </div>
          </div>

          {/* Vehicle & Driver */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vehicle Plate / Reg No
              </label>
              <input
                type="text"
                value={form.vehicle_reg}
                onChange={(e) => setForm(prev => ({ ...prev, vehicle_reg: e.target.value }))}
                placeholder="e.g. SSD-912A"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Driver / Lead Name
              </label>
              <input
                type="text"
                value={form.driver_name}
                onChange={(e) => setForm(prev => ({ ...prev, driver_name: e.target.value }))}
                placeholder="Driver full name"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Driver Contact / Sat Phone
              </label>
              <input
                type="text"
                value={form.driver_phone}
                onChange={(e) => setForm(prev => ({ ...prev, driver_phone: e.target.value }))}
                placeholder="+211..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-mono text-slate-900"
              />
            </div>
          </div>

          {/* Staged Line Items List */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Relief Commodities Manifest Lines ({form.items.length})
              </label>
              <button
                type="button"
                onClick={handleAddItemLine}
                className="text-xs font-bold text-[#006B56] hover:text-[#005443] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Line</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {form.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center gap-2.5"
                >
                  <div className="flex-1 w-full sm:w-auto">
                    {inventoryItems.length > 0 ? (
                      <select
                        value={item.item_id}
                        onChange={(e) => handleItemLineChange(idx, 'item_id', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-900 outline-none focus:border-[#006B56]"
                      >
                        <option value="">Select commodity from catalog...</option>
                        {inventoryItems.map(inv => (
                          <option key={inv.id} value={inv.id}>
                            {inv.item_name} ({inv.quantity} {inv.unit} in stock at {inv.warehouse})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={item.item_name}
                        onChange={(e) => handleItemLineChange(idx, 'item_name', e.target.value)}
                        placeholder="Enter commodity item name..."
                        required
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-900 outline-none focus:border-[#006B56]"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemLineChange(idx, 'quantity', e.target.value)}
                        placeholder="Qty"
                        required
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 text-right outline-none focus:border-[#006B56]"
                      />
                    </div>

                    <div className="w-20">
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleItemLineChange(idx, 'unit', e.target.value)}
                        placeholder="Unit"
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-600 text-center"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItemLine(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Convoy Security & Routing Notes (Optional)
            </label>
            <textarea
              rows="2"
              value={form.notes}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="UN security escort status, state checkpoint clearances, road accessibility notes..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none text-slate-800"
            />
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
              <span>{loading ? 'Issuing...' : 'Generate & Issue Waybill'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
