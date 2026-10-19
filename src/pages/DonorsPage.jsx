import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Plus,
  Mail,
  Phone,
  DollarSign,
  Handshake,
  Calendar,
  Globe,
  Search,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Edit2,
  FileText,
  TrendingUp,
  Award,
  Layers,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { db } from '../lib/supabase';
import { formatCurrency, formatDate } from '../lib/utils';
import { exportToCSV } from '../lib/reportGenerator';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function DonorsPage() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const canEdit = hasPermission(['Administrator', 'Project Officer', 'Finance Officer', 'Program Manager']);

  const [donors, setDonors] = useState([]);
  const [partners, setPartners] = useState([]);
  const [grants, setGrants] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('donors'); // 'donors' | 'grants' | 'partners'
  const [search, setSearch] = useState('');

  // Modals & Drawers
  const [isDonorModalOpen, setIsDonorModalOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [selectedDonorForGrants, setSelectedDonorForGrants] = useState(null);
  const [editingDonor, setEditingDonor] = useState(null);

  const [donorForm, setDonorForm] = useState({
    donor_name: '',
    donor_code: '',
    donor_type: 'Bilateral Government Agency',
    country: '',
    contact_person: '',
    email: '',
    phone: '',
    funding_amount: '',
    compliance_status: 'Fully Compliant',
    funding_date: ''
  });

  const [partnerForm, setPartnerForm] = useState({
    partner_name: '',
    contact_person: '',
    email: '',
    phone: '',
    description: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [donorList, partnerList, grantList, projectList] = await Promise.all([
        db.getDonors(),
        db.getPartners(),
        db.getDonorGrants ? db.getDonorGrants() : [],
        db.getProjects ? db.getProjects() : []
      ]);
      setDonors(donorList || []);
      setPartners(partnerList || []);
      setGrants(grantList || []);
      setProjects(projectList || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load donors and partners registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Summary Metrics
  const totalFundingCommitted = useMemo(() => {
    return donors.reduce((sum, d) => sum + (Number(d.funding_amount) || 0), 0);
  }, [donors]);

  const totalDisbursed = useMemo(() => {
    return donors.reduce((sum, d) => sum + (Number(d.disbursed_amount) || Number(d.funding_amount * 0.75) || 0), 0);
  }, [donors]);

  const handleOpenAddDonor = () => {
    setEditingDonor(null);
    setDonorForm({
      donor_name: '',
      donor_code: '',
      donor_type: 'Bilateral Government Agency',
      country: '',
      contact_person: '',
      email: '',
      phone: '',
      funding_amount: '',
      compliance_status: 'Fully Compliant',
      funding_date: new Date().toISOString().split('T')[0]
    });
    setIsDonorModalOpen(true);
  };

  const handleOpenEditDonor = (d) => {
    setEditingDonor(d);
    setDonorForm({
      donor_name: d.donor_name || '',
      donor_code: d.donor_code || '',
      donor_type: d.donor_type || 'Bilateral Government Agency',
      country: d.country || '',
      contact_person: d.contact_person || '',
      email: d.email || '',
      phone: d.phone || '',
      funding_amount: d.funding_amount || '',
      compliance_status: d.compliance_status || 'Fully Compliant',
      funding_date: d.funding_date || new Date().toISOString().split('T')[0]
    });
    setIsDonorModalOpen(true);
  };

  const handleOpenAddPartner = () => {
    setPartnerForm({
      partner_name: '',
      contact_person: '',
      email: '',
      phone: '',
      description: ''
    });
    setIsPartnerModalOpen(true);
  };

  const handleSaveDonor = async (e) => {
    e.preventDefault();
    if (!donorForm.donor_name.trim() || !donorForm.contact_person.trim()) {
      toast.warning('Please enter the donor agency name and contact person.');
      return;
    }

    try {
      if (editingDonor) {
        await db.updateDonor(editingDonor.id, {
          ...donorForm,
          funding_amount: Number(donorForm.funding_amount || 0)
        });
        toast.success('Donor agency details updated.');
      } else {
        await db.createDonor({
          ...donorForm,
          funding_amount: Number(donorForm.funding_amount || 0)
        });
        toast.success('New donor agency registered.');
      }
      setIsDonorModalOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to save donor record.');
    }
  };

  const handleSavePartner = async (e) => {
    e.preventDefault();
    if (!partnerForm.partner_name.trim() || !partnerForm.contact_person.trim()) {
      toast.warning('Please enter partner name and contact person.');
      return;
    }

    try {
      await db.createPartner(partnerForm);
      toast.success('Implementing partner added to directory.');
      setIsPartnerModalOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to add partner.');
    }
  };

  const handleExportDonorsCSV = () => {
    const csvData = donors.map(d => ({
      'Donor Code': d.donor_code || 'N/A',
      'Agency Name': d.donor_name,
      'Donor Type': d.donor_type || 'Institutional Partner',
      'Country': d.country || 'Global',
      'Contact Person': d.contact_person,
      'Email': d.email || '',
      'Phone': d.phone || '',
      'Committed (USD)': d.funding_amount,
      'Compliance Status': d.compliance_status || 'Compliant',
      'Agreement Date': d.funding_date
    }));
    exportToCSV(csvData, `ADRA_Donors_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Donor directory exported to CSV.');
  };

  // Filtered lists
  const filteredDonors = donors.filter(d =>
    d.donor_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.donor_code?.toLowerCase().includes(search.toLowerCase()) ||
    d.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
    d.email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGrants = grants.filter(g =>
    g.grant_code?.toLowerCase().includes(search.toLowerCase()) ||
    g.project_name?.toLowerCase().includes(search.toLowerCase()) ||
    g.donor_name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPartners = partners.filter(p =>
    p.partner_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & METRICS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600" />
            Institutional Donors & Grants Hub
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Manage bilateral aid agencies, multilateral grants, co-funding agreements, and implementing partners.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportDonorsCSV}
            icon={Download}
            className="text-xs"
          >
            Export Directory
          </Button>

          {canEdit && (
            activeTab === 'partners' ? (
              <Button variant="primary" size="sm" onClick={handleOpenAddPartner} icon={Plus} className="text-xs">
                Register Partner
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={handleOpenAddDonor} icon={Plus} className="text-xs">
                Register Donor Agency
              </Button>
            )
          )}
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Grant Envelope</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">${totalFundingCommitted.toLocaleString()}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Active multi-donor portfolio</p>
            </div>
            <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Award className="w-5 h-5" />
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Disbursed to Projects</p>
              <h3 className="text-2xl font-black text-sky-700 mt-0.5">${totalDisbursed.toLocaleString()}</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {totalFundingCommitted > 0 ? ((totalDisbursed / totalFundingCommitted) * 100).toFixed(0) : 0}% tranche release rate
              </p>
            </div>
            <span className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Funding Donors</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{donors.length}</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Bilateral & Foundation partners</p>
            </div>
            <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Building2 className="w-5 h-5" />
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Implementing Partners</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{partners.length}</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Ministries & field NGOs</p>
            </div>
            <span className="p-2.5 rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
              <Handshake className="w-5 h-5" />
            </span>
          </div>
        </Card>
      </div>

      {/* 2. TABS & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('donors')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'donors'
                ? 'bg-[#004D3F] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Funding Donors ({donors.length})
          </button>
          <button
            onClick={() => setActiveTab('grants')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'grants'
                ? 'bg-[#004D3F] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Grant Agreements ({grants.length})
          </button>
          <button
            onClick={() => setActiveTab('partners')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'partners'
                ? 'bg-[#004D3F] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Implementing Partners ({partners.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="adra-input pl-8 py-1.5 text-xs"
          />
        </div>
      </div>

      {/* 3. CONTENT AREAS */}
      {loading ? (
        <LoadingSpinner text="Loading donors and grant portfolio..." />
      ) : activeTab === 'donors' ? (
        filteredDonors.length === 0 ? (
          <EmptyState
            title="No donor agencies found"
            description="Register a funding agency or bilateral partner to link with project budgets."
            actionText={canEdit ? 'Register Donor Agency' : undefined}
            onAction={handleOpenAddDonor}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            {filteredDonors.map((d) => {
              const donorGrants = grants.filter(g => g.donor_id === d.id || g.donor_name === d.donor_name);
              const totalDonorCommitment = Number(d.funding_amount || 0);
              const totalDonorDisbursed = Number(d.disbursed_amount || d.funding_amount * 0.75 || 0);

              return (
                <Card key={d.id} className="adra-card-hover p-5 flex flex-col justify-between border-slate-200">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-[#006B56] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {d.donor_code || 'INST-PARTNER'}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {d.donor_type || 'Bilateral Agency'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1 leading-snug">
                          {d.donor_name}
                        </h3>
                        {d.country && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Globe className="w-3 h-3 text-slate-400" />
                            <span>{d.country}</span>
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-black text-[#006B56]">
                          ${totalDonorCommitment.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 block">Committed Envelope</span>
                      </div>
                    </div>

                    {/* Funding Progress Bar */}
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Disbursed to Field</span>
                        <span className="text-slate-700 font-bold">
                          ${totalDonorDisbursed.toLocaleString()} ({totalDonorCommitment > 0 ? ((totalDonorDisbursed / totalDonorCommitment) * 100).toFixed(0) : 0}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          style={{ width: `${Math.min((totalDonorDisbursed / (totalDonorCommitment || 1)) * 100, 100)}%` }}
                          className="h-full bg-emerald-600 rounded-full"
                        />
                      </div>
                    </div>

                    {/* Contact & Compliance Info */}
                    <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Focal Representative:</span>
                        <span className="font-semibold text-slate-800">{d.contact_person}</span>
                      </div>
                      {d.email && (
                        <div className="flex items-center gap-2 text-slate-600 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{d.email}</span>
                        </div>
                      )}
                      {d.phone && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{d.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Footer */}
                  <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      {d.compliance_status || 'Fully Compliant'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedDonorForGrants(d)}
                        className="text-xs font-bold text-[#006B56] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        View Grants ({donorGrants.length}) <ChevronRight className="w-3 h-3" />
                      </button>

                      {canEdit && (
                        <button
                          onClick={() => handleOpenEditDonor(d)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                          title="Edit Donor"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : activeTab === 'grants' ? (
        /* GRANTS TABLE TAB */
        filteredGrants.length === 0 ? (
          <EmptyState
            title="No grant agreements found"
            description="Active grant contracts linked to projects will be listed here."
          />
        ) : (
          <Card className="border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Grant Code</th>
                    <th className="py-3 px-4">Funding Donor</th>
                    <th className="py-3 px-4">Project Affiliation</th>
                    <th className="py-3 px-4 text-right">Committed</th>
                    <th className="py-3 px-4 text-right">Disbursed</th>
                    <th className="py-3 px-4 text-right">Burn Rate</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredGrants.map((g) => {
                    const burn = g.disbursed_amount > 0 ? ((g.expended_amount / g.disbursed_amount) * 100).toFixed(0) : 0;
                    return (
                      <tr key={g.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-[#006B56]">
                          {g.grant_code}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {g.donor_name}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-800 block truncate max-w-xs">{g.project_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{g.project_code}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          ${Number(g.total_committed || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-700 font-semibold">
                          ${Number(g.disbursed_amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-700">
                          {burn}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge status={g.status || 'Active'} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : (
        /* PARTNERS GRID TAB */
        filteredPartners.length === 0 ? (
          <EmptyState
            title="No implementing partners found"
            description="Register a government ministry, local NGO, or technical institute."
            actionText={canEdit ? 'Register Partner' : undefined}
            onAction={handleOpenAddPartner}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPartners.map((p) => (
              <Card key={p.id} className="adra-card-hover p-5 flex flex-col justify-between border-slate-200">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                      <Handshake className="w-4 h-4" />
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      Technical Partner
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {p.partner_name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Focal Point: <span className="text-slate-800 font-semibold">{p.contact_person}</span>
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {p.description || 'Implementing partner supporting field agronomy, infrastructure, and community mobilization.'}
                  </p>

                  <div className="space-y-1 pt-2 border-t border-slate-100 text-xs text-slate-500">
                    {p.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{p.email}</span>
                      </div>
                    )}
                    {p.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{p.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* 4. REGISTER / EDIT DONOR MODAL */}
      <Modal
        isOpen={isDonorModalOpen}
        onClose={() => setIsDonorModalOpen(false)}
        title={editingDonor ? 'Edit Donor Agency Record' : 'Register Institutional Donor'}
      >
        <form onSubmit={handleSaveDonor} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Donor / Grant Organization Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={donorForm.donor_name}
              onChange={(e) => setDonorForm({ ...donorForm, donor_name: e.target.value })}
              placeholder="e.g. USAID (Bureau for Humanitarian Assistance)"
              className="adra-input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Donor Code / Acronym</label>
              <input
                type="text"
                value={donorForm.donor_code}
                onChange={(e) => setDonorForm({ ...donorForm, donor_code: e.target.value })}
                placeholder="e.g. USAID-BHA"
                className="adra-input"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Donor Type</label>
              <select
                value={donorForm.donor_type}
                onChange={(e) => setDonorForm({ ...donorForm, donor_type: e.target.value })}
                className="adra-input"
              >
                <option value="Bilateral Government Agency">Bilateral Government Agency</option>
                <option value="Multilateral Humanitarian Agency">Multilateral Humanitarian Agency</option>
                <option value="Global Network Foundation">Global Network Foundation</option>
                <option value="Private Philanthropy">Private Philanthropy</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Focal Contact Person <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={donorForm.contact_person}
                onChange={(e) => setDonorForm({ ...donorForm, contact_person: e.target.value })}
                placeholder="e.g. Sarah Jenkins"
                className="adra-input"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Country / Headquarters</label>
              <input
                type="text"
                value={donorForm.country}
                onChange={(e) => setDonorForm({ ...donorForm, country: e.target.value })}
                placeholder="e.g. United States"
                className="adra-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Grant Commitment (USD)</label>
              <input
                type="number"
                value={donorForm.funding_amount}
                onChange={(e) => setDonorForm({ ...donorForm, funding_amount: e.target.value })}
                placeholder="e.g. 2500000"
                className="adra-input"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Agreement Date</label>
              <input
                type="date"
                value={donorForm.funding_date}
                onChange={(e) => setDonorForm({ ...donorForm, funding_date: e.target.value })}
                className="adra-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                value={donorForm.email}
                onChange={(e) => setDonorForm({ ...donorForm, email: e.target.value })}
                placeholder="contact@donor.org"
                className="adra-input"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={donorForm.phone}
                onChange={(e) => setDonorForm({ ...donorForm, phone: e.target.value })}
                placeholder="+1-202-555-0143"
                className="adra-input"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsDonorModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingDonor ? 'Save Changes' : 'Register Donor'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. REGISTER PARTNER MODAL */}
      <Modal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        title="Register Implementing Partner"
      >
        <form onSubmit={handleSavePartner} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Partner Organization Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={partnerForm.partner_name}
              onChange={(e) => setPartnerForm({ ...partnerForm, partner_name: e.target.value })}
              placeholder="e.g. Community Water & Sanitation Trust"
              className="adra-input"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Focal Contact Person <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={partnerForm.contact_person}
              onChange={(e) => setPartnerForm({ ...partnerForm, contact_person: e.target.value })}
              placeholder="e.g. Amina Hassan"
              className="adra-input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                value={partnerForm.email}
                onChange={(e) => setPartnerForm({ ...partnerForm, email: e.target.value })}
                className="adra-input"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={partnerForm.phone}
                onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                className="adra-input"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Scope of Technical Partnership</label>
            <textarea
              rows={3}
              value={partnerForm.description}
              onChange={(e) => setPartnerForm({ ...partnerForm, description: e.target.value })}
              placeholder="Describe joint field roles, hydrogeology, agronomy extension or vocational certification..."
              className="adra-input"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsPartnerModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Register Partner
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. DONOR GRANTS BREAKDOWN MODAL */}
      <Modal
        isOpen={Boolean(selectedDonorForGrants)}
        onClose={() => setSelectedDonorForGrants(null)}
        title={selectedDonorForGrants ? `Grant Agreements — ${selectedDonorForGrants.donor_name}` : 'Grants'}
      >
        {selectedDonorForGrants && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Total Committed Grant Portfolio</span>
                <span className="text-base font-black text-slate-900">
                  ${Number(selectedDonorForGrants.funding_amount || 0).toLocaleString()}
                </span>
              </div>
              <Badge status={selectedDonorForGrants.compliance_status || 'Fully Compliant'} />
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-800">Linked Project Grant Contracts</h4>
              {grants.filter(g => g.donor_id === selectedDonorForGrants.id || g.donor_name === selectedDonorForGrants.donor_name).length === 0 ? (
                <p className="text-slate-500 italic p-3 bg-slate-50 rounded-lg">No active project grants currently linked.</p>
              ) : (
                grants
                  .filter(g => g.donor_id === selectedDonorForGrants.id || g.donor_name === selectedDonorForGrants.donor_name)
                  .map((g) => (
                    <div key={g.id} className="p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#006B56]">{g.grant_code}</span>
                        <Badge status={g.status || 'Active'} />
                      </div>
                      <p className="font-bold text-slate-900 text-xs">{g.project_name}</p>
                      <div className="grid grid-cols-3 gap-2 text-[11px] pt-2 border-t border-slate-100 text-slate-600">
                        <div>
                          <span className="text-slate-400 block">Committed:</span>
                          <strong>${Number(g.total_committed || 0).toLocaleString()}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Disbursed:</span>
                          <strong className="text-emerald-700">${Number(g.disbursed_amount || 0).toLocaleString()}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Expended:</span>
                          <strong>${Number(g.expended_amount || 0).toLocaleString()}</strong>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedDonorForGrants(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
