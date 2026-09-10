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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Announcements List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader
              title="Active System Broadcasts & Field Alerts"
              subtitle="Messages delivered to web and mobile field app dashboards"
            />

            {loading ? (
              <LoadingSpinner text="Retrieving broadcasts..." />
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs">
                <Bell className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="font-bold text-slate-900">No Active Broadcasts</p>
                <p className="mt-0.5">Publish an announcement to notify staff or donors.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4 adra-card-hover"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            n.type === 'Alert'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : n.type === 'Security'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-500/30'
                          }`}
                        >
                          {n.type}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                      </div>

                      <p className="text-xs text-slate-700 mt-1.5 leading-relaxed font-medium">
                        {n.message}
                      </p>

                      <div className="flex items-center gap-3 mt-2.5 text-[11px] text-slate-500">
                        <span>Target: {Array.isArray(n.target_roles) ? n.target_roles.join(', ') : n.target_roles}</span>
                        <span>•</span>
                        <span>Published: {formatDate(n.created_at)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(n.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Broadcast"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Automated Alert Threshold Triggers */}
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Automated Trigger Rules"
              subtitle="Real-time threshold monitors"
            />

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900">Budget Overrun Alert</p>
                  <p className="text-[10px] text-slate-500">Notify Finance when expenditure exceeds 85% of budget cap</p>
                </div>
                <input
                  type="checkbox"
                  checked={rules.low_budget}
                  onChange={() => handleToggleRule('low_budget')}
                  className="rounded bg-white border-slate-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900">M&E Indicator Target Reached</p>
                  <p className="text-[10px] text-slate-500">Broadcast celebration when indicator hits 100% of target</p>
                </div>
                <input
                  type="checkbox"
                  checked={rules.me_milestone}
                  onChange={() => handleToggleRule('me_milestone')}
                  className="rounded bg-white border-slate-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900">Pending User Approval</p>
                  <p className="text-[10px] text-slate-500">Alert Admin when newly registered staff submits verification</p>
                </div>
                <input
                  type="checkbox"
                  checked={rules.approval_alert}
                  onChange={() => handleToggleRule('approval_alert')}
                  className="rounded bg-white border-slate-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900">Brute-Force Intrusion Warning</p>
                  <p className="text-[10px] text-slate-500">Trigger immediate lockout notice upon 5 failed logins</p>
                </div>
                <input
                  type="checkbox"
                  checked={rules.security_warning}
                  onChange={() => handleToggleRule('security_warning')}
                  className="rounded bg-white border-slate-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                />
              </div>
            </div>
          </Card>
        </div>
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
