import React, { useState, useEffect } from 'react';
import {
  MessageSquareQuote,
  ShieldCheck,
  AlertTriangle,
  Send,
  Lock,
  EyeOff,
  CheckCircle,
  Clock,
  FileText,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { db } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

export function FeedbackComplaintsView({ beneficiary }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState({
    category: 'Distribution Logistics',
    severity: 'Medium',
    is_anonymous: false,
    subject: '',
    description: ''
  });

  const categories = [
    'Distribution Logistics',
    'Staff Conduct & Safeguarding',
    'Item Quality & Packaging',
    'Fairness & Community Inclusion',
    'Borehole & Water Point Issue',
    'General Community Feedback'
  ];

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const data = await db.getComplaints(beneficiary?.id || 'b7');
      setComplaints(data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load feedback records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [beneficiary]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.description) {
      toast.warning('Please enter both subject and description');
      return;
    }

    try {
      await db.createComplaint({
        beneficiary_id: beneficiary?.id || 'b7',
        beneficiary_name: formData.is_anonymous ? 'Anonymous Community Member' : (beneficiary?.full_name || 'Mary Nyambura'),
        ...formData
      });
      toast.success('Your feedback / complaint has been submitted confidentially');
      setIsModalOpen(false);
      setFormData({
        category: 'Distribution Logistics',
        severity: 'Medium',
        is_anonymous: false,
        subject: '',
        description: ''
      });
      loadComplaints();
    } catch (e) {
      console.error(e);
      toast.error('Failed to submit feedback');
    }
  };

  const handleOpenDetail = (ticket) => {
    setSelectedTicket(ticket);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-white to-slate-50 border border-emerald-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <MessageSquareQuote className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Feedback, Suggestions & Complaints
              </h2>
              <p className="text-xs text-slate-500">
                ADRA is committed to accountability and community safeguarding. All submissions can be made anonymously.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="text-xs gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Feedback / Complaint
            </Button>
          </div>
        </div>

        {/* Safeguarding Notice */}
        <div className="mt-5 pt-4 border-t border-emerald-100/80 flex items-start gap-3 text-xs text-emerald-900 bg-emerald-100/40 p-3 rounded-xl border border-emerald-200/60">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <span className="font-bold">Zero-Retaliation Guarantee: </span>
            Submitting a complaint will NEVER negatively impact your or your family's eligibility for future assistance. Reports are handled by independent compliance officers.
          </p>
        </div>
      </div>

      {/* Submitted Complaints & Feedback Tracker */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            My Submitted Feedback & Grievance Tickets ({complaints.length})
          </h3>
          <span className="text-xs text-slate-500">Track resolution progress & investigator findings</span>
        </div>

        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading submitted feedback...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <MessageSquareQuote className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No Feedback or Complaints Submitted</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              If you experienced an issue with aid rations, queue conduct, or have an idea to improve services, click the button above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.map(ticket => (
              <div
                key={ticket.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {ticket.ticket_code}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        ticket.status === 'Resolved'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : ticket.status === 'Under Review'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {ticket.status}
                    </span>
                    {ticket.is_anonymous && (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> Anonymous
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {ticket.created_at?.split('T')[0] || 'Recently'}
                  </span>
                </div>

                <div className="pt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      {ticket.category}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-medium">Severity: {ticket.severity}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-1">{ticket.subject}</h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{ticket.description}</p>
                </div>

                {ticket.resolution_notes && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <span className="font-bold text-slate-900 block flex items-center gap-1 mb-0.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Investigator Finding & Action:
                    </span>
                    <p className="text-slate-600">{ticket.resolution_notes}</p>
                    {ticket.resolved_by && (
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">
                        Resolved by: {ticket.resolved_by} {ticket.resolved_at && `(${ticket.resolved_at.split('T')[0]})`}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDetail(ticket)}
                    className="text-xs gap-1 border-slate-200 hover:border-emerald-300 hover:text-emerald-700"
                  >
                    View Ticket Details
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Feedback Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit Community Feedback or Complaint"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-1">
          {/* Anonymous toggle */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <EyeOff className="w-4 h-4 text-slate-600" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Submit Anonymously</span>
                <span className="text-[10px] text-slate-500">Your name and contact will not be linked to this ticket</span>
              </div>
            </div>

            <input
              type="checkbox"
              checked={formData.is_anonymous}
              onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Feedback Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500"
            >
              {categories.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Severity / Urgency</label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500"
            >
              <option value="Low">Low — General suggestion or positive remark</option>
              <option value="Medium">Medium — Distribution delay or queue concern</option>
              <option value="High">High — Missing ration or damaged commodity</option>
              <option value="Urgent">Urgent — Immediate safeguarding, extortion or misconduct</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Subject / Summary</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g. Long queue waiting times at Lodwar depot checkpoint"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Explanation</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide exact dates, locations, and details so our safeguarding team can investigate effectively..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="text-xs gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Confidentially
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {selectedTicket && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Ticket #${selectedTicket.ticket_code}`}
          size="md"
        >
          <div className="space-y-4 p-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold bg-slate-100 px-2.5 py-1 rounded border border-slate-200 text-slate-700">
                {selectedTicket.ticket_code}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {selectedTicket.status}
              </span>
            </div>

            <div>
              <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                {selectedTicket.category}
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-2">{selectedTicket.subject}</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{selectedTicket.description}</p>
            </div>

            {selectedTicket.resolution_notes && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Investigation Report & Findings:
                </span>
                <p className="text-slate-700 leading-relaxed">{selectedTicket.resolution_notes}</p>
                {selectedTicket.resolved_by && (
                  <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-200">
                    Verified by: {selectedTicket.resolved_by}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsDetailOpen(false)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
