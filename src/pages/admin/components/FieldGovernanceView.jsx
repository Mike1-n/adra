import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Building,
  CheckCircle2,
  Calendar,
  DollarSign,
  User,
  Shield,
  Layers,
  Search,
  Filter
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { db } from '../../../lib/supabase';
import { formatCurrency, formatDate } from '../../../lib/utils';
import { useToast } from '../../../context/ToastContext';

export function FieldGovernanceView({ initialTab = 'programmes' }) {
  const [activeSubTab, setActiveSubTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);
  const [programmes, setProgrammes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isCreateProgOpen, setIsCreateProgOpen] = useState(false);
  const [isEditProgOpen, setIsEditProgOpen] = useState(false);
  const [selectedProg, setSelectedProg] = useState(null);

  const [isCreateLocOpen, setIsCreateLocOpen] = useState(false);
  const [isDeleteLocOpen, setIsDeleteLocOpen] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState(null);

  // Forms
  const [progForm, setProgForm] = useState({
    project_code: '',
    project_name: '',
    description: '',
    budget: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 365 * 24 * 3600000).toISOString().split('T')[0],
    location: '',
    status: 'Planned',
    manager_name: ''
  });

  const [locForm, setLocForm] = useState({
    name: '',
    type: 'Field Office',
    state: '',
    county: '',
    district: '',
    community: '',
    contact: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [pList, lList, uList] = await Promise.all([
        db.getProjects(),
        db.getLocations(),
        db.getUsers()
      ]);
      setProgrammes(pList);
      setLocations(lList);
      setManagers(uList.filter(u => u.role === 'Program Manager' || u.role === 'Project Officer' || u.role === 'Administrator'));
    } catch (err) {
      toast.error('Failed to load field governance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateProg = () => {
    const code = `PRJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    setProgForm({
      project_code: code,
      project_name: '',
      description: '',
      budget: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 365 * 24 * 3600000).toISOString().split('T')[0],
      location: locations[0]?.name || '',
      status: 'Active',
      manager_name: managers[0]?.full_name || ''
    });
    setIsCreateProgOpen(true);
  };

  const handleCreateProg = async (e) => {
    e.preventDefault();
    try {
      await db.createProject({
        ...progForm,
        budget: Number(progForm.budget)
      });
      toast.success(`Programme ${progForm.project_name} configured successfully!`);
      setIsCreateProgOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to create programme.');
    }
  };

  const handleOpenEditProg = (p) => {
    setSelectedProg(p);
    setProgForm({
      project_code: p.project_code,
      project_name: p.project_name,
      description: p.description || '',
      budget: String(p.budget || 0),
      start_date: p.start_date || '',
      end_date: p.end_date || '',
      location: p.location || '',
      status: p.status || 'Active',
      manager_name: p.manager_name || (managers[0]?.full_name || '')
    });
    setIsEditProgOpen(true);
  };

  const handleSaveEditProg = async (e) => {
    e.preventDefault();
    if (!selectedProg) return;
    try {
      await db.updateProject(selectedProg.id, {
        ...progForm,
        budget: Number(progForm.budget)
      });
      toast.success(`Updated programme ${progForm.project_code}`);
      setIsEditProgOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to update programme.');
    }
  };

  const handleCreateLoc = async (e) => {
    e.preventDefault();
    try {
      await db.createLocation(locForm);
      toast.success(`Operational location ${locForm.name} registered.`);
      setIsCreateLocOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to register location.');
    }
  };

  const handleDeleteLoc = async () => {
    if (!selectedLoc) return;
    try {
      await db.deleteLocation(selectedLoc.id);
      toast.success(`Deleted location ${selectedLoc.name}`);
      setIsDeleteLocOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to delete location.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-600" />
            Field Programmes & Location Governance
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Configure humanitarian programmes, assign Program Managers, and manage operational territory zones.
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
          <button
            onClick={() => setActiveSubTab('programmes')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'programmes'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Programme Management ({programmes.length})
          </button>
          <button
            onClick={() => setActiveSubTab('locations')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'locations'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Location Management ({locations.length})
          </button>
        </div>
      </div>

      {/* --- SUBTAB 1: PROGRAMME MANAGEMENT (Function 7) --- */}
      {activeSubTab === 'programmes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search programmes by name, code..."
                className="adra-input pl-10 text-xs sm:text-sm"
              />
            </div>

            <Button
              variant="primary"
              onClick={handleOpenCreateProg}
              icon={Plus}
            >
              Configure Programme
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programmes.map((p) => (
              <Card key={p.id} className="adra-card-hover flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-500/30 px-2 py-0.5 rounded">
                      {p.project_code}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        p.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-500/30 font-bold'
                          : p.status === 'Completed'
                          ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold'
                          : 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{p.project_name}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed font-medium">
                    {p.description || 'No description provided.'}
                  </p>

                  <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-200 text-xs text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px] flex items-center gap-1">
                        <User className="w-3 h-3 text-emerald-600" /> Responsible Manager:
                      </span>
                      <span className="font-bold text-slate-900">{p.manager_name || 'Unassigned'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> Operational Zone:
                      </span>
                      <span className="truncate max-w-[170px] text-slate-800 font-medium">{p.location}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px] flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-amber-600" /> Budget Allocation:
                      </span>
                      <span className="font-bold text-emerald-800">{formatCurrency(p.budget)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200">
                  <span className="text-[10px] text-slate-500">
                    {formatDate(p.start_date)} — {formatDate(p.end_date)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditProg(p)}
                    icon={Edit2}
                  >
                    Configure
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* --- SUBTAB 2: LOCATION MANAGEMENT (Function 8) --- */}
      {activeSubTab === 'locations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-600">
              Operational jurisdiction: States, counties, districts, community camps, and regional field offices.
            </p>

            <Button
              variant="primary"
              onClick={() => setIsCreateLocOpen(true)}
              icon={Plus}
            >
              Add Location
            </Button>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Location Name</th>
                    <th className="py-3.5 px-4">Classification</th>
                    <th className="py-3.5 px-4">State / Province</th>
                    <th className="py-3.5 px-4">County / District</th>
                    <th className="py-3.5 px-4">Community / Camp</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {locations.map((loc) => (
                    <tr key={loc.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        {loc.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-800 border border-slate-200 font-semibold">
                          {loc.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800">{loc.state}</td>
                      <td className="py-3.5 px-4 text-slate-800">{loc.county} / {loc.district}</td>
                      <td className="py-3.5 px-4 text-slate-600">{loc.community}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">{loc.contact || 'N/A'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedLoc(loc);
                            setIsDeleteLocOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Location"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Configure Programme Modal */}
      <Modal
        isOpen={isCreateProgOpen || isEditProgOpen}
        onClose={() => {
          setIsCreateProgOpen(false);
          setIsEditProgOpen(false);
        }}
        title={isEditProgOpen ? `Configure Programme: ${selectedProg?.project_code}` : 'Configure New Programme'}
      >
        <form onSubmit={isEditProgOpen ? handleSaveEditProg : handleCreateProg} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Programme Code</label>
              <input
                type="text"
                required
                value={progForm.project_code}
                onChange={(e) => setProgForm({ ...progForm, project_code: e.target.value })}
                className="adra-input text-xs sm:text-sm font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Programme Status</label>
              <select
                value={progForm.status}
                onChange={(e) => setProgForm({ ...progForm, status: e.target.value })}
                className="adra-select text-xs sm:text-sm font-medium"
              >
                <option value="Active">Active Operation</option>
                <option value="Planned">Planned Phase</option>
                <option value="Suspended">Suspended</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Programme Name</label>
            <input
              type="text"
              required
              value={progForm.project_name}
              onChange={(e) => setProgForm({ ...progForm, project_name: e.target.value })}
              placeholder="e.g. Drought Resilience and Sustainable Livelihoods"
              className="adra-input text-xs sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Assigned Program Manager</label>
              <select
                value={progForm.manager_name}
                onChange={(e) => setProgForm({ ...progForm, manager_name: e.target.value })}
                className="adra-select text-xs sm:text-sm font-medium"
              >
                {managers.map(m => (
                  <option key={m.id} value={m.full_name}>{m.full_name} ({m.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Budget Allocation ($ USD)</label>
              <input
                type="number"
                required
                value={progForm.budget}
                onChange={(e) => setProgForm({ ...progForm, budget: e.target.value })}
                className="adra-input text-xs sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Operational Location</label>
            <input
              type="text"
              required
              value={progForm.location}
              onChange={(e) => setProgForm({ ...progForm, location: e.target.value })}
              placeholder="e.g. Turkana & Marsabit Counties"
              className="adra-input text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Programme Objectives / Scope</label>
            <textarea
              rows={3}
              value={progForm.description}
              onChange={(e) => setProgForm({ ...progForm, description: e.target.value })}
              placeholder="Summary of outputs, target households, and key interventions..."
              className="adra-input text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreateProgOpen(false);
                setIsEditProgOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {isEditProgOpen ? 'Update Programme' : 'Save Programme'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Location Modal */}
      <Modal
        isOpen={isCreateLocOpen}
        onClose={() => setIsCreateLocOpen(false)}
        title="Register Operational Location"
      >
        <form onSubmit={handleCreateLoc} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Location Name</label>
              <input
                type="text"
                required
                value={locForm.name}
                onChange={(e) => setLocForm({ ...locForm, name: e.target.value })}
                placeholder="e.g. Lodwar Central Logistics Hub"
                className="adra-input text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Facility Type</label>
              <select
                value={locForm.type}
                onChange={(e) => setLocForm({ ...locForm, type: e.target.value })}
                className="adra-select text-xs sm:text-sm font-medium"
              >
                <option value="Field Office">Field Office</option>
                <option value="Distribution Center">Distribution Center</option>
                <option value="Headquarters">Headquarters</option>
                <option value="Community Post">Community Post</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">State / Province</label>
              <input
                type="text"
                required
                value={locForm.state}
                onChange={(e) => setLocForm({ ...locForm, state: e.target.value })}
                className="adra-input text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">County / District</label>
              <input
                type="text"
                required
                value={locForm.county}
                onChange={(e) => setLocForm({ ...locForm, county: e.target.value })}
                placeholder="e.g. Turkana West"
                className="adra-input text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Community Camp / Sector</label>
              <input
                type="text"
                value={locForm.community}
                onChange={(e) => setLocForm({ ...locForm, community: e.target.value })}
                placeholder="e.g. Kakuma Zone 3"
                className="adra-input text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-800 mb-1">Contact Phone</label>
              <input
                type="text"
                value={locForm.contact}
                onChange={(e) => setLocForm({ ...locForm, contact: e.target.value })}
                placeholder="+254-..."
                className="adra-input text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={() => setIsCreateLocOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Register Location
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Location Modal */}
      {selectedLoc && (
        <Modal
          isOpen={isDeleteLocOpen}
          onClose={() => setIsDeleteLocOpen(false)}
          title="Confirm Location Removal"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-800 leading-relaxed font-medium">
              Are you sure you want to delete the operational location <strong>{selectedLoc.name}</strong>? Existing historical records will retain reference tags.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsDeleteLocOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteLoc}>
                Delete Location
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
