import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  FolderKanban,
  Clock,
  ArrowRight,
  Plus,
  Activity,
  ShieldCheck,
  HeartHandshake,
  MessageSquareText,
  FileText,
  BarChart2,
  Table as TableIcon,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Button } from '../../../components/common/Button';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { db } from '../../../lib/supabase';
import { formatCurrency } from '../../../lib/utils';
import { useToast } from '../../../context/ToastContext';

function timeAgo(dateString) {
  if (!dateString) return 'Recently';
  try {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return 'Recently';
  }
}

const VULNERABILITY_COLORS = {
  'Female-headed Household': '#00856A',
  'Extremely Poor Household': '#38bdf8',
  'Persons with Disability': '#818cf8',
  'Internally Displaced Person (IDP)': '#f59e0b',
  'Elderly': '#f43f5e',
  'Youth at Risk': '#a855f7',
  'General Community': '#64748b'
};

function getActionBadgeStyle(action) {
  switch (action?.toUpperCase()) {
    case 'CREATE':
    case 'REGISTER':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'UPDATE':
    case 'EDIT':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'AUTH':
    case 'LOGIN':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'APPROVE':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'DELETE':
    case 'REJECT':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-teal-50 text-teal-700 border-teal-200';
  }
}

export function AdminDashboardView({ onNavigateTab }) {
  const [stats, setStats] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [viewMode, setViewMode] = useState('graph'); // 'graph' | 'table'
  const [benViewMode, setBenViewMode] = useState('graph'); // 'graph' | 'table'
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [adminStats, approvals, logs, projectList, benList] = await Promise.all([
        db.getAdminStats(),
        db.getApprovals('ALL'),
        db.getAuditLogs ? db.getAuditLogs() : Promise.resolve([]),
        db.getProjects ? db.getProjects() : Promise.resolve([]),
        db.getBeneficiaries ? db.getBeneficiaries() : Promise.resolve([])
      ]);
      setStats(adminStats);
      setPendingApprovals((approvals || []).filter(a => a.status === 'Pending'));
      setAuditLogs((logs || []).slice(0, 5));
      setProjects(projectList || []);
      setBeneficiaries(benList || []);
    } catch (err) {
      toast.error('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const fallbackProjects = [
    { id: '1', project_code: 'PRJ-2025-001', shortName: '2025-001', fullName: 'Drought Resilience & Climate-Smart Agriculture', location: 'Turkana & Garissa Counties', status: 'Active', budget: 1450000, spent: 890000 },
    { id: '2', project_code: 'PRJ-2025-002', shortName: '2025-002', fullName: 'Clean Water Access & WASH Infrastructure Expansion', location: 'Marsabit District', status: 'Active', budget: 680000, spent: 310000 },
    { id: '3', project_code: 'PRJ-2025-003', shortName: '2025-003', fullName: 'Youth Vocational Livelihoods & Entrepreneurship', location: 'Nairobi Urban Settlements', status: 'Active', budget: 520000, spent: 270000 },
    { id: '4', project_code: 'PRJ-2024-004', shortName: '2024-004', fullName: 'Emergency Flood Relief & Shelter Rehabilitation', location: 'Tana River Basin', status: 'Completed', budget: 890000, spent: 890000 },
    { id: '5', project_code: 'PRJ-2026-005', shortName: '2026-005', fullName: 'Maternal & Child Nutrition Support Initiative', location: 'Wajir South', status: 'Planned', budget: 750000, spent: 0 }
  ];

  const displayProjects = projects.length > 0 
    ? projects.slice(0, 5).map(p => {
        const rawBudget = Number(p.budget) || 0;
        const rawSpent = Number(p.spent) || Math.round(rawBudget * (p.status === 'Completed' ? 1 : p.status === 'Active' ? 0.61 : 0));
        return {
          id: p.id || p.project_code,
          project_code: p.project_code,
          shortName: p.project_code ? p.project_code.replace('PRJ-', '') : p.project_name?.slice(0, 10),
          fullName: p.project_name,
          location: p.location || 'South Sudan',
          status: p.status || 'Active',
          budget: rawBudget,
          spent: rawSpent
        };
      })
    : fallbackProjects;

  const vulnerabilityData = React.useMemo(() => {
    if (!beneficiaries || beneficiaries.length === 0) {
      return [
        { name: 'General Community', count: 7, percentage: 54, location: 'Juba Central, Malakal, Aweil' },
        { name: 'Female-headed Household', count: 3, percentage: 23, location: 'Juba Central' },
        { name: 'Extremely Poor Household', count: 1, percentage: 8, location: 'Garissa & Turkana' },
        { name: 'Persons with Disability', count: 1, percentage: 8, location: 'Nairobi Urban' },
        { name: 'Elderly', count: 1, percentage: 7, location: 'Moyale Sub-county' }
      ];
    }

    const counts = {};
    const locationsByCat = {};
    beneficiaries.forEach(b => {
      const cat = b.vulnerability_category || 'General Community';
      counts[cat] = (counts[cat] || 0) + 1;
      if (b.location && !locationsByCat[cat]) {
        locationsByCat[cat] = b.location;
      }
    });

    const total = beneficiaries.length;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
      location: locationsByCat[name] || 'South Sudan Operational Zones'
    })).sort((a, b) => b.count - a.count);
  }, [beneficiaries]);

  const kpis = [
    {
      title: 'Beneficiaries',
      value: stats?.totalBeneficiaries?.toLocaleString() || '4',
      subtitle: stats?.pendingBeneficiaries > 0 ? `${stats.pendingBeneficiaries} pending verification` : 'Verified households',
      icon: Users,
      accentBorder: 'border-t-emerald-500',
      iconBg: 'bg-emerald-50 text-[#006B56] border-emerald-200',
      action: () => onNavigateTab('beneficiaries')
    },
    {
      title: 'Active Personnel',
      value: stats?.activeUsers?.toString() || '78',
      subtitle: `Across ${stats?.rolesCount || 9} operational roles`,
      icon: UserCheck,
      accentBorder: 'border-t-sky-500',
      iconBg: 'bg-sky-50 text-sky-700 border-sky-200',
      action: () => onNavigateTab('users')
    },
    {
      title: 'Programmes',
      value: stats?.totalProgrammes?.toString() || '5',
      subtitle: 'Humanitarian grants',
      icon: FolderKanban,
      accentBorder: 'border-t-purple-500',
      iconBg: 'bg-purple-50 text-purple-700 border-purple-200',
      action: () => onNavigateTab('programmes')
    },
    {
      title: 'Pending Approvals',
      value: stats?.pendingApprovals?.toString() || '0',
      subtitle: stats?.pendingApprovals > 0 ? 'Requires attention' : 'Queue cleared',
      icon: Clock,
      accentBorder: stats?.pendingApprovals > 0 ? 'border-t-amber-500' : 'border-t-teal-500',
      iconBg: stats?.pendingApprovals > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-teal-50 text-teal-700 border-teal-200',
      action: () => onNavigateTab('approvals')
    }
  ];

  const shortcuts = [
    {
      id: 'lifecycle',
      title: 'Aid Lifecycle',
      subtitle: '7-phase assistance tracker',
      icon: Activity,
      borderColor: 'border-emerald-200 hover:border-emerald-400',
      iconBg: 'bg-emerald-50 text-[#006B56]'
    },
    {
      id: 'beneficiaries',
      title: 'Beneficiary Roll',
      subtitle: 'Households, census & verification',
      icon: HeartHandshake,
      borderColor: 'border-purple-200 hover:border-purple-400',
      iconBg: 'bg-purple-50 text-purple-700'
    },
    {
      id: 'reports',
      title: 'Reports & Audits',
      subtitle: 'Financial statements & audit trail',
      icon: FileText,
      borderColor: 'border-sky-200 hover:border-sky-400',
      iconBg: 'bg-sky-50 text-sky-700'
    },
    {
      id: 'feedback',
      title: 'Feedback & AAP Desk',
      subtitle: 'Inter-party grievances & reviews',
      icon: MessageSquareText,
      borderColor: 'border-amber-200 hover:border-amber-400',
      iconBg: 'bg-amber-50 text-amber-700'
    }
  ];

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Header: Clean & uncluttered */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00856A]" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">System Overview</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Executive operational metrics and humanitarian field governance
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Systems Active</span>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigateTab('users')}
            icon={Plus}
          >
            New User
          </Button>
        </div>
      </div>

      {/* 2. Primary KPI Cards: Clean, readable, no redundant tags */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={kpi.action}
              className={`bg-white p-5 rounded-xl border border-slate-200 border-t-4 ${kpi.accentBorder} hover:shadow-sm transition-all duration-150 cursor-pointer flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">{kpi.title}</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{kpi.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl border ${kpi.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100 truncate">
                {kpi.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* 3. Operational Hub Subsystems (Clean, compact 1-row cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {shortcuts.map((sc) => {
          const Icon = sc.icon;
          return (
            <div
              key={sc.id}
              onClick={() => onNavigateTab(sc.id)}
              className={`p-3.5 sm:p-4 rounded-xl bg-white border ${sc.borderColor} hover:shadow-xs transition-all duration-150 cursor-pointer flex items-center justify-between group`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-lg ${sc.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-slate-900 text-xs sm:text-sm group-hover:text-[#00856A] transition-colors truncate">
                    {sc.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{sc.subtitle}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#00856A] group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
            </div>
          );
        })}
      </div>

      {/* 4. Lower Section: Beneficiary Demographics & Programme Grants / Budget Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left (6 cols): Beneficiary Demographics & Vulnerability Census */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100 bg-slate-50/40 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00856A]" />
              <h3 className="text-sm font-bold text-slate-900">Beneficiary Demographics & Vulnerability</h3>
            </div>

            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setBenViewMode('graph')}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                  benViewMode === 'graph'
                    ? 'bg-[#006B56] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                title="View Donut Distribution Chart"
              >
                <PieChartIcon className="w-3.5 h-3.5" />
                <span>Graph</span>
              </button>
              <button
                type="button"
                onClick={() => setBenViewMode('table')}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                  benViewMode === 'table'
                    ? 'bg-[#006B56] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                title="View Vulnerability Table"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>
          </div>

          {benViewMode === 'graph' ? (
            <div className="p-4 flex flex-col justify-between flex-1">
              <div className="h-[210px] w-full flex items-center justify-between gap-2">
                <div className="h-full w-1/2 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vulnerabilityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={3}
                        dataKey="count"
                      >
                        {vulnerabilityData.map((entry, idx) => (
                          <Cell
                            key={`cell-${idx}`}
                            fill={VULNERABILITY_COLORS[entry.name] || '#00856A'}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val, name, item) => [`${val} Households (${item?.payload?.percentage}%)`, item?.payload?.name]}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e2e8f0',
                          borderRadius: '8px',
                          fontSize: '11px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Metric Badge */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black text-slate-900 leading-none">
                      {beneficiaries?.length || 13}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                      Households
                    </span>
                  </div>
                </div>

                {/* Right Legend Strip */}
                <div className="w-1/2 space-y-1.5 overflow-y-auto max-h-[200px] pr-1">
                  {vulnerabilityData.map((v, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-slate-50 transition">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: VULNERABILITY_COLORS[v.name] || '#00856A' }}
                        />
                        <span className="truncate text-slate-700 text-[11px] font-medium" title={v.name}>
                          {v.name}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 text-xs shrink-0 ml-1">
                        {v.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Scope: <strong>{beneficiaries?.length || 13} Households</strong> across 4 state zones</span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('beneficiaries')}
                  className="text-[#006B56] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Beneficiary Roll</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1 max-h-[265px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600 tracking-wider sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Vulnerability Category</th>
                    <th className="py-2.5 px-3">Households</th>
                    <th className="py-2.5 px-3">Primary Zone</th>
                    <th className="py-2.5 px-3 text-right">Share %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 text-[11px]">
                  {vulnerabilityData.map((item, idx) => (
                    <tr
                      key={idx}
                      onClick={() => onNavigateTab('beneficiaries')}
                      className="hover:bg-slate-50 transition cursor-pointer"
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: VULNERABILITY_COLORS[item.name] || '#00856A' }}
                          />
                          <span className="font-bold text-slate-900 truncate max-w-[140px]" title={item.name}>
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {item.count}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[10px] truncate max-w-[130px]" title={item.location}>
                        {item.location}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span className="font-bold font-mono text-slate-700">{item.percentage}%</span>
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full ml-auto mt-0.5 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${item.percentage}%`,
                              backgroundColor: VULNERABILITY_COLORS[item.name] || '#00856A'
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right (6 cols): Programme Grants & Budget Performance (Interactive Graph / Table) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100 bg-slate-50/40 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900">Programme Grants & Budgets</h3>
            </div>

            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('graph')}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                  viewMode === 'graph'
                    ? 'bg-[#006B56] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                title="View Visual Analytics Graph"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Graph</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#006B56] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                title="View Tabular Data"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>
          </div>

          {viewMode === 'graph' ? (
            <div className="p-4 flex flex-col justify-between flex-1">
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={displayProjects}
                    margin={{ top: 10, right: 10, left: -5, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="shortName"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value, name) => [formatCurrency(value), name === 'budget' ? 'Allocated Grant' : 'Actual Spent']}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '8px',
                        fontSize: '11px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Bar dataKey="budget" name="Allocated Grant" fill="#006B56" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spent" name="Actual Spent" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 rounded bg-[#006B56]" />
                    Budget
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 rounded bg-[#38bdf8]" />
                    Disbursed / Spent
                  </span>
                </div>
                <button
                  onClick={() => onNavigateTab('reports')}
                  className="text-[#006B56] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Financial Statement</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1 max-h-[265px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600 tracking-wider sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Programme</th>
                    <th className="py-2.5 px-3">Grant Budget</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Burn Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 text-[11px]">
                  {displayProjects.map((p) => {
                    const burnRate = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => onNavigateTab('programmes')}
                        className="hover:bg-slate-50 transition cursor-pointer"
                      >
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block truncate max-w-[140px]" title={p.fullName}>
                            {p.project_code}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate block max-w-[140px]">{p.location}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(p.budget)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            p.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : p.status === 'Completed'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <span className="font-bold font-mono text-slate-700">{burnRate}%</span>
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full ml-auto mt-0.5 overflow-hidden">
                            <div
                              className="h-full bg-[#00856A] rounded-full"
                              style={{ width: `${Math.min(burnRate, 100)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
