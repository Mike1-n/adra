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
  Check,
  Clock,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';

export function PMNotificationsView({
  notifications = [],
  onMarkAllAsRead,
  onNavigateTab
}) {
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [localNotifications, setLocalNotifications] = useState(notifications);
  const [selectedNotification, setSelectedNotification] = useState(null);

  React.useEffect(() => {
    if (notifications && notifications.length > 0) {
      setLocalNotifications(notifications);
    }
  }, [notifications]);

  const toggleRead = (id) => {
    setLocalNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const handleMarkAll = () => {
    setLocalNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (onMarkAllAsRead) onMarkAllAsRead();
  };

  const handleViewMore = (notif) => {
    if (!notif.read) {
      setLocalNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    }
    setSelectedNotification(notif);
  };

  const unreadCount = localNotifications.filter(n => !n.read).length;

  const filtered = useMemo(() => {
    return localNotifications.filter(n => {
      if (filterCategory === 'UNREAD' && n.read) return false;
      if (filterCategory !== 'ALL' && filterCategory !== 'UNREAD' && n.type !== filterCategory) {
        return false;
      }
      return true;
    });
  }, [localNotifications, filterCategory]);

  const getTypeLabel = (type) => {
    switch (type) {
      case 'resource':
        return 'Stock Alert';
      case 'complaint':
        return 'Complaint';
      case 'request':
        return 'Aid Request';
      case 'activity':
        return 'Field Activity';
      case 'registration':
        return 'Registration';
      default:
        return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Notice';
    }
  };

  const getTargetTab = (type) => {
    switch (type) {
      case 'request':
        return { tab: 'requests', label: 'View Aid Requests' };
      case 'activity':
        return { tab: 'activities', label: 'View Field Activities' };
      case 'resource':
        return { tab: 'resources', label: 'View Stock & Depots' };
      case 'complaint':
        return { tab: 'feedback', label: 'Open Feedback Desk' };
      case 'registration':
        return { tab: 'beneficiaries', label: 'View Beneficiaries' };
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Clean Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Operational Alerts
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
            <Check className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Minimal Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'ALL', label: 'All' },
          { id: 'UNREAD', label: `Unread (${unreadCount})` },
          { id: 'request', label: 'Aid Requests' },
          { id: 'activity', label: 'Activities' },
          { id: 'resource', label: 'Stock Alerts' },
          { id: 'complaint', label: 'Complaints' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterCategory(tab.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filterCategory === tab.id
                ? 'bg-[#006B56] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No Alerts</p>
            <p className="text-[11px] text-slate-400 mt-0.5">All caught up! No alerts in this view.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3 w-8 text-center"></th>
                    <th className="py-2.5 px-3 w-28">Type</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3 w-28 text-slate-400">Date</th>
                    <th className="py-2.5 px-3 w-24 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filtered.map(notif => (
                    <tr
                      key={notif.id}
                      onClick={() => handleViewMore(notif)}
                      className={`transition-colors cursor-pointer group ${
                        notif.read
                          ? 'hover:bg-slate-50/80 bg-white text-slate-700'
                          : 'bg-emerald-50/40 hover:bg-emerald-50/70 text-slate-900 font-semibold'
                      }`}
                    >
                      <td className="py-3 px-3 text-center align-middle">
                        {!notif.read && (
                          <span className="inline-block w-2 h-2 rounded-full bg-[#006B56]" />
                        )}
                      </td>
                      <td className="py-3 px-3 align-middle whitespace-nowrap text-slate-500 font-medium">
                        {getTypeLabel(notif.type)}
                      </td>
                      <td className="py-3 px-3 align-middle truncate max-w-md">
                        {notif.title}
                      </td>
                      <td className="py-3 px-3 align-middle whitespace-nowrap text-slate-400 text-[11px]">
                        {formatDate(notif.created_at || '2026-09-11')}
                      </td>
                      <td className="py-3 px-3 align-middle text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewMore(notif);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-slate-600 transition shadow-2xs cursor-pointer"
                        >
                          View More
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Phone Mode: Minimal Single/Two-Line Rows */}
            <div className="sm:hidden divide-y divide-slate-100">
              {filtered.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleViewMore(notif)}
                  className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    notif.read
                      ? 'hover:bg-slate-50 bg-white'
                      : 'bg-emerald-50/40 hover:bg-emerald-50/70'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="pt-1 shrink-0">
                      {!notif.read ? (
                        <span className="block w-2 h-2 rounded-full bg-[#006B56]" />
                      ) : (
                        <span className="block w-2 h-2 rounded-full bg-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs truncate ${notif.read ? 'text-slate-800' : 'font-bold text-slate-900'}`}>
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {getTypeLabel(notif.type)} • {formatDate(notif.created_at || '2026-09-11')}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewMore(notif);
                    }}
                    className="shrink-0 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-slate-700 shadow-2xs cursor-pointer"
                  >
                    View More
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Details Modal */}
      {selectedNotification && (
        <Modal
          isOpen={!!selectedNotification}
          onClose={() => setSelectedNotification(null)}
          title="Alert Details"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {getTypeLabel(selectedNotification.type)}
              </span>
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(selectedNotification.created_at || '2026-09-11')}
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

              {(() => {
                const target = getTargetTab(selectedNotification.type);
                if (target && onNavigateTab) {
                  return (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedNotification(null);
                        onNavigateTab(target.tab);
                      }}
                      icon={ChevronRight}
                      className="bg-[#006B56] hover:bg-[#005544]"
                    >
                      {target.label}
                    </Button>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
