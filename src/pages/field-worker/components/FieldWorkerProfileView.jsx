import React, { useState } from 'react';
import {
  User,
  MapPin,
  Phone,
  Mail,
  Shield,
  CheckCircle2,
  FileCheck,
  Award,
  Clock,
  Sparkles,
  ArrowRightLeft,
  LogOut,
  Calendar,
  Building
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function FieldWorkerProfileView({
  worker = {},
  dutyStatus = 'Available',
  onUpdateDutyStatus,
  onSwitchRole,
  onLogout
}) {
  const toast = useToast();
  const [selectedStatus, setSelectedStatus] = useState(dutyStatus);

  const handleSaveStatus = async (status) => {
    setSelectedStatus(status);
    await onUpdateDutyStatus(status);
    toast.success(`Duty status updated to ${status}`);
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      
      {/* 1. WORKER AVATAR & HERO CARD */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs text-center space-y-3 relative overflow-hidden">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#006B56] to-[#004d3d] text-white flex items-center justify-center font-black text-2xl mx-auto shadow-md">
          {worker.name ? worker.name.split(' ').map(n => n[0]).join('') : 'FW'}
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900">{worker.name || 'John Deng'}</h2>
          <p className="text-xs font-semibold text-[#006B56] mt-0.5">ADRA Humanitarian Field Worker</p>
          <span className="inline-block mt-1 text-[10px] font-mono text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            Officer ID: {worker.id || 'fw-1'}
          </span>
        </div>

        {/* Live Duty Toggle */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-700 block mb-2">Change Field Duty State</span>
          <div className="grid grid-cols-3 gap-1.5 max-w-xs mx-auto">
            {['Available', 'On Assignment', 'In Field'].map(st => (
              <button
                key={st}
                type="button"
                onClick={() => handleSaveStatus(st)}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition ${
                  dutyStatus === st
                    ? 'bg-[#006B56] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. STATS OVERVIEW */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-200 text-center">
          <span className="text-2xl font-black text-[#006B56] block">{worker.completed_assignments || 21}</span>
          <span className="text-[10px] font-bold text-emerald-950 uppercase">Audits Completed</span>
        </div>
        <div className="bg-blue-50 rounded-2xl p-3.5 border border-blue-200 text-center">
          <span className="text-2xl font-black text-blue-700 block">{worker.reports_submitted || 21}</span>
          <span className="text-[10px] font-bold text-blue-950 uppercase">Reports Submitted</span>
        </div>
      </div>

      {/* 3. ASSIGNMENT & SUPERVISOR INFO */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Building className="w-4 h-4 text-[#006B56]" />
          Field Operations Territory
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Responsible Supervisor</span>
            <span className="font-bold text-slate-800">{worker.supervisor_name || 'Emmanuel Adeyemi'}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">State / Province</span>
            <span className="font-bold text-slate-800">{worker.state || 'Eastern Equatoria'}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">County / Payam</span>
            <span className="font-bold text-slate-800">{worker.county || 'Kapoeta South'} ({worker.payam || 'Kapoeta Town'})</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Primary Programme</span>
            <span className="font-bold text-slate-800 text-right max-w-[200px] truncate">
              {worker.programme || 'Emergency Food Security & Livelihoods'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <span className="text-slate-500">Contact Phone</span>
            <span className="font-mono font-bold text-slate-800">{worker.phone || '+211-921-550101'}</span>
          </div>
        </div>
      </div>

      {/* 4. SWITCH ROLE & LOGOUT */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onSwitchRole('Supervisor')}
          className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-2xl transition flex items-center justify-center gap-2"
        >
          <ArrowRightLeft className="w-4 h-4 text-slate-600" />
          Switch Role: Supervisor (Emmanuel Adeyemi)
        </button>

        <button
          type="button"
          onClick={() => onSwitchRole('Administrator')}
          className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-2xl transition flex items-center justify-center gap-2"
        >
          <Shield className="w-4 h-4 text-[#006B56]" />
          Switch Role: Administrator (HQ Command)
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-2xl transition flex items-center justify-center gap-2 border border-red-200/60"
        >
          <LogOut className="w-4 h-4" />
          Sign Out of Field App
        </button>
      </div>

    </div>
  );
}
