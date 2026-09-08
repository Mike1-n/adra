import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  UserCheck,
  Tag,
  PackageCheck
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { SearchFilter } from '../components/common/SearchFilter';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Pagination } from '../components/common/Pagination';
import { db } from '../lib/supabase';
import { formatDate, generateCode } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const INTERVENTION_TYPES = [
  'Food Assistance',
  'Education Support',
  'Agricultural Support',
  'Skills Training',
  'Health Support',
  'Water & Sanitation (WASH)',
  'Shelter & NFI',
  'Cash Transfer'
];

export function InterventionsPage() {
  const { hasPermission, currentUser } = useAuth();
  const toast = useToast();
  const canEdit = hasPermission(['Administrator', 'Project Officer']);

  const [interventions, setInterventions] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState(null);

  const [formData, setFormData] = useState({
    intervention_code: '',
    beneficiary_id: '',
    project_id: '',
    intervention_type: INTERVENTION_TYPES[0],
    description: '',
    quantity_or_value: '',
    intervention_date: '',
    responsible_officer: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [intList, benList, projList] = await Promise.all([
        db.getInterventions(),
        db.getBeneficiaries(),
        db.getProjects(),
      ]);
      setInterventions(intList);
      setBeneficiaries(benList);
      setProjects(projList);
    } catch (err) {
      toast.error('Failed to load interventions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setSelectedIntervention(null);
    setFormData({
      intervention_code: generateCode('INT'),
      beneficiary_id: beneficiaries[0]?.id || '',
      project_id: projects[0]?.id || '',
      intervention_type: INTERVENTION_TYPES[0],
      description: '',
      quantity_or_value: '',
      intervention_date: new Date().toISOString().split('T')[0],
      responsible_officer: currentUser?.full_name || 'Project Officer',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedIntervention(item);
    setFormData({
      intervention_code: item.intervention_code,
      beneficiary_id: item.beneficiary_id,
      project_id: item.project_id,
      intervention_type: item.intervention_type,
      description: item.description,
      quantity_or_value: item.quantity_or_value,
      intervention_date: item.intervention_date,
      responsible_officer: item.responsible_officer || currentUser?.full_name || '',
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.beneficiary_id || !formData.project_id || !formData.description) {
      toast.warning('Please fill in all required fields.');
      return;
    }

    try {
      const selectedBen = beneficiaries.find(b => b.id === formData.beneficiary_id);
      const selectedProj = projects.find(p => p.id === formData.project_id);
      const payload = {
        ...formData,
        beneficiary_name: selectedBen?.full_name || 'Beneficiary',
        project_name: selectedProj?.project_name || 'Project',
      };

      if (selectedIntervention) {
        await db.updateIntervention(selectedIntervention.id, payload);
        toast.success('Intervention updated successfully.');
      } else {
        await db.createIntervention(payload);
        toast.success('Intervention recorded successfully.');
      }
      setIsFormOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to save intervention.');
    }
  };

  const handleDelete = async () => {
    if (!selectedIntervention) return;
    try {
      await db.deleteIntervention(selectedIntervention.id);
      toast.success('Intervention record deleted.');
      loadData();
    } catch (err) {
      toast.error('Failed to delete intervention.');
    }
  };

  const filtered = interventions.filter((item) => {
    const matchesSearch =
      item.beneficiary_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.intervention_code?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase()) ||
      item.project_name?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || item.intervention_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-emerald-400" />
            Interventions & Direct Aid Delivery
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Record, track and verify direct humanitarian assistance delivered to beneficiaries.
          </p>
        </div>

        {canEdit && (
          <Button variant="primary" onClick={handleOpenCreate} icon={Plus}>
            Record Intervention
          </Button>
        )}
      </div>

      {/* Search & Filter */}
      <SearchFilter
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search by beneficiary, code, description..."
        selectedFilter={typeFilter}
        onFilterChange={(val) => {
          setTypeFilter(val);
          setCurrentPage(1);
        }}
        filterOptions={[
          { label: 'All Intervention Types', value: 'ALL' },
          ...INTERVENTION_TYPES.map(t => ({ label: t, value: t })),
        ]}
      />

      {loading ? (
        <LoadingSpinner text="Fetching intervention logs..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No interventions found"
          description="No direct aid interventions match your search parameters."
          actionText={canEdit ? 'Record Intervention' : undefined}
          onAction={handleOpenCreate}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Beneficiary</th>
                  <th className="py-3.5 px-4">Sector / Type</th>
                  <th className="py-3.5 px-4">Description & Package</th>
                  <th className="py-3.5 px-4">Linked Project</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {paginated.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/60 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                      {item.intervention_code}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-100">
                      {item.beneficiary_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        {item.intervention_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="line-clamp-1 text-slate-200">{item.description}</p>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Qty/Val: {item.quantity_or_value}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-[160px] truncate">
                      {item.project_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {formatDate(item.intervention_date)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {canEdit && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit intervention"
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedIntervention(item);
                              setIsDeleteOpen(true);
                            }}
                            title="Delete intervention"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4">
            <Pagination
              currentPage={currentPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </Card>
      )}

      {/* Intervention Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedIntervention ? 'Edit Intervention Record' : 'Record New Aid Intervention'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Intervention Code</label>
              <input
                type="text"
                value={formData.intervention_code}
                onChange={(e) => setFormData({ ...formData, intervention_code: e.target.value })}
                className="adra-input font-mono uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Intervention Type</label>
              <select
                value={formData.intervention_type}
                onChange={(e) => setFormData({ ...formData, intervention_type: e.target.value })}
                className="adra-select"
              >
                {INTERVENTION_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Beneficiary</label>
              <select
                value={formData.beneficiary_id}
                onChange={(e) => setFormData({ ...formData, beneficiary_id: e.target.value })}
                className="adra-select"
                required
              >
                <option value="">-- Select Beneficiary --</option>
                {beneficiaries.map(b => (
                  <option key={b.id} value={b.id}>{b.full_name} ({b.beneficiary_code})</option>
                ))}
              </select>
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Aid Description & Specific Items</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Distributed 15kg certified sorghum seeds and drip line kit"
              className="adra-input min-h-[70px]"
              rows={2}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity / Estimated Value</label>
              <input
                type="text"
                value={formData.quantity_or_value}
                onChange={(e) => setFormData({ ...formData, quantity_or_value: e.target.value })}
                placeholder="e.g. 1 Kit + 15kg Seeds ($180 value)"
                className="adra-input"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Distribution Date</label>
              <input
                type="date"
                value={formData.intervention_date}
                onChange={(e) => setFormData({ ...formData, intervention_date: e.target.value })}
                className="adra-input"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {selectedIntervention ? 'Save Changes' : 'Record Aid'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Intervention"
        message="Are you sure you want to remove this intervention record? This will adjust beneficiary aid records."
      />
    </div>
  );
}
