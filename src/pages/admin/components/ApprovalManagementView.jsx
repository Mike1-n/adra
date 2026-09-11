import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  UserCheck,
  DollarSign,
  HeartHandshake,
  Truck,
  Eye,
  Filter,
  Search,
  Plus,
  Users
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { db } from '../../../lib/supabase';
import { formatDate } from '../../../lib/utils';
import { useToast } from '../../../context/ToastContext';

export function ApprovalManagementView({ initialCategory = 'ALL' }) {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (initialCategory) {
      setCategoryFilter(initialCategory);
    }
  }, [initialCategory]);

  // Review Modal
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Submit Modal
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [submitData, setSubmitData] = useState({
    category: 'Operational Budget',
    requester_name: '',
    requester_email: '',
    role_requested: '',
    department: '',
    details: '',
    priority: 'Normal'
  });

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const data = await db.getApprovals('ALL');
      setApprovals(data);
    } catch (err) {
      toast.error('Failed to load approval queues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const handleOpenReview = (app) => {
    setSelectedApproval(app);
    setReviewNotes(app.review_notes || '');
    setIsReviewOpen(true);
  };

  const handleAction = async (status) => {
    if (!selectedApproval) return;
    try {
      await db.updateApprovalStatus(selectedApproval.id, status, reviewNotes);
      toast.success(`Request ${selectedApproval.id} set to ${status}!`);
      setIsReviewOpen(false);
      loadApprovals();
    } catch (err) {
      toast.error(`Action failed: ${err.message}`);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    try {
      await db.createApproval(submitData);
      toast.success('Approval request submitted to the queue.');
      setIsSubmitOpen(false);
      loadApprovals();
    } catch (err) {
      toast.error('Failed to submit approval.');
    }
  };

  const filteredApprovals = approvals.filter((a) => {
    const matchesSearch =
      a.requester_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.requester_email?.toLowerCase().includes(search.toLowerCase()) ||
      a.details?.toLowerCase().includes(search.toLowerCase()) ||
      a.id?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || a.category === categoryFilter;
    const matchesStat = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesCat && matchesStat;
  });

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Beneficiary Verification':
      case 'User Onboarding':
        return <Users className="w-4 h-4 text-emerald-600" />;
      case 'User Registration':
        return <UserCheck className="w-4 h-4 text-emerald-600" />;
      case 'Supplier Onboarding':
        return <Truck className="w-4 h-4 text-blue-600" />;
      case 'Operational Budget':
        return <DollarSign className="w-4 h-4 text-amber-600" />;
      case 'Aid Distribution Batch':
        return <HeartHandshake className="w-4 h-4 text-purple-600" />;
      default:
        return <FileCheck className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-emerald-600" />
            Approval Management & Onboarding Queues
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Admin governance for user & beneficiary verification, supplier onboarding, and operational budget authorizations.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => setIsSubmitOpen(true)}
          icon={Plus}
        >
          Submit Request
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by requester, ID, details..."
            className="adra-input pl-10 text-xs sm:text-sm"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="adra-select text-xs sm:text-sm"
        >
          <option value="ALL">All Categories</option>
          <option value="Beneficiary Verification">Beneficiary Verification (Households)</option>
          <option value="User Registration">User Registrations (Staff / Donors)</option>
          <option value="Supplier Onboarding">Supplier Onboarding</option>
          <option value="Operational Budget">Operational Budget Sign-offs</option>
          <option value="Aid Distribution Batch">Aid Distribution Dispatches</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="adra-select text-xs sm:text-sm"
        >
          <option value="ALL">All Review Statuses</option>
          <option value="Pending">Pending Review</option>
          <option value="Approved">Approved Requests</option>
          <option value="Rejected">Rejected Requests</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner text="Querying approval records from database..." />
      ) : filteredApprovals.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-2xl">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-900">No Approvals Found</p>
          <p className="text-xs text-slate-500 mt-1">No requests currently match the selected criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApprovals.map((app) => {
            const isPending = app.status === 'Pending';
            const isApproved = app.status === 'Approved';
            return (
              <Card
                key={app.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 adra-card-hover"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
                    {getCategoryIcon(app.category)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-500/30 px-2 py-0.5 rounded">
                        {app.id}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">
                        {app.category}
                      </h3>
                      {app.priority === 'Urgent' && (
                        <span className="text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full">
                          Urgent
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 font-medium mt-1">
                      Requester: <span className="text-slate-900 font-bold">{app.requester_name}</span> ({app.requester_email})
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                      {app.details}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
                      <span>Submitted: {formatDate(app.date)}</span>
                      {app.department && <span>Department: {app.department}</span>}
                      {app.review_notes && (
                        <span className="text-slate-700 font-medium italic">Remarks: "{app.review_notes}"</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      isApproved
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-500/30 font-bold'
                        : isPending
                        ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                        : 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
                    }`}
                  >
                    {app.status}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenReview(app)}
                    icon={Eye}
                  >
                    Review
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {selectedApproval && (
        <Modal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          title={`Review Request: ${selectedApproval.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">Request Category:</span>
                <span className="font-bold text-slate-900 text-xs">{selectedApproval.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">Requester / Candidate:</span>
                <span className="font-bold text-emerald-700">{selectedApproval.requester_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">Email / Contact:</span>
                <span className="text-slate-800">{selectedApproval.requester_email}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <p className="text-slate-600 text-[11px] mb-1 font-semibold">Detailed Justification:</p>
                <p className="text-slate-800 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                  {selectedApproval.details}
                </p>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Administrator Review Decision Remarks
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter justification, approval reference number, or rejection cause..."
                className="adra-input text-xs sm:text-sm"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setIsReviewOpen(false)}>
                Close
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="danger"
                  onClick={() => handleAction('Rejected')}
                  icon={XCircle}
                >
                  Reject Request
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleAction('Approved')}
                  icon={CheckCircle2}
                >
                  Approve Request
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Submit Request Modal */}
      <Modal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        title="Submit New Administrative Request"
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-800 mb-1">Request Category</label>
            <select
              value={submitData.category}
              onChange={(e) => setSubmitData({ ...submitData, category: e.target.value })}
              className="adra-select text-xs sm:text-sm"
            >
              <option value="Operational Budget">Operational Budget Release</option>
              <option value="User Registration">Staff / Field Worker Verification</option>
              <option value="Supplier Onboarding">Supplier Onboarding</option>
              <option value="Aid Distribution Batch">Aid Distribution Dispatch</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Requester Name</label>
              <input
                type="text"
                required
                value={submitData.requester_name}
                onChange={(e) => setSubmitData({ ...submitData, requester_name: e.target.value })}
                placeholder="e.g. Samuel Kiptoo"
                className="adra-input text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Requester Email</label>
              <input
                type="email"
                required
                value={submitData.requester_email}
                onChange={(e) => setSubmitData({ ...submitData, requester_email: e.target.value })}
                placeholder="s.kiptoo@adra.org"
                className="adra-input text-xs sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Request Justification & Scope</label>
            <textarea
              required
              rows={3}
              value={submitData.details}
              onChange={(e) => setSubmitData({ ...submitData, details: e.target.value })}
              placeholder="Describe the operational purpose, beneficiaries affected, or budget line..."
              className="adra-input text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={() => setIsSubmitOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
