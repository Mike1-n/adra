import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { SearchFilter } from '../components/common/SearchFilter';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { db } from '../lib/supabase';
import { formatDate, generateCode } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function ActivitiesPage() {
  const { hasPermission, currentUser } = useAuth();
  const toast = useToast();
  const canEdit = hasPermission(['Administrator', 'Project Officer']);

  const [activities, setActivities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const [formData, setFormData] = useState({
    activity_code: '',
    activity_name: '',
    project_id: '',
    description: '',
    activity_date: '',
    location: '',
    status: 'Planned',
    responsible_officer: '',
    expected_output: '',
    actual_output: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [actList, projList] = await Promise.all([
        db.getActivities(),
        db.getProjects(),
      ]);
      setActivities(actList);
      setProjects(projList);
    } catch (err) {
      toast.error('Failed to load activities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setSelectedActivity(null);
    setFormData({
      activity_code: generateCode('ACT'),
      activity_name: '',
      project_id: projects[0]?.id || '',
      description: '',
      activity_date: new Date().toISOString().split('T')[0],
      location: '',
      status: 'Planned',
      responsible_officer: currentUser?.full_name || 'Project Officer',
      expected_output: '',
      actual_output: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (act) => {
    setSelectedActivity(act);
    setFormData({
      activity_code: act.activity_code,
      activity_name: act.activity_name,
      project_id: act.project_id,
      description: act.description || '',
      activity_date: act.activity_date,
      location: act.location,
      status: act.status,
      responsible_officer: act.responsible_officer || currentUser?.full_name || '',
      expected_output: act.expected_output || '',
      actual_output: act.actual_output || '',
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.activity_name || !formData.project_id || !formData.location) {
      toast.warning('Please fill in all required fields.');
      return;
    }

    try {
      const selectedProj = projects.find(p => p.id === formData.project_id);
      const payload = {
        ...formData,
        project_name: selectedProj?.project_name || 'Project',
      };

      if (selectedActivity) {
        await db.updateActivity(selectedActivity.id, payload);
        toast.success('Activity updated successfully.');
      } else {
        await db.createActivity(payload);
        toast.success('Activity scheduled successfully.');
      }
      setIsFormOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to save activity.');
    }
  };

  const handleDelete = async () => {
    if (!selectedActivity) return;
    try {
      await db.deleteActivity(selectedActivity.id);
      toast.success('Activity removed.');
      loadData();
    } catch (err) {
      toast.error('Failed to delete activity.');
    }
  };

  const filtered = activities.filter((act) => {
    const matchesSearch =
      act.activity_name?.toLowerCase().includes(search.toLowerCase()) ||
      act.activity_code?.toLowerCase().includes(search.toLowerCase()) ||
      act.location?.toLowerCase().includes(search.toLowerCase()) ||
      act.project_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || act.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarCheck2 className="w-6 h-6 text-emerald-400" />
            Project Activities & Workplans
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Plan, monitor and report progress on field operations and community training sessions.
          </p>
        </div>

        {canEdit && (
          <Button variant="primary" onClick={handleOpenCreate} icon={Plus}>
            New Activity
          </Button>
        )}
      </div>

      {/* Search & Filter */}
      <SearchFilter
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search activities by name, location or project..."
        selectedFilter={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={[
          { label: 'All Statuses', value: 'ALL' },
          { label: 'Planned', value: 'Planned' },
          { label: 'Ongoing', value: 'Ongoing' },
          { label: 'Completed', value: 'Completed' },
          { label: 'Cancelled', value: 'Cancelled' },
        ]}
      />

      {loading ? (
        <LoadingSpinner text="Fetching activities..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No activities found"
          description="No activity records match your filter criteria."
          actionText={canEdit ? 'Schedule Activity' : undefined}
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((act) => (
            <Card key={act.id} className="adra-card-hover">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-2 py-0.5 rounded">
                      {act.activity_code}
                    </span>
                    <span className="text-xs text-slate-400">• {act.project_name}</span>
                    <Badge status={act.status} />
                  </div>

                  <h3 className="text-base font-bold text-slate-100">
                    {act.activity_name}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {act.description || 'No detailed description.'}
                  </p>

                  {/* Outputs summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold mb-0.5">
                        Expected Output
                      </span>
                      <span className="text-slate-300">{act.expected_output || 'Not specified'}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80">
                      <span className="text-emerald-400 block text-[10px] uppercase tracking-wider font-semibold mb-0.5">
                        Actual Output Achieved
                      </span>
                      <span className="text-slate-200 font-medium">{act.actual_output || 'In progress / Pending'}</span>
                    </div>
                  </div>
                </div>

                {/* Right metadata & actions */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800 text-xs text-slate-400 shrink-0">
                  <div className="space-y-1.5 text-right">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{formatDate(act.activity_date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{act.location}</span>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(act)}
                        icon={Edit2}
                      >
                        Edit
                      </Button>
                      <button
                        onClick={() => {
                          setSelectedActivity(act);
                          setIsDeleteOpen(true);
                        }}
                        title="Delete Activity"
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Activity Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedActivity ? 'Edit Activity' : 'Schedule New Activity'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Activity Code</label>
              <input
                type="text"
                value={formData.activity_code}
                onChange={(e) => setFormData({ ...formData, activity_code: e.target.value })}
                className="adra-input font-mono uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="adra-select"
              >
                <option value="Planned">Planned</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Activity Name</label>
            <input
              type="text"
              value={formData.activity_name}
              onChange={(e) => setFormData({ ...formData, activity_name: e.target.value })}
              placeholder="e.g. Drought Seed Distribution Workshop"
              className="adra-input"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Linked Project</label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="adra-select"
              required
            >
              <option value="">-- Select Project --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.project_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Scheduled Date</label>
              <input
                type="date"
                value={formData.activity_date}
                onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
                className="adra-input"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Venue / Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Lodwar Training Hall"
                className="adra-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Expected Output (Target)</label>
            <input
              type="text"
              value={formData.expected_output}
              onChange={(e) => setFormData({ ...formData, expected_output: e.target.value })}
              placeholder="e.g. Distribute kits to 500 farmer heads"
              className="adra-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Actual Output (Realized / Delivered)</label>
            <textarea
              value={formData.actual_output}
              onChange={(e) => setFormData({ ...formData, actual_output: e.target.value })}
              placeholder="Describe actual numbers, sign-off logs, or observations..."
              className="adra-input min-h-[60px]"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {selectedActivity ? 'Save Changes' : 'Schedule Activity'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Activity"
        message={`Are you sure you want to delete activity "${selectedActivity?.activity_name}"?`}
      />
    </div>
  );
}
