import React, { useState, useEffect } from 'react';
import {
  History,
  Eye,
  Search,
  RefreshCw
} from 'lucide-react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { db } from '../../../lib/supabase';
import { formatDate } from '../../../lib/utils';
import { useToast } from '../../../context/ToastContext';

export function SecurityAuditView() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Audit filters
  const [actionFilter, setActionFilter] = useState('ALL');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [isLogDetailOpen, setIsLogDetailOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const logs = await db.getAuditLogs();
      setAuditLogs(logs || []);
    } catch (err) {
      toast.error('Failed to load audit telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLogs = auditLogs.filter(l => {
    const matchesAction = actionFilter === 'ALL' || l.action === actionFilter;
    const matchesModule = moduleFilter === 'ALL' || l.module === moduleFilter;
    const detailsStr = typeof l.details === 'object' && l.details !== null
      ? (l.details.message || l.details.description || JSON.stringify(l.details))
      : String(l.details || '');
    const matchesSearch =
      l.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      detailsStr.toLowerCase().includes(search.toLowerCase()) ||
      l.record_id?.toLowerCase().includes(search.toLowerCase());
    return matchesAction && matchesModule && matchesSearch;
  });

  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'AUTH':
        return 'bg-purple-500/10 text-purple-700 border-purple-300';
      case 'CREATE':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-300';
      case 'UPDATE':
        return 'bg-blue-500/10 text-blue-700 border-blue-300';
      case 'APPROVE':
        return 'bg-amber-500/10 text-amber-700 border-amber-300';
      case 'DELETE':
        return 'bg-rose-500/10 text-rose-700 border-rose-300';
      case 'EXPORT':
      case 'RESTORE':
        return 'bg-cyan-50 text-cyan-800 border-cyan-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-[#006B56]" />
            System Audit Trail & Transaction Telemetry
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Immutable log of all user logins, role modifications, record creations, deletions, and operational approvals.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          icon={RefreshCw}
          className="text-xs"
        >
          Refresh Logs ({auditLogs.length})
        </Button>
      </div>

      {/* Audit Trail Filter & Search */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit trail by user, ID, detail..."
              className="adra-input pl-10 text-xs sm:text-sm"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="adra-select text-xs sm:text-sm"
          >
            <option value="ALL">All Actions (CREATE, UPDATE, DELETE, etc.)</option>
            <option value="AUTH">Authentication / Login / Role Switch</option>
            <option value="CREATE">Record Creation (CREATE)</option>
            <option value="UPDATE">Record Modification (UPDATE)</option>
            <option value="APPROVE">Operational Approvals (APPROVE)</option>
            <option value="DELETE">Record Deletion (DELETE)</option>
            <option value="EXPORT">Data Exports (EXPORT)</option>
          </select>

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="adra-select text-xs sm:text-sm"
          >
            <option value="ALL">All Target Modules</option>
            <option value="Authentication">Authentication</option>
            <option value="User Management">User Management</option>
            <option value="Permission Management">Permission Management</option>
            <option value="Approval Management">Approval Management</option>
            <option value="Location Management">Location Management</option>
            <option value="Security Management">Security Management</option>
            <option value="Projects">Projects</option>
            <option value="Interventions">Interventions</option>
            <option value="Beneficiaries">Beneficiaries</option>
          </select>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">User Email & Role</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Module</th>
                  <th className="py-3.5 px-4">Transaction Details</th>
                  <th className="py-3.5 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No audit transactions match the active criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block truncate max-w-[150px]">
                          {log.user_email}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">{log.user_role || 'Staff'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${getActionBadgeClass(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {log.module}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                        {typeof log.details === 'object' && log.details !== null
                          ? (log.details.message || log.details.description || JSON.stringify(log.details))
                          : String(log.details || 'N/A')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setIsLogDetailOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition"
                          title="View JSON Payload"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <Modal
          isOpen={isLogDetailOpen}
          onClose={() => setIsLogDetailOpen(false)}
          title={`Audit Payload: ${selectedLog.id}`}
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-900 font-bold font-mono">{formatDate(selectedLog.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Actor Email:</span>
                <span className="text-emerald-700 font-bold">{selectedLog.user_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Role:</span>
                <span className="text-slate-900 font-medium">{selectedLog.user_role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Module:</span>
                <span className="text-slate-900 font-medium">{selectedLog.module}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Action:</span>
                <span className="font-bold text-emerald-700">{selectedLog.action}</span>
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-900 mb-1">Transaction Details & Audit Record:</p>
              <pre className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-900 overflow-x-auto whitespace-pre-wrap">
                {typeof selectedLog.details === 'object' && selectedLog.details !== null
                  ? JSON.stringify(selectedLog.details, null, 2)
                  : (() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedLog.details), null, 2);
                      } catch (e) {
                        return String(selectedLog.details || 'N/A');
                      }
                    })()}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setIsLogDetailOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

      {/* Log Detail Modal */}
      {selectedLog && (
        <Modal
          isOpen={isLogDetailOpen}
          onClose={() => setIsLogDetailOpen(false)}
          title={`Audit Payload: ${selectedLog.id}`}
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-900 font-bold font-mono">{formatDate(selectedLog.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Actor Email:</span>
                <span className="text-emerald-700 font-bold">{selectedLog.user_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Role:</span>
                <span className="text-slate-900 font-medium">{selectedLog.user_role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Module:</span>
                <span className="text-slate-900 font-medium">{selectedLog.module}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Action:</span>
                <span className="font-bold text-emerald-700">{selectedLog.action}</span>
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-900 mb-1">Transaction Details & Audit Record:</p>
              <pre className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-900 overflow-x-auto whitespace-pre-wrap">
                {typeof selectedLog.details === 'object' && selectedLog.details !== null
                  ? JSON.stringify(selectedLog.details, null, 2)
                  : (() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedLog.details), null, 2);
                      } catch (e) {
                        return String(selectedLog.details || 'N/A');
                      }
                    })()}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setIsLogDetailOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
