import React from 'react';
import {
  History,
  Clock,
  User,
  Shield,
  FileText,
  UserCheck,
  RotateCcw,
  Send,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export function SupervisorActivityHistoryView({
  activities = []
}) {
  const getActionIcon = (action) => {
    switch (action) {
      case 'ASSIGN_WORKER':
        return <UserCheck className="w-4 h-4 text-[#006B56]" />;
      case 'SUBMIT_REPORT':
        return <FileText className="w-4 h-4 text-purple-600" />;
      case 'REQUEST_CORRECTION':
        return <RotateCcw className="w-4 h-4 text-amber-600" />;
      case 'FORWARD_REPORT':
        return <Send className="w-4 h-4 text-blue-600" />;
      case 'ACCEPT_TASK':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <History className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-3 pb-24">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
        <h2 className="text-base font-bold text-slate-900">Activity & Audit Timeline</h2>
        <p className="text-xs text-slate-500">Chronological history of supervisory actions and field operations</p>
      </div>

      {/* Timeline List */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 space-y-4">
        {activities.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No recent supervisor activity logged.</p>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {activities.map((act) => (
              <div key={act.id} className="relative group">
                <div className="absolute -left-[27px] top-0 w-6 h-6 rounded-full bg-white border-2 border-[#006B56] flex items-center justify-center shadow-xs">
                  {getActionIcon(act.action)}
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {act.user_name} <span className="text-[11px] font-normal text-slate-500">({act.role || 'Supervisor'})</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{act.created_at ? new Date(act.created_at).toLocaleDateString('en-GB') : 'Recent'}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {act.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
