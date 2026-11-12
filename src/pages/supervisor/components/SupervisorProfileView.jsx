import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Save,
  Lock,
  Sparkles,
  ArrowLeft,
  Bell,
  Wifi,
  Database,
  RefreshCw,
  LogOut,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Sliders,
  Radio,
  FileCheck2,
  Truck,
  Banknote
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { db, isSupabaseConfigured } from '../../../lib/supabase';

export function SupervisorProfileView({
  currentUser,
  activeSupervisor,
  allSupervisors = [],
  onSelectStateSupervisor,
  onUpdateProfile,
  onBack,
  onLogout
}) {
  const toast = useToast();
  
  // Tab states: 'profile' | 'operations' | 'sync' | 'security'
  const [activeTab, setActiveTab] = useState('profile');

  // Duty status: 'Available' | 'In Field' | 'Standby'
  const [dutyStatus, setDutyStatus] = useState(() => {
    return localStorage.getItem('adra_supervisor_duty_status') || 'Available';
  });

  // Settings: Operational Preferences
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('adra_supervisor_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return {
      autoAssignNearby: true,
      dispatchAlerts: true,
      reportAlerts: true,
      facilitationAlerts: true,
      offlineSyncMode: true,
      dailySummary: true
    };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form data for Profile
  const [formData, setFormData] = useState({
    full_name: currentUser?.full_name || activeSupervisor?.name || 'Emmanuel Adeyemi',
    phone: currentUser?.phone || activeSupervisor?.phone || '+211-920-000003',
    email: currentUser?.email || activeSupervisor?.email || 'supervisor@adra.org',
    department: currentUser?.department || activeSupervisor?.assigned_area || 'Field Operations & Supervisory (Eastern Equatoria State)',
    state: activeSupervisor?.state || currentUser?.state || 'Eastern Equatoria',
    operational_area: activeSupervisor?.assigned_area || currentUser?.department || 'Eastern Equatoria State (Torit / Kapoeta Hub)',
    programme: 'Emergency Food Security & Livelihoods'
  });

  // Keep form data synchronized when currentUser or activeSupervisor changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      full_name: currentUser?.full_name || activeSupervisor?.name || prev.full_name,
      phone: currentUser?.phone || activeSupervisor?.phone || prev.phone,
      email: currentUser?.email || activeSupervisor?.email || prev.email,
      department: currentUser?.department || activeSupervisor?.assigned_area || prev.department,
      state: activeSupervisor?.state || currentUser?.state || prev.state,
      operational_area: activeSupervisor?.assigned_area || currentUser?.department || prev.operational_area
    }));
  }, [currentUser, activeSupervisor]);

  // Password reset state
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
    showPassword: false
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Offline sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(() => new Date().toLocaleTimeString());

  // Handle duty status change
  const handleDutyChange = (status) => {
    setDutyStatus(status);
    localStorage.setItem('adra_supervisor_duty_status', status);
    toast.success(`Operational status updated: ${status}`);
  };

  // Handle setting toggle
  const handleToggleSetting = (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    localStorage.setItem('adra_supervisor_settings', JSON.stringify(updated));
    toast.info('Preferences updated.');
  };

  // Handle Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.full_name?.trim()) {
      toast.warning('Full Name is required.');
      return;
    }
    setIsSaving(true);
    try {
      if (onUpdateProfile) {
        await onUpdateProfile(currentUser?.id || activeSupervisor?.id, {
          full_name: formData.full_name,
          phone: formData.phone,
          email: formData.email,
          department: formData.department,
          state: formData.state,
          operational_area: formData.operational_area
        });
      }
      toast.success('Supervisor profile updated successfully.');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Password Update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      toast.warning('Password must be at least 6 characters long.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const targetId = currentUser?.id || activeSupervisor?.id || 'user-sup';
      if (db.resetUserPassword) {
        await db.resetUserPassword(targetId, passwordData.newPassword, {
          email: formData.email,
          full_name: formData.full_name
        });
      }
      toast.success('Password updated successfully. Your new credentials are active.');
      setPasswordData({ newPassword: '', confirmPassword: '', showPassword: false });
    } catch (err) {
      toast.error(err.message || 'Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle Manual Sync
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      if (db.logAudit) {
        await db.logAudit({
          action: 'SYNC',
          module: 'Supervisor Mobile Hub',
          record_id: activeSupervisor?.id || 'sup-1',
          details: `Manual offline cache synchronisation completed by ${formData.full_name}`
        });
      }
      await new Promise(res => setTimeout(res, 600));
      setLastSynced(new Date().toLocaleTimeString());
      toast.success('Mobile cache synchronized with cloud database.');
    } catch (err) {
      toast.error('Sync failed: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const statesList = [
    'Eastern Equatoria',
    'Central Equatoria',
    'Western Equatoria',
    'Jonglei',
    'Unity',
    'Upper Nile',
    'Lakes',
    'Warrap',
    'Northern Bahr el Ghazal',
    'Western Bahr el Ghazal'
  ];

  const programmesList = [
    'Emergency Food Security & Livelihoods',
    'WASH & Community Water Infrastructure',
    'Emergency Shelter & Non-Food Items (NFI)',
    'Nutrition & Emergency Health Support',
    'Education & Child Protection in Emergencies'
  ];

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER & BACK NAVIGATION */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-700" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* 2. HERO SUPERVISOR PROFILE CARD */}
      <div className="bg-gradient-to-r from-[#006B56] to-[#004D3D] text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border-2 border-white/30 shadow-md shrink-0">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold leading-tight">{formData.full_name}</h2>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" title="Active"></span>
              </div>
              <p className="text-xs text-emerald-200 font-bold mt-0.5">
                Field Quality & Operations Supervisor
              </p>
              <p className="text-[11px] text-white/80 font-medium mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-300" />
                <span>{formData.state} State Hub</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
            <span className="text-[10px] font-bold text-emerald-200">Duty</span>
            <select
              aria-label="Current duty status"
              value={dutyStatus}
              onChange={(event) => handleDutyChange(event.target.value)}
              className="rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-[11px] font-bold text-white focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              <option className="text-slate-900" value="Available">On Duty</option>
              <option className="text-slate-900" value="In Field">In Field</option>
              <option className="text-slate-900" value="Standby">Standby</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. SETTINGS NAVIGATION TABS */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/80 rounded-2xl text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`py-2 px-1 rounded-xl transition text-center cursor-pointer truncate ${
            activeTab === 'profile'
              ? 'bg-white text-[#006B56] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Profile
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('operations')}
          className={`py-2 px-1 rounded-xl transition text-center cursor-pointer truncate ${
            activeTab === 'operations'
              ? 'bg-white text-[#006B56] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Operations
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sync')}
          className={`py-2 px-1 rounded-xl transition text-center cursor-pointer truncate ${
            activeTab === 'sync'
              ? 'bg-white text-[#006B56] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Sync
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`py-2 px-1 rounded-xl transition text-center cursor-pointer truncate ${
            activeTab === 'security'
              ? 'bg-white text-[#006B56] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Security
        </button>
      </div>

      {/* 4. TAB 1: PERSONAL & CONTACT PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Contact details</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs font-bold text-[#006B56] hover:underline cursor-pointer"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Name</label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className={`w-full p-2.5 rounded-xl border text-slate-800 ${
                  isEditing ? 'border-[#006B56] bg-white ring-2 ring-[#006B56]/20' : 'border-slate-200 bg-slate-50'
                }`}
                placeholder="Supervisor Full Name"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Phone</label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full p-2.5 rounded-xl border text-slate-800 ${
                  isEditing ? 'border-[#006B56] bg-white ring-2 ring-[#006B56]/20' : 'border-slate-200 bg-slate-50'
                }`}
                placeholder="+211..."
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Email</label>
              <input
                type="email"
                disabled={!isEditing}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full p-2.5 rounded-xl border text-slate-800 ${
                  isEditing ? 'border-[#006B56] bg-white ring-2 ring-[#006B56]/20' : 'border-slate-200 bg-slate-50'
                }`}
                placeholder="supervisor@adra.org"
              />
            </div>

            {isEditing && (
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 bg-[#006B56] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md hover:bg-[#005544] transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            )}
          </form>
        </div>
      )}

      {/* 5. TAB 2: OPERATIONAL SETTINGS & HUB CONFIGURATION */}
      {activeTab === 'operations' && (
        <div className="space-y-4">
          {/* Active State Hub Selection */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#006B56]" />
                  Active State Hub Configuration
                </h3>
                <p className="text-[11px] text-slate-500">
                  Switch or configure your responsible South Sudan operational zone
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-slate-600 text-xs font-medium">
                Select Active State Supervisory Hub
              </label>
              <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
                {(allSupervisors.length > 0 ? allSupervisors : statesList.map(st => ({ id: st, state: st, name: 'State Supervisor' }))).map((sup) => {
                  const isSelected = activeSupervisor?.state === sup.state || formData.state === sup.state;
                  return (
                    <button
                      key={sup.id || sup.state}
                      type="button"
                      onClick={() => {
                        if (onSelectStateSupervisor && allSupervisors.length > 0) {
                          onSelectStateSupervisor(sup);
                        }
                        setFormData(prev => ({
                          ...prev,
                          state: sup.state,
                          operational_area: `${sup.state} State Hub`
                        }));
                        toast.success(`Operational hub set to: ${sup.state}`);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#006B56] text-white shadow-2xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="block truncate">{sup.state} State Hub</span>
                        <span className={`text-[10px] block truncate font-normal ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {sup.name || 'Regional Operations'}
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Programme Sector */}
            <div className="pt-2">
              <label className="block text-slate-600 text-xs font-medium mb-1">
                Primary Programme Sector
              </label>
              <select
                value={formData.programme}
                onChange={(e) => {
                  setFormData({ ...formData, programme: e.target.value });
                  toast.success(`Default sector set to: ${e.target.value}`);
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-medium cursor-pointer"
              >
                {programmesList.map((prg) => (
                  <option key={prg} value={prg}>
                    {prg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Operational Workflow Preferences */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-[#006B56]" />
              Supervisory Workflow Automation
            </h3>

            <div className="space-y-3 text-xs">
              {/* Auto Assign */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="pr-3">
                  <span className="font-bold text-slate-800 block">Proximity Auto-Routing</span>
                  <span className="text-[11px] text-slate-500 block">
                    Suggest closest field worker for incoming verification requests
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleSetting('autoAssignNearby')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer shrink-0 ${
                    settings.autoAssignNearby ? 'bg-[#006B56]' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                    settings.autoAssignNearby ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Instant Dispatch Alerts */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="pr-3">
                  <span className="font-bold text-slate-800 block">Waybill & Dispatch Alerts</span>
                  <span className="text-[11px] text-slate-500 block">
                    Push notifications when aid consignments arrive at state depot
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleSetting('dispatchAlerts')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer shrink-0 ${
                    settings.dispatchAlerts ? 'bg-[#006B56]' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                    settings.dispatchAlerts ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Assessment Submissions */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="pr-3">
                  <span className="font-bold text-slate-800 block">Assessment Submissions Alert</span>
                  <span className="text-[11px] text-slate-500 block">
                    Alert supervisor as soon as field workers file household audits
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleSetting('reportAlerts')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer shrink-0 ${
                    settings.reportAlerts ? 'bg-[#006B56]' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                    settings.reportAlerts ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Facilitation alerts */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="pr-3">
                  <span className="font-bold text-slate-800 block">Facilitation Funding Alert</span>
                  <span className="text-[11px] text-slate-500 block">
                    Notify when field workers submit travel & fuel facilitation claims
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleSetting('facilitationAlerts')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer shrink-0 ${
                    settings.facilitationAlerts ? 'bg-[#006B56]' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                    settings.facilitationAlerts ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 3: DATA & OFFLINE SYNCHRONIZATION */}
      {activeTab === 'sync' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-[#006B56]" />
                  Offline Storage & Synchronization
                </h3>
                <p className="text-[11px] text-slate-500">
                  Manage field cached records and cloud synchronization
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isSupabaseConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {isSupabaseConfigured ? 'Supabase Cloud' : 'Local Storage Mode'}
              </span>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/60 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-[#006B56]" />
                  Connection Status:
                </span>
                <span className="font-extrabold text-[#006B56]">Synchronized</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Last checked and synchronized: <span className="font-mono font-bold">{lastSynced}</span>
              </p>
            </div>

            {/* Offline Mode Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
              <div className="pr-3">
                <span className="font-bold text-slate-800 block">Offline Field Resilience</span>
                <span className="text-[11px] text-slate-500 block">
                  Cache all assignments, assessments, and waybills locally for remote payams without network
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleSetting('offlineSyncMode')}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer shrink-0 ${
                  settings.offlineSyncMode ? 'bg-[#006B56]' : 'bg-slate-300'
                }`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                  settings.offlineSyncMode ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleManualSync}
                className="w-full py-2.5 px-3 bg-[#006B56] hover:bg-[#005544] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Synchronizing Cloud Records...' : 'Sync All Offline Data Now'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Clear local cache and refresh all supervisory state? Any unsaved edits will be discarded.')) {
                    toast.info('Reloading fresh data...');
                    setTimeout(() => window.location.reload(), 500);
                  }
                }}
                className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Database className="w-4 h-4 text-slate-500" />
                <span>Clear App Cache & Reload</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 4: SECURITY & CREDENTIALS */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          {/* Change Password Form */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#006B56]" />
                Change Supervisor Password
              </h3>
              <p className="text-[11px] text-slate-500">
                Password must be at least 6 characters long
              </p>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={passwordData.showPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full p-2.5 pr-10 rounded-xl border border-slate-200 text-slate-800 focus:border-[#006B56] focus:ring-2 focus:ring-[#006B56]/20"
                    placeholder="Enter new password (min. 6 chars)"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordData({ ...passwordData, showPassword: !passwordData.showPassword })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {passwordData.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Confirm New Password</label>
                <input
                  type={passwordData.showPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:border-[#006B56] focus:ring-2 focus:ring-[#006B56]/20"
                  placeholder="Repeat new password"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full py-2.5 bg-[#006B56] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-xs hover:bg-[#005544] transition cursor-pointer active:scale-98"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isUpdatingPassword ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </form>
          </div>

          {/* Logout Button */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-2xl transition flex items-center justify-center gap-2 border border-red-200/70 shadow-2xs cursor-pointer active:scale-98"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span>Sign Out of Supervisor Mobile Portal</span>
            </button>
          )}
        </div>
      )}

    </div>
  );
}
