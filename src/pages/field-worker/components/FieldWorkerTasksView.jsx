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
  X,
  DollarSign
} from 'lucide-react';

export function FieldWorkerTasksView({
  tasks = [],
  statusFilter: externalStatusFilter,
  onStatusFilterChange,
  onStartAssessment,
  onSelectTask,
  onOpenScanner,
  onRequestFacilitation
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [internalStatusFilter, setInternalStatusFilter] = useState('all'); // 'all' | 'pending' | 'in_progress' | 'submitted' | 'completed'
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  const statusFilter = externalStatusFilter !== undefined ? externalStatusFilter : internalStatusFilter;
  const setStatusFilter = (val) => {
    if (onStatusFilterChange) onStatusFilterChange(val);
    setInternalStatusFilter(val);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || (
        (task.beneficiary_name && task.beneficiary_name.toLowerCase().includes(q)) ||
        (task.request_code && task.request_code.toLowerCase().includes(q)) ||
        (task.beneficiary_code && task.beneficiary_code.toLowerCase().includes(q)) ||
        (task.payam && task.payam.toLowerCase().includes(q)) ||
        (task.category && task.category.toLowerCase().includes(q))
      );

      let matchStatus = true;
      if (statusFilter === 'pending') {
        matchStatus = task.status === 'Assigned to Field Worker' || task.status === 'Submitted' || task.status === 'Correction Required';
      } else if (statusFilter === 'in_progress') {
        matchStatus = task.status === 'Assessment In Progress';
      } else if (statusFilter === 'submitted') {
        matchStatus = task.status === 'Assessment Submitted' || task.status === 'Awaiting Program Manager Decision';
      } else if (statusFilter === 'completed') {
        matchStatus = task.status === 'Completed' || task.status === 'Distributed' || task.status === 'Approved';
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
    t.status === 'Assigned to Field Worker' || 
    t.status === 'Submitted' || 
    t.status === 'Assessment In Progress' || 
    t.status === 'Correction Required'
  ).length;

  const submittedCount = tasks.filter(t => 
    t.status === 'Assessment Submitted' || 
    t.status === 'Awaiting Program Manager Decision'
  ).length;

  const completedCount = tasks.filter(t => 
    t.status === 'Completed' || 
    t.status === 'Distributed' || 
    t.status === 'Approved'
  ).length;

  return (
    <div className="space-y-3.5 pb-12 animate-in fade-in duration-200">
      
      {/* 1. FLAT TAB BAR: All Tasks, Pending Audit, Submitted, Delivered (No Card Wrapper) */}
      <div className="flex items-center space-x-1 border-b border-slate-200 px-1 overflow-x-auto no-scrollbar">
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

        <button
          type="button"
          onClick={() => setStatusFilter('submitted')}
          className={`pb-2 px-2 text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
            statusFilter === 'submitted'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Submitted</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            statusFilter === 'submitted' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'
          }`}>
            {submittedCount}
          </span>
        </button>

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
            const isPending = task.status === 'Assigned to Field Worker' || task.status === 'Submitted' || task.status === 'Correction Required';
            const isSubmitted = task.status === 'Assessment Submitted' || task.status === 'Awaiting Program Manager Decision';
            const isCompleted = task.status === 'Completed' || task.status === 'Distributed' || task.status === 'Approved';
            const isExpanded = expandedTaskId === taskId;

            return (
              <div
                key={taskId}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition"
              >
                {/* Collapsible Header */}
                <div 
                  onClick={() => toggleTaskExpand(taskId)}
                  className="p-3.5 space-y-2 cursor-pointer hover:bg-slate-50/70 transition"
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
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCompleted ? 'bg-emerald-100 text-[#006B56]' :
                        isSubmitted ? 'bg-purple-100 text-purple-800' :
                        task.status === 'Correction Required' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-900'
                      }`}>
                        {task.status}
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
                    {/* Assistance Request Category & Supervisor Notes */}
                    <div className="bg-white rounded-xl p-2.5 border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Requested Assistance:</span>
                        <span className="font-bold text-slate-800">{task.category || 'Food & Non-Food Relief'}</span>
                      </div>
                      {task.review_notes && (
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
                        {onRequestFacilitation && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRequestFacilitation(task);
                            }}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300/80 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1 transition cursor-pointer active:scale-95"
                            title="Request field facilitation cash linked to this assignment"
                          >
                            <DollarSign className="w-3.5 h-3.5 text-amber-700" />
                            <span>Facilitation</span>
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

                        {isCompleted && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenScanner();
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Delivered</span>
                          </button>
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
