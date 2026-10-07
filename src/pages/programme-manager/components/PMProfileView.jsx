import React from 'react';
import {
  ShieldCheck,
  LogOut,
  Mail,
  Phone,
  Building
} from 'lucide-react';

export function PMProfileView({
  currentUser,
  onLogout
}) {
  const pm = {
    name: currentUser?.full_name || currentUser?.name || 'Grace Ochieng',
    email: currentUser?.email || 'program.manager@adra.org',
    role: currentUser?.role || 'Programme Manager Role',
    department: currentUser?.department || 'Emergency Response & Programs',
    phone: currentUser?.phone || '+211-920-000006',
    duty_station: currentUser?.duty_station || 'ADRA South Sudan Mission • Emergency Response & Programs'
  };

  return (
    <div className="space-y-4 pb-16 animate-in fade-in duration-150 max-w-xl mx-auto">
      
      {/* 1. PROFILE HEADER CARD */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs text-center space-y-3 relative overflow-hidden">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#006B56] to-emerald-600 text-white flex items-center justify-center mx-auto shadow-md text-2xl font-black border-2 border-white">
          {currentUser?.avatar ? (
            <img
              src={currentUser.avatar}
              alt="Avatar"
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            <span>{pm.name?.slice(0, 2)?.toUpperCase() || 'GO'}</span>
          )}
        </div>

        <div>
          <h3 className="text-base font-black text-slate-900">
            {pm.name}
          </h3>
          <span className="text-xs font-bold text-[#006B56] bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full inline-block mt-1">
            Programme Manager Role
          </span>
        </div>

        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-left text-xs">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Email</span>
            <span className="font-bold text-slate-800 text-[11px] truncate block mt-0.5">
              {pm.email}
            </span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone</span>
            <span className="font-bold text-slate-800 text-[11px] truncate block mt-0.5">
              {pm.phone}
            </span>
          </div>
        </div>

        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-left text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Organization & Duty Station</span>
          <span className="font-bold text-slate-800 text-[11px] block mt-0.5">
            ADRA South Sudan Mission • Emergency Response & Programs
          </span>
        </div>
      </div>

      {/* 2. LOGOUT BUTTON */}
      <button
        type="button"
        onClick={onLogout}
        className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black rounded-xl border border-rose-200/80 shadow-2xs transition flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out from Programme Manager Portal</span>
      </button>

    </div>
  );
}
