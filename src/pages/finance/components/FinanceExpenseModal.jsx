import React, { useState } from 'react';
import {
  Receipt,
  X,
  Plus,
  Calendar,
  FolderOpen,
  DollarSign,
  FileText,
  Upload,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { generateCode } from '../../../lib/utils';
import { useToast } from '../../../context/ToastContext';

const BUDGET_CATEGORIES = [
  'Direct Activity Costs',
  'Personnel',
  'Equipment & Supplies',
  'Training & Workshops',
  'Travel & Transport',
  'Administrative / Overhead'
];

export function FinanceExpenseModal({
  isOpen,
  onClose,
  projects = [],
  onSaveExpense,
  currentUser
}) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    expenditure_code: generateCode('EXP'),
    project_id: projects[0]?.id || '',
    category: BUDGET_CATEGORIES[0],
    description: '',
    amount: '',
    expenditure_date: new Date().toISOString().split('T')[0],
    receipt_url: 'payment_voucher.pdf'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) {
      toast.warning('Please provide an expense amount and description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedProj = projects.find(p => p.id === formData.project_id);
      await onSaveExpense({
        ...formData,
        amount: Number(formData.amount),
        project_name: selectedProj?.project_name || 'Emergency Project',
        recorded_by: currentUser?.full_name || 'Alex Morgan (Finance Officer)'
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#006B56] to-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Log New Expenditure
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Record verified invoice or field voucher
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Project & Category */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Project <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.project_id}
              onChange={e => setFormData({ ...formData, project_id: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#006B56]"
              required
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.project_name || p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Budget Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#006B56]"
              required
            >
              {BUDGET_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Amount (SSP) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                placeholder="e.g. 85000"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-[#006B56]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Expense Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.expenditure_date}
                onChange={e => setFormData({ ...formData, expenditure_date: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#006B56]"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Expense Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Community mobilization food distribution logistics and fuel stipend."
              rows={2}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#006B56]"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 bg-gradient-to-r from-[#006B56] to-emerald-600 hover:from-[#005242] hover:to-emerald-700 text-white text-xs font-black rounded-2xl shadow-xs transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Record Expense</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
