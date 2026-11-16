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
  Filter,
  Download,
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { db } from '../../../lib/supabase';
import { formatCurrency, formatDate } from '../../../lib/utils';
import { useToast } from '../../../context/ToastContext';
import { exportToPDF, exportToCSV } from '../../../lib/reportGenerator';

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
  const [donors, setDonors] = useState([]);
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
    manager_name: '',
    donor_id: ''
  });

  const [showAddDonor, setShowAddDonor] = useState(false);
  const [savingDonor, setSavingDonor] = useState(false);
  const [newDonorForm, setNewDonorForm] = useState({
    donor_name: '',
    donor_code: '',
    donor_type: 'Bilateral Government Agency',
    contact_person: '',
    email: ''
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
      const [pList, lList, uList, dList] = await Promise.all([
        db.getProjects(),
        db.getLocations(),
        db.getUsers(),
        db.getDonors ? db.getDonors() : Promise.resolve([])
      ]);
      setProgrammes(pList);
      setLocations(lList);
      setManagers(uList.filter(u => u.role === 'Program Manager' || u.role === 'Project Officer' || u.role === 'Administrator'));
      setDonors(dList || []);
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
      manager_name: managers[0]?.full_name || '',
      donor_id: ''
    });
    setShowAddDonor(false);
    setIsCreateProgOpen(true);
  };

  const handleQuickAddDonor = async () => {
    if (!newDonorForm.donor_name.trim()) {
      toast.warning('Please enter the donor name.');
      return;
    }
    try {
      setSavingDonor(true);
      const code = newDonorForm.donor_code.trim() || `DNR-${Math.floor(1000 + Math.random() * 9000)}`;
      const created = await db.createDonor({
        donor_name: newDonorForm.donor_name.trim(),
        donor_code: code,
        donor_type: newDonorForm.donor_type || 'Bilateral Government Agency',
        contact_person: newDonorForm.contact_person.trim() || '',
        email: newDonorForm.email.trim() || '',
        compliance_status: 'Fully Compliant'
      });
      setDonors(prev => [created, ...prev]);
      setProgForm(prev => ({ ...prev, donor_id: created.id }));
      setNewDonorForm({
        donor_name: '',
        donor_code: '',
        donor_type: 'Bilateral Government Agency',
        contact_person: '',
        email: ''
      });
      setShowAddDonor(false);
      toast.success(`Donor "${created.donor_name}" added and selected.`);
    } catch (err) {
      console.error('Quick add donor error:', err);
      toast.error(err?.message || 'Failed to add donor.');
    } finally {
      setSavingDonor(false);
    }
  };

  const handleCreateProg = async (e) => {
    e.preventDefault();
    try {
      const matchedManager = managers.find(m => m.full_name === progForm.manager_name);
      const createdProj = await db.createProject({
        ...progForm,
        budget: Number(progForm.budget) || 0,
        project_officer_id: matchedManager?.id || null,
        donor_id: progForm.donor_id || null
      });
      if (progForm.donor_id && createdProj?.id && db.createDonorGrant) {
        try {
          const matchedDonor = donors.find(d => d.id === progForm.donor_id);
          const dPrefix = (matchedDonor?.donor_code || 'GRT').split('-')[0].toUpperCase();
          await db.createDonorGrant({
            grant_code: `GRT-${dPrefix}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
            donor_id: progForm.donor_id,
            project_id: createdProj.id,
            grant_title: `${progForm.project_name} Grant`,
            total_committed: Number(progForm.budget) || 0,
            disbursed_amount: 0,
            expended_amount: 0,
            currency: 'SSP',
            status: progForm.status === 'Completed' ? 'Completed' : 'Active',
            start_date: progForm.start_date || new Date().toISOString().split('T')[0],
            end_date: progForm.end_date || new Date(Date.now() + 365 * 24 * 3600000).toISOString().split('T')[0]
          });
        } catch (grantErr) {
          console.warn('Could not auto-create donor_grants row:', grantErr);
        }
      }
      toast.success(`Programme ${progForm.project_name} configured successfully!`);
      setIsCreateProgOpen(false);
      loadData();
    } catch (err) {
      console.error('Create programme error:', err);
      toast.error(err?.message || 'Failed to create programme.');
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
      manager_name: p.manager_name || (managers[0]?.full_name || ''),
      donor_id: p.donor_id || ''
    });
    setShowAddDonor(false);
    setIsEditProgOpen(true);
  };

  const handleSaveEditProg = async (e) => {
    e.preventDefault();
    if (!selectedProg) return;
    try {
      const matchedManager = managers.find(m => m.full_name === progForm.manager_name);
      await db.updateProject(selectedProg.id, {
        ...progForm,
        budget: Number(progForm.budget) || 0,
        project_officer_id: matchedManager?.id || null,
        donor_id: progForm.donor_id || null
      });
      if (progForm.donor_id && db.getDonorGrants && db.createDonorGrant) {
        try {
          const existingGrants = await db.getDonorGrants(progForm.donor_id);
          const alreadyLinked = (existingGrants || []).some(g => g.project_id === selectedProg.id);
          if (!alreadyLinked) {
            const matchedDonor = donors.find(d => d.id === progForm.donor_id);
            const dPrefix = (matchedDonor?.donor_code || 'GRT').split('-')[0].toUpperCase();
            await db.createDonorGrant({
              grant_code: `GRT-${dPrefix}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
              donor_id: progForm.donor_id,
              project_id: selectedProg.id,
              grant_title: `${progForm.project_name} Grant`,
              total_committed: Number(progForm.budget) || 0,
              disbursed_amount: 0,
              expended_amount: 0,
              currency: 'SSP',
              status: progForm.status === 'Completed' ? 'Completed' : 'Active',
              start_date: progForm.start_date || new Date().toISOString().split('T')[0],
              end_date: progForm.end_date || new Date(Date.now() + 365 * 24 * 3600000).toISOString().split('T')[0]
            });
          }
        } catch (grantErr) {
          console.warn('Could not auto-sync donor_grants row:', grantErr);
        }
      }
      toast.success(`Updated programme ${progForm.project_code}`);
      setIsEditProgOpen(false);
      loadData();
    } catch (err) {
      console.error('Update programme error:', err);
      toast.error(err?.message || 'Failed to update programme.');
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

  // --- Print & Export Handlers ---
  const handlePrint = () => {
    window.print();
  };

  const handleExportProgrammesPDF = async () => {
    try {
      const columns = [
        { header: 'Code', key: 'project_code' },
        { header: 'Programme Title', key: 'project_name' },
        { header: 'Status', key: 'status' },
        { header: 'Responsible Manager', key: 'manager_name' },
        { header: 'Operational Zone', key: 'location' },
        { header: 'Budget', key: 'budget_display' },
        { header: 'Timeline', key: 'timeline_display' },
      ];

      const dataToExport = programmes.map(p => ({
        ...p,
        manager_name: p.manager_name || 'Unassigned',
        budget_display: formatCurrency(p.budget),
        timeline_display: `${formatDate(p.start_date)} — ${formatDate(p.end_date)}`,
      }));

      const totalBudget = programmes.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
      const activeCount = programmes.filter(p => p.status === 'Active').length;

      await exportToPDF({
        title: 'ADRA SOUTH SUDAN • FIELD PROGRAMMES PORTFOLIO',
        subtitle: `Official Field Programme Registry • Scope: ${programmes.length} Humanitarian Programmes • Generated: ${new Date().toLocaleDateString()}`,
        columns,
        data: dataToExport,
        fileName: `ADRA_Field_Programmes_${new Date().toISOString().split('T')[0]}.pdf`,
        summary: [
          { label: 'Total Programmes', value: String(programmes.length) },
          { label: 'Active Programmes', value: String(activeCount) },
          { label: 'Total Allocated Budget', value: formatCurrency(totalBudget) }
        ]
      });

      toast.success('Field programmes PDF exported successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export PDF.');
    }
  };

  const handleExportProgrammesCSV = () => {
    try {
      const dataToExport = programmes.map(p => ({
        'Programme Code': p.project_code,
        'Programme Title': p.project_name,
        'Description': p.description || '',
        'Status': p.status,
        'Responsible Manager': p.manager_name || 'Unassigned',
        'Operational Zone': p.location || '',
        'Budget (SSP)': p.budget || 0,
        'Start Date': p.start_date || '',
        'End Date': p.end_date || '',
      }));

      exportToCSV(dataToExport, `ADRA_Field_Programmes_${new Date().toISOString().split('T')[0]}.csv`);
      toast.success(`Exported ${programmes.length} programmes to CSV.`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to export CSV.');
    }
  };

  const handleExportLocationsPDF = async () => {
    try {
      const columns = [
        { header: 'Location Name', key: 'name' },
        { header: 'Classification', key: 'type' },
        { header: 'State / Province', key: 'state' },
        { header: 'County / District', key: 'county_district' },
        { header: 'Community / Camp', key: 'community' },
        { header: 'Contact', key: 'contact' },
      ];

      const dataToExport = locations.map(l => ({
        ...l,
        county_district: `${l.county || ''} / ${l.district || ''}`.trim().replace(/^\/|\/$/g, ''),
        contact: l.contact || 'N/A'
      }));

      await exportToPDF({
        title: 'ADRA SOUTH SUDAN • OPERATIONAL LOCATIONS REGISTRY',
        subtitle: `Official Field Operational Territory & Jurisdiction Directory • Generated: ${new Date().toLocaleDateString()}`,
        columns,
        data: dataToExport,
        fileName: `ADRA_Operational_Locations_${new Date().toISOString().split('T')[0]}.pdf`,
        summary: [
          { label: 'Total Locations', value: String(locations.length) },
        ]
      });

      toast.success('Operational locations PDF exported successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export PDF.');
    }
  };

  const handleExportLocationsCSV = () => {
    try {
      const dataToExport = locations.map(l => ({
        'Location Name': l.name,
        'Classification': l.type,
        'State': l.state,
        'County': l.county,
        'District': l.district,
        'Community / Camp': l.community,
        'Contact Person': l.contact || 'N/A',
      }));

      exportToCSV(dataToExport, `ADRA_Operational_Locations_${new Date().toISOString().split('T')[0]}.csv`);
      toast.success(`Exported ${locations.length} locations to CSV.`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to export CSV.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Official Print Header (Visible only when printed) */}
      <div className="hidden print:block pb-4 mb-4 border-b border-slate-300">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">ADRA SOUTH SUDAN • HUMANITARIAN MANAGEMENT SYSTEM</h1>
            <h2 className="text-sm font-semibold text-emerald-800 mt-0.5">
              {activeSubTab === 'programmes' ? 'Field Programmes Portfolio & Strategic Execution' : 'Operational Locations & Territory Jurisdiction'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Official Certified Record • Printed: {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="text-right text-xs text-slate-600 font-mono">
            <span>Scope: {activeSubTab === 'programmes' ? `${programmes.length} Programmes` : `${locations.length} Locations`}</span>
          </div>
        </div>
      </div>

      {/* Header for Programmes */}
      {activeSubTab === 'programmes' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 no-print">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-[#006B56]" />
              Field Programmes Management
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure humanitarian programmes, assign Program Managers, and track operational project portfolios.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportProgrammesCSV}
              icon={FileSpreadsheet}
              className="text-xs"
              title="Download CSV spreadsheet"
            >
              Export CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportProgrammesPDF}
              icon={Download}
              className="text-xs font-semibold"
              title="Download PDF document"
            >
              Download PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              icon={Printer}
              className="text-xs"
              title="Print programme list"
            >
              Print
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateProg}
              icon={Plus}
              className="text-xs font-semibold"
            >
              Configure Programme
            </Button>
          </div>
        </div>
      )}

      {/* Header for Locations */}
      {activeSubTab === 'locations' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 no-print">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#006B56]" />
              Operational Territory & Location Governance
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Operational jurisdiction: States, counties, districts, community camps, and regional field offices.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportLocationsCSV}
              icon={FileSpreadsheet}
              className="text-xs"
              title="Download CSV spreadsheet"
            >
              Export CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportLocationsPDF}
              icon={Download}
              className="text-xs font-semibold"
              title="Download PDF document"
            >
              Download PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              icon={Printer}
              className="text-xs"
              title="Print location list"
            >
              Print
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateLocOpen(true)}
              icon={Plus}
              className="text-xs font-semibold"
            >
              Add Location
            </Button>
          </div>
        </div>
      )}

      {/* --- SUBTAB 1: PROGRAMME MANAGEMENT (Function 7) --- */}
      {activeSubTab === 'programmes' && (() => {
        const filteredProgs = programmes.filter(p => {
          const matchSearch = !search || 
            (p.project_name || '').toLowerCase().includes(search.toLowerCase()) || 
            (p.project_code || '').toLowerCase().includes(search.toLowerCase()) ||
            (p.location || '').toLowerCase().includes(search.toLowerCase());
          return matchSearch;
        });

        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search programmes by name, code, or operational zone..."
                  className="adra-input pl-10 text-xs sm:text-sm"
                />
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Active Portfolio: <strong className="text-slate-900 font-bold">{filteredProgs.length}</strong> of {programmes.length} Programmes
              </div>
            </div>

            {filteredProgs.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <FolderKanban className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">No Programmes Configured</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  {search ? 'No programmes match your search query.' : 'Initialize and configure your first field humanitarian programme.'}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenCreateProg}
                  icon={Plus}
                >
                  Configure New Programme
                </Button>
              </div>
            ) : (
              <Card className="p-0 overflow-hidden shadow-2xs border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3.5 px-4">Programme & Code</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 hidden sm:table-cell">Responsible Manager</th>
                        <th className="py-3.5 px-4 hidden md:table-cell">Operational Zone</th>
                        <th className="py-3.5 px-4">Budget</th>
                        <th className="py-3.5 px-4 hidden lg:table-cell">Timeline</th>
                        <th className="py-3.5 px-4 text-right no-print">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {filteredProgs.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition group">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                {p.project_code}
                              </span>
                            </div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">{p.project_name}</p>
                            {p.description && (
                              <p className="text-[11px] text-slate-500 line-clamp-1 max-w-sm sm:max-w-md mt-0.5">
                                {p.description}
                              </p>
                            )}
                            <div className="sm:hidden flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500 mt-1">
                              <span>Mgr: <strong className="text-slate-700 font-semibold">{p.manager_name || 'Unassigned'}</strong></span>
                              <span>•</span>
                              <span>{p.location || 'Unspecified'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                                p.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-500/30 font-bold'
                                  : p.status === 'Completed'
                                  ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold'
                                  : 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 hidden sm:table-cell">
                            <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                              <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate max-w-[150px]">{p.manager_name || 'Unassigned'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 hidden md:table-cell">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[160px]">{p.location || 'Unspecified'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-emerald-800 text-xs sm:text-sm">
                              {formatCurrency(p.budget)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 hidden lg:table-cell whitespace-nowrap text-slate-600 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{formatDate(p.start_date)} — {formatDate(p.end_date)}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap no-print">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditProg(p)}
                              icon={Edit2}
                              className="text-xs py-1 px-2.5 h-auto"
                            >
                              Configure
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        );
      })()}

      {/* --- SUBTAB 2: LOCATION MANAGEMENT (Function 8) --- */}
      {activeSubTab === 'locations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 text-xs text-slate-500 no-print">
            <span className="font-medium">
              Registered Operational Zones: <strong className="text-slate-900 font-bold">{locations.length}</strong>
            </span>
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
                    <th className="py-3.5 px-4 text-right no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {locations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        <MapPin className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-xs">No Operational Locations Registered</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Click 'Add Location' to register a state, county, or camp zone.</p>
                      </td>
                    </tr>
                  ) : (
                    locations.map((loc) => (
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
                        <td className="py-3.5 px-4 text-right no-print">
                          <button
                            onClick={() => {
                              setSelectedLoc(loc);
                              setIsDeleteLocOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Location"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
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
              <label className="block font-semibold text-slate-800 mb-1">Budget Allocation (SSP)</label>
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
            <select
              required
              value={progForm.location}
              onChange={(e) => setProgForm({ ...progForm, location: e.target.value })}
              className="adra-input text-xs sm:text-sm cursor-pointer"
            >
              <option value="">-- Select Operational Location --</option>
              {(() => {
                const isKenyanLocation = (str = '') => {
                  const s = str.toLowerCase();
                  return [
                    'turkana', 'marsabit', 'garissa', 'nairobi', 'mandera',
                    'lodwar', 'kisumu', 'tana river', 'kajiado', 'kilifi',
                    'kenya', 'dadaab', 'kakuma', 'wajir', 'isiolo', 'mombasa', 'eldoret'
                  ].some(k => s.includes(k));
                };
                const seen = new Set();
                const opts = [];
                const addOpt = (val, label = val) => {
                  if (!val || isKenyanLocation(val) || isKenyanLocation(label)) return;
                  const key = val.trim().toLowerCase();
                  if (!seen.has(key)) {
                    seen.add(key);
                    opts.push({ value: val, label });
                  }
                };
                // 1. Registered South Sudan Operational Locations
                (locations || []).forEach(l => {
                  const label = l.state ? `${l.name} (${l.county ? `${l.county}, ` : ''}${l.state})` : l.name;
                  addOpt(l.name, label);
                });
                // 2. All 10 South Sudan States
                [
                  'Central Equatoria (Juba)',
                  'Eastern Equatoria (Torit / Kapoeta)',
                  'Western Equatoria (Yambio)',
                  'Jonglei (Bor)',
                  'Unity (Bentiu)',
                  'Upper Nile (Malakal)',
                  'Lakes (Rumbek)',
                  'Warrap (Kuajok)',
                  'Northern Bahr el Ghazal (Aweil)',
                  'Western Bahr el Ghazal (Wau)'
                ].forEach(st => addOpt(st));
                // 3. South Sudan locations from existing programmes
                (programmes || []).forEach(p => addOpt(p.location));
                // 4. Preserve current value if editing a South Sudan location
                if (progForm.location) addOpt(progForm.location);

                return opts.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ));
              })()}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-800">
                Donor Agency <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAddDonor(prev => !prev)}
                className="text-[11px] font-bold text-[#006B56] hover:text-[#005443] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                {showAddDonor ? 'Close New Donor' : 'Add New Donor'}
              </button>
            </div>
            <select
              value={progForm.donor_id || ''}
              onChange={(e) => setProgForm({ ...progForm, donor_id: e.target.value })}
              className="adra-select text-xs sm:text-sm font-medium cursor-pointer"
            >
              <option value="">-- No Donor / Internal ADRA Funding --</option>
              {donors.map(d => (
                <option key={d.id} value={d.id}>
                  {d.donor_name}{d.donor_code ? ` (${d.donor_code})` : ''}
                </option>
              ))}
            </select>

            {showAddDonor && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <p className="text-[11px] font-bold text-slate-700">Register New Donor</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Donor Name *"
                    value={newDonorForm.donor_name}
                    onChange={(e) => setNewDonorForm({ ...newDonorForm, donor_name: e.target.value })}
                    className="adra-input text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Donor Code (optional)"
                    value={newDonorForm.donor_code}
                    onChange={(e) => setNewDonorForm({ ...newDonorForm, donor_code: e.target.value })}
                    className="adra-input text-xs font-mono"
                  />
                  <select
                    value={newDonorForm.donor_type}
                    onChange={(e) => setNewDonorForm({ ...newDonorForm, donor_type: e.target.value })}
                    className="adra-select text-xs"
                  >
                    <option value="Bilateral Government Agency">Bilateral Government Agency</option>
                    <option value="Multilateral / UN Agency">Multilateral / UN Agency</option>
                    <option value="Private Foundation">Private Foundation</option>
                    <option value="Corporate / NGO Partner">Corporate / NGO Partner</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Contact Person (optional)"
                    value={newDonorForm.contact_person}
                    onChange={(e) => setNewDonorForm({ ...newDonorForm, contact_person: e.target.value })}
                    className="adra-input text-xs"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddDonor(false)}
                    className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingDonor}
                    onClick={handleQuickAddDonor}
                    className="px-3 py-1.5 text-[11px] font-bold bg-[#006B56] hover:bg-[#005443] text-white rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    {savingDonor ? 'Saving...' : 'Save & Select Donor'}
                  </button>
                </div>
              </div>
            )}
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
