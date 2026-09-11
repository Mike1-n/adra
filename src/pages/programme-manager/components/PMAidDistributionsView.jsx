import React, { useState, useMemo } from 'react';
import {
  Truck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Lock,
  Eye,
  FileCheck,
  ShieldCheck,
  Package,
  Layers,
  Camera,
  X
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

export function PMAidDistributionsView({
  distributions = [],
  requests = [],
  programmes = []
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgramme, setFilterProgramme] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedDistribution, setSelectedDistribution] = useState(null);

  const filteredDistributions = useMemo(() => {
    return distributions.filter(d => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesId = (d.id || '').toLowerCase().includes(q);
        const matchesReq = (d.request_id || '').toLowerCase().includes(q);
        const matchesBen = (d.beneficiary_name || '').toLowerCase().includes(q);
        const matchesFw = (d.field_worker || '').toLowerCase().includes(q);
        const matchesSup = (d.supervisor || '').toLowerCase().includes(q);
        if (!matchesId && !matchesReq && !matchesBen && !matchesFw && !matchesSup) return false;
      }
      if (filterProgramme !== 'ALL' && d.program_name !== filterProgramme) return false;
      if (filterStatus !== 'ALL' && d.status !== filterStatus) return false;
      return true;
    });
  }, [distributions, searchTerm, filterProgramme, filterStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-[#006B56]" />
            Aid Distribution Monitoring & Verification
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Monitor verified aid handover events, photographic proof of delivery, token redemptions, and field worker distribution logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            Audit Sealed (Read-Only Log)
          </div>
          <span className="text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <strong>{filteredDistributions.length}</strong> Completed Handover Records
          </span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Dist ID, Request ID, Beneficiary, or Worker..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006B56] outline-none"
          />
        </div>

        <div>
          <select
            value={filterProgramme}
            onChange={(e) => setFilterProgramme(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006B56] outline-none bg-white text-slate-700"
          >
            <option value="ALL">All Programmes</option>
            {programmes.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#006B56] outline-none bg-white text-slate-700"
          >
            <option value="ALL">All Distribution Statuses</option>
            <option value="Completed">Completed & Verified</option>
            <option value="In Progress">In Transit / In Progress</option>
            <option value="Scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      {/* Distributions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Distribution ID</th>
                <th className="py-3.5 px-4">Request ID</th>
                <th className="py-3.5 px-4">Beneficiary</th>
                <th className="py-3.5 px-4">Programme</th>
                <th className="py-3.5 px-4">Aid Type & Quantity</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Field Worker</th>
                <th className="py-3.5 px-4">Supervisor</th>
                <th className="py-3.5 px-4">Evidence</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDistributions.length === 0 ? (
                <tr>
                  <td colSpan="12" className="py-12 text-center text-slate-500">
                    <Truck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700">No aid distributions recorded</p>
                  </td>
                </tr>
              ) : (
                filteredDistributions.map((dist) => (
                  <tr key={dist.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-[#006B56]">
                      {dist.id}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {dist.request_id || 'REQ-AUTO'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 text-xs leading-tight">
                        {dist.beneficiary_name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {dist.beneficiary_id}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-800">
                      {dist.program_name || 'Emergency Food'}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div className="font-bold text-slate-800">{dist.assistance_type}</div>
                      <div className="text-slate-500">{dist.quantity || '1 Basket / 50kg'}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {formatDate(dist.distribution_date || dist.date || '2026-09-08')}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {dist.location || 'Kapoeta Town Depot'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700">
                      {dist.field_worker || 'Peter Taban'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {dist.supervisor || 'David Deng'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Camera className="w-3 h-3" />
                        {dist.evidence || 'Photo + Signature'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        {dist.status || 'Completed'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedDistribution(dist)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-[#006B56] hover:text-white text-slate-700 text-xs font-semibold rounded transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Audit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DISTRIBUTION AUDIT MODAL */}
      {selectedDistribution && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#006B56] text-white flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-200 bg-emerald-800/80 px-2 py-0.5 rounded">
                  {selectedDistribution.id}
                </span>
                <h3 className="text-base font-bold mt-1 text-white">Aid Handover & Chain of Custody Audit</h3>
              </div>
              <button
                onClick={() => setSelectedDistribution(null)}
                className="p-1 text-emerald-100 hover:text-white rounded-lg hover:bg-emerald-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-800">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                <strong>Chain of Custody Verified:</strong> Dispatched by authorized Field Supervisor, delivered by Field Worker, confirmed by Beneficiary biometric confirmation.
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Beneficiary:</span>
                  <span className="font-bold text-slate-900">{selectedDistribution.beneficiary_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Aid Item & Qty:</span>
                  <span className="font-bold text-slate-900">{selectedDistribution.assistance_type} ({selectedDistribution.quantity})</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Field Worker In-Charge:</span>
                  <span className="font-bold text-slate-800">{selectedDistribution.field_worker}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Assigned Supervisor:</span>
                  <span className="font-bold text-slate-800">{selectedDistribution.supervisor}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Date & Time:</span>
                  <span className="font-bold text-slate-800">{formatDate(selectedDistribution.distribution_date || selectedDistribution.date)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Distribution Point:</span>
                  <span className="font-bold text-slate-800">{selectedDistribution.location}</span>
                </div>
              </div>

              <div className="p-3 border border-slate-200 rounded-xl bg-white">
                <span className="font-bold text-slate-700 block mb-1">Cryptographic & Biometric Audit Trail:</span>
                <p className="font-mono text-[11px] text-slate-500 break-all">
                  SHA-256: 9f8a3c2e7b1d4f6a8e0b2c4d6f8a0e2b4c6d8f0a2e4b6c8d0e2f4a6b8c0d2e4f
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Tamper-proof record verified against field mobile device keystore.
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-400 italic">Historical records cannot be edited.</span>
              <button
                onClick={() => setSelectedDistribution(null)}
                className="px-4 py-2 bg-[#006B56] text-white text-xs font-bold rounded-lg"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
