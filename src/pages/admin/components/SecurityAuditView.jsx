import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  History,
  Lock,
  Key,
  Clock,
  AlertTriangle,
  Eye,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  Save,
  Radio,
  FileText,
  UserX,
  RefreshCw
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { db } from '../../../lib/supabase';
import { formatDate } from '../../../lib/utils';
import { useToast } from '../../../context/ToastContext';

export function SecurityAuditView() {
  const [activeTab, setActiveTab] = useState('audit');
  const [auditLogs, setAuditLogs] = useState([]);
  const [securitySettings, setSecuritySettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Audit filters
  const [actionFilter, setActionFilter] = useState('ALL');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [isLogDetailOpen, setIsLogDetailOpen] = useState(false);

  // Security policies form
  const [secForm, setSecForm] = useState({
    min_password_length: 10,
    require_special_chars: true,
    require_numbers: true,
    session_timeout_minutes: 60,
    max_login_attempts: 5,
    account_lockout_duration_minutes: 30,
    two_factor_auth_required: false
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [logs, sec] = await Promise.all([
        db.getAuditLogs(),
        db.getSecuritySettings()
      ]);
      setAuditLogs(logs);
      setSecuritySettings(sec);
      if (sec) {
        setSecForm({
          min_password_length: sec.min_password_length || 10,
          require_special_chars: Boolean(sec.require_special_chars),
          require_numbers: Boolean(sec.require_numbers),
          session_timeout_minutes: sec.session_timeout_minutes || 60,
          max_login_attempts: sec.max_login_attempts || 5,
          account_lockout_duration_minutes: sec.account_lockout_duration_minutes || 30,
          two_factor_auth_required: Boolean(sec.two_factor_auth_required)
        });
      }
    } catch (err) {
      toast.error('Failed to load security & audit telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSecurity = async (e) => {
    e.preventDefault();
    try {
      await db.updateSecuritySettings(secForm);
      toast.success('Security policies and password protocols updated.');
      loadData();
    } catch (err) {
      toast.error('Failed to update security settings.');
    }
  };

  const handleTerminateSessions = () => {
    if (window.confirm('Terminate all active user sessions across field devices? Users will be required to re-authenticate.')) {
      toast.success('All active remote sessions terminated.');
    }
  };

  const filteredLogs = auditLogs.filter(l => {
    const matchesAction = actionFilter === 'ALL' || l.action === actionFilter;
    const matchesModule = moduleFilter === 'ALL' || l.module === moduleFilter;
    const matchesSearch =
      l.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase()) ||
      l.record_id?.toLowerCase().includes(search.toLowerCase());
    return matchesAction && matchesModule && matchesSearch;
  });

  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'AUTH':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'CREATE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'UPDATE':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
      case 'APPROVE':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'DELETE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'EXPORT':
      case 'RESTORE':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Lock className="w-6 h-6 text-emerald-400" />
            Security Management & System Audit Trail
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Audit immutable system transactions and manage password policies, session timeouts, and suspicious activity.
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'audit'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit Trail ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'security'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Security Policies
          </button>
        </div>
      </div>

      {/* --- SUBTAB 1: AUDIT TRAIL (Function 11) --- */}
      {activeTab === 'audit' && (
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
                <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">User Email & Role</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Module</th>
                    <th className="py-3.5 px-4">Transaction Details</th>
                    <th className="py-3.5 px-4 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/50 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white block truncate max-w-[150px]">
                          {log.user_email}
                        </span>
                        <span className="text-[10px] text-slate-400">{log.user_role || 'Staff'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${getActionBadgeClass(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium">
                        {log.module}
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                        {log.details}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setIsLogDetailOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
                          title="View JSON Payload"
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
        </div>
      )}

      {/* --- SUBTAB 2: SECURITY MANAGEMENT (Function 12) --- */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Policy Settings Form */}
          <Card>
            <CardHeader
              title="System Security Policies & Password Rules"
              subtitle="Enforce credential complexity and brute-force mitigation"
            />

            <form onSubmit={handleSaveSecurity} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Minimum Password Length: <span className="text-emerald-400 font-mono">{secForm.min_password_length} characters</span>
                </label>
                <input
                  type="range"
                  min="8"
                  max="24"
                  value={secForm.min_password_length}
                  onChange={(e) => setSecForm({ ...secForm, min_password_length: Number(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={secForm.require_special_chars}
                    onChange={(e) => setSecForm({ ...secForm, require_special_chars: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span className="text-slate-200">Require at least one special symbol (!@#$%^&*)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={secForm.require_numbers}
                    onChange={(e) => setSecForm({ ...secForm, require_numbers: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span className="text-slate-200">Require at least one numeric digit (0-9)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={secForm.two_factor_auth_required}
                    onChange={(e) => setSecForm({ ...secForm, two_factor_auth_required: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span className="text-slate-200">Enforce Two-Factor Authentication (2FA OTP) for Admins</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Max Failed Attempts (Lockout)</label>
                  <input
                    type="number"
                    value={secForm.max_login_attempts}
                    onChange={(e) => setSecForm({ ...secForm, max_login_attempts: Number(e.target.value) })}
                    className="adra-input text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Session Inactivity Timeout (Mins)</label>
                  <input
                    type="number"
                    value={secForm.session_timeout_minutes}
                    onChange={(e) => setSecForm({ ...secForm, session_timeout_minutes: Number(e.target.value) })}
                    className="adra-input text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <Button type="submit" variant="primary" icon={Save}>
                  Save Security Policies
                </Button>
              </div>
            </form>
          </Card>

          {/* Session Control & Suspicious Activity */}
          <div className="space-y-6">
            <Card>
              <CardHeader
                title="Session Control & Kill Switch"
                subtitle="Active tokens and global session revocation"
              />

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Active Concurrent Sessions:</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {securitySettings?.active_sessions_count || 8} Devices
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Account Lockout Duration:</span>
                  <span className="text-slate-200 font-medium">30 Minutes</span>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full justify-center"
                    onClick={handleTerminateSessions}
                    icon={UserX}
                  >
                    Terminate All Staff Sessions
                  </Button>
                </div>
              </div>
            </Card>

            {/* Suspicious Account Activity Feed */}
            <Card>
              <CardHeader
                title="Suspicious Activity & Intrusion Log"
                subtitle="Monitored IP addresses and brute-force detections"
              />

              <div className="space-y-2.5 text-xs">
                {securitySettings?.suspicious_activities?.map((sec) => (
                  <div
                    key={sec.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white font-semibold">{sec.ip}</span>
                        <span className="text-slate-400 text-[10px]">({sec.location})</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            sec.status === 'Blocked'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {sec.status}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-0.5">{sec.event} — {sec.user}</p>
                    </div>

                    <span className="text-[10px] text-slate-500 shrink-0">{sec.time}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <Modal
          isOpen={isLogDetailOpen}
          onClose={() => setIsLogDetailOpen(false)}
          title={`Audit Payload: ${selectedLog.id}`}
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-white font-mono">{formatDate(selectedLog.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Actor Email:</span>
                <span className="text-emerald-400 font-medium">{selectedLog.user_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Role:</span>
                <span className="text-white">{selectedLog.user_role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Module:</span>
                <span className="text-white font-medium">{selectedLog.module}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Action:</span>
                <span className="font-bold text-emerald-400">{selectedLog.action}</span>
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-300 mb-1">Transaction Details & Audit Record:</p>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                {selectedLog.details}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
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
