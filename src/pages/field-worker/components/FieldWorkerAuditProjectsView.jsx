import React, { useState, useMemo } from 'react';
import {
  FileCheck,
  FolderKanban,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Plus,
  Building2,
  HeartHandshake,
  Droplets,
  Wheat,
  Banknote,
  ShieldCheck,
  ChevronRight,
  Eye,
  FileText,
  UserCheck,
  AlertCircle
} from 'lucide-react';

export function FieldWorkerAuditProjectsView({
  projects = [],
  tasks = [],
  assessments = [],
  beneficiaries = [],
  worker = {},
  selectedProject = null,
  onSelectProject,
  onBackToProjects,
  onStartAuditForTask,
  onStartAuditForProject,
  onRequestFacilitation,
  onOpenScanner
}) {
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [onlyPendingFilter, setOnlyPendingFilter] = useState(false);
  const [activeCaseTab, setActiveCaseTab] = useState('pending'); // 'pending' | 'all' | 'submitted' | 'completed'

  // Helper to map tasks to a project accurately
  const getTasksForProject = (project) => {
    if (!project || !Array.isArray(tasks) || tasks.length === 0) return [];
    
    const pCode = (project.project_code || '').toLowerCase().trim();
    const pName = (project.project_name || '').toLowerCase().trim();
    const pId = (project.id || '').toLowerCase().trim();
    const pProg = (project.programme_name || project.program_name || '').toLowerCase().trim();
    const pSector = (project.sector || project.category || '').toLowerCase().trim();

    const matched = tasks.filter(t => {
      const tProjId = (t.project_id || '').toLowerCase().trim();
      const tProjCode = (t.project_code || '').toLowerCase().trim();
      const tProjName = (t.project_name || '').toLowerCase().trim();
      const tProgName = (t.programme_name || t.program_name || t.programme || '').toLowerCase().trim();
      const tCategory = (t.category || t.sector || t.assistance_type || '').toLowerCase().trim();

      // 1. Direct match on ID or Code
      if (tProjId && (tProjId === pId || tProjId === pCode)) return true;
      if (tProjCode && (tProjCode === pCode || tProjCode === pId)) return true;

      // 2. Direct match on Project Name
      if (tProjName && pName && (tProjName === pName || tProjName.includes(pName) || pName.includes(tProjName))) return true;

      // 3. Programme match
      if (tProgName && pProg && (tProgName === pProg || tProgName.includes(pProg) || pProg.includes(tProgName))) return true;
      if (tProgName && pName && (tProgName === pName || tProgName.includes(pName) || pName.includes(tProgName))) return true;

      // 4. Sector / Category match
      if (pSector && tCategory && (pSector.includes(tCategory) || tCategory.includes(pSector))) return true;

      return false;
    });

    // If there is only one assigned project in total, map all worker tasks to it
    if (matched.length === 0 && Array.isArray(projects) && projects.length === 1) {
      return tasks;
    }

    return matched;
  };

  // Derive assigned projects: Align real database projects with the worker's assigned tasks
  const workerAssignedProjects = useMemo(() => {
    if (!Array.isArray(projects) || projects.length === 0) {
      // If no standalone projects exist in db, check if tasks have project details
      if (!Array.isArray(tasks) || tasks.length === 0) return [];
      
      // Group tasks by their real project info if specified
      const grouped = new Map();
      tasks.forEach(t => {
        const key = t.project_id || t.project_code || t.project_name || 'Assigned Humanitarian Project';
        if (!grouped.has(key)) {
          const sector = t.category || t.sector || 'Humanitarian Relief';
          const sectorLower = (sector || '').toLowerCase();
          const sector_category = sectorLower.includes('water') || sectorLower.includes('wash') ? 'wash' :
                                  sectorLower.includes('cash') || sectorLower.includes('cva') ? 'cash' :
                                  sectorLower.includes('health') || sectorLower.includes('nutrition') ? 'health' :
                                  sectorLower.includes('shelter') || sectorLower.includes('nfi') ? 'shelter' : 'food';

          grouped.set(key, {
            id: t.project_id || key,
            project_code: t.project_code || 'PRJ-SS-2026',
            project_name: t.project_name || t.program_name || 'Humanitarian Field Project',
            sector: sector,
            sector_category: sector_category,
            donor_name: t.donor_name || 'ADRA Humanitarian Emergency Fund',
            location: t.location || `${t.state || worker?.state || 'Eastern Equatoria'} — ${t.payam || worker?.payam || 'Kapoeta'}`,
            payams: [t.payam || worker?.payam || 'Kapoeta Town'],
            description: t.description || `Field verification, household vulnerability assessment, and relief distribution.`,
            status: 'Active Operations',
            urgency_status: t.urgency_level || 'High Priority'
          });
        }
      });
      return Array.from(grouped.values());
    }

    const workerId = (worker?.id || '').toLowerCase().trim();
    const workerName = (worker?.name || '').toLowerCase().trim();

    // Filter real projects to only those that have assigned tasks or are assigned to this worker
    const matchedProjects = projects.filter(project => {
      // Check if any assigned tasks belong to this project
      const projectTasks = getTasksForProject(project);
      if (projectTasks.length > 0) return true;

      // Check if worker is directly assigned to the project
      if (workerId && project.assigned_worker_ids?.some(id => String(id).toLowerCase().trim() === workerId)) return true;
      if (workerId && project.field_worker_id && String(project.field_worker_id).toLowerCase().trim() === workerId) return true;
      if (workerName && project.field_worker_name && String(project.field_worker_name).toLowerCase().trim() === workerName) return true;

      if (Array.isArray(project.assigned_field_workers)) {
        return project.assigned_field_workers.some(w => {
          if (typeof w === 'string') return (workerId && w.toLowerCase().trim() === workerId) || (workerName && w.toLowerCase().trim() === workerName);
          if (w && typeof w === 'object') return (workerId && String(w.id || '').toLowerCase().trim() === workerId) || (workerName && String(w.name || '').toLowerCase().trim() === workerName);
          return false;
        });
      }

      return false;
    });

    // If projects exist in db and tasks exist, but strict matching missed, align to the first real project
    if (matchedProjects.length === 0 && Array.isArray(tasks) && tasks.length > 0 && projects.length > 0) {
      return [projects[0]];
    }

    return matchedProjects;
  }, [projects, tasks, worker]);

  // Enriched project portfolio with computed counts (computed from ONLY assigned projects)
  const enrichedProjects = useMemo(() => {
    return workerAssignedProjects.map(p => {
      const projectTasks = getTasksForProject(p);
      
      const pendingTasks = projectTasks.filter(t => 
        t.status === 'Assigned to Field Worker' || 
        t.status === 'Submitted' ||
        t.status === 'Assessment In Progress' || 
        t.status === 'Correction Required' ||
        t.status === 'Pending' ||
        t.status === 'Pending Review'
      );

      const submittedTasks = projectTasks.filter(t => 
        t.status === 'Assessment Submitted' || 
        t.status === 'Awaiting Program Manager Decision'
      );

      const completedTasks = projectTasks.filter(t => 
        t.status === 'Completed' || 
        t.status === 'Distributed' || 
        t.status === 'Approved'
      );

      const urgentTasks = projectTasks.filter(t => 
        t.urgency_level === 'Critical Emergency' || 
        t.urgency_level === 'High Priority' ||
        t.urgency === 'Critical' ||
        t.urgency === 'High'
      );

      const totalCases = projectTasks.length;
      const completedAudits = submittedTasks.length + completedTasks.length;
      const progressPercent = totalCases > 0 ? Math.round((completedAudits / totalCases) * 100) : 0;

      return {
        ...p,
        projectTasks,
        totalCases,
        pendingCount: pendingTasks.length,
        submittedCount: submittedTasks.length,
        completedCount: completedTasks.length,
        urgentCount: urgentTasks.length,
        progressPercent
      };
    });
  }, [workerAssignedProjects, tasks]);

  // Filtered projects list based on search & sector filters
  const filteredProjects = useMemo(() => {
    return enrichedProjects.filter(p => {
      if (onlyPendingFilter && p.pendingCount === 0) return false;

      if (selectedSector !== 'ALL') {
        if (selectedSector === 'food' && p.sector_category !== 'food') return false;
        if (selectedSector === 'wash' && p.sector_category !== 'wash') return false;
        if (selectedSector === 'cash' && p.sector_category !== 'cash') return false;
        if (selectedSector === 'health' && p.sector_category !== 'health') return false;
        if (selectedSector === 'shelter' && p.sector_category !== 'shelter') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (p.project_name || '').toLowerCase().includes(q);
        const matchCode = (p.project_code || '').toLowerCase().includes(q);
        const matchDonor = (p.donor_name || '').toLowerCase().includes(q);
        const matchSector = (p.sector || '').toLowerCase().includes(q);
        const matchLoc = (p.location || '').toLowerCase().includes(q);
        return matchTitle || matchCode || matchDonor || matchSector || matchLoc;
      }

      return true;
    });
  }, [enrichedProjects, searchQuery, selectedSector, onlyPendingFilter]);

  // Overall KPIs
  const totalAssignedProjects = enrichedProjects.length;
  const totalPendingAudits = enrichedProjects.reduce((acc, p) => acc + p.pendingCount, 0);
  const totalCompletedAudits = enrichedProjects.reduce((acc, p) => acc + (p.submittedCount + p.completedCount), 0);
  const totalUrgentCases = enrichedProjects.reduce((acc, p) => acc + p.urgentCount, 0);

  // Sector Icon Helper
  const renderSectorIcon = (cat) => {
    switch (cat) {
      case 'wash':
        return <Droplets className="w-5 h-5 text-sky-600" />;
      case 'cash':
        return <Banknote className="w-5 h-5 text-amber-600" />;
      case 'health':
        return <HeartHandshake className="w-5 h-5 text-rose-600" />;
      case 'shelter':
        return <Building2 className="w-5 h-5 text-indigo-600" />;
      case 'food':
      default:
        return <Wheat className="w-5 h-5 text-[#006B56]" />;
    }
  };

  const renderSectorBadge = (cat, label) => {
    switch (cat) {
      case 'wash':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-50 text-sky-800 border border-sky-200">WASH</span>;
      case 'cash':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-200">Cash Transfer</span>;
      case 'health':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-800 border border-rose-200">Nutrition & Health</span>;
      case 'shelter':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-800 border border-indigo-200">Shelter / NFI</span>;
      case 'food':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-[#006B56] border border-emerald-200">Food Security</span>;
    }
  };

  // If a project is selected -> Render the Project Audit Workspace (drilldown)
  if (selectedProject) {
    const projectTasks = getTasksForProject(selectedProject);
    
    const pendingCases = projectTasks.filter(t => 
      t.status === 'Assigned to Field Worker' || 
      t.status === 'Submitted' ||
      t.status === 'Assessment In Progress' || 
      t.status === 'Correction Required' ||
      t.status === 'Pending' ||
      t.status === 'Pending Review'
    );

    const submittedCases = projectTasks.filter(t => 
      t.status === 'Assessment Submitted' || 
      t.status === 'Awaiting Program Manager Decision'
    );

    const completedCases = projectTasks.filter(t => 
      t.status === 'Completed' || 
      t.status === 'Distributed' || 
      t.status === 'Approved'
    );

    let displayCases = projectTasks;
    if (activeCaseTab === 'pending') displayCases = pendingCases;
    if (activeCaseTab === 'submitted') displayCases = submittedCases;
    if (activeCaseTab === 'completed') displayCases = completedCases;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      displayCases = displayCases.filter(c => 
        (c.beneficiary_name || '').toLowerCase().includes(q) ||
        (c.beneficiary_code || '').toLowerCase().includes(q) ||
        (c.request_code || '').toLowerCase().includes(q) ||
        (c.phone || c.phone_number || '').includes(q) ||
        (c.village || c.village_area || c.payam || '').toLowerCase().includes(q)
      );
    }

    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        {/* Top Back Nav & Project Title Banner */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onBackToProjects}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
              <span>All Projects</span>
            </button>

            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-900 text-white tracking-wide">
                {selectedProject.project_code}
              </span>
              {renderSectorBadge(selectedProject.sector_category, selectedProject.sector)}
            </div>
          </div>

          <div>
            <h2 className="text-base font-black text-slate-900 leading-snug">
              {selectedProject.project_name}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span className="font-semibold text-slate-700">{selectedProject.donor_name}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#006B56]" />
                <span>{selectedProject.location || worker.payam || 'Eastern Equatoria'}</span>
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-500 block">Total Cases</span>
              <span className="text-sm font-black text-slate-900">{projectTasks.length}</span>
            </div>
            <div className="bg-amber-50 p-2 rounded-xl border border-amber-200/80 text-center">
              <span className="text-[10px] font-bold text-amber-800 block">Pending Audit</span>
              <span className="text-sm font-black text-amber-950">{pendingCases.length}</span>
            </div>
            <div className="bg-purple-50 p-2 rounded-xl border border-purple-200/80 text-center">
              <span className="text-[10px] font-bold text-purple-800 block">Submitted</span>
              <span className="text-sm font-black text-purple-950">{submittedCases.length}</span>
            </div>
            <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200/80 text-center">
              <span className="text-[10px] font-bold text-emerald-800 block">Completed</span>
              <span className="text-sm font-black text-emerald-950">{completedCases.length}</span>
            </div>
          </div>

          {/* Action to launch fresh audit under this project */}
          <button
            type="button"
            onClick={() => onStartAuditForProject ? onStartAuditForProject(selectedProject) : onStartAuditForTask(null)}
            className="w-full py-2.5 px-3.5 bg-gradient-to-r from-[#006B56] to-[#004d3d] hover:from-[#005a48] hover:to-[#003d30] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-200" />
            <span>Audit New Household for this Project</span>
          </button>
        </div>

        {/* Filter Tabs Bar for Cases under this project */}
        <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveCaseTab('pending')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition whitespace-nowrap text-center cursor-pointer ${
              activeCaseTab === 'pending'
                ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Audit ({pendingCases.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCaseTab('all')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition whitespace-nowrap text-center cursor-pointer ${
              activeCaseTab === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Cases ({projectTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCaseTab('submitted')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition whitespace-nowrap text-center cursor-pointer ${
              activeCaseTab === 'submitted'
                ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Submitted ({submittedCases.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCaseTab('completed')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition whitespace-nowrap text-center cursor-pointer ${
              activeCaseTab === 'completed'
                ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Delivered ({completedCases.length})
          </button>
        </div>

        {/* Search Bar for Cases */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search household name, case token, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006B56]/30 focus:border-[#006B56]"
          />
        </div>

        {/* List of Household Cases under this project */}
        <div className="space-y-2.5">
          {displayCases.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006B56] flex items-center justify-center mx-auto border border-emerald-100">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">No Cases in this Filter</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {activeCaseTab === 'pending'
                    ? 'All assigned beneficiary cases for this project have been audited!'
                    : 'No household cases match your current filter criteria.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onStartAuditForProject ? onStartAuditForProject(selectedProject) : onStartAuditForTask(null)}
                className="px-4 py-2 bg-[#006B56] hover:bg-[#005a48] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Audit New Household</span>
              </button>
            </div>
          ) : (
            displayCases.map((task) => {
              const isPending = task.status === 'Assigned to Field Worker' || task.status === 'Submitted' || task.status === 'Assessment In Progress' || task.status === 'Correction Required' || task.status === 'Pending' || task.status === 'Pending Review';
              const isSubmitted = task.status === 'Assessment Submitted' || task.status === 'Awaiting Program Manager Decision';
              const isCompleted = task.status === 'Completed' || task.status === 'Distributed' || task.status === 'Approved';

              const isUrgent = task.urgency_level === 'Critical Emergency' || task.urgency === 'Critical' || task.priority === 'Critical';

              return (
                <div
                  key={task.id || task.request_code}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs hover:shadow-xs transition space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900">
                          {task.beneficiary_name || 'Vulnerable Household'}
                        </span>
                        {isUrgent && (
                          <span className="px-1.5 py-0.2 rounded-md bg-red-100 text-red-700 text-[9px] font-black uppercase flex items-center gap-0.5">
                            <AlertCircle className="w-2.5 h-2.5" />
                            Critical
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Token: {task.request_code || task.beneficiary_code || 'CASE-TOKEN'}
                      </p>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isPending ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                      isSubmitted ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                      'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    }`}>
                      {isPending ? 'Pending Audit' : isSubmitted ? 'Submitted' : 'Delivered'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{task.village || task.village_area || task.payam || worker.payam || 'Kapoeta South'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{task.household_size || task.household_members || 6} Members</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-2">
                    <span className="text-[11px] font-medium text-slate-600 truncate">
                      {task.category || task.assistance_type || selectedProject.sector}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onRequestFacilitation && (
                        <button
                          type="button"
                          onClick={() => onRequestFacilitation(task)}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[10px] font-bold rounded-lg border border-amber-200 transition cursor-pointer"
                        >
                          Facilitation
                        </button>
                      )}

                      {isPending && (
                        <button
                          type="button"
                          onClick={() => onStartAuditForTask(task)}
                          className="px-3 py-1.5 bg-[#006B56] hover:bg-[#005a48] text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-emerald-200" />
                          <span>Conduct Audit</span>
                        </button>
                      )}

                      {isSubmitted && (
                        <button
                          type="button"
                          onClick={() => onStartAuditForTask(task)}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold rounded-xl border border-purple-200 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-purple-600" />
                          <span>Audit Dossier</span>
                        </button>
                      )}

                      {isCompleted && (
                        <button
                          type="button"
                          onClick={() => onOpenScanner ? onOpenScanner() : onStartAuditForTask(task)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </button>
                      )}
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

  // DEFAULT VIEW: Assigned Projects Grid / Portfolio
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Header Banner & Context */}
      <div className="bg-gradient-to-br from-[#006B56] via-[#005544] to-[#003d30] text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-3 -mr-3 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <FolderKanban className="w-4 h-4 text-emerald-100" />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase text-emerald-200 block">
                  Field Audit Hub
                </span>
                <h2 className="text-sm font-extrabold text-white leading-tight">
                  Assigned Humanitarian Projects
                </h2>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-white/20 text-white border border-white/30 backdrop-blur-xs">
              {totalAssignedProjects} Active Projects
            </span>
          </div>

          <p className="text-xs text-emerald-100/90 leading-relaxed">
            Select an assigned project below to view pending household cases and conduct in-person vulnerability audits.
          </p>
        </div>
      </div>

      {/* 2. Key Audit Statistics Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs text-center">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-1 border border-amber-100">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 block">Pending Audits</span>
          <span className="text-base font-black text-amber-950">{totalPendingAudits}</span>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs text-center">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#006B56] flex items-center justify-center mx-auto mb-1 border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 block">Audits Done</span>
          <span className="text-base font-black text-emerald-950">{totalCompletedAudits}</span>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs text-center">
          <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-1 border border-red-100">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 block">Critical Needs</span>
          <span className="text-base font-black text-red-950">{totalUrgentCases}</span>
        </div>
      </div>

      {/* 3. Search and Sector Filter Pills */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects by code, donor, sector, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006B56]/30 focus:border-[#006B56]"
          />
        </div>

        {/* Sector Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedSector('ALL')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
              selectedSector === 'ALL'
                ? 'bg-slate-900 text-white font-extrabold shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Projects
          </button>
          <button
            type="button"
            onClick={() => setSelectedSector('food')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
              selectedSector === 'food'
                ? 'bg-[#006B56] text-white font-extrabold shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Food Security
          </button>
          <button
            type="button"
            onClick={() => setSelectedSector('wash')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
              selectedSector === 'wash'
                ? 'bg-sky-600 text-white font-extrabold shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            WASH
          </button>
          <button
            type="button"
            onClick={() => setSelectedSector('cash')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
              selectedSector === 'cash'
                ? 'bg-amber-600 text-white font-extrabold shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Cash Transfer
          </button>
          <button
            type="button"
            onClick={() => setSelectedSector('health')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
              selectedSector === 'health'
                ? 'bg-rose-600 text-white font-extrabold shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Nutrition
          </button>
        </div>
      </div>

      {/* 4. Projects Portfolio Cards Grid */}
      <div className="space-y-3">
        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FolderKanban className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-extrabold text-slate-800">No Projects Found</h3>
            <p className="text-[11px] text-slate-500">
              No assigned projects match your search or sector filter.
            </p>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const hasPending = project.pendingCount > 0;

            return (
              <div
                key={project.id || project.project_code}
                onClick={() => onSelectProject(project)}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:shadow-md hover:border-[#006B56]/50 transition cursor-pointer space-y-3 group"
              >
                {/* Project Header Strip */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                      {renderSectorIcon(project.sector_category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-800 border border-slate-200">
                          {project.project_code}
                        </span>
                        {renderSectorBadge(project.sector_category, project.sector)}
                      </div>
                      <h3 className="text-xs font-extrabold text-slate-900 mt-1 leading-snug group-hover:text-[#006B56] transition">
                        {project.project_name}
                      </h3>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase shrink-0 ${
                    hasPending
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-emerald-100 text-[#006B56] border border-emerald-200'
                  }`}>
                    {hasPending ? `${project.pendingCount} Pending Audits` : 'Audited'}
                  </span>
                </div>

                {/* Description & Donor snippet */}
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>

                {/* Location & Donor info pills */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1 truncate font-medium text-slate-700">
                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{project.donor_name}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <MapPin className="w-3 h-3 text-[#006B56] shrink-0" />
                    <span>{project.location?.split('—')?.[1] || project.location || worker.payam || 'Kapoeta'}</span>
                  </span>
                </div>

                {/* Audit Progress Bar & Counts */}
                <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700">
                      Audit Progress ({project.completedCount}/{project.totalCases} cases)
                    </span>
                    <span className="font-black text-[#006B56]">
                      {project.progressPercent}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#006B56] to-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${project.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-1 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-500">
                    {project.totalCases} Household{project.totalCases !== 1 ? 's' : ''} Assigned
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProject(project);
                    }}
                    className="px-3.5 py-1.5 bg-[#006B56] hover:bg-[#005a48] text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Audit Project</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
