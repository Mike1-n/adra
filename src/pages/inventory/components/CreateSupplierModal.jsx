import React, { useState } from 'react';
import { X, Building2, User, Phone, Mail, MapPin, Landmark, DollarSign, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function CreateSupplierModal({
  isOpen,
  onClose,
  onSupplierSuccess
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    company_name: '',
    category: 'Shelter & Non-Food Items',
    contact_person: '',
    email: '',
    phone: '',
    address: 'Juba, South Sudan',
    bank_name: 'Stanbic Bank South Sudan',
    bank_account_no: '',
    swift_code: 'SBICSSLX',
    mobile_money_number: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company_name.trim()) {
      toast.error('Please enter the vendor / supplier company name.');
      return;
    }
    if (!form.contact_person.trim()) {
      toast.error('Please specify a contact person.');
      return;
    }

    setLoading(true);
    try {
      if (onSupplierSuccess) {
        await onSupplierSuccess(form);
      }
      toast.success(`Supplier ${form.company_name} registered successfully!`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to register supplier.');
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
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">Register Approved Supplier</h3>
              <p className="text-xs text-emerald-100">Add vetted vendor partner & payment settlement details</p>
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Company / Vendor Name *
            </label>
            <input
              type="text"
              value={form.company_name}
              onChange={(e) => setForm(prev => ({ ...prev, company_name: e.target.value }))}
              required
              placeholder="e.g. Nile Valley Agricultural Supplies Ltd"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary Supply Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900"
              >
                <option value="Food Assistance">Food Assistance & Nutrition</option>
                <option value="WASH (Water & Sanitation)">WASH (Water & Sanitation)</option>
                <option value="Shelter & Non-Food Items">Shelter & Non-Food Items</option>
                <option value="Agriculture & Livelihoods">Agriculture & Livelihoods</option>
                <option value="Education & Youth">Education & Youth</option>
                <option value="Medical & Health">Medical & Health</option>
                <option value="Transport & Logistics">Transport & Logistics</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Person *
              </label>
              <input
                type="text"
                value={form.contact_person}
                onChange={(e) => setForm(prev => ({ ...prev, contact_person: e.target.value }))}
                required
                placeholder="e.g. John Deng (Sales Lead)"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="orders@supplier.com"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+211-92X-XXXXXX"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Physical Depot / Operating Address
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
              placeholder="e.g. Gumbo Logistics Zone, Juba, South Sudan"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900"
            />
          </div>

          {/* Banking / Payout details for Finance settlement */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block">
              Banking & Finance Settlement Details
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Settlement Bank Name
                </label>
                <input
                  type="text"
                  value={form.bank_name}
                  onChange={(e) => setForm(prev => ({ ...prev, bank_name: e.target.value }))}
                  placeholder="e.g. Stanbic Bank South Sudan"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bank Account Number / IBAN
                </label>
                <input
                  type="text"
                  value={form.bank_account_no}
                  onChange={(e) => setForm(prev => ({ ...prev, bank_account_no: e.target.value }))}
                  placeholder="e.g. 0180-2294-88102"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-mono font-medium text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  SWIFT / BIC Code
                </label>
                <input
                  type="text"
                  value={form.swift_code}
                  onChange={(e) => setForm(prev => ({ ...prev, swift_code: e.target.value }))}
                  placeholder="e.g. SBICSSLX"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-mono font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  m-Gurush Mobile Money Account #
                </label>
                <input
                  type="text"
                  value={form.mobile_money_number}
                  onChange={(e) => setForm(prev => ({ ...prev, mobile_money_number: e.target.value }))}
                  placeholder="+211-92X-XXXXXX"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none font-medium text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-[#006B56] hover:bg-[#005443] rounded-xl shadow-xs transition active:scale-[0.99] cursor-pointer flex items-center gap-1.5"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Register Approved Supplier</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
