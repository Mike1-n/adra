import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Search,
  Plus,
  TrendingUp,
  FolderOpen,
  PieChart,
  Calendar,
  X,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { calculatePercentage } from '../../../lib/utils';

export function FinanceBudgetsView({
  budgets = [],
  expenditures = [],
  projects = [],
  onOpenAddBudget
}) {
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('ALL');

  // Compute spend per budget category/project
  const budgetsWithSpend = useMemo(() => {
    return budgets.map(b => {
      const matchingExps = expenditures.filter(
        e => (e.project_id === b.project_id || e.project_name === b.project_name) &&
             e.category === b.budget_category
      );
      const spentAmount = matchingExps.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const allocatedAmount = Number(b.allocated_amount || 0);
      const remaining = allocatedAmount - spentAmount;
      const pct = allocatedAmount > 0 ? Math.min(100, Math.round((spentAmount / allocatedAmount) * 100)) : 0;

      return {
        ...b,
        spentAmount,
        remaining,
        pct
      };
    });
  }, [budgets, expenditures]);

  const filteredBudgets = useMemo(() => {
    return budgetsWithSpend.filter(b => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (b.budget_category || '').toLowerCase().includes(q) ||
        (b.project_name || '').toLowerCase().includes(q) ||
        (b.financial_year || '').toLowerCase().includes(q);

      const matchesProj = selectedProjectId === 'ALL' || b.project_id === selectedProjectId;
      return matchesSearch && matchesProj;
    });
  }, [budgetsWithSpend, search, selectedProjectId]);

  const totalAllocated = filteredBudgets.reduce((sum, b) => sum + Number(b.allocated_amount || 0), 0);
  const totalSpent = filteredBudgets.reduce((sum, b) => sum + Number(b.spentAmount || 0), 0);
  const totalRemaining = totalAllocated - totalSpent;

  return (
    <div className="space-y-3.5 pb-16 animate-in fade-in duration-150">
      
      {/* 1. TOP HEADER & ALLOCATE BUDGET BUTTON */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-slate-900 tracking-tight">
            Program Budget Lines
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            Grant allocations & burn monitoring
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddBudget}
          className="px-3 py-2 bg-gradient-to-r from-[#006B56] to-emerald-600 hover:from-[#005242] hover:to-emerald-700 text-white text-xs font-black rounded-2xl shadow-xs transition flex items-center gap-1.5 active:scale-97 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Budget Line</span>
        </button>
      </div>

      {/* 2. SUMMARY STRIP */}
      <div className="bg-slate-900 text-white rounded-2xl p-3 px-4 flex items-center justify-between shadow-2xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Total Allocated vs Remaining
          </span>
          <div className="text-base font-black text-emerald-400">
            SSP {totalAllocated.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-300">
            Rem: <strong>SSP {totalRemaining.toLocaleString()}</strong> ({totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0}% burned)
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-300 block">
            {filteredBudgets.length} Budget Lines
          </span>
          <span className="text-[10px] text-slate-400">
            Across Projects
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
            placeholder="Search category or project budget..."
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

        {/* Project Selector Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
          <button
            type="button"
            onClick={() => setSelectedProjectId('ALL')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition shrink-0 cursor-pointer shadow-2xs ${
              selectedProjectId === 'ALL'
                ? 'bg-[#006B56] text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Projects
          </button>
          {projects.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedProjectId(p.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition shrink-0 cursor-pointer shadow-2xs max-w-[160px] truncate ${
                selectedProjectId === p.id
                  ? 'bg-[#006B56] text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {p.project_name || p.name}
            </button>
          ))}
        </div>
      </div>

      {/* 4. BUDGET LINES FEED */}
      <div className="space-y-3">
        {filteredBudgets.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2 shadow-2xs">
            <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <Wallet className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">No Budget Lines Found</h4>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              No budgets matching the selected filters. Tap 'Add Budget Line' to allocate funds.
            </p>
          </div>
        ) : (
          filteredBudgets.map(b => (
            <div
              key={b.id}
              className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs space-y-3"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                    {b.financial_year || 'FY 2025'}
                  </span>
                  <h4 className="text-xs font-black text-slate-900 mt-1 truncate">
                    {b.budget_category}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                    <FolderOpen className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{b.project_name || 'Emergency Food Assistance'}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-slate-900">
                    SSP {Number(b.allocated_amount || 0).toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold block">
                    Allocated
                  </span>
                </div>
              </div>

              {/* Progress Bar & Stats */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-500">
                    Spent: <strong className="text-slate-800">SSP {b.spentAmount.toLocaleString()}</strong>
                  </span>
                  <span className={b.pct > 90 ? 'text-amber-600' : 'text-[#006B56]'}>
                    {b.pct}% Burned
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      b.pct > 90 ? 'bg-amber-500' : b.pct > 75 ? 'bg-teal-500' : 'bg-[#006B56]'
                    }`}
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
                  <span>Remaining: <strong>SSP {b.remaining.toLocaleString()}</strong></span>
                  <span>{b.remaining >= 0 ? 'In Budget' : 'Overbudget'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
