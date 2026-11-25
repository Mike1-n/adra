import React, { useState, useEffect, useMemo } from 'react';
import { X, ShoppingCart, Send, Building2, MapPin, Package, Plus, Trash2 } from 'lucide-react';
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
    items: [
      { item_name: '', quantity: '', unit: 'Bags', max_unit_price: '', category: 'Food Assistance', isCustom: false }
    ],
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

      if (commodityList.length > 0 && form.items.length === 1 && !form.items[0].item_name && !form.items[0].isCustom) {
        const firstComm = commodityList[0];
        setForm(prev => ({
          ...prev,
          category: firstComm.category || prev.category,
          items: [
            {
              item_name: firstComm.item_name,
              quantity: prev.items[0]?.quantity || '',
              unit: firstComm.unit || 'Bags',
              max_unit_price: prev.items[0]?.max_unit_price || '',
              category: firstComm.category || 'General Supplies',
              isCustom: false
            }
          ]
        }));
      }
    }
  }, [isOpen, suppliers, commodityList]);

  useEffect(() => {
    if (warehouses.length > 0 && !form.warehouse_destination) {
      setForm(prev => ({ ...prev, warehouse_destination: warehouses[0].name }));
    }
  }, [warehouses]);

  const isCommoditySelected = (name, excludeIdx = -1) => {
    if (!name) return false;
    const key = name.toLowerCase().trim();
    return form.items.some((it, i) => i !== excludeIdx && (it.item_name || '').toLowerCase().trim() === key);
  };

  const handleAddItemLine = () => {
    const nextComm = commodityList.find(c => !isCommoditySelected(c.item_name));
    setForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          item_name: nextComm ? nextComm.item_name : '',
          quantity: '',
          unit: nextComm?.unit || 'Bags',
          max_unit_price: '',
          category: nextComm?.category || 'General Supplies',
          isCustom: !nextComm
        }
      ]
    }));
  };

  const handleRemoveItemLine = (idx) => {
    if (form.items.length <= 1) return;
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleItemCommoditySelect = (idx, val) => {
    if (val === '__custom__') {
      setForm(prev => {
        const updated = [...prev.items];
        updated[idx] = { ...updated[idx], item_name: '', isCustom: true };
        return { ...prev, items: updated };
      });
      return;
    }
    if (isCommoditySelected(val, idx)) {
      toast.warning(`"${val}" is already added to this request. Update its quantity on the existing line.`);
      return;
    }
    const found = commodityList.find(c => c.item_name === val);
    setForm(prev => {
      const updated = [...prev.items];
      updated[idx] = {
        ...updated[idx],
        item_name: found ? found.item_name : val,
        unit: found?.unit || updated[idx].unit || 'Bags',
        category: found?.category || updated[idx].category || 'General Supplies',
        isCustom: false
      };
      return { ...prev, items: updated };
    });
  };

  const handleItemFieldChange = (idx, field, val) => {
    setForm(prev => {
      const updated = [...prev.items];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, items: updated };
    });
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
    if (!form.items.length || form.items.some(it => !it.item_name.trim() || !it.quantity || Number(it.quantity) <= 0)) {
      toast.warning('Please specify a valid product name and quantity for every item line.');
      return;
    }
    if (form.items.some(it => !it.max_unit_price || Number(it.max_unit_price) <= 0)) {
      toast.warning('Please set the maximum allowed unit price (SSP) for every item line.');
      return;
    }

    const cleanItems = form.items.map(it => ({
      item_name: it.item_name.trim(),
      quantity: Number(it.quantity),
      unit: it.unit || 'Units',
      max_unit_price: Number(it.max_unit_price),
      category: it.category || form.category || 'General Supplies'
    }));

    const summary = cleanItems.map(i => `${i.quantity}x ${i.unit} ${i.item_name}`).join(' • ');
    const primaryItemName = cleanItems.length === 1
      ? cleanItems[0].item_name
      : `${cleanItems[0].item_name} (+${cleanItems.length - 1} more)`;
    const totalQty = cleanItems.reduce((s, i) => s + i.quantity, 0);
    const combinedNotes = cleanItems.length > 1
      ? `${form.notes ? `${form.notes.trim()} | ` : ''}Items: ${summary}`
      : form.notes;

    setLoading(true);
    try {
      if (onPOSuccess) {
        await onPOSuccess({
          ...form,
          item_name: primaryItemName,
          category: cleanItems[0].category,
          quantity: totalQty,
          unit: cleanItems.length === 1 ? cleanItems[0].unit : 'Mixed',
          items: cleanItems,
          max_unit_price: cleanItems.length === 1 ? cleanItems[0].max_unit_price : null,
          items_summary: summary,
          notes: combinedNotes,
          total_amount: 0,
          stage: 1,
          status: 'Pending Quotation'
        });
      }
      toast.success(`Supply request (${cleanItems.length} ${cleanItems.length === 1 ? 'product' : 'products'}) sent to ${form.supplier_name}`);
      setForm(prev => ({
        ...prev,
        items: [
          {
            item_name: commodityList[0]?.item_name || '',
            quantity: '',
            unit: commodityList[0]?.unit || 'Bags',
            max_unit_price: '',
            category: commodityList[0]?.category || 'General Supplies',
            isCustom: false
          }
        ],
        notes: ''
      }));
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

          {/* 2. Commodities / Products Requested (Multi-Item) */}
          <div className="min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <label className="block text-slate-700 font-bold shrink-0">
                Products Requested ({form.items.length}) *
              </label>
              <button
                type="button"
                onClick={handleAddItemLine}
                className="text-[11px] font-bold text-[#006B56] hover:text-[#005443] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 cursor-pointer flex items-center gap-1 shrink-0 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
              {form.items.map((line, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Product #{idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      {line.isCustom ? (
                        <button
                          type="button"
                          onClick={() => handleItemCommoditySelect(idx, commodityList[0]?.item_name || '')}
                          className="text-[10px] font-bold text-[#006B56] hover:underline cursor-pointer"
                        >
                          ← Catalog
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleItemCommoditySelect(idx, '__custom__')}
                          className="text-[10px] font-bold text-[#006B56] hover:underline cursor-pointer"
                        >
                          + Custom name
                        </button>
                      )}
                      {form.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemLine(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Remove product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {!line.isCustom ? (
                    <select
                      value={line.item_name || ''}
                      onChange={(e) => handleItemCommoditySelect(idx, e.target.value)}
                      className="w-full max-w-full min-w-0 px-2.5 py-2 rounded-xl bg-white border border-slate-200 focus:border-[#006B56] outline-none font-bold text-slate-900 cursor-pointer truncate text-xs"
                      required
                    >
                      <option value="" disabled>-- Select a Commodity / Product --</option>
                      {commodityList.map(c => {
                        const taken = isCommoditySelected(c.item_name, idx);
                        return (
                          <option key={c.item_name} value={c.item_name} disabled={taken}>
                            {c.item_name}{taken ? ' — Already added' : ''}
                          </option>
                        );
                      })}
                      <option value="__custom__" className="font-extrabold text-[#006B56]">
                        + Add Custom Commodity / Product...
                      </option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={line.item_name}
                      onChange={(e) => handleItemFieldChange(idx, 'item_name', e.target.value)}
                      placeholder="Type product name (e.g. Solar Refrigerators, Tents)"
                      className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 focus:border-[#006B56] outline-none font-bold text-slate-900 text-xs"
                      required
                    />
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={line.quantity}
                      onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                      placeholder="Quantity *"
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 focus:border-[#006B56] outline-none font-bold text-slate-900 text-xs"
                      required
                    />
                    <select
                      value={line.unit}
                      onChange={(e) => handleItemFieldChange(idx, 'unit', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 focus:border-[#006B56] outline-none font-medium text-slate-900 cursor-pointer text-xs"
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
                    <div className="relative">
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={line.max_unit_price}
                        onChange={(e) => handleItemFieldChange(idx, 'max_unit_price', e.target.value)}
                        placeholder="Max Price / Unit (SSP) *"
                        title="Maximum allowed market price per unit (SSP)"
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 focus:border-[#006B56] outline-none font-bold text-slate-900 text-xs"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
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
