import React, { useMemo } from 'react';
import {
  Briefcase,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Sparkles,
  PackageCheck
} from 'lucide-react';

export function PMOverviewView({
  requests = [],
  programmes = [],
  beneficiaries = [],
  distributions = [],
  activities = [],
  resources = [],
  onNavigateTab
}) {
  // Live calculated metrics from database
  const kpis = useMemo(() => {
    const activeProgsCount = programmes.filter(
      p => p.status === 'Active' || p.status === 'active' || p.status === 'In Progress'
    ).length || programmes.length;

    const pendingDecisionsCount = requests.filter(
      r => r.status === 'Submitted' || r.status === 'Under Review' || r.status === 'Pending' || r.status === 'Pending Review' || r.status === 'My Decision'
    ).length;

    const totalBeneficiaries = beneficiaries.length;
    const distCount = distributions.length;

    return {
      activePrograms: activeProgsCount,
      pendingDecisions: pendingDecisionsCount,
      beneficiariesAssisted: totalBeneficiaries,
      distributionsThisMonth: distCount
    };
  }, [programmes, requests, beneficiaries, distributions]);

  // Live Assistance Workflow Status breakdown
  const workflowStatuses = useMemo(() => {
    const submitted = requests.filter(r => r.status === 'Submitted').length;
    const underAssessment = requests.filter(r => r.status === 'Under Assessment' || r.status === 'Assigned' || r.status === 'In Progress').length;
    const supervisorReview = requests.filter(r => r.status === 'Supervisor Review' || r.status === 'Under Review').length;
    const myDecision = requests.filter(r => r.status === 'My Decision' || r.status === 'Pending' || r.status === 'Pending Review').length;
    const approved = requests.filter(r => r.status === 'Approved' || r.status === 'Allocated').length;
    const completed = requests.filter(r => r.status === 'Completed' || r.status === 'Fulfilled' || r.status === 'Distributed').length;

    return [
      { label: 'Submitted', count: submitted },
      { label: 'Under Assessment', count: underAssessment },
      { label: 'Supervisor Review', count: supervisorReview },
      { label: 'My Decision', count: myDecision, highlight: true },
      { label: 'Approved', count: approved },
      { label: 'Completed', count: completed }
    ];
  }, [requests]);

  // Live Programme Performance Progress
  const performanceList = useMemo(() => {
    if (!programmes || programmes.length === 0) return [];
    
    return programmes.map(prog => {
      const progBeneficiaries = beneficiaries.filter(
        b => b.program_id === prog.id || b.program_name === prog.name || b.programme_name === prog.name || b.programme === prog.name
      ).length;
      
      const target = Number(prog.target_beneficiaries || prog.target || 100);
      const progress = target > 0 ? Math.min(100, Math.round((progBeneficiaries / target) * 100)) : 0;

      return {
        id: prog.id,
        name: prog.name || 'Untitled Programme',
        sector: prog.sector || prog.category || 'Humanitarian Sector',
        beneficiaries: progBeneficiaries,
        target: target,
        target_progress: progress,
        color: progress >= 75 ? 'bg-[#006B56]' : progress >= 40 ? 'bg-blue-600' : 'bg-amber-500'
      };
    });
  }, [programmes, beneficiaries]);

  // Live Attention Alert Items
  const attentionItems = useMemo(() => {
    const items = [];

    // 1. Pending Decisions
    const pendingReqs = requests.filter(
      r => r.status === 'Pending' || r.status === 'Pending Review' || r.status === 'My Decision' || r.status === 'Submitted'
    );
    if (pendingReqs.length > 0) {
      const topReq = pendingReqs[0];
      items.push({
        id: 'att-reqs',
        title: `${pendingReqs.length} assistance request${pendingReqs.length > 1 ? 's' : ''} awaiting decision`,
        subtitle: `${topReq.program_name || topReq.programme_name || 'Emergency Aid'} • ${topReq.location || topReq.county || topReq.payam || 'Field Location'}`,
        badge: 'Review',
        tab: 'requests',
        priority: 'high'
      });
    }

    // 2. Pending Field Reports / Activities
    const pendingActs = activities.filter(
      a => a.status === 'Pending' || a.status === 'Pending Review' || a.status === 'In Progress'
    );
    if (pendingActs.length > 0) {
      const topAct = pendingActs[0];
      items.push({
        id: 'att-acts',
        title: `${pendingActs.length} field task${pendingActs.length > 1 ? 's' : ''} in progress / pending review`,
        subtitle: `${topAct.program_name || 'Field Ops'} • ${topAct.location || topAct.county || 'South Sudan'}`,
        badge: 'Tasks',
        tab: 'activities',
        priority: 'medium'
      });
    }

    // 3. Low Resource Alert
    const lowResources = resources.filter(
      r => r.is_low_stock || r.status === 'Low Stock' || r.status === 'Critical' || (r.quantity != null && r.threshold != null && Number(r.quantity) <= Number(r.threshold))
    );
    if (lowResources.length > 0) {
      const topRes = lowResources[0];
      items.push({
        id: 'att-res',
        title: `${lowResources.length} warehouse item${lowResources.length > 1 ? 's' : ''} low in stock`,
        subtitle: `${topRes.depot || topRes.warehouse || 'Depot'} • ${topRes.name || topRes.item_name || 'Supplies'}`,
        badge: 'Stock',
        tab: 'resources',
        priority: 'medium'
      });
    }

    return items;
  }, [requests, activities, resources]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. TOP KPI STATS (COMPACT 2x2 ON MOBILE, 4-COL ON DESKTOP) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* KPI 1: Active Programmes */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('programmes')}
          className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Active Programmes</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-50 text-[#006B56] flex items-center justify-center group-hover:bg-[#006B56] group-hover:text-white transition-colors shrink-0">
              <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{kpis.activePrograms}</span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              Live
            </span>
          </div>
        </div>

        {/* KPI 2: Pending Decisions */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('requests')}
          className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-amber-200 shadow-2xs hover:shadow-xs hover:border-amber-300 transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-700">Pending Decisions</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl sm:text-2xl font-black text-amber-900 tracking-tight">{kpis.pendingDecisions}</span>
            {kpis.pendingDecisions > 0 && (
              <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                Action Needed
              </span>
            )}
          </div>
        </div>

        {/* KPI 3: Beneficiaries Assisted */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('beneficiaries')}
          className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Beneficiaries</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{kpis.beneficiariesAssisted.toLocaleString()}</span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-md">
              Registered
            </span>
          </div>
        </div>

        {/* KPI 4: Distributions */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('distributions')}
          className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Distributions</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{kpis.distributionsThisMonth}</span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-md">
              Dispatches
            </span>
          </div>
        </div>
      </div>

      {/* 2. CORE DECISION & WORKFLOW LAYER (TWO CLEAN DYNAMIC CARDS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
        
        {/* CARD 1: NEEDS YOUR ATTENTION (DYNAMIC ACTION CENTER) */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">Needs Your Attention</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:block">Tasks requiring official Program Manager decision</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
              {attentionItems.length} Urgent Item{attentionItems.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {attentionItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <PackageCheck className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="font-bold text-xs text-slate-700">All caught up!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No urgent tasks currently require Program Manager authorization.</p>
              </div>
            ) : (
              attentionItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigateTab && onNavigateTab(item.tab)}
                  className="p-3 sm:p-3.5 hover:bg-slate-50/80 transition flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${item.priority === 'high' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-xs sm:text-[13px] leading-snug group-hover:text-[#006B56] transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{item.subtitle}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#006B56] shrink-0 bg-emerald-50 px-2 py-1 rounded-lg group-hover:bg-[#006B56] group-hover:text-white transition">
                    <span>{item.badge}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 bg-slate-50/70 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('requests')}
              className="text-xs font-bold text-[#006B56] hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <span>View All Assistance Requests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 2: WORKFLOW PIPELINE & STRATEGIC PROGRAMMES */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">Authorization Pipeline & Reach</h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:block">Live cases across authorization pipeline</p>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/60">
              {requests.length} Total Cases
            </span>
          </div>

          <div className="p-3.5 sm:p-4 space-y-4">
            {/* Pipeline status 6-box mini-grid */}
            <div>
              <div className="text-[11px] font-bold text-slate-700 mb-2">Request Status Pipeline</div>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-xs">
                {workflowStatuses.map((status, idx) => (
                  <div
                    key={idx}
                    onClick={() => onNavigateTab && onNavigateTab('requests')}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      status.highlight
                        ? 'bg-emerald-50/90 border-[#006B56] ring-1 ring-[#006B56] shadow-2xs'
                        : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-[9px] sm:text-[10px] font-bold uppercase truncate text-slate-500">
                      {status.label}
                    </div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className={`text-base sm:text-lg font-black ${status.highlight ? 'text-[#006B56]' : 'text-slate-900'}`}>
                        {status.count}
                      </span>
                      {status.highlight && (
                        <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-100/60 px-1 rounded">Action</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Target Progress */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span>Programme Beneficiary Progress</span>
                <span className="text-[10px] text-slate-400 font-normal">Active Cycle</span>
              </div>

              <div className="space-y-2">
                {performanceList.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2 text-center">No programmes registered yet.</p>
                ) : (
                  performanceList.slice(0, 4).map((prog) => (
                    <div key={prog.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="truncate">
                          <span className="font-bold text-slate-800 text-[11px]">{prog.name}</span>
                          <span className="text-[10px] text-slate-400 ml-1.5 font-medium">({prog.beneficiaries.toLocaleString()} Assisted)</span>
                        </div>
                        <span className="font-black text-slate-700 text-[10px]">{prog.target_progress}%</span>
                      </div>

                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${prog.color} transition-all duration-500`}
                          style={{ width: `${prog.target_progress}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50/70 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('programmes')}
              className="text-xs font-bold text-[#006B56] hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <span>View All Programmes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default PMOverviewView;
