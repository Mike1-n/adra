import React from 'react';
import {
  Users,
  Bell,
  History,
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Shield,
  PhoneCall,
  FileText,
  Radio,
  ExternalLink
} from 'lucide-react';

export function SupervisorMoreMenuView({
  unreadNotifsCount = 0,
  onNavigate,
  onLogout
}) {
  const menuItems = [
    {
      id: 'beneficiaries',
      label: 'Assigned Beneficiaries',
      subtitle: 'View household profiles under your area',
      icon: <Users className="w-5 h-5 text-[#006B56]" />,
      badge: null
    },
    {
      id: 'notifications',
      label: 'Notification Center',
      subtitle: 'Alerts, submissions & PM decisions',
      icon: <Bell className="w-5 h-5 text-blue-600" />,
      badge: unreadNotifsCount > 0 ? `${unreadNotifsCount} New` : null
    },
    {
      id: 'activity_history',
      label: 'Activity History',
      subtitle: 'Audit timeline of actions & field events',
      icon: <History className="w-5 h-5 text-purple-600" />,
      badge: null
    },
    {
      id: 'profile',
      label: 'Supervisor Profile',
      subtitle: 'Personal details and assigned sector',
      icon: <User className="w-5 h-5 text-emerald-600" />,
      badge: null
    },
    {
      id: 'settings',
      label: 'App Settings & Offline Sync',
      subtitle: 'Sync status, notifications & cache',
      icon: <Settings className="w-5 h-5 text-slate-600" />,
      badge: 'Online'
    },
    {
      id: 'support',
      label: 'Help, SOPs & Emergency Contacts',
      subtitle: 'Hotlines and field guidelines',
      icon: <HelpCircle className="w-5 h-5 text-amber-600" />,
      badge: null
    }
  ];

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
        <h2 className="text-base font-bold text-slate-900">More Operational Modules</h2>
        <p className="text-xs text-slate-500">Access auxiliary tools, beneficiaries & settings</p>
      </div>

      {/* Navigation List */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 divide-y divide-slate-100 overflow-hidden">
        {menuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="p-4 flex items-center justify-between hover:bg-slate-50/80 cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{item.label}</h3>
                <p className="text-xs text-slate-400">{item.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {item.badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  item.badge.includes('New') ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {item.badge}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          </div>
        ))}
      </div>

      {/* South Sudan Humanitarian Hotline Card */}
      <div className="bg-gradient-to-r from-emerald-900 to-[#006B56] rounded-2xl p-4 text-white shadow-md space-y-2">
        <div className="flex items-center space-x-2">
          <PhoneCall className="w-4 h-4 text-emerald-300" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-100">ADRA South Sudan Toll-Free Helpline</h4>
        </div>
        <p className="text-sm font-black tracking-wider text-white">0800-720-112 / +211-920-000002</p>
        <p className="text-[11px] text-emerald-200">National Humanitarian Security & Emergency Dispatch Desk</p>
      </div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="w-full p-3.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 transition-colors shadow-xs"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out of Supervisor Account</span>
      </button>

    </div>
  );
}
