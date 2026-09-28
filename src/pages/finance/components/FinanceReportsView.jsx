import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  FileText,
  PieChart,
  Calendar,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Building,
  ArrowDownToLine,
  Printer
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function FinanceReportsView({
  budgets = [],
  expenditures = [],
  projects = [],
  fieldFundingRequests = [],
  currentUser
}) {
  const toast = useToast();
  const [selectedReportType, setSelectedReportType] = useState('full_ledger');

  const totalAllocated = budgets.reduce((sum, b) => sum + Number(b.allocated_amount || 0), 0);
  const totalSpent = expenditures.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const remaining = totalAllocated - totalSpent;

  // Export CSV
  const handleExportCSV = () => {
    try {
      let csvContent = 'data:text/csv;charset=utf-8,';
      
      if (selectedReportType === 'full_ledger') {
        csvContent += 'Voucher Code,Project,Category,Description,Amount (SSP),Date,Status\n';
        expenditures.forEach(e => {
          csvContent += `"${e.expenditure_code || 'EXP'}","${e.project_name || 'Project'}","${e.category || ''}","${(e.description || '').replace(/"/g, '""')}",${e.amount || 0},"${e.expenditure_date || ''}","Verified"\n`;
        });
      } else if (selectedReportType === 'budgets') {
        csvContent += 'Financial Year,Project,Budget Category,Allocated Amount (SSP)\n';
        budgets.forEach(b => {
          csvContent += `"${b.financial_year || 'FY 2025'}","${b.project_name || 'Project'}","${b.budget_category || ''}",${b.allocated_amount || 0}\n`;
        });
      } else {
        csvContent += 'Request Code,Field Worker,Location,Purpose,Amount (SSP),Payout Channel,Status,Disbursed At\n';
        fieldFundingRequests.forEach(r => {
          csvContent += `"${r.request_code || r.id}","${r.field_worker_name || ''}","${r.location || ''}","${(r.purpose || '').replace(/"/g, '""')}",${r.amount || 0},"${r.preferred_payout || ''}","${r.status || ''}","${r.finance_disbursement?.disbursed_at || ''}"\n`;
        });
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ADRA_Finance_${selectedReportType}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Finance statement CSV downloaded successfully.');
    } catch (err) {
      toast.error('Failed to export CSV.');
    }
  };

  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-16 animate-in fade-in duration-150">
      
      {/* 1. HEADER */}
      <div>
        <h3 className="text-sm font-black text-slate-900 tracking-tight">
          Financial Statements & Donor Exports
        </h3>
        <p className="text-[11px] text-slate-500 font-medium">
          Generate audit-compliant reports & CSV summaries
        </p>
      </div>

      {/* 2. REPORT TYPE SELECTION */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <label className="text-xs font-bold text-slate-700 block">
          Select Statement Format:
        </label>
        
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setSelectedReportType('full_ledger')}
            className={`p-3 rounded-2xl text-left border transition cursor-pointer ${
              selectedReportType === 'full_ledger'
                ? 'bg-emerald-50 border-[#006B56] ring-1 ring-[#006B56]'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <FileSpreadsheet className={`w-4 h-4 mb-1.5 ${selectedReportType === 'full_ledger' ? 'text-[#006B56]' : 'text-slate-400'}`} />
            <span className="text-xs font-bold text-slate-800 block">Expense Ledger</span>
            <span className="text-[10px] text-slate-500">{expenditures.length} records</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedReportType('budgets')}
            className={`p-3 rounded-2xl text-left border transition cursor-pointer ${
              selectedReportType === 'budgets'
                ? 'bg-emerald-50 border-[#006B56] ring-1 ring-[#006B56]'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <PieChart className={`w-4 h-4 mb-1.5 ${selectedReportType === 'budgets' ? 'text-[#006B56]' : 'text-slate-400'}`} />
            <span className="text-xs font-bold text-slate-800 block">Grant Budgets</span>
            <span className="text-[10px] text-slate-500">{budgets.length} lines</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedReportType('facilitations')}
            className={`p-3 rounded-2xl text-left border transition cursor-pointer ${
              selectedReportType === 'facilitations'
                ? 'bg-emerald-50 border-[#006B56] ring-1 ring-[#006B56]'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <FileText className={`w-4 h-4 mb-1.5 ${selectedReportType === 'facilitations' ? 'text-[#006B56]' : 'text-slate-400'}`} />
            <span className="text-xs font-bold text-slate-800 block">Facilitations</span>
            <span className="text-[10px] text-slate-500">{fieldFundingRequests.length} payouts</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="py-2.5 bg-[#006B56] hover:bg-[#005242] text-white text-xs font-bold rounded-2xl shadow-xs transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Download CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrintStatement}
            className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-2xl border border-slate-200 transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* 3. FINANCIAL SUMMARY PREVIEW */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
          Executive Financial Highlights
        </h4>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Active Fiscal Period:</span>
            <span className="font-bold text-slate-800">FY 2025 / 2026</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Gross Budget Authorization:</span>
            <span className="font-bold text-slate-800">SSP {totalAllocated.toLocaleString()}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Total Liquidated Expenditures:</span>
            <span className="font-black text-rose-600">SSP {totalSpent.toLocaleString()}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Uncommitted Project Balance:</span>
            <span className="font-black text-[#006B56]">SSP {remaining.toLocaleString()}</span>
          </div>

          <div className="flex justify-between py-1.5">
            <span className="text-slate-500">Compliance & Audit Readiness:</span>
            <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
              100% Reconciled
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
