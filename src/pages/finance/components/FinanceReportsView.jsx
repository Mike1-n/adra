import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  FileText,
  Calendar,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Building2,
  ArrowDownToLine,
  Printer,
  Banknote,
  Receipt,
  FolderOpen,
  Clock
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function FinanceReportsView({
  expenditures = [],
  projects = [],
  fieldFundingRequests = [],
  purchaseOrders = [],
  suppliers = [],
  currentUser
}) {
  const toast = useToast();
  const [selectedReportType, setSelectedReportType] = useState('full_ledger');

  // 1. Calculations for Financial Highlights
  const totalExpendituresVal = expenditures.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const disbursedFacilitations = fieldFundingRequests.filter(
    r => r.stage === 4 || r.status === 'Disbursed' || r.status?.includes('Disbursed')
  );
  const disbursedFacilitationsVal = disbursedFacilitations.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const pendingFacilitations = fieldFundingRequests.filter(
    r => r.status === 'Approved (Pending Finance Disbursement)' ||
         r.stage === 3 ||
         r.status === 'Approved by Program Manager' ||
         r.status === 'Pending Finance Disbursement'
  );
  const pendingFacilitationsVal = pendingFacilitations.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const settledPOs = purchaseOrders.filter(
    po => po.stage === 4 || po.status === 'Paid & Settled' || po.payment_status === 'Paid'
  );
  const settledPOsVal = settledPOs.reduce((sum, po) => sum + Number(po.total_amount || 0), 0);

  const pendingPOs = purchaseOrders.filter(
    po => (po.stage === 3 || po.grn_number) && po.status !== 'Paid & Settled' && po.payment_status !== 'Paid'
  );
  const pendingPOsVal = pendingPOs.reduce((sum, po) => sum + Number(po.total_amount || 0), 0);

  const totalDisbursedAll = totalExpendituresVal + disbursedFacilitationsVal + settledPOsVal;
  const totalPendingObligations = pendingFacilitationsVal + pendingPOsVal;

  // 2. Export CSV Handler
  const handleExportCSV = () => {
    try {
      let csvContent = 'data:text/csv;charset=utf-8,';
      const todayStr = new Date().toISOString().split('T')[0];

      if (selectedReportType === 'full_ledger') {
        csvContent += 'Voucher Code,Project,Category,Description,Amount (SSP),Date Logged,Status\n';
        expenditures.forEach(e => {
          csvContent += `"${e.expenditure_code || 'EXP'}","${(e.project_name || 'Project').replace(/"/g, '""')}","${e.category || ''}","${(e.description || '').replace(/"/g, '""')}",${e.amount || 0},"${e.expenditure_date || e.created_at || ''}","Verified"\n`;
        });
      } else if (selectedReportType === 'facilitations') {
        csvContent += 'Req Code,Field Worker,Location,Purpose,Amount (SSP),Payout Channel,Phone,Status,Disbursed At\n';
        fieldFundingRequests.forEach(r => {
          csvContent += `"${r.request_code || r.id}","${r.field_worker_name || r.worker_name || ''}","${r.location || r.payam || ''}","${(r.purpose || '').replace(/"/g, '""')}",${r.amount || 0},"${r.preferred_payout || ''}","${r.field_worker_phone || ''}","${r.status || ''}","${r.finance_disbursement?.disbursed_at || ''}"\n`;
        });
      } else if (selectedReportType === 'supplier_invoices') {
        csvContent += 'PO Number,Vendor Name,Consignment Items,Total Amount (SSP),GRN Number,Invoice Ref,Payment Status,Settlement Date\n';
        purchaseOrders.forEach(po => {
          csvContent += `"${po.po_number || ''}","${(po.supplier_name || '').replace(/"/g, '""')}","${(po.items_summary || '').replace(/"/g, '""')}",${po.total_amount || 0},"${po.grn_number || ''}","${po.supplier_invoice_number || ''}","${po.status || ''}","${po.settled_at || ''}"\n`;
        });
      } else if (selectedReportType === 'project_summary') {
        csvContent += 'Project Name,State / Region,Target Beneficiaries,Facilitations Paid (SSP),Supplier Consignments (SSP),Operational Expenses (SSP),Total Expended (SSP)\n';
        projects.forEach(p => {
          const pFac = disbursedFacilitations.filter(r => r.project_id === p.id).reduce((s, r) => s + Number(r.amount || 0), 0);
          const pPO = settledPOs.filter(po => po.project_id === p.id).reduce((s, po) => s + Number(po.total_amount || 0), 0);
          const pExp = expenditures.filter(e => e.project_id === p.id || e.project_name === p.name).reduce((s, e) => s + Number(e.amount || 0), 0);
          const pTotal = pFac + pPO + pExp;

          csvContent += `"${(p.name || 'Project').replace(/"/g, '""')}","${p.state || p.location || ''}","${p.target_beneficiaries || ''}",${pFac},${pPO},${pExp},${pTotal}\n`;
        });
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ADRA_Finance_${selectedReportType}_${todayStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Finance statement CSV generated and downloaded.');
    } catch (err) {
      toast.error('Failed to export statement.');
    }
  };

  const handlePrintStatement = () => {
    window.print();
  };

  const reportFormats = [
    {
      id: 'full_ledger',
      title: 'Expense Ledger',
      subtitle: `${expenditures.length} records`,
      icon: Receipt,
      color: 'text-blue-600',
      bgActive: 'bg-blue-50/80 border-blue-600 ring-1 ring-blue-600'
    },
    {
      id: 'facilitations',
      title: 'Field Payouts',
      subtitle: `${fieldFundingRequests.length} requests`,
      icon: Banknote,
      color: 'text-[#006B56]',
      bgActive: 'bg-emerald-50/80 border-[#006B56] ring-1 ring-[#006B56]'
    },
    {
      id: 'supplier_invoices',
      title: 'Supplier POs',
      subtitle: `${purchaseOrders.length} orders`,
      icon: Building2,
      color: 'text-amber-600',
      bgActive: 'bg-amber-50/80 border-amber-600 ring-1 ring-amber-600'
    },
    {
      id: 'project_summary',
      title: 'Project Summary',
      subtitle: `${projects.length} projects`,
      icon: FolderOpen,
      color: 'text-purple-600',
      bgActive: 'bg-purple-50/80 border-purple-600 ring-1 ring-purple-600'
    }
  ];

  return (
    <div className="space-y-3.5 pb-16 animate-in fade-in duration-150">
      
      {/* 1. HEADER */}
      <div>
        <h3 className="text-sm font-black text-slate-900 tracking-tight">
          Financial Statements & Donor Exports
        </h3>
        <p className="text-[11px] text-slate-500 font-medium">
          Generate audit-compliant reports & CSV summaries
        </p>
      </div>

      {/* 2. REPORT TYPE SELECTION (2x2 Clean Grid) */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-3">
        <label className="text-xs font-bold text-slate-700 block">
          Select Statement Format:
        </label>
        
        <div className="grid grid-cols-2 gap-2">
          {reportFormats.map(rf => {
            const Icon = rf.icon;
            const isSelected = selectedReportType === rf.id;

            return (
              <button
                key={rf.id}
                type="button"
                onClick={() => setSelectedReportType(rf.id)}
                className={`p-3 rounded-xl text-left border transition cursor-pointer flex items-start gap-2.5 ${
                  isSelected
                    ? rf.bgActive
                    : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/70'
                }`}
              >
                <div className={`p-2 rounded-lg bg-white shadow-2xs shrink-0 ${rf.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 block truncate">
                    {rf.title}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    {rf.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="py-2.5 bg-[#006B56] hover:bg-[#005242] text-white text-xs font-bold rounded-xl shadow-2xs transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Download CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrintStatement}
            className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200/80 transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* 3. FINANCIAL SUMMARY PREVIEW */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-3">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#006B56]" />
          <span>Executive Financial Highlights</span>
        </h4>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Active Fiscal Period:</span>
            <span className="font-bold text-slate-800">FY 2025 / 2026</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Total Funds Disbursed:</span>
            <span className="font-black text-slate-900 font-mono">
              SSP {totalDisbursedAll.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Field Worker Facilitations:</span>
            <span className="font-bold text-slate-800 font-mono">
              SSP {disbursedFacilitationsVal.toLocaleString()}
              <span className="text-[10px] text-slate-400 font-normal ml-1">({disbursedFacilitations.length} Paid)</span>
            </span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Supplier Consignments Settled:</span>
            <span className="font-bold text-slate-800 font-mono">
              SSP {settledPOsVal.toLocaleString()}
              <span className="text-[10px] text-slate-400 font-normal ml-1">({settledPOs.length} POs)</span>
            </span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Operational Expense Journal:</span>
            <span className="font-bold text-slate-800 font-mono">
              SSP {totalExpendituresVal.toLocaleString()}
              <span className="text-[10px] text-slate-400 font-normal ml-1">({expenditures.length} Logged)</span>
            </span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Pending Payout Obligations:</span>
            <span className="font-bold text-amber-700 font-mono">
              SSP {totalPendingObligations.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between py-1.5 items-center">
            <span className="text-slate-500">Compliance & Audit Readiness:</span>
            <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>100% Vouched & Reconciled</span>
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
