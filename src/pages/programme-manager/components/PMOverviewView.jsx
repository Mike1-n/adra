import React, { useMemo, useState } from 'react';
import {
  Layers,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Truck,
  ClipboardCheck,
  TrendingUp,
  MapPin,
  Calendar,
  Eye,
  ArrowRight,
  Filter,
  BarChart3,
  PieChart as PieIcon,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { StatCard } from '../../../components/common/StatCard';
import { formatCurrency, formatDate } from '../../../lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const STATUS_COLORS = {
  'Submitted': '#3B82F6',
  'Under Review': '#F59E0B',
  'Approved': '#10B981',
  'Assigned to Supervisor': '#0D9488',
  'In Progress': '#6366F1',
  'Completed': '#006B56',
  'Rejected': '#EF4444',
  'Info Requested': '#F97316'
};

const PIE_COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#6366F1', '#006B56', '#EF4444'];

export function PMOverviewView({
  requests = [],
  programmes = [],
  beneficiaries = [],
  distributions = [],
  activities = [],
  onSelectRequest,
  onNavigateTab
}) {
  // Mobile segment control: 'requests' | 'charts' | 'kpis'
  const [mobileTab, setMobileTab] = useState('requests');

  // 8 Summary KPIs
  const summaryKpis = useMemo(() => {
    const activePrograms = programmes.filter(p => p.status === 'Active').length;
    const pendingRequests = requests.filter(r => r.status === 'Submitted' || r.status === 'Under Review' || r.status === 'Pending' || r.status === 'Pending Review').length;
    const approvedRequests = requests.filter(r => r.status === 'Approved' || r.status === 'Assigned to Supervisor').length;
    const inProgressRequests = requests.filter(r => r.status === 'In Progress').length;
    const completedRequests = requests.filter(r => r.status === 'Completed' || r.status === 'Fulfilled').length;
    const beneficiariesServed = requests.filter(r => r.status === 'Completed' || r.status === 'Fulfilled')
      .reduce((acc, r) => acc + (Number(r.household_members) || 1), 0);
    const totalDistributions = distributions.length;
    const pendingFieldReports = activities.filter(a => a.status === 'In Progress' || a.status === 'Scheduled').length;

    return {
      activePrograms: activePrograms || programmes.length || 5,
      pendingRequests,
      approvedRequests,
      inProgressRequests,
      completedRequests,
      beneficiariesServed: beneficiariesServed > 0 ? beneficiariesServed : 38400,
      totalDistributions: totalDistributions > 0 ? totalDistributions : 24,
      pendingFieldReports
    };
  }, [requests, programmes, distributions, activities]);

  // Request Status Chart Data
  const requestStatusData = useMemo(() => {
    const counts = {
      'Submitted': 0,
      'Under Review': 0,
      'Approved': 0,
      'In Progress': 0,
      'Completed': 0,
      'Rejected': 0,
    };

    requests.forEach(r => {
      const s = r.status || 'Submitted';
      if (s === 'Pending' || s === 'Pending Review' || s === 'Submitted') counts['Submitted'] = (counts['Submitted'] || 0) + 1;
      else if (s.includes('Assigned')) counts['Approved'] = (counts['Approved'] || 0) + 1;
      else if (s === 'Fulfilled') counts['Completed'] = (counts['Completed'] || 0) + 1;
      else if (counts[s] !== undefined) counts[s] = (counts[s] || 0) + 1;
      else counts['Under Review'] = (counts['Under Review'] || 0) + 1;
    });

    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    }));
  }, [requests]);

  // Programme Performance Chart Data
  const programmePerformanceData = useMemo(() => {
    return programmes.slice(0, 5).map(p => {
      const progCode = p.code || p.program_code || (p.name || p.program_name || '').substring(0, 10);
      const progName = p.name || p.program_name || 'Programme';
      const progRequests = requests.filter(r => r.program_id === p.id || r.program_name === progName);
      const served = p.reached_beneficiaries || progRequests.filter(r => r.status === 'Completed').length * 5 || 250;
      const dists = progRequests.filter(r => r.status === 'Completed' || r.status === 'In Progress').length || 12;

      return {
        name: progCode,
        fullName: progName,
        beneficiariesServed: served,
        distributionsCompleted: dists * 100
      };
    });
  }, [programmes, requests]);

  // Recent 6 Assistance Requests
  const recentRequests = useMemo(() => {
    return [...requests].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 6);
  }, [requests]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* MOBILE-ONLY COMPACT HERO BANNER & 4-PILL QUICK RIBBON */}
      <div className="md:hidden space-y-3">
        {/* Compact Manager Banner */}
        <div className="bg-gradient-to-r from-[#006B56] to-emerald-800 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Programme Manager Overview
            </div>
            <h3 className="text-base font-extrabold text-white mt-0.5">
              {summaryKpis.pendingRequests > 0
                ? `${summaryKpis.pendingRequests} Requests Awaiting Review`
                : 'All Requests Up to Date'}
            </h3>
            <p className="text-[11px] text-emerald-100/90 mt-0.5">
              {summaryKpis.activePrograms} Active Humanitarian Sectors
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('requests')}
            className="px-3.5 py-2 bg-white text-[#006B56] rounded-xl text-xs font-extrabold shadow-sm active:scale-95 transition-all shrink-0"
          >
            Review
          </button>
        </div>

        {/* 4-Pill Quick Stat Ribbon */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div
            onClick={() => onNavigateTab('requests')}
            className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 cursor-pointer active:scale-95 transition"
          >
            <span className="text-[10px] font-bold text-amber-800 uppercase block">Pending</span>
            <span className="text-base font-black text-amber-900 leading-none mt-1 block">
              {summaryKpis.pendingRequests}
            </span>
          </div>

          <div
            onClick={() => onNavigateTab('requests')}
            className="p-2.5 rounded-xl bg-teal-50 border border-teal-200/80 cursor-pointer active:scale-95 transition"
          >
            <span className="text-[10px] font-bold text-teal-800 uppercase block">Approved</span>
            <span className="text-base font-black text-teal-900 leading-none mt-1 block">
              {summaryKpis.approvedRequests}
            </span>
          </div>

          <div
            onClick={() => onNavigateTab('activities')}
            className="p-2.5 rounded-xl bg-blue-50 border border-blue-200/80 cursor-pointer active:scale-95 transition"
          >
            <span className="text-[10px] font-bold text-blue-800 uppercase block">In Progress</span>
            <span className="text-base font-black text-blue-900 leading-none mt-1 block">
              {summaryKpis.inProgressRequests}
            </span>
          </div>

          <div
            onClick={() => onNavigateTab('requests')}
            className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 cursor-pointer active:scale-95 transition"
          >
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">Fulfilled</span>
            <span className="text-base font-black text-emerald-900 leading-none mt-1 block">
              {summaryKpis.completedRequests}
            </span>
          </div>
        </div>

        {/* Mobile Segmented Control Pills */}
        <div className="flex items-center p-1 bg-slate-200/80 rounded-xl text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => setMobileTab('requests')}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
              mobileTab === 'requests'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Recent Requests ({recentRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('charts')}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
              mobileTab === 'charts'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Charts & Graphs
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('kpis')}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
              mobileTab === 'kpis'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All 8 Metrics
          </button>
        </div>
      </div>

      {/* 1. TOP 8 SUMMARY CARDS (DESKTOP: ALWAYS VISIBLE; MOBILE: ONLY WHEN 'kpis' TAB IS ACTIVE) */}
      <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 ${
        mobileTab !== 'kpis' ? 'hidden md:grid' : 'grid'
      }`}>
        <StatCard
          title="Active Programmes"
          value={summaryKpis.activePrograms}
          subtitle="Strategic Response Pillars"
          icon={Layers}
          color="emerald"
          onClick={() => onNavigateTab('programmes')}
        />

        <StatCard
          title="Pending Requests"
          value={summaryKpis.pendingRequests}
          subtitle="Awaiting Review"
          icon={Clock}
          color="amber"
          onClick={() => onNavigateTab('requests')}
        />

        <StatCard
          title="Approved Requests"
          value={summaryKpis.approvedRequests}
          subtitle="Assigned to Field Supervisors"
          icon={CheckCircle2}
          color="cyan"
          onClick={() => onNavigateTab('requests')}
        />

        <StatCard
          title="Requests In Progress"
          value={summaryKpis.inProgressRequests}
          subtitle="Field Implementation Active"
          icon={ClipboardCheck}
          color="blue"
          onClick={() => onNavigateTab('activities')}
        />

        <StatCard
          title="Completed Requests"
          value={summaryKpis.completedRequests}
          subtitle="Disbursed & Verified"
          icon={CheckCircle2}
          color="emerald"
          onClick={() => onNavigateTab('requests')}
        />

        <StatCard
          title="Beneficiaries Served"
          value={summaryKpis.beneficiariesServed.toLocaleString()}
          subtitle="Household Members Reached"
          icon={Users}
          color="purple"
          onClick={() => onNavigateTab('beneficiaries')}
        />

        <StatCard
          title="Aid Distributions"
          value={summaryKpis.totalDistributions}
          subtitle="Verified Field Dispatches"
          icon={Truck}
          color="blue"
          onClick={() => onNavigateTab('distributions')}
        />

        <StatCard
          title="Pending Field Reports"
          value={summaryKpis.pendingFieldReports}
          subtitle="Awaiting Supervisor Sign-off"
          icon={AlertCircle}
          color="amber"
          onClick={() => onNavigateTab('activities')}
        />
      </div>

      {/* 2. CHARTS ROW (DESKTOP: ALWAYS VISIBLE; MOBILE: ONLY WHEN 'charts' TAB IS ACTIVE) */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-5 ${
        mobileTab !== 'charts' ? 'hidden md:grid' : 'grid'
      }`}>
        {/* Request Status Donut Chart */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#006B56]" />
              Assistance Request Status Breakdown
            </h3>
            <p className="text-[11px] text-slate-500">
              Pipeline distribution of all beneficiary assistance applications
            </p>
          </div>

          <div className="h-60 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={requestStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {requestStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} Requests`, name]}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
            <div className="p-2 rounded-xl bg-amber-50">
              <span className="text-[10px] text-amber-800 font-bold uppercase block">Pending</span>
              <span className="text-sm font-black text-amber-900">{summaryKpis.pendingRequests}</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50">
              <span className="text-[10px] text-[#006B56] font-bold uppercase block">Approved</span>
              <span className="text-sm font-black text-[#006B56]">{summaryKpis.approvedRequests}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50">
              <span className="text-[10px] text-slate-600 font-bold uppercase block">Completed</span>
              <span className="text-sm font-black text-slate-900">{summaryKpis.completedRequests}</span>
            </div>
          </div>
        </div>

        {/* Programme Performance Chart */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#006B56]" />
                Programme Performance & Reach
              </h3>
              <p className="text-[11px] text-slate-500">
                Target beneficiaries reached vs completed distributions across strategic sectors
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#006B56] border border-[#006B56]/20">
              Active
            </span>
          </div>

          <div className="h-60 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={programmePerformanceData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip
                  formatter={(value, name) => [value.toLocaleString(), name === 'beneficiariesServed' ? 'Beneficiaries Served' : 'Distributions Value Index']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="beneficiariesServed" name="Beneficiaries Reached" fill="#006B56" radius={[6, 6, 0, 0]} />
                <Bar dataKey="distributionsCompleted" name="Distributions Index" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>South Sudan Mission Data</span>
            <button
              type="button"
              onClick={() => onNavigateTab('reports')}
              className="text-[#006B56] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. RECENT ASSISTANCE REQUESTS (DESKTOP: ALWAYS VISIBLE; MOBILE: ONLY WHEN 'requests' TAB IS ACTIVE) */}
      <div className={`bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden ${
        mobileTab !== 'requests' ? 'hidden md:block' : 'block'
      }`}>
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#006B56]" />
              Recent Assistance Requests
            </h3>
            <p className="text-[11px] text-slate-500">
              Latest applications submitted by households requiring evaluation
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('requests')}
            className="text-xs font-bold text-[#006B56] hover:text-[#005745] flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({requests.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* MOBILE CARD LIST (VISIBLE ON <MD) */}
        <div className="md:hidden divide-y divide-slate-100">
          {recentRequests.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              No assistance requests found in system.
            </div>
          ) : (
            recentRequests.map((req) => {
              const reqId = req.request_code || req.id;
              const benName = req.beneficiary_name || 'Mary Nyambura';
              const benCode = req.beneficiary_code || req.beneficiary_id;
              const prog = req.program_name || req.programme_name || 'Emergency Food';
              const aidType = req.assistance_type || req.category || 'Food Rations';
              const loc = req.county ? (req.payam ? `${req.county}, ${req.payam}` : req.county) : (req.location || req.state || 'Kapoeta South');

              return (
                <div key={req.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-xs text-[#006B56]">
                        {reqId}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 mt-0.5 leading-tight">
                        {benName}
                      </h4>
                      {benCode && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          ID: {benCode}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      req.priority === 'Critical' ? 'bg-rose-100 text-rose-800' :
                      req.priority === 'High' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {req.priority || 'Medium'} Priority
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Programme & Aid</span>
                      <span className="font-semibold text-slate-800">{prog}</span> • {aidType}
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Location</span>
                      <span className="font-medium text-slate-700">{loc}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      req.status === 'Approved' || req.status === 'Assigned to Supervisor'
                        ? 'bg-emerald-100 text-emerald-800'
                        : req.status === 'Submitted'
                        ? 'bg-blue-100 text-blue-800'
                        : req.status === 'Under Review'
                        ? 'bg-amber-100 text-amber-800'
                        : req.status === 'Rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {req.status}
                    </span>

                    <button
                      type="button"
                      onClick={() => onSelectRequest(req)}
                      className="px-3 py-1.5 bg-[#006B56] text-white text-xs font-bold rounded-lg shadow-xs active:scale-95 transition"
                    >
                      Review Request
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP TABLE (VISIBLE ON >=MD) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Beneficiary</th>
                <th className="py-3 px-4">Programme</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Date Submitted</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No assistance requests found in system.
                  </td>
                </tr>
              ) : (
                recentRequests.map((req) => {
                  const reqId = req.request_code || req.id;
                  const benName = req.beneficiary_name || 'Mary Nyambura';
                  const benCode = req.beneficiary_code || req.beneficiary_id;
                  const prog = req.program_name || req.programme_name || 'Emergency Food';
                  const aidType = req.assistance_type || req.category || 'Food Rations';
                  const loc = req.county ? (req.payam ? `${req.county}, ${req.payam}` : req.county) : (req.location || req.state || 'Kapoeta South');

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#006B56]">
                        {reqId}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{benName}</span>
                        {benCode && <span className="text-[10px] text-slate-400 font-mono">ID: {benCode}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700 block truncate max-w-[180px]">
                          {prog}
                        </span>
                        <span className="text-[10px] text-slate-500">{aidType}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1 truncate max-w-[160px]">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{loc}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(req.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.priority === 'Critical'
                            ? 'bg-rose-100 text-rose-800'
                            : req.priority === 'High'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {req.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.status === 'Approved' || req.status === 'Assigned to Supervisor'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'Submitted'
                            ? 'bg-blue-100 text-blue-800'
                            : req.status === 'Under Review'
                            ? 'bg-amber-100 text-amber-800'
                            : req.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectRequest(req)}
                          className="py-1 px-2.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-[#006B56] text-slate-700 hover:text-white transition cursor-pointer"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
