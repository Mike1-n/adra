import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Search,
  ChevronDown,
  PhoneCall,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { db } from '../../../lib/supabase';

const DEFAULT_BENEFICIARY_FAQS = [
  {
    id: 'bfaq-1',
    category: 'Eligibility & Registration',
    question: 'How do I know if my household qualifies for ADRA emergency assistance?',
    answer: 'ADRA prioritizes vulnerable community members including female-headed households, elderly individuals, persons with disabilities, orphans, and families displaced by conflict or climate disasters. Registration is verified by community leaders and ADRA field assessment officers.'
  },
  {
    id: 'bfaq-2',
    category: 'Beneficiary ID & Verification',
    question: 'What do I do if I lose my phone or cannot print my digital Beneficiary ID card?',
    answer: 'Your unique Beneficiary ID number (e.g., ADRA-SS-000104) is securely registered in our central database. When you visit any ADRA distribution center or field depot, an officer can look up your record using your ID number, full name, or registered phone number.'
  },
  {
    id: 'bfaq-3',
    category: 'Aid Collection & Pick-up',
    question: 'Can a family member collect my allocated rations on my behalf?',
    answer: 'Yes. When submitting a request or updating your profile, you can register an Emergency Contact or secondary collector. The designated representative must present your ID number/token and a valid identification document at the distribution point.'
  },
  {
    id: 'bfaq-4',
    category: 'Free Aid Guarantee & Integrity',
    question: 'Is ADRA humanitarian aid completely free? What if someone asks for payment?',
    answer: 'ADRA humanitarian assistance is 100% FREE. No staff member, volunteer, or community leader is ever allowed to ask for money, favors, or items in exchange for aid. If anyone asks for payment, report it immediately to our toll-free hotline at 0800-720-112.'
  },
  {
    id: 'bfaq-5',
    category: 'Request Processing Time',
    question: 'How long does it take for an assistance request to be approved?',
    answer: 'Emergency food, clean water, and shelter requests are reviewed by Field Workers and Area Supervisors within 24–48 hours. You will receive live status updates in this portal under the "Assistance Requests" tab.'
  },
  {
    id: 'bfaq-6',
    category: 'Confidential Feedback & Grievances',
    question: 'How do I submit confidential feedback or report a grievance?',
    answer: 'You can submit feedback or grievances securely via the "Feedback & Complaints" tab in this portal. You can choose to remain completely anonymous, and reports are handled by the independent compliance team.'
  }
];

export function BeneficiaryHelpView({ onNavigateTab }) {
  const [faqs, setFaqs] = useState(DEFAULT_BENEFICIARY_FAQS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [expandedId, setExpandedId] = useState(DEFAULT_BENEFICIARY_FAQS[0]?.id || null);

  useEffect(() => {
    async function loadFaqs() {
      try {
        if (db.getBeneficiaryFaqs) {
          const remoteFaqs = await db.getBeneficiaryFaqs();
          if (remoteFaqs && remoteFaqs.length > 0) {
            setFaqs(remoteFaqs);
          }
        }
      } catch (err) {
        console.warn('Error loading beneficiary FAQs:', err);
      }
    }
    loadFaqs();
  }, []);

  const categories = ['ALL', ...new Set(faqs.map(f => f.category || 'General'))];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'ALL' || faq.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;
    const matchesSearch =
      (faq.question || '').toLowerCase().includes(q) ||
      (faq.answer || '').toLowerCase().includes(q) ||
      (faq.category || '').toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 pb-12 font-sans text-slate-900 antialiased">
      {/* 1. COMPACT TOP HEADER */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold mb-0.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#006B56]" />
            <span>Community Support & Answers</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Help & FAQs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fast answers to common questions about ADRA relief aid and tokens.
          </p>
        </div>

        {/* Free Hotline Quick Call Button */}
        <a
          href="tel:0800720112"
          className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-[#006B56] text-xs font-bold flex items-center gap-1.5 shrink-0 transition active:scale-95"
          title="Call ADRA Toll-Free Helpline"
        >
          <PhoneCall className="w-3.5 h-3.5 text-[#006B56]" />
          <span className="hidden sm:inline">0800-720-112</span>
          <span className="sm:hidden">Hotline</span>
        </a>
      </div>

      {/* 2. MINIMAL SEARCH INPUT */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search help topics (e.g. lost ID, rations, token)..."
          className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#006B56] shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* 3. MINIMAL CATEGORY PILLS */}
      {categories.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                activeCategory === cat
                  ? 'bg-[#006B56] text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Questions' : cat}
            </button>
          ))}
        </div>
      )}

      {/* 4. ACCORDION FAQ CARDS */}
      <div className="space-y-2">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map(faq => {
            const isExpanded = expandedId === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition"
                >
                  <div className="min-w-0 pr-1">
                    {faq.category && (
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-0.5">
                        {faq.category}
                      </span>
                    )}
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {faq.question}
                    </h3>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180 text-[#006B56]' : ''
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="px-4 pb-3.5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100/80 bg-slate-50/50">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-2">
            <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No matching help articles found.</p>
            <p>Try searching for different keywords or browse all categories.</p>
          </div>
        )}
      </div>

      {/* 5. MINIMAL QUICK CONTACT & SAFEGUARDING STRIP */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#006B56] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-tight">Need personalized support?</p>
            <p className="text-[11px] text-slate-500">Contact ADRA field teams or submit feedback.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('feedback')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
            >
              <MessageSquare className="w-3 h-3 text-slate-500" />
              <span>Feedback</span>
            </button>
          )}

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('support')}
              className="px-3 py-1.5 rounded-lg bg-[#006B56] hover:bg-[#005443] text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <span>Contact Us</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default BeneficiaryHelpView;
