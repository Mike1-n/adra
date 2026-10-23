import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Truck,
  Building2,
  ShoppingCart,
  FileText,
  SlidersHorizontal,
  PackagePlus,
  RefreshCw,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown,
  AlertTriangle,
  Menu,
  X,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ArrowRightLeft,
  TrendingUp,
  Layers,
  Bell,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
} from 'lucide-react';
import { db } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdraLogo } from '../../components/common/AdraLogo';

// Subviews
import { InventoryOverviewView } from './components/InventoryOverviewView';
import { InventoryStockView } from './components/InventoryStockView';
import { InventoryDispatchesView } from './components/InventoryDispatchesView';
import { IssueWaybillView } from './components/IssueWaybillView';
import { InventorySuppliersView } from './components/InventorySuppliersView';
import { InventoryWarehousesView } from './components/InventoryWarehousesView';
import { InventoryReportsView } from './components/InventoryReportsView';

// Modals
import { ReceiveStockModal } from './components/ReceiveStockModal';
import { CreateDispatchModal } from './components/CreateDispatchModal';
import { CreatePOModal } from './components/CreatePOModal';
import { WaybillDetailModal } from './components/WaybillDetailModal';
import { UserProfileModal } from '../../components/common/UserProfileModal';
import { NotificationBellButton } from '../../components/common/NotificationBellButton';

export function InventoryManagerDashboard({
  currentUser,
  onLogout,
  onSwitchRole,
  onBackToFieldApp
}) {
  const { logout: authLogout, quickSwitchRole } = useAuth();
  const toast = useToast();

  // Active Tab: 'overview' | 'stock' | 'dispatches' | 'suppliers' | 'warehouses' | 'reports'
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [supplierSubTab, setSupplierSubTab] = useState('all'); // 'all' | 'stage1' | 'stage2' | 'stage3' | 'stage4' | 'suppliers'
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [showDrawerRoleSwitcher, setShowDrawerRoleSwitcher] = useState(false);
  const [selectedDepotScope, setSelectedDepotScope] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data States
  const [inventory, setInventory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [resources, setResources] = useState([]);
  const [assistanceRequests, setAssistanceRequests] = useState([]);

  // Modal States
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [selectedReceiveItem, setSelectedReceiveItem] = useState(null);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [waybillModalOpen, setWaybillModalOpen] = useState(false);
  const [selectedWaybill, setSelectedWaybill] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Load Data
  const loadData = async () => {
    try {
      setLoading(true);
      const [
        invData,
        whData,
        supData,
        poData,
        dispData,
        txData,
        resData,
        reqData
      ] = await Promise.all([
        db.getInventory ? db.getInventory() : [],
        db.getWarehouses ? db.getWarehouses() : [],
        db.getSuppliers ? db.getSuppliers() : [],
        db.getPurchaseOrders ? db.getPurchaseOrders() : [],
        db.getDispatches ? db.getDispatches() : [],
        db.getStockTransactions ? db.getStockTransactions() : [],
        db.getProgramResources ? db.getProgramResources() : [],
        db.getAssistanceRequests ? db.getAssistanceRequests() : []
      ]);

      setInventory(invData || []);
      setWarehouses(whData || []);
      setSuppliers(supData || []);
      const seenWbs = new Set();
      const uniqueDispatches = (dispData || []).filter(d => {
        const k = (d.waybill_number || d.id || '').trim().toLowerCase();
        if (!k || seenWbs.has(k)) return false;
        seenWbs.add(k);
        return true;
      });
      setDispatches(uniqueDispatches);
      setTransactions(txData || []);
      setResources(resData || []);
      setAssistanceRequests(reqData || []);
    } catch (err) {
      console.error('Error loading inventory data:', err);
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    toast.success('Inventory & logistics state synchronized');
  };

  // Selected request to dispatch
  const [selectedDispatchReq, setSelectedDispatchReq] = useState(null);

  // Filter PM-approved requests that are staged for warehouse dispatch (excluding already assigned waybills)
  const approvedRequestsForDispatch = useMemo(() => {
    // Collect all request identifiers that have already been dispatched in a waybill
    const dispatchedKeys = new Set();
    dispatches.forEach(d => {
      if (d.linked_request_id) dispatchedKeys.add(String(d.linked_request_id).toLowerCase().trim());
      if (d.request_code) dispatchedKeys.add(String(d.request_code).toLowerCase().trim());
    });

    return assistanceRequests.filter(r => {
      if (!r) return false;
      const rId = String(r.id || '').toLowerCase().trim();
      const rCode = String(r.request_code || r.tracking_number || '').toLowerCase().trim();

      // If already linked to an issued waybill dispatch, remove immediately from staging queue
      if ((rId && dispatchedKeys.has(rId)) || (rCode && dispatchedKeys.has(rCode))) {
        return false;
      }

      const status = (r.status || '').toLowerCase().trim();
      const statusLabel = (r.status_label || '').toLowerCase().trim();
      const verStatus = (r.verification_status || '').toLowerCase().trim();
      const dst = (r.dispatch_status || '').toLowerCase().trim();
      const stage = Number(r.status_stage || r.stage || 0);

      // Exclude already dispatched / completed items
      const isDispatched = 
        status === 'dispatched' || 
        status === 'warehouse_dispatched' || 
        status === 'in transit' ||
        status === 'delivered' || 
        status === 'completed' ||
        dst === 'in transit' ||
        dst.includes('transit') ||
        dst.includes('arrived') ||
        dst.includes('deliver') ||
        Boolean(r.dispatched_at || r.waybill_number || r.qr_token);

      if (isDispatched) return false;

      // Exclude rejected items
      const isRejected = 
        status === 'rejected' || 
        status.includes('reject') || 
        statusLabel.includes('reject') || 
        Boolean(r.returned_to_worker) || 
        stage === 6 || stage === -1;

      if (isRejected) return false;

      // Match all approved / assigned / endorsed states
      const isApproved =
        status === 'approved' ||
        status === 'approved_by_pm' ||
        status === 'approved by program manager' ||
        status === 'assigned to supervisor' ||
        status === 'assigned to field worker' ||
        status === 'endorsed' ||
        status === 'endorsed by supervisor' ||
        status === 'supervisor_approved' ||
        status.includes('approved') ||
        status.includes('endors') ||
        status.includes('assigned') ||
        verStatus === 'approved' ||
        stage >= 2;

      return isApproved;
    });
  }, [assistanceRequests, dispatches]);

  // Handlers for Modals & Data Operations
  const handleReceiveStock = async (grnData) => {
    const res = await db.receiveStock(grnData);
    const updated = await db.getInventory();
    setInventory([...updated]);
    await loadData();
    return res;
  };

  const handleCreateDispatch = async (dispData) => {
    const res = await db.createDispatch(dispData);
    const updated = await db.getInventory();
    setInventory([...updated]);
    const updatedDispatches = await db.getDispatches();
    const seenWbs = new Set();
    const cleanDispatches = (updatedDispatches || []).filter(d => {
      const k = (d.waybill_number || d.id || '').trim().toLowerCase();
      if (!k || seenWbs.has(k)) return false;
      seenWbs.add(k);
      return true;
    });
    setDispatches(cleanDispatches);
    const updatedRequests = await db.getAssistanceRequests();
    setAssistanceRequests([...updatedRequests]);
    await loadData();
    return res;
  };

  const handleCreatePO = async (poData) => {
    const res = await db.createPurchaseOrder(poData);
    const updated = await db.getPurchaseOrders();
    setPurchaseOrders([...updated]);
    await loadData();
    return res;
  };

  const handleSupplierDispatch = async (id, dispatchData) => {
    const res = await db.supplierDispatchPO(id, dispatchData);
    const updated = await db.getPurchaseOrders();
    setPurchaseOrders([...updated]);
    await loadData();
    return res;
  };

  const handleConfirmReceipt = async (id, grnData) => {
    const res = await db.confirmAndReceivePO(id, grnData);
    const updated = await db.getPurchaseOrders();
    setPurchaseOrders([...updated]);
    await loadData();
    return res;
  };

  const handlePaySupplier = async (id, paymentData) => {
    const res = await db.paySupplierPO(id, paymentData);
    const updated = await db.getPurchaseOrders();
    setPurchaseOrders([...updated]);
    await loadData();
    return res;
  };

  const handleRejectAndReturnPO = async (id, returnData) => {
    const res = await db.rejectAndReturnPO(id, returnData);
    const updated = await db.getPurchaseOrders();
    setPurchaseOrders([...updated]);
    await loadData();
    return res;
  };

  const handleCreateSupplier = async (supplierData) => {
    const res = await db.createSupplier(supplierData);
    await loadData();
    return res;
  };

  const handleUpdateDispatchStatus = async (id, status, notes) => {
    const res = await db.updateDispatchStatus(id, status, notes);
    await loadData();
    return res;
  };

  const handleDeleteInventoryItem = async (id) => {
    if (window.confirm('Are you sure you want to remove this SKU from the inventory catalog?')) {
      await db.deleteInventoryItem(id);
      toast.info('Item removed from inventory');
      await loadData();
    }
  };

  const handleClearAllStock = async () => {
    if (window.confirm('Are you sure you want to clear and reset all stock items? This will empty the stock catalog.')) {
      await db.clearAllInventory();
      toast.success('Stock catalog cleared and reset');
      await loadData();
    }
  };

  const handleOpenReceiveFromPO = (po) => {
    setReceiveModalOpen(true);
  };

  const handleOpenWaybillDetail = (waybill) => {
    setSelectedWaybill(waybill);
    setWaybillModalOpen(true);
  };

  const roles = [
    { role: 'Administrator', label: 'Administrator', desc: 'HQ System Control' },
    { role: 'Program Manager', label: 'Programme Manager', desc: 'Emergency Program Scope' },
    { role: 'Supervisor', label: 'Field Supervisor', desc: 'State Field Ops' },
    { role: 'Field Worker', label: 'Field Worker', desc: 'Payam Household Visits' },
    { role: 'Finance Officer', label: 'Finance Officer', desc: 'Grants & Disbursements' },
    { role: 'Inventory Manager', label: 'Inventory Manager', desc: 'Warehouse & Logistics' },
    { role: 'Beneficiary', label: 'Beneficiary', desc: 'Community Portal' }
  ];

  const [dispatchStatusFilter, setDispatchStatusFilter] = useState('ALL');

  const lowStockAlertsCount = useMemo(() => {
    return inventory.filter(i => i.status === 'Low Stock' || (i.quantity > 0 && i.quantity < (i.min_threshold || 10))).length;
  }, [inventory]);

  const activeTabTitle = useMemo(() => {
    switch (activeTab) {
      case 'overview': return 'Executive Overview Dashboard';
      case 'stock': return 'Stock Catalog & Commodity Database';
      case 'dispatches': 
        if (dispatchStatusFilter === 'IN_TRANSIT') return 'Aid Dispatches — Active In-Transit Convoys';
        if (dispatchStatusFilter === 'DELIVERED') return 'Aid Dispatches — Delivered & Confirmed at Hubs';
        if (dispatchStatusFilter === 'STAGED') return 'Aid Dispatches — PM-Authorized Staging Queue';
        return 'Aid Dispatches & Waybills — All Manifests';
      case 'dispatches-issue': return 'Issue Aid Waybill & Commodity Release';
      case 'suppliers':
        if (supplierSubTab === 'stage1') return 'Suppliers & POs — 1. Requested (Awaiting Supply)';
        if (supplierSubTab === 'stage2') return 'Suppliers & POs — 2. In Transit (Vendor Dispatched)';
        if (supplierSubTab === 'stage3') return 'Suppliers & POs — 3. GRN Received (Pending Payment)';
        if (supplierSubTab === 'stage4') return 'Suppliers & POs — 4. Paid & Settled';
        if (supplierSubTab === 'suppliers') return 'Suppliers Directory & Vendor Partners';
        return 'Suppliers & Purchase Orders — All Manifests';
      case 'warehouses': return 'State Relief Depots';
      case 'reports': return 'Reports & Audit Ledger';
      default: return 'Logistics & Supply Chain';
    }
  }, [activeTab, dispatchStatusFilter, supplierSubTab]);

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800 relative">
      
      {/* Mobile Drawer Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 lg:hidden animate-in fade-in duration-150 cursor-pointer"
        />
      )}

      {/* SIDEBAR (Docked on Desktop lg+, Slide-out Drawer on Mobile/Tablet) */}
      <aside 
        className={`fixed lg:sticky top-0 inset-y-0 left-0 z-50 lg:z-30 w-72 h-screen max-w-[85%] bg-white flex flex-col shadow-2xl lg:shadow-none border-r border-slate-200 transition-transform duration-200 ease-in-out shrink-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* 1. Drawer Header Brand (With mobile status bar clearance) */}
        <div className="pt-safe-drawer border-b border-slate-100 bg-white shrink-0">
          <div className="p-3.5 flex items-center justify-between">
            <AdraLogo
              isCollapsed={false}
              subtitle="Logistics"
              description="Warehouse & Stock Control"
            />

            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Navigation List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1 text-xs font-semibold">
          
          {/* Overview Dashboard */}
          <button
            type="button"
            onClick={() => handleNavClick('overview')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#006B56] text-white font-bold shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <LayoutDashboard className={`w-4 h-4 ${activeTab === 'overview' ? 'text-white' : 'text-[#006B56]'}`} />
              <span>Dashboard Overview</span>
            </div>
          </button>

          {/* Stock Catalog */}
          <button
            type="button"
            onClick={() => handleNavClick('stock')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeTab === 'stock'
                ? 'bg-[#006B56] text-white font-bold shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Package className={`w-4 h-4 ${activeTab === 'stock' ? 'text-white' : 'text-[#006B56]'}`} />
              <span>Stock Catalog</span>
            </div>
            {lowStockAlertsCount > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'stock' ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-900'
              }`}>
                {lowStockAlertsCount}
              </span>
            )}
          </button>


          <button
            type="button"
            onClick={() => handleNavClick('dispatches')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeTab === 'dispatches' || activeTab === 'dispatches-issue'
                ? 'bg-[#006B56] text-white font-bold shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Truck className={`w-4 h-4 ${activeTab === 'dispatches' || activeTab === 'dispatches-issue' ? 'text-white' : 'text-blue-600'}`} />
              <span>Aid Dispatches & Waybills</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
              activeTab === 'dispatches' || activeTab === 'dispatches-issue'
                ? 'bg-white text-[#006B56]'
                : 'bg-emerald-100 text-emerald-900'
            }`}>
              {dispatches.length}
            </span>
          </button>

          {/* Suppliers & Purchase Orders */}
          <button
            type="button"
            onClick={() => handleNavClick('suppliers')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeTab === 'suppliers'
                ? 'bg-[#006B56] text-white font-bold shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <ShoppingCart className={`w-4 h-4 ${activeTab === 'suppliers' ? 'text-white' : 'text-teal-600'}`} />
              <span>Suppliers & Purchase Orders</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
              activeTab === 'suppliers'
                ? 'bg-white text-[#006B56]'
                : 'bg-slate-100 text-slate-700'
            }`}>
              {purchaseOrders.length}
            </span>
          </button>

          {/* State Relief Depots */}
          <button
            type="button"
            onClick={() => handleNavClick('warehouses')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeTab === 'warehouses'
                ? 'bg-[#006B56] text-white font-bold shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Building2 className={`w-4 h-4 ${activeTab === 'warehouses' ? 'text-white' : 'text-slate-500'}`} />
              <span>State Relief Depots</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded-md">
              {warehouses.length}
            </span>
          </button>

          {/* Reports & Audit Ledger */}
          <button
            type="button"
            onClick={() => handleNavClick('reports')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-[#006B56] text-white font-bold shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <FileText className={`w-4 h-4 ${activeTab === 'reports' ? 'text-white' : 'text-slate-500'}`} />
              <span>Reports & Audit Ledger</span>
            </div>
          </button>
        </div>

        {/* 4. Drawer Footer: Switch Role & Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 space-y-2 shrink-0">
          {/* Quick Role Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDrawerRoleSwitcher(!showDrawerRoleSwitcher)}
              className="w-full py-1.5 px-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-[11px] font-bold flex items-center justify-between border border-slate-200 transition cursor-pointer shadow-2xs"
            >
              <span className="flex items-center space-x-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-[#006B56]" />
                <span>Switch Role</span>
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showDrawerRoleSwitcher && (
              <div className="mt-1 bg-white rounded-xl border border-slate-200 shadow-lg py-1 space-y-0.5">
                {roles.map(r => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={async () => {
                      setShowDrawerRoleSwitcher(false);
                      setIsSidebarOpen(false);
                      if (onSwitchRole) {
                        await onSwitchRole(r.role);
                      } else if (quickSwitchRole) {
                        await quickSwitchRole(r.role);
                      }
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between text-xs cursor-pointer ${
                      r.role === 'Inventory Manager' ? 'bg-emerald-50 text-[#006B56] font-bold' : 'text-slate-700'
                    }`}
                  >
                    <span>{r.label}</span>
                    {r.role === 'Inventory Manager' && <span className="w-1.5 h-1.5 rounded-full bg-[#006B56]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN APPLICATION AREA */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* 1. FIXED STICKY TOP HEADER (Green Brand Header) */}
        <header className="bg-[#004D3F] px-3.5 sm:px-6 border-b border-[#003B30] text-white sticky top-0 z-40 shadow-md shrink-0 pt-safe">
          <div className="min-h-14 py-2 sm:py-2.5 flex items-center justify-between gap-2">
            {/* Left: Hamburger Button + ADRA Brand / Tab Title */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 -ml-1 text-white hover:bg-white/15 rounded-xl active:scale-95 transition cursor-pointer shrink-0"
            title="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>

          <div className="min-w-0 flex flex-col justify-center">
            <span className="text-base font-black text-white tracking-wider leading-tight">
              ADRA
            </span>
            <span className="text-[10px] text-emerald-200 font-medium leading-none">
              {currentUser?.role || 'Inventory Manager'}
            </span>
          </div>
        </div>

        {/* Right Controls: Notifications, Profile & Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Notification Center Bell */}
          <NotificationBellButton
            currentUser={currentUser}
            extraData={{
              dispatches,
              purchaseOrders,
              inventory
            }}
            onNavigate={(tab) => handleNavClick(tab)}
          />

          {/* User Profile Avatar Button */}
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition cursor-pointer shadow-2xs active:scale-95"
            title="My Profile"
          >
            <User className="w-4 h-4 text-white shrink-0" />
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout || authLogout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition active:scale-95 shadow-xs shrink-0 cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline font-bold">Logout</span>
          </button>
        </div>
      </div>
    </header>

      {/* 2. MAIN DASHBOARD CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-2.5 sm:py-6">
        
        {/* Loading Spinner */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#006B56] animate-spin" />
            <p className="text-xs font-bold text-slate-500">Synchronizing Logistics & Stock Catalogs...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* View 0: Executive Overview Dashboard */}
            {activeTab === 'overview' && (
              <InventoryOverviewView
                inventory={inventory}
                warehouses={warehouses}
                dispatches={dispatches}
                purchaseOrders={purchaseOrders}
                approvedRequests={approvedRequestsForDispatch}
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                  setIsSidebarOpen(false);
                  if (tab === 'dispatches') setIsDispatchesMenuOpen(true);
                }}
                onOpenReceiveModal={(item) => {
                  setSelectedReceiveItem(item && item.item_name ? item : null);
                  setReceiveModalOpen(true);
                }}
                onOpenCreateDispatchModal={(req) => {
                  setSelectedDispatchReq(req || null);
                  setActiveTab('dispatches-issue');
                }}
                onOpenCreatePOModal={() => {
                  setPoModalOpen(true);
                }}
              />
            )}

            {/* View 1: Stock Catalog */}
            {activeTab === 'stock' && (
               <InventoryStockView
                 inventory={inventory}
                 warehouses={warehouses}
                 approvedRequests={approvedRequestsForDispatch}
                 onNavigateTab={(tab) => {
                   setActiveTab(tab);
                   if (tab === 'dispatches') setIsDispatchesMenuOpen(true);
                 }}
                 onOpenReceiveModal={(item) => {
                   setSelectedReceiveItem(item && item.item_name ? item : null);
                   setReceiveModalOpen(true);
                 }}
                 onDeleteItem={handleDeleteInventoryItem}
                 onClearAllStock={handleClearAllStock}
               />
             )}

            {/* View 2: Aid Dispatches & Waybills */}
            {activeTab === 'dispatches' && (
              <InventoryDispatchesView
                dispatches={dispatches}
                approvedRequests={approvedRequestsForDispatch}
                statusFilter={dispatchStatusFilter}
                onStatusFilterChange={setDispatchStatusFilter}
                onOpenCreateDispatchModal={(req) => {
                  setSelectedDispatchReq(req || null);
                  setActiveTab('dispatches-issue');
                }}
                onOpenWaybillDetail={handleOpenWaybillDetail}
                onUpdateDispatchStatus={handleUpdateDispatchStatus}
              />
            )}

            {/* View 2B: Dedicated Issue Waybill Page */}
            {activeTab === 'dispatches-issue' && (
              <IssueWaybillView
                warehouses={warehouses}
                inventoryItems={inventory}
                approvedRequests={approvedRequestsForDispatch}
                selectedRequest={selectedDispatchReq}
                onDispatchSuccess={async (dispData) => {
                  await handleCreateDispatch(dispData);
                  setSelectedDispatchReq(null);
                  setActiveTab('dispatches');
                  setDispatchStatusFilter('IN_TRANSIT');
                }}
                onCancel={() => {
                  setSelectedDispatchReq(null);
                  setActiveTab('dispatches');
                }}
              />
            )}

            {/* View 3: Suppliers & Purchase Orders (4-Stage Lifecycle) */}
            {activeTab === 'suppliers' && (
              <InventorySuppliersView
                suppliers={suppliers}
                purchaseOrders={purchaseOrders}
                warehouses={warehouses}
                subTab={supplierSubTab}
                onSubTabChange={setSupplierSubTab}
                onOpenCreatePOModal={() => setPoModalOpen(true)}
                onSupplierDispatch={handleSupplierDispatch}
                onConfirmReceipt={handleConfirmReceipt}
                onPaySupplier={handlePaySupplier}
                onRejectAndReturnPO={handleRejectAndReturnPO}
                onCreateSupplier={handleCreateSupplier}
                onDeletePO={async (id) => {
                  await db.deletePurchaseOrder(id);
                  toast.success('Purchase Order deleted');
                  await loadData();
                }}
              />
            )}

            {/* View 4: State Depots */}
            {activeTab === 'warehouses' && (
              <InventoryWarehousesView
                warehouses={warehouses}
                inventory={inventory}
              />
            )}

            {/* View 5: Reports & Audit */}
            {activeTab === 'reports' && (
              <InventoryReportsView
                inventory={inventory}
                dispatches={dispatches}
                purchaseOrders={purchaseOrders}
                transactions={transactions}
                warehouses={warehouses}
              />
            )}
            {/* View 7: Officer Profile Fallback */}
            {activeTab === 'profile' && (
              <div className="bg-white sm:rounded-2xl sm:border border-slate-200 p-4 sm:p-6 sm:shadow-2xs max-w-xl space-y-4 -mx-2.5 -my-2.5 sm:mx-auto sm:my-6 min-h-[calc(100vh-120px)] sm:min-h-0">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden border border-emerald-600">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-slate-900 truncate">
                      {currentUser?.full_name || 'ADRA Logistics Officer'}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">
                      {currentUser?.email || 'inventory@adra.org'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {currentUser?.role || 'Inventory Manager'}
                      </span>
                      <span className="text-[10px] text-slate-400">ADRA South Sudan</span>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(true)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer active:scale-98"
                  >
                    Manage Account & Role
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                  >
                    Back to Overview
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* 4. MODALS */}
      {/* Receive Stock Modal */}
      <ReceiveStockModal
        isOpen={receiveModalOpen}
        onClose={() => {
          setReceiveModalOpen(false);
          setSelectedReceiveItem(null);
        }}
        warehouses={warehouses}
        suppliers={suppliers}
        inventoryItems={inventory}
        purchaseOrders={purchaseOrders}
        selectedItem={selectedReceiveItem}
        onReceiveSuccess={handleReceiveStock}
      />

      {/* Create Waybill Dispatch Modal */}
      <CreateDispatchModal
        isOpen={dispatchModalOpen}
        onClose={() => {
          setDispatchModalOpen(false);
          setSelectedDispatchReq(null);
        }}
        warehouses={warehouses}
        inventoryItems={inventory}
        approvedRequests={approvedRequestsForDispatch}
        preselectedRequest={selectedDispatchReq}
        onDispatchSuccess={handleCreateDispatch}
      />

      {/* Create Purchase Order Modal */}
      <CreatePOModal
        isOpen={poModalOpen}
        onClose={() => setPoModalOpen(false)}
        suppliers={suppliers}
        warehouses={warehouses}
        onPOSuccess={handleCreatePO}
      />

      {/* Waybill Detail Modal */}
      <WaybillDetailModal
        isOpen={waybillModalOpen}
        onClose={() => {
          setWaybillModalOpen(false);
          setSelectedWaybill(null);
        }}
        dispatch={selectedWaybill}
        onUpdateStatus={handleUpdateDispatchStatus}
        onIssueWaybill={(req) => {
          setSelectedDispatchReq(req || null);
          setActiveTab('dispatches-issue');
        }}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onLogout={onLogout || authLogout}
        onSwitchRole={onSwitchRole}
      />


      </div>
    </div>
  );
}
