import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  CheckCircle,
  Clock,
  AlertTriangle,
  Info,
  Truck,
  HandHeart,
  ShieldAlert,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { db } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

export function NotificationsView({ beneficiary, onNavigateTab }) {
  const toast = useToast();

  const [notifications, setNotifications] = useState([
    {
      id: 'notif-b-1',
      title: 'Assistance Request Approved (REQ-2025-001)',
      message: 'Your emergency household grain and pulses assistance request has been approved under the ECHO Drought Resilience funding. Collection token TKN-LOD-9182 has been issued.',
      category: 'Approvals',
      created_at: '2 hours ago',
      is_read: false,
      action_tab: 'distributions',
      action_label: 'View Collection Token'
    },
    {
      id: 'notif-b-2',
      title: 'Upcoming Aid Distribution at Lodwar Depot',
      message: 'The September Emergency Food & Nutrition Dispatch will take place on Sept 15 from 08:30 AM to 03:30 PM. Please bring your digital or printed Beneficiary ID.',
      category: 'Distributions',
      created_at: '1 day ago',
      is_read: false,
      action_tab: 'distributions',
      action_label: 'View Schedule'
    },
    {
      id: 'notif-b-3',
      title: 'Field Agronomist Verification Assigned',
      message: 'Your request for drought-resistant sorghum seed pack (REQ-2025-003) has been assigned to an agronomy officer for plot suitability review.',
      category: 'Requests',
      created_at: '3 days ago',
      is_read: true,
      action_tab: 'requests',
      action_label: 'Track Status'
    },
    {
      id: 'notif-b-4',
      title: 'Water Point Maintenance Notice',
      message: 'Lodwar Community Solar Borehole #2 will undergo routine pump sanitization on Saturday between 8:00 AM and 12:00 PM. Alternative water trucking available.',
      category: 'Community',
      created_at: '5 days ago',
      is_read: true,
      action_tab: 'support',
      action_label: 'Contact Field Base'
    },
    {
      id: 'notif-b-5',
      title: 'Beneficiary Profile Verified',
      message: 'Your household registration (BEN-2025-007) has been verified by the ADRA Turkana Community Mobilization team. You are eligible for Priority Aid allocations.',
      category: 'Account',
      created_at: '2 weeks ago',
      is_read: true,
      action_tab: 'id_card',
      action_label: 'View Digital ID'
    }
  ]);

  const [activeFilter, setActiveFilter] = useState('ALL');

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success('All notifications marked as read');
  };

  const handleToggleRead = (id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: !n.is_read } : n))
    );
  };

  const filtered = notifications.filter(n => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'UNREAD') return !n.is_read;
    return n.category.toUpperCase() === activeFilter.toUpperCase();
  });

  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'approvals':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'distributions':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'requests':
        return <HandHeart className="w-5 h-5 text-amber-600" />;
      case 'community':
        return <Info className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-white to-slate-50 border border-emerald-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 relative">
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Notifications & Announcements
              </h2>
              <p className="text-xs text-slate-500">
                Timely operational updates on your assistance requests, distribution dates, and field clinic schedules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                className="text-xs gap-1.5 border-slate-200 hover:border-emerald-300 hover:text-emerald-700"
              >
                <CheckCheck className="w-4 h-4 text-emerald-600" />
                Mark all as read
              </Button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-emerald-100/80">
          {[
            { id: 'ALL', label: 'All Updates' },
            { id: 'UNREAD', label: `Unread (${unreadCount})` },
            { id: 'APPROVALS', label: 'Approvals' },
            { id: 'DISTRIBUTIONS', label: 'Distributions' },
            { id: 'REQUESTS', label: 'Requests' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No Notifications</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              You are completely up to date! New updates regarding your applications or aid dispatches will appear here.
            </p>
          </div>
        ) : (
          filtered.map(notif => (
            <div
              key={notif.id}
              className={`p-5 rounded-2xl border transition relative group ${
                notif.is_read
                  ? 'bg-white border-slate-200 hover:border-slate-300'
                  : 'bg-emerald-50/40 border-emerald-300/80 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      notif.is_read
                        ? 'bg-slate-50 border-slate-200 text-slate-500'
                        : 'bg-white border-emerald-200 shadow-2xs'
                    }`}
                  >
                    {getCategoryIcon(notif.category)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        className={`text-sm tracking-tight ${
                          notif.is_read
                            ? 'font-semibold text-slate-800'
                            : 'font-bold text-slate-900'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      )}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        {notif.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-4 pt-2">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {notif.created_at}
                      </span>

                      {notif.action_tab && onNavigateTab && (
                        <button
                          type="button"
                          onClick={() => onNavigateTab(notif.action_tab)}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                        >
                          {notif.action_label}
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mark read button */}
                <button
                  type="button"
                  onClick={() => handleToggleRead(notif.id)}
                  className="text-xs text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition shrink-0"
                  title={notif.is_read ? 'Mark as unread' : 'Mark as read'}
                >
                  {notif.is_read ? 'Mark unread' : 'Mark read'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
