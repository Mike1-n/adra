import React, { useState, useEffect } from 'react';
import {
  MessageSquarePlus,
  Star,
  Send,
  Sparkles,
  Bug,
  Lightbulb,
  Zap,
  AlertTriangle,
  MessageCircle,
  CheckCircle2,
  X,
  User,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db } from '../../lib/supabase';

const MODULE_OPTIONS = [
  { id: 'field', name: 'Field Programmes & Grants', category: 'Operations' },
  { id: 'beneficiaries', name: 'Beneficiary Oversight & Census', category: 'Community' },
  { id: 'lifecycle', name: 'Aid Assistance & Dispatch Pipeline', category: 'Lifecycle' },
  { id: 'orders', name: 'Supply Chain & Purchase Orders', category: 'Logistics' },
  { id: 'locations', name: 'Operational Locations & Warehouses', category: 'Infrastructure' },
  { id: 'approvals', name: 'Governance & Authorizations', category: 'Governance' },
  { id: 'reports', name: 'Reporting & Document Export', category: 'Analytics' },
  { id: 'security', name: 'Security Policies & Audit Logs', category: 'Security' },
  { id: 'overview', name: 'System Overview & Telemetry', category: 'Dashboard' },
  { id: 'mobile', name: 'Field Mobile Application', category: 'Mobile App' },
];

const CATEGORIES = [
  { id: 'Feature Suggestion', label: 'Feature Suggestion', icon: Lightbulb, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'Issue / Bug Report', label: 'Issue / Bug Report', icon: Bug, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'Usability & Speed', label: 'Usability & Speed', icon: Zap, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'Data Discrepancy', label: 'Data Discrepancy', icon: AlertTriangle, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { id: 'General Feedback', label: 'General Feedback', icon: MessageCircle, color: 'text-blue-600 bg-blue-50 border-blue-200' },
];

const RATING_LABELS = {
  1: 'Needs Significant Improvement',
  2: 'Fair — Some difficulties encountered',
  3: 'Good — Meets expectations',
  4: 'Very Good — Smooth experience',
  5: 'Excellent — Outstanding functionality'
};

export function ModuleFeedbackModal({
  isOpen,
  onClose,
  defaultModule = 'Field Programmes',
  onSuccess
}) {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [selectedModule, setSelectedModule] = useState(defaultModule);
  const [category, setCategory] = useState('Feature Suggestion');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [priority, setPriority] = useState('Normal');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultModule) {
      // Find matching module or keep defaultModule text
      const match = MODULE_OPTIONS.find(
        m => m.name.toLowerCase().includes(defaultModule.toLowerCase()) || 
             defaultModule.toLowerCase().includes(m.name.toLowerCase()) ||
             m.id.toLowerCase() === defaultModule.toLowerCase()
      );
      if (match) {
        setSelectedModule(match.name);
      } else {
        setSelectedModule(defaultModule);
      }
    }
  }, [defaultModule, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.error('Please enter a brief summary / headline.');
      return;
    }
    if (!message.trim()) {
      toast.error('Please provide your feedback or issue description.');
      return;
    }

    try {
      setIsSubmitting(true);
      const targetMod = MODULE_OPTIONS.find(m => m.name === selectedModule);

      const payload = {
        module: selectedModule,
        module_id: targetMod ? targetMod.id : 'general',
        user_name: currentUser?.full_name || currentUser?.name || 'Authorized Staff',
        user_email: currentUser?.email || 'staff@adra.org',
        user_role: currentUser?.role || 'Staff Member',
        category,
        rating,
        priority,
        subject: subject.trim(),
        message: message.trim(),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'ADRA Client'
      };

      const result = await db.submitUserFeedback(payload);
      toast.success(`Feedback recorded! Ticket ${result.ticket_code || '#FB-SUCCESS'}`);
      
      // Reset form
      setSubject('');
      setMessage('');
      setCategory('Feature Suggestion');
      setRating(5);
      setPriority('Normal');
      
      if (onSuccess) onSuccess(result);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-5 sm:p-6 space-y-5">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-500/20 text-emerald-700">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Module Feedback & Experience Review
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Share suggestions, report bottlenecks, or log requests for this application area.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Active Module Selector */}
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Target Application Module</span>
              <span className="text-[10px] text-emerald-700 font-semibold lowercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-500/20">
                Contextual Tagging Active
              </span>
            </label>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="adra-select text-xs py-2 w-full bg-slate-50 font-semibold text-slate-900 rounded-xl border border-slate-300"
            >
              {MODULE_OPTIONS.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name} ({m.category})
                </option>
              ))}
            </select>
          </div>

          {/* Interactive Rating Component */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Module Experience Rating
              </span>
              <span className="text-xs font-bold text-emerald-800">
                {RATING_LABELS[hoverRating || rating]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-slate-300 hover:scale-110 transition cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        isFilled ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="text-xs font-mono font-bold text-slate-700 ml-2">
                {rating}.0 / 5.0
              </span>
            </div>
          </div>

          {/* Feedback Category Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Feedback Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Headline / Subject
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Add quick export button or GPS sync delay"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="adra-input text-xs py-2 w-full bg-white font-medium text-slate-900 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Urgency Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="adra-select text-xs py-2 w-full bg-white font-medium text-slate-900 rounded-xl border border-slate-300"
              >
                <option value="Low">Low (General Remark)</option>
                <option value="Normal">Normal (Standard Review)</option>
                <option value="High">High (Impacting Operations)</option>
                <option value="Urgent">Urgent (Field Blocker)</option>
              </select>
            </div>
          </div>

          {/* Detailed Message Textarea */}
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Detailed Description / Steps</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {message.length} characters
              </span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="Describe what occurred, what could be improved, or how this feature would streamline humanitarian delivery..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="adra-input text-xs py-2 w-full bg-white font-medium text-slate-900 rounded-xl border border-slate-300 resize-none"
            />
          </div>

          {/* Submitter Context Bar */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                Submitting as: <strong className="text-slate-900 font-bold">{currentUser?.full_name || 'Staff User'}</strong> ({currentUser?.role || 'User'})
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
              {currentUser?.email || 'staff@adra.org'}
            </span>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Send}
              className="text-xs"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Recording Ticket...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
