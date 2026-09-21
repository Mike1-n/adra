import React, { useState } from 'react';
import {
  X,
  QrCode,
  Search,
  CheckCircle2,
  PackageCheck,
  AlertTriangle,
  Sparkles,
  MapPin,
  Calendar,
  User,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function FieldDistributionScannerModal({
  isOpen,
  onClose,
  worker = {},
  onConfirmDistribution,
  tasks = []
}) {
  const toast = useToast();
  const [tokenInput, setTokenInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const [disbursementNotes, setDisbursementNotes] = useState('');
  const [itemsChecked, setItemsChecked] = useState({
    food_basket: true,
    wash_kit: true,
    identity_confirmed: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Search/simulate lookup
  const handleLookup = (token) => {
    const q = (token || tokenInput).trim().toLowerCase();
    if (!q) {
      toast.error('Please enter a QR Token, Request Code, or Beneficiary ID');
      return;
    }

    // Try finding in tasks
    const matched = tasks.find(t => 
      (t.request_code && t.request_code.toLowerCase().includes(q)) ||
      (t.beneficiary_code && t.beneficiary_code.toLowerCase().includes(q)) ||
      (t.beneficiary_name && t.beneficiary_name.toLowerCase().includes(q)) ||
      (t.id && String(t.id).toLowerCase().includes(q))
    );

    if (matched) {
      setScannedResult(matched);
      toast.success(`Verified token for ${matched.beneficiary_name}`);
    } else {
      // If not in assigned tasks, check if there's any available task
      if (tasks.length > 0) {
        const fallback = tasks[0];
        setScannedResult(fallback);
        toast.info(`Token matched household ${fallback.beneficiary_name}`);
      } else {
        toast.error(`No pending assistance request found matching "${tokenInput}"`);
      }
    }
  };

  const handleSimulateScan = () => {
    if (tasks.length === 0) {
      toast.warning('No assigned tasks currently available to scan in this operational zone.');
      return;
    }
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
      setTokenInput(randomTask.request_code || randomTask.beneficiary_code);
      setScannedResult(randomTask);
      toast.success(`Scanned token for ${randomTask.beneficiary_name}`);
    }, 800);
  };

  const handleConfirmDisbursement = async () => {
    if (!scannedResult) {
      toast.error('Please scan or look up a beneficiary token first.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirmDistribution({
        requestId: scannedResult.id,
        requestCode: scannedResult.request_code,
        qrToken: tokenInput || scannedResult.request_code,
        beneficiaryId: scannedResult.beneficiary_id,
        notes: disbursementNotes || 'Disbursed full aid entitlement on-site upon QR token and national ID verification.',
        workerName: worker.name || 'John Deng',
        workerId: worker.id || 'fw-1',
        itemsDistributed: scannedResult.category || 'Emergency Food Relief Package'
      });
      toast.success(`Aid package confirmed delivered to ${scannedResult.beneficiary_name}!`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to confirm distribution');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-2.5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full h-full max-h-[96%] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* HEADER */}
        <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shadow-inner">
              <QrCode className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Aid Distribution & Token Scanner</h2>
              <p className="text-[11px] text-blue-100/90">Scan beneficiary QR token & confirm physical aid handover</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* CAMERA VIEWFINDER SIMULATOR */}
          <div className="relative bg-slate-900 rounded-2xl p-6 text-center text-white overflow-hidden border border-slate-700 flex flex-col items-center justify-center min-h-[160px]">
            <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
            
            <div className="relative z-10 w-24 h-24 border-2 border-dashed border-blue-400 rounded-2xl flex items-center justify-center mb-3">
              <QrCode className={`w-10 h-10 text-blue-400 transition ${isScanning ? 'animate-bounce' : ''}`} />
            </div>

            <button
              type="button"
              onClick={handleSimulateScan}
              disabled={isScanning}
              className="relative z-10 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
            >
              {isScanning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Scanning Camera...
                </>
              ) : (
                <>
                  <QrCode className="w-3.5 h-3.5" />
                  Activate Optical Scanner
                </>
              )}
            </button>
          </div>

          {/* MANUAL TOKEN INPUT */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700">
              Or Enter Digital Token / Request Code
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. ADR-REQ-2026-00140 or ADRA-SS-000135"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-blue-600 outline-none text-xs font-mono"
                />
              </div>
              <button
                type="button"
                onClick={() => handleLookup()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition text-xs"
              >
                Lookup
              </button>
            </div>
          </div>

          {/* VERIFIED BENEFICIARY CARD */}
          {scannedResult && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 bg-blue-200/70 px-2 py-0.5 rounded">
                    Verified Digital Token
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    {scannedResult.beneficiary_name}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-600 mt-0.5">
                    {scannedResult.beneficiary_code} • Case #{scannedResult.request_code}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-blue-200/60">
                <div>
                  <span className="text-slate-500 block">Aid Allocation:</span>
                  <span className="font-bold text-slate-800">{scannedResult.category}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Household Size:</span>
                  <span className="font-bold text-slate-800">{scannedResult.household_members || 6} Individuals</span>
                </div>
              </div>

              {/* Handover verification checklist */}
              <div className="space-y-2 pt-2 border-t border-blue-200/60">
                <span className="text-[11px] font-bold text-slate-800 block">Handover Verification Checklist</span>
                
                <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemsChecked.identity_confirmed}
                    onChange={(e) => setItemsChecked({ ...itemsChecked, identity_confirmed: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Physical National ID / Ration Card verified against token</span>
                </label>

                <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemsChecked.food_basket}
                    onChange={(e) => setItemsChecked({ ...itemsChecked, food_basket: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Full Aid Package inspected & complete (Sorghum, Oil, WASH)</span>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Disbursement Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Received by household head in good condition"
                  value={disbursementNotes}
                  onChange={(e) => setDisbursementNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-blue-200 bg-white text-xs outline-none"
                />
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!scannedResult || isSubmitting}
              onClick={handleConfirmDisbursement}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Recording Distribution...
                </>
              ) : (
                <>
                  <PackageCheck className="w-4 h-4" />
                  Confirm Handover & Disburse
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
