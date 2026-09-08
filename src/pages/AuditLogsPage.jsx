import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldCheck,
  Filter,
  Calendar,
  User,
  Activity,
  Search,
  Eye,
  FileCode2
} from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { SearchFilter } from '../components/common/SearchFilter';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { db } from '../lib/supabase';
import { formatDateTime } from '../lib/utils';
import { useToast } from '../context/ToastContext';

export function AuditLogsPage() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');

  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const logList = await db.getAuditLogs();
      setLogs(logList);
    } catch (err) {
      toast.error('Failed to load audit trail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const getActionBadgeClass = (action) => {
    switch (action?.toUpperCase()) {
      case 'CREATE':
        return 'badge-emerald';
      case 'UPDATE':
        return 'badge-blue';
      case 'DELETE':
        return 'badge-rose';
      case 'AUTH':
        return 'badge-amber';
      default:
        return 'badge-slate';
    }
  };

  const filtered = logs.filter((l) => {
    const matchesSearch =
      l.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase()) ||
      l.module?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase());
    const matchesModule = moduleFilter === 'ALL' || l.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-400" />
            System Audit Trail & Activity Logs
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Immutable tracking of database mutations, authentication events, and user actions.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={loadAuditLogs} icon={History}>
          Refresh Logs
        </Button>
      </div>

      {/* Search & Module Filter */}
      <SearchFilter
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search audit logs by user, action or description..."
        selectedFilter={moduleFilter}
        onFilterChange={setModuleFilter}
        filterOptions={[
          { label: 'All Modules', value: 'ALL' },
          { label: 'Projects', value: 'Projects' },
          { label: 'Beneficiaries', value: 'Beneficiaries' },
          { label: 'Activities', value: 'Activities' },
          { label: 'Interventions', value: 'Interventions' },
          { label: 'Finance', value: 'Finance' },
          { label: 'M&E', value: 'M&E' },
          { label: 'Authentication', value: 'Authentication' },
        ]}
      />

      {loading ? (
        <LoadingSpinner text="Retrieving audit history..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No audit entries found"
          description="System actions and user events will be automatically recorded here."
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">User / Performer</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Module</th>
                  <th className="py-3.5 px-4">Activity Description</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/60 transition">
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {log.user_email || 'system'}
                      {log.user_role && (
                        <span className="block text-[10px] text-slate-500 font-normal">
                          {log.user_role}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={getActionBadgeClass(log.action)}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-300">
                      {log.module}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-sm truncate">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedLog(log);
                          setIsDetailOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title="Audit Log Event Details"
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Action</span>
                <span className={getActionBadgeClass(selectedLog.action)}>{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Module</span>
                <span className="font-bold text-slate-200">{selectedLog.module}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">User Email</span>
                <span className="text-slate-300 font-medium">{selectedLog.user_email}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Timestamp</span>
                <span className="text-slate-300">{formatDateTime(selectedLog.created_at)}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block mb-1.5 flex items-center gap-1.5">
                <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
                Payload / Event Payload
              </span>
              <pre className="p-3.5 rounded-xl bg-slate-950 font-mono text-[11px] text-emerald-400 border border-slate-800 overflow-x-auto whitespace-pre-wrap">
                {typeof selectedLog.details === 'string'
                  ? selectedLog.details
                  : JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
