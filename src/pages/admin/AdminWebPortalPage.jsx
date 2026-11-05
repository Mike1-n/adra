import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  FolderKanban,
  Settings,
  UserCheck,
  KeyRound,
  FileCheck,
  MapPin,
  HeartHandshake,
  History,
  Lock,
  Radio,
  Database,
  BarChart3,
  HelpCircle,
  Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AdminWebPortalLayout } from '../../components/layout/AdminWebPortalLayout';

// Sub-views
import { AdminDashboardView } from './components/AdminDashboardView';
import { ProjectLifecycleTrackerView } from './components/ProjectLifecycleTrackerView';
import { UserRoleManagementView } from './components/UserRoleManagementView';
import { PermissionMatrixView } from './components/PermissionMatrixView';
import { ApprovalManagementView } from './components/ApprovalManagementView';
import { BeneficiaryOversightView } from './components/BeneficiaryOversightView';
import { FieldGovernanceView } from './components/FieldGovernanceView';
import { AdminFeedbackComplaintsOversightView } from './components/AdminFeedbackComplaintsOversightView';
import { ReportsPage } from '../ReportsPage';

export function AdminWebPortalPage({ onSwitchToFieldApp, initialSection = 'overview', onSectionChange }) {
  const { currentUser } = useAuth();
  // Primary Sections: 'overview', 'lifecycle', 'identity', 'beneficiaries', 'field', 'reports', 'feedback'
  const [activeSection, setActiveSection] = useState(initialSection || 'overview');

  // Keep activeSection in sync if initialSection changes via browser navigation
  React.useEffect(() => {
    if (initialSection && initialSection !== activeSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  const handleSelectSection = (section) => {
    setActiveSection(section);
    if (onSectionChange) onSectionChange(section);
  };

  // Sub-tabs for each section
  const [subTabs, setSubTabs] = useState({
    field: 'programmes',    // 'programmes' | 'locations' | 'approvals'
  });

  const setSectionSubTab = (section, tab) => {
    setSubTabs(prev => ({ ...prev, [section]: tab }));
  };

  // Callback from overview dashboard quick action buttons
  const handleOverviewNavigate = (target) => {
    let nextSec = 'overview';
    switch (target) {
      case 'lifecycle':
        nextSec = 'lifecycle';
        break;
      case 'users':
      case 'permissions':
        nextSec = 'identity';
        break;
      case 'approvals':
        nextSec = 'field';
        setSectionSubTab('field', 'approvals');
        break;
      case 'beneficiaries':
        nextSec = 'beneficiaries';
        break;
      case 'programmes':
        nextSec = 'field';
        setSectionSubTab('field', 'programmes');
        break;
      case 'locations':
        nextSec = 'field';
        setSectionSubTab('field', 'locations');
        break;
      case 'security':
      case 'audit':
        nextSec = 'reports';
        break;
      case 'feedback':
        nextSec = 'feedback';
        break;
      case 'reports':
        nextSec = 'reports';
        break;
      default:
        nextSec = 'overview';
    }
    setActiveSection(nextSec);
    if (onSectionChange) onSectionChange(nextSec);
  };

  return (
    <AdminWebPortalLayout
      activeSection={activeSection}
      onSelectSection={handleSelectSection}
      onSwitchToFieldApp={onSwitchToFieldApp}
    >
      {/* 1. OVERVIEW */}
      {activeSection === 'overview' && (
        <AdminDashboardView onNavigateTab={handleOverviewNavigate} />
      )}

      {/* 2. PROJECT & AID LIFECYCLE TRACKER */}
      {activeSection === 'lifecycle' && (
        <div className="space-y-6">
          <ProjectLifecycleTrackerView onNavigateTab={handleOverviewNavigate} />
        </div>
      )}

      {/* 3. USERS & ROLES */}
      {activeSection === 'identity' && (
        <div className="space-y-6">
          <UserRoleManagementView />
        </div>
      )}

      {/* 3. BENEFICIARY MANAGEMENT */}
      {activeSection === 'beneficiaries' && (
        <div className="space-y-6">
          <BeneficiaryOversightView />
        </div>
      )}

      {/* 4. FIELD OPERATIONS */}
      {activeSection === 'field' && (
        <div className="space-y-6">
          <div className="no-print flex items-center gap-1.5 p-1 rounded-xl bg-slate-850 border border-slate-800 w-fit">
            <button
              onClick={() => setSectionSubTab('field', 'programmes')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                subTabs.field === 'programmes'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              Programmes
            </button>

            <button
              onClick={() => setSectionSubTab('field', 'locations')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                subTabs.field === 'locations'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              Operational Locations
            </button>

            <button
              onClick={() => setSectionSubTab('field', 'approvals')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                subTabs.field === 'approvals'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              Budget Approvals
            </button>
          </div>

          <div>
            {subTabs.field === 'programmes' && <FieldGovernanceView initialTab="programmes" />}
            {subTabs.field === 'locations' && <FieldGovernanceView initialTab="locations" />}
            {subTabs.field === 'approvals' && <ApprovalManagementView initialCategory="Operational Budget" />}
          </div>
        </div>
      )}

      {/* 5. INTER-PARTY FEEDBACK & COMPLAINTS OVERSIGHT (AAP) */}
      {activeSection === 'feedback' && (
        <AdminFeedbackComplaintsOversightView />
      )}

      {/* 7. REPORTS */}
      {activeSection === 'reports' && (
        <div className="space-y-6">
          <ReportsPage />
        </div>
      )}
    </AdminWebPortalLayout>
  );
}
