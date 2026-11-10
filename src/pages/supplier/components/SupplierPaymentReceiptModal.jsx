import React from 'react';
import { Download, Printer, X } from 'lucide-react';
import { exportSupplierPaymentReceiptPDF } from '../../../lib/reportGenerator';
import { useToast } from '../../../context/ToastContext';

export function SupplierPaymentReceiptModal({ purchaseOrder, onClose }) {
  const toast = useToast();
  if (!purchaseOrder) return null;

  const voucherNumber = purchaseOrder.payment_voucher_number || purchaseOrder.po_number;
  const paidAmount = Number(purchaseOrder.paid_amount ?? purchaseOrder.total_amount ?? 0);
  const paymentDate = purchaseOrder.paid_date || purchaseOrder.created_at;

  const handleDownload = async () => {
    try {
      await exportSupplierPaymentReceiptPDF(purchaseOrder);
      toast.success(`Receipt downloaded (${voucherNumber})`);
    } catch (error) {
      console.error('Failed to download supplier payment receipt:', error);
      toast.error('Failed to download payment receipt.');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-xs sm:p-4">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #supplier-payment-receipt-print,
          #supplier-payment-receipt-print * { visibility: visible !important; }
          #supplier-payment-receipt-print {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 32px !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: white !important;
          }
          .supplier-receipt-no-print { display: none !important; }
        }
      `}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplier-payment-receipt-title"
        className="flex max-h-[calc(100dvh-1rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)]"
      >
        <div className="supplier-receipt-no-print sticky top-0 z-10 flex shrink-0 items-center justify-between bg-[#006B56] px-4 py-3 text-white sm:px-5 sm:py-4">
          <div>
            <h2 id="supplier-payment-receipt-title" className="font-bold">Supplier Payment Receipt</h2>
            <p className="truncate text-xs text-white/80">{voucherNumber}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/30 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Close receipt"
            title="Close receipt"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div id="supplier-payment-receipt-print" className="min-h-0 flex-1 overflow-y-auto p-4 text-slate-900 sm:p-8">
          <div className="border-b-2 border-emerald-700 pb-4">
            <div className="flex items-center justify-between gap-4">
              <img src="/images/adra-logo-expanded.png" alt="ADRA" className="h-12 w-auto object-contain" />
              <div className="text-right">
                <h1 className="text-lg font-black">PAYMENT RECEIPT</h1>
                <p className="font-mono text-sm">{voucherNumber}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-600">ADRA South Sudan • Supplier Payment Confirmation</p>
          </div>

          <div className="my-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Amount Paid</p>
            <p className="mt-1 text-3xl font-black text-emerald-800">SSP {paidAmount.toLocaleString()}</p>
            <p className="mt-1 text-xs font-bold text-emerald-700">PAID &amp; SETTLED</p>
          </div>

          <dl className="divide-y divide-slate-200 text-sm">
            {[
              ['Supplier', purchaseOrder.supplier_name || 'Supplier'],
              ['Purchase Order', purchaseOrder.po_number || 'N/A'],
              ['Supplier Invoice', purchaseOrder.supplier_invoice_number || 'N/A'],
              ['Goods Receipt Note', purchaseOrder.grn_number || 'N/A'],
              ['Payment Voucher', voucherNumber || 'N/A'],
              ['Transaction Reference', purchaseOrder.payment_reference || 'N/A'],
              ['Payment Method', purchaseOrder.payment_method || 'N/A'],
              ['Payment Date', paymentDate ? new Date(paymentDate).toLocaleDateString() : 'N/A'],
              ['Items', purchaseOrder.items_summary || purchaseOrder.item_name || 'Supplies'],
              ['Paid By', purchaseOrder.paid_by || 'ADRA Finance']
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-2.5">
                <dt className="font-semibold text-slate-500">{label}</dt>
                <dd className="text-right font-medium text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 border-t border-slate-200 pt-3 text-center text-[10px] text-slate-500">
            This electronic receipt confirms settlement of the supplier payment listed above.
          </p>
        </div>

        <div className="supplier-receipt-no-print flex shrink-0 gap-2 border-t border-slate-200 bg-slate-50 p-3 sm:p-4">
          <button
            type="button"
            onClick={handleDownload}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#006B56] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#005443]"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
