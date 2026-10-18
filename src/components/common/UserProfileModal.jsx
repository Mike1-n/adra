import React from 'react';
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  CreditCard,
  Building2,
  MapPin,
  LogOut,
  X
} from 'lucide-react';
import { Modal } from './Modal';
import { useAuth } from '../../context/AuthContext';

export function UserProfileModal({
  isOpen,
  onClose,
  currentUser: propUser,
  onLogout: propLogout
}) {
  const auth = useAuth() || {};
  const currentUser = propUser || auth.currentUser || {
    full_name: 'ADRA Logistics Officer',
    email: 'logistics.juba@adra.org',
    role: 'Inventory Manager',
    department: 'Humanitarian Logistics & Supply Chain',
    location: 'Juba Central Logistics Base'
  };
  const logout = propLogout || auth.logout || (() => {});

  const handleLogout = () => {
    onClose();
    logout();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Account & Profile"
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        {/* Profile Card Summary */}
        <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-slate-50 border border-emerald-200/80 shadow-2xs">
          <img
            src={
              currentUser?.avatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
            }
            alt={currentUser?.full_name || 'User'}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-extrabold text-slate-900 truncate">
                {currentUser?.full_name || currentUser?.name || 'ADRA Officer'}
              </h4>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Active" />
            </div>
            <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-700" />
                {currentUser?.role || 'Staff Member'}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                ADRA South Sudan
              </span>
            </div>
          </div>
        </div>

        {/* User Details Grid */}
        <div className="space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
            Account Specifications
          </p>
          <div className="bg-white border border-slate-200 rounded-2xl p-3 divide-y divide-slate-100 text-xs shadow-2xs">
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Email
              </span>
              <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                {currentUser?.email || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone
              </span>
              <span className="font-semibold text-slate-800">
                {currentUser?.phone || currentUser?.phone_number || '+211 92 000 1234'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500 flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Staff / National ID
              </span>
              <span className="font-mono font-bold text-slate-800">
                {currentUser?.national_id || currentUser?.id_number || currentUser?.id || 'ADRA-STAFF-01'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> Department
              </span>
              <span className="font-semibold text-slate-800">
                {currentUser?.department || 'Humanitarian Field Operations'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Duty Station
              </span>
              <span className="font-semibold text-slate-800">
                {currentUser?.location || currentUser?.duty_station || 'Juba Country Office / Field Response'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions: Prominent Logout Button */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout of ADRA Account</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
