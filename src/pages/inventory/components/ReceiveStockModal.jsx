import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, PackagePlus, Building2, Truck, Calendar, DollarSign, CheckCircle2, ShieldAlert, Search, Package, Sparkles, ChevronDown } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

// Standard ADRA Knowledge Base for Instant Auto-Fill
const STANDARD_ADRA_PRESETS = [
  { item_name: 'Emergency Household Food Basket (Maize Flour, Beans, Rice, Oil, Salt)', category: 'Food Assistance', unit: 'Baskets', unit_cost: 42.00 },
  { item_name: 'Fortified Vegetable Cooking Oil (20L Food-Grade Jerrycans)', category: 'Food Assistance', unit: 'Jerrycans', unit_cost: 28.50 },
  { item_name: 'Fortified Maize Flour (25kg Bags)', category: 'Food Assistance', unit: 'Bags', unit_cost: 28.50 },
  { item_name: 'BP-5 High-Nutrition Emergency Compact Food Rations (Box of 24 Bars)', category: 'Food Assistance', unit: 'Cartons', unit_cost: 55.00 },
  { item_name: 'Aquatabs Water Purification Tablets (Boxes of 100 Strips / 1,000 tabs)', category: 'WASH (Water & Sanitation)', unit: 'Boxes', unit_cost: 8.50 },
  { item_name: 'Aquatabs Water Chlorination Tablets (Boxes of 100 strips)', category: 'WASH (Water & Sanitation)', unit: 'Boxes', unit_cost: 8.50 },
  { item_name: 'Food-Grade 20L Water Jerrycans with Reinforced Pouring Spout', category: 'WASH (Water & Sanitation)', unit: 'Pieces', unit_cost: 6.20 },
  { item_name: 'Women & Adolescent Girls Dignity Kits (Pads, Soap, Undergarments, Kitenge, Solar Torch)', category: 'WASH (Water & Sanitation)', unit: 'Kits', unit_cost: 18.00 },
  { item_name: 'Family Hygiene & Dignity Kits (Jerrycan, Soap, Towels, Pads)', category: 'WASH (Water & Sanitation)', unit: 'Kits', unit_cost: 18.00 },
  { item_name: 'Family Essential Hygiene Packs (Bathing Soap, Laundry Bars, Toothpaste, Towels)', category: 'WASH (Water & Sanitation)', unit: 'Packs', unit_cost: 12.50 },
  { item_name: 'Heavy-Duty Reinforced Shelter Tarpaulins (4x5m UV-Resistant Plastic Sheeting)', category: 'Shelter & Non-Food Items', unit: 'Pieces', unit_cost: 15.50 },
  { item_name: 'Emergency Heavy-Duty Shelter Tarpaulins (4x5m UV-Resistant)', category: 'Shelter & Non-Food Items', unit: 'Pieces', unit_cost: 15.50 },
  { item_name: 'Long-Lasting Insecticidal Mosquito Nets (LLINs - Family Size 190x180x150cm)', category: 'Shelter & Non-Food Items', unit: 'Pieces', unit_cost: 5.80 },
  { item_name: 'Household Emergency Kitchen & Cooking Sets (Aluminum Pots, Steel Plates, Cups, Cutlery)', category: 'Shelter & Non-Food Items', unit: 'Sets', unit_cost: 34.00 },
  { item_name: 'Thermal Humanitarian Fleece Blankets (Bundles of 20)', category: 'Shelter & Non-Food Items', unit: 'Packs', unit_cost: 24.00 },
  { item_name: 'Certified Drought-Resilient Crop Seeds Pack (Sorghum, Maize, Cowpeas - 15kg)', category: 'Agriculture & Livelihoods', unit: 'Packs', unit_cost: 22.00 },
  { item_name: 'Certified Drought Sorghum & Maize Seeds (25kg bags)', category: 'Agriculture & Livelihoods', unit: 'Bags', unit_cost: 28.50 },
  { item_name: 'Student Emergency Learning & Literacy Backpack Kits (Books, Stationery, Geometry Set)', category: 'Education & Youth', unit: 'Kits', unit_cost: 11.50 },
  { item_name: 'Student Educational & Literacy Kits (Backpacks, Books, Pens)', category: 'Education & Youth', unit: 'Kits', unit_cost: 11.50 }
];

function normalizeCategory(cat) {
  if (!cat) return 'Food Assistance';
  const c = cat.toLowerCase();
  if (c.includes('food') || c.includes('nutrition')) return 'Food Assistance';
  if (c.includes('wash') || c.includes('water') || c.includes('hygiene') || c.includes('sanitation')) return 'WASH (Water & Sanitation)';
  if (c.includes('shelter') || c.includes('nfi') || c.includes('blanket') || c.includes('tarpaulin')) return 'Shelter & Non-Food Items';
  if (c.includes('agri') || c.includes('seed') || c.includes('farm') || c.includes('livelihood')) return 'Agriculture & Livelihoods';
  if (c.includes('edu') || c.includes('school') || c.includes('youth') || c.includes('literacy')) return 'Education & Youth';
  return 'Food Assistance';
}

export function ReceiveStockModal({
  isOpen,
  onClose,
  warehouses = [],
  suppliers = [],
  inventoryItems = [],
  purchaseOrders = [],
  selectedItem = null,
  onReceiveSuccess
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);

  // Combined master list of items (Live inventory + standard ADRA presets)
  const masterCommodities = useMemo(() => {
    const map = new Map();

    // 1. First add standard presets
    STANDARD_ADRA_PRESETS.forEach(p => {
      map.set(p.item_name.toLowerCase(), {
        ...p,
        isCatalog: true
      });
    });

    // 2. Add or override with live inventory items
    inventoryItems.forEach(item => {
      if (item.item_name) {
        const key = item.item_name.toLowerCase();
        const existing = map.get(key);
        map.set(key, {
          id: item.id,
          sku: item.sku,
          item_name: item.item_name,
          category: normalizeCategory(item.category),
          unit: item.unit || existing?.unit || 'Units',
          unit_cost: item.unit_cost !== undefined ? item.unit_cost : (existing?.unit_cost || 0),
          warehouse: item.warehouse || existing?.warehouse,
          quantity: item.quantity,
          isLiveStock: true
        });
      }
    });

    return Array.from(map.values());
  }, [inventoryItems]);

  const [form, setForm] = useState({
    item_name: '',
    category: 'Food Assistance',
    quantity: '',
    unit: 'Bags',
    warehouse: warehouses[0]?.name || '',
    batch_number: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (selectedItem) {
        setForm({
          item_name: selectedItem.item_name || '',
          category: normalizeCategory(selectedItem.category),
          quantity: '',
          unit: selectedItem.unit || 'Bags',
          warehouse: selectedItem.warehouse || warehouses[0]?.name || '',
          batch_number: selectedItem.batch_number || ''
        });
      } else {
        setForm({
          item_name: '',
          category: 'Food Assistance',
          quantity: '',
          unit: 'Bags',
          warehouse: warehouses[0]?.name || '',
          batch_number: ''
        });
      }
      setIsDropdownOpen(false);
      setHighlightedIndex(-1);
    }
  }, [isOpen, selectedItem, warehouses]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered commodities based on user search query
  const filteredCommodities = useMemo(() => {
    const query = (form.item_name || '').trim().toLowerCase();
    if (!query) {
      return masterCommodities.slice(0, 8);
    }
    
    // Split search into words for multi-word matching (e.g. "maize flour 25kg")
    const words = query.split(/\s+/).filter(Boolean);

    return masterCommodities.filter(c => {
      const name = (c.item_name || '').toLowerCase();
      const cat = (c.category || '').toLowerCase();
      const sku = (c.sku || '').toLowerCase();
      const unit = (c.unit || '').toLowerCase();
      const wh = (c.warehouse || '').toLowerCase();

      return words.every(w => 
        name.includes(w) || 
        cat.includes(w) || 
        sku.includes(w) || 
        unit.includes(w) ||
        wh.includes(w)
      );
    });
  }, [masterCommodities, form.item_name]);

  if (!isOpen) return null;

  const selectCommodity = (commodity) => {
    setForm(prev => ({
      ...prev,
      item_name: commodity.item_name,
      category: normalizeCategory(commodity.category),
      unit: commodity.unit || prev.unit,
      warehouse: (commodity.warehouse && warehouses.some(w => w.name === commodity.warehouse)) 
        ? commodity.warehouse 
        : (prev.warehouse || warehouses[0]?.name || '')
    }));
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
  };

  const handleNameChange = (val) => {
    setForm(prev => ({ ...prev, item_name: val }));
    setIsDropdownOpen(true);
    setHighlightedIndex(-1);

    // If exact match found, auto-fill category & unit immediately
    const exactMatch = masterCommodities.find(c => 
      (c.item_name || '').toLowerCase() === (val || '').trim().toLowerCase()
    );
    if (exactMatch) {
      setForm(prev => ({
        ...prev,
        category: normalizeCategory(exactMatch.category),
        unit: exactMatch.unit || prev.unit
      }));
    }
  };

  const handleKeyDown = (e) => {
    if (!isDropdownOpen || filteredCommodities.length === 0) {
      if (e.key === 'ArrowDown') {
        setIsDropdownOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredCommodities.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredCommodities.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < filteredCommodities.length) {
        e.preventDefault();
        selectCommodity(filteredCommodities[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.item_name.trim()) {
      toast.error('Please specify the commodity name.');
      return;
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      toast.error('Please enter a valid received quantity greater than zero.');
      return;
    }
    if (!form.warehouse) {
      toast.error('Please select the receiving depot.');
      return;
    }

    // Canonicalize name if matching existing item
    const norm = (s) => (s || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, '').trim();
    const valKey = norm(form.item_name);
    const matched = masterCommodities.find(c => {
      const cName = (c.item_name || '').trim().toLowerCase();
      const cKey = norm(cName);
      return cName === form.item_name.trim().toLowerCase() || (valKey.length > 3 && (cKey === valKey || cKey.includes(valKey) || valKey.includes(cKey)));
    });

    const finalItemName = matched ? matched.item_name : form.item_name.trim();
    const finalCategory = matched ? normalizeCategory(matched.category) : form.category;
    const finalUnit = matched ? matched.unit : form.unit;
    const finalCost = matched?.unit_cost !== undefined ? matched.unit_cost : 0;

    setLoading(true);
    try {
      if (onReceiveSuccess) {
        await onReceiveSuccess({
          ...form,
          item_id: matched?.id || undefined,
          item_name: finalItemName,
          category: finalCategory,
          unit: finalUnit,
          quantity: Number(form.quantity),
          unit_cost: finalCost,
          batch_number: form.batch_number || '',
          expiry_date: 'N/A'
        });
      }
      toast.success(`Received ${Number(form.quantity).toLocaleString()} ${finalUnit} of ${finalItemName} into ${form.warehouse}.`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to receive stock.');
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
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">Receive Stock (GRN)</h3>
              <p className="text-xs text-emerald-100">Log incoming humanitarian relief goods into state depot</p>
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

          {/* Commodity Name Input with Live Filter Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Commodity Name *
              </label>
              <span className="text-[10px] text-[#006B56] font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Type to search & auto-fill</span>
              </span>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={form.item_name}
                onChange={(e) => handleNameChange(e.target.value)}
                onFocus={() => setIsDropdownOpen(true)}
                onKeyDown={handleKeyDown}
                required
                placeholder="Type to search e.g. Maize, Oil, Tarpaulin, Aquatabs..."
                className="w-full pl-9 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] focus:ring-2 focus:ring-[#006B56]/10 outline-none font-medium text-slate-900 shadow-2xs transition"
              />
              {form.item_name && (
                <button
                  type="button"
                  onClick={() => {
                    setForm(prev => ({ ...prev, item_name: '' }));
                    setIsDropdownOpen(true);
                  }}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Interactive Search Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto">
                <div className="p-2 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#006B56]" />
                    <span>Matching Commodities ({filteredCommodities.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Press ↵ or click to select</span>
                </div>

                {filteredCommodities.length > 0 ? (
                  <div className="divide-y divide-slate-50">
                    {filteredCommodities.map((c, idx) => {
                      const isSelected = form.item_name === c.item_name;
                      const isHighlighted = highlightedIndex === idx;
                      return (
                        <button
                          key={`${c.item_name}-${c.warehouse || ''}-${idx}`}
                          type="button"
                          onClick={() => selectCommodity(c)}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                          className={`w-full text-left px-3.5 py-2.5 transition flex items-center justify-between gap-3 cursor-pointer ${
                            isHighlighted ? 'bg-emerald-50/80 text-emerald-950' : isSelected ? 'bg-slate-50 text-slate-900' : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold truncate block">
                                {c.item_name}
                              </span>
                              {c.isLiveStock && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                                  In Stock
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 font-medium">
                                {c.category}
                              </span>
                              <span>•</span>
                              <span className="font-mono font-semibold text-slate-600">
                                {c.unit}
                              </span>
                              {c.warehouse && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[150px] text-slate-400">
                                    {c.warehouse}
                                  </span>
                                </>
                              )}
                              {c.quantity !== undefined && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-emerald-700 font-bold">
                                    {Number(c.quantity).toLocaleString()} in depot
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0">
                            <CheckCircle2 className={`w-4 h-4 ${isSelected ? 'opacity-100 text-emerald-600' : isHighlighted ? 'opacity-70 text-emerald-500' : 'opacity-0'}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-xs text-slate-600 font-medium">
                      No predefined commodity matches "<span className="font-bold text-slate-900">{form.item_name}</span>"
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      You can continue with this new item name and specify category and unit below.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900"
              >
                <option value="Food Assistance">Food Assistance</option>
                <option value="WASH (Water & Sanitation)">WASH (Water & Sanitation)</option>
                <option value="Shelter & Non-Food Items">Shelter & Non-Food Items</option>
                <option value="Agriculture & Livelihoods">Agriculture & Livelihoods</option>
                <option value="Education & Youth">Education & Youth</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Unit of Measure *
              </label>
              <select
                value={form.unit}
                onChange={(e) => setForm(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900"
              >
                <option value="Bags">Bags</option>
                <option value="Baskets">Baskets</option>
                <option value="Jerrycans">Jerrycans</option>
                <option value="Boxes">Boxes</option>
                <option value="Kits">Kits</option>
                <option value="Packs">Packs</option>
                <option value="Pieces">Pieces</option>
                <option value="Cartons">Cartons</option>
                <option value="Sets">Sets</option>
                {/* Dynamically preserve custom unit if matched from existing items */}
                {form.unit && !['Bags','Baskets','Jerrycans','Boxes','Kits','Packs','Pieces','Cartons','Sets'].includes(form.unit) && (
                  <option value={form.unit}>{form.unit}</option>
                )}
              </select>
            </div>
          </div>

          {/* Quantity & Receiving Depot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantity Received *
              </label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm(prev => ({ ...prev, quantity: e.target.value }))}
                required
                placeholder="e.g. 500"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Receiving Depot *
              </label>
              <select
                value={form.warehouse}
                onChange={(e) => setForm(prev => ({ ...prev, warehouse: e.target.value }))}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900"
              >
                <option value="">Select Depot...</option>
                {warehouses.map(w => (
                  <option key={w.id || w.code} value={w.name}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Batch / Expiry (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Batch / Lot Number (Optional)
            </label>
            <input
              type="text"
              value={form.batch_number}
              onChange={(e) => setForm(prev => ({ ...prev, batch_number: e.target.value }))}
              placeholder="e.g. BATCH-2026-01"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-mono text-slate-900"
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
              <span>{loading ? 'Recording...' : 'Record GRN & Ingest'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
