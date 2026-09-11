import React from 'react';
import {
  User,
  ShieldCheck,
  Building,
  MapPin,
  Calendar,
  Lock,
  Layers,
  CheckCircle2,
  XCircle,
  FileText,
  Key,
  Clock
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

export function PMProfileView({
  currentUser,
  programmes = []
}) {
  const pm = currentUser || {
    name: 'Grace Ochieng',
    email: 'program.manager@adra.org',
    role: 'Program Manager',
    department: 'Humanitarian Operations & Field Response',
    phone: '+211 92 123 4567',
    duty_station: 'Juba Country Office / Field Deployment'
  };

  const allowedPermissions = [
    'View authorized programme portfolios and sectoral data',
    'Review, verify, approve, and reject beneficiary assistance requests',
    'Request additional verification information from field teams',
    'Assign approved requests to designated Field Supervisors',
    'Monitor Field Worker task progress through Supervisor reporting',
    'Monitor humanitarian commodity inventories and low-stock alerts',
    'Review and resolve community accountability feedback (AAP)',
    'Generate donor-ready programme performance and distribution reports'
  ];

  const restrictedPermissions = [
    'Create or delete system administrator user accounts',
    'Manage staff user accounts or modify role assignments',
    'Directly assign individual Field Workers (delegated to Supervisors)',
    'Directly delete registered beneficiary records from registry',
    'Modify or alter historical approved distribution records',
    'Access unrelated programme portfolios outside assigned mandate'
  ];

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-20 h-20 rounded-2xl bg-[#006B56] text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
          GO
        </div>
        <div className="flex-1 text-center md:text-left space-y-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">{pm.name || 'Grace Ochieng'}</h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 self-center md:self-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              Programme Manager Role
            </span>
          </div>
          <p className="text-sm text-slate-500">{pm.email || 'program.manager@adra.org'}</p>
          <p className="text-xs text-slate-600 font-medium">
            ADRA South Sudan Mission • {pm.department || 'Emergency Response & Programs'}
          </p>
        </div>
      </div>

      {/* Details & Authorizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assigned Programmes */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Layers className="w-4 h-4 text-[#006B56]" />
            Authorized Programme Portfolios
          </h3>
          <p className="text-xs text-slate-500">
            The Programme Manager is authorized to manage and supervise operations across the following active portfolios:
          </p>
          <div className="space-y-2">
            {programmes.map(p => (
              <div key={p.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">{p.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{p.code}</div>
                </div>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Full Authority
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Access Rights Matrix */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Key className="w-4 h-4 text-[#006B56]" />
            Role-Based Access Control (RBAC)
          </h3>

          <div>
            <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Authorized Powers:
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {allowedPermissions.map((perm, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>{perm}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1.5 mb-2">
              <XCircle className="w-4 h-4 text-rose-600" />
              Restricted Powers (Strict Governance):
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {restrictedPermissions.map((res, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span>{res}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
