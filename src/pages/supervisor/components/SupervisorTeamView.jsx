import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  MapPin,
  Layers,
  Phone,
  CheckCircle2,
  Clock,
  Briefcase,
  ChevronRight,
  UserPlus,
  AlertCircle
} from 'lucide-react';

export function SupervisorTeamView({
  fieldWorkers = [],
  onSelectWorker
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [programFilter, setProgramFilter] = useState('ALL');
  const [workloadFilter, setWorkloadFilter] = useState('ALL');

  // Filter workers
  const filteredWorkers = useMemo(() => {
    return fieldWorkers.filter(worker => {
      // Status filter
      if (statusFilter !== 'ALL' && worker.current_status !== statusFilter) {
        return false;
      }

      // Program filter
      if (programFilter !== 'ALL') {
        const prog = (worker.programme || '').toLowerCase();
        if (!prog.includes(programFilter.toLowerCase())) return false;
      }

      // Workload filter
      if (workloadFilter === 'LOW' && (worker.active_assignments || 0) > 1) return false;
      if (workloadFilter === 'HIGH' && (worker.active_assignments || 0) < 2) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (worker.name || '').toLowerCase();
        const area = (worker.assigned_area || worker.county || '').toLowerCase();
        const email = (worker.email || '').toLowerCase();
        const phone = (worker.phone || '').toLowerCase();
        if (!name.includes(q) && !area.includes(q) && !email.includes(q) && !phone.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [fieldWorkers, statusFilter, programFilter, workloadFilter, searchQuery]);

  // Counts by status
  const statusCounts = useMemo(() => {
    const counts = { Available: 0, 'On Assignment': 0, Busy: 0, Offline: 0 };
    fieldWorkers.forEach(w => {
      if (counts[w.current_status] !== undefined) counts[w.current_status]++;
    });
    return counts;
  }, [fieldWorkers]);

  const statusBadge = {
    'Available': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'On Assignment': 'bg-blue-100 text-blue-800 border-blue-300',
    'Busy': 'bg-amber-100 text-amber-800 border-amber-300',
    'Offline': 'bg-slate-100 text-slate-600 border-slate-300'
  };

  return (
    <div className="space-y-3 pb-24">
      
      {/* Title & Status Metric Summary */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Field Worker Team</h2>
            <p className="text-xs text-slate-500">Supervise officers, monitor field workload & performance</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-[#006B56]/10 text-[#006B56] rounded-xl border border-[#006B56]/20">
            {fieldWorkers.length} Field Officers
          </span>
        </div>

        {/* Compact Status Counts */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          <div
            onClick={() => setStatusFilter(statusFilter === 'Available' ? 'ALL' : 'Available')}
            className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
              statusFilter === 'Available' ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400/20' : 'border-slate-200 bg-slate-50/50'
            }`}
          >
            <span className="text-[10px] font-bold text-emerald-700 block uppercase">Available</span>
            <span className="text-sm font-black text-emerald-800">{statusCounts.Available}</span>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'On Assignment' ? 'ALL' : 'On Assignment')}
            className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
              statusFilter === 'On Assignment' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-400/20' : 'border-slate-200 bg-slate-50/50'
            }`}
          >
            <span className="text-[10px] font-bold text-blue-700 block uppercase">Assigned</span>
            <span className="text-sm font-black text-blue-800">{statusCounts['On Assignment']}</span>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'Busy' ? 'ALL' : 'Busy')}
            className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
              statusFilter === 'Busy' ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400/20' : 'border-slate-200 bg-slate-50/50'
            }`}
          >
            <span className="text-[10px] font-bold text-amber-700 block uppercase">Busy</span>
            <span className="text-sm font-black text-amber-800">{statusCounts.Busy}</span>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'Offline' ? 'ALL' : 'Offline')}
            className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
              statusFilter === 'Offline' ? 'border-slate-400 bg-slate-100 ring-2 ring-slate-400/20' : 'border-slate-200 bg-slate-50/50'
            }`}
          >
            <span className="text-[10px] font-bold text-slate-500 block uppercase">Offline</span>
            <span className="text-sm font-black text-slate-700">{statusCounts.Offline}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3 rounded-2xl shadow-xs border border-slate-200/80 space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search field worker by name, area, phone..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B56]"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="p-2 border border-slate-300 rounded-xl bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#006B56]"
          >
            <option value="ALL">All Programmes</option>
            <option value="Food Security">Food Security</option>
            <option value="WASH">WASH & Clean Water</option>
            <option value="Health">Health & Nutrition</option>
            <option value="Shelter">Disaster Recovery</option>
          </select>

          <select
            value={workloadFilter}
            onChange={(e) => setWorkloadFilter(e.target.value)}
            className="p-2 border border-slate-300 rounded-xl bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#006B56]"
          >
            <option value="ALL">All Workloads</option>
            <option value="LOW">Low Workload (0-1 tasks)</option>
            <option value="HIGH">High Workload (2+ tasks)</option>
          </select>
        </div>
      </div>

      {/* Field Worker Cards */}
      <div className="space-y-3">
        {filteredWorkers.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Field Workers Found</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          filteredWorkers.map((worker) => (
            <div
              key={worker.id}
              onClick={() => onSelectWorker(worker)}
              className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={worker.avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150'}
                    alt={worker.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-2xs"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{worker.name}</h3>
                    <p className="text-[11px] font-bold text-[#006B56]">Role: Field Worker</p>
                    <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{worker.assigned_area || worker.county || 'Kapoeta South'}</span>
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge[worker.current_status] || 'bg-slate-100 text-slate-700'}`}>
                  {worker.current_status}
                </span>
              </div>

              {/* Programme & Workload Stats */}
              <div className="p-2.5 bg-slate-50 rounded-xl grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Tasks</span>
                  <span className="font-bold text-slate-800">{worker.active_assignments || 0} Assignments</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Completed</span>
                  <span className="font-bold text-slate-800">{worker.completed_assignments || 0} Assessments</span>
                </div>
              </div>

              {/* Last Activity & Arrow Footer */}
              <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                <span className="text-[11px] text-slate-400 truncate max-w-[240px]">
                  {worker.last_activity || 'Active recently'}
                </span>

                <div className="flex items-center space-x-1 text-[#006B56] font-bold text-xs">
                  <span>View Details</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
