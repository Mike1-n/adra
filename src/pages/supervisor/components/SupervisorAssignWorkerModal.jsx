import React, { useState, useMemo } from 'react';
import {
  X,
  UserCheck,
  MapPin,
  Briefcase,
  Layers,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function SupervisorAssignWorkerModal({
  request,
  fieldWorkers,
  isOpen,
  onClose,
  onAssignSuccess
}) {
  const toast = useToast();
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(Date.now() + 48 * 3600000);
    return d.toISOString().split('T')[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Intelligent Prioritization Logic
  const prioritizedWorkers = useMemo(() => {
    if (!fieldWorkers || fieldWorkers.length === 0) return [];
    if (!request) return fieldWorkers;

    const reqArea = (request.county || request.location || '').toLowerCase();
    const reqProg = (request.program_name || request.programme_name || request.programme || '').toLowerCase();

    return [...fieldWorkers].sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // 1. Same assigned operational area
      const aArea = (a.county || a.assigned_area || '').toLowerCase();
      const bArea = (b.county || b.assigned_area || '').toLowerCase();
      if (reqArea && aArea.includes(reqArea)) scoreA += 100;
      if (reqArea && bArea.includes(reqArea)) scoreB += 100;

      // 2. Same program
      const aProg = (a.programme || a.programme_name || '').toLowerCase();
      const bProg = (b.programme || b.programme_name || '').toLowerCase();
      if (reqProg && (aProg.includes(reqProg) || reqProg.includes(aProg))) scoreA += 50;
      if (reqProg && (bProg.includes(reqProg) || reqProg.includes(bProg))) scoreB += 50;

      // 3. Availability
      const statusScore = {
        'Available': 40,
        'On Assignment': 20,
        'Busy': 5,
        'Offline': 0
      };
      scoreA += (statusScore[a.current_status] || 0);
      scoreB += (statusScore[b.current_status] || 0);

      // 4. Current workload (fewer active assignments preferred)
      scoreA -= (a.active_assignments || 0) * 10;
      scoreB -= (b.active_assignments || 0) * 10;

      return scoreB - scoreA;
    });
  }, [fieldWorkers, request]);

  if (!isOpen || !request) return null;

  const selectedWorker = fieldWorkers.find(w => w.id === selectedWorkerId);

  const handleExecuteAssignment = async () => {
    if (!selectedWorker) {
      toast.warning('Please select a Field Worker to assign this task.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAssignSuccess(request.id || request.request_code, selectedWorker.id, selectedWorker.name, assignmentNotes, dueDate);
      toast.success(`Assignment successfully sent to ${selectedWorker.name}.`);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to dispatch assignment.');
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#006B56] to-[#004D3D] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <UserCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Assign Field Worker</h2>
              <p className="text-xs text-emerald-100/90 font-mono">
                {request.request_code || request.id} &bull; {request.beneficiary_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Target Request Summary Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Assistance Category:</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-[#006B56] font-bold rounded-md">
                {request.assistance_type || request.category}
              </span>
            </div>
            <div className="flex items-start space-x-2 text-xs text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <span>
                {request.village ? `${request.village}, ` : ''}
                {request.boma ? `${request.boma}, ` : ''}
                {request.payam ? `${request.payam}, ` : ''}
                {request.county || 'Kapoeta South'}, {request.state || 'Eastern Equatoria'}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{request.programme_name || request.program_name || 'Emergency Food Security'}</span>
            </div>
          </div>

          {/* AI / Smart Prioritization Banner */}
          <div className="flex items-center space-x-2 p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-lg text-xs text-emerald-800">
            <Sparkles className="w-4 h-4 text-[#006B56] shrink-0" />
            <span>Field workers are sorted by <strong>operational area match</strong>, <strong>program skill</strong>, and <strong>low workload</strong>.</span>
          </div>

          {/* Select Field Worker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Suitable Field Worker ({prioritizedWorkers.length})
            </label>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {prioritizedWorkers.map((worker, idx) => {
                const isSelected = selectedWorkerId === worker.id;
                const isTopMatch = idx === 0;
                
                const statusStyles = {
                  'Available': 'bg-emerald-100 text-emerald-800 border-emerald-300',
                  'On Assignment': 'bg-blue-100 text-blue-800 border-blue-300',
                  'Busy': 'bg-amber-100 text-amber-800 border-amber-300',
                  'Offline': 'bg-slate-100 text-slate-600 border-slate-300'
                };

                return (
                  <div
                    key={worker.id}
                    onClick={() => setSelectedWorkerId(worker.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#006B56] bg-emerald-50/70 shadow-sm ring-2 ring-[#006B56]/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={worker.avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150'}
                          alt={worker.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs"
                        />
                        {isTopMatch && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-xs">
                            ★
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-bold text-slate-900 truncate">{worker.name}</p>
                          {isTopMatch && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-600 text-white font-bold rounded-sm">
                              Top Match
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center space-x-1 truncate mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{worker.assigned_area || worker.county || 'Kapoeta South'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {worker.active_assignments || 0} active &bull; {worker.completed_assignments || 0} completed
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-1.5 shrink-0 pl-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyles[worker.current_status] || 'bg-slate-100 text-slate-700'}`}>
                        {worker.current_status}
                      </span>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-[#006B56] bg-[#006B56] text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Due Date Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Assessment Due Date</span>
              <span className="text-[11px] text-slate-400 font-normal">Standard: 48 Hours</span>
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B56]"
              />
            </div>
          </div>

          {/* Instructions / Notes to Field Worker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Specific Instructions / Field Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              placeholder="e.g., Conduct household verification and capture GPS coordinates of shelter structure..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B56] resize-none"
            />
          </div>

        </div>

        {/* Confirmation Modal Overlay */}
        {showConfirm && (
          <div className="p-4 bg-amber-50 border-t border-amber-200 flex flex-col space-y-3 animate-in fade-in">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <p className="font-bold">Confirm Field Worker Assignment</p>
                <p className="mt-0.5">
                  Are you sure you want to assign <strong>{request.request_code}</strong> ({request.beneficiary_name}) to <strong>{selectedWorker?.name}</strong>?
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAssignment}
                disabled={isSubmitting}
                className="flex-1 py-2 text-xs font-bold text-white bg-[#006B56] hover:bg-[#005544] rounded-xl shadow-sm flex items-center justify-center space-x-1.5"
              >
                {isSubmitting ? (
                  <span>Dispatching...</span>
                ) : (
                  <>
                    <span>Confirm & Dispatch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {!showConfirm && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!selectedWorkerId) {
                  toast.warning('Please select a Field Worker first.');
                  return;
                }
                setShowConfirm(true);
              }}
              className="flex-1 py-2.5 text-xs font-bold text-white bg-[#006B56] hover:bg-[#005544] rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              <span>Assign Worker</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
