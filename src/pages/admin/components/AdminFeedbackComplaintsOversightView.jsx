import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Users,
  ShieldCheck,
  HardHat,
  ClipboardList,
  Scale,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Download,
  FileSpreadsheet,
  CornerDownRight,
  UserCheck,
  Calendar,
  Layers,
  Building,
  RefreshCw,
  X
} from 'lucide-react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { db } from '../../../lib/supabase';
import { formatDate } from '../../../lib/utils';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { exportToCSV, exportToPDF } from '../../../lib/reportGenerator';

export function AdminFeedbackComplaintsOversightView() {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [senderFilter, setSenderFilter] = useState('ALL');
  const [recipientFilter, setRecipientFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Inspection Modal
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [newStatus, setNewStatus] = useState('Resolved');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const data = await db.getComplaints(null);
      setComplaints(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load complaints and feedback registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  // Filtered dataset
  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      // Sender filter
      if (senderFilter !== 'ALL') {
        const sRole = (c.sender_role || '').toLowerCase();
        if (senderFilter === 'Beneficiary' && !sRole.includes('beneficiary')) return false;
        if (senderFilter === 'Field Worker' && !sRole.includes('field')) return false;
        if (senderFilter === 'Supervisor' && !sRole.includes('supervisor')) return false;
        if (senderFilter === 'Supplier' && !sRole.includes('supplier')) return false;
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
        const matchesSender = (c.sender_name || c.beneficiary_name)?.toLowerCase().includes(q);
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
  }, [complaints, senderFilter, recipientFilter, statusFilter, categoryFilter, searchQuery]);

  // Telemetry KPIs
  const totalCount = complaints.length;
  const pendingCount = complaints.filter(c => c.status === 'Submitted' || c.status === 'Under Review').length;
  const escalatedCount = complaints.filter(c => c.status === 'Escalated' || c.severity === 'Urgent' || c.priority === 'Urgent').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;
  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100;

  // Handle Inspection
  const handleOpenInspect = (complaint) => {
    setActiveComplaint(complaint);
    setAdminNote(complaint.resolution_notes || '');
    setNewStatus(complaint.status || 'Under Review');
  };

  // Handle Save Administrative Decision
  const handleSaveDecision = async () => {
    if (!activeComplaint) return;
    try {
      setIsUpdating(true);
      const updates = {
        status: newStatus,
        resolution_notes: adminNote.trim() || activeComplaint.resolution_notes,
        resolved_by: newStatus === 'Resolved' ? (currentUser?.full_name ? `${currentUser.full_name} (Administrator)` : 'Administrator') : activeComplaint.resolved_by,
        resolved_at: newStatus === 'Resolved' ? new Date().toISOString() : activeComplaint.resolved_at
      };

      if (db.updateComplaintStatus) {
        await db.updateComplaintStatus(activeComplaint.id || activeComplaint.ticket_code, updates);
      }
      toast.success(`Ticket ${activeComplaint.ticket_code} updated to "${newStatus}"`);
      setActiveComplaint(null);
      await loadComplaints();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update ticket.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    const filename = `ADRA_INTER_PARTY_FEEDBACK_${new Date().toISOString().split('T')[0]}.csv`;
    const exportData = filtered.map(c => ({
      Ticket_ID: c.ticket_code,
      Sender_Name: c.sender_name || c.beneficiary_name || 'Anonymous',
      Sender_Role: c.sender_role || 'Beneficiary',
      Sender_Location: c.sender_location || 'General Zone',
      Recipient_Role: c.recipient_role,
      Recipient_Name: c.recipient_name,
      Category: c.category,
      Severity: c.severity || c.priority || 'Normal',
      Subject: c.subject,
      Status: c.status,
      Submitted_Date: c.created_at ? new Date(c.created_at).toLocaleDateString() : '—',
      Resolution_Notes: c.resolution_notes || 'Pending resolution'
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
        sender_name: `${c.sender_name || c.beneficiary_name} (${c.sender_role || 'Beneficiary'})`,
        recipient_role: `${c.recipient_role} - ${c.recipient_name}`
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

  // Helper for sender role icon
  const getRoleIcon = (role = '') => {
    const r = role.toLowerCase();
    if (r.includes('beneficiary')) return <Users className="w-3.5 h-3.5 text-emerald-600" />;
    if (r.includes('field')) return <HardHat className="w-3.5 h-3.5 text-blue-600" />;
    if (r.includes('supervisor')) return <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />;
    if (r.includes('supplier')) return <Truck className="w-3.5 h-3.5 text-amber-600" />;
    if (r.includes('compliance') || r.includes('safeguard')) return <Scale className="w-3.5 h-3.5 text-rose-600" />;
    return <UserCheck className="w-3.5 h-3.5 text-purple-600" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-emerald-600" />
              Inter-Party Complaints & Feedback Oversight
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-500/30">
              Audit & Oversight Mode
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Centralized administrative monitoring of all grievances, service quality reviews, and inquiries exchanged between beneficiaries, field staff, supervisors, and programme management.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleExportCSV}
            icon={FileSpreadsheet}
            className="text-xs"
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            icon={Download}
            className="text-xs"
          >
            Download PDF
          </Button>
          <button
            onClick={loadComplaints}
            title="Refresh Feed"
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Telemetry Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Inter-Party Grievances</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-2xl font-black text-slate-900">{totalCount}</span>
            <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Logged across all operational tiers</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Awaiting Recipient Action</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-2xl font-black text-amber-700">{pendingCount}</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-[11px] text-amber-800/80 mt-0.5 font-medium">Submitted or currently under review</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Safeguarding & Urgent</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-2xl font-black text-rose-700">{escalatedCount}</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-[11px] text-rose-800/80 mt-0.5 font-medium">High priority protection/PSEA cases</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Resolved & Closed</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-2xl font-black text-emerald-700">{resolvedCount}</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-[11px] text-emerald-800/80 mt-0.5 font-medium">{resolutionRate}% compliance resolution rate</p>
        </Card>
      </div>

      {/* Multi-Party Filtering Strip */}
      <Card className="p-3.5 bg-slate-50/70 border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticket, sender, subject..."
              className="adra-input pl-9 text-xs"
            />
          </div>

          {/* Sender Party Filter */}
          <div>
            <select
              value={senderFilter}
              onChange={(e) => setSenderFilter(e.target.value)}
              className="adra-select text-xs font-medium"
            >
              <option value="ALL">All Senders (Any Party)</option>
              <option value="Beneficiary">Beneficiaries & Households</option>
              <option value="Field Worker">Field Staff & Enumerators</option>
              <option value="Supervisor">Zonal Supervisors</option>
              <option value="Supplier">Vendors & Suppliers</option>
              <option value="Community">Community (Anonymous)</option>
            </select>
          </div>

          {/* Recipient Party Filter */}
          <div>
            <select
              value={recipientFilter}
              onChange={(e) => setRecipientFilter(e.target.value)}
              className="adra-select text-xs font-medium"
            >
              <option value="ALL">All Recipients (Target Desk)</option>
              <option value="Field Worker">To: Field Worker Desk</option>
              <option value="Supervisor">To: Zonal Supervisor</option>
              <option value="Program Manager">To: Programme Manager</option>
              <option value="Compliance Officer">To: Safeguarding / Compliance</option>
              <option value="Finance">To: Finance & Procurement</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="adra-select text-xs font-medium"
            >
              <option value="ALL">All Statuses ({totalCount})</option>
              <option value="Submitted">Submitted (Pending Initial Action)</option>
              <option value="Under Review">Under Review</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved & Closed</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="adra-select text-xs font-medium"
            >
              <option value="ALL">All Categories / Topics</option>
              <option value="Distribution Logistics">Distribution Logistics</option>
              <option value="Token & QR Verification">Token & QR Verification</option>
              <option value="Relief Item Quality">Relief Item Quality</option>
              <option value="Field Resource Depletion">Field Resource Depletion</option>
              <option value="Safeguarding / Protection (PSEA)">Safeguarding / PSEA</option>
              <option value="Procurement & Invoicing">Procurement & Invoicing</option>
              <option value="Access & Security">Access & Security</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Inter-Party Registry Table */}
      {loading ? (
        <LoadingSpinner text="Compiling inter-party grievance telemetry..." />
      ) : (
        <Card className="p-0 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3.5">Ticket ID</th>
                  <th className="py-3 px-3.5">Sender Party</th>
                  <th className="py-3 px-3.5">Recipient Party (Sent To)</th>
                  <th className="py-3 px-3.5">Category / Channel</th>
                  <th className="py-3 px-3.5">Subject & Communication Excerpt</th>
                  <th className="py-3 px-3.5">Priority</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5">Date Sent</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-xs">No inter-party complaints match the selected filter criteria</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Try resetting the sender, recipient, or category filters.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const isUrgent = item.severity === 'Urgent' || item.priority === 'Urgent';
                    const isHigh = item.severity === 'High' || item.priority === 'High';
                    const isResolved = item.status === 'Resolved';
                    const senderDisplay = item.sender_name || item.beneficiary_name || 'Community Member';

                    return (
                      <tr key={item.id || item.ticket_code} className="hover:bg-slate-50/80 transition">
                        {/* Ticket Code */}
                        <td className="py-3.5 px-3.5">
                          <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-500/20 px-2 py-0.5 rounded">
                            {item.ticket_code || item.id}
                          </span>
                        </td>

                        {/* Sender Party */}
                        <td className="py-3.5 px-3.5">
                          <div className="flex items-center gap-1.5">
                            {getRoleIcon(item.sender_role)}
                            <div>
                              <span className="font-bold text-slate-900 block truncate max-w-[130px]" title={senderDisplay}>
                                {senderDisplay}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                {item.sender_role || 'Beneficiary'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Recipient Party */}
                        <td className="py-3.5 px-3.5">
                          <div className="flex items-center gap-1.5">
                            <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <div>
                              <span className="font-semibold text-slate-900 block truncate max-w-[140px]" title={item.recipient_name}>
                                {item.recipient_name || item.recipient_role}
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate max-w-[140px]">
                                {item.recipient_role}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-3.5">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                            {item.category}
                          </span>
                        </td>

                        {/* Subject & Excerpt */}
                        <td className="py-3.5 px-3.5 max-w-[240px]">
                          <span className="font-bold text-slate-900 block truncate text-xs" title={item.subject}>
                            {item.subject}
                          </span>
                          <span className="text-[11px] text-slate-500 line-clamp-1 truncate block mt-0.5" title={item.description}>
                            {item.description}
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="py-3.5 px-3.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isUrgent
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : isHigh
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                            {item.severity || item.priority || 'Normal'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                              isResolved
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-500/30'
                                : item.status === 'In Progress'
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : item.status === 'Under Review'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            {isResolved ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Clock className="w-3 h-3 text-amber-600" />
                            )}
                            {item.status}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-3.5 text-slate-500 whitespace-nowrap text-[11px]">
                          {item.created_at ? formatDate(item.created_at) : '—'}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenInspect(item)}
                            title="Inspect Inter-Party Exchange"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-slate-100 transition border border-slate-200 inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Inspect Inter-Party Exchange Modal */}
      {activeComplaint && (
        <Modal
          isOpen={Boolean(activeComplaint)}
          onClose={() => setActiveComplaint(null)}
          size="lg"
          title={`Inter-Party Grievance Audit: ${activeComplaint.ticket_code}`}
        >
          <div className="space-y-4 text-xs">
            {/* Top Overview Banner */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                Communication Audit Thread
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{activeComplaint.sender_name || activeComplaint.beneficiary_name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                    {activeComplaint.sender_role || 'Beneficiary'}
                  </span>
                  <CornerDownRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold text-slate-900">{activeComplaint.recipient_name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                    {activeComplaint.recipient_role}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Logged: {activeComplaint.created_at ? formatDate(activeComplaint.created_at) : '—'}
                </span>
              </div>
            </div>

            {/* Parties Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sender Party Origin</p>
                <p className="font-bold text-slate-900 text-sm">{activeComplaint.sender_name || activeComplaint.beneficiary_name}</p>
                <p className="text-slate-600">Location: {activeComplaint.sender_location || 'General Operational Zone'}</p>
                <p className="text-slate-500 text-[11px]">Identity ID: {activeComplaint.beneficiary_id || 'N/A'}</p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Recipient Party</p>
                <p className="font-bold text-slate-900 text-sm">{activeComplaint.recipient_name}</p>
                <p className="text-slate-600">Designation: {activeComplaint.recipient_role}</p>
                <p className="text-slate-500 text-[11px]">Department: {activeComplaint.recipient_department || 'Humanitarian Field Hub'}</p>
              </div>
            </div>

            {/* Original Grievance Message */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-900 text-sm">{activeComplaint.subject}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                  {activeComplaint.category}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed text-xs">
                {activeComplaint.description}
              </p>
            </div>

            {/* Dialogue / Communication Exchange Thread */}
            {activeComplaint.responses && activeComplaint.responses.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Exchange History Between Parties ({activeComplaint.responses.length} messages)
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto p-3 rounded-xl bg-slate-100 border border-slate-200">
                  {activeComplaint.responses.map((r, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          {r.sender}
                          <span className="text-[10px] text-slate-500 font-normal">({r.role})</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {r.timestamp ? formatDate(r.timestamp) : ''}
                        </span>
                      </div>
                      <p className="text-slate-700">{r.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Administrative Oversight Action Form */}
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-500/30 space-y-3">
              <p className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Administrative Compliance Oversight & Case Resolution
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Update Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="adra-select text-xs font-semibold"
                  >
                    <option value="Under Review">Under Review</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Escalated">Escalate to Executive Directorate</option>
                    <option value="Resolved">Mark as Resolved & Closed</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-800 mb-1">
                    Administrative Compliance Notes / Regulatory Decision:
                  </label>
                  <input
                    type="text"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="e.g. Audit review passed; verified priority queue established with Lodwar depot team."
                    className="adra-input text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveComplaint(null)}
                disabled={isUpdating}
              >
                Close Dossier
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveDecision}
                disabled={isUpdating}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isUpdating ? 'Saving...' : 'Save Oversight Decision'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
