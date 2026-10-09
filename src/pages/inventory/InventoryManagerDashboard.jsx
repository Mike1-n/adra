import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Truck,
  Building2,
  ShoppingCart,
  Radio,
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
  Plus,
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
import { InventoryResourcesView } from './components/InventoryResourcesView';
import { InventoryWarehousesView } from './components/InventoryWarehousesView';
import { InventoryReportsView } from './components/InventoryReportsView';

// Modals
import { ReceiveStockModal } from './components/ReceiveStockModal';
import { StockAdjustmentModal } from './components/StockAdjustmentModal';
import { CreateDispatchModal } from './components/CreateDispatchModal';
import { CreatePOModal } from './components/CreatePOModal';
import { WaybillDetailModal } from './components/WaybillDetailModal';

export function InventoryManagerDashboard({
  currentUser,
  onLogout,
  onSwitchRole,
  onBackToFieldApp
}) {
  const { logout: authLogout, quickSwitchRole } = useAuth();
  const toast = useToast();

  // Active Tab: 'overview' | 'stock' | 'dispatches' | 'suppliers' | 'resources' | 'warehouses' | 'reports'
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDispatchesMenuOpen, setIsDispatchesMenuOpen] = useState(false);
  const [isSuppliersMenuOpen, setIsSuppliersMenuOpen] = useState(false);
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
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedAdjustItem, setSelectedAdjustItem] = useState(null);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [waybillModalOpen, setWaybillModalOpen] = useState(false);
  const [selectedWaybill, setSelectedWaybill] = useState(null);

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
      setPurchaseOrders(poData || []);
      setDispatches(dispData || []);
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
      if (d.beneficiary_code) dispatchedKeys.add(String(d.beneficiary_code).toLowerCase().trim());
      if (d.beneficiary_name) {
        const cleanName = d.beneficiary_name.split('(')[0].toLowerCase().trim();
        if (cleanName) dispatchedKeys.add(cleanName);
      }
    });

    return assistanceRequests.filter(r => {
      if (!r) return false;
      const rId = String(r.id || '').toLowerCase().trim();
      const rCode = String(r.request_code || r.tracking_number || '').toLowerCase().trim();
      const rBenName = String(r.beneficiary_name || r.full_name || '').toLowerCase().trim();

      // If already linked to an issued waybill dispatch, remove immediately from staging queue
      if (dispatchedKeys.has(rId) || dispatchedKeys.has(rCode) || (rBenName && dispatchedKeys.has(rBenName))) {
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

  const handleAdjustStock = async (adjData) => {
    const res = await db.adjustStock(adjData);
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
    setDispatches([...updatedDispatches]);
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

  const handleOpenAdjustForItem = (item) => {
    setSelectedAdjustItem(item);
    setAdjustModalOpen(true);
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

  const inTransitWaybillsCount = useMemo(() => {
    return dispatches.filter(d => {
      const st = (d.status || '').toLowerCase().trim();
      const dst = (d.dispatch_status || '').toLowerCase().trim();
      return st === 'in transit' || st === 'warehouse_dispatched' || st.includes('transit') || dst === 'in transit';
    }).length;
  }, [dispatches]);

  const deliveredWaybillsCount = useMemo(() => {
    return dispatches.filter(d => {
      const st = (d.status || '').toLowerCase().trim();
      const dst = (d.dispatch_status || '').toLowerCase().trim();
      return st.includes('deliver') || st.includes('arrived') || st === 'goods_arrived_at_hub' || dst.includes('arrived');
    }).length;
  }, [dispatches]);

  const stagedWaybillsCount = useMemo(() => {
    return approvedRequestsForDispatch.length;
  }, [approvedRequestsForDispatch]);

  const getPOStage = (po) => {
    if (po.stage) return Number(po.stage);
    if (po.status === 'Paid & Settled' || po.payment_status === 'Paid') return 4;
    if (po.status?.includes('Received') || po.status?.includes('Confirmed') || po.grn_number) return 3;
    if (po.status?.includes('Transit') || po.status?.includes('Supplied') || po.waybill_number) return 2;
    return 1;
  };

  const poPipelineStats = useMemo(() => {
    let stage1Count = 0;
    let stage2Count = 0;
    let stage3Count = 0;
    let stage4Count = 0;

    purchaseOrders.forEach(po => {
      const st = getPOStage(po);
      if (st === 1) stage1Count++;
      else if (st === 2) stage2Count++;
      else if (st === 3) stage3Count++;
      else if (st === 4) stage4Count++;
    });

    return {
      total: purchaseOrders.length,
      stage1Count,
      stage2Count,
      stage3Count,
      stage4Count
    };
  }, [purchaseOrders]);

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
      case 'resources': return 'Fleet & Capital Assets';
      case 'warehouses': return 'State Relief Depots';
      case 'reports': return 'Reports & Audit Ledger';
      default: return 'Logistics & Supply Chain';
    }
  }, [activeTab, dispatchStatusFilter, supplierSubTab]);

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const toggleDispatchesMenu = (forceOpen) => {
    if (forceOpen === true) {
      setIsDispatchesMenuOpen(true);
      setIsSuppliersMenuOpen(false);
    } else if (forceOpen === false) {
      setIsDispatchesMenuOpen(false);
    } else {
      setIsDispatchesMenuOpen(prev => {
        const next = !prev;
        if (next) setIsSuppliersMenuOpen(false);
        return next;
      });
    }
  };

  const toggleSuppliersMenu = (forceOpen) => {
    if (forceOpen === true) {
      setIsSuppliersMenuOpen(true);
      setIsDispatchesMenuOpen(false);
    } else if (forceOpen === false) {
      setIsSuppliersMenuOpen(false);
    } else {
      setIsSuppliersMenuOpen(prev => {
        const next = !prev;
        if (next) setIsDispatchesMenuOpen(false);
        return next;
      });
    }
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
        {/* 1. Drawer Header Brand */}
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
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

          {/* Aid Dispatches & Waybills */}
          <div className="space-y-1">
            <div
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition ${
                activeTab === 'dispatches'
                  ? 'bg-[#006B56] text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setActiveTab('dispatches');
                  toggleDispatchesMenu();
                }}
                className="flex items-center space-x-2.5 min-w-0 flex-1 text-left cursor-pointer"
              >
                <Truck className={`w-4 h-4 shrink-0 ${activeTab === 'dispatches' ? 'text-white' : 'text-blue-600'}`} />
                <span className="truncate">Aid Dispatches & Waybills</span>
              </button>

              <div className="flex items-center gap-1 shrink-0 ml-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                  activeTab === 'dispatches' ? 'bg-white text-[#006B56]' : 'bg-emerald-100 text-emerald-900'
                }`}>
                  {dispatches.length}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDispatchesMenu();
                  }}
                  className={`p-1 rounded-md transition hover:bg-black/10 cursor-pointer ${
                    activeTab === 'dispatches' ? 'text-white' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title={isDispatchesMenuOpen ? 'Collapse sub-menu' : 'Expand sub-menu'}
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isDispatchesMenuOpen ? 'rotate-180' : ''
                  }`} />
                </button>
              </div>
            </div>

            {/* Collapsible Sub-Filters & Quick Action for Dispatches */}
            {isDispatchesMenuOpen && (
              <div className="pl-3 pr-1 py-1.5 space-y-1.5 bg-slate-50/90 rounded-xl border border-slate-200/80 my-1">
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('dispatches');
                      setDispatchStatusFilter('ALL');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      activeTab === 'dispatches' && dispatchStatusFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span>All</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {dispatches.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('dispatches');
                      setDispatchStatusFilter('IN_TRANSIT');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      activeTab === 'dispatches' && dispatchStatusFilter === 'IN_TRANSIT'
                        ? 'bg-amber-100/90 text-amber-950 shadow-2xs border border-amber-300 font-extrabold'
                        : 'text-amber-900/80 hover:text-amber-950 hover:bg-amber-50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      In Transit
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-950 font-black">
                      {inTransitWaybillsCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('dispatches');
                      setDispatchStatusFilter('DELIVERED');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      activeTab === 'dispatches' && dispatchStatusFilter === 'DELIVERED'
                        ? 'bg-emerald-100/90 text-emerald-950 shadow-2xs border border-emerald-300 font-extrabold'
                        : 'text-emerald-900/80 hover:text-emerald-950 hover:bg-emerald-50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Delivered
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-200/80 text-emerald-950 font-black">
                      {deliveredWaybillsCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('dispatches');
                      setDispatchStatusFilter('STAGED');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      activeTab === 'dispatches' && dispatchStatusFilter === 'STAGED'
                        ? 'bg-indigo-100/90 text-indigo-950 shadow-2xs border border-indigo-300 font-extrabold'
                        : 'text-indigo-900/80 hover:text-indigo-950 hover:bg-indigo-50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      Staged
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-200/80 text-indigo-950 font-black">
                      {stagedWaybillsCount}
                    </span>
                  </button>
                </div>

                {/* Dedicated Issue Waybill Sub-Page Link */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('dispatches-issue');
                  }}
                  className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-[0.99] cursor-pointer mt-1 ${
                    activeTab === 'dispatches-issue'
                      ? 'bg-[#006B56] text-white ring-2 ring-emerald-400'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Issue Waybill</span>
                </button>
              </div>
            )}
          </div>

          {/* Suppliers & Purchase Orders */}
          <div className="space-y-1">
            <div
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition ${
                activeTab === 'suppliers'
                  ? 'bg-[#006B56] text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setActiveTab('suppliers');
                  toggleSuppliersMenu();
                }}
                className="flex items-center space-x-2.5 min-w-0 flex-1 text-left cursor-pointer"
              >
                <ShoppingCart className={`w-4 h-4 shrink-0 ${activeTab === 'suppliers' ? 'text-white' : 'text-teal-600'}`} />
                <span className="truncate">Suppliers & Purchase Orders</span>
              </button>

              <div className="flex items-center gap-1 shrink-0 ml-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                  activeTab === 'suppliers' ? 'bg-white text-[#006B56]' : 'bg-slate-100 text-slate-700'
                }`}>
                  {purchaseOrders.length}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSuppliersMenu();
                  }}
                  className={`p-1 rounded-md transition hover:bg-black/10 cursor-pointer ${
                    activeTab === 'suppliers' ? 'text-white' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title={isSuppliersMenuOpen ? 'Collapse sub-menu' : 'Expand sub-menu'}
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isSuppliersMenuOpen ? 'rotate-180' : ''
                  }`} />
                </button>
              </div>
            </div>

            {/* Collapsible Sub-Filters for Suppliers & Purchase Orders */}
            {isSuppliersMenuOpen && (
              <div className="pl-3 pr-1 py-1.5 space-y-1.5 bg-slate-50/90 rounded-xl border border-slate-200/80 my-1">
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('suppliers');
                      setSupplierSubTab('all');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      activeTab === 'suppliers' && supplierSubTab === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span>All Orders</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {poPipelineStats.total}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('suppliers');
                      setSupplierSubTab('stage1');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      activeTab === 'suppliers' && supplierSubTab === 'stage1'
                        ? 'bg-amber-100/90 text-amber-950 shadow-2xs border border-amber-300 font-extrabold'
                        : 'text-amber-900/80 hover:text-amber-950 hover:bg-amber-50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Requested
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-950 font-black">
                      {poPipelineStats.stage1Count}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('suppliers');
                      setSupplierSubTab('stage2');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      activeTab === 'suppliers' && supplierSubTab === 'stage2'
                        ? 'bg-blue-100/90 text-blue-950 shadow-2xs border border-blue-300 font-extrabold'
                        : 'text-blue-900/80 hover:text-blue-950 hover:bg-blue-50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      In Transit
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-200/80 text-blue-950 font-black">
                      {poPipelineStats.stage2Count}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('suppliers');
                      setSupplierSubTab('stage3');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      activeTab === 'suppliers' && supplierSubTab === 'stage3'
                        ? 'bg-emerald-100/90 text-emerald-950 shadow-2xs border border-emerald-300 font-extrabold'
                        : 'text-emerald-900/80 hover:text-emerald-950 hover:bg-emerald-50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#006B56]" />
                      GRN Received
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-200/80 text-emerald-950 font-black">
                      {poPipelineStats.stage3Count}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('suppliers');
                      setSupplierSubTab('stage4');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      activeTab === 'suppliers' && supplierSubTab === 'stage4'
                        ? 'bg-teal-100/90 text-teal-950 shadow-2xs border border-teal-300 font-extrabold'
                        : 'text-teal-900/80 hover:text-teal-950 hover:bg-teal-50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                      Paid
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-teal-200/80 text-teal-950 font-black">
                      {poPipelineStats.stage4Count}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('suppliers');
                      setSupplierSubTab('suppliers');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      activeTab === 'suppliers' && supplierSubTab === 'suppliers'
                        ? 'bg-[#006B56]/10 text-[#006B56] shadow-2xs border border-[#006B56]/30 font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      Suppliers Directory
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {suppliers.length}
                    </span>
                  </button>
                </div>

                {/* Quick Action: Request Supplies */}
                <button
                  type="button"
                  onClick={() => {
                    setPoModalOpen(true);
                  }}
                  className="w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-[0.99] cursor-pointer mt-1 bg-[#006B56] hover:bg-[#005443] text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Request Supplies</span>
                </button>
              </div>
            )}
          </div>

          {/* Fleet & Capital Resources */}
          <button
            type="button"
            onClick={() => handleNavClick('resources')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeTab === 'resources'
                ? 'bg-[#006B56] text-white font-bold shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Radio className={`w-4 h-4 ${activeTab === 'resources' ? 'text-white' : 'text-indigo-600'}`} />
              <span>Fleet & Capital Assets</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded-md">
              {resources.length}
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

          {/* Logout Button in Drawer */}
          <button
            type="button"
            onClick={() => {
              setIsSidebarOpen(false);
              if (onLogout) onLogout();
              else if (authLogout) authLogout();
            }}
            className="w-full flex items-center justify-center space-x-2 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN APPLICATION AREA */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* 1. FIXED STICKY TOP HEADER */}
        <header className="bg-white px-3.5 py-2.5 sm:px-6 sm:py-3 border-b border-slate-200 sticky top-0 z-40 shadow-2xs flex items-center justify-between gap-2 shrink-0">
        
        {/* Left: Hamburger Button + ADRA Brand / Tab Title */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 -ml-1 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 active:scale-95 transition cursor-pointer shrink-0"
            title="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 text-slate-800" />
          </button>

          {activeTab !== 'overview' ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="p-1 text-slate-500 hover:text-[#006B56] rounded-lg hover:bg-slate-100 transition cursor-pointer shrink-0"
                title="Back to Overview Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="font-black text-xs sm:text-sm text-slate-900 truncate">
                {activeTabTitle}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#006B56] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                A
              </div>
              <div className="min-w-0">
                <span className="font-black text-sm text-slate-900 tracking-tight leading-none block truncate">
                  ADRA South Sudan
                </span>
                <span className="text-[10px] text-[#006B56] font-extrabold uppercase tracking-wider block mt-0.5">
                  Logistics & Supply Chain
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Controls: Refresh, Notifications / Alerts, Profile Avatar Dropdown */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Live Sync / Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Sync DB Records"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#006B56]' : ''}`} />
          </button>

          {/* Low Stock Alerts / Bell */}
          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center relative border border-slate-200/80 transition cursor-pointer shadow-2xs shrink-0"
            title="Low Stock Alerts"
          >
            <AlertTriangle className={`w-4 h-4 ${lowStockAlertsCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
            {lowStockAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full text-[8px] font-black flex items-center justify-center shadow-xs">
                {lowStockAlertsCount}
              </span>
            )}
          </button>

          {/* User Profile Avatar Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="w-8 h-8 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#006B56] border border-emerald-200 flex items-center justify-center transition cursor-pointer shadow-2xs shrink-0"
              title="Profile & Role Switcher"
            >
              <User className="w-4 h-4" />
            </button>

            {/* Click-outside backdrop */}
            {isRoleDropdownOpen && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsRoleDropdownOpen(false)} 
              />
            )}

            {/* Role Switcher Popover */}
            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-68 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2.5 border-b border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Active Profile
                  </p>
                  <p className="text-xs font-extrabold text-slate-900 mt-0.5 truncate">
                    {currentUser?.full_name || currentUser?.name || 'Gabriel Majok'}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-bold">
                    Inventory Manager
                  </p>
                </div>

                <div className="p-1.5">
                  <p className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 tracking-wider">
                    Switch Role
                  </p>
                  <div className="space-y-0.5">
                    {roles.map((r) => (
                      <button
                        key={r.role}
                        type="button"
                        onClick={async () => {
                          setIsRoleDropdownOpen(false);
                          if (onSwitchRole) {
                            await onSwitchRole(r.role);
                          } else if (quickSwitchRole) {
                            await quickSwitchRole(r.role);
                          }
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                          r.role === 'Inventory Manager'
                            ? 'bg-emerald-50 text-[#006B56] font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{r.label}</span>
                        {r.role === 'Inventory Manager' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#006B56]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-1.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRoleDropdownOpen(false);
                      if (onLogout) onLogout();
                      else if (authLogout) authLogout();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
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
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                  setIsSidebarOpen(false);
                }}
                onOpenReceiveModal={(item) => {
                  setSelectedReceiveItem(item && item.item_name ? item : null);
                  setReceiveModalOpen(true);
                }}
                onOpenAdjustModal={(item) => {
                  setSelectedAdjustItem(item || null);
                  setAdjustModalOpen(true);
                }}
                onOpenCreateDispatchModal={() => {
                  setSelectedDispatchReq(null);
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
                 onOpenReceiveModal={(item) => {
                   setSelectedReceiveItem(item && item.item_name ? item : null);
                   setReceiveModalOpen(true);
                 }}
                 onOpenAdjustModal={(item) => {
                   setSelectedAdjustItem(item || null);
                   setAdjustModalOpen(true);
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
                onDispatchSuccess={async (dispData) => {
                  await handleCreateDispatch(dispData);
                  setActiveTab('dispatches');
                  setDispatchStatusFilter('IN_TRANSIT');
                }}
                onCancel={() => setActiveTab('dispatches')}
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

            {/* View 4: Fleet & Capital Assets */}
            {activeTab === 'resources' && (
              <InventoryResourcesView
                resources={resources}
                warehouses={warehouses}
              />
            )}

            {/* View 5: State Depots */}
            {activeTab === 'warehouses' && (
              <InventoryWarehousesView
                warehouses={warehouses}
                inventory={inventory}
              />
            )}

            {/* View 6: Reports & Audit */}
            {activeTab === 'reports' && (
              <InventoryReportsView
                inventory={inventory}
                dispatches={dispatches}
                purchaseOrders={purchaseOrders}
                transactions={transactions}
                warehouses={warehouses}
              />
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

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={adjustModalOpen}
        onClose={() => {
          setAdjustModalOpen(false);
          setSelectedAdjustItem(null);
        }}
        inventoryItems={inventory}
        warehouses={warehouses}
        selectedItem={selectedAdjustItem}
        onAdjustSuccess={handleAdjustStock}
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
      />
      </div>
    </div>
  );
}
