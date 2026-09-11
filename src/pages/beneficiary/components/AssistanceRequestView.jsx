import React, { useState, useEffect } from 'react';
import {
  HandHeart,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Truck,
  MapPin,
  Calendar,
  Filter,
  FileText,
  Sparkles
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { db } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

export function AssistanceRequestView({
  beneficiary,
  onRequestNew,
  statusFilter: propStatusFilter,
  onStatusFilterChange
}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localStatusFilter, setLocalStatusFilter] = useState('ALL');
  const toast = useToast();

  const statusFilter = propStatusFilter !== undefined ? propStatusFilter : localStatusFilter;
  const setStatusFilter = onStatusFilterChange || setLocalStatusFilter;

  const [formData, setFormData] = useState({
    category: 'Food Rations',
    urgency: 'High',
    household_members: beneficiary?.household_size || 5,
    description: '',
    preferred_depot: 'Lodwar Central Humanitarian Depot'
  });

  const categories = [
    { name: 'Food', desc: 'Grain packs, pulses, fortified vegetable oil, CSB+ nutrition' },
    { name: 'Water', desc: 'Emergency clean drinking water, purification tablets, 20L jerricans' },
    { name: 'Medical assistance', desc: 'Essential medicines, clinic referrals, health subsidies' },
    { name: 'Shelter', desc: 'Emergency tarpaulins, family tents, fleece blankets, kitchen sets' },
    { name: 'Education', desc: 'School supplies, textbooks, uniforms, vocational skills grant' },
    { name: 'Agricultural support', desc: 'Drought-tolerant certified seeds, micro-drip kits, farm tools' },
    { name: 'Cash/livelihood support', desc: 'Direct unconditional mobile money sustenance stipend' },
    { name: 'Other available assistance', desc: 'Specialized community emergency or disability assistive support' }
  ];

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await db.getAssistanceRequests(beneficiary?.id || 'b7');
      setRequests(data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [beneficiary]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      toast.warning('Please provide details regarding your household need.');
      return;
    }

    try {
      await db.createAssistanceRequest({
        beneficiary_id: beneficiary?.id || 'b7',
        beneficiary_name: beneficiary?.full_name || 'Mary Nyambura',
        beneficiary_code: beneficiary?.beneficiary_code || 'BEN-2025-007',
        ...formData
      });
      toast.success('Assistance request submitted successfully!');
      setIsModalOpen(false);
      setFormData({
        category: 'Food Rations',
        urgency: 'High',
        household_members: beneficiary?.household_size || 5,
        description: '',
        preferred_depot: 'Lodwar Central Humanitarian Depot'
      });
      loadRequests();
    } catch (err) {
      toast.error('Failed to submit assistance request.');
    }
  };

  const filteredRequests = requests.filter(r => {
    if (statusFilter === 'ALL') return true;
    return r.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const getStageNum = (req) => {
    if (req.status_stage) return req.status_stage;
    const st = (req.status || '').toLowerCase();
    if (st.includes('fulfill') || st.includes('disburs')) return 4;
    if (st.includes('approv')) return 3;
    if (st.includes('review')) return 2;
    return 1;
  };

  const getStatusBadge = (status) => {
    const st = (status || '').toLowerCase();
    if (st.includes('approv')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-[#006B56] border border-emerald-200/80 shadow-2xs">
          <CheckCircle className="w-3.5 h-3.5 stroke-[2.5]" /> Approved
        </span>
      );
    }
    if (st.includes('fulfill') || st.includes('disburs')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-teal-50 text-teal-800 border border-teal-200/80 shadow-2xs">
          <Truck className="w-3.5 h-3.5 stroke-[2.5]" /> Disbursed
        </span>
      );
    }
    if (st.includes('review') && !st.includes('pending')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs">
          <Clock className="w-3.5 h-3.5 stroke-[2.5]" /> Under Review
        </span>
      );
    }
    if (st.includes('reject') || st.includes('ineligib')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
          <XCircle className="w-3.5 h-3.5 stroke-[2.5]" /> Ineligible
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs">
        <Clock className="w-3.5 h-3.5 stroke-[2.5]" /> Pending Review
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Clean Single Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-0.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              My Assistance Requests
            </h2>
            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-[#006B56] border border-emerald-200/80 shadow-2xs">
                <span>Filter: {statusFilter}</span>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className="hover:text-rose-600 cursor-pointer font-black text-xs leading-none"
                  title="Clear filter (show all)"
                >
                  ×
                </button>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium truncate">
            {statusFilter === 'ALL'
              ? 'Track review status and dispatch progress for your household.'
              : `Showing ${statusFilter} requests (${filteredRequests.length})`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => (onRequestNew ? onRequestNew() : setIsModalOpen(true))}
          className="px-3.5 py-2 rounded-xl bg-[#006B56] hover:bg-[#005544] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-[0.98] cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Request</span>
        </button>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs font-medium">Loading assistance records...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-10 text-center space-y-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <FileText className="w-9 h-9 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800">No requests found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            You have no assistance requests matching this filter category.
          </p>
          <button
            type="button"
            onClick={() => (onRequestNew ? onRequestNew() : setIsModalOpen(true))}
            className="px-4 py-2 rounded-xl bg-[#006B56] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs hover:bg-[#005544] cursor-pointer transition active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Submit Request
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredRequests.map(req => {
            const stageNum = getStageNum(req);
            const stages = ['Submitted', 'Under Review', 'Approved', 'Disbursed'];

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-3.5 shadow-xs hover:border-emerald-300/80 transition-all"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-black text-sm text-slate-900 leading-snug">
                        {req.category}
                      </h4>
                      <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
                        #{req.request_code}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(req.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      {req.urgency && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span
                            className={`font-bold ${
                              req.urgency === 'Critical' ? 'text-rose-600' : 'text-amber-700'
                            }`}
                          >
                            Urgency: {req.urgency}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {getStatusBadge(req.status)}
                  </div>
                </div>

                {/* Modern Slim 4-Stage Progress Track (Replaces clunky 4-box stepper) */}
                <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-500">
                      Current Stage:{' '}
                      <strong className="text-slate-900 font-black">
                        {req.status === 'Pending' ? 'Pending Review' : req.status}
                      </strong>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Stage {stageNum} of 4
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {stages.map((st, idx) => {
                      const isDone = stageNum >= idx + 1;
                      const isCurrent = stageNum === idx + 1;
                      return (
                        <div key={st} className="space-y-1">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              isDone ? 'bg-[#006B56]' : 'bg-slate-200'
                            }`}
                          />
                          <span
                            className={`block text-[10px] text-center truncate ${
                              isCurrent
                                ? 'font-black text-[#006B56]'
                                : isDone
                                ? 'font-bold text-slate-700'
                                : 'text-slate-400'
                            }`}
                          >
                            {st}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Justification / Depot Details */}
                <div className="space-y-2 text-xs">
                  {req.description && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 leading-relaxed font-medium">
                      <span className="font-bold text-slate-900">Reason: </span>
                      {req.description}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 pt-0.5">
                    {req.preferred_depot && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-medium text-slate-700">{req.preferred_depot}</span>
                      </span>
                    )}
                    {req.household_members && (
                      <span className="font-medium text-slate-600">
                        Household: <strong className="text-slate-900 font-bold">{req.household_members}</strong>
                      </span>
                    )}
                  </div>

                  {/* Review Notes (if available) */}
                  {req.review_notes && (
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-emerald-900 space-y-1">
                      <p className="font-bold text-emerald-950 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#006B56]" />
                        <span>ADRA Field Office Review</span>
                      </p>
                      <p className="text-slate-700 leading-relaxed">{req.review_notes}</p>
                      {req.expected_dispatch_date && (
                        <p className="text-[11px] font-bold text-[#006B56] pt-0.5">
                          Scheduled Collection: {req.expected_dispatch_date}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Submit New Assistance Request (Function 5) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit Aid Assistance Request"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Assistance Programme / Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="adra-select text-xs"
              required
            >
              {categories.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name} — {c.desc}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Urgency Level
              </label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                className="adra-select text-xs"
              >
                <option value="Standard">Standard Intake (7-14 days)</option>
                <option value="High">High Priority (3-5 days)</option>
                <option value="Critical">Critical Emergency (Immediate 24-48h)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Household Members Supported
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.household_members}
                onChange={(e) => setFormData({ ...formData, household_members: Number(e.target.value) })}
                className="adra-input text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Preferred Distribution Point / Depot
            </label>
            <input
              type="text"
              value={formData.preferred_depot}
              onChange={(e) => setFormData({ ...formData, preferred_depot: e.target.value })}
              className="adra-input text-xs"
              placeholder="e.g. Lodwar Central Depot, Kakuma Point 3"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Explanation of Need / Circumstances
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="adra-input text-xs resize-none"
              placeholder="Describe your household condition (e.g. crop failure, flood damage, medical urgency, displacement)..."
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
            >
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
