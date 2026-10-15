import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Search,
  Filter,
  Download,
  MapPin,
  Calendar,
  FileCheck2,
  XCircle,
  Check,
  Flag,
  UserCheck,
  IdCard,
  Phone,
  Mail,
  Home,
  Edit2,
  Power
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { db } from '../../../lib/supabase';
import { formatDate } from '../../../lib/utils';
import { useToast } from '../../../context/ToastContext';

export function BeneficiaryOversightView() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedBen, setSelectedBen] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();

  // Edit Beneficiary State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBen, setEditingBen] = useState(null);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    national_id: '',
    phone_number: '',
    location: '',
    vulnerability_category: 'Extremely Poor Household',
    gender: 'Female',
    age: '',
    verification_status: 'Verified Active'
  });

  const loadBeneficiaries = async () => {
    try {
      setLoading(true);
      const data = await db.getBeneficiaries();
      setBeneficiaries(data);
    } catch (err) {
      toast.error('Failed to load beneficiary registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBeneficiaries();
  }, []);

  const handleOpenDetail = (ben) => {
    setSelectedBen(ben);
    setReviewNotes(ben.review_notes || '');
    setIsDetailOpen(true);
  };

  const handleVerify = async (ben) => {
    try {
      setActionLoading(true);
      await db.verifyBeneficiary(ben.id || ben.beneficiary_code, reviewNotes);
      toast.success(`Beneficiary ${ben.full_name} (${ben.beneficiary_code}) verified & activated successfully!`);
      setIsDetailOpen(false);
      loadBeneficiaries();
    } catch (err) {
      toast.error(`Verification failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFlag = async (ben) => {
    try {
      setActionLoading(true);
      const reason = reviewNotes.trim() || 'Flagged by administrator for field identity review';
      await db.flagBeneficiary(ben.id || ben.beneficiary_code, reason);
      toast.warning(`Beneficiary ${ben.full_name} flagged for discrepancy review.`);
      setIsDetailOpen(false);
      loadBeneficiaries();
    } catch (err) {
      toast.error(`Flagging failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (ben) => {
    try {
      setActionLoading(true);
      const reason = reviewNotes.trim() || 'Rejected during compliance review';
      await db.rejectBeneficiary(ben.id || ben.beneficiary_code, reason);
      toast.info(`Registration for ${ben.full_name} rejected.`);
      setIsDetailOpen(false);
      loadBeneficiaries();
    } catch (err) {
      toast.error(`Rejection failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatus = (b) => {
    const raw = (b.verification_status || b.status || '').trim();
    if (raw === 'Deactivated' || b.status === 'Deactivated' || b.verification_status === 'Deactivated') {
      return 'Deactivated';
    }
    if (raw === 'Under Verification' || raw === 'Pending' || raw === 'pending' || raw === 'Pending Verification') {
      return 'Pending Verification';
    }
    if (raw === 'Flagged') return 'Flagged';
    if (raw === 'Rejected') return 'Rejected';
    if (raw === 'Active' || raw === 'Verified Active' || raw === 'Verified') return 'Verified Active';
    return raw || 'Verified Active';
  };

  const handleOpenEdit = (ben) => {
    setEditingBen(ben);
    setEditFormData({
      full_name: ben.full_name || '',
      email: ben.email || (ben.beneficiary_code ? `${ben.beneficiary_code.toLowerCase()}@adra.community` : ''),
      national_id: ben.national_id || ben.id_number || '',
      phone_number: ben.phone_number || ben.phone || '',
      location: ben.location || '',
      vulnerability_category: ben.vulnerability_category || 'Extremely Poor Household',
      gender: ben.gender || 'Female',
      age: ben.age || '',
      verification_status: getStatus(ben)
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingBen) return;
    try {
      setActionLoading(true);
      const isDeact = editFormData.verification_status === 'Deactivated';
      const updates = {
        full_name: editFormData.full_name.trim(),
        email: editFormData.email.trim() || null,
        national_id: editFormData.national_id.trim(),
        id_number: editFormData.national_id.trim(),
        phone_number: editFormData.phone_number.trim(),
        phone: editFormData.phone_number.trim(),
        location: editFormData.location.trim(),
        vulnerability_category: editFormData.vulnerability_category,
        gender: editFormData.gender,
        age: editFormData.age ? Number(editFormData.age) : null,
        verification_status: editFormData.verification_status,
        status: editFormData.verification_status,
        is_active: !isDeact
      };

      // Optimistic update
      setBeneficiaries((prev) =>
        prev.map((item) =>
          item.id === editingBen.id || item.beneficiary_code === editingBen.beneficiary_code
            ? { ...item, ...updates }
            : item
        )
      );

      await db.updateBeneficiary(editingBen.id || editingBen.beneficiary_code, updates);
      toast.success(`Beneficiary ${updates.full_name} (${editingBen.beneficiary_code}) updated successfully.`);
      setIsEditOpen(false);
      await loadBeneficiaries();
    } catch (err) {
      toast.error(`Update failed: ${err.message}`);
      await loadBeneficiaries();
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleDeactivate = async (ben) => {
    const isCurrentlyDeactivated = getStatus(ben) === 'Deactivated';
    const newStatus = isCurrentlyDeactivated ? 'Verified Active' : 'Deactivated';
    const targetId = ben.id || ben.beneficiary_code;

    // Optimistically update table UI immediately
    setBeneficiaries((prev) =>
      prev.map((item) =>
        item.id === ben.id || item.beneficiary_code === ben.beneficiary_code
          ? {
              ...item,
              verification_status: newStatus,
              status: newStatus,
              is_active: !isCurrentlyDeactivated
            }
          : item
      )
    );

    try {
      setActionLoading(true);
      if (isCurrentlyDeactivated) {
        await db.reactivateBeneficiary(targetId);
        toast.success(`Beneficiary ${ben.full_name} (${ben.beneficiary_code}) reactivated.`);
      } else {
        await db.deactivateBeneficiary(targetId, 'Deactivated from administrative beneficiary table');
        toast.info(`Beneficiary ${ben.full_name} (${ben.beneficiary_code}) deactivated.`);
      }
      await loadBeneficiaries();
    } catch (err) {
      toast.error(`Action failed: ${err.message}`);
      await loadBeneficiaries();
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = beneficiaries.filter((b) => {
    const status = getStatus(b);
    const matchesSearch =
      b.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.beneficiary_code?.toLowerCase().includes(search.toLowerCase()) ||
      b.email?.toLowerCase().includes(search.toLowerCase()) ||
      b.phone_number?.toLowerCase().includes(search.toLowerCase()) ||
      b.national_id?.toLowerCase().includes(search.toLowerCase()) ||
      b.id_number?.toLowerCase().includes(search.toLowerCase()) ||
      b.location?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || b.vulnerability_category === categoryFilter;
    
    let matchesStat = true;
    if (statusFilter === 'ALL') matchesStat = true;
    else if (statusFilter === 'Pending Verification' || statusFilter === 'Pending') {
      matchesStat = status === 'Pending Verification' || status === 'Under Verification' || status === 'Pending' || status === 'pending';
    }
    else if (statusFilter === 'Verified' || statusFilter === 'Active') {
      matchesStat = status === 'Verified' || status === 'Verified Active' || status === 'Active';
    }
    else if (statusFilter === 'Flagged') matchesStat = status === 'Flagged';
    else if (statusFilter === 'Rejected') matchesStat = status === 'Rejected';
    else if (statusFilter === 'Deactivated') matchesStat = status === 'Deactivated';

    return matchesSearch && matchesCat && matchesStat;
  });

  const verifiedCount = beneficiaries.filter(b => {
    const s = getStatus(b);
    return s === 'Verified' || s === 'Verified Active' || s === 'Active';
  }).length;
  
  const pendingCount = beneficiaries.filter(b => {
    const s = getStatus(b);
    return s === 'Pending Verification' || s === 'Under Verification' || s === 'Pending';
  }).length;
  const flaggedCount = beneficiaries.filter(b => getStatus(b) === 'Flagged').length;
  const deactivatedCount = beneficiaries.filter(b => getStatus(b) === 'Deactivated').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Beneficiary Verification & Compliance Oversight
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Administrative verification of registered households, national identity audits, and aid eligibility approvals.
          </p>
        </div>

      </div>



      {/* Compliance Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-xl text-left border transition ${
            statusFilter === 'ALL'
              ? 'bg-white border-emerald-500 shadow-sm ring-2 ring-emerald-500/10'
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Enrolled</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{beneficiaries.length.toLocaleString()}</h3>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Across all operational zones</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Pending Verification')}
          className={`p-4 rounded-xl text-left border transition ${
            statusFilter === 'Pending Verification'
              ? 'bg-amber-50/60 border-amber-500 shadow-sm ring-2 ring-amber-500/20'
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">Pending Verification</p>
            {pendingCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />}
          </div>
          <h3 className="text-2xl font-black text-amber-700 mt-1">{pendingCount.toLocaleString()}</h3>
          <p className="text-[11px] text-amber-800/80 mt-0.5">Awaiting administrator review</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Verified')}
          className={`p-4 rounded-xl text-left border transition ${
            statusFilter === 'Verified'
              ? 'bg-emerald-50/60 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">Verified & Active</p>
          <h3 className="text-2xl font-black text-emerald-700 mt-1">{verifiedCount.toLocaleString()}</h3>
          <p className="text-[11px] text-emerald-800/80 mt-0.5">Audit-passed household IDs</p>
        </button>
      </div>

      {/* Filters Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, name, ID, phone, location..."
            className="adra-input pl-10 text-xs sm:text-sm"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="adra-select text-xs sm:text-sm"
        >
          <option value="ALL">All Verification States ({beneficiaries.length})</option>
          <option value="Pending Verification">Pending Verification ({pendingCount})</option>
          <option value="Verified">Verified & Active ({verifiedCount})</option>
          <option value="Flagged">Flagged / Discrepancies ({flaggedCount})</option>
          <option value="Deactivated">Deactivated ({deactivatedCount})</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="adra-select text-xs sm:text-sm"
        >
          <option value="ALL">All Vulnerability Groups</option>
          <option value="Female-headed Household">Female-headed Household</option>
          <option value="Persons with Disability">Persons with Disability</option>
          <option value="Internally Displaced Person (IDP)">Internally Displaced Person (IDP)</option>
          <option value="Elderly">Elderly</option>
          <option value="Youth at Risk">Youth at Risk</option>
          <option value="Extremely Poor Household">Extremely Poor Household</option>
        </select>
      </div>

      {/* Beneficiaries Table */}
      {loading ? (
        <LoadingSpinner text="Compiling compliance verification records..." />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-2xl">
          <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-900">No beneficiaries match criteria</p>
          <p className="text-xs text-slate-500 mt-1">Adjust your filters or search query to inspect records.</p>
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Beneficiary ID</th>
                  <th className="py-3.5 px-4">Full Legal Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">National ID</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Vulnerability Category</th>
                  <th className="py-3.5 px-4">Verification Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filtered.map((b) => {
                  const status = getStatus(b);
                  const isPending = status === 'Pending Verification';
                  return (
                    <tr 
                      key={b.id || b.beneficiary_code} 
                      className={`transition ${isPending ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-slate-50'}`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        {b.beneficiary_code}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{b.full_name}</span>
                        <span className="text-[10px] text-slate-500">Reg: {formatDate(b.registration_date)}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[170px]" title={b.email || 'Not recorded'}>
                            {b.email || (b.beneficiary_code ? `${b.beneficiary_code.toLowerCase()}@adra.community` : '—')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <IdCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{b.national_id || b.id_number || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{b.phone_number || b.phone || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {b.location}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-800 border border-slate-200 font-medium">
                          {b.vulnerability_category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                            status === 'Deactivated'
                              ? 'bg-slate-100 text-slate-600 border-slate-300'
                              : status === 'Verified' || status === 'Verified Active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-500/30'
                              : status === 'Flagged'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          {status === 'Deactivated' ? (
                            <Power className="w-3 h-3 text-slate-500" />
                          ) : status === 'Verified' || status === 'Verified Active' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : status === 'Flagged' ? (
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                          ) : (
                            <Clock className="w-3 h-3 text-amber-600" />
                          )}
                          {status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleVerify(b)}
                              title="Quick Verify Household"
                              className="px-2 py-1 rounded-md text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition border border-emerald-300 flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Verify</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(b)}
                            title="Edit Beneficiary Details"
                            className="px-2 py-1 rounded-md text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 transition border border-slate-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3 text-blue-600" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleDeactivate(b)}
                            title={status === 'Deactivated' ? 'Reactivate Beneficiary' : 'Deactivate Beneficiary'}
                            className={`px-2 py-1 rounded-md text-xs font-medium transition border flex items-center gap-1 cursor-pointer ${
                              status === 'Deactivated'
                                ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-300'
                                : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-300'
                            }`}
                          >
                            <Power className="w-3 h-3" />
                            <span>{status === 'Deactivated' ? 'Activate' : 'Deactivate'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDetail(b)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition border border-slate-200 cursor-pointer"
                            title="Inspect Compliance Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Compliance Detail / Action Modal */}
      {selectedBen && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Beneficiary Compliance Dossier: ${selectedBen.beneficiary_code}`}
        >
          <div className="space-y-4 text-xs">
            {/* Beneficiary Details Summary Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Full Legal Name:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedBen.full_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Household Code:</span>
                <span className="font-mono text-emerald-700 font-bold text-sm">{selectedBen.beneficiary_code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Email Address:</span>
                <span className="text-slate-900 font-semibold">{selectedBen.email || (selectedBen.beneficiary_code ? `${selectedBen.beneficiary_code.toLowerCase()}@adra.community` : 'Not recorded')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">National ID Number:</span>
                <span className="font-mono text-slate-900 font-semibold">{selectedBen.national_id || selectedBen.id_number || 'Pending Submission'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Contact Phone:</span>
                <span className="text-slate-900 font-semibold">{selectedBen.phone_number || selectedBen.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Demographics:</span>
                <span className="text-slate-800 font-medium">{selectedBen.gender}, Age: {selectedBen.age || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Settlement Location:</span>
                <span className="text-slate-800 font-medium">{selectedBen.location}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Vulnerability Classification:</span>
                <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {selectedBen.vulnerability_category}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500">Current Verification State:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                  getStatus(selectedBen) === 'Deactivated'
                    ? 'text-slate-700 bg-slate-100 border border-slate-300'
                    : getStatus(selectedBen) === 'Verified' || getStatus(selectedBen) === 'Verified Active'
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-300'
                    : getStatus(selectedBen) === 'Flagged'
                    ? 'text-rose-700 bg-rose-50 border border-rose-300'
                    : 'text-amber-800 bg-amber-50 border border-amber-300'
                }`}>
                  {getStatus(selectedBen)}
                </span>
              </div>
            </div>

            {/* Audit Notes Input */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 text-xs block">
                Administrator Compliance Notes / Verification Rationale:
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="E.g., National ID confirmed against civil registry. Household vulnerability verified by Turkana field team."
                rows={2}
                className="adra-input w-full text-xs"
              />
            </div>

            {/* Information Banner */}
            {getStatus(selectedBen) === 'Deactivated' ? (
              <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-300 text-[11px] text-slate-800">
                <p className="font-bold flex items-center gap-1.5 mb-1 text-slate-900">
                  <Power className="w-4 h-4 text-slate-600" /> Beneficiary Record Currently Deactivated
                </p>
                <p className="text-slate-600 leading-relaxed">
                  This household record is deactivated. Aid distributions, voucher redemptions, and self-service portal sessions remain suspended until reactivated.
                </p>
              </div>
            ) : getStatus(selectedBen) === 'Pending Verification' ? (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-[11px] text-amber-900">
                <p className="font-bold flex items-center gap-1.5 mb-1 text-amber-900">
                  <Clock className="w-4 h-4 text-amber-700" /> Pending Administrator Authorization
                </p>
                <p className="text-amber-800/90 leading-relaxed">
                  Verifying this household will activate their beneficiary code for aid distribution scheduling, issue QR relief credentials, and enable portal login.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-500/30 text-[11px] text-emerald-900">
                <p className="font-bold flex items-center gap-1.5 mb-1 text-emerald-800">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" /> Compliance Audit Trail Passed
                </p>
                <p className="text-emerald-800/90 leading-relaxed">
                  Record passed administrative identity and vulnerability checks. Household is eligible for direct food basket allocations, WASH vouchers, and agriculture grants.
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-200">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsDetailOpen(false)}
                disabled={actionLoading}
              >
                Close Dossier
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleOpenEdit(selectedBen);
                    setIsDetailOpen(false);
                  }}
                  className="text-blue-700 border-blue-200 hover:bg-blue-50"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Beneficiary</span>
                </Button>

                {getStatus(selectedBen) === 'Deactivated' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      handleToggleDeactivate(selectedBen);
                      setIsDetailOpen(false);
                    }}
                    disabled={actionLoading}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>Reactivate Beneficiary</span>
                  </Button>
                ) : getStatus(selectedBen) === 'Pending Verification' ? (
                  <>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleReject(selectedBen)}
                      disabled={actionLoading}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-400 text-amber-800 hover:bg-amber-50"
                      onClick={() => handleFlag(selectedBen)}
                      disabled={actionLoading}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>Flag Discrepancy</span>
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleVerify(selectedBen)}
                      disabled={actionLoading}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify & Activate</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-300 text-amber-800 hover:bg-amber-50"
                      onClick={() => handleFlag(selectedBen)}
                      disabled={actionLoading}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>Re-flag for Audit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-rose-300 text-rose-700 hover:bg-rose-50"
                      onClick={() => {
                        handleToggleDeactivate(selectedBen);
                        setIsDetailOpen(false);
                      }}
                      disabled={actionLoading}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>Deactivate</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Beneficiary Modal */}
      {editingBen && (
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title={`Edit Beneficiary: ${editingBen.beneficiary_code}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Household Identity Code</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">{editingBen.beneficiary_code}</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Reg: {formatDate(editingBen.registration_date)}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  className="adra-input text-xs sm:text-sm"
                  placeholder="e.g. Mary Ajak Deng"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="adra-input text-xs sm:text-sm"
                  placeholder="e.g. mary.deng@adra.community"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">National ID / Civil Registry ID</label>
                <input
                  type="text"
                  value={editFormData.national_id}
                  onChange={(e) => setEditFormData({ ...editFormData, national_id: e.target.value })}
                  className="adra-input text-xs sm:text-sm font-mono"
                  placeholder="e.g. SSD-NAT-489201"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Contact Phone Number</label>
                <input
                  type="text"
                  value={editFormData.phone_number}
                  onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                  className="adra-input text-xs sm:text-sm"
                  placeholder="e.g. +211-920-112233"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Settlement / Location *</label>
                <input
                  type="text"
                  required
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  className="adra-input text-xs sm:text-sm"
                  placeholder="e.g. Juba Central, Zone 3"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Gender</label>
                <select
                  value={editFormData.gender}
                  onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                  className="adra-select text-xs sm:text-sm"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Age</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={editFormData.age}
                  onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })}
                  className="adra-input text-xs sm:text-sm"
                  placeholder="e.g. 34"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Vulnerability Category</label>
                <select
                  value={editFormData.vulnerability_category}
                  onChange={(e) => setEditFormData({ ...editFormData, vulnerability_category: e.target.value })}
                  className="adra-select text-xs sm:text-sm"
                >
                  <option value="Female-headed Household">Female-headed Household</option>
                  <option value="Persons with Disability">Persons with Disability</option>
                  <option value="Internally Displaced Person (IDP)">Internally Displaced Person (IDP)</option>
                  <option value="Elderly">Elderly</option>
                  <option value="Youth at Risk">Youth at Risk</option>
                  <option value="Extremely Poor Household">Extremely Poor Household</option>
                  <option value="Child-Headed Household">Child-Headed Household</option>
                  <option value="Pregnant / Lactating Mother">Pregnant / Lactating Mother</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Verification / Account Status</label>
                <select
                  value={editFormData.verification_status}
                  onChange={(e) => setEditFormData({ ...editFormData, verification_status: e.target.value })}
                  className="adra-select text-xs sm:text-sm font-semibold"
                >
                  <option value="Verified Active">Verified & Active</option>
                  <option value="Pending Verification">Pending Verification</option>
                  <option value="Flagged">Flagged for Review</option>
                  <option value="Deactivated">Deactivated</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
              <Button type="button" variant="secondary" onClick={() => setIsEditOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700">
                {actionLoading ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
