import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  FolderKanban,
  Users,
  DollarSign,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Download,
  ChevronRight,
  ArrowUpRight,
  Target,
  TrendingUp,
  Building2,
  ShieldCheck,
  FileText,
  Phone,
  Mail,
  Award,
  Activity,
  Sparkles,
  RefreshCw,
  PieChart,
  BarChart3,
  Globe2,
  Check,
  X,
  Briefcase
} from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatCard } from '../components/common/StatCard';
import { db } from '../lib/supabase';
import { formatCurrency, formatDate, generateCode } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PMAssistanceRequestsView } from './programme-manager/components/PMAssistanceRequestsView';

export function ProgramsPage() {
  const { currentUser, hasPermission } = useAuth();
  const toast = useToast();
  const canEdit = hasPermission(['Administrator', 'Program Manager']);

  const [programs, setPrograms] = useState([]);
  const [projects, setProjects] = useState([]);
  const [donors, setDonors] = useState([]);
  const [partners, setPartners] = useState([]);
  const [requests, setRequests] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedRequestToReview, setSelectedRequestToReview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active Top Tab: 'portfolios' | 'requests' | 'matrix' | 'milestones' | 'financials' | 'team'
  const [activeTab, setActiveTab] = useState('portfolios');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);

  // Detail Modal Sub-tab
  const [detailSubTab, setDetailSubTab] = useState('overview'); // 'overview' | 'projects' | 'indicators' | 'financials'

  // Form State
  const [formData, setFormData] = useState({
    program_code: '',
    program_name: '',
    sector: 'Food Security & Livelihoods',
    description: '',
    strategic_objective: '',
    program_manager: 'Grace Ochieng',
    program_manager_email: 'program.manager@adra.org',
    program_manager_phone: '+211-920-000002',
    budget: '',
    expenditure: '',
    target_beneficiaries: '',
    reached_beneficiaries: '',
    status: 'Active',
    start_date: '',
    end_date: '',
    location: '',
    donors: '',
    partners: '',
  });

  const sectorsList = [
    'Food Security & Livelihoods',
    'WASH & Clean Water',
    'Education & Economic Empowerment',
    'Health & Nutrition',
    'Emergency Response & Protection'
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const [progList, projList, donorList, partnerList, reqList, benList, supList] = await Promise.all([
        db.getPrograms(),
        db.getProjects(),
        db.getDonors(),
        db.getPartners(),
        db.getAssistanceRequests(),
        db.getBeneficiaries(),
        db.getSupervisors ? db.getSupervisors() : []
      ]);
      setPrograms(progList || []);
      setProjects(projList || []);
      setDonors(donorList || []);
      setPartners(partnerList || []);
      setRequests(Array.isArray(reqList) ? reqList : (reqList?.data || []));
      setBeneficiaries(Array.isArray(benList) ? benList : (benList?.data || []));
      setSupervisors(Array.isArray(supList) ? supList : (supList?.data || []));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load programs data.');
    } finally {
      setLoading(false);
    }
  };

  const pendingRequests = useMemo(() => {
    return requests.filter(r => r.status === 'Submitted' || r.status === 'Pending' || r.status === 'Pending Review');
  }, [requests]);

  const handleApproveRequest = async (requestId, supervisorId, notes) => {
    try {
      await db.approveAssistanceRequest(requestId, supervisorId, notes);
      toast.success('Assistance request approved successfully.');
      loadData();
    } catch (e) {
      toast.error('Failed to approve request.');
    }
  };

  const handleRejectRequest = async (requestId, reason) => {
    try {
      await db.rejectAssistanceRequest(requestId, reason);
      toast.info('Assistance request marked as rejected.');
      loadData();
    } catch (e) {
      toast.error('Failed to reject request.');
    }
  };

  const handleRequestInfo = async (requestId, details) => {
    try {
      await db.requestInfoAssistanceRequest(requestId, details);
      toast.info('Request for additional field information sent.');
      loadData();
    } catch (e) {
      toast.error('Failed to request additional info.');
    }
  };

  const handleAssignSupervisor = async (requestId, supervisorId) => {
    try {
      await db.assignSupervisorToRequest(requestId, supervisorId);
      toast.success('Supervisor assigned successfully.');
      loadData();
    } catch (e) {
      toast.error('Failed to assign supervisor.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Programs
  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      const matchSearch =
        search === '' ||
        p.program_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.program_code?.toLowerCase().includes(search.toLowerCase()) ||
        p.location?.toLowerCase().includes(search.toLowerCase()) ||
        p.program_manager?.toLowerCase().includes(search.toLowerCase());

      const matchSector = selectedSector === 'ALL' || p.sector === selectedSector;
      const matchStatus = selectedStatus === 'ALL' || p.status === selectedStatus;

      return matchSearch && matchSector && matchStatus;
    });
  }, [programs, search, selectedSector, selectedStatus]);

  // Aggregate Executive KPIs
  const stats = useMemo(() => {
    const totalPrograms = programs.length;
    const activePrograms = programs.filter(p => p.status === 'Active').length;
    const totalBudget = programs.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);
    const totalExpenditure = programs.reduce((acc, p) => acc + (Number(p.expenditure) || 0), 0);
    const totalTargetBen = programs.reduce((acc, p) => acc + (Number(p.target_beneficiaries) || 0), 0);
    const totalReachedBen = programs.reduce((acc, p) => acc + (Number(p.reached_beneficiaries) || 0), 0);
    const burnRate = totalBudget > 0 ? ((totalExpenditure / totalBudget) * 100).toFixed(1) : 0;
    const reachRate = totalTargetBen > 0 ? ((totalReachedBen / totalTargetBen) * 100).toFixed(1) : 0;

    return {
      totalPrograms,
      activePrograms,
      totalBudget,
      totalExpenditure,
      burnRate,
      totalTargetBen,
      totalReachedBen,
      reachRate
    };
  }, [programs]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setSelectedProgram(null);
    setFormData({
      program_code: `PRG-SS-00${programs.length + 1}`,
      program_name: '',
      sector: 'Food Security & Livelihoods',
      description: '',
      strategic_objective: '',
      program_manager: currentUser?.full_name || 'Grace Ochieng',
      program_manager_email: currentUser?.email || 'program.manager@adra.org',
      program_manager_phone: '+211-920-000002',
      budget: '',
      expenditure: '0',
      target_beneficiaries: '',
      reached_beneficiaries: '0',
      status: 'Active',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 365 * 2 * 24 * 3600000).toISOString().split('T')[0],
      location: 'Central Equatoria & Jonglei',
      donors: 'USAID (BHA), ADRA International',
      partners: 'Ministry of Agriculture',
    });
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (prog) => {
    setSelectedProgram(prog);
    setFormData({
      program_code: prog.program_code || '',
      program_name: prog.program_name || '',
      sector: prog.sector || 'Food Security & Livelihoods',
      description: prog.description || '',
      strategic_objective: prog.strategic_objective || '',
      program_manager: prog.program_manager || 'Grace Ochieng',
      program_manager_email: prog.program_manager_email || 'program.manager@adra.org',
      program_manager_phone: prog.program_manager_phone || '+211-920-000002',
      budget: prog.budget?.toString() || '',
      expenditure: prog.expenditure?.toString() || '0',
      target_beneficiaries: prog.target_beneficiaries?.toString() || '',
      reached_beneficiaries: prog.reached_beneficiaries?.toString() || '0',
      status: prog.status || 'Active',
      start_date: prog.start_date || '',
      end_date: prog.end_date || '',
      location: prog.location || '',
      donors: Array.isArray(prog.donors) ? prog.donors.join(', ') : (prog.donors || ''),
      partners: Array.isArray(prog.partners) ? prog.partners.join(', ') : (prog.partners || ''),
    });
    setIsFormOpen(true);
  };

  // Open Details Modal
  const handleOpenDetail = (prog) => {
    setSelectedProgram(prog);
    setDetailSubTab('overview');
    setIsDetailOpen(true);
  };

  // Save Program
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.program_name?.trim()) {
      toast.warning('Please enter a program name.');
      return;
    }

    try {
      const donorsArray = typeof formData.donors === 'string'
        ? formData.donors.split(',').map(d => d.trim()).filter(Boolean)
        : formData.donors;

      const partnersArray = typeof formData.partners === 'string'
        ? formData.partners.split(',').map(p => p.trim()).filter(Boolean)
        : formData.partners;

      const payload = {
        ...formData,
        budget: Number(formData.budget) || 0,
        expenditure: Number(formData.expenditure) || 0,
        target_beneficiaries: Number(formData.target_beneficiaries) || 0,
        reached_beneficiaries: Number(formData.reached_beneficiaries) || 0,
        donors: donorsArray,
        partners: partnersArray
      };

      if (selectedProgram) {
        await db.updateProgram(selectedProgram.id, payload);
        toast.success(`Program ${payload.program_code} updated successfully.`);
      } else {
        await db.createProgram(payload);
        toast.success(`Program ${payload.program_code} created successfully.`);
      }

      setIsFormOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save program.');
    }
  };

  // Delete Program
  const handleDelete = async () => {
    if (!selectedProgram) return;
    try {
      await db.deleteProgram(selectedProgram.id);
      toast.success(`Program ${selectedProgram.program_code} removed successfully.`);
      setIsDeleteOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete program.');
    }
  };

  // Export Portfolio Report as CSV
  const handleExportCSV = () => {
    try {
      const headers = ['Program Code', 'Program Name', 'Sector', 'Status', 'Manager', 'Budget', 'Expenditure', 'Target Beneficiaries', 'Reached Beneficiaries', 'Location', 'Start Date', 'End Date'];
      const rows = programs.map(p => [
        `"${p.program_code || ''}"`,
        `"${p.program_name?.replace(/"/g, '""') || ''}"`,
        `"${p.sector || ''}"`,
        `"${p.status || ''}"`,
        `"${p.program_manager || ''}"`,
        p.budget || 0,
        p.expenditure || 0,
        p.target_beneficiaries || 0,
        p.reached_beneficiaries || 0,
        `"${p.location || ''}"`,
        p.start_date || '',
        p.end_date || ''
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ADRA_Programs_Portfolio_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Programs portfolio report exported successfully.');
    } catch (e) {
      console.error(e);
      toast.error('Failed to export report.');
    }
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      {/* 1. HERO HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF5F0] text-[#006B56] border border-[#006B56]/20">
              <Sparkles className="w-3.5 h-3.5" />
              Humanitarian Strategy & Multi-Sector Portfolios
            </span>
            <span className="text-xs font-semibold text-slate-500">ADRA South Sudan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-[#006B56]" />
            Programs Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            Consolidated oversight of ADRA strategic program pillars, grant allocations, burn rates, target beneficiary reach, and linked project delivery across South Sudan.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="flex items-center gap-2 text-xs font-bold py-2.5 px-3.5 rounded-xl border-slate-200 hover:bg-slate-50"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Brief (CSV)</span>
          </Button>

          {canEdit && (
            <Button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 text-xs font-bold py-2.5 px-4 rounded-xl bg-[#006B56] hover:bg-[#005745] text-white shadow-xs shadow-[#006B56]/20 active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Program</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Active Programs"
          value={`${stats.activePrograms} / ${stats.totalPrograms}`}
          subtitle={`${stats.totalPrograms} Total Strategic Pillars`}
          icon={Layers}
          color="emerald"
        />

        <StatCard
          title="Aid Requests"
          value={`${pendingRequests.length} Pending`}
          subtitle={`${requests.length} Total Submissions`}
          icon={HeartHandshake}
          color={pendingRequests.length > 0 ? 'amber' : 'emerald'}
        />

        <StatCard
          title="Total Budget"
          value={formatCurrency(stats.totalBudget)}
          subtitle="Committed Donor Grants"
          icon={DollarSign}
          color="blue"
        />

        <StatCard
          title="Burn Rate"
          value={`${stats.burnRate}%`}
          subtitle={`${formatCurrency(stats.totalExpenditure)} Expended`}
          icon={TrendingUp}
          color={Number(stats.burnRate) > 85 ? 'amber' : 'purple'}
        />

        <StatCard
          title="Beneficiary Reach"
          value={stats.totalReachedBen.toLocaleString()}
          subtitle={`${stats.reachRate}% of ${stats.totalTargetBen.toLocaleString()} target`}
          icon={Users}
          color="cyan"
        />

        <StatCard
          title="Operational Health"
          value="98.4%"
          subtitle="Field Milestone Index"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* 3. PRIMARY SUB-NAVIGATION TABS */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 sm:gap-2">
          {[
            { id: 'portfolios', label: 'Strategic Portfolios', icon: Layers, count: programs.length },
            { id: 'requests', label: 'Beneficiary Requests', icon: HeartHandshake, count: pendingRequests.length },
            { id: 'matrix', label: 'Project Alignment Matrix', icon: FolderKanban, count: projects.length },
            { id: 'milestones', label: 'Milestones & Indicators', icon: Target },
            { id: 'financials', label: 'Budget & Grant Burn', icon: DollarSign },
            { id: 'team', label: 'Leadership & Staffing', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-3 border-b-2 font-bold text-xs transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-[#006B56] text-[#006B56] bg-emerald-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#006B56]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-[#006B56] text-white' : tab.id === 'requests' && tab.count > 0 ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle (Grid vs Table) when on portfolios tab */}
        {activeTab === 'portfolios' && (
          <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-1 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Card View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Table View
            </button>
          </div>
        )}
      </div>

      {/* 4. TAB CONTENT */}

      {/* --- TAB 1: STRATEGIC PORTFOLIOS --- */}
      {activeTab === 'portfolios' && (
        <div className="space-y-4">
          {/* Pending Requests Alert Banner */}
          {pendingRequests.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-150">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Beneficiary Assistance Request Awaiting Review</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">Action Required</span>
                  </div>
                  <p className="text-xs text-amber-800 font-medium mt-0.5">
                    <strong>{pendingRequests[0]?.request_code || pendingRequests[0]?.id}</strong>: {pendingRequests[0]?.beneficiary_name} requested {pendingRequests[0]?.assistance_type || pendingRequests[0]?.category} ({pendingRequests[0]?.household_members || pendingRequests[0]?.household_size || 7} household members) &bull; {pendingRequests[0]?.county || 'Kapoeta South'}, {pendingRequests[0]?.state || 'Eastern Equatoria'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={() => {
                    setSelectedRequestToReview(pendingRequests[0]);
                    setActiveTab('requests');
                  }}
                  className="text-xs font-bold py-2 px-4 bg-[#006B56] hover:bg-[#005242] text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Review Request ({pendingRequests.length})</span>
                </Button>
              </div>
            </div>
          )}
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search programs by code, title, county, or manager..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006B56] focus:bg-white transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {/* Sector Dropdown */}
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-[#006B56] cursor-pointer"
              >
                <option value="ALL">All Sectors ({programs.length})</option>
                {sectorsList.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* Status Dropdown */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-[#006B56] cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Planned">Planned</option>
                <option value="Completed">Completed</option>
              </select>

              {(search || selectedSector !== 'ALL' || selectedStatus !== 'ALL') && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearch('');
                    setSelectedSector('ALL');
                    setSelectedStatus('ALL');
                  }}
                  className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-2.5 py-2 rounded-xl"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <LoadingSpinner size="lg" message="Loading programs portfolio..." />
            </div>
          ) : filteredPrograms.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No programs found"
              description="No programs match your search and filter criteria. Try adjusting the sector or search keyword."
              actionLabel={canEdit ? 'Create New Program' : undefined}
              onAction={canEdit ? handleOpenCreate : undefined}
            />
          ) : viewMode === 'grid' ? (
            /* GRID CARDS VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredPrograms.map((prog) => {
                const burnRatePct = prog.budget > 0 ? Math.min(100, Math.round((prog.expenditure / prog.budget) * 100)) : 0;
                const reachPct = prog.target_beneficiaries > 0 ? Math.min(100, Math.round((prog.reached_beneficiaries / prog.target_beneficiaries) * 100)) : 0;
                const linkedCount = prog.linked_project_ids?.length || 0;

                return (
                  <div
                    key={prog.id}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition duration-200 flex flex-col justify-between overflow-hidden group hover:border-[#006B56]/40"
                  >
                    {/* Header Strip */}
                    <div className="p-5 pb-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-black text-[#006B56] bg-emerald-50 px-2 py-0.5 rounded-md border border-[#006B56]/20">
                              {prog.program_code}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              prog.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : prog.status === 'Planned'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {prog.status}
                            </span>
                          </div>
                          <h3 className="text-base font-extrabold text-slate-900 leading-snug group-hover:text-[#006B56] transition line-clamp-2">
                            {prog.program_name}
                          </h3>
                        </div>
                      </div>

                      {/* Sector Badge */}
                      <div className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700">
                        {prog.sector}
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {prog.description}
                      </p>

                      {/* Key Gauges */}
                      <div className="space-y-2.5 pt-2 border-t border-slate-100">
                        {/* Financial Burn Rate Gauge */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-500 flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                              Budget Burn Rate:
                            </span>
                            <span className="text-slate-900">
                              {formatCurrency(prog.expenditure)} / {formatCurrency(prog.budget)} ({burnRatePct}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                burnRatePct > 90 ? 'bg-rose-500' : burnRatePct > 70 ? 'bg-amber-500' : 'bg-[#006B56]'
                              }`}
                              style={{ width: `${burnRatePct}%` }}
                            />
                          </div>
                        </div>

                        {/* Beneficiary Reach Gauge */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-500 flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              Beneficiary Reach:
                            </span>
                            <span className="text-slate-900">
                              {prog.reached_beneficiaries?.toLocaleString()} / {prog.target_beneficiaries?.toLocaleString()} ({reachPct}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-sky-600 transition-all duration-500"
                              style={{ width: `${reachPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Metadata row */}
                      <div className="pt-2 text-[11px] text-slate-500 space-y-1.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{prog.location || 'South Sudan'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 truncate">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-700 truncate">{prog.program_manager}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-[#006B56]">
                            {linkedCount} {linkedCount === 1 ? 'Project' : 'Projects'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleOpenDetail(prog)}
                        className="flex-1 py-1.5 text-xs font-bold rounded-xl border-slate-200 hover:bg-white flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>View Details</span>
                      </Button>

                      {canEdit && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prog)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#006B56] hover:bg-white border border-transparent hover:border-slate-200 transition cursor-pointer"
                            title="Edit Program"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProgram(prog);
                              setIsDeleteOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition cursor-pointer"
                            title="Delete Program"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Program & Code</th>
                      <th className="py-3 px-4">Sector</th>
                      <th className="py-3 px-4">Budget & Burn Rate</th>
                      <th className="py-3 px-4">Beneficiary Reach</th>
                      <th className="py-3 px-4">Manager</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredPrograms.map((prog) => {
                      const burnRate = prog.budget > 0 ? Math.round((prog.expenditure / prog.budget) * 100) : 0;
                      const reachRate = prog.target_beneficiaries > 0 ? Math.round((prog.reached_beneficiaries / prog.target_beneficiaries) * 100) : 0;
                      return (
                        <tr key={prog.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-[#006B56] text-[11px] block">
                              {prog.program_code}
                            </span>
                            <span className="font-bold text-slate-900 line-clamp-1">
                              {prog.program_name}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {prog.location}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 truncate max-w-[150px]">
                              {prog.sector}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">
                              {formatCurrency(prog.budget)}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              {formatCurrency(prog.expenditure)} spent ({burnRate}%)
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">
                              {prog.reached_beneficiaries?.toLocaleString()} reached
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              Target: {prog.target_beneficiaries?.toLocaleString()} ({reachRate}%)
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-700">
                            {prog.program_manager}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              prog.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : prog.status === 'Planned'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {prog.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(prog)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#006B56] hover:bg-emerald-50 transition cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {canEdit && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(prog)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer ml-1"
                                  title="Edit Program"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedProgram(prog);
                                    setIsDeleteOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer ml-1"
                                  title="Delete Program"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: PROJECT ALIGNMENT MATRIX --- */}
      {activeTab === 'matrix' && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
            <div className="max-w-3xl space-y-1">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-[#006B56]" />
                Program-to-Project Alignment Matrix
              </h2>
              <p className="text-xs text-slate-600">
                Shows how each individual operational project in the field rolls up under ADRA's overarching strategic programs.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {programs.map((prog) => {
              // Linked projects for this program
              const linkedProjs = projects.filter(
                p => prog.linked_project_ids?.includes(p.id) ||
                     p.project_name?.toLowerCase().includes(prog.sector?.toLowerCase().split(' ')[0] || '')
              );

              return (
                <div key={prog.id} className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#006B56] bg-emerald-100 px-2 py-0.5 rounded">
                          {prog.program_code}
                        </span>
                        <h3 className="text-sm font-extrabold text-slate-900">
                          {prog.program_name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500">
                        {prog.sector} • Managed by <span className="font-semibold text-slate-700">{prog.program_manager}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold text-slate-600">
                        Total Program Budget: <span className="text-slate-900 font-extrabold">{formatCurrency(prog.budget)}</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#EAF5F0] text-[#006B56]">
                        {linkedProjs.length} Projects Operating
                      </span>
                    </div>
                  </div>

                  {linkedProjs.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No field projects currently linked to this program pillar.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-4">Project Code</th>
                            <th className="py-2.5 px-4">Project Name</th>
                            <th className="py-2.5 px-4">Location</th>
                            <th className="py-2.5 px-4">Project Officer</th>
                            <th className="py-2.5 px-4">Project Budget</th>
                            <th className="py-2.5 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {linkedProjs.map((pj) => (
                            <tr key={pj.id} className="hover:bg-slate-50/70 transition">
                              <td className="py-2.5 px-4 font-mono font-bold text-[#006B56]">
                                {pj.project_code}
                              </td>
                              <td className="py-2.5 px-4 font-bold text-slate-900">
                                {pj.project_name}
                              </td>
                              <td className="py-2.5 px-4 text-slate-600">
                                {pj.location}
                              </td>
                              <td className="py-2.5 px-4 font-semibold text-slate-700">
                                {pj.project_officer_name || 'Assigned Officer'}
                              </td>
                              <td className="py-2.5 px-4 font-bold text-slate-900">
                                {formatCurrency(pj.budget)}
                              </td>
                              <td className="py-2.5 px-4">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  pj.status === 'Active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : pj.status === 'Planned'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {pj.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 3: MILESTONES & LOGFRAME INDICATORS --- */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#006B56]" />
              Strategic Milestones & Logframe Indicators
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Cross-cutting Key Performance Indicators (KPIs) tracked across ADRA programs for donor transparency and accountability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programs.map((prog) => (
              <div key={prog.id} className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#006B56] bg-emerald-50 px-2 py-0.5 rounded border border-[#006B56]/20">
                    {prog.program_code}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    Target: {prog.target_beneficiaries?.toLocaleString()} Beneficiaries
                  </span>
                </div>

                <h3 className="text-sm font-extrabold text-slate-900">
                  {prog.program_name}
                </h3>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs text-slate-700 font-medium italic">
                  "{prog.strategic_objective || prog.description}"
                </div>

                {/* Indicators List */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Program Performance Indicators
                  </h4>
                  {prog.key_indicators && prog.key_indicators.length > 0 ? (
                    prog.key_indicators.map((ind, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 pr-2">{ind.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-slate-500">Target: <strong className="text-slate-700">{ind.target}</strong></span>
                          <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-emerald-100 text-emerald-800">
                            {ind.current}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 italic">No specific logframe indicators recorded.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 4: BUDGET & GRANT BURN RATES --- */}
      {activeTab === 'financials' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#006B56]" />
              Consolidated Grants & Financial Burn Rates
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Multi-donor funding breakdown, commitment levels, and grant burn rates per strategic humanitarian program.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map((prog) => {
              const burnRate = prog.budget > 0 ? Math.round((prog.expenditure / prog.budget) * 100) : 0;
              const remaining = Math.max(0, (prog.budget || 0) - (prog.expenditure || 0));

              return (
                <div key={prog.id} className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[#006B56] bg-emerald-50 px-2 py-0.5 rounded">
                        {prog.program_code}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {prog.sector}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900">
                      {prog.program_name}
                    </h3>

                    {/* Financial Stats Box */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Total Approved Budget:</span>
                        <span className="font-black text-slate-900">{formatCurrency(prog.budget)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Expended to Date:</span>
                        <span className="font-bold text-emerald-700">{formatCurrency(prog.expenditure)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-1.5">
                        <span className="text-slate-500">Uncommitted Balance:</span>
                        <span className="font-black text-slate-900">{formatCurrency(remaining)}</span>
                      </div>
                    </div>

                    {/* Burn Rate Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-600">Grant Burn Rate</span>
                        <span className="text-slate-900">{burnRate}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            burnRate > 90 ? 'bg-rose-500' : burnRate > 70 ? 'bg-amber-500' : 'bg-[#006B56]'
                          }`}
                          style={{ width: `${burnRate}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Donors list */}
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="font-bold text-slate-700">Supporting Donors: </span>
                    {Array.isArray(prog.donors) ? prog.donors.join(', ') : (prog.donors || 'ADRA International')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 5: LEADERSHIP & STAFFING --- */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#006B56]" />
              Program Management Leadership & Field Staff
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Field coordinators, program managers, and sector specialists leading operations in each county.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map((prog) => (
              <div key={prog.id} className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#006B56] text-white flex items-center justify-center font-black text-base shadow-xs">
                    {prog.program_manager
                      ? prog.program_manager.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      : 'PM'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-extrabold text-slate-900 truncate">
                      {prog.program_manager || 'Program Manager'}
                    </h3>
                    <p className="text-xs text-[#006B56] font-semibold truncate">
                      Lead: {prog.sector}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {prog.program_code}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5 text-xs text-slate-600 border border-slate-200/70">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{prog.program_manager_email || 'program.manager@adra.org'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{prog.program_manager_phone || '+211-920-000002'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{prog.location || 'South Sudan'}</span>
                  </div>
                </div>

                <div className="pt-2 text-xs font-bold text-slate-700 truncate">
                  Program: {prog.program_name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB: BENEFICIARY ASSISTANCE REQUESTS --- */}
      {activeTab === 'requests' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <PMAssistanceRequestsView
            requests={requests}
            beneficiaries={beneficiaries}
            supervisors={supervisors}
            programmes={programs}
            currentUser={currentUser}
            onApproveRequest={handleApproveRequest}
            onRejectRequest={handleRejectRequest}
            onRequestInfo={handleRequestInfo}
            onAssignSupervisor={handleAssignSupervisor}
            selectedRequestToReview={selectedRequestToReview}
            onClearSelectedRequest={() => setSelectedRequestToReview(null)}
          />
        </div>
      )}

      {/* 5. CREATE / EDIT MODAL */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedProgram ? `Edit Program (${selectedProgram.program_code})` : 'Create New Program Portfolio'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Program Code</label>
              <input
                type="text"
                value={formData.program_code}
                onChange={(e) => setFormData({ ...formData, program_code: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#006B56]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sector / Thematic Pillar</label>
              <select
                value={formData.sector}
                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#006B56]"
              >
                {sectorsList.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Program Name / Title</label>
            <input
              type="text"
              placeholder="e.g. Drought Resilience & Climate-Smart Livelihoods"
              value={formData.program_name}
              onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#006B56]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Strategic Objective</label>
            <input
              type="text"
              placeholder="High-level impact or outcome statement..."
              value={formData.strategic_objective}
              onChange={(e) => setFormData({ ...formData, strategic_objective: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#006B56]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description & Scope</label>
            <textarea
              rows={3}
              placeholder="Detailed description of humanitarian relief and development activities..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#006B56]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Total Approved Budget ($)</label>
              <input
                type="number"
                placeholder="e.g. 2500000"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#006B56]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Total Expended to Date ($)</label>
              <input
                type="number"
                placeholder="e.g. 1200000"
                value={formData.expenditure}
                onChange={(e) => setFormData({ ...formData, expenditure: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#006B56]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Beneficiaries</label>
              <input
                type="number"
                placeholder="e.g. 45000"
                value={formData.target_beneficiaries}
                onChange={(e) => setFormData({ ...formData, target_beneficiaries: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#006B56]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Beneficiaries Reached</label>
              <input
                type="number"
                placeholder="e.g. 38400"
                value={formData.reached_beneficiaries}
                onChange={(e) => setFormData({ ...formData, reached_beneficiaries: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#006B56]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Program Manager</label>
              <input
                type="text"
                value={formData.program_manager}
                onChange={(e) => setFormData({ ...formData, program_manager: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#006B56]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Manager Email</label>
              <input
                type="email"
                value={formData.program_manager_email}
                onChange={(e) => setFormData({ ...formData, program_manager_email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#006B56]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#006B56]"
              >
                <option value="Active">Active</option>
                <option value="Planned">Planned</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#006B56]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#006B56]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Counties / Locations</label>
            <input
              type="text"
              placeholder="e.g. Turkana, Kapoeta, Central Equatoria"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#006B56]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Supporting Donors</label>
              <input
                type="text"
                placeholder="e.g. USAID (BHA), ECHO"
                value={formData.donors}
                onChange={(e) => setFormData({ ...formData, donors: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#006B56]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Implementing Partners</label>
              <input
                type="text"
                placeholder="e.g. Ministry of Agriculture, FAO"
                value={formData.partners}
                onChange={(e) => setFormData({ ...formData, partners: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#006B56]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              className="rounded-xl px-4 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl px-5 text-xs font-bold bg-[#006B56] hover:bg-[#005745] text-white shadow-xs"
            >
              {selectedProgram ? 'Save Changes' : 'Create Program'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. DETAILS MODAL */}
      {selectedProgram && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Program Portfolio: ${selectedProgram.program_code}`}
          size="xl"
        >
          <div className="space-y-4 select-none">
            {/* Header info */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {selectedProgram.sector}
                </span>
                <span className="text-xs font-mono font-bold text-slate-600">
                  Status: <strong className="text-slate-900">{selectedProgram.status}</strong>
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900">
                {selectedProgram.program_name}
              </h2>
              <p className="text-xs text-slate-600">
                {selectedProgram.description}
              </p>
            </div>

            {/* Sub-tabs within Detail Modal */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-1 text-xs">
              {[
                { id: 'overview', label: 'Summary & Metrics' },
                { id: 'projects', label: 'Linked Projects' },
                { id: 'indicators', label: 'Logframe Indicators' },
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setDetailSubTab(st.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    detailSubTab === st.id ? 'bg-[#006B56] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {detailSubTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Budget</span>
                    <span className="text-base font-black text-slate-900">{formatCurrency(selectedProgram.budget)}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Spent to Date</span>
                    <span className="text-base font-black text-emerald-700">{formatCurrency(selectedProgram.expenditure)}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Target Reach</span>
                    <span className="text-base font-black text-slate-900">{selectedProgram.target_beneficiaries?.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Reached</span>
                    <span className="text-base font-black text-sky-700">{selectedProgram.reached_beneficiaries?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <span className="font-bold block">Strategic Objective:</span>
                  <p>{selectedProgram.strategic_objective || 'No strategic objective documented.'}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-700 block">Program Lead / Manager:</span>
                    <p className="font-extrabold text-slate-900">{selectedProgram.program_manager}</p>
                    <p className="text-slate-500">{selectedProgram.program_manager_email}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-700 block">Geographic Coverage:</span>
                    <p className="font-extrabold text-slate-900">{selectedProgram.location}</p>
                    <p className="text-slate-500">Timeline: {formatDate(selectedProgram.start_date)} — {formatDate(selectedProgram.end_date)}</p>
                  </div>
                </div>
              </div>
            )}

            {detailSubTab === 'projects' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">Field projects aligned with this strategic program:</p>
                {projects.filter(p => selectedProgram.linked_project_ids?.includes(p.id)).length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                    No field projects specifically registered under this program.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projects.filter(p => selectedProgram.linked_project_ids?.includes(p.id)).map(p => (
                      <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-bold text-[#006B56] block">{p.project_code}</span>
                          <span className="font-bold text-slate-900">{p.project_name}</span>
                          <span className="text-[11px] text-slate-500 block">{p.location} • Officer: {p.project_officer_name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-slate-900 block">{formatCurrency(p.budget)}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {p.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {detailSubTab === 'indicators' && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">Key performance indicators tracked under this program:</p>
                {selectedProgram.key_indicators && selectedProgram.key_indicators.length > 0 ? (
                  selectedProgram.key_indicators.map((ind, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{ind.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-[11px]">Target: <strong>{ind.target}</strong></span>
                        <span className="px-2.5 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800">
                          {ind.current}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                    No logframe indicators recorded.
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setIsDetailOpen(false)}
                className="rounded-xl px-4 text-xs font-bold"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 7. CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Program Portfolio"
        message={`Are you sure you want to delete "${selectedProgram?.program_name}" (${selectedProgram?.program_code})? This action will remove the program from portfolios and cannot be undone.`}
      />
    </div>
  );
}

export default ProgramsPage;
