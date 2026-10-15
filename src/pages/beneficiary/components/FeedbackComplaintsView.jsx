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
  ShieldCheck,
  Users,
  MessageSquare,
  Reply,
  X
} from 'lucide-react';
import { db } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

export function FeedbackComplaintsView({ beneficiary, currentUser: propUser }) {
  const { currentUser: authUser } = useAuth();
  const effectiveUser = beneficiary || propUser || authUser;

  const role = (effectiveUser?.role || '').toLowerCase();
  const isFieldWorker = role.includes('field');
  const isBeneficiary = !effectiveUser?.role || role.includes('beneficiary');

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default active tab based on user role
  const getInitialTab = () => {
    if (isFieldWorker) return 'beneficiaries';
    if (role.includes('program')) return 'supervisor';
    if (role.includes('supervisor')) return 'programManager';
    if (role.includes('finance')) return 'programManager';
    if (role.includes('inventory') || role.includes('logistics')) return 'programManager';
    if (role.includes('supplier')) return 'programManager';
    return 'fieldWorker';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const dropdownRef = useRef(null);
  const chatBottomRef = useRef(null);
  const inputRef = useRef(null);
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
      let data = [];
      if (isFieldWorker) {
        // Field worker queries all complaints so messages directed to them are retrieved
        data = await db.getComplaints('all');
      } else if (isBeneficiary) {
        const benId = beneficiary?.id || beneficiary?.beneficiary_code || effectiveUser?.id || 'b7';
        data = await db.getComplaints(benId);
        if (!data || data.length === 0) {
          data = await db.getComplaints('b7');
        }
      } else {
        data = await db.getComplaints('all');
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

  // Start replying to a specific message
  const handleStartReply = (msg) => {
    setReplyingTo(msg);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 60);
  };

  // Contacts definition: tailored if Field Worker vs Beneficiary
  const contacts = isFieldWorker ? [
    {
      id: 'beneficiaries',
      role: 'Household Inquiries',
      name: 'Registered Households',
      title: 'Direct Beneficiary Inquiries',
      status: 'Live',
      badge: 'Incoming from Community',
      avatarColor: 'bg-emerald-600',
      icon: Users,
      welcomeNote: 'Incoming messages and questions from registered households in your zone appear here. Tap Reply on any message to respond directly.'
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
      welcomeNote: 'This is the Zonal Supervisor channel. Contact for depot queues, distribution safety, or team inquiries.'
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
      welcomeNote: 'Direct channel with Programme Manager for project updates, escalations, and approvals.'
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
  ] : [
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

  // Filter and sort complaints for the currently selected contact (first sent at top, newest at bottom)
  const activeChatMessages = complaints
    .filter(c => {
      if (isFieldWorker && activeTab === 'beneficiaries') {
        const isFieldWorkerMsg = (c.recipient_role || '').toLowerCase().includes('field') ||
                                (c.recipient_name || '').toLowerCase().includes(personnel.fieldWorker.toLowerCase()) ||
                                (effectiveUser?.name && (c.recipient_name || '').toLowerCase().includes(effectiveUser.name.toLowerCase())) ||
                                c.category === 'Field Worker Response';
        return isFieldWorkerMsg;
      }

      const roleMatch = (c.recipient_role || '').toLowerCase() === currentContact.role.toLowerCase();
      const nameMatch = (c.recipient_name || '').toLowerCase().includes(currentContact.name.toLowerCase()) ||
                        currentContact.name.toLowerCase().includes((c.recipient_name || '').toLowerCase());
      if (currentContact.id === 'complianceOfficer' && c.ticket_code === 'CMP-2025-001') {
        return true;
      }
      return roleMatch || nameMatch;
    })
    .sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeA - timeB;
    });

  // Count messages per contact
  const getContactMessageCount = (contactId) => {
    if (isFieldWorker && contactId === 'beneficiaries') {
      return complaints.filter(c => 
        (c.recipient_role || '').toLowerCase().includes('field') ||
        (c.recipient_name || '').toLowerCase().includes(personnel.fieldWorker.toLowerCase()) ||
        (effectiveUser?.name && (c.recipient_name || '').toLowerCase().includes(effectiveUser.name.toLowerCase())) ||
        c.category === 'Field Worker Response'
      ).length;
    }
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
      const workerName = effectiveUser?.full_name || effectiveUser?.name || personnel.fieldWorker || 'Rose Poni';

      if (isFieldWorker && activeTab === 'beneficiaries') {
        // Field worker replying to beneficiary inquiry
        const targetComplaint = replyingTo || activeChatMessages.find(m => (!m.resolution_notes || m.status !== 'Resolved') && m.category !== 'Field Worker Response') || activeChatMessages[activeChatMessages.length - 1];

        if (targetComplaint && targetComplaint.id) {
          await db.updateComplaint(targetComplaint.id, {
            status: 'Resolved',
            resolution_notes: messageText.trim(),
            resolved_by: `${workerName} (Field Officer)`,
            resolved_at: new Date().toISOString()
          });
        }

        // Also add clean response complaint to the shared thread
        await db.createComplaint({
          beneficiary_id: targetComplaint?.beneficiary_id || 'b7',
          beneficiary_name: targetComplaint?.beneficiary_name || 'Michael Ngatia',
          recipient_role: 'Field Worker',
          recipient_name: workerName,
          category: 'Field Worker Response',
          severity: 'Low',
          is_anonymous: false,
          subject: messageText.trim().length > 40 ? `${messageText.trim().substring(0, 37)}...` : messageText.trim(),
          description: messageText.trim(),
          resolution_notes: messageText.trim(),
          resolved_by: `${workerName} (Field Officer)`,
          resolved_at: new Date().toISOString(),
          status: 'Resolved'
        });

        toast.success(`Reply sent to ${targetComplaint?.beneficiary_name || 'beneficiary'}`);
        setReplyingTo(null);
      } else {
        const senderName = effectiveUser?.full_name || effectiveUser?.name || 'Authorized Member';
        const senderId = effectiveUser?.id || (isBeneficiary ? 'b7' : `staff_${Date.now()}`);

        await db.createComplaint({
          beneficiary_id: senderId,
          beneficiary_name: senderName,
          recipient_role: currentContact.role,
          recipient_name: currentContact.name,
          category: 'Feedback & Accountability',
          severity: 'Medium',
          is_anonymous: false,
          subject: messageText.trim().length > 50 ? `${messageText.trim().substring(0, 47)}...` : messageText.trim(),
          description: messageText.trim()
        });

        toast.success(`Message sent directly to ${currentContact.role}`);
      }

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
    <div className="w-full flex-1 flex flex-col h-full min-h-[calc(100vh-120px)] bg-white border-0 shadow-none rounded-none overflow-hidden font-sans">
      
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

            {/* Officer Role & Status */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-900 tracking-tight">
                  {currentContact.role}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <span>{isFieldWorker ? 'Switch channel' : 'Switch role'}</span>
                <span>•</span>
                <span className="text-emerald-600 font-medium">{currentContact.status}</span>
              </p>
            </div>
          </button>

          {/* Clean Dropdown Menu Popover */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in-50 duration-150">
              <div className="p-2.5 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isFieldWorker ? 'Select Communication Channel' : 'Select Recipient to Chat With'}
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
                      setReplyingTo(null);
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

      {/* CHAT MESSAGES BODY (WhatsApp Wallpaper & Clean Bubbles) */}
      <div 
        className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#efeae2]/40"
        style={{
          backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      >
        {/* Welcome Introduction Bubble from Channel */}
        <div className="flex justify-start">
          <div className="max-w-[85%] sm:max-w-[75%] bg-white rounded-2xl rounded-tl-xs p-3 shadow-xs border border-slate-200/80 text-slate-800">
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
              {isFieldWorker && activeTab === 'beneficiaries'
                ? 'No messages from registered households yet.'
                : `No messages sent to ${currentContact.role} yet. Type below to start!`}
            </span>
          </div>
        ) : (
          activeChatMessages.map(msg => {
            const isFieldWorkerBeneficiaryTab = isFieldWorker && activeTab === 'beneficiaries';
            const isStaffReply = msg.category === 'Field Worker Response';

            // When viewed by Field Worker on Household Inquiries tab:
            if (isFieldWorkerBeneficiaryTab) {
              // Outgoing Field Worker Reply
              if (isStaffReply) {
                return (
                  <div key={msg.id || msg.ticket_code} className="flex justify-end">
                    <div className="max-w-[85%] sm:max-w-[75%] bg-[#d9fdd3] text-slate-900 rounded-2xl rounded-tr-xs p-3 shadow-xs border border-[#b8f5b0]">
                      <div className="text-[11px] font-bold text-emerald-800 mb-0.5">
                        You (Field Officer)
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap py-0.5">
                        {msg.description || msg.resolution_notes}
                      </p>
                      <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-slate-500">
                        <span>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                    </div>
                  </div>
                );
              }

              // Clean Incoming Beneficiary message to Field Worker (NO CLUTTER, WITH CLEAR REPLY BUTTON)
              return (
                <div key={msg.id || msg.ticket_code} className="space-y-1.5">
                  <div className="flex justify-start">
                    <div className="max-w-[85%] sm:max-w-[75%] bg-white rounded-2xl rounded-tl-xs p-3 shadow-xs border border-slate-200/90 text-slate-800">
                      
                      {/* Clean Header: Sender Name & Reply Icon Button */}
                      <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-slate-100">
                        <span className="text-xs font-bold text-emerald-800 tracking-tight">
                          {msg.beneficiary_name || 'Household Member'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleStartReply(msg)}
                          className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-full transition cursor-pointer"
                          title="Reply to message"
                        >
                          <Reply className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Reply</span>
                        </button>
                      </div>

                      {/* Clean Message Text */}
                      <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap py-0.5">
                        {msg.description || msg.subject}
                      </p>

                      {/* Clean Footer: Status & Time */}
                      <div className="flex items-center justify-between gap-2 mt-1 text-[10px] text-slate-400">
                        {msg.status === 'Resolved' ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Replied
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium">Awaiting reply</span>
                        )}
                        <span>
                          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* If Field Worker already recorded a resolution reply */}
                  {msg.resolution_notes && 
                   msg.status === 'Resolved' &&
                   msg.resolution_notes !== 'Under review by ADRA Independent Safeguarding Unit.' && 
                   !msg.resolution_notes.includes('Independent Safeguarding Unit') && (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] sm:max-w-[75%] bg-[#d9fdd3] text-slate-900 rounded-2xl rounded-tr-xs p-3 shadow-xs border border-[#b8f5b0]">
                        <div className="text-[11px] font-bold text-emerald-800 mb-0.5">
                          You (Field Officer)
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap py-0.5">
                          {msg.resolution_notes}
                        </p>
                        <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-slate-500">
                          <span>{msg.resolved_at ? new Date(msg.resolved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recorded'}</span>
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Standard View (Beneficiary view or Staff messaging superiors)
            return (
              <div key={msg.id || msg.ticket_code} className="space-y-1.5">
                {/* Outgoing Bubble (WhatsApp Green - Aligned Right, clean without technical tags) */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] sm:max-w-[75%] bg-[#d9fdd3] text-slate-900 rounded-2xl rounded-tr-xs p-3 shadow-xs border border-[#b8f5b0]">
                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap py-0.5">
                      {msg.description || msg.subject}
                    </p>

                    <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-slate-500">
                      <span>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM'}</span>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                  </div>
                </div>

                {/* Official Response Bubble (Incoming - Aligned Left) */}
                {msg.resolution_notes && 
                 msg.status === 'Resolved' && 
                 msg.resolution_notes !== 'Under review by ADRA Independent Safeguarding Unit.' && 
                 !msg.resolution_notes.includes('Independent Safeguarding Unit') && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] sm:max-w-[75%] bg-white rounded-2xl rounded-tl-xs p-3 shadow-xs border border-slate-200 text-slate-800">
                      <div className="flex items-center justify-between gap-2 mb-1 pb-1 border-b border-slate-100">
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {msg.resolved_by || currentContact.name || currentContact.role}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Reply
                        </span>
                      </div>

                      <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap py-0.5">
                        {msg.resolution_notes}
                      </p>

                      <span className="text-[10px] text-slate-400 block text-right mt-1">
                        {msg.resolved_at ? new Date(msg.resolved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Delivered'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* REPLAY QUOTE PREVIEW BANNER */}
      {replyingTo && (
        <div className="px-3.5 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs animate-in slide-in-from-bottom-1 duration-150 shrink-0">
          <div className="flex items-center gap-2 min-w-0 border-l-3 border-emerald-600 pl-2.5">
            <Reply className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-emerald-800">
                Replying to {replyingTo.beneficiary_name || 'Household'}
              </p>
              <p className="text-[11px] text-slate-600 truncate max-w-xs">
                {replyingTo.description || replyingTo.subject}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition cursor-pointer"
            title="Cancel reply"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* WHATSAPP BOTTOM INPUT BAR */}
      <form onSubmit={handleSendMessage} className="p-3 bg-slate-100 border-t border-slate-200 flex items-center gap-2 shrink-0">
        <div className="flex-1 bg-white rounded-2xl border border-slate-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 px-3.5 py-2 flex items-center gap-2 shadow-xs">
          <input
            ref={inputRef}
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={
              replyingTo
                ? `Reply to ${replyingTo.beneficiary_name || 'household'}...`
                : (isFieldWorker && activeTab === 'beneficiaries' ? 'Type a reply to household...' : `Message ${currentContact.role}...`)
            }
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
