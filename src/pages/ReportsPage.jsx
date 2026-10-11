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
  Truck,
  MapPin,
  FileCheck,
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
    orders: [],
    locations: [],
    approvals: [],
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
          orders,
          locations,
          approvals,
        ] = await Promise.all([
          db.getProjects(),
          db.getBeneficiaries(),
          db.getAssistanceRequests(),
          db.getPurchaseOrders ? db.getPurchaseOrders() : [],
          db.getLocations(),
          db.getApprovals ? db.getApprovals('ALL') : [],
        ]);

        setData({
          projects: projects || [],
          beneficiaries: beneficiaries || [],
          assistance: assistance || [],
          orders: orders || [],
          locations: locations || [],
          approvals: approvals || [],
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

      case 'orders':
        return selectedProjectId === 'ALL'
          ? data.orders
          : data.orders.filter(o =>
              o.project_id === selectedProjectId ||
              (selectedProj && o.warehouse_destination && selectedProj.location &&
                o.warehouse_destination.toLowerCase().includes(selectedProj.location.toLowerCase()))
            );

      case 'locations':
        return data.locations;

      case 'approvals':
        return selectedProjectId === 'ALL'
          ? data.approvals
          : data.approvals.filter(app =>
              (selectedProj && (
                (app.details && app.details.toLowerCase().includes(selectedProj.project_code.toLowerCase())) ||
                (app.details && app.details.toLowerCase().includes(selectedProj.project_name.toLowerCase()))
              ))
            );

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
      details_short: item.details ? (item.details.length > 90 ? `${item.details.slice(0, 90)}...` : item.details) : 'Operational record'
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
      case 'orders':
        return 'SUPPLY CHAIN & PURCHASE ORDERS AUDIT';
      case 'locations':
        return 'OPERATIONAL LOCATIONS & LOGISTICS HUBS DIRECTORY';
      case 'approvals':
        return 'GOVERNANCE & OPERATIONAL APPROVAL AUDIT';
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
      orders: [
        { header: 'PO Number', key: 'po_number' },
        { header: 'Supplier Name', key: 'supplier_name' },
        { header: 'Items & Quantity', key: 'items_summary' },
        { header: 'Destination Depot', key: 'destination_warehouse' },
        { header: 'Total Value (SSP)', key: 'total_amount', type: 'currency' },
        { header: 'Order Date', key: 'order_date', type: 'date' },
        { header: 'Fulfillment Stage', key: 'status' },
      ],
      locations: [
        { header: 'Location Name', key: 'name' },
        { header: 'Classification', key: 'type' },
        { header: 'State / Province', key: 'state' },
        { header: 'County / District', key: 'county' },
        { header: 'Community / Camp', key: 'community' },
        { header: 'Contact', key: 'contact' },
        { header: 'Status', key: 'status_label' },
      ],
      approvals: [
        { header: 'Ref Code', key: 'id' },
        { header: 'Category', key: 'category' },
        { header: 'Requester', key: 'requester_name' },
        { header: 'Department', key: 'department' },
        { header: 'Details', key: 'details_short' },
        { header: 'Priority', key: 'priority' },
        { header: 'Decision Status', key: 'status' },
        { header: 'Submitted Date', key: 'created_at', type: 'date' },
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
    { id: 'assistance', label: 'Aid Pipeline & Requests', icon: HeartHandshake, count: data.assistance.length },
    { id: 'orders', label: 'Purchase Orders & Supplies', icon: Truck, count: data.orders.length },
    { id: 'locations', label: 'Operational Locations', icon: MapPin, count: data.locations.length },
    { id: 'approvals', label: 'Governance & Approvals', icon: FileCheck, count: data.approvals.length },
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

      {/* Filter Controls Bar */}
      <Card className="p-5 bg-white border border-slate-200 shadow-2xs no-print">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Select Operational Domain
            </label>
            <div className="flex flex-wrap gap-2">
              {reportTabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = reportType === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setReportType(tab.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-emerald-700/60 text-white' : 'bg-slate-200/70 text-slate-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Filter by Project Scope
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="adra-select text-xs py-2.5 w-full bg-white border border-slate-300 font-medium text-slate-800 rounded-xl"
            >
              <option value="ALL">All Consolidated Projects ({data.projects.length})</option>
              {data.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_code} — {p.project_name}
                </option>
              ))}
            </select>
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

                  {/* 4. PURCHASE ORDERS */}
                  {reportType === 'orders' && (
                    <tr>
                      <th className="py-3 px-3.5">PO Number</th>
                      <th className="py-3 px-3.5">Supplier</th>
                      <th className="py-3 px-3.5">Supplies & Qty</th>
                      <th className="py-3 px-3.5">Destination Depot</th>
                      <th className="py-3 px-3.5">Total Value (SSP)</th>
                      <th className="py-3 px-3.5">Order Date</th>
                      <th className="py-3 px-3.5">Fulfillment Stage</th>
                    </tr>
                  )}

                  {/* 5. LOCATIONS */}
                  {reportType === 'locations' && (
                    <tr>
                      <th className="py-3 px-3.5">Location Name</th>
                      <th className="py-3 px-3.5">Classification</th>
                      <th className="py-3 px-3.5">State / Province</th>
                      <th className="py-3 px-3.5">County / District</th>
                      <th className="py-3 px-3.5">Community / Camp</th>
                      <th className="py-3 px-3.5">Contact</th>
                      <th className="py-3 px-3.5">Status</th>
                    </tr>
                  )}

                  {/* 6. APPROVALS */}
                  {reportType === 'approvals' && (
                    <tr>
                      <th className="py-3 px-3.5">Ref Code</th>
                      <th className="py-3 px-3.5">Category</th>
                      <th className="py-3 px-3.5">Requester</th>
                      <th className="py-3 px-3.5">Department</th>
                      <th className="py-3 px-3.5">Details</th>
                      <th className="py-3 px-3.5">Priority</th>
                      <th className="py-3 px-3.5">Decision Status</th>
                      <th className="py-3 px-3.5">Submitted</th>
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

                      {/* 4. PURCHASE ORDERS */}
                      {reportType === 'orders' && (
                        <>
                          <td className="py-3.5 px-3.5">
                            <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-500/20 px-2 py-0.5 rounded">
                              {item.po_number}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 font-bold text-slate-900">{item.supplier_name}</td>
                          <td className="py-3.5 px-3.5 text-slate-700">{item.items_summary}</td>
                          <td className="py-3.5 px-3.5 text-slate-600">{item.destination_warehouse}</td>
                          <td className="py-3.5 px-3.5 font-mono font-bold text-emerald-800 whitespace-nowrap">{formatCurrency(item.total_amount)}</td>
                          <td className="py-3.5 px-3.5 text-slate-500 whitespace-nowrap">{formatDate(item.order_date || item.created_at)}</td>
                          <td className="py-3.5 px-3.5 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] border font-bold ${
                              item.status === 'Paid & Settled' || item.status === 'Goods Received & Confirmed'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-500/30'
                                : item.status === 'Supplied & In Transit'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </>
                      )}

                      {/* 5. LOCATIONS */}
                      {reportType === 'locations' && (
                        <>
                          <td className="py-3.5 px-3.5 font-bold text-slate-900 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            {item.name}
                          </td>
                          <td className="py-3.5 px-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-800 border border-slate-200 font-semibold">
                              {item.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 text-slate-800">{item.state}</td>
                          <td className="py-3.5 px-3.5 text-slate-800">{item.county} / {item.district || 'N/A'}</td>
                          <td className="py-3.5 px-3.5 text-slate-600">{item.community || 'Central'}</td>
                          <td className="py-3.5 px-3.5 font-mono text-[11px] text-slate-600">{item.contact || 'N/A'}</td>
                          <td className="py-3.5 px-3.5 whitespace-nowrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] border font-bold bg-emerald-50 text-emerald-800 border-emerald-500/30">
                              {item.status_label}
                            </span>
                          </td>
                        </>
                      )}

                      {/* 6. APPROVALS */}
                      {reportType === 'approvals' && (
                        <>
                          <td className="py-3.5 px-3.5">
                            <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-500/20 px-2 py-0.5 rounded">
                              {item.approval_code || item.id}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 font-semibold text-slate-800">{item.category}</td>
                          <td className="py-3.5 px-3.5 text-slate-900 font-medium">{item.requester_name}</td>
                          <td className="py-3.5 px-3.5 text-slate-600">{item.department || 'Operations'}</td>
                          <td className="py-3.5 px-3.5 text-slate-600 max-w-xs">{item.details_short}</td>
                          <td className="py-3.5 px-3.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.priority === 'Urgent'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {item.priority || 'Normal'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] border font-bold ${
                              item.status === 'Approved'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-500/30'
                                : item.status === 'Rejected'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 text-slate-500 whitespace-nowrap">{formatDate(item.created_at || item.submitted_date)}</td>
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
