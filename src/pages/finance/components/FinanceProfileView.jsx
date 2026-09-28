import React from 'react';
import {
  User,
  Shield,
  Phone,
  Mail,
  Building,
  Key,
  Database,
  ArrowRightLeft,
  LogOut,
  CheckCircle2,
  Lock,
  Wallet
} from 'lucide-react';

export function FinanceProfileView({
  currentUser,
  onLogout,
  onSwitchRole,
  onBackToFieldApp
}) {
  return (
    <div className="space-y-4 pb-16 animate-in fade-in duration-150">
      
      {/* 1. PROFILE HEADER CARD */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs text-center space-y-3 relative overflow-hidden">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#006B56] to-emerald-600 text-white flex items-center justify-center mx-auto shadow-md text-2xl font-black border-2 border-white">
          {currentUser?.avatar ? (
            <img
              src={currentUser.avatar}
              alt="Avatar"
              className="w-full h-full object-cover rounded-3xl"
            />
          ) : (
            <span>{currentUser?.full_name?.slice(0, 2)?.toUpperCase() || 'FO'}</span>
          )}
        </div>

        <div>
          <h3 className="text-base font-black text-slate-900">
            {currentUser?.full_name || 'Alex Morgan'}
          </h3>
          <span className="text-xs font-bold text-[#006B56] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block mt-1">
            Finance Officer (Financial Control & Grants)
          </span>
        </div>

        <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-left text-xs">
          <div className="p-2.5 bg-slate-50 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Email</span>
            <span className="font-bold text-slate-800 text-[11px] truncate block">
              {currentUser?.email || 'finance.officer@adra.org'}
            </span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone</span>
            <span className="font-bold text-slate-800 text-[11px] truncate block">
              {currentUser?.phone || '+211-920-000006'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. ROLE SWITCHER & ENVIRONMENT */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
          Testing & Role Simulation
        </h4>

        {onSwitchRole && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSwitchRole('Program Manager')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-2xl border border-slate-200 transition text-left cursor-pointer"
            >
              📋 Switch: Program Mgr
            </button>
            <button
              type="button"
              onClick={() => onSwitchRole('Supervisor')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-2xl border border-slate-200 transition text-left cursor-pointer"
            >
              👔 Switch: Supervisor
            </button>
            <button
              type="button"
              onClick={() => onSwitchRole('Field Worker')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-2xl border border-slate-200 transition text-left cursor-pointer"
            >
              🏃 Switch: Field Worker
            </button>
            <button
              type="button"
              onClick={() => onSwitchRole('Administrator')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-2xl border border-slate-200 transition text-left cursor-pointer"
            >
              ⚙️ Switch: Admin
            </button>
          </div>
        )}
      </div>

      {/* 3. LOGOUT BUTTON */}
      <button
        type="button"
        onClick={onLogout}
        className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black rounded-2xl border border-rose-200 shadow-2xs transition flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out from Finance Portal</span>
      </button>

    </div>
  );
}
