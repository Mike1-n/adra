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
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import { db } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SupplierDispatchModal } from '../inventory/components/SupplierDispatchModal';
import { PODetailModal } from '../inventory/components/PODetailModal';
import { SupplierPaymentReceiptModal } from './components/SupplierPaymentReceiptModal';
import { AdraLogo } from '../../components/common/AdraLogo';
import { FloatingFeedbackButton } from '../../components/common/FloatingFeedbackButton';
import { FeedbackComplaintsView } from '../../components/common/FeedbackComplaintsView';
import { NotificationBellButton } from '../../components/common/NotificationBellButton';

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
  const [dispatches, setDispatches] = useState([]);

  // Modals
  const [selectedPOForDispatch, setSelectedPOForDispatch] = useState(null);
  const [selectedPOForDetail, setSelectedPOForDetail] = useState(null);
  const [selectedPOForReceipt, setSelectedPOForReceipt] = useState(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [quoteModalPO, setQuoteModalPO] = useState(null);
  const [quoteLineItems, setQuoteLineItems] = useState([]);
  const [quoteNotes, setQuoteNotes] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [confirmingFundsId, setConfirmingFundsId] = useState(null);

  const handleConfirmFundsReceived = async (po) => {
    try {
      setConfirmingFundsId(po.id);
      const supName = currentSupplier?.contact_person || currentSupplier?.company_name || currentUser?.full_name || 'Supplier';
      await db.confirmSupplierPaymentReceived(po.id, supName);
      toast.success(`Payment receipt confirmed for ${po.po_number}!`);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to confirm funds received.');
    } finally {
      setConfirmingFundsId(null);
    }
  };

  const parsePOItemsForQuote = (po) => {
    if (Array.isArray(po?.items) && po.items.length > 0) {
      return po.items.map(it => ({
        item_name: it.item_name || 'Supplies',
        quantity: Number(it.quantity) || 1,
        unit: it.unit || 'Units',
        max_unit_price: it.max_unit_price != null ? Number(it.max_unit_price) : (po?.max_unit_price != null ? Number(po.max_unit_price) : null),
        unit_price: it.unit_price ? String(it.unit_price) : ''
      }));
    }
    const itemsMatch = (po?.notes || '').match(/Items:\s*([^\n]+)/i);
    const rawSummary = itemsMatch ? itemsMatch[1] : (po?.items_summary || '');
    if (rawSummary && rawSummary.includes('•')) {
      const parsed = rawSummary.split('•').map(part => part.trim()).filter(Boolean).map(part => {
        const m = part.match(/^(\d+(?:\.\d+)?)\s*x?\s+(\S+)\s+(.+)$/i);
        if (m) {
          return {
            quantity: Number(m[1]) || 1,
            unit: m[2],
            item_name: m[3].trim(),
            max_unit_price: po?.max_unit_price != null ? Number(po.max_unit_price) : null,
            unit_price: ''
          };
        }
        return { quantity: 1, unit: 'Units', item_name: part, max_unit_price: po?.max_unit_price != null ? Number(po.max_unit_price) : null, unit_price: '' };
      });
      if (parsed.length > 0) return parsed;
    }
    return [{
      item_name: po?.item_name || 'Humanitarian Supplies',
      quantity: Number(po?.quantity) || 1,
      unit: po?.unit || 'Units',
      max_unit_price: po?.max_unit_price != null ? Number(po.max_unit_price) : null,
      unit_price: ''
    }];
  };

  const handleOpenQuoteModal = (po) => {
    setQuoteModalPO(po);
    setQuoteLineItems(parsePOItemsForQuote(po));
    setQuoteNotes('');
  };

  const quoteGrandTotal = useMemo(() => {
    return quoteLineItems.reduce((sum, it) => {
      const qty = Number(it.quantity) || 0;
      const price = Number(it.unit_price) || 0;
      return sum + qty * price;
    }, 0);
  }, [quoteLineItems]);

  const hasQuoteOverMax = useMemo(() => {
    return quoteLineItems.some(
      it => it.max_unit_price != null && Number(it.max_unit_price) > 0 && Number(it.unit_price) > Number(it.max_unit_price)
    );
  }, [quoteLineItems]);

  const handleSubmitQuotation = async (e) => {
    e.preventDefault();
    if (!quoteModalPO) return;
    if (quoteLineItems.length === 0 || quoteLineItems.some(it => !it.unit_price || Number(it.unit_price) <= 0)) {
      toast.warning('Please enter a valid unit price (SSP) for every commodity.');
      return;
    }
    const overPriced = quoteLineItems.find(
      it => it.max_unit_price != null && Number(it.max_unit_price) > 0 && Number(it.unit_price) > Number(it.max_unit_price)
    );
    if (overPriced) {
      toast.error(
        `Quotation rejected: Unit price for ${overPriced.item_name} (SSP ${Number(overPriced.unit_price).toLocaleString()}) exceeds the maximum market price of SSP ${Number(overPriced.max_unit_price).toLocaleString()} set by Inventory.`
      );
      return;
    }
    const breakdownText = quoteLineItems
      .map(it => `${it.item_name} (${it.quantity} ${it.unit} × SSP ${Number(it.unit_price).toLocaleString()} = SSP ${(Number(it.quantity) * Number(it.unit_price)).toLocaleString()})`)
      .join(' | ');
    const fullNotes = [quoteNotes.trim(), `Quote Breakdown: ${breakdownText}`].filter(Boolean).join(' • ');
    const totalQty = quoteLineItems.reduce((s, it) => s + (Number(it.quantity) || 0), 0);

    try {
      setSubmittingQuote(true);
      await db.submitSupplierQuotation(quoteModalPO.id, {
        total_amount: quoteGrandTotal,
        unit_cost: totalQty > 0 ? Math.round((quoteGrandTotal / totalQty) * 100) / 100 : 0,
        items: quoteLineItems,
        notes: fullNotes,
        quoted_by: currentSupplier?.company_name || currentUser?.full_name || 'Supplier'
      });
      toast.success(`Quotation (SSP ${quoteGrandTotal.toLocaleString()}) sent for ${quoteModalPO.po_number}. Awaiting Inventory Manager approval.`);
      setQuoteModalPO(null);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to submit quotation.');
    } finally {
      setSubmittingQuote(false);
    }
  };

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
      const [poList, supList, dispList] = await Promise.all([
        db.getPurchaseOrders(),
        db.getSuppliers(),
        db.getDispatches ? db.getDispatches() : Promise.resolve([])
      ]);
      setPurchaseOrders(poList || []);
      setSuppliers(supList || []);
      setDispatches(dispList || []);
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
  // Helper for stage determination
  const getPOStage = (po) => {
    if (po.stage === -1 || Number(po.stage) === -1 || po.status === 'Returned & Rejected' || po.status?.includes('Returned') || po.status?.includes('Rejected')) return -1;
    if (po.status === 'Paid & Settled' || po.status === 'Paid & Confirmed' || po.payment_status === 'Paid' || po.status === 'Paid' || Number(po.stage) === 4) return 4;
    if (po.grn_number || po.status?.includes('Received') || po.status?.includes('Confirmed') || Number(po.stage) === 3) return 3;
    if (po.waybill_number || po.supplier_invoice_number || po.status?.includes('Transit') || po.status?.includes('Supplied') || Number(po.stage) === 2) return 2;
    if (po.status === 'Pending Quotation' || po.status === 'Quotation Submitted' || po.status === 'Approved for Supply' || po.status === 'Pending Supplier Supply' || po.status === 'Pending Delivery' || Number(po.stage) === 1) return 1;
    return Number(po.stage) || 1;
  };

  // Selected supplier ID: Defaults to matching supplier or first vendor
  const [selectedSupplierId, setSelectedSupplierId] = useState('');

  // Automatically select matching supplier or first supplier once loaded
  useEffect(() => {
    if (suppliers.length > 0 && (!selectedSupplierId || selectedSupplierId === 'all')) {
      const matched =
        suppliers.find(s => s.email?.toLowerCase() === currentUser?.email?.toLowerCase()) ||
        suppliers.find(s => s.company_name?.toLowerCase() === currentUser?.department?.toLowerCase()) ||
        suppliers[0];
      if (matched) {
        setSelectedSupplierId(matched.id);
      }
    }
  }, [suppliers, currentUser, selectedSupplierId]);

  // Find matching supplier profile for current user or selected vendor
  const currentSupplier = useMemo(() => {
    const activeId = selectedSupplierId || suppliers[0]?.id;
    if (activeId) {
      return suppliers.find(s => s.id === activeId) || null;
    }
    if (currentUser) {
      return (
        suppliers.find(s => s.email?.toLowerCase() === currentUser.email?.toLowerCase()) ||
        suppliers.find(s => s.company_name?.toLowerCase() === currentUser.department?.toLowerCase()) ||
        suppliers.find(s => s.contact_person?.toLowerCase() === currentUser.full_name?.toLowerCase()) ||
        suppliers[0] ||
        null
      );
    }
    return suppliers[0] || null;
  }, [suppliers, selectedSupplierId, currentUser]);

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

  // Filter purchase orders directed to this supplier
  const displayedPOs = useMemo(() => {
    const activeId = selectedSupplierId || suppliers[0]?.id;
    if (!activeId) return purchaseOrders;
    const sup = suppliers.find(s => s.id === activeId);
    return purchaseOrders.filter(po => {
      if (po.supplier_id && po.supplier_id === activeId) return true;
      if (sup?.company_name && po.supplier_name?.toLowerCase()?.trim() === sup.company_name?.toLowerCase()?.trim()) return true;
      if (sup?.email && po.supplier_email?.toLowerCase()?.trim() === sup.email?.toLowerCase()?.trim()) return true;
      return false;
    });
  }, [purchaseOrders, selectedSupplierId, suppliers]);

  const filteredPOs = useMemo(() => {
    return displayedPOs.filter(po => {
      const q = searchTerm.toLowerCase();
      const matches =
        (po.po_number || '').toLowerCase().includes(q) ||
        (po.supplier_name || '').toLowerCase().includes(q) ||
        (po.item_name || '').toLowerCase().includes(q) ||
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

  const companyDisplayName = selectedSupplierId === 'all'
    ? 'Vendor Portal'
    : (currentSupplier?.company_name || profileForm.company_name || 'Vendor Portal');

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
    <div className="space-y-1 min-w-0">
      <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
        Orders & Fulfillment
      </div>

      {/* All Orders */}
      <button
        type="button"
        onClick={() => {
          setActiveTab('all');
          if (onItemClick) onItemClick();
        }}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-left min-w-0 ${
          activeTab === 'all'
            ? 'bg-[#006B56] text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          <ShoppingCart className="w-4 h-4 shrink-0" />
          <span className="truncate">All Orders</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 ${
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
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-left min-w-0 ${
          activeTab === 'orders'
            ? 'bg-[#006B56] text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          <Clock className={`w-4 h-4 shrink-0 ${activeTab === 'orders' ? 'text-amber-200' : 'text-amber-700'}`} />
          <span className="truncate">New Requests</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 ${
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
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-left min-w-0 ${
          activeTab === 'intransit'
            ? 'bg-[#006B56] text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          <Truck className={`w-4 h-4 shrink-0 ${activeTab === 'intransit' ? 'text-blue-200' : 'text-blue-700'}`} />
          <span className="truncate">In Transit</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 ${
          activeTab === 'intransit'
            ? 'bg-blue-300 text-blue-950'
            : supplierStats.inTransitCount > 0
              ? 'bg-blue-100 text-blue-900 border border-blue-200'
              : 'bg-slate-100 text-slate-500'
        }`}>
          {supplierStats.inTransitCount}
        </span>
      </button>

      {/* GRN Confirmed */}
      <button
        type="button"
        onClick={() => {
          setActiveTab('confirmed');
          if (onItemClick) onItemClick();
        }}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-left min-w-0 ${
          activeTab === 'confirmed'
            ? 'bg-[#006B56] text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          <PackageCheck className={`w-4 h-4 shrink-0 ${activeTab === 'confirmed' ? 'text-emerald-200' : 'text-[#006B56]'}`} />
          <span className="truncate">GRN Confirmed</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 ${
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
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-left min-w-0 ${
          activeTab === 'payments'
            ? 'bg-[#006B56] text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          <DollarSign className={`w-4 h-4 shrink-0 ${activeTab === 'payments' ? 'text-teal-200' : 'text-teal-700'}`} />
          <span className="truncate">Payments</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 ${
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
      <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
        Exceptions & Account
      </div>

      {/* Returned / Rejected */}
      <button
        type="button"
        onClick={() => {
          setActiveTab('returned');
          if (onItemClick) onItemClick();
        }}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-left min-w-0 ${
          activeTab === 'returned'
            ? 'bg-rose-600 text-white shadow-xs'
            : supplierStats.returnedCount > 0
              ? 'text-rose-700 bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200/60'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          <XCircle className={`w-4 h-4 shrink-0 ${activeTab === 'returned' ? 'text-white' : 'text-rose-600'}`} />
          <span className="truncate">Rejected Deliveries</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 ${
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
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-left min-w-0 ${
          activeTab === 'profile'
            ? 'bg-[#006B56] text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          <Building2 className={`w-4 h-4 shrink-0 ${activeTab === 'profile' ? 'text-emerald-200' : 'text-slate-600'}`} />
          <span className="truncate">Bank & Profile</span>
        </div>
      </button>

      {/* Feedback & Complaints */}
      <button
        type="button"
        onClick={() => {
          setActiveTab('feedback');
          if (onItemClick) onItemClick();
        }}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-left min-w-0 ${
          activeTab === 'feedback'
            ? 'bg-[#006B56] text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          <MessageSquare className={`w-4 h-4 shrink-0 ${activeTab === 'feedback' ? 'text-emerald-200' : 'text-slate-600'}`} />
          <span className="truncate">Feedback</span>
        </div>
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans antialiased">
      
      {/* 1. DESKTOP SIDEBAR (Permanent full-height left sidebar on lg+ screens) */}
      <aside className="hidden lg:flex w-64 xl:w-72 bg-white border-r border-slate-200 flex-col h-full shrink-0 select-none overflow-x-hidden min-w-0">
        
        {/* Brand / Vendor Identity Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 bg-white shrink-0 min-w-0 overflow-hidden">
          <div className="min-w-0 overflow-hidden flex-1">
            <AdraLogo
              isCollapsed={false}
              subtitle="Supplier"
              description={companyDisplayName || "Vendor Portal"}
            />
          </div>
        </div>

        {/* Navigation Links (Scrollable) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1 min-w-0">
          {renderNavLinks()}
        </div>

        {/* Bottom Verified Supplier Identity Card */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/80 shrink-0 space-y-1.5 text-xs min-w-0 overflow-hidden">
          <div className="flex items-center gap-1.5 text-emerald-800 font-bold min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-[#006B56] shrink-0" />
            <span className="text-[11px] uppercase tracking-wider truncate">Verified Partner</span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium truncate">
            {currentSupplier?.company_name || profileForm.company_name || 'ADRA South Sudan'}
          </p>
        </div>
      </aside>

      {/* 2. MOBILE / TABLET SLIDE-OVER DRAWER SIDEBAR (Visible when toggled on <lg screens) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsMobileDrawerOpen(false)} 
          />
          <aside className="relative w-72 max-w-[80vw] h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 overflow-x-hidden min-w-0">
            
            {/* Drawer Header with mobile status bar clearance */}
            <div className="pt-safe-drawer border-b border-slate-200 bg-white shrink-0">
              <div className="h-16 flex items-center justify-between px-4 min-w-0">
                <div className="min-w-0 overflow-hidden flex-1 mr-2">
                  <AdraLogo
                    isCollapsed={false}
                    subtitle="Supplier"
                    description={companyDisplayName || "Vendor Portal"}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Navigation List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1 min-w-0">
              {renderNavLinks(() => setIsMobileDrawerOpen(false))}
            </div>

            {/* Bottom Supplier Info in Drawer */}
            <div className="p-3.5 border-t border-slate-200 bg-slate-50/80 shrink-0 text-xs space-y-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold min-w-0">
                <ShieldCheck className="w-3.5 h-3.5 text-[#006B56] shrink-0" />
                <span className="text-[11px] truncate">ADRA Approved Vendor</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {currentSupplier?.company_name || currentSupplier?.email || currentUser?.email}
              </p>
            </div>

          </aside>
        </div>
      )}

      {/* 3. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Top Header (Green Brand Header) */}
        <header className="bg-[#004D3F] border-b border-[#003B30] text-white px-4 sm:px-6 shrink-0 pt-safe shadow-md">
          <div className="h-16 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Mobile Hamburger Drawer Button */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer border border-white/20 shrink-0"
              title="Open Supplier Navigation"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>

            <div className="min-w-0 flex flex-col justify-center">
              <span className="text-base font-black text-white tracking-wider leading-tight">
                ADRA
              </span>
              <span className="text-[10px] text-emerald-200 font-medium leading-none">
                {currentUser?.role || 'Supplier'}
              </span>
            </div>
          </div>

          {/* Right: Notifications, Profile & Logout */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Notification Center Bell */}
            <NotificationBellButton
              currentUser={currentUser}
              extraData={{
                orders: displayedPOs,
                dispatches
              }}
              onNavigate={(tab) => setActiveTab(tab)}
            />

            {/* Vendor Profile Button */}
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="flex items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer border border-white/20 shadow-2xs"
              title="Vendor Profile"
            >
              <User className="w-4 h-4 text-white" />
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={onLogout || logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition active:scale-95 shadow-xs cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline font-bold">Logout</span>
            </button>
          </div>
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







            {/* Search and Header Bar (for PO pages) */}
            {activeTab !== 'profile' && activeTab !== 'feedback' && (
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
            ) : (activeTab !== 'profile' && activeTab !== 'feedback') ? (
              /* Dedicated PO Table View */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                {filteredPOs.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 bg-white p-6">
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
                  <>
                    {/* 1. MOBILE VIEW (< md): Clean stacked cards locked to phone width, zero horizontal scrolling */}
                    <div className="block md:hidden divide-y divide-slate-100">
                      {filteredPOs.map((po) => {
                        const stage = getPOStage(po);
                        const totalVal = Number(po.total_amount) || 0;

                        return (
                          <div key={po.id} className="p-3.5 space-y-2.5 hover:bg-slate-50/60 transition">
                            {/* Top Row: PO Number + Stage Badge */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-mono font-bold text-slate-900 text-xs truncate">
                                  {po.po_number}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium shrink-0">
                                  • {po.order_date}
                                </span>
                              </div>

                              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                stage === -1 ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                                stage === 4 ? 'bg-teal-100 text-teal-900 border border-teal-200' :
                                stage === 3 ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                                stage === 2 ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                                'bg-amber-100 text-amber-900 border border-amber-200'
                              }`}>
                                {stage === -1 ? 'Rejected' : stage === 4 ? 'Stage 4: Paid' : stage === 3 ? 'Stage 3: GRN' : stage === 2 ? 'Stage 2: In Transit' : 'Stage 1: Pending'}
                              </span>
                            </div>

                            {/* Commodity / Items + Amount */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                                  {po.items_summary || 'Goods Consignment'}
                                </p>
                                {po.supplier_name && (
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block mt-1 truncate max-w-full">
                                    {po.supplier_name}
                                  </span>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Amount</span>
                                <span className="font-mono font-black text-[#006B56] text-xs">
                                  {totalVal > 0 ? `SSP ${totalVal.toLocaleString()}` : 'Pending Quote'}
                                </span>
                              </div>
                            </div>

                            {/* Destination Depot */}
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-[#006B56] shrink-0" />
                              <span className="truncate">{po.warehouse_destination || 'ADRA Depot'}</span>
                            </div>

                            {/* Documents Trail (Compact row on mobile) */}
                            {(po.supplier_invoice_number || po.waybill_number || po.grn_number || po.payment_voucher_number) && (
                              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex flex-wrap gap-x-3 gap-y-1">
                                {po.supplier_invoice_number && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-400">• Inv:</span>
                                    <span className="font-mono font-bold text-blue-700">{po.supplier_invoice_number}</span>
                                  </div>
                                )}
                                {po.waybill_number && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-400">• Waybill:</span>
                                    <span className="font-mono text-slate-800">{po.waybill_number}</span>
                                  </div>
                                )}
                                {po.grn_number && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-400">• GRN:</span>
                                    <span className="font-mono font-bold text-[#006B56]">{po.grn_number}</span>
                                  </div>
                                )}
                                {po.payment_voucher_number && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-400">• PV:</span>
                                    <span className="font-mono font-bold text-purple-700">{po.payment_voucher_number}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setSelectedPOForDetail(po)}
                                className="flex-1 py-1.5 px-3 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 active:scale-[0.99]"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Details</span>
                              </button>

                              {stage === 1 && po.status === 'Approved for Supply' && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPOForDispatch(po)}
                                  className="flex-1 py-1.5 px-3 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-[0.99] cursor-pointer"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span>Supply / Dispatch</span>
                                </button>
                              )}
                              {stage === 1 && po.status === 'Quotation Submitted' && (
                                <span className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px] text-center">
                                  Quote Sent • Awaiting Approval
                                </span>
                              )}
                              {stage === 1 && po.status !== 'Approved for Supply' && po.status !== 'Quotation Submitted' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenQuoteModal(po)}
                                  className="flex-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-[0.99] cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Send Quotation</span>
                                </button>
                              )}
                              {stage === 4 && (
                                <>
                                  {!po.supplier_confirmed ? (
                                    <button
                                      type="button"
                                      disabled={confirmingFundsId === po.id}
                                      onClick={() => handleConfirmFundsReceived(po)}
                                      className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-[0.99] cursor-pointer disabled:opacity-50"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>{confirmingFundsId === po.id ? 'Confirming...' : 'Confirm Funds Received'}</span>
                                    </button>
                                  ) : (
                                    <span className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px] flex items-center justify-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Funds Confirmed</span>
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPOForReceipt(po)}
                                    className="py-1.5 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-[0.99] cursor-pointer"
                                  >
                                    <Receipt className="w-3.5 h-3.5" />
                                    <span>Receipt</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 2. DESKTOP / TABLET VIEW (>= md): Full data table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600">
                            <th className="py-2.5 px-3 sm:py-3 sm:px-4">PO & Items</th>
                            <th className="hidden md:table-cell py-3 px-4">Destination Depot</th>
                            <th className="hidden sm:table-cell py-3 px-4">Stage / Status</th>
                            <th className="hidden lg:table-cell py-3 px-4">Documents Trail</th>
                            <th className="py-2.5 px-3 sm:py-3 sm:px-4">Amount</th>
                            <th className="py-2.5 px-3 sm:py-3 sm:px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredPOs.map((po) => {
                            const stage = getPOStage(po);

                            return (
                              <tr
                                key={po.id}
                                className={`transition hover:bg-slate-50/70 ${
                                  stage === -1 ? 'bg-rose-50/20' : ''
                                }`}
                              >
                                {/* PO Number, Item & Date (Compact on mobile) */}
                                <td className="py-2.5 px-3 sm:py-3.5 sm:px-4 align-middle sm:align-top">
                                  <span className="font-mono font-bold text-slate-900 text-xs block leading-tight">
                                    {po.po_number}
                                  </span>
                                  <span className="text-[11px] font-semibold text-slate-700 block truncate max-w-[140px] sm:max-w-[200px] mt-0.5">
                                    {po.items_summary || 'Goods Consignment'}
                                  </span>
                                  {po.supplier_name && (
                                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block mt-0.5 max-w-[180px] truncate">
                                      {po.supplier_name}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    {po.order_date}
                                  </span>
                                </td>

                                {/* Destination Depot (md+ screens) */}
                                <td className="hidden md:table-cell py-3.5 px-4 align-top max-w-[180px]">
                                  <div className="flex items-center gap-1 text-[11px] text-slate-700 font-medium">
                                    <MapPin className="w-3.5 h-3.5 text-[#006B56] shrink-0" />
                                    <span className="truncate">{po.warehouse_destination || 'ADRA Depot'}</span>
                                  </div>
                                  {stage === -1 && (
                                    <div className="mt-1 p-1 rounded bg-rose-50 border border-rose-200 text-[10px] text-rose-800">
                                      <span className="font-bold">Rejected:</span> {po.return_reason || 'Failed inspection'}
                                    </div>
                                  )}
                                </td>

                                {/* Stage / Status Badge (sm+ screens) */}
                                <td className="hidden sm:table-cell py-3.5 px-4 align-top whitespace-nowrap">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                    stage === -1 ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                                    stage === 4 ? 'bg-teal-100 text-teal-900 border border-teal-200' :
                                    stage === 3 ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                                    stage === 2 ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                                    'bg-amber-100 text-amber-900 border border-amber-200'
                                  }`}>
                                    {stage === -1 ? `Returned: ${po.status}` : `Stage ${stage}: ${po.status}`}
                                  </span>
                                </td>

                                {/* Documents Trail (lg+ screens) */}
                                <td className="hidden lg:table-cell py-3.5 px-4 align-top max-w-[220px]">
                                  <div className="space-y-0.5 text-[11px] text-slate-600">
                                    {po.supplier_invoice_number && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-slate-400">• Inv:</span>
                                        <span className="font-mono font-bold text-blue-700">{po.supplier_invoice_number}</span>
                                      </div>
                                    )}
                                    {po.waybill_number && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-slate-400">• Waybill:</span>
                                        <span className="font-mono text-slate-800">{po.waybill_number}</span>
                                      </div>
                                    )}
                                    {po.grn_number && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-slate-400">• GRN:</span>
                                        <span className="font-mono font-bold text-[#006B56]">{po.grn_number}</span>
                                      </div>
                                    )}
                                    {po.payment_voucher_number && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-slate-400">• PV:</span>
                                        <span className="font-mono font-bold text-purple-700">{po.payment_voucher_number}</span>
                                      </div>
                                    )}
                                    {!po.supplier_invoice_number && !po.waybill_number && !po.grn_number && !po.payment_voucher_number && (
                                      <span className="text-slate-400 italic text-[10px]">No documents generated</span>
                                    )}
                                  </div>
                                </td>

                                {/* Total Amount + Mobile Status */}
                                <td className="py-2.5 px-3 sm:py-3.5 sm:px-4 align-middle sm:align-top whitespace-nowrap">
                                  <span className="font-mono font-black text-[#006B56] text-xs block">
                                    {Number(po.total_amount) > 0 ? `SSP ${Number(po.total_amount).toLocaleString()}` : 'SSP 0'}
                                  </span>
                                  {/* Compact Mobile Status Tag (< sm) */}
                                  <div className="block sm:hidden mt-0.5">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide ${
                                      stage === -1 ? 'bg-rose-100 text-rose-800' :
                                      stage === 4 ? 'bg-teal-100 text-teal-800' :
                                      stage === 3 ? 'bg-emerald-100 text-emerald-800' :
                                      stage === 2 ? 'bg-blue-100 text-blue-800' :
                                      'bg-amber-100 text-amber-800'
                                    }`}>
                                      {stage === 4 ? 'Paid' : stage === 3 ? 'GRN' : stage === 2 ? 'In Transit' : stage === 1 ? 'Pending' : 'Returned'}
                                    </span>
                                  </div>
                                </td>

                                {/* Actions */}
                                <td className="py-2.5 px-3 sm:py-3.5 sm:px-4 align-middle sm:align-top text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedPOForDetail(po)}
                                      className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1 cursor-pointer border border-slate-200"
                                      title="View Details & Documents"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline">Details</span>
                                      <span className="sm:hidden">View</span>
                                    </button>

                                    {stage === 1 && po.status === 'Approved for Supply' && (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedPOForDispatch(po)}
                                        className="px-2.5 py-1 rounded-lg bg-[#006B56] hover:bg-[#005443] text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition active:scale-[0.99] cursor-pointer"
                                      >
                                        <Truck className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Supply / Dispatch</span>
                                      </button>
                                    )}
                                    {stage === 1 && po.status === 'Quotation Submitted' && (
                                      <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px]">
                                        Awaiting Quote Approval
                                      </span>
                                    )}
                                    {stage === 1 && po.status !== 'Approved for Supply' && po.status !== 'Quotation Submitted' && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenQuoteModal(po)}
                                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition active:scale-[0.99] cursor-pointer"
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Send Quotation</span>
                                      </button>
                                    )}
                                    {stage === 4 && (
                                      <>
                                        {!po.supplier_confirmed ? (
                                          <button
                                            type="button"
                                            disabled={confirmingFundsId === po.id}
                                            onClick={() => handleConfirmFundsReceived(po)}
                                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer disabled:opacity-50"
                                            title="Confirm you received the funds from Finance"
                                          >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>{confirmingFundsId === po.id ? 'Confirming...' : 'Confirm Funds'}</span>
                                          </button>
                                        ) : (
                                          <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] inline-flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            <span>Confirmed</span>
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => setSelectedPOForReceipt(po)}
                                          className="px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer"
                                          title="Print or download payment receipt"
                                        >
                                          <Receipt className="w-3.5 h-3.5" />
                                          <span>Receipt</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
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

            {/* 6. FEEDBACK & COMPLAINTS DESK */}
            {activeTab === 'feedback' && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs h-[calc(100vh-140px)] min-h-[500px]">
                <FeedbackComplaintsView
                  currentUser={{
                    ...currentUser,
                    ...currentSupplier,
                    role: 'Supplier',
                    name: currentSupplier?.company_name || currentUser?.full_name,
                    full_name: currentSupplier?.company_name || currentUser?.full_name
                  }}
                  userType="supplier"
                />
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

      {/* SEND QUOTATION MODAL */}
      {quoteModalPO && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
            <div className="bg-[#006B56] px-4 py-3 text-white flex items-center justify-between shrink-0">
              <div className="min-w-0">
                <span className="font-mono text-[11px] bg-white/20 px-2 py-0.5 rounded font-bold">
                  {quoteModalPO.po_number}
                </span>
                <h3 className="font-black text-sm mt-1">Submit Price Quotation</h3>
                <p className="text-[11px] text-emerald-100 truncate">Destination: {quoteModalPO.warehouse_destination}</p>
              </div>
              <button
                type="button"
                onClick={() => setQuoteModalPO(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitQuotation} className="p-3.5 sm:p-5 space-y-3 text-xs overflow-y-auto">
              {/* Itemized Quotation Table (Zero Horizontal Scroll on Mobile) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full table-fixed text-left border-collapse text-[11px] sm:text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-600">
                      <th className="py-2 px-2 sm:px-3 w-[32%]">Commodity</th>
                      <th className="py-2 px-1.5 sm:px-3 text-center w-[20%]">Qty</th>
                      <th className="py-2 px-1.5 sm:px-3 text-right w-[26%]">Unit (SSP) *</th>
                      <th className="py-2 px-2 sm:px-3 text-right w-[22%]">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quoteLineItems.map((line, idx) => {
                      const lineTotal = (Number(line.quantity) || 0) * (Number(line.unit_price) || 0);
                      const hasMax = line.max_unit_price != null && Number(line.max_unit_price) > 0;
                      const isOverMax = hasMax && Number(line.unit_price) > Number(line.max_unit_price);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-2 sm:px-3 font-bold text-slate-900 break-words">
                            <span>{line.item_name}</span>
                            {hasMax && (
                              <span className="block text-[9px] font-semibold text-slate-500 mt-0.5">
                                Max: SSP {Number(line.max_unit_price).toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-1.5 sm:px-3 text-center text-slate-700 font-semibold break-words">
                            {Number(line.quantity).toLocaleString()} {line.unit}
                          </td>
                          <td className="py-1.5 px-1.5 sm:px-3 text-right">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              required
                              value={line.unit_price}
                              onChange={(e) => {
                                const val = e.target.value;
                                setQuoteLineItems(prev => prev.map((it, i) => i === idx ? { ...it, unit_price: val } : it));
                              }}
                              placeholder="0"
                              className={`w-full px-1.5 sm:px-2.5 py-1.5 rounded-lg border outline-none font-mono font-bold text-right text-[11px] sm:text-xs ${
                                isOverMax
                                  ? 'border-rose-500 bg-rose-50 text-rose-700 focus:border-rose-600'
                                  : 'border-slate-300 bg-white text-slate-900 focus:border-[#006B56]'
                              }`}
                            />
                            {isOverMax && (
                              <span className="block text-[9px] font-bold text-rose-600 mt-0.5 leading-tight">
                                Above max SSP {Number(line.max_unit_price).toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2 sm:px-3 text-right font-mono font-bold text-[#006B56] break-words">
                            {lineTotal.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-emerald-50/80 border-t-2 border-emerald-200">
                      <td colSpan={3} className="py-2 px-2 sm:px-3 text-right font-black uppercase tracking-wider text-emerald-950 text-[10px] sm:text-[11px]">
                        Grand Total (SSP)
                      </td>
                      <td className="py-2 px-2 sm:px-3 text-right font-mono font-black text-xs sm:text-sm text-[#006B56] break-words">
                        {quoteGrandTotal.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Quotation Notes / Lead Time (Optional)
                </label>
                <textarea
                  rows={2}
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="e.g. Delivery within 48 hours; includes transport to depot."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#006B56] outline-none text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuoteModalPO(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingQuote || hasQuoteOverMax}
                  className="px-4 py-2 rounded-xl bg-[#006B56] hover:bg-[#005443] text-white font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingQuote ? 'Sending...' : 'Send Quotation'}
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

      <SupplierPaymentReceiptModal
        purchaseOrder={selectedPOForReceipt}
        onClose={() => setSelectedPOForReceipt(null)}
      />

      {/* Module Feedback Trigger */}
      <FloatingFeedbackButton
        currentModule="Supplier Portal"
        onOpenFeedbackTab={() => setActiveTab('feedback')}
      />

    </div>
  );
}
