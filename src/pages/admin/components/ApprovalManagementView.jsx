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
    const matchesCat = categoryFilter === 'ALL' || 
      a.category === categoryFilter ||
      (categoryFilter === 'Beneficiary Verification' && (a.category === 'User Onboarding' || a.role_requested === 'Beneficiary')) ||
      (categoryFilter === 'User Registration' && (a.category === 'User Onboarding' || a.category === 'Beneficiary Verification' || a.role_requested === 'Beneficiary'));
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
        <Card className="p-0 overflow-hidden shadow-2xs border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Request & Category</th>
                  <th className="py-3.5 px-4">Requester & Details</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Submitted</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredApprovals.map((app) => {
                  const isPending = app.status === 'Pending';
                  const isApproved = app.status === 'Approved';
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition group">
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                            {app.id}
                          </span>
                          {app.priority === 'Urgent' && (
                            <span className="text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 px-1.5 py-0.5 rounded-full">
                              Urgent
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-900 font-semibold text-xs">
                          <span className="shrink-0">{getCategoryIcon(app.category)}</span>
                          <span className="truncate max-w-[140px] sm:max-w-[170px]">{app.category}</span>
                        </div>
                        {app.department && (
                          <p className="text-[10px] text-slate-500 mt-0.5">{app.department}</p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-wrap items-baseline gap-1.5">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">{app.requester_name}</span>
                          <span className="text-[11px] text-slate-500">({app.requester_email})</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed max-w-md">
                          {app.details}
                        </p>
                        {app.review_notes && (
                          <p className="text-[11px] text-slate-500 italic mt-1 bg-slate-50 border border-slate-200/60 rounded px-2 py-0.5 inline-block">
                            Remarks: "{app.review_notes}"
                          </p>
                        )}
                        <div className="md:hidden flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                          <span>Submitted: {formatDate(app.date)}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 hidden md:table-cell align-top whitespace-nowrap text-slate-600 text-[11px]">
                        {formatDate(app.date)}
                      </td>

                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <span
                          className={`text-[10px] sm:text-[11px] px-2.5 py-1 rounded-md border font-bold inline-block ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                              : isPending
                              ? 'bg-amber-100 text-amber-950 border-amber-400'
                              : 'bg-rose-100 text-rose-950 border-rose-400'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenReview(app)}
                          className="px-3 py-1.5 text-xs rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition inline-flex items-center gap-1.5 shadow-xs border border-emerald-700 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-white" />
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
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
