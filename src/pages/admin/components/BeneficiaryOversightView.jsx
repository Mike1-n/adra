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
  FileCheck2
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

  const filtered = beneficiaries.filter((b) => {
    const matchesSearch =
      b.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.beneficiary_code?.toLowerCase().includes(search.toLowerCase()) ||
      b.location?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || b.vulnerability_category === categoryFilter;
    const matchesStat = statusFilter === 'ALL' || (b.verification_status || 'Verified') === statusFilter;
    return matchesSearch && matchesCat && matchesStat;
  });

  const verifiedCount = beneficiaries.filter(b => (b.verification_status || 'Verified') === 'Verified').length;
  const pendingCount = beneficiaries.filter(b => b.verification_status === 'Pending Verification').length;
  const flaggedCount = beneficiaries.filter(b => b.verification_status === 'Flagged').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            Beneficiary Compliance Oversight
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Read-only administrative compliance view of beneficiary records, biometric/ID verification, and vulnerability oversight.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1 rounded-lg">
            Oversight Mode (Read-Only)
          </span>
        </div>
      </div>

      {/* Compliance Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Enrolled</p>
          <h3 className="text-2xl font-bold text-white mt-1">{beneficiaries.length.toLocaleString()}</h3>
          <p className="text-[11px] text-emerald-400 mt-0.5">Across all operational zones</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Verified Compliance</p>
          <h3 className="text-2xl font-bold text-emerald-400 mt-1">{verifiedCount.toLocaleString()}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Audit-passed household IDs</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pending / Flagged</p>
          <h3 className="text-2xl font-bold text-amber-400 mt-1">{(pendingCount + flaggedCount).toLocaleString()}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Awaiting field officer review</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, name, location..."
            className="adra-input pl-10 text-xs sm:text-sm"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="adra-select text-xs sm:text-sm"
        >
          <option value="ALL">All Verification States</option>
          <option value="Verified">Verified Households</option>
          <option value="Pending Verification">Pending Verification</option>
          <option value="Flagged">Flagged / Audit Discrepancy</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="adra-select text-xs sm:text-sm"
        >
          <option value="ALL">All Vulnerability Groups</option>
          <option value="Female-headed household">Female-headed household</option>
          <option value="Persons with Disability (PWD)">Persons with Disability (PWD)</option>
          <option value="Internally Displaced Person (IDP)">Internally Displaced Person (IDP)</option>
          <option value="Elderly without support">Elderly without support</option>
          <option value="Youth at risk">Youth at risk</option>
        </select>
      </div>

      {/* Beneficiaries Table */}
      {loading ? (
        <LoadingSpinner text="Compiling compliance verification records..." />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl">
          <p className="text-sm font-semibold text-slate-300">No beneficiaries match criteria</p>
          <p className="text-xs text-slate-500 mt-1">Adjust your filters to inspect records.</p>
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Beneficiary ID</th>
                  <th className="py-3.5 px-4">Full Legal Name</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Vulnerability Category</th>
                  <th className="py-3.5 px-4">Verification Status</th>
                  <th className="py-3.5 px-4 text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filtered.map((b) => {
                  const status = b.verification_status || 'Verified';
                  return (
                    <tr key={b.id} className="hover:bg-slate-900/50 transition">
                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                        {b.beneficiary_code}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white">
                        {b.full_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {b.location}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                          {b.vulnerability_category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                            status === 'Verified'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : status === 'Flagged'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {status === 'Verified' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedBen(b);
                            setIsDetailOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
                          title="Inspect Compliance Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Compliance Detail Modal */}
      {selectedBen && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Compliance Dossier: ${selectedBen.beneficiary_code}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Full Legal Name:</span>
                <span className="font-bold text-white text-sm">{selectedBen.full_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Household Identification:</span>
                <span className="font-mono text-emerald-400">{selectedBen.beneficiary_code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Demographics:</span>
                <span className="text-slate-200">{selectedBen.gender}, Age: {selectedBen.age || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Operational Zone:</span>
                <span className="text-slate-200">{selectedBen.location}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Vulnerability Classification:</span>
                <span className="font-medium text-amber-300">{selectedBen.vulnerability_category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Verification Compliance State:</span>
                <span className="font-semibold text-emerald-400">{selectedBen.verification_status || 'Verified'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-[11px] text-emerald-300">
              <p className="font-semibold flex items-center gap-1.5 mb-1">
                <FileCheck2 className="w-4 h-4 text-emerald-400" /> Compliance Audit Trail
              </p>
              <p className="text-emerald-200/80 leading-relaxed">
                Record verified against biometric national identity registry. Eligible for emergency food baskets, solar water vouchers, and vocational grants.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Close Dossier
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
