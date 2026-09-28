import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Plus,
  Filter,
  Trash2,
  Download,
  Calendar,
  Layers,
  FolderOpen,
  User,
  X,
  FileText
} from 'lucide-react';

export function FinanceExpensesView({
  expenditures = [],
  projects = [],
  onOpenAddExpense,
  onDeleteExpense,
  onViewVoucher
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedProjectId, setSelectedProjectId] = useState('ALL');

  const categories = [
    'ALL',
    'Direct Activity Costs',
    'Personnel',
    'Equipment & Supplies',
    'Training & Workshops',
    'Travel & Transport',
    'Administrative / Overhead'
  ];

  const filteredExpenditures = useMemo(() => {
    return expenditures.filter(e => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (e.description || '').toLowerCase().includes(q) ||
        (e.expenditure_code || '').toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q) ||
        (e.project_name || '').toLowerCase().includes(q);

      const matchesCategory = selectedCategory === 'ALL' || e.category === selectedCategory;
      const matchesProject = selectedProjectId === 'ALL' || e.project_id === selectedProjectId;

      return matchesSearch && matchesCategory && matchesProject;
    });
  }, [expenditures, search, selectedCategory, selectedProjectId]);

  const totalFilteredAmount = filteredExpenditures.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="space-y-3.5 pb-16 animate-in fade-in duration-150">
      
      {/* 1. TOP HEADER & LOG EXPENSE BUTTON */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-slate-900 tracking-tight">
            Expense Ledger
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            {expenditures.length} verified vouchers logged
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddExpense}
          className="px-3 py-2 bg-gradient-to-r from-[#006B56] to-emerald-600 hover:from-[#005242] hover:to-emerald-700 text-white text-xs font-black rounded-2xl shadow-xs transition flex items-center gap-1.5 active:scale-97 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Expense</span>
        </button>
      </div>

      {/* 2. SUMMARY STRIP */}
      <div className="bg-slate-900 text-white rounded-2xl p-3 px-4 flex items-center justify-between shadow-2xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Total Filtered Spend
          </span>
          <div className="text-base font-black text-emerald-400">
            SSP {totalFilteredAmount.toLocaleString()}
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-300 block">
            {filteredExpenditures.length} Transactions
          </span>
          <span className="text-[10px] text-slate-400">
            Verified by Finance
          </span>
        </div>
      </div>

      {/* 3. SEARCH & PROJECT SELECTOR */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search voucher code, payee, description..."
            className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-[#006B56] text-slate-900 placeholder:text-slate-400 shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition shrink-0 cursor-pointer shadow-2xs ${
                selectedCategory === cat
                  ? 'bg-[#006B56] text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. EXPENSE ENTRIES FEED */}
      <div className="space-y-2.5">
        {filteredExpenditures.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2 shadow-2xs">
            <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <Receipt className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">No Expense Records</h4>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              No expenditures match the search or category filters.
            </p>
          </div>
        ) : (
          filteredExpenditures.map(exp => (
            <div
              key={exp.id}
              className="bg-white rounded-3xl p-3.5 border border-slate-200 shadow-2xs hover:border-slate-300 transition space-y-2.5"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                      {exp.expenditure_code || 'EXP'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                      {exp.category || 'Direct Activity'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mt-1 leading-snug">
                    {exp.description}
                  </h4>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-[#006B56]">
                    SSP {Number(exp.amount || 0).toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {new Date(exp.expenditure_date || exp.created_at || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Project & Recorded By Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center gap-1 truncate max-w-[200px]">
                  <FolderOpen className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate font-medium">{exp.project_name || 'Emergency Response'}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onViewVoucher(exp)}
                    className="text-[#006B56] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Voucher</span>
                  </button>
                  {onDeleteExpense && (
                    <button
                      type="button"
                      onClick={() => onDeleteExpense(exp)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
