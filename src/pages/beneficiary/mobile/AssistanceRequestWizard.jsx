import React, { useState, useEffect } from 'react';
import {
  HandHeart,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Check,
  Clock,
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
  ChevronDown,
  ChevronUp,
  Send
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { db } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';
import {
  getStates,
  getCounties,
  getPayams
} from '../../../lib/locationData';

export function AssistanceRequestWizard({ beneficiary, onCancel, onRequestSubmitted }) {
  const toast = useToast();

  const [step, setStep] = useState(1); // 1: Select Type, 2: Form Details, 3: Review Request, 4: Confirmed
  const [submitting, setSubmitting] = useState(false);
  const [programmes, setProgrammes] = useState([]);
  const [submittedResult, setSubmittedResult] = useState(null);

  // Form State matching all required fields (uncluttered, beneficiary-centric structure)
  const [formData, setFormData] = useState({
    categories: ['Food'],
    category: 'Food',
    // 1. Household information
    household_members: beneficiary?.household_size || 8,
    // 2. Current situation (supports selecting more than one)
    current_situations: ['Displaced'],
    current_situation: 'Displaced',
    other_situation: '',
    // 3. Location (State, County, Payam dropdowns; Boma & Village typed)
    state: 'Central Equatoria',
    county: 'Juba',
    payam: 'Juba Na Bari',
    boma: '',
    village_area: '',
    // 4. Additional information
    reason: '',
    // Fallbacks for database
    project_id: 'pr1',
    project_name: 'Emergency Relief & Humanitarian Response',
    urgency: 'High',
    preferred_depot: 'Central Humanitarian Depot'
  });

  const [isSituationDropdownOpen, setIsSituationDropdownOpen] = useState(false);
  const situationDropdownRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (situationDropdownRef.current && !situationDropdownRef.current.contains(event.target)) {
        setIsSituationDropdownOpen(false);
      }
    };
    if (isSituationDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isSituationDropdownOpen]);

  const situationOptions = [
    'Displaced',
    'Host community',
    'Returning household',
    'Other'
  ];

  // Exactly the 8 assistance types specified by the user with rich humanitarian color palettes
  const assistanceTypes = [
    {
      id: 'Food',
      name: 'Food',
      desc: 'Supplementary grain ration, pulses, fortified cooking oil, child nutrition (CSB+)',
      icon: Utensils,
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200/80'
    },
    {
      id: 'Water',
      name: 'Water',
      desc: 'Clean emergency drinking water, water purification Aquatabs, 20L jerrycans',
      icon: Droplets,
      bgLight: 'bg-sky-50',
      textColor: 'text-sky-700',
      borderColor: 'border-sky-200/80'
    },
    {
      id: 'Medical assistance',
      name: 'Medical assistance',
      desc: 'Emergency clinic referral, essential medicines, malaria prevention bednets',
      icon: HeartPulse,
      bgLight: 'bg-rose-50',
      textColor: 'text-rose-700',
      borderColor: 'border-rose-200/80'
    },
    {
      id: 'Shelter',
      name: 'Shelter',
      desc: 'Reinforced tarpaulins, family emergency tents, blanket kits, kitchen sets',
      icon: Home,
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200/80'
    },
    {
      id: 'Education',
      name: 'Education',
      desc: 'School supplies, textbooks, uniforms, vocational skills tuition subsidy',
      icon: GraduationCap,
      bgLight: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-200/80'
    },
    {
      id: 'Agricultural support',
      name: 'Agricultural support',
      desc: 'Drought-resistant certified seeds (sorghum/cowpeas), micro-drip kits, tools',
      icon: Sprout,
      bgLight: 'bg-lime-50',
      textColor: 'text-lime-800',
      borderColor: 'border-lime-200/80'
    },
    {
      id: 'Cash/livelihood support',
      name: 'Cash/livelihood support',
      desc: 'Unconditional emergency mobile cash stipend for sustenance and small business',
      icon: Banknote,
      bgLight: 'bg-teal-50',
      textColor: 'text-teal-700',
      borderColor: 'border-teal-200/80'
    },
    {
      id: 'Other available assistance',
      name: 'Other available assistance',
      desc: 'Specialized community emergency or disability assistive device support',
      icon: HelpCircle,
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200/80'
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

  // Cascading Location Selectors narrowed down dynamically by parent selections
  const availableStates = getStates();
  const availableCounties = getCounties(formData.state);
  const availablePayams = getPayams(formData.state, formData.county);

  const handleStateChange = (e) => {
    const newState = e.target.value;
    const counties = getCounties(newState);
    const newCounty = counties[0] || '';
    const payams = getPayams(newState, newCounty);
    const newPayam = payams[0] || '';

    setFormData(prev => ({
      ...prev,
      state: newState,
      county: newCounty,
      payam: newPayam
    }));
  };

  const handleCountyChange = (e) => {
    const newCounty = e.target.value;
    const payams = getPayams(formData.state, newCounty);
    const newPayam = payams[0] || '';

    setFormData(prev => ({
      ...prev,
      county: newCounty,
      payam: newPayam
    }));
  };

  const handlePayamChange = (e) => {
    const newPayam = e.target.value;

    setFormData(prev => ({
      ...prev,
      payam: newPayam
    }));
  };

  // Toggle Current Situation (supports selecting more than one)
  const handleToggleSituation = (sit) => {
    setFormData(prev => {
      const current = prev.current_situations || (prev.current_situation ? [prev.current_situation] : ['Displaced']);
      const exists = current.includes(sit);
      let updated;
      if (exists) {
        updated = current.filter(s => s !== sit);
        if (updated.length === 0) updated = [sit];
      } else {
        updated = [...current, sit];
      }
      return {
        ...prev,
        current_situations: updated,
        current_situation: updated.join(', ')
      };
    });
  };

  // Step 1: Toggle category checkbox (supports more than one assistance type)
  const handleToggleCategory = (typeId) => {
    setFormData(prev => {
      const current = prev.categories || [];
      const exists = current.includes(typeId);
      const updated = exists
        ? current.filter(id => id !== typeId)
        : [...current, typeId];
      return {
        ...prev,
        categories: updated,
        category: updated.join(', ')
      };
    });
  };

  const handleProceedFromStep1 = () => {
    if (!formData.categories || formData.categories.length === 0) {
      toast.warning('Please select at least one assistance type.');
      return;
    }
    setStep(2);
  };

  // Step 2: Validate details before review
  const handleProceedToReview = (e) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      toast.warning('Please tell us about your situation or reason for requesting assistance.');
      return;
    }
    setStep(3);
  };

  // Step 3: Submit request
  const handleSubmitRequest = async () => {
    try {
      setSubmitting(true);
      // Location starts with State as requested
      const locationFull = [
        formData.state,
        formData.county,
        formData.payam,
        formData.boma,
        formData.village_area
      ].filter(Boolean).join(', ') || 'South Sudan';

      const situationsText = (formData.current_situations || [formData.current_situation])
        .map(s => s === 'Other' && formData.other_situation ? `Other (${formData.other_situation})` : s)
        .join(', ');

      const newReq = await db.createAssistanceRequest({
        beneficiary_id: beneficiary?.id || 'b7',
        beneficiary_name: beneficiary?.full_name || 'Mary Nyambura',
        beneficiary_code: beneficiary?.beneficiary_code || 'ADRA-SS-000125',
        category: formData.categories?.join(', ') || formData.category || 'Food Assistance',
        urgency: formData.urgency || 'High',
        household_members: formData.household_members || 1,
        description: formData.reason || `Assistance request for ${situationsText} household`,
        additional_info: `Situation: ${situationsText}.`,
        location: locationFull,
        preferred_depot: `${formData.county || 'Central'} Distribution Depot`,
        project_id: formData.project_id || 'pr1',
        project_name: formData.project_name || 'Emergency Relief & Humanitarian Response'
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

          <span className="text-[10px] font-bold text-[#006B56] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/70 uppercase tracking-wider">
            {step === 1 ? 'Step 1: Select Type' : step === 2 ? 'Step 2: Complete Form' : step === 3 ? 'Step 3: Review' : 'Submitted'}
          </span>
        </div>

        {/* Progress Stepper */}
        {step <= 3 && (
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'bg-[#006B56]'
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
      <div className="my-auto py-4">
        {/* STEP 1: Select Assistance Type */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Eye-Pleasing Header */}
            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                What type of assistance do you need?
              </h2>
            </div>

            {/* Quick Status Bar */}
            <div className="flex items-center justify-between pt-0.5 px-0.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Available Relief Packages ({assistanceTypes.length})
              </span>
              <span
                className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full transition-all ${
                  formData.categories?.length > 0
                    ? 'bg-[#006B56] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {formData.categories?.length || 0} selected
              </span>
            </div>

            {/* Eye-Pleasing Category Cards */}
            <div className="space-y-2.5 pt-1">
              {assistanceTypes.map((item) => {
                const Icon = item.icon;
                const isSelected = formData.categories?.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleCategory(item.id)}
                    className={`w-full group p-3.5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/40 border-[#006B56] shadow-sm ring-2 ring-[#006B56]/15'
                        : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:bg-slate-50/70 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Icon with harmonious category palette */}
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                          isSelected
                            ? 'bg-[#006B56] text-white shadow-sm shadow-[#006B56]/30'
                            : `${item.bgLight} ${item.textColor} border ${item.borderColor} group-hover:scale-105`
                        }`}
                      >
                        <Icon className="w-5 h-5 stroke-[2.2]" />
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-0.5 min-w-0">
                        <span
                          className={`text-xs block leading-tight transition-colors ${
                            isSelected
                              ? 'font-black text-[#006B56] text-sm'
                              : 'font-bold text-slate-900 group-hover:text-[#006B56]'
                          }`}
                        >
                          {item.name}
                        </span>
                        <p className="text-[11px] leading-snug text-slate-500">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    {/* Checkbox Indicator */}
                    <div className="shrink-0 pl-1">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 ${
                          isSelected
                            ? 'bg-[#006B56] text-white shadow-xs'
                            : 'border-2 border-slate-300 bg-white group-hover:border-slate-400'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Continue Action Button */}
            <div className="sticky bottom-0 pt-3 pb-1 bg-gradient-to-t from-white via-white/95 to-transparent z-10">
              <button
                type="button"
                onClick={handleProceedFromStep1}
                disabled={!formData.categories || formData.categories.length === 0}
                className={`w-full py-3.5 px-5 rounded-2xl font-extrabold text-sm flex items-center justify-between shadow-md transition-all duration-200 active:scale-[0.99] ${
                  formData.categories?.length > 0
                    ? 'bg-[#006B56] hover:bg-[#005544] text-white shadow-emerald-700/25 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="tracking-wide">
                    {!formData.categories || formData.categories.length === 0
                      ? 'Select at least 1 assistance type'
                      : formData.categories.length === 1
                      ? `Continue with ${formData.categories[0]}`
                      : `Continue with ${formData.categories.length} Selected Types`}
                  </span>
                  {formData.categories?.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-white/25 text-white text-[10px] font-black">
                      {formData.categories.length}
                    </span>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Complete Assistance Request Form */}
        {step === 2 && (
          <form onSubmit={handleProceedToReview} className="space-y-4 animate-in fade-in duration-200">
            {/* Header with Selected Category Badges */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[#006B56] text-xs font-bold shadow-2xs">
                <CheckCircle className="w-3.5 h-3.5 text-[#006B56]" />
                <span>Selected Assistance:</span>
                <span className="font-extrabold text-slate-900">
                  {(formData.categories || [formData.category]).join(', ')}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Complete the assistance request form
              </h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Please provide your household size and settlement location so our field team can verify and allocate relief.
              </p>
            </div>

            {/* Single Unified Card containing all sections and the Review Assistance Request button */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 space-y-5 shadow-xs">
              {/* 1. Household Information */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                  People in household
                </label>
                <div className="relative w-24">
                  <input
                    type="number"
                    min="1"
                    max="35"
                    value={formData.household_members}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setFormData({ ...formData, household_members: '' });
                      } else {
                        const num = Number(val);
                        setFormData({ ...formData, household_members: Math.max(1, Math.min(35, num)) });
                      }
                    }}
                    onBlur={() => {
                      if (!formData.household_members || formData.household_members < 1) {
                        setFormData({ ...formData, household_members: 1 });
                      }
                    }}
                    className="w-full pl-3 pr-7 py-1.5 text-sm font-black rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:border-[#006B56] focus:ring-2 focus:ring-[#006B56]/15 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    required
                  />
                  {/* Compact High-Contrast Up and Down arrows on the right end */}
                  <div className="absolute right-0.5 top-0.5 bottom-0.5 flex flex-col w-6 bg-[#006B56] divide-y divide-emerald-700/60 overflow-hidden rounded-r-md shadow-2xs">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          household_members: Math.min(35, (Number(prev.household_members) || 1) + 1)
                        }))
                      }
                      className="flex-1 flex items-center justify-center hover:bg-[#005544] active:bg-[#004235] text-white transition cursor-pointer"
                      aria-label="Increase household members"
                    >
                      <ChevronUp className="w-3 h-3 stroke-[2.5] text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          household_members: Math.max(1, (Number(prev.household_members) || 1) - 1)
                        }))
                      }
                      className="flex-1 flex items-center justify-center hover:bg-[#005544] active:bg-[#004235] text-white transition cursor-pointer"
                      aria-label="Decrease household members"
                    >
                      <ChevronDown className="w-3 h-3 stroke-[2.5] text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Current Situation (Dropdown with Multi-Select) */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                  Current Situation
                </label>

                <div ref={situationDropdownRef} className="relative">
                  {/* Dropdown Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setIsSituationDropdownOpen(!isSituationDropdownOpen)}
                    className="w-full min-h-[46px] px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-50 text-slate-900 flex items-center justify-between gap-2 text-left focus:outline-hidden focus:border-[#006B56] focus:bg-white focus:ring-2 focus:ring-[#006B56]/15 transition cursor-pointer"
                  >
                    <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                      {formData.current_situations && formData.current_situations.length > 0 ? (
                        formData.current_situations.map((sit) => (
                          <span
                            key={sit}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#006B56] text-white text-[11px] font-bold shadow-2xs"
                          >
                            {sit === 'Other' && formData.other_situation ? `Other: ${formData.other_situation}` : sit}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 font-normal">Select current situation...</span>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                        isSituationDropdownOpen ? 'rotate-180 text-[#006B56]' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Options Menu */}
                  {isSituationDropdownOpen && (
                    <div className="mt-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl space-y-1 animate-in fade-in zoom-in-95 duration-100 z-30">
                      {situationOptions.map((sit) => {
                        const isSelected = (formData.current_situations || [formData.current_situation]).includes(sit);
                        return (
                          <button
                            key={sit}
                            type="button"
                            onClick={() => handleToggleSituation(sit)}
                            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 transition text-left cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-50 text-[#006B56] font-black'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate">{sit}</span>
                            <div
                              className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition ${
                                isSelected ? 'bg-[#006B56] text-white shadow-2xs' : 'border border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {(formData.current_situations || [formData.current_situation]).includes('Other') && (
                  <input
                    type="text"
                    value={formData.other_situation}
                    onChange={(e) => setFormData({ ...formData, other_situation: e.target.value })}
                    placeholder="Please specify other situation..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-hidden focus:border-[#006B56] focus:bg-white focus:ring-2 focus:ring-[#006B56]/15 mt-2 transition"
                    required
                  />
                )}
              </div>

              {/* 3. Location (Arranged downwards: State -> County -> Payam -> Boma -> Village) */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                  Location
                </label>

                <div className="space-y-3">
                  {/* State */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">State</label>
                    <div className="relative">
                      <select
                        value={formData.state}
                        onChange={handleStateChange}
                        className="w-full appearance-none px-3.5 py-2.5 pr-8 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 text-slate-900 focus:outline-hidden focus:border-[#006B56] focus:bg-white focus:ring-2 focus:ring-[#006B56]/15 transition cursor-pointer"
                      >
                        {availableStates.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* County */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">County</label>
                    <div className="relative">
                      <select
                        value={formData.county}
                        onChange={handleCountyChange}
                        className="w-full appearance-none px-3.5 py-2.5 pr-8 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 text-slate-900 focus:outline-hidden focus:border-[#006B56] focus:bg-white focus:ring-2 focus:ring-[#006B56]/15 transition cursor-pointer"
                      >
                        {availableCounties.map((cty) => (
                          <option key={cty} value={cty}>
                            {cty}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Payam */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Payam</label>
                    <div className="relative">
                      <select
                        value={formData.payam}
                        onChange={handlePayamChange}
                        className="w-full appearance-none px-3.5 py-2.5 pr-8 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 text-slate-900 focus:outline-hidden focus:border-[#006B56] focus:bg-white focus:ring-2 focus:ring-[#006B56]/15 transition cursor-pointer"
                      >
                        {availablePayams.map((pym) => (
                          <option key={pym} value={pym}>
                            {pym}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Boma */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Boma</label>
                    <input
                      type="text"
                      value={formData.boma}
                      onChange={(e) => setFormData({ ...formData, boma: e.target.value })}
                      placeholder="Type your boma..."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#006B56] focus:bg-white focus:ring-2 focus:ring-[#006B56]/15 transition"
                      required
                    />
                  </div>

                  {/* Village / Area */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Village / Area</label>
                    <input
                      type="text"
                      value={formData.village_area}
                      onChange={(e) => setFormData({ ...formData, village_area: e.target.value })}
                      placeholder="e.g. Hai Malakal South, Block 4, Compound 12..."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#006B56] focus:bg-white focus:ring-2 focus:ring-[#006B56]/15 transition"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 4. Additional Information */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                  Additional Information
                </label>
                <textarea
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g. Food insecurity due to disrupted supply; lack of clean water access..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#006B56] focus:bg-white focus:ring-2 focus:ring-[#006B56]/15 transition"
                  required
                />
              </div>

              {/* Review Assistance Request button inside the card */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#006B56] hover:bg-[#005745] text-white font-bold text-xs flex items-center justify-between shadow-xs cursor-pointer transition-all duration-200 active:scale-[0.99] group"
                >
                  <span className="tracking-wide">Review Assistance Request</span>
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </div>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* STEP 3: Review the request */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#006B56] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/70 uppercase tracking-wider">
                Step 3: Review the request
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight pt-1">
                Review Assistance Request
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Verify your information before submitting to the field response team.
              </p>
            </div>

            {/* Clean Review Summary Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-xs text-xs">
              {/* Type */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Type:</span>
                <div className="flex flex-wrap gap-1 justify-end max-w-[220px]">
                  {(formData.categories || [formData.category]).map(c => (
                    <span key={c} className="font-extrabold text-white bg-[#006B56] px-2.5 py-0.5 rounded-md text-[11px] shadow-2xs">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Household */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Household:</span>
                <span className="font-extrabold text-slate-900">
                  {formData.household_members}
                </span>
              </div>

              {/* Current Situation */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Current situation:</span>
                <div className="flex flex-wrap gap-1 justify-end max-w-[220px]">
                  {(formData.current_situations || [formData.current_situation]).map(sit => (
                    <span key={sit} className="font-extrabold text-white bg-[#006B56] px-2.5 py-0.5 rounded-md text-[10px] shadow-2xs">
                      {sit === 'Other' && formData.other_situation ? `Other: ${formData.other_situation}` : sit}
                    </span>
                  ))}
                </div>
              </div>

              {/* Location (Starts with State) */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Location:</span>
                <span className="font-extrabold text-slate-900 text-right max-w-[220px]">
                  {[formData.state, formData.county, formData.payam, formData.boma, formData.village_area].filter(Boolean).join(', ') || 'South Sudan'}
                </span>
              </div>

              {/* Reason */}
              <div className="pt-1">
                <span className="text-slate-500 font-bold block mb-1">Reason:</span>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium text-xs leading-relaxed">
                  {formData.reason || 'No additional reason specified.'}
                </p>
              </div>
            </div>

            {/* Action Buttons: [Edit] and [Submit Request] (Reduced, compact size) */}
            <div className="flex items-center gap-2.5 pt-2 max-w-sm mx-auto w-full">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-2 px-3.5 rounded-xl border border-[#006B56] bg-white hover:bg-emerald-50 text-[#006B56] font-bold text-xs text-center cursor-pointer transition active:scale-[0.98]"
              >
                Edit
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitRequest}
                className="flex-1 py-2 px-3.5 rounded-xl bg-[#006B56] hover:bg-[#005544] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Request</span>
                  </>
                )}
              </button>
            </div>
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
