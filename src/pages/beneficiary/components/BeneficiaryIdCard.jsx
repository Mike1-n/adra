import React, { useRef } from 'react';
import {
  ShieldCheck,
  QrCode,
  Download,
  Printer,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Sparkles,
  Phone
} from 'lucide-react';
import { Button } from '../../../components/common/Button';

export function BeneficiaryIdCard({ beneficiary }) {
  const cardRef = useRef(null);

  const ben = beneficiary || {
    beneficiary_code: 'BEN-2025-007',
    full_name: 'Mary Nyambura',
    phone_number: '+254-718-920114',
    location: 'Lodwar Central, Turkana West',
    household_size: 5,
    verification_status: 'Verified Active',
    registration_date: '2025-01-20',
    qr_token: 'ADRA-BEN-2025-007-VFD891',
    vulnerability_category: 'Female-headed Household'
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-600" />
            Official ADRA Beneficiary ID
          </h2>
          <p className="text-xs text-slate-500">
            Unique verified identification credential for biometric checkpoint check-in and aid distribution collection
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            icon={Printer}
          >
            Print Card
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            icon={Download}
          >
            Download Pass
          </Button>
        </div>
      </div>

      {/* Main Digital ID Card Container */}
      <div className="max-w-xl mx-auto">
        <div
          ref={cardRef}
          className="bg-white rounded-2xl border-2 border-emerald-600/30 shadow-xl overflow-hidden relative"
        >
          {/* Top Brand Stripe */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white text-emerald-700 flex items-center justify-center font-black text-lg shadow-sm">
                A
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight text-white">ADRA KENYA</h3>
                <p className="text-[10px] text-emerald-100 uppercase tracking-wider font-semibold">
                  Humanitarian Beneficiary Credential
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/20 border border-white/30 text-white backdrop-blur-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {ben.verification_status || 'Verified Active'}
            </span>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-5 bg-white">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Photo */}
              <div className="relative shrink-0">
                <img
                  src={ben.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200'}
                  alt={ben.full_name}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-600 text-white rounded-full border-2 border-white shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Bio & Details */}
              <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Beneficiary Name</p>
                  <h4 className="text-lg font-black text-slate-900 truncate">{ben.full_name}</h4>
                </div>

                <div className="inline-block px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-500/30 text-emerald-800 font-mono font-bold text-xs tracking-wider">
                  {ben.beneficiary_code || 'ADRA-SS-000125'}
                </div>

                <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {ben.location || 'Turkana West'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    Household: <strong className="text-slate-900 font-semibold">{ben.household_size || 5} members</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Verification QR Code Section */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Field Checkpoint Token</p>
                <p className="font-mono text-xs font-bold text-emerald-800">{ben.qr_token || 'ADRA-SS-000125-VFD891'}</p>
                <p className="text-[10px] text-slate-500">
                  Scan at distribution depot for instant ration disbursement
                </p>
              </div>

              {/* High-contrast Visual QR Code Simulation */}
              <div className="w-16 h-16 bg-white p-1.5 rounded-xl border border-slate-300 shadow-sm shrink-0 flex items-center justify-center">
                <div className="grid grid-cols-4 gap-0.5 w-full h-full p-0.5">
                  <div className="bg-slate-900 rounded-sm" />
                  <div className="bg-slate-900 rounded-sm" />
                  <div className="bg-slate-100 rounded-sm" />
                  <div className="bg-slate-900 rounded-sm" />
                  <div className="bg-slate-900 rounded-sm" />
                  <div className="bg-white rounded-sm" />
                  <div className="bg-emerald-600 rounded-sm" />
                  <div className="bg-slate-900 rounded-sm" />
                  <div className="bg-slate-100 rounded-sm" />
                  <div className="bg-emerald-600 rounded-sm" />
                  <div className="bg-slate-900 rounded-sm" />
                  <div className="bg-white rounded-sm" />
                  <div className="bg-slate-900 rounded-sm" />
                  <div className="bg-slate-900 rounded-sm" />
                  <div className="bg-slate-100 rounded-sm" />
                  <div className="bg-slate-900 rounded-sm" />
                </div>
              </div>
            </div>

            {/* Additional Credential Telemetry */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-100">
              <div>
                <p className="text-[10px] text-slate-400">Issue Date</p>
                <p className="font-semibold text-slate-800">{ben.registration_date || '2025-01-20'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Vulnerability</p>
                <p className="font-semibold text-slate-800 truncate">{ben.vulnerability_category || 'Displaced'}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[10px] text-slate-400">Direct Phone</p>
                <p className="font-semibold text-slate-800">{ben.phone_number || '+254-718-920114'}</p>
              </div>
            </div>
          </div>

          {/* Footer Security Watermark */}
          <div className="bg-slate-850 px-6 py-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
            <span>Property of ADRA Humanitarian Aid Network</span>
            <span className="font-mono">Security Hash: #SHA256-VFD918</span>
          </div>
        </div>
      </div>
    </div>
  );
}
