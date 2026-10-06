import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ClipboardList,
  Clock,
  MapPin,
  FileCheck,
  AlertTriangle,
  ArrowRight,
  Phone,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  DollarSign,
  Truck,
  PackageCheck,
  QrCode,
  Package
} from 'lucide-react';

export function FieldWorkerTasksView({
  tasks = [],
  statusFilter: externalStatusFilter,
  onStatusFilterChange,
  onStartAssessment,
  onSelectTask,
  onCollectGoods,
  onDistribute,
  onOpenScanner,
  onRequestFacilitation
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [internalStatusFilter, setInternalStatusFilter] = useState('all'); // 'all' | 'pending' | 'hub_ready' | 'submitted' | 'rejected' | 'completed'
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  const statusFilter = externalStatusFilter !== undefined ? externalStatusFilter : internalStatusFilter;
  const setStatusFilter = (val) => {
    if (onStatusFilterChange) onStatusFilterChange(val);
    setInternalStatusFilter(val);
  };

  const isRejHelper = (t) => t.status === 'Rejected' || 
                            t.status?.includes('Rejected') || 
                            t.status_label?.includes('Rejected') || 
                            t.status === 'Correction Required' || 
                            Boolean(t.returned_to_worker);

  const isDeliveredHelper = (t) => !isRejHelper(t) && (
    t.status === 'Distributed' || 
    t.status === 'Completed' ||
    t.dispatch_status === 'Distributed' ||
    t.dispatch_status === 'Delivered' ||
    Boolean(t.distributed_at) ||
    Boolean(t.distribution_date) ||
    Boolean(t.distribution_confirmed) ||
    Boolean(t.recipient_confirmed)
  );

  const isCustodyHelper = (t) => !isRejHelper(t) && !isDeliveredHelper(t) && (
    t.status === 'goods_collected_by_field_worker' || 
    t.dispatch_status === 'Collected by Field Worker' ||
    t.status === 'Collected' ||
    t.dispatch_status === 'Collected' ||
    t.status?.toLowerCase().includes('collected') ||
    t.dispatch_status?.toLowerCase().includes('collected')
  );

  const isHubHelper = (t) => !isRejHelper(t) && !isDeliveredHelper(t) && !isCustodyHelper(t) && (
    t.status === 'goods_arrived_at_hub' || 
    t.status === 'warehouse_dispatched' || 
    t.status === 'Arrived' ||
    t.dispatch_status === 'In Transit' || 
    t.dispatch_status === 'Arrived at Hub' ||
    t.dispatch_status === 'Arrived' ||
    t.status?.toLowerCase().includes('arrived') ||
    t.dispatch_status?.toLowerCase().includes('arrived')
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || (
        (task.beneficiary_name && task.beneficiary_name.toLowerCase().includes(q)) ||
        (task.request_code && task.request_code.toLowerCase().includes(q)) ||
        (task.beneficiary_code && task.beneficiary_code.toLowerCase().includes(q)) ||
        (task.payam && task.payam.toLowerCase().includes(q)) ||
        (task.category && task.category.toLowerCase().includes(q)) ||
        (task.waybill_number && task.waybill_number.toLowerCase().includes(q))
      );

      const isTaskRej = isRejHelper(task);
      const isTaskCustody = isCustodyHelper(task);
      const isTaskHub = isHubHelper(task);
      const isTaskDelivered = isDeliveredHelper(task);

      let matchStatus = true;
      if (statusFilter === 'pending') {
        matchStatus = (task.status === 'Assigned to Field Worker' || task.status === 'Submitted' || task.status === 'Assessment In Progress') && !isTaskRej && !isTaskHub && !isTaskCustody && !isTaskDelivered;
      } else if (statusFilter === 'submitted') {
        matchStatus = (task.status === 'Assessment Submitted' || task.status === 'Awaiting Program Manager Decision') && !isTaskRej;
      } else if (statusFilter === 'rejected') {
        matchStatus = isTaskRej;
      } else if (statusFilter === 'hub_ready') {
        matchStatus = isTaskHub;
      } else if (statusFilter === 'in_custody') {
        matchStatus = isTaskCustody;
      } else if (statusFilter === 'in_progress') {
        matchStatus = task.status === 'Assessment In Progress' && !isTaskRej;
      } else if (statusFilter === 'completed') {
        matchStatus = isTaskDelivered;
      }

      let matchUrgency = true;
      if (urgencyFilter !== 'all') {
        matchUrgency = (task.urgency || task.priority) === urgencyFilter;
      }

      return matchQuery && matchStatus && matchUrgency;
    });
  }, [tasks, searchQuery, statusFilter, urgencyFilter]);

  const [expandedTaskId, setExpandedTaskId] = useState(null);

  const toggleTaskExpand = (taskId) => {
    setExpandedTaskId(prev => prev === taskId ? null : taskId);
  };

  const pendingCount = tasks.filter(t => 
    (t.status === 'Assigned to Field Worker' || 
     t.status === 'Submitted' || 
     t.status === 'Assessment In Progress') &&
    !isRejHelper(t) && !isHubHelper(t) && !isCustodyHelper(t) && !isDeliveredHelper(t)
  ).length;

  const submittedCount = tasks.filter(t => 
    (t.status === 'Assessment Submitted' || 
     t.status === 'Awaiting Program Manager Decision') &&
    !isRejHelper(t)
  ).length;

  const rejectedCount = tasks.filter(t => isRejHelper(t)).length;

  const hubReadyCount = tasks.filter(t => isHubHelper(t)).length;

  const inCustodyCount = tasks.filter(t => isCustodyHelper(t)).length;

  const completedCount = tasks.filter(t => isDeliveredHelper(t)).length;

  return (
    <div className="space-y-3.5 pb-12 animate-in fade-in duration-200">
      
      {/* 1. FLAT TAB BAR: All Tasks -> Pending Audit -> Submitted -> Returned / Rejected -> Hub Cargo -> In Custody -> Delivered */}
      <div className="flex items-center space-x-1 border-b border-slate-200 px-1 overflow-x-auto no-scrollbar">
        {/* 1. All Tasks */}
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`pb-2 px-2 text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
            statusFilter === 'all'
              ? 'border-[#006B56] text-[#006B56]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>All Tasks</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            statusFilter === 'all' ? 'bg-emerald-100 text-[#006B56]' : 'bg-slate-100 text-slate-500'
          }`}>
            {tasks.length}
          </span>
        </button>

        {/* 2. Pending Audit */}
        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className={`pb-2 px-2 text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
            statusFilter === 'pending'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Pending Audit</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            statusFilter === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
          }`}>
            {pendingCount}
          </span>
        </button>

        {/* 3. Submitted */}
        <button
          type="button"
          onClick={() => setStatusFilter('submitted')}
          className={`pb-2 px-2 text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
            statusFilter === 'submitted'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Submitted</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            statusFilter === 'submitted' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-500'
          }`}>
            {submittedCount}
          </span>
        </button>

        {/* 4. Returned / Rejected */}
        <button
          type="button"
          onClick={() => setStatusFilter('rejected')}
          className={`pb-2 px-2 text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
            statusFilter === 'rejected'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Returned / Rejected</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            statusFilter === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-500'
          }`}>
            {rejectedCount}
          </span>
        </button>

        {/* 5. Hub Goods Ready for Collection */}
        <button
          type="button"
          onClick={() => setStatusFilter('hub_ready')}
          className={`pb-2 px-2 text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
            statusFilter === 'hub_ready'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>📦 Hub Store Cargo</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            statusFilter === 'hub_ready' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
          }`}>
            {hubReadyCount}
          </span>
        </button>

        {/* 6. In Custody (Collected by Field Worker) */}
        <button
          type="button"
          onClick={() => setStatusFilter('in_custody')}
          className={`pb-2 px-2 text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
            statusFilter === 'in_custody'
              ? 'border-blue-600 text-blue-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>✓ In Custody</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            statusFilter === 'in_custody' ? 'bg-blue-600 text-white' : (inCustodyCount > 0 ? 'bg-blue-100 text-blue-800 font-black' : 'bg-slate-100 text-slate-500')
          }`}>
            {inCustodyCount}
          </span>
        </button>

        {/* 7. Delivered / Completed */}
        <button
          type="button"
          onClick={() => setStatusFilter('completed')}
          className={`pb-2 px-2 text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
            statusFilter === 'completed'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Delivered</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            statusFilter === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
          }`}>
            {completedCount}
          </span>
        </button>
      </div>

      {/* 2. SEARCH INPUT */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by case #, beneficiary name, payam, aid category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-8 py-2 bg-white text-xs rounded-xl border border-slate-200 shadow-2xs focus:border-[#006B56] focus:ring-1 focus:ring-[#006B56] outline-none transition font-medium"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3. TASK CARDS LIST (COLLAPSIBLE / EXPANDABLE) */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No matching assignments found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria or switch status filter tabs above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => {
            const taskId = task.id || task.request_code;
            const isRejected = isRejHelper(task);
            const isCollected = isCustodyHelper(task);
            const isArrivedAtHub = isHubHelper(task);
            const isDispatched = !isRejected && !isCollected && !isArrivedAtHub && (task.status === 'warehouse_dispatched' || task.dispatch_status === 'In Transit' || task.status === 'In Transit');
            const isPending = !isRejected && !isDispatched && !isArrivedAtHub && !isCollected && (task.status === 'Assigned to Field Worker' || task.status === 'Submitted' || task.status === 'Assessment In Progress');
            const isSubmitted = !isRejected && (task.status === 'Assessment Submitted' || task.status === 'Awaiting Program Manager Decision');
            const isCompleted = isDeliveredHelper(task);
            const isExpanded = expandedTaskId === taskId;

            return (
              <div
                key={taskId}
                className={`bg-white rounded-2xl border shadow-2xs overflow-hidden transition ${
                  isRejected ? 'border-rose-300 ring-1 ring-rose-200' : 
                  isCollected ? 'border-blue-300 ring-1 ring-blue-200' :
                  isArrivedAtHub ? 'border-emerald-300 ring-1 ring-emerald-200' :
                  isDispatched ? 'border-amber-300' :
                  'border-slate-200'
                }`}
              >
                {/* Collapsible Header */}
                <div 
                  onClick={() => toggleTaskExpand(taskId)}
                  className={`p-3.5 space-y-2 cursor-pointer transition ${
                    isRejected ? 'bg-rose-50/40 hover:bg-rose-50/70' : 
                    isCollected ? 'bg-blue-50/40 hover:bg-blue-50/70' :
                    isArrivedAtHub ? 'bg-emerald-50/40 hover:bg-emerald-50/70' :
                    'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#006B56] transition">
                          {task.beneficiary_name}
                        </h3>
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          #{task.request_code}
                        </span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          task.urgency === 'High' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {task.urgency || 'Normal'} Priority
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{task.payam || task.location || 'Eastern Equatoria'} • {task.household_members || 6} Members</span>
                      </p>
                    </div>

                    {/* Status Badge & Chevron */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isRejected ? 'bg-rose-100 text-rose-800 border-rose-300' :
                        isCollected ? 'bg-blue-100 text-blue-900 border-blue-300' :
                        isArrivedAtHub ? 'bg-emerald-100 text-[#006B56] border-emerald-300' :
                        isDispatched ? 'bg-amber-100 text-amber-900 border-amber-300' :
                        isCompleted ? 'bg-emerald-100 text-[#006B56] border-emerald-200' :
                        isSubmitted ? 'bg-purple-100 text-purple-800 border-purple-200' :
                        'bg-amber-100 text-amber-900 border-amber-200'
                      }`}>
                        {isRejected ? 'Rejected by PM' : 
                         isCollected ? '✓ Collected (Ready to Distribute)' :
                         isArrivedAtHub ? '📦 Arrived at Hub' :
                         isDispatched ? '🚚 In Transit' : 
                         task.status}
                      </span>
                      <div className="text-slate-400 p-0.5">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-[#006B56]" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-3 text-xs animate-in fade-in duration-150">
                    {/* Rejection notice box if rejected */}
                    {isRejected && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-rose-800 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Audit Rejected by Programme Manager</span>
                        </div>
                        <p className="text-[11px] text-rose-900 font-medium italic">
                          "{task.rejection_reason || task.review_notes || 'Returned to field worker for re-assessment.'}"
                        </p>
                      </div>
                    )}

                    {/* In Transit Convoy Alert */}
                    {isDispatched && (
                      <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-xl space-y-1.5 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-amber-700 shrink-0" />
                          <span className="font-black text-amber-950 text-xs">
                            🚚 Relief Supplies In Transit (Waybill #{task.waybill_number || 'DISP'})
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-900 leading-snug">
                          Commodities released from <strong>{task.origin_warehouse || 'Depot'}</strong> via {task.vehicle_reg || 'Fleet Truck'}. Convoy Driver: {task.driver_name || 'Deng Bol'}.
                        </p>
                        <p className="text-[10px] text-amber-800 font-medium">
                          Supervisor <strong>{task.assigned_supervisor_name || 'Supervisor'}</strong> will mark goods arrived once received at the relief hub.
                        </p>
                      </div>
                    )}

                    {/* Arrived at Hub Ready for Collection */}
                    {isArrivedAtHub && (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2.5 text-xs shadow-2xs">
                        <div className="flex items-center gap-2">
                          <PackageCheck className="w-4 h-4 text-[#006B56] shrink-0" />
                          <span className="font-black text-[#006B56] text-xs">
                            📦 Relief Goods Staged at Hub Store
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-900 leading-snug">
                          Verified by Supervisor <strong>{task.hub_verified_by || task.assigned_supervisor_name || 'Supervisor'}</strong> on {task.goods_arrived_at ? new Date(task.goods_arrived_at).toLocaleDateString('en-GB') : 'Recent'}. Commodities are ready for collection at the hub store.
                        </p>
                        {onCollectGoods && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCollectGoods(task);
                            }}
                            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-[#006B56] hover:from-emerald-700 hover:to-[#005544] text-white text-xs font-black rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
                          >
                            <Package className="w-4 h-4" />
                            <span>Collect from Hub Store (Acknowledge Receipt)</span>
                          </button>
                        )}
                      </div>
                    )}


                    {/* Assistance Request Category & Notes */}
                    <div className="bg-white rounded-xl p-2.5 border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Requested Assistance:</span>
                        <span className="font-bold text-slate-800">{task.category || 'Food & Non-Food Relief'}</span>
                      </div>
                      {!isRejected && task.review_notes && (
                        <p className="text-[11px] text-slate-600 italic">
                          "{task.review_notes}"
                        </p>
                      )}
                    </div>

                    {/* Footer with Actions */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Due: {task.due_date || '48h Window'}
                        </span>
                        <span>•</span>
                        <span>Sup: {task.assigned_supervisor_name || task.supervisor_name || 'Assigned Supervisor'}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isRejected && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartAssessment(task);
                            }}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Re-Audit Household</span>
                          </button>
                        )}

                        {(isCollected || isArrivedAtHub) && (onDistribute || onOpenScanner) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onDistribute) onDistribute(task);
                              else if (onOpenScanner) onOpenScanner(task);
                            }}
                            className="px-3 py-1.5 bg-[#006B56] hover:bg-[#005a48] text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Distribute</span>
                          </button>
                        )}

                        {isPending && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartAssessment(task);
                            }}
                            className="px-3 py-1.5 bg-[#006B56] hover:bg-[#005a48] text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Start Audit</span>
                          </button>
                        )}

                        {isSubmitted && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartAssessment(task);
                            }}
                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-purple-600" />
                            <span>Audit Dossier</span>
                          </button>
                        )}

                        {isCompleted && (
                          <span
                            className="px-3 py-1.5 bg-emerald-50 text-[#006B56] border border-emerald-300 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>✓ Delivered & Confirmed</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTask(task);
                          }}
                          className="px-2.5 py-1.5 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>Full Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
