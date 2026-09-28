import React from 'react';
import {
  Clock,
  Sparkles,
  ChevronRight,
  Plus,
  Receipt,
  Wallet,
  CheckCircle2,
  Banknote,
  FileSpreadsheet,
  ArrowUpRight,
  TrendingUp,
  Building,
  ShieldCheck
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
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      
      {/* 1. URGENT ACTION: PENDING DISBURSEMENTS (PM APPROVED) */}
      {pendingDisbursements.length > 0 && (
        <div
          onClick={() => onNavigateTab('disbursements')}
          className="bg-amber-50 rounded-2xl p-3.5 border border-amber-300 shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0 animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-xs font-black text-amber-950">
                  {pendingDisbursements.length} Field Payout{pendingDisbursements.length > 1 ? 's' : ''} Ready
                </h4>
                <span className="bg-amber-200/80 text-amber-900 text-[10px] font-black px-1.5 py-0.2 rounded">
                  PM Authorized
                </span>
              </div>
              <p className="text-[11px] text-amber-800 font-medium truncate mt-0.5">
                Totaling <strong>SSP {pendingDisbursementAmount.toLocaleString()}</strong> ready for disbursement.
              </p>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-amber-200/60 text-amber-900 flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* 2. FOUR BALANCED FINANCIAL METRIC TILES */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Pending Payouts */}
        <div
          onClick={() => onNavigateTab('disbursements')}
          className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs hover:border-amber-300 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Pending Payouts</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-slate-900">{pendingDisbursements.length}</span>
            <span className="text-[10px] text-amber-700 font-bold block truncate">
              SSP {pendingDisbursementAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Total Expenses */}
        <div
          onClick={() => onNavigateTab('expenses')}
          className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs hover:border-emerald-300 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Total Expenses</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#006B56] flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-slate-900">{expenditures.length}</span>
            <span className="text-[10px] text-[#006B56] font-bold block truncate">
              SSP {totalSpent.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Budget Allocated */}
        <div
          onClick={() => onNavigateTab('budgets')}
          className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs hover:border-blue-300 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Total Budget</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-slate-900">
              SSP {totalAllocated >= 1000000 ? `${(totalAllocated / 1000000).toFixed(2)}M` : totalAllocated.toLocaleString()}
            </span>
            <span className="text-[10px] text-blue-700 font-bold block truncate">
              Across {projects.length} Projects
            </span>
          </div>
        </div>

        {/* Disbursed Facilitations */}
        <div
          onClick={() => onNavigateTab('disbursements')}
          className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs hover:border-teal-300 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Disbursed Vouchers</span>
            <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-slate-900">{disbursedRequisitions.length}</span>
            <span className="text-[10px] text-teal-700 font-bold block truncate">
              Verified & Paid
            </span>
          </div>
        </div>
      </div>

      {/* 3. QUICK ACTION BUTTONS */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={onOpenAddExpense}
          className="p-3 rounded-2xl bg-[#006B56] hover:bg-[#005242] text-white text-xs font-bold shadow-xs transition flex flex-col items-center justify-center gap-1 active:scale-97 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="text-[11px] leading-tight">Log Expense</span>
        </button>

        <button
          type="button"
          onClick={onOpenAddBudget}
          className="p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold shadow-2xs transition flex flex-col items-center justify-center gap-1 active:scale-97 cursor-pointer"
        >
          <Wallet className="w-4 h-4 text-[#006B56]" />
          <span className="text-[11px] leading-tight">Add Budget</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('reports')}
          className="p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold shadow-2xs transition flex flex-col items-center justify-center gap-1 active:scale-97 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          <span className="text-[11px] leading-tight">Statements</span>
        </button>
      </div>

      {/* 4. RECENT LEDGER TRANSACTIONS FEED */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Recent Ledger Entries
          </h3>
          <button
            type="button"
            onClick={() => onNavigateTab('expenses')}
            className="text-[11px] font-bold text-[#006B56] hover:underline cursor-pointer"
          >
            View All ({expenditures.length})
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
            No recent expenditures recorded yet.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
            {recentTransactions.map((tx, idx) => (
              <div
                key={tx.id || idx}
                onClick={() => onViewVoucher && onViewVoucher(tx)}
                className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                    <Receipt className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {tx.description || 'Disbursement voucher'}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                      <span className="font-mono font-bold text-slate-600">{tx.expenditure_code || 'EXP'}</span>
                      <span>•</span>
                      <span className="truncate">{tx.category || 'Direct Activity'}</span>
                      <span>•</span>
                      <span>{new Date(tx.expenditure_date || tx.created_at || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-slate-900">
                    SSP {Number(tx.amount || 0).toLocaleString()}
                  </div>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                    Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. TOP SPEND BY CATEGORY BREAKDOWN */}
      {categorySpend.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Expense Distribution
            </h4>
            <span className="text-[10px] text-slate-500 font-bold">
              Total: SSP {totalSpent.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2">
            {categorySpend.map((c, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-700 truncate">{c.name}</span>
                  <span className="text-slate-900">SSP {c.spent.toLocaleString()} ({c.pct}%)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${c.color} rounded-full`}
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
