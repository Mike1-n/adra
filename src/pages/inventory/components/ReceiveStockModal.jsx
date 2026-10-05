import React, { useState, useMemo } from 'react';
import { X, PackagePlus, Building2, Truck, Calendar, DollarSign, CheckCircle2, ShieldAlert } from 'lucide-react';
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
  onReceiveSuccess
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  // Combined master list of items (Live inventory + standard ADRA presets)
  const masterCommodities = useMemo(() => {
    const map = new Map();

    // 1. First add standard presets
    STANDARD_ADRA_PRESETS.forEach(p => {
      map.set(p.item_name.toLowerCase(), p);
    });

    // 2. Add or override with live inventory items
    inventoryItems.forEach(item => {
      if (item.item_name) {
        map.set(item.item_name.toLowerCase(), {
          item_name: item.item_name,
          category: normalizeCategory(item.category),
          unit: item.unit || 'Units',
          unit_cost: item.unit_cost !== undefined ? item.unit_cost : 0
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

  React.useEffect(() => {
    if (isOpen) {
      setForm({
        item_name: '',
        category: 'Food Assistance',
        quantity: '',
        unit: 'Bags',
        warehouse: warehouses[0]?.name || '',
        batch_number: ''
      });
    }
  }, [isOpen, warehouses]);

  if (!isOpen) return null;

  const handleNameChange = (val) => {
    const trimmed = (val || '').trim().toLowerCase();
    
    // Normalization helper
    const norm = (s) => (s || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, '').trim();
    const valKey = norm(trimmed);

    // Search for match in master commodities
    const matched = masterCommodities.find(c => {
      const cName = (c.item_name || '').trim().toLowerCase();
      const cKey = norm(cName);
      return cName === trimmed || (valKey.length > 3 && (cKey === valKey || cKey.includes(valKey) || valKey.includes(cKey)));
    });

    if (matched && (val === matched.item_name || valKey.length > 5)) {
      setForm(prev => ({
        ...prev,
        item_name: val,
        category: normalizeCategory(matched.category),
        unit: matched.unit || prev.unit
      }));
    } else {
      setForm(prev => ({ ...prev, item_name: val }));
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

    setLoading(true);
    try {
      if (onReceiveSuccess) {
        await onReceiveSuccess({
          ...form,
          item_name: finalItemName,
          category: finalCategory,
          unit: finalUnit,
          quantity: Number(form.quantity),
          unit_cost: 0,
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

          {/* Commodity Name Input with Autocomplete */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Commodity Name *
              </label>
              <span className="text-[10px] text-[#006B56] font-medium">
                Auto-fills category & unit
              </span>
            </div>
            <input
              type="text"
              list="commodity-catalog-suggestions"
              value={form.item_name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              placeholder="e.g. Fortified Maize Flour (25kg Bags)..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900"
            />
            <datalist id="commodity-catalog-suggestions">
              {masterCommodities.map(c => (
                <option key={c.item_name} value={c.item_name}>
                  {c.category} • {c.unit}
                </option>
              ))}
            </datalist>
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
