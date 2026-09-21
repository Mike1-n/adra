import React, { useState } from 'react';
import {
  Activity,
  Plus,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  Users,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function FieldWorkerActivitiesView({
  activities = [],
  worker = {},
  onCreateActivity
}) {
  const toast = useToast();
  const [showLogModal, setShowLogModal] = useState(false);
  const [newLog, setNewLog] = useState({
    activity_type: 'Household Audit',
    title: '',
    details: '',
    location: `${worker.payam || 'Kapoeta Town'}, ${worker.boma || 'Machi'}`
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newLog.title.trim()) {
      toast.error('Please enter an activity title');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateActivity({
        ...newLog,
        worker_id: worker.id || 'fw-1',
        worker_name: worker.name || 'John Deng'
      });
      toast.success('Field activity logged successfully!');
      setShowLogModal(false);
      setNewLog({
        activity_type: 'Household Audit',
        title: '',
        details: '',
        location: `${worker.payam || 'Kapoeta Town'}, ${worker.boma || 'Machi'}`
      });
    } catch (err) {
      toast.error(err.message || 'Failed to log activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      
      {/* HEADER */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Daily Field Activity Logs</h2>
          <p className="text-xs text-slate-500 mt-0.5">Record visits, outreach meetings & verification milestones</p>
        </div>

        <button
          type="button"
          onClick={() => setShowLogModal(true)}
          className="px-3.5 py-2 bg-[#006B56] hover:bg-[#005a48] text-white text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Log Activity
        </button>
      </div>

      {/* TIMELINE LIST */}
      {activities.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
          <Activity className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No activity logs recorded today</h3>
          <p className="text-xs text-slate-500">Tap "Log Activity" above to create your first field visit note.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((act, idx) => (
            <div
              key={act.id || idx}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    act.activity_type === 'Aid Distribution' ? 'bg-blue-100 text-blue-700' :
                    act.activity_type === 'Community Outreach' ? 'bg-purple-100 text-purple-700' :
                    'bg-emerald-100 text-[#006B56]'
                  }`}>
                    {act.activity_type === 'Aid Distribution' ? <CheckCircle2 className="w-4 h-4" /> :
                     act.activity_type === 'Community Outreach' ? <Users className="w-4 h-4" /> :
                     <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{act.title}</h3>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {act.activity_type || 'Field Verification'}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                </span>
              </div>

              <p className="text-xs text-slate-600 pl-10">
                {act.details}
              </p>

              <div className="pl-10 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {act.location || `${worker.payam || 'Kapoeta Town'}, ${worker.county || 'Kapoeta South'}`}
                </span>
                <span>By: {act.worker_name || worker.name || 'John Deng'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NEW ACTIVITY MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">New Field Activity Log</h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Activity Category</label>
                <select
                  value={newLog.activity_type}
                  onChange={(e) => setNewLog({ ...newLog, activity_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                >
                  <option>Household Audit</option>
                  <option>Community Outreach</option>
                  <option>Aid Distribution</option>
                  <option>Boma Assessment</option>
                  <option>Security / Access Check</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Title / Summary *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Conducted food verification in Machi"
                  value={newLog.title}
                  onChange={(e) => setNewLog({ ...newLog, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Location / Boma</label>
                <input
                  type="text"
                  value={newLog.location}
                  onChange={(e) => setNewLog({ ...newLog, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Activity Notes & Key Findings</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Details of the field engagement, beneficiaries reached, or observations..."
                  value={newLog.details}
                  onChange={(e) => setNewLog({ ...newLog, details: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#006B56] hover:bg-[#005a48] text-white font-bold rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Save Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
