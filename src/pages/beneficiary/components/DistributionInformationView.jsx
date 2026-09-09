import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Calendar,
  Clock,
  QrCode,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  ChevronRight,
  Info,
  Phone,
  PackageCheck,
  ShieldCheck,
  Navigation
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { db } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

export function DistributionInformationView({ beneficiary }) {
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDist, setSelectedDist] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const loadDistributions = async () => {
      try {
        setLoading(true);
        const data = await db.getDistributions();
        setDistributions(data);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load distribution schedules');
      } finally {
        setLoading(false);
      }
    };
    loadDistributions();
  }, []);

  const handleCopyToken = (token) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    toast.success('Collection token copied to clipboard!');
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleOpenDetail = (dist) => {
    setSelectedDist(dist);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-white to-slate-50 border border-emerald-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Distribution Schedules & Collection Points
              </h2>
              <p className="text-xs text-slate-500">
                Check pickup dates, designated humanitarian depots, and present your unique collection tokens upon arrival.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Allocation Active
            </span>
          </div>
        </div>
      </div>

      {/* Distribution Cards */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading scheduled field distributions...</p>
        </div>
      ) : distributions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No Active Schedules Available</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            There are currently no scheduled distributions in your ward. New dispatches are posted following cluster verification.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {distributions.map((dist) => (
            <div
              key={dist.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Status & Code */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    {dist.distribution_code}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      dist.status === 'Upcoming'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {dist.status}
                  </span>
                </div>

                {/* Title & Project */}
                <h3 className="font-bold text-base text-slate-900 leading-snug">
                  {dist.title}
                </h3>
                <p className="text-xs text-emerald-700 font-medium mt-1">
                  {dist.project_name}
                </p>

                {/* Logistics Info */}
                <div className="mt-4 space-y-2.5 text-xs text-slate-600 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">{dist.centre_name}</span>
                      <span className="text-[11px] text-slate-500">{dist.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-800">{dist.date}</span>
                    <span className="text-slate-400">•</span>
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-600">{dist.time_window}</span>
                  </div>
                </div>

                {/* Token Box */}
                {dist.collection_token && (
                  <div className="mt-4 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                        Your Gate Collection Token
                      </span>
                      <span className="font-mono text-sm font-extrabold text-emerald-950">
                        {dist.collection_token}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyToken(dist.collection_token)}
                      className="p-2 rounded-lg bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100/50 transition shadow-2xs"
                      title="Copy token to clipboard"
                    >
                      {copiedToken === dist.collection_token ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">{dist.allocated_items?.length || 0} items</span> in ration package
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenDetail(dist)}
                  className="text-xs gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  View Ration & Pass
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Distribution Detail & Gate Pass Modal */}
      {selectedDist && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title="Distribution Details & Digital Gate Pass"
          size="md"
        >
          <div className="space-y-5 p-1">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {selectedDist.distribution_code}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {selectedDist.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{selectedDist.title}</h3>
              <p className="text-xs text-emerald-700 font-medium">{selectedDist.project_name}</p>
            </div>

            {/* Gate Pass Card */}
            <div className="border-2 border-emerald-400 bg-gradient-to-br from-emerald-50/50 to-white rounded-2xl p-4 text-center space-y-3">
              <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                Official Collection Token for Gate Admittance
              </span>
              <div className="inline-block px-5 py-2.5 rounded-xl bg-white border-2 border-emerald-500 shadow-sm">
                <span className="font-mono text-xl font-black text-emerald-800 tracking-wider">
                  {selectedDist.collection_token}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Present this token alongside your Beneficiary ID card ({beneficiary?.beneficiary_code || 'BEN-2025-007'}) at the checkpoint desk.
              </p>
            </div>

            {/* Depot & Logistics Information */}
            <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">{selectedDist.centre_name}</span>
                  <span className="text-slate-600">{selectedDist.location}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-900">{selectedDist.date}</span>
                <span className="text-slate-400">•</span>
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{selectedDist.time_window}</span>
              </div>

              {selectedDist.officer_in_charge && (
                <div className="flex items-center gap-2.5 pt-2 border-t border-slate-200/60">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <span className="font-semibold text-slate-800">Officer In-Charge: </span>
                    {selectedDist.officer_in_charge}
                  </span>
                </div>
              )}
            </div>

            {/* Items Included in this Dispatch */}
            {selectedDist.allocated_items && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-emerald-600" />
                  Commodities Allocated in this Ration:
                </h4>
                <div className="space-y-1.5">
                  {selectedDist.allocated_items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs font-medium text-slate-800"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collection Instructions */}
            {selectedDist.instructions && (
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-950 block">Important Pickup Instructions:</span>
                  <p className="mt-0.5">{selectedDist.instructions}</p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsDetailOpen(false)}
                className="text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
