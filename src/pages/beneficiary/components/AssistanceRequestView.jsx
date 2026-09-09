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

export function AssistanceRequestView({ beneficiary }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const toast = useToast();

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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"><CheckCircle className="w-3.5 h-3.5" /> Approved</span>;
      case 'Fulfilled':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300"><Truck className="w-3.5 h-3.5" /> Fulfilled</span>;
      case 'Under Review':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300"><Clock className="w-3.5 h-3.5" /> Under Review</span>;
      case 'Rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300"><XCircle className="w-3.5 h-3.5" /> Ineligible</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300"><Clock className="w-3.5 h-3.5" /> Pending Review</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Submit Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HandHeart className="w-5 h-5 text-emerald-600" />
            Assistance Requests & Live Status Tracker
          </h2>
          <p className="text-xs text-slate-500">
            Submit applications for emergency humanitarian assistance and track evaluation progress in real-time
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          icon={Plus}
          className="shadow-sm"
        >
          Request Aid Assistance
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 w-fit overflow-x-auto max-w-full">
        {['ALL', 'Pending', 'Under Review', 'Approved', 'Fulfilled'].map(tab => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              statusFilter === tab
                ? 'bg-white text-emerald-800 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            {tab === 'ALL' ? 'All Requests' : tab}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">Loading assistance records...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="adra-card p-12 text-center space-y-3 bg-white">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800">No requests found in this category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You currently have no assistance requests matching the selected filter. Click below to submit a new application.
          </p>
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            Submit New Request
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map(req => (
            <div
              key={req.id}
              className="adra-card p-5 bg-white border border-slate-800 space-y-4 hover:border-emerald-500/30 transition shadow-sm"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-500/30 text-emerald-600 font-bold">
                    <HandHeart className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-100">{req.category}</h4>
                      <span className="font-mono text-xs text-slate-400 font-semibold">#{req.request_code}</span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(req.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      <span>•</span>
                      <span>Urgency: <strong className="text-rose-700 font-semibold">{req.urgency}</strong></span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {getStatusBadge(req.status)}
                </div>
              </div>

              {/* Progress Stepper (Function 6: Request Status) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Request Evaluation Stepper</p>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className={`p-2 rounded-lg border font-medium ${req.status_stage >= 1 ? 'bg-emerald-50 border-emerald-500/40 text-emerald-800 font-bold' : 'bg-white border-slate-200 text-slate-400'}`}>
                    1. Pending Review
                  </div>
                  <div className={`p-2 rounded-lg border font-medium ${req.status_stage >= 2 ? 'bg-emerald-50 border-emerald-500/40 text-emerald-800 font-bold' : 'bg-white border-slate-200 text-slate-400'}`}>
                    2. Under Review
                  </div>
                  <div className={`p-2 rounded-lg border font-medium ${req.status_stage >= 3 ? 'bg-emerald-50 border-emerald-500/40 text-emerald-800 font-bold' : 'bg-white border-slate-200 text-slate-400'}`}>
                    3. Approved
                  </div>
                  <div className={`p-2 rounded-lg border font-medium ${req.status_stage >= 4 ? 'bg-emerald-50 border-emerald-500/40 text-emerald-800 font-bold' : 'bg-white border-slate-200 text-slate-400'}`}>
                    4. Disbursed
                  </div>
                </div>
              </div>

              {/* Description & Reviewer Notes */}
              <div className="text-xs space-y-1.5 text-slate-700">
                <p className="leading-relaxed"><strong className="text-slate-900 font-semibold">Household Justification:</strong> {req.description}</p>
                <p className="flex items-center gap-1.5 text-slate-500">
                  <MapPin className="w-3.5 h-3.5" /> Preferred Distribution Hub: <strong className="text-slate-800 font-medium">{req.preferred_depot}</strong>
                </p>

                {req.review_notes && (
                  <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-500/20 text-emerald-900 text-xs mt-2">
                    <p className="font-semibold text-emerald-950 flex items-center gap-1 mb-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      ADRA Evaluation Officer Notes ({req.reviewed_by || 'Field Supervisor'}):
                    </p>
                    <p>{req.review_notes}</p>
                    {req.expected_dispatch_date && (
                      <p className="mt-1 text-[11px] font-semibold text-emerald-800">
                        Scheduled Collection Date: {req.expected_dispatch_date}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
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
