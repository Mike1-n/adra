import React, { useState } from 'react';
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
  Inbox,
  Eye,
  X
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';

export function SupervisorNotificationsView({
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectNotification
}) {
  const toast = useToast();
  const [selectedNotification, setSelectedNotification] = useState(null);

  const handleMarkAll = async () => {
    if (onMarkAllAsRead) {
      await onMarkAllAsRead();
      toast.success('All notifications marked as read.');
    }
  };

  const handleViewMore = (n) => {
    if (onMarkAsRead && !n.is_read) {
      onMarkAsRead(n.id);
    }
    setSelectedNotification(n);
  };

  const typeLabels = {
    'assignment': 'Assignment',
    'report_submitted': 'Report Submitted',
    'accepted': 'Accepted',
    'pm_feedback': 'Feedback',
    'overdue': 'Overdue Alert'
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-3 pb-24">
      {/* Clean Header */}
      <div className="flex items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Notification Center
          </h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAll}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8 text-center space-y-1">
            <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No Notifications</p>
            <p className="text-[11px] text-slate-400">You are all caught up on field updates.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map(n => {
              const isUnread = !n.is_read;
              const typeLabel = typeLabels[n.type] || (n.type ? n.type.replace('_', ' ') : 'Alert');
              const formattedDate = n.created_at
                ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date(n.created_at).toLocaleDateString('en-GB')
                : 'Just now';

              return (
                <div
                  key={n.id}
                  onClick={() => handleViewMore(n)}
                  className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isUnread
                      ? 'bg-emerald-50/40 hover:bg-emerald-50/70'
                      : 'hover:bg-slate-50 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="pt-1 shrink-0">
                      {isUnread ? (
                        <span className="block w-2 h-2 rounded-full bg-[#006B56]" />
                      ) : (
                        <span className="block w-2 h-2 rounded-full bg-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs truncate ${isUnread ? 'font-bold text-slate-900' : 'text-slate-800 font-medium'}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {typeLabel} • {formattedDate}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewMore(n);
                    }}
                    className="shrink-0 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-slate-700 shadow-2xs cursor-pointer"
                  >
                    View More
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Details Modal ("View More") */}
      {selectedNotification && (
        <Modal
          isOpen={!!selectedNotification}
          onClose={() => setSelectedNotification(null)}
          title="Notification Details"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {typeLabels[selectedNotification.type] || selectedNotification.type || 'Alert'}
              </span>
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {selectedNotification.created_at
                  ? new Date(selectedNotification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date(selectedNotification.created_at).toLocaleDateString('en-GB')
                  : 'Just now'}
              </span>
            </div>

            <div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {selectedNotification.title}
              </h4>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed font-normal text-xs sm:text-sm">
              {selectedNotification.message}
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedNotification(null)}
              >
                Close
              </Button>

              {onSelectNotification && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const item = selectedNotification;
                    setSelectedNotification(null);
                    onSelectNotification(item);
                  }}
                  icon={ChevronRight}
                  className="bg-[#006B56] hover:bg-[#005544]"
                >
                  Open Details
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
