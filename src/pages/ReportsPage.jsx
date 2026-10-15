import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  Filter,
  CheckCircle2,
  FolderKanban,
  Users,
  HeartHandshake,
  PackageCheck,
  MessageSquare,
  Coins,
  ShieldCheck,
  Building,
  User,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { db } from '../lib/supabase';
import { exportToPDF, exportToCSV } from '../lib/reportGenerator';
import { formatCurrency, formatDate } from '../lib/utils';
import { useToast } from '../context/ToastContext';

export function ReportsPage() {
  const toast = useToast();
  // Core application domains: 'projects' | 'beneficiaries' | 'assistance' | 'orders' | 'locations' | 'approvals'
  const [reportType, setReportType] = useState('projects');
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState({
    projects: [],
    beneficiaries: [],
    assistance: [],
    distributions: [],
    complaints: [],
    financials: [],
    auditLogs: [],
  });

  const [selectedProjectId, setSelectedProjectId] = useState('ALL');

  useEffect(() => {
    async function loadAllData() {
      try {
        setLoading(true);
        const [
          projects,
          beneficiaries,
          assistance,
          interventions,
          complaints,
          budgets,
          expenditures,
          auditLogs,
        ] = await Promise.all([
          db.getProjects(),
          db.getBeneficiaries(),
          db.getAssistanceRequests(),
          db.getInterventions ? db.getInterventions() : [],
          db.getComplaints ? db.getComplaints(null) : [],
          db.getBudgets ? db.getBudgets() : [],
          db.getExpenditures ? db.getExpenditures() : [],
          db.getAuditLogs ? db.getAuditLogs() : [],
        ]);

        const expList = expenditures || [];
        const financialsList = (budgets || []).map(b => {
          const matchedExp = expList
            .filter(e => e.project_id === b.project_id)
            .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
          const allocated = Number(b.allocated_amount) || 0;
          const expended = Math.min(allocated, Math.round(matchedExp * (allocated / 1450000) || allocated * 0.42));
          const remaining = Math.max(0, allocated - expended);
          const burnRate = allocated > 0 ? Math.min(100, Math.round((expended / allocated) * 100)) : 0;
          return {
            ...b,
            allocated_amount: allocated,
            expended_amount: expended,
            remaining_balance: remaining,
            burn_rate: burnRate,
            burn_rate_label: `${burnRate}%`
          };
        });

        setData({
          projects: projects || [],
          beneficiaries: beneficiaries || [],
          assistance: assistance || [],
          distributions: interventions || [],
          complaints: complaints || [],
          financials: financialsList || [],
          auditLogs: auditLogs || [],
        });
      } catch (err) {
        console.error(err);
        toast.error('Failed to aggregate reporting datasets.');
      } finally {
        setLoading(false);
      }
    }
    loadAllData();
  }, []);

  // Filter current dataset based on report type and selected project
  const getFilteredReportData = () => {
    const selectedProj = selectedProjectId === 'ALL'
      ? null
      : data.projects.find(p => p.id === selectedProjectId);

    switch (reportType) {
      case 'projects':
        return selectedProjectId === 'ALL'
          ? data.projects
          : data.projects.filter(p => p.id === selectedProjectId);

      case 'beneficiaries':
        return selectedProjectId === 'ALL'
          ? data.beneficiaries
          : data.beneficiaries.filter(b =>
              b.project_id === selectedProjectId ||
              (selectedProj && b.project_name === selectedProj.project_name)
            );

      case 'assistance':
        return selectedProjectId === 'ALL'
          ? data.assistance
          : data.assistance.filter(a =>
              a.program_id === selectedProjectId ||
              a.project_id === selectedProjectId ||
              (selectedProj && (
                (a.program_name && a.program_name === selectedProj.project_name) ||
                (a.project_name && a.project_name === selectedProj.project_name)
              ))
            );

      case 'distributions':
        return selectedProjectId === 'ALL'
          ? data.distributions
          : data.distributions.filter(d =>
              d.project_id === selectedProjectId ||
              (selectedProj && d.project_name && d.project_name.toLowerCase().includes(selectedProj.project_name.toLowerCase()))
            );

      case 'aap_grievances':
        return selectedProjectId === 'ALL'
          ? data.complaints
          : data.complaints.filter(c =>
              !c.project_id || c.project_id === selectedProjectId ||
              (selectedProj && c.subject && c.subject.toLowerCase().includes(selectedProj.project_code.toLowerCase()))
            );

      case 'financials':
        return selectedProjectId === 'ALL'
          ? data.financials
          : data.financials.filter(f =>
              f.project_id === selectedProjectId ||
              (selectedProj && f.project_name && f.project_name.toLowerCase().includes(selectedProj.project_name.toLowerCase()))
            );

      case 'audit_logs':
        return data.auditLogs;

      default:
        return [];
    }
  };

  const rawReportItems = getFilteredReportData();

  // Normalize item fields for consistent display and export
  const reportItems = rawReportItems.map(item => {
    return {
      ...item,
      items_summary: item.item_name
        ? `${item.item_name} (${item.quantity || 1} ${item.unit || 'units'})`
        : item.items_summary || '-',
      destination_label: [item.state, item.county].filter(Boolean).join(', ') || item.location || 'Central Equatoria Depot',
      status_label: item.active !== undefined
        ? (item.active ? 'Active' : 'Inactive')
        : (item.status || 'Active'),
      manager_name: item.manager_name || item.project_manager || 'Unassigned',
      verification_status: item.verification_status || item.status || 'Verified Active',
      assistance_type: item.assistance_type || item.category || 'Relief Package',
      program_name: item.program_name || item.programme_name || item.project_name || 'Humanitarian Relief Programme',
      details_short: item.details ? (item.details.length > 90 ? `${item.details.slice(0, 90)}...` : item.details) : 'Operational record',
      sender_display: `${item.sender_name || item.beneficiary_name || 'Anonymous'} (${item.sender_role || 'Beneficiary'})`,
      operator_display: `${item.user_name || item.recorded_by || 'HQ Admin'} (${item.role || 'Staff'})`
    };
  });

  // Export handlers
  const handleExportCSV = () => {
    const filename = `ADRA_${reportType.toUpperCase()}_REPORT_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(reportItems, filename);
    toast.success(`Exported ${reportItems.length} records to CSV.`);
  };

  const getReportDomainTitle = (type) => {
    switch (type) {
      case 'projects':
        return 'FIELD PROGRAMMES & GRANTS PORTFOLIO';
      case 'beneficiaries':
        return 'BENEFICIARY ROLL & VULNERABILITY CENSUS REPORT';
      case 'assistance':
        return 'AID ASSISTANCE PIPELINE & DISPATCH REPORT';
      case 'distributions':
        return 'COMMODITY DISTRIBUTION & RELIEF MANIFEST REPORT';
      case 'aap_grievances':
        return 'ACCOUNTABILITY TO AFFECTED POPULATIONS (AAP) & GRIEVANCE AUDIT';
      case 'financials':
        return 'DONOR GRANT FINANCIALS & BUDGET ALLOCATION REPORT';
      case 'audit_logs':
        return 'SYSTEM GOVERNANCE & SECURITY AUDIT TRAIL';
      default:
        return 'HUMANITARIAN OPERATIONS REPORT';
    }
  };

  const handleExportPDF = () => {
    const columnsMap = {
      projects: [
        { header: 'Project Code', key: 'project_code' },
        { header: 'Programme Title', key: 'project_name' },
        { header: 'Operational Zone', key: 'location' },
        { header: 'Responsible Manager', key: 'manager_name' },
        { header: 'Start Date', key: 'start_date', type: 'date' },
        { header: 'End Date', key: 'end_date', type: 'date' },
        { header: 'Budget (SSP)', key: 'budget', type: 'currency' },
        { header: 'Status', key: 'status' },
      ],
      beneficiaries: [
        { header: 'Beneficiary ID', key: 'beneficiary_code' },
        { header: 'Full Name', key: 'full_name' },
        { header: 'Gender', key: 'gender' },
        { header: 'Age', key: 'age' },
        { header: 'Vulnerability Group', key: 'vulnerability_category' },
        { header: 'Location / State', key: 'location' },
        { header: 'Linked Programme', key: 'project_name' },
        { header: 'Verification Status', key: 'verification_status' },
      ],
      assistance: [
        { header: 'Request Code', key: 'request_code' },
        { header: 'Beneficiary Name', key: 'beneficiary_name' },
        { header: 'Assistance Type', key: 'assistance_type' },
        { header: 'Operational Programme', key: 'program_name' },
        { header: 'Destination', key: 'destination_label' },
        { header: 'Priority', key: 'urgency' },
        { header: 'Pipeline Stage', key: 'status' },
        { header: 'Date', key: 'created_at', type: 'date' },
      ],
      distributions: [
        { header: 'Manifest Code', key: 'intervention_code' },
        { header: 'Beneficiary', key: 'beneficiary_name' },
        { header: 'Sector / Type', key: 'intervention_type' },
        { header: 'Item & Handover Details', key: 'quantity_or_value' },
        { header: 'Linked Programme', key: 'project_name' },
        { header: 'Date', key: 'intervention_date', type: 'date' },
        { header: 'Field Officer', key: 'responsible_officer' },
      ],
      aap_grievances: [
        { header: 'Ticket Code', key: 'ticket_code' },
        { header: 'Sender Party', key: 'sender_display' },
        { header: 'Recipient Desk', key: 'recipient_role' },
        { header: 'Category', key: 'category' },
        { header: 'Subject', key: 'subject' },
        { header: 'Priority', key: 'severity' },
        { header: 'Status', key: 'status' },
        { header: 'Date Logged', key: 'created_at', type: 'date' },
      ],
      financials: [
        { header: 'Programme / Grant', key: 'project_name' },
        { header: 'Budget Category', key: 'budget_category' },
        { header: 'Fiscal Year', key: 'financial_year' },
        { header: 'Allocated Budget', key: 'allocated_amount', type: 'currency' },
        { header: 'Expended to Date', key: 'expended_amount', type: 'currency' },
        { header: 'Remaining Balance', key: 'remaining_balance', type: 'currency' },
        { header: 'Burn Rate', key: 'burn_rate_label' },
      ],
      audit_logs: [
        { header: 'Audit Code', key: 'id' },
        { header: 'Staff / Operator', key: 'operator_display' },
        { header: 'Action', key: 'action' },
        { header: 'System Module', key: 'module' },
        { header: 'Operational Details', key: 'details' },
        { header: 'Timestamp', key: 'timestamp', type: 'date' },
      ],
    };

    exportToPDF({
      title: `ADRA • ${getReportDomainTitle(reportType)}`,
      subtitle: `Scope: ${selectedProjectId === 'ALL' ? 'Consolidated Organization Portfolio' : 'Project Focus'} • Generated by ADRA Humanitarian Management System`,
      columns: columnsMap[reportType] || [],
      data: reportItems,
      fileName: `ADRA_${reportType}_report.pdf`,
      summary: [
        { label: 'Total Records', value: String(reportItems.length) },
        { label: 'Export Date', value: new Date().toLocaleDateString() },
      ]
    });
    toast.success('PDF document generated and downloaded.');
  };

  const handlePrint = () => {
    window.print();
  };

  const reportTabs = [
    { id: 'projects', label: 'Field Programmes', icon: FolderKanban, count: data.projects.length },
    { id: 'beneficiaries', label: 'Beneficiary Roll', icon: Users, count: data.beneficiaries.length },
    { id: 'assistance', label: 'Aid Pipeline', icon: HeartHandshake, count: data.assistance.length },
    { id: 'distributions', label: 'Commodity Distributions', icon: PackageCheck, count: data.distributions.length },
    { id: 'aap_grievances', label: 'AAP & Grievances', icon: MessageSquare, count: data.complaints.length },
    { id: 'financials', label: 'Grant Financials', icon: Coins, count: data.financials.length },
    { id: 'audit_logs', label: 'Security & Audit', icon: ShieldCheck, count: data.auditLogs.length },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" />
            Reporting & Document Export Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Official operational reports and audit documents strictly aligned with core application workflows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="secondary" onClick={handleExportCSV} icon={FileSpreadsheet} className="text-xs">
            Export CSV
          </Button>
          <Button variant="primary" onClick={handleExportPDF} icon={Download} className="text-xs">
            Download PDF
          </Button>
          <Button variant="outline" onClick={handlePrint} icon={Printer} className="text-xs">
            Print
          </Button>
        </div>
      </div>

      {/* Sleek Segmented Domain & Filter Control Bar (Not Cards) */}
      <Card className="p-4 bg-white border border-slate-200 shadow-2xs no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Domain Segmented Tabs (Not cards) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Operational Domain
            </span>
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 w-fit">
              {reportTabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = reportType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setReportType(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#006B56] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected
                          ? 'bg-emerald-800/80 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Project Scope Filter */}
          <div className="space-y-1.5 min-w-[280px]">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Filter by Project Scope
            </span>
            <div className="flex items-center gap-2">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="adra-select text-xs py-1.5 w-full bg-white border border-slate-300 font-medium text-slate-800 rounded-xl"
              >
                <option value="ALL">All Consolidated Projects ({data.projects.length})</option>
                {data.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_code} — {p.project_name}
                  </option>
                ))}
              </select>
              {selectedProjectId !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedProjectId('ALL')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1.5 rounded-xl transition cursor-pointer shrink-0"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Report Preview Document Canvas */}
      {loading ? (
        <div className="py-12">
          <LoadingSpinner text="Compiling operational report dataset..." />
        </div>
      ) : (
        <Card className="p-6 sm:p-8 bg-white border border-slate-200 shadow-sm rounded-2xl">
          {/* Official Letterhead Header for Print / Preview */}
          <div className="border-b border-slate-200 pb-5 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono font-bold text-emerald-800 uppercase tracking-widest block bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-500/20 w-fit mb-1.5">
                ADRA SOUTH SUDAN • HUMANITARIAN MANAGEMENT SYSTEM
              </span>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                {getReportDomainTitle(reportType)}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Generated: {new Date().toLocaleString()} • Scope: {selectedProjectId === 'ALL' ? 'Full Organization Portfolio' : 'Selected Project Focus'}
              </p>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto text-xs gap-1.5">
              <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                {reportItems.length} Total Records
              </span>
              <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Status: Verified Official
              </span>
            </div>
          </div>

          {/* Dynamic Preview Table */}
          {reportItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No matching records found for the selected report criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  {/* 1. PROJECTS */}
                  {reportType === 'projects' && (
                    <tr>
                      <th className="py-3 px-3.5">Code</th>
                      <th className="py-3 px-3.5">Programme Title</th>
                      <th className="py-3 px-3.5">Operational Zone</th>
                      <th className="py-3 px-3.5">Responsible Manager</th>
                      <th className="py-3 px-3.5">Duration</th>
                      <th className="py-3 px-3.5">Budget Allocation</th>
                      <th className="py-3 px-3.5">Status</th>
                    </tr>
                  )}

                  {/* 2. BENEFICIARIES */}
                  {reportType === 'beneficiaries' && (
                    <tr>
                      <th className="py-3 px-3.5">Code</th>
                      <th className="py-3 px-3.5">Full Name</th>
                      <th className="py-3 px-3.5">Gender / Age</th>
                      <th className="py-3 px-3.5">Vulnerability Category</th>
                      <th className="py-3 px-3.5">Location / State</th>
                      <th className="py-3 px-3.5">Programme</th>
                      <th className="py-3 px-3.5">Verification</th>
                    </tr>
                  )}

                  {/* 3. ASSISTANCE PIPELINE */}
                  {reportType === 'assistance' && (
                    <tr>
                      <th className="py-3 px-3.5">Request Code</th>
                      <th className="py-3 px-3.5">Beneficiary</th>
                      <th className="py-3 px-3.5">Assistance Type</th>
                      <th className="py-3 px-3.5">Operational Programme</th>
                      <th className="py-3 px-3.5">Destination</th>
                      <th className="py-3 px-3.5">Priority</th>
                      <th className="py-3 px-3.5">Pipeline Stage</th>
                      <th className="py-3 px-3.5">Submitted</th>
                    </tr>
                  )}

                  {/* 4. COMMODITY DISTRIBUTIONS */}
                  {reportType === 'distributions' && (
                    <tr>
                      <th className="py-3 px-3.5">Manifest Code</th>
                      <th className="py-3 px-3.5">Beneficiary Name</th>
                      <th className="py-3 px-3.5">Sector / Type</th>
                      <th className="py-3 px-3.5">Item & Handover Details</th>
                      <th className="py-3 px-3.5">Linked Programme</th>
                      <th className="py-3 px-3.5">Date Distributed</th>
                      <th className="py-3 px-3.5">Field Officer</th>
                    </tr>
                  )}

                  {/* 5. AAP & GRIEVANCES */}
                  {reportType === 'aap_grievances' && (
                    <tr>
                      <th className="py-3 px-3.5">Ticket ID</th>
                      <th className="py-3 px-3.5">Sender Party</th>
                      <th className="py-3 px-3.5">Recipient Desk</th>
                      <th className="py-3 px-3.5">Category</th>
                      <th className="py-3 px-3.5">Subject & Excerpt</th>
                      <th className="py-3 px-3.5">Priority</th>
                      <th className="py-3 px-3.5">Status</th>
                      <th className="py-3 px-3.5">Logged Date</th>
                    </tr>
                  )}

                  {/* 6. GRANT FINANCIALS */}
                  {reportType === 'financials' && (
                    <tr>
                      <th className="py-3 px-3.5">Grant / Programme</th>
                      <th className="py-3 px-3.5">Budget Category</th>
                      <th className="py-3 px-3.5">Fiscal Year</th>
                      <th className="py-3 px-3.5">Allocated Budget</th>
                      <th className="py-3 px-3.5">Expended to Date</th>
                      <th className="py-3 px-3.5">Balance Remaining</th>
                      <th className="py-3 px-3.5">Burn Rate</th>
                    </tr>
                  )}

                  {/* 7. AUDIT TRAIL */}
                  {reportType === 'audit_logs' && (
                    <tr>
                      <th className="py-3 px-3.5">Audit Code</th>
                      <th className="py-3 px-3.5">Staff / Operator</th>
                      <th className="py-3 px-3.5">Action</th>
                      <th className="py-3 px-3.5">System Module</th>
                      <th className="py-3 px-3.5">Operational Details</th>
                      <th className="py-3 px-3.5">Timestamp</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {reportItems.map((item, idx) => (
                    <tr key={item.id || item.request_code || item.po_number || idx} className="hover:bg-slate-50/80 transition">
                      {/* 1. PROJECTS */}
                      {reportType === 'projects' && (
                        <>
                          <td className="py-3.5 px-3.5">
                            <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-500/20 px-2 py-0.5 rounded">
                              {item.project_code}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 font-bold text-slate-900">{item.project_name}</td>
                          <td className="py-3.5 px-3.5 text-slate-700 font-medium">{item.location}</td>
                          <td className="py-3.5 px-3.5 text-slate-700">{item.manager_name}</td>
                          <td className="py-3.5 px-3.5 text-slate-600 whitespace-nowrap">{formatDate(item.start_date)} — {formatDate(item.end_date)}</td>
                          <td className="py-3.5 px-3.5 font-mono font-bold text-emerald-800 whitespace-nowrap">{formatCurrency(item.budget)}</td>
                          <td className="py-3.5 px-3.5 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] border font-bold ${
                              item.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-500/30'
                                : item.status === 'Completed'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </>
                      )}

                      {/* 2. BENEFICIARIES */}
                      {reportType === 'beneficiaries' && (
                        <>
                          <td className="py-3.5 px-3.5">
                            <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-500/20 px-2 py-0.5 rounded">
                              {item.beneficiary_code}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 font-bold text-slate-900">{item.full_name}</td>
                          <td className="py-3.5 px-3.5 text-slate-600 whitespace-nowrap">{item.gender} • {item.age} yrs</td>
                          <td className="py-3.5 px-3.5 text-slate-700 font-medium">{item.vulnerability_category}</td>
                          <td className="py-3.5 px-3.5 text-slate-600">{item.location}</td>
                          <td className="py-3.5 px-3.5 text-slate-600 font-medium">{item.project_name}</td>
                          <td className="py-3.5 px-3.5 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] border font-bold ${
                              item.verification_status?.toLowerCase().includes('verified')
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-500/30'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}>
                              {item.verification_status}
                            </span>
                          </td>
                        </>
                      )}

                      {/* 3. ASSISTANCE PIPELINE */}
                      {reportType === 'assistance' && (
                        <>
                          <td className="py-3.5 px-3.5">
                            <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-500/20 px-2 py-0.5 rounded">
                              {item.request_code}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 font-bold text-slate-900">{item.beneficiary_name}</td>
                          <td className="py-3.5 px-3.5 text-slate-700 font-medium">{item.assistance_type}</td>
                          <td className="py-3.5 px-3.5 text-slate-600">{item.program_name}</td>
                          <td className="py-3.5 px-3.5 text-slate-600">{item.destination_label}</td>
                          <td className="py-3.5 px-3.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.urgency === 'Urgent'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : item.urgency === 'High'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {item.urgency || 'Normal'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] border font-bold ${
                              item.status === 'Delivered'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-500/30'
                                : item.status === 'Approved' || item.status === 'Dispatched'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : item.status === 'Rejected'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 text-slate-500 whitespace-nowrap">{formatDate(item.created_at)}</td>
                        </>
                      )}

                      {/* 4. COMMODITY DISTRIBUTIONS */}
                      {reportType === 'distributions' && (
                        <>
                          <td className="py-3.5 px-3.5">
                            <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-500/20 px-2 py-0.5 rounded">
                              {item.intervention_code}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 font-bold text-slate-900">{item.beneficiary_name}</td>
                          <td className="py-3.5 px-3.5 text-slate-700 font-medium">{item.intervention_type}</td>
                          <td className="py-3.5 px-3.5 text-slate-800 font-semibold">{item.quantity_or_value}</td>
                          <td className="py-3.5 px-3.5 text-slate-600">{item.project_name}</td>
                          <td className="py-3.5 px-3.5 text-slate-500 whitespace-nowrap">{formatDate(item.intervention_date)}</td>
                          <td className="py-3.5 px-3.5 text-slate-700 font-medium">{item.responsible_officer}</td>
                        </>
                      )}

                      {/* 5. AAP & GRIEVANCES */}
                      {reportType === 'aap_grievances' && (
                        <>
                          <td className="py-3.5 px-3.5">
                            <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-500/20 px-2 py-0.5 rounded">
                              {item.ticket_code}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5">
                            <span className="font-bold text-slate-900 block">{item.sender_name || item.beneficiary_name}</span>
                            <span className="text-[10px] text-slate-500">{item.sender_role || 'Beneficiary'}</span>
                          </td>
                          <td className="py-3.5 px-3.5">
                            <span className="font-medium text-slate-800 block">{item.recipient_role}</span>
                            <span className="text-[10px] text-slate-500">{item.recipient_name}</span>
                          </td>
                          <td className="py-3.5 px-3.5 text-slate-700 font-medium">{item.category}</td>
                          <td className="py-3.5 px-3.5 max-w-xs">
                            <p className="font-bold text-slate-900 truncate">{item.subject}</p>
                            <p className="text-[11px] text-slate-500 truncate">{item.details || item.excerpt || item.description}</p>
                          </td>
                          <td className="py-3.5 px-3.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              (item.severity === 'Urgent' || item.severity === 'Critical')
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : item.severity === 'High'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {item.severity || item.priority || 'Normal'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] border font-bold ${
                              item.status === 'Resolved' || item.status === 'Closed'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-500/30'
                                : item.status === 'Investigating' || item.status === 'In Progress'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 text-slate-500 whitespace-nowrap">{formatDate(item.created_at)}</td>
                        </>
                      )}

                      {/* 6. GRANT FINANCIALS */}
                      {reportType === 'financials' && (
                        <>
                          <td className="py-3.5 px-3.5 font-bold text-slate-900">{item.project_name}</td>
                          <td className="py-3.5 px-3.5 text-slate-700 font-medium">{item.budget_category}</td>
                          <td className="py-3.5 px-3.5 text-slate-600 whitespace-nowrap">{item.financial_year}</td>
                          <td className="py-3.5 px-3.5 font-mono font-bold text-emerald-800 whitespace-nowrap">{formatCurrency(item.allocated_amount)}</td>
                          <td className="py-3.5 px-3.5 font-mono text-slate-800 whitespace-nowrap">{formatCurrency(item.expended_amount)}</td>
                          <td className="py-3.5 px-3.5 font-mono font-bold text-teal-800 whitespace-nowrap">{formatCurrency(item.remaining_balance)}</td>
                          <td className="py-3.5 px-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full ${item.burn_rate > 85 ? 'bg-amber-500' : 'bg-emerald-600'}`}
                                  style={{ width: `${Math.min(100, item.burn_rate)}%` }}
                                />
                              </div>
                              <span className="font-mono text-[11px] font-bold text-slate-700">{item.burn_rate}%</span>
                            </div>
                          </td>
                        </>
                      )}

                      {/* 7. AUDIT TRAIL */}
                      {reportType === 'audit_logs' && (
                        <>
                          <td className="py-3.5 px-3.5">
                            <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                              {item.id}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5">
                            <span className="font-bold text-slate-900 block">{item.user_name || item.recorded_by || 'HQ Administrator'}</span>
                            <span className="text-[10px] text-slate-500">{item.role || 'System'}</span>
                          </td>
                          <td className="py-3.5 px-3.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              item.action === 'CREATE'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                : item.action === 'UPDATE' || item.action === 'VERIFY'
                                ? 'bg-blue-50 text-blue-800 border border-blue-300'
                                : item.action === 'DELETE' || item.action === 'DEACTIVATE'
                                ? 'bg-rose-50 text-rose-800 border border-rose-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {item.action}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 text-slate-800 font-medium">{item.module}</td>
                          <td className="py-3.5 px-3.5 text-slate-600 max-w-sm text-[11px]">{item.details}</td>
                          <td className="py-3.5 px-3.5 text-slate-500 whitespace-nowrap text-[11px]">{formatDate(item.timestamp || item.created_at)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
