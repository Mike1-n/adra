import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Login } from './pages/auth/Login';
import { initializeNativeApp } from './lib/capacitor';

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

// Specialized Beneficiary Mobile Application (Section 1.5.4)
import { BeneficiaryMobileApp } from './pages/beneficiary/BeneficiaryMobileApp';

// Dedicated Programme Manager Dashboard
import { ProgrammeManagerDashboard } from './pages/programme-manager/ProgrammeManagerDashboard';

export function App() {
  const { currentUser, logout, quickSwitchRole } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');

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
        if (appMode === 'admin_web_app') {
          setAppMode('field_app');
          return true; // handled
        }
        if (currentTab !== 'dashboard') {
          setCurrentTab('dashboard');
          return true; // handled, don't exit
        }
        return false; // exit app
      }
    });
  }, [currentTab, appMode]);

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

    // Field staff role routes
    if (currentUser.role === 'Finance Officer') {
      setCurrentTab('finance');
      setAppMode('field_app');
    } else if (currentUser.role === 'M&E Officer') {
      setCurrentTab('me');
      setAppMode('field_app');
    } else if (currentUser.role === 'Program Manager') {
      setCurrentTab('programs');
      setAppMode('field_app');
    } else if (currentUser.role === 'Project Officer') {
      setCurrentTab('projects');
      setAppMode('field_app');
    } else if (currentUser.role === 'Field Worker') {
      setCurrentTab('beneficiaries');
      setAppMode('field_app');
    } else if (currentUser.role === 'Donor') {
      setCurrentTab('reports');
      setAppMode('field_app');
    } else {
      setCurrentTab('dashboard');
      setAppMode('field_app');
    }
  }, [currentUser?.role]);

  if (!currentUser) {
    return <Login onLoginSuccess={() => setCurrentTab('dashboard')} />;
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
      <AdminWebPortalPage onSwitchToFieldApp={() => setAppMode('field_app')} />
    );
  }

  // If Programme Manager logs in or switches to Programme Manager mode:
  if (currentUser.role === 'Program Manager' || currentUser.role === 'Programme Manager' || appMode === 'programme_manager') {
    return (
      <ProgrammeManagerDashboard
        currentUser={currentUser}
        onLogout={logout}
        onSwitchRole={quickSwitchRole}
      />
    );
  }

  const tabTitles = {
    dashboard: 'Field Operations Dashboard',
    programs: 'Programme Manager Dashboard',
    projects: 'Project Portfolio',
    beneficiaries: 'Beneficiary Management',
    activities: 'Project Activities',
    interventions: 'Aid Interventions',
    me: 'Monitoring & Evaluation (M&E)',
    finance: 'Finance & Grants Control',
    donors: 'Donors & Partners',
    reports: 'Reports & Exports',
    audit: 'System Audit Logs',
    settings: 'Configuration & DB Diagnostics',
    beneficiary_portal: 'Beneficiary Mobile App',
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'beneficiary_portal':
        return <BeneficiaryMobileApp onSwitchToFieldApp={() => setCurrentTab('dashboard')} />;
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
        } else {
          setCurrentTab(tabId);
        }
      }}
      currentTabTitle={tabTitles[currentTab] || 'ADRA Management'}
      onSwitchToAdminWeb={() => setAppMode('admin_web_app')}
    >
      {renderContent()}
    </AppLayout>
  );
}

export default App;
