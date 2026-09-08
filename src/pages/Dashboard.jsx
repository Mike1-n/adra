import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Users,
  CalendarCheck2,
  HeartHandshake,
  DollarSign,
  TrendingUp,
  Target,
  ArrowRight,
  Shield,
  Activity,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { db } from '../lib/supabase';
import { formatCurrency, formatDate, calculatePercentage } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';

const STATUS_COLORS = {
  Active: '#10b981',
  Planned: '#3b82f6',
  Completed: '#059669',
  Suspended: '#f59e0b',
};

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export function Dashboard({ onNavigate }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    projects: [],
    beneficiaries: [],
    activities: [],
    interventions: [],
    indicators: [],
    budgets: [],
    expenditures: [],
  });

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [
          projects,
          beneficiaries,
          activities,
          interventions,
          indicators,
          budgets,
          expenditures,
        ] = await Promise.all([
          db.getProjects(),
          db.getBeneficiaries(),
          db.getActivities(),
          db.getInterventions(),
          db.getIndicators(),
          db.getBudgets(),
          db.getExpenditures(),
        ]);

        setData({
          projects,
          beneficiaries,
          activities,
          interventions,
          indicators,
          budgets,
          expenditures,
        });
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Aggregating ADRA Analytics..." />;
  }

  // KPI Calculations
  const totalProjects = data.projects.length;
  const activeProjects = data.projects.filter(p => p.status === 'Active').length;
  const totalBeneficiaries = data.beneficiaries.length;
  const totalActivities = data.activities.length;
  const completedActivities = data.activities.filter(a => a.status === 'Completed').length;
  const totalInterventions = data.interventions.length;

  const totalBudget = data.projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
  const totalSpent = data.expenditures.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const budgetUtilization = calculatePercentage(totalSpent, totalBudget);

  // Status Distribution for Donut Chart
  const statusCounts = data.projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});
  const projectStatusData = Object.keys(statusCounts).map(status => ({
    name: status,
    value: statusCounts[status]
  }));

  // Beneficiaries Per Project Bar Chart
  const beneficiariesPerProject = data.projects.map(p => ({
    name: p.project_code || p.project_name.substring(0, 15),
    fullName: p.project_name,
    count: data.beneficiaries.filter(b => b.project_id === p.id).length
  }));

  // Budget vs Expenditure per Project
  const financeComparisonData = data.projects.slice(0, 4).map(p => {
    const spent = data.expenditures
      .filter(e => e.project_id === p.id)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    return {
      name: p.project_code,
      budget: Number(p.budget),
      spent: spent
    };
  });

  // Interventions by Category
  const interventionTypes = data.interventions.reduce((acc, i) => {
    acc[i.intervention_type] = (acc[i.intervention_type] || 0) + 1;
    return acc;
  }, {});
  const interventionTypeData = Object.keys(interventionTypes).map(type => ({
    name: type,
    count: interventionTypes[type]
  }));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              {currentUser?.role} Console
            </span>
            <span className="text-xs text-slate-400">Academic Project Edition</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Welcome, {currentUser?.full_name || 'Officer'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5 max-w-xl">
            Centralized monitoring of humanitarian relief, development programs, and community interventions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('projects')}
            icon={FolderKanban}
          >
            Manage Projects
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('reports')}
          >
            View Reports
          </Button>
        </div>
      </div>

      {/* KPI Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Projects"
          value={`${activeProjects} / ${totalProjects}`}
          subtitle={`${data.projects.filter(p => p.status === 'Completed').length} successfully completed`}
          icon={FolderKanban}
          color="emerald"
          onClick={() => onNavigate('projects')}
        />

        <StatCard
          title="Registered Beneficiaries"
          value={totalBeneficiaries.toLocaleString()}
          subtitle="Across semi-arid & urban regions"
          icon={Users}
          color="blue"
          onClick={() => onNavigate('beneficiaries')}
        />

        <StatCard
          title="Total Budget Allocated"
          value={formatCurrency(totalBudget)}
          subtitle={`Disbursed: ${formatCurrency(totalSpent)} (${budgetUtilization}%)`}
          icon={DollarSign}
          color="amber"
          onClick={() => onNavigate('finance')}
        />

        <StatCard
          title="Field Interventions"
          value={totalInterventions.toLocaleString()}
          subtitle={`${completedActivities}/${totalActivities} activities done`}
          icon={HeartHandshake}
          color="purple"
          onClick={() => onNavigate('interventions')}
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Donut */}
        <Card>
          <CardHeader
            title="Projects by Operational Status"
            subtitle="Current portfolio distribution across all sectors"
            action={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('projects')}>
                View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            }
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.name] || CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Budget vs Expenditure Bar Chart */}
        <Card>
          <CardHeader
            title="Budget vs. Expenditure (Key Projects)"
            subtitle="Comparing allocated grant funds against actual expense logs"
            action={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('finance')}>
                Finance <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            }
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financeComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val) => formatCurrency(val)}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                <Bar dataKey="budget" name="Budget" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spent" name="Spent" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Second Row: Beneficiary Demographics & Recent Interventions Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Intervention Distribution */}
        <Card className="lg:col-span-1">
          <CardHeader
            title="Interventions by Sector"
            subtitle="Breakdown of humanitarian aid delivered"
          />
          <div className="space-y-3 mt-2">
            {interventionTypeData.map((item, idx) => (
              <div key={item.name} className="flex flex-col gap-1 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-medium truncate">{item.name}</span>
                  <span className="text-emerald-400 font-semibold">{item.count} items</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(item.count / totalInterventions) * 100}%`,
                      backgroundColor: CHART_COLORS[idx % CHART_COLORS.length]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activities & Milestones */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent & Upcoming Project Activities"
            subtitle="Operational timeline from field teams"
            action={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('activities')}>
                All Activities <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            }
          />
          <div className="space-y-3">
            {data.activities.slice(0, 4).map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 mt-0.5">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">{act.activity_name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {act.project_name || 'Project'} • {act.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3" />
                    {formatDate(act.activity_date)}
                  </span>
                  <Badge status={act.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
