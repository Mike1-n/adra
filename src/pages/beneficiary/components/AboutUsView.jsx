import React from 'react';
import {
  ShieldCheck,
  Globe,
  Droplets,
  Wheat,
  Heart,
  PhoneCall,
  MessageSquare,
  ArrowRight,
  MapPin,
  Mail,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { AdraLogo } from '../../../components/common/AdraLogo';

export function AboutUsView({ onNavigateTab }) {
  const highlights = [
    { value: '120+', label: 'Countries Worldwide', sub: 'Global humanitarian presence' },
    { value: '45,000+', label: 'Households Supported', sub: 'Across South Sudan communities' },
    { value: '100% Free', label: 'Aid Guarantee', sub: 'No fees or payments ever' },
    { value: '0800-720-112', label: 'Toll-Free Hotline', sub: 'Confidential community support' },
  ];

  const focusAreas = [
    {
      icon: Wheat,
      title: 'Emergency Food & Nutrition',
      description: 'Rapid food distributions and nutrition support for families facing drought, flooding, or crisis.'
    },
    {
      icon: Droplets,
      title: 'Clean Water & Sanitation (WASH)',
      description: 'Solar-powered boreholes, clean drinking water points, and hygiene supplies for vulnerable communities.'
    },
    {
      icon: Heart,
      title: 'Livelihoods & Recovery',
      description: 'Drought-tolerant seeds, farming tools, and vocational skills training to foster household self-reliance.'
    },
    {
      icon: ShieldCheck,
      title: 'Protection & Inclusion',
      description: 'Dignified aid delivery prioritizing women, children, the elderly, and persons with disabilities.'
    }
  ];

  return (
    <div className="w-full bg-white text-slate-900 font-sans pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* 1. CLEAN HEADER (WHITE BACKGROUND) */}
        <div className="pt-2 sm:pt-4 border-b border-slate-100 pb-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
            <Globe className="w-4 h-4 text-[#006B56]" />
            <span>Adventist Development and Relief Agency</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            About ADRA South Sudan
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
            ADRA is the global humanitarian arm of the Seventh-day Adventist Church. We work with communities across South Sudan to relieve suffering, restore dignity, and build long-term resilience—serving all people in need regardless of ethnicity, religion, or political affiliation.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('requests')}
                className="px-4 py-2 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white text-xs font-bold flex items-center gap-2 transition shadow-xs cursor-pointer"
              >
                <span>Request Assistance</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <a
              href="tel:0800720112"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#006B56]" />
              <span>Free Helpline: 0800-720-112</span>
            </a>
          </div>
        </div>

        {/* 2. KEY METRICS ROW (CLEAN INLINE, NO HEAVY CARDS) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 border-b border-slate-100">
          {highlights.map((item, idx) => (
            <div key={idx} className="space-y-0.5">
              <span className="text-xl sm:text-2xl font-black text-[#006B56] block tracking-tight">
                {item.value}
              </span>
              <p className="text-xs font-bold text-slate-800">{item.label}</p>
              <p className="text-[11px] text-slate-500 leading-tight">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* 3. OUR WORK IN SOUTH SUDAN */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              What We Do
            </h2>
            <p className="text-xs text-slate-500">
              Supporting vulnerable households through four core humanitarian focus areas:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {focusAreas.map((area, idx) => {
              const Icon = area.icon;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-white transition space-y-1.5"
                >
                  <div className="flex items-center gap-2 text-[#006B56] font-bold text-xs">
                    <Icon className="w-4 h-4 text-[#006B56] shrink-0" />
                    <span className="text-slate-900 font-bold">{area.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {area.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. IMPORTANT: 100% FREE AID POLICY & SAFEGUARDING */}
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-[#006B56] shrink-0" />
            <span>100% Free Aid Guarantee & Beneficiary Protection</span>
          </div>

          <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
            <p>
              <strong>ADRA aid is completely free.</strong> No staff member, volunteer, contractor, or local leader has the right to ask for money, goods, services, or favors in exchange for beneficiary registration, token cards, or relief distributions.
            </p>
            <p>
              We maintain a <strong>Zero-Tolerance policy</strong> against Sexual Exploitation, Abuse, and Harassment (PSEA). All personal household data is confidential and safeguarded under international humanitarian standards.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-200/60 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Lock className="w-3.5 h-3.5 text-[#006B56]" />
              <span>Report any misconduct safely & anonymously.</span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="tel:0800720112"
                className="font-bold text-[#006B56] hover:underline"
              >
                Hotline: 0800-720-112
              </a>
              {onNavigateTab && (
                <>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('feedback')}
                    className="font-bold text-[#006B56] hover:underline cursor-pointer"
                  >
                    Submit Feedback
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 5. CONTACT & OFFICE INFORMATION */}
        <div className="border-t border-slate-100 pt-6 space-y-3 text-xs text-slate-600">
          <h3 className="font-bold text-slate-900 text-sm">
            Contact ADRA South Sudan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-800">Country Headquarters</strong>
                <span>Munuki Block C, Juba, South Sudan</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-800">Email Inquiries</strong>
                <a href="mailto:info@adra-southsudan.org" className="text-[#006B56] hover:underline">
                  info@adra-southsudan.org
                </a>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Globe className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-800">Official Website</strong>
                <a
                  href="https://adra.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#006B56] hover:underline"
                >
                  www.adra.org
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AboutUsView;
