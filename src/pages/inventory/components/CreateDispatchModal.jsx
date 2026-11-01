import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Truck,
  Plus,
  Trash2,
  CheckCircle2,
  Package,
  Building2,
  MapPin,
  Users,
  AlertCircle,
  FileText,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

// Helper: Smart Commodity Matcher based on Request Category & Household Size (Sphere Standards)
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
      unit: i.unit || 'Units',
      warehouse: i.warehouse
    }));
  }

  const reqCat = (req.category || req.assistance_type || '').toLowerCase();
  const householdMembers = Math.max(1, Number(req.household_members || req.people_in_household || req.household_size || 1));

  // Determine requested humanitarian sectors
  const hasFood = reqCat.includes('food') || reqCat.includes('nutrition') || reqCat.includes('cereal') || reqCat.includes('flour') || reqCat.includes('maize') || reqCat.includes('ration');
  const hasWater = reqCat.includes('water') || reqCat.includes('wash') || reqCat.includes('hygiene') || reqCat.includes('sanitation') || reqCat.includes('jerrycan');
  const hasShelter = reqCat.includes('shelter') || reqCat.includes('nfi') || reqCat.includes('tarpaulin') || reqCat.includes('blanket') || reqCat.includes('tent');
  const hasAgri = reqCat.includes('agri') || reqCat.includes('seed') || reqCat.includes('livelihood') || reqCat.includes('crop') || reqCat.includes('tool');
  const hasEdu = reqCat.includes('edu') || reqCat.includes('student') || reqCat.includes('school') || reqCat.includes('youth') || reqCat.includes('literacy');

  // Sphere Standard Household Scaling Formula:
  // Food: 1-4 members = 1 bag/basket (25kg); 5-8 members = 2 bags/baskets (50kg); 9+ members = 3 bags/baskets (75kg)
  const foodScale = householdMembers <= 4 ? 1 : (householdMembers <= 8 ? 2 : 3);
  // Water: 1-4 members = 1 jerrycan (20L); 5-8 members = 2 jerrycans (40L); 9+ members = 3 jerrycans
  const waterScale = householdMembers <= 4 ? 1 : (householdMembers <= 8 ? 2 : 3);
  // Shelter: 1-5 members = 1 tarpaulin (4x5m); 6+ members = 2 tarpaulins
  const shelterScale = householdMembers <= 5 ? 1 : 2;
  // Livelihood / Agri
  const agriScale = householdMembers <= 5 ? 1 : 2;
  // Education
  const eduScale = householdMembers <= 4 ? 1 : 2;

  const allocatedItems = [];
  const allocatedIds = new Set();

  const findBestItem = (sectorMatcher, preferredKeywords = []) => {
    let candidates = pool.filter(i => sectorMatcher(i) && !allocatedIds.has(i.id));
    if (candidates.length === 0) {
      candidates = allInventory.filter(i => sectorMatcher(i) && !allocatedIds.has(i.id));
    }
    if (candidates.length === 0) return null;

    for (const kw of preferredKeywords) {
      const match = candidates.find(c => (c.item_name || '').toLowerCase().includes(kw));
      if (match) return match;
    }
    return candidates[0];
  };

  // 1. Process Food Sector
  if (hasFood || (!hasWater && !hasShelter && !hasAgri && !hasEdu)) {
    const foodItem = findBestItem(
      i => {
        const cat = (i.category || '').toLowerCase();
        const name = (i.item_name || '').toLowerCase();
        return cat.includes('food') || name.includes('maize') || name.includes('flour') || name.includes('basket') || name.includes('oil') || name.includes('cereal') || name.includes('pulse') || name.includes('rice') || name.includes('bp-5');
      },
      ['basket', 'maize', 'flour', 'rice', 'oil']
    );

    if (foodItem) {
      allocatedIds.add(foodItem.id);
      allocatedItems.push({
        item_id: foodItem.id,
        item_name: foodItem.item_name,
        quantity: foodScale,
        unit: foodItem.unit || 'Bags',
        warehouse: foodItem.warehouse
      });

      // If large household (5+ members) and depot has a complementary food staple, include 1 unit
      if (householdMembers >= 5) {
        const compFood = findBestItem(
          i => {
            const cat = (i.category || '').toLowerCase();
            const name = (i.item_name || '').toLowerCase();
            return (cat.includes('food') || name.includes('flour') || name.includes('oil') || name.includes('pulse')) && i.id !== foodItem.id;
          },
          ['oil', 'wheat', 'pulse', 'peas', 'rice']
        );
        if (compFood && pool.some(p => p.id === compFood.id)) {
          allocatedIds.add(compFood.id);
          allocatedItems.push({
            item_id: compFood.id,
            item_name: compFood.item_name,
            quantity: 1,
            unit: compFood.unit || 'Units',
            warehouse: compFood.warehouse
          });
        }
      }
    }
  }

  // 2. Process Water / WASH Sector
  if (hasWater) {
    const waterItem = findBestItem(
      i => {
        const cat = (i.category || '').toLowerCase();
        const name = (i.item_name || '').toLowerCase();
        return cat.includes('wash') || cat.includes('water') || name.includes('water') || name.includes('jerrycan') || name.includes('jerrican') || name.includes('aquatab') || name.includes('hygiene') || name.includes('soap');
      },
      ['jerrycan', 'jerrican', 'aquatab', 'hygiene', 'water']
    );

    if (waterItem) {
      allocatedIds.add(waterItem.id);
      allocatedItems.push({
        item_id: waterItem.id,
        item_name: waterItem.item_name,
        quantity: waterScale,
        unit: waterItem.unit || 'Units',
        warehouse: waterItem.warehouse
      });
    }
  }

  // 3. Process Shelter / NFI Sector
  if (hasShelter) {
    const shelterItem = findBestItem(
      i => {
        const cat = (i.category || '').toLowerCase();
        const name = (i.item_name || '').toLowerCase();
        return cat.includes('shelter') || cat.includes('nfi') || name.includes('tarpaulin') || name.includes('blanket') || name.includes('tent');
      },
      ['tarpaulin', 'blanket', 'tent']
    );

    if (shelterItem) {
      allocatedIds.add(shelterItem.id);
      allocatedItems.push({
        item_id: shelterItem.id,
        item_name: shelterItem.item_name,
        quantity: shelterScale,
        unit: shelterItem.unit || 'Units',
        warehouse: shelterItem.warehouse
      });
    }
  }

  // 4. Process Agriculture Sector
  if (hasAgri) {
    const agriItem = findBestItem(
      i => {
        const cat = (i.category || '').toLowerCase();
        const name = (i.item_name || '').toLowerCase();
        return cat.includes('agri') || cat.includes('seed') || name.includes('seed') || name.includes('tool');
      },
      ['seed', 'tool']
    );
    if (agriItem) {
      allocatedIds.add(agriItem.id);
      allocatedItems.push({
        item_id: agriItem.id,
        item_name: agriItem.item_name,
        quantity: agriScale,
        unit: agriItem.unit || 'Bags',
        warehouse: agriItem.warehouse
      });
    }
  }

  // 5. Process Education Sector
  if (hasEdu) {
    const eduItem = findBestItem(
      i => {
        const cat = (i.category || '').toLowerCase();
        const name = (i.item_name || '').toLowerCase();
        return cat.includes('edu') || name.includes('kit') || name.includes('student') || name.includes('book');
      },
      ['kit', 'student', 'book']
    );
    if (eduItem) {
      allocatedIds.add(eduItem.id);
      allocatedItems.push({
        item_id: eduItem.id,
        item_name: eduItem.item_name,
        quantity: eduScale,
        unit: eduItem.unit || 'Kits',
        warehouse: eduItem.warehouse
      });
    }
  }

  if (allocatedItems.length === 0) {
    return pool.slice(0, 1).map(i => ({
      item_id: i.id,
      item_name: i.item_name,
      quantity: 1,
      unit: i.unit || 'Units',
      warehouse: i.warehouse
    }));
  }

  return allocatedItems;
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

  // Active selected assistance request object
  const activeRequest = useMemo(() => {
    if (!form.linked_request_id) return null;
    return approvedRequests.find(r => 
      r.id === form.linked_request_id || 
      r.request_code === form.linked_request_id || 
      r.tracking_number === form.linked_request_id ||
      String(r.id) === String(form.linked_request_id)
    ) || null;
  }, [approvedRequests, form.linked_request_id]);

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
      beneficiary_name: initialReq ? (initialReq.beneficiary_name || initialReq.full_name || 'Beneficiary') : '',
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
        beneficiary_name: req.beneficiary_name || req.full_name || 'Beneficiary',
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

          {/* Beneficiary Household & Allocation Dossier Card */}
          {activeRequest && (
            <div className="rounded-xl border border-emerald-200/90 bg-linear-to-br from-emerald-50/70 via-teal-50/30 to-white p-3.5 space-y-2.5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100/90 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#006B56] text-white flex items-center justify-center font-bold text-xs">
                    {(activeRequest.beneficiary_name || activeRequest.full_name || 'B').charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-xs">
                        {activeRequest.beneficiary_name || activeRequest.full_name || 'Beneficiary'}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                        {activeRequest.request_code || activeRequest.tracking_number || activeRequest.id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    PM Approved
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {activeRequest.urgency || activeRequest.priority || 'High'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-white/90 rounded-lg p-2 border border-emerald-100/90">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
                    Household Size
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-bold text-slate-900 text-xs">
                      {activeRequest.household_members || activeRequest.people_in_household || 1} People
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      ({(activeRequest.household_members || activeRequest.people_in_household || 1) >= 5 ? 'Scale: 2x' : '1x'})
                    </span>
                  </div>
                </div>

                <div className="bg-white/90 rounded-lg p-2 border border-emerald-100/90">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
                    Vetted Sectors
                  </span>
                  <span className="font-bold text-slate-900 truncate block mt-0.5" title={activeRequest.category || activeRequest.assistance_type}>
                    {activeRequest.category || activeRequest.assistance_type || 'Relief'}
                  </span>
                </div>

                <div className="bg-white/90 rounded-lg p-2 border border-emerald-100/90 col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
                    Audit Officer
                  </span>
                  <span className="font-bold text-slate-900 truncate block mt-0.5">
                    {activeRequest.assigned_field_worker_name || activeRequest.field_worker_name || 'Field Officer'}
                  </span>
                </div>
              </div>

              {/* Verified Notes */}
              {(activeRequest.recommended_aid || activeRequest.field_worker_assessment?.recommended_aid || activeRequest.ground_situation_report || activeRequest.field_worker_assessment?.ground_situation_report) && (
                <div className="bg-white/95 rounded-lg p-2 border border-emerald-200/80 text-[11px] text-slate-700">
                  <strong className="text-emerald-900 font-semibold">Field Verified Need: </strong>
                  {activeRequest.recommended_aid || activeRequest.field_worker_assessment?.recommended_aid || activeRequest.ground_situation_report || activeRequest.field_worker_assessment?.ground_situation_report}
                </div>
              )}

              {/* Sphere Standard Banner */}
              <div className="flex items-start gap-1.5 bg-emerald-100/60 rounded-lg p-2 text-[10px] text-emerald-950">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  Sphere Standards applied for <strong>{activeRequest.household_members || activeRequest.people_in_household || 1} household members</strong> across requested sectors (~12.5kg flour/person, 20L water jerrican, shelter tarpaulin).
                </span>
              </div>
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
                        <optgroup label={`── ${form.origin_warehouse || 'Depot'} Stock ──`}>
                          {depotInventory.map(inv => (
                            <option key={inv.id} value={inv.id}>
                              {inv.item_name} ({Number(inv.quantity).toLocaleString()} {inv.unit})
                            </option>
                          ))}
                        </optgroup>
                        {inventoryItems.filter(i => !depotInventory.some(d => d.id === i.id)).length > 0 && (
                          <optgroup label="── Inter-Depot Stock Transfer ──">
                            {inventoryItems
                              .filter(i => !depotInventory.some(d => d.id === i.id))
                              .map(inv => (
                                <option key={inv.id} value={inv.id}>
                                  {inv.item_name} ({inv.warehouse || 'Other Depot'} — {inv.quantity} {inv.unit})
                                </option>
                              ))}
                          </optgroup>
                        )}
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
