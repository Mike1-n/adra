import React, { useState, useEffect } from 'react';
import {
  Send,
  CheckCircle2,
  Mail,
  Phone
} from 'lucide-react';
import { db } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

export function HelpSupportContactView({ beneficiary }) {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    fullName: beneficiary?.full_name || currentUser?.full_name || '',
    contact: beneficiary?.phone || beneficiary?.email || currentUser?.phone || currentUser?.email || '',
    subject: 'General Inquiry',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (beneficiary) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || beneficiary.full_name || '',
        contact: prev.contact || beneficiary.phone || beneficiary.email || ''
      }));
    }
  }, [beneficiary]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.warning('Please enter your name.');
      return;
    }
    if (!formData.contact.trim()) {
      toast.warning('Please enter your phone number or email.');
      return;
    }
    if (!formData.message.trim()) {
      toast.warning('Please write a message.');
      return;
    }

    try {
      setIsSubmitting(true);
      const ticketCode = `ADRA-MSG-${Date.now().toString().slice(-5)}`;

      if (db.logAudit) {
        db.logAudit({
          action: 'CONTACT_US_MESSAGE',
          module: 'Contact Us',
          record_id: ticketCode,
          details: `Message from ${formData.fullName} (${formData.contact}): ${formData.message}`
        });
      }

      setIsSuccess(true);
      toast.success('Your message has been sent successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Could not send message. Please try calling us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto font-sans text-slate-900 pb-8">
      {/* MAIN CONTACT US CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        {isSuccess ? (
          <div className="py-10 text-center space-y-3 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#006B56] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Message Sent!</h3>
            <p className="text-xs text-slate-600">
              Thank you, <strong>{formData.fullName}</strong>. We have received your message and our team will get back to you shortly.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false);
                  setFormData(prev => ({ ...prev, message: '' }));
                }}
                className="px-5 py-2.5 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white font-bold text-xs transition cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h1 className="text-xl font-bold text-slate-900">Contact Us</h1>
              <p className="text-xs text-slate-500 mt-1">
                Have questions or need assistance? Fill out the form below, or reach us at{' '}
                <a href="mailto:support@adra-southsudan.org" className="text-[#006B56] font-semibold hover:underline">
                  support@adra-southsudan.org
                </a>{' '}
                or hotline{' '}
                <a href="tel:0800720112" className="text-[#006B56] font-semibold hover:underline">
                  0800-720-112
                </a>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. John Machar"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Phone Number or Email *
                </label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="e.g. +211 920 123 456 or name@email.com"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Assistance Request Inquiry"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Message *
                </label>
                <textarea
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Write your message here..."
                  className="w-full p-3.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isSubmitting ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default HelpSupportContactView;
