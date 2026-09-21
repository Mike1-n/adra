import React, { useState, useEffect } from 'react';
import {
  X,
  FileCheck,
  MapPin,
  Users,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Camera,
  CheckCircle2,
  Navigation,
  Info
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export function FieldAssessmentFormModal({
  isOpen,
  onClose,
  task = null,
  worker = {},
  onSubmitAssessment
}) {
  const toast = useToast();

  const [formData, setFormData] = useState(() => ({
    beneficiary_name: task?.beneficiary_name || '',
    beneficiary_code: task?.beneficiary_code || '',
    request_code: task?.request_code || '',
    request_id: task?.id || '',
    national_id: task?.national_id || '',
    phone: task?.phone || task?.phone_number || '',
    state: task?.state || worker?.state || '',
    county: task?.county || worker?.county || '',
    payam: task?.payam || worker?.payam || '',
    boma: task?.boma || worker?.boma || '',
    village: task?.village || task?.village_area || '',
    family_size: Number(task?.household_members) || 6,
    children_under_5: 2,
    elderly_count: 1,
    disability_count: 0,
    pregnant_lactating: 1,
    female_headed: true,
    shelter_condition: 'Critical / Makeshift',
    food_security_status: 'Severe Hunger (1 meal or less / day)',
    water_access: 'Unprotected Borehole / River (1km+ walk)',
    income_source: 'None / Casual Labor',
    id_verified: true,
    gps_coordinates: '4.8516° N, 31.5825° E',
    recommended_aid: task?.category || 'Immediate Food Relief Basket & Emergency WASH Kit',
    audit_findings: task ? `In-person assessment conducted for ${task.beneficiary_name}. Household verified in urgent need of assistance.` : '',
    field_officer_notes: ''
  }));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Pre-fill if a task was passed in
  useEffect(() => {
    if (task) {
      setFormData(prev => ({
        ...prev,
        beneficiary_name: task.beneficiary_name || prev.beneficiary_name,
        beneficiary_code: task.beneficiary_code || prev.beneficiary_code,
        request_code: task.request_code || prev.request_code,
        request_id: task.id || prev.request_id,
        national_id: task.national_id || prev.national_id,
        phone: task.phone || task.phone_number || prev.phone,
        state: task.state || worker?.state || prev.state,
        county: task.county || worker?.county || prev.county,
        payam: task.payam || worker?.payam || prev.payam,
        boma: task.boma || worker?.boma || prev.boma,
        village: task.village || task.village_area || prev.village,
        family_size: Number(task.household_members) || prev.family_size,
        audit_findings: `In-person assessment conducted for ${task.beneficiary_name}. Household confirmed in critical need of humanitarian assistance.`
      }));
    }
  }, [task, worker]);

  if (!isOpen) return null;

  // Calculate dynamic vulnerability score (0 to 100)
  const calculateVulnerabilityScore = () => {
    let score = 40; // baseline
    if (formData.female_headed) score += 10;
    if (Number(formData.family_size) >= 6) score += 10;
    if (Number(formData.disability_count) > 0) score += 15;
    if (Number(formData.children_under_5) >= 2) score += 10;
    if (Number(formData.pregnant_lactating) > 0) score += 10;
    if (formData.food_security_status.includes('Severe')) score += 15;
    return Math.min(100, Math.max(0, score));
  };

  const vulnerabilityScore = calculateVulnerabilityScore();

  const handleSimulateGPS = () => {
    setGpsLoading(true);
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        gps_coordinates: `4.${Math.floor(8000 + Math.random() * 900)}° N, 31.${Math.floor(5000 + Math.random() * 900)}° E`
      }));
      setGpsLoading(false);
      toast.success('Live GPS coordinates acquired from mobile sensor');
    }, 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.beneficiary_name.trim()) {
      toast.error('Please enter the beneficiary household name.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitAssessment({
        ...formData,
        vulnerability_score: vulnerabilityScore,
        urgency_level: vulnerabilityScore >= 80 ? 'High' : vulnerabilityScore >= 60 ? 'Medium' : 'Normal',
        field_worker_id: worker.id || 'fw-1',
        field_worker_name: worker.name || 'John Deng',
        supervisor_id: worker.supervisor_id || 'sup-1',
        supervisor_name: worker.supervisor_name || 'Emmanuel Adeyemi'
      });
      toast.success('Field assessment submitted to supervisor review!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-2.5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full h-full max-h-[96%] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* HEADER */}
        <div className="p-4 bg-gradient-to-r from-[#006B56] to-[#004d3d] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shadow-inner">
              <FileCheck className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">On-Ground Vulnerability Audit</h2>
              <p className="text-[11px] text-emerald-100/90">Conduct household verification & score vulnerability</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SCROLLABLE FORM BODY */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* TOP VULNERABILITY SCORE BADGE */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#006B56]" />
                Computed Vulnerability Index
              </span>
              <p className="text-[11px] text-slate-600">Calculated based on household demographics and food insecurity metrics</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-[#006B56] tracking-tight">{vulnerabilityScore}</span>
              <span className="text-xs text-slate-500 font-bold">/100</span>
              <span className={`block text-[10px] font-black uppercase px-2 py-0.5 rounded-md mt-0.5 ${
                vulnerabilityScore >= 80 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'
              }`}>
                {vulnerabilityScore >= 80 ? 'Critical Need' : 'Moderate Need'}
              </span>
            </div>
          </div>

          {/* 1. BENEFICIARY & HOUSEHOLD INFORMATION */}
          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <Users className="w-4 h-4 text-[#006B56]" />
              1. Household Demographics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={formData.beneficiary_name}
                  onChange={(e) => setFormData({ ...formData, beneficiary_name: e.target.value })}
                  placeholder="e.g. Mary Ajak Deng"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#006B56] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">National ID / Refugee ID *</label>
                <input
                  type="text"
                  value={formData.national_id}
                  onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                  placeholder="e.g. SSD-ID-99201"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#006B56] outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+211-9..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#006B56] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Linked Assistance Request</label>
                <input
                  type="text"
                  readOnly
                  value={formData.request_code || 'Unlinked / Ad-hoc Audit'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* 2. LOCATION & GPS */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <MapPin className="w-4 h-4 text-[#006B56]" />
              2. On-Site Location & Coordinates
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">County</label>
                <input
                  type="text"
                  value={formData.county}
                  onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Payam</label>
                <input
                  type="text"
                  value={formData.payam}
                  onChange={(e) => setFormData({ ...formData, payam: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Boma / Village</label>
                <input
                  type="text"
                  value={formData.boma}
                  onChange={(e) => setFormData({ ...formData, boma: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                />
              </div>
            </div>

            {/* GPS capture */}
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <Navigation className="w-4 h-4 text-[#006B56] shrink-0" />
              <input
                type="text"
                readOnly
                value={formData.gps_coordinates}
                className="bg-transparent font-mono text-xs flex-1 text-slate-800 outline-none"
              />
              <button
                type="button"
                onClick={handleSimulateGPS}
                disabled={gpsLoading}
                className="px-2.5 py-1 bg-[#006B56] hover:bg-[#005a48] text-white text-[11px] font-bold rounded-lg shadow-2xs transition shrink-0"
              >
                {gpsLoading ? 'Acquiring...' : 'Capture GPS'}
              </button>
            </div>
          </div>

          {/* 3. VULNERABILITY CRITERIA */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <ShieldCheck className="w-4 h-4 text-[#006B56]" />
              3. Vulnerability Indicators
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Total Household Members</label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={formData.family_size}
                  onChange={(e) => setFormData({ ...formData, family_size: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Children &lt; 5 yrs</label>
                <input
                  type="number"
                  min="0"
                  value={formData.children_under_5}
                  onChange={(e) => setFormData({ ...formData, children_under_5: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Disabled Members</label>
                <input
                  type="number"
                  min="0"
                  value={formData.disability_count}
                  onChange={(e) => setFormData({ ...formData, disability_count: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Food Security Situation</label>
                <select
                  value={formData.food_security_status}
                  onChange={(e) => setFormData({ ...formData, food_security_status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                >
                  <option>Severe Hunger (1 meal or less / day)</option>
                  <option>Moderate Hunger (2 meals / day, lacking protein)</option>
                  <option>Borderline Food Security</option>
                  <option>Adequate Food Security</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Shelter & Living Condition</label>
                <select
                  value={formData.shelter_condition}
                  onChange={(e) => setFormData({ ...formData, shelter_condition: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                >
                  <option>Critical / Makeshift Tukl (Leaking/Damaged)</option>
                  <option>Temporary Thatched Hut</option>
                  <option>Permanent Mud-Brick Compound</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. FIELD FINDINGS & RECOMMENDATIONS */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <FileCheck className="w-4 h-4 text-[#006B56]" />
              4. Field Worker Observations & Recommended Package
            </h3>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Recommended Aid Package</label>
              <input
                type="text"
                value={formData.recommended_aid}
                onChange={(e) => setFormData({ ...formData, recommended_aid: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Field Assessment Notes & Justification *</label>
              <textarea
                rows={3}
                required
                value={formData.audit_findings}
                onChange={(e) => setFormData({ ...formData, audit_findings: e.target.value })}
                placeholder="Document in-person observations, verification details, and reasons for urgent dispatch..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none resize-none"
              />
            </div>
          </div>

          {/* SUBMIT BUTTONS */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#006B56] hover:bg-[#005a48] text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting Report...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Audit to Supervisor
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
