import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Search,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Lock,
  Layers,
  Activity,
  Briefcase,
  Users
} from 'lucide-react';

export function PMSupervisorsView({
  supervisors = [],
  programmes = []
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgramme, setFilterProgramme] = useState('ALL');

  const filteredSupervisors = useMemo(() => {
    return supervisors.filter(s => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = (s.name || '').toLowerCase().includes(q);
        const matchesArea = (s.assigned_area || '').toLowerCase().includes(q);
        if (!matchesName && !matchesArea) return false;
      }
      if (filterProgramme !== 'ALL' && s.program_name !== filterProgramme) return false;
      return true;
    });
  }, [supervisors, searchTerm, filterProgramme]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[#006B56]" />
            Field Supervisors Monitoring & Workload
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Monitor supervisory coverage across South Sudan counties, active implementation tasks, workload bandwidth, and field report turnaround.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            Account Management Restricted (Admin Only)
          </div>
          <span className="text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <strong>{filteredSupervisors.length}</strong> Deployed Supervisors
          </span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Supervisor Name or Assigned Area..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006B56] outline-none"
          />
        </div>

        <div>
          <select
            value={filterProgramme}
            onChange={(e) => setFilterProgramme(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006B56] outline-none bg-white text-slate-700"
          >
            <option value="ALL">All Programmes</option>
            {programmes.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Supervisors Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredSupervisors.map(sup => {
          const workload = sup.current_workload_pct || 45;
          const isHighWorkload = workload > 75;

          return (
            <div
              key={sup.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-[#006B56]/50 shadow-sm p-5 space-y-4 transition-all"
            >
              {/* Top Row: Name, Status, Area */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{sup.name}</h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {sup.status || 'Active'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-[#006B56]" />
                    {sup.program_name}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Assigned Area: <strong className="text-slate-800">{sup.assigned_area}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    isHighWorkload ? 'bg-rose-100 text-rose-800' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    {workload}% Capacity
                  </span>
                </div>
              </div>

              {/* Workload Progress Bar */}
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Task Allocation Workload:</span>
                  <span className="font-semibold text-slate-700">{sup.active_tasks || 3} Concurrent Tasks</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      workload > 80 ? 'bg-rose-500' : workload > 60 ? 'bg-amber-500' : 'bg-[#006B56]'
                    }`}
                    style={{ width: `${workload}%` }}
                  />
                </div>
              </div>

              {/* Performance Metrics Grid */}
              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Tasks</span>
                  <span className="text-sm font-bold text-slate-800">{sup.active_tasks || 3}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Completed</span>
                  <span className="text-sm font-bold text-emerald-700">{sup.completed_tasks || 28}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Pending Rpts</span>
                  <span className="text-sm font-bold text-amber-600">{sup.pending_reports || 2}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Approved</span>
                  <span className="text-sm font-bold text-teal-700">{sup.approved_reports || 26}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
