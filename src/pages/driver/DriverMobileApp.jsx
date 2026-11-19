import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  PackageCheck,
  MapPin,
  Clock,
  Search,
  RefreshCw,
  LogOut,
  UserCheck,
  Package,
  ArrowRight,
  User,
  ShieldCheck,
  Navigation,
  Menu,
  X,
  LayoutDashboard,
  ChevronRight,
  Phone,
  Building2,
  CheckCircle2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { FeedbackComplaintsView } from '../../components/common/FeedbackComplaintsView';
import { AdraLogo } from '../../components/common/AdraLogo';

export function DriverMobileApp({ onSwitchRole, onLogout }) {
  const { currentUser, logout } = useAuth();
  const toast = useToast();

  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Navigation & Sidebar
  // mainSection: 'dashboard' | 'dispatches' | 'profile' | 'feedback'
  const [mainSection, setMainSection] = useState('dispatches');
  const [activeTab, setActiveTab] = useState('pending_pickup'); // 'pending_pickup' | 'in_transit' | 'delivered' | 'all'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [expandedKey, setExpandedKey] = useState(null);

  const handleSignOut = async () => {
    if (onLogout) return onLogout();
    await logout();
  };

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      const allDispatches = await (db.getDispatches ? db.getDispatches() : []);
      setDispatches(allDispatches || []);
    } catch (err) {
      console.error('Failed to load driver dispatches:', err);
      toast.error('Failed to load assigned dispatches.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Scope dispatches to this Driver (or show all for Administrator preview)
  const myDispatches = useMemo(() => {
    const isAdmin = currentUser?.role === 'Administrator';
    if (isAdmin) return dispatches;

    const myId = currentUser?.id;
    const myName = (currentUser?.full_name || currentUser?.name || '').toLowerCase().trim();
    const myPhone = (currentUser?.phone || currentUser?.phone_number || '').trim();

    return dispatches.filter(d => {
      if (myId && d.driver_id && d.driver_id === myId) return true;
      if (myName && d.driver_name && d.driver_name.toLowerCase().trim().includes(myName)) return true;
      if (myPhone && d.driver_phone && d.driver_phone.includes(myPhone)) return true;
      if (!d.driver_id && (!d.driver_name || d.driver_name === 'Deng Bol')) return true;
      return false;
    });
  }, [dispatches, currentUser]);

  const classifyStatus = (d) => {
    const st = (d.status || '').toLowerCase().trim();
    if (
      d.driver_delivered ||
      st.includes('delivered to supervisor') ||
      st.includes('arrived') ||
      st.includes('collect') ||
      st === 'goods_arrived_at_hub'
    ) {
      return 'delivered';
    }
    if (
      st === 'pending driver acceptance' ||
      (!d.driver_accepted && st.includes('pending driver'))
    ) {
      return 'pending_pickup';
    }
    return 'in_transit';
  };

  const counts = useMemo(() => {
    let pending_pickup = 0;
    let in_transit = 0;
    let delivered = 0;
    myDispatches.forEach(d => {
      const cat = classifyStatus(d);
      if (cat === 'pending_pickup') pending_pickup++;
      else if (cat === 'in_transit') in_transit++;
      else delivered++;
    });
    return { pending_pickup, in_transit, delivered, all: myDispatches.length };
  }, [myDispatches]);

  const filteredDispatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return myDispatches.filter(d => {
      const cat = classifyStatus(d);
      if (activeTab !== 'all' && cat !== activeTab) return false;
      if (!q) return true;
      return (
        (d.waybill_number || '').toLowerCase().includes(q) ||
        (d.origin_warehouse || '').toLowerCase().includes(q) ||
        (d.destination || '').toLowerCase().includes(q) ||
        (d.assigned_supervisor_name || '').toLowerCase().includes(q) ||
        (d.beneficiary_name || '').toLowerCase().includes(q) ||
        (d.vehicle_reg || '').toLowerCase().includes(q)
      );
    });
  }, [myDispatches, activeTab, searchQuery]);

  const handleAcceptGoods = async (dispatch) => {
    const key = dispatch.waybill_number || dispatch.id;
    try {
      setProcessingId(key);
      await db.acceptDispatchByDriver(
        key,
        currentUser?.full_name || dispatch.driver_name || 'ADRA Driver'
      );
      toast.success(`Accepted goods for ${dispatch.waybill_number}. Ready to deliver to ${dispatch.assigned_supervisor_name || 'Supervisor'}.`);
      await loadData(true);
      setMainSection('dispatches');
      setActiveTab('in_transit');
    } catch (err) {
      toast.error(err.message || 'Failed to accept goods.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeliverToSupervisor = async (dispatch) => {
    const key = dispatch.waybill_number || dispatch.id;
    try {
      setProcessingId(key);
      await db.deliverDispatchByDriver(
        key,
        currentUser?.full_name || dispatch.driver_name || 'ADRA Driver'
      );
      toast.success(`Delivered ${dispatch.waybill_number} to Supervisor ${dispatch.assigned_supervisor_name || 'Hub'}.`);
      await loadData(true);
      setMainSection('dispatches');
      setActiveTab('delivered');
    } catch (err) {
      toast.error(err.message || 'Failed to mark delivery.');
    } finally {
      setProcessingId(null);
    }
  };

  const navigateTo = (section, tab = null) => {
    setMainSection(section);
    if (tab) setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Sidebar Brand Header */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
        <AdraLogo
          isCollapsed={false}
          subtitle="Driver Hub"
        />
        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
        <button
          type="button"
          onClick={() => navigateTo('dashboard')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            mainSection === 'dashboard'
              ? 'bg-emerald-50 text-[#006B56] border border-emerald-200/80'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </span>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
        </button>

        {/* Waybills & Custody Group */}
        <div className="pt-1">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => navigateTo('dispatches', 'pending_pickup')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                mainSection === 'dispatches' && activeTab === 'pending_pickup'
                  ? 'bg-[#006B56] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <PackageCheck className="w-4 h-4" />
                <span>Pending Pickup</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                mainSection === 'dispatches' && activeTab === 'pending_pickup'
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-100 text-amber-900'
              }`}>
                {counts.pending_pickup}
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('dispatches', 'in_transit')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                mainSection === 'dispatches' && activeTab === 'in_transit'
                  ? 'bg-[#006B56] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Navigation className="w-4 h-4" />
                <span>In Transit</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                mainSection === 'dispatches' && activeTab === 'in_transit'
                  ? 'bg-white/20 text-white'
                  : 'bg-sky-100 text-sky-900'
              }`}>
                {counts.in_transit}
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('dispatches', 'delivered')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                mainSection === 'dispatches' && activeTab === 'delivered'
                  ? 'bg-[#006B56] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Delivered to Supervisor</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                mainSection === 'dispatches' && activeTab === 'delivered'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 text-emerald-900'
              }`}>
                {counts.delivered}
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('dispatches', 'all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                mainSection === 'dispatches' && activeTab === 'all'
                  ? 'bg-[#006B56] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Package className="w-4 h-4" />
                <span>All Waybills</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                mainSection === 'dispatches' && activeTab === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {counts.all}
              </span>
            </button>
          </div>
        </div>

        {/* Account & Support */}
        <div className="pt-3">
          <p className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Account & Support
          </p>
          <div className="space-y-1">

            <button
              type="button"
              onClick={() => navigateTo('profile')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                mainSection === 'profile'
                  ? 'bg-emerald-50 text-[#006B56] border border-emerald-200/80'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <User className="w-4 h-4" />
                <span>Driver Profile</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('feedback')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                mainSection === 'feedback'
                  ? 'bg-emerald-50 text-[#006B56] border border-emerald-200/80'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4" />
                <span>Feedback & Complaints</span>
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar Footer */}
      {currentUser?.role === 'Administrator' && onSwitchRole && (
        <div className="p-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onSwitchRole('Administrator')}
            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
          >
            Back to Admin Portal
          </button>
        </div>
      )}
    </div>
  );

  const renderDispatchCard = (d) => {
    const cat = classifyStatus(d);
    const key = d.waybill_number || d.id;
    const isBusy = processingId === key;
    const isExpanded = expandedKey === key;

    const statusBadge = (
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
          cat === 'pending_pickup'
            ? 'bg-amber-100 text-amber-900 border border-amber-200'
            : cat === 'in_transit'
            ? 'bg-sky-100 text-sky-900 border border-sky-200'
            : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
        }`}
      >
        {cat === 'pending_pickup'
          ? 'Awaiting Pickup'
          : cat === 'in_transit'
          ? 'Picked Up • In Transit'
          : 'Delivered'}
      </span>
    );

    const detailsSection = (
      <div className="space-y-2.5">
        <div className="text-[11px] text-slate-500 flex items-center gap-1">
          <Clock className="w-3 h-3 shrink-0" />
          <span>Dispatched: {d.dispatch_date || 'Today'} • Released by {d.released_by || 'Inventory Manager'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Pickup & Delivery Route
            </span>
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 flex-wrap">
              <MapPin className="w-3.5 h-3.5 text-[#006B56] shrink-0" />
              <span>{d.origin_warehouse || 'Central Depot'}</span>
              <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-[#006B56]">{d.destination || 'Field Hub'}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Receiving Supervisor & Beneficiary
            </span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Supervisor: {d.assigned_supervisor_name || 'Hub Supervisor'}</span>
            </div>
            {d.beneficiary_name && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <User className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Beneficiary: {d.beneficiary_name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1.5">
          <span className="text-[10px] font-bold text-emerald-900 uppercase flex items-center gap-1">
            <Package className="w-3 h-3" />
            Goods on Waybill ({(d.items || []).length} items)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(d.items || []).map((itm, i) => (
              <span
                key={i}
                className="px-2 py-1 rounded-lg bg-white border border-emerald-200/80 text-[11px] font-semibold text-slate-800"
              >
                {itm.item_name}: <strong className="text-[#006B56]">{itm.quantity} {itm.unit || 'units'}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>
    );

    const actionButton = (compact = false) => (
      <>
        {cat === 'pending_pickup' && (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => handleAcceptGoods(d)}
            className={`${compact ? 'px-2.5 py-1.5 text-[11px]' : 'w-full sm:w-auto px-4 py-2.5 text-xs'} rounded-xl bg-[#006B56] hover:bg-[#005443] text-white font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 shrink-0`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>{isBusy ? 'Accepting...' : (compact ? 'Accept' : 'Accept & Pick Up Goods from Inventory')}</span>
          </button>
        )}

        {cat === 'in_transit' && (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => handleDeliverToSupervisor(d)}
            className={`${compact ? 'px-2.5 py-1.5 text-[11px]' : 'w-full sm:w-auto px-4 py-2.5 text-xs'} rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 shrink-0`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{isBusy ? 'Delivering...' : (compact ? 'Deliver' : `Deliver Goods to ${d.assigned_supervisor_name || 'Supervisor'}`)}</span>
          </button>
        )}

        {cat === 'delivered' && !compact && (
          <div className="w-full flex items-center justify-between text-[11px] text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
            <span className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Handed over to Supervisor ({d.assigned_supervisor_name || 'Hub'})
            </span>
            {d.driver_delivered_at && (
              <span className="font-mono text-[10px]">
                {new Date(d.driver_delivered_at).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </>
    );

    return (
      <div
        key={key}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden"
      >
        {/* PHONE COMPACT MODE (< md) */}
        <div className="block md:hidden">
          <div className="p-3.5 flex items-center justify-between gap-2.5">
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono font-black text-xs text-slate-900 truncate">
                  {d.waybill_number || d.id}
                </span>
                {statusBadge}
              </div>
              <p className="text-[11px] font-semibold text-slate-700 truncate">
                To: {d.assigned_supervisor_name || 'Hub Supervisor'} • {(d.items || []).length} items
              </p>
            </div>
            {actionButton(true)}
          </div>

          <button
            type="button"
            onClick={() => setExpandedKey(prev => (prev === key ? null : key))}
            className="w-full py-2 px-3.5 bg-slate-50/80 hover:bg-slate-100 text-slate-600 text-[11px] font-semibold flex items-center justify-between border-t border-slate-100 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>{isExpanded ? 'Hide Details' : 'View More Information'}</span>
            </span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {isExpanded && (
            <div className="p-3.5 border-t border-slate-100 bg-slate-50/40 space-y-3">
              {detailsSection}
              <div className="pt-1">{actionButton(false)}</div>
            </div>
          )}
        </div>

        {/* DESKTOP FULL MODE (>= md) */}
        <div className="hidden md:block p-4 space-y-3">
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-black text-sm text-slate-900">
                  {d.waybill_number || d.id}
                </span>
                {d.vehicle_reg && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                    {d.vehicle_reg}
                  </span>
                )}
              </div>
            </div>
            {statusBadge}
          </div>

          {detailsSection}

          <div className="pt-1 flex items-center justify-end gap-2">
            {actionButton(false)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Slide-Over Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header (Matched to PM Manager Header) */}
        <header className="bg-[#004D3F] px-3.5 border-b border-[#003B30] text-white sticky top-0 z-40 shadow-md shrink-0 pt-safe">
          <div className="min-h-14 py-2 flex items-center justify-between gap-2">
            {/* Left: Menu Hamburger + ADRA Brand */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-1.5 -ml-1 text-white hover:bg-white/15 rounded-xl active:scale-95 transition cursor-pointer shrink-0"
                title="Open Navigation Menu"
              >
                <Menu className="w-5 h-5 text-white" />
              </button>

              <div className="min-w-0 flex flex-col justify-center">
                <span className="text-base font-black text-white tracking-wider leading-tight">
                  ADRA
                </span>
                <span className="text-[10px] text-emerald-200 font-medium leading-none truncate">
                  {currentUser?.role || 'Driver'} • {currentUser?.full_name || 'Deng Bol'}
                </span>
              </div>
            </div>

            {/* Right Controls: Refresh, Profile & Logout */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="flex items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer shadow-2xs border border-white/20"
                title="Refresh dispatches"
              >
                <RefreshCw className={`w-4 h-4 text-white ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => navigateTo('profile')}
                className="flex items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer shadow-2xs border border-white/20"
                title="Driver Profile"
              >
                <User className="w-4 h-4 text-white" />
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition active:scale-95 shadow-xs shrink-0 cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline font-bold">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-5 space-y-4 pb-16">
          {/* OVERVIEW SECTION */}
          {mainSection === 'dashboard' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Driver Transit Overview</h2>
                <p className="text-xs text-slate-500">
                  Accept relief cargo from Inventory Manager and deliver directly to the assigned Supervisor.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5">
                  <span className="text-[10px] font-bold uppercase text-amber-800 block">Pending Pickup</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">{counts.pending_pickup}</span>
                </div>
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3.5">
                  <span className="text-[10px] font-bold uppercase text-sky-800 block">In Transit</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">{counts.in_transit}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">Delivered</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">{counts.delivered}</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Waybills</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">{counts.all}</span>
                </div>
              </div>

              {myDispatches.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-800">Latest Active Consignment</h3>
                    <button
                      type="button"
                      onClick={() => navigateTo('dispatches', 'pending_pickup')}
                      className="text-xs font-bold text-[#006B56] hover:underline cursor-pointer"
                    >
                      View All Waybills
                    </button>
                  </div>
                  {renderDispatchCard(myDispatches[0])}
                </div>
              )}
            </div>
          )}

          {/* DISPATCHES / WAYBILLS SECTION */}
          {mainSection === 'dispatches' && (
            <>
              {/* KPI Summary Cards */}
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('pending_pickup')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    activeTab === 'pending_pickup'
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                    Pending Pickup
                  </span>
                  <span className="text-2xl font-black text-slate-900 mt-0.5 block">
                    {counts.pending_pickup}
                  </span>
                  <span className="text-[10px] text-slate-500">From Inventory</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('in_transit')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    activeTab === 'in_transit'
                      ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
                    In Transit
                  </span>
                  <span className="text-2xl font-black text-slate-900 mt-0.5 block">
                    {counts.in_transit}
                  </span>
                  <span className="text-[10px] text-slate-500">En Route to Supervisor</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('delivered')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    activeTab === 'delivered'
                      ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Delivered
                  </span>
                  <span className="text-2xl font-black text-slate-900 mt-0.5 block">
                    {counts.delivered}
                  </span>
                  <span className="text-[10px] text-slate-500">With Supervisor</span>
                </button>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto">
                  {[
                    { id: 'pending_pickup', label: `Pending Pickup (${counts.pending_pickup})` },
                    { id: 'in_transit', label: `In Transit (${counts.in_transit})` },
                    { id: 'delivered', label: `Delivered (${counts.delivered})` },
                    { id: 'all', label: `All (${counts.all})` }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                        activeTab === tab.id
                          ? 'bg-[#006B56] text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search waybill, supervisor, hub..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#006B56]"
                  />
                </div>
              </div>

              {/* Dispatches List */}
              {loading ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-500">
                  Loading assigned waybills...
                </div>
              ) : filteredDispatches.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
                  <Truck className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No consignments in this view</p>
                  <p className="text-xs text-slate-500">
                    {activeTab === 'pending_pickup'
                      ? 'Waybills issued by the Inventory Manager for pickup will appear here.'
                      : 'No matching dispatches found.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDispatches.map(renderDispatchCard)}
                </div>
              )}
            </>
          )}

          {/* PROFILE SECTION */}
          {mainSection === 'profile' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#004D3F] text-white flex items-center justify-center font-black text-lg">
                  {(currentUser?.full_name || 'D').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    {currentUser?.full_name || 'Deng Bol'}
                  </h2>
                  <p className="text-xs font-semibold text-[#006B56]">
                    {currentUser?.role || 'Driver'} • {currentUser?.department || 'Logistics & Fleet'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Email</span>
                  <p className="font-semibold text-slate-800">{currentUser?.email || 'driver@adra.org'}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Phone</span>
                  <p className="font-semibold text-slate-800 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#006B56]" />
                    {currentUser?.phone || '+211-921-889911'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Department</span>
                  <p className="font-semibold text-slate-800 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#006B56]" />
                    {currentUser?.department || 'Logistics & Fleet'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Account Status</span>
                  <p className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {currentUser?.status || 'Active'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* FEEDBACK & COMPLAINTS SECTION */}
          {mainSection === 'feedback' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
              <FeedbackComplaintsView currentUser={currentUser} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
