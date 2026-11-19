import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  CheckCircle2,
  HardHat,
  ClipboardList,
  CheckCheck,
  ChevronDown,
  Check,
  ShieldCheck,
  Users,
  MessageSquare,
  Reply,
  X,
  Package,
  DollarSign,
  Search
} from 'lucide-react';
import { db } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { AdminFeedbackComplaintsOversightView } from '../../admin/components/AdminFeedbackComplaintsOversightView';

export function FeedbackComplaintsView({ beneficiary, currentUser: propUser, userType }) {
  const { currentUser: authUser } = useAuth();
  const effectiveUser = beneficiary || propUser || authUser;

  const role = (effectiveUser?.role || '').toLowerCase();
  const isSupplier = userType === 'supplier' || role.includes('supplier');
  const isFieldWorker = !isSupplier && role.includes('field');
  const isSupervisor = !isSupplier && role.includes('supervisor');
  const isDriver = !isSupplier && role.includes('driver');
  const isBeneficiary = !isSupplier && !isSupervisor && !isFieldWorker && !isDriver && (!effectiveUser?.role || role.includes('beneficiary'));
  const isFinanceOfficer = role.includes('finance');
  const isInventoryManager = role.includes('inventory') || role.includes('logistics');
  const isAdmin = role.includes('admin') || role.includes('director');
  const canViewOversight = isAdmin || isInventoryManager || isFinanceOfficer;
  const [showAdminOversight, setShowAdminOversight] = useState(isAdmin);

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [directories, setDirectories] = useState({
    users: [],
    fieldWorkers: [],
    supervisors: []
  });
  const [assignedInfo, setAssignedInfo] = useState({
    supervisorId: null,
    supervisorName: null,
    fieldWorkerId: null,
    fieldWorkerName: null
  });

  // Default active tab based on user role
  const getInitialTab = () => {
    if (isSupplier) return 'inventoryManager';
    if (isFieldWorker || isSupervisor) return 'beneficiaries';
    if (role.includes('finance')) return 'suppliers';
    return 'fieldWorker';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const dropdownRef = useRef(null);
  const chatBottomRef = useRef(null);
  const inputRef = useRef(null);
  const toast = useToast();

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

  // For beneficiaries, dynamically resolve assigned supervisor and field worker from requests
  useEffect(() => {
    const resolveAssignments = async () => {
      if (!isBeneficiary) return;
      try {
        const benId = beneficiary?.id || beneficiary?.beneficiary_code || effectiveUser?.id;
        const benCode = beneficiary?.beneficiary_code || effectiveUser?.beneficiary_code;
        const benName = beneficiary?.full_name || effectiveUser?.full_name || effectiveUser?.name;
        const benEmail = beneficiary?.email || effectiveUser?.email;

        let sId = beneficiary?.assigned_supervisor_id || beneficiary?.supervisor_id || effectiveUser?.assigned_supervisor_id || effectiveUser?.supervisor_id;
        let sName = beneficiary?.assigned_supervisor_name || beneficiary?.supervisor_name || beneficiary?.assigned_supervisor || effectiveUser?.assigned_supervisor_name || effectiveUser?.supervisor_name;
        let fwId = beneficiary?.assigned_field_worker_id || beneficiary?.field_worker_id || effectiveUser?.assigned_field_worker_id;
        let fwName = beneficiary?.assigned_field_worker_name || beneficiary?.assigned_field_worker || beneficiary?.field_worker_name || beneficiary?.field_worker || effectiveUser?.assigned_field_worker_name;

        if ((!sName && !sId) || (!fwName && !fwId)) {
          let reqs = benId ? await db.getAssistanceRequests(benId) : [];
          if (!reqs.length && benCode) {
            reqs = await db.getAssistanceRequests(benCode);
          }
          if (!reqs.length && benName) {
            reqs = await db.getAssistanceRequests(benName);
          }
          if (!reqs.length) {
            const all = await db.getAssistanceRequests();
            reqs = (all || []).filter(r =>
              (benId && (String(r.beneficiary_id) === String(benId) || String(r.beneficiary_code) === String(benId))) ||
              (benCode && String(r.beneficiary_code) === String(benCode)) ||
              (benEmail && r.beneficiary_email && r.beneficiary_email.toLowerCase() === benEmail.toLowerCase()) ||
              (benName && r.beneficiary_name && r.beneficiary_name.toLowerCase().includes(benName.toLowerCase()))
            );
          }

          const matched = (reqs || []).find(r =>
            Boolean(r.assigned_supervisor_name || r.assigned_supervisor_id || r.assigned_field_worker_name)
          ) || reqs?.[0];

          if (matched) {
            sId = sId || matched.assigned_supervisor_id || matched.supervisor_id;
            sName = sName || matched.assigned_supervisor_name || matched.supervisor_name;
            fwId = fwId || matched.assigned_field_worker_id || matched.field_worker_id;
            fwName = fwName || matched.assigned_field_worker_name || matched.field_worker_name;
          }
        }

        setAssignedInfo({
          supervisorId: sId || null,
          supervisorName: sName || null,
          fieldWorkerId: fwId || null,
          fieldWorkerName: fwName || null
        });
      } catch (err) {
        console.warn('Could not resolve beneficiary assignments:', err);
      }
    };
    resolveAssignments();
  }, [beneficiary?.id, beneficiary?.beneficiary_code, effectiveUser?.id, effectiveUser?.email, isBeneficiary]);

  // Load directory-backed recipients for direct feedback conversations
  useEffect(() => {
    const loadDirectories = async () => {
      try {
        const [users, fieldWorkers, supervisors] = await Promise.all([
          db.getUsers(),
          db.getFieldWorkers(),
          db.getSupervisors()
        ]);
        setDirectories({
          users: users || [],
          fieldWorkers: fieldWorkers || [],
          supervisors: supervisors || []
        });
      } catch (e) {
        console.error('Could not load feedback contact directories:', e);
        toast.error('Failed to load feedback contacts');
      }
    };

    loadDirectories();
  }, []);

  // Load complaints
  const loadComplaints = async () => {
    try {
      setLoading(true);
      const data = await db.getComplaints('all');
      setComplaints(data || []);
    } catch (e) {
      console.error(e);
      toast.error(`Failed to load messages: ${e.message || 'Unknown database error.'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [beneficiary, effectiveUser?.id, directories.users]);

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

  const currentId = String(
    effectiveUser?.id ||
    effectiveUser?.supplier_id ||
    effectiveUser?.beneficiary_code ||
    effectiveUser?.company_name ||
    (isBeneficiary ? 'b7' : '')
  );
  const makeRoleContact = (contactRole, title, icon, avatarColor) => ({
    id: `role:${contactRole.toLowerCase()}`,
    recipientId: `role:${contactRole.toLowerCase()}`,
    isRoleInbox: true,
    role: contactRole,
    name: `${contactRole} Team`,
    title,
    status: 'Online',
    badge: contactRole,
    avatarColor,
    icon,
    welcomeNote: `Send a message to the ${contactRole} team.`
  });
  const makeUserContact = (person, fallbackRole, icon, avatarColor) => {
    const personRole = person.role || fallbackRole;
    const personName = person.full_name || person.name || person.company_name || person.email || personRole;
    return {
      id: `user:${person.id}`,
      recipientId: String(person.id),
      role: personRole,
      name: personName,
      title: person.department || person.email || personRole,
      email: person.email || '',
      status: person.status || 'Online',
      badge: personRole,
      avatarColor,
      icon,
      welcomeNote: `Direct conversation with ${personName}.`
    };
  };
  const contacts = (() => {
    const usersByRole = (roleTerm) => directories.users.filter(u =>
      (u.role || '').toLowerCase().includes(roleTerm) &&
      String(u.status || 'active').toLowerCase() !== 'inactive' &&
      u.id &&
      String(u.id || '') !== currentId
    );
    const roleContacts = (roleTerm, title, icon, color) => {
      const users = usersByRole(roleTerm);
      return users.length
        ? users.map(user => makeUserContact(user, roleTerm, icon, color))
        : [makeRoleContact(title, title, icon, color)];
    };

    if (isSupplier) {
      return [
        ...roleContacts('inventory', 'Inventory Manager', Package, 'bg-[#006B56]'),
        ...roleContacts('finance', 'Finance Officer', DollarSign, 'bg-blue-700')
      ];
    }
    if (isFinanceOfficer) {
      return [
        {
          id: 'beneficiaries',
          role: 'Household Inquiries',
          name: 'Registered Households',
          title: 'Direct Beneficiary Inquiries',
          status: 'Live',
          badge: 'Incoming from Community',
          avatarColor: 'bg-emerald-600',
          icon: Users,
          welcomeNote: 'Incoming messages and questions from registered households appear here. Reply to continue a conversation.'
        },
        ...roleContacts('program', 'Programme Manager', ClipboardList, 'bg-purple-600'),
        ...roleContacts('inventory', 'Inventory Manager', Package, 'bg-[#006B56]')
      ];
    }
    if (isFieldWorker) {
      const assignedSupervisorId = effectiveUser?.supervisor_id;
      const assignedSupervisorName = (effectiveUser?.supervisor_name || '').toLowerCase();
      const assignedSupervisors = directories.supervisors.filter(person =>
        (assignedSupervisorId && String(person.id) === String(assignedSupervisorId)) ||
        (assignedSupervisorName && (person.name || '').toLowerCase() === assignedSupervisorName)
      );
      const supervisors = assignedSupervisors.length ? assignedSupervisors : directories.supervisors;
      return [
        {
          id: 'beneficiaries',
          role: 'Household Inquiries',
          name: 'Registered Households',
          title: 'Direct Beneficiary Inquiries',
          status: 'Live',
          badge: 'Incoming from Community',
          avatarColor: 'bg-emerald-600',
          icon: Users,
          welcomeNote: 'Incoming messages and questions from registered households appear here. Reply to continue a conversation.'
        },
        ...supervisors
          .filter(person => String(person.id) !== currentId)
          .map(person => makeUserContact(person, 'Supervisor', ShieldCheck, 'bg-blue-600')),
        ...roleContacts('program', 'Programme Manager', ClipboardList, 'bg-purple-600')
      ];
    }
    if (isSupervisor) {
      const assignedWorkers = directories.fieldWorkers.filter(worker =>
        String(worker.supervisor_id || '') === currentId ||
        (worker.supervisor_name && worker.supervisor_name.toLowerCase() === (effectiveUser?.full_name || effectiveUser?.name || '').toLowerCase())
      );
      const workers = assignedWorkers.length ? assignedWorkers : directories.fieldWorkers;
      return [
        {
          id: 'beneficiaries',
          role: 'Household Inquiries',
          name: 'Registered Households',
          title: 'Direct Beneficiary Inquiries',
          status: 'Live',
          badge: 'Incoming from Community',
          avatarColor: 'bg-emerald-600',
          icon: Users,
          welcomeNote: 'Incoming messages and questions from registered households appear here. Reply to continue a conversation.'
        },
        ...workers
          .filter(person => String(person.id) !== currentId)
          .map(person => makeUserContact(person, 'Field Worker', HardHat, 'bg-emerald-600')),
        ...roleContacts('program', 'Programme Manager', ClipboardList, 'bg-purple-600')
      ];
    }
    if (role.includes('inventory') || role.includes('logistics')) {
      return [
        {
          id: 'beneficiaries',
          role: 'Household Inquiries',
          name: 'Registered Households',
          title: 'Direct Beneficiary Inquiries',
          status: 'Live',
          badge: 'Incoming from Community',
          avatarColor: 'bg-emerald-600',
          icon: Users,
          welcomeNote: 'Incoming messages and questions from registered households appear here. Reply to continue a conversation.'
        },
        ...roleContacts('program', 'Programme Manager', ClipboardList, 'bg-purple-600'),
        ...roleContacts('finance', 'Finance Officer', DollarSign, 'bg-blue-700')
      ];
    }
    if (isBeneficiary) {
      // 1. Resolve assigned supervisor from assignedInfo or beneficiary record
      const assignedSupervisorId = assignedInfo.supervisorId || beneficiary?.assigned_supervisor_id || beneficiary?.supervisor_id;
      const assignedSupervisorName = assignedInfo.supervisorName || beneficiary?.assigned_supervisor_name || beneficiary?.supervisor_name || beneficiary?.assigned_supervisor;
      const assignedFwId = assignedInfo.fieldWorkerId || beneficiary?.assigned_field_worker_id || beneficiary?.field_worker_id;
      const assignedFwName = assignedInfo.fieldWorkerName || beneficiary?.assigned_field_worker_name || beneficiary?.assigned_field_worker || beneficiary?.field_worker_name || beneficiary?.field_worker;

      const cleanSupId = assignedSupervisorId ? String(assignedSupervisorId).toLowerCase().trim() : '';
      const cleanSupName = assignedSupervisorName ? String(assignedSupervisorName).toLowerCase().trim() : '';

      const matchedSupervisor = (cleanSupId || cleanSupName)
        ? directories.supervisors.find(sup =>
            (cleanSupId && (String(sup.id).toLowerCase() === cleanSupId || String(sup.email || '').toLowerCase() === cleanSupId)) ||
            (cleanSupName && (
              (sup.full_name || sup.name || '').toLowerCase().includes(cleanSupName) ||
              cleanSupName.includes((sup.full_name || sup.name || '').toLowerCase())
            ))
          )
        : null;

      const hasAssignedSupervisor = Boolean(matchedSupervisor || cleanSupName || cleanSupId);

      // If supervisor IS assigned, show assigned supervisor + assigned field worker
      if (hasAssignedSupervisor) {
        const supervisorContactObj = matchedSupervisor
          ? makeUserContact(matchedSupervisor, 'Supervisor', ShieldCheck, 'bg-blue-600')
          : {
              id: cleanSupId ? `user:${cleanSupId}` : 'assigned:supervisor',
              recipientId: cleanSupId || 'assigned-supervisor',
              role: 'Supervisor',
              name: assignedSupervisorName || 'Assigned Supervisor',
              title: 'Field Operations & Supervisory',
              email: '',
              status: 'Online',
              badge: 'Supervisor',
              avatarColor: 'bg-blue-600',
              icon: ShieldCheck,
              welcomeNote: `Direct conversation with your assigned Supervisor ${assignedSupervisorName || ''}.`
            };

        // Find assigned field worker
        const cleanFwId = assignedFwId ? String(assignedFwId).toLowerCase().trim() : '';
        const cleanFwName = assignedFwName ? String(assignedFwName).toLowerCase().trim() : '';

        let matchedWorker = (cleanFwId || cleanFwName)
          ? directories.fieldWorkers.find(w =>
              (cleanFwId && String(w.id).toLowerCase() === cleanFwId) ||
              (cleanFwName && (
                (w.full_name || w.name || '').toLowerCase().includes(cleanFwName) ||
                cleanFwName.includes((w.full_name || w.name || '').toLowerCase())
              ))
            )
          : null;

        // If no direct worker by name, find workers belonging to this supervisor
        if (!matchedWorker && matchedSupervisor) {
          matchedWorker = directories.fieldWorkers.find(w =>
            String(w.supervisor_id || '') === String(matchedSupervisor.id) ||
            (w.supervisor_name && (matchedSupervisor.name || matchedSupervisor.full_name) &&
             w.supervisor_name.toLowerCase() === (matchedSupervisor.name || matchedSupervisor.full_name || '').toLowerCase())
          );
        }

        const workerContactObj = matchedWorker
          ? makeUserContact(matchedWorker, 'Field Worker', HardHat, 'bg-emerald-600')
          : (cleanFwName || cleanFwId)
          ? {
              id: cleanFwId ? `user:${cleanFwId}` : 'assigned:field_worker',
              recipientId: cleanFwId || 'assigned-field-worker',
              role: 'Field Worker',
              name: assignedFwName || 'Assigned Field Officer',
              title: 'Field Relief Operations',
              email: '',
              status: 'Online',
              badge: 'Field Worker',
              avatarColor: 'bg-emerald-600',
              icon: HardHat,
              welcomeNote: `Direct conversation with your assigned Field Worker ${assignedFwName || ''}.`
            }
          : null;

        return [
          supervisorContactObj,
          ...(workerContactObj ? [workerContactObj] : []),
          ...roleContacts('program', 'Programme Manager', ClipboardList, 'bg-purple-600'),
          ...roleContacts('inventory', 'Inventory Manager', Package, 'bg-[#006B56]'),
          ...roleContacts('finance', 'Finance Officer', DollarSign, 'bg-blue-700')
        ];
      }

      // No supervisor assigned — show Programme Manager, Inventory Manager, and Finance Officer
      return [
        ...roleContacts('program', 'Programme Manager', ClipboardList, 'bg-purple-600'),
        ...roleContacts('inventory', 'Inventory Manager', Package, 'bg-[#006B56]'),
        ...roleContacts('finance', 'Finance Officer', DollarSign, 'bg-blue-700')
      ];
    }
    if (isDriver) {
      return [
        ...roleContacts('inventory', 'Inventory Manager', Package, 'bg-[#006B56]'),
        ...roleContacts('supervisor', 'Supervisor', ShieldCheck, 'bg-blue-600')
      ];
    }
    return [
      {
        id: 'beneficiaries',
        role: 'Household Inquiries',
        name: 'Registered Households',
        title: 'Direct Beneficiary Inquiries',
        status: 'Live',
        badge: 'Incoming from Community',
        avatarColor: 'bg-emerald-600',
        icon: Users,
        welcomeNote: 'Incoming messages and questions from registered households appear here. Reply to continue a conversation.'
      },
      ...roleContacts('program', 'Programme Manager', ClipboardList, 'bg-purple-600'),
      ...roleContacts('supervisor', 'Supervisor', ShieldCheck, 'bg-blue-600'),
      ...roleContacts('field', 'Field Worker', HardHat, 'bg-emerald-600'),
      ...roleContacts('inventory', 'Inventory Manager', Package, 'bg-[#006B56]'),
      ...roleContacts('finance', 'Finance Officer', DollarSign, 'bg-blue-700')
    ];
  })();

  useEffect(() => {
    if (contacts.length && !contacts.some(contact => contact.id === activeTab)) {
      setActiveTab(contacts[0].id);
    }
  }, [contacts, activeTab]);

  const currentContact = contacts.find(c => c.id === activeTab) || contacts[0] || {
    id: 'no-contact',
    role: 'Feedback',
    name: 'No contacts available',
    title: 'No directory contacts found',
    status: 'Offline',
    avatarColor: 'bg-slate-500',
    icon: Users,
    welcomeNote: 'No contacts are currently available.'
  };

  const isMessageForContact = (message, contact) => {
    if (!contact) return false;
    const senderId = String(message.beneficiary_id || '');
    const recipientId = String(message.recipient_id || '');
    const senderEmail = (message.sender_email || '').toLowerCase().trim();
    const recipientEmail = (message.recipient_email || '').toLowerCase().trim();
    const recipientRole = (message.recipient_role || '').toLowerCase().trim();
    const recipientName = (message.recipient_name || '').toLowerCase().trim();
    const senderName = (message.sender_name || message.beneficiary_name || '').toLowerCase().trim();

    const currentRole = (effectiveUser?.role || (isSupplier ? 'Supplier' : (isBeneficiary ? 'Beneficiary' : ''))).toLowerCase().trim();
    const currentName = (effectiveUser?.name || effectiveUser?.full_name || '').toLowerCase().trim();

    if (contact.id === 'beneficiaries') {
      if (isSupervisor) {
        return recipientRole.includes('supervisor') ||
          (currentName && recipientName.includes(currentName)) ||
          recipientId === currentId ||
          message.category === 'Supervisor Response';
      }
      if (isFinanceOfficer) {
        return recipientRole.includes('finance') ||
          (currentName && recipientName.includes(currentName)) ||
          recipientId === currentId ||
          message.category === 'Finance Officer Response';
      }
      if (isInventoryManager) {
        return recipientRole.includes('inventory') ||
          recipientRole.includes('logistics') ||
          (currentName && recipientName.includes(currentName)) ||
          recipientId === currentId ||
          message.category === 'Inventory Manager Response';
      }
      if (role.includes('program')) {
        return recipientRole.includes('program') ||
          (currentName && recipientName.includes(currentName)) ||
          recipientId === currentId ||
          message.category === 'Programme Manager Response';
      }
      return recipientRole.includes('field') ||
        (currentName && recipientName.includes(currentName)) ||
        recipientId === currentId ||
        message.category === 'Field Worker Response';
    }

    const myIds = new Set([
      String(effectiveUser?.id || ''),
      String(beneficiary?.id || ''),
      String(authUser?.id || ''),
      String(effectiveUser?.beneficiary_code || ''),
      String(beneficiary?.beneficiary_code || ''),
      currentId
    ].filter(Boolean));

    const myEmails = new Set([
      (effectiveUser?.email || '').toLowerCase().trim(),
      (beneficiary?.email || '').toLowerCase().trim(),
      (authUser?.email || '').toLowerCase().trim()
    ].filter(Boolean));

    const contactIds = new Set([
      String(contact.recipientId || ''),
      String(contact.id || '').replace(/^user:/, '')
    ].filter(Boolean));

    const contactEmail = (contact.email || '').toLowerCase().trim();
    const contactEmails = new Set([contactEmail].filter(Boolean));

    const contactName = (contact.name || '').toLowerCase().trim();
    const contactRole = (contact.role || '').toLowerCase().trim();

    // Check if this message was sent by current user
    const isFromMe = myIds.has(senderId) || (senderEmail && myEmails.has(senderEmail));

    // Check if this message was sent to current user
    const isToMe = myIds.has(recipientId) ||
      (recipientEmail && myEmails.has(recipientEmail)) ||
      recipientId === `role:${currentRole}` ||
      (currentRole && recipientRole === currentRole);

    // Is the contact the recipient of this message?
    const toContact = contactIds.has(recipientId) ||
      (contactEmail && recipientEmail && contactEmails.has(recipientEmail)) ||
      (contactName && recipientName && (recipientName.includes(contactName) || contactName.includes(recipientName))) ||
      (contact.isRoleInbox && recipientRole === contactRole);

    // Is the contact the sender of this message?
    const fromContact = contactIds.has(senderId) ||
      (contactEmail && senderEmail && contactEmails.has(senderEmail)) ||
      (contactName && senderName && (senderName.includes(contactName) || contactName.includes(senderName)));

    if (isFromMe && toContact) return true;
    if (isToMe && fromContact) return true;

    // Fallback for role-inbox or legacy category
    if (contact.isRoleInbox && recipientRole === contactRole) return true;
    if (isSupplier && (message.category === 'Supplier Logistics Feedback' || message.category === 'Feedback & Accountability')) {
      return recipientRole === contactRole || (recipientName && contactName && recipientName.includes(contactName));
    }
    if (isInventoryManager && message.category === 'Supplier Logistics Feedback' && (senderId === contact.recipientId || contactRole === 'supplier')) {
      return true;
    }

    return false;
  };

  const filteredContacts = contacts.filter(contact => {
    const search = contactSearch.trim().toLowerCase();
    return !search || [contact.name, contact.role, contact.title, contact.email]
      .some(value => (value || '').toLowerCase().includes(search));
  });

  // Filter and sort complaints for the currently selected contact (first sent at top, newest at bottom)
  const activeChatMessages = complaints
    .filter(c => {
      if ((isFieldWorker || isSupervisor) && activeTab === 'beneficiaries') {
        const isTargeted = isSupervisor
          ? ((c.recipient_role || '').toLowerCase().includes('supervisor') ||
             (effectiveUser?.name && (c.recipient_name || '').toLowerCase().includes(effectiveUser.name.toLowerCase())) ||
             c.category === 'Supervisor Response')
          : ((c.recipient_role || '').toLowerCase().includes('field') ||
             (effectiveUser?.name && (c.recipient_name || '').toLowerCase().includes(effectiveUser.name.toLowerCase())) ||
             c.category === 'Field Worker Response');
        return isTargeted;
      }
      return isMessageForContact(c, currentContact);
    })
    .sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeA - timeB;
    });

  // Count messages per contact
  const getContactMessageCount = (contactId) => {
    if ((isFieldWorker || isSupervisor) && contactId === 'beneficiaries') {
      return complaints.filter(c => {
        if (isSupervisor) {
          return (c.recipient_role || '').toLowerCase().includes('supervisor') ||
            (effectiveUser?.name && (c.recipient_name || '').toLowerCase().includes(effectiveUser.name.toLowerCase())) ||
            c.category === 'Supervisor Response';
        }
        return (c.recipient_role || '').toLowerCase().includes('field') ||
          (effectiveUser?.name && (c.recipient_name || '').toLowerCase().includes(effectiveUser.name.toLowerCase())) ||
          c.category === 'Field Worker Response';
      }).length;
    }
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return 0;
    return complaints.filter(c => isMessageForContact(c, contact)).length;
  };

  // Send message in WhatsApp chat
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim()) return;

    try {
      setIsSubmitting(true);
      const workerName = effectiveUser?.full_name || effectiveUser?.name || (isSupervisor ? 'Supervisor' : 'Field Worker');

      if ((isFieldWorker || isSupervisor) && activeTab === 'beneficiaries') {
        // Staff replying to beneficiary inquiry
        const responderRole = isSupervisor ? 'Supervisor' : 'Field Worker';
        const responderTitle = isSupervisor ? 'Field Supervisor' : 'Field Officer';
        const responseCategory = isSupervisor ? 'Supervisor Response' : 'Field Worker Response';

        const targetComplaint = replyingTo || activeChatMessages.find(m => (!m.resolution_notes || m.status !== 'Resolved') && m.category !== responseCategory) || activeChatMessages[activeChatMessages.length - 1];

        if (targetComplaint && targetComplaint.id) {
          await db.updateComplaint(targetComplaint.id, {
            status: 'Resolved',
            resolution_notes: messageText.trim(),
            resolved_by: `${workerName} (${responderTitle})`,
            resolved_at: new Date().toISOString()
          });
        }

        // Also add clean response complaint to the shared thread
        await db.createComplaint({
          beneficiary_id: currentId,
          beneficiary_name: workerName,
          sender_email: effectiveUser?.email || null,
          sender_name: workerName,
          sender_role: effectiveUser?.role || responderRole,
          recipient_id: targetComplaint?.beneficiary_id || 'b7',
          recipient_role: 'Beneficiary',
          recipient_name: targetComplaint?.beneficiary_name || 'Household Member',
          recipient_email: targetComplaint?.sender_email || null,
          category: responseCategory,
          severity: 'Low',
          is_anonymous: false,
          subject: messageText.trim().length > 40 ? `${messageText.trim().substring(0, 37)}...` : messageText.trim(),
          description: messageText.trim(),
          resolution_notes: messageText.trim(),
          resolved_by: `${workerName} (${responderTitle})`,
          resolved_at: new Date().toISOString(),
          status: 'Resolved'
        });

        toast.success(`Reply sent to ${targetComplaint?.beneficiary_name || 'beneficiary'}`);
        setReplyingTo(null);
      } else {
        const senderName = effectiveUser?.company_name || effectiveUser?.full_name || effectiveUser?.name || 'Authorized Member';
        const senderId = currentId;

        await db.createComplaint({
          beneficiary_id: senderId,
          beneficiary_name: senderName,
          sender_email: effectiveUser?.email || null,
          sender_name: senderName,
          sender_role: effectiveUser?.role || (isSupplier ? 'Supplier' : (isBeneficiary ? 'Beneficiary' : undefined)),
          recipient_id: currentContact.recipientId,
          recipient_role: currentContact.role,
          recipient_name: currentContact.name,
          recipient_email: currentContact.email || null,
          category: isSupplier ? 'Supplier Logistics Feedback' : 'Feedback & Accountability',
          severity: 'Medium',
          is_anonymous: false,
          subject: messageText.trim().length > 50 ? `${messageText.trim().substring(0, 47)}...` : messageText.trim(),
          description: messageText.trim(),
          status: 'Submitted'
        });

        toast.success(`Message sent directly to ${currentContact.name || currentContact.role}`);
      }

      setMessageText('');
      await loadComplaints();
    } catch (err) {
      console.error(err);
      toast.error(`Could not send message: ${err.message || 'Unknown database error.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (canViewOversight && showAdminOversight) {
    return (
      <div className="w-full h-full flex flex-col bg-slate-50 overflow-hidden font-sans">
        {/* Clean top bar matching the direct messages header */}
        <div className="bg-white border-b border-slate-200 px-3 py-2 text-slate-900 shrink-0 flex items-center justify-between gap-3 relative z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#006B56] flex items-center justify-center border border-emerald-100 shrink-0">
              <ClipboardList className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              {isFinanceOfficer ? 'Supplier feedback ledger' : 'Feedback ledger'}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setShowAdminOversight(false)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-medium transition cursor-pointer shrink-0"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#006B56]" />
            <span>Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-50">
          <AdminFeedbackComplaintsOversightView
            hideHeader={true}
            scope={isFinanceOfficer ? 'supplier-ledger' : 'all'}
            currentUser={effectiveUser}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col h-full min-h-[calc(100vh-120px)] bg-white border-0 shadow-none rounded-none overflow-hidden font-sans">
      
      {/* CLEAN LIGHT WHATSAPP HEADER BAR */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 text-slate-900 shrink-0 flex items-center justify-between gap-3 shadow-2xs relative z-30" ref={dropdownRef}>
        
        {/* Left: Officer Role & Switch Button (or static info if single contact like Supplier) */}
        <div className="relative">
          {contacts.length > 1 ? (
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
          ) : (
            <div className="flex items-center gap-3 p-1 text-left">
              <div className="relative shrink-0">
                <div className={`w-10 h-10 rounded-full ${currentContact.avatarColor} text-white flex items-center justify-center font-bold shadow-xs`}>
                  {React.createElement(currentContact.icon, { className: 'w-5 h-5' })}
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900 tracking-tight">
                    {currentContact.role}
                  </span>
                  <span className="text-[10px] font-bold text-[#006B56] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {currentContact.name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <span>{currentContact.title}</span>
                  <span>•</span>
                  <span className="text-emerald-600 font-medium">{currentContact.status}</span>
                </p>
              </div>
            </div>
          )}

          {/* Clean Dropdown Menu Popover */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 max-h-[70vh] overflow-y-auto bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl z-50 divide-y divide-slate-100 animate-in fade-in-50 duration-150">
              <div className="p-2.5 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isFieldWorker ? 'Select Communication Channel' : 'Select Recipient to Chat With'}
              </div>

              {contacts.length > 5 && (
                <div className="p-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="search"
                      value={contactSearch}
                      onChange={event => setContactSearch(event.target.value)}
                      placeholder="Search contacts..."
                      className="w-full text-xs outline-none"
                      aria-label="Search feedback contacts"
                    />
                  </div>
                </div>
              )}

              {filteredContacts.map(c => {
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
                      setContactSearch('');
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
              {filteredContacts.length === 0 && (
                <p className="p-4 text-xs text-slate-500">No contacts match your search.</p>
              )}
            </div>
          )}
        </div>

        {canViewOversight && (
          <button
            type="button"
            onClick={() => setShowAdminOversight(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer shrink-0"
            title="Inspect All Senders & Receivers"
          >
            <ClipboardList className="w-3.5 h-3.5 text-[#006B56]" />
            <span className="hidden sm:inline">Complaints & Feedback Ledger</span>
            <span className="sm:hidden">Ledger</span>
          </button>
        )}
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

        {!contacts.length && (
          <div className="text-center py-4">
            <span className="text-xs text-slate-500 bg-white/80 px-3 py-1.5 rounded-full border border-slate-200">
              No active contacts are available in the directory.
            </span>
          </div>
        )}

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
            const isOutgoing = !msg.recipient_id || String(msg.beneficiary_id || '') === currentId;
            return (
              <div key={msg.id || msg.ticket_code} className="space-y-1.5">
                <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] sm:max-w-[75%] text-slate-900 rounded-2xl p-3 shadow-xs border ${
                    isOutgoing
                      ? 'bg-[#d9fdd3] rounded-tr-xs border-[#b8f5b0]'
                      : 'bg-white rounded-tl-xs border-slate-200'
                  }`}>
                    {!isOutgoing && (
                      <p className="text-[11px] font-bold text-emerald-800 mb-1">
                        {msg.beneficiary_name || currentContact.name}
                      </p>
                    )}
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
          disabled={!messageText.trim() || isSubmitting || !contacts.length}
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
