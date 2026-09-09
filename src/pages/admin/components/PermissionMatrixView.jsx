import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  RefreshCw,
  Info,
  Lock,
  Eye,
  PlusSquare,
  Edit,
  CheckSquare,
  Trash,
  Download
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { db } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

export function PermissionMatrixView() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const data = await db.getPermissions();
      setPermissions(data);
    } catch (err) {
      toast.error('Failed to load permission matrix.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const handleToggle = async (role, field, currentValue) => {
    // Administrator permissions are protected
    if (role === 'Administrator' && field === 'can_view') {
      toast.info('Administrator view permission cannot be revoked.');
      return;
    }

    const nextValue = !currentValue;
    // Optimistic update
    setPermissions(prev =>
      prev.map(p => p.role === role ? { ...p, [field]: nextValue } : p)
    );

    try {
      await db.updatePermission(role, field, nextValue);
      toast.success(`Updated ${role} → ${field.replace('can_', '').toUpperCase()} to ${nextValue ? 'Enabled' : 'Disabled'}`);
    } catch (err) {
      toast.error('Failed to save permission change.');
      loadPermissions(); // revert
    }
  };

  const actionColumns = [
    { key: 'can_view', label: 'View', icon: Eye, desc: 'Read access to records & analytics' },
    { key: 'can_create', label: 'Create', icon: PlusSquare, desc: 'Register new projects, aid, or beneficiaries' },
    { key: 'can_edit', label: 'Edit', icon: Edit, desc: 'Modify existing operational data' },
    { key: 'can_approve', label: 'Approve', icon: CheckSquare, desc: 'Sign-off on vouchers, accounts, or releases' },
    { key: 'can_delete', label: 'Delete', icon: Trash, desc: 'Permanently remove database entities' },
    { key: 'can_export', label: 'Export', icon: Download, desc: 'Download CSV and confidential PDF reports' },
  ];

  if (loading) {
    return <LoadingSpinner text="Loading role permission matrix..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Permission Management Matrix
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Configure granular access controls: view, create, edit, approve, delete, and export per stakeholder role.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadPermissions}
          icon={RefreshCw}
        >
          Reload Matrix
        </Button>
      </div>

      {/* Guidance Note */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Changes take effect immediately across all active user sessions and are persisted to the database. Administrators maintain superuser override access across all security enclaves.
        </p>
      </div>

      {/* Desktop & Tablet Matrix Table */}
      <div className="hidden sm:block">
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-5">Stakeholder Role</th>
                  {actionColumns.map(col => {
                    const Icon = col.icon;
                    return (
                      <th key={col.key} className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <Icon className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{col.label}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {permissions.map((perm) => (
                  <tr key={perm.role} className="hover:bg-slate-900/40 transition">
                    <td className="py-4 px-5">
                      <span className="font-bold text-sm text-white">{perm.role}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {perm.role === 'Administrator' ? 'Full System Superuser' : 'Role-based scoping'}
                      </p>
                    </td>

                    {actionColumns.map(col => {
                      const isAllowed = Boolean(perm[col.key]);
                      return (
                        <td key={col.key} className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleToggle(perm.role, col.key, isAllowed)}
                            title={`Toggle ${col.label} for ${perm.role}`}
                            className={`w-8 h-8 rounded-lg inline-flex items-center justify-center transition-all ${
                              isAllowed
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-slate-950/60 text-slate-600 border border-slate-800 hover:text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            {isAllowed ? (
                              <Check className="w-4 h-4 font-bold" />
                            ) : (
                              <X className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Card-Based Permission Switches (Phone View) */}
      <div className="sm:hidden space-y-4">
        {permissions.map((perm) => (
          <Card key={perm.role} className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-sm text-white">{perm.role}</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                RBAC Role
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {actionColumns.map(col => {
                const isAllowed = Boolean(perm[col.key]);
                return (
                  <button
                    key={col.key}
                    onClick={() => handleToggle(perm.role, col.key, isAllowed)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-left transition ${
                      isAllowed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-950/50 border-slate-800/80 text-slate-500'
                    }`}
                  >
                    <span className="font-medium text-[11px]">{col.label}</span>
                    {isAllowed ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
