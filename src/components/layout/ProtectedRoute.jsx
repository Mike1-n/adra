import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../common/Button';

export function ProtectedRoute({ allowedRoles = [], children }) {
  const { currentUser, hasPermission, quickSwitchRole } = useAuth();

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <ShieldAlert className="w-12 h-12 text-rose-400 mb-3" />
        <h2 className="text-xl font-bold text-slate-100">Authentication Required</h2>
        <p className="text-sm text-slate-400 mt-1 mb-4">
          Please log in to access this module.
        </p>
      </div>
    );
  }

  if (!hasPermission(allowedRoles)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
        <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-4">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Access Restricted</h2>
        <p className="text-sm text-slate-400 max-w-md mt-2 mb-6">
          Your current role (<span className="text-emerald-400 font-semibold">{currentUser.role}</span>) does not have authorization to view this module.
        </p>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => quickSwitchRole('Administrator')}>
            Switch to Administrator
          </Button>
        </div>
      </div>
    );
  }

  return children;
}
