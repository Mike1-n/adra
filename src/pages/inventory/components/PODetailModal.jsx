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
  ArrowRight,
  FileText,
  FileCheck,
  Receipt,
  User,
  Phone,
  MapPin,
  Landmark,
  ShieldCheck,
  Printer,
  Trash2,
  RotateCcw,
  XCircle,
  AlertTriangle
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

  const isRejected = purchaseOrder.stage === -1 || Number(purchaseOrder.stage) === -1 || purchaseOrder.status === 'Returned & Rejected' || purchaseOrder.status?.includes('Returned') || purchaseOrder.status?.includes('Rejected');
  const currentStage = isRejected ? -1 : (Number(purchaseOrder.stage) || 
    (purchaseOrder.status === 'Paid & Settled' ? 4 :
     purchaseOrder.status.includes('Received') ? 3 :
     purchaseOrder.status.includes('Transit') || purchaseOrder.status.includes('Supplied') ? 2 : 1));

  const stages = [
    {
      num: 1,
      title: '1. Inventory Asks',
      subtitle: 'PO Requested',
      icon: ShoppingCart,
      isDone: !isRejected && currentStage >= 1,
      isCurrent: !isRejected && currentStage === 1,
      date: purchaseOrder.order_date,
      actor: purchaseOrder.requested_by || 'Gabriel Majok (Inventory Manager)'
    },
    {
      num: 2,
      title: '2. Supplier Supplies',
      subtitle: 'Dispatched & Invoiced',
      icon: Truck,
      isDone: !isRejected && currentStage >= 2,
      isCurrent: !isRejected && currentStage === 2,
      date: purchaseOrder.dispatched_at ? new Date(purchaseOrder.dispatched_at).toLocaleDateString() : 'Pending Supplier',
      actor: purchaseOrder.supplier_name
    },
    {
      num: 3,
      title: '3. Inventory Confirms',
      subtitle: 'GRN & Stock Received',
      icon: PackageCheck,
      isDone: !isRejected && currentStage >= 3,
      isCurrent: !isRejected && currentStage === 3,
      date: purchaseOrder.inspected_date || 'Pending Warehouse',
      actor: purchaseOrder.inspected_by || 'Gabriel Majok (Inventory Manager)'
    },
    {
      num: 4,
      title: '4. Finance Pays',
      subtitle: 'Payment Disbursed',
      icon: DollarSign,
      isDone: !isRejected && currentStage >= 4,
      isCurrent: !isRejected && currentStage === 4,
      date: purchaseOrder.paid_date || 'Pending Finance',
      actor: purchaseOrder.paid_by || 'Alex Morgan (Finance Officer)'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-4 sm:my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 shrink-0">
              <ShoppingCart className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-teal-300">{purchaseOrder.po_number}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  isRejected ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  currentStage === 4 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  currentStage === 3 ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' :
                  currentStage === 2 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                  'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {isRejected ? 'Returned & Rejected' : purchaseOrder.status}
                </span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight text-white mt-0.5">
                Supply Lifecycle & Purchase Order Audit
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
              title="Print Order"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Rejection Alert Banner if Rejected */}
        {isRejected && (
          <div className="bg-rose-50 border-b border-rose-200 p-4 sm:p-5 flex items-start gap-3 text-rose-950">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-extrabold text-rose-900 text-sm">Consignment Rejected & Returned to Vendor</p>
              <p className="font-semibold text-rose-800">
                Reason: <span className="font-normal">{purchaseOrder.return_reason || 'Goods failed warehouse inspection'}</span>
              </p>
              {purchaseOrder.return_notes && (
                <p className="text-rose-700">Notes: {purchaseOrder.return_notes}</p>
              )}
              {purchaseOrder.returned_at && (
                <p className="text-[11px] text-rose-600 font-mono">
                  Processed on: {new Date(purchaseOrder.returned_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 4-Stage Lifecycle Stepper */}
        {!isRejected && (
          <div className="bg-slate-50 border-b border-slate-200/80 p-4 sm:p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {stages.map(s => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.num}
                    className={`p-3 rounded-2xl border transition relative flex flex-col justify-between ${
                      s.isDone && !s.isCurrent ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' :
                      s.isCurrent ? 'bg-white border-[#006B56] shadow-sm ring-2 ring-[#006B56]/20' :
                      'bg-slate-100/60 border-slate-200/60 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                        s.isDone && !s.isCurrent ? 'bg-emerald-600 text-white' :
                        s.isCurrent ? 'bg-[#006B56] text-white' :
                        'bg-slate-200 text-slate-500'
                      }`}>
                        {s.isDone && !s.isCurrent ? '✓' : s.num}
                      </span>
                      <Icon className={`w-4 h-4 ${
                        s.isDone ? 'text-emerald-700' :
                        s.isCurrent ? 'text-[#006B56]' : 'text-slate-400'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[11px] leading-tight block truncate text-slate-900">{s.title}</h4>
                      <span className="text-[10px] text-slate-500 block truncate font-medium">{s.subtitle}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed Sections */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          
          {/* 1. Purchase Order Summary */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order Overview</span>
              <span className="font-black text-slate-900 font-mono text-base sm:text-lg">
                SSP {Number(purchaseOrder.total_amount).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Commodities Ordered</span>
                <p className="font-bold text-slate-900 mt-0.5">{purchaseOrder.items_summary}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  {purchaseOrder.category}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Destination Depot</span>
                <p className="font-bold text-slate-900 mt-0.5">{purchaseOrder.warehouse_destination}</p>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Expected Delivery: <strong>{purchaseOrder.expected_delivery || 'Immediate'}</strong>
                </span>
              </div>
            </div>

            {purchaseOrder.notes && (
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
                <span className="font-bold text-slate-700">Order Notes: </span>
                <span>{purchaseOrder.notes}</span>
              </div>
            )}
          </div>

          {/* 2. Supplier & Banking Information */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">Supplier / Vendor Partner</span>
              </div>
              <span className="text-[11px] font-bold text-slate-700">{purchaseOrder.supplier_name}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact</span>
                <span className="text-slate-800 font-medium">{supplier?.contact_person || 'Procurement Lead'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Email / Phone</span>
                <span className="text-slate-800 font-medium">{purchaseOrder.supplier_email || supplier?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Bank Account</span>
                <span className="text-slate-800 font-medium">{supplier?.bank_name || 'Commercial Bank'} ({supplier?.bank_account_no || 'ACC: 0180-2294-88'})</span>
              </div>
            </div>
          </div>

          {/* 3. Stage Audit Proofs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Stage 2: Supplier Dispatch Proof */}
            <div className={`p-3.5 rounded-2xl border ${
              currentStage >= 2 ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-200 opacity-60'
            }`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Truck className={`w-4 h-4 ${currentStage >= 2 ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="text-xs font-extrabold text-slate-900">Supplier Dispatch</span>
              </div>
              {currentStage >= 2 ? (
                <div className="space-y-1 text-[11px] text-slate-700">
                  <p>Invoice: <strong className="font-mono text-blue-800">{purchaseOrder.supplier_invoice_number || 'INV-2026'}</strong></p>
                  <p>Carrier: <span>{purchaseOrder.carrier_name || 'Direct Transport'}</span></p>
                  {purchaseOrder.truck_plate_number && <p>Truck: <span>{purchaseOrder.truck_plate_number}</span></p>}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">Awaiting supplier dispatch</p>
              )}
            </div>

            {/* Stage 3: Inventory GRN Proof */}
            <div className={`p-3.5 rounded-2xl border ${
              currentStage >= 3 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-60'
            }`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <PackageCheck className={`w-4 h-4 ${currentStage >= 3 ? 'text-emerald-700' : 'text-slate-400'}`} />
                <span className="text-xs font-extrabold text-slate-900">GRN Receipt</span>
              </div>
              {currentStage >= 3 ? (
                <div className="space-y-1 text-[11px] text-slate-700">
                  <p>GRN Ref: <strong className="font-mono text-emerald-800">{purchaseOrder.grn_number || 'GRN-SS-VERIFIED'}</strong></p>
                  <p>Inspected: <strong>{purchaseOrder.inspected_date || 'Verified'}</strong></p>
                  <p>Warehouse: <span>{purchaseOrder.receiving_warehouse || purchaseOrder.warehouse_destination}</span></p>
                  <p className="text-emerald-700 font-bold text-[10px]">✓ Stock Credited to Depot</p>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">Awaiting warehouse GRN</p>
              )}
            </div>

            {/* Stage 4: Finance Settlement Proof */}
            <div className={`p-3.5 rounded-2xl border ${
              currentStage >= 4 ? 'bg-teal-50/50 border-teal-200' : 'bg-slate-50 border-slate-200 opacity-60'
            }`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <DollarSign className={`w-4 h-4 ${currentStage >= 4 ? 'text-teal-600' : 'text-slate-400'}`} />
                <span className="text-xs font-extrabold text-slate-900">Finance Settlement</span>
              </div>
              {currentStage >= 4 ? (
                <div className="space-y-1 text-[11px] text-slate-700">
                  <p>Voucher: <strong className="font-mono text-teal-800">{purchaseOrder.payment_voucher_number || 'PV-SS'}</strong></p>
                  <p>Tx Ref: <strong className="font-mono">{purchaseOrder.payment_reference || 'TX-EFT'}</strong></p>
                  <p>Paid Date: <span>{purchaseOrder.paid_date}</span></p>
                  <p className="text-teal-700 font-bold text-[10px]">✓ Settled in Full</p>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">Awaiting finance payout</p>
              )}
            </div>

          </div>

        </div>

        {/* Footer & Dynamic Action Buttons */}
        <div className="bg-slate-50 p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Current Status: <strong className="text-slate-800">{purchaseOrder.status}</strong>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
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
                className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer border border-rose-200 flex items-center gap-1.5"
                title="Delete Purchase Order"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete PO</span>
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
                className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                title="Reject consignment & return goods to vendor"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reject & Return</span>
              </button>
            )}

            {/* Rejected / Returned -> Allow Supplier to Resend Replacement Consignment */}
            {isRejected && onOpenSupplierDispatch && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSupplierDispatch(purchaseOrder);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#006B56] hover:bg-[#005443] rounded-xl shadow-xs transition active:scale-[0.99] cursor-pointer flex items-center gap-1.5"
              >
                <Truck className="w-4 h-4" />
                <span>Resend Replacement Consignment</span>
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
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition active:scale-[0.99] cursor-pointer flex items-center gap-1.5"
              >
                <Truck className="w-4 h-4" />
                <span>Supply & Dispatch Goods (Vendor)</span>
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
                className="px-4 py-2 text-xs font-bold text-white bg-[#006B56] hover:bg-[#005443] rounded-xl shadow-xs transition active:scale-[0.99] cursor-pointer flex items-center gap-1.5"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Confirm GRN & Receive Stock (Inventory)</span>
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
                className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition active:scale-[0.99] cursor-pointer flex items-center gap-1.5"
              >
                <DollarSign className="w-4 h-4" />
                <span>Pay Supplier & Settle PO (Finance)</span>
              </button>
            )}

            {/* Stage 4 -> Completed */}
            {currentStage === 4 && (
              <div className="px-3.5 py-1.5 rounded-xl bg-teal-100 text-teal-800 font-bold text-xs flex items-center gap-1.5 border border-teal-300">
                <CheckCircle2 className="w-4 h-4 text-teal-700" />
                <span>Cycle Fully Completed & Settled</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
