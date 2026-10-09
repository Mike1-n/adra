import React, { useState, useMemo } from 'react';
import {
  Search,
  Inbox,
  Download,
  FileText,
  Eye,
  ArrowRight
} from 'lucide-react';
import { SupervisorAssignWorkerModal } from './SupervisorAssignWorkerModal';
import { exportToPDF } from '../../../lib/reportGenerator';

export function SupervisorAssignmentsView({
  assignments = [],
  fieldWorkers = [],
  onSelectAssignment,
  onAssignFieldWorker,
  onConfirmArrival,
  onHandoverToWorker,
  onOpenReport,
  initialStatusTab = 'pending',
  onStatusTabChange
}) {
  const [activeTab, setActiveTab] = useState(initialStatusTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [assignModalRequest, setAssignModalRequest] = useState(null);

  React.useEffect(() => {
    if (initialStatusTab) {
      setActiveTab(initialStatusTab);
    }
  }, [initialStatusTab]);

  // Filter assignments by active tab and search query
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      const status = item.status || 'Submitted';
      
      if (activeTab === 'all') {
        // match all
      } else if (activeTab === 'pending') {
        const isPending = status === 'Assigned to Supervisor' || 
                          status === 'Submitted' || 
                          status === 'Pending' || 
                          status === 'Under Review' ||
                          !item.assigned_field_worker_name ||
                          item.assigned_field_worker_name.includes('Pending') ||
                          item.assigned_field_worker_name.includes('Unassigned');
        if (!isPending) return false;
      } else if (activeTab === 'assigned') {
        const isAssigned = status === 'Assigned to Field Worker' || (item.assigned_field_worker_name && !item.assigned_field_worker_name.includes('Pending') && status !== 'Completed' && status !== 'Distributed' && status !== 'Assessment Submitted' && status !== 'Awaiting Program Manager Decision');
        if (!isAssigned) return false;
      } else if (activeTab === 'in_progress') {
        const isInProgress = status === 'Assessment In Progress' || status === 'Correction Required';
        if (!isInProgress) return false;
      } else if (activeTab === 'rejected') {
        const isRejected = status === 'Rejected' || status?.includes('Rejected') || item.status_label?.includes('Rejected') || Boolean(item.returned_to_worker);
        if (!isRejected) return false;
      } else if (activeTab === 'completed') {
        const isCompleted = status === 'Completed' || status === 'Distributed' || status === 'Assessment Submitted' || status === 'Awaiting Program Manager Decision' || status === 'Approved';
        if (!isCompleted) return false;
      } else if (activeTab === 'overdue') {
        const isOverdue = item.is_overdue || (item.due_date && new Date(item.due_date) < new Date() && status !== 'Completed' && status !== 'Distributed');
        if (!isOverdue) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const code = (item.request_code || item.id || '').toLowerCase();
        const benName = (item.beneficiary_name || '').toLowerCase();
        const worker = (item.assigned_field_worker_name || '').toLowerCase();
        const type = (item.assistance_type || item.category || '').toLowerCase();
        const loc = (item.location || `${item.county || ''} ${item.payam || ''}`).toLowerCase();
        if (!code.includes(q) && !benName.includes(q) && !worker.includes(q) && !type.includes(q) && !loc.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [assignments, activeTab, searchQuery]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts = { total: assignments.length, pending: 0, assigned: 0, in_progress: 0, completed: 0, rejected: 0, overdue: 0 };
    assignments.forEach(item => {
      const status = item.status || 'Submitted';
      const isRejected = status === 'Rejected' || status?.includes('Rejected') || item.status_label?.includes('Rejected') || Boolean(item.returned_to_worker);
      
      if (isRejected) {
        counts.rejected++;
      } else {
        const isUnassigned = !item.assigned_field_worker_name || item.assigned_field_worker_name.includes('Pending') || item.assigned_field_worker_name.includes('Unassigned') || status === 'Assigned to Supervisor' || status === 'Submitted';
        
        if (isUnassigned) counts.pending++;
        else if (status === 'Assigned to Field Worker') counts.assigned++;
        else if (status === 'Assessment In Progress' || status === 'Correction Required') counts.in_progress++;
        else if (status === 'Completed' || status === 'Distributed' || status === 'Assessment Submitted' || status === 'Awaiting Program Manager Decision' || status === 'Approved') counts.completed++;
      }

      if (item.is_overdue || (item.due_date && new Date(item.due_date) < new Date() && status !== 'Completed' && status !== 'Distributed')) {
        counts.overdue++;
      }
    });
    return counts;
  }, [assignments]);

  // Export to PDF
  const handleExportPDF = () => {
    if (!filteredAssignments || filteredAssignments.length === 0) {
      alert('No cases to export.');
      return;
    }

    const columns = [
      { header: 'Code', key: 'display_code' },
      { header: 'Beneficiary', key: 'display_name' },
      { header: 'Category', key: 'display_type' },
      { header: 'Location', key: 'display_loc' },
      { header: 'Status', key: 'display_status' }
    ];

    const data = filteredAssignments.map(item => {
      const isUnassigned = !item.assigned_field_worker_name || 
                           item.assigned_field_worker_name.includes('Pending') || 
                           item.assigned_field_worker_name.includes('Unassigned');
      const displayStatus = !isUnassigned && (item.status === 'Assigned to Supervisor' || item.status === 'Submitted')
        ? 'Assigned'
        : (item.status_label || item.status || 'Pending');

      return {
        display_code: item.request_code || item.id || 'ADR-REQ',
        display_name: item.beneficiary_name || 'Beneficiary',
        display_type: (item.assistance_type || item.category || 'Food Assistance').split(',')[0].trim(),
        display_loc: item.county ? `${item.county}, ${item.state || ''}` : item.state || 'Eastern Equatoria',
        display_status: displayStatus
      };
    });

    exportToPDF({
      title: 'ADRA SOUTH SUDAN - SUPERVISOR ASSIGNMENTS',
      subtitle: `Scope: ${activeTab.toUpperCase()} Cases • Total: ${filteredAssignments.length} records • Generated: ${new Date().toLocaleString()}`,
      columns,
      data,
      fileName: `ADRA_SS_supervisor_${activeTab}_cases_${new Date().toISOString().slice(0, 10)}.pdf`,
      summary: [
        { label: 'Total Cases', value: String(filteredAssignments.length) },
        { label: 'Queue Tab', value: activeTab.replace('_', ' ') },
        { label: 'Export Date', value: new Date().toLocaleDateString() }
      ]
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredAssignments || filteredAssignments.length === 0) {
      alert('No cases to export.');
      return;
    }
    const rows = [
      ['Code', 'Beneficiary', 'Category', 'Location', 'Status', 'Date']
    ];
    filteredAssignments.forEach(item => {
      const isUnassigned = !item.assigned_field_worker_name || 
                           item.assigned_field_worker_name.includes('Pending') || 
                           item.assigned_field_worker_name.includes('Unassigned');
      rows.push([
        item.request_code || item.id,
        item.beneficiary_name || 'Beneficiary',
        item.assistance_type || item.category || '',
        item.county || item.state || '',
        isUnassigned ? 'Unassigned' : item.assigned_field_worker_name,
        new Date(item.created_at || Date.now()).toLocaleDateString()
      ]);
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(x => `"${(x || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `ADRA_SS_supervisor_${activeTab}_cases_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-2.5 pb-20 max-w-4xl mx-auto animate-in fade-in duration-150">
      
      {/* 1. Single Clean Compact Toolbar Header */}
      <div className="bg-white p-2.5 rounded-2xl shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-black text-slate-900 capitalize">
            {activeTab === 'pending' ? 'Pending Assignments' : `${activeTab.replace('_', ' ')} Cases`}
          </h2>
          <span className="text-[10px] font-black text-[#006B56] bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full">
            {filteredAssignments.length} {filteredAssignments.length === 1 ? 'case' : 'cases'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-1 max-w-xs justify-end">
          <div className="relative flex-1 min-w-[120px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cases..."
              className="w-full pl-7 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B56]"
            />
          </div>

          <button
            type="button"
            onClick={handleExportPDF}
            className="flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-black rounded-xl shadow-xs transition cursor-pointer active:scale-95 shrink-0"
            title="Download PDF Report"
          >
            <FileText className="w-3 h-3" />
            <span>PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#006B56] border border-emerald-200/80 text-[11px] font-bold rounded-xl transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
            title="Download CSV"
          >
            <Download className="w-3 h-3" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* 2. COMPACT, SLIM 5-COLUMN TABLE */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center border border-slate-200/80 space-y-1.5 shadow-2xs">
          <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-bold text-slate-800">
            {activeTab === 'pending'
              ? 'No Pending Unassigned Cases'
              : `No ${activeTab.replace('_', ' ')} Cases Found`}
          </p>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
            {activeTab === 'pending' && tabCounts.assigned > 0
              ? `You have ${tabCounts.assigned} case(s) assigned in the 'Assigned' queue.`
              : 'There are no requests matching the search criteria.'}
          </p>
          {activeTab === 'pending' && tabCounts.assigned > 0 && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('assigned');
                if (onStatusTabChange) onStatusTabChange('assigned');
              }}
              className="inline-flex items-center gap-1 px-3 py-1 bg-[#006B56] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#005544] transition cursor-pointer"
            >
              <span>View Assigned Cases ({tabCounts.assigned})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2 px-3 w-36">Code</th>
                  <th className="py-2 px-3">Beneficiary</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3 w-28">Status</th>
                  <th className="py-2 px-3 w-20 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssignments.map((item) => {
                  const isUnassigned = !item.assigned_field_worker_name || 
                                       item.assigned_field_worker_name.includes('Pending') || 
                                       item.assigned_field_worker_name.includes('Unassigned');

                  const displayStatus = !isUnassigned && (item.status === 'Assigned to Supervisor' || item.status === 'Submitted')
                    ? 'Assigned'
                    : (item.status_label || item.status || 'Pending');

                  const categoryText = (item.assistance_type || item.category || 'Food Assistance').split(',')[0].trim();

                  return (
                    <tr
                      key={item.id || item.request_code}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {/* 1. Code */}
                      <td className="py-2 px-3 font-mono font-bold text-xs text-[#006B56] whitespace-nowrap">
                        {item.request_code || item.id}
                      </td>

                      {/* 2. Beneficiary */}
                      <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap text-xs">
                        {item.beneficiary_name || 'Beneficiary'}
                      </td>

                      {/* 3. Category */}
                      <td className="py-2 px-3 text-slate-600 font-medium whitespace-nowrap text-xs">
                        {categoryText}
                      </td>

                      {/* 4. Status */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                          displayStatus === 'Assigned' || displayStatus === 'Completed' || displayStatus === 'Approved'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : displayStatus === 'Rejected'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {displayStatus}
                        </span>
                      </td>

                      {/* 5. View Action */}
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onSelectAssignment(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#006B56] hover:bg-[#005242] text-white font-bold rounded-lg text-[11px] shadow-2xs transition cursor-pointer active:scale-95"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Field Worker Modal */}
      {assignModalRequest && (
        <SupervisorAssignWorkerModal
          request={assignModalRequest}
          fieldWorkers={fieldWorkers}
          isOpen={Boolean(assignModalRequest)}
          onClose={() => setAssignModalRequest(null)}
          onAssignSuccess={async (reqId, workerId, workerName, notes, dueDate) => {
            await onAssignFieldWorker(reqId, workerId, workerName, notes, dueDate);
          }}
        />
      )}

    </div>
  );
}

export default SupervisorAssignmentsView;
