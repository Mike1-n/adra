import React from 'react';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { exportVoucherPDF } from '../../../lib/reportGenerator';
import { useToast } from '../../../context/ToastContext';

export function FinanceVoucherModal({
  isOpen,
  onClose,
  item
}) {
  const toast = useToast();
  if (!isOpen || !item) return null;

  const voucherCode = item.finance_disbursement?.voucher_reference || item.expenditure_code || item.request_code || 'PV-2026-001';
  const txnCode = item.finance_disbursement?.transaction_ref || 'TXN-MG-VERIFIED';
  const payeeName = item.field_worker_name || item.recorded_by || 'Field Worker';
  const payeePhone = item.payout_phone || item.field_worker_phone || item.recipient_phone;
  const amount = Number(item.amount || 0);
  const currency = item.currency || 'SSP';
  const dateStr = new Date(item.finance_disbursement?.disbursed_at || item.expenditure_date || item.created_at || Date.now()).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const paymentChannel = item.finance_disbursement?.payment_method || item.preferred_payout || 'm-Gurush Mobile Money';
  const pmApprover = item.pm_approved_by || 'Grace Ochieng';
  const financeApprover = item.finance_disbursement?.disbursed_by || 'Alex Morgan';

  const handleDownloadPDF = () => {
    try {
      exportVoucherPDF(item);
      toast.success(`Receipt downloaded (${voucherCode})`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF receipt.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        
        {/* Header with Official ADRA Logo */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            {/* ADRA Logo */}
            <div className="w-10 h-10 rounded-xl bg-[#006B56] p-1 flex items-center justify-center shadow-xs shrink-0">
              <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                <rect width="100" height="100" rx="20" fill="#047857"/>
                <path d="M50 15L78 35V65L50 85L22 65V35L50 15Z" stroke="#34D399" strokeWidth="6" fill="#064E3B"/>
                <path d="M50 30L65 42V60L50 70L35 60V42L50 30Z" fill="#10B981"/>
                <circle cx="50" cy="50" r="8" fill="#FFFFFF"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-slate-900 tracking-tight">ADRA</span>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Payment Receipt
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                {voucherCode}
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

        {/* Hero Amount & Status Card */}
        <div className="p-4 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 rounded-2xl border border-emerald-100/80 text-center space-y-1">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
            Total Disbursed
          </span>
          <div className="text-2xl font-black text-[#006B56] tracking-tight">
            {currency} {amount.toLocaleString()}
          </div>
          <div className="inline-flex items-center gap-1 bg-emerald-100/80 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Disbursed & Logged</span>
          </div>
        </div>

        {/* Compact Details Summary */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/70 space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Payee</span>
            <span className="font-bold text-slate-900 text-right truncate max-w-[170px]">
              {payeeName} {payeePhone ? `(${payeePhone})` : ''}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Channel & Ref</span>
            <span className="font-medium text-slate-800 text-right truncate max-w-[170px]">
              {paymentChannel} • <span className="font-mono text-slate-600">{txnCode}</span>
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Date</span>
            <span className="font-medium text-slate-800">{dateStr}</span>
          </div>

          <div className="space-y-0.5 pt-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Purpose</span>
            <p className="text-slate-700 text-[11px] line-clamp-2 leading-tight">
              {item.description || item.purpose || item.reason || 'Operational mission facilitation stipend.'}
            </p>
          </div>
        </div>

        {/* Minimal Sign-off Footer */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 bg-white px-1">
          <span>PM: <strong className="text-slate-800">{pmApprover}</strong></span>
          <span>Finance: <strong className="text-slate-800">{financeApprover}</strong></span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex-1 py-2.5 bg-[#006B56] hover:bg-[#005242] text-white text-xs font-black rounded-2xl shadow-xs transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            title="Print"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl border border-slate-200 transition active:scale-98 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
