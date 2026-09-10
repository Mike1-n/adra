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
  Layers
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
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" />
            Reporting & Document Export Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Generate executive summaries, field audit tables, and download official PDF / CSV documents.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" onClick={handleExportCSV} icon={FileSpreadsheet}>
            Export CSV
          </Button>
          <Button variant="primary" onClick={handleExportPDF} icon={Download}>
            Download PDF
          </Button>
          <Button variant="outline" onClick={handlePrint} icon={Printer}>
            Print
          </Button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <Card className="no-print">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Report Domain
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'projects', label: 'Projects Portfolio' },
                { id: 'beneficiaries', label: 'Beneficiary Roll' },
                { id: 'activities', label: 'Activities Progress' },
                { id: 'finance', label: 'Finance & Expenses' },
                { id: 'me', label: 'M&E Indicators' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setReportType(tab.id)}
                  className={`p-2 rounded-lg text-xs font-medium text-left transition border ${
                    reportType === tab.id
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 font-semibold'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Filter by Project Scope
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="adra-select text-xs py-2.5"
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
        <LoadingSpinner text="Compiling report dataset..." />
      ) : (
        <Card className="p-6 bg-slate-900/90 border border-slate-800">
          {/* Official Letterhead Header for Print / Preview */}
          <div className="border-b border-slate-800 pb-5 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest block">
                ADRA Humanitarian Management System
              </span>
              <h3 className="text-lg font-bold text-slate-100 uppercase mt-0.5">
                {reportType.toUpperCase()} SUMMARY & VERIFICATION REPORT
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Generated: {new Date().toLocaleString()} • Scope: {selectedProjectId === 'ALL' ? 'Full Portfolio' : 'Project Focus'}
              </p>
            </div>

            <div className="text-right text-xs text-slate-400">
              <span className="text-slate-200 font-bold block">{reportItems.length} Total Records</span>
              <span>Status: Verified</span>
            </div>
          </div>

          {/* Dynamic Preview Table */}
          {reportItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No matching records found for the selected report criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  {reportType === 'projects' && (
                    <tr>
                      <th className="py-3 px-3">Code</th>
                      <th className="py-3 px-3">Title</th>
                      <th className="py-3 px-3">Location</th>
                      <th className="py-3 px-3">Duration</th>
                      <th className="py-3 px-3">Budget</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  )}
                  {reportType === 'beneficiaries' && (
                    <tr>
                      <th className="py-3 px-3">Code</th>
                      <th className="py-3 px-3">Full Name</th>
                      <th className="py-3 px-3">Gender/Age</th>
                      <th className="py-3 px-3">Vulnerability Category</th>
                      <th className="py-3 px-3">Location</th>
                      <th className="py-3 px-3">Project</th>
                    </tr>
                  )}
                  {reportType === 'activities' && (
                    <tr>
                      <th className="py-3 px-3">Code</th>
                      <th className="py-3 px-3">Activity Name</th>
                      <th className="py-3 px-3">Project</th>
                      <th className="py-3 px-3">Scheduled Date</th>
                      <th className="py-3 px-3">Location</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  )}
                  {reportType === 'finance' && (
                    <tr>
                      <th className="py-3 px-3">Voucher</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Description</th>
                      <th className="py-3 px-3">Project</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Amount</th>
                    </tr>
                  )}
                  {reportType === 'me' && (
                    <tr>
                      <th className="py-3 px-3">Code</th>
                      <th className="py-3 px-3">Indicator Name</th>
                      <th className="py-3 px-3">Baseline</th>
                      <th className="py-3 px-3">Target</th>
                      <th className="py-3 px-3">Actual</th>
                      <th className="py-3 px-3">Unit</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {reportItems.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-950/40">
                      {reportType === 'projects' && (
                        <>
                          <td className="py-3 px-3 font-mono text-emerald-400">{item.project_code}</td>
                          <td className="py-3 px-3 font-medium text-slate-100">{item.project_name}</td>
                          <td className="py-3 px-3 text-slate-400">{item.location}</td>
                          <td className="py-3 px-3 text-slate-400">{formatDate(item.start_date)} - {formatDate(item.end_date)}</td>
                          <td className="py-3 px-3 font-semibold text-emerald-400">{formatCurrency(item.budget)}</td>
                          <td className="py-3 px-3">{item.status}</td>
                        </>
                      )}
                      {reportType === 'beneficiaries' && (
                        <>
                          <td className="py-3 px-3 font-mono text-emerald-400">{item.beneficiary_code}</td>
                          <td className="py-3 px-3 font-medium text-slate-100">{item.full_name}</td>
                          <td className="py-3 px-3">{item.gender} • {item.age} yrs</td>
                          <td className="py-3 px-3 text-slate-300">{item.vulnerability_category}</td>
                          <td className="py-3 px-3 text-slate-400">{item.location}</td>
                          <td className="py-3 px-3 text-slate-400">{item.project_name}</td>
                        </>
                      )}
                      {reportType === 'activities' && (
                        <>
                          <td className="py-3 px-3 font-mono text-emerald-400">{item.activity_code}</td>
                          <td className="py-3 px-3 font-medium text-slate-100">{item.activity_name}</td>
                          <td className="py-3 px-3 text-slate-400">{item.project_name}</td>
                          <td className="py-3 px-3 text-slate-400">{formatDate(item.activity_date)}</td>
                          <td className="py-3 px-3 text-slate-400">{item.location}</td>
                          <td className="py-3 px-3">{item.status}</td>
                        </>
                      )}
                      {reportType === 'finance' && (
                        <>
                          <td className="py-3 px-3 font-mono text-emerald-400">{item.expenditure_code}</td>
                          <td className="py-3 px-3 text-slate-300">{item.category}</td>
                          <td className="py-3 px-3 text-slate-200">{item.description}</td>
                          <td className="py-3 px-3 text-slate-400">{item.project_name}</td>
                          <td className="py-3 px-3 text-slate-400">{formatDate(item.expenditure_date)}</td>
                          <td className="py-3 px-3 font-semibold text-slate-100">{formatCurrency(item.amount)}</td>
                        </>
                      )}
                      {reportType === 'me' && (
                        <>
                          <td className="py-3 px-3 font-mono text-emerald-400">{item.indicator_code}</td>
                          <td className="py-3 px-3 font-medium text-slate-100">{item.indicator_name}</td>
                          <td className="py-3 px-3 text-slate-400">{item.baseline}</td>
                          <td className="py-3 px-3 font-semibold text-slate-200">{item.target}</td>
                          <td className="py-3 px-3 font-bold text-emerald-400">{item.actual_result}</td>
                          <td className="py-3 px-3 text-slate-400">{item.measurement_unit}</td>
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
