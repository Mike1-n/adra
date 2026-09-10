import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  Award,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { SearchFilter } from '../components/common/SearchFilter';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { db } from '../lib/supabase';
import { calculatePercentage, generateCode } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function MonitoringEvaluationPage() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const canEdit = hasPermission(['Administrator', 'M&E Officer']);

  const [indicators, setIndicators] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUpdateResultOpen, setIsUpdateResultOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState(null);

  const [formData, setFormData] = useState({
    indicator_code: '',
    indicator_name: '',
    project_id: '',
    description: '',
    baseline: 0,
    target: 100,
    actual_result: 0,
    measurement_unit: 'Individuals',
    reporting_period: 'Q1 2025',
  });

  const [quickResult, setQuickResult] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [indList, projList] = await Promise.all([
        db.getIndicators(),
        db.getProjects(),
      ]);
      setIndicators(indList);
      setProjects(projList);
    } catch (err) {
      toast.error('Failed to load M&E indicators.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setSelectedIndicator(null);
    setFormData({
      indicator_code: generateCode('IND'),
      indicator_name: '',
      project_id: projects[0]?.id || '',
      description: '',
      baseline: 0,
      target: 1000,
      actual_result: 0,
      measurement_unit: 'Individuals',
      reporting_period: 'Q1 2025',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (ind) => {
    setSelectedIndicator(ind);
    setFormData({
      indicator_code: ind.indicator_code,
      indicator_name: ind.indicator_name,
      project_id: ind.project_id,
      description: ind.description || '',
      baseline: ind.baseline,
      target: ind.target,
      actual_result: ind.actual_result,
      measurement_unit: ind.measurement_unit,
      reporting_period: ind.reporting_period,
    });
    setIsFormOpen(true);
  };

  const handleOpenQuickResult = (ind) => {
    setSelectedIndicator(ind);
    setQuickResult(ind.actual_result);
    setIsUpdateResultOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.indicator_name || !formData.project_id || !formData.target) {
      toast.warning('Please fill in all required fields.');
      return;
    }

    try {
      const selectedProj = projects.find(p => p.id === formData.project_id);
      const payload = {
        ...formData,
        baseline: Number(formData.baseline),
        target: Number(formData.target),
        actual_result: Number(formData.actual_result),
        project_name: selectedProj?.project_name || 'Project',
      };

      if (selectedIndicator) {
        await db.updateIndicator(selectedIndicator.id, payload);
        toast.success('Indicator updated.');
      } else {
        await db.createIndicator(payload);
        toast.success('Indicator added to framework.');
      }
      setIsFormOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to save indicator.');
    }
  };

  const handleSaveQuickResult = async (e) => {
    e.preventDefault();
    if (!selectedIndicator) return;
    try {
      await db.updateIndicator(selectedIndicator.id, {
        actual_result: Number(quickResult),
      });
      toast.success(`Updated actual result for ${selectedIndicator.indicator_code}`);
      setIsUpdateResultOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to update result.');
    }
  };

  const handleDelete = async () => {
    if (!selectedIndicator) return;
    try {
      await db.deleteIndicator(selectedIndicator.id);
      toast.success('Indicator removed.');
      loadData();
    } catch (err) {
      toast.error('Failed to delete indicator.');
    }
  };

  const filtered = indicators.filter((ind) => {
    const matchesSearch =
      ind.indicator_name?.toLowerCase().includes(search.toLowerCase()) ||
      ind.indicator_code?.toLowerCase().includes(search.toLowerCase()) ||
      ind.project_name?.toLowerCase().includes(search.toLowerCase());
    const matchesProject =
      projectFilter === 'ALL' || ind.project_id === projectFilter;
    return matchesSearch && matchesProject;
  });

  const getIndicatorStatus = (actual, target) => {
    const pct = (Number(actual) / Number(target)) * 100;
    if (pct >= 100) return { label: 'Exceeded', class: 'badge-emerald' };
    if (pct >= 60) return { label: 'On Track', class: 'badge-blue' };
    if (pct >= 30) return { label: 'Needs Attention', class: 'badge-amber' };
    return { label: 'Critical / Off Track', class: 'badge-rose' };
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-emerald-600" />
            Monitoring & Evaluation (M&E) Logframe
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Track key performance indicators, baseline metrics, and humanitarian impact milestones.
          </p>
        </div>

        {canEdit && (
          <Button variant="primary" onClick={handleOpenCreate} icon={Plus}>
            New Indicator
          </Button>
        )}
      </div>

      {/* Search & Project Filter */}
      <SearchFilter
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search indicators by name or code..."
        selectedFilter={projectFilter}
        onFilterChange={setProjectFilter}
        filterOptions={[
          { label: 'All Projects', value: 'ALL' },
          ...projects.map(p => ({ label: p.project_name, value: p.id })),
        ]}
      />

      {loading ? (
        <LoadingSpinner text="Computing logframe achievement rates..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No indicators defined"
          description="Create your first M&E indicator to track project outcomes."
          actionText={canEdit ? 'Add Indicator' : undefined}
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((ind) => {
            const achievementPct = calculatePercentage(ind.actual_result, ind.target);
            const status = getIndicatorStatus(ind.actual_result, ind.target);

            return (
              <Card key={ind.id} className="adra-card-hover flex flex-col justify-between">
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-2 py-0.5 rounded">
                        {ind.indicator_code}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-2 font-medium">
                        Period: {ind.reporting_period}
                      </span>
                    </div>
                    <span className={status.class}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
                      {status.label}
                    </span>
                  </div>

                  {/* Indicator Title & Description */}
                  <h3 className="text-sm font-bold text-slate-100 mt-1">
                    {ind.indicator_name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    {ind.project_name}
                  </p>

                  {/* Progress Stats Block */}
                  <div className="my-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Achievement Progress</span>
                      <span className="font-bold text-emerald-400">{achievementPct}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-emerald-600 to-emerald-400"
                        style={{ width: `${Math.min(100, achievementPct)}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Baseline</span>
                        <span className="font-medium text-slate-300">{ind.baseline}</span>
                      </div>
                      <div className="border-x border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Target</span>
                        <span className="font-bold text-slate-200">{ind.target}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-500 uppercase block font-semibold">Actual</span>
                        <span className="font-bold text-emerald-400">{ind.actual_result}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                  <span className="text-slate-500 text-[11px]">
                    Unit: <span className="text-slate-300 font-medium">{ind.measurement_unit}</span>
                  </span>

                  {canEdit && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenQuickResult(ind)}
                      >
                        Update Actual
                      </Button>
                      <button
                        onClick={() => handleOpenEdit(ind)}
                        title="Edit indicator"
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedIndicator(ind);
                          setIsDeleteOpen(true);
                        }}
                        title="Delete indicator"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Indicator Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedIndicator ? 'Edit M&E Indicator' : 'Create M&E Indicator'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Indicator Code</label>
              <input
                type="text"
                value={formData.indicator_code}
                onChange={(e) => setFormData({ ...formData, indicator_code: e.target.value })}
                className="adra-input font-mono uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reporting Period</label>
              <input
                type="text"
                value={formData.reporting_period}
                onChange={(e) => setFormData({ ...formData, reporting_period: e.target.value })}
                placeholder="e.g. Q1 2025 or Annual 2025"
                className="adra-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Indicator Title / Metric</label>
            <input
              type="text"
              value={formData.indicator_name}
              onChange={(e) => setFormData({ ...formData, indicator_name: e.target.value })}
              placeholder="e.g. Farmers adopting climate-smart agricultural techniques"
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Baseline Value</label>
              <input
                type="number"
                value={formData.baseline}
                onChange={(e) => setFormData({ ...formData, baseline: e.target.value })}
                className="adra-input"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Value</label>
              <input
                type="number"
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                className="adra-input"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Actual Result</label>
              <input
                type="number"
                value={formData.actual_result}
                onChange={(e) => setFormData({ ...formData, actual_result: e.target.value })}
                className="adra-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Unit of Measurement</label>
            <input
              type="text"
              value={formData.measurement_unit}
              onChange={(e) => setFormData({ ...formData, measurement_unit: e.target.value })}
              placeholder="e.g. Farmers, Households, Individuals, %, Hectares"
              className="adra-input"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {selectedIndicator ? 'Save Changes' : 'Create Indicator'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Update Actual Modal */}
      {selectedIndicator && (
        <Modal
          isOpen={isUpdateResultOpen}
          onClose={() => setIsUpdateResultOpen(false)}
          title={`Update Actual Progress: ${selectedIndicator.indicator_code}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveQuickResult} className="space-y-4">
            <p className="text-xs text-slate-300">{selectedIndicator.indicator_name}</p>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
              <span className="text-slate-400">Target Value: </span>
              <span className="font-bold text-slate-100">{selectedIndicator.target} {selectedIndicator.measurement_unit}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Enter Current Verified Actual Result ({selectedIndicator.measurement_unit})
              </label>
              <input
                type="number"
                value={quickResult}
                onChange={(e) => setQuickResult(e.target.value)}
                className="adra-input text-base font-bold text-emerald-400"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <Button type="button" variant="secondary" onClick={() => setIsUpdateResultOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Update Result
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Indicator"
        message={`Are you sure you want to remove indicator "${selectedIndicator?.indicator_name}" (${selectedIndicator?.indicator_code})?`}
      />
    </div>
  );
}
