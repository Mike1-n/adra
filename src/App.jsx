import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Login } from './pages/auth/Login';
import { initializeNativeApp } from './lib/capacitor';

// Pages
import { Dashboard } from './pages/Dashboard';
import { ProjectsPage } from './pages/ProjectsPage';
import { BeneficiariesPage } from './pages/BeneficiariesPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { InterventionsPage } from './pages/InterventionsPage';
import { MonitoringEvaluationPage } from './pages/MonitoringEvaluationPage';
import { FinancePage } from './pages/FinancePage';
import { DonorsPage } from './pages/DonorsPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  const { currentUser } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');

  useEffect(() => {
    initializeNativeApp({
      onHardwareBack: () => {
        if (currentTab !== 'dashboard') {
          setCurrentTab('dashboard');
          return true; // handled, don't exit
        }
        return false; // exit app
      }
    });
  }, [currentTab]);

  if (!currentUser) {
    return <Login onLoginSuccess={() => setCurrentTab('dashboard')} />;
  }

  const tabTitles = {
    dashboard: 'Executive Dashboard',
    projects: 'Project Portfolio',
    beneficiaries: 'Beneficiary Management',
    activities: 'Project Activities',
    interventions: 'Aid Interventions',
    me: 'Monitoring & Evaluation (M&E)',
    finance: 'Finance & Grants Control',
    donors: 'Donors & Partners',
    reports: 'Reports & Exports',
    users: 'User Management (RBAC)',
    audit: 'System Audit Logs',
    settings: 'Configuration & DB Diagnostics',
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentTab} />;
      case 'projects':
        return (
          <ProtectedRoute allowedRoles={['Administrator', 'Project Officer', 'Finance Officer', 'M&E Officer']}>
            <ProjectsPage />
          </ProtectedRoute>
        );
      case 'beneficiaries':
        return (
          <ProtectedRoute allowedRoles={['Administrator', 'Project Officer', 'Finance Officer', 'M&E Officer']}>
            <BeneficiariesPage />
          </ProtectedRoute>
        );
      case 'activities':
        return (
          <ProtectedRoute allowedRoles={['Administrator', 'Project Officer', 'Finance Officer', 'M&E Officer']}>
            <ActivitiesPage />
          </ProtectedRoute>
        );
      case 'interventions':
        return (
          <ProtectedRoute allowedRoles={['Administrator', 'Project Officer', 'Finance Officer', 'M&E Officer']}>
            <InterventionsPage />
          </ProtectedRoute>
        );
      case 'me':
        return (
          <ProtectedRoute allowedRoles={['Administrator', 'Project Officer', 'Finance Officer', 'M&E Officer']}>
            <MonitoringEvaluationPage />
          </ProtectedRoute>
        );
      case 'finance':
        return (
          <ProtectedRoute allowedRoles={['Administrator', 'Finance Officer', 'Project Officer']}>
            <FinancePage />
          </ProtectedRoute>
        );
      case 'donors':
        return (
          <ProtectedRoute allowedRoles={['Administrator', 'Project Officer', 'Finance Officer']}>
            <DonorsPage />
          </ProtectedRoute>
        );
      case 'reports':
        return (
          <ProtectedRoute allowedRoles={['Administrator', 'Project Officer', 'Finance Officer', 'M&E Officer']}>
            <ReportsPage />
          </ProtectedRoute>
        );
      case 'users':
        return (
          <ProtectedRoute allowedRoles={['Administrator']}>
            <UsersPage />
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
      onSelectTab={setCurrentTab}
      currentTabTitle={tabTitles[currentTab] || 'ADRA Management'}
    >
      {renderContent()}
    </AppLayout>
  );
}

export default App;
