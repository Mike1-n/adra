import React, { useState } from 'react';
import {
  X,
  DollarSign,
  Send,
  Fuel,
  Users,
  Droplets,
  ClipboardList,
  ShieldAlert,
  Clock,
  MapPin,
  FileText,
  Smartphone,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Building2,
  ArrowRight
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

const FUNDING_CATEGORIES = [
  { id: 'Transport & Vehicle Fuel', label: 'Transport & Fuel', icon: Fuel },
  { id: 'Survey & Assessment Incidentals', label: 'Household Audit & Survey', icon: ClipboardList },
  { id: 'Community Mobilization & Hall Rental', label: 'Community Mobilization', icon: Users },
  { id: 'Security & Guide Allowances', label: 'Boma Guide & Security', icon: ShieldAlert },
  { id: 'Emergency Water & Relief Incidentals', label: 'Relief Incidentals', icon: Droplets }
];

const URGENCY_OPTIONS = [
  { id: 'Standard SLA (48h)', label: 'Standard (48h)' },
  { id: 'Urgent (24h)', label: 'Urgent (24h)' },
  { id: 'Immediate Emergency (Same Day)', label: 'Emergency (Same Day)' }
];

const PAYMENT_METHODS = [
  { id: 'm-Gurush Mobile Money', label: 'm-Gurush Mobile', icon: Smartphone },
  { id: 'Cash at Sub-Office', label: 'Cash at Hub', icon: DollarSign },
  { id: 'Bank Transfer (Stanbic)', label: 'Bank Transfer', icon: Building2 }
];

export function FieldFundingRequestModal({
  isOpen,
  onClose,
  worker = {},
  tasks = [],
  initialTask = null,
  onSubmitFundingRequest
}) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Linked Task state
  const [selectedTaskId, setSelectedTaskId] = useState(
    initialTask?.id || initialTask?.request_code || (tasks.length > 0 ? (tasks[0].id || tasks[0].request_code) : 'general-territory-ops')
  );

  const [category, setCategory] = useState(FUNDING_CATEGORIES[0].id);
  const [urgency, setUrgency] = useState(URGENCY_OPTIONS[0].id);
  const [preferredPayout, setPreferredPayout] = useState(PAYMENT_METHODS[0].id);
  const [payoutPhone, setPayoutPhone] = useState(worker.phone || '+211-921-550101');
  const [purpose, setPurpose] = useState('');
  const [projectName, setProjectName] = useState('Emergency Food Security & Livelihoods Resilience (EFSLR)');
  
  // Itemized line items (in South Sudanese Pound - SSP)
  const [breakdown, setBreakdown] = useState([
    { item: 'Fuel / Motorbike transport for Boma visit', amount: 150000 },
    { item: 'Local guide allowance & logistics', amount: 80000 }
  ]);

  const selectedTask = React.useMemo(() => {
    return tasks.find(t => t.id === selectedTaskId || t.request_code === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  React.useEffect(() => {
    if (initialTask) {
      const taskId = initialTask.id || initialTask.request_code;
      setSelectedTaskId(taskId);
      if (initialTask.program_name || initialTask.project_name) {
        setProjectName(initialTask.program_name || initialTask.project_name);
      }
      setPurpose(`Field operational facilitation & transport for conducting household vulnerability audit for ${initialTask.beneficiary_name} (${initialTask.request_code}) in ${initialTask.payam || worker.payam || 'Kapoeta Town'}.`);
    } else if (tasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(tasks[0].id || tasks[0].request_code);
    }
  }, [initialTask, tasks]);

  if (!isOpen) return null;

  const totalAmount = breakdown.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  const handleAddBreakdownRow = () => {
    setBreakdown(prev => [...prev, { item: '', amount: '' }]);
  };

  const handleRemoveBreakdownRow = (index) => {
    if (breakdown.length <= 1) return;
    setBreakdown(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateBreakdown = (index, field, value) => {
    setBreakdown(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: field === 'amount' ? (value === '' ? '' : Number(value)) : value };
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!purpose.trim()) {
      toast.error('Please provide an operational purpose and justification for the funding request.');
      return;
    }
    if (totalAmount <= 0) {
      toast.error('Total requested amount must be greater than 0 SSP.');
      return;
    }

    try {
      setSubmitting(true);
      const targetTask = selectedTask || tasks.find(t => t.id === selectedTaskId || t.request_code === selectedTaskId);

      const payload = {
        field_worker_id: worker.id || 'fw-1',
        field_worker_name: worker.name || 'John Deng',
        field_worker_email: worker.email || 'john.deng@adra.org',
        field_worker_phone: worker.phone || payoutPhone,
        supervisor_id: 'sup-1',
        supervisor_name: worker.supervisor_name || 'Emmanuel Adeyemi',
        program_manager_name: 'Grace Ochieng',
        linked_task_id: targetTask?.id || selectedTaskId || null,
        linked_request_code: targetTask?.request_code || (selectedTaskId === 'general-territory-ops' ? 'GEN-TERRITORY-OPS' : 'ADR-REQ-GEN'),
        linked_beneficiary_name: targetTask?.beneficiary_name || `${worker.payam || 'Kapoeta Town'} Community Verification`,
        linked_location: targetTask?.payam || worker.payam || 'Kapoeta Town',
        payam: targetTask?.payam || worker.payam || 'Kapoeta Town',
        county: targetTask?.county || worker.county || 'Kapoeta South',
        state: targetTask?.state || worker.state || 'Eastern Equatoria',
        project_name: projectName,
        category,
        amount: totalAmount,
        currency: 'SSP',
        purpose,
        breakdown: breakdown.filter(b => b.item && Number(b.amount) > 0),
        urgency,
        preferred_payout: preferredPayout,
        payout_phone: payoutPhone
      };

      await onSubmitFundingRequest(payload);
      toast.success(`Funding request of ${totalAmount.toLocaleString()} SSP linked to assignment ${payload.linked_request_code} submitted for Supervisor review.`);
      onClose();
    } catch (err) {
      console.error('Error submitting funding request:', err);
      toast.error('Failed to submit funding request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-2.5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-h-[95%] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Minimalist Header */}
        <div className="px-4 py-3 bg-[#006B56] text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-extrabold text-sm text-white flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-300" />
              <span>Field Facilitation Requisition</span>
            </h2>
            <p className="text-[10px] text-emerald-100 font-medium mt-0.5">
              Approval: {worker.supervisor_name || 'Emmanuel Adeyemi'} &rarr; PM Grace &rarr; Finance
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/15 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Minimalist Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3.5 space-y-3 text-slate-800">
          
          {/* 1. Linked Assignment */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <ClipboardList className="w-3.5 h-3.5 text-[#006B56]" />
                <span>Linked Assignment</span>
              </label>
              <span className="text-[9px] font-bold text-[#006B56] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Mandatory
              </span>
            </div>

            {tasks.length === 0 ? (
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>General route verification in <strong>{worker.payam || 'Kapoeta Town'}</strong>.</span>
              </div>
            ) : (
              <select
                value={selectedTaskId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedTaskId(newId);
                  const found = tasks.find(t => t.id === newId || t.request_code === newId);
                  if (found) {
                    setProjectName(found.program_name || found.project_name || projectName);
                    setPurpose(`Field operational facilitation & transport for conducting household vulnerability audit for ${found.beneficiary_name} (${found.request_code}) in ${found.payam || worker.payam || 'Kapoeta Town'}.`);
                  }
                }}
                className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#006B56] focus:bg-white outline-none text-slate-900 transition"
                required
              >
                <option value="" disabled>-- Select Assigned Field Case --</option>
                {tasks.map(t => (
                  <option key={t.id || t.request_code} value={t.id || t.request_code}>
                    #{t.request_code} • {t.beneficiary_name} ({t.payam || 'Kapoeta Town'})
                  </option>
                ))}
                <option value="general-territory-ops">
                  📍 General Territory Outreach ({worker.payam || 'Kapoeta Town'} Zone)
                </option>
              </select>
            )}
          </div>

          {/* 2. Category & Urgency */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs font-medium p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#006B56] outline-none text-slate-900"
              >
                {FUNDING_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Urgency
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full text-xs font-medium p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#006B56] outline-none text-slate-900"
              >
                {URGENCY_OPTIONS.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Itemized Expenses (Clean & Prominent Add Button) */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-900">
                Itemized Expenses
              </label>
              <button
                type="button"
                onClick={handleAddBreakdownRow}
                className="px-2.5 py-1 bg-[#006B56] hover:bg-[#005a48] text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {breakdown.map((row, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Expense item (e.g. Fuel, Guide)..."
                    value={row.item}
                    onChange={(e) => handleUpdateBreakdown(idx, 'item', e.target.value)}
                    className="flex-1 text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#006B56] focus:bg-white outline-none font-medium"
                    required
                  />
                  <div className="relative w-28 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">SSP</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="0"
                      value={row.amount}
                      onChange={(e) => handleUpdateBreakdown(idx, 'amount', e.target.value)}
                      className="w-full text-xs font-bold pl-9 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#006B56] focus:bg-white outline-none text-right"
                      required
                    />
                  </div>
                  {breakdown.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBreakdownRow(idx)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer shrink-0"
                      title="Remove line"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Total Callout */}
            <div className="mt-1.5 p-2 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-950">Total Requested Amount:</span>
              <span className="text-sm font-black text-[#006B56]">
                {totalAmount.toLocaleString()} SSP
              </span>
            </div>
          </div>

          {/* 4. Purpose & Justification */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Purpose & Justification
            </label>
            <textarea
              rows={2}
              placeholder="Why funds are required for this assignment..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#006B56] focus:bg-white outline-none transition font-medium"
              required
            />
          </div>

          {/* 5. Disbursement Channel */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Payout Channel
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {PAYMENT_METHODS.map(pm => {
                const isSelected = preferredPayout === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPreferredPayout(pm.id)}
                    className={`py-2 px-1 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-[#006B56] border-[#006B56] text-white font-bold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <pm.icon className={`w-3.5 h-3.5 mb-0.5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                    <span className={`text-[10px] font-bold leading-tight block ${isSelected ? 'text-white' : 'text-slate-900'}`}>{pm.label}</span>
                  </button>
                );
              })}
            </div>

            {preferredPayout === 'm-Gurush Mobile Money' && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="relative flex-1">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={payoutPhone}
                    onChange={(e) => setPayoutPhone(e.target.value)}
                    placeholder="+211-920-000000"
                    className="w-full text-xs font-semibold pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#006B56] focus:bg-white outline-none"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-500 shrink-0 font-medium">Payout Phone</span>
              </div>
            )}
          </div>

        </form>

        {/* Minimalist Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || totalAmount <= 0}
            className="py-2 px-4 bg-[#006B56] hover:bg-[#005a48] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit Requisition ({totalAmount.toLocaleString()} SSP)</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
