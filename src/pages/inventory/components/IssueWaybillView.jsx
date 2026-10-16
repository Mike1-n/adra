import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  Plus,
  Trash2,
  ArrowLeft,
  Building2,
  MapPin,
  Package
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

// Helper: Smart Commodity Matcher based on Request Category
function getRelevantCommodities(req, warehouseName, allInventory) {
  if (!allInventory || allInventory.length === 0) return [];

  const depotItems = warehouseName 
    ? allInventory.filter(i => i.warehouse === warehouseName)
    : allInventory;
  const pool = depotItems.length > 0 ? depotItems : allInventory;

  if (!req) {
    return pool.slice(0, 1).map(i => ({
      item_id: i.id,
      item_name: i.item_name,
      quantity: 1,
      unit: i.unit || 'Units'
    }));
  }

  const reqCat = (req.category || req.assistance_type || '').toLowerCase();

  const matchingItems = pool.filter(i => {
    const itemCat = (i.category || '').toLowerCase();
    const itemName = (i.item_name || '').toLowerCase();

    if (reqCat.includes('food')) {
      return itemCat.includes('food') || itemName.includes('maize') || itemName.includes('flour') || itemName.includes('basket') || itemName.includes('oil') || itemName.includes('cereal') || itemName.includes('pulse') || itemName.includes('rice') || itemName.includes('bp-5');
    }
    if (reqCat.includes('wash') || reqCat.includes('water') || reqCat.includes('hygiene')) {
      return itemCat.includes('wash') || itemCat.includes('water') || itemName.includes('water') || itemName.includes('jerrycan') || itemName.includes('jerrican') || itemName.includes('aquatab') || itemName.includes('hygiene') || itemName.includes('soap');
    }
    if (reqCat.includes('shelter') || reqCat.includes('nfi')) {
      return itemCat.includes('shelter') || itemCat.includes('nfi') || itemName.includes('tarpaulin') || itemName.includes('blanket') || itemName.includes('tent');
    }
    if (reqCat.includes('agri') || reqCat.includes('seed') || reqCat.includes('livelihood')) {
      return itemCat.includes('agri') || itemCat.includes('seed') || itemName.includes('seed') || itemName.includes('tool');
    }
    if (reqCat.includes('edu') || reqCat.includes('youth') || reqCat.includes('literacy')) {
      return itemCat.includes('edu') || itemName.includes('kit') || itemName.includes('student') || itemName.includes('book');
    }
    return itemCat.includes(reqCat);
  });

  if (matchingItems.length > 0) {
    const foodBasket = matchingItems.find(i => (i.item_name || '').toLowerCase().includes('basket'));
    if (foodBasket) {
      return [{
        item_id: foodBasket.id,
        item_name: foodBasket.item_name,
        quantity: 1,
        unit: foodBasket.unit || 'Baskets'
      }];
    }
    return matchingItems.slice(0, 2).map(i => ({
      item_id: i.id,
      item_name: i.item_name,
      quantity: 1,
      unit: i.unit || 'Units'
    }));
  }

  return pool.slice(0, 1).map(i => ({
    item_id: i.id,
    item_name: i.item_name,
    quantity: 1,
    unit: i.unit || 'Units'
  }));
}

export function IssueWaybillView({
  warehouses = [],
  inventoryItems = [],
  approvedRequests = [],
  selectedRequest = null,
  onDispatchSuccess,
  onCancel
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    origin_warehouse: '',
    destination: '',
    project_name: 'Emergency Food Security & Livelihoods Resilience',
    linked_request_id: '',
    beneficiary_name: '',
    assigned_supervisor_id: '',
    assigned_supervisor_name: '',
    assigned_field_worker_id: '',
    assigned_field_worker_name: '',
    transport_mode: 'ADRA Logistics Fleet Truck',
    vehicle_reg: 'SSD-481-LOG',
    driver_name: 'Deng Bol',
    driver_phone: '+211-921-889911',
    notes: '',
    items: []
  });

  // Filter inventory by selected warehouse
  const depotInventory = useMemo(() => {
    if (!form.origin_warehouse) return inventoryItems;
    const filtered = inventoryItems.filter(i => i.warehouse === form.origin_warehouse);
    return filtered.length > 0 ? filtered : inventoryItems;
  }, [inventoryItems, form.origin_warehouse]);


  useEffect(() => {
    const initialReq = selectedRequest || (approvedRequests.length > 0 ? approvedRequests[0] : null);

    const defaultWarehouse = warehouses.find(w => {
      if (!initialReq) return false;
      const state = (initialReq.state || '').toLowerCase();
      const loc = (initialReq.location || '').toLowerCase();
      return (w.state && state && w.state.toLowerCase() === state) ||
             (w.name && state && w.name.toLowerCase().includes(state)) ||
             (w.location && loc && loc.includes(w.location.toLowerCase()));
    })?.name || warehouses[0]?.name || '';

    const autoItems = getRelevantCommodities(initialReq, defaultWarehouse, inventoryItems);

    setForm({
      origin_warehouse: defaultWarehouse,
      destination: initialReq 
        ? `${initialReq.location || [initialReq.county, initialReq.payam].filter(Boolean).join(', ') || initialReq.state || 'Field Hub'} Relief Centre`
        : '',
      project_name: initialReq?.project_name || initialReq?.programme_name || initialReq?.programme || 'Emergency Food Security & Livelihoods Resilience',
      linked_request_id: initialReq ? (initialReq.id || initialReq.request_code || initialReq.tracking_number) : '',
      beneficiary_name: initialReq ? `${initialReq.beneficiary_name || initialReq.full_name || 'Beneficiary'} (${initialReq.location || initialReq.payam || initialReq.state || 'Field'})` : '',
      assigned_supervisor_id: initialReq?.assigned_supervisor_id || '',
      assigned_supervisor_name: initialReq?.assigned_supervisor_name || '',
      assigned_field_worker_id: initialReq?.assigned_field_worker_id || '',
      assigned_field_worker_name: initialReq?.assigned_field_worker_name || '',
      transport_mode: 'ADRA Logistics Fleet Truck',
      vehicle_reg: 'SSD-481-LOG',
      driver_name: 'Deng Bol',
      driver_phone: '+211-921-889911',
      notes: initialReq ? `Waybill for request ${initialReq.request_code || initialReq.id}.` : '',
      items: autoItems
    });
  }, [warehouses, inventoryItems, approvedRequests, selectedRequest]);

  const handleLinkRequestChange = (e) => {
    const reqId = e.target.value;
    if (!reqId) {
      setForm(prev => ({
        ...prev,
        linked_request_id: '',
        beneficiary_name: '',
        assigned_supervisor_id: '',
        assigned_supervisor_name: '',
        assigned_field_worker_id: '',
        assigned_field_worker_name: '',
        destination: ''
      }));
      return;
    }

    const req = approvedRequests.find(r => 
      r.id === reqId || 
      r.request_code === reqId || 
      r.tracking_number === reqId ||
      String(r.id) === String(reqId)
    );

    if (req) {
      const matchingWh = warehouses.find(w => {
        const state = (req.state || '').toLowerCase();
        const loc = (req.location || '').toLowerCase();
        return (w.state && state && w.state.toLowerCase() === state) ||
               (w.name && state && w.name.toLowerCase().includes(state)) ||
               (w.location && loc && loc.includes(w.location.toLowerCase()));
      })?.name || form.origin_warehouse || warehouses[0]?.name || '';

      const autoItems = getRelevantCommodities(req, matchingWh, inventoryItems);

      setForm(prev => ({
        ...prev,
        linked_request_id: req.id || req.request_code || req.tracking_number,
        beneficiary_name: `${req.beneficiary_name || req.full_name || 'Beneficiary'} (${req.location || req.payam || req.state || 'Field'})`,
        destination: `${req.location || [req.county, req.payam].filter(Boolean).join(', ') || req.state || 'Field Hub'} Relief Centre`,
        project_name: req.project_name || req.programme_name || req.programme || prev.project_name,
        assigned_supervisor_id: req.assigned_supervisor_id || prev.assigned_supervisor_id,
        assigned_supervisor_name: req.assigned_supervisor_name || prev.assigned_supervisor_name,
        assigned_field_worker_id: req.assigned_field_worker_id || prev.assigned_field_worker_id,
        assigned_field_worker_name: req.assigned_field_worker_name || prev.assigned_field_worker_name,
        origin_warehouse: matchingWh,
        notes: `Waybill for request ${req.request_code || req.tracking_number || req.id}.`,
        items: autoItems
      }));
    }
  };

  const handleWarehouseChange = (e) => {
    const newWh = e.target.value;
    const req = approvedRequests.find(r => 
      r.id === form.linked_request_id || 
      r.request_code === form.linked_request_id || 
      r.tracking_number === form.linked_request_id
    );

    const reAllocatedItems = getRelevantCommodities(req, newWh, inventoryItems);

    setForm(prev => ({
      ...prev,
      origin_warehouse: newWh,
      items: reAllocatedItems.length > 0 ? reAllocatedItems : prev.items
    }));
  };

  const handleAddItemLine = () => {
    const defaultItem = depotInventory[0] || inventoryItems[0];
    setForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          item_id: defaultItem?.id || '',
          item_name: defaultItem?.item_name || '',
          quantity: 1,
          unit: defaultItem?.unit || 'Units'
        }
      ]
    }));
  };

  const handleRemoveItemLine = (idx) => {
    if (form.items.length === 1) {
      toast.warning('A waybill must have at least one commodity line item.');
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
    if (e) e.preventDefault();
    if (!form.origin_warehouse) {
      toast.error('Please select an origin warehouse depot.');
      return;
    }
    if (!form.destination.trim()) {
      toast.error('Please specify a destination point.');
      return;
    }
    if (form.items.length === 0 || form.items.some(i => !i.item_name || !i.quantity || Number(i.quantity) <= 0)) {
      toast.error('Please specify valid commodity items and quantities.');
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
      toast.success('Waybill issued and dispatched successfully!');
      if (onCancel) onCancel();
    } catch (err) {
      toast.error(err.message || 'Failed to issue waybill.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-12">
      
      {/* Top Header: Simple and Clean */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#006B56]" />
            <span>Issue Aid Waybill</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transfer relief items from warehouse depot to field distribution centre.
          </p>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        )}
      </div>

      {/* Single Clean Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-5">
        
        {/* 1. Request Link */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Approved Beneficiary Request
          </label>
          <select
            value={form.linked_request_id}
            onChange={handleLinkRequestChange}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-900 focus:border-[#006B56] focus:ring-1 focus:ring-[#006B56] outline-none cursor-pointer"
          >
            <option value="">-- General Stock Transfer / Unlinked --</option>
            {approvedRequests.map(r => {
              const reqCode = r.request_code || r.tracking_number || r.id;
              const ben = r.beneficiary_name || r.full_name || 'Beneficiary';
              const cat = r.category || r.assistance_type || 'Relief';
              return (
                <option key={r.id || r.request_code} value={r.id || r.request_code}>
                  [{reqCode}] {ben} — {cat}
                </option>
              );
            })}
          </select>
        </div>

        {/* 2. Route: Origin & Destination */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Origin Depot *</span>
            </label>
            <select
              value={form.origin_warehouse}
              onChange={handleWarehouseChange}
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-900 focus:border-[#006B56] outline-none cursor-pointer"
            >
              <option value="">Select origin depot...</option>
              {warehouses.map(w => (
                <option key={w.id || w.name} value={w.name}>
                  {w.name} {w.state ? `(${w.state})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Destination Point *</span>
            </label>
            <input
              type="text"
              value={form.destination}
              onChange={(e) => setForm(prev => ({ ...prev, destination: e.target.value }))}
              placeholder="e.g. Juba Na Bari Relief Centre"
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-900 focus:border-[#006B56] outline-none"
            />
          </div>
        </div>

        {/* 3. Commodities to Dispatch */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              <span>Commodities to Dispatch *</span>
            </label>
            <button
              type="button"
              onClick={handleAddItemLine}
              className="text-xs font-semibold text-[#006B56] hover:text-[#005443] flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-2">
            {form.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <select
                    value={item.item_id || item.item_name}
                    onChange={(e) => handleItemLineChange(idx, 'item_id', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-900 focus:border-[#006B56] outline-none truncate"
                  >
                    <option value="">Select commodity...</option>
                    {depotInventory.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.item_name} (In stock: {inv.quantity} {inv.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-20 shrink-0">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemLineChange(idx, 'quantity', e.target.value)}
                    placeholder="Qty"
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white font-bold text-slate-900 text-center focus:border-[#006B56] outline-none"
                  />
                </div>

                <div className="w-16 shrink-0">
                  <span className="block px-2 py-2 text-xs text-slate-600 bg-slate-50 rounded-lg text-center font-medium border border-slate-200/60 truncate">
                    {item.unit || 'Units'}
                  </span>
                </div>

                {form.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItemLine(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 4. Transport & Driver */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-slate-400" />
            <span>Transport & Driver</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <input
                type="text"
                value={form.vehicle_reg}
                onChange={(e) => setForm(prev => ({ ...prev, vehicle_reg: e.target.value }))}
                placeholder="Vehicle Plate (SSD-481-LOG)"
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-900 focus:border-[#006B56] outline-none"
              />
            </div>

            <div>
              <input
                type="text"
                value={form.driver_name}
                onChange={(e) => setForm(prev => ({ ...prev, driver_name: e.target.value }))}
                placeholder="Driver Name"
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-900 focus:border-[#006B56] outline-none"
              />
            </div>

            <div>
              <input
                type="text"
                value={form.driver_phone}
                onChange={(e) => setForm(prev => ({ ...prev, driver_phone: e.target.value }))}
                placeholder="Driver Phone"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-900 focus:border-[#006B56] outline-none"
              />
            </div>
          </div>
        </div>

        {/* 5. Notes (Optional) */}
        <div>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Logistics notes or instructions (Optional)"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 placeholder-slate-400 focus:border-[#006B56] outline-none"
          />
        </div>

        {/* 6. Submit Bar */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-xs transition cursor-pointer"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-[#006B56] hover:bg-[#005443] text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>{loading ? 'Issuing...' : 'Issue Waybill & Dispatch'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}

