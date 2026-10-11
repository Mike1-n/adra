import React, { useState, useEffect } from 'react';
import {
  Bell,
  Radio,
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
  ShieldAlert,
  Send,
  Sliders
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { db } from '../../../lib/supabase';
import { formatDate } from '../../../lib/utils';
import { useToast } from '../../../context/ToastContext';

export function NotificationsBroadcastView() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'Announcement',
    target_roles: 'All'
  });

  // Automated notification rules
  const [rules, setRules] = useState({
    low_budget: true,
    me_milestone: true,
    approval_alert: true,
    security_warning: true
  });

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await db.getNotifications();
      setNotifications(data);
    } catch (err) {
      toast.error('Failed to load system notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await db.createNotification({
        ...formData,
        target_roles: [formData.target_roles]
      });
      toast.success(`Broadcast "${formData.title}" published!`);
      setIsCreateOpen(false);
      loadNotifications();
    } catch (err) {
      toast.error('Failed to publish announcement.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await db.deleteNotification(id);
      toast.success('Notification removed.');
      loadNotifications();
    } catch (err) {
      toast.error('Failed to remove notification.');
    }
  };

  const handleToggleRule = (ruleKey) => {
    const next = !rules[ruleKey];
    setRules({ ...rules, [ruleKey]: next });
    toast.info(`Automated rule ${next ? 'enabled' : 'disabled'}.`);
  };

  const getNotificationTypeBadge = (type) => {
    const t = String(type || '').toLowerCase();
    if (t.includes('approved')) {
      return {
        label: 'Approved',
        className: 'bg-emerald-50 text-emerald-800 border-emerald-500/30 font-bold'
      };
    }
    if (t.includes('rejected') || t.includes('security')) {
      return {
        label: t.includes('rejected') ? 'Rejected' : 'Security',
        className: 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
      };
    }
    if (t.includes('alert') || t.includes('warning')) {
      return {
        label: 'Alert',
        className: 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
      };
    }
    return {
      label: type || 'Notice',
      className: 'bg-blue-50 text-blue-800 border-blue-300 font-bold'
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Radio className="w-6 h-6 text-emerald-600" />
            System Notifications & Announcements
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Configure system alerts, broadcast announcements to field teams, and manage automated triggers.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          icon={Plus}
        >
          Publish Broadcast
        </Button>
      </div>

      <div className="space-y-6">
        {/* Active Announcements Table */}
        <Card className="p-0 overflow-hidden shadow-2xs border border-slate-200">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">Active System Broadcasts & Field Alerts</h3>
            <p className="text-xs text-slate-500">Messages delivered to web and mobile field app dashboards ({notifications.length})</p>
          </div>

          {loading ? (
            <div className="p-8">
              <LoadingSpinner text="Retrieving broadcasts..." />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              <Bell className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-bold text-slate-900">No Active Broadcasts</p>
              <p className="mt-0.5">Publish an announcement to notify staff or donors.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Broadcast Title & Message</th>
                    <th className="py-3.5 px-4 hidden sm:table-cell">Target Audience</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Published</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {notifications.map((n) => {
                    const badge = getNotificationTypeBadge(n.type);
                    return (
                      <tr key={n.id} className="hover:bg-slate-50/80 transition group">
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border inline-block ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 align-top">
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">{n.title}</p>
                          <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed font-normal">
                            {n.message}
                          </p>
                          <div className="sm:hidden flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500 mt-1">
                            <span>Target: {Array.isArray(n.target_roles) ? n.target_roles.join(', ') : (n.target_roles || 'All')}</span>
                            <span>•</span>
                            <span>{formatDate(n.created_at)}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 align-top hidden sm:table-cell text-slate-700 whitespace-nowrap font-medium text-[11px]">
                          {Array.isArray(n.target_roles) ? n.target_roles.join(', ') : (n.target_roles || 'All')}
                        </td>
                        <td className="py-3.5 px-4 align-top hidden md:table-cell text-slate-500 whitespace-nowrap text-[11px]">
                          {formatDate(n.created_at)}
                        </td>
                        <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDelete(n.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Broadcast"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Automated Alert Threshold Triggers Table */}
        <Card className="p-0 overflow-hidden shadow-2xs border border-slate-200">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">Automated Trigger Rules</h3>
            <p className="text-xs text-slate-500">Real-time threshold monitors and alerts</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Trigger Rule</th>
                  <th className="py-3.5 px-4">Monitoring Condition & Action</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {[
                  {
                    key: 'low_budget',
                    name: 'Budget Overrun Alert',
                    desc: 'Notify Finance when expenditure exceeds 85% of budget cap'
                  },
                  {
                    key: 'me_milestone',
                    name: 'M&E Indicator Target Reached',
                    desc: 'Broadcast celebration when indicator hits 100% of target'
                  },
                  {
                    key: 'approval_alert',
                    name: 'Pending User Approval',
                    desc: 'Alert Admin when newly registered staff submits verification'
                  },
                  {
                    key: 'security_warning',
                    name: 'Brute-Force Intrusion Warning',
                    desc: 'Trigger immediate lockout notice upon 5 failed logins'
                  }
                ].map((rule) => {
                  const active = rules[rule.key];
                  return (
                    <tr key={rule.key} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {rule.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        {rule.desc}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${active ? 'bg-emerald-50 text-emerald-800 border-emerald-500/30' : 'bg-slate-100 text-slate-500 border-slate-300'}`}>
                            {active ? 'Active' : 'Disabled'}
                          </span>
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => handleToggleRule(rule.key)}
                            className="rounded bg-white border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Publish Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Publish System Broadcast"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-800 mb-1">Broadcast Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Mandatory Logframe Data Freeze for Annual Audit"
              className="adra-input text-xs sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Alert Classification</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="adra-select text-xs sm:text-sm font-medium"
              >
                <option value="Announcement">General Announcement</option>
                <option value="Alert">Emergency Field Alert</option>
                <option value="Security">Security Notice</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Target Audience</label>
              <select
                value={formData.target_roles}
                onChange={(e) => setFormData({ ...formData, target_roles: e.target.value })}
                className="adra-select text-xs sm:text-sm font-medium"
              >
                <option value="All">All Users & Roles</option>
                <option value="Field Worker">Field Workers & Mobile Officers</option>
                <option value="Program Manager">Program Managers & Supervisors</option>
                <option value="Finance Officer">Finance Officers</option>
                <option value="Donor">Donors & Partners</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Broadcast Message Body</label>
            <textarea
              required
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Provide comprehensive details, operational guidance, or deadlines..."
              className="adra-input text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={Send}>
              Publish Broadcast
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
