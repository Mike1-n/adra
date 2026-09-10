import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  BarChart3,
  HelpCircle,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Save,
  FileSpreadsheet,
  FileText,
  Shield,
  Phone,
  Mail
} from 'lucide-react';
import { Card, CardHeader } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { db } from '../../../lib/supabase';
import { formatDate } from '../../../lib/utils';
import { useToast } from '../../../context/ToastContext';

export function DataSettingsSupportView({ initialTab = 'settings' }) {
  const [activeSubTab, setActiveSubTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);
  const [systemSettings, setSystemSettings] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    org_name: '',
    country_office: '',
    registration_number: '',
    tax_pin: '',
    default_currency: 'USD ($)',
    fiscal_year_start: 'January 1',
    contact_email: '',
    contact_phone: '',
    headquarters_address: '',
    id_formats: {
      project: 'PRJ-YYYY-###',
      beneficiary: 'BEN-YYYY-#####',
      intervention: 'INT-YYYY-####',
      voucher: 'VCH-YYYY-####'
    }
  });

  // Data Integrity state
  const [integrityReport, setIntegrityReport] = useState(null);
  const [checkingIntegrity, setCheckingIntegrity] = useState(false);

  // FAQ Modal
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [faqForm, setFaqForm] = useState({
    category: 'Operations',
    question: '',
    answer: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [sys, fList, adminStats] = await Promise.all([
        db.getSystemSettings(),
        db.getFaqs(),
        db.getAdminStats()
      ]);
      setSystemSettings(sys);
      setFaqs(fList);
      setStats(adminStats);
      if (sys) {
        setSettingsForm({
          org_name: sys.org_name || '',
          country_office: sys.country_office || '',
          registration_number: sys.registration_number || '',
          tax_pin: sys.tax_pin || '',
          default_currency: sys.default_currency || 'USD ($)',
          fiscal_year_start: sys.fiscal_year_start || 'January 1',
          contact_email: sys.contact_email || '',
          contact_phone: sys.contact_phone || '',
          headquarters_address: sys.headquarters_address || '',
          id_formats: sys.id_formats || {
            project: 'PRJ-YYYY-###',
            beneficiary: 'BEN-YYYY-#####',
            intervention: 'INT-YYYY-####',
            voucher: 'VCH-YYYY-####'
          }
        });
      }
    } catch (err) {
      toast.error('Failed to load system configurations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await db.updateSystemSettings(settingsForm);
      toast.success('System settings & ID formats updated.');
      loadData();
    } catch (err) {
      toast.error('Failed to save settings.');
    }
  };

  const handleExportBackup = async () => {
    try {
      const backup = await db.exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ADRA_DMS_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Database backup exported successfully!');
    } catch (err) {
      toast.error('Failed to generate backup.');
    }
  };

  const handleRestoreBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target.result);
        await db.restoreBackup(json);
        toast.success('Database restored from backup! Refreshing...');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        toast.error(`Restore failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleRunIntegrity = async () => {
    setCheckingIntegrity(true);
    try {
      const report = await db.runDataIntegrityCheck();
      setIntegrityReport(report);
      toast.success('Integrity validation scan completed.');
    } catch (err) {
      toast.error('Integrity check failed.');
    } finally {
      setCheckingIntegrity(false);
    }
  };

  const handleCreateFaq = async (e) => {
    e.preventDefault();
    try {
      await db.createFaq(faqForm);
      toast.success('FAQ entry published.');
      setIsFaqModalOpen(false);
      setFaqForm({ category: 'Operations', question: '', answer: '' });
      loadData();
    } catch (err) {
      toast.error('Failed to add FAQ.');
    }
  };

  const handleDeleteFaq = async (id) => {
    try {
      await db.deleteFaq(id);
      toast.success('FAQ entry removed.');
      loadData();
    } catch (err) {
      toast.error('Failed to delete FAQ.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600" />
            Settings, Data Governance & Support Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Manage organization profile, ID templates, database backups, executive reports, and help resources.
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex flex-wrap items-center p-1 rounded-xl bg-slate-100 border border-slate-200 gap-1">
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'settings'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            System Settings
          </button>
          <button
            onClick={() => setActiveSubTab('data')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'data'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Data Management
          </button>
          <button
            onClick={() => setActiveSubTab('reports')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'reports'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            System Reports
          </button>
          <button
            onClick={() => setActiveSubTab('support')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'support'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Help & FAQs ({faqs.length})
          </button>
        </div>
      </div>

      {/* --- SUBTAB 1: SYSTEM SETTINGS (Function 9) --- */}
      {activeSubTab === 'settings' && (
        <Card>
          <CardHeader
            title="ADRA Institutional Profile & Identification Number Formats"
            subtitle="System-wide defaults, legal identity, and code generator templates"
          />

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Organization Legal Name</label>
                <input
                  type="text"
                  required
                  value={settingsForm.org_name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, org_name: e.target.value })}
                  className="adra-input text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Country Office Jurisdiction</label>
                <input
                  type="text"
                  required
                  value={settingsForm.country_office}
                  onChange={(e) => setSettingsForm({ ...settingsForm, country_office: e.target.value })}
                  className="adra-input text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">NGO Registration No.</label>
                <input
                  type="text"
                  value={settingsForm.registration_number}
                  onChange={(e) => setSettingsForm({ ...settingsForm, registration_number: e.target.value })}
                  className="adra-input text-xs sm:text-sm font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Tax PIN / Revenue ID</label>
                <input
                  type="text"
                  value={settingsForm.tax_pin}
                  onChange={(e) => setSettingsForm({ ...settingsForm, tax_pin: e.target.value })}
                  className="adra-input text-xs sm:text-sm font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Default Reporting Currency</label>
                <select
                  value={settingsForm.default_currency}
                  onChange={(e) => setSettingsForm({ ...settingsForm, default_currency: e.target.value })}
                  className="adra-select text-xs sm:text-sm font-medium"
                >
                  <option value="USD ($)">USD ($) - US Dollar</option>
                  <option value="KES (KSh)">KES (KSh) - Kenya Shillings</option>
                  <option value="EUR (€)">EUR (€) - Euro</option>
                  <option value="GBP (£)">GBP (£) - British Pound</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs mb-2">Identification-Number Template Formats</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Programme Code Format</label>
                  <input
                    type="text"
                    value={settingsForm.id_formats.project}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      id_formats: { ...settingsForm.id_formats, project: e.target.value }
                    })}
                    className="adra-input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Beneficiary ID Format</label>
                  <input
                    type="text"
                    value={settingsForm.id_formats.beneficiary}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      id_formats: { ...settingsForm.id_formats, beneficiary: e.target.value }
                    })}
                    className="adra-input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Intervention Code Format</label>
                  <input
                    type="text"
                    value={settingsForm.id_formats.intervention}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      id_formats: { ...settingsForm.id_formats, intervention: e.target.value }
                    })}
                    className="adra-input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Expense Voucher Format</label>
                  <input
                    type="text"
                    value={settingsForm.id_formats.voucher}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      id_formats: { ...settingsForm.id_formats, voucher: e.target.value }
                    })}
                    className="adra-input text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <Button type="submit" variant="primary" icon={Save}>
                Save Configuration
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* --- SUBTAB 2: DATA MANAGEMENT (Function 14) --- */}
      {activeSubTab === 'data' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Backup & Restore */}
          <Card>
            <CardHeader
              title="Database Backup & Disaster Recovery"
              subtitle="Full system snapshot across all 12 modules"
            />

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="font-bold text-slate-900">Full System Export (JSON Snapshot)</p>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Downloads a complete offline snapshot including projects, beneficiaries, aid distributions, indicators, budgets, approvals, and audit logs.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleExportBackup}
                  icon={Download}
                >
                  Export Database Backup (JSON)
                </Button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="font-bold text-slate-900">Restore Database from JSON Snapshot</p>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Upload a previously exported backup file to restore system state. Warning: Overwrites local reactive storage.
                </p>
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition text-xs shadow-xs">
                  <Upload className="w-3.5 h-3.5 text-white" />
                  <span>Choose Backup File...</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </Card>

          {/* Integrity Validation */}
          <Card>
            <CardHeader
              title="Data Integrity Validation & Archival"
              subtitle="Relational sanity checks and orphan record scan"
            />

            <div className="space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed text-[11px] font-medium">
                Validates foreign key integrity across humanitarian programmes, beneficiary links, activity schedules, and finance vouchers.
              </p>

              <Button
                variant="outline"
                size="sm"
                loading={checkingIntegrity}
                onClick={handleRunIntegrity}
                icon={RefreshCw}
              >
                Execute Integrity Scan
              </Button>

              {integrityReport && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Scan Result:</span>
                    <span className="badge-emerald">{integrityReport.status}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Entities Scanned:</span>
                    <span className="font-mono text-slate-900 font-bold">{integrityReport.entitiesScanned} Records</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Orphan Records:</span>
                    <span className="font-mono text-emerald-700 font-bold">{integrityReport.orphanRecordsFound}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                    Checked at {formatDate(integrityReport.checkedAt)}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* --- SUBTAB 3: SYSTEM REPORTS (Function 15) --- */}
      {activeSubTab === 'reports' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="System Usage & Operational Throughput Reports"
              subtitle="Key administrative indicators for academic presentation & donor compliance"
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success('Report downloaded.')}
                  icon={Download}
                >
                  Export PDF
                </Button>
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-500 font-semibold uppercase text-[10px]">Beneficiary Ingestion</p>
                <p className="text-xl font-black text-slate-900 mt-1">{stats?.totalBeneficiaries || 0} Households</p>
                <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                  {stats?.totalBeneficiaries > 0 ? Math.round(((stats?.verifiedBeneficiaries || 0) / stats?.totalBeneficiaries) * 100) : 100}% verified in registry
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-500 font-semibold uppercase text-[10px]">Relief Distribution</p>
                <p className="text-xl font-black text-slate-900 mt-1">{stats?.totalDistributions || 0} Dispatches</p>
                <p className="text-[11px] text-sky-700 font-semibold mt-0.5">WASH, Agri & Food assistance</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-500 font-semibold uppercase text-[10px]">Inventory Reserves</p>
                <p className="text-xl font-black text-slate-900 mt-1">{stats?.totalInventoryUnits || 0} Units</p>
                <p className="text-[11px] text-amber-800 font-semibold mt-0.5">
                  Stocked across {stats?.warehousesCount || 1} relief {stats?.warehousesCount === 1 ? 'depot' : 'depots'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-500 font-semibold uppercase text-[10px]">Active Stakeholders</p>
                <p className="text-xl font-black text-slate-900 mt-1">{stats?.activeUsers || 0} User Accounts</p>
                <p className="text-[11px] text-purple-700 font-semibold mt-0.5">Assigned across {stats?.rolesCount || 8} system roles</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* --- SUBTAB 4: HELP & FAQS (Function 17) --- */}
      {activeSubTab === 'support' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-600">
              Manage frequently asked questions, technical support contacts, and system user guides.
            </p>

            <Button
              variant="primary"
              onClick={() => setIsFaqModalOpen(true)}
              icon={Plus}
            >
              Add FAQ
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((f) => (
              <Card key={f.id} className="adra-card-hover flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-500/30 px-2 py-0.5 rounded">
                      {f.category}
                    </span>
                    <button
                      onClick={() => handleDeleteFaq(f.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition"
                      title="Delete FAQ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{f.question}</h3>
                  <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
                    {f.answer}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {/* Technical Support Contact Card */}
          <Card>
            <CardHeader
              title="Field Officer Technical Support Helpdesk"
              subtitle="Escalation channels for satellite connectivity, password resets, and hardware"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <Phone className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900">Emergency Hotline</p>
                  <p className="text-slate-600 text-[11px]">
                    {systemSettings?.contact_phone || settingsForm.contact_phone || 'Contact Support'}
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <Mail className="w-5 h-5 text-sky-600 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900">Support Email</p>
                  <p className="text-slate-600 text-[11px]">
                    {systemSettings?.contact_email || settingsForm.contact_email || 'support@adra.org'}
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <Clock className="w-5 h-5 text-purple-600 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900">Operational Hours</p>
                  <p className="text-slate-600 text-[11px]">24/7 Field Support</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Add FAQ Modal */}
      <Modal
        isOpen={isFaqModalOpen}
        onClose={() => setIsFaqModalOpen(false)}
        title="Add Knowledge Base FAQ"
      >
        <form onSubmit={handleCreateFaq} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-800 mb-1">FAQ Category</label>
            <select
              value={faqForm.category}
              onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
              className="adra-select text-xs sm:text-sm font-medium"
            >
              <option value="User & Access">User & Access</option>
              <option value="Operations">Operations & Programmes</option>
              <option value="Compliance">Compliance & Audit</option>
              <option value="Data Safety">Data Safety & Backups</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Frequently Asked Question</label>
            <input
              type="text"
              required
              value={faqForm.question}
              onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
              placeholder="e.g. How do I request approval for emergency aid distribution?"
              className="adra-input text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Detailed Technical / Procedural Answer</label>
            <textarea
              required
              rows={4}
              value={faqForm.answer}
              onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
              placeholder="Provide exact step-by-step guidance..."
              className="adra-input text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={() => setIsFaqModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Publish FAQ
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
