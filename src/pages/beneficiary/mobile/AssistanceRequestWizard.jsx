import React, { useState, useEffect } from 'react';
import {
  HandHeart,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  Sparkles,
  MapPin,
  Users,
  AlertCircle,
  FileText,
  Utensils,
  Droplets,
  HeartPulse,
  Home,
  GraduationCap,
  Sprout,
  Banknote,
  HelpCircle,
  Send
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { db } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

export function AssistanceRequestWizard({ beneficiary, onCancel, onRequestSubmitted }) {
  const toast = useToast();

  const [step, setStep] = useState(1); // 1: Select Type, 2: Form Details, 3: Review Request, 4: Confirmed
  const [submitting, setSubmitting] = useState(false);
  const [programmes, setProgrammes] = useState([]);
  const [submittedResult, setSubmittedResult] = useState(null);

  // Form State matching all required fields
  const [formData, setFormData] = useState({
    category: 'Food',
    project_id: 'pr1',
    project_name: 'Drought Resilience & Climate-Smart Agriculture',
    reason: '',
    household_members: beneficiary?.household_size || 5,
    dependents_detail: '3 children under 10 years, 1 elderly grandparent',
    location: beneficiary?.location || 'Lodwar Central, Turkana West',
    preferred_depot: 'Lodwar Central Humanitarian Depot',
    urgency: 'High',
    additional_notes: '',
    confirmed_correct: false
  });

  // Exactly the 8 assistance types specified by the user
  const assistanceTypes = [
    {
      id: 'Food',
      name: 'Food',
      desc: 'Supplementary grain ration, pulses, fortified cooking oil, child nutrition (CSB+)',
      icon: Utensils,
      color: 'emerald'
    },
    {
      id: 'Water',
      name: 'Water',
      desc: 'Clean emergency drinking water, water purification Aquatabs, 20L jerrycans',
      icon: Droplets,
      color: 'blue'
    },
    {
      id: 'Medical assistance',
      name: 'Medical assistance',
      desc: 'Emergency clinic referral, essential medicines, malaria prevention bednets',
      icon: HeartPulse,
      color: 'rose'
    },
    {
      id: 'Shelter',
      name: 'Shelter',
      desc: 'Reinforced tarpaulins, family emergency tents, blanket kits, kitchen sets',
      icon: Home,
      color: 'amber'
    },
    {
      id: 'Education',
      name: 'Education',
      desc: 'School supplies, textbooks, uniforms, vocational skills tuition subsidy',
      icon: GraduationCap,
      color: 'purple'
    },
    {
      id: 'Agricultural support',
      name: 'Agricultural support',
      desc: 'Drought-resistant certified seeds (sorghum/cowpeas), micro-drip kits, tools',
      icon: Sprout,
      color: 'emerald'
    },
    {
      id: 'Cash/livelihood support',
      name: 'Cash/livelihood support',
      desc: 'Unconditional emergency mobile cash stipend for sustenance and small business',
      icon: Banknote,
      color: 'teal'
    },
    {
      id: 'Other available assistance',
      name: 'Other available assistance',
      desc: 'Specialized community emergency or disability assistive device support',
      icon: HelpCircle,
      color: 'slate'
    }
  ];

  // Load available programmes for selection
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projs = await db.getProjects();
        setProgrammes(projs);
      } catch (e) {
        console.error(e);
      }
    };
    loadProjects();
  }, []);

  // Step 1: Select type and advance
  const handleSelectType = (typeId) => {
    setFormData(prev => ({ ...prev, category: typeId }));
    setStep(2);
  };

  // Step 2: Validate details before review
  const handleProceedToReview = (e) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      toast.warning('Please explain the reason for requesting assistance.');
      return;
    }
    setStep(3);
  };

  // Step 3: Submit request
  const handleSubmitRequest = async () => {
    if (!formData.confirmed_correct) {
      toast.warning('Please confirm that the information provided is correct.');
      return;
    }

    try {
      setSubmitting(true);
      const newReq = await db.createAssistanceRequest({
        beneficiary_id: beneficiary?.id || 'b7',
        beneficiary_name: beneficiary?.full_name || 'Mary Nyambura',
        beneficiary_code: beneficiary?.beneficiary_code || 'ADRA-SS-000125',
        category: formData.category,
        urgency: formData.urgency,
        household_members: formData.household_members,
        description: formData.reason,
        additional_info: formData.additional_notes,
        preferred_depot: formData.preferred_depot,
        project_id: formData.project_id,
        project_name: formData.project_name
      });

      setSubmittedResult(newReq);
      setStep(4);
      toast.success(`Request submitted! Code: ${newReq.request_code}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit assistance request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-4 sm:p-6 bg-white text-slate-900">
      {/* Top Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {step > 1 && step <= 3 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Cancel
            </button>
          )}

          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {step === 1 ? 'Step 1: Select Type' : step === 2 ? 'Step 2: Complete Form' : step === 3 ? 'Step 3: Review' : 'Submitted'}
          </span>
        </div>

        {/* Progress Stepper */}
        {step <= 3 && (
          <div className="grid grid-cols-3 gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'bg-emerald-600'
                    : s < step
                    ? 'bg-emerald-300'
                    : 'bg-slate-100'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="my-auto py-5">
        {/* STEP 1: Select Assistance Type */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                Select Assistance Needed
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                What type of assistance do you need?
              </h2>
              <p className="text-xs text-slate-500">
                Choose the primary humanitarian category for your household application.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 max-h-[460px] overflow-y-auto pr-1">
              {assistanceTypes.map((item) => {
                const Icon = item.icon;
                const isSelected = formData.category === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectType(item.id)}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-400 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-900 block">
                        {item.name}
                      </span>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Complete Assistance Request Form */}
        {step === 2 && (
          <form onSubmit={handleProceedToReview} className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                  Selected Type:
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  {formData.category}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Complete Assistance Request Form
              </h2>
              <p className="text-xs text-slate-500">
                Provide details for our humanitarian assessment officers.
              </p>
            </div>

            <div className="space-y-3 pt-1 max-h-[440px] overflow-y-auto pr-1">
              {/* Select Programme if applicable */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Programme (If applicable)
                </label>
                <select
                  value={formData.project_id}
                  onChange={(e) => {
                    const selected = programmes.find(p => p.id === e.target.value);
                    setFormData({
                      ...formData,
                      project_id: e.target.value,
                      project_name: selected?.project_name || 'Emergency Relief'
                    });
                  }}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500"
                >
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.project_name} ({p.location})
                    </option>
                  ))}
                  <option value="general">General Emergency Food & Relief Pool</option>
                </select>
              </div>

              {/* Explain Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Explain Reason for Requesting Assistance <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g. Delayed rains destroyed our family maize plot; household currently without food stores for 5 members..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              {/* Household Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Household Members
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={formData.household_members}
                    onChange={(e) => setFormData({ ...formData, household_members: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Urgency Level
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="Critical">Critical (Immediate life/food risk)</option>
                    <option value="High">High (Urgent within 3 days)</option>
                    <option value="Medium">Medium (Within 1-2 weeks)</option>
                    <option value="Low">Low (Standard seasonal support)</option>
                  </select>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Location / Community Settlement
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Lodwar Central Ward, Turkana West"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              {/* Preferred Depot */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preferred Distribution Point
                </label>
                <select
                  value={formData.preferred_depot}
                  onChange={(e) => setFormData({ ...formData, preferred_depot: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="Lodwar Central Humanitarian Depot">Lodwar Central Humanitarian Depot</option>
                  <option value="Kakuma Community Water Point 3">Kakuma Community Water Point 3</option>
                  <option value="Garissa Regional Distribution Center">Garissa Regional Distribution Center</option>
                  <option value="Moyale Sub-County Relief Base">Moyale Sub-County Relief Base</option>
                </select>
              </div>

              {/* Additional Information */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Additional Information (Optional)
                </label>
                <input
                  type="text"
                  value={formData.additional_notes}
                  onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                  placeholder="e.g. Specific infant formula, wheelchair accessibility, etc."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full py-3 text-xs font-bold shadow-md shadow-emerald-600/20 mt-4"
            >
              Review Assistance Request <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>
        )}

        {/* STEP 3: Review Request */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                Step 3: Verification
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Review Request Summary
              </h2>
              <p className="text-xs text-slate-500">
                Please verify all details before official submission to the ADRA system.
              </p>
            </div>

            {/* Summary Review Card */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Assistance Type:</span>
                <span className="font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-md">
                  {formData.category}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Target Programme:</span>
                <span className="font-semibold text-slate-800 text-right max-w-[200px] truncate">
                  {formData.project_name}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Urgency:</span>
                <span className={`font-bold px-2 py-0.5 rounded ${
                  formData.urgency === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {formData.urgency}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Household Size:</span>
                <span className="font-semibold text-slate-800">
                  {formData.household_members} Persons
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Collection Depot:</span>
                <span className="font-semibold text-slate-800 text-right max-w-[190px] truncate">
                  {formData.preferred_depot}
                </span>
              </div>

              <div className="pt-1">
                <span className="text-slate-500 font-medium block mb-1">Reason for Request:</span>
                <p className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 italic">
                  "{formData.reason}"
                </p>
              </div>

              {formData.additional_notes && (
                <div className="pt-1">
                  <span className="text-slate-500 font-medium block mb-1">Additional Notes:</span>
                  <p className="text-slate-700">{formData.additional_notes}</p>
                </div>
              )}
            </div>

            {/* Confirmation Checkbox */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.confirmed_correct}
                  onChange={(e) => setFormData({ ...formData, confirmed_correct: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-800 font-semibold leading-snug">
                  I confirm that the information provided is correct and my household requires this humanitarian assistance.
                </span>
              </label>
            </div>

            <Button
              variant="primary"
              size="md"
              loading={submitting}
              onClick={handleSubmitRequest}
              className="w-full py-3 text-xs font-bold shadow-md shadow-emerald-600/20 mt-4 gap-1.5"
            >
              <Send className="w-4 h-4" /> Submit Assistance Request
            </Button>
          </div>
        )}

        {/* STEP 4: Request Submitted & ADR-REQ-2026-00125 Generated */}
        {step === 4 && submittedResult && (
          <div className="space-y-5 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Assistance Request Submitted!
              </h3>
              <p className="text-xs text-slate-500">
                Your request has entered the ADRA system and has been queued for field review.
              </p>
            </div>

            {/* Request Number Ticket Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border-2 border-dashed border-emerald-400 text-center space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Official Request Tracking Number
              </span>
              <span className="font-mono text-xl font-black text-emerald-800 tracking-wider block">
                {submittedResult.request_code}
              </span>
              <div className="pt-2 flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Status: Pending Review
                </span>
              </div>
            </div>

            {/* Review Explanation */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-900 block">Next Steps:</span>
              <p className="text-[11px] leading-relaxed">
                An authorized ADRA Field Worker will review your vulnerability scoring and verify your ration package. You can track updates in real-time from the requests screen.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => onRequestSubmitted(submittedResult)}
              className="w-full py-3 text-xs font-bold shadow-lg shadow-emerald-600/30 mt-2"
            >
              Go to Requests Tracker
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
