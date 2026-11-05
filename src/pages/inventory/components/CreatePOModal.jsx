import React, { useState, useEffect, useMemo } from 'react';
import { X, ShoppingCart, Send, Building2, MapPin, Package, Mail, Phone, User, Info, CheckCircle2, Sparkles } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

const STANDARD_COMMODITIES = [
  { item_name: 'Fortified Maize Flour (25kg Bags)', unit: 'Bags', category: 'Food Assistance' },
  { item_name: 'Yellow Split Peas / Pulses (10kg Bags)', unit: 'Bags', category: 'Food Assistance' },
  { item_name: 'Emergency Household Food Basket', unit: 'Baskets', category: 'Food Assistance' },
  { item_name: 'Fortified Vegetable Cooking Oil (20L Food-Grade Jerrycans)', unit: 'Jerrycans', category: 'Food Assistance' },
  { item_name: 'BP-5 High-Nutrition Emergency Food Rations (Box of 24 Bars)', unit: 'Cartons', category: 'Food Assistance' },
  { item_name: 'Aquatabs Water Chlorination Tablets (Boxes of 100 strips)', unit: 'Boxes', category: 'WASH (Water & Sanitation)' },
  { item_name: 'Food-Grade 20L Water Jerricans with Tap', unit: 'Pieces', category: 'WASH (Water & Sanitation)' },
  { item_name: 'PUR Water Purification Powder Sachets (Box of 240)', unit: 'Boxes', category: 'WASH (Water & Sanitation)' },
  { item_name: 'Heavy-Duty Reinforced UV-Resistant Tarpaulins (4x5m)', unit: 'Pieces', category: 'Shelter & Non-Food Items' },
  { item_name: 'Emergency Family Shelter & Bedding Kit', unit: 'Kits', category: 'Shelter & Non-Food Items' },
  { item_name: 'Dignity & Protection Kit for Women & Girls', unit: 'Kits', category: 'Protection & Dignity' },
  { item_name: 'Fast-Maturing Certified White Maize Seeds (10kg Bags)', unit: 'Bags', category: 'Agriculture & Livelihoods' },
  { item_name: 'Drought-Tolerant Sorghum Seeds (10kg Bags)', unit: 'Bags', category: 'Agriculture & Livelihoods' },
  { item_name: 'Handheld Agricultural Hoe & Multi-Tool Kit', unit: 'Sets', category: 'Agriculture & Livelihoods' },
  { item_name: 'Micro-Drip Solar Irrigation Line Bundles (500m coils)', unit: 'Bundles', category: 'Agriculture & Livelihoods' }
];

export function CreatePOModal({
  isOpen,
  onClose,
  suppliers = [],
  warehouses = [],
  inventoryItems = [],
  onPOSuccess
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [isCustomCommodity, setIsCustomCommodity] = useState(false);

  // Compile combined commodities list from live inventory and standard humanitarian catalog
  const commodityList = useMemo(() => {
    const map = new Map();
    (inventoryItems || []).forEach(item => {
      if (item.item_name && !map.has(item.item_name)) {
        map.set(item.item_name, {
          item_name: item.item_name,
          unit: item.unit || 'Bags',
          category: item.category || 'General Supplies'
        });
      }
    });
    STANDARD_COMMODITIES.forEach(c => {
      if (!map.has(c.item_name)) {
        map.set(c.item_name, c);
      }
    });
    return Array.from(map.values());
  }, [inventoryItems]);

  const [form, setForm] = useState({
    supplier_id: '',
    supplier_name: '',
    contact_person: '',
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
          contact_person: first.contact_person || '',
          supplier_email: first.email || '',
          supplier_phone: first.phone || '',
          category: first.category || prev.category
        }));
      }

      if (!form.item_name && commodityList.length > 0) {
        const firstComm = commodityList[0];
        setForm(prev => ({
          ...prev,
          item_name: firstComm.item_name,
          unit: firstComm.unit || prev.unit,
          category: firstComm.category || prev.category
        }));
        setIsCustomCommodity(false);
      }
    }
  }, [isOpen, suppliers, commodityList]);

  useEffect(() => {
    if (warehouses.length > 0 && !form.warehouse_destination) {
      setForm(prev => ({ ...prev, warehouse_destination: warehouses[0].name }));
    }
  }, [warehouses]);

  const handleCommoditySelect = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomCommodity(true);
      setForm(prev => ({ ...prev, item_name: '' }));
      return;
    }
    const found = commodityList.find(c => c.item_name === val);
    if (found) {
      setIsCustomCommodity(false);
      setForm(prev => ({
        ...prev,
        item_name: found.item_name,
        unit: found.unit || prev.unit,
        category: found.category || prev.category
      }));
    }
  };

  if (!isOpen) return null;

  const handleSupplierSelect = (e) => {
    const val = e.target.value;
    const sup = suppliers.find(s => s.id === val || s.company_name === val);
    if (sup) {
      setForm(prev => ({
        ...prev,
        supplier_id: sup.id,
        supplier_name: sup.company_name,
        contact_person: sup.contact_person || '',
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
      <div className="w-full max-w-lg min-w-0 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-4 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#006B56] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-bold shrink-0">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div className="min-w-0 truncate">
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight truncate">Request Supplies (Create PO)</h3>
              <p className="text-[11px] text-white/80 truncate">Issue an official purchase request to a supplier</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Streamlined Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs min-w-0 overflow-hidden">
          
          {/* 1. Supplier / Vendor */}
          <div className="min-w-0">
            <label className="block text-slate-700 font-bold mb-1">
              Supplier / Vendor *
            </label>
            {suppliers.length > 0 ? (
              <div className="space-y-1.5 min-w-0">
                <select
                  value={form.supplier_id || ''}
                  onChange={handleSupplierSelect}
                  className="w-full max-w-full min-w-0 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#006B56] focus:bg-white outline-none font-bold text-slate-900 cursor-pointer truncate text-ellipsis"
                  style={{ maxWidth: '100%' }}
                  required
                >
                  <option value="" disabled>-- Select a Registered Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.company_name}
                    </option>
                  ))}
                </select>

                {form.supplier_name && (
                  <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between min-w-0 gap-2">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 min-w-0 truncate">
                      <Building2 className="w-3.5 h-3.5 text-[#006B56] shrink-0" />
                      <span className="truncate">{form.supplier_name}</span>
                    </div>
                    {(form.supplier_email || form.supplier_phone) && (
                      <span className="text-[10px] text-slate-500 font-medium shrink-0">
                        {form.supplier_email || form.supplier_phone}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px]">
                No registered suppliers found. Please register suppliers in the <strong>Suppliers & Vendors</strong> tab first.
              </div>
            )}
          </div>

          {/* 2. Commodity / Item Name */}
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-1 gap-2 min-w-0">
              <label className="block text-slate-700 font-bold shrink-0">
                Commodity / Supplies Requested *
              </label>
              {isCustomCommodity ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomCommodity(false);
                    if (commodityList.length > 0) {
                      const first = commodityList[0];
                      setForm(prev => ({
                        ...prev,
                        item_name: first.item_name,
                        unit: first.unit || prev.unit,
                        category: first.category || prev.category
                      }));
                    }
                  }}
                  className="text-[11px] font-bold text-[#006B56] hover:underline cursor-pointer flex items-center gap-1 shrink-0"
                >
                  ← Select from standard catalog
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomCommodity(true);
                    setForm(prev => ({ ...prev, item_name: '' }));
                  }}
                  className="text-[11px] font-bold text-[#006B56] hover:underline cursor-pointer flex items-center gap-1 shrink-0"
                >
                  + Add custom product
                </button>
              )}
            </div>

            {!isCustomCommodity ? (
              <div className="space-y-1.5 min-w-0">
                <select
                  value={form.item_name || ''}
                  onChange={handleCommoditySelect}
                  className="w-full max-w-full min-w-0 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#006B56] focus:bg-white outline-none font-bold text-slate-900 cursor-pointer truncate text-ellipsis"
                  style={{ maxWidth: '100%' }}
                  required
                >
                  <option value="" disabled>-- Select a Commodity / Product --</option>
                  {commodityList.map(c => (
                    <option key={c.item_name} value={c.item_name}>
                      {c.item_name}
                    </option>
                  ))}
                  <option value="__custom__" className="font-extrabold text-[#006B56]">
                    + Add Custom Commodity / Product...
                  </option>
                </select>

                {form.item_name && (
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-[11px] text-emerald-900 flex items-center justify-between min-w-0 gap-2">
                    <span className="font-semibold flex items-center gap-1.5 min-w-0 truncate">
                      <Package className="w-3.5 h-3.5 text-[#006B56] shrink-0" />
                      <span className="truncate">{form.item_name}</span>
                    </span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-md font-bold text-emerald-800 border border-emerald-200 shrink-0">
                      Sector: {form.category}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5 animate-in fade-in duration-150 min-w-0">
                <input
                  type="text"
                  value={form.item_name}
                  onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                  placeholder="e.g. Solar Vaccine Refrigerators, Micro-Drip Irrigation, Tents"
                  className="w-full max-w-full min-w-0 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#006B56] focus:bg-white outline-none font-bold text-slate-900"
                  required
                  autoFocus
                />
                <p className="text-[10px] text-slate-500">
                  Type custom product name above. Specify desired quantity, packaging unit, and destination depot below.
                </p>
              </div>
            )}
          </div>

          {/* 3. Quantity & Unit */}
          <div className="grid grid-cols-2 gap-3 min-w-0">
            <div className="min-w-0">
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
                className="w-full max-w-full min-w-0 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#006B56] focus:bg-white outline-none font-bold text-slate-900"
                required
              />
            </div>

            <div className="min-w-0">
              <label className="block text-slate-700 font-bold mb-1">
                Unit
              </label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full max-w-full min-w-0 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#006B56] focus:bg-white outline-none font-medium text-slate-900 cursor-pointer truncate text-ellipsis"
                style={{ maxWidth: '100%' }}
              >
                <option value="Bags">Bags</option>
                <option value="Boxes">Boxes</option>
                <option value="Cartons">Cartons</option>
                <option value="Jerrycans">Jerrycans</option>
                <option value="Kits">Kits</option>
                <option value="Pieces">Pieces</option>
                <option value="Baskets">Baskets</option>
                <option value="Bundles">Bundles</option>
                <option value="Sets">Sets</option>
                <option value="Metric Tons (MT)">Metric Tons (MT)</option>
                <option value="Litres">Litres</option>
                <option value="Units">Units</option>
              </select>
            </div>
          </div>

          {/* 4. Receiving Depot Destination */}
          <div className="min-w-0">
            <label className="block text-slate-700 font-bold mb-1">
              Receiving Warehouse Depot *
            </label>
            <select
              value={form.warehouse_destination}
              onChange={(e) => setForm({ ...form, warehouse_destination: e.target.value })}
              className="w-full max-w-full min-w-0 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#006B56] focus:bg-white outline-none font-medium text-slate-900 truncate text-ellipsis"
              style={{ maxWidth: '100%' }}
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
