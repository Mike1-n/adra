import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  Filter,
  Eye,
  CheckCircle2,
  Calendar,
  Layers,
  FolderKanban,
  Users,
  Activity,
  DollarSign,
  BarChart3,
  Building
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
  const [reportType, setReportType] = useState('projects'); // 'projects' | 'beneficiaries' | 'activities' | 'finance' | 'me'
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState({
    projects: [],
    beneficiaries: [],
    activities: [],
    interventions: [],
    indicators: [],
    expenditures: [],
  });

  const [selectedProjectId, setSelectedProjectId] = useState('ALL');

  useEffect(() => {
    async function loadAllData() {
      try {
        setLoading(true);
        const [
          projects,
          beneficiaries,
          activities,
          interventions,
          indicators,
          expenditures,
        ] = await Promise.all([
          db.getProjects(),
          db.getBeneficiaries(),
          db.getActivities(),
          db.getInterventions(),
          db.getIndicators(),
          db.getExpenditures(),
        ]);

        setData({
          projects,
          beneficiaries,
          activities,
          interventions,
          indicators,
          expenditures,
        });
      } catch (err) {
        toast.error('Failed to aggregate reporting datasets.');
      } finally {
        setLoading(false);
      }
    }
    loadAllData();
  }, []);

  // Filter current dataset based on report type and selected project
  const getFilteredReportData = () => {
    switch (reportType) {
      case 'projects':
        return selectedProjectId === 'ALL'
          ? data.projects
          : data.projects.filter(p => p.id === selectedProjectId);

      case 'beneficiaries':
        return selectedProjectId === 'ALL'
          ? data.beneficiaries
          : data.beneficiaries.filter(b => b.project_id === selectedProjectId);

      case 'activities':
        return selectedProjectId === 'ALL'
          ? data.activities
          : data.activities.filter(a => a.project_id === selectedProjectId);

      case 'finance':
        return selectedProjectId === 'ALL'
          ? data.expenditures
          : data.expenditures.filter(e => e.project_id === selectedProjectId);

      case 'me':
        return selectedProjectId === 'ALL'
          ? data.indicators
          : data.indicators.filter(i => i.project_id === selectedProjectId);

      default:
        return [];
    }
  };

  const reportItems = getFilteredReportData();

  // Export handlers
  const handleExportCSV = () => {
    const filename = `ADRA_${reportType.toUpperCase()}_REPORT_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(reportItems, filename);
    toast.success(`Exported ${reportItems.length} records to CSV.`);
  };

  const handleExportPDF = () => {
    const columnsMap = {
      projects: [
        { header: 'Project Code', key: 'project_code' },
        { header: 'Project Title', key: 'project_name' },
        { header: 'Location', key: 'location' },
        { header: 'Start Date', key: 'start_date', type: 'date' },
        { header: 'End Date', key: 'end_date', type: 'date' },
        { header: 'Budget ($)', key: 'budget', type: 'currency' },
        { header: 'Status', key: 'status' },
      ],
      beneficiaries: [
        { header: 'Beneficiary ID', key: 'beneficiary_code' },
        { header: 'Full Name', key: 'full_name' },
        { header: 'Gender', key: 'gender' },
        { header: 'Age', key: 'age' },
        { header: 'Vulnerability Group', key: 'vulnerability_category' },
        { header: 'Location', key: 'location' },
        { header: 'Linked Project', key: 'project_name' },
      ],
      activities: [
        { header: 'Code', key: 'activity_code' },
        { header: 'Activity Name', key: 'activity_name' },
        { header: 'Project', key: 'project_name' },
        { header: 'Date', key: 'activity_date', type: 'date' },
        { header: 'Location', key: 'location' },
        { header: 'Status', key: 'status' },
      ],
      finance: [
        { header: 'Voucher #', key: 'expenditure_code' },
        { header: 'Category', key: 'category' },
        { header: 'Description', key: 'description' },
        { header: 'Project', key: 'project_name' },
        { header: 'Date', key: 'expenditure_date', type: 'date' },
        { header: 'Amount ($)', key: 'amount', type: 'currency' },
      ],
      me: [
        { header: 'Code', key: 'indicator_code' },
        { header: 'Indicator Name', key: 'indicator_name' },
        { header: 'Project', key: 'project_name' },
        { header: 'Baseline', key: 'baseline' },
        { header: 'Target', key: 'target' },
        { header: 'Actual', key: 'actual_result' },
        { header: 'Unit', key: 'measurement_unit' },
      ],
    };

    exportToPDF({
      title: `ADRA ${reportType.toUpperCase()} STATUS & VERIFICATION REPORT`,
      subtitle: `Scope: ${selectedProjectId === 'ALL' ? 'All Ongoing Projects' : 'Selected Project Focus'} • Generated by ADRA System`,
      columns: columnsMap[reportType] || [],
      data: reportItems,
      fileName: `ADRA_${reportType}_report.pdf`,
      summary: [
        { label: 'Total Records', value: String(reportItems.length) },
        { label: 'Export Date', value: new Date().toLocaleDateString() },
      ]
    });
    toast.success('PDF generated and downloaded.');
  };

  const handlePrint = () => {
    window.print();
  };

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
            Generate executive summaries, field audit tables, and download official PDF / CSV documents.
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
              Select Report Domain
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'projects', label: 'Projects Portfolio', icon: FolderKanban },
                { id: 'beneficiaries', label: 'Beneficiary Roll', icon: Users },
                { id: 'activities', label: 'Activities Progress', icon: Activity },
                { id: 'finance', label: 'Finance & Expenses', icon: DollarSign },
                { id: 'me', label: 'M&E Indicators', icon: BarChart3 },
              ].map((tab) => {
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
          <LoadingSpinner text="Compiling report dataset..." />
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
                {reportType.toUpperCase()} SUMMARY & VERIFICATION REPORT
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Generated: {new Date().toLocaleString()} • Scope: {selectedProjectId === 'ALL' ? 'Full Portfolio' : 'Project Focus'}
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
                  {reportType === 'projects' && (
                    <tr>
                      <th className="py-3 px-3.5">Code</th>
                      <th className="py-3 px-3.5">Title</th>
                      <th className="py-3 px-3.5">Location</th>
                      <th className="py-3 px-3.5">Duration</th>
                      <th className="py-3 px-3.5">Budget</th>
                      <th className="py-3 px-3.5">Status</th>
                    </tr>
                  )}
                  {reportType === 'beneficiaries' && (
                    <tr>
                      <th className="py-3 px-3.5">Code</th>
                      <th className="py-3 px-3.5">Full Name</th>
                      <th className="py-3 px-3.5">Gender / Age</th>
                      <th className="py-3 px-3.5">Vulnerability Category</th>
                      <th className="py-3 px-3.5">Location</th>
                      <th className="py-3 px-3.5">Project</th>
                    </tr>
                  )}
                  {reportType === 'activities' && (
                    <tr>
                      <th className="py-3 px-3.5">Code</th>
                      <th className="py-3 px-3.5">Activity Name</th>
                      <th className="py-3 px-3.5">Project</th>
                      <th className="py-3 px-3.5">Scheduled Date</th>
                      <th className="py-3 px-3.5">Location</th>
                      <th className="py-3 px-3.5">Status</th>
                    </tr>
                  )}
                  {reportType === 'finance' && (
                    <tr>
                      <th className="py-3 px-3.5">Voucher</th>
                      <th className="py-3 px-3.5">Category</th>
                      <th className="py-3 px-3.5">Description</th>
                      <th className="py-3 px-3.5">Project</th>
                      <th className="py-3 px-3.5">Date</th>
                      <th className="py-3 px-3.5">Amount</th>
                    </tr>
                  )}
                  {reportType === 'me' && (
                    <tr>
                      <th className="py-3 px-3.5">Code</th>
                      <th className="py-3 px-3.5">Indicator Name</th>
                      <th className="py-3 px-3.5">Baseline</th>
                      <th className="py-3 px-3.5">Target</th>
                      <th className="py-3 px-3.5">Actual</th>
                      <th className="py-3 px-3.5">Unit</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {reportItems.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/80 transition">
                      {reportType === 'projects' && (
                        <>
                          <td className="py-3.5 px-3.5">
                            <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-500/20 px-2 py-0.5 rounded">
                              {item.project_code}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 font-bold text-slate-900">{item.project_name}</td>
                          <td className="py-3.5 px-3.5 text-slate-700 font-medium">{item.location}</td>
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
                        </>
                      )}
                      {reportType === 'activities' && (
                        <>
                          <td className="py-3.5 px-3.5">
                            <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-500/20 px-2 py-0.5 rounded">
                              {item.activity_code}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 font-bold text-slate-900">{item.activity_name}</td>
                          <td className="py-3.5 px-3.5 text-slate-600">{item.project_name}</td>
                          <td className="py-3.5 px-3.5 text-slate-600 whitespace-nowrap">{formatDate(item.activity_date)}</td>
                          <td className="py-3.5 px-3.5 text-slate-600">{item.location}</td>
                          <td className="py-3.5 px-3.5 whitespace-nowrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] border font-bold bg-slate-100 text-slate-700 border-slate-200">
                              {item.status}
                            </span>
                          </td>
                        </>
                      )}
                      {reportType === 'finance' && (
                        <>
                          <td className="py-3.5 px-3.5">
                            <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-500/20 px-2 py-0.5 rounded">
                              {item.expenditure_code}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 font-semibold text-slate-800">{item.category}</td>
                          <td className="py-3.5 px-3.5 text-slate-600 max-w-xs">{item.description}</td>
                          <td className="py-3.5 px-3.5 text-slate-600">{item.project_name}</td>
                          <td className="py-3.5 px-3.5 text-slate-600 whitespace-nowrap">{formatDate(item.expenditure_date)}</td>
                          <td className="py-3.5 px-3.5 font-mono font-bold text-emerald-800 whitespace-nowrap">{formatCurrency(item.amount)}</td>
                        </>
                      )}
                      {reportType === 'me' && (
                        <>
                          <td className="py-3.5 px-3.5">
                            <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-500/20 px-2 py-0.5 rounded">
                              {item.indicator_code}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 font-bold text-slate-900">{item.indicator_name}</td>
                          <td className="py-3.5 px-3.5 text-slate-600 font-mono">{item.baseline}</td>
                          <td className="py-3.5 px-3.5 font-semibold text-slate-700 font-mono">{item.target}</td>
                          <td className="py-3.5 px-3.5 font-bold text-emerald-800 font-mono">{item.actual_result}</td>
                          <td className="py-3.5 px-3.5 text-slate-500">{item.measurement_unit}</td>
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
