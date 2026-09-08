import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Eye,
  HeartHandshake,
  UserCheck,
  MapPin,
  Calendar,
  Phone,
  ShieldCheck
} from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
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

const VULNERABILITY_CATEGORIES = [
  'Female-headed Household',
  'Child-headed Household',
  'Elderly',
  'Persons with Disability',
  'Internally Displaced Person (IDP)',
  'Extremely Poor Household',
  'Youth at Risk',
  'General Community'
];

export function BeneficiariesPage() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const canEdit = hasPermission(['Administrator', 'Project Officer']);

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);

  const [formData, setFormData] = useState({
    beneficiary_code: '',
    full_name: '',
    gender: 'Female',
    date_of_birth: '',
    age: '',
    phone_number: '',
    location: '',
    vulnerability_category: VULNERABILITY_CATEGORIES[0],
    project_id: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [benList, projList, intList] = await Promise.all([
        db.getBeneficiaries(),
        db.getProjects(),
        db.getInterventions(),
      ]);
      setBeneficiaries(benList);
      setProjects(projList);
      setInterventions(intList);
    } catch (err) {
      toast.error('Failed to load beneficiaries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setSelectedBeneficiary(null);
    setFormData({
      beneficiary_code: generateCode('BEN'),
      full_name: '',
      gender: 'Female',
      date_of_birth: '1990-01-01',
      age: '35',
      phone_number: '',
      location: '',
      vulnerability_category: VULNERABILITY_CATEGORIES[0],
      project_id: projects[0]?.id || '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (ben) => {
    setSelectedBeneficiary(ben);
    setFormData({
      beneficiary_code: ben.beneficiary_code,
      full_name: ben.full_name,
      gender: ben.gender,
      date_of_birth: ben.date_of_birth || '',
      age: ben.age || '',
      phone_number: ben.phone_number || '',
      location: ben.location,
      vulnerability_category: ben.vulnerability_category,
      project_id: ben.project_id || '',
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.location || !formData.project_id) {
      toast.warning('Please fill all required fields.');
      return;
    }

    try {
      const selectedProj = projects.find(p => p.id === formData.project_id);
      const payload = {
        ...formData,
        age: Number(formData.age || 0),
        project_name: selectedProj?.project_name || 'Assigned Project',
      };

      if (selectedBeneficiary) {
        await db.updateBeneficiary(selectedBeneficiary.id, payload);
        toast.success('Beneficiary updated successfully.');
      } else {
        await db.createBeneficiary(payload);
        toast.success('Beneficiary registered successfully.');
      }
      setIsFormOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to save beneficiary record.');
    }
  };

  const handleDelete = async () => {
    if (!selectedBeneficiary) return;
    try {
      await db.deleteBeneficiary(selectedBeneficiary.id);
      toast.success('Beneficiary record removed.');
      loadData();
    } catch (err) {
      toast.error('Failed to delete beneficiary.');
    }
  };

  // Filtered beneficiaries
  const filtered = beneficiaries.filter((b) => {
    const matchesSearch =
      b.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.beneficiary_code?.toLowerCase().includes(search.toLowerCase()) ||
      b.location?.toLowerCase().includes(search.toLowerCase()) ||
      b.phone_number?.includes(search);
    const matchesCategory =
      categoryFilter === 'ALL' || b.vulnerability_category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const paginatedBeneficiaries = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Beneficiary interventions history
  const beneficiaryInterventions = interventions.filter(
    (i) => i.beneficiary_id === selectedBeneficiary?.id
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            Beneficiary Registry
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Register and track vulnerable individuals and households across project zones.
          </p>
        </div>

        {canEdit && (
          <Button variant="primary" onClick={handleOpenCreate} icon={Plus}>
            Register Beneficiary
          </Button>
        )}
      </div>

      {/* Search & Category Filter */}
      <SearchFilter
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search by name, code, phone or location..."
        selectedFilter={categoryFilter}
        onFilterChange={(val) => {
          setCategoryFilter(val);
          setCurrentPage(1);
        }}
        filterOptions={[
          { label: 'All Vulnerability Groups', value: 'ALL' },
          ...VULNERABILITY_CATEGORIES.map(c => ({ label: c, value: c })),
        ]}
      />

      {loading ? (
        <LoadingSpinner text="Loading beneficiary roster..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No beneficiaries found"
          description="Try adjusting your search terms or register a new beneficiary."
          actionText={canEdit ? 'Register Beneficiary' : undefined}
          onAction={handleOpenCreate}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Code / ID</th>
                  <th className="py-3.5 px-4">Full Name</th>
                  <th className="py-3.5 px-4">Gender & Age</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Vulnerability Category</th>
                  <th className="py-3.5 px-4">Linked Project</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {paginatedBeneficiaries.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/60 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                      {b.beneficiary_code}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-100">
                      {b.full_name}
                      {b.phone_number && (
                        <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                          {b.phone_number}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {b.gender} • {b.age || '-'} yrs
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <div className="flex items-center gap-1.5 truncate max-w-[160px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{b.location}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-300 border border-slate-700">
                        {b.vulnerability_category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-300 max-w-[180px] truncate">
                      {b.project_name || 'Project'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedBeneficiary(b);
                            setIsDetailOpen(true);
                          }}
                          title="View Profile & Aid History"
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(b)}
                              title="Edit beneficiary"
                              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBeneficiary(b);
                                setIsDeleteOpen(true);
                              }}
                              title="Delete beneficiary"
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
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

      {/* Beneficiary Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedBeneficiary ? 'Edit Beneficiary' : 'Register Beneficiary'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Beneficiary ID</label>
              <input
                type="text"
                value={formData.beneficiary_code}
                onChange={(e) => setFormData({ ...formData, beneficiary_code: e.target.value })}
                className="adra-input font-mono uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Legal Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="e.g. Grace Akinyi Omolo"
                className="adra-input"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="adra-select"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date of Birth</label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="adra-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Age (Years)</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="e.g. 41"
                className="adra-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Contact</label>
              <input
                type="text"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+254-712-345678"
                className="adra-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Village / Ward Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Lodwar Village, Turkana"
                className="adra-input"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Vulnerability Category</label>
              <select
                value={formData.vulnerability_category}
                onChange={(e) => setFormData({ ...formData, vulnerability_category: e.target.value })}
                className="adra-select"
              >
                {VULNERABILITY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Enrolled Project</label>
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

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {selectedBeneficiary ? 'Save Changes' : 'Register'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Beneficiary Profile & Intervention History Modal */}
      {selectedBeneficiary && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Beneficiary Profile: ${selectedBeneficiary.full_name}`}
        >
          <div className="space-y-5">
            {/* Header info card */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="font-mono font-semibold text-xs text-emerald-400">
                  {selectedBeneficiary.beneficiary_code}
                </span>
                <h4 className="text-base font-bold text-slate-100 mt-0.5">
                  {selectedBeneficiary.full_name}
                </h4>
                <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                  <span>{selectedBeneficiary.gender}</span> • 
                  <span>{selectedBeneficiary.age} years old</span> •
                  <span className="text-emerald-400 font-medium">{selectedBeneficiary.vulnerability_category}</span>
                </p>
              </div>

              <div className="text-right text-xs text-slate-400">
                <span className="block font-medium text-slate-200">{selectedBeneficiary.location}</span>
                <span>Enrolled in: {selectedBeneficiary.project_name}</span>
              </div>
            </div>

            {/* Assistance / Intervention Log */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-emerald-400" />
                Interventions & Aid History ({beneficiaryInterventions.length})
              </h5>

              {beneficiaryInterventions.length === 0 ? (
                <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                  No aid distributions recorded for this beneficiary yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {beneficiaryInterventions.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-emerald-400 block mb-0.5">
                          {item.intervention_type}
                        </span>
                        <p className="text-slate-300">{item.description}</p>
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          Package/Value: {item.quantity_or_value}
                        </span>
                      </div>
                      <span className="text-slate-500 shrink-0 text-[11px]">
                        {formatDate(item.intervention_date)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Beneficiary Record"
        message={`Are you sure you want to remove beneficiary "${selectedBeneficiary?.full_name}" (${selectedBeneficiary?.beneficiary_code}) from the registry?`}
      />
    </div>
  );
}
