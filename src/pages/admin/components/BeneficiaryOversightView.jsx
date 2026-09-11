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
  Home
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

  const getStatus = (b) => b.verification_status || b.status || 'Verified Active';

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
    else if (statusFilter === 'Pending Verification') matchesStat = status === 'Pending Verification';
    else if (statusFilter === 'Verified') matchesStat = status === 'Verified' || status === 'Verified Active';
    else if (statusFilter === 'Flagged') matchesStat = status === 'Flagged';
    else if (statusFilter === 'Rejected') matchesStat = status === 'Rejected';

    return matchesSearch && matchesCat && matchesStat;
  });

  const verifiedCount = beneficiaries.filter(b => {
    const s = getStatus(b);
    return s === 'Verified' || s === 'Verified Active';
  }).length;
  
  const pendingCount = beneficiaries.filter(b => getStatus(b) === 'Pending Verification').length;
  const flaggedCount = beneficiaries.filter(b => getStatus(b) === 'Flagged').length;

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
                            status === 'Verified' || status === 'Verified Active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-500/30'
                              : status === 'Flagged'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          {status === 'Verified' || status === 'Verified Active' ? (
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
                          {isPending ? (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                className="text-xs px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => handleVerify(b)}
                                title="Quick Verify Household"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Verify</span>
                              </Button>
                              <button
                                onClick={() => handleOpenDetail(b)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200"
                                title="Review Compliance Dossier"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleOpenDetail(b)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition border border-slate-200 flex items-center gap-1 text-[11px] font-medium"
                              title="Inspect Compliance Profile"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect</span>
                            </button>
                          )}
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
                  getStatus(selectedBen) === 'Verified' || getStatus(selectedBen) === 'Verified Active'
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
            {getStatus(selectedBen) === 'Pending Verification' ? (
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
                {getStatus(selectedBen) === 'Pending Verification' && (
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
                )}

                {getStatus(selectedBen) !== 'Pending Verification' && (
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
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
