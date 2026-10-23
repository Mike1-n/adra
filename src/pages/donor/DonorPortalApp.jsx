import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Building2,
  DollarSign,
  TrendingUp,
  Users,
  FolderKanban,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Search,
  Filter,
  Eye,
  Mail,
  Phone,
  Calendar,
  MapPin,
  LogOut,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  PieChart,
  BarChart3,
  Award,
  Layers,
  HelpCircle,
  Send,
  User,
  Activity,
  Check,
  CheckCheck,
  ChevronDown,
  Reply,
  ClipboardList,
  Scale,
  ArrowUpRight,
  Menu,
  X,
  ArrowLeft
} from 'lucide-react';
import { db } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { exportToPDF, exportToCSV } from '../../lib/reportGenerator';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { AdraLogo } from '../../components/common/AdraLogo';
import { UserProfileModal } from '../../components/common/UserProfileModal';
import { NotificationBellButton } from '../../components/common/NotificationBellButton';

// Clean concise title helper for mobile deliverables table
const getShortDeliverableTitle = (title, type) => {
  if (!title) return type || 'Deliverable';
  if (title.includes('Q1-2025 Narrative') || title.includes('Q1 Narrative')) return 'Q1 Progress Report';
  if (title.includes('Semi-Annual Financial') || title.includes('FMR')) return 'H1 Financial Statement';
  if (title.includes('Midterm M&E') || title.includes('Logframe')) return 'Midterm M&E Survey';
  if (title.includes('Inception Baseline') || title.includes('Inception')) return 'Baseline Inception Report';
  if (title.includes('External Financial Audit') || title.includes('External Audit')) return 'External Audit Report';
  return type || (title.length > 25 ? title.slice(0, 24) + '...' : title);
};

export function DonorPortalApp({
  currentUser,
  onLogout,
  onSwitchRole,
  onBackToFieldApp
}) {
  const { logout: authLogout, quickSwitchRole } = useAuth();
  const handleLogout = onLogout || authLogout;
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'projects' | 'finances' | 'impact' | 'compliance' | 'inquiries'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Data states
  const [currentDonor, setCurrentDonor] = useState(null);
  const [grants, setGrants] = useState([]);
  const [projects, setProjects] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [activities, setActivities] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [queries, setQueries] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);

  // Filters & Selected states
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // New Inquiry Form
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    subject: '',
    category: 'Financial Verification',
    project_code: '',
    message: ''
  });

  // Chat Desk state (matching Beneficiary Feedback & Complaints view)
  const [activeChatDesk, setActiveChatDesk] = useState('all');
  const [isDeskDropdownOpen, setIsDeskDropdownOpen] = useState(false);
  const [chatMessageText, setChatMessageText] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const deskDropdownRef = useRef(null);
  const chatBottomRef = useRef(null);
  const chatInputRef = useRef(null);

  // Close desk dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (deskDropdownRef.current && !deskDropdownRef.current.contains(e.target)) {
        setIsDeskDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll chat to bottom on new message or tab change
  useEffect(() => {
    if (chatBottomRef.current && activeTab === 'inquiries') {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChatDesk, queries, activeTab]);

  const loadDonorData = async () => {
    try {
      setLoading(true);

      const [
        allDonors,
        allGrants,
        allProjects,
        allExp,
        allBen,
        allAct,
        allInt,
        allInd,
        allDel,
        allQry,
        allUsers
      ] = await Promise.all([
        db.getDonors(),
        db.getDonorGrants ? db.getDonorGrants() : [],
        db.getProjects ? db.getProjects() : [],
        db.getExpenditures ? db.getExpenditures() : [],
        db.getBeneficiaries ? db.getBeneficiaries() : [],
        db.getActivities ? db.getActivities() : [],
        db.getInterventions ? db.getInterventions() : [],
        db.getIndicators ? db.getIndicators() : [],
        db.getDonorDeliverables ? db.getDonorDeliverables() : [],
        db.getDonorQueries ? db.getDonorQueries() : [],
        db.getUsers ? db.getUsers() : []
      ]);

      // Resolve donor identity
      const matched = (allDonors || []).find(
        d => (d.email && currentUser?.email && d.email.toLowerCase() === currentUser.email.toLowerCase()) ||
             (d.donor_name && currentUser?.department && d.donor_name.toLowerCase().includes(currentUser.department.toLowerCase())) ||
             (currentUser?.department && currentUser.department.toLowerCase().includes(d.donor_name.toLowerCase()))
      ) || (allDonors && allDonors[0]) || {
        id: 'd1',
        donor_code: 'USAID-BHA',
        donor_name: 'USAID (Bureau for Humanitarian Assistance)',
        contact_person: 'Sarah Jenkins',
        funding_amount: 3770000,
        disbursed_amount: 2840000,
        compliance_status: 'Fully Compliant'
      };

      setCurrentDonor(matched);

      // Filter grants specific to this donor
      const donorGrants = (allGrants || []).filter(
        g => g.donor_id === matched?.id || g.donor_name === matched?.donor_name
      );
      const activeGrants = donorGrants.length > 0 ? donorGrants : (allGrants || []);
      setGrants(activeGrants);

      // Projects funded by this donor
      const fundedProjectCodes = activeGrants.map(g => g.project_code || g.project_id);
      let fundedProjects = (allProjects || []).filter(
        p => p.donor_id === matched?.id || fundedProjectCodes.includes(p.project_code) || fundedProjectCodes.includes(p.id)
      );

      // Robust fallback if database projects were cleared: extract funded project entities from grants
      if (fundedProjects.length === 0 && activeGrants.length > 0) {
        fundedProjects = activeGrants.map(g => ({
          id: g.project_id || g.id,
          project_code: g.project_code,
          project_name: g.project_name,
          budget: g.total_committed,
          status: g.status || 'Active',
          location: 'Turkana & Garissa Counties',
          description: 'Emergency Food Security, Climate-Smart Agriculture & Resilience Program'
        }));
      }

      setProjects(fundedProjects);

      // Deliverables & queries
      setDeliverables((allDel || []).filter(d => !matched || d.donor_id === matched.id || d.donor_id === 'd1'));
      
      const donorQrys = (allQry || []).filter(q => !matched || q.donor_id === matched.id || q.donor_id === 'd1');
      if (donorQrys.length > 0) {
        setQueries(donorQrys);
      } else {
        setQueries([
          {
            id: 'qry-1',
            donor_id: matched?.id || 'd1',
            subject: 'Verification of Turkana Seed Distribution Sign-off Records',
            message: 'Could ADRA please provide confirmation on the warehouse dispatch vouchers for the certified sorghum seeds in Lodwar?',
            sender: `${currentUser?.full_name || 'Sarah Jenkins'} (${matched?.donor_code || 'USAID BHA'})`,
            date: '2025-02-18',
            status: 'Clarified',
            response: 'Verified distribution sheets and GPS-tagged beneficiary lists were uploaded under Activity ACT-2025-101. Total 520 farmers signed.',
            responded_by: 'Grace Ochieng (Program Manager)',
            responded_at: '2025-02-19'
          },
          {
            id: 'qry-2',
            donor_id: matched?.id || 'd1',
            subject: 'Environmental Compliance for Solar Borehole Installation',
            message: 'Requesting the hydrologic EIA clearance certification for Marsabit District borehole drilling sites.',
            sender: `${currentUser?.full_name || 'Sarah Jenkins'} (${matched?.donor_code || 'USAID BHA'})`,
            date: '2025-03-22',
            status: 'Under Review',
            response: 'EIA hydrology permit issued by NEMA has been attached to the Project Documents repository.',
            responded_by: 'Dr. Elizabeth Warren (Country Director)',
            responded_at: '2025-03-24'
          }
        ]);
      }

      setExpenditures(allExp || []);
      setBeneficiaries(allBen || []);
      setActivities(allAct || []);
      setInterventions(allInt || []);
      setIndicators(allInd || []);
      setStaffUsers(allUsers || []);
    } catch (err) {
      console.error('Failed to load donor data:', err);
      toast.error('Unable to load donor portfolio.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDonorData();
  }, [currentUser]);

  // Calculations
  const totalCommitted = useMemo(() => {
    if (grants.length > 0) {
      return grants.reduce((sum, g) => sum + (Number(g.total_committed) || 0), 0);
    }
    return Number(currentDonor?.funding_amount) || 3770000;
  }, [grants, currentDonor]);

  const totalDisbursed = useMemo(() => {
    if (grants.length > 0) {
      return grants.reduce((sum, g) => sum + (Number(g.disbursed_amount) || 0), 0);
    }
    return Number(currentDonor?.disbursed_amount) || 2840000;
  }, [grants, currentDonor]);

  const totalExpended = useMemo(() => {
    if (grants.length > 0) {
      return grants.reduce((sum, g) => sum + (Number(g.expended_amount) || 0), 0);
    }
    return 2292200;
  }, [grants]);

  const burnRate = totalDisbursed > 0 ? ((totalExpended / totalDisbursed) * 100).toFixed(1) : '80.7';

  const verifiedBeneficiariesCount = useMemo(() => {
    return beneficiaries.length > 0 ? beneficiaries.length * 420 : 2520;
  }, [beneficiaries]);

  // Project filtering
  const filteredProjects = useMemo(() => {
    if (!projectSearch.trim()) return projects;
    const term = projectSearch.toLowerCase();
    return projects.filter(
      p => p.project_name?.toLowerCase().includes(term) ||
           p.project_code?.toLowerCase().includes(term) ||
           p.location?.toLowerCase().includes(term)
    );
  }, [projects, projectSearch]);

  // Export PDF Report
  const handleExportPDF = async () => {
    try {
      toast.info('Generating official Grant Portfolio Statement...');
      const tableData = grants.map(g => [
        g.grant_code,
        g.project_name,
        `$${Number(g.total_committed || 0).toLocaleString()}`,
        `$${Number(g.disbursed_amount || 0).toLocaleString()}`,
        `$${Number(g.expended_amount || 0).toLocaleString()}`,
        g.status
      ]);

      await exportToPDF({
        title: `Grant Oversight Statement — ${currentDonor?.donor_name || 'USAID'}`,
        subtitle: `Generated: ${new Date().toLocaleDateString()} | Partner Compliance: Fully Certified`,
        columns: ['Grant Agreement', 'Project Title', 'Committed', 'Disbursed', 'Expended', 'Status'],
        data: tableData,
        fileName: `ADRA_Grant_Summary_${currentDonor?.donor_code || 'DONOR'}.pdf`
      });
      toast.success('Grant Summary PDF downloaded.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export PDF.');
    }
  };

  // Export CSV Ledger
  const handleExportCSV = () => {
    try {
      const csvData = grants.map(g => ({
        'Grant Code': g.grant_code,
        'Project Code': g.project_code,
        'Project Title': g.project_name,
        'Committed (USD)': g.total_committed,
        'Disbursed (USD)': g.disbursed_amount,
        'Expended (USD)': g.expended_amount,
        'Burn Rate (%)': ((g.expended_amount / (g.disbursed_amount || 1)) * 100).toFixed(1) + '%',
        'Start Date': g.start_date,
        'End Date': g.end_date,
        'Focal Officer': g.focal_officer,
        'Status': g.status
      }));
      exportToCSV(csvData, `ADRA_Grants_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Grants ledger exported to CSV.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export CSV.');
    }
  };

  // Submit Official Inquiry
  const handleSendInquiry = async (e) => {
    e.preventDefault();
    if (!inquiryForm.subject.trim() || !inquiryForm.message.trim()) {
      toast.warning('Please enter an inquiry subject and message.');
      return;
    }

    try {
      const newQuery = await db.sendDonorQuery({
        donor_id: currentDonor?.id || 'd1',
        subject: inquiryForm.subject,
        message: inquiryForm.message,
        sender: `${currentUser?.full_name || 'Sarah Jenkins'} (${currentDonor?.donor_name || 'Donor'})`,
        status: 'Under Review',
        response: null
      });

      setQueries([newQuery, ...queries]);
      setIsInquiryModalOpen(false);
      setInquiryForm({ subject: '', category: 'Financial Verification', project_code: '', message: '' });
      toast.success('Inquiry submitted to ADRA Country Leadership.');
    } catch (err) {
      toast.error('Failed to transmit inquiry.');
    }
  };

  // Dynamic resolution of staff accounts from database / syste  // Dynamic resolution of staff accounts from database / system
  // MUST strictly be Admin, Program Manager, and Finance - NO JUNIORS OR BENEFICIARIES!
  const pmUser = useMemo(() => {
    const found = (staffUsers || []).find(u => 
      u.role !== 'Beneficiary' && 
      u.role !== 'Field Worker' && 
      u.role !== 'Supervisor' &&
      u.role !== 'Supplier' &&
      (
        u.email === 'program.manager@adra.org' ||
        u.id === 'user-pm' ||
        (u.role && (u.role.toLowerCase() === 'program manager' || u.role.toLowerCase() === 'programme manager'))
      )
    );
    return found || {
      id: 'user-pm',
      full_name: 'Grace Ochieng',
      role: 'Program Manager',
      email: 'program.manager@adra.org',
      department: 'Emergency Response & Programs'
    };
  }, [staffUsers]);

  const adminUser = useMemo(() => {
    const found = (staffUsers || []).find(u => 
      u.role !== 'Beneficiary' && 
      u.role !== 'Field Worker' && 
      u.role !== 'Supervisor' && 
      u.role !== 'Supplier' &&
      (
        u.email === 'admin@adra.org' ||
        u.id === 'user-admin' ||
        (u.role && (u.role.toLowerCase().includes('director') || u.role.toLowerCase() === 'administrator'))
      )
    );
    return found || {
      id: 'user-admin',
      full_name: 'Dr. Elizabeth Warren',
      role: 'Country Director',
      email: 'admin@adra.org',
      department: 'Executive Country Leadership'
    };
  }, [staffUsers]);

  const foUser = useMemo(() => {
    const found = (staffUsers || []).find(u => 
      u.role !== 'Beneficiary' && 
      u.role !== 'Field Worker' && 
      u.role !== 'Supervisor' && 
      u.role !== 'Supplier' &&
      (
        u.email === 'finance.officer@adra.org' ||
        u.id === 'user-fo' ||
        (u.role && (u.role.toLowerCase() === 'finance officer' || u.role.toLowerCase().includes('finance')))
      )
    );
    return found || {
      id: 'user-fo',
      full_name: 'Alex Morgan',
      role: 'Finance Officer',
      email: 'finance.officer@adra.org',
      department: 'Financial Control & Grants'
    };
  }, [staffUsers]);

  // Direct Leadership Desks definition mapping to real verified system accounts
  const leadershipDesks = useMemo(() => [
    {
      id: 'all',
      role: 'Senior Executive Directorate',
      name: 'Direct Leadership Desk',
      email: 'country.office@adra.org',
      department: 'ADRA Senior Leadership Directorate',
      title: 'Voucher, Field Audit & Milestone Clarifications',
      status: 'Online',
      badge: 'All Formal Inquiries',
      avatarColor: 'bg-[#004D3F]',
      icon: Mail,
      isAccount: false,
      welcomeNote: 'Welcome to the Direct Leadership Clarifications Desk. Submit formal queries regarding voucher documentation, field audits, or technical milestone verifications directly to ADRA Country Leadership.'
    },
    {
      id: 'elizabeth',
      userId: adminUser.id,
      role: 'Country Director',
      name: adminUser.full_name || 'Dr. Elizabeth Warren',
      email: adminUser.email || 'admin@adra.org',
      department: adminUser.department || 'Executive Country Leadership',
      title: 'Country Director & Executive Governance',
      status: 'Online',
      badge: 'Environmental EIA & Governance',
      avatarColor: 'bg-purple-700',
      icon: ShieldCheck,
      isAccount: true,
      welcomeNote: `Direct channel with ${adminUser.full_name} (Country Director) for strategic compliance, NEMA hydrologic EIA clearance certification, and grant governance.`
    },
    {
      id: 'grace',
      userId: pmUser.id,
      role: 'Program Manager',
      name: pmUser.full_name || 'Grace Ochieng',
      email: pmUser.email || 'program.manager@adra.org',
      department: pmUser.department || 'Emergency Response & Programs',
      title: 'Field Operations & Beneficiary Verification Sheets',
      status: 'Active',
      badge: 'Field Activities & Sign-off',
      avatarColor: 'bg-emerald-600',
      icon: ClipboardList,
      isAccount: true,
      welcomeNote: `Direct desk with ${pmUser.full_name} (Program Manager). Official channel for Field Activity sign-offs, seed dispatch vouchers, and GPS-tagged beneficiary verification sheets.`
    },
    {
      id: 'alex',
      userId: foUser.id,
      role: foUser.role || 'Finance Officer',
      name: foUser.full_name || 'Alex Morgan',
      email: foUser.email || 'finance.officer@adra.org',
      department: foUser.department || 'Financial Control & Grants',
      title: 'Financial Accountability & Audit Records',
      status: 'Active',
      badge: 'Voucher & Expenditure Audit',
      avatarColor: 'bg-blue-600',
      icon: Scale,
      isAccount: true,
      welcomeNote: `Direct accountability channel with ${foUser.full_name} (${foUser.role || 'Finance Officer'}) for warehouse dispatch vouchers, field expenditure audits, and burn-rate telemetry.`
    }
  ], [pmUser, adminUser, foUser]);

  const currentDesk = leadershipDesks.find(d => d.id === activeChatDesk || (activeChatDesk === 'david' && d.id === 'alex')) || leadershipDesks[0];

  const activeChatMessages = useMemo(() => {
    let filtered = queries;
    if (activeChatDesk === 'grace') {
      filtered = queries.filter(q => 
        (q.responded_by && q.responded_by.toLowerCase().includes('grace')) ||
        (q.subject && q.subject.toLowerCase().includes('seed')) ||
        (q.subject && q.subject.toLowerCase().includes('turkana'))
      );
    } else if (activeChatDesk === 'elizabeth') {
      filtered = queries.filter(q => 
        (q.responded_by && (q.responded_by.toLowerCase().includes('warren') || q.responded_by.toLowerCase().includes('elizabeth') || q.responded_by.toLowerCase().includes('director'))) ||
        (q.subject && q.subject.toLowerCase().includes('environmental')) ||
        (q.subject && q.subject.toLowerCase().includes('borehole'))
      );
    } else if (activeChatDesk === 'alex' || activeChatDesk === 'david') {
      filtered = queries.filter(q => 
        (q.responded_by && (q.responded_by.toLowerCase().includes('alex') || q.responded_by.toLowerCase().includes('morgan') || q.responded_by.toLowerCase().includes('david') || q.responded_by.toLowerCase().includes('finance'))) ||
        (q.subject && q.subject.toLowerCase().includes('finance')) ||
        (q.subject && q.subject.toLowerCase().includes('voucher')) ||
        (q.subject && q.subject.toLowerCase().includes('expenditure'))
      );
    }

    return [...filtered].sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return timeA - timeB;
    });
  }, [queries, activeChatDesk]);

  const getDeskMessageCount = (deskId) => {
    if (deskId === 'all') return queries.length;
    if (deskId === 'grace') {
      return queries.filter(q => 
        (q.responded_by && q.responded_by.toLowerCase().includes('grace')) ||
        (q.subject && q.subject.toLowerCase().includes('seed')) ||
        (q.subject && q.subject.toLowerCase().includes('turkana'))
      ).length;
    }
    if (deskId === 'elizabeth') {
      return queries.filter(q => 
        (q.responded_by && (q.responded_by.toLowerCase().includes('warren') || q.responded_by.toLowerCase().includes('elizabeth') || q.responded_by.toLowerCase().includes('director'))) ||
        (q.subject && q.subject.toLowerCase().includes('environmental')) ||
        (q.subject && q.subject.toLowerCase().includes('borehole'))
      ).length;
    }
    if (deskId === 'alex' || deskId === 'david') {
      return queries.filter(q => 
        (q.responded_by && (q.responded_by.toLowerCase().includes('alex') || q.responded_by.toLowerCase().includes('morgan') || q.responded_by.toLowerCase().includes('david') || q.responded_by.toLowerCase().includes('finance'))) ||
        (q.subject && q.subject.toLowerCase().includes('finance')) ||
        (q.subject && q.subject.toLowerCase().includes('voucher')) ||
        (q.subject && q.subject.toLowerCase().includes('expenditure'))
      ).length;
    }
    return 0;
  };

  const handleSendChatMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatMessageText.trim() || isSendingChat) return;

    try {
      setIsSendingChat(true);
      const text = chatMessageText.trim();
      const subject = text.length > 50 ? `${text.substring(0, 47)}...` : text;

      let targetResponder = currentDesk.isAccount ? `${currentDesk.name} (${currentDesk.role})` : 'ADRA Senior Leadership';

      const newQry = await db.sendDonorQuery({
        donor_id: currentDonor?.id || 'd1',
        subject: subject,
        message: text,
        sender: `${currentUser?.full_name || 'Sarah Jenkins'} (${currentDonor?.donor_code || 'USAID BHA'})`,
        status: 'Under Review',
        response: null,
        responded_by: targetResponder,
        date: new Date().toISOString().split('T')[0]
      });

      setQueries(prev => [...prev, newQry]);
      setChatMessageText('');
      toast.success(`Inquiry sent directly to ${currentDesk.name} (${currentDesk.role})`);

      setTimeout(() => {
        if (chatBottomRef.current) {
          chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err) {
      console.error(err);
      toast.error('Failed to transmit inquiry.');
    } finally {
      setIsSendingChat(false);
    }
  };

  // Navigation Items matching the exact sidebar requirements without unnecessary clutter
  const navItems = [
    {
      id: 'overview',
      label: 'Executive Summary',
      icon: PieChart
    },
    {
      id: 'projects',
      label: 'Funded Projects',
      icon: FolderKanban,
      count: projects.length || 4
    },
    {
      id: 'finances',
      label: 'Financial Accountability',
      icon: DollarSign
    },
    {
      id: 'impact',
      label: 'Field Impact & Reach',
      icon: Users
    },
    {
      id: 'compliance',
      label: 'Deliverables & Audits',
      icon: FileText,
      count: deliverables.length || 5
    },
    {
      id: 'inquiries',
      label: 'Official Inquiries',
      icon: Mail,
      count: queries.length || 2
    }
  ];

  const currentTabObject = navItems.find(item => item.id === activeTab) || navItems[0];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans antialiased">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 lg:hidden cursor-pointer animate-in fade-in duration-150"
        />
      )}

      {/* 1. SIDEBAR (Matching Program Manager page style: Clean white, #006B56 active accents, border-slate-200, no unnecessary clutter) */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 sm:w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-xl lg:shadow-none transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="h-14 sm:h-16 px-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <AdraLogo
            isCollapsed={false}
            subtitle="Donor Portal"
            description="Grant Oversight"
          />
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items (Streamlined Essential Views matching Program Manager layout) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 text-xs font-semibold">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer ${
                  isActive
                    ? 'bg-[#006B56] text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#006B56]'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.count !== undefined && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                      isActive
                        ? 'bg-white text-[#006B56]'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Clean Minimal Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#006B56] flex items-center justify-center font-bold text-xs shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {currentDonor?.donor_code || 'USAID'}
              </p>
              <p className="text-[10px] text-slate-500 truncate font-medium">
                {currentUser?.full_name || 'Sarah Jenkins'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN COLUMN (Header + Content) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* TOP HEADER (Matching Program Manager page style: bg-[#004D3F] signature green header with Profile & Logout ONLY) */}
        <header className="bg-[#004D3F] px-3.5 sm:px-6 border-b border-[#003B30] text-white sticky top-0 z-40 shadow-md shrink-0 pt-safe">
          <div className="h-14 sm:h-16 flex items-center justify-between gap-2">
            {/* Left: Menu Hamburger + ADRA Brand / Subtitle */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
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
                <span className="text-[10px] text-emerald-200 font-medium leading-none">
                  {currentUser?.role || 'Donor Agency'}
                </span>
              </div>
            </div>

            {/* Right Controls: Notifications, Profile & Logout */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Notification Center Bell */}
              <NotificationBellButton
                currentUser={currentUser}
                onNavigate={(tab) => setActiveTab(tab)}
              />

              {/* Profile Icon Button */}
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer shadow-2xs border border-white/20"
                title="My Profile"
              >
                <User className="w-4 h-4 text-white shrink-0" />
              </button>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition active:scale-95 shadow-xs shrink-0 cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline font-bold">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Main View Area */}
        <main className={`flex-1 bg-slate-50 ${activeTab === 'inquiries' ? 'p-3.5 sm:p-5 flex flex-col h-full overflow-hidden' : 'overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6'}`}>
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <LoadingSpinner text="Retrieving verified grant data and field logs..." />
            </div>
          ) : (
            <>
              {/* Executive Summary Top Metric Strip (Clean Unified ADRA Standard) */}
              {activeTab === 'overview' && (
                <>
                  <div className="pb-1">
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Executive Summary</h1>
                  </div>

                  {/* Top Metric Strip (Clean Unified ADRA Standard - 2x2 in phone mode) */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                    <Card className="p-3 sm:p-4 bg-white border border-slate-200 shadow-2xs rounded-xl sm:rounded-2xl flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-tight">Total Grant Committed</p>
                          <h3 className="text-lg sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">${totalCommitted.toLocaleString()}</h3>
                          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1 leading-tight sm:leading-normal">Multi-year bilateral framework</p>
                        </div>
                        <span className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-50 text-[#006B56] border border-emerald-100 shrink-0">
                          <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                        </span>
                      </div>
                    </Card>

                    <Card className="p-3 sm:p-4 bg-white border border-slate-200 shadow-2xs rounded-xl sm:rounded-2xl flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-tight">Field Disbursements</p>
                          <h3 className="text-lg sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">${totalDisbursed.toLocaleString()}</h3>
                          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1 leading-tight sm:leading-normal">
                            {totalCommitted > 0 ? ((totalDisbursed / totalCommitted) * 100).toFixed(0) : 75}% of committed released
                          </p>
                        </div>
                        <span className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-50 text-[#006B56] border border-emerald-100 shrink-0">
                          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                        </span>
                      </div>
                    </Card>

                    <Card className="p-3 sm:p-4 bg-white border border-slate-200 shadow-2xs rounded-xl sm:rounded-2xl flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-tight">Verified Utilization</p>
                          <h3 className="text-lg sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">${totalExpended.toLocaleString()}</h3>
                          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1 leading-tight sm:leading-normal">
                            Burn rate: <span className="text-[#006B56] font-bold">{burnRate}%</span> • <span className="text-emerald-700 font-semibold">On Track</span>
                          </p>
                        </div>
                        <span className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-50 text-[#006B56] border border-emerald-100 shrink-0">
                          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                        </span>
                      </div>
                    </Card>

                    <Card className="p-3 sm:p-4 bg-white border border-slate-200 shadow-2xs rounded-xl sm:rounded-2xl flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-tight">Beneficiaries Reached</p>
                          <h3 className="text-lg sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
                            {verifiedBeneficiariesCount.toLocaleString()}
                          </h3>
                          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1 leading-tight sm:leading-normal">
                            Across {projects.length || 4} project jurisdictions
                          </p>
                        </div>
                        <span className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-50 text-[#006B56] border border-emerald-100 shrink-0">
                          <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                        </span>
                      </div>
                    </Card>
                  </div>
                </>
              )}

              {/* Standard Page Header for other view tabs */}
              {activeTab !== 'overview' && activeTab !== 'inquiries' && (
                <div className="pb-1">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">{currentTabObject.label}</h1>
                </div>
              )}

              {/* TAB 1: EXECUTIVE SUMMARY */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Banner Card */}
                  <Card className="p-5 sm:p-6 bg-white border border-slate-200 shadow-2xs rounded-2xl">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#006B56]" />
                          <h2 className="text-base font-bold text-slate-900">Institutional Grant Portfolio Status</h2>
                        </div>
                        <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                          Official accountability telemetry for <span className="text-slate-900 font-bold">{currentDonor?.donor_name}</span>.
                          All financial figures and beneficiary distributions are audited against verified field vouchers and warehouse distribution logs.
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleExportCSV}
                          icon={Download}
                          className="text-xs"
                        >
                          Export CSV
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleExportPDF}
                          icon={FileText}
                          className="text-xs"
                        >
                          Download PDF Report
                        </Button>
                      </div>
                    </div>

                    {/* Absorption Progress Bar */}
                    <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700">Grant Absorption Velocity</span>
                        <span className="text-[#006B56] font-bold">
                          ${totalExpended.toLocaleString()} / ${totalDisbursed.toLocaleString()} ({burnRate}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          style={{ width: `${Math.min(Number(burnRate), 100)}%` }}
                          className="h-full bg-[#006B56] rounded-full transition-all duration-500"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Inception: Jan 2025</span>
                        <span>Mid-Term Target: 75% Absorption</span>
                        <span>Grant Closeout: Dec 2026</span>
                      </div>
                    </div>
                  </Card>

                  {/* Two Column Section: Projects & Key Milestones */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Active Projects List (2 cols) */}
                    <div className="lg:col-span-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <FolderKanban className="w-4 h-4 text-[#006B56]" />
                          Active Funded Projects ({projects.length})
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveTab('projects')}
                          className="text-xs text-[#006B56] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                        >
                          View Full Portfolio <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {projects.map((proj) => {
                          const matchingGrant = grants.find(g => g.project_code === proj.project_code || g.project_id === proj.id) || grants[0];
                          const projBudget = Number(matchingGrant?.total_committed || proj.budget || 1450000);
                          const projSpent = Number(matchingGrant?.expended_amount || 875200);
                          const pct = ((projSpent / (projBudget || 1)) * 100).toFixed(0);

                          return (
                            <Card
                              key={proj.id}
                              className="p-4 bg-white border border-slate-200 hover:border-[#006B56] transition cursor-pointer shadow-2xs rounded-xl"
                              onClick={() => {
                                setSelectedProject(proj);
                                setIsProjectModalOpen(true);
                              }}
                            >
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[11px] font-bold text-[#006B56] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                      {proj.project_code || 'PRJ-2025-001'}
                                    </span>
                                    <Badge status={proj.status || 'Active'} />
                                  </div>
                                  <h4 className="text-sm font-bold text-slate-900">
                                    {proj.project_name}
                                  </h4>
                                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>{proj.location || 'Eastern Equatoria / Turkana'}</span>
                                  </p>
                                </div>

                                <div className="text-right shrink-0 w-full sm:w-auto">
                                  <p className="text-xs font-bold text-slate-900">
                                    ${projSpent.toLocaleString()}{' '}
                                    <span className="text-slate-400 font-normal">/ ${projBudget.toLocaleString()}</span>
                                  </p>
                                  <div className="flex items-center justify-end gap-2 mt-1">
                                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div
                                        style={{ width: `${Math.min(pct, 100)}%` }}
                                        className="h-full bg-[#006B56] rounded-full"
                                      />
                                    </div>
                                    <span className="text-[11px] font-bold text-[#006B56]">{pct}%</span>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Key Milestones */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[#006B56]" />
                          Key Milestone Targets
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveTab('impact')}
                          className="text-xs text-[#006B56] hover:underline font-bold cursor-pointer"
                        >
                          Impact Detail
                        </button>
                      </div>

                      <Card className="p-4 bg-white border border-slate-200 shadow-2xs rounded-xl space-y-4">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-700 font-medium">Seed & Irrigation Kits Handover</span>
                              <span className="text-[#006B56] font-bold">104% (520 / 500)</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="w-full h-full bg-[#006B56]" />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-700 font-medium">Farmer Field School Cohorts</span>
                              <span className="text-[#006B56] font-bold">72% (18 / 25)</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="w-[72%] h-full bg-[#006B56]" />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-700 font-medium">Solar Borehole Potability Test</span>
                              <span className="text-[#006B56] font-bold">85% Complete</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="w-[85%] h-full bg-[#006B56]" />
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100">
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                            <ShieldCheck className="w-4 h-4 text-[#006B56] shrink-0 mt-0.5" />
                            <div className="text-[11px] leading-relaxed text-slate-700">
                              <strong className="text-slate-900">Compliance Certification:</strong> Independent audit firm confirms zero unverified voucher discrepancies for current financial tranche.
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FUNDED PROJECTS PORTFOLIO */}
              {activeTab === 'projects' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={projectSearch}
                        onChange={(e) => setProjectSearch(e.target.value)}
                        placeholder="Search project title, code, or state location..."
                        className="adra-input pl-9 text-xs"
                      />
                    </div>

                    <p className="text-xs text-slate-500">
                      Showing <strong className="text-slate-800">{filteredProjects.length}</strong> grant-funded projects
                    </p>
                  </div>

                  {filteredProjects.length === 0 ? (
                    <EmptyState
                      title="No matching projects"
                      description="No projects match the current search filter."
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredProjects.map((p) => {
                        const matchingGrant = grants.find(g => g.project_code === p.project_code || g.project_id === p.id) || grants[0];
                        const projBudget = Number(matchingGrant?.total_committed || p.budget || 1450000);
                        const projSpent = Number(matchingGrant?.expended_amount || 875200);

                        return (
                          <Card
                            key={p.id}
                            className="p-5 bg-white border border-slate-200 hover:border-[#006B56] transition shadow-2xs rounded-xl flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="font-mono text-xs font-bold text-[#006B56] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    {p.project_code || 'PRJ-2025-001'}
                                  </span>
                                  <h3 className="text-sm font-bold text-slate-900 mt-2 leading-snug">
                                    {p.project_name}
                                  </h3>
                                </div>
                                <Badge status={p.status || 'Active'} />
                              </div>

                              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                {p.description || 'Targeted humanitarian assistance designed to enhance community resilience, food security, and water access.'}
                              </p>

                              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                                <div>
                                  <span className="text-slate-400 block text-[11px]">Jurisdiction:</span>
                                  <span className="text-slate-800 font-semibold truncate block">{p.location || 'Turkana County'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[11px]">Grant Allocation:</span>
                                  <span className="text-[#006B56] font-bold block">${projBudget.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                              <div className="text-[11px] text-slate-500">
                                Spent: <strong className="text-slate-900">${projSpent.toLocaleString()}</strong> ({((projSpent / (projBudget || 1)) * 100).toFixed(0)}%)
                              </div>
                              <Button
                                variant="secondary"
                                size="sm"
                                icon={Eye}
                                onClick={() => {
                                  setSelectedProject(p);
                                  setIsProjectModalOpen(true);
                                }}
                                className="text-xs"
                              >
                                Inspect Details
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: FINANCIAL ACCOUNTABILITY */}
              {activeTab === 'finances' && (
                <div className="space-y-6">
                  {/* Tranche Release Timeline */}
                  <Card className="p-5 bg-white border border-slate-200 shadow-2xs rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-[#006B56]" />
                          Grant Tranche Release & Liquidation Schedule
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tranche disbursements mapped to milestone certifications and field bank accounts.
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleExportCSV}
                        icon={Download}
                        className="text-xs"
                      >
                        Export Ledger
                      </Button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-y border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Tranche #</th>
                            <th className="py-2.5 px-3">Grant Agreement</th>
                            <th className="py-2.5 px-3">Release Date</th>
                            <th className="py-2.5 px-3">EFT Reference</th>
                            <th className="py-2.5 px-3 text-right">Amount (USD)</th>
                            <th className="py-2.5 px-3 text-center">Liquidation Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          <tr>
                            <td className="py-3 px-3 font-bold text-slate-900">Tranche 1 (Advance)</td>
                            <td className="py-3 px-3 font-mono font-bold text-[#006B56]">GRT-USAID-2025-01</td>
                            <td className="py-3 px-3">2025-01-15</td>
                            <td className="py-3 px-3 font-mono text-slate-500">EFT-USAID-0091</td>
                            <td className="py-3 px-3 text-right font-bold text-slate-900">$600,000</td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Fully Liquidated
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-3 font-bold text-slate-900">Tranche 2 (Mid-Term)</td>
                            <td className="py-3 px-3 font-mono font-bold text-[#006B56]">GRT-USAID-2025-01</td>
                            <td className="py-3 px-3">2025-07-01</td>
                            <td className="py-3 px-3 font-mono text-slate-500">EFT-USAID-0144</td>
                            <td className="py-3 px-3 text-right font-bold text-slate-900">$500,000</td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Active Utilization (55%)
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-3 font-bold text-slate-900">Tranche 1 (Inception)</td>
                            <td className="py-3 px-3 font-mono font-bold text-[#006B56]">GRT-USAID-2026-02</td>
                            <td className="py-3 px-3">2025-06-15</td>
                            <td className="py-3 px-3 font-mono text-slate-500">EFT-USAID-0210</td>
                            <td className="py-3 px-3 text-right font-bold text-slate-900">$350,000</td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Active Utilization (34%)
                              </span>
                            </td>
                          </tr>
                          <tr className="bg-slate-50/50">
                            <td className="py-3 px-3 font-bold text-slate-600">Tranche 3 (Milestone MTR)</td>
                            <td className="py-3 px-3 font-mono text-slate-500">GRT-USAID-2025-01</td>
                            <td className="py-3 px-3 text-slate-400">Scheduled: Mar 2026</td>
                            <td className="py-3 px-3 font-mono text-slate-400">PENDING-AUDIT</td>
                            <td className="py-3 px-3 text-right font-bold text-slate-600">$350,000</td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                Awaiting Milestone
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {/* Standard Cost Category Breakdown */}
                  <Card className="p-5 bg-white border border-slate-200 shadow-2xs rounded-xl">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-[#006B56]" />
                      Standard Budget Line Expenditure Breakdown
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-slate-500 text-[11px]">Direct Aid & Distribution</span>
                        <h4 className="text-base font-bold text-slate-900">$780,400</h4>
                        <p className="text-[10px] text-[#006B56] font-semibold">56% of total grant spend</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-slate-500 text-[11px]">Logistics, Fleet & Storage</span>
                        <h4 className="text-base font-bold text-slate-900">$245,600</h4>
                        <p className="text-[10px] text-slate-600 font-medium">18% of total grant spend</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-slate-500 text-[11px]">Field Personnel & Agronomists</span>
                        <h4 className="text-base font-bold text-slate-900">$215,000</h4>
                        <p className="text-[10px] text-slate-600 font-medium">15% of total grant spend</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-slate-500 text-[11px]">NICRA / Operational Overhead</span>
                        <h4 className="text-base font-bold text-slate-900">$154,600</h4>
                        <p className="text-[10px] text-slate-500 font-semibold">11% (within negotiated cap)</p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* TAB 4: FIELD IMPACT & BENEFICIARIES */}
              {activeTab === 'impact' && (
                <div className="space-y-5">
                  {/* Demographics Card */}
                  <Card className="p-3.5 sm:p-5 bg-white border border-slate-200 shadow-2xs rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#006B56]" />
                      <span>Verified Beneficiary Demographic Breakdown</span>
                    </h3>
                    <p className="text-xs text-slate-500 mb-3.5">
                      Disaggregated data verified through biometric sign-offs and local community council vouchers.
                    </p>

                    <div className="space-y-2">
                      {[
                        { label: 'Female-Headed', count: '3,420', pct: 41 },
                        { label: 'IDP Returnees', count: '2,180', pct: 26 },
                        { label: 'Elderly Household', count: '1,250', pct: 15 },
                        { label: 'Youth at Risk', count: '940', pct: 11 },
                        { label: 'Persons w/ Disability', count: '630', pct: 7 },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="p-2.5 sm:p-3 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-emerald-200 transition"
                        >
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-semibold text-slate-700">{item.label}</span>
                            <div className="flex items-baseline gap-1">
                              <span className="font-black text-slate-900">{item.count}</span>
                              <span className="text-[10px] text-[#006B56] font-bold">({item.pct}%)</span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#006B56] rounded-full transition-all duration-300"
                              style={{ width: `${item.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Field Deliveries Log */}
                  <Card className="p-3.5 sm:p-5 bg-white border border-slate-200 shadow-2xs rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#006B56]" />
                      <span>Recent Field Deliveries Under Grant</span>
                    </h3>
                    <p className="text-xs text-slate-500 mb-3.5">
                      Direct distribution milestone verifications and field sign-off vouchers.
                    </p>

                    <div className="space-y-2.5">
                      {[
                        {
                          title: 'Drought-Tolerant Sorghum & Micro-Drip Irrigation Kits',
                          location: 'Lodwar Agricultural Distribution Center, Turkana County',
                          reached: '520 Farmers Verified',
                          date: 'Feb 12, 2025'
                        },
                        {
                          title: 'Solar Submersible Borehole DC Pump Commissioning',
                          location: 'Bubisa Primary Community Water Hub, Marsabit District',
                          reached: '4,200 Villagers Reached',
                          date: 'Mar 20, 2025'
                        },
                        {
                          title: 'Community Nutrition Screening & Therapeutic Supplements',
                          location: 'Wajir South Mobile Clinic Sites',
                          reached: '850 Mothers & Infants',
                          date: 'Apr 05, 2025'
                        }
                      ].map((deliv) => (
                        <div
                          key={deliv.title}
                          className="p-3 sm:p-4 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-emerald-200 transition space-y-2"
                        >
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                              {deliv.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{deliv.location}</span>
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-xs">
                            <span className="inline-flex items-center gap-1 font-bold text-[#006B56] bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#006B56]" />
                              {deliv.reached}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {deliv.date}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* TAB 5: DELIVERABLES & COMPLIANCE VAULT */}
              {activeTab === 'compliance' && (
                <div className="space-y-5">
                  <Card className="p-5 bg-white border border-slate-200 shadow-2xs rounded-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#006B56]" />
                          Contractual Reporting & Audit Deliverables
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Mandatory quarterly progress narratives, financial monitoring statements, and external audit files.
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleExportPDF}
                        icon={Download}
                        className="text-xs"
                      >
                        Export Compliance Dossier
                      </Button>
                    </div>
                    {/* Minimal & Clean Responsive Deliverables Table */}
                    {deliverables.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs rounded-xl border border-dashed border-slate-200">
                        No contractual deliverables recorded for this grant.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                              <th className="py-2 px-2.5 sm:px-4">Deliverable</th>
                              <th className="py-2 px-2 sm:px-3 whitespace-nowrap">Status</th>
                              <th className="py-2 px-2 sm:px-3 whitespace-nowrap">Due Date</th>
                              <th className="py-2 px-2 sm:px-3 text-right whitespace-nowrap w-12">File</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {deliverables.map((del) => {
                              const isApproved = del.status === 'Approved';
                              const isUnderReview = del.status === 'Under Review';
                              return (
                                <tr
                                  key={del.id}
                                  className="hover:bg-slate-50/80 transition-colors"
                                >
                                  {/* Deliverable Info: Short & Single-Line */}
                                  <td className="py-2 px-2.5 sm:px-4">
                                    <span
                                      className="font-semibold text-slate-900 text-xs truncate block max-w-[150px] sm:max-w-none"
                                      title={del.title}
                                    >
                                      {getShortDeliverableTitle(del.title, del.type)}
                                    </span>
                                  </td>

                                  {/* Status */}
                                  <td className="py-2 px-2 sm:px-3 whitespace-nowrap align-middle">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                        isApproved
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : isUnderReview
                                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                                          : 'bg-slate-100 text-slate-700 border-slate-200'
                                      }`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          isApproved
                                            ? 'bg-emerald-500'
                                            : isUnderReview
                                            ? 'bg-amber-500'
                                            : 'bg-slate-400'
                                        }`}
                                      />
                                      {del.status}
                                    </span>
                                  </td>

                                  {/* Due Date */}
                                  <td className="py-2 px-2 sm:px-3 whitespace-nowrap align-middle text-xs text-slate-700 font-medium">
                                    {formatDate(del.due_date)}
                                  </td>

                                  {/* PDF Download Action */}
                                  <td className="py-2 px-2 sm:px-3 text-right whitespace-nowrap align-middle">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        toast.success(`Downloading: ${del.file_name}`);
                                        handleExportPDF();
                                      }}
                                      title={`Download ${del.file_name || 'Deliverable PDF'}`}
                                      className="inline-flex items-center gap-1 p-1 sm:px-2 sm:py-0.5 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-[#006B56] hover:border-emerald-300 text-slate-700 text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
                                    >
                                      <Download className="w-3.5 h-3.5 text-slate-600" />
                                      <span className="hidden sm:inline">PDF</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* TAB 6: OFFICIAL INQUIRIES DESK (Direct Leadership Clarifications Desk - WhatsApp style matching Beneficiary Feedback view) */}
              {activeTab === 'inquiries' && (
                <div className="w-full flex-1 flex flex-col h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs font-sans">
                  
                  {/* CLEAN LIGHT WHATSAPP HEADER BAR */}
                  <div className="bg-white border-b border-slate-200 px-4 py-3 text-slate-900 shrink-0 flex items-center justify-between shadow-xs relative z-30" ref={deskDropdownRef}>
                    
                    {/* Left: Officer Role & Switch Dropdown Button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsDeskDropdownOpen(!isDeskDropdownOpen)}
                        className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-100 transition cursor-pointer text-left group"
                      >
                        {/* Avatar with Online Dot */}
                        {/* Role Icon with Online Dot */}
                        <div className="relative shrink-0">
                          <div className={`w-10 h-10 rounded-full ${currentDesk.avatarColor} text-white flex items-center justify-center font-bold shadow-xs`}>
                            {React.createElement(currentDesk.icon, { className: 'w-5 h-5' })}
                          </div>
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                        </div>

                        {/* Officer Name, Role & Email */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 tracking-tight">
                              {currentDesk.name}
                            </span>
                            {currentDesk.isAccount && currentDesk.role && (
                              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                                {currentDesk.role}
                              </span>
                            )}
                            <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${isDeskDropdownOpen ? 'rotate-180' : ''}`} />
                          </div>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] text-slate-500">{currentDesk.email}</span>
                            <span>•</span>
                            <span className="text-emerald-600 font-medium">{currentDesk.status}</span>
                          </p>
                        </div>
                      </button>

                      {/* Dropdown Menu Popover */}
                      {isDeskDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-96 max-w-[92vw] bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in-50 duration-150">
                          <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              Select Leadership Desk
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                              Verified System Accounts
                            </span>
                          </div>

                          {leadershipDesks.map(d => {
                            const isSelected = activeChatDesk === d.id || (activeChatDesk === 'david' && d.id === 'alex');
                            const IconComp = d.icon;
                            const count = getDeskMessageCount(d.id);

                            return (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => {
                                  setActiveChatDesk(d.id);
                                  setIsDeskDropdownOpen(false);
                                }}
                                className={`w-full p-3.5 text-left flex items-center justify-between transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-50/80 border-l-4 border-emerald-600'
                                    : 'hover:bg-slate-50 bg-white'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  {/* Channel Icon */}
                                  <div className="relative shrink-0">
                                    <div className={`w-10 h-10 rounded-full ${d.avatarColor} text-white flex items-center justify-center font-bold shadow-xs`}>
                                      <IconComp className="w-5 h-5" />
                                    </div>
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-emerald-500" />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    {/* Name and Role */}
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-bold text-slate-900 truncate">
                                        {d.name}
                                      </span>
                                      {d.isAccount && d.role && (
                                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded shrink-0">
                                          {d.role}
                                        </span>
                                      )}
                                      {count > 0 && (
                                        <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-bold shrink-0 ml-auto mr-1">
                                          {count}
                                        </span>
                                      )}
                                    </div>

                                    {/* Account Email */}
                                    <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                                      {d.email}
                                    </div>

                                    {/* Scope / Title */}
                                    <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                                      {d.title}
                                    </span>
                                  </div>
                                </div>

                                {isSelected && (
                                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 ml-2 shadow-xs">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CHAT MESSAGES BODY (WhatsApp Wallpaper & Clean Bubbles) */}
                  <div 
                    className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#efeae2]/40"
                    style={{
                      backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
                      backgroundSize: '24px 24px'
                    }}
                  >
                    {/* Welcome Introduction Bubble from Leadership */}
                    <div className="flex justify-start">
                      <div className="max-w-[88%] sm:max-w-[75%] bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-xs border border-slate-200/80 text-slate-800">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="text-[11px] font-bold text-emerald-700">
                            {currentDesk.name}
                          </span>
                          {currentDesk.isAccount && currentDesk.role && (
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                              {currentDesk.role}
                            </span>
                          )}
                          <span className="text-[9px] font-mono text-slate-400 ml-auto">
                            {currentDesk.email}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-700">
                          {currentDesk.welcomeNote}
                        </p>
                        <span className="text-[10px] text-slate-400 block text-right mt-1">
                          Direct System Account • Active & Monitored
                        </span>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    {activeChatMessages.length === 0 ? (
                      <div className="text-center py-8">
                        <span className="text-xs text-slate-400 bg-white/80 px-3 py-1.5 rounded-full border border-slate-200">
                          No queries recorded for {currentDesk.name} ({currentDesk.role}) yet. Type below to submit.
                        </span>
                      </div>
                    ) : (
                      activeChatMessages.map((q) => (
                        <div key={q.id} className="space-y-2">
                          {/* Outgoing Bubble (WhatsApp Green - Aligned Right) */}
                          <div className="flex justify-end">
                            <div className="max-w-[88%] sm:max-w-[75%] bg-[#d9fdd3] text-slate-900 rounded-2xl rounded-tr-xs p-3.5 shadow-xs border border-[#b8f5b0]">
                              <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-[#b8f5b0]">
                                <span className="text-xs font-bold text-slate-900 tracking-tight">
                                  {q.subject}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                                  q.status === 'Clarified'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-amber-600 text-white'
                                }`}>
                                  {q.status}
                                </span>
                              </div>

                              <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap py-0.5">
                                {q.message}
                              </p>

                              <div className="flex items-center justify-between gap-2 mt-2 pt-1 text-[10px] text-slate-500 border-t border-[#b8f5b0]/60">
                                <span className="font-medium text-slate-600">
                                  {formatDate(q.date)}
                                </span>
                                <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                                  <span>Transmitted</span>
                                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Incoming Official Clarification Bubble (Clean White - Aligned Left) */}
                          {q.response ? (
                            <div className="flex justify-start">
                              <div className="max-w-[88%] sm:max-w-[75%] bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-xs border border-slate-200 text-slate-800">
                                <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-100">
                                  <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    {q.responded_by || 'Grace Ochieng (Program Manager)'}
                                  </span>
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                    Clarification
                                  </span>
                                </div>

                                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap py-0.5">
                                  {q.response}
                                </p>

                                <div className="flex items-center justify-between gap-2 mt-2 pt-1 text-[10px] text-slate-400 border-t border-slate-100">
                                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                    <Check className="w-3 h-3 stroke-[3]" /> Recorded
                                  </span>
                                  <span className="font-medium text-slate-500">
                                    {formatDate(q.responded_at || q.date)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-start">
                              <div className="max-w-[88%] sm:max-w-[75%] bg-white/90 rounded-2xl rounded-tl-xs p-3 shadow-xs border border-amber-200 text-slate-700">
                                <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-semibold mb-0.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  Under Review by ADRA Country Leadership
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  Assigned to {q.responded_by || 'Country Director & Programme Lead'}. Formal technical clearance is pending review.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}

                    <div ref={chatBottomRef} />
                  </div>

                  {/* WHATSAPP BOTTOM INPUT BAR */}
                  <form onSubmit={handleSendChatMessage} className="p-3 bg-slate-100 border-t border-slate-200 flex items-center gap-2 shrink-0">
                    <div className="flex-1 bg-white rounded-2xl border border-slate-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 px-3.5 py-2 flex items-center gap-2 shadow-xs">
                      <input
                        ref={chatInputRef}
                        type="text"
                        value={chatMessageText}
                        onChange={(e) => setChatMessageText(e.target.value)}
                        placeholder={`Message ${currentDesk.name} (${currentDesk.role}) regarding vouchers, field audits, or milestone verifications...`}
                        className="flex-1 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden bg-transparent"
                        disabled={isSendingChat}
                      />
                    </div>

                    {/* WhatsApp Green Send Button */}
                    <button
                      type="submit"
                      disabled={!chatMessageText.trim() || isSendingChat}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition shadow-md shrink-0 cursor-pointer ${
                        chatMessageText.trim() && !isSendingChat
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                          : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      }`}
                      title="Send Query"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>

                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* 3. PROJECT DETAIL INSPECTION MODAL */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title={selectedProject ? `${selectedProject.project_code} — ${selectedProject.project_name}` : 'Project Detail'}
      >
        {selectedProject && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-slate-500 block text-[11px]">Status</span>
                <Badge status={selectedProject.status || 'Active'} />
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[11px]">Total Project Budget</span>
                <span className="text-sm font-bold text-[#006B56]">
                  {formatCurrency(selectedProject.budget || 1450000)}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-700 font-bold block mb-1">Project Scope & Strategic Purpose</span>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                {selectedProject.description || 'Targeted multi-sector humanitarian assistance designed to enhance community resilience, food security, and water access.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Jurisdiction</span>
                <strong className="text-slate-900">{selectedProject.location || 'Turkana County'}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Project Officer</span>
                <strong className="text-slate-900">John Mwangi</strong>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 text-[11px]">
                Timeline: {formatDate(selectedProject.start_date || '2025-01-01')} to {formatDate(selectedProject.end_date || '2026-12-31')}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsProjectModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 4. NEW OFFICIAL INQUIRY MODAL */}
      <Modal
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
        title="Submit Formal Inquiry to ADRA Country Leadership"
      >
        <form onSubmit={handleSendInquiry} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Subject / Technical Area</label>
            <input
              type="text"
              value={inquiryForm.subject}
              onChange={(e) => setInquiryForm({ ...inquiryForm, subject: e.target.value })}
              placeholder="e.g. Audit Voucher Verification for Turkana Seed Kits"
              className="adra-input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Inquiry Category</label>
              <select
                value={inquiryForm.category}
                onChange={(e) => setInquiryForm({ ...inquiryForm, category: e.target.value })}
                className="adra-input"
              >
                <option value="Financial Verification">Financial / Voucher Audit</option>
                <option value="Beneficiary Milestone">Beneficiary Milestone Verification</option>
                <option value="Environmental Compliance">Environmental / EIA Compliance</option>
                <option value="Contract Amendment">Grant Scope / Amendment Request</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Related Grant Code</label>
              <input
                type="text"
                value={inquiryForm.project_code}
                onChange={(e) => setInquiryForm({ ...inquiryForm, project_code: e.target.value })}
                placeholder="e.g. GRT-USAID-2025-01"
                className="adra-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Detailed Inquiry Message</label>
            <textarea
              rows={4}
              value={inquiryForm.message}
              onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
              placeholder="Provide specific grant line, voucher reference, or compliance inquiry details..."
              className="adra-input"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsInquiryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Send}
            >
              Transmit Inquiry
            </Button>
          </div>
        </form>
      </Modal>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchRole={quickSwitchRole}
      />
    </div>
  );
}
