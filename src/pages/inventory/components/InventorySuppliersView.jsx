import React, { useState, useMemo } from 'react';
import {
  Building2,
  ShoppingCart,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  PackageCheck,
  DollarSign,
  Truck,
  Eye,
  Trash2,
  RotateCcw,
  XCircle
} from 'lucide-react';
import { SupplierDispatchModal } from './SupplierDispatchModal';
import { ConfirmPOReceiptModal } from './ConfirmPOReceiptModal';
import { PODetailModal } from './PODetailModal';
import { CreateSupplierModal } from './CreateSupplierModal';
import { ReturnPOModal } from './ReturnPOModal';

export function InventorySuppliersView({
  suppliers = [],
  purchaseOrders = [],
  warehouses = [],
  subTab,
  onSubTabChange,
  onOpenCreatePOModal,
  onSupplierDispatch,
  onConfirmReceipt,
  onRejectAndReturnPO,
  onCreateSupplier,
  onDeletePO
}) {
  const [internalTab, setInternalTab] = useState('all'); // 'all' | 'stage1' | 'stage2' | 'stage3' | 'stage4' | 'returned' | 'suppliers'
  const activeTab = subTab !== undefined ? subTab : internalTab;
  const setActiveTab = (tab) => {
    if (onSubTabChange) onSubTabChange(tab);
    setInternalTab(tab);
  };
  const [searchTerm, setSearchTerm] = useState('');

  // Modal active states
  const [selectedPOForDetail, setSelectedPOForDetail] = useState(null);
  const [selectedPOForDispatch, setSelectedPOForDispatch] = useState(null);
  const [selectedPOForGRN, setSelectedPOForGRN] = useState(null);
  const [selectedPOForReturn, setSelectedPOForReturn] = useState(null);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);

  // Helper to determine numerical stage
  const getPOStage = (po) => {
    if (po.stage === -1 || Number(po.stage) === -1 || po.status === 'Returned & Rejected' || po.status?.includes('Returned') || po.status?.includes('Rejected')) return -1;
    if (po.stage) return Number(po.stage);
    if (po.status === 'Paid & Settled' || po.payment_status === 'Paid') return 4;
    if (po.status?.includes('Received') || po.status?.includes('Confirmed') || po.grn_number) return 3;
    if (po.status?.includes('Transit') || po.status?.includes('Supplied') || po.waybill_number) return 2;
    return 1;
  };

  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter(po => {
      const q = searchTerm.toLowerCase();
      const matches =
        (po.po_number || '').toLowerCase().includes(q) ||
        (po.supplier_name || '').toLowerCase().includes(q) ||
        (po.items_summary || '').toLowerCase().includes(q) ||
        (po.warehouse_destination || '').toLowerCase().includes(q) ||
        (po.grn_number || '').toLowerCase().includes(q) ||
        (po.supplier_invoice_number || '').toLowerCase().includes(q);

      if (!matches) return false;

      const stage = getPOStage(po);
      if (activeTab === 'stage1' && stage !== 1) return false;
      if (activeTab === 'stage2' && stage !== 2) return false;
      if (activeTab === 'stage3' && stage !== 3) return false;
      if (activeTab === 'stage4' && stage !== 4) return false;
      if (activeTab === 'returned' && stage !== -1) return false;

      return true;
    });
  }, [purchaseOrders, searchTerm, activeTab]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const q = searchTerm.toLowerCase();
      return (
        (s.company_name || '').toLowerCase().includes(q) ||
        (s.category || '').toLowerCase().includes(q) ||
        (s.contact_person || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q)
      );
    });
  }, [suppliers, searchTerm]);

  const pipelineStats = useMemo(() => {
    let stage1Count = 0;
    let stage2Count = 0;
    let stage3Count = 0;
    let stage4Count = 0;
    let returnedCount = 0;
    let totalVal = 0;

    purchaseOrders.forEach(po => {
      const val = Number(po.total_amount) || 0;
      totalVal += val;
      const st = getPOStage(po);
      if (st === 1) stage1Count++;
      else if (st === 2) stage2Count++;
      else if (st === 3) stage3Count++;
      else if (st === 4) stage4Count++;
      else if (st === -1) returnedCount++;
    });

    return {
      total: purchaseOrders.length,
      totalVal,
      stage1Count,
      stage2Count,
      stage3Count,
      stage4Count,
      returnedCount
    };
  }, [purchaseOrders]);

  return (
    <div className="space-y-4">
      
      {/* 1. TOP STATS BAR - PM STYLE */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Stage 1 */}
        <div
          onClick={() => setActiveTab('stage1')}
          className={`rounded-2xl p-3.5 border transition cursor-pointer flex flex-col justify-between shadow-2xs ${
            activeTab === 'stage1'
              ? 'bg-amber-100/90 border-amber-400 ring-2 ring-amber-300'
              : 'bg-amber-50/70 border-amber-200/80 hover:bg-amber-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-950">1. Requested</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-2xs">
              <ShoppingCart className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-950 tracking-tight">{pipelineStats.stage1Count}</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-200/90 text-amber-900 border border-amber-300">
              Awaiting Supply
            </span>
          </div>
        </div>

        {/* Stage 2 */}
        <div
          onClick={() => setActiveTab('stage2')}
          className={`rounded-2xl p-3.5 border transition cursor-pointer flex flex-col justify-between shadow-2xs ${
            activeTab === 'stage2'
              ? 'bg-blue-100/90 border-blue-400 ring-2 ring-blue-300'
              : 'bg-blue-50/70 border-blue-200/80 hover:bg-blue-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-950">2. In Transit</span>
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-950 tracking-tight">{pipelineStats.stage2Count}</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-200/90 text-blue-900 border border-blue-300">
              En Route
            </span>
          </div>
        </div>

        {/* Stage 3 */}
        <div
          onClick={() => setActiveTab('stage3')}
          className={`rounded-2xl p-3.5 border transition cursor-pointer flex flex-col justify-between shadow-2xs ${
            activeTab === 'stage3'
              ? 'bg-emerald-100/90 border-emerald-400 ring-2 ring-emerald-300'
              : 'bg-emerald-50/70 border-emerald-200/80 hover:bg-emerald-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-950">3. GRN Received</span>
            <div className="w-7 h-7 rounded-lg bg-[#006B56] text-white flex items-center justify-center shadow-2xs">
              <PackageCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-950 tracking-tight">{pipelineStats.stage3Count}</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-200/90 text-emerald-900 border border-emerald-300">
              Stock Ingested
            </span>
          </div>
        </div>

        {/* Stage 4 */}
        <div
          onClick={() => setActiveTab('stage4')}
          className={`rounded-2xl p-3.5 border transition cursor-pointer flex flex-col justify-between shadow-2xs ${
            activeTab === 'stage4'
              ? 'bg-teal-100/90 border-teal-400 ring-2 ring-teal-300'
              : 'bg-teal-50/70 border-teal-200/80 hover:bg-teal-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-950">4. Paid & Settled</span>
            <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-2xs">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-teal-950 tracking-tight">{pipelineStats.stage4Count}</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-teal-200/90 text-teal-900 border border-teal-300">
              Completed
            </span>
          </div>
        </div>

      </div>

      {/* 2. CONTROLS BAR: SEARCH & ACTIONS (OPTIMIZED FOR MOBILE & DESKTOP) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
        
        {/* Active Stage Filter Tag / Title */}
        <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Filtered By:</span>
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
              activeTab === 'stage1' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
              activeTab === 'stage2' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
              activeTab === 'stage3' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
              activeTab === 'stage4' ? 'bg-teal-100 text-teal-900 border border-teal-300' :
              activeTab === 'returned' ? 'bg-rose-100 text-rose-900 border border-rose-300' :
              activeTab === 'suppliers' ? 'bg-slate-100 text-slate-800 border border-slate-300' :
              'bg-[#006B56]/10 text-[#006B56] border border-[#006B56]/20'
            }`}>
              {activeTab === 'stage1' ? '1. Requested' :
               activeTab === 'stage2' ? '2. In Transit' :
               activeTab === 'stage3' ? '3. GRN Received' :
               activeTab === 'stage4' ? '4. Paid' :
               activeTab === 'returned' ? `Returned & Rejected (${pipelineStats.returnedCount})` :
               activeTab === 'suppliers' ? 'Suppliers Directory' :
               'All Purchase Orders'}
            </span>
            {pipelineStats.returnedCount > 0 && activeTab !== 'returned' && (
              <button
                type="button"
                onClick={() => setActiveTab('returned')}
                className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg hover:bg-rose-100 cursor-pointer transition flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3 text-rose-600" />
                <span>{pipelineStats.returnedCount} Returned</span>
              </button>
            )}
          </div>

          {activeTab !== 'all' && (
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className="text-xs font-bold text-[#006B56] hover:text-[#005443] hover:underline cursor-pointer shrink-0"
            >
              Show All
            </button>
          )}
        </div>

        {/* Search & New PO Actions (Full-width responsive flow) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search PO #, supplier, items..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50/70 border border-slate-200 focus:border-[#006B56] focus:bg-white outline-none text-slate-900 font-medium transition"
            />
          </div>

          {/* Action Buttons: 2-column on phone, inline on desktop */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsAddSupplierOpen(true)}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/80 active:scale-95"
              title="Register new supplier"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Add Supplier</span>
            </button>

            <button
              type="button"
              onClick={onOpenCreatePOModal}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Request Supplies</span>
            </button>
          </div>
        </div>

      </div>

      {/* 3. ORDERS LIST */}
      {activeTab !== 'suppliers' && (
        <div className="space-y-3">
          {filteredPOs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-slate-400" />
              <h4 className="font-bold text-slate-800 text-sm">No Purchase Orders Found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
                {activeTab === 'stage1' ? 'No orders awaiting supplier dispatch.' :
                 activeTab === 'stage2' ? 'No consignments currently in transit.' :
                 activeTab === 'stage3' ? 'No orders awaiting finance disbursement.' :
                 'Click "Request Supplies" to issue a purchase order to an approved supplier.'}
              </p>
              <button
                type="button"
                onClick={onOpenCreatePOModal}
                className="px-4 py-2 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Request Supplies (Create PO)</span>
              </button>
            </div>
          ) : (
            filteredPOs.map(po => {
              const stage = getPOStage(po);

              return (
                <div
                  key={po.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition space-y-3"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-slate-900 text-sm">{po.po_number}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        stage === -1 ? 'bg-rose-100 text-rose-900 border border-rose-200' :
                        stage === 4 ? 'bg-teal-100 text-teal-900 border border-teal-200' :
                        stage === 3 ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                        stage === 2 ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                        'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}>
                        {stage === -1 ? `Returned: ${po.status}` : `Stage ${stage}: ${po.status}`}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">
                        {po.supplier_name}
                      </span>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="font-mono font-black text-[#006B56] text-base">
                        {Number(po.total_amount) > 0 ? `SSP ${Number(po.total_amount).toLocaleString()}` : 'Quote Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800">{po.items_summary}</p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>Dest: <strong className="text-slate-700">{po.warehouse_destination}</strong></span>
                      <span>• Ordered: <strong>{po.order_date}</strong></span>
                      {po.supplier_invoice_number && <span>• Invoice: <strong className="text-blue-700 font-mono">{po.supplier_invoice_number}</strong></span>}
                      {po.waybill_number && <span>• Waybill: <strong className="text-slate-800 font-mono">{po.waybill_number}</strong></span>}
                      {po.grn_number && <span>• GRN: <strong className="text-[#006B56] font-mono">{po.grn_number}</strong></span>}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedPOForDetail(po)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-slate-200"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>

                    {/* Quick Stage Execution Buttons */}
                    {stage === 1 && (
                      <button
                        type="button"
                        onClick={() => setSelectedPOForDispatch(po)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-[0.99] cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Dispatch Shipment (Vendor)</span>
                      </button>
                    )}

                    {stage === 2 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPOForReturn(po)}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 shadow-2xs transition active:scale-[0.99] cursor-pointer"
                          title="Reject consignment & return to supplier"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reject & Return</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPOForGRN(po)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-[0.99] cursor-pointer"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Confirm GRN</span>
                        </button>
                      </div>
                    )}

                    {stage === 3 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPOForReturn(po)}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 shadow-2xs transition active:scale-[0.99] cursor-pointer"
                          title="Reject items & return to supplier"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reject & Return</span>
                        </button>
                        <span className="text-xs text-emerald-800 font-bold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                          <PackageCheck className="w-3.5 h-3.5 text-[#006B56]" />
                          <span>✓ GRN Issued &bull; Forwarded to Finance for Payment</span>
                        </span>
                      </div>
                    )}

                    {stage === 4 && (
                      <span className="text-xs text-teal-800 font-bold flex items-center gap-1 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                        <span>Settled & Paid in Full</span>
                      </span>
                    )}

                    {stage === -1 && (
                      <span className="text-xs text-rose-800 font-bold flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                        <span>Returned & Rejected {po.return_reason ? `(${po.return_reason})` : ''}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 4. SUPPLIERS DIRECTORY TAB */}
      {activeTab === 'suppliers' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Registered Suppliers Directory</h3>
              <p className="text-xs text-slate-500">Official approved vendors for humanitarian aid procurement</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddSupplierOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Supplier</span>
            </button>
          </div>

          {filteredSuppliers.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="font-bold text-slate-800 text-xs">No Suppliers Registered</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Click "Add New Supplier" to register your first vendor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {filteredSuppliers.map(s => (
                <div key={s.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{s.company_name}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                      {s.category || 'Supplier'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Contact: <strong className="text-slate-800">{s.contact_person || 'N/A'}</strong> {s.phone ? `(${s.phone})` : ''}
                  </p>
                  <p className="text-slate-500 text-[11px] font-mono">
                    Bank: {s.bank_name || 'N/A'} • Acc: {s.bank_account_no || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      <PODetailModal
        isOpen={Boolean(selectedPOForDetail)}
        onClose={() => setSelectedPOForDetail(null)}
        purchaseOrder={selectedPOForDetail}
        supplier={suppliers.find(s => s.id === selectedPOForDetail?.supplier_id || s.company_name === selectedPOForDetail?.supplier_name)}
        onOpenSupplierDispatch={(po) => setSelectedPOForDispatch(po)}
        onOpenConfirmReceipt={(po) => setSelectedPOForGRN(po)}
        onOpenRejectAndReturn={(po) => setSelectedPOForReturn(po)}
        onDeletePO={onDeletePO}
      />

      <SupplierDispatchModal
        isOpen={Boolean(selectedPOForDispatch)}
        onClose={() => setSelectedPOForDispatch(null)}
        purchaseOrder={selectedPOForDispatch}
        onDispatchSuccess={onSupplierDispatch}
      />

      <ConfirmPOReceiptModal
        isOpen={Boolean(selectedPOForGRN)}
        onClose={() => setSelectedPOForGRN(null)}
        purchaseOrder={selectedPOForGRN}
        warehouses={warehouses}
        onConfirmSuccess={onConfirmReceipt}
      />

      <ReturnPOModal
        isOpen={Boolean(selectedPOForReturn)}
        onClose={() => setSelectedPOForReturn(null)}
        purchaseOrder={selectedPOForReturn}
        onReturnSuccess={onRejectAndReturnPO}
      />

      <CreateSupplierModal
        isOpen={isAddSupplierOpen}
        onClose={() => setIsAddSupplierOpen(false)}
        onSupplierSuccess={onCreateSupplier}
      />

    </div>
  );
}
