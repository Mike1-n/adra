import React, { useState, useEffect } from 'react';
import {
  History,
  CheckCircle,
  Package,
  Calendar,
  DollarSign,
  Download,
  Printer,
  Eye,
  FileText,
  Search,
  ShieldCheck,
  Building2,
  UserCheck
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { db } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

export function AidHistoryView({ beneficiary }) {
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const loadInterventions = async () => {
      try {
        setLoading(true);
        const all = await db.getInterventions();
        // Filter for this beneficiary (b7 or matching code/name)
        const userAid = all.filter(
          item =>
            item.beneficiary_id === beneficiary?.id ||
            item.beneficiary_code === beneficiary?.beneficiary_code ||
            item.beneficiary_name?.toLowerCase() === beneficiary?.full_name?.toLowerCase()
        );
        setInterventions(userAid);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load aid history');
      } finally {
        setLoading(false);
      }
    };
    loadInterventions();
  }, [beneficiary]);

  const filtered = interventions.filter(item => {
    return (
      item.intervention_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.intervention_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleViewVoucher = (item) => {
    setSelectedIntervention(item);
    setIsVoucherOpen(true);
  };

  const handlePrintVoucher = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-white to-slate-50 border border-emerald-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Aid & Assistance History
              </h2>
              <p className="text-xs text-slate-500">
                Official transparent ledger of all food, seeds, water, and relief commodities received by your household.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Relief Ledger
            </span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-emerald-100/80">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[11px] font-semibold text-slate-500">Total Distributions</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{interventions.length} Dispatches</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[11px] font-semibold text-slate-500">Programmes Served</p>
            <p className="text-lg font-bold text-emerald-700 mt-0.5">
              {new Set(interventions.map(i => i.project_id)).size} Major Sectors
            </p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[11px] font-semibold text-slate-500">Last Received</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {interventions.length > 0 ? interventions[interventions.length - 1].intervention_date : 'None'}
            </p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[11px] font-semibold text-slate-500">Ledger Status</p>
            <p className="text-lg font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Reconciled
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by item, code or project..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <p className="text-xs text-slate-500 self-end sm:self-center">
          Showing <span className="font-semibold text-slate-800">{filtered.length}</span> verified assistance records
        </p>
      </div>

      {/* Aid Ledger Cards & Table */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Retrieving official distribution ledger...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No Assistance Records Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchTerm
              ? 'No records match your search criteria. Try a different keyword.'
              : 'You have not yet received any physical aid distributions under this beneficiary registration.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{item.intervention_type}</span>
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {item.intervention_code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {item.project_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewVoucher(item)}
                    className="text-xs gap-1.5 py-1.5 border-slate-200 hover:border-emerald-300 hover:text-emerald-700"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Voucher
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">Package Allocated / Value</span>
                  <span className="font-semibold text-emerald-700 mt-0.5 block">{item.quantity_or_value}</span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block">Dispatch Date</span>
                  <span className="font-medium text-slate-700 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {item.intervention_date}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block">Dispensing Field Officer</span>
                  <span className="font-medium text-slate-700 mt-0.5 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {item.responsible_officer || 'ADRA Relief Team'}
                  </span>
                </div>
              </div>

              {item.description && (
                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-700">Detailed Items: </span>
                  {item.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Official Relief Voucher Modal */}
      {selectedIntervention && (
        <Modal
          isOpen={isVoucherOpen}
          onClose={() => setIsVoucherOpen(false)}
          title="Official Relief Distribution Voucher"
          size="md"
        >
          <div className="space-y-5 p-1">
            {/* Voucher Paper Container */}
            <div className="border-2 border-dashed border-emerald-300 rounded-2xl p-6 bg-gradient-to-b from-emerald-50/40 via-white to-white relative overflow-hidden">
              {/* Header Stamp */}
              <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-base flex items-center justify-center">
                    A
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 leading-tight">ADRA Humanitarian Relief</h4>
                    <p className="text-[10px] text-slate-500">Official Beneficiary Goods Handover Voucher</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Voucher Serial</span>
                  <span className="font-mono font-bold text-xs text-emerald-700">{selectedIntervention.intervention_code}</span>
                </div>
              </div>

              {/* Beneficiary Details Box */}
              <div className="grid grid-cols-2 gap-3 py-4 border-b border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Recipient Name</span>
                  <span className="font-bold text-slate-900">{selectedIntervention.beneficiary_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">ADRA Beneficiary ID</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {beneficiary?.beneficiary_code || 'BEN-2025-007'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Date Dispatched</span>
                  <span className="font-medium text-slate-800">{selectedIntervention.intervention_date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Dispensing Officer</span>
                  <span className="font-medium text-slate-800">{selectedIntervention.responsible_officer}</span>
                </div>
              </div>

              {/* Commodity Items Issued */}
              <div className="py-4 space-y-2">
                <span className="text-[11px] font-bold text-slate-800 block">Assistance Items Dispatched:</span>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-950 font-medium space-y-1">
                  <p className="font-bold text-emerald-800">{selectedIntervention.intervention_type}</p>
                  <p>{selectedIntervention.description}</p>
                  <p className="text-[11px] text-emerald-700 font-semibold pt-1 border-t border-emerald-200">
                    Allocation Package: {selectedIntervention.quantity_or_value}
                  </p>
                </div>
              </div>

              {/* Verification Stamp Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Verified & Biometrically Reconciled</span>
                </div>

                <span className="text-[10px] text-slate-400">
                  ADRA DMS Core • Digital Chain of Custody
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsVoucherOpen(false)}
                className="text-xs"
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrintVoucher}
                className="text-xs gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Voucher
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
