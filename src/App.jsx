import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Login } from './pages/auth/Login';
import { initializeNativeApp } from './lib/capacitor';

import { ShieldAlert, ShieldCheck, ArrowLeft, LogOut } from 'lucide-react';

// Humanitarian Field Application Pages
import { Dashboard } from './pages/Dashboard';
import { ProgramsPage } from './pages/ProgramsPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { BeneficiariesPage } from './pages/BeneficiariesPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { InterventionsPage } from './pages/InterventionsPage';
import { MonitoringEvaluationPage } from './pages/MonitoringEvaluationPage';
import { FinancePage } from './pages/FinancePage';
import { DonorsPage } from './pages/DonorsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';

// Standalone Administrator Web Application Portal
import { AdminWebPortalPage } from './pages/admin/AdminWebPortalPage';
import { AdminLogin } from './pages/admin/AdminLogin';

// Specialized Beneficiary Mobile Application (Section 1.5.4)
import { BeneficiaryMobileApp } from './pages/beneficiary/BeneficiaryMobileApp';

// Dedicated Programme Manager Dashboard
import { ProgrammeManagerDashboard } from './pages/programme-manager/ProgrammeManagerDashboard';

// Specialized Supervisor Mobile Application
import { SupervisorMobileApp } from './pages/supervisor/SupervisorMobileApp';

// Specialized Field Worker Mobile Application
import { FieldWorkerApp } from './pages/field-worker/FieldWorkerApp';

// Specialized Finance Manager Mobile Application
import { FinanceMobileApp } from './pages/finance/FinanceMobileApp';

// Dedicated Inventory & Logistics Manager Portal (Section 1.5.10 & 1.5.11)
import { InventoryManagerDashboard } from './pages/inventory/InventoryManagerDashboard';

// Specialized Supplier Portal
import { SupplierPortalApp } from './pages/supplier/SupplierPortalApp';

// Dedicated Institutional Donor Portal
import { DonorPortalApp } from './pages/donor/DonorPortalApp';

// Universal Feedback & Complaints Desk
import { FeedbackComplaintsView } from './components/common/FeedbackComplaintsView';

// URL Path Routing Helper
function getPathInfo() {
  if (typeof window === 'undefined') {
    return { pathname: '/', hash: '', cleanPath: '/', isAdminPath: false, adminSection: 'overview' };
  }

  const pathname = window.location.pathname || '/';
  const hash = window.location.hash || '';

  // Determine effective path from pathname or hash (#/admin or #admin)
  let effectivePath = pathname;
  if (pathname === '/' || pathname === '/index.html' || pathname === '') {
    if (hash.startsWith('#/')) {
      effectivePath = hash.slice(1);
    } else if (hash.startsWith('#admin')) {
      effectivePath = '/' + hash.slice(1);
    }
  }

  // Normalize: remove trailing slashes
  const cleanPath = effectivePath.replace(/\/+$/, '') || '/';
  const segments = cleanPath.split('/').filter(Boolean);
  const isAdminPath = segments.length > 0 && segments[0].toLowerCase() === 'admin';

  let adminSection = 'overview';
  if (isAdminPath && segments.length > 1) {
    const sub = segments[1].toLowerCase();
    const sectionMap = {
      overview: 'overview',
      dashboard: 'overview',
      lifecycle: 'lifecycle',
      projects: 'lifecycle',
      aid: 'lifecycle',
      pipeline: 'lifecycle',
      identity: 'identity',
      users: 'identity',
      roles: 'identity',
      approvals: 'identity',
      beneficiaries: 'beneficiaries',
      households: 'beneficiaries',
      field: 'field',
      programmes: 'field',
      locations: 'field',
      operations: 'field',
      feedback: 'feedback',
      complaints: 'feedback',
      aap: 'feedback',
      security: 'security',
      audit: 'security',
      policies: 'security',
      reports: 'reports',
    };
    adminSection = sectionMap[sub] || 'overview';
  }

  return {
    pathname,
    hash,
    cleanPath,
    isAdminPath,
    adminSection,
  };
}

export function App() {
  const { currentUser, logout, quickSwitchRole } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [pathInfo, setPathInfo] = useState(getPathInfo);

  // Dual Architecture:
  // 'field_app' = Specialized Humanitarian Field Application (mobile/native feel)
  // 'admin_web_app' = Dedicated Enterprise Web Application Portal (HQ Command)
  const [appMode, setAppMode] = useState(() => {
    try {
      const saved = localStorage.getItem('adra_app_mode');
      if (saved) return saved;
    } catch (e) {
      console.error(e);
    }
    return 'admin_web_app'; // Default administrators to their dedicated web app
  });

  // Browser History Navigation Helper
  const navigateTo = (newPath, replace = false) => {
    try {
      if (window.location.pathname !== newPath) {
        if (replace) {
          window.history.replaceState({}, '', newPath);
        } else {
          window.history.pushState({}, '', newPath);
        }
        setPathInfo(getPathInfo());
      }
    } catch (e) {
      window.location.hash = newPath.startsWith('/') ? '#' + newPath : '#/' + newPath;
      setPathInfo(getPathInfo());
    }
  };

  // Sync state on browser back/forward buttons and hashchange
  useEffect(() => {
    const handleLocationChange = () => {
      setPathInfo(getPathInfo());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // When an administrator is in admin_web_app mode but URL is on root path, synchronize URL to /admin
  useEffect(() => {
    if (currentUser?.role === 'Administrator' && appMode === 'admin_web_app' && !pathInfo.isAdminPath) {
      navigateTo('/admin', true);
    }
  }, [currentUser?.role, appMode, pathInfo.isAdminPath]);

  useEffect(() => {
    try {
      localStorage.setItem('adra_app_mode', appMode);
    } catch (e) {
      console.error(e);
    }
  }, [appMode]);

  useEffect(() => {
    initializeNativeApp({
      onHardwareBack: () => {
        if (appMode === 'admin_web_app' || pathInfo.isAdminPath) {
          setAppMode('field_app');
          navigateTo('/');
          return true; // handled
        }
        if (currentTab !== 'dashboard') {
          setCurrentTab('dashboard');
          return true; // handled, don't exit
        }
        return false; // exit app
      }
    });
  }, [currentTab, appMode, pathInfo.isAdminPath]);

  // Automatically open the right page depending on user role fetched from database
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.role === 'Beneficiary') {
      return; // Renders BeneficiaryMobileApp
    }

    if (currentUser.role === 'Administrator') {
      setAppMode('admin_web_app');
      return;
    }

    if (currentUser.role === 'Supervisor') {
      setCurrentTab('supervisor');
      setAppMode('supervisor_mobile');
      return;
    }

    if (currentUser.role === 'Field Worker') {
      setCurrentTab('field_worker');
      setAppMode('field_worker_mobile');
      return;
    }

    if (currentUser.role === 'Finance Officer' || currentUser.role === 'Finance Manager') {
      setCurrentTab('finance');
      setAppMode('finance_mobile');
      return;
    } else if (currentUser.role === 'Inventory Manager' || currentUser.role === 'Logistics Officer') {
      setCurrentTab('inventory');
      setAppMode('inventory_manager');
      return;
    } else if (currentUser.role === 'Supplier') {
      setCurrentTab('supplier');
      setAppMode('supplier_portal');
      return;
    } else if (currentUser.role === 'M&E Officer') {
      setCurrentTab('me');
      setAppMode('field_app');
    } else if (currentUser.role === 'Program Manager') {
      setCurrentTab('programs');
      setAppMode('field_app');
    } else if (currentUser.role === 'Project Officer') {
      setCurrentTab('projects');
      setAppMode('field_app');
    } else if (currentUser.role === 'Donor') {
      setCurrentTab('donor_portal');
      setAppMode('donor_portal');
      return;
    } else {
      setCurrentTab('dashboard');
      setAppMode('field_app');
    }
  }, [currentUser?.role]);

  if (!currentUser) {
    if (pathInfo.isAdminPath) {
      return (
        <AdminLogin
          onLoginSuccess={(user) => {
            if (user?.role === 'Administrator') {
              setAppMode('admin_web_app');
              navigateTo('/admin');
            }
          }}
          onSwitchToFieldLogin={() => {
            setAppMode('field_app');
            navigateTo('/');
          }}
        />
      );
    }
    return (
      <Login
        onLoginSuccess={() => setCurrentTab('dashboard')}
        onSwitchToAdminLogin={() => {
          setAppMode('admin_web_app');
          navigateTo('/admin');
        }}
      />
    );
  }

  // Dedicated Administrator Web Portal Route (/admin and /admin/:section)
  if (pathInfo.isAdminPath) {
    if (currentUser.role === 'Administrator') {
      return (
        <AdminWebPortalPage
          initialSection={pathInfo.adminSection}
          onSectionChange={(section) => {
            const slug = section === 'overview' ? '' : `/${section === 'identity' ? 'users' : section}`;
            navigateTo(`/admin${slug}`);
          }}
          onSwitchToFieldApp={() => {
            setAppMode('field_app');
            navigateTo('/');
          }}
        />
      );
    }

    // Informative Access Guard if a non-administrator accesses /admin
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center p-4 selection:bg-emerald-600 selection:text-white">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-medium">
              <span>Path:</span>
              <span className="font-bold">{pathInfo.cleanPath}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Administrator Privileges Required</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              You are currently signed in as <span className="text-slate-900 font-semibold">{currentUser.full_name || 'Staff Member'}</span> with the role <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-emerald-800 text-xs font-semibold border border-slate-200">{currentUser.role}</span>.
            </p>
            <p className="text-xs text-slate-500">
              The Enterprise Admin Web Portal path is reserved for Humanitarian System Administrators.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => {
                quickSwitchRole('Administrator');
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              Switch to Administrator (Demo Mode)
            </button>

            <button
              type="button"
              onClick={() => {
                navigateTo('/');
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition border border-slate-200 active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Field Application (/)
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs text-rose-600 hover:text-rose-700 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If Beneficiary logs in, route directly to dedicated Beneficiary Mobile App:
  if (currentUser.role === 'Beneficiary') {
    return (
      <BeneficiaryMobileApp onSwitchToFieldApp={() => setAppMode('field_app')} />
    );
  }

  // If Administrator chooses the dedicated Web App Portal:
  if (currentUser.role === 'Administrator' && appMode === 'admin_web_app') {
    return (
      <AdminWebPortalPage
        initialSection={pathInfo.adminSection}
        onSectionChange={(section) => {
          const slug = section === 'overview' ? '' : `/${section === 'identity' ? 'users' : section}`;
          navigateTo(`/admin${slug}`);
        }}
        onSwitchToFieldApp={() => {
          setAppMode('field_app');
          navigateTo('/');
        }}
      />
    );
  }

  // If Supervisor logs in or switches to Supervisor mode:
  if (currentUser.role === 'Supervisor' || appMode === 'supervisor_mobile' || currentTab === 'supervisor') {
    return (
      <SupervisorMobileApp
        currentUser={currentUser}
        onLogout={logout}
        onSwitchRole={quickSwitchRole}
        onBackToFieldApp={() => setAppMode('field_app')}
      />
    );
  }

  // If Field Worker logs in or switches to Field Worker mode:
  if (currentUser.role === 'Field Worker' || appMode === 'field_worker_mobile' || currentTab === 'field_worker') {
    return (
      <FieldWorkerApp
        currentUser={currentUser}
        onLogout={logout}
        onSwitchRole={quickSwitchRole}
        onBackToFieldApp={() => setAppMode('field_app')}
      />
    );
  }

  // If Programme Manager logs in or switches to Programme Manager mode:
  if (currentUser.role === 'Program Manager' || currentUser.role === 'Programme Manager' || appMode === 'programme_manager' || currentTab === 'programs') {
    return (
      <ProgrammeManagerDashboard
        currentUser={currentUser}
        onLogout={logout}
        onSwitchRole={quickSwitchRole}
        onBackToFieldApp={() => setCurrentTab('dashboard')}
      />
    );
  }

  // If Finance Officer logs in or switches to Finance mode:
  if (currentUser.role === 'Finance Officer' || currentUser.role === 'Finance Manager' || appMode === 'finance_mobile' || currentTab === 'finance') {
    return (
      <FinanceMobileApp
        currentUser={currentUser}
        onLogout={logout}
        onSwitchRole={quickSwitchRole}
        onBackToFieldApp={() => setCurrentTab('dashboard')}
      />
    );
  }

  // If Inventory Manager logs in or switches to Inventory mode:
  if (currentUser.role === 'Inventory Manager' || currentUser.role === 'Logistics Officer' || appMode === 'inventory_manager' || currentTab === 'inventory') {
    return (
      <InventoryManagerDashboard
        currentUser={currentUser}
        onLogout={logout}
        onSwitchRole={quickSwitchRole}
        onBackToFieldApp={() => setCurrentTab('dashboard')}
      />
    );
  }

  // If Supplier logs in or switches to Supplier mode:
  if (currentUser.role === 'Supplier' || appMode === 'supplier_portal' || currentTab === 'supplier') {
    return (
      <SupplierPortalApp
        currentUser={currentUser}
        onLogout={logout}
        onSwitchRole={quickSwitchRole}
        onBackToFieldApp={() => setCurrentTab('dashboard')}
      />
    );
  }

  // If Donor logs in or switches to Donor mode:
  if (currentUser.role === 'Donor' || appMode === 'donor_portal' || currentTab === 'donor_portal') {
    return (
      <DonorPortalApp
        currentUser={currentUser}
        onLogout={logout}
        onSwitchRole={quickSwitchRole}
        onBackToFieldApp={() => {
          setAppMode('field_app');
          setCurrentTab('dashboard');
        }}
      />
    );
  }

  const tabTitles = {
    dashboard: 'Field Operations Dashboard',
    supervisor: 'Supervisor Mobile App',
    field_worker: 'Field Worker Application',
    programs: 'Programme Manager Dashboard',
    inventory: 'Inventory & Logistics Command Hub',
    supplier: 'Approved Supplier Portal',
    donor_portal: 'Institutional Donor Portal',
    projects: 'Project Portfolio',
    beneficiaries: 'Beneficiary Management',
    activities: 'Project Activities',
    interventions: 'Aid Interventions',
    me: 'Monitoring & Evaluation (M&E)',
    finance: 'Finance & Grants Control',
    donors: 'Donors & Partners',
    reports: 'Reports & Exports',
    feedback: 'Feedback & Complaints Desk',
    audit: 'System Audit Logs',
    settings: 'Configuration & DB Diagnostics',
    beneficiary_portal: 'Beneficiary Mobile App',
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'feedback':
        return (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs h-[calc(100vh-140px)] min-h-[500px]">
            <FeedbackComplaintsView currentUser={currentUser} />
          </div>
        );
      case 'supplier':
        return (
          <SupplierPortalApp
            currentUser={currentUser}
            onLogout={logout}
            onSwitchRole={quickSwitchRole}
            onBackToFieldApp={() => setCurrentTab('dashboard')}
          />
        );
      case 'beneficiary_portal':
        return <BeneficiaryMobileApp onSwitchToFieldApp={() => setCurrentTab('dashboard')} />;
      case 'field_worker':
        return (
          <FieldWorkerApp
            currentUser={currentUser}
            onLogout={logout}
            onSwitchRole={quickSwitchRole}
            onBackToFieldApp={() => setCurrentTab('dashboard')}
          />
        );
      case 'supervisor':
        return (
          <SupervisorMobileApp
            currentUser={currentUser}
            onLogout={logout}
            onSwitchRole={quickSwitchRole}
            onBackToFieldApp={() => setCurrentTab('dashboard')}
          />
        );
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentTab} />;
      case 'programs':
        return (
          <ProgrammeManagerDashboard
            currentUser={currentUser}
            onLogout={logout}
            onSwitchRole={quickSwitchRole}
          />
        );
      case 'inventory':
        return (
          <InventoryManagerDashboard
            currentUser={currentUser}
            onLogout={logout}
            onSwitchRole={quickSwitchRole}
            onBackToFieldApp={() => setCurrentTab('dashboard')}
          />
        );
      case 'projects':
        return (
          <ProtectedRoute allowedRoles={['Administrator', 'Program Manager', 'Project Officer', 'Finance Officer', 'M&E Officer']}>
            <ProjectsPage />
          </ProtectedRoute>
        );
      case 'beneficiaries':
        return (
          <ProtectedRoute allowedRoles={['Administrator', 'Program Manager', 'Project Officer', 'Finance Officer', 'M&E Officer']}>
            <BeneficiariesPage />
          </ProtectedRoute>
        );
      case 'activities':
        return (
          <ProtectedRoute allowedRoles={['Administrator', 'Program Manager', 'Project Officer', 'Finance Officer', 'M&E Officer']}>
            <ActivitiesPage />
          </ProtectedRoute>
        );
      case 'interventions':
        return (
          <ProtectedRoute allowedRoles={['Administrator', 'Program Manager', 'Project Officer', 'Finance Officer', 'M&E Officer']}>
            <InterventionsPage />
          </ProtectedRoute>
        );
      case 'me':
        return (
          <ProtectedRoute allowedRoles={['Administrator', 'Program Manager', 'Project Officer', 'Finance Officer', 'M&E Officer']}>
            <MonitoringEvaluationPage />
          </ProtectedRoute>
        );
      case 'finance':
        return (
          <ProtectedRoute allowedRoles={['Administrator', 'Program Manager', 'Finance Officer', 'Project Officer']}>
            <FinancePage />
          </ProtectedRoute>
        );
      case 'donors':
        return (
          <ProtectedRoute allowedRoles={['Administrator', 'Program Manager', 'Project Officer', 'Finance Officer']}>
            <DonorsPage />
          </ProtectedRoute>
        );
      case 'reports':
        return (
          <ProtectedRoute allowedRoles={['Administrator', 'Program Manager', 'Project Officer', 'Finance Officer', 'M&E Officer']}>
            <ReportsPage />
          </ProtectedRoute>
        );
      case 'audit':
        return (
          <ProtectedRoute allowedRoles={['Administrator']}>
            <AuditLogsPage />
          </ProtectedRoute>
        );
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard onNavigate={setCurrentTab} />;
    }
  };

  return (
    <AppLayout
      currentTab={currentTab}
      onSelectTab={(tabId) => {
        if (tabId === 'users' || tabId === 'admin_web') {
          setAppMode('admin_web_app');
          navigateTo('/admin');
        } else {
          setCurrentTab(tabId);
        }
      }}
      currentTabTitle={tabTitles[currentTab] || 'ADRA Management'}
      onSwitchToAdminWeb={() => {
        setAppMode('admin_web_app');
        navigateTo('/admin');
      }}
    >
      {renderContent()}
    </AppLayout>
  );
}

export default App;
