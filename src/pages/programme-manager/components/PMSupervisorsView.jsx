import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Search,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Phone,
  Layers,
  Activity,
  Briefcase,
  Users,
  X
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
        const matchesArea = (s.assigned_area || s.location || s.state || '').toLowerCase().includes(q);
        if (!matchesName && !matchesArea) return false;
      }
      if (filterProgramme !== 'ALL' && s.program_name !== filterProgramme) return false;
      return true;
    });
  }, [supervisors, searchTerm, filterProgramme]);

  return (
    <div className="space-y-3.5">
      {/* Search & Programme Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search field supervisor name, area..."
            className="w-full pl-9 pr-8 py-2.5 text-xs bg-white border border-slate-200/90 rounded-2xl focus:ring-2 focus:ring-[#006B56] outline-none shadow-xs font-semibold"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <select
          value={filterProgramme}
          onChange={(e) => setFilterProgramme(e.target.value)}
          className="px-3 py-2.5 text-xs border border-slate-200/90 rounded-2xl bg-white font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#006B56] shadow-xs"
        >
          <option value="ALL">All Sectors</option>
          {programmes.map(p => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Supervisors Mobile List */}
      <div className="space-y-2.5">
        {filteredSupervisors.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-3xl border border-slate-200/90 p-6 text-slate-400">
            <UserCheck className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
            <p className="font-bold text-xs text-slate-600">No field supervisors match search</p>
          </div>
        ) : (
          filteredSupervisors.map(sup => {
            const workload = sup.current_workload_pct || 40;
            const isHighWorkload = workload > 70;

            return (
              <div
                key={sup.id}
                className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#006B56] text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                      {(sup.name || 'David Deng').split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-sm text-slate-900 truncate">
                        {sup.name}
                      </h4>
                      <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{sup.assigned_area || sup.location || 'Kapoeta South, Eastern Equatoria'}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                    isHighWorkload
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                  }`}>
                    {isHighWorkload ? 'Busy' : 'Available'}
                  </span>
                </div>

                {/* Workload Indicator */}
                <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-semibold">Active Humanitarian Tasks:</span>
                    <span className="font-black text-slate-900">{sup.active_tasks || 3} Tasks Assigned</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/80">
                    <span className="text-slate-500 font-semibold">Phone Contact:</span>
                    <a
                      href={`tel:${sup.phone || '+211-920-000003'}`}
                      className="font-bold text-[#006B56] hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{sup.phone || '+211 92 000 0003'}</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default PMSupervisorsView;
