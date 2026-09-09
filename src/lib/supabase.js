import { createClient } from '@supabase/supabase-js';
import * as mock from './mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if valid Supabase configuration is provided
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project-ref.supabase.co' &&
  !supabaseUrl.includes('your-project-ref')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local persistent mock store for demo / offline presentation mode
const STORAGE_KEYS = {
  PROJECTS: 'adra_projects',
  BENEFICIARIES: 'adra_beneficiaries',
  ACTIVITIES: 'adra_activities',
  INTERVENTIONS: 'adra_interventions',
  INDICATORS: 'adra_indicators',
  BUDGETS: 'adra_budgets',
  EXPENDITURES: 'adra_expenditures',
  DONORS: 'adra_donors',
  PARTNERS: 'adra_partners',
  DOCUMENTS: 'adra_documents',
  AUDIT_LOGS: 'adra_audit_logs',
  USERS: 'adra_users',
  LOCATIONS: 'adra_locations',
  APPROVALS: 'adra_approvals',
  PERMISSIONS: 'adra_permissions',
  SECURITY_SETTINGS: 'adra_security_settings',
  SYSTEM_SETTINGS: 'adra_system_settings',
  NOTIFICATIONS: 'adra_notifications',
  FAQS: 'adra_faqs',
  SUPPLIERS: 'adra_suppliers',
  INVENTORY: 'adra_inventory'
};

function getLocalData(key, defaultData) {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error reading localStorage', e);
  }
  return defaultData;
}

function saveLocalData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error writing to localStorage', e);
  }
}

// Unified Data Service for real Supabase queries with Mock fallback
export const db = {
  // --- PROJECTS ---
  async getProjects() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('projects').select('*, donors(donor_name), partners(partner_name), profiles(full_name)').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return getLocalData(STORAGE_KEYS.PROJECTS, mock.initialProjects);
  },

  async createProject(project) {
    const newProj = {
      id: isSupabaseConfigured ? undefined : `pr_${Date.now()}`,
      created_at: new Date().toISOString(),
      ...project
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('projects').insert([newProj]).select().single();
      if (error) throw error;
      return data;
    }
    const current = getLocalData(STORAGE_KEYS.PROJECTS, mock.initialProjects);
    const updated = [newProj, ...current];
    saveLocalData(STORAGE_KEYS.PROJECTS, updated);
    db.logAudit({
      action: 'CREATE',
      module: 'Projects',
      record_id: newProj.project_code || newProj.id,
      details: `Created project: ${newProj.project_name}`
    });
    return newProj;
  },

  async updateProject(id, updates) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const current = getLocalData(STORAGE_KEYS.PROJECTS, mock.initialProjects);
    const updated = current.map(p => p.id === id ? { ...p, ...updates } : p);
    saveLocalData(STORAGE_KEYS.PROJECTS, updated);
    db.logAudit({
      action: 'UPDATE',
      module: 'Projects',
      record_id: updates.project_code || id,
      details: `Updated project: ${updates.project_name || id}`
    });
    return updated.find(p => p.id === id);
  },

  async deleteProject(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    const current = getLocalData(STORAGE_KEYS.PROJECTS, mock.initialProjects);
    const item = current.find(p => p.id === id);
    const updated = current.filter(p => p.id !== id);
    saveLocalData(STORAGE_KEYS.PROJECTS, updated);
    db.logAudit({
      action: 'DELETE',
      module: 'Projects',
      record_id: item?.project_code || id,
      details: `Deleted project: ${item?.project_name || id}`
    });
    return true;
  },

  // --- BENEFICIARIES ---
  async getBeneficiaries() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('beneficiaries').select('*, projects(project_name)').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return getLocalData(STORAGE_KEYS.BENEFICIARIES, mock.initialBeneficiaries);
  },

  async createBeneficiary(beneficiary) {
    const newBen = {
      id: isSupabaseConfigured ? undefined : `b_${Date.now()}`,
      created_at: new Date().toISOString(),
      registration_date: beneficiary.registration_date || new Date().toISOString().split('T')[0],
      ...beneficiary
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('beneficiaries').insert([newBen]).select().single();
      if (error) throw error;
      return data;
    }
    const current = getLocalData(STORAGE_KEYS.BENEFICIARIES, mock.initialBeneficiaries);
    const updated = [newBen, ...current];
    saveLocalData(STORAGE_KEYS.BENEFICIARIES, updated);
    db.logAudit({
      action: 'CREATE',
      module: 'Beneficiaries',
      record_id: newBen.beneficiary_code || newBen.id,
      details: `Registered beneficiary: ${newBen.full_name}`
    });
    return newBen;
  },

  async updateBeneficiary(id, updates) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('beneficiaries').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const current = getLocalData(STORAGE_KEYS.BENEFICIARIES, mock.initialBeneficiaries);
    const updated = current.map(b => b.id === id ? { ...b, ...updates } : b);
    saveLocalData(STORAGE_KEYS.BENEFICIARIES, updated);
    db.logAudit({
      action: 'UPDATE',
      module: 'Beneficiaries',
      record_id: updates.beneficiary_code || id,
      details: `Updated beneficiary: ${updates.full_name || id}`
    });
    return updated.find(b => b.id === id);
  },

  async deleteBeneficiary(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('beneficiaries').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    const current = getLocalData(STORAGE_KEYS.BENEFICIARIES, mock.initialBeneficiaries);
    const item = current.find(b => b.id === id);
    const updated = current.filter(b => b.id !== id);
    saveLocalData(STORAGE_KEYS.BENEFICIARIES, updated);
    db.logAudit({
      action: 'DELETE',
      module: 'Beneficiaries',
      record_id: item?.beneficiary_code || id,
      details: `Deleted beneficiary: ${item?.full_name || id}`
    });
    return true;
  },

  // --- ACTIVITIES ---
  async getActivities() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('activities').select('*, projects(project_name), profiles(full_name)').order('activity_date', { ascending: false });
      if (!error && data) return data;
    }
    return getLocalData(STORAGE_KEYS.ACTIVITIES, mock.initialActivities);
  },

  async createActivity(activity) {
    const newAct = {
      id: isSupabaseConfigured ? undefined : `act_${Date.now()}`,
      created_at: new Date().toISOString(),
      ...activity
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('activities').insert([newAct]).select().single();
      if (error) throw error;
      return data;
    }
    const current = getLocalData(STORAGE_KEYS.ACTIVITIES, mock.initialActivities);
    const updated = [newAct, ...current];
    saveLocalData(STORAGE_KEYS.ACTIVITIES, updated);
    db.logAudit({
      action: 'CREATE',
      module: 'Activities',
      record_id: newAct.activity_code || newAct.id,
      details: `Created activity: ${newAct.activity_name}`
    });
    return newAct;
  },

  async updateActivity(id, updates) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('activities').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const current = getLocalData(STORAGE_KEYS.ACTIVITIES, mock.initialActivities);
    const updated = current.map(a => a.id === id ? { ...a, ...updates } : a);
    saveLocalData(STORAGE_KEYS.ACTIVITIES, updated);
    db.logAudit({
      action: 'UPDATE',
      module: 'Activities',
      record_id: updates.activity_code || id,
      details: `Updated activity: ${updates.activity_name || id}`
    });
    return updated.find(a => a.id === id);
  },

  async deleteActivity(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('activities').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    const current = getLocalData(STORAGE_KEYS.ACTIVITIES, mock.initialActivities);
    const item = current.find(a => a.id === id);
    const updated = current.filter(a => a.id !== id);
    saveLocalData(STORAGE_KEYS.ACTIVITIES, updated);
    db.logAudit({
      action: 'DELETE',
      module: 'Activities',
      record_id: item?.activity_code || id,
      details: `Deleted activity: ${item?.activity_name || id}`
    });
    return true;
  },

  // --- INTERVENTIONS ---
  async getInterventions() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('interventions').select('*, beneficiaries(full_name), projects(project_name)').order('intervention_date', { ascending: false });
      if (!error && data) return data;
    }
    return getLocalData(STORAGE_KEYS.INTERVENTIONS, mock.initialInterventions);
  },

  async createIntervention(intervention) {
    const newInt = {
      id: isSupabaseConfigured ? undefined : `int_${Date.now()}`,
      created_at: new Date().toISOString(),
      ...intervention
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('interventions').insert([newInt]).select().single();
      if (error) throw error;
      return data;
    }
    const current = getLocalData(STORAGE_KEYS.INTERVENTIONS, mock.initialInterventions);
    const updated = [newInt, ...current];
    saveLocalData(STORAGE_KEYS.INTERVENTIONS, updated);
    db.logAudit({
      action: 'CREATE',
      module: 'Interventions',
      record_id: newInt.intervention_code || newInt.id,
      details: `Recorded intervention: ${newInt.intervention_type}`
    });
    return newInt;
  },

  async updateIntervention(id, updates) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('interventions').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const current = getLocalData(STORAGE_KEYS.INTERVENTIONS, mock.initialInterventions);
    const updated = current.map(i => i.id === id ? { ...i, ...updates } : i);
    saveLocalData(STORAGE_KEYS.INTERVENTIONS, updated);
    return updated.find(i => i.id === id);
  },

  async deleteIntervention(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('interventions').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    const current = getLocalData(STORAGE_KEYS.INTERVENTIONS, mock.initialInterventions);
    const item = current.find(i => i.id === id);
    const updated = current.filter(i => i.id !== id);
    saveLocalData(STORAGE_KEYS.INTERVENTIONS, updated);
    db.logAudit({
      action: 'DELETE',
      module: 'Interventions',
      record_id: item?.intervention_code || id,
      details: `Deleted intervention: ${item?.intervention_type || id}`
    });
    return true;
  },

  // --- INDICATORS (M&E) ---
  async getIndicators() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('indicators').select('*, projects(project_name)').order('indicator_code');
      if (!error && data) return data;
    }
    return getLocalData(STORAGE_KEYS.INDICATORS, mock.initialIndicators);
  },

  async createIndicator(indicator) {
    const newInd = {
      id: isSupabaseConfigured ? undefined : `ind_${Date.now()}`,
      created_at: new Date().toISOString(),
      ...indicator
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('indicators').insert([newInd]).select().single();
      if (error) throw error;
      return data;
    }
    const current = getLocalData(STORAGE_KEYS.INDICATORS, mock.initialIndicators);
    const updated = [newInd, ...current];
    saveLocalData(STORAGE_KEYS.INDICATORS, updated);
    db.logAudit({
      action: 'CREATE',
      module: 'M&E',
      record_id: newInd.indicator_code || newInd.id,
      details: `Created indicator: ${newInd.indicator_name}`
    });
    return newInd;
  },

  async updateIndicator(id, updates) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('indicators').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const current = getLocalData(STORAGE_KEYS.INDICATORS, mock.initialIndicators);
    const updated = current.map(ind => ind.id === id ? { ...ind, ...updates } : ind);
    saveLocalData(STORAGE_KEYS.INDICATORS, updated);
    db.logAudit({
      action: 'UPDATE',
      module: 'M&E',
      record_id: updates.indicator_code || id,
      details: `Updated indicator result: ${updates.indicator_name || id}`
    });
    return updated.find(ind => ind.id === id);
  },

  async deleteIndicator(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('indicators').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    const current = getLocalData(STORAGE_KEYS.INDICATORS, mock.initialIndicators);
    const item = current.find(ind => ind.id === id);
    const updated = current.filter(ind => ind.id !== id);
    saveLocalData(STORAGE_KEYS.INDICATORS, updated);
    return true;
  },

  // --- BUDGETS & EXPENDITURES (FINANCE) ---
  async getBudgets() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('budgets').select('*, projects(project_name)');
      if (!error && data) return data;
    }
    return getLocalData(STORAGE_KEYS.BUDGETS, mock.initialBudgets);
  },

  async createBudget(budget) {
    const newBg = {
      id: isSupabaseConfigured ? undefined : `bg_${Date.now()}`,
      created_at: new Date().toISOString(),
      ...budget
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('budgets').insert([newBg]).select().single();
      if (error) throw error;
      return data;
    }
    const current = getLocalData(STORAGE_KEYS.BUDGETS, mock.initialBudgets);
    const updated = [newBg, ...current];
    saveLocalData(STORAGE_KEYS.BUDGETS, updated);
    db.logAudit({
      action: 'CREATE',
      module: 'Finance',
      record_id: newBg.id,
      details: `Allocated budget: ${newBg.budget_category} ($${newBg.allocated_amount})`
    });
    return newBg;
  },

  async getExpenditures() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('expenditures').select('*, projects(project_name)').order('expenditure_date', { ascending: false });
      if (!error && data) return data;
    }
    return getLocalData(STORAGE_KEYS.EXPENDITURES, mock.initialExpenditures);
  },

  async createExpenditure(expenditure) {
    const newExp = {
      id: isSupabaseConfigured ? undefined : `ex_${Date.now()}`,
      created_at: new Date().toISOString(),
      ...expenditure
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('expenditures').insert([newExp]).select().single();
      if (error) throw error;
      return data;
    }
    const current = getLocalData(STORAGE_KEYS.EXPENDITURES, mock.initialExpenditures);
    const updated = [newExp, ...current];
    saveLocalData(STORAGE_KEYS.EXPENDITURES, updated);
    db.logAudit({
      action: 'CREATE',
      module: 'Finance',
      record_id: newExp.expenditure_code || newExp.id,
      details: `Recorded expenditure: $${newExp.amount} for ${newExp.category}`
    });
    return newExp;
  },

  async deleteExpenditure(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('expenditures').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    const current = getLocalData(STORAGE_KEYS.EXPENDITURES, mock.initialExpenditures);
    const updated = current.filter(e => e.id !== id);
    saveLocalData(STORAGE_KEYS.EXPENDITURES, updated);
    return true;
  },

  // --- DONORS & PARTNERS ---
  async getDonors() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('donors').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return getLocalData(STORAGE_KEYS.DONORS, mock.initialDonors);
  },

  async createDonor(donor) {
    const newD = {
      id: isSupabaseConfigured ? undefined : `d_${Date.now()}`,
      created_at: new Date().toISOString(),
      ...donor
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('donors').insert([newD]).select().single();
      if (error) throw error;
      return data;
    }
    const current = getLocalData(STORAGE_KEYS.DONORS, mock.initialDonors);
    const updated = [newD, ...current];
    saveLocalData(STORAGE_KEYS.DONORS, updated);
    return newD;
  },

  async getPartners() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('partners').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return getLocalData(STORAGE_KEYS.PARTNERS, mock.initialPartners);
  },

  async createPartner(partner) {
    const newP = {
      id: isSupabaseConfigured ? undefined : `p_${Date.now()}`,
      created_at: new Date().toISOString(),
      ...partner
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('partners').insert([newP]).select().single();
      if (error) throw error;
      return data;
    }
    const current = getLocalData(STORAGE_KEYS.PARTNERS, mock.initialPartners);
    const updated = [newP, ...current];
    saveLocalData(STORAGE_KEYS.PARTNERS, updated);
    return newP;
  },

  // --- DOCUMENTS ---
  async getDocuments() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('project_documents').select('*, projects(project_name)').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return getLocalData(STORAGE_KEYS.DOCUMENTS, mock.initialDocuments);
  },

  async createDocument(doc) {
    const newDoc = {
      id: isSupabaseConfigured ? undefined : `doc_${Date.now()}`,
      uploaded_at: new Date().toISOString(),
      ...doc
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('project_documents').insert([newDoc]).select().single();
      if (error) throw error;
      return data;
    }
    const current = getLocalData(STORAGE_KEYS.DOCUMENTS, mock.initialDocuments);
    const updated = [newDoc, ...current];
    saveLocalData(STORAGE_KEYS.DOCUMENTS, updated);
    return newDoc;
  },

  // --- AUDIT LOGS ---
  async getAuditLogs() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
      if (!error && data) return data;
    }
    return getLocalData(STORAGE_KEYS.AUDIT_LOGS, mock.initialAuditLogs);
  },

  async logAudit({ action, module, record_id, details }) {
    const currentUser = JSON.parse(localStorage.getItem('adra_current_user') || '{}');
    const newLog = {
      id: isSupabaseConfigured ? undefined : `log_${Date.now()}`,
      user_email: currentUser.email || 'system@adra.org',
      user_role: currentUser.role || 'Administrator',
      action,
      module,
      record_id: String(record_id || ''),
      details: typeof details === 'string' ? details : JSON.stringify(details),
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured) {
      await supabase.from('audit_logs').insert([newLog]);
      return;
    }
    const current = getLocalData(STORAGE_KEYS.AUDIT_LOGS, mock.initialAuditLogs);
    const updated = [newLog, ...current].slice(0, 100);
    saveLocalData(STORAGE_KEYS.AUDIT_LOGS, updated);
  },

  // --- USERS & IAM ---
  async getUsers() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return getLocalData(STORAGE_KEYS.USERS, mock.demoAccounts);
  },

  async createUser(userData) {
    const newUser = {
      id: `usr_${Date.now()}`,
      email: userData.email,
      password: userData.password || 'Password123!',
      full_name: userData.full_name,
      role: userData.role || 'Field Worker',
      department: userData.department || 'Field Operations',
      status: 'Active',
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('profiles').insert([newUser]).select().single();
      if (!error && data) return data;
    }
    const current = getLocalData(STORAGE_KEYS.USERS, mock.demoAccounts);
    const updated = [newUser, ...current];
    saveLocalData(STORAGE_KEYS.USERS, updated);
    await this.logAudit({ action: 'CREATE', module: 'User Management', record_id: newUser.id, details: `Created user account for ${newUser.full_name} (${newUser.role})` });
    return newUser;
  },

  async updateUser(id, userData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('profiles').update(userData).eq('id', id).select().single();
      if (!error && data) return data;
    }
    const current = getLocalData(STORAGE_KEYS.USERS, mock.demoAccounts);
    const updated = current.map(u => u.id === id ? { ...u, ...userData } : u);
    saveLocalData(STORAGE_KEYS.USERS, updated);
    await this.logAudit({ action: 'UPDATE', module: 'User Management', record_id: id, details: `Updated profile details for user ${id}` });
    return updated.find(u => u.id === id);
  },

  async deleteUser(id) {
    if (isSupabaseConfigured) {
      await supabase.from('profiles').delete().eq('id', id);
    }
    const current = getLocalData(STORAGE_KEYS.USERS, mock.demoAccounts);
    const updated = current.filter(u => u.id !== id);
    saveLocalData(STORAGE_KEYS.USERS, updated);
    await this.logAudit({ action: 'DELETE', module: 'User Management', record_id: id, details: `Deleted user account ${id}` });
    return true;
  },

  async toggleUserStatus(id, newStatus) {
    return this.updateUser(id, { status: newStatus });
  },

  async updateUserRole(id, role) {
    return this.updateUser(id, { role });
  },

  async getRoles() {
    return mock.initialRoles;
  },

  // --- PERMISSIONS MATRIX ---
  async getPermissions() {
    return getLocalData(STORAGE_KEYS.PERMISSIONS, mock.initialPermissions);
  },

  async updatePermission(role, field, value) {
    const current = getLocalData(STORAGE_KEYS.PERMISSIONS, mock.initialPermissions);
    const updated = current.map(p => p.role === role ? { ...p, [field]: value } : p);
    saveLocalData(STORAGE_KEYS.PERMISSIONS, updated);
    await this.logAudit({ action: 'UPDATE', module: 'Permission Management', record_id: role, details: `Modified ${field} permission for role ${role} to ${value}` });
    return updated;
  },

  // --- APPROVALS MANAGEMENT ---
  async getApprovals(categoryFilter) {
    const current = getLocalData(STORAGE_KEYS.APPROVALS, mock.initialApprovals);
    if (!categoryFilter || categoryFilter === 'ALL') return current;
    return current.filter(a => a.category === categoryFilter);
  },

  async updateApprovalStatus(id, status, notes = '') {
    const current = getLocalData(STORAGE_KEYS.APPROVALS, mock.initialApprovals);
    const updated = current.map(a => a.id === id ? { ...a, status, review_notes: notes, reviewed_at: new Date().toISOString() } : a);
    saveLocalData(STORAGE_KEYS.APPROVALS, updated);
    await this.logAudit({ action: 'APPROVE', module: 'Approval Management', record_id: id, details: `${status} request ${id}: ${notes}` });
    return updated.find(a => a.id === id);
  },

  async createApproval(data) {
    const newApproval = {
      id: `app-${Date.now().toString().slice(-4)}`,
      ...data,
      status: 'Pending',
      date: new Date().toISOString()
    };
    const current = getLocalData(STORAGE_KEYS.APPROVALS, mock.initialApprovals);
    const updated = [newApproval, ...current];
    saveLocalData(STORAGE_KEYS.APPROVALS, updated);
    await this.logAudit({ action: 'CREATE', module: 'Approval Management', record_id: newApproval.id, details: `Submitted new ${newApproval.category} approval request` });
    return newApproval;
  },

  // --- LOCATIONS MANAGEMENT ---
  async getLocations() {
    return getLocalData(STORAGE_KEYS.LOCATIONS, mock.initialLocations);
  },

  async createLocation(locationData) {
    const newLocation = {
      id: `loc-${Date.now().toString().slice(-4)}`,
      ...locationData,
      active: true
    };
    const current = getLocalData(STORAGE_KEYS.LOCATIONS, mock.initialLocations);
    const updated = [newLocation, ...current];
    saveLocalData(STORAGE_KEYS.LOCATIONS, updated);
    await this.logAudit({ action: 'CREATE', module: 'Location Management', record_id: newLocation.id, details: `Created operational location ${newLocation.name}` });
    return newLocation;
  },

  async deleteLocation(id) {
    const current = getLocalData(STORAGE_KEYS.LOCATIONS, mock.initialLocations);
    const updated = current.filter(l => l.id !== id);
    saveLocalData(STORAGE_KEYS.LOCATIONS, updated);
    await this.logAudit({ action: 'DELETE', module: 'Location Management', record_id: id, details: `Deleted location ${id}` });
    return true;
  },

  // --- SUPPLIERS & VENDORS ---
  async getSuppliers() {
    return getLocalData(STORAGE_KEYS.SUPPLIERS, mock.initialSuppliers);
  },

  async createSupplier(data) {
    const newSupplier = {
      id: `sup-${Date.now().toString().slice(-4)}`,
      ...data,
      status: 'Active',
      rating: 5.0
    };
    const current = getLocalData(STORAGE_KEYS.SUPPLIERS, mock.initialSuppliers);
    const updated = [newSupplier, ...current];
    saveLocalData(STORAGE_KEYS.SUPPLIERS, updated);
    await this.logAudit({ action: 'CREATE', module: 'Supplier Management', record_id: newSupplier.id, details: `Registered supplier ${newSupplier.company_name}` });
    return newSupplier;
  },

  async deleteSupplier(id) {
    const current = getLocalData(STORAGE_KEYS.SUPPLIERS, mock.initialSuppliers);
    const updated = current.filter(s => s.id !== id);
    saveLocalData(STORAGE_KEYS.SUPPLIERS, updated);
    await this.logAudit({ action: 'DELETE', module: 'Supplier Management', record_id: id, details: `Deleted supplier ${id}` });
    return true;
  },

  // --- INVENTORY ---
  async getInventory() {
    return getLocalData(STORAGE_KEYS.INVENTORY, mock.initialInventory);
  },

  async createInventoryItem(data) {
    const newItem = {
      id: `inv-${Date.now().toString().slice(-4)}`,
      ...data,
      status: Number(data.quantity) < Number(data.min_threshold || 10) ? 'Low Stock' : 'In Stock'
    };
    const current = getLocalData(STORAGE_KEYS.INVENTORY, mock.initialInventory);
    const updated = [newItem, ...current];
    saveLocalData(STORAGE_KEYS.INVENTORY, updated);
    await this.logAudit({ action: 'CREATE', module: 'Inventory Management', record_id: newItem.id, details: `Created inventory item ${newItem.item_name}` });
    return newItem;
  },

  async updateInventoryItem(id, data) {
    const current = getLocalData(STORAGE_KEYS.INVENTORY, mock.initialInventory);
    const updated = current.map(item => item.id === id ? { ...item, ...data } : item);
    saveLocalData(STORAGE_KEYS.INVENTORY, updated);
    return updated.find(item => item.id === id);
  },

  async deleteInventoryItem(id) {
    const current = getLocalData(STORAGE_KEYS.INVENTORY, mock.initialInventory);
    const updated = current.filter(item => item.id !== id);
    saveLocalData(STORAGE_KEYS.INVENTORY, updated);
    return true;
  },

  // --- SECURITY SETTINGS ---
  async getSecuritySettings() {
    return getLocalData(STORAGE_KEYS.SECURITY_SETTINGS, mock.initialSecuritySettings);
  },

  async updateSecuritySettings(newSettings) {
    const current = getLocalData(STORAGE_KEYS.SECURITY_SETTINGS, mock.initialSecuritySettings);
    const updated = { ...current, ...newSettings };
    saveLocalData(STORAGE_KEYS.SECURITY_SETTINGS, updated);
    await this.logAudit({ action: 'UPDATE', module: 'Security Management', details: 'Updated system security policies and password rules' });
    return updated;
  },

  // --- SYSTEM SETTINGS ---
  async getSystemSettings() {
    return getLocalData(STORAGE_KEYS.SYSTEM_SETTINGS, mock.initialSystemSettings);
  },

  async updateSystemSettings(newSettings) {
    const current = getLocalData(STORAGE_KEYS.SYSTEM_SETTINGS, mock.initialSystemSettings);
    const updated = { ...current, ...newSettings };
    saveLocalData(STORAGE_KEYS.SYSTEM_SETTINGS, updated);
    await this.logAudit({ action: 'UPDATE', module: 'System Settings', details: 'Updated organization identity and ID number formatting' });
    return updated;
  },

  // --- NOTIFICATIONS & ANNOUNCEMENTS ---
  async getNotifications() {
    return getLocalData(STORAGE_KEYS.NOTIFICATIONS, mock.initialNotifications);
  },

  async createNotification(data) {
    const newNotif = {
      id: `notif-${Date.now().toString().slice(-4)}`,
      ...data,
      active: true,
      created_at: new Date().toISOString().split('T')[0]
    };
    const current = getLocalData(STORAGE_KEYS.NOTIFICATIONS, mock.initialNotifications);
    const updated = [newNotif, ...current];
    saveLocalData(STORAGE_KEYS.NOTIFICATIONS, updated);
    await this.logAudit({ action: 'CREATE', module: 'Notifications', record_id: newNotif.id, details: `Broadcasted announcement: ${newNotif.title}` });
    return newNotif;
  },

  async deleteNotification(id) {
    const current = getLocalData(STORAGE_KEYS.NOTIFICATIONS, mock.initialNotifications);
    const updated = current.filter(n => n.id !== id);
    saveLocalData(STORAGE_KEYS.NOTIFICATIONS, updated);
    return true;
  },

  // --- FAQS & SUPPORT ---
  async getFaqs() {
    return getLocalData(STORAGE_KEYS.FAQS, mock.initialFaqs);
  },

  async createFaq(data) {
    const newFaq = {
      id: `faq-${Date.now().toString().slice(-4)}`,
      ...data
    };
    const current = getLocalData(STORAGE_KEYS.FAQS, mock.initialFaqs);
    const updated = [newFaq, ...current];
    saveLocalData(STORAGE_KEYS.FAQS, updated);
    await this.logAudit({ action: 'CREATE', module: 'Help Management', record_id: newFaq.id, details: `Added FAQ: ${newFaq.question}` });
    return newFaq;
  },

  async deleteFaq(id) {
    const current = getLocalData(STORAGE_KEYS.FAQS, mock.initialFaqs);
    const updated = current.filter(f => f.id !== id);
    saveLocalData(STORAGE_KEYS.FAQS, updated);
    return true;
  },

  // --- ADMIN COMPREHENSIVE STATS ---
  async getAdminStats() {
    const [beneficiaries, users, interventions, inventory, projects, suppliers, approvals] = await Promise.all([
      this.getBeneficiaries(),
      this.getUsers(),
      this.getInterventions(),
      this.getInventory(),
      this.getProjects(),
      this.getSuppliers(),
      this.getApprovals()
    ]);

    const totalInventoryUnits = inventory.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const activeUsersCount = users.filter(u => u.status !== 'Deactivated' && u.status !== 'Suspended').length;
    const pendingApprovalsCount = approvals.filter(a => a.status === 'Pending').length;

    return {
      totalBeneficiaries: beneficiaries.length,
      activeUsers: activeUsersCount,
      totalDistributions: interventions.length,
      totalInventoryItems: inventory.length,
      totalInventoryUnits,
      totalProgrammes: projects.length,
      totalSuppliers: suppliers.length,
      pendingApprovals: pendingApprovalsCount,
      timestamp: new Date().toISOString()
    };
  },

  // --- DATA MANAGEMENT: EXPORT & RESTORE BACKUP ---
  async exportBackup() {
    const backup = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      system: 'ADRA Development & Humanitarian Management System',
      data: {
        projects: await this.getProjects(),
        beneficiaries: await this.getBeneficiaries(),
        activities: await this.getActivities(),
        interventions: await this.getInterventions(),
        indicators: await this.getIndicators(),
        budgets: await this.getBudgets(),
        expenditures: await this.getExpenditures(),
        donors: await this.getDonors(),
        partners: await this.getPartners(),
        users: await this.getUsers(),
        permissions: await this.getPermissions(),
        approvals: await this.getApprovals(),
        locations: await this.getLocations(),
        suppliers: await this.getSuppliers(),
        inventory: await this.getInventory(),
        security_settings: await this.getSecuritySettings(),
        system_settings: await this.getSystemSettings(),
        notifications: await this.getNotifications(),
        faqs: await this.getFaqs(),
        audit_logs: await this.getAuditLogs()
      }
    };
    await this.logAudit({ action: 'EXPORT', module: 'Data Management', details: 'Full system database backup exported as JSON' });
    return backup;
  },

  async restoreBackup(backupData) {
    if (!backupData || !backupData.data) {
      throw new Error('Invalid ADRA backup format');
    }
    const d = backupData.data;
    if (d.projects) saveLocalData(STORAGE_KEYS.PROJECTS, d.projects);
    if (d.beneficiaries) saveLocalData(STORAGE_KEYS.BENEFICIARIES, d.beneficiaries);
    if (d.activities) saveLocalData(STORAGE_KEYS.ACTIVITIES, d.activities);
    if (d.interventions) saveLocalData(STORAGE_KEYS.INTERVENTIONS, d.interventions);
    if (d.indicators) saveLocalData(STORAGE_KEYS.INDICATORS, d.indicators);
    if (d.budgets) saveLocalData(STORAGE_KEYS.BUDGETS, d.budgets);
    if (d.expenditures) saveLocalData(STORAGE_KEYS.EXPENDITURES, d.expenditures);
    if (d.donors) saveLocalData(STORAGE_KEYS.DONORS, d.donors);
    if (d.partners) saveLocalData(STORAGE_KEYS.PARTNERS, d.partners);
    if (d.users) saveLocalData(STORAGE_KEYS.USERS, d.users);
    if (d.permissions) saveLocalData(STORAGE_KEYS.PERMISSIONS, d.permissions);
    if (d.approvals) saveLocalData(STORAGE_KEYS.APPROVALS, d.approvals);
    if (d.locations) saveLocalData(STORAGE_KEYS.LOCATIONS, d.locations);
    if (d.suppliers) saveLocalData(STORAGE_KEYS.SUPPLIERS, d.suppliers);
    if (d.inventory) saveLocalData(STORAGE_KEYS.INVENTORY, d.inventory);
    if (d.security_settings) saveLocalData(STORAGE_KEYS.SECURITY_SETTINGS, d.security_settings);
    if (d.system_settings) saveLocalData(STORAGE_KEYS.SYSTEM_SETTINGS, d.system_settings);
    if (d.notifications) saveLocalData(STORAGE_KEYS.NOTIFICATIONS, d.notifications);
    if (d.faqs) saveLocalData(STORAGE_KEYS.FAQS, d.faqs);

    await this.logAudit({ action: 'RESTORE', module: 'Data Management', details: `Restored database backup generated on ${backupData.exported_at || 'unknown date'}` });
    return true;
  },

  async runDataIntegrityCheck() {
    const [projects, beneficiaries, interventions, activities, expenditures] = await Promise.all([
      this.getProjects(),
      this.getBeneficiaries(),
      this.getInterventions(),
      this.getActivities(),
      this.getExpenditures()
    ]);

    const projectIds = new Set(projects.map(p => p.id));
    const orphanInterventions = interventions.filter(i => i.project_id && !projectIds.has(i.project_id)).length;
    const orphanActivities = activities.filter(a => a.project_id && !projectIds.has(a.project_id)).length;
    const orphanExpenditures = expenditures.filter(e => e.project_id && !projectIds.has(e.project_id)).length;

    return {
      status: 'Passed',
      checkedAt: new Date().toISOString(),
      entitiesScanned: projects.length + beneficiaries.length + interventions.length + activities.length + expenditures.length,
      orphanRecordsFound: orphanInterventions + orphanActivities + orphanExpenditures,
      issues: [
        orphanInterventions > 0 && `${orphanInterventions} interventions linked to nonexistent project IDs`,
        orphanActivities > 0 && `${orphanActivities} activities linked to nonexistent project IDs`,
        orphanExpenditures > 0 && `${orphanExpenditures} expenditure lines linked to nonexistent project IDs`
      ].filter(Boolean)
    };
  },

  // --- GLOBAL ADMIN SEARCH ---
  async globalAdminSearch(query) {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase().trim();

    const [users, beneficiaries, projects, interventions, logs, suppliers] = await Promise.all([
      this.getUsers(),
      this.getBeneficiaries(),
      this.getProjects(),
      this.getInterventions(),
      this.getAuditLogs(),
      this.getSuppliers()
    ]);

    const results = [];

    // Search Users
    users.forEach(u => {
      if (u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q)) {
        results.push({
          type: 'User',
          id: u.id,
          title: u.full_name,
          subtitle: `${u.role} — ${u.email}`,
          meta: u.department,
          badge: u.status || 'Active'
        });
      }
    });

    // Search Beneficiaries
    beneficiaries.forEach(b => {
      if (b.full_name?.toLowerCase().includes(q) || b.beneficiary_code?.toLowerCase().includes(q) || b.location?.toLowerCase().includes(q)) {
        results.push({
          type: 'Beneficiary',
          id: b.id,
          title: b.full_name,
          subtitle: `${b.beneficiary_code} — ${b.location}`,
          meta: b.vulnerability_category,
          badge: 'Registered'
        });
      }
    });

    // Search Programmes
    projects.forEach(p => {
      if (p.project_name?.toLowerCase().includes(q) || p.project_code?.toLowerCase().includes(q) || p.location?.toLowerCase().includes(q)) {
        results.push({
          type: 'Programme',
          id: p.id,
          title: p.project_name,
          subtitle: `${p.project_code} — ${p.location}`,
          meta: p.status,
          badge: p.status
        });
      }
    });

    // Search Aid Distributions
    interventions.forEach(i => {
      if (i.beneficiary_name?.toLowerCase().includes(q) || i.intervention_code?.toLowerCase().includes(q) || i.intervention_type?.toLowerCase().includes(q)) {
        results.push({
          type: 'Distribution',
          id: i.id,
          title: `${i.intervention_type} for ${i.beneficiary_name}`,
          subtitle: `${i.intervention_code} — ${i.date}`,
          meta: i.details,
          badge: 'Delivered'
        });
      }
    });

    // Search Suppliers
    suppliers.forEach(s => {
      if (s.company_name?.toLowerCase().includes(q) || s.contact_person?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q)) {
        results.push({
          type: 'Supplier',
          id: s.id,
          title: s.company_name,
          subtitle: `${s.category} — ${s.contact_person}`,
          meta: s.phone,
          badge: s.status
        });
      }
    });

    return results.slice(0, 30);
  }
};
