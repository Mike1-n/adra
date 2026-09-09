import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Headphones,
  Building2,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { db } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

export function HelpSupportContactView() {
  const [subTab, setSubTab] = useState('faqs'); // 'faqs' | 'contacts'
  const [faqs, setFaqs] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [f, c] = await Promise.all([
          db.getBeneficiaryFaqs(),
          db.getApprovedContacts()
        ]);
        setFaqs(f);
        setContacts(c);
        if (f.length > 0) setExpandedFaq(f[0].id);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load support information');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredFaqs = faqs.filter(f =>
    f.question?.toLowerCase().includes(faqSearch.toLowerCase()) ||
    f.answer?.toLowerCase().includes(faqSearch.toLowerCase()) ||
    f.category?.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-white to-slate-50 border border-emerald-200/60 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Help, Support & Contact ADRA
              </h2>
              <p className="text-xs text-slate-500">
                Browse official assistance FAQs, call our toll-free hotline, or contact your nearest ADRA field station.
              </p>
            </div>
          </div>

          {/* Sub Navigation Switch */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setSubTab('faqs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                subTab === 'faqs'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Frequently Asked Questions (FAQ)
            </button>
            <button
              type="button"
              onClick={() => setSubTab('contacts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                subTab === 'contacts'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Contact Field Offices
            </button>
          </div>
        </div>

        {/* Toll-Free Emergency Hotline Card */}
        <div className="mt-6 pt-5 border-t border-emerald-100/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4 rounded-xl shadow-md flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-100 block">
                Toll-Free Humanitarian Hotline
              </span>
              <span className="text-lg font-black tracking-wide block mt-0.5">
                0800-720-112
              </span>
              <span className="text-[11px] text-emerald-100 block mt-0.5">
                Free from all mobile networks • 24/7 Voice Support
              </span>
            </div>
            <a
              href="tel:0800720112"
              className="px-3.5 py-2 rounded-xl bg-white text-emerald-800 font-bold text-xs hover:bg-emerald-50 transition shadow-sm"
            >
              Call Free
            </a>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                WhatsApp Community Desk
              </span>
              <span className="text-sm font-bold text-slate-900 block mt-0.5">
                +254-712-345678
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Instant text support in English & Swahili
              </span>
            </div>
            <a
              href="https://wa.me/254712345678"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs hover:bg-emerald-100 transition shadow-2xs"
            >
              Chat WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: FAQS */}
      {subTab === 'faqs' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              placeholder="Search questions or keywords..."
              className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {loading ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading support knowledgebase...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq) => {
                const isExpanded = expandedFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-emerald-300 transition"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                      className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          {faq.category}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 pt-1">
                          {faq.question}
                        </h4>
                      </div>

                      <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500 shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: CONTACTS */}
      {subTab === 'contacts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-emerald-300 hover:shadow-md transition space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">
                    {contact.office}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {contact.address}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" /> Phone:
                  </span>
                  <a
                    href={`tel:${contact.phone}`}
                    className="font-semibold text-slate-900 hover:text-emerald-700"
                  >
                    {contact.phone}
                  </a>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-600" /> Email:
                  </span>
                  <a
                    href={`mailto:${contact.email}`}
                    className="font-semibold text-emerald-700 hover:underline"
                  >
                    {contact.email}
                  </a>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" /> Hours:
                  </span>
                  <span className="font-medium text-slate-700 text-[11px] text-right max-w-[200px]">
                    {contact.hours}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <a
                  href={`tel:${contact.phone}`}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" /> Call Office
                </a>
                <a
                  href={`mailto:${contact.email}`}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold flex items-center gap-1 shadow-sm"
                >
                  <Mail className="w-3.5 h-3.5" /> Send Message
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
