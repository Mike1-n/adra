import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  ShoppingCart,
  Truck,
  PackageCheck,
  DollarSign,
  Star,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  LogOut,
  RefreshCw,
  Search,
  Eye,
  FileText,
  Landmark,
  User,
  ShieldCheck,
  Receipt,
  Layers,
  ArrowRight,
  Edit3,
  PlusCircle,
  Save,
  X,
  RotateCcw,
  XCircle,
  Menu,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { db } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SupplierDispatchModal } from '../inventory/components/SupplierDispatchModal';
import { PODetailModal } from '../inventory/components/PODetailModal';
import { AdraLogo } from '../../components/common/AdraLogo';

export function SupplierPortalApp({
  currentUser,
  onLogout,
  onSwitchRole,
  onBackToFieldApp
}) {
  const { logout, quickSwitchRole } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'orders' | 'intransit' | 'confirmed' | 'payments' | 'returned' | 'profile'
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(true);

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Modals
  const [selectedPOForDispatch, setSelectedPOForDispatch] = useState(null);
  const [selectedPOForDetail, setSelectedPOForDetail] = useState(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    company_name: '',
    category: 'General Humanitarian Supplies',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    bank_name: '',
    bank_account_no: '',
    swift_code: '',
    mobile_money_number: ''
  });

  // Load all POs & supplier data
  const loadData = async () => {
    try {
      setLoading(true);
      const [poList, supList] = await Promise.all([
        db.getPurchaseOrders(),
        db.getSuppliers()
      ]);
      setPurchaseOrders(poList || []);
      setSuppliers(supList || []);
    } catch (err) {
      console.error('Error loading supplier portal:', err);
      toast.error('Failed to load supplier portal data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper for stage determination
  const getPOStage = (po) => {
    if (po.stage === -1 || Number(po.stage) === -1 || po.status === 'Returned & Rejected' || po.status?.includes('Returned') || po.status?.includes('Rejected')) return -1;
    if (po.stage) return Number(po.stage);
    if (po.status === 'Paid & Settled' || po.payment_status === 'Paid') return 4;
    if (po.status?.includes('Received') || po.status?.includes('Confirmed') || po.grn_number) return 3;
    if (po.status?.includes('Transit') || po.status?.includes('Supplied') || po.waybill_number) return 2;
    return 1;
  };

  // Find matching supplier profile for current user
  const currentSupplier = useMemo(() => {
    if (!currentUser) return suppliers[0] || null;
    return (
      suppliers.find(s => s.email?.toLowerCase() === currentUser.email?.toLowerCase()) ||
      suppliers.find(s => s.company_name?.toLowerCase() === currentUser.department?.toLowerCase()) ||
      suppliers.find(s => s.contact_person?.toLowerCase() === currentUser.full_name?.toLowerCase()) ||
      suppliers[0] ||
      null
    );
  }, [suppliers, currentUser]);

  // Sync profile form when currentSupplier changes
  useEffect(() => {
    if (currentSupplier) {
      setProfileForm({
        company_name: currentSupplier.company_name || '',
        category: currentSupplier.category || 'General Humanitarian Supplies',
        contact_person: currentSupplier.contact_person || currentUser?.full_name || '',
        phone: currentSupplier.phone || currentUser?.phone || '',
        email: currentSupplier.email || currentUser?.email || '',
        address: currentSupplier.address || '',
        bank_name: currentSupplier.bank_name || '',
        bank_account_no: currentSupplier.bank_account_no || '',
        swift_code: currentSupplier.swift_code || '',
        mobile_money_number: currentSupplier.mobile_money_number || ''
      });
    } else if (currentUser) {
      setProfileForm({
        company_name: currentUser.department || 'My Supplier Company',
        category: 'General Humanitarian Supplies',
        contact_person: currentUser.full_name || '',
        phone: currentUser.phone || '',
        email: currentUser.email || '',
        address: '',
        bank_name: '',
        bank_account_no: '',
        swift_code: '',
        mobile_money_number: ''
      });
    }
  }, [currentSupplier, currentUser]);

  // Filter purchase orders directed to this supplier (or all POs if demo)
  const myPurchaseOrders = useMemo(() => {
    if (!currentSupplier) return purchaseOrders;
    return purchaseOrders.filter(po => 
      po.supplier_id === currentSupplier.id ||
      po.supplier_name?.toLowerCase() === currentSupplier.company_name?.toLowerCase() ||
      po.supplier_email?.toLowerCase() === currentUser?.email?.toLowerCase()
    );
  }, [purchaseOrders, currentSupplier, currentUser]);

  const displayedPOs = myPurchaseOrders.length > 0 ? myPurchaseOrders : purchaseOrders;

  const filteredPOs = useMemo(() => {
    return displayedPOs.filter(po => {
      const q = searchTerm.toLowerCase();
      const matches =
        (po.po_number || '').toLowerCase().includes(q) ||
        (po.items_summary || '').toLowerCase().includes(q) ||
        (po.warehouse_destination || '').toLowerCase().includes(q) ||
        (po.supplier_invoice_number || '').toLowerCase().includes(q) ||
        (po.grn_number || '').toLowerCase().includes(q);

      if (!matches) return false;

      const stage = getPOStage(po);
      if (activeTab === 'orders' && stage !== 1) return false;
      if (activeTab === 'intransit' && stage !== 2) return false;
      if (activeTab === 'confirmed' && stage !== 3) return false;
      if (activeTab === 'payments' && stage !== 4) return false;
      if (activeTab === 'returned' && stage !== -1) return false;

      return true;
    });
  }, [displayedPOs, searchTerm, activeTab]);

  const supplierStats = useMemo(() => {
    let pendingCount = 0;
    let inTransitCount = 0;
    let grnConfirmedCount = 0;
    let paidCount = 0;
    let returnedCount = 0;
    let totalEarnings = 0;

    displayedPOs.forEach(po => {
      const stage = getPOStage(po);
      const val = Number(po.total_amount) || 0;
      if (stage === 1) pendingCount++;
      else if (stage === 2) inTransitCount++;
      else if (stage === 3) grnConfirmedCount++;
      else if (stage === 4) {
        paidCount++;
        totalEarnings += val;
      } else if (stage === -1) {
        returnedCount++;
      }
    });

    return { total: displayedPOs.length, pendingCount, inTransitCount, grnConfirmedCount, paidCount, returnedCount, totalEarnings };
  }, [displayedPOs]);

  const handleDispatchSuccess = async (poId, dispatchData) => {
    await db.supplierDispatchPO(poId, dispatchData);
    await loadData();
  };

  const handleSaveProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.company_name?.trim()) {
      toast.warning('Please enter your Company Name.');
      return;
    }

    try {
      if (currentSupplier?.id) {
        await db.updateSupplier(currentSupplier.id, profileForm);
        toast.success('Supplier profile & banking details updated.');
      } else {
        await db.createSupplier({
          ...profileForm,
          email: profileForm.email || currentUser?.email,
          contact_person: profileForm.contact_person || currentUser?.full_name
        });
        toast.success('Supplier profile registered successfully.');
      }
      setIsEditProfileOpen(false);
      await loadData();
    } catch (err) {
      console.error('Error saving supplier profile:', err);
      toast.error('Failed to save profile.');
    }
  };

  const companyDisplayName = currentSupplier?.company_name || profileForm.company_name || currentUser?.department || 'My Supplier Portal';

  const handleDeletePO = async (poId) => {
    try {
      await db.deletePurchaseOrder(poId);
      toast.success('Purchase Order deleted.');
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete PO.');
    }
  };

  // Reusable Navigation Items for both Desktop Sidebar & Mobile Drawer
  const renderNavLinks = (onItemClick) => (
    <div className="space-y-1">
      <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600">
        Fulfillment Stages
      </div>

      {/* All Orders */}
      <button
        type="button"
        onClick={() => {
          setActiveTab('all');
          if (onItemClick) onItemClick();
        }}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-left ${
          activeTab === 'all'
            ? 'bg-[#006B56] text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <ShoppingCart className="w-4 h-4 shrink-0" />
          <span>All Orders</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
          activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
        }`}>
          {supplierStats.total}
        </span>
      </button>

      {/* New Requests */}
      <button
        type="button"
        onClick={() => {
          setActiveTab('orders');
          if (onItemClick) onItemClick();
        }}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-left ${
          activeTab === 'orders'
            ? 'bg-[#006B56] text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Clock className={`w-4 h-4 shrink-0 ${activeTab === 'orders' ? 'text-amber-200' : 'text-amber-700'}`} />
          <span>New Requests</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
          activeTab === 'orders' 
            ? 'bg-amber-400 text-amber-950' 
            : supplierStats.pendingCount > 0 
              ? 'bg-amber-100 text-amber-900 border border-amber-200' 
              : 'bg-slate-100 text-slate-500'
        }`}>
          {supplierStats.pendingCount}
        </span>
      </button>

      {/* In Transit */}
      <button
        type="button"
        onClick={() => {
          setActiveTab('intransit');
          if (onItemClick) onItemClick();
        }}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-left ${
          activeTab === 'intransit'
            ? 'bg-[#006B56] text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Truck className={`w-4 h-4 shrink-0 ${activeTab === 'intransit' ? 'text-blue-200' : 'text-blue-700'}`} />
          <span>In Transit</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
          activeTab === 'intransit'
            ? 'bg-blue-300 text-blue-950'
            : supplierStats.inTransitCount > 0
              ? 'bg-blue-100 text-blue-900 border border-blue-200'
              : 'bg-slate-100 text-slate-500'
        }`}>
          {supplierStats.inTransitCount}
        </span>
      </button>

      {/* Accepted & GRN */}
      <button
        type="button"
        onClick={() => {
          setActiveTab('confirmed');
          if (onItemClick) onItemClick();
        }}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-left ${
          activeTab === 'confirmed'
            ? 'bg-[#006B56] text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <PackageCheck className={`w-4 h-4 shrink-0 ${activeTab === 'confirmed' ? 'text-emerald-200' : 'text-[#006B56]'}`} />
          <span>Accepted & GRN</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
          activeTab === 'confirmed'
            ? 'bg-emerald-300 text-emerald-950'
            : supplierStats.grnConfirmedCount > 0
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
              : 'bg-slate-100 text-slate-500'
        }`}>
          {supplierStats.grnConfirmedCount}
        </span>
      </button>

      {/* Paid */}
      <button
        type="button"
        onClick={() => {
          setActiveTab('payments');
          if (onItemClick) onItemClick();
        }}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-left ${
          activeTab === 'payments'
            ? 'bg-[#006B56] text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <DollarSign className={`w-4 h-4 shrink-0 ${activeTab === 'payments' ? 'text-teal-200' : 'text-teal-700'}`} />
          <span>Paid</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
          activeTab === 'payments'
            ? 'bg-teal-300 text-teal-950'
            : supplierStats.paidCount > 0
              ? 'bg-teal-100 text-teal-900 border border-teal-200'
              : 'bg-slate-100 text-slate-500'
        }`}>
          {supplierStats.paidCount}
        </span>
      </button>

      {/* Divider for Exceptions & Management */}
      <div className="my-2 border-t border-slate-100" />
      <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">
        Exceptions & Profile
      </div>

      {/* Returned / Rejected */}
      <button
        type="button"
        onClick={() => {
          setActiveTab('returned');
          if (onItemClick) onItemClick();
        }}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-left ${
          activeTab === 'returned'
            ? 'bg-rose-600 text-white shadow-xs'
            : supplierStats.returnedCount > 0
              ? 'text-rose-700 bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200/60'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <XCircle className={`w-4 h-4 shrink-0 ${activeTab === 'returned' ? 'text-white' : 'text-rose-600'}`} />
          <span>Returned / Rejected</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
          activeTab === 'returned'
            ? 'bg-white text-rose-800'
            : supplierStats.returnedCount > 0
              ? 'bg-rose-600 text-white'
              : 'bg-slate-100 text-slate-500'
        }`}>
          {supplierStats.returnedCount}
        </span>
      </button>

      {/* Bank & Profile */}
      <button
        type="button"
        onClick={() => {
          setActiveTab('profile');
          if (onItemClick) onItemClick();
        }}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-left ${
          activeTab === 'profile'
            ? 'bg-[#006B56] text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Building2 className={`w-4 h-4 shrink-0 ${activeTab === 'profile' ? 'text-emerald-200' : 'text-slate-600'}`} />
          <span>Bank & Profile</span>
        </div>
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans antialiased">
      
      {/* 1. DESKTOP SIDEBAR (Permanent full-height left sidebar on lg+ screens) */}
      <aside className="hidden lg:flex w-64 xl:w-72 bg-white border-r border-slate-200 flex-col h-full shrink-0 select-none">
        
        {/* Brand / Vendor Identity Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 bg-white shrink-0">
          <AdraLogo
            isCollapsed={false}
            subtitle="Supplier"
            description={companyDisplayName || "Vendor Portal"}
          />
        </div>

        {/* Navigation Links (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {renderNavLinks()}
        </div>

        {/* Bottom Verified Supplier Identity Card */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/80 shrink-0 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#006B56]" />
            <span className="text-[11px] uppercase tracking-wider">Verified Partner</span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium truncate">
            {currentSupplier?.category || profileForm.category || 'General Humanitarian Supplies'}
          </p>
          {currentSupplier?.bank_name && (
            <p className="text-[10px] text-slate-500 truncate">
              Bank: <strong className="text-slate-700">{currentSupplier.bank_name}</strong>
            </p>
          )}
        </div>
      </aside>

      {/* 2. MOBILE / TABLET SLIDE-OVER DRAWER SIDEBAR (Visible when toggled on <lg screens) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsMobileDrawerOpen(false)} 
          />
          <aside className="relative w-72 max-w-[80vw] h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            
            {/* Drawer Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 bg-white shrink-0">
              <AdraLogo
                isCollapsed={false}
                subtitle="Supplier"
                description={companyDisplayName || "Vendor Portal"}
              />
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Navigation List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {renderNavLinks(() => setIsMobileDrawerOpen(false))}
            </div>

            {/* Bottom Supplier Info in Drawer */}
            <div className="p-3.5 border-t border-slate-200 bg-slate-50/80 shrink-0 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#006B56]" />
                <span className="text-[11px]">ADRA Approved Vendor</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {currentSupplier?.email || currentUser?.email}
              </p>
            </div>

          </aside>
        </div>
      )}

      {/* 3. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Mobile Hamburger Drawer Button */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer border border-slate-200 shrink-0"
              title="Open Supplier Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">
                {activeTab === 'all' && 'All Purchase Orders'}
                {activeTab === 'orders' && 'New Supply Requests (Stage 1)'}
                {activeTab === 'intransit' && 'Consignments In Transit (Stage 2)'}
                {activeTab === 'confirmed' && 'Accepted Deliveries & GRN (Stage 3)'}
                {activeTab === 'payments' && 'Disbursed Payments & Settlements (Stage 4)'}
                {activeTab === 'returned' && 'Returned & Rejected Consignments'}
                {activeTab === 'profile' && 'Vendor Company & Bank Information'}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                {companyDisplayName} • ADRA South Sudan Fulfillment Hub
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => loadData()}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer border border-slate-200"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onLogout || logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200"
              title="Log Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-5">
            
            {/* 1. ALL ORDERS PAGE */}
            {activeTab === 'all' && (
              <>
                {/* 4-Stage KPI Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Stage 1: New Requests (Amber) */}
                  <div
                    onClick={() => setActiveTab('orders')}
                    className="rounded-2xl p-3.5 border transition cursor-pointer flex flex-col justify-between shadow-2xs bg-amber-50/70 border-amber-200/80 hover:bg-amber-100/60"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-950">New Requests</span>
                      <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-2xs shrink-0">
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-2xl font-black text-amber-950 tracking-tight">{supplierStats.pendingCount}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-200/90 text-amber-900 border border-amber-300">
                        Stage 1
                      </span>
                    </div>
                  </div>

                  {/* Stage 2: In Transit (Blue) */}
                  <div
                    onClick={() => setActiveTab('intransit')}
                    className="rounded-2xl p-3.5 border transition cursor-pointer flex flex-col justify-between shadow-2xs bg-blue-50/70 border-blue-200/80 hover:bg-blue-100/60"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-950">In Transit</span>
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                        <Truck className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-2xl font-black text-blue-950 tracking-tight">{supplierStats.inTransitCount}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-200/90 text-blue-900 border border-blue-300">
                        Stage 2
                      </span>
                    </div>
                  </div>

                  {/* Stage 3: GRN Confirmed / Accepted (ADRA Emerald Green) */}
                  <div
                    onClick={() => setActiveTab('confirmed')}
                    className="rounded-2xl p-3.5 border transition cursor-pointer flex flex-col justify-between shadow-2xs bg-emerald-50/70 border-emerald-200/80 hover:bg-emerald-100/60"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-950">Goods Accepted (GRN)</span>
                      <div className="w-7 h-7 rounded-lg bg-[#006B56] text-white flex items-center justify-center shadow-2xs shrink-0">
                        <PackageCheck className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-2xl font-black text-emerald-950 tracking-tight">{supplierStats.grnConfirmedCount}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-200/90 text-emerald-900 border border-emerald-200">
                        Stage 3
                      </span>
                    </div>
                  </div>

                  {/* Stage 4: Paid & Settled (Teal) */}
                  <div
                    onClick={() => setActiveTab('payments')}
                    className="rounded-2xl p-3.5 border transition cursor-pointer flex flex-col justify-between shadow-2xs bg-teal-50/70 border-teal-200/80 hover:bg-teal-100/60"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-teal-950">Paid & Settled</span>
                      <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                        <DollarSign className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-2xl font-black text-teal-950 tracking-tight">{supplierStats.paidCount}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-teal-200/90 text-teal-900 border border-teal-300">
                        Stage 4
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 2. STAGE 1: NEW REQUESTS PAGE HERO */}
            {activeTab === 'orders' && (
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      New Supply Requests (Stage 1)
                    </h2>
                    <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                      Review purchase orders issued by ADRA South Sudan Procurement. Enter your commercial invoice number, pricing per unit (SSP), transporter logistics details, and confirm dispatch to generate the waybill.
                    </p>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-xs px-4 py-3 rounded-2xl border border-amber-200/80 shrink-0 text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Pending Dispatch</span>
                  <span className="text-2xl font-black text-amber-950">{supplierStats.pendingCount}</span>
                </div>
              </div>
            )}

            {/* 3. STAGE 2: IN TRANSIT PAGE HERO */}
            {activeTab === 'intransit' && (
              <div className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border border-blue-200 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      Consignments In Transit (Stage 2)
                    </h2>
                    <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                      These consignments have been dispatched with verified waybills and commercial invoices. They are currently en route to ADRA destination warehouses and awaiting arrival quality inspection.
                    </p>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-xs px-4 py-3 rounded-2xl border border-blue-200/80 shrink-0 text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">Active Shipments</span>
                  <span className="text-2xl font-black text-blue-950">{supplierStats.inTransitCount}</span>
                </div>
              </div>
            )}

            {/* 4. STAGE 3: ACCEPTED & GRN PAGE HERO */}
            {activeTab === 'confirmed' && (
              <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#006B56] text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-700/20">
                    <PackageCheck className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      Goods Accepted & GRN Issued (Stage 3)
                    </h2>
                    <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                      These deliveries passed 100% sound condition physical warehouse inspection. Official Goods Receipt Notes (GRN) have been issued by the warehouse depot and forwarded to Finance for payment disbursement.
                    </p>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-xs px-4 py-3 rounded-2xl border border-emerald-200/80 shrink-0 text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Accepted Deliveries</span>
                  <span className="text-2xl font-black text-emerald-950">{supplierStats.grnConfirmedCount}</span>
                </div>
              </div>
            )}

            {/* 5. STAGE 4: PAID SETTLEMENTS PAGE HERO */}
            {activeTab === 'payments' && (
              <div className="bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent border border-teal-200 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-500/20">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      Disbursed Payments & Remittances (Stage 4)
                    </h2>
                    <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                      Completed supply transactions settled by ADRA South Sudan Finance Control. Remittance vouchers and banking/mobile money transactions are archived here.
                    </p>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-xs px-4 py-3 rounded-2xl border border-teal-200/80 shrink-0 text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">Total Earnings Settled</span>
                  <span className="text-xl font-black text-teal-950">SSP {supplierStats.totalEarnings.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Search and Header Bar (for PO pages) */}
            {activeTab !== 'profile' && (
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    {activeTab === 'all' && <span>All Purchase Orders</span>}
                    {activeTab === 'orders' && <span className="text-amber-900">New Supply Requests</span>}
                    {activeTab === 'intransit' && <span className="text-blue-900">In Transit Deliveries</span>}
                    {activeTab === 'confirmed' && <span className="text-[#006B56]">Accepted Goods Receipt Notes</span>}
                    {activeTab === 'payments' && <span className="text-teal-900">Settled Disbursements</span>}
                    {activeTab === 'returned' && <span className="text-rose-700">Inspection Rejections</span>}
                    <span className="text-xs font-semibold text-slate-500">
                      ({filteredPOs.length} {filteredPOs.length === 1 ? 'order' : 'orders'})
                    </span>
                  </h3>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64 shrink-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search PO #, items, invoice..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:border-[#006B56] focus:bg-white outline-none text-slate-900 font-medium transition"
                  />
                </div>
              </div>
            )}

            {/* Dedicated Returned / Rejected View (Responsive: Desktop Table + Mobile Cards) */}
            {activeTab === 'returned' ? (
              <div className="bg-white rounded-2xl border border-rose-200/80 shadow-2xs overflow-hidden">
                {filteredPOs.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 p-6 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <PackageCheck className="w-6 h-6" />
                    </div>
                    <h4 className="font-extrabold text-slate-800 text-sm">No Returned / Rejected Consignments</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      All your deliveries have passed warehouse quality inspection without any recorded returns.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* 1. MOBILE VIEW (< md): Clean, compact touch-friendly cards */}
                    <div className="block md:hidden divide-y divide-slate-100">
                      {filteredPOs.map((po) => (
                        <div key={po.id} className="p-4 space-y-3 bg-white hover:bg-rose-50/20 transition">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="font-mono font-bold text-slate-900 text-xs block">
                                {po.po_number}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {po.order_date}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-black text-rose-900 text-sm block">
                                {Number(po.total_amount) > 0 ? `SSP ${Number(po.total_amount).toLocaleString()}` : 'SSP 0'}
                              </span>
                              <span className="text-[10px] font-bold text-rose-700 uppercase">
                                Rejected
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-800 line-clamp-1">
                              {po.items_summary || 'Goods Consignment'}
                            </p>
                            <div className="flex items-center gap-1 text-[11px] text-slate-600">
                              <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                              <span className="truncate">{po.warehouse_destination}</span>
                            </div>
                          </div>

                          <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-2.5 space-y-1 text-xs text-rose-950">
                            <div className="flex items-center gap-1 font-bold text-rose-900 text-[11px]">
                              <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>{po.return_reason || 'Damaged in Transit / Seals Broken'}</span>
                            </div>
                            {po.return_notes && (
                              <p className="text-[11px] text-rose-800 font-medium">
                                <strong className="font-semibold">Remarks: </strong>{po.return_notes}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setSelectedPOForDetail(po)}
                              className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-[0.99] border border-slate-200"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Details</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedPOForDispatch(po)}
                              className="py-2 px-3 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer active:scale-[0.99]"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Resend Goods</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 2. DESKTOP / TABLET VIEW (>= md): Full data table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-rose-50/70 border-b border-rose-100 text-[11px] font-black uppercase tracking-wider text-rose-950">
                            <th className="py-3 px-4">PO & Invoices</th>
                            <th className="py-3 px-4">Commodity / Items</th>
                            <th className="py-3 px-4">Depot Destination</th>
                            <th className="py-3 px-4">Rejection Reason & Remarks</th>
                            <th className="py-3 px-4">Total Value</th>
                            <th className="py-3 px-4">Return Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredPOs.map((po) => (
                            <tr key={po.id} className="hover:bg-rose-50/30 transition">
                              {/* PO & Invoices */}
                              <td className="py-3.5 px-4 align-top">
                                <div className="font-mono font-bold text-slate-900 text-xs">
                                  {po.po_number}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5 space-y-0.5">
                                  <div>Ordered: <span className="font-semibold text-slate-700">{po.order_date}</span></div>
                                  {po.supplier_invoice_number && (
                                    <div>Inv: <span className="font-mono font-bold text-blue-700">{po.supplier_invoice_number}</span></div>
                                  )}
                                  {po.waybill_number && (
                                    <div>Waybill: <span className="font-mono text-slate-700">{po.waybill_number}</span></div>
                                  )}
                                </div>
                              </td>

                              {/* Commodity / Items */}
                              <td className="py-3.5 px-4 align-top max-w-[200px]">
                                <span className="font-bold text-slate-900 line-clamp-2">
                                  {po.items_summary || 'Standard Goods Consignment'}
                                </span>
                                {po.quantity && (
                                  <span className="text-[11px] text-slate-500 block mt-0.5">
                                    Qty: {po.quantity} {po.unit_of_measure || 'Units'}
                                  </span>
                                )}
                              </td>

                              {/* Destination */}
                              <td className="py-3.5 px-4 align-top max-w-[180px]">
                                <div className="font-semibold text-slate-800 flex items-start gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                  <span>{po.warehouse_destination || 'ADRA Main Depot'}</span>
                                </div>
                              </td>

                              {/* Rejection Reason & Inspection Notes */}
                              <td className="py-3.5 px-4 align-top max-w-[260px]">
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-200">
                                    <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
                                    <span>{po.return_reason || 'Damaged in Transit / Seals Broken'}</span>
                                  </span>
                                  {po.return_notes && (
                                    <p className="text-[11px] text-rose-800 bg-rose-50/80 p-1.5 rounded-lg border border-rose-100 font-medium">
                                      <strong className="font-bold">Remarks: </strong>{po.return_notes}
                                    </p>
                                  )}
                                  {po.returned_at && (
                                    <span className="text-[10px] text-slate-400 block font-mono">
                                      Logged: {new Date(po.returned_at).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Total Value */}
                              <td className="py-3.5 px-4 align-top whitespace-nowrap">
                                <span className="font-mono font-black text-rose-900 text-xs">
                                  {Number(po.total_amount) > 0 ? `SSP ${Number(po.total_amount).toLocaleString()}` : 'SSP 0'}
                                </span>
                              </td>

                              {/* Return Status */}
                              <td className="py-3.5 px-4 align-top whitespace-nowrap">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-300 inline-flex items-center gap-1">
                                  <RotateCcw className="w-3 h-3 text-rose-600" />
                                  <span>Returned to Vendor</span>
                                </span>
                              </td>

                              {/* Action Buttons */}
                              <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPOForDetail(po)}
                                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer border border-slate-200"
                                    title="View Details & Timeline"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Details</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPOForDispatch(po)}
                                    className="px-3 py-1.5 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer active:scale-95"
                                    title="Resend / Redispatch replacement consignment"
                                  >
                                    <Truck className="w-3.5 h-3.5" />
                                    <span>Resend</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            ) : activeTab !== 'profile' ? (
              /* Standard PO Cards List for other tabs */
              <div className="space-y-3">
                {filteredPOs.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                    <h4 className="font-bold text-slate-800 text-sm">No Purchase Orders Available</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {activeTab === 'orders' ? 'No pending supply requests waiting for your dispatch.' :
                       activeTab === 'intransit' ? 'No consignments currently in transit.' :
                       activeTab === 'confirmed' ? 'No deliveries currently awaiting Finance disbursement.' :
                       activeTab === 'payments' ? 'No paid transactions recorded yet.' :
                       'When the ADRA Inventory Manager creates a purchase order for your company, it will appear here.'}
                    </p>
                  </div>
                ) : (
                  filteredPOs.map(po => {
                    const stage = getPOStage(po);

                    return (
                      <div
                        key={po.id}
                        className={`bg-white rounded-2xl border p-4 shadow-2xs transition space-y-3 ${
                          stage === -1 ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-slate-900 text-sm">{po.po_number}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              stage === -1 ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                              stage === 4 ? 'bg-teal-100 text-teal-900 border border-teal-200' :
                              stage === 3 ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                              stage === 2 ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                              'bg-amber-100 text-amber-900 border border-amber-200'
                            }`}>
                              {stage === -1 ? `Returned: ${po.status}` : `Stage ${stage}: ${po.status}`}
                            </span>
                            <span className="text-xs text-slate-500">
                              Destination: <strong className="text-slate-800">{po.warehouse_destination}</strong>
                            </span>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="font-mono font-black text-[#006B56] text-base">
                              {Number(po.total_amount) > 0 ? `SSP ${Number(po.total_amount).toLocaleString()}` : 'Quote Pending'}
                            </span>
                          </div>
                        </div>

                        {/* Body */}
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800">{po.items_summary}</p>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                            <span>Ordered: <strong>{po.order_date}</strong></span>
                            {po.supplier_invoice_number && <span>• Invoice: <strong className="text-blue-700 font-mono">{po.supplier_invoice_number}</strong></span>}
                            {po.waybill_number && <span>• Waybill: <strong className="text-slate-800 font-mono">{po.waybill_number}</strong></span>}
                            {po.grn_number && <span>• GRN: <strong className="text-[#006B56] font-mono">{po.grn_number}</strong></span>}
                            {po.payment_voucher_number && <span>• Payment Voucher: <strong className="text-purple-700 font-mono">{po.payment_voucher_number}</strong></span>}
                          </div>

                          {/* Prominent Returned / Rejected Banner */}
                          {stage === -1 && (
                            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-950 space-y-1 mt-2">
                              <div className="flex items-center gap-1.5 font-bold text-rose-900">
                                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>Consignment Rejected & Returned by ADRA Warehouse</span>
                              </div>
                              <p className="text-rose-800">
                                <strong className="font-semibold">Reason: </strong>{po.return_reason || 'Failed warehouse sound condition inspection'}
                              </p>
                              {po.return_notes && (
                                <p className="text-rose-700"><strong className="font-semibold">Inspection Remarks: </strong>{po.return_notes}</p>
                              )}
                              {po.returned_at && (
                                <p className="text-[11px] text-rose-600 font-mono">
                                  Logged on: {new Date(po.returned_at).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setSelectedPOForDetail(po)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-slate-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details & Timeline</span>
                          </button>

                          {stage === 1 && (
                            <button
                              type="button"
                              onClick={() => setSelectedPOForDispatch(po)}
                              className="px-4 py-1.5 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-[0.99] cursor-pointer"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Supply & Dispatch Goods</span>
                            </button>
                          )}

                          {stage === 2 && (
                            <span className="text-xs text-blue-700 font-bold flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                              <Clock className="w-3.5 h-3.5" />
                              <span>En route to {po.warehouse_destination} (Awaiting GRN)</span>
                            </span>
                          )}

                          {stage === 3 && (
                            <span className="text-xs text-emerald-800 font-bold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              <PackageCheck className="w-3.5 h-3.5 text-emerald-700" />
                              <span>✓ Goods Accepted & Received (GRN: {po.grn_number}) • Awaiting Finance</span>
                            </span>
                          )}

                          {stage === 4 && (
                            <span className="text-xs text-teal-800 font-bold flex items-center gap-1 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                              <span>Settled & Paid in Full (SSP {Number(po.total_amount).toLocaleString()})</span>
                            </span>
                          )}

                          {stage === -1 && (
                            <span className="text-xs text-rose-800 font-bold flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                              <XCircle className="w-3.5 h-3.5 text-rose-700" />
                              <span>Returned to Vendor ({po.return_reason || 'Rejected'})</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : null}

            {/* Profile & Banking Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Vendor Company & Banking Details</h3>
                    <p className="text-xs text-slate-500">Official verified settlement information on file with ADRA South Sudan</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditProfileOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-auto"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile & Bank Info</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 uppercase text-[10px] font-bold">Company Name</span>
                    <p className="font-bold text-slate-900 text-sm">
                      {currentSupplier?.company_name || profileForm.company_name || <span className="text-slate-400 italic">Not configured</span>}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 uppercase text-[10px] font-bold">Primary Supply Category</span>
                    <p className="font-bold text-[#006B56]">
                      {currentSupplier?.category || profileForm.category || <span className="text-slate-400 italic">Not configured</span>}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 uppercase text-[10px] font-bold">Contact Person</span>
                    <p className="font-bold text-slate-900">
                      {currentSupplier?.contact_person || profileForm.contact_person || currentUser?.full_name || <span className="text-slate-400 italic">Not configured</span>}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 uppercase text-[10px] font-bold">Official Email & Phone</span>
                    <p className="font-bold text-slate-900">
                      {currentSupplier?.email || profileForm.email || currentUser?.email} {currentSupplier?.phone || profileForm.phone ? `• ${currentSupplier?.phone || profileForm.phone}` : ''}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 uppercase text-[10px] font-bold">Designated Settlement Bank</span>
                    <p className="font-bold text-slate-900">
                      {currentSupplier?.bank_name || profileForm.bank_name || <span className="text-slate-400 italic">Not configured</span>}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 uppercase text-[10px] font-bold">Bank Account / IBAN</span>
                    <p className="font-mono font-bold text-slate-900">
                      {currentSupplier?.bank_account_no || profileForm.bank_account_no || <span className="text-slate-400 italic font-sans">Not configured</span>}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 uppercase text-[10px] font-bold">SWIFT / BIC Code</span>
                    <p className="font-mono font-bold text-slate-900">
                      {currentSupplier?.swift_code || profileForm.swift_code || <span className="text-slate-400 italic font-sans">Not configured</span>}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 uppercase text-[10px] font-bold">Humanitarian Mobile Money</span>
                    <p className="font-bold text-slate-900">
                      {currentSupplier?.mobile_money_number || profileForm.mobile_money_number || <span className="text-slate-400 italic">Not configured</span>}
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* EDIT PROFILE & BANKING MODAL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006B56] flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Configure Vendor Profile</h3>
                  <p className="text-xs text-slate-500">Enter your official company details & settlement bank</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfileSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Company / Vendor Name *</label>
                <input
                  type="text"
                  value={profileForm.company_name}
                  onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
                  placeholder="e.g. Apex Relief Logistics Ltd"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#006B56] focus:bg-white outline-none font-medium text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Supply Category</label>
                  <select
                    value={profileForm.category}
                    onChange={(e) => setProfileForm({ ...profileForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#006B56] focus:bg-white outline-none font-medium text-slate-900"
                  >
                    <option value="General Humanitarian Supplies">General Supplies</option>
                    <option value="Food Assistance">Food Assistance</option>
                    <option value="WASH (Water & Sanitation)">WASH (Water & Sanitation)</option>
                    <option value="Shelter & Non-Food Items">Shelter & NFIs</option>
                    <option value="Healthcare & Medical">Healthcare & Medical</option>
                    <option value="Agriculture & Livelihoods">Agriculture & Livelihoods</option>
                    <option value="Transport & Fleet Logistics">Transport & Logistics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={profileForm.contact_person}
                    onChange={(e) => setProfileForm({ ...profileForm, contact_person: e.target.value })}
                    placeholder="Full name"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#006B56] focus:bg-white outline-none font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="e.g. +211-920-123456"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#006B56] focus:bg-white outline-none font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Official Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="company@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#006B56] focus:bg-white outline-none font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-900 block mb-2">Banking & Settlement Information</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Settlement Bank Name</label>
                    <input
                      type="text"
                      value={profileForm.bank_name}
                      onChange={(e) => setProfileForm({ ...profileForm, bank_name: e.target.value })}
                      placeholder="e.g. Stanbic / KCB Bank"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#006B56] focus:bg-white outline-none font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Account Number / IBAN</label>
                    <input
                      type="text"
                      value={profileForm.bank_account_no}
                      onChange={(e) => setProfileForm({ ...profileForm, bank_account_no: e.target.value })}
                      placeholder="Account / IBAN"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#006B56] focus:bg-white outline-none font-mono font-medium text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">SWIFT / BIC Code</label>
                  <input
                    type="text"
                    value={profileForm.swift_code}
                    onChange={(e) => setProfileForm({ ...profileForm, swift_code: e.target.value })}
                    placeholder="e.g. SBICSSLX"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#006B56] focus:bg-white outline-none font-mono font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Mobile Money Number</label>
                  <input
                    type="text"
                    value={profileForm.mobile_money_number}
                    onChange={(e) => setProfileForm({ ...profileForm, mobile_money_number: e.target.value })}
                    placeholder="e.g. +211-920-000000 (m-Gurush)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#006B56] focus:bg-white outline-none font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPATCH MODAL */}
      <SupplierDispatchModal
        isOpen={Boolean(selectedPOForDispatch)}
        onClose={() => setSelectedPOForDispatch(null)}
        purchaseOrder={selectedPOForDispatch}
        onDispatchSuccess={handleDispatchSuccess}
      />

      {/* PO DETAIL MODAL */}
      <PODetailModal
        isOpen={Boolean(selectedPOForDetail)}
        onClose={() => setSelectedPOForDetail(null)}
        purchaseOrder={selectedPOForDetail}
        supplier={currentSupplier}
        onOpenSupplierDispatch={(po) => setSelectedPOForDispatch(po)}
        onDeletePO={handleDeletePO}
      />

    </div>
  );
}
