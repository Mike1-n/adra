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
import { db, isSupabaseConfigured, supabase } from '../../lib/supabase';
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
  const [tranches, setTranches] = useState([]);
  const [projects, setProjects] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [activities, setActivities] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [queries, setQueries] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [missingDonorTables, setMissingDonorTables] = useState([]);

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
  const [activeChatDesk, setActiveChatDesk] = useState('grace');
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
      setLoadError('');
      setMissingDonorTables([]);

      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase is not configured for live donor portfolio access.');
      }

      const data = await db.getDonorPortfolioData();
      setMissingDonorTables(data.missingDonorTables || []);

      const currentEmail = currentUser?.email?.toLowerCase();
      const linkedProfile = (data.users || []).find(profile =>
        (currentUser?.id && profile.id === currentUser.id) ||
        (currentEmail && profile.email?.toLowerCase() === currentEmail)
      );
      const linkedDonorId = currentUser?.donor_id || linkedProfile?.donor_id;
      const matched = (data.donors || []).find(donor =>
        (linkedDonorId && donor.id === linkedDonorId) ||
        (currentEmail && donor.email?.toLowerCase() === currentEmail)
      );

      setCurrentDonor(matched);

      // Filter grants specific to this donor
      const donorGrants = matched ? (data.grants || []).filter(g => g.donor_id === matched.id) : [];
      setGrants(donorGrants);

      // Projects funded by this donor
      const fundedProjectIds = donorGrants.map(g => g.project_id).filter(Boolean);
      const fundedProjects = matched ? (data.projects || []).filter(
        p => p.donor_id === matched.id || fundedProjectIds.includes(p.id)
      ) : [];
      setProjects(fundedProjects);

      setTranches((data.tranches || []).filter(t => donorGrants.some(g => g.id === t.donor_grant_id)));
      setDeliverables(matched ? (data.deliverables || []).filter(d => d.donor_id === matched.id) : []);
      setQueries(matched ? (data.queries || []).filter(q => q.donor_id === matched.id).map(q => ({
        ...q,
        date: q.created_at?.split('T')[0]
      })) : []);
      setExpenditures(data.expenditures || []);
      setBeneficiaries(data.beneficiaries || []);
      setInterventions(data.interventions || []);
      setAssistanceRequests(data.assistanceRequests || []);
      setActivities(data.activities || []);
      setIndicators(data.indicators || []);
      setStaffUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load donor data:', err);
      setLoadError(err?.message || 'Unable to load live donor portfolio data.');
      toast.error('Unable to load live donor portfolio data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDonorData();
  }, [currentUser]);

  // Calculations
  const projectIds = useMemo(() => new Set(projects.map(project => project.id)), [projects]);
  const donorFileKey = currentDonor?.id?.slice(0, 8) || 'DONOR';
  const donorExpenditures = useMemo(
    () => expenditures.filter(item => projectIds.has(item.project_id)),
    [expenditures, projectIds]
  );
  const totalCommitted = grants.length
    ? grants.reduce((sum, grant) => sum + (Number(grant.total_committed) || 0), 0)
    : Number(currentDonor?.funding_amount ?? projects.reduce((sum, project) => sum + (Number(project.budget) || 0), 0)) || 0;
  const trancheDisbursements = tranches
    .filter(tranche => ['released', 'disbursed', 'fully liquidated', 'active utilization'].some(status => (tranche.status || '').toLowerCase().startsWith(status)))
    .reduce((sum, tranche) => sum + (Number(tranche.amount) || 0), 0);
  const totalDisbursed = trancheDisbursements || grants.reduce((sum, grant) => sum + (Number(grant.disbursed_amount) || 0), 0);
  const totalExpended = donorExpenditures.reduce((sum, expenditure) => sum + (Number(expenditure.amount) || 0), 0);
  const burnRate = totalDisbursed > 0 ? ((totalExpended / totalDisbursed) * 100).toFixed(1) : '0.0';
  const portfolioAvailable = Boolean(currentDonor) && !loadError;
  const donorBeneficiaries = useMemo(() => {
    const linkedRequests = assistanceRequests.filter(request =>
      projectIds.has(request.program_id || request.project_id)
    );
    const linkedBeneficiaryIds = new Set([
      ...interventions
        .filter(intervention => projectIds.has(intervention.project_id))
        .map(intervention => intervention.beneficiary_id),
      ...linkedRequests.map(request => request.beneficiary_id)
    ].filter(Boolean));
    const linkedBeneficiaryCodes = new Set(
      linkedRequests.map(request => request.beneficiary_code).filter(Boolean)
    );
    const filtered = beneficiaries.filter(beneficiary =>
      projectIds.has(beneficiary.project_id) ||
      linkedBeneficiaryIds.has(beneficiary.id) ||
      linkedBeneficiaryCodes.has(beneficiary.beneficiary_code)
    );
    return filtered.length ? filtered : beneficiaries;
  }, [assistanceRequests, beneficiaries, interventions, projectIds]);
  const donorActivities = useMemo(
    () => activities.filter(activity => projectIds.has(activity.project_id)),
    [activities, projectIds]
  );
  const donorIndicators = useMemo(
    () => indicators.filter(indicator => projectIds.has(indicator.project_id)),
    [indicators, projectIds]
  );
  const beneficiaryCount = donorBeneficiaries.length;
  const projectSpend = useMemo(() => donorExpenditures.reduce((result, expenditure) => {
    result[expenditure.project_id] = (result[expenditure.project_id] || 0) + (Number(expenditure.amount) || 0);
    return result;
  }, {}), [donorExpenditures]);
  const budgetLineBreakdown = useMemo(() => {
    const categories = donorExpenditures.reduce((result, expenditure) => {
      const category = expenditure.category || 'Uncategorized';
      result[category] = (result[category] || 0) + (Number(expenditure.amount) || 0);
      return result;
    }, {});
    const total = Object.values(categories).reduce((sum, amount) => sum + amount, 0);
    const colors = [
      { accent: 'border-l-emerald-500', valueColor: 'text-emerald-800' },
      { accent: 'border-l-sky-500', valueColor: 'text-sky-800' },
      { accent: 'border-l-indigo-500', valueColor: 'text-indigo-800' },
      { accent: 'border-l-amber-500', valueColor: 'text-amber-800' }
    ];
    return Object.entries(categories).map(([name, amount], index) => ({
      name,
      amount,
      pct: total > 0 ? (amount / total) * 100 : 0,
      ...colors[index % colors.length]
    }));
  }, [donorExpenditures]);
  const beneficiaryBreakdown = useMemo(() => {
    const categories = donorBeneficiaries.reduce((result, beneficiary) => {
      const category = beneficiary.vulnerability_category || 'Uncategorized';
      result[category] = (result[category] || 0) + 1;
      return result;
    }, {});
    const colors = ['bg-[#006B56]', 'bg-sky-600', 'bg-amber-500', 'bg-indigo-500', 'bg-teal-500'];
    const badges = ['bg-emerald-50 text-[#006B56]', 'bg-sky-50 text-sky-700', 'bg-amber-50 text-amber-700', 'bg-indigo-50 text-indigo-700', 'bg-teal-50 text-teal-700'];
    return Object.entries(categories).map(([label, count], index) => ({
      label,
      count,
      pct: donorBeneficiaries.length ? (count / donorBeneficiaries.length) * 100 : 0,
      dotColor: colors[index % colors.length],
      badgeColor: badges[index % badges.length]
    }));
  }, [donorBeneficiaries]);
  const donorGrantIds = useMemo(() => new Set(grants.map(grant => grant.id)), [grants]);
  const donorTranches = useMemo(
    () => tranches.filter(tranche => donorGrantIds.has(tranche.donor_grant_id)),
    [tranches, donorGrantIds]
  );
  const grantPeriod = useMemo(() => {
    const starts = grants.map(grant => grant.start_date).filter(Boolean).sort();
    const ends = grants.map(grant => grant.end_date).filter(Boolean).sort();
    return { start: starts[0], end: ends[ends.length - 1] };
  }, [grants]);
  const jurisdictionCount = useMemo(() => {
    const beneficiaryLocations = new Set(donorBeneficiaries.map(b => b.location).filter(Boolean));
    if (beneficiaryLocations.size > 0) return beneficiaryLocations.size;
    return new Set(projects.map(project => project.location).filter(Boolean)).size || 1;
  }, [donorBeneficiaries, projects]);

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
        g.projects?.project_name || projects.find(project => project.id === g.project_id)?.project_name || '',
        `SSP ${Number(g.total_committed || 0).toLocaleString()}`,
        `SSP ${Number(g.disbursed_amount || 0).toLocaleString()}`,
        `SSP ${Number(projectSpend[g.project_id] || 0).toLocaleString()}`,
        g.status
      ]);

      await exportToPDF({
        title: `Grant Oversight Statement — ${currentDonor?.donor_name || 'Donor'}`,
        subtitle: `Generated: ${new Date().toLocaleDateString()}`,
        columns: ['Grant Agreement', 'Project Title', 'Committed', 'Disbursed', 'Expended', 'Status'],
        data: tableData,
        fileName: `ADRA_Grant_Summary_${donorFileKey}.pdf`
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
        'Project Code': g.projects?.project_code || projects.find(project => project.id === g.project_id)?.project_code || '',
        'Project Title': g.projects?.project_name || projects.find(project => project.id === g.project_id)?.project_name || '',
        'Committed (SSP)': g.total_committed,
        'Disbursed (SSP)': g.disbursed_amount,
        'Expended (SSP)': projectSpend[g.project_id] || 0,
        'Burn Rate (%)': (Number(g.disbursed_amount) > 0 ? ((projectSpend[g.project_id] || 0) / Number(g.disbursed_amount)) * 100 : 0).toFixed(1) + '%',
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

  const handleExportCompliancePDF = async () => {
    try {
      await exportToPDF({
        title: `Grant Compliance Deliverables — ${currentDonor?.donor_name || 'Donor'}`,
        subtitle: `Generated: ${new Date().toLocaleDateString()}`,
        columns: ['Deliverable', 'Type', 'Due Date', 'Submitted Date', 'Status', 'File'],
        data: deliverables.map(deliverable => [
          deliverable.title || '',
          deliverable.type || '',
          deliverable.due_date || '',
          deliverable.submitted_date || '',
          deliverable.status || '',
          deliverable.file_name || ''
        ]),
        fileName: `ADRA_Compliance_Deliverables_${donorFileKey}.pdf`
      });
      toast.success('Compliance deliverables PDF downloaded.');
    } catch (err) {
      console.error('Failed to export compliance deliverables:', err);
      toast.error('Failed to export compliance deliverables.');
    }
  };

  const handleOpenDeliverable = (deliverable) => {
    if (!deliverable?.file_url) {
      toast.info('No file is attached to this deliverable yet.');
      return;
    }

    try {
      const fileUrl = new URL(deliverable.file_url, window.location.origin);
      if (!['http:', 'https:'].includes(fileUrl.protocol)) {
        throw new Error('Unsupported file URL protocol.');
      }
      window.open(fileUrl.href, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Unable to open deliverable file:', err);
      toast.error('The deliverable file URL is invalid.');
    }
  };

  const verifyDonorSession = async () => {
    if (!supabase) {
      throw new Error('Supabase is not configured for donor inquiries.');
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    const user = session?.user;
    if (!user) {
      throw new Error('This login has no Supabase Auth session. Donor inquiries require signing in with a real Supabase donor account; demo or role-switched sessions cannot submit to the database.');
    }
    if (user.id !== currentUser?.id) {
      throw new Error('You are viewing a switched Donor role, not signed in as that donor. Sign in with the donor account to send inquiries.');
    }

    const donorEmail = currentDonor?.email?.trim().toLowerCase();
    const userEmail = user.email?.trim().toLowerCase();
    if (currentUser?.donor_id !== currentDonor?.id && (!userEmail || userEmail !== donorEmail)) {
      throw new Error('This signed-in account is not linked to this donor record. Link the donor email or profile donor ID before sending inquiries.');
    }
  };

  // Submit Official Inquiry
  const handleSendInquiry = async (e) => {
    e.preventDefault();
    if (!inquiryForm.subject.trim() || !inquiryForm.message.trim()) {
      toast.warning('Please enter an inquiry subject and message.');
      return;
    }
    if (!currentDonor?.id || !leadershipDesks.length) {
      toast.error('A linked donor record and staff contact are required to submit an inquiry.');
      return;
    }

    try {
      await verifyDonorSession();
      const recipient = leadershipDesks.find(desk => desk.id === 'grace') || leadershipDesks[0];
      const newQuery = await db.sendDonorQuery({
        donor_id: currentDonor.id,
        ticket_code: `DNR-${Date.now().toString().slice(-4)}`,
        subject: inquiryForm.subject,
        message: inquiryForm.message,
        sender_name: currentUser?.full_name || currentDonor.contact_person || 'Donor',
        sender_role: 'Institutional Donor',
        recipient_name: recipient.name,
        recipient_role: recipient.role,
        status: 'Under Review',
        response: null
      });

      setQueries(previous => [...previous, newQuery]);
      setIsInquiryModalOpen(false);
      setInquiryForm({ subject: '', category: 'Financial Verification', project_code: '', message: '' });
      toast.success('Inquiry submitted to ADRA Country Leadership.');
    } catch (err) {
      console.error('Failed to submit donor inquiry:', err);
      toast.error(`Failed to transmit inquiry: ${err.message || 'Unknown database error.'}`);
    }
  };

  // Resolve inquiry contacts only from actual staff records.
  const pmUser = useMemo(() => {
    return staffUsers.find(user => ['program manager', 'programme manager'].includes((user.role || '').toLowerCase()));
  }, [staffUsers]);

  const foUser = useMemo(() => {
    return staffUsers.find(user => (user.role || '').toLowerCase().includes('finance'));
  }, [staffUsers]);

  const leadershipDesks = useMemo(() => [
    pmUser && {
      id: 'grace',
      userId: pmUser.id,
      role: pmUser.role,
      name: pmUser.full_name || pmUser.email,
      email: pmUser.email || '',
      department: pmUser.department || '',
      title: 'Program Manager',
      status: pmUser.status || 'Staff contact',
      badge: 'Programs',
      avatarColor: 'bg-emerald-600',
      icon: ClipboardList,
      isAccount: true,
      welcomeNote: 'Contact the Program Manager about project activities and field delivery records.'
    },
    foUser && {
      id: 'alex',
      userId: foUser.id,
      role: foUser.role,
      name: foUser.full_name || foUser.email,
      email: foUser.email || '',
      department: foUser.department || '',
      title: 'Finance Officer',
      status: foUser.status || 'Staff contact',
      badge: 'Finance',
      avatarColor: 'bg-blue-600',
      icon: Scale,
      isAccount: true,
      welcomeNote: 'Contact the Finance Officer about grant expenditure and financial records.'
    }
  ].filter(Boolean), [pmUser, foUser]);

  const currentDesk = leadershipDesks.find(d => d.id === activeChatDesk) || leadershipDesks[0] || {
    id: 'unavailable',
    role: '',
    name: 'No staff contacts available',
    email: '',
    department: '',
    status: 'Unavailable',
    avatarColor: 'bg-slate-400',
    icon: HelpCircle,
    isAccount: false,
    welcomeNote: 'No Program Manager or Finance Officer account is available in the database.'
  };

  const activeChatMessages = useMemo(() => {
    const filtered = queries.filter(query =>
      query.recipient_name === currentDesk.name || query.recipient_role === currentDesk.role
    );

    return [...filtered].sort((a, b) => {
      const timeA = new Date(a.created_at || a.date || 0).getTime();
      const timeB = new Date(b.created_at || b.date || 0).getTime();
      return timeA - timeB;
    });
  }, [queries, currentDesk]);

  const getDeskMessageCount = (deskId) => {
    const desk = leadershipDesks.find(item => item.id === deskId);
    if (!desk) return 0;
    return queries.filter(query =>
      query.recipient_name === desk.name || query.recipient_role === desk.role
    ).length;
  };

  const handleSendChatMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatMessageText.trim() || isSendingChat) return;
    if (!currentDonor?.id || currentDesk.id === 'unavailable') {
      toast.error('A linked donor record and staff contact are required to send a message.');
      return;
    }

    try {
      setIsSendingChat(true);
      await verifyDonorSession();
      const text = chatMessageText.trim();
      const subject = text.length > 50 ? `${text.substring(0, 47)}...` : text;

      const newQry = await db.sendDonorQuery({
        donor_id: currentDonor.id,
        ticket_code: `DNR-${Date.now().toString().slice(-4)}`,
        subject: subject,
        message: text,
        sender_name: currentUser?.full_name || currentDonor.contact_person || 'Donor',
        sender_role: 'Institutional Donor',
        recipient_name: currentDesk.name,
        recipient_role: currentDesk.role,
        status: 'Under Review',
        response: null
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
      console.error('Failed to send donor message:', err);
      toast.error(`Failed to transmit inquiry: ${err.message || 'Unknown database error.'}`);
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
      count: projects.length
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
      count: deliverables.length
    },
    {
      id: 'inquiries',
      label: 'Official Inquiries',
      icon: Mail,
      count: queries.length
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
                {currentDonor?.donor_name || 'No donor linked'}
              </p>
              <p className="text-[10px] text-slate-500 truncate font-medium">
                {currentUser?.full_name || currentUser?.email || 'Signed-in user'}
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
              <LoadingSpinner text="Loading donor records from the database..." />
            </div>
          ) : (
            <>
              {(loadError || !currentDonor || (currentDonor && !projects.length) || missingDonorTables.length > 0) && (
                <div className={`rounded-xl border px-4 py-3 text-sm ${
                  loadError ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-800'
                }`}>
                  {loadError
                    ? (!isSupabaseConfigured
                      ? 'Supabase is not configured. Donor portfolio data is not loaded from the database.'
                      : `Live donor data could not be loaded: ${loadError}`)
                    : missingDonorTables.length
                      ? `Donor data is loading from existing records. Apply the Supabase donor portal migration to enable: ${missingDonorTables.join(', ')}.`
                    : !currentDonor
                      ? 'No donor record is linked to this account. Ensure the donor record email matches the login email or link its ID to this account in profiles.'
                      : 'No projects or grant agreements are linked to this donor yet. Link funded projects by donor ID or add grant agreements to populate the portfolio.'}
                </div>
              )}

              {/* Executive Summary Top Metric Strip (Clean Unified ADRA Standard) */}
              {activeTab === 'overview' && (
                <>
                  <div className="flex flex-col gap-1 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#006B56]">Grant overview</p>
                      <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Executive summary</h1>
                    </div>
                    <p className="text-xs text-slate-500">{currentDonor?.donor_name || 'Institutional donor'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
                    {[
                      {
                        label: 'Grant committed',
                        value: portfolioAvailable ? `SSP ${totalCommitted.toLocaleString()}` : '—',
                        detail: portfolioAvailable ? 'Total approved funding' : 'Link a donor account to view',
                        Icon: Award,
                        borderColor: 'border-t-emerald-500',
                        valueColor: 'text-emerald-700',
                        iconColor: 'bg-emerald-100 text-emerald-700'
                      },
                      {
                        label: 'Funds disbursed',
                        value: portfolioAvailable ? `SSP ${totalDisbursed.toLocaleString()}` : '—',
                        detail: portfolioAvailable ? `${totalCommitted > 0 ? ((totalDisbursed / totalCommitted) * 100).toFixed(0) : 0}% of committed funding` : 'Link a donor account to view',
                        Icon: DollarSign,
                        borderColor: 'border-t-sky-500',
                        valueColor: 'text-sky-700',
                        iconColor: 'bg-sky-100 text-sky-700'
                      },
                      {
                        label: 'Recorded expenditures',
                        value: portfolioAvailable ? `SSP ${totalExpended.toLocaleString()}` : '—',
                        detail: portfolioAvailable ? `${burnRate}% of disbursed funds` : 'Link a donor account to view',
                        Icon: TrendingUp,
                        borderColor: 'border-t-violet-500',
                        valueColor: 'text-violet-700',
                        iconColor: 'bg-violet-100 text-violet-700'
                      },
                      {
                        label: 'Beneficiaries enrolled',
                        value: portfolioAvailable ? beneficiaryCount.toLocaleString() : '—',
                        detail: portfolioAvailable ? `Across ${jurisdictionCount} jurisdictions` : 'Link a donor account to view',
                        Icon: Users,
                        borderColor: 'border-t-amber-500',
                        valueColor: 'text-amber-700',
                        iconColor: 'bg-amber-100 text-amber-700'
                      }
                    ].map(({ label, value, detail, Icon, borderColor, valueColor, iconColor }) => (
                      <Card key={label} className={`rounded-xl border border-t-[3px] border-slate-200 bg-white p-3 shadow-2xs sm:rounded-2xl sm:p-4 ${borderColor}`}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-semibold leading-tight text-slate-500 sm:text-xs">{label}</p>
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8 ${iconColor}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                        </div>
                        <p className={`mt-2 break-words text-lg font-black tracking-tight sm:mt-3 sm:text-2xl ${valueColor}`}>{value}</p>
                        <p className="mt-1 text-[9px] leading-tight text-slate-500 sm:text-[11px]">{detail}</p>
                      </Card>
                    ))}
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
                <div className="space-y-5 sm:space-y-6">
                  <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">Funding & utilization</h2>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">Grant spending progress and reporting period</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
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
                          PDF Report
                        </Button>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-4 sm:px-6 sm:py-5">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-700">Grant absorption</p>
                          <p className="mt-1 text-sm font-bold text-slate-900">
                            SSP {totalExpended.toLocaleString()} <span className="font-medium text-slate-400">of SSP {totalDisbursed.toLocaleString()}</span>
                          </p>
                        </div>
                        <span className="text-sm font-bold text-[#006B56]">{burnRate}% utilized</span>
                      </div>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          style={{ width: `${Math.min(Number(burnRate), 100)}%` }}
                          className="h-full rounded-full bg-[#006B56] transition-all duration-500"
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap justify-between gap-x-4 gap-y-1 text-[11px] text-slate-500">
                        {grantPeriod.start && <span>Start · {formatDate(grantPeriod.start)}</span>}
                        {grantPeriod.end && <span>End · {formatDate(grantPeriod.end)}</span>}
                      </div>
                    </div>
                  </Card>

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
                    <div className="space-y-3 lg:col-span-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Funded projects</h3>
                          <p className="mt-0.5 text-xs text-slate-500">{projects.length} projects in this portfolio</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('projects')}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-[#006B56] hover:bg-emerald-50"
                        >
                          View portfolio <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {projects.map((proj) => {
                          const matchingGrant = grants.find(g => g.project_id === proj.id);
                          const projBudget = Number(matchingGrant?.total_committed ?? proj.budget ?? 0);
                          const projSpent = Number(projectSpend[proj.id] || 0);
                          const pct = projBudget > 0 ? ((projSpent / projBudget) * 100).toFixed(0) : '0';

                          return (
                            <Card
                              key={proj.id}
                              className="p-4 sm:p-5 bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition cursor-pointer shadow-2xs rounded-xl"
                              onClick={() => {
                                setSelectedProject(proj);
                                setIsProjectModalOpen(true);
                              }}
                            >
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="min-w-0 space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[11px] font-bold text-[#006B56] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                      {proj.project_code || 'No project code'}
                                    </span>
                                    {proj.status && <Badge status={proj.status} />}
                                  </div>
                                  <h4 className="text-sm font-bold text-slate-900">
                                    {proj.project_name}
                                  </h4>
                                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>{proj.location || 'Location not recorded'}</span>
                                  </p>
                                </div>

                                <div className="text-right shrink-0 w-full sm:w-auto">
                                  <p className="text-xs font-bold text-slate-900">
                                    SSP {projSpent.toLocaleString()}{' '}
                                    <span className="text-slate-400 font-normal">/ SSP {projBudget.toLocaleString()}</span>
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
                      <div className="flex items-center justify-between px-1">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Key milestone targets</h3>
                          <p className="mt-0.5 text-xs text-slate-500">Progress against planned outputs</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('impact')}
                          className="rounded-lg px-2 py-1.5 text-xs font-bold text-[#006B56] hover:bg-emerald-50"
                        >
                          Details
                        </button>
                      </div>

                      <Card className="p-4 sm:p-5 bg-white border border-slate-200 shadow-2xs rounded-xl space-y-4">
                        {donorIndicators.length ? donorIndicators.slice(0, 5).map(indicator => {
                          const target = Number(indicator.target) || 0;
                          const actual = Number(indicator.actual_result) || 0;
                          const percentage = target > 0 ? (actual / target) * 100 : 0;
                          return (
                            <div key={indicator.id} className="space-y-2">
                              <div className="flex justify-between gap-3 text-xs">
                                <span className="text-slate-700 font-medium">{indicator.indicator_name}</span>
                                <span className="shrink-0 text-[#006B56] font-bold">
                                  {percentage.toFixed(0)}% <span className="font-medium text-slate-400">({actual} / {target} {indicator.measurement_unit || ''})</span>
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-[#006B56]" style={{ width: `${Math.min(percentage, 100)}%` }} />
                              </div>
                            </div>
                          );
                        }) : (
                          <p className="text-xs text-slate-500">No project indicators have been recorded.</p>
                        )}
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
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
                      {filteredProjects.map((p) => {
                        const matchingGrant = grants.find(g => g.project_id === p.id);
                        const projBudget = Number(matchingGrant?.total_committed ?? p.budget ?? 0);
                        const projSpent = Number(projectSpend[p.id] || 0);

                        return (
                          <Card
                            key={p.id}
                            className="p-4 sm:p-5 bg-white border border-slate-200 hover:border-emerald-300 transition shadow-2xs rounded-xl"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <span className="font-mono text-[10px] font-bold text-slate-500">
                                    {p.project_code || 'No project code'}
                                  </span>
                                  <h3 className="mt-1 text-sm font-bold leading-snug text-slate-900 sm:text-base">
                                    {p.project_name}
                                  </h3>
                                </div>
                                {p.status && <Badge status={p.status} />}
                              </div>

                              <div className="mt-4 border-t border-slate-100 pt-3">
                                <div className="flex items-baseline justify-between gap-3 text-xs">
                                  <span className="text-slate-500">Grant allocation</span>
                                  <span className="font-bold text-slate-900">SSP {projBudget.toLocaleString()}</span>
                                </div>
                                <div className="mt-2 flex items-baseline justify-between gap-3 text-xs">
                                  <span className="text-slate-500">Spent</span>
                                  <span className="font-semibold text-slate-700">
                                    SSP {projSpent.toLocaleString()} <span className="text-[#006B56]">({((projSpent / (projBudget || 1)) * 100).toFixed(0)}%)</span>
                                  </span>
                                </div>
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full bg-[#006B56]"
                                    style={{ width: `${Math.min((projSpent / (projBudget || 1)) * 100, 100)}%` }}
                                  />
                                </div>
                              </div>

                              <div className="mt-3 flex items-center justify-end">
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
                                Details
                              </Button>
                              </div>
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
                <div className="flex flex-col gap-5 sm:gap-6">
                  {/* Standard Cost Category Breakdown */}
                  <Card className="order-1 p-3 sm:p-4 bg-white border border-slate-200 shadow-2xs rounded-xl sm:rounded-2xl">
                    <div className="mb-2.5">
                      <h3 className="text-sm font-bold text-slate-900">
                        Budget breakdown
                      </h3>
                    </div>

                    {budgetLineBreakdown.length ? (
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs lg:grid-cols-4">
                      {budgetLineBreakdown.map((item) => (
                        <div
                          key={item.name}
                          className={`min-w-0 rounded-lg border border-slate-200 border-l-[3px] bg-slate-50/60 p-2.5 sm:p-3 ${item.accent}`}
                        >
                          <p className="min-h-8 text-[10px] font-semibold leading-tight text-slate-600 sm:min-h-0 sm:text-xs">
                            {item.name}
                          </p>
                          <div className="mt-1 flex items-baseline justify-between gap-1">
                            <h4 className={`truncate text-sm font-black tracking-tight sm:text-base ${item.valueColor}`}>
                              SSP {item.amount.toLocaleString()}
                            </h4>
                            <span className="shrink-0 text-[10px] font-bold text-slate-500">{item.pct.toFixed(0)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    ) : (
                      <p className="text-xs text-slate-500">No expenditure records are available for this donor's projects.</p>
                    )}
                  </Card>

                  {/* Tranche Release Timeline */}
                  <Card className="order-2 p-4 sm:p-5 bg-white border border-slate-200 shadow-2xs rounded-xl sm:rounded-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Grant tranche schedule
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">Release amounts and liquidation status</p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleExportCSV}
                        icon={Download}
                        className="text-xs self-start sm:self-auto shrink-0"
                      >
                        Export Ledger
                      </Button>
                    </div>

                    {/* PHONE / MOBILE VIEW (Card-based Layout for Small Screens) */}
                    <div className="block sm:hidden space-y-2">
                      {donorTranches.length ? donorTranches.map(item => {
                        const relatedGrant = grants.find(grant => grant.id === item.donor_grant_id);
                        const statusClass = (item.status || '').toLowerCase().includes('liquidated')
                          ? 'bg-emerald-50 text-emerald-700'
                          : (item.status || '').toLowerCase().includes('schedul') || (item.status || '').toLowerCase().includes('await')
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-teal-50 text-[#006B56]';
                        return (
                        <div
                          key={item.id}
                          className="p-3 bg-white border border-slate-200 rounded-xl transition"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 text-xs block leading-tight">
                                {item.tranche_name}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">{relatedGrant?.grant_code}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-sm font-black text-slate-900 block leading-tight">
                                SSP {Number(item.amount).toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-medium">SSP</span>
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusClass}`}>
                              {item.status}
                            </span>
                            <span className="text-[10px] text-slate-500">{item.release_date ? formatDate(item.release_date) : 'Release date not set'}</span>
                          </div>
                          {item.eft_reference && <p className="mt-1 truncate font-mono text-[10px] text-slate-400">{item.eft_reference}</p>}
                        </div>
                      );
                      }) : <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">No grant tranche records have been entered.</p>}
                    </div>

                    {/* TABLE VIEW FOR TABLET & DESKTOP (Hidden on Mobile) */}
                    <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Tranche #</th>
                            <th className="py-2.5 px-3">Grant Agreement</th>
                            <th className="py-2.5 px-3">Release Date</th>
                            <th className="py-2.5 px-3">EFT Reference</th>
                            <th className="py-2.5 px-3 text-right">Amount (SSP)</th>
                            <th className="py-2.5 px-3 text-center">Liquidation Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {donorTranches.length ? donorTranches.map(item => {
                            const relatedGrant = grants.find(grant => grant.id === item.donor_grant_id);
                            return (
                              <tr key={item.id} className="hover:bg-slate-50/60 transition">
                                <td className="py-3 px-3 font-bold text-slate-900">{item.tranche_name}</td>
                                <td className="py-3 px-3 font-mono text-[#006B56]">{relatedGrant?.grant_code || '—'}</td>
                                <td className="py-3 px-3">{item.release_date ? formatDate(item.release_date) : '—'}</td>
                                <td className="py-3 px-3 font-mono text-slate-500">{item.eft_reference || '—'}</td>
                                <td className="py-3 px-3 text-right font-bold text-slate-900">SSP {Number(item.amount).toLocaleString()}</td>
                                <td className="py-3 px-3 text-center">{item.status}</td>
                              </tr>
                            );
                          }) : (
                            <tr><td colSpan="6" className="py-6 text-center text-slate-500">No grant tranche records have been entered.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                </div>
              )}

              {/* TAB 4: FIELD IMPACT & BENEFICIARIES (Streamlined & Decluttered) */}
              {activeTab === 'impact' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column: Demographics Breakdown (5 cols on desktop) */}
                  <Card className="lg:col-span-5 p-3 sm:p-5 bg-white border border-slate-200 shadow-2xs rounded-xl sm:rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            Beneficiary demographics
                          </h3>
                          <p className="hidden text-[11px] text-slate-500 mt-0.5 sm:block">
                            Beneficiary records linked to funded projects
                          </p>
                        </div>
                        <span className="text-xs font-bold text-slate-700">{donorBeneficiaries.length.toLocaleString()}</span>
                      </div>

                      <div className="space-y-1 my-2.5 sm:my-3.5">
                        <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100">
                          {beneficiaryBreakdown.map(item => (
                            <div
                              key={item.label}
                              style={{ width: `${item.pct}%` }}
                              className={`h-full ${item.dotColor}`}
                              title={`${item.label} (${item.pct.toFixed(1)}%)`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100 text-xs">
                        {beneficiaryBreakdown.length ? beneficiaryBreakdown.map(item => (
                          <div
                            key={item.label}
                            className="flex items-center justify-between gap-2 py-1.5 sm:py-2.5 first:pt-1 last:pb-1"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${item.dotColor}`} />
                              <span className="font-medium text-slate-700 text-[11px] sm:text-xs truncate">
                                {item.label}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-2 shrink-0">
                              <span className="font-bold text-slate-900 text-[11px] sm:text-xs">{item.count.toLocaleString()}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.badgeColor}`}>
                                {item.pct.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        )) : <p className="py-3 text-xs text-slate-500">No beneficiary records are linked to these projects.</p>}
                      </div>
                    </div>

                    <div className="pt-2 mt-1.5 sm:pt-3 sm:mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500">
                      <span>Total enrolled</span>
                      <span className="font-bold text-slate-800">{donorBeneficiaries.length.toLocaleString()}</span>
                    </div>
                  </Card>

                  {/* Right Column: Recent Field Deliveries (7 cols on desktop) */}
                  <Card className="lg:col-span-7 p-3 sm:p-5 bg-white border border-slate-200 shadow-2xs rounded-xl sm:rounded-2xl">
                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Recent project activities</h3>
                        <p className="hidden text-[11px] text-slate-500 mt-0.5 sm:block">
                          Activity records linked to funded projects
                        </p>
                      </div>
                    </div>

                    {/* Clean Activity Feed / Timeline (No bulky container cards) */}
                    <div className="relative space-y-2 sm:pl-6 sm:space-y-4 sm:before:absolute sm:before:left-2 sm:before:top-2 sm:before:bottom-2 sm:before:w-0.5 sm:before:bg-slate-200/80">
                      {donorActivities.length ? donorActivities.slice(0, 5).map(deliv => (
                        <div key={deliv.id} className="relative group">
                          <div className="absolute hidden sm:flex -left-6 top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#006B56] items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#006B56]" />
                          </div>

                          <div className="p-2.5 sm:p-3 rounded-xl bg-white sm:bg-slate-50/70 border border-slate-200/80 transition space-y-1.5">
                            <div className="flex flex-col-reverse items-start justify-between gap-1 sm:flex-row sm:items-start sm:gap-2">
                              <h4 className="text-[11px] sm:text-sm font-bold text-slate-900 leading-snug">
                                {deliv.activity_name}
                              </h4>
                              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium shrink-0 whitespace-nowrap">
                                {formatDate(deliv.activity_date)}
                              </span>
                            </div>

                            <p className="text-[10px] sm:text-[11px] text-slate-500 flex items-start gap-1.5">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="leading-snug">{deliv.location || 'Location not recorded'}</span>
                            </p>

                            {(deliv.actual_output || deliv.status) && (
                              <p className="pt-0.5 text-[10px] font-semibold text-slate-600">
                                {deliv.actual_output || deliv.status}
                              </p>
                            )}
                          </div>
                        </div>
                      )) : <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">No activity records are linked to these projects.</p>}
                    </div>
                  </Card>
                </div>
              )}

              {/* TAB 5: DELIVERABLES & COMPLIANCE VAULT */}
              {activeTab === 'compliance' && (
                <div className="space-y-5">
                  <Card className="p-4 sm:p-5 bg-white border border-slate-200 shadow-2xs rounded-xl sm:rounded-2xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#006B56] shrink-0" />
                          <span>Contractual Reporting & Audit Deliverables</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Mandatory quarterly progress narratives, financial monitoring statements, and external audit files.
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleExportCompliancePDF}
                        icon={Download}
                        className="text-xs self-start sm:self-auto shrink-0"
                      >
                        Export Compliance Dossier
                      </Button>
                    </div>

                    {deliverables.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs rounded-xl border border-dashed border-slate-200">
                        No contractual deliverables recorded for this grant.
                      </div>
                    ) : (
                      <>
                        {/* PHONE / MOBILE VIEW (No Horizontal Scrolling - Vertical Cards) */}
                        <div className="block sm:hidden space-y-2.5">
                          {deliverables.map((del) => {
                            const isApproved = del.status === 'Approved';
                            const isUnderReview = del.status === 'Under Review';
                            const shortTitle = getShortDeliverableTitle(del.title, del.type);

                            return (
                              <div
                                key={del.id}
                                className="p-3 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl space-y-2 transition"
                              >
                                {/* Top: Title + PDF Action Button */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-bold text-slate-900 text-xs leading-snug">
                                      {shortTitle}
                                    </h4>
                                    {del.type && (
                                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                                        {del.type}
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenDeliverable(del)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-[#006B56] hover:border-emerald-300 text-slate-700 text-xs font-semibold shadow-2xs transition shrink-0 active:scale-95 cursor-pointer"
                                    title={del.file_url ? `Open ${del.file_name || shortTitle}` : 'No file attached'}
                                  >
                                    <Download className="w-3.5 h-3.5 text-slate-600" />
                                    <span>{del.file_url ? 'File' : 'No file'}</span>
                                  </button>
                                </div>

                                {/* Bottom: Status Pill + Due Date */}
                                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/70 text-xs">
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

                                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                                    <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>Due: {formatDate(del.due_date)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* TABLET & DESKTOP VIEW (Standard 4-Column Table) */}
                        <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200 bg-white">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                <th className="py-2.5 px-3 sm:px-4">Deliverable</th>
                                <th className="py-2.5 px-3 whitespace-nowrap">Status</th>
                                <th className="py-2.5 px-3 whitespace-nowrap">Due Date</th>
                                <th className="py-2.5 px-3 text-right whitespace-nowrap w-16">File</th>
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
                                    {/* Deliverable Info */}
                                    <td className="py-2.5 px-3 sm:px-4">
                                      <span
                                        className="font-semibold text-slate-900 text-xs block"
                                        title={del.title}
                                      >
                                        {getShortDeliverableTitle(del.title, del.type)}
                                      </span>
                                      {del.title && del.title !== getShortDeliverableTitle(del.title, del.type) && (
                                        <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                                          {del.title}
                                        </span>
                                      )}
                                    </td>

                                    {/* Status */}
                                    <td className="py-2.5 px-3 whitespace-nowrap align-middle">
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
                                    <td className="py-2.5 px-3 whitespace-nowrap align-middle text-xs text-slate-700 font-medium">
                                      {formatDate(del.due_date)}
                                    </td>

                                    {/* PDF Download Action */}
                                    <td className="py-2.5 px-3 text-right whitespace-nowrap align-middle">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenDeliverable(del)}
                                        title={del.file_url ? `Open ${del.file_name || 'deliverable file'}` : 'No file attached'}
                                        disabled={!del.file_url}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-[#006B56] hover:border-emerald-300 text-slate-700 text-xs font-semibold shadow-2xs transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <Download className="w-3.5 h-3.5 text-slate-600" />
                                        <span>{del.file_url ? 'File' : 'No file'}</span>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </>
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
                              Select Module Officer
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
                          Staff contact from the directory
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
                                  {formatDate(q.created_at || q.date)}
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
                                    {q.responded_by || 'ADRA staff'}
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
                                  Assigned to {q.recipient_name || q.recipient_role || 'ADRA staff'}. Response pending.
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
                        placeholder={`Message ${currentDesk.name}...`}
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
                {selectedProject.status && <Badge status={selectedProject.status} />}
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[11px]">Total Project Budget</span>
                <span className="text-sm font-bold text-[#006B56]">
                  {formatCurrency(selectedProject.budget || 0)}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-700 font-bold block mb-1">Project Scope & Strategic Purpose</span>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                {selectedProject.description || 'No project scope has been recorded.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Jurisdiction</span>
                <strong className="text-slate-900">{selectedProject.location || 'Not recorded'}</strong>
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
              placeholder="Describe the information you need"
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
                placeholder="Enter grant code"
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
