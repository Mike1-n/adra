import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Trash2,
  TrendingUp,
  Receipt,
  Wallet,
  PieChart as PieIcon,
  Download,
  FileCheck2,
  Layers
} from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { SearchFilter } from '../components/common/SearchFilter';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { db } from '../lib/supabase';
import { formatCurrency, formatDate, generateCode, calculatePercentage } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FinanceSupplierPaymentsView } from './finance/components/FinanceSupplierPaymentsView';

const BUDGET_CATEGORIES = [
  'Direct Activity Costs',
  'Personnel',
  'Equipment & Supplies',
  'Training & Workshops',
  'Travel & Transport',
  'Administrative / Overhead'
];

export function FinancePage() {
  const { hasPermission, currentUser } = useAuth();
  const toast = useToast();
  const canEdit = hasPermission(['Administrator', 'Finance Officer']);

  const [budgets, setBudgets] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [projects, setProjects] = useState([]);
  const [fieldFundingRequests, setFieldFundingRequests] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('expenditures'); // 'expenditures' | 'budgets' | 'field_funding' | 'supplier_payments'
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');

  // Modals
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [isDeleteExpOpen, setIsDeleteExpOpen] = useState(false);
  const [selectedExp, setSelectedExp] = useState(null);

  // Field Requisition Disbursement Modal State
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [disburseForm, setDisburseForm] = useState({
    voucher_reference: '',
    transaction_ref: '',
    payment_method: 'm-Gurush Mobile Money',
    notes: '',
  });

  const [budgetForm, setBudgetForm] = useState({
    project_id: '',
    budget_category: BUDGET_CATEGORIES[0],
    allocated_amount: '',
    financial_year: 'FY 2025',
  });

  const [expForm, setExpForm] = useState({
    expenditure_code: '',
    project_id: '',
    category: BUDGET_CATEGORIES[0],
    description: '',
    amount: '',
    expenditure_date: '',
    receipt_url: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [bgList, expList, projList, fundingList, poList, supList] = await Promise.all([
        db.getBudgets(),
        db.getExpenditures(),
        db.getProjects(),
        db.getFieldFundingRequests ? db.getFieldFundingRequests() : [],
        db.getPurchaseOrders ? db.getPurchaseOrders() : [],
        db.getSuppliers ? db.getSuppliers() : []
      ]);
      setBudgets(bgList || []);
      setExpenditures(expList || []);
      setProjects(projList || []);
      setFieldFundingRequests(fundingList || []);
      setPurchaseOrders(poList || []);
      setSuppliers(supList || []);
    } catch (err) {
      toast.error('Failed to load finance ledger.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaySupplier = async (poId, paymentData) => {
    const res = await db.paySupplierPO(poId, paymentData);
    await loadData();
    return res;
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddBudget = () => {
    setBudgetForm({
      project_id: projects[0]?.id || '',
      budget_category: BUDGET_CATEGORIES[0],
      allocated_amount: '',
      financial_year: 'FY 2025',
    });
    setIsBudgetModalOpen(true);
  };

  const handleOpenAddExp = () => {
    setExpForm({
      expenditure_code: generateCode('EXP'),
      project_id: projects[0]?.id || '',
      category: BUDGET_CATEGORIES[0],
      description: '',
      amount: '',
      expenditure_date: new Date().toISOString().split('T')[0],
      receipt_url: 'payment_voucher.pdf',
    });
    setIsExpModalOpen(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!budgetForm.project_id || !budgetForm.allocated_amount) {
      toast.warning('Please enter all budget details.');
      return;
    }

    try {
      const selectedProj = projects.find(p => p.id === budgetForm.project_id);
      await db.createBudget({
        ...budgetForm,
        allocated_amount: Number(budgetForm.allocated_amount),
        project_name: selectedProj?.project_name || 'Project',
      });
      toast.success('Budget allocation saved.');
      setIsBudgetModalOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to record budget.');
    }
  };

  const handleSaveExp = async (e) => {
    e.preventDefault();
    if (!expForm.project_id || !expForm.amount || !expForm.description) {
      toast.warning('Please enter all required expense details.');
      return;
    }

    try {
      const selectedProj = projects.find(p => p.id === expForm.project_id);
      await db.createExpenditure({
        ...expForm,
        amount: Number(expForm.amount),
        project_name: selectedProj?.project_name || 'Project',
        recorded_by: currentUser?.full_name || 'Finance Officer',
      });
      toast.success('Expenditure logged successfully.');
      setIsExpModalOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to record expense.');
    }
  };

  const handleDeleteExp = async () => {
    if (!selectedExp) return;
    try {
      await db.deleteExpenditure(selectedExp.id);
      toast.success('Expenditure record removed.');
      loadData();
    } catch (err) {
      toast.error('Failed to delete expenditure.');
    }
  };

  const handleOpenDisburse = (req) => {
    setSelectedRequisition(req);
    const rndNum = Math.floor(1000 + Math.random() * 9000);
    const txnNum = Math.floor(1000000 + Math.random() * 9000000);
    setDisburseForm({
      voucher_reference: `PV-2026-${rndNum}`,
      transaction_ref: `TXN-MG-${txnNum}`,
      payment_method: req.preferred_payout || 'm-Gurush Mobile Money',
      notes: `Disbursement authorized by Programme Manager. Disbursed via ${req.preferred_payout || 'm-Gurush'} to ${req.field_worker_name}.`,
    });
    setIsDisburseModalOpen(true);
  };

  const handleConfirmDisburse = async (e) => {
    e.preventDefault();
    if (!selectedRequisition) return;
    try {
      const financeOfficer = currentUser?.full_name || currentUser?.name || 'Mark Ladu (Finance Officer)';
      await db.disburseFieldFundingByFinance(
        selectedRequisition.id,
        financeOfficer,
        disburseForm
      );
      toast.success(`Disbursed ${selectedRequisition.currency || 'SSP'} ${Number(selectedRequisition.amount).toLocaleString()} to ${selectedRequisition.field_worker_name}. Payment Voucher ${disburseForm.voucher_reference} generated and logged in expenditures.`);
      setIsDisburseModalOpen(false);
      setSelectedRequisition(null);
      loadData();
    } catch (err) {
      console.error('Disbursement failed:', err);
      toast.error('Failed to execute disbursement. Please try again.');
    }
  };

  // Calculations
  const totalAllocated = budgets.reduce((sum, b) => sum + Number(b.allocated_amount || 0), 0);
  const totalSpent = expenditures.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const remainingBalance = totalAllocated - totalSpent;
  const utilizationPct = calculatePercentage(totalSpent, totalAllocated);

  const filteredExpenditures = expenditures.filter(e => {
    const matchesSearch =
      e.description?.toLowerCase().includes(search.toLowerCase()) ||
      e.expenditure_code?.toLowerCase().includes(search.toLowerCase()) ||
      e.category?.toLowerCase().includes(search.toLowerCase());
    const matchesProj = projectFilter === 'ALL' || e.project_id === projectFilter;
    return matchesSearch && matchesProj;
  });

  const filteredBudgets = budgets.filter(b => {
    const matchesSearch = b.budget_category?.toLowerCase().includes(search.toLowerCase());
    const matchesProj = projectFilter === 'ALL' || b.project_id === projectFilter;
    return matchesSearch && matchesProj;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            Financial Management & Grant Tracking
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Monitor budget line items, expenditure vouchers, donor disbursements, and financial compliance.
          </p>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2.5">
            <Button variant="secondary" onClick={handleOpenAddBudget} icon={Wallet}>
              Allocate Budget
            </Button>
            <Button variant="primary" onClick={handleOpenAddExp} icon={Plus}>
              Record Expense
            </Button>
          </div>
        )}
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Budget Allocated"
          value={formatCurrency(totalAllocated)}
          subtitle="Sum of active program line-items"
          icon={Wallet}
          color="blue"
        />

        <StatCard
          title="Total Disbursed"
          value={formatCurrency(totalSpent)}
          subtitle={`${expenditures.length} verified expense vouchers`}
          icon={Receipt}
          color="emerald"
        />

        <StatCard
          title="Remaining Balance"
          value={formatCurrency(remainingBalance)}
          subtitle="Available project liquidity"
          icon={DollarSign}
          color={remainingBalance >= 0 ? 'emerald' : 'amber'}
        />

        <StatCard
          title="Budget Utilization"
          value={`${utilizationPct}%`}
          subtitle="Cumulative burn rate"
          icon={TrendingUp}
          color={utilizationPct > 90 ? 'amber' : 'purple'}
        />
      </div>

      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('expenditures')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'expenditures'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Expenditure Logs ({expenditures.length})
          </button>
          <button
            onClick={() => setActiveTab('budgets')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'budgets'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Budget Allocations ({budgets.length})
          </button>
          <button
            onClick={() => setActiveTab('field_funding')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'field_funding'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Field Cash Requisitions</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              {fieldFundingRequests.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('supplier_payments')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'supplier_payments'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Supplier Invoices & PO Settlements</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
              {purchaseOrders.filter(p => p.stage === 3 || (p.status && p.status.includes('Received'))).length}
            </span>
          </button>
        </div>

        {/* Project Selector Filter */}
        <div className="w-56">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="adra-select text-xs py-1.5"
          >
            <option value="ALL">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.project_name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Computing ledger records..." />
      ) : activeTab === 'expenditures' ? (
        filteredExpenditures.length === 0 ? (
          <EmptyState
            title="No expenditures logged"
            description="No expense transactions recorded matching your search."
            actionText={canEdit ? 'Record First Expense' : undefined}
            onAction={handleOpenAddExp}
          />
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Project</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredExpenditures.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-900/60 transition">
                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                        {exp.expenditure_code}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-200 border border-slate-700">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs text-slate-200">
                        {exp.description}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 max-w-[160px] truncate">
                        {exp.project_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {formatDate(exp.expenditure_date)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-100">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {canEdit && (
                          <button
                            onClick={() => {
                              setSelectedExp(exp);
                              setIsDeleteExpOpen(true);
                            }}
                            title="Delete entry"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : activeTab === 'budgets' ? (
        /* Budgets Table */
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Budget Line Category</th>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Fiscal Year</th>
                  <th className="py-3.5 px-4">Allocated Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredBudgets.map((bg) => (
                  <tr key={bg.id} className="hover:bg-slate-900/60 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-100 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      {bg.budget_category}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {bg.project_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {bg.financial_year}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      {formatCurrency(bg.allocated_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : activeTab === 'field_funding' ? (
        /* Field Cash Requisitions Table */
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Requisition</th>
                  <th className="py-3.5 px-4">Field Worker & Route</th>
                  <th className="py-3.5 px-4">Category & Purpose</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Approval Chain</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Finance Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {fieldFundingRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-900/60 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-emerald-400 block">{req.request_code}</span>
                      <span className="text-[10px] text-slate-500">{formatDate(req.created_at)}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-100 block">{req.field_worker_name}</span>
                      <span className="text-[10px] text-slate-400">{req.payam}, {req.county}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="font-semibold text-slate-200 block">{req.category}</span>
                      <span className="text-[11px] text-slate-400 line-clamp-1">{req.purpose}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-emerald-400 text-sm">{formatCurrency(req.amount)}</span>
                      <span className="text-[10px] text-slate-400 block">{req.preferred_payout}</span>
                    </td>
                    <td className="py-3.5 px-4 text-[10px] space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className={req.supervisor_review?.status === 'Approved' ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                          Sup: {req.supervisor_review?.status || 'Pending'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={req.pm_review?.status === 'Approved' ? 'text-blue-400 font-bold' : 'text-slate-500'}>
                          PM: {req.pm_review?.status || 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'Disbursed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        req.status === 'Approved (Pending Finance Disbursement)' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {req.status === 'Approved (Pending Finance Disbursement)' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleOpenDisburse(req)}
                        >
                          Disburse Funds
                        </Button>
                      )}
                      {req.status === 'Disbursed' && (
                        <span className="font-mono text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {req.finance_disbursement?.voucher_reference || 'Disbursed'}
                        </span>
                      )}
                      {(req.status === 'Pending Supervisor Approval' || req.status === 'Pending Program Manager Approval') && (
                        <span className="text-[10px] text-slate-500 italic">
                          Awaiting Approvals
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : activeTab === 'supplier_payments' ? (
        <FinanceSupplierPaymentsView
          purchaseOrders={purchaseOrders}
          suppliers={suppliers}
          onPaySupplier={handlePaySupplier}
          onRefresh={loadData}
        />
      ) : null}

      {/* Add Budget Modal */}
      <Modal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        title="Allocate Project Budget"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Project</label>
            <select
              value={budgetForm.project_id}
              onChange={(e) => setBudgetForm({ ...budgetForm, project_id: e.target.value })}
              className="adra-select"
              required
            >
              <option value="">-- Select Project --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.project_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Budget Category</label>
            <select
              value={budgetForm.budget_category}
              onChange={(e) => setBudgetForm({ ...budgetForm, budget_category: e.target.value })}
              className="adra-select"
            >
              {BUDGET_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Allocated Amount (SSP)</label>
            <input
              type="number"
              value={budgetForm.allocated_amount}
              onChange={(e) => setBudgetForm({ ...budgetForm, allocated_amount: e.target.value })}
              placeholder="e.g. 150000"
              className="adra-input"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Financial Year</label>
            <input
              type="text"
              value={budgetForm.financial_year}
              onChange={(e) => setBudgetForm({ ...budgetForm, financial_year: e.target.value })}
              className="adra-input"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsBudgetModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Allocation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Expenditure Modal */}
      <Modal
        isOpen={isExpModalOpen}
        onClose={() => setIsExpModalOpen(false)}
        title="Record Project Expenditure"
      >
        <form onSubmit={handleSaveExp} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Voucher / Code</label>
              <input
                type="text"
                value={expForm.expenditure_code}
                onChange={(e) => setExpForm({ ...expForm, expenditure_code: e.target.value })}
                className="adra-input font-mono uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={expForm.category}
                onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}
                className="adra-select"
              >
                {BUDGET_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Project</label>
            <select
              value={expForm.project_id}
              onChange={(e) => setExpForm({ ...expForm, project_id: e.target.value })}
              className="adra-select"
              required
            >
              <option value="">-- Select Project --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.project_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description & Purpose</label>
            <textarea
              value={expForm.description}
              onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
              placeholder="e.g. Field tractor fuel and certified seed logistics invoice #4928"
              className="adra-input min-h-[70px]"
              rows={2}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (SSP)</label>
              <input
                type="number"
                value={expForm.amount}
                onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })}
                placeholder="e.g. 18500"
                className="adra-input"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Disbursement Date</label>
              <input
                type="date"
                value={expForm.expenditure_date}
                onChange={(e) => setExpForm({ ...expForm, expenditure_date: e.target.value })}
                className="adra-input"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsExpModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Record Expense
            </Button>
          </div>
        </form>
      </Modal>

      {/* Field Facilitation Disbursement Modal */}
      <Modal
        isOpen={isDisburseModalOpen}
        onClose={() => setIsDisburseModalOpen(false)}
        title="Execute Field Facilitation Disbursement"
        maxWidth="max-w-lg"
      >
        {selectedRequisition && (
          <form onSubmit={handleConfirmDisburse} className="space-y-4">
            {/* Summary Box */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Requisition Code:</span>
                <span className="font-mono font-bold text-emerald-400">{selectedRequisition.request_code}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Field Worker:</span>
                <span className="font-bold text-slate-100">{selectedRequisition.field_worker_name} ({selectedRequisition.payout_phone || selectedRequisition.field_worker_phone || 'Phone not listed'})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Location / Operational County:</span>
                <span className="text-slate-200">{selectedRequisition.payam}, {selectedRequisition.county}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                <span className="text-slate-400">Amount to Disburse:</span>
                <span className="text-base font-black text-emerald-400">
                  {selectedRequisition.currency || 'SSP'} {Number(selectedRequisition.amount).toLocaleString()}
                </span>
              </div>

              {/* Endorsement Chain Highlights */}
              {selectedRequisition.supervisor_review?.notes && (
                <div className="pt-1.5 border-t border-slate-800 text-[11px] text-slate-300">
                  <span className="text-slate-400 font-semibold">Supervisor Endorsement: </span>
                  <span className="italic">"{selectedRequisition.supervisor_review.notes}"</span>
                </div>
              )}
              {selectedRequisition.pm_review?.notes && (
                <div className="text-[11px] text-slate-300">
                  <span className="text-blue-400 font-semibold">PM Authorization: </span>
                  <span className="italic">"{selectedRequisition.pm_review.notes}"</span>
                </div>
              )}
            </div>

            {/* Form Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Voucher #</label>
                <input
                  type="text"
                  value={disburseForm.voucher_reference}
                  onChange={(e) => setDisburseForm({ ...disburseForm, voucher_reference: e.target.value })}
                  className="adra-input font-mono uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Transaction Ref Code</label>
                <input
                  type="text"
                  value={disburseForm.transaction_ref}
                  onChange={(e) => setDisburseForm({ ...disburseForm, transaction_ref: e.target.value })}
                  className="adra-input font-mono uppercase"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Payout Channel / Method</label>
              <select
                value={disburseForm.payment_method}
                onChange={(e) => setDisburseForm({ ...disburseForm, payment_method: e.target.value })}
                className="adra-select"
                required
              >
                <option value="m-Gurush Mobile Money">m-Gurush Mobile Money</option>
                <option value="Direct Cash Float">Direct Cash Float</option>
                <option value="Equity Bank Transfer">Equity Bank Transfer</option>
                <option value="Stanbic Bank Transfer">Stanbic Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Disbursement Remarks / Audit Notes</label>
              <textarea
                value={disburseForm.notes}
                onChange={(e) => setDisburseForm({ ...disburseForm, notes: e.target.value })}
                placeholder="Audit notes for financial log and general ledger..."
                className="adra-input min-h-[60px]"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button type="button" variant="secondary" onClick={() => setIsDisburseModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Confirm Disbursement & Issue Voucher
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirm Delete Expenditure Modal */}
      <ConfirmModal
        isOpen={isDeleteExpOpen}
        onClose={() => setIsDeleteExpOpen(false)}
        onConfirm={handleDeleteExp}
        title="Delete Expense Record"
        message="Are you sure you want to remove this expenditure? This will recalculate total project disbursements."
      />
    </div>
  );
}
