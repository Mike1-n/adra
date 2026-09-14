import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  Clock,
  Shield,
  Phone,
  MessageSquare,
  RefreshCw,
  Eye,
  FileText,
  AlertCircle,
  CheckCircle2,
  Send,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function SupervisorAssignmentDetailsView({
  assignment,
  fieldWorkers,
  onBack,
  onReassignWorker,
  onViewBeneficiary,
  onViewActivity
}) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'notes' | 'contact'
  const [newNote, setNewNote] = useState('');
  const [notesList, setNotesList] = useState(() => {
    return [
      {
        id: 1,
        author: 'Emmanuel Adeyemi (Supervisor)',
        date: 'Recent',
        text: assignment?.review_notes || 'Assigned to field team for urgent household vulnerability assessment.'
      }
    ];
  });
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMode, setContactMode] = useState('call'); // 'call' | 'sms'
  const [smsMessage, setSmsMessage] = useState('');
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedNewWorkerId, setSelectedNewWorkerId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [isSubmittingReassign, setIsSubmittingReassign] = useState(false);

  if (!assignment) return null;

  const assignedWorker = fieldWorkers?.find(
    w => w.id === assignment.assigned_field_worker_id || w.name === assignment.assigned_field_worker_name
  ) || {
    name: assignment.assigned_field_worker_name || 'Unassigned',
    phone: '+211-921-550101',
    email: 'field.worker@adra.org',
    role: 'Field Worker',
    current_status: 'On Assignment'
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const noteObj = {
      id: Date.now(),
      author: 'Emmanuel Adeyemi (Supervisor)',
      date: 'Just now',
      text: newNote.trim()
    };
    setNotesList([noteObj, ...notesList]);
    setNewNote('');
    toast.success('Field supervisor note attached to case file.');
  };

  const handleSendSMS = () => {
    if (!smsMessage.trim()) {
      toast.warning('Please enter an SMS message.');
      return;
    }
    toast.success(`SMS successfully dispatched to ${assignedWorker.name} (${assignedWorker.phone}).`);
    setSmsMessage('');
    setShowContactModal(false);
  };

  const handleExecuteReassign = async () => {
    if (!selectedNewWorkerId) {
      toast.warning('Please select a new Field Worker.');
      return;
    }
    if (!reassignReason.trim()) {
      toast.warning('Please provide a brief reason for reassignment.');
      return;
    }

    const newWorker = fieldWorkers.find(w => w.id === selectedNewWorkerId);
    setIsSubmittingReassign(true);
    try {
      await onReassignWorker(assignment.id || assignment.request_code, selectedNewWorkerId, newWorker.name, reassignReason);
      toast.success(`Case successfully reassigned to ${newWorker.name}.`);
      setShowReassignModal(false);
    } catch (err) {
      toast.error(err.message || 'Failed to reassign worker.');
    } finally {
      setIsSubmittingReassign(false);
    }
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
            <h1 className="text-base font-bold leading-tight">Assignment Case Details</h1>
            <p className="text-xs text-emerald-200/90 font-mono">
              {assignment.request_code || assignment.id}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/15 text-white border border-white/20">
          {assignment.status_label || assignment.status}
        </span>
      </div>

      {/* Main Content Area */}
      <div className="p-4 space-y-4 flex-1 pb-24 max-w-xl mx-auto w-full">
        
        {/* Core Beneficiary & Priority Banner */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Beneficiary Case</span>
              <h2 className="text-lg font-bold text-slate-900">{assignment.beneficiary_name}</h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {assignment.beneficiary_code || assignment.beneficiary_id || 'ADRA-SS-000125'}</p>
            </div>
            
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
              assignment.priority === 'Critical' || assignment.urgency === 'Critical'
                ? 'bg-red-50 text-red-700 border-red-200'
                : assignment.priority === 'High' || assignment.urgency === 'High'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {assignment.priority || assignment.urgency || 'High'} Priority
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Aid Category</span>
              <span className="font-bold text-slate-800">{assignment.assistance_type || assignment.category}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Household Size</span>
              <span className="font-bold text-slate-800">{assignment.household_members || 6} Members</span>
            </div>
          </div>
        </div>

        {/* Assigned Field Worker Card */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <User className="w-4 h-4 text-[#006B56]" />
              <span>Assigned Field Worker</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
              {assignedWorker.current_status || 'Active'}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-3">
              <img
                src={assignedWorker.avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150'}
                alt={assignedWorker.name}
                className="w-12 h-12 rounded-full object-cover border border-slate-200"
              />
              <div>
                <p className="text-sm font-bold text-slate-900">{assignedWorker.name}</p>
                <p className="text-xs text-slate-500">{assignedWorker.phone}</p>
                <p className="text-[11px] text-[#006B56] font-medium">{assignedWorker.programme || 'Emergency Food Security'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setContactMode('call');
                  setShowContactModal(true);
                }}
                className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006B56] hover:bg-emerald-100 flex items-center justify-center transition-colors border border-emerald-200/60"
                title="Call Worker"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setContactMode('sms');
                  setShowContactModal(true);
                }}
                className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center transition-colors border border-blue-200/60"
                title="Send SMS"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Location & Administrative Hierarchy */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-2.5">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
            <MapPin className="w-4 h-4 text-[#006B56]" />
            <span>South Sudan Administrative Location</span>
          </span>

          <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-400 font-medium">State:</span>
              <span className="font-bold text-slate-900">{assignment.state || 'Eastern Equatoria'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-400 font-medium">County:</span>
              <span className="font-bold text-slate-900">{assignment.county || 'Kapoeta South'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-400 font-medium">Payam:</span>
              <span className="font-bold text-slate-900">{assignment.payam || 'Kapoeta Town'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-400 font-medium">Boma:</span>
              <span className="font-bold text-slate-900">{assignment.boma || 'Machi'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400 font-medium">Village / Zone:</span>
              <span className="font-bold text-slate-900">{assignment.village || 'Zone 4 Camp'}</span>
            </div>
          </div>
        </div>

        {/* Programme & Due Dates */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Assigned Date:</span>
            <span className="font-bold text-slate-800 font-mono">
              {assignment.created_at ? new Date(assignment.created_at).toLocaleDateString('en-GB') : '2026-09-12'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Assessment Due Date:</span>
            <span className="font-bold text-amber-700 font-mono bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              {assignment.due_date || '2026-09-14 (48h Window)'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Parent Programme:</span>
            <span className="font-bold text-slate-800 truncate max-w-[200px]">
              {assignment.programme_name || assignment.program_name || 'Emergency Food Security'}
            </span>
          </div>
        </div>

        {/* Security Rule Notice */}
        <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl flex items-start space-x-2.5 text-xs text-amber-900">
          <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Humanitarian Compliance Rule:</strong> Supervisors cannot modify original beneficiary data or approve final aid. Final decisions remain with Program Manager Grace Ochieng.
          </span>
        </div>

        {/* Notes & Activity Stream */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
            <FileText className="w-4 h-4 text-[#006B56]" />
            <span>Supervisor Case Notes & Audit</span>
          </h3>

          <form onSubmit={handleAddNote} className="flex space-x-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add supervisory field note..."
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B56]"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-[#006B56] text-white rounded-xl hover:bg-[#005544] flex items-center justify-center transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="space-y-2 pt-2">
            {notesList.map((n) => (
              <div key={n.id} className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-800">{n.author}</span>
                  <span className="text-slate-400">{n.date}</span>
                </div>
                <p className="text-slate-600">{n.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            onClick={() => setShowReassignModal(true)}
            className="p-3 bg-white border border-slate-300 text-slate-800 font-bold rounded-xl text-xs hover:bg-slate-50 flex items-center justify-center space-x-1.5 shadow-xs"
          >
            <RefreshCw className="w-4 h-4 text-[#006B56]" />
            <span>Reassign Worker</span>
          </button>

          <button
            onClick={() => onViewBeneficiary && onViewBeneficiary(assignment.beneficiary_id || assignment.beneficiary_code)}
            className="p-3 bg-white border border-slate-300 text-slate-800 font-bold rounded-xl text-xs hover:bg-slate-50 flex items-center justify-center space-x-1.5 shadow-xs"
          >
            <Eye className="w-4 h-4 text-blue-600" />
            <span>View Beneficiary</span>
          </button>
        </div>

      </div>

      {/* Contact Worker Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Phone className="w-4 h-4 text-[#006B56]" />
                <span>Contact {assignedWorker.name}</span>
              </h3>
              <button onClick={() => setShowContactModal(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <p className="font-bold text-slate-800">{assignedWorker.name} ({assignedWorker.role})</p>
              <p className="text-slate-500">Phone: {assignedWorker.phone}</p>
              <p className="text-slate-500">Status: {assignedWorker.current_status}</p>
            </div>

            {contactMode === 'call' ? (
              <div className="space-y-3 text-center py-2">
                <p className="text-xs text-slate-600">
                  Click below to initiate a voice call with Field Worker <strong>{assignedWorker.name}</strong>.
                </p>
                <a
                  href={`tel:${assignedWorker.phone}`}
                  className="w-full py-3 bg-[#006B56] text-white font-bold rounded-xl flex items-center justify-center space-x-2 text-sm shadow-md"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call {assignedWorker.phone}</span>
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  rows={3}
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  placeholder={`Type SMS message to ${assignedWorker.name}...`}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B56]"
                />
                <button
                  type="button"
                  onClick={handleSendSMS}
                  className="w-full py-2.5 bg-[#006B56] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Field SMS</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reassign Worker Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-[#006B56]" />
                <span>Reassign Case</span>
              </h3>
              <button onClick={() => setShowReassignModal(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Select New Field Worker
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {fieldWorkers?.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => setSelectedNewWorkerId(w.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between ${
                      selectedNewWorkerId === w.id
                        ? 'border-[#006B56] bg-emerald-50 text-[#006B56] font-bold'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-900">{w.name}</p>
                      <p className="text-[11px] text-slate-500">{w.assigned_area} &bull; {w.active_assignments || 0} active</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-md">{w.current_status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reason for Reassignment
              </label>
              <textarea
                rows={2}
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder="e.g., Worker unavailable due to transport delay in Kapoeta East..."
                className="w-full p-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B56]"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReassignModal(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReassign}
                disabled={isSubmittingReassign}
                className="flex-1 py-2 text-xs font-bold text-white bg-[#006B56] rounded-xl hover:bg-[#005544] flex items-center justify-center space-x-1"
              >
                <span>{isSubmittingReassign ? 'Reassigning...' : 'Confirm Reassignment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
