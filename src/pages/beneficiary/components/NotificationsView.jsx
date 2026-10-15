import React, { useState, useMemo } from 'react';
import {
  Bell,
  CheckCheck,
  CheckCircle,
  Clock,
  ChevronRight,
  Eye,
  Check,
  User,
  Truck,
  HandHeart,
  Info
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
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
  const [selectedNotification, setSelectedNotification] = useState(null);

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

  const handleViewMore = (notif) => {
    if (!notif.is_read) {
      setNotifications(prev =>
        prev.map(n => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
    }
    setSelectedNotification(notif);
  };

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      if (activeFilter === 'UNREAD' && n.is_read) return false;
      if (activeFilter !== 'ALL' && activeFilter !== 'UNREAD' && n.category.toUpperCase() !== activeFilter.toUpperCase()) {
        return false;
      }
      return true;
    });
  }, [notifications, activeFilter]);

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'approvals':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'distributions':
        return <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
      case 'requests':
        return <HandHeart className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      case 'community':
        return <Info className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
      case 'account':
        return <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
    }
  };

  const getCategoryBadgeStyle = (category) => {
    switch (category?.toLowerCase()) {
      case 'approvals':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'distributions':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'requests':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'community':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'account':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-3">
      {/* Clean Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Notifications
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
            onClick={handleMarkAllRead}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Minimal Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'ALL', label: 'All' },
          { id: 'UNREAD', label: `Unread (${unreadCount})` },
          { id: 'APPROVALS', label: 'Approvals' },
          { id: 'DISTRIBUTIONS', label: 'Distributions' },
          { id: 'REQUESTS', label: 'Requests' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeFilter === tab.id
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
            <p className="text-xs font-bold text-slate-700">No Notifications</p>
            <p className="text-[11px] text-slate-400 mt-0.5">You are all caught up.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3 w-8 text-center"></th>
                    <th className="py-2.5 px-3 w-28">Category</th>
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
                        notif.is_read
                          ? 'hover:bg-slate-50/80 bg-white text-slate-700'
                          : 'bg-emerald-50/40 hover:bg-emerald-50/70 text-slate-900 font-semibold'
                      }`}
                    >
                      <td className="py-3 px-3 text-center align-middle">
                        {!notif.is_read && (
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-600" />
                        )}
                      </td>
                      <td className="py-3 px-3 align-middle whitespace-nowrap text-slate-500 font-medium">
                        {notif.category}
                      </td>
                      <td className="py-3 px-3 align-middle truncate max-w-md">
                        {notif.title}
                      </td>
                      <td className="py-3 px-3 align-middle whitespace-nowrap text-slate-400 text-[11px]">
                        {notif.created_at}
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

            {/* Phone Mode: Uncluttered Single/Two-Line Rows */}
            <div className="sm:hidden divide-y divide-slate-100">
              {filtered.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleViewMore(notif)}
                  className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    notif.is_read
                      ? 'hover:bg-slate-50 bg-white'
                      : 'bg-emerald-50/40 hover:bg-emerald-50/70'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="pt-1 shrink-0">
                      {!notif.is_read ? (
                        <span className="block w-2 h-2 rounded-full bg-emerald-600" />
                      ) : (
                        <span className="block w-2 h-2 rounded-full bg-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs truncate ${notif.is_read ? 'text-slate-800' : 'font-bold text-slate-900'}`}>
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {notif.category} • {notif.created_at}
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

      {/* Details Modal ("View More") */}
      {selectedNotification && (
        <Modal
          isOpen={!!selectedNotification}
          onClose={() => setSelectedNotification(null)}
          title={
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg border ${getCategoryBadgeStyle(
                  selectedNotification.category
                )}`}
              >
                {getCategoryIcon(selectedNotification.category)}
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block leading-tight">
                  Notification Details
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  {selectedNotification.category}
                </span>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeStyle(
                    selectedNotification.category
                  )}`}
                >
                  {selectedNotification.category}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedNotification.created_at}</span>
                </div>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {selectedNotification.title}
              </h3>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              {selectedNotification.message}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-xl bg-slate-50/60 border border-slate-100">
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Status</span>
                <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Read
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Category</span>
                <span className="font-semibold text-slate-700 mt-0.5 block">
                  {selectedNotification.category}
                </span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  handleToggleRead(selectedNotification.id);
                  setSelectedNotification(prev =>
                    prev ? { ...prev, is_read: !prev.is_read } : null
                  );
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition w-full sm:w-auto text-center cursor-pointer"
              >
                {selectedNotification.is_read ? 'Mark as Unread' : 'Mark as Read'}
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedNotification(null)}
                >
                  Close
                </Button>

                {selectedNotification.action_tab && onNavigateTab && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const target = selectedNotification.action_tab;
                      setSelectedNotification(null);
                      onNavigateTab(target);
                    }}
                    icon={ChevronRight}
                    className="bg-[#006B56] hover:bg-[#005544]"
                  >
                    {selectedNotification.action_label || 'View Details'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
