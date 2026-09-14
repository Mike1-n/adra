import React from 'react';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  RotateCcw,
  Briefcase,
  Calendar
} from 'lucide-react';

export function SupervisorWorkerDetailsView({
  worker,
  assignments = [],
  onBack,
  onSelectAssignment
}) {
  if (!worker) return null;

  // Filter assignments linked to this worker
  const workerAssignments = assignments.filter(
    a => a.assigned_field_worker_id === worker.id || a.assigned_field_worker_name === worker.name
  );

  const statusStyles = {
    'Available': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'On Assignment': 'bg-blue-100 text-blue-800 border-blue-200',
    'Busy': 'bg-amber-100 text-amber-800 border-amber-200',
    'Offline': 'bg-slate-100 text-slate-600 border-slate-200'
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="bg-gradient-to-r from-[#006B56] to-[#004D3D] text-white p-4 sticky top-0 z-30 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold leading-tight">Field Worker Profile</h1>
            <p className="text-xs text-emerald-200/90 font-mono">Team ID: {worker.id}</p>
          </div>
        </div>

        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusStyles[worker.current_status] || 'bg-white/20 text-white'}`}>
          {worker.current_status}
        </span>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4 flex-1 pb-24 max-w-xl mx-auto w-full">
        
        {/* Worker Profile Card */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex items-center space-x-4">
            <img
              src={worker.avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150'}
              alt={worker.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#006B56]/20 shadow-xs"
            />
            <div>
              <h2 className="text-lg font-bold text-slate-900">{worker.name}</h2>
              <p className="text-xs text-[#006B56] font-bold">Role: Field Officer / Mobilizer</p>
              <p className="text-xs text-slate-500 mt-0.5">{worker.programme || 'Emergency Food Security & Livelihoods'}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Operational Area:</span>
              </span>
              <span className="font-bold text-slate-800">{worker.assigned_area || `${worker.county || 'Kapoeta South'}, Eastern Equatoria`}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Phone:</span>
              </span>
              <a href={`tel:${worker.phone}`} className="font-bold text-[#006B56] hover:underline">{worker.phone}</a>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email:</span>
              </span>
              <span className="font-medium text-slate-700">{worker.email}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Last Activity:</span>
              </span>
              <span className="font-medium text-slate-600">{worker.last_activity || 'Active today'}</span>
            </div>
          </div>

          {/* Quick Contact Bar */}
          <div className="pt-2 grid grid-cols-2 gap-2">
            <a
              href={`tel:${worker.phone}`}
              className="py-2.5 bg-emerald-50 text-[#006B56] border border-emerald-200 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 hover:bg-emerald-100 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Voice Call</span>
            </a>
            <a
              href={`sms:${worker.phone}`}
              className="py-2.5 bg-blue-50 text-blue-700 border border-blue-200 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 hover:bg-blue-100 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send SMS</span>
            </a>
          </div>
        </div>

        {/* Performance Overview Cards */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Operational Performance Overview
          </h3>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Completed Assessments</span>
              <span className="text-xl font-black text-[#006B56]">{worker.completed_assignments || 28}</span>
              <span className="text-[10px] text-emerald-600 block">Verified in field</span>
            </div>

            <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-blue-800 uppercase block">Pending Assessments</span>
              <span className="text-xl font-black text-blue-700">{worker.active_assignments || 1}</span>
              <span className="text-[10px] text-blue-600 block">Currently active</span>
            </div>

            <div className="p-3 bg-purple-50/60 border border-purple-200/80 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-purple-800 uppercase block">Reports Submitted</span>
              <span className="text-xl font-black text-purple-700">{worker.reports_submitted || 28}</span>
              <span className="text-[10px] text-purple-600 block">Under quality review</span>
            </div>

            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Returned for Correction</span>
              <span className="text-xl font-black text-amber-700">{worker.reports_returned || 1}</span>
              <span className="text-[10px] text-amber-600 block">Quality adjustments</span>
            </div>
          </div>
        </div>

        {/* Current Active Assignments */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Briefcase className="w-4 h-4 text-[#006B56]" />
              <span>Current Assignments ({workerAssignments.length})</span>
            </h3>
          </div>

          {workerAssignments.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">No active assignments assigned to this worker.</p>
          ) : (
            <div className="space-y-2.5">
              {workerAssignments.map((a) => (
                <div
                  key={a.id || a.request_code}
                  onClick={() => onSelectAssignment && onSelectAssignment(a)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 cursor-pointer space-y-1.5 transition-all"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#006B56] font-mono">{a.request_code}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {a.status_label || a.status}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">{a.beneficiary_name} &bull; {a.assistance_type || a.category}</p>
                  <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{a.location || `${a.county}, ${a.payam}`}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
