import React, { useState, useEffect } from 'react';
import { X, Truck, FileText } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function SupplierDispatchModal({
  isOpen,
  onClose,
  purchaseOrder,
  onDispatchSuccess
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [unitPrice, setUnitPrice] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [carrierName, setCarrierName] = useState('Nile Express Logistics Ltd');
  const [vehiclePlate, setVehiclePlate] = useState('SSD-204B');

  const qty = purchaseOrder ? (Number(purchaseOrder.quantity) || (parseInt(purchaseOrder.items_summary) || 1)) : 1;
  const unit = purchaseOrder?.unit || 'Units';
  const itemName = purchaseOrder?.item_name || purchaseOrder?.items_summary || 'Supplies';

  useEffect(() => {
    if (purchaseOrder && isOpen) {
      const orderQty = Number(purchaseOrder.quantity) || (parseInt(purchaseOrder.items_summary) || 1);
      const existingUnitPrice = purchaseOrder.unit_cost 
        ? String(purchaseOrder.unit_cost) 
        : (purchaseOrder.total_amount && orderQty > 0 ? String(purchaseOrder.total_amount / orderQty) : '');

      setUnitPrice(existingUnitPrice);
      setInvoiceNumber(purchaseOrder.supplier_invoice_number || `INV-SUP-${Date.now().toString().slice(-4)}`);
      setCarrierName(purchaseOrder.carrier_name || 'Nile Express Logistics Ltd');
      setVehiclePlate(purchaseOrder.vehicle_plate || 'SSD-204B');
    }
  }, [purchaseOrder, isOpen]);

  if (!isOpen || !purchaseOrder) return null;

  const totalBilled = (Number(unitPrice) || 0) * qty;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) {
      toast.error('Please enter a Supplier Invoice Number.');
      return;
    }
    if (Number(unitPrice) <= 0) {
      toast.error(`Please enter a price for 1 ${unit.replace(/s$/, '')}.`);
      return;
    }

    setLoading(true);
    try {
      if (onDispatchSuccess) {
        await onDispatchSuccess(purchaseOrder.id, {
          supplier_invoice_number: invoiceNumber.trim(),
          carrier_name: carrierName.trim(),
          vehicle_plate: vehiclePlate.trim(),
          unit_cost: Number(unitPrice) || 0,
          total_amount: totalBilled,
          dispatched_at: new Date().toISOString()
        });
      }
      toast.success(`Consignment dispatched! Total: SSP ${totalBilled.toLocaleString()}.`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to record supplier dispatch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-4 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Clean Header */}
        <div className="bg-[#006B56] px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Supplier Dispatch</h3>
              <p className="text-xs text-white/80">{purchaseOrder.po_number} &bull; {purchaseOrder.supplier_name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Concise Consignment Header */}
        <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900">
            {qty.toLocaleString()} {unit} {itemName}
          </span>
          <span className="text-slate-500 font-medium">
            Dest: <strong className="text-slate-700">{purchaseOrder.warehouse_destination}</strong>
          </span>
        </div>

        {/* Clean Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Price per 1 {unit.replace(/s$/, '')} (SSP) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">SSP</span>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  required
                  autoFocus
                  placeholder="0.00"
                  className="w-full pl-11 pr-3 py-2 text-xs font-bold text-slate-900 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Supplier Invoice # *
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
                placeholder="INV-SUP-001"
                className="w-full px-3 py-2 text-xs font-medium text-slate-900 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Carrier / Transport
              </label>
              <input
                type="text"
                value={carrierName}
                onChange={(e) => setCarrierName(e.target.value)}
                placeholder="e.g. Nile Express"
                className="w-full px-3 py-2 text-xs font-medium text-slate-900 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Truck / Plate #
              </label>
              <input
                type="text"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                placeholder="SSD-204B"
                className="w-full px-3 py-2 text-xs font-medium text-slate-900 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#006B56] outline-none"
              />
            </div>
          </div>

          {/* Dynamic Total Banner */}
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
            <span className="text-emerald-800 font-semibold">
              Total Invoiced ({qty.toLocaleString()} {unit}):
            </span>
            <span className="font-extrabold text-[#006B56] text-sm">
              SSP {totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-[#006B56] hover:bg-[#005443] rounded-xl shadow-xs transition active:scale-[0.99] cursor-pointer flex items-center gap-1.5"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Truck className="w-4 h-4" />
              )}
              <span>Confirm & Dispatch</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
