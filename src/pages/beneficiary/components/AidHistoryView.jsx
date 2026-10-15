import React, { useState, useEffect } from 'react';
import {
  History,
  CheckCircle,
  Package,
  Calendar,
  Printer,
  Eye,
  Building2,
  UserCheck,
  Sparkles,
  Search
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { db } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

export function AidHistoryView({ beneficiary, onNavigateTab }) {
  const [interventions, setInterventions] = useState([]);
  const [allInterventions, setAllInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [previewSample, setPreviewSample] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const loadInterventions = async () => {
      try {
        setLoading(true);
        const all = await db.getInterventions();
        setAllInterventions(all || []);
        // Filter for this beneficiary
        const userAid = (all || []).filter(
          item =>
            item.beneficiary_id === beneficiary?.id ||
            item.beneficiary_code === beneficiary?.beneficiary_code ||
            (beneficiary?.full_name && item.beneficiary_name?.toLowerCase() === beneficiary.full_name.toLowerCase())
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

  // If preview sample is toggled when user has no records, show available sample records
  const displayRecords = (previewSample && interventions.length === 0)
    ? allInterventions.filter(i => i.beneficiary_id === 'b7' || i.beneficiary_name?.includes('Mary'))
    : interventions;

  const filtered = displayRecords.filter(item => {
    return (
      item.intervention_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.intervention_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleViewMore = (item) => {
    setSelectedIntervention(item);
    setIsVoucherOpen(true);
  };

  const handlePrintVoucher = () => {
    window.print();
  };

  return (
    <div className="space-y-3 font-sans text-slate-900">
      {/* Clean Single Header */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Aid & Assistance History
          </h2>
          <p className="text-xs text-slate-500">
            Official record of relief commodities and assistance received by your household.
          </p>
        </div>

        <div className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-mono font-bold shrink-0">
          {beneficiary?.beneficiary_code || 'ADRA-SS-000104'}
        </div>
      </div>

      {/* Preview Sample Notice if active */}
      {previewSample && (
        <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
          <span className="flex items-center gap-1.5 font-medium text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-[#006B56]" />
            Previewing sample historical records
          </span>
          <button
            type="button"
            onClick={() => setPreviewSample(false)}
            className="font-bold text-[#006B56] hover:underline cursor-pointer text-[11px]"
          >
            Reset
          </button>
        </div>
      )}

      {/* Search Bar (Only when records exist) */}
      {displayRecords.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search records..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <span className="text-[11px] text-slate-400 font-medium shrink-0">
            {filtered.length} record{filtered.length === 1 ? '' : 's'}
          </span>
        </div>
      )}

      {/* 3-COLUMN AID HISTORY TABLE */}
      {loading ? (
        <div className="text-center py-10 text-xs text-slate-400">Loading assistance records...</div>
      ) : (
        <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-2.5 px-3 sm:px-4 w-28 sm:w-36">Date</th>
                <th className="py-2.5 px-3 sm:px-4">Commodity / Item</th>
                <th className="py-2.5 px-3 sm:px-4 text-right w-24 sm:w-32">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-10 px-4 text-xs text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Package className="w-7 h-7 text-slate-300 mx-auto" />
                      <p className="font-bold text-slate-700">No Assistance Records Found</p>
                      <p className="text-[11px] text-slate-400">
                        {searchTerm
                          ? 'No records match your search keyword.'
                          : 'You have not yet received any physical aid distributions under this beneficiary registration.'}
                      </p>
                      {allInterventions.length > 0 && !previewSample && !searchTerm && (
                        <button
                          type="button"
                          onClick={() => setPreviewSample(true)}
                          className="text-[11px] text-[#006B56] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer pt-1"
                        >
                          <Sparkles className="w-3 h-3 text-[#006B56]" />
                          <span>Preview sample history rows</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    {/* Column 1: Date */}
                    <td className="py-3 px-3 sm:px-4 text-slate-600 font-medium whitespace-nowrap align-top">
                      <span className="block font-bold text-slate-800">{item.intervention_date}</span>
                      <span className="text-[10px] font-mono text-slate-400">{item.intervention_code}</span>
                    </td>

                    {/* Column 2: Commodity / Item */}
                    <td className="py-3 px-3 sm:px-4 align-top">
                      <span className="font-bold text-slate-900 block leading-tight">{item.intervention_type}</span>
                      <span className="text-[11px] text-emerald-800 font-semibold block mt-0.5">
                        {item.quantity_or_value}
                      </span>
                      {item.project_name && (
                        <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                          {item.project_name}
                        </span>
                      )}
                    </td>

                    {/* Column 3: Action (View More) */}
                    <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap align-middle">
                      <button
                        type="button"
                        onClick={() => handleViewMore(item)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#006B56] hover:bg-[#005443] text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs active:scale-95 transition cursor-pointer"
                        title="View complete voucher details"
                      >
                        <span>View More</span>
                        <Eye className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* View More Details Modal */}
      {selectedIntervention && (
        <Modal
          isOpen={isVoucherOpen}
          onClose={() => setIsVoucherOpen(false)}
          title="Relief Distribution Details"
          size="md"
        >
          <div className="space-y-4 p-1">
            {/* Voucher / Receipt Card */}
            <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-white space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Voucher Reference</span>
                  <span className="font-mono font-black text-sm text-[#006B56]">{selectedIntervention.intervention_code}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-[#006B56] border border-emerald-200">
                  Verified Reconciled
                </span>
              </div>

              {/* Grid of details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Recipient</span>
                  <span className="font-bold text-slate-900">{selectedIntervention.beneficiary_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Household Code</span>
                  <span className="font-mono font-bold text-slate-800">
                    {beneficiary?.beneficiary_code || 'ADRA-SS-000104'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Distribution Date</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {selectedIntervention.intervention_date}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Dispensing Officer</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#006B56]" />
                    {selectedIntervention.responsible_officer || 'ADRA Relief Team'}
                  </span>
                </div>
              </div>

              {/* Programme / Project */}
              <div className="pt-2 border-t border-slate-100 text-xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Humanitarian Programme</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {selectedIntervention.project_name}
                </span>
              </div>

              {/* Package Allocated */}
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">Commodity Package</span>
                <p className="font-bold text-emerald-950 text-sm">{selectedIntervention.intervention_type}</p>
                <p className="text-emerald-800 font-semibold">{selectedIntervention.quantity_or_value}</p>
                {selectedIntervention.description && (
                  <p className="text-[11px] text-slate-600 pt-1 border-t border-emerald-200/60 mt-1">
                    {selectedIntervention.description}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400">ADRA Humanitarian Relief Ledger</span>
              <div className="flex items-center gap-2">
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
                  className="text-xs gap-1.5 shadow-xs bg-[#006B56] hover:bg-[#005443]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Voucher
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default AidHistoryView;
