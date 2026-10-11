import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquareText,
  Star,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lightbulb,
  Bug,
  Zap,
  AlertTriangle,
  MessageCircle,
  Plus,
  Trash2,
  CornerDownRight,
  Download,
  FileSpreadsheet,
  User,
  ShieldCheck,
  Building,
  Layers,
  Send,
  X
} from 'lucide-react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ModuleFeedbackModal } from '../../../components/common/ModuleFeedbackModal';
import { db } from '../../../lib/supabase';
import { formatDate } from '../../../lib/utils';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { exportToCSV, exportToPDF } from '../../../lib/reportGenerator';

export function UserFeedbackView() {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState(null);
  const [adminResponseText, setAdminResponseText] = useState('');
  const [newStatus, setNewStatus] = useState('Resolved');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const data = await db.getUserFeedbacks();
      setFeedbacks(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load user feedbacks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, []);

  // Filtered dataset
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((fb) => {
      // Module filter
      if (selectedModule !== 'ALL' && fb.module !== selectedModule && fb.module_id !== selectedModule) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'ALL' && fb.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'ALL' && fb.status !== selectedStatus) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTicket = fb.ticket_code?.toLowerCase().includes(query);
        const matchesSubject = fb.subject?.toLowerCase().includes(query);
        const matchesUser = fb.user_name?.toLowerCase().includes(query);
        const matchesMessage = fb.message?.toLowerCase().includes(query);
        const matchesMod = fb.module?.toLowerCase().includes(query);
        if (!matchesTicket && !matchesSubject && !matchesUser && !matchesMessage && !matchesMod) {
          return false;
        }
      }
      return true;
    });
  }, [feedbacks, selectedModule, selectedCategory, selectedStatus, searchQuery]);

  // Telemetry KPIs
  const totalCount = feedbacks.length;
  const pendingCount = feedbacks.filter(f => f.status === 'Submitted' || f.status === 'Under Review').length;
  const resolvedCount = feedbacks.filter(f => f.status === 'Resolved').length;
  const avgRating = totalCount > 0
    ? (feedbacks.reduce((acc, curr) => acc + (Number(curr.rating) || 5), 0) / totalCount).toFixed(1)
    : '5.0';

  // Handle Respond & Update
  const handleOpenReview = (fb) => {
    setActiveFeedback(fb);
    setAdminResponseText(fb.admin_response || '');
    setNewStatus(fb.status === 'Resolved' ? 'Resolved' : 'In Progress');
  };

  const handleSaveResponse = async () => {
    if (!activeFeedback) return;
    try {
      setIsUpdating(true);
      await db.updateUserFeedbackStatus(activeFeedback.id, {
        status: newStatus,
        admin_response: adminResponseText.trim() || null,
        responded_by: currentUser?.full_name || 'Administrator',
        responded_at: new Date().toISOString()
      });
      toast.success(`Feedback ${activeFeedback.ticket_code} updated to "${newStatus}"`);
      setActiveFeedback(null);
      loadFeedbacks();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update ticket status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id, ticket) => {
    if (!window.confirm(`Are you sure you want to delete feedback ticket ${ticket}?`)) return;
    try {
      await db.deleteUserFeedback(id);
      toast.success(`Deleted ticket ${ticket}`);
      loadFeedbacks();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete ticket.');
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    const filename = `ADRA_USER_FEEDBACK_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(filteredFeedbacks, filename);
    toast.success(`Exported ${filteredFeedbacks.length} feedback records to CSV.`);
  };

  const handleExportPDF = () => {
    exportToPDF({
      title: 'ADRA • MODULE USER FEEDBACK & USABILITY AUDIT REPORT',
      subtitle: 'Consolidated reviews, suggestions and incident reports across all modules',
      columns: [
        { header: 'Ticket Code', key: 'ticket_code' },
        { header: 'Module', key: 'module' },
        { header: 'Submitter', key: 'user_name' },
        { header: 'Role', key: 'user_role' },
        { header: 'Category', key: 'category' },
        { header: 'Rating (★)', key: 'rating' },
        { header: 'Subject', key: 'subject' },
        { header: 'Priority', key: 'priority' },
        { header: 'Status', key: 'status' },
        { header: 'Submitted', key: 'created_at', type: 'date' }
      ],
      data: filteredFeedbacks,
      fileName: 'ADRA_Module_Feedback_Report.pdf',
      summary: [
        { label: 'Total Records', value: String(filteredFeedbacks.length) },
        { label: 'Avg Rating', value: `${avgRating} / 5.0` },
      ]
    });
    toast.success('PDF feedback document downloaded.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquareText className="w-6 h-6 text-emerald-600" />
            User Feedback & Module Accountability (AAP)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Review user reviews, suggestions, and operational issues submitted across every application module.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            onClick={() => setIsSubmitModalOpen(true)}
            icon={Plus}
            className="text-xs"
          >
            Submit Feedback
          </Button>
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
        </div>
      </div>

      {/* KPI Summary Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Submissions</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-slate-900">{totalCount}</span>
            <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Logged across all modules</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Satisfaction</p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-800">{avgRating}</span>
              <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
            </div>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">Based on {totalCount} reviews</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Action</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-amber-600">{pendingCount}</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Under review / triage</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resolved Cases</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-emerald-800">{resolvedCount}</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">Addressed & settled</p>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search ticket, user, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="adra-input text-xs pl-8 py-2 w-full bg-white font-medium text-slate-900 rounded-xl border border-slate-300"
            />
          </div>

          {/* Module Filter */}
          <div>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="adra-select text-xs py-2 w-full bg-white font-medium text-slate-800 rounded-xl border border-slate-300"
            >
              <option value="ALL">All Application Modules</option>
              <option value="Field Programmes">Field Programmes</option>
              <option value="Beneficiary Oversight">Beneficiary Oversight</option>
              <option value="Aid Assistance Pipeline">Aid Assistance Pipeline</option>
              <option value="Supply Chain & Purchase Orders">Supply Chain & Purchase Orders</option>
              <option value="Operational Locations">Operational Locations</option>
              <option value="Governance & Approvals">Governance & Approvals</option>
              <option value="Reporting & Document Export">Reporting & Document Export</option>
              <option value="Security Policies & Audit Logs">Security & Audit</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="adra-select text-xs py-2 w-full bg-white font-medium text-slate-800 rounded-xl border border-slate-300"
            >
              <option value="ALL">All Categories</option>
              <option value="Feature Suggestion">Feature Suggestion</option>
              <option value="Issue / Bug Report">Issue / Bug Report</option>
              <option value="Usability & Speed">Usability & Speed</option>
              <option value="Data Discrepancy">Data Discrepancy</option>
              <option value="General Feedback">General Feedback</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="adra-select text-xs py-2 w-full bg-white font-medium text-slate-800 rounded-xl border border-slate-300"
            >
              <option value="ALL">All Statuses</option>
              <option value="Submitted">Submitted (New)</option>
              <option value="Under Review">Under Review</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Feedback Table */}
      {loading ? (
        <div className="py-12">
          <LoadingSpinner text="Loading module feedback records..." />
        </div>
      ) : (
        <Card className="p-0 overflow-hidden bg-white border border-slate-200 shadow-sm rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3.5">Ticket</th>
                  <th className="py-3 px-3.5">Target Module</th>
                  <th className="py-3 px-3.5">Submitter & Role</th>
                  <th className="py-3 px-3.5">Category & Rating</th>
                  <th className="py-3 px-3.5">Subject & Description</th>
                  <th className="py-3 px-3.5">Priority</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredFeedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <MessageSquareText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-xs">No feedback matches your filter criteria</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Try resetting filters or click 'Submit Feedback' to log a review.</p>
                    </td>
                  </tr>
                ) : (
                  filteredFeedbacks.map((item) => (
                    <tr key={item.id || item.ticket_code} className="hover:bg-slate-50/80 transition">
                      {/* Ticket Code */}
                      <td className="py-3.5 px-3.5">
                        <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-500/20 px-2 py-0.5 rounded">
                          {item.ticket_code || item.id}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1 whitespace-nowrap">
                          {formatDate(item.created_at)}
                        </p>
                      </td>

                      {/* Module */}
                      <td className="py-3.5 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 text-[11px]">
                          {item.module || 'General'}
                        </span>
                      </td>

                      {/* Submitter */}
                      <td className="py-3.5 px-3.5">
                        <p className="font-bold text-slate-900">{item.user_name || 'Staff'}</p>
                        <p className="text-[10px] text-slate-500">{item.user_role || 'User'}</p>
                      </td>

                      {/* Category & Rating */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <p className="font-semibold text-slate-800 text-[11px]">{item.category}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= (item.rating || 5)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </td>

                      {/* Subject & Description */}
                      <td className="py-3.5 px-3.5 max-w-sm">
                        <p className="font-bold text-slate-900 line-clamp-1">{item.subject}</p>
                        <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                          {item.message}
                        </p>
                        {item.admin_response && (
                          <div className="mt-1.5 p-1.5 rounded-lg bg-emerald-50 border border-emerald-200/60 text-[10px] text-emerald-900 flex items-start gap-1">
                            <CornerDownRight className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-1"><strong>Response:</strong> {item.admin_response}</span>
                          </div>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.priority === 'Urgent'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : item.priority === 'High'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {item.priority || 'Normal'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] border font-bold ${
                          item.status === 'Resolved'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-500/30'
                            : item.status === 'In Progress'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : item.status === 'Under Review'
                            ? 'bg-purple-50 text-purple-800 border-purple-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}>
                          {item.status || 'Submitted'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            onClick={() => handleOpenReview(item)}
                            className="text-[11px] py-1 px-2.5"
                          >
                            Review & Respond
                          </Button>
                          <button
                            onClick={() => handleDelete(item.id, item.ticket_code)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete Feedback"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Review & Respond Modal */}
      {activeFeedback && (
        <Modal isOpen={Boolean(activeFeedback)} onClose={() => setActiveFeedback(null)} size="lg">
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-500/20">
                  {activeFeedback.ticket_code}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {activeFeedback.subject}
                </h3>
              </div>
              <button
                onClick={() => setActiveFeedback(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feedback Info Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <strong>Module:</strong> <span className="font-semibold text-slate-800">{activeFeedback.module}</span>
                </span>
                <span>
                  <strong>Category:</strong> <span className="font-semibold text-slate-800">{activeFeedback.category}</span>
                </span>
                <span>
                  <strong>Rating:</strong> {activeFeedback.rating} / 5.0 ★
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 text-slate-700 leading-relaxed">
                "{activeFeedback.message}"
              </div>
              <div className="text-[11px] text-slate-400 pt-1">
                Submitted by {activeFeedback.user_name} ({activeFeedback.user_role}) on {formatDate(activeFeedback.created_at)}
              </div>
            </div>

            {/* Admin Response Form */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Update Workflow Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="adra-select text-xs py-2 w-full bg-white font-semibold text-slate-900 rounded-xl border border-slate-300"
                >
                  <option value="Under Review">Under Review</option>
                  <option value="In Progress">In Progress (Engineering / Field Working on it)</option>
                  <option value="Resolved">Resolved (Solution Implemented)</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Official Response to Submitter
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide resolution details or feedback status update to the user..."
                  value={adminResponseText}
                  onChange={(e) => setAdminResponseText(e.target.value)}
                  className="adra-input text-xs py-2 w-full bg-white font-medium text-slate-900 rounded-xl border border-slate-300 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => setActiveFeedback(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveResponse}
                icon={Send}
                disabled={isUpdating}
                className="text-xs"
              >
                {isUpdating ? 'Saving...' : 'Save & Send Response'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Standalone Submit Modal */}
      <ModuleFeedbackModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        defaultModule="Field Programmes"
        onSuccess={loadFeedbacks}
      />
    </div>
  );
}
