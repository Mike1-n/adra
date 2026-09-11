import React, { useState, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
  Activity,
  Package,
  MessageSquare,
  ShieldCheck,
  Check,
  Clock,
  Filter
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

export function PMNotificationsView({
  notifications = [],
  onMarkAllAsRead,
  onNavigateTab
}) {
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [localNotifications, setLocalNotifications] = useState(notifications);

  const toggleRead = (id) => {
    setLocalNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAll = () => {
    setLocalNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (onMarkAllAsRead) onMarkAllAsRead();
  };

  const filtered = useMemo(() => {
    if (filterCategory === 'ALL') return localNotifications;
    if (filterCategory === 'UNREAD') return localNotifications.filter(n => !n.read);
    return localNotifications.filter(n => n.type === filterCategory);
  }, [localNotifications, filterCategory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#006B56]" />
            Programme Manager Operational Notifications
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time field alerts, pending review authorizations, stock shortages, and supervisor progress milestones.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Mark All as Read
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {['ALL', 'UNREAD', 'request', 'registration', 'activity', 'resource', 'complaint'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filterCategory === cat
                ? 'bg-[#006B56] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat === 'ALL' ? 'All Alerts' :
             cat === 'UNREAD' ? 'Unread Only' :
             cat === 'request' ? 'Aid Requests' :
             cat === 'registration' ? 'Registrations' :
             cat === 'activity' ? 'Field Activities' :
             cat === 'resource' ? 'Low Stock' : 'Complaints'}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-slate-700">No notifications found</p>
          </div>
        ) : (
          filtered.map(notif => {
            const isUnread = !notif.read;
            return (
              <div
                key={notif.id}
                onClick={() => toggleRead(notif.id)}
                className={`p-4 transition-colors cursor-pointer flex items-start justify-between gap-4 ${
                  isUnread ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl mt-0.5 ${
                    notif.type === 'resource' ? 'bg-rose-100 text-rose-700' :
                    notif.type === 'complaint' ? 'bg-amber-100 text-amber-700' :
                    notif.type === 'request' ? 'bg-blue-100 text-blue-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {notif.type === 'resource' ? <Package className="w-4 h-4" /> :
                     notif.type === 'complaint' ? <MessageSquare className="w-4 h-4" /> :
                     notif.type === 'request' ? <FileText className="w-4 h-4" /> :
                     notif.type === 'activity' ? <Activity className="w-4 h-4" /> :
                     <Bell className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`text-xs font-bold ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                        {notif.title}
                      </h4>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-[#006B56]" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {formatDate(notif.created_at || '2026-09-11')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRead(notif.id);
                  }}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-700"
                >
                  {isUnread ? 'Mark read' : 'Read'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
