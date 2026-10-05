import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Table,
  Building2,
  Calendar,
  DollarSign,
  PackageCheck,
  Truck,
  SlidersHorizontal,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function InventoryReportsView({
  inventory = [],
  dispatches = [],
  purchaseOrders = [],
  transactions = [],
  warehouses = []
}) {
  const toast = useToast();
  const [reportType, setReportType] = useState('stock_balance'); // 'stock_balance' | 'grn_ledger' | 'waybill_log' | 'transactions_audit'
  const [selectedWarehouse, setSelectedWarehouse] = useState('ALL');

  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    const timestamp = new Date().toISOString().split('T')[0];
    let filename = `ADRA_Inventory_${reportType}_${timestamp}.csv`;

    if (reportType === 'stock_balance') {
      headers = ['SKU', 'Item Name', 'Category', 'Warehouse', 'Quantity', 'Unit', 'Unit Cost (USD)', 'Total Value (USD)', 'Batch Number', 'Expiry Date', 'Status'];
      const filtered = selectedWarehouse === 'ALL' ? inventory : inventory.filter(i => i.warehouse === selectedWarehouse);
      rows = filtered.map(i => [
        `"${i.sku || i.id}"`,
        `"${i.item_name}"`,
        `"${i.category}"`,
        `"${i.warehouse}"`,
        i.quantity,
        `"${i.unit}"`,
        i.unit_cost || 0,
        (i.quantity * (i.unit_cost || 0)).toFixed(2),
        `"${i.batch_number || 'N/A'}"`,
        `"${i.expiry_date || 'N/A'}"`,
        `"${i.status}"`
      ]);
    } else if (reportType === 'waybill_log') {
      headers = ['Waybill No', 'Token', 'Origin Warehouse', 'Destination', 'Transport Mode', 'Vehicle Reg', 'Driver', 'Date', 'Status', 'Line Items Count'];
      rows = dispatches.map(d => [
        `"${d.waybill_number}"`,
        `"${d.dispatch_token}"`,
        `"${d.origin_warehouse}"`,
        `"${d.destination}"`,
        `"${d.transport_mode}"`,
        `"${d.vehicle_reg}"`,
        `"${d.driver_name}"`,
        `"${d.dispatch_date}"`,
        `"${d.status}"`,
        d.items?.length || 0
      ]);
    } else if (reportType === 'transactions_audit') {
      headers = ['Transaction ID', 'Type', 'Reference Code', 'Item Name', 'Quantity Change', 'Unit', 'Warehouse', 'Date', 'Performed By', 'Notes'];
      rows = transactions.map(t => [
        `"${t.id}"`,
        `"${t.transaction_type}"`,
        `"${t.reference_code}"`,
        `"${t.item_name}"`,
        t.quantity,
        `"${t.unit || 'Units'}"`,
        `"${t.warehouse}"`,
        `"${t.date}"`,
        `"${t.performed_by}"`,
        `"${t.notes?.replace(/"/g, '""') || ''}"`
      ]);
    } else {
      headers = ['PO Number', 'Supplier', 'Category', 'Items Summary', 'Total Amount ($)', 'Destination Warehouse', 'Order Date', 'Expected Delivery', 'Status'];
      rows = purchaseOrders.map(p => [
        `"${p.po_number}"`,
        `"${p.supplier_name}"`,
        `"${p.category}"`,
        `"${p.items_summary?.replace(/"/g, '""') || ''}"`,
        p.total_amount,
        `"${p.warehouse_destination}"`,
        `"${p.order_date}"`,
        `"${p.expected_delivery || 'N/A'}"`,
        `"${p.status}"`
      ]);
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filename} successfully!`);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredInventory = selectedWarehouse === 'ALL'
    ? inventory
    : inventory.filter(i => i.warehouse === selectedWarehouse);

  const totalValue = filteredInventory.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_cost || 0)), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Control Card (Hidden on Print) */}
      <div className="bg-white p-3.5 sm:p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#006B56]" />
              Humanitarian Stock Reports & Audit Ledger
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Generate stock balance statements, delivery logs, and waybill records.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-[0.99] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-[0.99] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Report Switcher & Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setReportType('stock_balance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                reportType === 'stock_balance'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Stock Balance</span>
            </button>

            <button
              type="button"
              onClick={() => setReportType('waybill_log')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                reportType === 'waybill_log'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Waybills Log</span>
            </button>

            <button
              type="button"
              onClick={() => setReportType('grn_ledger')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                reportType === 'grn_ledger'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Purchase Orders</span>
            </button>

            <button
              type="button"
              onClick={() => setReportType('transactions_audit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                reportType === 'transactions_audit'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Stock Ledger</span>
            </button>
          </div>

          {reportType === 'stock_balance' && (
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none hover:border-slate-300"
            >
              <option value="ALL">🏢 All State Warehouses</option>
              {warehouses.map(w => (
                <option key={w.id || w.code} value={w.name}>
                  {w.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Printable Report Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-8 space-y-5 text-slate-800 text-xs font-sans print:shadow-none print:border-none print:p-0">
        
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#006B56] text-white flex items-center justify-center font-black text-sm shrink-0">
                A
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-none">
                  ADRA SOUTH SUDAN LOGISTICS & INVENTORY REPORT
                </h1>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Humanitarian Supply Chain Audit Ledger
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 mt-2">
              Logistics Base Compound B, Juba Central Industrial Area • Juba, South Sudan
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block px-3 py-1 rounded-md font-mono font-extrabold text-xs bg-slate-100 border border-slate-300 text-slate-900 uppercase">
              {reportType.replace(/_/g, ' ')}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* REPORT 1: STOCK BALANCE */}
        {reportType === 'stock_balance' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                Physical Stock Balance Summary ({selectedWarehouse === 'ALL' ? `All ${warehouses.length} State Warehouses` : selectedWarehouse})
              </span>
              <span className="font-mono font-bold text-emerald-800">
                Total Valuation: ${totalValue.toLocaleString()}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-[11px] font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Commodity Description</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Warehouse</th>
                    <th className="py-2.5 px-3 text-right">Available</th>
                    <th className="py-2.5 px-3 text-right">Unit Value</th>
                    <th className="py-2.5 px-3 text-right">Total ($)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredInventory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{item.sku || item.id}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{item.item_name}</td>
                      <td className="py-2 px-3 text-slate-600">{item.category}</td>
                      <td className="py-2 px-3 text-slate-700">{item.warehouse}</td>
                      <td className="py-2 px-3 text-right font-mono font-extrabold text-emerald-900">
                        {Number(item.quantity).toLocaleString()} {item.unit}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700">
                        ${Number(item.unit_cost || 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        ${(Number(item.quantity) * Number(item.unit_cost || 0)).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'Low Stock' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT 2: WAYBILLS LOG */}
        {reportType === 'waybill_log' && (
          <div className="space-y-3">
            <span className="font-bold text-slate-900 text-xs sm:text-sm block">
              Dispatched Humanitarian Convoys & Waybills Manifest Log
            </span>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-[11px] font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">Waybill No</th>
                    <th className="py-2.5 px-3">QR Token</th>
                    <th className="py-2.5 px-3">Origin Hub</th>
                    <th className="py-2.5 px-3">Destination Site</th>
                    <th className="py-2.5 px-3">Driver / Convoy</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dispatches.map((d, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{d.waybill_number}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-emerald-800">{d.dispatch_token}</td>
                      <td className="py-2 px-3 text-slate-700">{d.origin_warehouse}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{d.destination}</td>
                      <td className="py-2 px-3 text-slate-600">{d.driver_name} ({d.vehicle_reg})</td>
                      <td className="py-2 px-3 text-slate-600">{d.dispatch_date}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800">
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT 3: PURCHASE ORDERS */}
        {reportType === 'grn_ledger' && (
          <div className="space-y-3">
            <span className="font-bold text-slate-900 text-xs sm:text-sm block">
              Humanitarian Procurement Orders & Goods Delivery Ledger
            </span>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-[11px] font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">PO Number</th>
                    <th className="py-2.5 px-3">Supplier Name</th>
                    <th className="py-2.5 px-3">Items Summary</th>
                    <th className="py-2.5 px-3 text-right">Amount ($)</th>
                    <th className="py-2.5 px-3">Destination</th>
                    <th className="py-2.5 px-3">Order Date</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {purchaseOrders.map((p, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{p.po_number}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{p.supplier_name}</td>
                      <td className="py-2 px-3 text-slate-600">{p.items_summary}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">${Number(p.total_amount).toLocaleString()}</td>
                      <td className="py-2 px-3 text-slate-700">{p.warehouse_destination}</td>
                      <td className="py-2 px-3 text-slate-600">{p.order_date}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT 4: TRANSACTIONS AUDIT */}
        {reportType === 'transactions_audit' && (
          <div className="space-y-3">
            <span className="font-bold text-slate-900 text-xs sm:text-sm block">
              Immutable Stock Movement Ledger (GRNs, Dispatches & Adjustments)
            </span>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-[11px] font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">Ref Code</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-right">Quantity Change</th>
                    <th className="py-2.5 px-3">Warehouse</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Performed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {transactions.map((t, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{t.reference_code}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                          {t.transaction_type}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{t.item_name}</td>
                      <td className="py-2 px-3 text-right font-mono font-extrabold">
                        <span className={Number(t.quantity) < 0 ? 'text-rose-600' : 'text-emerald-700'}>
                          {Number(t.quantity) > 0 ? `+${t.quantity}` : t.quantity} {t.unit || 'Units'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-700">{t.warehouse}</td>
                      <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{new Date(t.date).toISOString().split('T')[0]}</td>
                      <td className="py-2 px-3 text-slate-700">{t.performed_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Verification Signatures */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-300 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Prepared & Verified By:</span>
            <p className="font-bold text-slate-900">Inventory & Logistics Officer</p>
            <p className="text-[11px] text-slate-500">Logistics Department, ADRA South Sudan</p>
            <div className="mt-3 border-b border-slate-300 w-48" />
            <span className="text-[10px] text-slate-400 block mt-1">Official Logistics Stamp</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Endorsed By Country Leadership:</span>
            <p className="font-bold text-slate-900">Programme Management & Country Operations</p>
            <p className="text-[11px] text-slate-500">ADRA South Sudan Mission HQ</p>
            <div className="mt-3 border-b border-slate-300 w-48" />
            <span className="text-[10px] text-slate-400 block mt-1">Date & Authorization</span>
          </div>
        </div>
      </div>
    </div>
  );
}
