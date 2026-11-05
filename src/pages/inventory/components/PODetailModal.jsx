import React from 'react';
import {
  X,
  ShoppingCart,
  Truck,
  PackageCheck,
  DollarSign,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  Trash2,
  RotateCcw,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Receipt,
  FileCheck,
  MapPin,
  CreditCard,
  FileText
} from 'lucide-react';

export function PODetailModal({
  isOpen,
  onClose,
  purchaseOrder,
  supplier,
  onOpenSupplierDispatch,
  onOpenConfirmReceipt,
  onOpenPaySupplier,
  onOpenRejectAndReturn,
  onDeletePO
}) {
  if (!isOpen || !purchaseOrder) return null;

  const isRejected =
    purchaseOrder.stage === -1 ||
    Number(purchaseOrder.stage) === -1 ||
    purchaseOrder.status === 'Returned & Rejected' ||
    purchaseOrder.status?.includes('Returned') ||
    purchaseOrder.status?.includes('Rejected');

  const currentStage = isRejected
    ? -1
    : (Number(purchaseOrder.stage) ||
        (purchaseOrder.status === 'Paid & Settled'
          ? 4
          : purchaseOrder.status.includes('Received')
          ? 3
          : purchaseOrder.status.includes('Transit') || purchaseOrder.status.includes('Supplied')
          ? 2
          : 1));

  const steps = [
    { num: 1, label: 'Requested', role: 'Inventory', icon: ShoppingCart },
    { num: 2, label: 'Dispatched', role: 'Supplier', icon: Truck },
    { num: 3, label: 'GRN Received', role: 'Warehouse', icon: PackageCheck },
    { num: 4, label: 'Settled', role: 'Finance', icon: DollarSign }
  ];

  const totalAmount = Number(purchaseOrder.total_amount) || 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Phone-optimized container: max-h-[92vh] flex-col with sticky header & footer so nothing is hidden */}
      <div className="w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* 1. STICKY HEADER */}
        <div className="bg-slate-900 px-4 py-3 sm:px-6 sm:py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/10 shrink-0">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-teal-300">
                  {purchaseOrder.po_number}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider ${
                    isRejected
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : currentStage === 4
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : currentStage === 3
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : currentStage === 2
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {isRejected ? 'Returned & Rejected' : purchaseOrder.status}
                </span>
              </div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight text-white mt-0.5 truncate">
                Purchase Order Details
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
              title="Print Order"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Rejection Alert Banner if Rejected */}
        {isRejected && (
          <div className="bg-rose-50 border-b border-rose-200 p-3 sm:p-4 flex items-start gap-2.5 text-rose-950 shrink-0">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5 min-w-0">
              <p className="font-extrabold text-rose-900 text-xs sm:text-sm">Consignment Rejected & Returned</p>
              <p className="font-semibold text-rose-800 break-words">
                Reason: <span className="font-normal">{purchaseOrder.return_reason || 'Goods failed warehouse inspection'}</span>
              </p>
              {purchaseOrder.return_notes && (
                <p className="text-rose-700 break-words">Notes: {purchaseOrder.return_notes}</p>
              )}
              {purchaseOrder.returned_at && (
                <p className="text-[10px] text-rose-600 font-mono">
                  Processed on: {new Date(purchaseOrder.returned_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 2. COMPACT LIFECYCLE STEP TRACKER (Shrink-0, fits phone width cleanly) */}
        {!isRejected && (
          <div className="bg-slate-50 border-b border-slate-200/80 px-3 py-2.5 sm:px-6 sm:py-3 shrink-0">
            <div className="flex items-center justify-between relative max-w-lg mx-auto">
              {/* Connecting Background Line */}
              <div className="absolute left-4 right-4 top-3 h-0.5 bg-slate-200 -z-0" />
              <div
                className="absolute left-4 top-3 h-0.5 bg-[#006B56] transition-all duration-300 -z-0"
                style={{
                  width: `${Math.min(100, Math.max(0, ((currentStage - 1) / (steps.length - 1)) * 100))}%`
                }}
              />

              {steps.map((s) => {
                const isDone = currentStage > s.num || currentStage === 4;
                const isCurrent = currentStage === s.num && currentStage !== 4;

                return (
                  <div key={s.num} className="relative z-10 flex flex-col items-center text-center">
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all shadow-2xs ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-[#006B56] text-white ring-3 ring-[#006B56]/20'
                          : 'bg-white border-2 border-slate-300 text-slate-400'
                      }`}
                    >
                      {isDone ? '✓' : s.num}
                    </div>
                    <span
                      className={`text-[10px] sm:text-[11px] mt-1 font-bold ${
                        isCurrent
                          ? 'text-[#006B56]'
                          : isDone
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {s.label}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-slate-400 hidden sm:block">
                      {s.role}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. SCROLLABLE CONTENT BODY (flex-1 overflow-y-auto so all info is reachable) */}
        <div className="p-3.5 sm:p-6 space-y-3.5 flex-1 overflow-y-auto min-w-0">
          
          {/* Order Summary Card */}
          <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 space-y-2.5 min-w-0">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 gap-2 flex-wrap">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Commodities & Logistics
              </span>
              <div>
                {totalAmount > 0 ? (
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Amount</span>
                    <span className="font-black text-slate-900 font-mono text-sm sm:text-lg">
                      SSP {totalAmount.toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <Clock className="w-3 h-3 text-amber-600" />
                    Pending Quote
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="font-extrabold text-slate-900 text-xs sm:text-base leading-snug break-words">
                {purchaseOrder.items_summary}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  {purchaseOrder.category || 'General Supplies'}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                  Ordered: {purchaseOrder.order_date || 'N/A'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs border-t border-slate-200/60">
              <div className="flex items-start gap-1.5 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Destination Depot</span>
                  <p className="font-bold text-slate-800 text-[11px] sm:text-xs break-words">{purchaseOrder.warehouse_destination}</p>
                </div>
              </div>
              <div className="flex items-start gap-1.5 min-w-0">
                <Calendar className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Expected Delivery</span>
                  <p className="font-bold text-slate-800 text-[11px] sm:text-xs break-words">{purchaseOrder.expected_delivery || 'Immediate dispatch'}</p>
                </div>
              </div>
            </div>

            {/* Order Notes - Formatted cleanly so Waybill, Carrier, Invoice never overflow */}
            {purchaseOrder.notes && (
              <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600 bg-white/70 p-2.5 rounded-xl space-y-1">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                  <FileText className="w-3 h-3 text-slate-500" />
                  <span>Order Notes & References:</span>
                </div>
                <p className="text-[11px] text-slate-700 break-words leading-relaxed font-mono">
                  {purchaseOrder.notes}
                </p>
              </div>
            )}
          </div>

          {/* Supplier Partner Summary */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 space-y-2 min-w-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#006B56]" />
                <span className="text-xs font-bold text-slate-900">Vendor Partner</span>
              </div>
              <span className="text-xs font-extrabold text-slate-800 break-words">{purchaseOrder.supplier_name}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-0.5">
              <div className="min-w-0">
                <span className="text-slate-400 text-[9px] uppercase font-bold block">Contact Person</span>
                <span className="font-medium text-slate-800 text-[11px] sm:text-xs break-words">
                  {supplier?.contact_person || 'Procurement Representative'}
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-slate-400 text-[9px] uppercase font-bold block">Email / Phone</span>
                <span className="font-medium text-slate-800 text-[11px] sm:text-xs break-all">
                  {purchaseOrder.supplier_email || supplier?.email || supplier?.phone || 'Contact on file'}
                </span>
              </div>
            </div>

            {/* Remittance Bank Info */}
            {(supplier?.bank_name || supplier?.bank_account_no) && (
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 flex-wrap">
                <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="break-words">
                  Remittance Bank: <strong className="text-slate-700">{supplier.bank_name || 'Bank'}</strong> (Acc: <span className="font-mono">{supplier.bank_account_no}</span>)
                </span>
              </div>
            )}
          </div>

          {/* Lifecycle Status & Proofs */}
          <div className="space-y-2.5 min-w-0">
            <h4 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Lifecycle Status & Verification
            </h4>

            {/* Stage 1: Waiting on Supplier */}
            {!isRejected && currentStage === 1 && (
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-2.5 min-w-0">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950 space-y-0.5 min-w-0">
                  <p className="font-bold text-amber-900 text-xs sm:text-sm">Awaiting Supplier Dispatch</p>
                  <p className="text-amber-800 text-[11px] leading-relaxed break-words">
                    Purchase order issued to <strong>{purchaseOrder.supplier_name}</strong>. Once dispatched, invoice & carrier tracking details will appear below.
                  </p>
                </div>
              </div>
            )}

            {/* Stage 2 Proof: Supplier Dispatch details */}
            {currentStage >= 2 && !isRejected && (
              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-900">Vendor Dispatch Proof</span>
                  </div>
                  <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md shrink-0">
                    Dispatched ✓
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Invoice Number</span>
                    <strong className="font-mono text-blue-900 text-[11px] break-all">{purchaseOrder.supplier_invoice_number || 'INV-SUP-ATTACHED'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Logistics Carrier</span>
                    <span className="text-[11px] break-words">{purchaseOrder.carrier_name || 'Direct Transport'}</span>
                  </div>
                  {purchaseOrder.truck_plate_number && (
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Truck Plate</span>
                      <span className="font-mono text-[11px] break-words">{purchaseOrder.truck_plate_number}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stage 2 Active: Waiting on Warehouse GRN */}
            {currentStage === 2 && !isRejected && (
              <div className="p-3 rounded-2xl bg-teal-50/60 border border-teal-200 flex items-start gap-2.5 min-w-0">
                <PackageCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div className="text-xs text-teal-950 space-y-0.5 min-w-0">
                  <p className="font-bold text-teal-900 text-xs">Consignment in Transit to Depot</p>
                  <p className="text-teal-800 text-[11px] leading-relaxed break-words">
                    En route to <strong>{purchaseOrder.warehouse_destination}</strong>. Depot staff will inspect upon physical arrival and issue official GRN.
                  </p>
                </div>
              </div>
            )}

            {/* Stage 3 Proof: Inventory GRN Receipt */}
            {currentStage >= 3 && !isRejected && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="text-xs font-bold text-slate-900">Warehouse GRN & Verification</span>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                    Stock Credited ✓
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">GRN Ref</span>
                    <strong className="font-mono text-emerald-900 text-[11px] break-all">{purchaseOrder.grn_number || 'GRN-VERIFIED'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Inspected Date</span>
                    <span className="text-[11px] break-words">{purchaseOrder.inspected_date || 'Verified'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Receiving Depot</span>
                    <span className="text-[11px] break-words">{purchaseOrder.receiving_warehouse || purchaseOrder.warehouse_destination}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stage 3 Active: Waiting on Finance Payment */}
            {currentStage === 3 && !isRejected && (
              <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 flex items-start gap-2.5 min-w-0">
                <DollarSign className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 space-y-0.5 min-w-0">
                  <p className="font-bold text-slate-900 text-xs">Awaiting Finance Payout</p>
                  <p className="text-slate-600 text-[11px] leading-relaxed break-words">
                    Stock credited to inventory. Forwarded to Finance for invoice settlement.
                  </p>
                </div>
              </div>
            )}

            {/* Stage 4 Proof: Finance Settlement */}
            {currentStage >= 4 && !isRejected && (
              <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-teal-700 shrink-0" />
                    <span className="text-xs font-bold text-slate-900">Finance Settlement Voucher</span>
                  </div>
                  <span className="text-[9px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md shrink-0">
                    Settled in Full ✓
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Voucher</span>
                    <strong className="font-mono text-teal-900 text-[11px] break-all">{purchaseOrder.payment_voucher_number || 'PV-SETTLED'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Transaction Ref</span>
                    <strong className="font-mono text-slate-800 text-[11px] break-all">{purchaseOrder.payment_reference || 'EFT-TX'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Paid Date</span>
                    <span className="text-[11px] break-words">{purchaseOrder.paid_date || 'Settled'}</span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* 4. STICKY FOOTER (Always visible on phone screens, never cut off) */}
        <div className="bg-slate-50 p-3 sm:p-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <div className="text-[11px] text-slate-500 truncate">
            Current: <strong className="text-slate-800">{purchaseOrder.status}</strong>
          </div>

          <div className="flex items-center gap-2 justify-end flex-wrap">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-200/70 hover:bg-slate-200 rounded-xl transition cursor-pointer text-center"
            >
              Close
            </button>

            {/* Delete PO Action if provided */}
            {onDeletePO && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete Purchase Order ${purchaseOrder.po_number}?`)) {
                    onDeletePO(purchaseOrder.id || purchaseOrder.po_number);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer border border-rose-200 flex items-center justify-center gap-1"
                title="Delete Purchase Order"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}

            {/* Reject & Return button on Stage 2 & 3 */}
            {(currentStage === 2 || currentStage === 3) && onOpenRejectAndReturn && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRejectAndReturn(purchaseOrder);
                }}
                className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reject & Return</span>
              </button>
            )}

            {/* Rejected / Returned -> Allow Supplier to Resend */}
            {isRejected && onOpenSupplierDispatch && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSupplierDispatch(purchaseOrder);
                }}
                className="flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold text-white bg-[#006B56] hover:bg-[#005443] rounded-xl shadow-xs transition active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Resend Replacement</span>
              </button>
            )}

            {/* Stage 1 -> Trigger Supplier Dispatch */}
            {!isRejected && currentStage === 1 && onOpenSupplierDispatch && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSupplierDispatch(purchaseOrder);
                }}
                className="flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Dispatch Goods</span>
              </button>
            )}

            {/* Stage 2 -> Trigger Inventory GRN */}
            {currentStage === 2 && onOpenConfirmReceipt && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenConfirmReceipt(purchaseOrder);
                }}
                className="flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold text-white bg-[#006B56] hover:bg-[#005443] rounded-xl shadow-xs transition active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>Receive GRN Stock</span>
              </button>
            )}

            {/* Stage 3 -> Trigger Finance Payment */}
            {currentStage === 3 && onOpenPaySupplier && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPaySupplier(purchaseOrder);
                }}
                className="flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Disburse Payment</span>
              </button>
            )}

            {/* Stage 4 -> Completed */}
            {currentStage === 4 && (
              <div className="px-3 py-1 rounded-xl bg-teal-100 text-teal-800 font-bold text-[11px] flex items-center gap-1 border border-teal-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                <span>Cycle Fully Settled</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
