import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  RefreshCw,
  MapPin,
  Calendar,
  UserCheck,
  PackageCheck,
  FolderKanban,
  Check
} from 'lucide-react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { db } from '../../../lib/supabase';
import { formatDate } from '../../../lib/utils';
import { useToast } from '../../../context/ToastContext';

export const LIFECYCLE_STAGES = [
  { stage: 1, title: '1. Request Submitted', shortName: 'Submitted', percentage: 15, color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { stage: 2, title: '2. Supervisor Triaged', shortName: 'Triaged', percentage: 30, color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { stage: 3, title: '3. Worker Assigned', shortName: 'Worker Assigned', percentage: 45, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { stage: 4, title: '4. Needs Assessment', shortName: 'Under Assessment', percentage: 65, color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { stage: 5, title: '5. Aid Approved', shortName: 'Approved', percentage: 80, color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { stage: 6, title: '6. QR Dispatched', shortName: 'QR Dispatched', percentage: 90, color: 'bg-teal-100 text-teal-800 border-teal-200' },
  { stage: 7, title: '7. Delivered & Received', shortName: 'Delivered', percentage: 100, color: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' }
];

export function determineStage(req) {
  if (!req) return 1;
  const status = String(req.status || '').toLowerCase();
  if (status.includes('fulfill') || status.includes('disburs') || status.includes('complet') || status.includes('receiv')) return 7;
  if (status.includes('token') || status.includes('dispatch') || status.includes('warehouse') || req.qr_token) return 6;
  if (status.includes('approv')) return 5;
  if (status.includes('assess') || status.includes('verification pass') || status.includes('verified')) return 4;
  if (req.assigned_field_worker_name || req.field_worker_name || status.includes('field worker')) return 3;
  if (status.includes('supervisor') || status.includes('review') || status.includes('under review')) return 2;
  return 1;
}

export function ProjectLifecycleTrackerView({ onNavigateTab }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [selectedCase, setSelectedCase] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const reqs = await db.getAssistanceRequests();
      setRequests(reqs || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load assistance lifecycle data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCases = useMemo(() => {
    return requests.filter(r => {
      const stage = determineStage(r);
      const matchStage = stageFilter === 'ALL' 
        ? true
        : stageFilter === 'IN_ACTION'
        ? stage < 7
        : stageFilter === 'COMPLETED'
        ? stage === 7
        : String(stage) === String(stageFilter);
      
      const q = search.toLowerCase().trim();
      const matchSearch = !q || 
        (r.request_code || '').toLowerCase().includes(q) ||
        (r.beneficiary_name || '').toLowerCase().includes(q) ||
        (r.beneficiary_code || '').toLowerCase().includes(q) ||
        (r.category || r.assistance_type || '').toLowerCase().includes(q) ||
        (r.location || '').toLowerCase().includes(q) ||
        (r.assigned_field_worker_name || '').toLowerCase().includes(q);

      return matchStage && matchSearch;
    });
  }, [requests, search, stageFilter]);

  // Metric counts
  const metrics = useMemo(() => {
    const total = requests.length;
    let inAction = 0;
    let completed = 0;

    requests.forEach(r => {
      const st = determineStage(r);
      if (st < 7) inAction++;
      else completed++;
    });

    return { total, inAction, completed };
  }, [requests]);

  const cleanLocation = (loc, state, county) => {
    if (!loc) return `${state || 'Central Equatoria'}, ${county || 'Juba'}`;
    const parts = loc.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length > 2) return `${parts[0]}, ${parts[1]}`;
    return loc;
  };

  if (loading) {
    return <LoadingSpinner text="Loading assistance progress..." />;
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#006B56]" />
            Beneficiary Assistance & Project Progress Tracker
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor household aid requests from submission through field assessment and approval to final receipt.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          icon={RefreshCw}
        >
          Refresh
        </Button>
      </div>

      {/* 3 Status Summary Cards: Total, In Action, Completed */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total Requests Card */}
        <div
          onClick={() => setStageFilter('ALL')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            stageFilter === 'ALL'
              ? 'bg-slate-50 border-slate-400 shadow-sm ring-2 ring-slate-400/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Enrolled Requests</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{metrics.total}</p>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">All registered household aid cases</p>
        </div>

        {/* In Action Card */}
        <div
          onClick={() => setStageFilter('IN_ACTION')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            stageFilter === 'IN_ACTION'
              ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">In Action (Active Pipeline)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-900 mt-2">{metrics.inAction}</p>
          <p className="text-xs text-blue-600 mt-0.5 font-medium">In assessment, verification, or dispatch</p>
        </div>

        {/* Completed Card */}
        <div
          onClick={() => setStageFilter('COMPLETED')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            stageFilter === 'COMPLETED'
              ? 'bg-emerald-50/80 border-emerald-600 shadow-sm ring-2 ring-emerald-600/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Completed & Received</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-950 mt-2">{metrics.completed}</p>
          <p className="text-xs text-emerald-700 mt-0.5 font-medium">Delivered & verified by beneficiary</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by case ID, beneficiary name, location, aid category..."
            className="adra-input pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="adra-select text-xs font-semibold py-1.5 w-full sm:w-56"
          >
            <option value="ALL">All Requests ({requests.length})</option>
            <option value="IN_ACTION">In Action / Active Pipeline ({metrics.inAction})</option>
            <option value="COMPLETED">Completed & Delivered ({metrics.completed})</option>
            <optgroup label="Filter by Exact Stage">
              {LIFECYCLE_STAGES.map((st) => (
                <option key={st.stage} value={st.stage}>
                  {st.title}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <Card className="p-0 overflow-hidden shadow-2xs border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Beneficiary Household</th>
                <th className="py-3 px-4">Assistance Requested</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Assigned Personnel</th>
                <th className="py-3 px-4 min-w-[190px]">Lifecycle Progress</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-800">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                    No assistance cases found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredCases.map((req) => {
                  const currentStageNum = determineStage(req);
                  const currentStageObj = LIFECYCLE_STAGES.find(s => s.stage === currentStageNum) || LIFECYCLE_STAGES[0];

                  return (
                    <tr key={req.id} className="hover:bg-slate-50 transition">
                      {/* Case ID */}
                      <td className="py-3 px-4 align-middle font-mono font-bold text-slate-900">
                        #{req.request_code || req.id}
                        <span className="block font-sans font-normal text-[11px] text-slate-400 mt-0.5">
                          {formatDate(req.created_at || req.date)}
                        </span>
                      </td>

                      {/* Beneficiary */}
                      <td className="py-3 px-4 align-middle">
                        <span className="font-bold text-slate-900 block text-xs">
                          {req.beneficiary_name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {req.beneficiary_code || 'ADRA-SS-000135'}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 align-middle">
                        <span className="font-semibold text-slate-900 block">
                          {req.category || req.assistance_type || 'Food & Water Aid'}
                        </span>
                        <span className={`inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                          req.urgency === 'Critical'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : req.urgency === 'High'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {req.urgency || 'High'} Priority
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 align-middle text-slate-700 font-medium">
                        {cleanLocation(req.location, req.state, req.county)}
                      </td>

                      {/* Field Worker */}
                      <td className="py-3 px-4 align-middle">
                        {req.assigned_field_worker_name ? (
                          <span className="font-bold text-blue-900 block">
                            {req.assigned_field_worker_name}
                          </span>
                        ) : (
                          <span className="text-amber-700 italic text-[11px] block">
                            Pending Assignment
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 block">
                          Sup: Emmanuel Adeyemi
                        </span>
                      </td>

                      {/* Status / Progress */}
                      <td className="py-3 px-4 align-middle">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${currentStageObj.color}`}>
                              {currentStageObj.title}
                            </span>
                            <span className="font-mono text-[11px] font-bold text-slate-700">
                              {currentStageObj.percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#006B56] h-full rounded-full transition-all duration-300"
                              style={{ width: `${currentStageObj.percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Action Button - High Visibility */}
                      <td className="py-3 px-4 align-middle text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          onClick={() => {
                            setSelectedCase(req);
                            setIsDetailOpen(true);
                          }}
                          className="border-slate-300 text-slate-800 font-bold hover:bg-emerald-50 hover:text-[#006B56] hover:border-emerald-300 shadow-2xs px-3"
                        >
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Case Details / Audit Modal */}
      {selectedCase && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Case Journey: #${selectedCase.request_code || selectedCase.id}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-xs">
            {/* Beneficiary and Status Header */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {selectedCase.beneficiary_name} ({selectedCase.beneficiary_code})
                </h4>
                <p className="text-slate-500 text-xs mt-0.5">
                  {selectedCase.category} • {cleanLocation(selectedCase.location, selectedCase.state, selectedCase.county)}
                </p>
              </div>
              <span className="font-bold text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Stage {determineStage(selectedCase)} of 7
              </span>
            </div>

            {/* 7-Step Simple Checklist */}
            <div className="space-y-2">
              <h5 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Milestone Progress
              </h5>
              <div className="space-y-1.5">
                {LIFECYCLE_STAGES.map((st) => {
                  const currentSt = determineStage(selectedCase);
                  const isDone = currentSt >= st.stage;
                  const isCurrent = currentSt === st.stage;

                  return (
                    <div
                      key={st.stage}
                      className={`p-2.5 rounded-lg border flex items-center justify-between ${
                        isDone
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950 font-medium'
                          : 'bg-white border-slate-100 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isDone ? 'bg-[#006B56] text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {st.stage}
                        </div>
                        <span className={isCurrent ? 'font-bold text-[#006B56]' : ''}>
                          {st.title}
                        </span>
                      </div>

                      <span className="text-[11px] font-mono">
                        {isDone ? 'Complete' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedCase.field_worker_notes && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">
                <span className="font-bold">Field Worker Notes: </span>
                <span>{selectedCase.field_worker_notes}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailOpen(false)}
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
