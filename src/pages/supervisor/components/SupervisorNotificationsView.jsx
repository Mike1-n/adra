import React from 'react';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  UserCheck,
  FileCheck,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  Inbox
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function SupervisorNotificationsView({
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectNotification
}) {
  const toast = useToast();

  const handleMarkAll = async () => {
    if (onMarkAllAsRead) {
      await onMarkAllAsRead();
      toast.success('All notifications marked as read.');
    }
  };

  const typeIcons = {
    'assignment': <UserCheck className="w-4 h-4 text-emerald-600" />,
    'report_submitted': <FileCheck className="w-4 h-4 text-purple-600" />,
    'accepted': <CheckCircle2 className="w-4 h-4 text-blue-600" />,
    'pm_feedback': <MessageSquare className="w-4 h-4 text-[#006B56]" />,
    'overdue': <AlertCircle className="w-4 h-4 text-red-600" />
  };

  const typeBgs = {
    'assignment': 'bg-emerald-50 border-emerald-200',
    'report_submitted': 'bg-purple-50 border-purple-200',
    'accepted': 'bg-blue-50 border-blue-200',
    'pm_feedback': 'bg-emerald-50 border-emerald-200',
    'overdue': 'bg-red-50 border-red-200'
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-3 pb-24">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Notification Center</h2>
            <p className="text-xs text-slate-500">Live field dispatches, approvals & activity alerts</p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="text-xs font-bold text-[#006B56] hover:text-[#005544] flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 rounded-xl border border-emerald-200"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 space-y-2">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Notifications</p>
            <p className="text-xs text-slate-400">You are all caught up on field updates.</p>
          </div>
        ) : (
          notifications.map(n => {
            const isUnread = !n.is_read;
            return (
              <div
                key={n.id}
                onClick={() => {
                  if (onMarkAsRead && isUnread) onMarkAsRead(n.id);
                  if (onSelectNotification) onSelectNotification(n);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 ${
                  isUnread
                    ? 'bg-white border-[#006B56]/40 shadow-xs ring-1 ring-[#006B56]/20'
                    : 'bg-white/80 border-slate-200 opacity-90'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${typeBgs[n.type] || 'bg-slate-100 border-slate-200'}`}>
                  {typeIcons[n.type] || <Bell className="w-4 h-4 text-slate-600" />}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{n.title}</h4>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-[#006B56] shrink-0"></span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>

                  <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-mono pt-0.5">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date(n.created_at).toLocaleDateString('en-GB') : 'Just now'}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
