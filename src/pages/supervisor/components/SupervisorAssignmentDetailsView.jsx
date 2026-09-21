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
  Info,
  UserCheck,
  UserPlus,
  UserX,
  ChevronDown
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
  const parseNotes = (rawNotes) => {
    if (!rawNotes) {
      return [
        {
          id: 'note-default',
          author: 'Emmanuel Adeyemi (Supervisor)',
          date: 'Recent',
          text: 'Assigned to field team for urgent household vulnerability assessment.'
        }
      ];
    }
    const chunks = rawNotes
      .split(' | ')
      .map(s => s.trim())
      .filter(Boolean);

    // Clean up any placeholder mentions like "Previous Worker" and deduplicate
    const cleanedChunks = chunks.map(chunk => {
      return chunk.replace(/Reassigned from Previous Worker to /gi, 'Assigned to ');
    });

    const uniqueChunks = Array.from(new Set(cleanedChunks));

    return uniqueChunks.map((text, idx) => ({
      id: `note-${idx}-${text.slice(0, 15)}`,
      author: 'Emmanuel Adeyemi (Supervisor)',
      date: idx === uniqueChunks.length - 1 ? 'Recent' : 'Audit Log',
      text
    }));
  };

  const [notesList, setNotesList] = useState(() => parseNotes(assignment?.review_notes));

  React.useEffect(() => {
    if (assignment?.review_notes) {
      setNotesList(parseNotes(assignment.review_notes));
    }
  }, [assignment?.review_notes]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMode, setContactMode] = useState('call'); // 'call' | 'sms'
  const [smsMessage, setSmsMessage] = useState('');
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedNewWorkerId, setSelectedNewWorkerId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [isSubmittingReassign, setIsSubmittingReassign] = useState(false);

  if (!assignment) return null;

  const rawWorkerName = assignment.assigned_field_worker_name || assignment.field_worker_name || '';
  const hasAssignedWorker = Boolean(
    rawWorkerName &&
    rawWorkerName !== 'Unassigned' &&
    rawWorkerName !== 'Pending Supervisor Assignment' &&
    rawWorkerName !== 'Awaiting Field Worker Allocation' &&
    rawWorkerName !== 'Pending Field Officer Allocation' &&
    rawWorkerName !== 'Pending' &&
    !rawWorkerName.toLowerCase().includes('pending')
  );

  const assignedWorker = hasAssignedWorker ? (
    fieldWorkers?.find(
      w => w.id === assignment.assigned_field_worker_id || 
           w.id === assignment.field_worker_id ||
           w.name?.toLowerCase() === rawWorkerName.toLowerCase()
    ) || {
      name: rawWorkerName,
      phone: assignment.assigned_field_worker_phone || '+211-921-550101',
      email: 'field.worker@adra.org',
      role: 'Field Worker',
      current_status: 'Active',
      programme: assignment.programme_name || assignment.program_name || 'Emergency Food Security'
    }
  ) : null;

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

  const selectedWorkerDetails = fieldWorkers?.find(w => String(w.id) === String(selectedNewWorkerId));

  const handleExecuteReassign = async () => {
    if (!selectedNewWorkerId) {
      toast.warning(hasAssignedWorker ? 'Please select a new Field Worker.' : 'Please select a Field Worker to assign.');
      return;
    }
    const finalReason = reassignReason.trim() || (hasAssignedWorker ? 'Supervisor reassignment' : 'Initial field assessment allocation');

    const newWorker = fieldWorkers?.find(w => String(w.id) === String(selectedNewWorkerId)) || { name: 'Field Worker' };
    setIsSubmittingReassign(true);
    try {
      await onReassignWorker(assignment.id || assignment.request_code, selectedNewWorkerId, newWorker.name, finalReason);
      toast.success(
        hasAssignedWorker
          ? `Case successfully reassigned to ${newWorker.name}.`
          : `Case successfully assigned to ${newWorker.name}.`
      );
      setShowReassignModal(false);
      setReassignReason('');
    } catch (err) {
      toast.error(err.message || 'Failed to assign worker.');
    } finally {
      setIsSubmittingReassign(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col animate-in fade-in duration-200">
      
      {/* Top Header Bar */}
      <div className="bg-gradient-to-r from-[#006B56] to-[#004D3D] text-white p-4 sticky top-0 z-30 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
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
      <div className="p-4 space-y-3 flex-1 pb-24 max-w-xl mx-auto w-full">
        
        {/* 1. UNIFIED HERO CARD: Beneficiary & Core Metrics */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#006B56] border border-emerald-200/80 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                <User className="w-5 h-5 text-[#006B56]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900 truncate">
                    {assignment.beneficiary_name}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  ID: {assignment.beneficiary_code || assignment.beneficiary_id || 'ADRA-SS-000125'}
                </p>
              </div>
            </div>
            
            <span className={`text-[11px] font-black px-2.5 py-1 rounded-xl border shrink-0 ${
              assignment.priority === 'Critical' || assignment.urgency === 'Critical'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : assignment.priority === 'High' || assignment.urgency === 'High'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {assignment.priority || assignment.urgency || 'High'} Priority
            </span>
          </div>

          {/* Quick Metrics 4-Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Aid Category</span>
              <span className="font-extrabold text-slate-800 truncate block mt-0.5">
                {assignment.assistance_type || assignment.category || 'Food Assistance'}
              </span>
            </div>
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Household</span>
              <span className="font-extrabold text-slate-800 block mt-0.5">
                {assignment.household_members || 6} Members
              </span>
            </div>
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Assessment Window</span>
              <span className="font-extrabold text-amber-700 block mt-0.5 font-mono">
                {assignment.due_date || '48h Standard Window'}
              </span>
            </div>
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Programme</span>
              <span className="font-extrabold text-slate-800 truncate block mt-0.5">
                {assignment.programme_name || assignment.program_name || 'Emergency Food Security'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. SEGMENTED TABS CONTROLLER */}
        <div className="grid grid-cols-3 gap-1 bg-slate-200/70 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 text-xs font-black rounded-xl transition cursor-pointer text-center ${
              activeTab === 'overview'
                ? 'bg-white text-[#006B56] shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Location & Compliance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('worker')}
            className={`py-2 px-1 text-xs font-black rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1 ${
              activeTab === 'worker'
                ? 'bg-white text-[#006B56] shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Field Officer</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`py-2 px-1 text-xs font-black rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1 ${
              activeTab === 'notes'
                ? 'bg-white text-[#006B56] shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Notes & Audit</span>
            {notesList.length > 0 && (
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'notes' ? 'bg-emerald-100 text-[#006B56]' : 'bg-slate-300 text-slate-700'
              }`}>
                {notesList.length}
              </span>
            )}
          </button>
        </div>

        {/* 3. TAB CONTENT */}

        {/* TAB 1: LOCATION & COMPLIANCE */}
        {activeTab === 'overview' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            {/* Location Card */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#006B56]" />
                  <span>Administrative Location</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {assignment.state || 'Central Equatoria'}
                </span>
              </div>

              {/* Breadcrumb Trail */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                <div className="flex items-center text-slate-600 gap-1.5 flex-wrap font-medium">
                  <span className="font-bold text-slate-900">{assignment.state || 'Central Equatoria'}</span>
                  <span className="text-slate-400">&rsaquo;</span>
                  <span className="font-bold text-slate-900">{assignment.county || 'Juba'}</span>
                  <span className="text-slate-400">&rsaquo;</span>
                  <span className="font-semibold text-slate-800">{assignment.payam || 'Juba Na Bari'}</span>
                  <span className="text-slate-400">&rsaquo;</span>
                  <span className="text-slate-700">Boma: <strong>{assignment.boma || 'dvfd'}</strong></span>
                  <span className="text-slate-400">&rsaquo;</span>
                  <span className="text-slate-700">Zone: <strong>{assignment.village || 'ffvf'}</strong></span>
                </div>
              </div>
            </div>

            {/* Compliance Policy Alert */}
            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
              <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Humanitarian Compliance:</strong> Supervisors dispatch and verify field assessments. Final approvals remain with Program Manager Grace Ochieng.
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: FIELD WORKER DISPATCH */}
        {activeTab === 'worker' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            {hasAssignedWorker && assignedWorker ? (
              <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#006B56]" />
                    <span>Assigned Field Officer</span>
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
                      <p className="text-xs text-slate-500 font-mono">{assignedWorker.phone}</p>
                      <p className="text-[11px] text-[#006B56] font-semibold">{assignedWorker.programme || 'Emergency Food Security'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setContactMode('call');
                        setShowContactModal(true);
                      }}
                      className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006B56] hover:bg-emerald-100 flex items-center justify-center transition-colors border border-emerald-200/60 cursor-pointer"
                      title="Call Worker"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setContactMode('sms');
                        setShowContactModal(true);
                      }}
                      className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center transition-colors border border-blue-200/60 cursor-pointer"
                      title="Send SMS"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center mx-auto shadow-2xs">
                  <UserX className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">No Field Worker Assigned Yet</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    This verification request is awaiting supervisory allocation. Assign an available field worker to conduct household assessment.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReassignModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#006B56] hover:bg-[#005544] text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer active:scale-98"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Assign Field Worker Now</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NOTES & AUDIT TRAIL */}
        {activeTab === 'notes' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#006B56]" />
                <span>Case Notes & Log</span>
              </h3>

              <form onSubmit={handleAddNote} className="flex space-x-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add supervisory field note..."
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B56] bg-slate-50"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-[#006B56] text-white rounded-xl hover:bg-[#005544] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              <div className="space-y-2 pt-1 max-h-56 overflow-y-auto">
                {notesList.map((n) => (
                  <div key={n.id} className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-100">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-slate-800">{n.author}</span>
                      <span className="text-slate-400 font-medium">{n.date}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{n.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. PRIMARY ACTIONS TOOLBAR */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setShowReassignModal(true)}
            className="p-3 bg-white border border-slate-300 text-slate-800 font-bold rounded-xl text-xs hover:bg-slate-50 flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 transition"
          >
            {hasAssignedWorker ? (
              <>
                <RefreshCw className="w-4 h-4 text-[#006B56]" />
                <span>Reassign Worker</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 text-[#006B56]" />
                <span>Assign Field Worker</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onViewBeneficiary && onViewBeneficiary(assignment.beneficiary_id || assignment.beneficiary_code)}
            className="p-3 bg-[#006B56] text-white font-bold rounded-xl text-xs hover:bg-[#005544] flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 transition"
          >
            <Eye className="w-4 h-4 text-white" />
            <span>View Beneficiary</span>
          </button>
        </div>

      </div>

      {/* Contact Worker Modal */}
      {showContactModal && assignedWorker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Phone className="w-4 h-4 text-[#006B56]" />
                <span>Contact {assignedWorker.name}</span>
              </h3>
              <button onClick={() => setShowContactModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
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

      {/* Assign / Reassign Worker Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                {hasAssignedWorker ? (
                  <RefreshCw className="w-4 h-4 text-[#006B56]" />
                ) : (
                  <UserPlus className="w-4 h-4 text-[#006B56]" />
                )}
                <span>{hasAssignedWorker ? 'Reassign Case' : 'Assign Field Worker'}</span>
              </h3>
              <button onClick={() => setShowReassignModal(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {hasAssignedWorker ? 'Select New Field Worker' : 'Select Available Field Worker'}
              </label>
              <div className="relative">
                <select
                  value={selectedNewWorkerId}
                  onChange={(e) => setSelectedNewWorkerId(e.target.value)}
                  className="w-full p-2.5 pr-10 text-xs font-medium border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#006B56] appearance-none text-slate-900 cursor-pointer shadow-xs"
                >
                  <option value="">-- Choose Field Worker --</option>
                  {fieldWorkers?.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} — {w.assigned_area || 'Eastern Equatoria'} ({w.current_status || 'Available'}, {w.active_assignments || 0} active)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {selectedWorkerDetails && (
                <div className="mt-2 p-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
                  <div>
                    <p className="font-bold text-slate-900">{selectedWorkerDetails.name}</p>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {selectedWorkerDetails.assigned_area} &bull; {selectedWorkerDetails.active_assignments || 0} active cases
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                      selectedWorkerDetails.current_status === 'Available'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedWorkerDetails.current_status || 'Available'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {hasAssignedWorker ? 'Reason for Reassignment' : 'Assignment Notes / Directive (Optional)'}
              </label>
              <textarea
                rows={2}
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder={
                  hasAssignedWorker
                    ? 'e.g., Worker unavailable due to transport delay in Kapoeta East...'
                    : 'e.g., Priority household verification for emergency food ration...'
                }
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
                <span>
                  {isSubmittingReassign
                    ? 'Saving...'
                    : hasAssignedWorker
                    ? 'Confirm Reassignment'
                    : 'Assign Field Worker'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
