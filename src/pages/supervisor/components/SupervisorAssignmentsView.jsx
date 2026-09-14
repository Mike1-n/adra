import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  UserCheck,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Layers,
  ArrowRight,
  Calendar,
  Sparkles,
  Inbox,
  User
} from 'lucide-react';
import { SupervisorAssignWorkerModal } from './SupervisorAssignWorkerModal';

export function SupervisorAssignmentsView({
  assignments = [],
  fieldWorkers = [],
  onSelectAssignment,
  onAssignFieldWorker,
  onOpenReport
}) {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'assigned' | 'in_progress' | 'completed' | 'overdue'
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [countyFilter, setCountyFilter] = useState('ALL');
  const [assignModalRequest, setAssignModalRequest] = useState(null);

  // Filter assignments by active tab, search query, priority, and county
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      const status = item.status || 'Submitted';
      
      // Tab matching logic
      if (activeTab === 'pending') {
        const isPending = status === 'Assigned to Supervisor' || 
                          status === 'Submitted' || 
                          status === 'Pending' || 
                          status === 'Under Review' ||
                          !item.assigned_field_worker_name ||
                          item.assigned_field_worker_name.includes('Pending') ||
                          item.assigned_field_worker_name.includes('Unassigned');
        if (!isPending) return false;
      } else if (activeTab === 'assigned') {
        const isAssigned = status === 'Assigned to Field Worker' || (item.assigned_field_worker_name && !item.assigned_field_worker_name.includes('Pending') && status !== 'Completed' && status !== 'Distributed' && status !== 'Assessment Submitted' && status !== 'Awaiting Program Manager Decision');
        if (!isAssigned) return false;
      } else if (activeTab === 'in_progress') {
        const isInProgress = status === 'Assessment In Progress' || status === 'Correction Required';
        if (!isInProgress) return false;
      } else if (activeTab === 'completed') {
        const isCompleted = status === 'Completed' || status === 'Distributed' || status === 'Assessment Submitted' || status === 'Awaiting Program Manager Decision' || status === 'Approved';
        if (!isCompleted) return false;
      } else if (activeTab === 'overdue') {
        const isOverdue = item.is_overdue || (item.due_date && new Date(item.due_date) < new Date() && status !== 'Completed' && status !== 'Distributed');
        if (!isOverdue) return false;
      }

      // Priority matching
      if (priorityFilter !== 'ALL') {
        const p = item.priority || item.urgency || 'Medium';
        if (p !== priorityFilter) return false;
      }

      // County matching
      if (countyFilter !== 'ALL') {
        const c = item.county || '';
        if (c !== countyFilter) return false;
      }

      // Search matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const code = (item.request_code || item.id || '').toLowerCase();
        const benName = (item.beneficiary_name || '').toLowerCase();
        const worker = (item.assigned_field_worker_name || '').toLowerCase();
        const type = (item.assistance_type || item.category || '').toLowerCase();
        const loc = (item.location || `${item.county || ''} ${item.payam || ''}`).toLowerCase();
        if (!code.includes(q) && !benName.includes(q) && !worker.includes(q) && !type.includes(q) && !loc.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [assignments, activeTab, searchQuery, priorityFilter, countyFilter]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts = { pending: 0, assigned: 0, in_progress: 0, completed: 0, overdue: 0 };
    assignments.forEach(item => {
      const status = item.status || 'Submitted';
      const isUnassigned = !item.assigned_field_worker_name || item.assigned_field_worker_name.includes('Pending') || item.assigned_field_worker_name.includes('Unassigned') || status === 'Assigned to Supervisor' || status === 'Submitted';
      
      if (isUnassigned) counts.pending++;
      else if (status === 'Assigned to Field Worker') counts.assigned++;
      else if (status === 'Assessment In Progress' || status === 'Correction Required') counts.in_progress++;
      else if (status === 'Completed' || status === 'Distributed' || status === 'Assessment Submitted' || status === 'Awaiting Program Manager Decision' || status === 'Approved') counts.completed++;

      if (item.is_overdue || (item.due_date && new Date(item.due_date) < new Date() && status !== 'Completed' && status !== 'Distributed')) {
        counts.overdue++;
      }
    });
    return counts;
  }, [assignments]);

  return (
    <div className="space-y-3 pb-24">
      
      {/* Title & Stats Ribbon */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Field Assignments Hub</h2>
            <p className="text-xs text-slate-500">Coordinate and dispatch field verification assessments</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-[#006B56]/10 text-[#006B56] rounded-xl border border-[#006B56]/20">
            {assignments.length} Total Cases
          </span>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'pending', label: 'Pending', count: tabCounts.pending, color: 'text-amber-700 bg-amber-50 border-amber-200' },
            { id: 'assigned', label: 'Assigned', count: tabCounts.assigned, color: 'text-blue-700 bg-blue-50 border-blue-200' },
            { id: 'in_progress', label: 'In Progress', count: tabCounts.in_progress, color: 'text-purple-700 bg-purple-50 border-purple-200' },
            { id: 'completed', label: 'Completed', count: tabCounts.completed, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
            { id: 'overdue', label: 'Overdue', count: tabCounts.overdue, color: 'text-red-700 bg-red-50 border-red-200' }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-1.5 transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#006B56] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-3 rounded-2xl shadow-xs border border-slate-200/80 space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Request ID, beneficiary, worker, or location..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B56]"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="p-2 border border-slate-300 rounded-xl bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#006B56]"
          >
            <option value="ALL">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={countyFilter}
            onChange={(e) => setCountyFilter(e.target.value)}
            className="p-2 border border-slate-300 rounded-xl bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#006B56]"
          >
            <option value="ALL">All Counties</option>
            <option value="Kapoeta South">Kapoeta South</option>
            <option value="Kapoeta East">Kapoeta East</option>
            <option value="Torit">Torit</option>
            <option value="Juba">Juba</option>
            <option value="Bor">Bor</option>
          </select>
        </div>
      </div>

      {/* Assignment Cards List */}
      <div className="space-y-3">
        {filteredAssignments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 space-y-2">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Assignments Found</p>
            <p className="text-xs text-slate-400">
              There are no assistance requests matching the active tab and search filters.
            </p>
          </div>
        ) : (
          filteredAssignments.map((item) => {
            const isUnassigned = !item.assigned_field_worker_name || 
                                 item.assigned_field_worker_name.includes('Pending') || 
                                 item.assigned_field_worker_name.includes('Unassigned');

            const priorityBadge = {
              'Critical': 'bg-red-100 text-red-800 border-red-200',
              'High': 'bg-amber-100 text-amber-800 border-amber-200',
              'Medium': 'bg-blue-100 text-blue-800 border-blue-200',
              'Low': 'bg-slate-100 text-slate-700 border-slate-200'
            };

            return (
              <div
                key={item.id || item.request_code}
                className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 hover:border-slate-300 transition-all space-y-3"
              >
                {/* Header: Request ID, Priority & Status */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-[#006B56] font-mono">
                        {item.request_code || item.id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityBadge[item.priority || item.urgency] || 'bg-slate-100 text-slate-700'}`}>
                        {item.priority || item.urgency || 'High'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">{item.beneficiary_name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">Beneficiary ID: {item.beneficiary_code || item.beneficiary_id || 'ADRA-SS-000125'}</p>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {item.status_label || item.status}
                  </span>
                </div>

                {/* Aid Type & Program */}
                <div className="p-2.5 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Assistance Type:</span>
                    <span className="font-bold text-slate-800">{item.assistance_type || item.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Programme:</span>
                    <span className="font-medium text-slate-700 truncate max-w-[200px]">
                      {item.programme_name || item.program_name || 'Emergency Food Security'}
                    </span>
                  </div>
                </div>

                {/* Location Hierarchy */}
                <div className="flex items-start space-x-2 text-xs text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-[#006B56] mt-0.5 shrink-0" />
                  <span>
                    {item.village ? `${item.village}, ` : ''}
                    {item.boma ? `${item.boma}, ` : ''}
                    {item.payam ? `${item.payam}, ` : ''}
                    <strong className="text-slate-800">{item.county || 'Kapoeta South'}</strong>, {item.state || 'Eastern Equatoria'}
                  </span>
                </div>

                {/* Assigned Field Worker & Date */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-600">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium truncate max-w-[150px]">
                      {item.assigned_field_worker_name || 'Pending Assignment'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 text-slate-400 font-mono text-[11px]">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB') : 'Recent'}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 pt-1">
                  {isUnassigned ? (
                    <button
                      onClick={() => setAssignModalRequest(item)}
                      className="flex-1 py-2 bg-[#006B56] hover:bg-[#005544] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Assign Field Worker</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onSelectAssignment(item)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center space-x-1 transition-colors"
                    >
                      <span>View Case Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => onSelectAssignment(item)}
                    className="px-3 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors"
                  >
                    Details
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Assign Field Worker Modal */}
      {assignModalRequest && (
        <SupervisorAssignWorkerModal
          request={assignModalRequest}
          fieldWorkers={fieldWorkers}
          isOpen={Boolean(assignModalRequest)}
          onClose={() => setAssignModalRequest(null)}
          onAssignSuccess={async (reqId, workerId, workerName, notes, dueDate) => {
            await onAssignFieldWorker(reqId, workerId, workerName, notes, dueDate);
          }}
        />
      )}

    </div>
  );
}
