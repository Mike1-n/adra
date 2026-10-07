import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Plus,
  Trash2,
  Calendar,
  FolderOpen,
  X,
  FileText,
  ChevronDown,
  ChevronUp,
  Info,
  Tag,
  DollarSign,
  User,
  Hash
} from 'lucide-react';

export function FinanceExpensesView({
  expenditures = [],
  projects = [],
  selectedCategory = 'ALL',
  onOpenSidebar,
  onOpenAddExpense,
  onDeleteExpense,
  onViewVoucher
}) {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const filteredExpenditures = useMemo(() => {
    return expenditures.filter(e => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (e.description || '').toLowerCase().includes(q) ||
        (e.expenditure_code || '').toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q) ||
        (e.project_name || '').toLowerCase().includes(q) ||
        (e.payee_name || '').toLowerCase().includes(q);

      const matchesCategory = selectedCategory === 'ALL' || e.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [expenditures, search, selectedCategory]);

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-3 pb-16 animate-in fade-in duration-150">
      
      {/* 1. TOP CONTROLS: Search Bar & Log Expense Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search code, category, description..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200/80 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 outline-none text-slate-900 font-medium transition shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {onOpenAddExpense && (
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="px-3 py-2 bg-gradient-to-r from-[#006B56] to-emerald-600 hover:from-[#005242] hover:to-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1.5 shrink-0 active:scale-97 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Expense</span>
          </button>
        )}
      </div>

      {/* 2. UNCLUTTERED NUMBERED TABLE FORMAT */}
      <div className="space-y-2">
        {filteredExpenditures.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center space-y-2 shadow-2xs">
            <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center mx-auto text-slate-400">
              <Receipt className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">No Expense Records</h4>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              No expenditures match your active search or category filter.
            </p>
          </div>
        ) : (
          filteredExpenditures.map((exp, idx) => {
            const isExpanded = expandedId === exp.id;
            const rowNumber = idx + 1;
            const expDate = exp.expenditure_date || exp.created_at;

            return (
              <div
                key={exp.id || idx}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden transition"
              >
                {/* Clean Compact Main Row */}
                <div className="p-3 flex items-center justify-between gap-2.5">
                  {/* Number Badge & Code / Category */}
                  <div className="min-w-0 flex-1 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black flex items-center justify-center shrink-0 border border-slate-200">
                      {rowNumber}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-black text-slate-900 block truncate">
                          {exp.expenditure_code || `EXP-${rowNumber}`}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.2 rounded">
                          {exp.category || 'General Expense'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium truncate max-w-xs mt-0.5">
                        {exp.description || 'Direct operational expense'}
                      </p>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-[#006B56] block font-mono">
                      SSP {Number(exp.amount || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {expDate ? new Date(expDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Verified'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {onViewVoucher && (
                      <button
                        type="button"
                        onClick={() => onViewVoucher(exp)}
                        className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl shadow-2xs transition active:scale-95 flex items-center gap-1 cursor-pointer"
                        title="View Voucher"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Voucher</span>
                      </button>
                    )}

                    {onDeleteExpense && (
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(exp)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible View Bar */}
                <button
                  type="button"
                  onClick={() => toggleExpand(exp.id)}
                  className="w-full py-1.5 px-3.5 bg-slate-50/70 hover:bg-slate-100 text-slate-500 hover:text-slate-800 text-[11px] font-semibold flex items-center justify-between transition cursor-pointer border-t border-slate-100"
                >
                  <span className="flex items-center gap-1">
                    <Info className="w-3 h-3 text-slate-400" />
                    <span>{isExpanded ? 'Hide Details' : 'View More Information'}</span>
                  </span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* Expanded Details Container */}
                {isExpanded && (
                  <div className="p-3 bg-slate-50/90 border-t border-slate-100 text-xs space-y-2 animate-in fade-in-50 duration-150">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-xl bg-white border border-slate-200/80 space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <FolderOpen className="w-3 h-3 text-emerald-600" />
                          Project
                        </span>
                        <span className="font-semibold text-slate-800 block truncate">
                          {exp.project_name || 'Emergency Response Project'}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-white border border-slate-200/80 space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#006B56]" />
                          Date Logged
                        </span>
                        <span className="font-semibold text-slate-800 block">
                          {expDate ? new Date(expDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Full Description & Receipt Reference */}
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-[11px] text-slate-700 space-y-1">
                      <span className="font-bold text-slate-900 block">Expense Details & Purpose:</span>
                      <p className="leading-relaxed">
                        {exp.description || 'No additional narrative provided.'}
                      </p>
                      {exp.receipt_number && (
                        <div className="pt-1 text-[10px] text-slate-500 font-mono">
                          Receipt Ref: <span className="font-bold text-slate-700">{exp.receipt_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
