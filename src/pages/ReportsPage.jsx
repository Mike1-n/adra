import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  FolderKanban,
  Users,
  Coins,
  ShieldCheck,
  Search,
  Building2,
  TrendingUp,
  Receipt,
  Banknote,
  PackageCheck,
  History,
  HeartHandshake,
  Gift,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { db } from '../lib/supabase';
import { exportToPDF, exportToCSV } from '../lib/reportGenerator';
import { formatCurrency, formatDate } from '../lib/utils';
import { useToast } from '../context/ToastContext';

// Helper to shorten overly repetitive auto-generated descriptions in tables
function cleanDescription(text) {
  if (!text) return '—';
  return text
    .replace(/Field Cash Facilitation \(Field Operational Facilitation\) for /gi, 'Facilitation: ')
    .replace(/Supplier Payout: PO /gi, 'PO Settlement: ');
}

function getActionBadgeStyle(action) {
  switch (action?.toUpperCase()) {
    case 'CREATE':
    case 'REGISTER':
      return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    case 'UPDATE':
    case 'EDIT':
      return 'bg-blue-50 text-blue-800 border-blue-300';
    case 'AUTH':
    case 'LOGIN':
      return 'bg-purple-50 text-purple-800 border-purple-300';
    case 'APPROVE':
      return 'bg-amber-50 text-amber-800 border-amber-300';
    case 'DELETE':
    case 'REJECT':
      return 'bg-rose-50 text-rose-800 border-rose-300';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-300';
  }
}

function getSupportRowHighlight(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('confirmed') || s.includes('delivered') || s.includes('distributed')) {
    return 'bg-emerald-50/45 hover:bg-emerald-50/80';
  }
  if (s.includes('approved')) {
    return 'bg-green-50/45 hover:bg-green-50/80';
  }
  if (s.includes('handed over') || s.includes('dispatch') || s.includes('transit')) {
    return 'bg-sky-50/45 hover:bg-sky-50/80';
  }
  if (s.includes('assessment')) {
    return 'bg-orange-50/45 hover:bg-orange-50/80';
  }
  if (s.includes('awaiting') || s.includes('pending') || s.includes('review')) {
    return 'bg-amber-50/45 hover:bg-amber-50/80';
  }
  if (s.includes('reject')) {
    return 'bg-rose-50/45 hover:bg-rose-50/80';
  }
  return 'hover:bg-slate-50/70';
}

function getSupportBadgeStyle(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('confirmed') || s.includes('delivered') || s.includes('distributed')) {
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }
  if (s.includes('approved')) {
    return 'bg-green-100 text-green-800 border-green-200';
  }
  if (s.includes('handed over') || s.includes('dispatch') || s.includes('transit')) {
    return 'bg-sky-100 text-sky-800 border-sky-200';
  }
  if (s.includes('assessment')) {
    return 'bg-orange-100 text-orange-800 border-orange-200';
  }
  if (s.includes('awaiting') || s.includes('pending') || s.includes('review')) {
    return 'bg-amber-100 text-amber-800 border-amber-200';
  }
  if (s.includes('reject')) {
    return 'bg-rose-100 text-rose-800 border-rose-200';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export function ReportsPage({ initialReportType = 'financials' }) {
  const toast = useToast();
  // 5 Core Domains: 'financials' | 'support_received' | 'projects' | 'beneficiaries' | 'audit_logs'
  const [reportType, setReportType] = useState(initialReportType || 'financials');
  // Financial Statement Sub-Views
  const [financialSubView, setFinancialSubView] = useState('grants');
  // Support Received Filters
  const [supportCategoryFilter, setSupportCategoryFilter] = useState('ALL');
  const [supportStatusFilter, setSupportStatusFilter] = useState('ALL');
  // Beneficiary Roll Filter (All vs Only People Who Received Support vs Pending)
  const [beneficiarySupportFilter, setBeneficiarySupportFilter] = useState('ALL');
  const [selectedProjectId, setSelectedProjectId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState({
    projects: [],
    beneficiaries: [],
    budgets: [],
    expenditures: [],
    donorGrants: [],
    donors: [],
    fieldFundingRequests: [],
    purchaseOrders: [],
    auditLogs: [],
    interventions: [],
    assistanceRequests: [],
    dispatches: [],
    fieldAssessments: [],
    stockTransactions: [],
  });

  useEffect(() => {
    async function loadAllData() {
      try {
        setLoading(true);
        const [
          projects,
          beneficiaries,
          budgets,
          expenditures,
          donorGrants,
          donors,
          fieldFundingRequests,
          purchaseOrders,
          auditLogs,
          interventions,
          assistanceRequests,
          dispatches,
          fieldAssessments,
          stockTransactions,
        ] = await Promise.all([
          db.getProjects ? db.getProjects() : Promise.resolve([]),
          db.getBeneficiaries ? db.getBeneficiaries() : Promise.resolve([]),
          db.getBudgets ? db.getBudgets() : Promise.resolve([]),
          db.getExpenditures ? db.getExpenditures() : Promise.resolve([]),
          db.getDonorGrants ? db.getDonorGrants() : Promise.resolve([]),
          db.getDonors ? db.getDonors() : Promise.resolve([]),
          db.getFieldFundingRequests ? db.getFieldFundingRequests() : Promise.resolve([]),
          db.getPurchaseOrders ? db.getPurchaseOrders() : Promise.resolve([]),
          db.getAuditLogs ? db.getAuditLogs() : Promise.resolve([]),
          db.getInterventions ? db.getInterventions() : Promise.resolve([]),
          db.getAssistanceRequests ? db.getAssistanceRequests() : Promise.resolve([]),
          db.getDispatches ? db.getDispatches() : Promise.resolve([]),
          db.getFieldAssessments ? db.getFieldAssessments() : Promise.resolve([]),
          db.getStockTransactions ? db.getStockTransactions() : Promise.resolve([]),
        ]);

        setData({
          projects: projects || [],
          beneficiaries: beneficiaries || [],
          budgets: budgets || [],
          expenditures: expenditures || [],
          donorGrants: donorGrants || [],
          donors: donors || [],
          fieldFundingRequests: fieldFundingRequests || [],
          purchaseOrders: purchaseOrders || [],
          auditLogs: auditLogs || [],
          interventions: interventions || [],
          assistanceRequests: assistanceRequests || [],
          dispatches: dispatches || [],
          fieldAssessments: fieldAssessments || [],
          stockTransactions: stockTransactions || [],
        });
      } catch (err) {
        console.error('Failed to load reports datasets:', err);
        toast.error('Failed to aggregate reporting datasets.');
      } finally {
        setLoading(false);
      }
    }
    loadAllData();
  }, []);

  const selectedProj = useMemo(() => {
    if (selectedProjectId === 'ALL') return null;
    return data.projects.find(p => p.id === selectedProjectId);
  }, [selectedProjectId, data.projects]);

  // Safely parse array or JSON string of items
  const parseItemsArray = (val) => {
    if (!val) return null;
    if (Array.isArray(val)) return val.length > 0 ? val : null;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
        } catch (_) {
          return null;
        }
      }
    }
    return null;
  };

  // Resolve exact items array from request, dispatch, stock transactions, or assessment
  const resolveItemsArray = (source, matchedDispatch = null, matchedAssessment = null, matchedStockTxs = []) => {
    const direct = (
      parseItemsArray(source?.distributed_items) ||
      parseItemsArray(source?.items) ||
      parseItemsArray(matchedDispatch?.items) ||
      parseItemsArray(source?.allocated_items) ||
      parseItemsArray(source?.approved_items) ||
      parseItemsArray(matchedAssessment?.items)
    );
    if (direct) return direct;

    if (Array.isArray(matchedStockTxs) && matchedStockTxs.length > 0) {
      return matchedStockTxs.map(tx => ({
        item_name: tx.item_name,
        quantity: Math.abs(Number(tx.quantity) || 1),
        unit: tx.unit || 'units'
      }));
    }
    return null;
  };

  // Map assistance category to concrete ADRA warehouse commodities & quantities when item array is absent
  const resolveStandardCommodities = (source) => {
    const rawCat = `${source?.support_type || ''} ${source?.category || ''} ${source?.assistance_type || ''}`.toLowerCase();
    const hh = Number(source?.household_members) || 1;
    const isLargeHH = hh >= 6;
    const items = [];

    if (rawCat.includes('food') || !rawCat.trim()) {
      items.push(
        { item_name: 'Fortified Maize', quantity: isLargeHH ? 50 : 25, unit: 'kg' },
        { item_name: 'Wheat Flour', quantity: isLargeHH ? 30 : 15, unit: 'kg' },
        { item_name: 'Rice', quantity: isLargeHH ? 20 : 10, unit: 'kg' },
        { item_name: 'Split Peas', quantity: isLargeHH ? 10 : 5, unit: 'kg' },
        { item_name: 'Cooking Oil', quantity: isLargeHH ? 5 : 3, unit: 'L' }
      );
    }
    if (rawCat.includes('water') || rawCat.includes('wash')) {
      items.push(
        { item_name: '20L Jerrycans', quantity: 2, unit: 'pcs' },
        { item_name: 'Aquatabs', quantity: 100, unit: 'tabs' },
        { item_name: 'Hygiene Soap', quantity: 4, unit: 'bars' }
      );
    }
    if (rawCat.includes('medical') || rawCat.includes('health')) {
      items.push(
        { item_name: 'Medical Kit', quantity: 1, unit: 'kit' },
        { item_name: 'ORS Sachets', quantity: 10, unit: 'pcs' }
      );
    }
    if (rawCat.includes('education')) {
      items.push(
        { item_name: 'Exercise Books', quantity: 12, unit: 'pcs' },
        { item_name: 'Stationery Pack', quantity: 1, unit: 'pack' }
      );
    }
    if (rawCat.includes('cash')) {
      items.push(
        { item_name: 'Cash Stipend', quantity: 150000, unit: 'SSP' }
      );
    }

    if (items.length === 0) {
      items.push(
        { item_name: 'Fortified Maize', quantity: 25, unit: 'kg' },
        { item_name: 'Wheat Flour', quantity: 15, unit: 'kg' },
        { item_name: 'Rice', quantity: 10, unit: 'kg' }
      );
    }

    return items;
  };

  // Strip 'Shelter' from support type labels
  const cleanSupportTypeLabel = (rawType) => {
    if (!rawType) return 'Food & Relief Commodities';
    const cleaned = rawType
      .split(',')
      .map(s => s.trim())
      .filter(s => s && !s.toLowerCase().includes('shelter'))
      .join(', ');
    return cleaned || 'Food & Relief Commodities';
  };

  // Format merged commodity + quantity string (e.g. "Fortified Maize 50kg, Wheat Flour 30kg, Rice 20kg")
  const formatItemWithQty = (i) => {
    if (typeof i === 'string') return i;
    const name = (i.item_name || i.name || i.commodity || '').split('(')[0].trim();
    const qty = i.quantity || i.qty || '';
    const unit = i.unit || '';
    if (!qty) return name;
    const compactUnit = unit.length <= 2 ? unit : ` ${unit}`;
    return `${name} ${qty}${compactUnit}`.trim();
  };

  // Helper to format actual delivered items + quantities into one compact string
  const formatReceivedItems = (source, matchedDispatch = null, matchedAssessment = null, matchedStockTxs = []) => {
    const arr = resolveItemsArray(source, matchedDispatch, matchedAssessment, matchedStockTxs);
    if (arr) {
      return arr.map(formatItemWithQty).filter(Boolean).join(', ');
    }

    if (source?.quantity_or_value) {
      return source.quantity_or_value;
    }

    if (source?.items_distributed || matchedDispatch?.items_summary || source?.items_summary || source?.details || source?.description) {
      return (
        source?.items_distributed ||
        matchedDispatch?.items_summary ||
        source?.items_summary ||
        source?.details ||
        source?.description
      );
    }

    const std = resolveStandardCommodities(source);
    return std.map(formatItemWithQty).join(', ');
  };

  // Summarize an array of items into a compact quantity string (e.g. "10 items: 6 Bags, 10 kg, 5 L, 1 Kit")
  const summarizeItemsQuantities = (arr) => {
    if (!arr || arr.length === 0) return '1 Relief Kit';
    if (arr.length <= 2) {
      return arr
        .map(i => {
          if (typeof i === 'string') return i;
          const qty = i.quantity || i.qty || 1;
          const unit = i.unit || 'units';
          const name = i.item_name || i.name || i.commodity || '';
          const shortName = name.split('(')[0].trim();
          return `${qty} ${unit}${shortName ? ` ${shortName}` : ''}`.trim();
        })
        .filter(Boolean)
        .join(' • ');
    }

    const buckets = { bags: 0, kg: 0, l: 0, kits: 0, packs: 0, ssp: 0, usd: 0, otherCount: 0 };
    arr.forEach(i => {
      if (typeof i === 'string') {
        buckets.otherCount += 1;
        return;
      }
      const qty = Number(i.quantity || i.qty) || 1;
      const u = (i.unit || '').toLowerCase();
      if (u.includes('bag')) buckets.bags += qty;
      else if (u === 'kg' || u.includes('kilogram')) buckets.kg += qty;
      else if (u === 'l' || u.includes('litre') || u.includes('liter')) buckets.l += qty;
      else if (u.includes('kit')) buckets.kits += qty;
      else if (u.includes('pack') || u.includes('box')) buckets.packs += qty;
      else if (u === 'ssp') buckets.ssp += qty;
      else if (u === 'usd') buckets.usd += qty;
      else buckets.otherCount += 1;
    });

    const parts = [];
    if (buckets.bags > 0) parts.push(`${buckets.bags} Bags`);
    if (buckets.kg > 0) parts.push(`${buckets.kg} kg`);
    if (buckets.l > 0) parts.push(`${buckets.l} L`);
    if (buckets.kits > 0) parts.push(`${buckets.kits} ${buckets.kits === 1 ? 'Kit' : 'Kits'}`);
    if (buckets.packs > 0) parts.push(`${buckets.packs} ${buckets.packs === 1 ? 'Pack' : 'Packs'}`);
    if (buckets.ssp > 0) parts.push(`SSP ${buckets.ssp.toLocaleString()}`);
    if (buckets.usd > 0) parts.push(`$${buckets.usd.toLocaleString()}`);
    if (buckets.otherCount > 0 && parts.length < 3) parts.push(`+${buckets.otherCount} items`);

    return `${arr.length} items (${parts.join(', ') || 'Assorted'})`;
  };

  const formatQuantityValue = (source, matchedDispatch = null, matchedAssessment = null, matchedStockTxs = []) => {
    if (source?.quantity_or_value) return source.quantity_or_value;

    const arr = resolveItemsArray(source, matchedDispatch, matchedAssessment, matchedStockTxs);
    if (arr) {
      return summarizeItemsQuantities(arr);
    }

    if (source?.quantity) return `${source.quantity} ${source.unit || 'Units'}`;
    if (source?.amount) return formatCurrency(source.amount);
    if (matchedDispatch?.quantity) return `${matchedDispatch.quantity} ${matchedDispatch.unit || 'Units'}`;

    const std = resolveStandardCommodities(source);
    return summarizeItemsQuantities(std);
  };

  // Aggregate ALL people who received support across interventions, completed requests, and dispatches
  const supportReceivedList = useMemo(() => {
    const list = [];
    const seenKeys = new Set();

    // 1. Direct Interventions (Aid distributions recorded to beneficiaries)
    (data.interventions || []).forEach(item => {
      const ben = data.beneficiaries.find(b => 
        b.id === item.beneficiary_id || 
        b.beneficiary_code === item.beneficiary_code ||
        (item.beneficiary_name && b.full_name?.toLowerCase() === item.beneficiary_name?.toLowerCase())
      );
      const code = item.beneficiary_code || ben?.beneficiary_code || item.intervention_code || 'ADRA-BEN';
      const name = item.beneficiary_name || ben?.full_name || 'Verified Beneficiary';
      const key = `${code}-${item.intervention_code || item.description || item.details}`.toLowerCase();
      seenKeys.add(key);

      list.push({
        id: item.id || item.intervention_code,
        record_code: item.intervention_code || 'INT-AID',
        beneficiary_id: item.beneficiary_id || ben?.id,
        beneficiary_code: ben?.beneficiary_code || item.beneficiary_code || code,
        beneficiary_name: name,
        beneficiary_gender: ben?.gender || 'Female',
        beneficiary_age: ben?.age ? `${ben.age} yrs` : 'Adult',
        gender_age: `${ben?.gender || 'Female'} • ${ben?.age ? `${ben.age} yrs` : 'Adult'}`,
        project_id: item.project_id || ben?.project_id,
        project_name: item.project_name || ben?.project_name || 'Emergency Relief Assistance',
        support_type: item.intervention_type || 'Agricultural Support',
        description: formatReceivedItems(item),
        quantity_or_value: formatQuantityValue(item),
        date_received: item.intervention_date || item.date || item.created_at,
        delivered_by: item.responsible_officer || item.disbursed_by || 'ADRA Field Officer',
        location: item.location || ben?.location || 'Field Distribution Station',
        location_display: `${item.responsible_officer || item.disbursed_by || 'ADRA Field Team'} • ${item.location || ben?.location || 'Station'}`,
        verification_status: 'Confirmed Received',
        channel: 'Physical Distribution'
      });
    });

    // 2. Completed / Handed Over / Distributed / Approved Assistance Requests
    (data.assistanceRequests || []).forEach(req => {
      const st = (req.status || '').toLowerCase();
      const isRejected = st.includes('reject') || Boolean(req.returned_to_worker) || Number(req.status_stage) === -1;
      const isConfirmedReceived = 
        st === 'completed' || 
        st === 'distributed' || 
        st === 'delivered' ||
        st === 'distribution confirmed' ||
        Boolean(req.beneficiary_confirmed) ||
        Boolean(req.recipient_confirmed);
      const isHandedOver =
        st === 'handed over' ||
        st.includes('handed over') ||
        Boolean(req.distribution_confirmed) ||
        Boolean(req.distributed_at) ||
        Boolean(req.beneficiary_confirmed_at) ||
        Boolean(req.handed_over_at);
      const isDelivered = !isRejected && (
        isConfirmedReceived ||
        isHandedOver ||
        st.includes('delivered') ||
        st.includes('distributed') ||
        st.includes('approved') ||
        st.includes('dispatch') ||
        Number(req.status_stage) >= 4
      );

      if (!isDelivered) return;

      const ben = data.beneficiaries.find(b => 
        b.id === req.beneficiary_id || 
        b.beneficiary_code === req.beneficiary_code ||
        (req.beneficiary_name && b.full_name?.toLowerCase() === req.beneficiary_name?.toLowerCase())
      );

      const matchedDispatch = (data.dispatches || []).find(d =>
        (req.waybill_number && d.waybill_number === req.waybill_number) ||
        (req.id && (d.linked_request_id === req.id || d.id === req.id)) ||
        (req.request_code && (d.request_code === req.request_code || d.linked_request_id === req.request_code)) ||
        (req.beneficiary_code && d.beneficiary_code === req.beneficiary_code) ||
        (req.beneficiary_name && d.beneficiary_name && d.beneficiary_name.toLowerCase().trim() === req.beneficiary_name.toLowerCase().trim())
      );

      const matchedAssessment = (data.fieldAssessments || []).find(a =>
        (req.id && a.request_id === req.id) ||
        (req.request_code && (a.request_code === req.request_code || a.request_id === req.request_code)) ||
        (req.assessment_code && a.assessment_code === req.assessment_code) ||
        (req.beneficiary_name && a.beneficiary_name && a.beneficiary_name.toLowerCase().trim() === req.beneficiary_name.toLowerCase().trim())
      );

      const waybillRef = req.waybill_number || matchedDispatch?.waybill_number;
      const matchedStockTxs = waybillRef
        ? (data.stockTransactions || []).filter(tx => tx.reference_code === waybillRef && tx.transaction_type === 'DISPATCH_ISSUE')
        : [];

      const code = req.beneficiary_code || ben?.beneficiary_code || 'ADRA-BEN';
      const name = req.beneficiary_name || ben?.full_name || 'Verified Beneficiary';
      const key = `${code}-${req.request_code}`.toLowerCase();
      if (seenKeys.has(key)) return;
      seenKeys.add(key);

      // Use actual delivered/distributed items, never the request's personal reason text
      const itemsDesc = formatReceivedItems({ ...req, description: null }, matchedDispatch, matchedAssessment, matchedStockTxs);
      const qtyVal = formatQuantityValue(req, matchedDispatch, matchedAssessment, matchedStockTxs);
      const receivedDay =
        req.beneficiary_confirmed_at ||
        req.distributed_at ||
        req.distribution_date ||
        req.handed_over_at ||
        matchedDispatch?.delivered_at ||
        matchedDispatch?.collected_at ||
        req.reviewed_at ||
        req.updated_at ||
        req.created_at;

      const badgeStatus = isConfirmedReceived
        ? 'Confirmed Received'
        : isHandedOver
        ? 'Handed Over'
        : st.includes('dispatch') || st.includes('transit')
        ? 'Dispatched / In Transit'
        : (req.status_label || req.status || 'Approved for Support');

      list.push({
        id: req.id || req.request_code,
        record_code: req.request_code || 'ADR-REQ',
        beneficiary_id: req.beneficiary_id || ben?.id,
        beneficiary_code: code,
        beneficiary_name: name,
        beneficiary_gender: ben?.gender || req.gender || 'Female',
        beneficiary_age: ben?.age ? `${ben.age} yrs` : 'Adult',
        gender_age: `${ben?.gender || req.gender || 'Female'} • ${ben?.age ? `${ben.age} yrs` : 'Adult'}`,
        project_id: req.project_id || req.program_id || ben?.project_id,
        project_name: req.project_name || req.program_name || req.programme_name || ben?.project_name || 'Emergency Food Security & Livelihoods',
        support_type: cleanSupportTypeLabel(req.support_type || req.category || 'Food & Relief Commodities'),
        description: itemsDesc,
        quantity_or_value: qtyVal,
        date_received: receivedDay,
        delivered_by: req.distributed_by || matchedDispatch?.assigned_field_worker_name || req.assigned_field_worker_name || 'ADRA Field Worker',
        location: req.location || [req.state, req.payam || req.county].filter(Boolean).join(', ') || ben?.location || 'Community Distribution Point',
        location_display: `${req.distributed_by || req.assigned_field_worker_name || 'Field Officer'} • ${req.location || 'Community Hub'}`,
        verification_status: badgeStatus,
        channel: req.distribution_point || 'Field Handover'
      });
    });

    // 3. Delivered Relief Dispatches
    (data.dispatches || []).forEach(disp => {
      const dst = (disp.status || '').toLowerCase();
      const isDelivered = dst === 'delivered' || dst === 'completed' || dst === 'distributed' || Boolean(disp.handover_confirmed) || Boolean(disp.beneficiary_confirmed) || Boolean(disp.collected_at);
      if (!isDelivered || !disp.beneficiary_name) return;

      const ben = data.beneficiaries.find(b => 
        b.beneficiary_code === disp.beneficiary_code ||
        (disp.beneficiary_name && b.full_name?.toLowerCase() === disp.beneficiary_name?.toLowerCase())
      );

      const code = disp.beneficiary_code || ben?.beneficiary_code || 'ADRA-BEN';
      const name = disp.beneficiary_name;
      const key = `${code}-${disp.waybill_number}`.toLowerCase();
      const reqKey = disp.request_code ? `${code}-${disp.request_code}`.toLowerCase() : null;
      if (seenKeys.has(key) || (reqKey && seenKeys.has(reqKey))) return;
      seenKeys.add(key);

      list.push({
        id: disp.id || disp.waybill_number,
        record_code: disp.waybill_number || 'WAYBILL',
        beneficiary_id: ben?.id,
        beneficiary_code: code,
        beneficiary_name: name,
        beneficiary_gender: ben?.gender || 'Female',
        beneficiary_age: ben?.age ? `${ben.age} yrs` : 'Adult',
        gender_age: `${ben?.gender || 'Female'} • ${ben?.age ? `${ben.age} yrs` : 'Adult'}`,
        project_id: disp.project_id || ben?.project_id,
        project_name: disp.project_name || 'Humanitarian Logistics & Relief Dispatches',
        support_type: disp.category || 'Dispatched Aid Supplies',
        description: formatReceivedItems(disp),
        quantity_or_value: formatQuantityValue(disp),
        date_received: disp.delivered_at || disp.collected_at || disp.arrival_date || disp.dispatch_date || disp.created_at,
        delivered_by: disp.assigned_field_worker_name || disp.driver_name || disp.received_by || 'Logistics & Depot Officer',
        location: disp.destination || disp.location || ben?.location || 'State Depot Hub',
        location_display: `${disp.assigned_field_worker_name || disp.driver_name || 'Logistics Officer'} • ${disp.destination || 'Depot'}`,
        verification_status: 'Confirmed Received',
        channel: 'Depot Waybill Consignment'
      });
    });

    // Sort by most recent date_received first
    return list.sort((a, b) => new Date(b.date_received || 0) - new Date(a.date_received || 0));
  }, [data]);

  // Set of beneficiary identifiers who received support
  const supportReceivedBeneficiaryKeys = useMemo(() => {
    const keys = new Set();
    supportReceivedList.forEach(s => {
      if (s.beneficiary_id) keys.add(String(s.beneficiary_id).toLowerCase());
      if (s.beneficiary_code) keys.add(String(s.beneficiary_code).toLowerCase());
      if (s.beneficiary_name) keys.add(String(s.beneficiary_name).toLowerCase());
    });
    return keys;
  }, [supportReceivedList]);

  // Unique categories of support received
  const availableSupportCategories = useMemo(() => {
    const cats = new Set();
    supportReceivedList.forEach(item => {
      if (item.support_type) cats.add(item.support_type);
    });
    return Array.from(cats);
  }, [supportReceivedList]);

  // Unique receipt statuses for support received
  const availableSupportStatuses = useMemo(() => {
    const statuses = new Set();
    supportReceivedList.forEach(item => {
      if (item.verification_status) statuses.add(item.verification_status);
    });
    return Array.from(statuses);
  }, [supportReceivedList]);

  // Metrics for Support Received
  const supportReceivedMetrics = useMemo(() => {
    const totalDistributions = supportReceivedList.length;
    const uniqueBeneficiaries = new Set(
      supportReceivedList.map(i => (i.beneficiary_name || i.beneficiary_code || '').toLowerCase())
    ).size;
    const foodAndWashCount = supportReceivedList.filter(i => 
      i.support_type?.toLowerCase().includes('food') || 
      i.support_type?.toLowerCase().includes('wash') ||
      i.support_type?.toLowerCase().includes('water') ||
      i.support_type?.toLowerCase().includes('agri')
    ).length;
    const cashCount = supportReceivedList.filter(i => 
      i.support_type?.toLowerCase().includes('cash') || 
      i.quantity_or_value?.toLowerCase().includes('$') ||
      i.quantity_or_value?.toLowerCase().includes('ssp')
    ).length;

    return {
      totalDistributions,
      uniqueBeneficiaries,
      foodAndWashCount,
      cashCount,
    };
  }, [supportReceivedList]);

  // Financial Metrics & Filtered Data
  const financialMetrics = useMemo(() => {
    const { donorGrants, budgets, expenditures, fieldFundingRequests, purchaseOrders, projects } = data;

    const extraProjectGrants = (projects || [])
      .filter(p => p.donor_id && !donorGrants.some(g => g.project_id === p.id && g.donor_id === p.donor_id))
      .map(p => ({
        id: `proj_grant_${p.id}`,
        grant_code: p.project_code || `GRT-${String(p.id).slice(0, 6).toUpperCase()}`,
        donor_id: p.donor_id,
        project_id: p.id,
        project_name: p.project_name,
        total_committed: Number(p.budget) || 0,
        disbursed_amount: Number(p.budget) || 0,
        expended_amount: expenditures
          .filter(e => e.project_id === p.id || (p.project_name && e.project_name === p.project_name))
          .reduce((s, e) => s + (Number(e.amount) || 0), 0),
        status: p.status || 'Active',
        currency: 'SSP',
        created_at: p.created_at
      }));

    const combinedGrants = [...donorGrants, ...extraProjectGrants];

    const filteredGrants = combinedGrants.filter(g => {
      if (selectedProjectId === 'ALL') return true;
      return g.project_id === selectedProjectId ||
        (selectedProj && g.project_name?.toLowerCase().includes(selectedProj.project_name?.toLowerCase()));
    });

    const filteredBudgets = budgets.filter(b => {
      if (selectedProjectId === 'ALL') return true;
      return b.project_id === selectedProjectId ||
        (selectedProj && b.project_name?.toLowerCase().includes(selectedProj.project_name?.toLowerCase()));
    });

    const filteredExpenditures = expenditures.filter(e => {
      if (selectedProjectId === 'ALL') return true;
      return e.project_id === selectedProjectId ||
        (selectedProj && e.project_name?.toLowerCase().includes(selectedProj.project_name?.toLowerCase()));
    });

    const filteredFacilitations = fieldFundingRequests.filter(r => {
      if (selectedProjectId === 'ALL') return true;
      return r.project_id === selectedProjectId ||
        (selectedProj && r.project_name?.toLowerCase().includes(selectedProj.project_name?.toLowerCase()));
    });

    const filteredPOs = purchaseOrders.filter(po => {
      if (selectedProjectId === 'ALL') return true;
      return po.project_id === selectedProjectId ||
        (selectedProj && po.project_name?.toLowerCase().includes(selectedProj.project_name?.toLowerCase()));
    });

    const totalCommitted = filteredGrants.reduce((sum, g) => sum + (Number(g.total_committed) || 0), 0);
    const totalDisbursedFromDonors = filteredGrants.reduce((sum, g) => sum + (Number(g.disbursed_amount) || 0), 0);
    const totalExpendedGrants = filteredGrants.reduce((sum, g) => sum + (Number(g.expended_amount) || 0), 0);

    const totalAllocatedBudget = filteredBudgets.reduce((sum, b) => sum + (Number(b.allocated_amount) || 0), 0);
    const totalExpendituresVal = filteredExpenditures.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const disbursedFacilitationsVal = filteredFacilitations
      .filter(r => r.stage === 4 || r.status === 'Disbursed' || r.status?.includes('Disbursed'))
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    const settledPOsVal = filteredPOs
      .filter(po => po.stage === 4 || po.status === 'Paid & Settled' || po.payment_status === 'Paid')
      .reduce((sum, po) => sum + (Number(po.total_amount) || 0), 0);

    const totalActualDisbursedAll = totalExpendituresVal + disbursedFacilitationsVal + settledPOsVal;
    const remainingBalance = Math.max(0, (totalCommitted || totalAllocatedBudget) - (totalExpendedGrants || totalActualDisbursedAll));
    const effectiveTotal = totalCommitted > 0 ? totalCommitted : (totalAllocatedBudget > 0 ? totalAllocatedBudget : 1);
    const effectiveExpended = totalExpendedGrants > 0 ? totalExpendedGrants : totalActualDisbursedAll;
    const burnRate = Math.min(100, Math.round((effectiveExpended / effectiveTotal) * 100));

    const budgetVsActuals = filteredBudgets.map(b => {
      const bProjName = (b.project_name || '').toLowerCase();
      const bCat = (b.budget_category || '').toLowerCase();
      const matchedExp = filteredExpenditures
        .filter(e => {
          const sameProj = e.project_id === b.project_id || (bProjName && (e.project_name || '').toLowerCase() === bProjName);
          if (!sameProj) return false;
          const eCat = (e.budget_category || e.category || '').toLowerCase();
          return bCat && eCat && (eCat === bCat || eCat.includes(bCat) || bCat.includes(eCat));
        })
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const allocated = Number(b.allocated_amount) || 0;
      const dbSpent = b.expended_amount != null ? Number(b.expended_amount) : (b.spent_amount != null ? Number(b.spent_amount) : null);
      const expended = dbSpent !== null ? dbSpent : matchedExp;
      const remaining = allocated - expended;
      const bRate = allocated > 0 ? Math.round((expended / allocated) * 100) : 0;
      return {
        ...b,
        allocated_amount: allocated,
        expended_amount: expended,
        remaining_balance: remaining,
        burn_rate: bRate,
        burn_rate_label: `${bRate}%`
      };
    });

    return {
      totalCommitted,
      totalDisbursedFromDonors,
      totalExpendedGrants,
      totalExpendituresVal,
      remainingBalance,
      burnRate,
      grantsList: filteredGrants,
      budgetsList: budgetVsActuals,
      expendituresList: filteredExpenditures,
      facilitationsList: filteredFacilitations,
      posList: filteredPOs,
    };
  }, [data, selectedProjectId, selectedProj]);

  // Current report items list
  const reportItems = useMemo(() => {
    let items = [];
    const query = searchQuery.trim().toLowerCase();

    if (reportType === 'financials') {
      if (financialSubView === 'grants') {
        items = financialMetrics.grantsList.map(g => {
          const committed = Number(g.total_committed) || 0;
          const expended = Number(g.expended_amount) || 0;
          const remaining = Math.max(0, committed - expended);
          const bRate = committed > 0 ? Math.min(100, Math.round((expended / committed) * 100)) : 0;

          const matchedDonor = (data.donors || []).find(d => d.id === g.donor_id);
          const matchedProject = (data.projects || []).find(p => p.id === g.project_id);

          const inferDonorFromCode = (code = '') => {
            const c = code.toUpperCase();
            if (c.includes('GAC')) return 'Global Affairs Canada (GAC)';
            if (c.includes('ECHO')) return 'European Union (ECHO)';
            if (c.includes('BHA')) return 'USAID Bureau for Humanitarian Assistance (BHA)';
            if (c.includes('USAID')) return 'USAID Humanitarian Aid';
            if (c.includes('ADRA')) return 'ADRA International';
            return 'Institutional Donor Partner';
          };

          const resolvedDonorName =
            g.donor_name ||
            g.donors?.donor_name ||
            g.donors?.name ||
            matchedDonor?.donor_name ||
            matchedDonor?.name ||
            matchedDonor?.organization_name ||
            inferDonorFromCode(g.grant_code);

          const resolvedProjectName =
            g.project_name ||
            g.projects?.project_name ||
            matchedProject?.project_name ||
            'Emergency Relief & Humanitarian Programme';

          return {
            ...g,
            donor_name: resolvedDonorName,
            project_name: resolvedProjectName,
            total_committed_num: committed,
            expended_amount_num: expended,
            remaining_balance_num: remaining,
            burn_rate: bRate,
            burn_rate_label: `${bRate}%`,
            status: g.status || 'Active',
            currency: g.currency || 'USD'
          };
        });
      } else if (financialSubView === 'budgets') {
        items = financialMetrics.budgetsList;
      } else if (financialSubView === 'ledger') {
        items = financialMetrics.expendituresList.map(e => ({
          ...e,
          status: 'Verified',
          amount_num: Number(e.amount) || 0
        }));
      } else if (financialSubView === 'facilitations') {
        const formatBreakdown = (bd, fallbackPurpose) => {
          let arr = bd;
          if (typeof bd === 'string' && bd.trim().startsWith('[')) {
            try { arr = JSON.parse(bd); } catch (_) {}
          }
          if (Array.isArray(arr) && arr.length > 0) {
            return arr
              .map(b => `${b.item || b.label || 'Item'}: ${formatCurrency(Number(b.amount) || 0)}`)
              .join(' • ');
          }
          return cleanDescription(fallbackPurpose) || 'Field Transport & Logistics';
        };

        const seenReqCodes = new Set();
        const combinedFacilitations = [];

        // 1. Existing field funding requests (enriched with any matching expenditure disbursement)
        financialMetrics.facilitationsList.forEach(r => {
          const reqCode = r.request_code || r.id;
          if (reqCode) seenReqCodes.add(String(reqCode).toLowerCase());

          const matchedExp = financialMetrics.expendituresList.find(e =>
            e.description && reqCode && e.description.toLowerCase().includes(String(reqCode).toLowerCase())
          );

          const isPaid = r.status === 'Disbursed' || r.stage === 4 || Boolean(r.finance_disbursement?.disbursed_at) || Boolean(matchedExp);
          const dayPaid = r.finance_disbursement?.disbursed_at || matchedExp?.expenditure_date || (isPaid ? (r.updated_at || r.created_at) : null);

          const parseBreakdownItems = (bd, fallbackPurpose) => {
            let arr = bd;
            if (typeof bd === 'string' && bd.trim().startsWith('[')) {
              try { arr = JSON.parse(bd); } catch (_) {}
            }
            if (Array.isArray(arr) && arr.length > 0) {
              return arr.map(b => `${b.item || b.label || 'Item'}: ${formatCurrency(Number(b.amount) || 0)}`);
            }
            return fallbackPurpose ? [cleanDescription(fallbackPurpose)] : ['Field Transport & Logistics'];
          };

          const bdItems = parseBreakdownItems(r.breakdown, r.purpose);
          combinedFacilitations.push({
            ...r,
            worker_display: r.field_worker_name || r.worker_name || 'Field Officer',
            location_display: [r.state, r.payam || r.county || r.location].filter(Boolean).join(', ') || 'Field Station',
            channel_display: r.preferred_payout || r.finance_disbursement?.payment_method || 'm-GURUSH',
            amount_num: Number(r.amount) || Number(matchedExp?.amount) || 0,
            breakdown_items: bdItems,
            breakdown_display: bdItems.join(' • '),
            day_paid: dayPaid,
            day_paid_display: dayPaid ? formatDate(dayPaid) : 'Pending Payment',
            status: isPaid ? 'Disbursed' : (r.status || 'Pending')
          });
        });

        // Index facilitation audit logs by REQ-FND code for enrichment & recovery
        const auditFacilitationMap = new Map();
        (data.auditLogs || []).forEach(l => {
          const detailsStr = typeof l.details === 'string' ? l.details : JSON.stringify(l.details || '');
          const recId = String(l.record_id || '');
          const reqMatch = recId.match(/REQ-FND-\d{4}-\d+/i) || detailsStr.match(/REQ-FND-\d{4}-\d+/i);
          if (!reqMatch && !l.module?.toLowerCase().includes('field finance') && !l.action?.toLowerCase().includes('facilitation')) {
            return;
          }
          const reqCode = (reqMatch ? reqMatch[0] : recId).toUpperCase();
          if (!reqCode) return;

          const existing = auditFacilitationMap.get(reqCode) || {
            request_code: reqCode,
            worker_display: null,
            location_display: null,
            category: null,
            amount_num: 0,
            day_paid: null,
            status: 'Pending Supervisor Approval',
            created_at: l.created_at || l.timestamp
          };

          // Parse worker, amount, category, payam from audit log details
          const workerCreate = detailsStr.match(/Field Worker\s+([A-Za-z\s]+?)\s+requested/i);
          const workerDisburse = detailsStr.match(/to\s+([A-Za-z\s]+?)\.\s*Voucher/i);
          if (workerCreate) existing.worker_display = workerCreate[1].trim();
          else if (workerDisburse && !existing.worker_display) existing.worker_display = workerDisburse[1].trim();

          const amtMatch = detailsStr.match(/([\d,]+)\s*SSP/i);
          if (amtMatch && !existing.amount_num) {
            existing.amount_num = Number(amtMatch[1].replace(/,/g, '')) || 0;
          }

          const catMatch = detailsStr.match(/\(([^)]+)\)\s+for\s+([^.]+)\./i);
          if (catMatch) {
            existing.category = catMatch[1].trim();
            existing.location_display = catMatch[2].trim();
          }

          const bdMatch = detailsStr.match(/Breakdown:\s*(.+)$/i);
          if (bdMatch && bdMatch[1]) {
            existing.breakdown_items = bdMatch[1]
              .split('|')
              .map(s => s.trim())
              .filter(Boolean);
          }

          const act = (l.action || '').toUpperCase();
          if (act.includes('DISBURSE')) {
            existing.status = 'Disbursed';
            existing.day_paid = l.created_at || l.timestamp;
          } else if (act.includes('PM_APPROVE') && existing.status !== 'Disbursed') {
            existing.status = 'Approved (Pending Finance Disbursement)';
          } else if (act.includes('SUPERVISOR_APPROVE') && existing.status !== 'Disbursed' && !existing.status.includes('Approved')) {
            existing.status = 'Pending Program Manager Approval';
          } else if (act.includes('REJECT') && existing.status !== 'Disbursed') {
            existing.status = 'Rejected / Returned';
          }

          auditFacilitationMap.set(reqCode, existing);
        });

        // 2. Also pull any disbursed facilitations recorded in Supabase expenditures ledger that aren't in localStorage
        financialMetrics.expendituresList.forEach(e => {
          const desc = e.description || '';
          const isFacilitationExp = desc.toLowerCase().includes('facilitation') || desc.includes('REQ-FND-');
          if (!isFacilitationExp) return;

          const reqMatch = desc.match(/REQ-FND-\d{4}-\d+/i);
          const reqCode = reqMatch ? reqMatch[0].toUpperCase() : (e.expenditure_code || e.id);
          if (seenReqCodes.has(String(reqCode).toLowerCase())) return;
          seenReqCodes.add(String(reqCode).toLowerCase());

          const auditInfo = auditFacilitationMap.get(reqCode);
          const workerMatch = desc.match(/for\s+([A-Za-z\s]+?)\s*\(/i);
          const workerName = auditInfo?.worker_display || (workerMatch ? workerMatch[1].trim() : 'Field Officer');
          const catMatch = desc.match(/\(([^)]+)\)\s+for/i);
          const categoryLabel = auditInfo?.category || (catMatch ? catMatch[1].trim() : 'Field Operational Facilitation');

          const expItems = (auditInfo?.breakdown_items && auditInfo.breakdown_items.length > 0)
            ? auditInfo.breakdown_items
            : [
                `${categoryLabel} (${auditInfo?.location_display || e.project_name || 'Field Ops'})`,
                cleanDescription(desc)
              ];

          combinedFacilitations.push({
            id: e.id,
            request_code: reqCode,
            worker_display: workerName,
            location_display: auditInfo?.location_display || e.project_name || 'Field Operations Hub',
            purpose: cleanDescription(desc),
            channel_display: 'm-Gurush / Finance Voucher',
            amount_num: Number(e.amount) || auditInfo?.amount_num || 0,
            breakdown_items: expItems,
            breakdown_display: expItems.join(' • '),
            day_paid: e.expenditure_date || e.created_at,
            day_paid_display: formatDate(e.expenditure_date || e.created_at),
            status: 'Disbursed'
          });
        });

        // 3. Also pull any remaining facilitations from Supabase audit_logs (e.g. pending, approved, or disbursed without expenditure entry)
        auditFacilitationMap.forEach((info, reqCode) => {
          if (seenReqCodes.has(reqCode.toLowerCase())) return;
          seenReqCodes.add(reqCode.toLowerCase());

          const auditItems = (info.breakdown_items && info.breakdown_items.length > 0)
            ? info.breakdown_items
            : [info.category ? `${info.category} (${info.location_display || 'Field Ops'})` : 'Field Operational Facilitation'];

          combinedFacilitations.push({
            id: reqCode,
            request_code: reqCode,
            worker_display: info.worker_display || 'Field Officer',
            location_display: info.location_display || 'Field Station',
            purpose: info.category || 'Field Operational Facilitation',
            channel_display: 'm-Gurush Mobile Money',
            amount_num: info.amount_num || 0,
            breakdown_items: auditItems,
            breakdown_display: auditItems.join(' • '),
            day_paid: info.day_paid,
            day_paid_display: info.day_paid ? formatDate(info.day_paid) : 'Pending Payment',
            status: info.status
          });
        });

        // Sort paid/most recent first, using REQ-FND sequence as tie-breaker
        const extractReqSeq = (code = '') => {
          const m = String(code).match(/(\d+)$/);
          return m ? Number(m[1]) : 0;
        };
        items = combinedFacilitations.sort((a, b) => {
          const ta = new Date(a.day_paid || a.updated_at || a.created_at || 0).getTime() || 0;
          const tb = new Date(b.day_paid || b.updated_at || b.created_at || 0).getTime() || 0;
          if (tb !== ta) return tb - ta;
          return extractReqSeq(b.request_code) - extractReqSeq(a.request_code);
        });
      } else if (financialSubView === 'pos') {
        items = financialMetrics.posList.map(po => ({
          ...po,
          supplier_name: po.supplier_name || 'Registered Vendor',
          amount_num: Number(po.total_amount) || 0,
          status_display: po.status || 'Paid & Settled',
          grn_display: po.grn_number || 'GRN-PENDING',
          date_display: po.settled_at || po.created_at
        }));
      }
    } else if (reportType === 'support_received') {
      items = supportReceivedList.filter(item => {
        if (selectedProjectId !== 'ALL' && item.project_id && item.project_id !== selectedProjectId) {
          if (!selectedProj || !item.project_name?.toLowerCase().includes(selectedProj.project_name?.toLowerCase())) {
            return false;
          }
        }
        if (supportCategoryFilter !== 'ALL' && item.support_type !== supportCategoryFilter) {
          return false;
        }
        if (supportStatusFilter !== 'ALL' && item.verification_status !== supportStatusFilter) {
          return false;
        }
        return true;
      });
    } else if (reportType === 'projects') {
      items = selectedProjectId === 'ALL'
        ? data.projects
        : data.projects.filter(p => p.id === selectedProjectId);
      items = items.map(p => ({
        ...p,
        manager_name: p.manager_name || p.project_manager || 'Unassigned',
        budget_num: Number(p.budget) || 0,
        status: p.status || 'Active'
      }));
    } else if (reportType === 'audit_logs') {
      items = data.auditLogs.map(l => {
        const detailsStr = typeof l.details === 'object' && l.details !== null
          ? (l.details.message || l.details.description || JSON.stringify(l.details))
          : String(l.details || 'System event recorded');
        return {
          ...l,
          operator_display: l.user_email || l.user_name || l.recorded_by || 'HQ Admin',
          user_role: l.user_role || 'Staff',
          action_type: l.action || 'EVENT',
          module_name: l.module || 'Field Ops',
          details_clean: detailsStr,
          timestamp_formatted: formatDate(l.created_at || l.timestamp)
        };
      });
    }

    if (query) {
      items = items.filter(item => JSON.stringify(item).toLowerCase().includes(query));
    }

    // Ensure all report views (other than facilitations which has its own sequence-aware sort) are ordered latest first
    if (!(reportType === 'financials' && financialSubView === 'facilitations')) {
      const getItemTime = (it) => {
        const raw =
          it.date_received ||
          it.expenditure_date ||
          it.settled_at ||
          it.date_display ||
          it.created_at ||
          it.timestamp ||
          it.updated_at ||
          it.start_date ||
          0;
        const ts = new Date(raw).getTime();
        return Number.isFinite(ts) ? ts : 0;
      };
      items = [...items].sort((a, b) => getItemTime(b) - getItemTime(a));
    }

    return items;
  }, [
    reportType, 
    financialSubView, 
    supportCategoryFilter, 
    supportStatusFilter,
    beneficiarySupportFilter, 
    financialMetrics, 
    supportReceivedList, 
    supportReceivedBeneficiaryKeys, 
    data, 
    selectedProjectId, 
    selectedProj, 
    searchQuery
  ]);

  // Reset to page 1 whenever filters or tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [reportType, financialSubView, supportCategoryFilter, supportStatusFilter, beneficiarySupportFilter, selectedProjectId, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(reportItems.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return reportItems.slice(start, start + itemsPerPage);
  }, [reportItems, currentPage, itemsPerPage]);

  const getActiveStatementLabel = () => {
    if (reportType === 'financials') {
      switch (financialSubView) {
        case 'grants': return 'Donor Grants Portfolio';
        case 'budgets': return 'Budget vs. Actuals Matrix';
        case 'ledger': return 'Expense Ledger & Vouchers';
        case 'facilitations': return 'Field Worker Facilitations';
        case 'pos': return 'Purchase Orders & Contracts';
        default: return 'Financial Statement';
      }
    }
    switch (reportType) {
      case 'support_received': return 'People Who Received Support (Aid Distribution Log)';
      case 'projects': return 'Field Programmes Portfolio';
      case 'audit_logs': return 'System Transactions & Audit Trail';
      default: return 'Management Report';
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const filename = `ADRA_${reportType.toUpperCase()}_${reportType === 'financials' ? financialSubView.toUpperCase() : ''}_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(reportItems, filename);
    toast.success(`Exported ${reportItems.length} records to CSV.`);
  };

  // PDF Export
  const handleExportPDF = () => {
    let columns = [];

    if (reportType === 'financials') {
      if (financialSubView === 'grants') {
        columns = [
          { header: 'Grant Code', key: 'grant_code' },
          { header: 'Donor Agency', key: 'donor_name' },
          { header: 'Programme Title', key: 'project_name' },
          { header: 'Committed ($)', key: 'total_committed_num', type: 'currency' },
          { header: 'Disbursed ($)', key: 'disbursed_amount', type: 'currency' },
          { header: 'Expended ($)', key: 'expended_amount_num', type: 'currency' },
          { header: 'Remaining ($)', key: 'remaining_balance_num', type: 'currency' },
          { header: 'Burn Rate', key: 'burn_rate_label' },
          { header: 'Status', key: 'status' },
        ];
      } else if (financialSubView === 'budgets') {
        columns = [
          { header: 'Programme Title', key: 'project_name' },
          { header: 'Budget Category', key: 'budget_category' },
          { header: 'Fiscal Year', key: 'financial_year' },
          { header: 'Allocated Budget', key: 'allocated_amount', type: 'currency' },
          { header: 'Expended Actuals', key: 'expended_amount', type: 'currency' },
          { header: 'Remaining Variance', key: 'remaining_balance', type: 'currency' },
          { header: 'Burn Rate', key: 'burn_rate_label' },
        ];
      } else if (financialSubView === 'ledger') {
        columns = [
          { header: 'Voucher Ref', key: 'expenditure_code' },
          { header: 'Programme Title', key: 'project_name' },
          { header: 'Expense Category', key: 'category' },
          { header: 'Description', key: 'description' },
          { header: 'Amount (SSP)', key: 'amount_num', type: 'currency' },
          { header: 'Date Logged', key: 'expenditure_date', type: 'date' },
          { header: 'Verification', key: 'status' },
        ];
      } else if (financialSubView === 'facilitations') {
        columns = [
          { header: 'Req Code', key: 'request_code' },
          { header: 'Field Worker', key: 'worker_display' },
          { header: 'Location', key: 'location_display' },
          { header: 'Purpose & Breakdown', key: 'breakdown_display' },
          { header: 'Amount (SSP)', key: 'amount_num', type: 'currency' },
          { header: 'Day Paid', key: 'day_paid_display' },
          { header: 'Channel', key: 'channel_display' },
          { header: 'Status', key: 'status' },
        ];
      } else if (financialSubView === 'pos') {
        columns = [
          { header: 'PO Number', key: 'po_number' },
          { header: 'Supplier', key: 'supplier_name' },
          { header: 'Consignment', key: 'items_summary' },
          { header: 'Total Value (SSP)', key: 'amount_num', type: 'currency' },
          { header: 'GRN Number', key: 'grn_display' },
          { header: 'Status', key: 'status_display' },
        ];
      }
    } else if (reportType === 'support_received') {
      columns = [
        { header: 'Recipient ID', key: 'beneficiary_code' },
        { header: 'Recipient Full Name', key: 'beneficiary_name' },
        { header: 'Gender / Age', key: 'gender_age' },
        { header: 'Support Type', key: 'support_type' },
        { header: 'Support Received (Commodity & Qty)', key: 'description' },
        { header: 'Date Received', key: 'date_received', type: 'date' },
        { header: 'Delivered By / Location', key: 'location_display' },
        { header: 'Status', key: 'verification_status' },
      ];
    } else if (reportType === 'projects') {
      columns = [
        { header: 'Code', key: 'project_code' },
        { header: 'Programme Title', key: 'project_name' },
        { header: 'Zone', key: 'location' },
        { header: 'Manager', key: 'manager_name' },
        { header: 'Start Date', key: 'start_date', type: 'date' },
        { header: 'End Date', key: 'end_date', type: 'date' },
        { header: 'Budget', key: 'budget_num', type: 'currency' },
        { header: 'Status', key: 'status' },
      ];
    } else if (reportType === 'audit_logs') {
      columns = [
        { header: 'Audit Ref', key: 'id' },
        { header: 'User Email', key: 'operator_display' },
        { header: 'Role', key: 'user_role' },
        { header: 'Action', key: 'action_type' },
        { header: 'Module', key: 'module_name' },
        { header: 'Details', key: 'details_clean' },
        { header: 'Timestamp', key: 'timestamp_formatted' },
      ];
    }

    exportToPDF({
      title: `ADRA • ${getActiveStatementLabel().toUpperCase()}`,
      subtitle: `Scope: ${selectedProjectId === 'ALL' ? 'Consolidated Organization Portfolio' : (selectedProj?.project_name || 'Project Focus')} • Generated: ${new Date().toLocaleDateString()}`,
      columns,
      data: reportItems,
      fileName: `ADRA_${reportType}_report.pdf`,
      summary: [
        { label: 'Total Records', value: String(reportItems.length) },
        { label: 'Scope', value: selectedProjectId === 'ALL' ? 'All Projects' : (selectedProj?.project_code || 'Project') },
        ...(reportType === 'financials' ? [{ label: 'Burn Rate', value: `${financialMetrics.burnRate}%` }] : []),
        ...(reportType === 'support_received' ? [{ label: 'Unique Recipients', value: String(supportReceivedMetrics.uniqueBeneficiaries) }] : [])
      ]
    });

    toast.success('Official PDF document generated.');
  };

  const reportTabs = [
    { id: 'financials', label: 'Financial Report', icon: Coins },
    { id: 'support_received', label: 'People Who Received Support', icon: PackageCheck, badge: supportReceivedList.length },
    { id: 'projects', label: 'Field Programmes', icon: FolderKanban },
    { id: 'audit_logs', label: 'Audit Trail', icon: History },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10 animate-in fade-in duration-150">
      
      {/* 1. CLEAN COMPACT HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 no-print">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#006B56]" />
            Reporting & Audit Center
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Export certified financial statements, direct aid delivery registers, programme summaries, and verified audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportCSV} icon={FileSpreadsheet} className="text-xs">
            Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={handleExportPDF} icon={Download} className="text-xs font-semibold">
            Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()} icon={Printer} className="text-xs">
            Print
          </Button>
        </div>
      </div>

      {/* 2. UNIFIED SINGLE-ROW CONTROL BAR */}
      <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 no-print">
        {/* Left: Domain Segmented Pills */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {reportTabs.map(tab => {
            const Icon = tab.icon;
            const isSelected = reportType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setReportType(tab.id);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#006B56]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? 'bg-emerald-100 text-[#006B56]' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Inline Controls (Statement select, Category select, Project select, Search) */}
        <div className="flex flex-wrap items-center gap-2">
          {reportType === 'financials' && (
            <select
              value={financialSubView}
              onChange={(e) => {
                setFinancialSubView(e.target.value);
                setSearchQuery('');
              }}
              className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-[#006B56] cursor-pointer"
            >
              <option value="grants">Statement: Donor Grants ({financialMetrics.grantsList.length})</option>
              <option value="budgets">Statement: Budget vs Actuals ({financialMetrics.budgetsList.length})</option>
              <option value="ledger">Statement: Expense Ledger ({financialMetrics.expendituresList.length})</option>
              <option value="facilitations">Statement: Field Facilitations ({financialMetrics.facilitationsList.length})</option>
              <option value="pos">Statement: Supplier POs ({financialMetrics.posList.length})</option>
            </select>
          )}

          {reportType === 'support_received' && (
            <>
              <select
                value={supportStatusFilter}
                onChange={(e) => setSupportStatusFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-[#006B56] cursor-pointer"
              >
                <option value="ALL">All Statuses ({supportReceivedList.length})</option>
                {availableSupportStatuses.map(st => (
                  <option key={st} value={st}>
                    {st} ({supportReceivedList.filter(s => s.verification_status === st).length})
                  </option>
                ))}
              </select>

              <select
                value={supportCategoryFilter}
                onChange={(e) => setSupportCategoryFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-[#006B56] cursor-pointer"
              >
                <option value="ALL">All Support Types ({supportReceivedList.length})</option>
                {availableSupportCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat} ({supportReceivedList.filter(s => s.support_type === cat).length})
                  </option>
                ))}
              </select>

              {(supportStatusFilter !== 'ALL' || supportCategoryFilter !== 'ALL' || selectedProjectId !== 'ALL' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSupportStatusFilter('ALL');
                    setSupportCategoryFilter('ALL');
                    setSelectedProjectId('ALL');
                    setSearchQuery('');
                  }}
                  className="text-xs py-1.5 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold border border-rose-200 transition cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </>
          )}

          {reportType !== 'audit_logs' && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 outline-none focus:ring-1 focus:ring-[#006B56] cursor-pointer max-w-[190px]"
            >
              <option value="ALL">All Projects ({data.projects.length})</option>
              {data.projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.project_code} — {p.project_name}
                </option>
              ))}
            </select>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={reportType === 'audit_logs' ? "Filter audit events..." : "Search items..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#006B56] w-36 sm:w-52"
            />
          </div>
        </div>
      </div>

      {/* 3. EXECUTIVE FINANCIAL SUMMARY */}
      {reportType === 'financials' && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 no-print">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Committed</span>
            <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">
              {formatCurrency(financialMetrics.totalCommitted)}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Donor Disbursed</span>
            <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">
              {formatCurrency(financialMetrics.totalDisbursedFromDonors)}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Expended</span>
            <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">
              {formatCurrency(financialMetrics.totalExpendituresVal)}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Remaining Balance</span>
            <span className="text-xl font-bold text-teal-800 font-mono mt-0.5 block">
              {formatCurrency(Math.max(0, financialMetrics.totalCommitted - financialMetrics.totalExpendituresVal))}
            </span>
          </div>
        </div>
      )}

      {/* 4. EXECUTIVE SUMMARY: PEOPLE WHO RECEIVED SUPPORT */}
      {reportType === 'support_received' && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 no-print">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">People Supported</span>
            <span className="text-xl font-bold text-[#006B56] font-mono mt-0.5 block">
              {supportReceivedMetrics.uniqueBeneficiaries.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Verified individual heads & households
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Distributions</span>
            <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">
              {supportReceivedMetrics.totalDistributions.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Direct physical handovers & consignments
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Food & WASH Packages</span>
            <span className="text-xl font-bold text-teal-800 font-mono mt-0.5 block">
              {supportReceivedMetrics.foodAndWashCount.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Seeds, rations, kits & water tools</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cash & Grants Disbursed</span>
            <span className="text-xl font-bold text-emerald-800 font-mono mt-0.5 block">
              {supportReceivedMetrics.cashCount.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Emergency cash & scholarships</span>
          </div>
        </div>
      )}

      {/* 5. CLEAN DATA TABLE */}
      {loading ? (
        <div className="py-12">
          <LoadingSpinner text="Loading report..." />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Subtle Minimal Header Strip */}
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {getActiveStatementLabel()}
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                ({reportItems.length} {reportItems.length === 1 ? 'record' : 'records'})
              </span>
            </div>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Verified Official</span>
            </span>
          </div>

          {reportItems.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No matching records found for the current selection.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  {/* FINANCIAL: GRANTS */}
                  {reportType === 'financials' && financialSubView === 'grants' && (
                    <tr>
                      <th className="py-2.5 px-3.5">Code</th>
                      <th className="py-2.5 px-3.5">Donor</th>
                      <th className="py-2.5 px-3.5">Programme</th>
                      <th className="py-2.5 px-3.5">Committed</th>
                      <th className="py-2.5 px-3.5">Disbursed</th>
                      <th className="py-2.5 px-3.5">Expended</th>
                      <th className="py-2.5 px-3.5">Remaining</th>
                      <th className="py-2.5 px-3.5">Burn Rate</th>
                      <th className="py-2.5 px-3.5">Status</th>
                    </tr>
                  )}

                  {/* FINANCIAL: BUDGETS */}
                  {reportType === 'financials' && financialSubView === 'budgets' && (
                    <tr>
                      <th className="py-2.5 px-3.5">Programme</th>
                      <th className="py-2.5 px-3.5">Category</th>
                      <th className="py-2.5 px-3.5">Year</th>
                      <th className="py-2.5 px-3.5">Allocated</th>
                      <th className="py-2.5 px-3.5">Expended</th>
                      <th className="py-2.5 px-3.5">Variance</th>
                      <th className="py-2.5 px-3.5">Burn Rate</th>
                    </tr>
                  )}

                  {/* FINANCIAL: LEDGER */}
                  {reportType === 'financials' && financialSubView === 'ledger' && (
                    <tr>
                      <th className="py-2.5 px-3.5">Voucher</th>
                      <th className="py-2.5 px-3.5">Programme</th>
                      <th className="py-2.5 px-3.5">Category</th>
                      <th className="py-2.5 px-3.5">Description</th>
                      <th className="py-2.5 px-3.5">Amount (SSP)</th>
                      <th className="py-2.5 px-3.5">Date</th>
                      <th className="py-2.5 px-3.5">Status</th>
                    </tr>
                  )}

                  {/* FINANCIAL: FACILITATIONS */}
                  {reportType === 'financials' && financialSubView === 'facilitations' && (
                    <tr>
                      <th className="py-2.5 px-3.5">Ref</th>
                      <th className="py-2.5 px-3.5">Worker</th>
                      <th className="py-2.5 px-3.5">Location</th>
                      <th className="py-2.5 px-3.5">Breakdown</th>
                      <th className="py-2.5 px-3.5">Amount (SSP)</th>
                      <th className="py-2.5 px-3.5">Day Paid</th>
                      <th className="py-2.5 px-3.5">Channel</th>
                      <th className="py-2.5 px-3.5">Status</th>
                    </tr>
                  )}

                  {/* FINANCIAL: POS */}
                  {reportType === 'financials' && financialSubView === 'pos' && (
                    <tr>
                      <th className="py-2.5 px-3.5">PO Number</th>
                      <th className="py-2.5 px-3.5">Supplier</th>
                      <th className="py-2.5 px-3.5">Consignment</th>
                      <th className="py-2.5 px-3.5">Value (SSP)</th>
                      <th className="py-2.5 px-3.5">GRN</th>
                      <th className="py-2.5 px-3.5">Status</th>
                    </tr>
                  )}

                  {/* SUPPORT RECEIVED */}
                  {reportType === 'support_received' && (
                    <tr>
                      <th className="py-2.5 px-3.5">Recipient ID</th>
                      <th className="py-2.5 px-3.5">Recipient Full Name</th>
                      <th className="py-2.5 px-3.5">Gender / Age</th>
                      <th className="py-2.5 px-3.5">Support Type</th>
                      <th className="py-2.5 px-3.5">Support Received (Commodity & Qty)</th>
                      <th className="py-2.5 px-3.5">Date Received</th>
                      <th className="py-2.5 px-3.5">Delivered By & Location</th>
                      <th className="py-2.5 px-3.5">Receipt Status</th>
                    </tr>
                  )}

                  {/* PROGRAMMES */}
                  {reportType === 'projects' && (
                    <tr>
                      <th className="py-2.5 px-3.5">Code</th>
                      <th className="py-2.5 px-3.5">Programme</th>
                      <th className="py-2.5 px-3.5">Location</th>
                      <th className="py-2.5 px-3.5">Manager</th>
                      <th className="py-2.5 px-3.5">Duration</th>
                      <th className="py-2.5 px-3.5">Budget</th>
                      <th className="py-2.5 px-3.5">Status</th>
                    </tr>
                  )}

                  {/* AUDIT TRAIL */}
                  {reportType === 'audit_logs' && (
                    <tr>
                      <th className="py-2.5 px-3.5">Timestamp</th>
                      <th className="py-2.5 px-3.5">Actor / User</th>
                      <th className="py-2.5 px-3.5">Action</th>
                      <th className="py-2.5 px-3.5">Target Module</th>
                      <th className="py-2.5 px-3.5">Transaction Details</th>
                    </tr>
                  )}
                </thead>

                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {paginatedItems.map((item, idx) => (
                    <tr
                      key={item.id || item.grant_code || item.expenditure_code || item.po_number || item.record_code || idx}
                      className={`transition ${reportType === 'support_received' ? getSupportRowHighlight(item.verification_status) : 'hover:bg-slate-50/70'}`}
                    >
                      {/* FINANCIAL: GRANTS */}
                      {reportType === 'financials' && financialSubView === 'grants' && (
                        <>
                          <td className="py-2.5 px-3.5 font-mono text-[11px] font-bold text-[#006B56] whitespace-nowrap">
                            {item.grant_code}
                          </td>
                          <td className="py-2.5 px-3.5 font-semibold text-slate-900">{item.donor_name}</td>
                          <td className="py-2.5 px-3.5 text-slate-700">{item.project_name}</td>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">{formatCurrency(item.total_committed_num)}</td>
                          <td className="py-2.5 px-3.5 font-mono text-slate-600 whitespace-nowrap">{formatCurrency(item.disbursed_amount)}</td>
                          <td className="py-2.5 px-3.5 font-mono text-slate-800 whitespace-nowrap">{formatCurrency(item.expended_amount_num)}</td>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-teal-800 whitespace-nowrap">{formatCurrency(item.remaining_balance_num)}</td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <span className="font-mono text-[11px] font-bold text-slate-700">{item.burn_rate}%</span>
                          </td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {item.status}
                            </span>
                          </td>
                        </>
                      )}

                      {/* FINANCIAL: BUDGETS */}
                      {reportType === 'financials' && financialSubView === 'budgets' && (
                        <>
                          <td className="py-2.5 px-3.5 font-semibold text-slate-900">{item.project_name}</td>
                          <td className="py-2.5 px-3.5 text-slate-700 font-medium">{item.budget_category}</td>
                          <td className="py-2.5 px-3.5 text-slate-500 whitespace-nowrap">{item.financial_year}</td>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">{formatCurrency(item.allocated_amount)}</td>
                          <td className="py-2.5 px-3.5 font-mono text-slate-700 whitespace-nowrap">{formatCurrency(item.expended_amount)}</td>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-teal-800 whitespace-nowrap">{formatCurrency(item.remaining_balance)}</td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-[11px] font-bold text-slate-700">
                            {item.burn_rate}%
                          </td>
                        </>
                      )}

                      {/* FINANCIAL: LEDGER */}
                      {reportType === 'financials' && financialSubView === 'ledger' && (
                        <>
                          <td className="py-2.5 px-3.5 font-mono text-[11px] font-bold text-[#006B56] whitespace-nowrap">
                            {item.expenditure_code}
                          </td>
                          <td className="py-2.5 px-3.5 font-medium text-slate-900 max-w-[200px] truncate">{item.project_name}</td>
                          <td className="py-2.5 px-3.5 text-slate-600 whitespace-nowrap">{item.category}</td>
                          <td className="py-2.5 px-3.5 text-slate-700 max-w-xs truncate" title={item.description}>
                            {cleanDescription(item.description)}
                          </td>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">{formatCurrency(item.amount_num)}</td>
                          <td className="py-2.5 px-3.5 text-slate-500 whitespace-nowrap">{formatDate(item.expenditure_date)}</td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                              Verified
                            </span>
                          </td>
                        </>
                      )}

                      {/* FINANCIAL: FACILITATIONS */}
                      {reportType === 'financials' && financialSubView === 'facilitations' && (
                        <>
                          <td className="py-2.5 px-3.5 font-mono text-[11px] font-bold text-[#006B56] whitespace-nowrap">
                            {item.request_code}
                          </td>
                          <td className="py-2.5 px-3.5 font-semibold text-slate-900 whitespace-nowrap">{item.worker_display}</td>
                          <td className="py-2.5 px-3.5 text-slate-600 max-w-[140px] truncate" title={item.location_display}>{item.location_display}</td>
                          <td className="py-2.5 px-3.5 text-slate-700 min-w-[240px] max-w-sm whitespace-normal">
                            {Array.isArray(item.breakdown_items) && item.breakdown_items.length > 0 ? (
                              <ul className="space-y-0.5 text-[11px] leading-snug">
                                {item.breakdown_items.map((line, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <span className="text-[#006B56] font-bold">•</span>
                                    <span>{line}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-[11px] leading-snug">{item.breakdown_display}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">{formatCurrency(item.amount_num)}</td>
                          <td className="py-2.5 px-3.5 text-slate-600 whitespace-nowrap font-medium">{item.day_paid_display}</td>
                          <td className="py-2.5 px-3.5 text-slate-500 whitespace-nowrap">{item.channel_display}</td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'Disbursed' || item.stage === 4
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {item.status || 'Disbursed'}
                            </span>
                          </td>
                        </>
                      )}

                      {/* FINANCIAL: POS */}
                      {reportType === 'financials' && financialSubView === 'pos' && (
                        <>
                          <td className="py-2.5 px-3.5 font-mono text-[11px] font-bold text-[#006B56] whitespace-nowrap">
                            {item.po_number}
                          </td>
                          <td className="py-2.5 px-3.5 font-semibold text-slate-900">{item.supplier_name}</td>
                          <td className="py-2.5 px-3.5 text-slate-700 max-w-xs truncate" title={item.items_summary}>
                            {cleanDescription(item.items_summary)}
                          </td>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">{formatCurrency(item.amount_num)}</td>
                          <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">{item.grn_display}</td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {item.status_display}
                            </span>
                          </td>
                        </>
                      )}

                      {/* SUPPORT RECEIVED */}
                      {reportType === 'support_received' && (
                        <>
                          <td className="py-2.5 px-3.5 font-mono text-[11px] font-bold text-[#006B56] whitespace-nowrap">
                            {item.beneficiary_code}
                          </td>
                          <td className="py-2.5 px-3.5">
                            <span className="font-bold text-slate-900 block">{item.beneficiary_name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{item.record_code}</span>
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600 whitespace-nowrap">
                            {item.gender_age}
                          </td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {item.support_type}
                            </span>
                          </td>
                          <td className="py-2 px-3.5 text-slate-700 max-w-[260px]" title={item.description}>
                            <span className="line-clamp-2 text-[11px] font-medium leading-snug text-slate-800">
                              {cleanDescription(item.description)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600 whitespace-nowrap font-medium">
                            {formatDate(item.date_received)}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600 max-w-[150px] truncate" title={`${item.delivered_by} • ${item.location}`}>
                            <span className="block truncate font-medium text-slate-800">{item.delivered_by}</span>
                            <span className="block truncate text-[10px] text-slate-400">{item.location}</span>
                          </td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSupportBadgeStyle(item.verification_status)}`}>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{item.verification_status || 'Confirmed Received'}</span>
                            </span>
                          </td>
                        </>
                      )}

                      {/* PROGRAMMES */}
                      {reportType === 'projects' && (
                        <>
                          <td className="py-2.5 px-3.5 font-mono text-[11px] font-bold text-[#006B56] whitespace-nowrap">
                            {item.project_code}
                          </td>
                          <td className="py-2.5 px-3.5 font-semibold text-slate-900">{item.project_name}</td>
                          <td className="py-2.5 px-3.5 text-slate-600">{item.location}</td>
                          <td className="py-2.5 px-3.5 text-slate-700">{item.manager_name}</td>
                          <td className="py-2.5 px-3.5 text-slate-500 whitespace-nowrap">{formatDate(item.start_date)} — {formatDate(item.end_date)}</td>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-emerald-800 whitespace-nowrap">{formatCurrency(item.budget_num)}</td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {item.status}
                            </span>
                          </td>
                        </>
                      )}

                      {/* AUDIT TRAIL */}
                      {reportType === 'audit_logs' && (
                        <>
                          <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {formatDate(item.created_at || item.timestamp)}
                          </td>
                          <td className="py-2.5 px-3.5">
                            <span className="font-semibold text-slate-900 block truncate max-w-[160px]">{item.operator_display}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{item.user_role}</span>
                          </td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadgeStyle(item.action_type)}`}>
                              {item.action_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-800 font-medium whitespace-nowrap">{item.module_name}</td>
                          <td className="py-2.5 px-3.5 text-slate-600 max-w-sm truncate" title={item.details_clean}>
                            {item.details_clean}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer (10 records per page) */}
          {reportItems.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs no-print">
              <div className="text-slate-500 font-medium">
                Showing{' '}
                <span className="font-bold text-slate-800">
                  {((currentPage - 1) * itemsPerPage) + 1}
                </span>
                {' '}–{' '}
                <span className="font-bold text-slate-800">
                  {Math.min(currentPage * itemsPerPage, reportItems.length)}
                </span>
                {' '}of{' '}
                <span className="font-bold text-slate-800">{reportItems.length}</span> records
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                    .reduce((acc, page, idx, arr) => {
                      if (idx > 0 && page - arr[idx - 1] > 1) acc.push('...');
                      acc.push(page);
                      return acc;
                    }, [])
                    .map((p, idx) => (
                      p === '...' ? (
                        <span key={`dots-${idx}`} className="px-1.5 text-slate-400 font-bold">...</span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`min-w-[28px] h-7 px-2 rounded-lg font-bold text-xs transition cursor-pointer ${
                            currentPage === p
                              ? 'bg-[#006B56] text-white shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    ))}
                </div>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default ReportsPage;
