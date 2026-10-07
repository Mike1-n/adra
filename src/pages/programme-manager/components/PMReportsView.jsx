import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Search,
  RotateCcw,
  Calendar,
  Layers,
  Users,
  FileText,
  Truck,
  Activity,
  Package,
  UserCheck,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

export function PMReportsView({
  requests = [],
  beneficiaries = [],
  distributions = [],
  programmes = [],
  resources = [],
  supervisors = [],
  feedback = [],
  activities = [],
  activeReportType = 'requests',
  onSelectReportType
}) {
  const [currentReportType, setCurrentReportType] = useState(activeReportType || 'requests');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProgramme, setFilterProgramme] = useState('ALL');
  const [filterState, setFilterState] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (activeReportType) {
      setCurrentReportType(activeReportType);
      setCurrentPage(1);
    }
  }, [activeReportType]);

  const reportTypes = [
    { id: 'requests', name: 'Assistance Requests', icon: FileText, count: requests.length },
    { id: 'beneficiaries', name: 'Beneficiary Registry', icon: Users, count: beneficiaries.length },
    { id: 'distributions', name: 'Aid Distributions', icon: Truck, count: distributions.length },
    { id: 'programmes', name: 'Programme Performance', icon: Layers, count: programmes.length },
    { id: 'activities', name: 'Field Activities', icon: Activity, count: activities.length },
    { id: 'resources', name: 'Resource Utilization', icon: Package, count: resources.length },
    { id: 'supervisors', name: 'Supervisor Performance', icon: UserCheck, count: supervisors.length },
    { id: 'feedback', name: 'Feedback & Accountability', icon: MessageSquare, count: feedback.length }
  ];

  const activeCategoryMeta = reportTypes.find(r => r.id === currentReportType) || reportTypes[0];

  const handleSwitchCategory = (typeId) => {
    setCurrentReportType(typeId);
    if (onSelectReportType) {
      onSelectReportType(typeId);
    }
    setCurrentPage(1);
  };

  // Helper to reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterProgramme('ALL');
    setFilterState('ALL');
    setFilterStatus('ALL');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || filterProgramme !== 'ALL' || filterState !== 'ALL' || filterStatus !== 'ALL' || startDate || endDate;

  // Filtered dataset calculation per active report type
  const filteredData = useMemo(() => {
    let dataset = [];

    if (currentReportType === 'requests') {
      dataset = requests.map(r => ({
        id: r.id,
        ref: `#${(r.id || '').slice(0, 8)}`,
        title: r.beneficiary_name || 'Beneficiary',
        programme: r.program_name || 'General Emergency',
        type: r.assistance_type || 'Relief Aid',
        quantity: r.quantity_requested || '1 Unit',
        state: r.state || 'Eastern Equatoria',
        county: r.county || 'Kapoeta South',
        date: r.created_at || new Date().toISOString(),
        status: r.status || 'Submitted',
        priority: r.priority || 'Normal'
      }));
    } else if (currentReportType === 'beneficiaries') {
      dataset = beneficiaries.map(b => ({
        id: b.id || b.individual_id,
        ref: `#${(b.id || b.individual_id || '').slice(0, 8)}`,
        title: b.full_name || b.name || 'Beneficiary',
        programme: b.state ? `${b.state} Registry` : 'General Registry',
        type: `${b.household_size || 5} Household Members`,
        state: b.state || 'Central Equatoria',
        county: b.county || 'Juba',
        date: b.created_at || '2026-01-15',
        status: b.status || 'Verified'
      }));
    } else if (currentReportType === 'distributions') {
      dataset = distributions.map(d => ({
        id: d.id,
        ref: `#${(d.id || '').slice(0, 8)}`,
        title: d.beneficiary_name || 'Recipient',
        programme: d.program_name || 'Emergency Aid',
        type: `${d.assistance_type} (${d.quantity})`,
        worker: d.field_worker || 'Field Team',
        state: d.state || 'Eastern Equatoria',
        date: d.distribution_date || d.created_at || new Date().toISOString(),
        status: d.status || 'Completed'
      }));
    } else if (currentReportType === 'programmes') {
      dataset = programmes.map(p => ({
        id: p.id,
        ref: p.code || `#PRG-${p.id}`,
        title: p.name,
        programme: p.sector || 'Humanitarian Response',
        type: p.donor || 'UNOCHA / USAID / ADRA',
        budget: p.budget ? `$${Number(p.budget).toLocaleString()}` : '$150,000',
        state: p.target_states?.join(', ') || 'All Regions',
        date: p.start_date || '2026-01-01',
        status: p.status || 'Active'
      }));
    } else if (currentReportType === 'activities') {
      dataset = activities.map(a => ({
        id: a.id,
        ref: `#${(a.id || '').slice(0, 8)}`,
        title: a.title || a.name || 'Field Operation',
        programme: a.program_name || 'Emergency Response',
        type: a.activity_type || 'Distribution & Monitoring',
        state: a.state || 'Jonglei',
        date: a.date || a.scheduled_date || new Date().toISOString(),
        status: a.status || 'In Progress'
      }));
    } else if (currentReportType === 'resources') {
      dataset = resources.map(res => ({
        id: res.id,
        ref: `#${(res.id || '').slice(0, 8)}`,
        title: res.name || 'Humanitarian Resource',
        programme: res.program_name || 'Logistics Depot',
        type: `${res.category || 'Supplies'} • ${res.quantity_available || 0} ${res.unit || 'units'} available`,
        state: res.warehouse || 'Juba Central Hub',
        date: res.last_updated || new Date().toISOString(),
        status: (res.quantity_available || 0) < 50 ? 'Low Stock' : 'Adequate'
      }));
    } else if (currentReportType === 'supervisors') {
      dataset = supervisors.map(s => ({
        id: s.id,
        ref: `#${(s.id || '').slice(0, 8)}`,
        title: s.name || 'Supervisor',
        programme: s.program_name || 'All Sectors',
        type: `${s.completed_tasks || 0} tasks done • ${s.active_tasks || 0} active`,
        state: s.assigned_area || 'Central Equatoria',
        date: s.last_active || new Date().toISOString(),
        status: s.status || 'Active'
      }));
    } else if (currentReportType === 'feedback') {
      dataset = feedback.map(fb => ({
        id: fb.id,
        ref: `#${(fb.id || '').slice(0, 8)}`,
        title: fb.subject || fb.title || 'Community Ticket',
        programme: fb.program_name || 'Accountability (AAP)',
        type: fb.category || 'Service Feedback',
        state: fb.location || 'Eastern Equatoria',
        date: fb.created_at || new Date().toISOString(),
        status: fb.status || 'Resolved'
      }));
    }

    // Apply Live Filters
    return dataset.filter(item => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title?.toLowerCase()?.includes(q);
        const matchProg = item.programme?.toLowerCase()?.includes(q);
        const matchType = item.type?.toLowerCase()?.includes(q);
        const matchRef = item.ref?.toLowerCase()?.includes(q);
        if (!matchTitle && !matchProg && !matchType && !matchRef) return false;
      }
      // Programme Filter
      if (filterProgramme !== 'ALL' && !item.programme?.toLowerCase()?.includes(filterProgramme.toLowerCase())) {
        return false;
      }
      // State Filter
      if (filterState !== 'ALL' && !item.state?.toLowerCase()?.includes(filterState.toLowerCase())) {
        return false;
      }
      // Status Filter
      if (filterStatus !== 'ALL' && item.status?.toLowerCase() !== filterStatus.toLowerCase()) {
        return false;
      }
      // Dates
      if (startDate && new Date(item.date) < new Date(startDate)) return false;
      if (endDate && new Date(item.date) > new Date(endDate + 'T23:59:59')) return false;

      return true;
    });
  }, [currentReportType, requests, beneficiaries, distributions, programmes, resources, supervisors, feedback, activities, searchQuery, filterProgramme, filterState, filterStatus, startDate, endDate]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage]);

  // Export to CSV
  const handleExportCSV = () => {
    let rows = [];
    const filename = `ADRA_SS_${currentReportType}_report_${new Date().toISOString().slice(0, 10)}.csv`;

    rows.push(['Reference ID', 'Title/Beneficiary', 'Programme/Portfolio', 'Category/Details', 'Location/State', 'Date', 'Status']);
    filteredData.forEach(item => {
      rows.push([
        item.id,
        item.title,
        item.programme,
        item.type,
        item.state,
        item.date,
        item.status
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(x => `"${(x || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status = '') => {
    const s = status.toLowerCase();
    if (s === 'approved' || s === 'completed' || s === 'verified' || s === 'resolved' || s === 'active' || s === 'adequate') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    }
    if (s === 'submitted' || s === 'pending' || s === 'low stock' || s === 'in progress') {
      return 'bg-amber-50 text-amber-700 border-amber-200/80';
    }
    if (s === 'rejected' || s === 'cancelled') {
      return 'bg-rose-50 text-rose-700 border-rose-200/80';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const ActiveIcon = activeCategoryMeta.icon;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-16 animate-in fade-in duration-150">
      
      {/* 1. TOP HEADER & EXPORT ACTIONS */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#006B56]">
              <ActiveIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>{activeCategoryMeta.name}</span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
                  {activeCategoryMeta.count} records
                </span>
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Generate certified donor-ready outputs and operational audit summaries.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Selector Dropdown if desired */}
          <div className="relative">
            <select
              value={currentReportType}
              onChange={(e) => handleSwitchCategory(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer transition shadow-2xs"
            >
              {reportTypes.map(rt => (
                <option key={rt.id} value={rt.id}>
                  {rt.name} ({rt.count})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100/80 text-[#006B56] border border-emerald-200/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-98 shadow-2xs cursor-pointer"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-98 shadow-2xs cursor-pointer"
            title="Print or Export PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* 2. CLEAN SMART FILTER BAR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
          
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search records, beneficiaries, IDs..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-[#006B56] transition"
            />
          </div>

          {/* Programme Filter */}
          <div>
            <select
              value={filterProgramme}
              onChange={(e) => { setFilterProgramme(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-[#006B56] transition"
            >
              <option value="ALL">All Programmes</option>
              {programmes.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* State Filter */}
          <div>
            <select
              value={filterState}
              onChange={(e) => { setFilterState(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-[#006B56] transition"
            >
              <option value="ALL">All States</option>
              <option value="Eastern Equatoria">Eastern Equatoria</option>
              <option value="Central Equatoria">Central Equatoria</option>
              <option value="Jonglei">Jonglei</option>
              <option value="Unity">Unity</option>
              <option value="Upper Nile">Upper Nile</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-[#006B56] transition"
            >
              <option value="ALL">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Verified">Verified</option>
            </select>
          </div>

        </div>

        {/* Second Row: Date range & Active Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Range:</span>
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-[#006B56]"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-[#006B56]"
            />
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900 font-bold">{filteredData.length}</strong> certified records
          </div>
        </div>
      </div>

      {/* 3. LIVE PREVIEW TABLE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        
        {/* Table Subheader */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-black text-slate-900 text-sm">
              Live Preview: {activeCategoryMeta.name}
            </h3>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
            <ShieldCheck className="w-3 h-3 text-[#006B56]" />
            <span>Audit Ref: ADRA-SSD-AUD-2026</span>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {paginatedData.length > 0 ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Ref ID</th>
                  <th className="py-3 px-4">Title / Beneficiary</th>
                  <th className="py-3 px-4">Programme Portfolio</th>
                  <th className="py-3 px-4">Details / Output</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-50/70 transition">
                    
                    {/* Shortened Ref ID */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/70 text-[11px]" title={row.id}>
                        {row.ref}
                      </span>
                    </td>

                    {/* Title */}
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="max-w-[200px] truncate" title={row.title}>
                        {row.title}
                      </div>
                    </td>

                    {/* Programme */}
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      <div className="max-w-[220px] truncate" title={row.programme}>
                        {row.programme}
                      </div>
                    </td>

                    {/* Details */}
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      <div className="max-w-[240px] truncate" title={row.type}>
                        {row.type}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 text-slate-500">
                      <div className="truncate max-w-[140px]">
                        {row.state}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(row.date)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(row.status)}`}>
                        {row.status}
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-10 text-center space-y-2">
              <FileText className="w-8 h-8 mx-auto text-slate-300" />
              <h4 className="text-sm font-bold text-slate-800">No records found</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No matching records for this report category with the currently applied filters.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear All Filters</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 4. TABLE PAGINATION */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50/50">
            <span className="text-slate-500 font-medium">
              Page <strong className="text-slate-900 font-bold">{currentPage}</strong> of <strong className="text-slate-900 font-bold">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
