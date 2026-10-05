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
  Search,
  Bell,
  Home
} from 'lucide-react';
import { db } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// Subviews
import { InventoryStockView } from './components/InventoryStockView';
import { InventoryDispatchesView } from './components/InventoryDispatchesView';
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

  // Active Tab: 'stock' | 'dispatches' | 'suppliers' | 'resources' | 'warehouses' | 'reports'
  const [activeTab, setActiveTab] = useState('stock');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

  // Filter PM-approved requests that are staged for warehouse dispatch
  const approvedRequestsForDispatch = useMemo(() => {
    return assistanceRequests.filter(r => 
      r.status === 'approved_by_pm' || 
      r.status === 'endorsed' || 
      r.status === 'supervisor_approved' ||
      (r.verification_status === 'Approved' && !r.qr_token)
    );
  }, [assistanceRequests]);

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
    await loadData();
    return res;
  };

  const handleCreatePO = async (poData) => {
    const res = await db.createPurchaseOrder(poData);
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

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false);
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

  const lowStockAlertsCount = useMemo(() => {
    return inventory.filter(i => i.status === 'Low Stock' || (i.quantity > 0 && i.quantity < (i.min_threshold || 10))).length;
  }, [inventory]);

  const inTransitWaybillsCount = useMemo(() => {
    return dispatches.filter(d => d.status === 'In Transit').length;
  }, [dispatches]);

  const activeTabTitle = useMemo(() => {
    switch (activeTab) {
      case 'stock': return 'Stock Catalog';
      case 'dispatches': return 'Aid Dispatches & Waybills';
      case 'suppliers': return 'Suppliers & Purchase Orders';
      case 'resources': return 'Fleet & Capital Assets';
      case 'warehouses': return 'State Relief Depots';
      case 'reports': return 'Reports & Audit Ledger';
      default: return 'Logistics & Supply Chain';
    }
  }, [activeTab]);

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
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#006B56] text-white flex items-center justify-center font-black text-xs shadow-xs">
              ADRA
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-[#006B56] block leading-tight">
                ADRA Logistics Hub
              </span>
              <span className="text-[10px] text-slate-500 font-semibold block">
                Warehouse & Stock Control
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Manager Profile Card */}
        <div className="p-2.5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-xs">
                {(currentUser?.full_name || currentUser?.name || 'Gabriel Majok')
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-xs text-slate-900 block truncate">
                  {currentUser?.full_name || currentUser?.name || 'Gabriel Majok'}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold block truncate">
                  Inventory Manager
                </span>
              </div>
            </div>
          </div>

          {/* Scope Filter inside drawer */}
          <div className="mt-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase px-1 block mb-1">
              Active Depot Scope
            </label>
            <div className="relative">
              <select
                value={selectedDepotScope}
                onChange={(e) => {
                  setSelectedDepotScope(e.target.value);
                  setIsSidebarOpen(false);
                }}
                className="w-full pl-2.5 pr-7 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#006B56] cursor-pointer appearance-none truncate shadow-2xs"
              >
                <option value="ALL">All State Depots ({warehouses.length})</option>
                {warehouses.map(w => (
                  <option key={w.id || w.code} value={w.name}>{w.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 3. Navigation List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1 text-xs font-semibold">
          
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
          <button
            type="button"
            onClick={() => handleNavClick('dispatches')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
              activeTab === 'dispatches'
                ? 'bg-[#006B56] text-white font-bold shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Truck className={`w-4 h-4 ${activeTab === 'dispatches' ? 'text-white' : 'text-blue-600'}`} />
              <span>Aid Dispatches & Waybills</span>
            </div>
            {approvedRequestsForDispatch.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                activeTab === 'dispatches' ? 'bg-white text-[#006B56]' : 'bg-emerald-100 text-emerald-900'
              }`}>
                {approvedRequestsForDispatch.length}
              </span>
            )}
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
            <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded-md">
              {purchaseOrders.length}
            </span>
          </button>

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

          {activeTab !== 'stock' ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                type="button"
                onClick={() => setActiveTab('stock')}
                className="p-1 text-slate-500 hover:text-[#006B56] rounded-lg hover:bg-slate-100 transition cursor-pointer shrink-0"
                title="Back to Stock Catalog"
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* Loading Spinner */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#006B56] animate-spin" />
            <p className="text-xs font-bold text-slate-500">Synchronizing Logistics & Stock Catalogs...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* View 1: Stock Catalog */}
            {activeTab === 'stock' && (
              <InventoryStockView
                inventory={inventory}
                warehouses={warehouses}
                onOpenReceiveModal={() => setReceiveModalOpen(true)}
                onOpenAdjustModal={() => {
                  setSelectedAdjustItem(null);
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
                onOpenCreateDispatchModal={() => setDispatchModalOpen(true)}
                onOpenWaybillDetail={handleOpenWaybillDetail}
                onUpdateDispatchStatus={handleUpdateDispatchStatus}
              />
            )}

            {/* View 3: Suppliers & Purchase Orders */}
            {activeTab === 'suppliers' && (
              <InventorySuppliersView
                suppliers={suppliers}
                purchaseOrders={purchaseOrders}
                onOpenCreatePOModal={() => setPoModalOpen(true)}
                onOpenReceiveStockFromPO={handleOpenReceiveFromPO}
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
        onClose={() => setReceiveModalOpen(false)}
        warehouses={warehouses}
        suppliers={suppliers}
        inventoryItems={inventory}
        purchaseOrders={purchaseOrders}
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
        onClose={() => setDispatchModalOpen(false)}
        warehouses={warehouses}
        inventoryItems={inventory}
        approvedRequests={approvedRequestsForDispatch}
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
