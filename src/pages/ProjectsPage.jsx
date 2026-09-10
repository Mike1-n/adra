import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  MapPin,
  DollarSign,
  UserCheck,
  Building,
  FileCheck
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
import { formatCurrency, formatDate, generateCode } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function ProjectsPage() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const canEdit = hasPermission(['Administrator', 'Project Officer']);

  const [projects, setProjects] = useState([]);
  const [donors, setDonors] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [formData, setFormData] = useState({
    project_code: '',
    project_name: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    budget: '',
    status: 'Planned',
    donor_id: '',
    partner_id: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [projList, donorList, partnerList] = await Promise.all([
        db.getProjects(),
        db.getDonors(),
        db.getPartners(),
      ]);
      setProjects(projList);
      setDonors(donorList);
      setPartners(partnerList);
    } catch (err) {
      toast.error('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setSelectedProject(null);
    setFormData({
      project_code: generateCode('PRJ'),
      project_name: '',
      description: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 365 * 24 * 3600000).toISOString().split('T')[0],
      location: '',
      budget: '',
      status: 'Planned',
      donor_id: donors[0]?.id || '',
      partner_id: partners[0]?.id || '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (project) => {
    setSelectedProject(project);
    setFormData({
      project_code: project.project_code,
      project_name: project.project_name,
      description: project.description || '',
      start_date: project.start_date,
      end_date: project.end_date,
      location: project.location,
      budget: project.budget,
      status: project.status,
      donor_id: project.donor_id || '',
      partner_id: project.partner_id || '',
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.project_name || !formData.budget || !formData.location) {
      toast.warning('Please fill in all required fields.');
      return;
    }

    try {
      const payload = {
        ...formData,
        budget: Number(formData.budget),
        donor_name: donors.find(d => d.id === formData.donor_id)?.donor_name || 'ADRA Fund',
        partner_name: partners.find(p => p.id === formData.partner_id)?.partner_name || 'Ministry Partner',
      };

      if (selectedProject) {
        await db.updateProject(selectedProject.id, payload);
        toast.success('Project updated successfully.');
      } else {
        await db.createProject(payload);
        toast.success('Project created successfully.');
      }
      setIsFormOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to save project.');
    }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;
    try {
      await db.deleteProject(selectedProject.id);
      toast.success('Project deleted.');
      loadData();
    } catch (err) {
      toast.error('Failed to delete project.');
    }
  };

  // Filtered list
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.project_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.project_code?.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-emerald-600" />
            Project Portfolio Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Oversee active grants, project schedules, and target performance across all operational hubs.
          </p>
        </div>

        {canEdit && (
          <Button variant="primary" onClick={handleOpenCreate} icon={Plus}>
            Create Project
          </Button>
        )}
      </div>

      {/* Search & Status Filters */}
      <SearchFilter
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by title, code or location..."
        selectedFilter={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={[
          { label: 'All Statuses', value: 'ALL' },
          { label: 'Active', value: 'Active' },
          { label: 'Planned', value: 'Planned' },
          { label: 'Completed', value: 'Completed' },
          { label: 'Suspended', value: 'Suspended' },
        ]}
      />

      {loading ? (
        <LoadingSpinner text="Fetching projects..." />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="No projects match your search or filter criteria."
          actionText={canEdit ? 'Add New Project' : undefined}
          onAction={handleOpenCreate}
        />
      ) : (
        /* Projects Grid / Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="flex flex-col justify-between adra-card-hover group">
              <div>
                {/* Header with Code & Status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-2 py-0.5 rounded">
                    {project.project_code}
                  </span>
                  <Badge status={project.status} />
                </div>

                {/* Title & Description */}
                <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-300 transition-colors line-clamp-1">
                  {project.project_name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {project.description || 'No description provided.'}
                </p>

                {/* Metadata List */}
                <div className="space-y-2 mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{project.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{formatDate(project.start_date)} — {formatDate(project.end_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-emerald-400">{formatCurrency(project.budget)}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedProject(project);
                    setIsDetailOpen(true);
                  }}
                  icon={Eye}
                >
                  View Details
                </Button>

                {canEdit && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(project)}
                      title="Edit project"
                      className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProject(project);
                        setIsDeleteOpen(true);
                      }}
                      title="Delete project"
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Project Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedProject ? 'Edit Project' : 'Create New Project'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Project Code</label>
              <input
                type="text"
                value={formData.project_code}
                onChange={(e) => setFormData({ ...formData, project_code: e.target.value })}
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
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Project Title</label>
            <input
              type="text"
              value={formData.project_name}
              onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
              placeholder="e.g. Clean Water Access in Marsabit"
              className="adra-input"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description & Scope</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detail the humanitarian objective, target groups and interventions..."
              className="adra-input min-h-[80px]"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Turkana County"
                className="adra-input"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Total Budget ($ USD)</label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="e.g. 500000"
                className="adra-input"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="adra-input"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="adra-input"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Funding Donor</label>
              <select
                value={formData.donor_id}
                onChange={(e) => setFormData({ ...formData, donor_id: e.target.value })}
                className="adra-select"
              >
                <option value="">-- Select Donor --</option>
                {donors.map(d => (
                  <option key={d.id} value={d.id}>{d.donor_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Implementing Partner</label>
              <select
                value={formData.partner_id}
                onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                className="adra-select"
              >
                <option value="">-- Select Partner --</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.partner_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {selectedProject ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Project Detail Modal */}
      {selectedProject && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Project Profile: ${selectedProject.project_code}`}
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-base font-bold text-slate-100">{selectedProject.project_name}</h4>
              <Badge status={selectedProject.status} />
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              {selectedProject.description || 'No detailed description.'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Budget</span>
                <span className="font-bold text-emerald-400 text-sm">{formatCurrency(selectedProject.budget)}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Location</span>
                <span className="font-medium text-slate-200">{selectedProject.location}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Duration</span>
                <span className="font-medium text-slate-200">{formatDate(selectedProject.start_date)} - {formatDate(selectedProject.end_date)}</span>
              </div>
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
        title="Delete Project"
        message={`Are you sure you want to delete project "${selectedProject?.project_name}" (${selectedProject?.project_code})? All linked activities and indicator records will be affected.`}
      />
    </div>
  );
}
