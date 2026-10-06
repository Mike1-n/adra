import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Truck,
  Plus,
  Trash2,
  CheckCircle2,
  Package
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

// Helper: Smart Commodity Matcher based on Request Category
function getRelevantCommodities(req, warehouseName, allInventory) {
  if (!allInventory || allInventory.length === 0) return [];

  // Filter for depot items
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

  // Find all items in pool that match the category
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

  // Global fallback for category match if this depot doesn't have it
  const globalMatching = allInventory.filter(i => {
    const itemCat = (i.category || '').toLowerCase();
    const itemName = (i.item_name || '').toLowerCase();
    if (reqCat.includes('food')) return itemCat.includes('food') || itemName.includes('maize') || itemName.includes('basket');
    if (reqCat.includes('water') || reqCat.includes('wash')) return itemCat.includes('wash') || itemName.includes('jerrycan');
    if (reqCat.includes('shelter')) return itemCat.includes('shelter') || itemName.includes('tarpaulin');
    return false;
  });

  if (globalMatching.length > 0) {
    return [{
      item_id: globalMatching[0].id,
      item_name: globalMatching[0].item_name,
      quantity: 1,
      unit: globalMatching[0].unit || 'Units'
    }];
  }

  return pool.slice(0, 1).map(i => ({
    item_id: i.id,
    item_name: i.item_name,
    quantity: 1,
    unit: i.unit || 'Units'
  }));
}

export function CreateDispatchModal({
  isOpen,
  onClose,
  warehouses = [],
  inventoryItems = [],
  approvedRequests = [],
  preselectedRequest = null,
  onDispatchSuccess
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    origin_warehouse: '',
    destination: '',
    project_name: 'Emergency Relief Response',
    linked_request_id: '',
    beneficiary_name: '',
    transport_mode: 'ADRA Logistics Fleet Truck',
    vehicle_reg: 'SSD-481-LOG',
    driver_name: 'Deng Bol',
    driver_phone: '+211-921-889911',
    notes: '',
    items: []
  });

  // Available inventory items for selected warehouse
  const depotInventory = useMemo(() => {
    if (!form.origin_warehouse) return inventoryItems;
    const filtered = inventoryItems.filter(i => i.warehouse === form.origin_warehouse);
    return filtered.length > 0 ? filtered : inventoryItems;
  }, [inventoryItems, form.origin_warehouse]);

  // Sync on open or preselectedRequest change
  useEffect(() => {
    if (!isOpen) return;

    const initialReq = preselectedRequest || (approvedRequests.length > 0 ? approvedRequests[0] : null);

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
  }, [isOpen, preselectedRequest, warehouses, inventoryItems, approvedRequests]);

  if (!isOpen) return null;

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
    e.preventDefault();
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
      toast.success('Waybill issued successfully!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to issue waybill.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-4 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-[#006B56] px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Truck className="w-5 h-5 text-emerald-200" />
            <h3 className="font-bold text-base">Issue Humanitarian Waybill</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clean Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* 1. Linked Request */}
          {approvedRequests.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Approved Beneficiary Request
              </label>
              <select
                value={form.linked_request_id}
                onChange={handleLinkRequestChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-900 outline-none focus:border-[#006B56]"
              >
                <option value="">-- Select or link an approved request --</option>
                {approvedRequests.map(r => {
                  const reqKey = r.id || r.request_code || r.tracking_number;
                  const reqCode = r.request_code || r.tracking_number || r.id;
                  const benName = r.beneficiary_name || r.full_name || 'Beneficiary';
                  const loc = r.location || [r.county, r.payam].filter(Boolean).join(', ') || r.state || 'Field';
                  const cat = r.category || r.assistance_type || 'Aid Delivery';
                  return (
                    <option key={reqKey} value={reqKey}>
                      [{reqCode}] {benName} — {cat} ({loc})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* 2. Warehouse & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Origin Depot *
              </label>
              <select
                value={form.origin_warehouse}
                onChange={handleWarehouseChange}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-900 outline-none focus:border-[#006B56]"
              >
                <option value="">Select depot...</option>
                {warehouses.map(w => (
                  <option key={w.id || w.code} value={w.name}>
                    {w.name}
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
                placeholder="e.g. Juba Central Relief Hub"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-900 outline-none focus:border-[#006B56]"
              />
            </div>
          </div>

          {/* 3. Commodities to Dispatch */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Commodities to Dispatch
              </label>
              <button
                type="button"
                onClick={handleAddItemLine}
                className="text-xs font-bold text-[#006B56] hover:text-[#005443] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {form.items.map((item, idx) => {
                const matched = inventoryItems.find(i => i.id === item.item_id || i.item_name === item.item_name);
                const stock = matched ? matched.quantity : null;

                return (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <div className="flex-1 min-w-0">
                      <select
                        value={item.item_id || depotInventory.find(i => i.item_name === item.item_name)?.id || ''}
                        onChange={(e) => handleItemLineChange(idx, 'item_id', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-900 outline-none focus:border-[#006B56]"
                      >
                        <option value="">Select item...</option>
                        {depotInventory.map(inv => (
                          <option key={inv.id} value={inv.id}>
                            {inv.item_name} ({Number(inv.quantity).toLocaleString()} {inv.unit})
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
                        required
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono font-bold text-slate-900 text-right outline-none focus:border-[#006B56]"
                      />
                    </div>

                    <span className="text-xs font-medium text-slate-600 w-16 truncate shrink-0">
                      {item.unit || 'Units'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveItemLine(idx)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 transition cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Compact Transport (Single Row) */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Vehicle Plate
              </label>
              <input
                type="text"
                value={form.vehicle_reg}
                onChange={(e) => setForm(prev => ({ ...prev, vehicle_reg: e.target.value }))}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Driver Name
              </label>
              <input
                type="text"
                value={form.driver_name}
                onChange={(e) => setForm(prev => ({ ...prev, driver_name: e.target.value }))}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
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
              <span>{loading ? 'Issuing...' : 'Issue Waybill'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
