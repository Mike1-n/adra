import React, { useState, useMemo } from 'react';
import {
  Building2,
  DollarSign,
  PackageCheck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Eye,
  FileCheck,
  Receipt,
  Landmark,
  User,
  Calendar,
  AlertCircle,
  XCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  FileText,
  MapPin
} from 'lucide-react';
import { PaySupplierModal } from '../../inventory/components/PaySupplierModal';
import { PODetailModal } from '../../inventory/components/PODetailModal';

export function FinanceSupplierPaymentsView({
  purchaseOrders = [],
  suppliers = [],
  activeFilter = 'pending_payment',
  onFilterChange,
  onOpenSidebar,
  onPaySupplier,
  onRefresh
}) {
  const [internalFilter, setInternalFilter] = useState('pending_payment');
  const filter = onFilterChange ? activeFilter : internalFilter;
  const setFilter = onFilterChange || setInternalFilter;

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRowId, setExpandedRowId] = useState(null);

  const [selectedPOForPay, setSelectedPOForPay] = useState(null);
  const [selectedPOForDetail, setSelectedPOForDetail] = useState(null);

  const getStage = (po) => {
    if (po.stage === -1 || Number(po.stage) === -1 || po.status === 'Returned & Rejected' || po.status?.includes('Returned') || po.status?.includes('Rejected')) return -1;
    if (po.stage) return Number(po.stage);
    if (po.status === 'Paid & Settled' || po.payment_status === 'Paid') return 4;
    if (po.status.includes('Received') || po.status.includes('Confirmed') || po.grn_number) return 3;
    if (po.status.includes('Transit') || po.status.includes('Supplied')) return 2;
    return 1;
  };

  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter(po => {
      const q = searchTerm.toLowerCase();
      const matches =
        (po.po_number || '').toLowerCase().includes(q) ||
        (po.supplier_name || '').toLowerCase().includes(q) ||
        (po.items_summary || '').toLowerCase().includes(q) ||
        (po.grn_number || '').toLowerCase().includes(q) ||
        (po.supplier_invoice_number || '').toLowerCase().includes(q) ||
        (po.payment_voucher_number || '').toLowerCase().includes(q);

      if (!matches) return false;

      const stage = getStage(po);
      if (filter === 'pending_payment' && stage !== 3) return false;
      if (filter === 'paid' && stage !== 4) return false;
      if (filter === 'returned' && stage !== -1) return false;

      return true;
    });
  }, [purchaseOrders, searchTerm, filter]);

  const handlePaySuccess = async (poId, paymentData) => {
    if (onPaySupplier) {
      await onPaySupplier(poId, paymentData);
    }
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-4">
      
      {/* Search Bar */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search PO #, vendor, GRN, invoice..."
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200/80 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 outline-none text-slate-900 font-medium transition shadow-2xs"
        />
      </div>

      {/* 3. NUMBERED PO DATA TABLE / CARDS (Optimized for Mobile Phone Mode) */}
      <div className="space-y-2.5">
        {filteredPOs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 p-6">
            <DollarSign className="w-9 h-9 mx-auto mb-2 text-slate-300" />
            <h4 className="font-bold text-slate-700 text-xs sm:text-sm">No Purchase Orders Found</h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
              {filter === 'pending_payment'
                ? 'No supplier consignments are currently waiting for payment disbursement.'
                : filter === 'paid'
                ? 'No disbursed vendor vouchers found in this filter.'
                : 'No purchase orders matching your search query.'}
            </p>
          </div>
        ) : (
          filteredPOs.map((po, index) => {
            const stage = getStage(po);
            const isReadyForPayment = stage === 3;
            const isPaid = stage === 4;
            const isReturned = stage === -1;
            const sup = suppliers.find(s => s.id === po.supplier_id || s.company_name === po.supplier_name);
            const isExpanded = expandedRowId === po.id;
            const rowNumber = index + 1;

            return (
              <div
                key={po.id}
                className={`bg-white rounded-2xl border transition shadow-2xs overflow-hidden ${
                  isReturned ? 'border-rose-200' : isReadyForPayment ? 'border-amber-200' : 'border-slate-200/80'
                }`}
              >
                {/* Main Visible Card Row: Number + PO/Vendor + Amount + Action */}
                <div className="p-3.5 flex items-center justify-between gap-3">
                  {/* Left: Row Number & Vendor/PO summary */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-mono font-black text-xs shrink-0 border border-slate-200">
                      {rowNumber}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                          {po.po_number}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 truncate">
                          {po.supplier_name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                        {po.items_summary || 'Humanitarian supplies'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount & Status / Quick Pay */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="font-mono font-black text-xs sm:text-sm text-slate-900 block leading-tight">
                        SSP {Number(po.total_amount).toLocaleString()}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-0.5 uppercase tracking-wide ${
                        isReturned ? 'bg-rose-50 text-rose-800' :
                        isPaid ? 'bg-emerald-50 text-emerald-800' :
                        isReadyForPayment ? 'bg-amber-100 text-amber-900' :
                        'bg-blue-50 text-blue-800'
                      }`}>
                        {isReturned ? 'Returned' : isPaid ? 'Paid' : isReadyForPayment ? 'Ready' : po.status}
                      </span>
                    </div>

                    {isReadyForPayment && (
                      <button
                        type="button"
                        onClick={() => setSelectedPOForPay(po)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition active:scale-95 cursor-pointer"
                        title="Disburse Payment"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Pay</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible View More Information Bar */}
                <button
                  type="button"
                  onClick={() => setExpandedRowId(isExpanded ? null : po.id)}
                  className="w-full px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100/80 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-600 transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{isExpanded ? 'Hide Details' : 'View More Information'}</span>
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="p-3.5 bg-slate-50/50 border-t border-slate-100 space-y-2.5 text-xs animate-in fade-in-50 duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Consignment & Invoices</span>
                        <p className="font-medium text-slate-800 mt-0.5">
                          Invoice: <strong className="font-mono text-blue-700">{po.supplier_invoice_number || 'INV-ATTACHED'}</strong>
                        </p>
                        {po.grn_number && (
                          <p className="font-medium text-slate-800 mt-0.5">
                            GRN: <strong className="font-mono text-emerald-800">{po.grn_number}</strong>
                          </p>
                        )}
                        <p className="font-medium text-slate-800 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{po.warehouse_destination || 'Central Warehouse Depot'}</span>
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Settlement Account</span>
                        <p className="font-medium text-slate-800 mt-0.5">
                          Bank: <strong className="text-slate-900">{sup?.bank_name || 'Designated Bank'}</strong>
                        </p>
                        <p className="font-medium text-slate-800 mt-0.5 font-mono">
                          ACC: {sup?.bank_account_no || '211-009-881'}
                        </p>
                        {po.payment_voucher_number && (
                          <p className="font-bold text-purple-700 mt-0.5 font-mono">
                            Voucher: {po.payment_voucher_number}
                          </p>
                        )}
                      </div>
                    </div>

                    {isReturned && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-900">
                        <strong>Rejection Reason:</strong> {po.return_reason || 'Damaged goods in transit.'}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPOForDetail(po)}
                        className="px-3 py-1 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-950 bg-white border border-slate-200 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>View Full Audit Trail</span>
                      </button>

                      {isReadyForPayment && (
                        <button
                          type="button"
                          onClick={() => setSelectedPOForPay(po)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Disburse Payment (SSP {Number(po.total_amount).toLocaleString()})</span>
                        </button>
                      )}

                      {isPaid && (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Settled in Full</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <PaySupplierModal
        isOpen={Boolean(selectedPOForPay)}
        onClose={() => setSelectedPOForPay(null)}
        purchaseOrder={selectedPOForPay}
        supplier={suppliers.find(s => s.id === selectedPOForPay?.supplier_id || s.company_name === selectedPOForPay?.supplier_name)}
        onPaySuccess={handlePaySuccess}
      />

      <PODetailModal
        isOpen={Boolean(selectedPOForDetail)}
        onClose={() => setSelectedPOForDetail(null)}
        purchaseOrder={selectedPOForDetail}
        supplier={suppliers.find(s => s.id === selectedPOForDetail?.supplier_id || s.company_name === selectedPOForDetail?.supplier_name)}
        onOpenPaySupplier={(po) => setSelectedPOForPay(po)}
      />

    </div>
  );
}
