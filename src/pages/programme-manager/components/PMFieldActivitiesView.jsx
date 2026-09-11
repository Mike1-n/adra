import React, { useState, useMemo } from 'react';
import {
  Activity,
  Search,
  Filter,
  MapPin,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  Layers,
  List,
  Map as MapIcon,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

export function PMFieldActivitiesView({
  activities = [],
  requests = [],
  programmes = []
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterProgramme, setFilterProgramme] = useState('ALL');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [selectedActivity, setSelectedActivity] = useState(null);

  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesId = (a.id || '').toLowerCase().includes(q);
        const matchesReq = (a.request_id || '').toLowerCase().includes(q);
        const matchesWorker = (a.field_worker || '').toLowerCase().includes(q);
        const matchesSup = (a.supervisor || '').toLowerCase().includes(q);
        const matchesLoc = (a.location || '').toLowerCase().includes(q);
        if (!matchesId && !matchesReq && !matchesWorker && !matchesSup && !matchesLoc) return false;
      }
      if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;
      if (filterProgramme !== 'ALL' && a.program_name !== filterProgramme) return false;
      return true;
    });
  }, [activities, searchTerm, filterStatus, filterProgramme]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#006B56]" />
            Field Activities & Implementation Monitoring
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Track operational field execution, supervisor task delegation, field worker verification visits, and distribution timelines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-[#006B56] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'map'
                  ? 'bg-white text-[#006B56] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              Geographic Map
            </button>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Activity ID, Request ID, Worker or Location..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006B56] outline-none"
          />
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006B56] outline-none bg-white text-slate-700"
          >
            <option value="ALL">All Activity Statuses</option>
            <option value="Pending Assignment">Pending Assignment</option>
            <option value="Assigned">Assigned</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
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

      {/* VIEW MODE: MAP OR LIST */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Activity ID</th>
                  <th className="py-3.5 px-4">Request ID</th>
                  <th className="py-3.5 px-4">Programme</th>
                  <th className="py-3.5 px-4">Activity Type</th>
                  <th className="py-3.5 px-4">Supervisor</th>
                  <th className="py-3.5 px-4">Field Worker</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Scheduled</th>
                  <th className="py-3.5 px-4">Completion</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-12 text-center text-slate-500">
                      <Activity className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-medium text-slate-700">No field activities recorded</p>
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-xs text-[#006B56]">
                        {act.id}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">
                        {act.request_id}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-800">
                        {act.program_name || 'Emergency Relief'}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-700">
                        {act.activity_type || 'Beneficiary Verification'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700">
                        <div className="flex items-center gap-1 font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                          {act.supervisor || 'Emmanuel Adeyemi'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {act.field_worker ? (
                          <span>{act.field_worker}</span>
                        ) : (
                          <span className="text-slate-400 italic">Pending Allocation</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {act.location || 'Kapoeta South'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {act.scheduled_date ? formatDate(act.scheduled_date) : 'TBD'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {act.completion_date ? formatDate(act.completion_date) : 'Pending'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          act.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          act.status === 'In Progress' ? 'bg-indigo-100 text-indigo-800' :
                          act.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                          act.status === 'Assigned' ? 'bg-teal-100 text-teal-800' :
                          act.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {act.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Interactive Map Visualization Container */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-[#006B56]" />
              Geographic Deployment Map (South Sudan Operational Areas)
            </h3>
            <span className="text-xs text-slate-500">Live Field GPS Clustered Locations</span>
          </div>

          <div className="relative w-full h-96 bg-slate-900 rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center p-4">
            {/* Background Map Graphic Mock */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#006B56_1px,transparent_1px)] [background-size:16px_16px]" />
            
            {/* Stylized State Clusters */}
            <div className="absolute top-12 left-20 bg-emerald-950/80 border border-emerald-500/50 p-3 rounded-xl text-xs text-white shadow-lg backdrop-blur-xs">
              <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Central Equatoria (Juba / Kator)
              </div>
              <p className="text-[11px] text-slate-300 mt-1">Activities: <strong>3 Active</strong></p>
              <p className="text-[10px] text-slate-400">Supervisor: Emmanuel Adeyemi</p>
            </div>

            <div className="absolute bottom-16 right-28 bg-emerald-950/80 border border-emerald-500/50 p-3 rounded-xl text-xs text-white shadow-lg backdrop-blur-xs">
              <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Eastern Equatoria (Kapoeta South)
              </div>
              <p className="text-[11px] text-slate-300 mt-1">Activities: <strong>5 Active</strong></p>
              <p className="text-[10px] text-slate-400">Supervisor: David Deng</p>
            </div>

            <div className="absolute top-20 right-36 bg-emerald-950/80 border border-emerald-500/50 p-3 rounded-xl text-xs text-white shadow-lg backdrop-blur-xs">
              <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Jonglei (Bor South)
              </div>
              <p className="text-[11px] text-slate-300 mt-1">Activities: <strong>2 Active</strong></p>
              <p className="text-[10px] text-slate-400">Supervisor: Mary Akech</p>
            </div>

            <div className="text-center z-10 bg-slate-800/90 p-4 rounded-xl border border-slate-600 max-w-sm">
              <Activity className="w-8 h-8 text-emerald-400 mx-auto mb-2 animate-pulse" />
              <h4 className="text-sm font-bold text-white">Active Field Response Grid</h4>
              <p className="text-xs text-slate-300 mt-1">
                Showing {filteredActivities.length} real-time verified activity dispatches across Eastern Equatoria, Jonglei, and Central Equatoria.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
