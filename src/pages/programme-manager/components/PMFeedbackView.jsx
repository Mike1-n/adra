import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  ThumbsUp,
  HelpCircle,
  Send,
  Eye,
  X,
  Layers,
  Calendar,
  User
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

export function PMFeedbackView({
  feedback = [],
  programmes = [],
  currentUser,
  onRespondFeedback
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [activeFeedback, setActiveFeedback] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredFeedback = useMemo(() => {
    return feedback.filter(f => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesId = (f.id || '').toLowerCase().includes(q);
        const matchesBen = (f.beneficiary_name || '').toLowerCase().includes(q);
        const matchesSubject = (f.subject || f.message || '').toLowerCase().includes(q);
        if (!matchesId && !matchesBen && !matchesSubject) return false;
      }
      if (filterType !== 'ALL' && f.type !== filterType) return false;
      if (filterStatus !== 'ALL' && f.status !== filterStatus) return false;
      return true;
    });
  }, [feedback, searchTerm, filterType, filterStatus]);

  const handleSendResponse = async (e) => {
    e.preventDefault();
    if (!responseText.trim() || !activeFeedback) return;
    setIsSubmitting(true);
    try {
      if (onRespondFeedback) {
        await onRespondFeedback(activeFeedback.id, responseText.trim(), currentUser?.name || 'Grace Ochieng');
      }
      setActiveFeedback(null);
      setResponseText('');
    } catch (err) {
      console.error('Failed to submit feedback response:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#006B56]" />
            Beneficiary Accountability & Feedback Mechanism (AAP)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Review community complaints, suggestions, and service quality reports. Provide official responses to affected households.
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <strong>{filteredFeedback.length}</strong> Community Feedback Cases
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, Beneficiary or keywords..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006B56] outline-none"
          />
        </div>

        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006B56] outline-none bg-white text-slate-700"
          >
            <option value="ALL">All Feedback Types</option>
            <option value="Complaint">Complaint</option>
            <option value="Service Issue">Service Issue</option>
            <option value="Suggestion">Suggestion</option>
            <option value="Appreciation">Appreciation</option>
          </select>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006B56] outline-none bg-white text-slate-700"
          >
            <option value="ALL">All Resolution Statuses</option>
            <option value="Pending">Pending Review</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Feedback Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Feedback ID</th>
                <th className="py-3.5 px-4">Beneficiary</th>
                <th className="py-3.5 px-4">Programme</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Response</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFeedback.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-500">
                    <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700">No community feedback matches your filters</p>
                  </td>
                </tr>
              ) : (
                filteredFeedback.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-[#006B56]">
                      {item.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 text-xs">{item.beneficiary_name || 'Anonymous Beneficiary'}</div>
                      <div className="text-[11px] text-slate-400">{item.location || 'Kapoeta South'}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-700">
                      {item.program_name || 'Emergency Food Relief'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.type === 'Complaint' ? 'bg-rose-100 text-rose-800' :
                        item.type === 'Service Issue' ? 'bg-amber-100 text-amber-800' :
                        item.type === 'Suggestion' ? 'bg-blue-100 text-blue-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        item.priority === 'High' || item.priority === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {formatDate(item.created_at || '2026-09-10')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        item.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'Investigating' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                      {item.response || <span className="text-slate-400 italic">Awaiting Manager Response</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setActiveFeedback(item);
                          setResponseText(item.response || '');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-[#006B56] hover:bg-[#005242] text-white text-xs font-semibold rounded-lg shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Triage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FEEDBACK RESPONSE MODAL */}
      {activeFeedback && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#006B56] text-white flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-200 bg-emerald-800/80 px-2 py-0.5 rounded">
                  {activeFeedback.id}
                </span>
                <h3 className="text-base font-bold mt-1 text-white">Beneficiary Feedback Investigation & Response</h3>
              </div>
              <button
                onClick={() => setActiveFeedback(null)}
                className="p-1 text-emerald-100 hover:text-white rounded-lg hover:bg-emerald-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendResponse} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Beneficiary:</span>
                  <span className="font-bold text-slate-800">{activeFeedback.beneficiary_name || 'Community Member'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Feedback Type & Priority:</span>
                  <span className="font-bold text-slate-800">{activeFeedback.type} ({activeFeedback.priority || 'Normal'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Programme:</span>
                  <span className="font-medium text-[#006B56]">{activeFeedback.program_name}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">Beneficiary Statement:</span>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 italic text-xs leading-relaxed">
                  "{activeFeedback.message || activeFeedback.subject || 'Beneficiary reported delay in water purification sachet distribution following flood relocation.'}"
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Official Programme Manager Resolution Response
                </label>
                <textarea
                  rows="4"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Record formal response communicated back to beneficiary or field supervisor..."
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#006B56]"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveFeedback(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!responseText.trim() || isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#006B56] hover:bg-[#005242] rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Saving...' : 'Submit Official Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
