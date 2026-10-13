import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  CheckCircle2,
  HardHat,
  ClipboardList,
  Scale,
  CheckCheck,
  ChevronDown,
  Check,
  ShieldCheck
} from 'lucide-react';
import { db } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

export function FeedbackComplaintsView({ beneficiary, currentUser: propUser }) {
  const { currentUser: authUser } = useAuth();
  const effectiveUser = beneficiary || propUser || authUser;

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default active tab based on user role
  const getInitialTab = () => {
    const role = (effectiveUser?.role || '').toLowerCase();
    if (role.includes('program')) return 'supervisor';
    if (role.includes('supervisor')) return 'programManager';
    if (role.includes('field')) return 'supervisor';
    if (role.includes('finance')) return 'programManager';
    if (role.includes('inventory') || role.includes('logistics')) return 'programManager';
    if (role.includes('supplier')) return 'programManager';
    return 'fieldWorker';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab); // 'fieldWorker' | 'supervisor' | 'programManager' | 'complianceOfficer'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const chatBottomRef = useRef(null);
  const toast = useToast();

  // Assigned personnel
  const [personnel, setPersonnel] = useState({
    fieldWorker: 'Rose Poni',
    supervisor: 'Mary Akech',
    programManager: 'Grace Ochieng',
    complianceOfficer: 'David Ochieng'
  });

  // Chat input state
  const [messageText, setMessageText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Resolve assigned personnel dynamically
  useEffect(() => {
    const resolveAssignedPersonnel = async () => {
      try {
        const [requests, projects, supervisors] = await Promise.all([
          db.getAssistanceRequests(beneficiary?.id || beneficiary?.beneficiary_code || 'b7'),
          db.getProjects ? db.getProjects() : [],
          db.getSupervisors ? db.getSupervisors() : []
        ]);

        // 1. Resolve Assigned Field Worker
        let fw = beneficiary?.assigned_field_worker || beneficiary?.field_worker_name || beneficiary?.field_worker;
        if (!fw && Array.isArray(requests) && requests.length > 0) {
          const reqWithWorker = requests.find(r => r.assigned_field_worker_name && r.assigned_field_worker_name !== 'Unassigned')
            || requests.find(r => r.field_worker_name && r.field_worker_name !== 'Unassigned');
          if (reqWithWorker) {
            fw = reqWithWorker.assigned_field_worker_name || reqWithWorker.field_worker_name;
          }
        }
        if (!fw) fw = 'Rose Poni';

        // 2. Resolve Assigned Program Manager
        let pm = null;
        const projId = beneficiary?.project_id || beneficiary?.program_id;
        const projName = beneficiary?.project_name || beneficiary?.programme;
        if (Array.isArray(projects) && projects.length > 0) {
          const matchedProj = projects.find(p =>
            (projId && p.id === projId) ||
            (projName && p.project_name?.toLowerCase().includes(projName.toLowerCase()))
          );
          if (matchedProj) {
            pm = matchedProj.manager_name || matchedProj.program_manager || matchedProj.pm_name;
          }
        }
        if (!pm && Array.isArray(requests) && requests.length > 0) {
          const reqWithPM = requests.find(r => r.reviewed_by || r.manager_name || r.program_manager_name);
          if (reqWithPM) {
            pm = reqWithPM.reviewed_by || reqWithPM.manager_name || reqWithPM.program_manager_name;
          }
        }
        if (pm) {
          pm = pm.replace(/\s*\([^)]*\)/g, '').trim();
        } else {
          pm = 'Grace Ochieng';
        }

        // 3. Resolve Field Supervisor
        let sup = null;
        if (Array.isArray(requests) && requests.length > 0) {
          const reqWithSup = requests.find(r => r.assigned_supervisor_name || r.supervisor_name);
          if (reqWithSup) {
            sup = reqWithSup.assigned_supervisor_name || reqWithSup.supervisor_name;
          }
        }
        if (!sup && Array.isArray(supervisors) && supervisors.length > 0) {
          const matchedSup = supervisors.find(s => s.name === 'Mary Akech' || s.full_name === 'Mary Akech');
          sup = matchedSup?.full_name || matchedSup?.name || supervisors[0]?.full_name || supervisors[0]?.name;
        }
        if (!sup) sup = 'Mary Akech';

        setPersonnel({
          fieldWorker: fw,
          supervisor: sup,
          programManager: pm,
          complianceOfficer: 'David Ochieng'
        });
      } catch (e) {
        console.warn('Could not resolve assigned personnel:', e);
      }
    };

    resolveAssignedPersonnel();
  }, [beneficiary]);

  // Load complaints
  const loadComplaints = async () => {
    try {
      setLoading(true);
      const isBeneficiaryUser = !effectiveUser?.role || effectiveUser?.role === 'Beneficiary';
      const userId = effectiveUser?.id || (isBeneficiaryUser ? 'b7' : null);
      let data = await db.getComplaints(userId);
      if (!isBeneficiaryUser && (!data || data.length === 0)) {
        data = await db.getComplaints(null);
      }
      setComplaints(data || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [beneficiary, effectiveUser?.id]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, complaints]);

  // Contacts definition
  const contacts = [
    {
      id: 'fieldWorker',
      role: 'Field Worker',
      name: personnel.fieldWorker,
      title: 'Assigned Household Worker',
      status: 'Online',
      badge: 'Assigned to You',
      avatarColor: 'bg-emerald-600',
      icon: HardHat,
      welcomeNote: 'Hello! I am your assigned ADRA Field Worker for visits, token verification, and household aid supplies.'
    },
    {
      id: 'supervisor',
      role: 'Supervisor',
      name: personnel.supervisor,
      title: 'Zonal Field Supervisor',
      status: 'Active',
      badge: 'Zonal Operations',
      avatarColor: 'bg-blue-600',
      icon: ShieldCheck,
      welcomeNote: 'This is the Zonal Supervisor channel. Contact me for depot queues, distribution safety, or team inquiries.'
    },
    {
      id: 'programManager',
      role: 'Program Manager',
      name: personnel.programManager,
      title: 'Programme Manager',
      status: 'Active',
      badge: 'Programme Manager',
      avatarColor: 'bg-purple-600',
      icon: ClipboardList,
      welcomeNote: 'Welcome. As your ADRA Programme Manager, feel free to submit programme feedback, appeal inclusion, or request policy clarity.'
    },
    {
      id: 'complianceOfficer',
      role: 'Compliance Officer',
      name: personnel.complianceOfficer,
      title: 'Safeguarding Officer',
      status: 'Official Helpline',
      badge: 'Safeguarding Desk',
      avatarColor: 'bg-rose-600',
      icon: Scale,
      welcomeNote: 'Official Independent Safeguarding Desk. All reports are strictly confidential.'
    }
  ];

  const currentContact = contacts.find(c => c.id === activeTab) || contacts[0];

  // Filter complaints for the currently selected contact
  const activeChatMessages = complaints.filter(c => {
    const roleMatch = (c.recipient_role || '').toLowerCase() === currentContact.role.toLowerCase();
    const nameMatch = (c.recipient_name || '').toLowerCase().includes(currentContact.name.toLowerCase()) ||
                      currentContact.name.toLowerCase().includes((c.recipient_name || '').toLowerCase());
    if (currentContact.id === 'complianceOfficer' && c.ticket_code === 'CMP-2025-001') {
      return true;
    }
    return roleMatch || nameMatch;
  });

  // Count messages per contact
  const getContactMessageCount = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return 0;
    return complaints.filter(c => {
      const roleMatch = (c.recipient_role || '').toLowerCase() === contact.role.toLowerCase();
      const nameMatch = (c.recipient_name || '').toLowerCase().includes(contact.name.toLowerCase());
      if (contactId === 'complianceOfficer' && c.ticket_code === 'CMP-2025-001') return true;
      return roleMatch || nameMatch;
    }).length;
  };

  // Send message in WhatsApp chat
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim()) return;

    try {
      setIsSubmitting(true);
      const senderName = effectiveUser?.full_name || effectiveUser?.name || 'Authorized Member';
      const senderId = effectiveUser?.id || (effectiveUser?.role === 'Beneficiary' ? 'b7' : `staff_${Date.now()}`);

      await db.createComplaint({
        beneficiary_id: senderId,
        beneficiary_name: senderName,
        recipient_role: currentContact.role,
        recipient_name: currentContact.name,
        category: 'Feedback & Accountability',
        severity: 'Medium',
        is_anonymous: false,
        subject: messageText.length > 50 ? `${messageText.substring(0, 47)}...` : messageText,
        description: messageText.trim()
      });

      toast.success(`Message sent directly to ${currentContact.role}`);
      setMessageText('');
      await loadComplaints();
    } catch (err) {
      console.error(err);
      toast.error('Could not send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col h-full min-h-[calc(100vh-120px)] bg-white border-0 shadow-none rounded-none overflow-hidden">
      
      {/* CLEAN LIGHT WHATSAPP HEADER BAR */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 text-slate-900 shrink-0 flex items-center justify-between shadow-xs relative z-30" ref={dropdownRef}>
        
        {/* Left: Officer Role & Switch Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-100 transition cursor-pointer text-left group"
          >
            {/* Avatar with Online Dot */}
            <div className="relative shrink-0">
              <div className={`w-10 h-10 rounded-full ${currentContact.avatarColor} text-white flex items-center justify-center font-bold shadow-xs`}>
                {React.createElement(currentContact.icon, { className: 'w-5 h-5' })}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            {/* Officer Role ONLY (fits cleanly without officer name) */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-900 tracking-tight">
                  {currentContact.role}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <span>Switch role</span>
                <span>•</span>
                <span className="text-emerald-600 font-medium">{currentContact.status}</span>
              </p>
            </div>
          </button>

          {/* Clean Dropdown Menu Popover (Name appears only here in dropdown) */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in-50 duration-150">
              <div className="p-2.5 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Select Recipient to Chat With
              </div>

              {contacts.map(c => {
                const isSelected = activeTab === c.id;
                const IconComp = c.icon;
                const count = getContactMessageCount(c.id);

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(c.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full p-3 text-left flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-l-4 border-emerald-600'
                        : 'hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg ${c.avatarColor} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-xs font-bold text-slate-900">{c.role}:</span>
                          <span className="text-xs font-semibold text-emerald-800 truncate">{c.name}</span>
                          {count > 0 && (
                            <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-bold shrink-0 ml-1">
                              {count}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                          {c.title}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 ml-2 shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* CHAT MESSAGES BODY (WhatsApp Wallpaper & Bubbles) */}
      <div 
        className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#efeae2]/40"
        style={{
          backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      >
        {/* Welcome Introduction Bubble from Officer */}
        <div className="flex justify-start">
          <div className="max-w-[85%] sm:max-w-[70%] bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-xs border border-slate-200/80 text-slate-800">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] font-bold text-emerald-700">
                {currentContact.role}
              </span>
              <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-medium">
                Official
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-700">
              {currentContact.welcomeNote}
            </p>
            <span className="text-[10px] text-slate-400 block text-right mt-1">
              Always available
            </span>
          </div>
        </div>

        {/* Thread Messages */}
        {activeChatMessages.length === 0 ? (
          <div className="text-center py-6">
            <span className="text-xs text-slate-400 bg-white/80 px-3 py-1.5 rounded-full border border-slate-200">
              No messages sent to {currentContact.role} yet. Type below to start!
            </span>
          </div>
        ) : (
          activeChatMessages.map(msg => (
            <div key={msg.id || msg.ticket_code} className="space-y-2">
              {/* Beneficiary Outgoing Bubble (WhatsApp Green - Aligned Right) */}
              <div className="flex justify-end">
                <div className="max-w-[85%] sm:max-w-[70%] bg-[#d9fdd3] text-slate-900 rounded-2xl rounded-tr-xs p-3.5 shadow-xs border border-[#b8f5b0]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                      {msg.category || 'Feedback'}
                    </span>
                    <span className="text-[9px] font-mono text-emerald-900/60 font-semibold">
                      #{msg.ticket_code}
                    </span>
                  </div>

                  {msg.subject && msg.subject !== msg.description && (
                    <div className="text-xs font-bold text-slate-900 mb-1">
                      {msg.subject}
                    </div>
                  )}

                  <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {msg.description}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-emerald-200/40 text-[10px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <span>From: You</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <span>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM'}</span>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Official Response / Investigation Finding (Incoming Bubble - Aligned Left) */}
              {msg.resolution_notes && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] sm:max-w-[70%] bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-xs border border-emerald-200 text-slate-800">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {msg.resolved_by || currentContact.role}
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        {msg.status || 'Resolved'}
                      </span>
                    </div>

                    <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-700 leading-relaxed">
                      <strong className="block text-slate-900 text-[11px] mb-0.5">Finding & Action:</strong>
                      {msg.resolution_notes}
                    </div>

                    <span className="text-[10px] text-slate-400 block text-right mt-1.5">
                      {msg.resolved_at ? new Date(msg.resolved_at).toLocaleDateString() : 'Verified'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* WHATSAPP BOTTOM INPUT BAR */}
      <form onSubmit={handleSendMessage} className="p-3 bg-slate-100 border-t border-slate-200 flex items-center gap-2 shrink-0">
        <div className="flex-1 bg-white rounded-2xl border border-slate-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 px-3.5 py-2 flex items-center gap-2 shadow-xs">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={`Message ${currentContact.role}...`}
            className="flex-1 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden bg-transparent"
            disabled={isSubmitting}
          />
        </div>

        {/* WhatsApp Green Send Button */}
        <button
          type="submit"
          disabled={!messageText.trim() || isSubmitting}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition shadow-md shrink-0 cursor-pointer ${
            messageText.trim() && !isSubmitting
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
          title="Send Message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
