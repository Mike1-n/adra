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
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('expenditures'); // 'expenditures' | 'budgets'
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');

  // Modals
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [isDeleteExpOpen, setIsDeleteExpOpen] = useState(false);
  const [selectedExp, setSelectedExp] = useState(null);

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
      const [bgList, expList, projList] = await Promise.all([
        db.getBudgets(),
        db.getExpenditures(),
        db.getProjects(),
      ]);
      setBudgets(bgList);
      setExpenditures(expList);
      setProjects(projList);
    } catch (err) {
      toast.error('Failed to load finance ledger.');
    } finally {
      setLoading(false);
    }
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
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            Financial Management & Grants Control
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Monitor budget allocations, expense dispatches, and project burn rates.
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
      ) : (
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
      )}

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
            <label className="block text-xs font-semibold text-slate-300 mb-1">Allocated Amount ($ USD)</label>
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">Amount ($ USD)</label>
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
