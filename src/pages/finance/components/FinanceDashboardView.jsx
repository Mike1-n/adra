import React from 'react';
import {
  Clock,
  Sparkles,
  ChevronRight,
  Plus,
  Receipt,
  Wallet,
  CheckCircle2,
  FileSpreadsheet,
  TrendingUp,
  Building,
  ArrowRight
} from 'lucide-react';

export function FinanceDashboardView({
  budgets = [],
  expenditures = [],
  projects = [],
  fieldFundingRequests = [],
  onNavigateTab,
  onOpenDisburse,
  onOpenAddExpense,
  onOpenAddBudget,
  onViewVoucher
}) {
  const totalAllocated = budgets.reduce((sum, b) => sum + Number(b.allocated_amount || 0), 0);
  const totalSpent = expenditures.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const remaining = totalAllocated - totalSpent;

  // Requisitions awaiting Finance payout (PM Grace Approved / Endorsed)
  const pendingDisbursements = fieldFundingRequests.filter(
    r => r.status === 'Approved (Pending Finance Disbursement)' ||
         r.stage === 3 ||
         r.status === 'Approved by Program Manager' ||
         r.status === 'Pending Finance Disbursement'
  );
  const pendingDisbursementAmount = pendingDisbursements.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const disbursedRequisitions = fieldFundingRequests.filter(
    r => r.stage === 4 || r.status === 'Disbursed' || r.status === 'Disbursed / Paid'
  );

  // Recent 4 ledger transactions
  const recentTransactions = [...expenditures]
    .sort((a, b) => new Date(b.created_at || b.expenditure_date || 0) - new Date(a.created_at || a.expenditure_date || 0))
    .slice(0, 4);

  // Format clean transaction title to prevent mobile multi-line clutter
  const formatTxTitle = (desc = '') => {
    if (desc.startsWith('Supplier Payout:')) {
      const match = desc.match(/to\s+([^(\n]+)/i);
      if (match && match[1]) {
        return `Supplier Payout: ${match[1].trim()}`;
      }
    }
    if (desc.startsWith('Field Cash Facilitation') || desc.startsWith('Field Operational Facilitation')) {
      const match = desc.match(/for\s+([^(\n]+)/i);
      if (match && match[1]) {
        return `Field Cash: ${match[1].trim()}`;
      }
    }
    return desc;
  };

  // Spend by Category summary
  const categories = [
    { name: 'Direct Activity Costs', color: 'bg-emerald-500' },
    { name: 'Personnel', color: 'bg-blue-500' },
    { name: 'Equipment & Supplies', color: 'bg-teal-500' },
    { name: 'Training & Workshops', color: 'bg-amber-500' },
    { name: 'Travel & Transport', color: 'bg-purple-500' }
  ];

  const categorySpend = categories.map(cat => {
    const spent = expenditures
      .filter(e => e.category === cat.name)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const pct = totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0;
    return { ...cat, spent, pct };
  }).filter(c => c.spent > 0);

  return (
    <div className="space-y-3.5 pb-8 animate-in fade-in duration-200 max-w-4xl mx-auto">
      
      {/* 1. URGENT ACTION: PENDING DISBURSEMENTS */}
      {pendingDisbursements.length > 0 && (
        <div
          onClick={() => onNavigateTab('disbursements')}
          className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent rounded-2xl p-3 border border-amber-300 shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs shrink-0 animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-xs font-black text-amber-950 truncate">
                  {pendingDisbursements.length} Payout{pendingDisbursements.length > 1 ? 's' : ''} Ready
                </h4>
                <span className="bg-amber-200/90 text-amber-950 text-[9px] font-black px-1.5 py-0.5 rounded">
                  PM Authorized
                </span>
              </div>
              <p className="text-[11px] text-amber-900 font-medium truncate">
                Totaling <strong>SSP {pendingDisbursementAmount.toLocaleString()}</strong>
              </p>
            </div>
          </div>
          <div className="w-6 h-6 rounded-lg bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition">
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* 2. BALANCED 2x2 FINANCIAL TILES */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Pending Payouts */}
        <div
          onClick={() => onNavigateTab('disbursements')}
          className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs hover:border-amber-300 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending</span>
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock className="w-3 h-3" />
            </div>
          </div>
          <div className="mt-1.5">
            <span className="text-lg font-black text-slate-900 leading-none">{pendingDisbursements.length}</span>
            <span className="text-[11px] text-amber-700 font-bold block truncate mt-1">
              SSP {pendingDisbursementAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Total Expenses */}
        <div
          onClick={() => onNavigateTab('expenses')}
          className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs hover:border-emerald-300 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expenses</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-[#006B56] flex items-center justify-center">
              <Receipt className="w-3 h-3" />
            </div>
          </div>
          <div className="mt-1.5">
            <span className="text-lg font-black text-slate-900 leading-none">{expenditures.length}</span>
            <span className="text-[11px] text-[#006B56] font-bold block truncate mt-1">
              SSP {totalSpent.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Total Expenses / Allocated */}
        <div
          onClick={() => onNavigateTab('expenses')}
          className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs hover:border-blue-300 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">Budget</span>
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
              <Wallet className="w-3 h-3" />
            </div>
          </div>
          <div className="mt-1.5">
            <span className="text-lg font-black text-slate-900 leading-none">
              SSP {totalAllocated >= 1000000 ? `${(totalAllocated / 1000000).toFixed(2)}M` : totalAllocated.toLocaleString()}
            </span>
            <span className="text-[11px] text-blue-700 font-bold block truncate mt-1">
              {projects.length} Projects
            </span>
          </div>
        </div>

        {/* Disbursed Vouchers */}
        <div
          onClick={() => onNavigateTab('disbursements')}
          className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs hover:border-teal-300 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">Disbursed</span>
            <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3" />
            </div>
          </div>
          <div className="mt-1.5">
            <span className="text-lg font-black text-slate-900 leading-none">{disbursedRequisitions.length}</span>
            <span className="text-[11px] text-teal-700 font-bold block truncate mt-1">
              Verified & Paid
            </span>
          </div>
        </div>
      </div>

      {/* 3. CLEAN QUICK ACTION BUTTONS */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={onOpenAddExpense}
          className="py-2.5 px-2 rounded-xl bg-[#006B56] hover:bg-[#005242] text-white text-xs font-bold shadow-2xs transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="text-[11px]">Log Expense</span>
        </button>

        <button
          type="button"
          onClick={onOpenAddBudget}
          className="py-2.5 px-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold shadow-2xs transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
        >
          <Wallet className="w-3.5 h-3.5 text-[#006B56]" />
          <span className="text-[11px]">Add Budget</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('reports')}
          className="py-2.5 px-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold shadow-2xs transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-[11px]">Statements</span>
        </button>
      </div>

      {/* 4. RECENT LEDGER TRANSACTIONS FEED (Decluttered & Clean) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
            Recent Ledger Entries
          </h3>
          <button
            type="button"
            onClick={() => onNavigateTab('expenses')}
            className="text-[11px] font-bold text-[#006B56] hover:underline cursor-pointer flex items-center gap-0.5"
          >
            <span>View All ({expenditures.length})</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
            No recent expenditures recorded yet.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
            {recentTransactions.map((tx, idx) => (
              <div
                key={tx.id || idx}
                onClick={() => onViewVoucher && onViewVoucher(tx)}
                className="p-3 flex items-center justify-between gap-2.5 hover:bg-slate-50/80 transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#006B56] flex items-center justify-center shrink-0 border border-emerald-100 font-bold">
                    <Receipt className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate max-w-[180px] sm:max-w-xs">
                      {formatTxTitle(tx.description)}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                      <span className="font-mono font-semibold text-slate-600">{tx.expenditure_code || 'EXP'}</span>
                      <span>&bull;</span>
                      <span className="truncate">{tx.category || 'Direct'}</span>
                      <span>&bull;</span>
                      <span>{new Date(tx.expenditure_date || tx.created_at || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-slate-900">
                    SSP {Number(tx.amount || 0).toLocaleString()}
                  </div>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1 py-0.2 rounded inline-block mt-0.5">
                    Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. TOP SPEND BY CATEGORY BREAKDOWN (Compact & Clean) */}
      {categorySpend.length > 0 && (
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
              Expense Distribution
            </h4>
            <span className="text-[10px] text-slate-500 font-bold">
              Total: SSP {totalSpent.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2">
            {categorySpend.map((c, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                  <span className="truncate">{c.name}</span>
                  <span className="font-mono text-slate-900 shrink-0 ml-2">SSP {c.spent.toLocaleString()} ({c.pct}%)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${c.color} rounded-full transition-all duration-300`}
                    style={{ width: `${c.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
