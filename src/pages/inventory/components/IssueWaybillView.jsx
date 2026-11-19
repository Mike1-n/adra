import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  Plus,
  Trash2,
  ArrowLeft,
  Building2,
  MapPin,
  Package,
  Users
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { db } from '../../../lib/supabase';

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

  // Determine requested humanitarian physical sectors (exclude non-freight transfers like direct cash/vouchers)
  const hasFood = reqCat.includes('food') || reqCat.includes('nutrition') || reqCat.includes('cereal') || reqCat.includes('flour') || reqCat.includes('maize') || reqCat.includes('ration');
  const hasWater = reqCat.includes('water') || reqCat.includes('wash') || reqCat.includes('hygiene') || reqCat.includes('sanitation') || reqCat.includes('jerrycan');
  const hasShelter = reqCat.includes('shelter') || reqCat.includes('nfi') || reqCat.includes('tarpaulin') || reqCat.includes('blanket') || reqCat.includes('tent');
  // Agriculture only when explicit farming/seed inputs are requested (Cash/livelihood support is handled via financial transfers, not farm freight)
  const hasAgri = (reqCat.includes('agri') || reqCat.includes('farming') || reqCat.includes('crop') || (reqCat.includes('seed') && !reqCat.includes('cash')));
  // Education should match schooling/literacy, NOT medical/maternity kits
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

  // 4. Process Agriculture Sector (only if physical farming/seed inputs requested)
  if (hasAgri) {
    const agriItem = findBestItem(
      i => {
        const cat = (i.category || '').toLowerCase();
        const name = (i.item_name || '').toLowerCase();
        // Exclude large infrastructure / non-household items (e.g. 500m irrigation lines)
        if (name.includes('500m') || name.includes('irrigation') || name.includes('pump bundle')) return false;
        return cat.includes('agri') || cat.includes('seed') || name.includes('seed') || name.includes('hoe') || name.includes('tool');
      },
      ['seed', 'sorghum', 'maize', 'tool']
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
        // Exclude medical, clinical, midwifery, or hygiene kits
        if (name.includes('midwifery') || name.includes('medical') || name.includes('delivery') || name.includes('surgical') || name.includes('hygiene')) return false;
        return cat.includes('edu') || name.includes('student') || name.includes('school') || name.includes('literacy') || name.includes('book') || name.includes('stationery');
      },
      ['student', 'school', 'literacy', 'book', 'stationery']
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

export function IssueWaybillView({
  warehouses = [],
  inventoryItems = [],
  fleetVehicles = [],
  approvedRequests = [],
  selectedRequest = null,
  onDispatchSuccess,
  onCancel
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [fleetList, setFleetList] = useState(fleetVehicles);

  useEffect(() => {
    if (fleetVehicles && fleetVehicles.length > 0) {
      setFleetList(fleetVehicles);
    } else if (db.getFleetVehicles) {
      db.getFleetVehicles().then(data => {
        if (data && data.length > 0) setFleetList(data);
      }).catch(err => console.warn('Error loading fleet vehicles:', err));
    }
  }, [fleetVehicles]);

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
    vehicle_reg: '',
    driver_id: '',
    driver_name: '',
    driver_phone: '',
    notes: '',
    items: []
  });
  const [driverUsers, setDriverUsers] = useState([]);

  useEffect(() => {
    db.getUsers?.().then(uList => {
      setDriverUsers((uList || []).filter(u => u.role === 'Driver'));
    }).catch(() => {});
  }, []);

  // Filter inventory by selected warehouse
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

  // Synchronized selected fleet vehicle & driver
  const selectedFleetId = useMemo(() => {
    if (!form.vehicle_reg) return '';
    const reg = form.vehicle_reg.trim().toLowerCase();
    const match = fleetList.find(
      f => (f.vehicle_plate || f.plate || '').toLowerCase() === reg
    );
    return match ? (match.id || match.vehicle_plate || match.plate) : 'custom';
  }, [form.vehicle_reg, fleetList]);

  const handleFleetChange = (e) => {
    const val = e.target.value;
    if (!val || val === 'custom') {
      setForm(prev => ({
        ...prev,
        vehicle_reg: '',
        driver_name: '',
        driver_phone: ''
      }));
      return;
    }
    const match = fleetList.find(f => f.id === val || (f.vehicle_plate || f.plate) === val);
    if (match) {
      setForm(prev => ({
        ...prev,
        vehicle_reg: match.vehicle_plate || match.plate || '',
        driver_name: match.driver_name || match.driver || '',
        driver_phone: match.driver_phone || match.phone || ''
      }));
    }
  };

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
      beneficiary_name: initialReq ? (initialReq.beneficiary_name || initialReq.full_name || 'Beneficiary') : '',
      assigned_supervisor_id: initialReq?.assigned_supervisor_id || '',
      assigned_supervisor_name: initialReq?.assigned_supervisor_name || '',
      assigned_field_worker_id: initialReq?.assigned_field_worker_id || '',
      assigned_field_worker_name: initialReq?.assigned_field_worker_name || '',
      transport_mode: 'ADRA Logistics Fleet Truck',
      vehicle_reg: '',
      driver_name: '',
      driver_phone: '',
      notes: '',
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

  const isItemAlreadySelected = (inv, excludeIdx = -1) => {
    if (!inv) return false;
    const invName = (inv.item_name || '').toLowerCase().trim();
    return form.items.some((it, i) => {
      if (i === excludeIdx) return false;
      return (inv.id && it.item_id === inv.id) || (invName && (it.item_name || '').toLowerCase().trim() === invName);
    });
  };

  const handleAddItemLine = () => {
    const pool = [...depotInventory, ...inventoryItems.filter(i => !depotInventory.some(d => d.id === i.id))];
    const nextItem = pool.find(inv => !isItemAlreadySelected(inv));
    if (!nextItem) {
      toast.warning('All available commodities have already been added to this waybill.');
      return;
    }
    setForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          item_id: nextItem.id || '',
          item_name: nextItem.item_name || '',
          quantity: 1,
          unit: nextItem.unit || 'Units'
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
        if (isItemAlreadySelected(match, idx)) {
          toast.warning(`"${match.item_name}" is already selected on another line. Update its quantity there.`);
          return;
        }
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

    // Validate requested quantities against available stock
    const requestedTotals = new Map();
    for (const item of form.items) {
      const qty = Number(item.quantity) || 0;
      const matched =
        inventoryItems.find(i => item.item_id && i.id === item.item_id) ||
        inventoryItems.find(i =>
          i.item_name && item.item_name &&
          i.item_name.toLowerCase() === item.item_name.toLowerCase() &&
          (!form.origin_warehouse || i.warehouse === form.origin_warehouse)
        ) ||
        inventoryItems.find(i =>
          i.item_name && item.item_name &&
          i.item_name.toLowerCase() === item.item_name.toLowerCase()
        );
      const key = matched ? matched.id : `name:${(item.item_name || '').toLowerCase()}`;
      const prev = requestedTotals.get(key) || { matched, item, totalQty: 0 };
      prev.totalQty += qty;
      requestedTotals.set(key, prev);
    }

    for (const { matched, item, totalQty } of requestedTotals.values()) {
      const availableQty = Number(matched?.quantity) || 0;
      const label = matched?.item_name || item.item_name;
      const unit = matched?.unit || item.unit || 'units';
      if (!matched || availableQty <= 0) {
        toast.error(`Out of stock: "${label}" has 0 ${unit} available in stock.`);
        return;
      }
      if (totalQty > availableQty) {
        toast.error(`Out of stock: Requested ${totalQty} ${unit} of "${label}", but only ${availableQty} ${unit} available in stock.`);
        return;
      }
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

        {/* Beneficiary Household Summary */}
        {activeRequest && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">
                {activeRequest.beneficiary_name || activeRequest.full_name || 'Beneficiary'}
              </span>
              {activeRequest.beneficiary_code && (
                <span className="text-[11px] font-mono text-slate-500">
                  (Reg ID: {activeRequest.beneficiary_code})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-900 bg-white px-2.5 py-1 rounded-md border border-emerald-200 text-xs">
                <Users className="w-3.5 h-3.5 text-emerald-700" />
                <span>Household Size: <strong>{activeRequest.household_members || activeRequest.people_in_household || 1} People</strong></span>
                <span className="text-emerald-600 font-bold">
                  ({(activeRequest.household_members || activeRequest.people_in_household || 1) >= 5 ? 'Scale: 2x Rations' : 'Scale: 1x Ration'})
                </span>
              </span>
            </div>
          </div>
        )}

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
            {form.items.map((item, idx) => {
              const matched =
                inventoryItems.find(i => item.item_id && i.id === item.item_id) ||
                inventoryItems.find(i =>
                  i.item_name && item.item_name &&
                  i.item_name.toLowerCase() === item.item_name.toLowerCase() &&
                  (!form.origin_warehouse || i.warehouse === form.origin_warehouse)
                ) ||
                inventoryItems.find(i =>
                  i.item_name && item.item_name &&
                  i.item_name.toLowerCase() === item.item_name.toLowerCase()
                );
              const stock = matched ? Number(matched.quantity) || 0 : null;
              const isOverStock = stock !== null && (stock <= 0 || Number(item.quantity) > stock);

              return (
              <div key={idx} className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <select
                    value={item.item_id || item.item_name}
                    onChange={(e) => handleItemLineChange(idx, 'item_id', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-900 focus:border-[#006B56] outline-none truncate"
                  >
                    <option value="">Select commodity...</option>
                    <optgroup label={`── ${form.origin_warehouse || 'Depot'} Stock ──`}>
                      {depotInventory.map(inv => {
                        const taken = isItemAlreadySelected(inv, idx);
                        return (
                          <option key={inv.id} value={inv.id} disabled={taken}>
                            {inv.item_name} (In stock: {inv.quantity} {inv.unit}){taken ? ' — Already selected' : ''}
                          </option>
                        );
                      })}
                    </optgroup>
                    {inventoryItems.filter(i => !depotInventory.some(d => d.id === i.id)).length > 0 && (
                      <optgroup label="── Inter-Depot Stock Transfer (Other Warehouses) ──">
                        {inventoryItems
                          .filter(i => !depotInventory.some(d => d.id === i.id))
                          .map(inv => {
                            const taken = isItemAlreadySelected(inv, idx);
                            return (
                              <option key={inv.id} value={inv.id} disabled={taken}>
                                {inv.item_name} ({inv.warehouse || 'Other Depot'} — {inv.quantity} {inv.unit}){taken ? ' — Already selected' : ''}
                              </option>
                            );
                          })}
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
                    className={`w-full px-2.5 py-2 text-xs rounded-lg border font-bold text-center outline-none ${
                      isOverStock
                        ? 'border-rose-500 bg-rose-50 text-rose-700 focus:border-rose-600'
                        : 'border-slate-200 bg-white text-slate-900 focus:border-[#006B56]'
                    }`}
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
              {isOverStock && (
                <p className="text-[11px] font-semibold text-rose-600 pl-1">
                  Out of stock: {stock <= 0 ? '0 available in stock' : `Only ${stock} ${item.unit || 'units'} available in stock`}.
                </p>
              )}
              </div>
            );})}
          </div>
        </div>

        {/* 4. Driver Assignment */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-slate-400" />
              <span>Driver Assignment</span>
            </label>
            <span className="text-[11px] text-slate-400">Select registered driver</span>
          </div>

          {/* Driver Dropdown */}
          <div>
            <select
              value={form.driver_id || ''}
              onChange={(e) => {
                const dId = e.target.value;
                const dUser = driverUsers.find(u => u.id === dId);
                if (dUser) {
                  const matchedFleet = fleetList.find(f =>
                    (f.driver_name || f.driver || '').toLowerCase().includes((dUser.full_name || '').toLowerCase())
                  );
                  setForm(prev => ({
                    ...prev,
                    driver_id: dUser.id,
                    driver_name: dUser.full_name || prev.driver_name,
                    driver_phone: dUser.phone || dUser.phone_number || prev.driver_phone,
                    vehicle_reg: prev.vehicle_reg || matchedFleet?.vehicle_plate || matchedFleet?.plate || 'SSD-481-LOG'
                  }));
                } else {
                  setForm(prev => ({ ...prev, driver_id: '' }));
                }
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-900 focus:border-[#006B56] outline-none cursor-pointer"
            >
              <option value="">-- Select Registered Driver ({driverUsers.length}) --</option>
              {driverUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name} {u.phone ? `(${u.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                Driver Full Name *
              </label>
              <input
                type="text"
                value={form.driver_name}
                onChange={(e) => setForm(prev => ({ ...prev, driver_name: e.target.value }))}
                placeholder="Driver Full Name"
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-900 focus:border-[#006B56] outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                Driver Phone
              </label>
              <input
                type="text"
                value={form.driver_phone}
                onChange={(e) => setForm(prev => ({ ...prev, driver_phone: e.target.value }))}
                placeholder="e.g. +211-921-889911"
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

