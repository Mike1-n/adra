import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Eye,
  Download,
  FileSpreadsheet,
  RefreshCw,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { db, isSupabaseConfigured, supabase } from '../../../lib/supabase';
import { formatDate } from '../../../lib/utils';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { exportToCSV, exportToPDF } from '../../../lib/reportGenerator';

export function AdminFeedbackComplaintsOversightView({
  hideHeader = false,
  scope = 'all',
  currentUser: propUser
} = {}) {
  const { currentUser: authUser } = useAuth();
  const currentUser = propUser || authUser;
  const toast = useToast();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [senderFilter, setSenderFilter] = useState('ALL');
  const [recipientFilter, setRecipientFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Inspection Modal
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [newStatus, setNewStatus] = useState('Resolved');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      setComplaints([]);
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase is not configured; the feedback ledger only displays database records.');
      }

      const complaintsQuery = supabase
        .from('beneficiary_complaints')
        .select('*')
        .order('created_at', { ascending: false });
      if (scope === 'supplier-ledger') {
        complaintsQuery.or('sender_role.ilike.%supplier%,recipient_role.ilike.%supplier%,category.ilike.%supplier%');
      }

      const emptyResult = Promise.resolve({ data: [], error: null });
      const [complaintsResult, donorQueriesResult, userFeedbacksResult] = await Promise.all([
        complaintsQuery,
        scope === 'supplier-ledger'
          ? emptyResult
          : supabase.from('donor_queries').select('*').order('created_at', { ascending: false }),
        scope === 'supplier-ledger'
          ? emptyResult
          : supabase.from('user_feedbacks').select('*').order('created_at', { ascending: false })
      ]);
      const queryError = complaintsResult.error || donorQueriesResult.error || userFeedbacksResult.error;
      if (queryError) throw queryError;

      const compData = complaintsResult.data || [];
      const donorData = donorQueriesResult.data || [];
      const userFbData = userFeedbacksResult.data || [];

      const mappedComplaints = (compData || []).map(c => ({
        ...c,
        record_source: 'beneficiary_complaints',
        source_type: /inventory|logistics|warehouse|supply chain/i.test(
          `${c.recipient_role || ''} ${c.recipient_name || ''}`
        )
          ? 'Inventory Feedback'
          : c.category?.toLowerCase().includes('supplier')
            ? 'Supplier Feedback'
            : 'Community Grievance',
        sender_name: c.sender_name || c.beneficiary_name,
        sender_role: c.sender_role || (c.category?.toLowerCase().includes('supplier') ? 'Supplier' : undefined),
      })).filter(c => {
        if (scope !== 'supplier-ledger') return true;
        const financeRole = value => String(value || '').toLowerCase().includes('finance');
        const financeEmail = String(currentUser?.email || '').trim().toLowerCase();
        const financeId = String(currentUser?.id || '');
        return financeRole(c.sender_role) ||
          financeRole(c.recipient_role) ||
          Boolean(financeEmail && (
            String(c.sender_email || '').trim().toLowerCase() === financeEmail ||
            String(c.recipient_email || '').trim().toLowerCase() === financeEmail
          )) ||
          Boolean(financeId && (
            String(c.beneficiary_id || '') === financeId ||
            String(c.recipient_id || '') === financeId
          ));
      });

      const mappedDonorQueries = (donorData || []).map(q => ({
        ...q,
        record_source: 'donor_queries',
        id: q.id,
        ticket_code: q.ticket_code || q.id,
        source_type: 'Donor Inquiry',
        sender_name: q.sender_name || q.sender,
        is_anonymous: false,
        description: q.message,
        resolution_notes: q.response || null,
        resolved_by: q.responded_by || null,
        resolved_at: q.responded_at || null,
        responses: [
          ...(q.message ? [{
            sender: q.sender_name || q.sender || 'Sender',
            role: q.sender_role,
            message: q.message,
            timestamp: q.created_at
          }] : []),
          ...(q.response ? [{
            sender: q.responded_by,
            role: q.recipient_role,
            message: q.response,
            timestamp: q.responded_at
          }] : [])
        ]
      }));

      const mappedUserFeedbacks = (userFbData || []).map(fb => ({
        ...fb,
        record_source: 'user_feedbacks',
        id: fb.id,
        ticket_code: fb.ticket_code || fb.id,
        source_type: /inventory|logistics|warehouse|supply chain/i.test(
          `${fb.module || ''} ${fb.module_id || ''}`
        )
          ? 'Inventory Feedback'
          : 'Module Review',
        sender_name: fb.user_name,
        sender_role: fb.user_role,
        sender_location: fb.module,
        recipient_name: fb.responded_by,
        severity: fb.priority,
        is_anonymous: false,
        description: fb.message,
        resolution_notes: fb.admin_response || null,
        resolved_by: fb.responded_by || null,
        resolved_at: fb.responded_at || null,
        responses: [
          ...(fb.message ? [{
            sender: fb.user_name || 'Sender',
            role: fb.user_role,
            message: fb.message,
            timestamp: fb.created_at
          }] : []),
          ...(fb.admin_response ? [{
            sender: fb.responded_by,
            message: fb.admin_response,
            timestamp: fb.responded_at
          }] : [])
        ]
      }));

      const combined = [...mappedComplaints, ...mappedDonorQueries, ...mappedUserFeedbacks].sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      });

      setComplaints(combined);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to load complaints and feedback registry: ${err.message || 'Unknown database error.'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [scope]);

  // Filtered dataset
  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      // Source filter
      if (sourceFilter !== 'ALL') {
        if (c.source_type !== sourceFilter) return false;
      }

      // Sender filter
      if (senderFilter !== 'ALL') {
        const sRole = (c.sender_role || '').toLowerCase();
        if (senderFilter === 'Beneficiary' && !sRole.includes('beneficiary')) return false;
        if (senderFilter === 'Donor' && !sRole.includes('donor')) return false;
        if (senderFilter === 'Field Worker' && !sRole.includes('field')) return false;
        if (senderFilter === 'Supervisor' && !sRole.includes('supervisor')) return false;
        if (senderFilter === 'Supplier' && !sRole.includes('supplier')) return false;
        if (senderFilter === 'Program Manager' && !sRole.includes('program')) return false;
        if (senderFilter === 'Finance' && !sRole.includes('finance')) return false;
        if (senderFilter === 'Community' && !sRole.includes('community') && !c.is_anonymous) return false;
      }

      // Recipient filter
      if (recipientFilter !== 'ALL') {
        const rRole = (c.recipient_role || '').toLowerCase();
        if (recipientFilter === 'Field Worker' && !rRole.includes('field')) return false;
        if (recipientFilter === 'Supervisor' && !rRole.includes('supervisor')) return false;
        if (recipientFilter === 'Program Manager' && !rRole.includes('program')) return false;
        if (recipientFilter === 'Compliance Officer' && !rRole.includes('compliance') && !rRole.includes('safeguard')) return false;
        if (recipientFilter === 'Finance' && !rRole.includes('finance') && !rRole.includes('procurement')) return false;
        if (recipientFilter === 'Inventory Manager' && !rRole.includes('inventory') && !rRole.includes('logistics')) return false;
        if (recipientFilter === 'Administrator' && !rRole.includes('admin') && !rRole.includes('director')) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        if (c.status !== statusFilter) return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL') {
        if (c.category !== categoryFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = c.ticket_code?.toLowerCase().includes(q);
        const matchesSender = (c.sender_name || c.beneficiary_name)?.toLowerCase().includes(q) || (c.sender_role)?.toLowerCase().includes(q);
        const matchesRecipient = c.recipient_name?.toLowerCase().includes(q) || c.recipient_role?.toLowerCase().includes(q);
        const matchesSubject = c.subject?.toLowerCase().includes(q);
        const matchesDesc = c.description?.toLowerCase().includes(q);
        const matchesCat = c.category?.toLowerCase().includes(q);
        if (!matchesCode && !matchesSender && !matchesRecipient && !matchesSubject && !matchesDesc && !matchesCat) {
          return false;
        }
      }

      return true;
    });
  }, [complaints, sourceFilter, senderFilter, recipientFilter, statusFilter, categoryFilter, searchQuery]);

  const pendingCount = complaints.filter(c => c.status === 'Submitted' || c.status === 'Under Review').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

  // Handle Inspection
  const handleOpenInspect = (complaint) => {
    setActiveComplaint(complaint);
    setReplyText('');
    setNewStatus(complaint.status || 'Under Review');
  };

  // Save a reply and/or update the ticket status.
  const handleSaveDecision = async () => {
    if (!activeComplaint) return;
    try {
      setIsUpdating(true);
      const reply = replyText.trim();
      const timestamp = new Date().toISOString();
      const updates = {
        status: newStatus,
        resolution_notes: reply || activeComplaint.resolution_notes,
        resolved_by: newStatus === 'Resolved'
          ? `${currentUser?.full_name || currentUser?.name || 'ADRA Staff'} (${currentUser?.role || 'Staff'})`
          : activeComplaint.resolved_by,
        resolved_at: newStatus === 'Resolved' ? timestamp : activeComplaint.resolved_at
      };

      if (activeComplaint.record_source === 'donor_queries' || activeComplaint.source_type === 'Donor Inquiry') {
        if (db.updateDonorQuery) {
          await db.updateDonorQuery(activeComplaint.id, {
            status: newStatus,
            response: updates.resolution_notes,
            responded_by: updates.resolved_by,
            responded_at: updates.resolved_at ? updates.resolved_at.split('T')[0] : new Date().toISOString().split('T')[0]
          });
        }
      } else if (activeComplaint.record_source === 'user_feedbacks' || activeComplaint.source_type === 'Module Review') {
        if (db.updateUserFeedbackStatus) {
          await db.updateUserFeedbackStatus(activeComplaint.id, {
            status: newStatus,
            admin_response: updates.resolution_notes,
            responded_by: updates.resolved_by,
            responded_at: updates.resolved_at
          });
        }
      } else {
        const complaintId = activeComplaint.id || activeComplaint.ticket_code;
        if (reply) {
          const senderName = currentUser?.full_name || currentUser?.name || 'ADRA Staff';
          await db.createComplaint({
            ticket_code: `RE-${Date.now()}`,
            beneficiary_id: currentUser?.id,
            beneficiary_name: senderName,
            sender_email: currentUser?.email || null,
            sender_name: senderName,
            sender_role: currentUser?.role || 'Staff',
            recipient_id: activeComplaint.beneficiary_id,
            recipient_email: activeComplaint.sender_email || null,
            recipient_name: activeComplaint.sender_name || activeComplaint.beneficiary_name,
            recipient_role: activeComplaint.sender_role,
            category: activeComplaint.category || 'Feedback & Accountability',
            severity: activeComplaint.severity || activeComplaint.priority || 'Normal',
            is_anonymous: false,
            subject: activeComplaint.subject ? `Re: ${activeComplaint.subject}` : 'Feedback reply',
            description: reply,
            status: newStatus
          });
        }

        if (newStatus !== activeComplaint.status) {
          try {
            if (db.updateComplaintStatus) {
              await db.updateComplaintStatus(complaintId, { status: newStatus });
            } else if (db.updateComplaint) {
              await db.updateComplaint(complaintId, { status: newStatus });
            }
          } catch (statusError) {
            if (!reply) throw statusError;
            console.error(statusError);
            setReplyText('');
            setActiveComplaint(null);
            await loadComplaints();
            toast.error(`Reply sent, but ticket status could not be updated: ${statusError.message || 'Unknown database error.'}`);
            return;
          }
        }
      }
      toast.success(reply ? 'Reply sent.' : `Ticket status updated to "${newStatus}".`);
      setActiveComplaint(null);
      await loadComplaints();
    } catch (err) {
      console.error(err);
      toast.error(`Failed to update ticket: ${err.message || 'Unknown database error.'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    const filename = `ADRA_INTER_PARTY_FEEDBACK_${new Date().toISOString().split('T')[0]}.csv`;
    const exportData = filtered.map(c => ({
      Ticket_ID: c.ticket_code,
      Sender_Name: c.sender_name || c.beneficiary_name || '',
      Sender_Role: c.sender_role || '',
      Sender_Location: c.sender_location || '',
      Recipient_Role: c.recipient_role,
      Recipient_Name: c.recipient_name,
      Category: c.category,
      Severity: c.severity || c.priority,
      Subject: c.subject,
      Status: c.status,
      Submitted_Date: c.created_at ? new Date(c.created_at).toLocaleDateString() : '',
      Resolution_Notes: c.resolution_notes || ''
    }));
    exportToCSV(exportData, filename);
    toast.success(`Exported ${filtered.length} inter-party records to CSV.`);
  };

  const handleExportPDF = () => {
    exportToPDF({
      title: 'ADRA • INTER-PARTY COMPLAINTS & FEEDBACK OVERSIGHT AUDIT',
      subtitle: 'Accountability to Affected Populations (AAP) & Inter-Party Grievance Telemetry',
      columns: [
        { header: 'Ticket', key: 'ticket_code' },
        { header: 'Sender', key: 'sender_name' },
        { header: 'Recipient', key: 'recipient_role' },
        { header: 'Category', key: 'category' },
        { header: 'Subject', key: 'subject' },
        { header: 'Status', key: 'status' }
      ],
      data: filtered.map(c => ({
        ...c,
        sender_name: [c.sender_name || c.beneficiary_name, c.sender_role].filter(Boolean).join(' '),
        recipient_role: [c.recipient_role, c.recipient_name].filter(Boolean).join(' - ')
      })),
      fileName: 'ADRA_InterParty_Complaints_Report.pdf',
      summary: [
        { label: 'Total Audited', value: String(filtered.length) },
        { label: 'Awaiting Action', value: String(pendingCount) },
        { label: 'Resolved', value: String(resolvedCount) }
      ]
    });
    toast.success('Downloaded PDF compliance report.');
  };

  const activeFilterCount = [
    sourceFilter !== 'ALL',
    senderFilter !== 'ALL',
    recipientFilter !== 'ALL',
    categoryFilter !== 'ALL',
  ].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0 || statusFilter !== 'ALL' || searchQuery.trim() !== '';

  const conversationMessages = activeComplaint ? (() => {
    const storedMessages = Array.isArray(activeComplaint.responses) ? activeComplaint.responses : [];
    const firstMessage = storedMessages[0] || {
      sender: activeComplaint.sender_name || activeComplaint.beneficiary_name,
      role: activeComplaint.sender_role,
      message: activeComplaint.description,
      timestamp: activeComplaint.created_at
    };
    const messages = firstMessage.message ? [firstMessage] : [];
    const replies = storedMessages.length > 1 ? storedMessages.slice(1) : [];
    const conversation = [...messages, ...replies];
    const lastMessage = conversation[conversation.length - 1];

    if (activeComplaint.resolution_notes && activeComplaint.resolution_notes !== lastMessage?.message) {
      conversation.push({
        sender: activeComplaint.resolved_by || activeComplaint.recipient_name,
        role: activeComplaint.recipient_role,
        message: activeComplaint.resolution_notes,
        timestamp: activeComplaint.resolved_at
      });
    }
    return conversation;
  })() : [];

  const clearFilters = () => {
    setSourceFilter('ALL');
    setSenderFilter('ALL');
    setRecipientFilter('ALL');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setSearchQuery('');
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* Header and export actions */}
      {!hideHeader ? (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                Inter-Party Complaints & Feedback Oversight
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Review and manage feedback from across ADRA.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              onClick={handleExportCSV}
              icon={FileSpreadsheet}
              className="text-xs px-2.5 py-1.5"
            >
              CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              icon={Download}
              className="text-xs px-2.5 py-1.5"
            >
              PDF
            </Button>
            <button
              onClick={loadComplaints}
              title="Refresh feedback"
              aria-label="Refresh feedback"
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-end gap-2">
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              onClick={handleExportCSV}
              icon={FileSpreadsheet}
              className="text-xs px-2.5 py-1.5"
            >
              CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              icon={Download}
              className="text-xs px-2.5 py-1.5"
            >
              PDF
            </Button>
            <button
              onClick={loadComplaints}
              title="Refresh feedback"
              aria-label="Refresh feedback"
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <Card className="p-3 bg-white border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feedback..."
              aria-label="Search feedback"
              className="adra-input pl-9 text-xs"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="adra-select text-xs font-medium sm:w-44"
          >
            <option value="ALL">All statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under review</option>
            <option value="In Progress">In progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <details className="group">
            <summary className="list-none inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              More filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              <span className="text-slate-400 group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-3">
              <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} aria-label="Filter by channel" className="adra-select text-xs font-medium">
                <option value="ALL">All channels</option>
                <option value="Inventory Feedback">Inventory feedback</option>
                <option value="Supplier Feedback">Supplier feedback</option>
                <option value="Community Grievance">Community grievance</option>
                <option value="Donor Inquiry">Donor inquiry</option>
                <option value="Module Review">Module review</option>
              </select>
              <select value={senderFilter} onChange={(e) => setSenderFilter(e.target.value)} aria-label="Filter by sender" className="adra-select text-xs font-medium">
                <option value="ALL">All senders</option>
                <option value="Beneficiary">Beneficiaries</option>
                <option value="Donor">Donors</option>
                <option value="Field Worker">Field workers</option>
                <option value="Supervisor">Supervisors</option>
                <option value="Supplier">Suppliers</option>
                <option value="Program Manager">Program managers</option>
                <option value="Finance">Finance</option>
                <option value="Inventory Manager">Inventory managers</option>
                <option value="Community">Community</option>
              </select>
              <select value={recipientFilter} onChange={(e) => setRecipientFilter(e.target.value)} aria-label="Filter by recipient" className="adra-select text-xs font-medium">
                <option value="ALL">All recipients</option>
                <option value="Program Manager">Program managers</option>
                <option value="Finance">Finance</option>
                <option value="Compliance Officer">Compliance</option>
                <option value="Supervisor">Supervisors</option>
                <option value="Field Worker">Field workers</option>
                <option value="Administrator">Administrators</option>
              </select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filter by category" className="adra-select text-xs font-medium">
                <option value="ALL">All categories</option>
                <option value="Distribution Logistics">Distribution logistics</option>
                <option value="Token & QR Verification">Token & QR verification</option>
                <option value="Relief Item Quality">Relief item quality</option>
                <option value="Grant Accountability">Grant accountability</option>
                <option value="Field Resource Depletion">Field resource depletion</option>
                <option value="Safeguarding / Protection (PSEA)">Safeguarding / PSEA</option>
                <option value="Procurement & Invoicing">Procurement & invoicing</option>
                <option value="Access & Security">Access & security</option>
              </select>
            </div>
          </details>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 whitespace-nowrap">
              {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
            </span>
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters} className="text-xs font-medium text-emerald-700 hover:text-emerald-900 cursor-pointer">
                Clear
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Feedback table */}
      {loading ? (
        <LoadingSpinner text="Compiling inter-party grievance telemetry..." />
      ) : (
        <Card className="p-0 overflow-hidden shadow-2xs">
          {filtered.length === 0 ? (
            <div className="py-12 px-4 text-center text-slate-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-xs">No feedback or complaints match the selected filter criteria</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Try resetting the sender, recipient, or category filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px] text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">Sender / role</th>
                    <th className="px-3 py-2.5 font-semibold">Feedback</th>
                    <th className="px-3 py-2.5 text-right font-semibold"> </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item) => {
                    const isResolved = item.status === 'Resolved';
                    const senderDisplay = item.sender_name || item.beneficiary_name || '—';
                    return (
                      <tr key={item.id || item.ticket_code} className="hover:bg-slate-50/70">
                        <td className="px-3 py-3 align-top sm:w-1/3">
                          <p className="font-medium text-slate-900">{senderDisplay}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">{item.sender_role || '—'}</p>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                              {item.source_type}
                            </span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                                isResolved
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                  : 'border-amber-200 bg-amber-50 text-amber-800'
                              }`}
                            >
                              {item.status || '—'}
                            </span>
                            <span className="text-[10px] text-slate-400">{item.ticket_code || item.id}</span>
                          </div>
                          <p className="mt-1 font-medium text-slate-800">{item.subject || '—'}</p>
                        </td>
                        <td className="px-3 py-3 text-right align-middle">
                          <button
                            type="button"
                            onClick={() => handleOpenInspect(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-[#006B56] hover:bg-emerald-50 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Feedback details and reply */}
      {activeComplaint && (
        <Modal
          isOpen={Boolean(activeComplaint)}
          onClose={() => setActiveComplaint(null)}
          maxWidth="max-w-2xl"
          title={activeComplaint.ticket_code ? `Feedback · ${activeComplaint.ticket_code}` : 'Feedback details'}
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h4 className="truncate text-sm font-semibold text-slate-900">{activeComplaint.subject || 'Feedback'}</h4>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {activeComplaint.category || activeComplaint.source_type}
                  {activeComplaint.created_at ? ` · ${formatDate(activeComplaint.created_at)}` : ''}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                {activeComplaint.status || '—'}
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-800">
                    {activeComplaint.sender_name || activeComplaint.beneficiary_name || '—'}
                  </p>
                  <p className="text-[10px] text-slate-500">{activeComplaint.sender_role || 'Sender'}</p>
                </div>
                <span className="shrink-0 text-[10px] text-slate-400">to</span>
                <div className="min-w-0 text-right">
                  <p className="truncate text-xs font-semibold text-slate-800">{activeComplaint.recipient_name || '—'}</p>
                  <p className="text-[10px] text-slate-500">{activeComplaint.recipient_role || 'Recipient'}</p>
                </div>
              </div>

              <div className="max-h-[38vh] min-h-48 space-y-3 overflow-y-auto p-3 sm:p-4">
                {conversationMessages.length ? conversationMessages.map((message, index) => {
                  const isReply = index > 0;
                  return (
                    <div key={`${message.timestamp || index}-${index}`} className={`flex ${isReply ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm ${
                        isReply
                          ? 'rounded-br-md bg-emerald-100 text-emerald-950'
                          : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'
                      }`}>
                        <p className={`text-[10px] font-semibold ${isReply ? 'text-emerald-800' : 'text-slate-500'}`}>
                          {[message.sender, message.role].filter(Boolean).join(' · ') || (isReply ? 'Reply' : 'Sender')}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{message.message}</p>
                        {message.timestamp && (
                          <p className={`mt-1 text-right text-[9px] ${isReply ? 'text-emerald-700/70' : 'text-slate-400'}`}>
                            {formatDate(message.timestamp)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <p className="py-8 text-center text-xs text-slate-400">No messages in this conversation yet.</p>
                )}
              </div>

              <div className="border-t border-slate-200 bg-white p-3">
                <label htmlFor="feedback-reply" className="sr-only">Reply</label>
                <textarea
                  id="feedback-reply"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  rows={2}
                  className="adra-input min-h-16 resize-y text-sm"
                  disabled={isUpdating}
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label htmlFor="feedback-status" className="text-[11px] font-medium text-slate-500">Status</label>
                    <select
                      id="feedback-status"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="adra-select py-1.5 text-xs"
                      disabled={isUpdating}
                    >
                      <option value="Under Review">Under review</option>
                      <option value="In Progress">In progress</option>
                      <option value="Escalated">Escalated</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveDecision}
                    disabled={isUpdating || (!replyText.trim() && newStatus === activeComplaint.status)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isUpdating ? 'Sending...' : replyText.trim() ? 'Send reply' : 'Update status'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setActiveComplaint(null)} disabled={isUpdating}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
