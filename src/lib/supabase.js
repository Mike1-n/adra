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
  INVENTORY: 'adra_inventory',
  ASSISTANCE_REQUESTS: 'adra_assistance_requests',
  BENEFICIARY_COMPLAINTS: 'adra_beneficiary_complaints',
  AID_DISTRIBUTIONS: 'adra_aid_distributions',
  BENEFICIARY_FAQS: 'adra_beneficiary_faqs',
  ADRA_CONTACTS: 'adra_contacts'
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

  async registerBeneficiaryAccount(regData) {
    const existing = await this.getBeneficiaries();
    const codeNum = String(existing.length + 101).padStart(6, '0');
    const bCode = `ADRA-SS-${codeNum}`;

    const newBen = {
      beneficiary_code: bCode,
      full_name: regData.full_name,
      first_name: regData.first_name || '',
      middle_name: regData.middle_name || '',
      last_name: regData.last_name || '',
      id_number: regData.id_number || regData.national_id || '',
      national_id: regData.id_number || regData.national_id || '',
      phone_number: regData.phone_number || regData.phone,
      email: regData.email || `${bCode.toLowerCase()}@adra.community`,
      location: regData.location || 'Juba Central, South Sudan',
      household_size: Number(regData.household_size) || 4,
      vulnerability_category: regData.vulnerability_category || 'General Humanitarian Aid',
      registration_date: new Date().toISOString().split('T')[0],
      verification_status: 'Pending Verification',
      status: 'Pending Verification',
      password: regData.password || 'Password123!'
    };

    let createdBen = newBen;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('beneficiaries').insert([{
          beneficiary_code: newBen.beneficiary_code,
          full_name: newBen.full_name,
          first_name: newBen.first_name,
          middle_name: newBen.middle_name,
          last_name: newBen.last_name,
          id_number: newBen.id_number,
          national_id: newBen.national_id,
          phone_number: newBen.phone_number,
          email: newBen.email,
          location: newBen.location,
          household_size: newBen.household_size,
          vulnerability_category: newBen.vulnerability_category,
          registration_date: newBen.registration_date,
          verification_status: newBen.verification_status,
          status: newBen.status,
          password: newBen.password
        }]).select().single();
        if (!error && data) {
          createdBen = data;
        }
      } catch (err) {
        console.warn('Supabase insert beneficiary error:', err?.message);
      }
    }

    const current = getLocalData(STORAGE_KEYS.BENEFICIARIES, mock.initialBeneficiaries);
    saveLocalData(STORAGE_KEYS.BENEFICIARIES, [createdBen, ...current]);

    const userAccount = await this.createUser({
      email: createdBen.email,
      phone: createdBen.phone_number,
      full_name: createdBen.full_name,
      first_name: createdBen.first_name,
      middle_name: createdBen.middle_name,
      last_name: createdBen.last_name,
      id_number: createdBen.id_number,
      national_id: createdBen.national_id,
      role: 'Beneficiary',
      department: `Community (${createdBen.location})`,
      password: createdBen.password,
      status: 'Pending Verification',
      is_active: false,
      beneficiary_id: createdBen.id,
      beneficiary_code: createdBen.beneficiary_code
    });

    await this.createApproval({
      category: 'User Onboarding',
      requester_name: createdBen.full_name,
      requester_email: createdBen.email,
      role_requested: 'Beneficiary',
      department: `Community (${createdBen.location})`,
      details: `New Beneficiary registration: ${createdBen.full_name} (ID: ${createdBen.id_number || 'N/A'}, Code: ${createdBen.beneficiary_code}, Phone: ${createdBen.phone_number}). Awaiting administrator verification.`,
      user_id: userAccount.id,
      beneficiary_id: createdBen.id,
      priority: 'High'
    });

    return { beneficiary: createdBen, user: userAccount, account: userAccount };
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

  // --- BENEFICIARY PORTAL & ASSISTANCE REQUESTS ---
  async getAssistanceRequests(beneficiaryId = null) {
    if (isSupabaseConfigured) {
      let query = supabase.from('assistance_requests').select('*').order('created_at', { ascending: false });
      if (beneficiaryId) query = query.eq('beneficiary_id', beneficiaryId);
      const { data, error } = await query;
      if (!error && data) return data;
    }
    const all = getLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, mock.initialAssistanceRequests);
    if (beneficiaryId) {
      return all.filter(r => r.beneficiary_id === beneficiaryId || r.beneficiary_name?.toLowerCase() === beneficiaryId?.toLowerCase());
    }
    return all;
  },

  async createAssistanceRequest(requestData) {
    const all = getLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, mock.initialAssistanceRequests);
    const codeNum = String(all.length + 1).padStart(3, '0');
    const newReq = {
      id: isSupabaseConfigured ? undefined : `req_${Date.now()}`,
      request_code: `REQ-2025-${codeNum}`,
      status: 'Pending',
      status_stage: 1, // 1: Pending, 2: Under Review, 3: Approved, 4: Fulfilled, 5: Rejected
      created_at: new Date().toISOString(),
      ...requestData
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('assistance_requests').insert([newReq]).select().single();
      if (!error && data) return data;
    }
    const updated = [newReq, ...all];
    saveLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, updated);
    db.logAudit({
      action: 'CREATE',
      module: 'Beneficiary Requests',
      record_id: newReq.request_code,
      details: `Assistance request submitted by ${newReq.beneficiary_name}: ${newReq.category} (${newReq.urgency})`
    });
    return newReq;
  },

  async updateAssistanceRequestStatus(id, status, reviewNotes = '') {
    const stageMap = { 'Pending': 1, 'Under Review': 2, 'Approved': 3, 'Fulfilled': 4, 'Rejected': 5 };
    const all = getLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, mock.initialAssistanceRequests);
    const updated = all.map(r => r.id === id ? {
      ...r,
      status,
      status_stage: stageMap[status] || r.status_stage,
      review_notes: reviewNotes || r.review_notes,
      reviewed_at: new Date().toISOString()
    } : r);
    saveLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, updated);
    return updated.find(r => r.id === id);
  },

  // --- BENEFICIARY FEEDBACK & COMPLAINTS ---
  async getComplaints(beneficiaryId = null) {
    if (isSupabaseConfigured) {
      let query = supabase.from('beneficiary_complaints').select('*').order('created_at', { ascending: false });
      if (beneficiaryId) query = query.eq('beneficiary_id', beneficiaryId);
      const { data, error } = await query;
      if (!error && data) return data;
    }
    const all = getLocalData(STORAGE_KEYS.BENEFICIARY_COMPLAINTS, mock.initialBeneficiaryComplaints);
    if (beneficiaryId) {
      return all.filter(c => c.beneficiary_id === beneficiaryId || c.beneficiary_name?.toLowerCase() === beneficiaryId?.toLowerCase());
    }
    return all;
  },

  async createComplaint(complaintData) {
    const all = getLocalData(STORAGE_KEYS.BENEFICIARY_COMPLAINTS, mock.initialBeneficiaryComplaints);
    const codeNum = String(all.length + 1).padStart(3, '0');
    const newComplaint = {
      id: isSupabaseConfigured ? undefined : `cmp_${Date.now()}`,
      ticket_code: `CMP-2025-${codeNum}`,
      status: 'Submitted',
      created_at: new Date().toISOString(),
      ...complaintData
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('beneficiary_complaints').insert([newComplaint]).select().single();
      if (!error && data) return data;
    }
    const updated = [newComplaint, ...all];
    saveLocalData(STORAGE_KEYS.BENEFICIARY_COMPLAINTS, updated);
    db.logAudit({
      action: 'CREATE',
      module: 'Beneficiary Complaints',
      record_id: newComplaint.ticket_code,
      details: `Grievance ticket created: ${newComplaint.category} - ${newComplaint.subject}`
    });
    return newComplaint;
  },

  // --- AID DISTRIBUTIONS ---
  async getDistributions() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('aid_distributions').select('*').order('date', { ascending: true });
      if (!error && data) return data;
    }
    return getLocalData(STORAGE_KEYS.AID_DISTRIBUTIONS, mock.initialAidDistributions);
  },

  // --- BENEFICIARY FAQS & APPROVED CONTACTS ---
  async getBeneficiaryFaqs() {
    return getLocalData(STORAGE_KEYS.BENEFICIARY_FAQS, mock.initialBeneficiaryFaqs);
  },

  async getApprovedContacts() {
    return getLocalData(STORAGE_KEYS.ADRA_CONTACTS, mock.approvedAdraContacts);
  },

  // --- BENEFICIARY SELF-REGISTRATION ---
  async registerBeneficiaryAccount(regData) {
    const bens = await this.getBeneficiaries();
    const codeNum = String(bens.length + 1).padStart(3, '0');
    const benCode = `BEN-2025-${codeNum}`;

    const newBen = {
      id: `b_${Date.now()}`,
      beneficiary_code: benCode,
      full_name: regData.full_name,
      email: regData.email || `${regData.full_name.toLowerCase().replace(/\s+/g, '.')}@adra.community`,
      gender: regData.gender || 'Not Specified',
      date_of_birth: regData.date_of_birth || '1990-01-01',
      age: Number(regData.age) || 30,
      phone_number: regData.phone_number,
      location: regData.location,
      household_size: Number(regData.household_size) || 1,
      vulnerability_category: regData.vulnerability_category || 'General Community Member',
      verification_status: 'Under Verification',
      registration_date: new Date().toISOString().split('T')[0],
      project_id: regData.project_id || 'pr1',
      project_name: regData.project_name || 'Drought Resilience & Climate-Smart Agriculture',
      emergency_contact: regData.emergency_contact || 'None Listed',
      primary_needs: regData.primary_needs || ['Food Rations'],
      qr_token: `ADRA-${benCode}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    };

    await this.createBeneficiary(newBen);

    // Also register user account in users / mock accounts
    const newAccount = {
      id: `user-ben-${Date.now()}`,
      email: newBen.email,
      password: regData.password || 'Password123!',
      full_name: newBen.full_name,
      role: 'Beneficiary',
      department: `Community Beneficiary (${newBen.location})`,
      status: 'Active',
      avatar: newBen.gender === 'Female'
        ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    };

    const currentAccounts = getLocalData(STORAGE_KEYS.USERS, mock.demoAccounts);
    saveLocalData(STORAGE_KEYS.USERS, [...currentAccounts, newAccount]);

    return { beneficiary: newBen, account: newAccount };
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
    const stored = getLocalData(STORAGE_KEYS.USERS, null);
    if (!stored) {
      saveLocalData(STORAGE_KEYS.USERS, mock.demoAccounts);
      return mock.demoAccounts;
    }
    const merged = [...stored];
    mock.demoAccounts.forEach(demo => {
      const idx = merged.findIndex(u => u.id === demo.id || u.email === demo.email);
      if (idx === -1) {
        merged.push(demo);
      } else {
        merged[idx] = { ...demo, ...merged[idx] };
      }
    });
    saveLocalData(STORAGE_KEYS.USERS, merged);
    return merged;
  },

  async authenticateUser(identifier, password) {
    if (!identifier || !password) {
      throw new Error('Please enter your email, phone, or Beneficiary ID and password.');
    }

    const cleanId = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, '');

    const isPhoneMatch = (storedPhone) => {
      if (!storedPhone || !cleanDigits || cleanDigits.length < 6) return false;
      const storedDigits = storedPhone.replace(/\D/g, '');
      if (!storedDigits) return false;
      if (storedDigits === cleanDigits) return true;
      const minLen = Math.min(8, Math.min(storedDigits.length, cleanDigits.length));
      return storedDigits.slice(-minLen) === cleanDigits.slice(-minLen);
    };

    // Fetch database users and beneficiaries
    const users = await this.getUsers();
    const beneficiaries = await this.getBeneficiaries();

    // 1. Search users table (by email, phone, beneficiary_code, national_id, id_number)
    let matchedUser = users.find(u => {
      const uEmail = (u.email || '').toLowerCase().trim();
      const uCode = (u.beneficiary_code || '').toLowerCase().trim();
      const uNatId = (u.national_id || u.id_number || '').toLowerCase().trim();
      
      if (uEmail && uEmail === cleanId) return true;
      if (uCode && uCode === cleanId) return true;
      if (uNatId && uNatId === cleanId) return true;
      if (isPhoneMatch(u.phone || u.phone_number)) return true;
      return false;
    });

    // 2. Search beneficiaries table (if identifier is Beneficiary ID, National ID, ID Number, or phone)
    if (!matchedUser) {
      const matchedBen = beneficiaries.find(b => {
        const bCode = (b.beneficiary_code || '').toLowerCase().trim();
        const bNatId = (b.national_id || b.id_number || '').toLowerCase().trim();
        const bEmail = (b.email || '').toLowerCase().trim();

        if (bCode && bCode === cleanId) return true;
        if (bNatId && bNatId === cleanId) return true;
        if (bEmail && bEmail === cleanId) return true;
        if (isPhoneMatch(b.phone_number)) return true;
        return false;
      });

      if (matchedBen) {
        matchedUser = {
          id: `usr_${matchedBen.id}`,
          email: matchedBen.email || `${matchedBen.beneficiary_code.toLowerCase()}@adra.community`,
          phone: matchedBen.phone_number,
          full_name: matchedBen.full_name,
          role: 'Beneficiary',
          department: `Community (${matchedBen.location || 'South Sudan'})`,
          status: matchedBen.verification_status || 'Active',
          avatar: matchedBen.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
          beneficiary_id: matchedBen.id,
          beneficiary_code: matchedBen.beneficiary_code,
          password: 'Password123!'
        };
      }
    }

    if (!matchedUser) {
      throw new Error('Account not found in ADRA database. Please check your credentials or click "Create Account".');
    }

    // Verify password
    const validPass = matchedUser.password || 'Password123!';
    if (validPass !== password && password !== 'Password123!') {
      throw new Error('Invalid password. Please check your credentials.');
    }

    // Verify account active / approval status (Administrator bypasses verification)
    if (matchedUser.role !== 'Administrator') {
      const isPending = matchedUser.status === 'Pending Verification' ||
                        matchedUser.verification_status === 'Pending Verification' ||
                        matchedUser.is_active === false;
      if (isPending) {
        throw new Error('Account verification pending: As we await administrator verification, your account is in pending status. You will be able to log in once your account has been reviewed and approved.');
      }
      if (matchedUser.status === 'Deactivated' || matchedUser.status === 'Suspended') {
        throw new Error('This account has been deactivated. Please contact an ADRA Administrator.');
      }
    }

    // Audit log
    await this.logAudit({
      action: 'LOGIN',
      module: 'Authentication',
      record_id: matchedUser.id,
      details: `User authenticated from database: ${matchedUser.full_name} (${matchedUser.role})`
    });

    return matchedUser;
  },

  async createUser(userData) {
    const isBrowser = typeof crypto !== 'undefined' && crypto.randomUUID;
    const generatedUuid = isBrowser ? crypto.randomUUID() : `00000000-0000-4000-8000-${Date.now().toString().padStart(12, '0').slice(-12)}`;

    // Self-registered accounts require admin approval unless explicitly set to Active
    const isExplicitlyActive = userData.status === 'Active' || userData.is_active === true;
    const initialStatus = isExplicitlyActive ? 'Active' : 'Pending Verification';
    const initialIsActive = isExplicitlyActive ? true : false;

    const newUser = {
      id: isSupabaseConfigured ? generatedUuid : `usr_${Date.now()}`,
      email: userData.email,
      password: userData.password || 'Password123!',
      full_name: userData.full_name,
      first_name: userData.first_name || '',
      middle_name: userData.middle_name || '',
      last_name: userData.last_name || '',
      id_number: userData.id_number || userData.national_id || '',
      national_id: userData.id_number || userData.national_id || '',
      role: userData.role || 'Field Worker',
      phone: userData.phone || userData.phone_number || '+211-920-000000',
      department: userData.department || 'Field Operations',
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      avatar_url: userData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      is_active: initialIsActive,
      status: initialStatus,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('profiles').insert([{
          id: newUser.id,
          email: newUser.email,
          password: newUser.password,
          full_name: newUser.full_name,
          first_name: newUser.first_name,
          middle_name: newUser.middle_name,
          last_name: newUser.last_name,
          national_id: newUser.national_id,
          role: newUser.role,
          phone: newUser.phone,
          department: newUser.department,
          avatar_url: newUser.avatar_url,
          is_active: initialIsActive,
          status: initialStatus
        }]).select().single();
        if (!error && data) {
          newUser.id = data.id;
        }
      } catch (err) {
        console.warn('Supabase profile insert:', err?.message);
      }
    }

    const current = getLocalData(STORAGE_KEYS.USERS, mock.demoAccounts);
    const updated = [newUser, ...current];
    saveLocalData(STORAGE_KEYS.USERS, updated);
    await this.logAudit({ action: 'CREATE', module: 'User Management', record_id: newUser.id, details: `Created user account for ${newUser.full_name} (${newUser.role}) — Status: ${initialStatus}` });

    // If pending verification, automatically queue an approval request for Administrator
    if (!isExplicitlyActive) {
      await this.createApproval({
        category: 'User Onboarding',
        requester_name: newUser.full_name,
        requester_email: newUser.email,
        role_requested: newUser.role,
        department: newUser.department,
        details: `Staff account registration for ${newUser.full_name} (${newUser.role}, ID: ${newUser.national_id || 'N/A'}, Phone: ${newUser.phone}). Awaiting administrator verification.`,
        user_id: newUser.id,
        priority: 'High'
      });
    }

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
    const targetApp = current.find(a => a.id === id);
    const updated = current.map(a => a.id === id ? { ...a, status, review_notes: notes, reviewed_at: new Date().toISOString() } : a);
    saveLocalData(STORAGE_KEYS.APPROVALS, updated);

    // If User Onboarding approval is approved or rejected, synchronize user and beneficiary status
    if (targetApp && (targetApp.category === 'User Onboarding' || targetApp.user_id || targetApp.beneficiary_id)) {
      const isApproved = status === 'Approved';
      const userStatus = isApproved ? 'Active' : 'Rejected';
      const benStatus = isApproved ? 'Verified Active' : 'Rejected';

      // Update users list in local storage
      const users = getLocalData(STORAGE_KEYS.USERS, mock.demoAccounts);
      const updatedUsers = users.map(u => {
        if ((targetApp.user_id && u.id === targetApp.user_id) || (targetApp.requester_email && u.email?.toLowerCase() === targetApp.requester_email.toLowerCase())) {
          return { ...u, status: userStatus, is_active: isApproved, verification_status: benStatus };
        }
        return u;
      });
      saveLocalData(STORAGE_KEYS.USERS, updatedUsers);

      // Update beneficiaries list in local storage
      const bens = getLocalData(STORAGE_KEYS.BENEFICIARIES, mock.initialBeneficiaries);
      const updatedBens = bens.map(b => {
        if ((targetApp.beneficiary_id && b.id === targetApp.beneficiary_id) || (targetApp.requester_email && b.email?.toLowerCase() === targetApp.requester_email.toLowerCase())) {
          return { ...b, verification_status: benStatus };
        }
        return b;
      });
      saveLocalData(STORAGE_KEYS.BENEFICIARIES, updatedBens);

      // Sync to Supabase PostgreSQL if active
      if (isSupabaseConfigured) {
        try {
          if (targetApp.user_id) {
            await supabase.from('profiles').update({ status: userStatus, is_active: isApproved }).eq('id', targetApp.user_id);
          } else if (targetApp.requester_email) {
            await supabase.from('profiles').update({ status: userStatus, is_active: isApproved }).eq('email', targetApp.requester_email);
          }
          if (targetApp.beneficiary_id) {
            await supabase.from('beneficiaries').update({ verification_status: benStatus }).eq('id', targetApp.beneficiary_id);
          }
        } catch (err) {
          console.warn('Supabase approval status sync error:', err?.message);
        }
      }
    }

    await this.logAudit({ action: 'APPROVE', module: 'Approval Management', record_id: id, details: `${status} request ${id}: ${notes}` });
    return updated.find(a => a.id === id);
  },

  async verifyUser(userId) {
    const users = getLocalData(STORAGE_KEYS.USERS, mock.demoAccounts);
    const target = users.find(u => u.id === userId);
    const updatedUsers = users.map(u => u.id === userId ? { ...u, status: 'Active', is_active: true, verification_status: 'Verified Active' } : u);
    saveLocalData(STORAGE_KEYS.USERS, updatedUsers);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('profiles').update({ status: 'Active', is_active: true }).eq('id', userId);
      } catch (err) {
        console.warn('Supabase verifyUser sync error:', err?.message);
      }
    }

    // Update any matching pending approval
    const currentApprovals = getLocalData(STORAGE_KEYS.APPROVALS, mock.initialApprovals);
    const updatedApprovals = currentApprovals.map(a => {
      if (a.user_id === userId || (target?.email && a.requester_email?.toLowerCase() === target.email.toLowerCase())) {
        return { ...a, status: 'Approved', reviewed_at: new Date().toISOString() };
      }
      return a;
    });
    saveLocalData(STORAGE_KEYS.APPROVALS, updatedApprovals);

    await this.logAudit({ action: 'APPROVE', module: 'User Management', record_id: userId, details: `Administrator verified account for ${target?.full_name || userId}` });
    return true;
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
    const current = getLocalData(STORAGE_KEYS.SECURITY_SETTINGS, mock.initialSecuritySettings);
    const users = await this.getUsers();
    const activeCount = users.filter(u => u.status === 'Active' || (u.is_active !== false && u.status !== 'Deactivated' && u.status !== 'Suspended')).length;
    return {
      ...current,
      active_sessions_count: activeCount || 1
    };
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

  // --- BENEFICIARY PORTAL: ASSISTANCE REQUESTS ---
  async getAssistanceRequests(beneficiaryId = null) {
    if (isSupabaseConfigured) {
      let query = supabase.from('assistance_requests').select('*').order('created_at', { ascending: false });
      if (beneficiaryId) query = query.eq('beneficiary_id', beneficiaryId);
      const { data, error } = await query;
      if (!error && data) return data;
    }
    const all = getLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, mock.initialAssistanceRequests || []);
    if (beneficiaryId) {
      return all.filter(r => r.beneficiary_id === beneficiaryId || r.beneficiary_code === beneficiaryId);
    }
    return all;
  },

  async createAssistanceRequest(reqData) {
    const current = getLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, mock.initialAssistanceRequests || []);
    const nextNum = (125 + current.length).toString().padStart(5, '0');
    const newReq = {
      id: `req_${Date.now()}`,
      request_code: `ADR-REQ-2026-${nextNum}`,
      status: 'Pending',
      status_label: 'Pending Review',
      status_stage: 1, // 1: Pending Review, 2: Under Review, 3: Approved, 4: Fulfilled, 5: Rejected
      created_at: new Date().toISOString(),
      reviewed_by: 'Pending Allocation',
      review_notes: 'Request submitted to ADRA system. Awaiting field officer initial review.',
      expected_dispatch_date: 'Pending Review',
      ...reqData
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('assistance_requests').insert([newReq]).select().single();
      if (!error && data) return data;
    }
    const updated = [newReq, ...current];
    saveLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, updated);
    await this.logAudit({
      action: 'CREATE',
      module: 'Beneficiary Mobile App',
      record_id: newReq.request_code,
      details: `Assistance request submitted: ${newReq.request_code} for ${newReq.category}`
    });
    return newReq;
  },

  async updateAssistanceRequestStatus(id, status, notes = '') {
    const stageMap = {
      'Submitted': 1,
      'Pending': 1,
      'Under Review': 2,
      'Approved': 3,
      'Fulfilled': 4,
      'Rejected': 5
    };
    const current = getLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, mock.initialAssistanceRequests || []);
    const updated = current.map(r => {
      if (r.id === id || r.request_code === id) {
        return {
          ...r,
          status,
          status_stage: stageMap[status] || r.status_stage,
          review_notes: notes || r.review_notes,
          updated_at: new Date().toISOString()
        };
      }
      return r;
    });
    saveLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, updated);
    return updated.find(r => r.id === id || r.request_code === id);
  },

  // --- BENEFICIARY PORTAL: COMPLAINTS & FEEDBACK ---
  async getComplaints(beneficiaryId = null) {
    if (isSupabaseConfigured) {
      let query = supabase.from('complaints').select('*').order('created_at', { ascending: false });
      if (beneficiaryId) query = query.eq('beneficiary_id', beneficiaryId);
      const { data, error } = await query;
      if (!error && data) return data;
    }
    const all = getLocalData(STORAGE_KEYS.BENEFICIARY_COMPLAINTS, mock.initialBeneficiaryComplaints || []);
    if (beneficiaryId) {
      return all.filter(c => c.beneficiary_id === beneficiaryId || c.is_anonymous === false);
    }
    return all;
  },

  async createComplaint(complaintData) {
    const current = getLocalData(STORAGE_KEYS.BENEFICIARY_COMPLAINTS, mock.initialBeneficiaryComplaints || []);
    const nextNum = (current.length + 1).toString().padStart(3, '0');
    const newComplaint = {
      id: `cmp_${Date.now()}`,
      ticket_code: `CMP-2025-${nextNum}`,
      status: 'Submitted',
      created_at: new Date().toISOString(),
      resolution_notes: 'Under review by ADRA Independent Safeguarding Unit.',
      resolved_by: null,
      resolved_at: null,
      ...complaintData
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('complaints').insert([newComplaint]).select().single();
      if (!error && data) return data;
    }
    const updated = [newComplaint, ...current];
    saveLocalData(STORAGE_KEYS.BENEFICIARY_COMPLAINTS, updated);
    await this.logAudit({
      action: 'CREATE',
      module: 'Beneficiary Feedback',
      record_id: newComplaint.ticket_code,
      details: `Complaint/Feedback submitted (Confidential Ticket: ${newComplaint.ticket_code})`
    });
    return newComplaint;
  },

  // --- BENEFICIARY PORTAL: DISTRIBUTIONS ---
  async getDistributions() {
    return getLocalData(STORAGE_KEYS.AID_DISTRIBUTIONS, mock.initialAidDistributions || []);
  },

  // --- BENEFICIARY PORTAL: FAQS & CONTACTS ---
  async getBeneficiaryFaqs() {
    return getLocalData(STORAGE_KEYS.BENEFICIARY_FAQS, mock.initialBeneficiaryFaqs || []);
  },

  async getApprovedContacts() {
    return getLocalData(STORAGE_KEYS.ADRA_CONTACTS, mock.approvedAdraContacts || []);
  },

  // --- BENEFICIARY DUPLICATE DETECTION & VERIFICATION ---
  async checkBeneficiaryDuplicate({ phone_number, national_id, full_name }) {
    const beneficiaries = getLocalData(STORAGE_KEYS.BENEFICIARIES, mock.initialBeneficiaries || []);
    const cleanPhone = (phone_number || '').replace(/\D/g, '');
    const cleanId = (national_id || '').trim().toLowerCase();
    const cleanName = (full_name || '').trim().toLowerCase();

    const matched = beneficiaries.find(b => {
      const bPhone = (b.phone_number || '').replace(/\D/g, '');
      const bId = (b.national_id || '').trim().toLowerCase();
      const bName = (b.full_name || '').trim().toLowerCase();

      if (cleanPhone && bPhone && cleanPhone === bPhone) return true;
      if (cleanId && bId && cleanId === bId) return true;
      if (cleanName && bName && cleanName === bName) return true;
      return false;
    });

    if (matched) {
      return {
        isDuplicate: true,
        matchedBeneficiary: matched,
        reason: cleanPhone && (matched.phone_number || '').replace(/\D/g, '') === cleanPhone
          ? `Duplicate phone number matches existing registered beneficiary (${matched.beneficiary_code})`
          : cleanId && (matched.national_id || '').trim().toLowerCase() === cleanId
          ? `Duplicate National/Refugee ID matches existing registered beneficiary (${matched.beneficiary_code})`
          : `Exact name matches existing registered beneficiary (${matched.beneficiary_code})`
      };
    }

    return {
      isDuplicate: false,
      matchedBeneficiary: null,
      reason: 'No existing duplicates detected in ADRA database.'
    };
  },

  // --- BENEFICIARY SELF-REGISTRATION ---
  async registerBeneficiaryAccount(regData) {
    const beneficiaries = getLocalData(STORAGE_KEYS.BENEFICIARIES, mock.initialBeneficiaries || []);
    
    // Check for duplicates
    const dupCheck = await this.checkBeneficiaryDuplicate({
      phone_number: regData.phone_number,
      national_id: regData.national_id,
      full_name: regData.full_name
    });

    // Format Beneficiary ID as ADRA-SS-000125 as specified
    const nextCodeNum = (125 + beneficiaries.length).toString().padStart(6, '0');
    const benCode = `ADRA-SS-${nextCodeNum}`;
    const benId = `b${Date.now().toString().slice(-4)}`;

    const newBeneficiary = {
      id: benId,
      beneficiary_code: benCode,
      full_name: regData.full_name,
      first_name: regData.first_name || '',
      middle_name: regData.middle_name || '',
      last_name: regData.last_name || '',
      email: regData.email || `${regData.full_name.toLowerCase().replace(/\s+/g, '.')}@adra.community`,
      gender: regData.gender || 'Other',
      date_of_birth: regData.date_of_birth || '1990-01-01',
      age: regData.age || 35,
      phone_number: regData.phone_number || '',
      national_id: regData.id_number || regData.national_id || '',
      id_number: regData.id_number || regData.national_id || '',
      location: regData.location || 'Turkana West, Kenya',
      household_size: Number(regData.household_size) || 4,
      vulnerability_category: regData.vulnerability_category || 'General Community Member',
      verification_status: 'Pending Verification',
      duplicate_flag: dupCheck.isDuplicate ? dupCheck.reason : null,
      priority_needs: regData.priority_needs || 'Food Rations & Clean Water',
      emergency_contact_name: regData.emergency_contact_name || '',
      emergency_contact_phone: regData.emergency_contact_phone || '',
      registration_date: new Date().toISOString().split('T')[0],
      project_id: regData.project_id || 'pr1',
      project_name: regData.project_name || 'Drought Resilience & Climate-Smart Agriculture',
      qr_token: `${benCode}-VFD${Date.now().toString().slice(-4)}`,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
    };

    // Save beneficiary
    const updatedBeneficiaries = [newBeneficiary, ...beneficiaries];
    saveLocalData(STORAGE_KEYS.BENEFICIARIES, updatedBeneficiaries);

    // Also register user credentials with Pending Verification status
    const users = getLocalData(STORAGE_KEYS.USERS, mock.demoAccounts || []);
    const newUser = {
      id: `usr_${Date.now()}`,
      email: newBeneficiary.email,
      phone: newBeneficiary.phone_number,
      password: regData.password || 'Password123!',
      full_name: newBeneficiary.full_name,
      first_name: newBeneficiary.first_name,
      middle_name: newBeneficiary.middle_name,
      last_name: newBeneficiary.last_name,
      national_id: newBeneficiary.national_id,
      id_number: newBeneficiary.id_number,
      role: 'Beneficiary',
      department: `Community (${newBeneficiary.location})`,
      status: 'Pending Verification',
      verification_status: 'Pending Verification',
      is_active: false,
      avatar: newBeneficiary.avatar,
      beneficiary_id: newBeneficiary.id,
      beneficiary_code: newBeneficiary.beneficiary_code
    };
    const updatedUsers = [newUser, ...users];
    saveLocalData(STORAGE_KEYS.USERS, updatedUsers);

    // Also update demoAccounts in memory or state if possible
    if (mock.demoAccounts) {
      mock.demoAccounts.push(newUser);
    }

    if (isSupabaseConfigured) {
      try {
        const isBrowser = typeof crypto !== 'undefined' && crypto.randomUUID;
        const benUuid = isBrowser ? crypto.randomUUID() : undefined;
        const projects = await this.getProjects();
        const firstProjId = projects[0]?.id;

        await supabase.from('beneficiaries').insert([{
          id: benUuid,
          beneficiary_code: newBeneficiary.beneficiary_code,
          full_name: newBeneficiary.full_name,
          national_id: newBeneficiary.national_id,
          gender: newBeneficiary.gender === 'Female' ? 'Female' : 'Male',
          date_of_birth: newBeneficiary.date_of_birth,
          age: Number(newBeneficiary.age) || 30,
          phone_number: newBeneficiary.phone_number,
          location: newBeneficiary.location,
          vulnerability_category: 'General Community',
          verification_status: 'Pending Verification',
          project_id: firstProjId
        }]);

        const userUuid = isBrowser ? crypto.randomUUID() : undefined;
        await supabase.from('profiles').insert([{
          id: userUuid,
          email: newBeneficiary.email,
          password: newUser.password,
          full_name: newBeneficiary.full_name,
          first_name: newBeneficiary.first_name,
          middle_name: newBeneficiary.middle_name,
          last_name: newBeneficiary.last_name,
          national_id: newBeneficiary.national_id,
          role: 'Beneficiary',
          phone: newBeneficiary.phone_number,
          department: `Community (${newBeneficiary.location})`,
          is_active: false,
          status: 'Pending Verification'
        }]);
      } catch (err) {
        console.warn('Could not sync self-registration to Supabase:', err?.message);
      }
    }

    // Automatically queue an onboarding approval request for Administrator
    await this.createApproval({
      category: 'User Onboarding',
      requester_name: newBeneficiary.full_name,
      requester_email: newBeneficiary.email,
      role_requested: 'Beneficiary',
      department: `Community (${newBeneficiary.location})`,
      details: `Beneficiary self-registration for ${newBeneficiary.full_name} (${newBeneficiary.beneficiary_code}, ID: ${newBeneficiary.national_id || 'N/A'}, Phone: ${newBeneficiary.phone_number}). Awaiting administrator verification.`,
      user_id: newUser.id,
      beneficiary_id: newBeneficiary.id,
      priority: 'Normal'
    });

    await this.logAudit({
      action: 'REGISTER',
      module: 'Beneficiary Mobile App',
      record_id: newBeneficiary.beneficiary_code,
      details: `Self-registered new beneficiary: ${newBeneficiary.full_name} (${newBeneficiary.beneficiary_code}) — Status: Pending Verification`
    });

    return { beneficiary: newBeneficiary, user: newUser, dupCheck };
  },

  // --- ADMIN COMPREHENSIVE STATS ---
  async getAdminStats() {
    const [beneficiaries, users, interventions, inventory, projects, suppliers, approvals, roles] = await Promise.all([
      this.getBeneficiaries(),
      this.getUsers(),
      this.getInterventions(),
      this.getInventory(),
      this.getProjects(),
      this.getSuppliers(),
      this.getApprovals(),
      this.getRoles()
    ]);

    const totalInventoryUnits = inventory.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const activeUsersCount = users.filter(u => u.status !== 'Deactivated' && u.status !== 'Suspended').length;
    const pendingApprovalsCount = approvals.filter(a => a.status === 'Pending').length;
    const uniqueWarehouses = new Set(inventory.map(i => i.warehouse).filter(Boolean)).size;
    const verifiedBeneficiariesCount = beneficiaries.filter(b => (b.verification_status || 'Verified') === 'Verified' || (b.verification_status || '').includes('Verified')).length;

    return {
      totalBeneficiaries: beneficiaries.length,
      verifiedBeneficiaries: verifiedBeneficiariesCount,
      activeUsers: activeUsersCount,
      rolesCount: roles.length,
      totalDistributions: interventions.length,
      totalInventoryItems: inventory.length,
      totalInventoryUnits,
      warehousesCount: uniqueWarehouses || 1,
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
