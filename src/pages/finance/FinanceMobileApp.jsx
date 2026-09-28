import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Banknote,
  Receipt,
  Wallet,
  FileSpreadsheet,
  User,
  LogOut,
  RefreshCw,
  Menu,
  X,
  Plus,
  ArrowLeft,
  DollarSign,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  ListFilter
} from 'lucide-react';
import { db } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// Subviews
import { FinanceDashboardView } from './components/FinanceDashboardView';
import { FinanceDisbursementsView } from './components/FinanceDisbursementsView';
import { FinanceExpensesView } from './components/FinanceExpensesView';
import { FinanceBudgetsView } from './components/FinanceBudgetsView';
import { FinanceReportsView } from './components/FinanceReportsView';
import { FinanceProfileView } from './components/FinanceProfileView';

// Modals
import { FinanceDisburseModal } from './components/FinanceDisburseModal';
import { FinanceExpenseModal } from './components/FinanceExpenseModal';
import { FinanceBudgetModal } from './components/FinanceBudgetModal';
import { FinanceVoucherModal } from './components/FinanceVoucherModal';

export function FinanceMobileApp({
  currentUser,
  onLogout,
  onSwitchRole,
  onBackToFieldApp
}) {
  const { logout, quickSwitchRole } = useAuth();
  const toast = useToast();

  // Active View State: 'dashboard' | 'disbursements' | 'expenses' | 'budgets' | 'reports' | 'profile'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [disbursementsFilter, setDisbursementsFilter] = useState('pending_finance'); // 'pending_finance' | 'disbursed' | 'all'
  const [isDisbursementsMenuOpen, setIsDisbursementsMenuOpen] = useState(true);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data states
  const [budgets, setBudgets] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [projects, setProjects] = useState([]);
  const [fieldFundingRequests, setFieldFundingRequests] = useState([]);

  // Modal states
  const [disburseModalOpen, setDisburseModalOpen] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState(null);

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);

  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [selectedVoucherItem, setSelectedVoucherItem] = useState(null);

  // Load all finance data
  const loadData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [bgList, expList, projList, fundingList] = await Promise.all([
        db.getBudgets(),
        db.getExpenditures(),
        db.getProjects(),
        db.getFieldFundingRequests ? db.getFieldFundingRequests() : []
      ]);
      setBudgets(bgList || []);
      setExpenditures(expList || []);
      setProjects(projList || []);
      setFieldFundingRequests(fundingList || []);
    } catch (err) {
      console.error('Error loading finance ledger:', err);
      toast.error('Failed to load finance ledger.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData(true);
      toast.success('Finance records updated');
    } catch (e) {
      toast.error('Failed to reload');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Requisition Disbursement
  const handleOpenDisburse = (req) => {
    setSelectedRequisition(req);
    setDisburseModalOpen(true);
  };

  const handleConfirmDisburse = async (requestId, disburseForm) => {
    try {
      const financeOfficer = currentUser?.full_name || currentUser?.name || 'Alex Morgan (Finance Officer)';
      const updated = await db.disburseFieldFundingByFinance(requestId, financeOfficer, disburseForm);
      toast.success(`Disbursed & logged in ledger. Voucher ${disburseForm.voucher_reference} generated.`);
      await loadData(true);

      // Instantly open the official payment voucher receipt modal
      const voucherItem = updated || {
        ...selectedRequisition,
        stage: 4,
        status: 'Disbursed',
        finance_disbursement: {
          status: 'Disbursed',
          disbursed_by: financeOfficer,
          disbursed_at: new Date().toISOString(),
          payment_method: disburseForm.payment_method,
          voucher_reference: disburseForm.voucher_reference,
          transaction_ref: disburseForm.transaction_ref,
          notes: disburseForm.notes
        }
      };

      setSelectedVoucherItem(voucherItem);
      setVoucherModalOpen(true);
    } catch (err) {
      console.error('Disbursement failed:', err);
      toast.error('Failed to execute disbursement.');
      throw err;
    }
  };

  // Expense Logging
  const handleSaveExpense = async (expenseData) => {
    try {
      await db.createExpenditure(expenseData);
      toast.success('Expense recorded in ledger.');
      await loadData(true);
    } catch (err) {
      toast.error('Failed to record expense.');
      throw err;
    }
  };

  const handleDeleteExpense = async (exp) => {
    if (!window.confirm(`Delete expenditure record ${exp.expenditure_code}?`)) return;
    try {
      await db.deleteExpenditure(exp.id);
      toast.success('Expenditure record removed.');
      await loadData(true);
    } catch (err) {
      toast.error('Failed to delete expense.');
    }
  };

  // Budget Line Allocation
  const handleSaveBudget = async (budgetData) => {
    try {
      await db.createBudget(budgetData);
      toast.success('Budget allocation recorded.');
      await loadData(true);
    } catch (err) {
      toast.error('Failed to save budget.');
      throw err;
    }
  };

  // View Voucher
  const handleViewVoucher = (item) => {
    setSelectedVoucherItem(item);
    setVoucherModalOpen(true);
  };

  // Count pending PM-approved requisitions awaiting Finance payout
  const pendingDisbursements = useMemo(() => {
    return fieldFundingRequests.filter(
      r => r.status === 'Approved (Pending Finance Disbursement)' ||
           r.stage === 3 ||
           r.status === 'Approved by Program Manager' ||
           r.status === 'Pending Finance Disbursement'
    );
  }, [fieldFundingRequests]);

  const disbursedRequisitions = useMemo(() => {
    return fieldFundingRequests.filter(
      r => r.stage === 4 || r.status === 'Disbursed' || r.status === 'Disbursed / Paid'
    );
  }, [fieldFundingRequests]);

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'disbursements':
        return disbursementsFilter === 'pending_finance'
          ? 'Pending Payouts'
          : disbursementsFilter === 'disbursed'
          ? 'Disbursed Payouts'
          : 'Field Disbursements';
      case 'expenses':
        return 'Expenditure Ledger';
      case 'budgets':
        return 'Project Budget Lines';
      case 'reports':
        return 'Financial Statements';
      case 'profile':
        return 'Finance Officer Profile';
      default:
        return 'Financial Overview';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex justify-center selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-lg bg-slate-50 min-h-screen flex flex-col shadow-2xl relative border-x border-slate-200">
        
        {/* 1. TOP MOBILE APP BAR (With Sidebar Trigger & Navigation) */}
        <header className="sticky top-0 z-30 bg-[#004D3F] text-white px-4 py-3 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Hamburger / Sidebar Opener */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition cursor-pointer relative"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
              {pendingDisbursements.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-[#004D3F] animate-pulse" />
              )}
            </button>

            {activeTab !== 'dashboard' && (
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Back to Overview"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div>
              <h1 className="text-xs font-black tracking-tight leading-none text-white flex items-center gap-1.5">
                <span>{getHeaderTitle()}</span>
              </h1>
              <span className="text-[10px] text-emerald-200 font-medium">
                ADRA South Sudan • Finance
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-emerald-100 transition cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-300' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('profile');
              }}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black text-xs flex items-center justify-center shadow-xs border border-white/30 cursor-pointer"
              title="Officer Profile"
            >
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt="User" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span>FO</span>
              )}
            </button>
          </div>
        </header>

        {/* 2. MAIN CONTENT VIEW (No bottom navigation bar) */}
        <main className="flex-1 p-4 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <div className="w-10 h-10 border-3 border-[#006B56] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-500">Loading financial ledger...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <FinanceDashboardView
                  budgets={budgets}
                  expenditures={expenditures}
                  projects={projects}
                  fieldFundingRequests={fieldFundingRequests}
                  onNavigateTab={(tab, filter) => {
                    setActiveTab(tab);
                    if (filter) setDisbursementsFilter(filter);
                  }}
                  onOpenDisburse={handleOpenDisburse}
                  onOpenAddExpense={() => setExpenseModalOpen(true)}
                  onOpenAddBudget={() => setBudgetModalOpen(true)}
                  onViewVoucher={handleViewVoucher}
                />
              )}

              {activeTab === 'disbursements' && (
                <FinanceDisbursementsView
                  requests={fieldFundingRequests}
                  activeFilter={disbursementsFilter}
                  onFilterChange={setDisbursementsFilter}
                  onOpenSidebar={() => setIsSidebarOpen(true)}
                  onOpenDisburse={handleOpenDisburse}
                  onViewVoucher={handleViewVoucher}
                />
              )}

              {activeTab === 'expenses' && (
                <FinanceExpensesView
                  expenditures={expenditures}
                  projects={projects}
                  onOpenAddExpense={() => setExpenseModalOpen(true)}
                  onDeleteExpense={handleDeleteExpense}
                  onViewVoucher={handleViewVoucher}
                />
              )}

              {activeTab === 'budgets' && (
                <FinanceBudgetsView
                  budgets={budgets}
                  expenditures={expenditures}
                  projects={projects}
                  onOpenAddBudget={() => setBudgetModalOpen(true)}
                />
              )}

              {activeTab === 'reports' && (
                <FinanceReportsView
                  budgets={budgets}
                  expenditures={expenditures}
                  projects={projects}
                  fieldFundingRequests={fieldFundingRequests}
                  currentUser={currentUser}
                />
              )}

              {activeTab === 'profile' && (
                <FinanceProfileView
                  currentUser={currentUser}
                  onLogout={onLogout || logout}
                  onSwitchRole={onSwitchRole || quickSwitchRole}
                  onBackToFieldApp={onBackToFieldApp}
                />
              )}
            </>
          )}
        </main>

        {/* 3. SIDEBAR NAVIGATION DRAWER */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex animate-in fade-in duration-150">
            <div className="w-76 bg-white h-full shadow-2xl flex flex-col p-4 space-y-4 animate-in slide-in-from-left duration-200">
              
              {/* Drawer User Banner */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#006B56] text-white flex items-center justify-center font-black text-xs shadow-xs">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 leading-tight">ADRA Finance</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Alex Morgan (Officer)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Menu List */}
              <div className="flex-1 space-y-1.5 overflow-y-auto text-xs font-bold text-slate-700 pr-1">
                <p className="text-[10px] uppercase font-black text-slate-400 px-2.5 py-0.5 tracking-wider">
                  Menu & Modules
                </p>

                {/* Dashboard */}
                <button
                  type="button"
                  onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
                  className={`w-full p-2.5 rounded-xl flex items-center gap-2.5 transition text-left cursor-pointer ${
                    activeTab === 'dashboard' ? 'bg-emerald-50 text-[#006B56] font-black' : 'hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-[#006B56]" />
                  <span>Financial Overview</span>
                </button>

                {/* Field Disbursements (Group with Sub-Filters) */}
                <div className="space-y-1">
                  <div
                    onClick={() => {
                      setActiveTab('disbursements');
                      setIsDisbursementsMenuOpen(!isDisbursementsMenuOpen);
                    }}
                    className={`w-full p-2.5 rounded-xl flex items-center justify-between transition cursor-pointer ${
                      activeTab === 'disbursements' ? 'bg-emerald-50 text-[#006B56] font-black' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      <span>Field Disbursements</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {pendingDisbursements.length > 0 && (
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                          {pendingDisbursements.length}
                        </span>
                      )}
                      {isDisbursementsMenuOpen ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Sub-Filters under Field Disbursements */}
                  {isDisbursementsMenuOpen && (
                    <div className="pl-6 space-y-1 border-l-2 border-emerald-100 ml-3.5 my-1 text-[11px]">
                      {/* 1. Pending Payout */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('disbursements');
                          setDisbursementsFilter('pending_finance');
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full p-2 rounded-lg flex items-center justify-between transition text-left cursor-pointer ${
                          activeTab === 'disbursements' && disbursementsFilter === 'pending_finance'
                            ? 'bg-emerald-100/70 text-[#006B56] font-black'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Pending Payout</span>
                        </div>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          pendingDisbursements.length > 0 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {pendingDisbursements.length}
                        </span>
                      </button>

                      {/* 2. Disbursed */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('disbursements');
                          setDisbursementsFilter('disbursed');
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full p-2 rounded-lg flex items-center justify-between transition text-left cursor-pointer ${
                          activeTab === 'disbursements' && disbursementsFilter === 'disbursed'
                            ? 'bg-emerald-100/70 text-[#006B56] font-black'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#006B56]" />
                          <span>Disbursed</span>
                        </div>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-50 text-[#006B56]">
                          {disbursedRequisitions.length}
                        </span>
                      </button>

                      {/* 3. All Requisitions */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('disbursements');
                          setDisbursementsFilter('all');
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full p-2 rounded-lg flex items-center justify-between transition text-left cursor-pointer ${
                          activeTab === 'disbursements' && disbursementsFilter === 'all'
                            ? 'bg-emerald-100/70 text-[#006B56] font-black'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ListFilter className="w-3.5 h-3.5 text-slate-500" />
                          <span>All Requisitions</span>
                        </div>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
                          {fieldFundingRequests.length}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Expenses */}
                <button
                  type="button"
                  onClick={() => { setActiveTab('expenses'); setIsSidebarOpen(false); }}
                  className={`w-full p-2.5 rounded-xl flex items-center gap-2.5 transition text-left cursor-pointer ${
                    activeTab === 'expenses' ? 'bg-emerald-50 text-[#006B56] font-black' : 'hover:bg-slate-50'
                  }`}
                >
                  <Receipt className="w-4 h-4 text-blue-600" />
                  <span>Expenditure Ledger</span>
                </button>

                {/* Budgets */}
                <button
                  type="button"
                  onClick={() => { setActiveTab('budgets'); setIsSidebarOpen(false); }}
                  className={`w-full p-2.5 rounded-xl flex items-center gap-2.5 transition text-left cursor-pointer ${
                    activeTab === 'budgets' ? 'bg-emerald-50 text-[#006B56] font-black' : 'hover:bg-slate-50'
                  }`}
                >
                  <Wallet className="w-4 h-4 text-purple-600" />
                  <span>Program Budgets</span>
                </button>

                {/* Statements & Reports */}
                <button
                  type="button"
                  onClick={() => { setActiveTab('reports'); setIsSidebarOpen(false); }}
                  className={`w-full p-2.5 rounded-xl flex items-center gap-2.5 transition text-left cursor-pointer ${
                    activeTab === 'reports' ? 'bg-emerald-50 text-[#006B56] font-black' : 'hover:bg-slate-50'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                  <span>Statements & Exports</span>
                </button>

                {/* Profile */}
                <button
                  type="button"
                  onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
                  className={`w-full p-2.5 rounded-xl flex items-center gap-2.5 transition text-left cursor-pointer ${
                    activeTab === 'profile' ? 'bg-emerald-50 text-[#006B56] font-black' : 'hover:bg-slate-50'
                  }`}
                >
                  <User className="w-4 h-4 text-slate-600" />
                  <span>Officer Profile</span>
                </button>
              </div>

              {/* Drawer Footer / Role Switcher / Logout */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSidebarOpen(false);
                    if (onLogout) onLogout();
                    else logout();
                  }}
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* 4. MODALS */}
        <FinanceDisburseModal
          isOpen={disburseModalOpen}
          onClose={() => { setDisburseModalOpen(false); setSelectedRequisition(null); }}
          requisition={selectedRequisition}
          onConfirmDisburse={handleConfirmDisburse}
          currentUser={currentUser}
        />

        <FinanceExpenseModal
          isOpen={expenseModalOpen}
          onClose={() => setExpenseModalOpen(false)}
          projects={projects}
          onSaveExpense={handleSaveExpense}
          currentUser={currentUser}
        />

        <FinanceBudgetModal
          isOpen={budgetModalOpen}
          onClose={() => setBudgetModalOpen(false)}
          projects={projects}
          onSaveBudget={handleSaveBudget}
        />

        <FinanceVoucherModal
          isOpen={voucherModalOpen}
          onClose={() => { setVoucherModalOpen(false); setSelectedVoucherItem(null); }}
          item={selectedVoucherItem}
        />

      </div>
    </div>
  );
}
export default FinanceMobileApp;
