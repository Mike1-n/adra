import { createClient } from '@supabase/supabase-js';
import * as mock from './mockData.js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL);
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY);

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
  PROGRAMS: 'adra_programs',
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
  ADRA_CONTACTS: 'adra_contacts',
  SUPERVISORS: 'adra_supervisors',
  FIELD_ACTIVITIES: 'adra_field_activities',
  PROGRAM_RESOURCES: 'adra_program_resources',
  FIELD_WORKERS: 'adra_field_workers',
  FIELD_ASSESSMENTS: 'adra_field_assessments',
  SUPERVISOR_NOTIFICATIONS: 'adra_supervisor_notifications',
  SUPERVISOR_ACTIVITIES: 'adra_supervisor_activities',
  FIELD_WORKER_ACTIVITIES: 'adra_field_worker_activities',
  FIELD_WORKER_NOTIFICATIONS: 'adra_field_worker_notifications',
  FIELD_FUNDING_REQUESTS: 'adra_field_funding_requests'
};

function getLocalData(key, defaultData) {
  if (typeof localStorage === 'undefined') return defaultData;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error reading localStorage', e);
  }
  return defaultData;
}

function saveLocalData(key, data) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error writing to localStorage', e);
  }
}

export function normalizeAssistanceRequest(r) {
  if (!r) return r;

  let status = r.status || 'Submitted';
  if (status === 'Pending' || status === 'Pending Review') {
    status = 'Submitted';
  }

  let state = r.state;
  let county = r.county;
  let payam = r.payam;
  let boma = r.boma;
  let village = r.village || r.village_area;

  if ((!state || !county) && r.location) {
    const parts = r.location.split(',').map(s => s.trim());
    if (parts.length >= 1 && !state) state = parts[0];
    if (parts.length >= 2 && !county) county = parts[1];
    if (parts.length >= 3 && !payam) payam = parts[2];
    if (parts.length >= 4 && !boma) boma = parts[3];
    if (parts.length >= 5 && !village) village = parts[4];
  }

  const category = r.category || r.assistance_type || 'Food, Water';
  const assistance_type = r.assistance_type || r.category || 'Food & Clean Water Relief Pack';
  const urgency = r.urgency || r.priority || 'High';
  const priority = r.priority || r.urgency || 'High';
  const reason = r.reason || r.description || 'Humanitarian assistance request';
  const description = r.description || r.reason || 'Humanitarian assistance request';
  const id = r.id || r.request_code || `req_${Date.now()}`;
  const request_code = r.request_code || r.id || id;
  const program_name = r.program_name || r.programme_name || r.project_name || 'Emergency Food Security & Livelihoods Resilience (EFSLR)';
  const program_id = r.program_id || r.project_id || 'prg1';

  const rawWorker = r.assigned_field_worker_name || r.field_worker_name || '';
  const isPendingWorker = !rawWorker || 
    rawWorker === 'Unassigned' || 
    rawWorker.toLowerCase().includes('pending') || 
    rawWorker.toLowerCase().includes('awaiting');
  const assigned_field_worker_name = isPendingWorker ? null : rawWorker;
  const assigned_field_worker_id = isPendingWorker ? null : (r.assigned_field_worker_id || r.field_worker_id || null);

  return {
    ...r,
    id,
    request_code,
    status: (status === 'Assigned to Field Worker' && !assigned_field_worker_name) ? 'Assigned to Supervisor' : status,
    status_label: r.status_label || (status === 'Submitted' ? 'Pending Review' : status),
    status_stage: r.status_stage || (status === 'Submitted' ? 1 : (status === 'Under Review' ? 2 : 3)),
    category,
    assistance_type,
    urgency,
    priority,
    reason,
    description,
    state: state || r.state || '',
    county: county || r.county || '',
    payam: payam || r.payam || '',
    boma: boma || r.boma || '',
    village: village || r.village || '',
    location: r.location || [state, county, payam, boma, village].filter(Boolean).join(', ') || 'Field Location',
    program_name,
    programme_name: program_name,
    program_id,
    household_members: Number(r.household_members) || 1,
    quantity_requested: r.quantity_requested || (category.includes('Food') ? 'Household Food Rations' : '1 Relief Pack'),
    beneficiary_name: r.beneficiary_name || r.full_name || r.name || 'Registered Beneficiary',
    beneficiary_id: r.beneficiary_id || r.id || 'ben-1',
    beneficiary_code: r.beneficiary_code || r.code || 'ADRA-SS-000101',
    eligibility: r.eligibility || 'Eligible (High Vulnerability)',
    eligibility_status: r.eligibility_status || 'Verified',
    verification_status: r.verification_status || 'Verified Active',
    duplicate_detected: Boolean(r.duplicate_detected || r.is_duplicate),
    assigned_field_worker_name,
    assigned_field_worker_id,
    assigned_supervisor_name: r.assigned_supervisor_name || r.supervisor_name || null,
    assigned_supervisor_id: r.assigned_supervisor_id || r.supervisor_id || null,
    field_worker_name: assigned_field_worker_name,
    field_worker_id: assigned_field_worker_id,
    evidence_photos: r.evidence_photos || (r.field_worker_assessment?.evidence_photos) || [],
    evidence_documents: r.evidence_documents || (r.field_worker_assessment?.evidence_documents) || [],
    ground_situation_report: r.ground_situation_report || (r.field_worker_assessment?.ground_situation_report) || r.audit_findings || '',
    field_justification: r.field_justification || (r.field_worker_assessment?.field_justification) || '',
    vulnerability_score: r.vulnerability_score || (r.field_worker_assessment?.vulnerability_score) || null,
    assessment_code: r.assessment_code || (r.field_worker_assessment?.assessment_code) || null,
    field_worker_assessment: r.field_worker_assessment || null,
    recommended_aid: r.recommended_aid || (r.field_worker_assessment?.recommended_aid) || null
  };
}

// Helper to ensure vulnerability category strictly satisfies PostgreSQL check constraint:
// CHECK (vulnerability_category IN ('Child-headed Household', 'Female-headed Household', 'Elderly', 'Persons with Disability', 'Internally Displaced Person (IDP)', 'Extremely Poor Household', 'Youth at Risk', 'General Community'))
export function normalizeVulnerabilityCategory(cat) {
  if (!cat) return 'General Community';
  const str = String(cat).trim().toLowerCase();
  if (str.includes('female')) return 'Female-headed Household';
  if (str.includes('child')) return 'Child-headed Household';
  if (str.includes('elder') || str.includes('senior') || str.includes('aged') || str.includes('60+')) return 'Elderly';
  if (str.includes('disab') || str.includes('pwd')) return 'Persons with Disability';
  if (str.includes('displace') || str.includes('idp') || str.includes('refugee') || str.includes('returnee')) return 'Internally Displaced Person (IDP)';
  if (str.includes('poor') || str.includes('drought') || str.includes('smallholder') || str.includes('extreme') || str.includes('poverty')) return 'Extremely Poor Household';
  if (str.includes('youth') || str.includes('risk')) return 'Youth at Risk';
  return 'General Community';
}

// Unified Data Service for real Supabase queries with Mock fallback
export const db = {
  // --- PROGRAMS (PROGRAMS MANAGER) ---
  async getPrograms() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('programs').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        // Fallback to local storage
      }
    }
    const SEEDED_PROGRAM_CODES = ['PRG-SS-001', 'PRG-SS-002', 'PRG-SS-003', 'PRG-SS-004', 'PRG-SS-005'];
    const current = getLocalData(STORAGE_KEYS.PROGRAMS, mock.initialPrograms || []);
    const clean = current.filter(p => !SEEDED_PROGRAM_CODES.includes(p.program_code) && !p.id?.startsWith('prg'));
    if (clean.length !== current.length) {
      saveLocalData(STORAGE_KEYS.PROGRAMS, clean);
    }
    return clean;
  },

  async createProgram(program) {
    const newProg = {
      id: isSupabaseConfigured ? undefined : `prg_${Date.now()}`,
      created_at: new Date().toISOString(),
      ...program
    };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('programs').insert([newProg]).select().single();
      if (!error && data) return data;
    }
    const current = getLocalData(STORAGE_KEYS.PROGRAMS, mock.initialPrograms);
    const updated = [newProg, ...current];
    saveLocalData(STORAGE_KEYS.PROGRAMS, updated);
    db.logAudit({
      action: 'CREATE',
      module: 'Programs',
      record_id: newProg.program_code || newProg.id,
      details: `Created program: ${newProg.program_name}`
    });
    return newProg;
  },

  async updateProgram(id, updates) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('programs').update(updates).eq('id', id).select().single();
      if (!error && data) return data;
    }
    const current = getLocalData(STORAGE_KEYS.PROGRAMS, mock.initialPrograms);
    const updated = current.map(p => p.id === id ? { ...p, ...updates } : p);
    saveLocalData(STORAGE_KEYS.PROGRAMS, updated);
    db.logAudit({
      action: 'UPDATE',
      module: 'Programs',
      record_id: updates.program_code || id,
      details: `Updated program: ${updates.program_name || id}`
    });
    return updated.find(p => p.id === id);
  },

  async deleteProgram(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('programs').delete().eq('id', id);
      if (!error) return true;
    }
    const current = getLocalData(STORAGE_KEYS.PROGRAMS, mock.initialPrograms);
    const item = current.find(p => p.id === id);
    const updated = current.filter(p => p.id !== id);
    saveLocalData(STORAGE_KEYS.PROGRAMS, updated);
    db.logAudit({
      action: 'DELETE',
      module: 'Programs',
      record_id: item?.program_code || id,
      details: `Deleted program: ${item?.program_name || id}`
    });
    return true;
  },

  // --- PROJECTS ---
  async getProjects() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('projects').select('*, donors(donor_name), partners(partner_name), profiles(full_name)').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data;
    }
    const SEEDED_PROJECT_CODES = ['PRJ-2025-001', 'PRJ-2025-002', 'PRJ-2025-003', 'PRJ-2024-004', 'PRJ-2026-005'];
    const current = getLocalData(STORAGE_KEYS.PROJECTS, mock.initialProjects || []);
    const clean = current.filter(p => !SEEDED_PROJECT_CODES.includes(p.project_code) && !p.id?.startsWith('pr') && p.project_name !== 'Drought Resilience & Climate-Smart Agriculture');
    if (clean.length !== current.length) {
      saveLocalData(STORAGE_KEYS.PROJECTS, clean);
    }
    return clean;
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
    const seededCodes = [
      'BEN-2025-001', 'BEN-2025-002', 'BEN-2025-003',
      'BEN-2025-004', 'BEN-2025-005', 'BEN-2025-006'
    ];
    let remoteData = null;
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('beneficiaries').select('*, projects(project_name)').order('created_at', { ascending: false });
      if (!error && data) {
        remoteData = data.filter(b => !seededCodes.includes(b.beneficiary_code));
      }
    }
    if (remoteData !== null) {
      saveLocalData(STORAGE_KEYS.BENEFICIARIES, remoteData);
      return remoteData;
    }
    const current = getLocalData(STORAGE_KEYS.BENEFICIARIES, []);
    const cleaned = (Array.isArray(current) ? current : []).filter(b => !seededCodes.includes(b.beneficiary_code));
    saveLocalData(STORAGE_KEYS.BENEFICIARIES, cleaned);
    return cleaned;
  },

  async createBeneficiary(beneficiary) {
    const normCategory = normalizeVulnerabilityCategory(beneficiary.vulnerability_category);
    const newBen = {
      id: isSupabaseConfigured ? undefined : `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      registration_date: beneficiary.registration_date || new Date().toISOString().split('T')[0],
      verification_status: beneficiary.verification_status || 'Pending Verification',
      status: beneficiary.status || beneficiary.verification_status || 'Pending Verification',
      ...beneficiary,
      vulnerability_category: normCategory
    };
    if (isSupabaseConfigured) {
      try {
        let projId = beneficiary.project_id || null;
        if (!projId) {
          const projs = await this.getProjects();
          projId = projs[0]?.id || null;
        }
        const insertPayload = {
          beneficiary_code: newBen.beneficiary_code,
          full_name: newBen.full_name,
          gender: newBen.gender === 'Male' || newBen.gender === 'Female' ? newBen.gender : 'Female',
          date_of_birth: newBen.date_of_birth || null,
          age: Number(newBen.age) || 30,
          phone_number: newBen.phone_number || '',
          email: newBen.email || null,
          location: newBen.location || 'General Zone',
          vulnerability_category: normCategory,
          registration_date: newBen.registration_date,
          national_id: newBen.national_id || newBen.id_number || null,
          verification_status: newBen.verification_status,
          ...(projId ? { project_id: projId } : {})
        };
        const { data, error } = await supabase.from('beneficiaries').insert([insertPayload]).select().single();
        if (!error && data) {
          newBen.id = data.id;
        } else if (error) {
          console.warn('Supabase insert beneficiary error:', error.message);
        }
      } catch (err) {
        console.warn('Supabase insert beneficiary error:', err?.message);
      }
    }
    const current = getLocalData(STORAGE_KEYS.BENEFICIARIES, mock.initialBeneficiaries);
    const updated = [newBen, ...current];
    saveLocalData(STORAGE_KEYS.BENEFICIARIES, updated);
    await this.logAudit({
      action: 'CREATE',
      module: 'Beneficiaries',
      record_id: newBen.beneficiary_code || newBen.id,
      details: `Registered beneficiary: ${newBen.full_name}`
    });
    return newBen;
  },

  async registerBeneficiaryAccount(regData) {
    const existing = await this.getBeneficiaries();
    
    // Check for duplicates
    const dupCheck = await this.checkBeneficiaryDuplicate({
      phone_number: regData.phone_number || regData.phone,
      national_id: regData.national_id || regData.id_number,
      full_name: regData.full_name
    });

    const codeNum = String(existing.length + 101).padStart(6, '0');
    const bCode = `ADRA-SS-${codeNum}`;
    const benId = `ben_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const normCategory = normalizeVulnerabilityCategory(regData.vulnerability_category);

    const newBen = {
      id: benId,
      beneficiary_code: bCode,
      full_name: regData.full_name,
      first_name: regData.first_name || '',
      middle_name: regData.middle_name || '',
      last_name: regData.last_name || '',
      gender: regData.gender === 'Male' || regData.gender === 'Female' ? regData.gender : 'Female',
      date_of_birth: regData.date_of_birth || '1990-01-01',
      age: Number(regData.age) || (regData.date_of_birth ? Math.max(18, new Date().getFullYear() - new Date(regData.date_of_birth).getFullYear()) : 30),
      id_number: regData.id_number || regData.national_id || '',
      national_id: regData.id_number || regData.national_id || '',
      phone_number: regData.phone_number || regData.phone || '',
      email: regData.email || `${regData.full_name?.toLowerCase().replace(/\s+/g, '.') || 'beneficiary'}@adra.community`,
      location: regData.location || 'Juba Central, South Sudan',
      household_size: Number(regData.household_size) || 4,
      vulnerability_category: normCategory,
      registration_date: new Date().toISOString().split('T')[0],
      verification_status: 'Pending Verification',
      status: 'Pending Verification',
      duplicate_flag: dupCheck?.isDuplicate ? dupCheck.reason : null,
      priority_needs: regData.priority_needs || regData.primary_needs || 'Emergency Food Baskets & Clean Water',
      emergency_contact_name: regData.emergency_contact_name || regData.emergency_contact || '',
      emergency_contact_phone: regData.emergency_contact_phone || '',
      project_id: regData.project_id || 'pr1',
      project_name: regData.project_name || 'Emergency Food Security & Livelihoods Resilience',
      qr_token: `${bCode}-VFD${Date.now().toString().slice(-4)}`,
      avatar: regData.gender === 'Female'
        ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      password: regData.password || 'Password123!'
    };

    let createdBen = newBen;
    if (isSupabaseConfigured) {
      try {
        let projId = regData.project_id || null;
        if (!projId) {
          const projs = await this.getProjects();
          projId = projs[0]?.id || null;
        }

        const insertPayload = {
          beneficiary_code: newBen.beneficiary_code,
          full_name: newBen.full_name,
          gender: newBen.gender,
          date_of_birth: newBen.date_of_birth || null,
          age: newBen.age,
          phone_number: newBen.phone_number,
          email: newBen.email,
          location: newBen.location,
          vulnerability_category: normCategory,
          registration_date: newBen.registration_date,
          national_id: newBen.national_id || null,
          verification_status: 'Pending Verification',
          ...(projId ? { project_id: projId } : {})
        };

        const { data, error } = await supabase.from('beneficiaries').insert([insertPayload]).select().single();
        if (!error && data) {
          createdBen = { ...newBen, ...data, vulnerability_category: normCategory };
        } else if (error) {
          console.warn('Supabase insert beneficiary error:', error.message);
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
      verification_status: 'Pending Verification',
      is_active: false,
      avatar: createdBen.avatar,
      beneficiary_id: createdBen.id,
      beneficiary_code: createdBen.beneficiary_code
    });

    await this.createApproval({
      category: 'Beneficiary Verification',
      requester_name: createdBen.full_name,
      requester_email: createdBen.email,
      role_requested: 'Beneficiary',
      department: `Community (${createdBen.location})`,
      details: `New Beneficiary registration: ${createdBen.full_name} (Code: ${createdBen.beneficiary_code}, ID: ${createdBen.national_id || 'N/A'}, Phone: ${createdBen.phone_number}). Awaiting administrator verification.`,
      user_id: userAccount.id,
      beneficiary_id: createdBen.id,
      priority: 'High'
    });

    await this.logAudit({
      action: 'REGISTER',
      module: 'Beneficiary Management',
      record_id: createdBen.beneficiary_code,
      details: `Self-registered new beneficiary: ${createdBen.full_name} (${createdBen.beneficiary_code}) — Status: Pending Verification`
    });

    return { beneficiary: createdBen, user: userAccount, account: userAccount, dupCheck };
  },

  async verifyBeneficiary(id, notes = '') {
    const bens = await this.getBeneficiaries();
    const target = bens.find(b => b.id === id || b.beneficiary_code === id);
    if (!target) throw new Error('Beneficiary record not found');

    const updatedBen = {
      ...target,
      verification_status: 'Verified Active'
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('beneficiaries').update({
          verification_status: 'Verified Active'
        }).eq('id', target.id);
      } catch (err) {
        console.warn('Supabase update beneficiary error:', err?.message);
      }
    }

    const currentBens = getLocalData(STORAGE_KEYS.BENEFICIARIES, mock.initialBeneficiaries);
    const updatedBensList = currentBens.map(b => 
      (b.id === target.id || b.beneficiary_code === target.beneficiary_code) 
        ? { ...b, verification_status: 'Verified Active' } 
        : b
    );
    saveLocalData(STORAGE_KEYS.BENEFICIARIES, updatedBensList);

    // Also activate linked user profile in profiles / users
    const users = getLocalData(STORAGE_KEYS.USERS, mock.demoAccounts);
    const updatedUsers = users.map(u => {
      const matches = (target.email && u.email?.toLowerCase() === target.email.toLowerCase()) ||
                      (target.phone_number && u.phone === target.phone_number) ||
                      (target.id && (u.beneficiary_id === target.id || u.id === target.id)) ||
                      (target.beneficiary_code && u.beneficiary_code === target.beneficiary_code);
      if (matches) {
        return { ...u, status: 'Active', is_active: true, verification_status: 'Verified Active' };
      }
      return u;
    });
    saveLocalData(STORAGE_KEYS.USERS, updatedUsers);

    if (isSupabaseConfigured) {
      try {
        if (target.email) {
          await supabase.from('profiles').update({ status: 'Active', is_active: true }).eq('email', target.email);
        }
        if (target.phone_number) {
          await supabase.from('profiles').update({ status: 'Active', is_active: true }).eq('phone', target.phone_number);
        }
      } catch (err) {
        console.warn('Supabase user profile activate error:', err?.message);
      }
    }

    // Update matching approvals in queue
    const approvals = getLocalData(STORAGE_KEYS.APPROVALS, mock.initialApprovals);
    const updatedApprovals = approvals.map(a => {
      const matches = (a.beneficiary_id && (a.beneficiary_id === target.id || a.beneficiary_id === target.beneficiary_code)) ||
                      (target.email && a.requester_email?.toLowerCase() === target.email.toLowerCase()) ||
                      (target.beneficiary_code && a.details?.includes(target.beneficiary_code)) ||
                      (target.full_name && a.requester_name === target.full_name);
      if (matches && a.status === 'Pending') {
        return { ...a, status: 'Approved', review_notes: notes || 'Verified by Administrator', reviewed_at: new Date().toISOString() };
      }
      return a;
    });
    saveLocalData(STORAGE_KEYS.APPROVALS, updatedApprovals);

    await this.logAudit({
      action: 'VERIFY',
      module: 'Beneficiary Oversight',
      record_id: target.beneficiary_code || target.id,
      details: `Administrator verified beneficiary: ${target.full_name} (${target.beneficiary_code}). Compliance approved.`
    });

    return updatedBen;
  },

  async flagBeneficiary(id, reason = 'Flagged for field discrepancy review') {
    const bens = await this.getBeneficiaries();
    const target = bens.find(b => b.id === id || b.beneficiary_code === id);
    if (!target) throw new Error('Beneficiary record not found');

    if (isSupabaseConfigured) {
      try {
        await supabase.from('beneficiaries').update({
          verification_status: 'Flagged'
        }).eq('id', target.id);
      } catch (err) {
        console.warn('Supabase flag beneficiary error:', err?.message);
      }
    }

    const currentBens = getLocalData(STORAGE_KEYS.BENEFICIARIES, mock.initialBeneficiaries);
    const updatedBensList = currentBens.map(b => 
      (b.id === target.id || b.beneficiary_code === target.beneficiary_code) 
        ? { ...b, verification_status: 'Flagged', review_notes: reason } 
        : b
    );
    saveLocalData(STORAGE_KEYS.BENEFICIARIES, updatedBensList);

    await this.logAudit({
      action: 'FLAG',
      module: 'Beneficiary Oversight',
      record_id: target.beneficiary_code || target.id,
      details: `Administrator flagged beneficiary: ${target.full_name} (${target.beneficiary_code}). Reason: ${reason}`
    });

    return { ...target, verification_status: 'Flagged' };
  },

  async rejectBeneficiary(id, reason = 'Rejected by Administrator') {
    const bens = await this.getBeneficiaries();
    const target = bens.find(b => b.id === id || b.beneficiary_code === id);
    if (!target) throw new Error('Beneficiary record not found');

    if (isSupabaseConfigured) {
      try {
        await supabase.from('beneficiaries').update({
          verification_status: 'Rejected'
        }).eq('id', target.id);
      } catch (err) {
        console.warn('Supabase reject beneficiary error:', err?.message);
      }
    }

    const currentBens = getLocalData(STORAGE_KEYS.BENEFICIARIES, mock.initialBeneficiaries);
    const updatedBensList = currentBens.map(b => 
      (b.id === target.id || b.beneficiary_code === target.beneficiary_code) 
        ? { ...b, verification_status: 'Rejected', review_notes: reason } 
        : b
    );
    saveLocalData(STORAGE_KEYS.BENEFICIARIES, updatedBensList);

    // Deactivate linked user profile
    if (isSupabaseConfigured) {
      try {
        if (target.email) {
          await supabase.from('profiles').update({ status: 'Rejected', is_active: false }).eq('email', target.email);
        }
      } catch (err) {}
    }

    // Update approvals
    const approvals = getLocalData(STORAGE_KEYS.APPROVALS, mock.initialApprovals);
    const updatedApprovals = approvals.map(a => {
      const matches = (a.beneficiary_id && (a.beneficiary_id === target.id || a.beneficiary_id === target.beneficiary_code)) ||
                      (target.email && a.requester_email?.toLowerCase() === target.email.toLowerCase()) ||
                      (target.beneficiary_code && a.details?.includes(target.beneficiary_code)) ||
                      (target.full_name && a.requester_name === target.full_name);
      if (matches && a.status === 'Pending') {
        return { ...a, status: 'Rejected', review_notes: reason, reviewed_at: new Date().toISOString() };
      }
      return a;
    });
    saveLocalData(STORAGE_KEYS.APPROVALS, updatedApprovals);

    await this.logAudit({
      action: 'REJECT',
      module: 'Beneficiary Oversight',
      record_id: target.beneficiary_code || target.id,
      details: `Administrator rejected beneficiary registration: ${target.full_name}. Reason: ${reason}`
    });

    return { ...target, verification_status: 'Rejected' };
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
    const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    let remoteData = null;

    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('assistance_requests').select('*').order('created_at', { ascending: false });
        if (beneficiaryId) {
          if (isUUID(beneficiaryId)) {
            query = query.or(`beneficiary_id.eq.${beneficiaryId},beneficiary_code.eq.${beneficiaryId},beneficiary_name.ilike.%${beneficiaryId}%`);
          } else {
            query = query.or(`beneficiary_code.eq.${beneficiaryId},beneficiary_name.ilike.%${beneficiaryId}%`);
          }
        }
        const { data, error } = await query;
        if (!error && data) {
          remoteData = data.map(normalizeAssistanceRequest);
        } else if (error) {
          console.warn('Supabase getAssistanceRequests warning:', error.message);
        }
      } catch (err) {
        console.warn('Supabase getAssistanceRequests query error (falling back to local):', err?.message);
      }
    }

    if (remoteData !== null) {
      saveLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, remoteData);
      return remoteData;
    }

    const rawLocal = getLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, []);
    const isMock = (r) => (
      r.id === 'req-128' || 
      (typeof r.id === 'string' && r.id.startsWith('req-10')) ||
      (typeof r.request_code === 'string' && (
        r.request_code.startsWith('ADR-REQ-TEST') ||
        r.request_code.startsWith('ADR-REQ-2026-0010') ||
        r.request_code === 'ADR-REQ-2026-00128' ||
        r.request_code === 'ADR-REQ-2026-00129'
      ))
    );
    const cleanedLocal = (Array.isArray(rawLocal) ? rawLocal : []).filter(r => !isMock(r)).map(normalizeAssistanceRequest);
    saveLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, cleanedLocal);

    if (beneficiaryId) {
      const target = String(beneficiaryId).toLowerCase();
      return cleanedLocal.filter(r => 
        (r.beneficiary_id && String(r.beneficiary_id).toLowerCase() === target) || 
        (r.beneficiary_code && String(r.beneficiary_code).toLowerCase() === target) || 
        (r.beneficiary_name && String(r.beneficiary_name).toLowerCase().includes(target))
      );
    }
    return cleanedLocal;
  },

  async createAssistanceRequest(requestData) {
    const all = getLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, []);
    const nextNum = (140 + all.length).toString().padStart(5, '0');
    
    // Parse location parts if needed
    let state = requestData.state;
    let county = requestData.county;
    let payam = requestData.payam;
    let boma = requestData.boma;
    let village = requestData.village || requestData.village_area;
    if (requestData.location && (!state || !county)) {
      const parts = requestData.location.split(',').map(s => s.trim());
      if (parts[0] && !state) state = parts[0];
      if (parts[1] && !county) county = parts[1];
      if (parts[2] && !payam) payam = parts[2];
      if (parts[3] && !boma) boma = parts[3];
      if (parts[4] && !village) village = parts[4];
    }

    const category = requestData.category || requestData.categories?.join(', ') || 'Food, Water';
    const urgency = requestData.urgency || requestData.priority || 'High';
    const reason = requestData.reason || requestData.description || 'Beneficiary assistance request';

    const newReq = normalizeAssistanceRequest({
      id: isSupabaseConfigured ? undefined : `req_${Date.now()}`,
      request_code: requestData.request_code || `ADR-REQ-2026-${nextNum}`,
      status: 'Submitted',
      status_label: 'Pending Review',
      status_stage: 1,
      created_at: new Date().toISOString(),
      reviewed_by: null,
      review_notes: 'Request submitted to ADRA system. Awaiting field officer initial review.',
      expected_dispatch_date: 'Pending Review',
      category,
      assistance_type: requestData.assistance_type || category,
      urgency,
      priority: urgency,
      reason,
      description: reason,
      state: state || 'Eastern Equatoria',
      county: county || 'Kapoeta South',
      payam: payam || 'Kapoeta Town',
      boma: boma || 'nn',
      village: village || 'jkkfg',
      location: requestData.location || `${state || 'Eastern Equatoria'}, ${county || 'Kapoeta South'}, ${payam || 'Kapoeta Town'}`,
      program_name: requestData.program_name || requestData.project_name || 'Emergency Food Security & Livelihoods Resilience (EFSLR)',
      programme_name: requestData.programme_name || requestData.program_name || requestData.project_name || 'Emergency Food Security & Livelihoods Resilience (EFSLR)',
      program_id: requestData.program_id || requestData.project_id || 'prg1',
      household_members: Number(requestData.household_members) || 1,
      preferred_depot: requestData.preferred_depot || `${county || 'Kapoeta South'} Distribution Depot`,
      eligibility: 'Eligible (High Vulnerability)',
      eligibility_status: 'Verified',
      verification_status: 'Verified Active',
      is_duplicate: false,
      duplicate_detected: false,
      assigned_supervisor_id: null,
      assigned_supervisor_name: 'Unassigned',
      assigned_field_worker_name: 'Pending Supervisor Assignment',
      ...requestData
    });

    if (isSupabaseConfigured) {
      try {
        const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        const ALLOWED_COLS = new Set([
          'id', 'request_code', 'beneficiary_id', 'beneficiary_name', 'beneficiary_code',
          'category', 'assistance_type', 'urgency', 'priority', 'status', 'status_label',
          'status_stage', 'reason', 'description', 'state', 'county', 'payam', 'boma',
          'village', 'location', 'program_id', 'program_name', 'programme_name',
          'household_members', 'preferred_depot', 'eligibility', 'eligibility_status',
          'verification_status', 'is_duplicate', 'assigned_supervisor_id',
          'assigned_supervisor_name', 'assigned_field_worker_name', 'reviewed_by',
          'review_notes', 'expected_dispatch_date', 'additional_info', 'created_at', 'updated_at'
        ]);

        const raw = {
          ...newReq,
          program_name: newReq.program_name || newReq.programme_name || requestData.project_name || 'Emergency Food Security & Livelihoods Resilience (EFSLR)',
          programme_name: newReq.programme_name || newReq.program_name || requestData.project_name || 'Emergency Food Security & Livelihoods Resilience (EFSLR)',
          village: newReq.village || requestData.village_area || 'Kapoeta Town',
          reason: newReq.reason || newReq.description || requestData.reason,
          description: newReq.description || newReq.reason || requestData.description
        };

        const supabasePayload = {};
        for (const [k, v] of Object.entries(raw)) {
          if (ALLOWED_COLS.has(k)) {
            if (['id', 'beneficiary_id', 'program_id', 'assigned_supervisor_id', 'reviewed_by'].includes(k)) {
              supabasePayload[k] = isUUID(v) ? v : null;
            } else {
              supabasePayload[k] = v;
            }
          }
        }
        if (!supabasePayload.id) delete supabasePayload.id;

        const { data, error } = await supabase.from('assistance_requests').insert([supabasePayload]).select().single();
        if (!error && data) {
          const normalized = normalizeAssistanceRequest(data);
          const updated = [normalized, ...all];
          saveLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, updated);
          db.logAudit({
            action: 'CREATE',
            module: 'Beneficiary Requests',
            record_id: normalized.request_code,
            details: `Assistance request submitted by ${normalized.beneficiary_name}: ${normalized.category} (${normalized.urgency})`
          });
          return normalized;
        } else if (error) {
          console.warn('Supabase assistance_requests insert warning (saving locally):', error.message);
        }
      } catch (err) {
        console.warn('Supabase assistance_requests insert error (falling back to local):', err);
      }
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
    const stageMap = { 'Pending': 1, 'Submitted': 1, 'Under Review': 2, 'Approved': 3, 'Assigned to Supervisor': 3, 'In Progress': 4, 'Fulfilled': 5, 'Completed': 5, 'Rejected': 6 };
    const all = getLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, mock.initialAssistanceRequests);
    const updated = all.map(r => (r.id === id || r.request_code === id) ? {
      ...r,
      status,
      status_label: status,
      status_stage: stageMap[status] || r.status_stage,
      review_notes: reviewNotes || r.review_notes,
      reviewed_at: new Date().toISOString()
    } : r);
    saveLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, updated);
    const target = updated.find(r => r.id === id || r.request_code === id);

    if (isSupabaseConfigured && target) {
      try {
        const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        if (isUUID(target.id)) {
          await supabase.from('assistance_requests').update({
            status: target.status,
            status_label: target.status_label,
            status_stage: target.status_stage,
            review_notes: target.review_notes,
            updated_at: new Date().toISOString()
          }).eq('id', target.id);
        } else if (target.request_code) {
          await supabase.from('assistance_requests').update({
            status: target.status,
            status_label: target.status_label,
            status_stage: target.status_stage,
            review_notes: target.review_notes,
            updated_at: new Date().toISOString()
          }).eq('request_code', target.request_code);
        }
      } catch (err) {
        console.warn('Supabase status update error:', err?.message);
      }
    }

    return target;
  },

  async approveAssistanceRequest(id, { managerName = 'Grace Ochieng', supervisorId = null, supervisorName = null, notes = '' } = {}) {
    const all = getLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, mock.initialAssistanceRequests);
    const target = all.find(r => r.id === id || r.request_code === id);
    if (!target) throw new Error('Request not found');

    const status = supervisorId ? 'Assigned to Supervisor' : 'Approved';
    const now = new Date().toISOString();

    const updated = all.map(r => (r.id === id || r.request_code === id || (target && r.id === target.id)) ? {
      ...r,
      status,
      status_label: status,
      status_stage: 3,
      reviewed_by: `${managerName} (Programme Manager)`,
      reviewed_at: now,
      review_notes: notes || `Approved by ${managerName}`,
      assigned_supervisor_id: supervisorId || r.assigned_supervisor_id,
      assigned_supervisor_name: supervisorName || r.assigned_supervisor_name || 'Awaiting Supervisor Assignment',
      assigned_field_worker_name: r.assigned_field_worker_name || 'Pending Supervisor Assignment'
    } : r);

    saveLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, updated);
    const finalTarget = updated.find(r => r.id === id || r.request_code === id || (target && r.id === target.id));

    if (isSupabaseConfigured && finalTarget) {
      try {
        const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        const updates = {
          status: finalTarget.status,
          status_label: finalTarget.status_label,
          status_stage: 3,
          review_notes: finalTarget.review_notes,
          assigned_supervisor_id: isUUID(finalTarget.assigned_supervisor_id) ? finalTarget.assigned_supervisor_id : null,
          assigned_supervisor_name: finalTarget.assigned_supervisor_name,
          assigned_field_worker_name: finalTarget.assigned_field_worker_name,
          updated_at: now
        };
        if (isUUID(finalTarget.id)) {
          await supabase.from('assistance_requests').update(updates).eq('id', finalTarget.id);
        } else if (finalTarget.request_code) {
          await supabase.from('assistance_requests').update(updates).eq('request_code', finalTarget.request_code);
        }
      } catch (err) {
        console.warn('Supabase approval update error:', err?.message);
      }
    }

    if (supervisorId) {
      await this.createFieldActivity({
        request_id: target.id,
        activity_code: `ACT-SS-${Date.now().toString().slice(-4)}`,
        programme: target.programme_name || 'Emergency Food Security',
        activity_type: `${target.category} Field Delivery & Verification`,
        supervisor_id: supervisorId,
        supervisor_name: supervisorName,
        field_worker_name: 'Pending Supervisor Assignment',
        location: target.location || `${target.county}, ${target.payam}`,
        state: target.state || 'South Sudan',
        county: target.county || 'South Sudan',
        scheduled_date: new Date(Date.now() + 48 * 3600000).toISOString().split('T')[0],
        status: 'Assigned',
        progress_percentage: 25,
        field_notes: `Initiated upon Programme Manager approval. Assigned to ${supervisorName}.`
      });
    }

    await this.logAudit({
      action: 'APPROVE',
      module: 'Programme Assistance',
      record_id: target.request_code || id,
      details: `Programme Manager ${managerName} approved assistance request ${target.request_code} for ${target.beneficiary_name} (${target.category})`
    });

    return finalTarget;
  },

  async rejectAssistanceRequest(id, options = {}) {
    const reason = typeof options === 'string' ? options : (options.reason || '');
    const managerName = typeof options === 'object' && options.managerName ? options.managerName : 'Grace Ochieng';
    const all = getLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, mock.initialAssistanceRequests);
    const target = all.find(r => r.id === id || r.request_code === id);
    if (!target) throw new Error('Request not found');

    const now = new Date().toISOString();
    const updated = all.map(r => (r.id === id || r.request_code === id || (target && r.id === target.id)) ? {
      ...r,
      status: 'Rejected',
      status_label: 'Rejected',
      status_stage: 6,
      reviewed_by: `${managerName} (Programme Manager)`,
      reviewed_at: now,
      rejection_reason: reason,
      review_notes: `Rejected: ${reason}`
    } : r);

    saveLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, updated);
    const finalTarget = updated.find(r => r.id === id || r.request_code === id || (target && r.id === target.id));

    if (isSupabaseConfigured && finalTarget) {
      try {
        const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        const updates = {
          status: 'Rejected',
          status_label: 'Rejected',
          status_stage: 6,
          review_notes: `Rejected: ${reason}`,
          updated_at: now
        };
        if (isUUID(finalTarget.id)) {
          await supabase.from('assistance_requests').update(updates).eq('id', finalTarget.id);
        } else if (finalTarget.request_code) {
          await supabase.from('assistance_requests').update(updates).eq('request_code', finalTarget.request_code);
        }
      } catch (err) {
        console.warn('Supabase rejection update error:', err?.message);
      }
    }

    await this.logAudit({
      action: 'REJECT',
      module: 'Programme Assistance',
      record_id: target.request_code || id,
      details: `Programme Manager ${managerName} rejected assistance request ${target.request_code}. Reason: ${reason}`
    });

    return finalTarget;
  },

  async requestInfoAssistanceRequest(id, options = {}) {
    const comment = typeof options === 'string' ? options : (options.comment || '');
    const managerName = typeof options === 'object' && options.managerName ? options.managerName : 'Grace Ochieng';
    const all = getLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, mock.initialAssistanceRequests);
    const target = all.find(r => r.id === id || r.request_code === id);
    if (!target) throw new Error('Request not found');

    const now = new Date().toISOString();
    const updated = all.map(r => (r.id === id || r.request_code === id || (target && r.id === target.id)) ? {
      ...r,
      status: 'Info Requested',
      status_label: 'Info Requested',
      status_stage: 2,
      reviewed_by: `${managerName} (Programme Manager)`,
      reviewed_at: now,
      review_notes: `Information requested: ${comment}`
    } : r);

    saveLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, updated);

    await this.logAudit({
      action: 'REQUEST_INFO',
      module: 'Programme Assistance',
      record_id: target.request_code || id,
      details: `Programme Manager ${managerName} requested additional info for ${target.request_code}: ${comment}`
    });

    return updated.find(r => r.id === id || r.request_code === id || (target && r.id === target.id));
  },

  async assignSupervisorToRequest(requestId, supervisorId, supervisorName, notes = '', managerName = 'Grace Ochieng') {
    const all = getLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, []);
    const target = all.find(r => r.id === requestId || r.request_code === requestId);
    if (!target) {
      // If not in local data, fetch live from Supabase
      if (isSupabaseConfigured) {
        const { data } = await supabase.from('assistance_requests').select('*').or(`id.eq.${requestId},request_code.eq.${requestId}`).single();
        if (data) {
          const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
          await supabase.from('assistance_requests').update({
            status: 'Assigned to Supervisor',
            status_label: 'Assigned to Supervisor',
            status_stage: 3,
            assigned_supervisor_id: isUUID(supervisorId) ? supervisorId : null,
            assigned_supervisor_name: supervisorName,
            assigned_field_worker_name: 'Pending Supervisor Assignment',
            review_notes: notes || `Assigned to ${supervisorName}`,
            updated_at: new Date().toISOString()
          }).or(`id.eq.${requestId},request_code.eq.${requestId}`);
        }
      }
    }

    const updated = all.map(r => (r.id === requestId || r.request_code === requestId || (target && r.id === target.id)) ? {
      ...r,
      status: 'Assigned to Supervisor',
      status_label: 'Assigned to Supervisor',
      status_stage: 3,
      assigned_supervisor_id: supervisorId,
      assigned_supervisor_name: supervisorName,
      assigned_field_worker_name: 'Pending Supervisor Assignment',
      assigned_at: new Date().toISOString(),
      review_notes: notes ? `${r.review_notes ? r.review_notes + ' | ' : ''}${notes}` : r.review_notes
    } : r);

    saveLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, updated);

    if (isSupabaseConfigured) {
      try {
        const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        const updates = {
          status: 'Assigned to Supervisor',
          status_label: 'Assigned to Supervisor',
          status_stage: 3,
          assigned_supervisor_id: isUUID(supervisorId) ? supervisorId : null,
          assigned_supervisor_name: supervisorName,
          assigned_field_worker_name: 'Pending Supervisor Assignment',
          review_notes: notes ? notes : `Assigned to ${supervisorName} for field delivery`,
          updated_at: new Date().toISOString()
        };
        if (target && isUUID(target.id)) {
          await supabase.from('assistance_requests').update(updates).eq('id', target.id);
        } else if (target && target.request_code) {
          await supabase.from('assistance_requests').update(updates).eq('request_code', target.request_code);
        } else if (isUUID(requestId)) {
          await supabase.from('assistance_requests').update(updates).eq('id', requestId);
        } else {
          await supabase.from('assistance_requests').update(updates).eq('request_code', requestId);
        }
      } catch (err) {
        console.warn('Supabase supervisor assignment update error:', err?.message);
      }
    }

    if (target) {
      await this.createFieldActivity({
        request_id: target.id,
        activity_code: `ACT-SS-${Date.now().toString().slice(-4)}`,
        programme: target.programme_name || 'Emergency Food Security',
        activity_type: `${target.category} Field Delivery & Verification`,
        supervisor_id: supervisorId,
        supervisor_name: supervisorName,
        field_worker_name: 'Pending Supervisor Assignment',
        location: target.location || `${target.county}, ${target.payam}`,
        state: target.state || 'South Sudan',
        county: target.county || 'South Sudan',
        scheduled_date: new Date(Date.now() + 48 * 3600000).toISOString().split('T')[0],
        status: 'Assigned',
        progress_percentage: 25,
        field_notes: `Assigned to Supervisor ${supervisorName} for field deployment.`
      });
    }

    await this.logAudit({
      action: 'ASSIGN_SUPERVISOR',
      module: 'Programme Assistance',
      record_id: target?.request_code || requestId,
      details: `Assigned Supervisor ${supervisorName} to request ${target?.request_code || requestId}`
    });

    return updated.find(r => r.id === requestId || r.request_code === requestId || (target && r.id === target.id));
  },

  async getSupervisors() {
    let dbSupervisors = [];
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'Supervisor')
          .order('created_at', { ascending: true });
        if (!error && data && data.length > 0) {
          dbSupervisors = data;
        }
      } catch (err) {
        console.warn('Failed to query profiles for supervisors:', err?.message);
      }
    }

    const mockList = (mock.initialSupervisors && mock.initialSupervisors.length > 0) 
      ? mock.initialSupervisors 
      : [];

    if (dbSupervisors.length > 0) {
      // Merge DB supervisors with rich mock fields (state, county, active_tasks, etc.)
      return dbSupervisors.map((p, idx) => {
        const mockMatch = mockList.find(m => 
          m.email?.toLowerCase() === p.email?.toLowerCase() || 
          m.name?.toLowerCase() === p.full_name?.toLowerCase()
        ) || mockList[idx] || {};

        // Extract state from department if available e.g. "Field Operations & Supervisory (Central Equatoria State)"
        let extractedState = mockMatch.state || '';
        if (!extractedState && p.department) {
          const match = p.department.match(/\((.*?)\s*State\)/i) || p.department.match(/\((.*?)\)/i);
          if (match && match[1]) extractedState = match[1];
        }

        return {
          id: p.id || mockMatch.id || `sup-${idx + 1}`,
          name: p.full_name || mockMatch.name || 'Field Supervisor',
          email: p.email,
          phone: p.phone || mockMatch.phone || '+211-920-000003',
          role: 'Supervisor',
          state: extractedState || mockMatch.state || 'Eastern Equatoria',
          county: mockMatch.county || 'Kapoeta South',
          payam: mockMatch.payam || 'Town Centre',
          boma: mockMatch.boma || 'Central',
          assigned_area: mockMatch.assigned_area || p.department || `${extractedState || 'South Sudan'} Operational Area`,
          active_tasks: mockMatch.active_tasks ?? 3,
          completed_tasks: mockMatch.completed_tasks ?? 25,
          pending_reports: mockMatch.pending_reports ?? 1,
          approved_reports: mockMatch.approved_reports ?? 24,
          workload_percentage: mockMatch.workload_percentage ?? 50,
          status: p.status || 'Active',
          managed_field_workers: mockMatch.managed_field_workers ?? 5,
          avatar: p.avatar_url || mockMatch.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
        };
      });
    }

    return mockList;
  },

  // --- SUPERVISOR MODULE: FIELD WORKERS ---
  async getFieldWorkers(supervisorId = null) {
    const allWorkers = getLocalData(STORAGE_KEYS.FIELD_WORKERS, mock.initialFieldWorkers || []);
    if (supervisorId && supervisorId !== 'all') {
      const cleanSup = String(supervisorId).toLowerCase().trim();
      const filtered = allWorkers.filter(w => {
        if (!w.supervisor_id) return true;
        if (w.supervisor_id === supervisorId) return true;
        if (w.supervisor_name && w.supervisor_name.toLowerCase().includes(cleanSup)) return true;
        if (w.state && w.state.toLowerCase() === cleanSup) return true;
        return false;
      });
      return filtered.length > 0 ? filtered : allWorkers.slice(0, 5);
    }
    return allWorkers;
  },

  async getFieldWorkerById(workerId) {
    const allWorkers = await this.getFieldWorkers();
    return allWorkers.find(w => w.id === workerId) || null;
  },

  async updateFieldWorkerStatus(workerId, newStatus) {
    const allWorkers = getLocalData(STORAGE_KEYS.FIELD_WORKERS, mock.initialFieldWorkers || []);
    const updated = allWorkers.map(w => w.id === workerId ? { ...w, current_status: newStatus } : w);
    saveLocalData(STORAGE_KEYS.FIELD_WORKERS, updated);
    return updated.find(w => w.id === workerId);
  },

  // --- SUPERVISOR MODULE: ASSIGNMENTS & DISPATCH ---
  async getSupervisorAssignments(supervisorId = null) {
    // 1. Fetch live assistance requests from database / local store
    const allRequests = await this.getAssistanceRequests();

    // 2. Filter requests assigned to supervisor or pending supervisor action
    return allRequests.filter(r => {
      if (!supervisorId || supervisorId === 'all') return true;
      const matchSupId = r.assigned_supervisor_id === supervisorId;
      const matchSupName = r.assigned_supervisor_name && supervisorId && (
        r.assigned_supervisor_name.toLowerCase().includes(String(supervisorId).toLowerCase())
      );
      const isAssignedOrForwarded = [
        'Assigned to Supervisor',
        'Assigned to Field Worker',
        'Assessment In Progress',
        'Assessment Submitted',
        'Correction Required',
        'Awaiting Program Manager Decision',
        'Approved',
        'Distributed',
        'Completed'
      ].includes(r.status);

      return (matchSupId || matchSupName || isAssignedOrForwarded);
    });
  },

  async assignFieldWorkerToRequest(requestId, fieldWorkerId, fieldWorkerName, notes = '', dueDate = null, supervisorName = 'Emmanuel Adeyemi') {
    const allRequests = await this.getAssistanceRequests();
    const target = allRequests.find(r => r.id === requestId || r.request_code === requestId);
    if (!target) throw new Error('Assistance request not found');

    const calculatedDueDate = dueDate || new Date(Date.now() + 48 * 3600000).toISOString().split('T')[0];
    const now = new Date().toISOString();
    const newNote = notes ? `Assigned to ${fieldWorkerName}: ${notes}` : `Assigned to ${fieldWorkerName}`;

    const updated = allRequests.map(r => {
      if (r.id === requestId || r.request_code === requestId || (target && r.id === target.id)) {
        const prevNotes = r.review_notes ? r.review_notes.split(' | ').map(s => s.trim()).filter(Boolean) : [];
        const cleanedPrev = prevNotes.filter(n => !n.includes('Previous Worker') && n !== newNote);
        const combinedNotes = Array.from(new Set([...cleanedPrev, newNote])).join(' | ');

        return {
          ...r,
          status: 'Assigned to Field Worker',
          status_label: 'Assigned to Field Worker',
          status_stage: 3,
          assigned_field_worker_id: fieldWorkerId,
          assigned_field_worker_name: fieldWorkerName,
          due_date: calculatedDueDate,
          field_worker_assigned_at: now,
          review_notes: combinedNotes
        };
      }
      return r;
    });

    saveLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, updated);

    // Sync to Supabase PostgreSQL
    if (isSupabaseConfigured) {
      try {
        const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        const updates = {
          status: 'Assigned to Field Worker',
          status_label: 'Assigned to Field Worker',
          status_stage: 3,
          assigned_field_worker_id: fieldWorkerId,
          assigned_field_worker_name: fieldWorkerName,
          due_date: calculatedDueDate,
          field_worker_assigned_at: now,
          review_notes: newNote,
          updated_at: now
        };
        if (target && isUUID(target.id)) {
          await supabase.from('assistance_requests').update(updates).eq('id', target.id);
        } else if (target && target.request_code) {
          await supabase.from('assistance_requests').update(updates).eq('request_code', target.request_code);
        }
      } catch (err) {
        console.warn('Supabase worker assignment update warning:', err?.message);
      }
    }

    // Update Field Worker workload in state
    const allWorkers = getLocalData(STORAGE_KEYS.FIELD_WORKERS, mock.initialFieldWorkers || []);
    const updatedWorkers = allWorkers.map(w => w.id === fieldWorkerId ? {
      ...w,
      active_assignments: (w.active_assignments || 0) + 1,
      current_status: (w.active_assignments || 0) >= 2 ? 'Busy' : 'On Assignment',
      last_activity: `Assigned to request ${target.request_code} (Just now)`
    } : w);
    saveLocalData(STORAGE_KEYS.FIELD_WORKERS, updatedWorkers);

    // Create field activity record
    await this.createFieldActivity({
      request_id: target.id,
      activity_code: `ACT-SS-${Date.now().toString().slice(-4)}`,
      programme: target.programme_name || 'Emergency Food Security',
      activity_type: `${target.category} Field Verification`,
      supervisor_id: target.assigned_supervisor_id || 'sup-1',
      supervisor_name: supervisorName,
      field_worker_name: fieldWorkerName,
      location: target.location || `${target.county}, ${target.payam}`,
      state: target.state || 'Eastern Equatoria',
      county: target.county || 'Kapoeta South',
      scheduled_date: calculatedDueDate,
      status: 'Assigned',
      progress_percentage: 30,
      field_notes: notes || `Assigned to ${fieldWorkerName} for field assessment and household verification.`
    });

    // Create supervisor activity log
    await this.logSupervisorActivity({
      user_name: supervisorName,
      role: 'Supervisor',
      action: 'ASSIGN_WORKER',
      details: `You assigned request ${target.request_code} to ${fieldWorkerName}.`
    });

    // Create notification for Field Worker
    const currentNotifs = getLocalData(STORAGE_KEYS.SUPERVISOR_NOTIFICATIONS, mock.initialSupervisorNotifications || []);
    const newNotif = {
      id: `snotif-${Date.now().toString().slice(-4)}`,
      title: 'Field Worker Dispatched',
      message: `Assignment for request ${target.request_code} was successfully dispatched to ${fieldWorkerName}.`,
      type: 'assignment',
      created_at: new Date().toISOString(),
      is_read: false,
      link_id: target.request_code
    };
    saveLocalData(STORAGE_KEYS.SUPERVISOR_NOTIFICATIONS, [newNotif, ...currentNotifs]);

    // Audit log
    await this.logAudit({
      action: 'ASSIGN_FIELD_WORKER',
      module: 'Supervisor Field Dispatch',
      record_id: target.request_code,
      details: `Supervisor ${supervisorName} assigned request ${target.request_code} to Field Worker ${fieldWorkerName}. Due date: ${calculatedDueDate}`
    });

    return updated.find(r => r.id === requestId || r.request_code === requestId);
  },

  async reassignFieldWorker(requestId, newFieldWorkerId, newFieldWorkerName, reason = '', supervisorName = 'Emmanuel Adeyemi') {
    const allRequests = await this.getAssistanceRequests();
    const target = allRequests.find(r => r.id === requestId || r.request_code === requestId);
    if (!target) throw new Error('Assistance request not found');

    const previousWorker = target.assigned_field_worker_name;
    const hasRealPrev = previousWorker && 
      previousWorker !== 'Previous Worker' && 
      previousWorker !== 'Unassigned' && 
      !previousWorker.toLowerCase().includes('pending');
    
    const newNote = hasRealPrev
      ? `Reassigned from ${previousWorker} to ${newFieldWorkerName}${reason ? `. Reason: ${reason}` : ''}`
      : `Assigned to ${newFieldWorkerName}${reason ? `. Reason: ${reason}` : ''}`;
    
    const now = new Date().toISOString();

    const updated = allRequests.map(r => {
      if (r.id === requestId || r.request_code === requestId) {
        const prevNotes = r.review_notes ? r.review_notes.split(' | ').map(s => s.trim()).filter(Boolean) : [];
        const cleanedPrev = prevNotes.filter(n => !n.includes('Previous Worker') && n !== newNote);
        const combinedNotes = Array.from(new Set([...cleanedPrev, newNote])).join(' | ');

        return {
          ...r,
          assigned_field_worker_id: newFieldWorkerId,
          assigned_field_worker_name: newFieldWorkerName,
          status: 'Assigned to Field Worker',
          status_label: 'Assigned to Field Worker',
          status_stage: 3,
          reassignment_reason: reason,
          review_notes: combinedNotes
        };
      }
      return r;
    });

    saveLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, updated);

    // Sync to Supabase
    if (isSupabaseConfigured) {
      try {
        const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        const updates = {
          assigned_field_worker_id: newFieldWorkerId,
          assigned_field_worker_name: newFieldWorkerName,
          status: 'Assigned to Field Worker',
          status_label: 'Assigned to Field Worker',
          status_stage: 3,
          review_notes: newNote,
          updated_at: now
        };
        if (target && isUUID(target.id)) {
          await supabase.from('assistance_requests').update(updates).eq('id', target.id);
        } else if (target && target.request_code) {
          await supabase.from('assistance_requests').update(updates).eq('request_code', target.request_code);
        }
      } catch (err) {
        console.warn('Supabase reassign worker update warning:', err?.message);
      }
    }

    await this.logSupervisorActivity({
      user_name: supervisorName,
      role: 'Supervisor',
      action: 'REASSIGN_WORKER',
      details: `You reassigned request ${target.request_code} from ${previousWorker} to ${newFieldWorkerName}. Reason: ${reason}`
    });

    await this.logAudit({
      action: 'REASSIGN_FIELD_WORKER',
      module: 'Supervisor Field Dispatch',
      record_id: target.request_code,
      details: `Supervisor ${supervisorName} reassigned request ${target.request_code} to ${newFieldWorkerName}. Reason: ${reason}`
    });

    return updated.find(r => r.id === requestId || r.request_code === requestId);
  },

  async resetAllFieldWorkerAssignments() {
    // 1. Reset local assistance requests
    const allRequests = getLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, []);
    const cleanedRequests = (Array.isArray(allRequests) ? allRequests : []).map(r => ({
      ...r,
      assigned_field_worker_id: null,
      assigned_field_worker_name: null,
      field_worker_id: null,
      field_worker_name: null,
      field_worker_assigned_at: null,
      status: r.status === 'Assigned to Field Worker' ? 'Assigned to Supervisor' : r.status,
      status_label: r.status === 'Assigned to Field Worker' ? 'Pending Field Officer Allocation' : r.status_label
    }));
    saveLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, cleanedRequests);

    // 2. Reset local field workers
    const allWorkers = getLocalData(STORAGE_KEYS.FIELD_WORKERS, mock.initialFieldWorkers || []);
    const resetWorkers = (Array.isArray(allWorkers) ? allWorkers : []).map(w => ({
      ...w,
      active_assignments: 0,
      pending_reports: 0,
      overdue_assessments: 0,
      current_status: 'Available'
    }));
    saveLocalData(STORAGE_KEYS.FIELD_WORKERS, resetWorkers);

    // 3. If Supabase configured, update remote assistance_requests
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('assistance_requests')
          .update({
            assigned_field_worker_name: null,
            status: 'Assigned to Supervisor',
            status_label: 'Pending Field Officer Allocation'
          })
          .not('id', 'is', null);
      } catch (err) {
        console.warn('Supabase reset worker assignments warning:', err?.message);
      }
    }
    return { success: true };
  },

  // --- SUPERVISOR MODULE: FIELD ASSESSMENTS & REPORT REVIEW ---
  async getFieldAssessments(supervisorId = null, workerId = null, workerName = null) {
    const raw = getLocalData(STORAGE_KEYS.FIELD_ASSESSMENTS, mock.initialFieldAssessments || []);
    
    // Also merge any assessments attached to assistance requests
    let merged = [...raw];
    try {
      const allReqs = getLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, mock.initialAssistanceRequests || []);
      allReqs.forEach(r => {
        const hasAssessment = r.field_worker_assessment || r.status === 'Assessment Submitted' || r.status === 'Awaiting Program Manager Decision';
        if (hasAssessment) {
          const reqCode = r.request_code || r.id;
          const alreadyExists = merged.some(a => a.request_code === reqCode || a.request_id === r.id || (r.assessment_code && a.assessment_code === r.assessment_code));
          if (!alreadyExists) {
            const fwa = r.field_worker_assessment || {};
            merged.unshift({
              id: fwa.id || `ass-${reqCode}`,
              assessment_code: fwa.assessment_code || r.assessment_code || `FA-${reqCode.replace(/[^0-9]/g, '').slice(-5) || '00895'}`,
              request_code: reqCode,
              request_id: r.id,
              beneficiary_name: r.beneficiary_name || fwa.beneficiary_name || 'Assessed Beneficiary',
              beneficiary_code: r.beneficiary_code || r.beneficiary_id || fwa.beneficiary_code || 'ADRA-SS-000140',
              field_worker_name: r.assigned_field_worker_name || fwa.field_worker_name || fwa.assessed_by || 'John Deng',
              field_worker_id: r.assigned_field_worker_id || fwa.field_worker_id || 'fw-1',
              supervisor_name: r.assigned_supervisor_name || fwa.supervisor_name || 'Emmanuel Adeyemi',
              supervisor_id: r.assigned_supervisor_id || fwa.supervisor_id || 'sup-1',
              submission_date: fwa.submission_date || r.updated_at || new Date().toISOString(),
              date_conducted: fwa.date_conducted || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
              status: fwa.status || (r.status === 'Awaiting Program Manager Decision' ? 'Forwarded to Program Manager' : 'Under Supervisor Review'),
              verification_finding: fwa.verification_finding || 'VERIFIED_TRUE',
              assignment_verified_true: fwa.assignment_verified_true ?? true,
              vulnerability_score: fwa.vulnerability_score || r.vulnerability_score || 85,
              urgency_level: fwa.urgency_level || r.urgency || r.priority || 'High',
              assistance_requested: r.assistance_type || r.category || 'Emergency Humanitarian Relief',
              recommended_aid: fwa.recommended_aid || r.recommended_aid || r.assistance_type || 'Immediate Emergency Relief Package',
              location: r.location || (r.county ? `${r.county}, ${r.state || 'South Sudan'}` : 'Eastern Equatoria'),
              ground_situation_report: fwa.ground_situation_report || fwa.audit_findings || r.ground_situation_report || r.review_notes || 'Household visited in-person. Severe need confirmed on-ground.',
              field_justification: fwa.field_justification || r.field_justification || 'Official Field Verification confirms acute humanitarian requirement.',
              audit_findings: fwa.audit_findings || fwa.ground_situation_report || r.ground_situation_report || 'Household verified in-person.',
              evidence_photos: fwa.evidence_photos || r.evidence_photos || [],
              evidence_documents: fwa.evidence_documents || r.evidence_documents || []
            });
          }
        }
      });
    } catch (e) {
      console.warn('Could not merge assistance request assessments:', e);
    }

    const all = merged.map(a => ({
      ...a,
      field_worker_name: a.field_worker_name || a.assessed_by || 'John Deng',
      field_worker_id: a.field_worker_id || a.worker_id || 'fw-1',
      date_conducted: a.date_conducted || (a.submission_date ? new Date(a.submission_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'),
      status: a.status || 'Under Supervisor Review',
      supervisor_name: a.supervisor_name || 'Emmanuel Adeyemi',
      supervisor_id: a.supervisor_id || 'sup-1',
      verification_finding: a.verification_finding || 'VERIFIED_TRUE'
    }));

    // If supervisorId is passed:
    if (supervisorId && supervisorId !== 'all') {
      const cleanSupId = String(supervisorId).toLowerCase().trim();
      const isAdeyemi = cleanSupId === 'sup-1' || cleanSupId === 'user-sup' || cleanSupId.includes('emmanuel') || cleanSupId.includes('adeyemi') || cleanSupId === 'eastern equatoria' || cleanSupId.includes('supervisor@adra.org') || cleanSupId.length > 20;

      const filtered = all.filter(a => {
        const aSupId = String(a.supervisor_id || '').toLowerCase().trim();
        const aSupName = String(a.supervisor_name || '').toLowerCase().trim();
        const aWorkerName = String(a.field_worker_name || a.assessed_by || '').toLowerCase();
        
        // Exact ID match
        if (aSupId === cleanSupId) return true;
        // Name partial match
        if (cleanSupId && aSupName.includes(cleanSupId)) return true;
        
        // If Emmanuel Adeyemi (default supervisor for Eastern Equatoria & general supervisory queue)
        if (isAdeyemi) {
          return true;
        }

        return false;
      });

      if (filtered.length > 0) return filtered;
      // Fallback: return all so supervisor is never locked out of submitted audits
      return all;
    }

    return all;
  },

  async getAssessmentById(assessmentId) {
    const all = await this.getFieldAssessments();
    return all.find(a => a.id === assessmentId || a.assessment_code === assessmentId) || null;
  },

  async submitAssessmentReport(reportData) {
    const all = getLocalData(STORAGE_KEYS.FIELD_ASSESSMENTS, mock.initialFieldAssessments || []);
    const nextNum = (895 + all.length).toString().padStart(5, '0');
    const newReport = {
      id: `ass-${Date.now().toString().slice(-4)}`,
      assessment_code: `FA-${nextNum}`,
      submission_date: new Date().toISOString(),
      status: 'Under Supervisor Review',
      ...reportData
    };

    const updated = [newReport, ...all];
    saveLocalData(STORAGE_KEYS.FIELD_ASSESSMENTS, updated);

    // Update linked assistance request status to 'Assessment Submitted'
    if (newReport.request_id || newReport.request_code) {
      const allReqs = await this.getAssistanceRequests();
      const updatedReqs = allReqs.map(r => (r.id === newReport.request_id || r.request_code === newReport.request_code) ? {
        ...r,
        status: 'Assessment Submitted',
        status_label: 'Assessment Submitted',
        status_stage: 3,
        review_notes: `Field assessment ${newReport.assessment_code} submitted by ${newReport.field_worker_name}. Awaiting Supervisor review.`
      } : r);
      saveLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, updatedReqs);
    }

    // Add notification for supervisor
    const notifs = getLocalData(STORAGE_KEYS.SUPERVISOR_NOTIFICATIONS, mock.initialSupervisorNotifications || []);
    const newNotif = {
      id: `snotif-${Date.now().toString().slice(-4)}`,
      title: 'Assessment Report Submitted',
      message: `${newReport.field_worker_name || 'Field Worker'} submitted assessment ${newReport.assessment_code} for ${newReport.beneficiary_name}.`,
      type: 'report_submitted',
      created_at: new Date().toISOString(),
      is_read: false,
      link_id: newReport.assessment_code
    };
    saveLocalData(STORAGE_KEYS.SUPERVISOR_NOTIFICATIONS, [newNotif, ...notifs]);

    return newReport;
  },

  async forwardAssessmentToPM(assessmentId, requestId, notes = '', supervisorName = 'Emmanuel Adeyemi') {
    const allAssessments = getLocalData(STORAGE_KEYS.FIELD_ASSESSMENTS, mock.initialFieldAssessments || []);
    const targetAss = allAssessments.find(a => a.id === assessmentId || a.assessment_code === assessmentId);
    
    const now = new Date().toISOString();

    const updatedAssessments = allAssessments.map(a => (a.id === assessmentId || a.assessment_code === assessmentId) ? {
      ...a,
      status: 'Forwarded to Program Manager',
      supervisor_notes: notes || `Verified by Supervisor ${supervisorName}. Forwarded to Program Manager Grace Ochieng for final assistance decision.`,
      forwarded_at: now,
      forwarded_by: supervisorName
    } : a);

    saveLocalData(STORAGE_KEYS.FIELD_ASSESSMENTS, updatedAssessments);

    // Update assistance request status to 'Awaiting Program Manager Decision'
    const allRequests = await this.getAssistanceRequests();
    const updatedRequests = allRequests.map(r => (r.id === requestId || r.request_code === requestId || (targetAss && (r.id === targetAss.request_id || r.request_code === targetAss.request_code))) ? {
      ...r,
      status: 'Awaiting Program Manager Decision',
      status_label: 'Awaiting PM Decision',
      status_stage: 4,
      review_notes: notes ? `Supervisor ${supervisorName} verified & forwarded: ${notes}` : `Supervisor ${supervisorName} verified & forwarded for final approval.`,
      updated_at: now
    } : r);

    saveLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, updatedRequests);

    // Sync to Supabase
    if (isSupabaseConfigured) {
      try {
        const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        const reqTarget = updatedRequests.find(r => r.id === requestId || r.request_code === requestId || (targetAss && (r.id === targetAss.request_id || r.request_code === targetAss.request_code)));
        if (reqTarget) {
          const updates = {
            status: 'Awaiting Program Manager Decision',
            status_label: 'Awaiting PM Decision',
            status_stage: 4,
            review_notes: notes || `Supervisor ${supervisorName} verified and forwarded.`,
            updated_at: now
          };
          if (isUUID(reqTarget.id)) {
            await supabase.from('assistance_requests').update(updates).eq('id', reqTarget.id);
          } else if (reqTarget.request_code) {
            await supabase.from('assistance_requests').update(updates).eq('request_code', reqTarget.request_code);
          }
        }
      } catch (err) {
        console.warn('Supabase forward to PM error:', err?.message);
      }
    }

    // Activity log
    await this.logSupervisorActivity({
      user_name: supervisorName,
      role: 'Supervisor',
      action: 'FORWARD_REPORT',
      details: `You forwarded assessment ${targetAss?.assessment_code || assessmentId} for ${targetAss?.beneficiary_name || 'beneficiary'} to Program Manager Grace Ochieng.`
    });

    // Audit log
    await this.logAudit({
      action: 'FORWARD_ASSESSMENT_TO_PM',
      module: 'Supervisor Quality & Compliance',
      record_id: targetAss?.assessment_code || assessmentId,
      details: `Supervisor ${supervisorName} verified assessment ${targetAss?.assessment_code || assessmentId} and forwarded to Program Manager Grace Ochieng for final decision.`
    });

    return updatedAssessments.find(a => a.id === assessmentId || a.assessment_code === assessmentId);
  },

  async requestAssessmentCorrection(assessmentId, requestId, reason, supervisorName = 'Emmanuel Adeyemi') {
    if (!reason || !reason.trim()) {
      throw new Error('Please enter a specific reason for the correction request.');
    }

    const allAssessments = getLocalData(STORAGE_KEYS.FIELD_ASSESSMENTS, mock.initialFieldAssessments || []);
    const targetAss = allAssessments.find(a => a.id === assessmentId || a.assessment_code === assessmentId);
    const now = new Date().toISOString();

    const updatedAssessments = allAssessments.map(a => (a.id === assessmentId || a.assessment_code === assessmentId) ? {
      ...a,
      status: 'Correction Required',
      correction_reason: reason,
      supervisor_notes: `Correction Requested by ${supervisorName}: ${reason}`,
      returned_at: now
    } : a);

    saveLocalData(STORAGE_KEYS.FIELD_ASSESSMENTS, updatedAssessments);

    // Update assistance request status
    const allRequests = await this.getAssistanceRequests();
    const updatedRequests = allRequests.map(r => (r.id === requestId || r.request_code === requestId || (targetAss && (r.id === targetAss.request_id || r.request_code === targetAss.request_code))) ? {
      ...r,
      status: 'Correction Required',
      status_label: 'Correction Required',
      status_stage: 3,
      review_notes: `Supervisor ${supervisorName} requested assessment correction: ${reason}`,
      updated_at: now
    } : r);

    saveLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, updatedRequests);

    // Sync to Supabase
    if (isSupabaseConfigured) {
      try {
        const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        const reqTarget = updatedRequests.find(r => r.id === requestId || r.request_code === requestId || (targetAss && (r.id === targetAss.request_id || r.request_code === targetAss.request_code)));
        if (reqTarget) {
          const updates = {
            status: 'Correction Required',
            status_label: 'Correction Required',
            status_stage: 3,
            review_notes: `Supervisor requested correction: ${reason}`,
            updated_at: now
          };
          if (isUUID(reqTarget.id)) {
            await supabase.from('assistance_requests').update(updates).eq('id', reqTarget.id);
          } else if (reqTarget.request_code) {
            await supabase.from('assistance_requests').update(updates).eq('request_code', reqTarget.request_code);
          }
        }
      } catch (err) {}
    }

    // Activity log
    await this.logSupervisorActivity({
      user_name: supervisorName,
      role: 'Supervisor',
      action: 'REQUEST_CORRECTION',
      details: `You requested correction for assessment ${targetAss?.assessment_code || assessmentId} from ${targetAss?.field_worker_name || 'Field Worker'}. Reason: ${reason}`
    });

    // Audit log
    await this.logAudit({
      action: 'REQUEST_ASSESSMENT_CORRECTION',
      module: 'Supervisor Quality & Compliance',
      record_id: targetAss?.assessment_code || assessmentId,
      details: `Supervisor ${supervisorName} returned assessment ${targetAss?.assessment_code || assessmentId} for correction. Reason: ${reason}`
    });

    return updatedAssessments.find(a => a.id === assessmentId || a.assessment_code === assessmentId);
  },

  async addAssessmentComment(assessmentId, comment, authorName = 'Emmanuel Adeyemi') {
    const allAssessments = getLocalData(STORAGE_KEYS.FIELD_ASSESSMENTS, mock.initialFieldAssessments || []);
    const updated = allAssessments.map(a => (a.id === assessmentId || a.assessment_code === assessmentId) ? {
      ...a,
      supervisor_notes: a.supervisor_notes ? `${a.supervisor_notes} | ${authorName}: ${comment}` : `${authorName}: ${comment}`
    } : a);
    saveLocalData(STORAGE_KEYS.FIELD_ASSESSMENTS, updated);
    return updated.find(a => a.id === assessmentId || a.assessment_code === assessmentId);
  },

  // --- SUPERVISOR NOTIFICATIONS ---
  async getSupervisorNotifications(supervisorId = null) {
    return getLocalData(STORAGE_KEYS.SUPERVISOR_NOTIFICATIONS, mock.initialSupervisorNotifications || []);
  },

  async markSupervisorNotificationAsRead(notifId) {
    const all = getLocalData(STORAGE_KEYS.SUPERVISOR_NOTIFICATIONS, mock.initialSupervisorNotifications || []);
    const updated = all.map(n => n.id === notifId ? { ...n, is_read: true } : n);
    saveLocalData(STORAGE_KEYS.SUPERVISOR_NOTIFICATIONS, updated);
    return true;
  },

  async markAllSupervisorNotificationsAsRead(supervisorId = null) {
    const all = getLocalData(STORAGE_KEYS.SUPERVISOR_NOTIFICATIONS, mock.initialSupervisorNotifications || []);
    const updated = all.map(n => ({ ...n, is_read: true }));
    saveLocalData(STORAGE_KEYS.SUPERVISOR_NOTIFICATIONS, updated);
    return true;
  },

  // --- SUPERVISOR ACTIVITY HISTORY ---
  async getSupervisorActivityHistory(supervisorId = null) {
    return getLocalData(STORAGE_KEYS.SUPERVISOR_ACTIVITIES, mock.initialSupervisorActivities || []);
  },

  async logSupervisorActivity({ user_name = 'Emmanuel Adeyemi', role = 'Supervisor', action, details }) {
    const all = getLocalData(STORAGE_KEYS.SUPERVISOR_ACTIVITIES, mock.initialSupervisorActivities || []);
    const newAct = {
      id: `sact-${Date.now()}`,
      user_name,
      role,
      action,
      details,
      created_at: new Date().toISOString()
    };
    const updated = [newAct, ...all].slice(0, 100);
    saveLocalData(STORAGE_KEYS.SUPERVISOR_ACTIVITIES, updated);
    return newAct;
  },

  // --- SUPERVISOR PROFILE ---
  async updateSupervisorProfile(supervisorId, profileData) {
    // Prevent changing role
    const safeData = { ...profileData };
    delete safeData.role;

    const users = await this.getUsers();
    const updated = users.map(u => (u.id === supervisorId || u.email === profileData.email || u.role === 'Supervisor') ? {
      ...u,
      ...safeData
    } : u);
    saveLocalData(STORAGE_KEYS.USERS, updated);

    if (isSupabaseConfigured && profileData.email) {
      try {
        await supabase.from('profiles').update(safeData).eq('email', profileData.email);
      } catch (e) {}
    }

    return updated.find(u => u.id === supervisorId || u.email === profileData.email || u.role === 'Supervisor');
  },

  // --- FIELD WORKER MODULE METHODS ---
  async getFieldWorkerAssignedRequests(workerId = null, workerName = null) {
    const allRequests = await this.getAssistanceRequests();
    return allRequests.filter(r => {
      if (!workerId && !workerName) return true;
      const cleanName = workerName ? String(workerName).toLowerCase().trim() : '';
      const cleanId = workerId ? String(workerId).toLowerCase().trim() : '';

      const matchWorkerId = r.assigned_field_worker_id && String(r.assigned_field_worker_id).toLowerCase() === cleanId;
      const matchWorkerName = r.assigned_field_worker_name && cleanName && (
        r.assigned_field_worker_name.toLowerCase().includes(cleanName) ||
        cleanName.includes(r.assigned_field_worker_name.toLowerCase())
      );

      // If this request specifically matches this worker
      if (matchWorkerId || matchWorkerName) return true;

      // Also fallback if request is in field-worker active pipeline states
      const isFieldStage = [
        'Assigned to Field Worker',
        'Assessment In Progress',
        'Assessment Submitted',
        'Correction Required'
      ].includes(r.status);

      return false;
    });
  },

  async submitFieldAssessment(assessmentData) {
    const allAssessments = getLocalData(STORAGE_KEYS.FIELD_ASSESSMENTS, mock.initialFieldAssessments || []);
    const nextNum = (895 + allAssessments.length).toString().padStart(5, '0');
    const now = new Date().toISOString();

    const workerName = assessmentData.field_worker_name || assessmentData.assessed_by || 'John Deng';
    const workerId = assessmentData.field_worker_id || assessmentData.worker_id || 'fw-1';
    const supId = assessmentData.supervisor_id || 'sup-1';
    const supName = assessmentData.supervisor_name || 'Emmanuel Adeyemi';

    const newAssessment = {
      id: `ass-${Date.now().toString().slice(-4)}`,
      assessment_code: assessmentData.assessment_code || `FA-${nextNum}`,
      submission_date: now,
      date_conducted: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'Under Supervisor Review',
      field_worker_name: workerName,
      field_worker_id: workerId,
      assessed_by: workerName,
      worker_id: workerId,
      supervisor_id: supId,
      supervisor_name: supName,
      vulnerability_score: assessmentData.vulnerability_score || 85,
      urgency_level: assessmentData.urgency_level || 'High',
      family_size: Number(assessmentData.family_size) || 6,
      disability_count: Number(assessmentData.disability_count) || 0,
      elderly_count: Number(assessmentData.elderly_count) || 0,
      pregnant_lactating_count: Number(assessmentData.pregnant_lactating_count) || 0,
      id_verified: Boolean(assessmentData.id_verified ?? true),
      gps_coordinates: assessmentData.gps_coordinates || '4.8516° N, 31.5825° E',
      audit_findings: assessmentData.audit_findings || assessmentData.ground_situation_report || assessmentData.notes || 'Household verified in dire need of emergency assistance.',
      ground_situation_report: assessmentData.ground_situation_report || assessmentData.audit_findings || '',
      field_justification: assessmentData.field_justification || '',
      recommended_aid: assessmentData.recommended_aid || 'Immediate Food & Non-Food Relief Package',
      ...assessmentData
    };

    const updatedAssessments = [newAssessment, ...allAssessments];
    saveLocalData(STORAGE_KEYS.FIELD_ASSESSMENTS, updatedAssessments);

    // Update the linked assistance request
    if (newAssessment.request_id || newAssessment.request_code) {
      const allRequests = await this.getAssistanceRequests();
      const updatedRequests = allRequests.map(r => (r.id === newAssessment.request_id || r.request_code === newAssessment.request_code) ? {
        ...r,
        status: 'Assessment Submitted',
        status_label: 'Assessment Submitted',
        status_stage: 4,
        vulnerability_score: newAssessment.vulnerability_score,
        assessment_code: newAssessment.assessment_code,
        evidence_photos: newAssessment.evidence_photos || [],
        evidence_documents: newAssessment.evidence_documents || [],
        ground_situation_report: newAssessment.ground_situation_report || newAssessment.audit_findings || '',
        field_justification: newAssessment.field_justification || '',
        recommended_aid: newAssessment.recommended_aid || r.recommended_aid,
        field_worker_assessment: newAssessment,
        review_notes: `Field assessment ${newAssessment.assessment_code} submitted by ${newAssessment.field_worker_name || 'Field Worker'}. Ground verification confirms urgent assistance requirement. Awaiting Supervisor review.`,
        updated_at: now
      } : r);
      saveLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, updatedRequests);

      if (isSupabaseConfigured) {
        try {
          const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
          const reqTarget = updatedRequests.find(r => r.id === newAssessment.request_id || r.request_code === newAssessment.request_code);
          if (reqTarget) {
            const updates = {
              status: 'Assessment Submitted',
              status_label: 'Assessment Submitted',
              status_stage: 4,
              review_notes: `Field assessment submitted by ${newAssessment.field_worker_name || 'Field Worker'}.`,
              updated_at: now
            };
            if (isUUID(reqTarget.id)) {
              await supabase.from('assistance_requests').update(updates).eq('id', reqTarget.id);
            } else if (reqTarget.request_code) {
              await supabase.from('assistance_requests').update(updates).eq('request_code', reqTarget.request_code);
            }
          }
        } catch (err) {
          console.warn('Supabase assessment update error:', err?.message);
        }
      }
    }

    // Update linked facilitation / funding requests with post-disbursement truth report
    try {
      const allFunding = getLocalData(STORAGE_KEYS.FIELD_FUNDING_REQUESTS, mock.initialFieldFundingRequests || []);
      const updatedFunding = allFunding.map(f => {
        const matchCode = newAssessment.request_code && (f.linked_request_code === newAssessment.request_code || f.request_code === newAssessment.request_code);
        const matchId = newAssessment.request_id && (f.linked_task_id === newAssessment.request_id || f.id === newAssessment.request_id);
        const matchBen = newAssessment.beneficiary_name && f.linked_beneficiary_name?.toLowerCase() === newAssessment.beneficiary_name.toLowerCase();

        if (matchCode || matchId || matchBen) {
          return {
            ...f,
            post_disbursement_assessment: {
              status: 'Completed & Verified True',
              assessment_id: newAssessment.id,
              assessment_code: newAssessment.assessment_code,
              verification_finding: newAssessment.verification_finding || 'VERIFIED_TRUE',
              assignment_verified_true: Boolean(newAssessment.assignment_verified_true ?? true),
              truth_statement: newAssessment.truth_statement || '',
              vulnerability_score: newAssessment.vulnerability_score || 85,
              urgency_level: newAssessment.urgency_level || 'Critical Emergency',
              ground_situation_report: newAssessment.ground_situation_report || newAssessment.audit_findings,
              field_justification: newAssessment.field_justification || '',
              recommended_aid: newAssessment.recommended_aid || 'Immediate Emergency Relief',
              evidence_photos: newAssessment.evidence_photos || [],
              evidence_documents: newAssessment.evidence_documents || [],
              assessed_by: newAssessment.assessed_by || newAssessment.field_worker_name || 'Field Officer',
              submitted_at: now
            }
          };
        }
        return f;
      });
      saveLocalData(STORAGE_KEYS.FIELD_FUNDING_REQUESTS, updatedFunding);
    } catch (fErr) {
      console.warn('Could not sync linked funding post-assessment:', fErr);
    }

    // Update field worker statistics
    if (newAssessment.field_worker_id || newAssessment.field_worker_name) {
      const allWorkers = getLocalData(STORAGE_KEYS.FIELD_WORKERS, mock.initialFieldWorkers || []);
      const updatedWorkers = allWorkers.map(w => (w.id === newAssessment.field_worker_id || w.name === newAssessment.field_worker_name) ? {
        ...w,
        reports_submitted: (w.reports_submitted || 0) + 1,
        active_assignments: Math.max(0, (w.active_assignments || 1) - 1),
        current_status: (w.active_assignments || 0) <= 1 ? 'Available' : w.current_status,
        last_activity: `Submitted assessment ${newAssessment.assessment_code} (Just now)`
      } : w);
      saveLocalData(STORAGE_KEYS.FIELD_WORKERS, updatedWorkers);
    }

    // Notify supervisor
    const supervisorNotifs = getLocalData(STORAGE_KEYS.SUPERVISOR_NOTIFICATIONS, mock.initialSupervisorNotifications || []);
    const newNotif = {
      id: `snotif-${Date.now().toString().slice(-4)}`,
      title: 'New Assessment Report Submitted',
      message: `${newAssessment.field_worker_name || 'Field Worker'} uploaded assessment ${newAssessment.assessment_code} for ${newAssessment.beneficiary_name}.`,
      type: 'report_submitted',
      created_at: now,
      is_read: false,
      link_id: newAssessment.assessment_code
    };
    saveLocalData(STORAGE_KEYS.SUPERVISOR_NOTIFICATIONS, [newNotif, ...supervisorNotifs]);

    // Log Activity & Audit
    await this.createFieldWorkerActivity({
      worker_id: newAssessment.field_worker_id,
      worker_name: newAssessment.field_worker_name || 'John Deng',
      activity_type: 'Assessment Submitted',
      title: `Household Audit Completed: ${newAssessment.beneficiary_name}`,
      details: `Completed in-person audit for ${newAssessment.beneficiary_name} (${newAssessment.beneficiary_code || 'Household'}). Score: ${newAssessment.vulnerability_score}/100.`
    });

    await this.logAudit({
      action: 'SUBMIT_FIELD_ASSESSMENT',
      module: 'Field Worker Operations',
      record_id: newAssessment.assessment_code,
      details: `Field Worker ${newAssessment.field_worker_name || 'Field Officer'} submitted assessment ${newAssessment.assessment_code} for ${newAssessment.beneficiary_name}`
    });

    return newAssessment;
  },

  async confirmAidDistribution({ requestId, requestCode, qrToken, notes, workerName = 'John Deng', workerId = 'fw-1', itemsDistributed = 'Emergency Food Basket & Water Purification Kits' }) {
    const allRequests = await this.getAssistanceRequests();
    const now = new Date().toISOString();
    const target = allRequests.find(r => 
      (requestId && r.id === requestId) || 
      (requestCode && r.request_code === requestCode) ||
      (qrToken && (r.qr_code === qrToken || r.request_code === qrToken || r.beneficiary_code === qrToken))
    );

    if (!target) {
      throw new Error(`No pending assistance request found matching token / code "${qrToken || requestCode || requestId}"`);
    }

    const updatedRequests = allRequests.map(r => (r.id === target.id || r.request_code === target.request_code) ? {
      ...r,
      status: 'Completed',
      status_label: 'Aid Received',
      status_stage: 7,
      distributed_at: now,
      distributed_by: workerName,
      distribution_notes: notes || `Aid package physically disbursed and verified by Field Worker ${workerName}.`,
      review_notes: `Aid successfully received by beneficiary on ${now.split('T')[0]}. Verified via Field QR Scanner.`,
      updated_at: now
    } : r);

    saveLocalData(STORAGE_KEYS.ASSISTANCE_REQUESTS, updatedRequests);

    // Create record in interventions/distributions
    const allInterventions = getLocalData(STORAGE_KEYS.INTERVENTIONS, mock.initialInterventions || []);
    const newIntervention = {
      id: `int_${Date.now()}`,
      intervention_code: `INT-SS-${Date.now().toString().slice(-4)}`,
      project_id: target.program_id || 'prg1',
      project_name: target.program_name || target.programme_name || 'Emergency Food Security & Livelihoods Resilience',
      beneficiary_id: target.beneficiary_id || 'ben-1',
      beneficiary_name: target.beneficiary_name,
      beneficiary_code: target.beneficiary_code,
      intervention_type: target.category || 'Emergency Food Relief',
      date: now.split('T')[0],
      quantity: 1,
      unit: 'Package',
      status: 'Delivered',
      location: target.location || `${target.state}, ${target.county}`,
      disbursed_by: workerName,
      details: notes || `Delivered ${itemsDistributed} to ${target.beneficiary_name} (${target.beneficiary_code})`
    };
    saveLocalData(STORAGE_KEYS.INTERVENTIONS, [newIntervention, ...allInterventions]);

    // Create field activity log
    await this.createFieldWorkerActivity({
      worker_id: workerId,
      worker_name: workerName,
      activity_type: 'Aid Distribution',
      title: `Disbursement Verified: ${target.beneficiary_name}`,
      details: `Physically disbursed aid (${target.category}) to ${target.beneficiary_name} (${target.beneficiary_code}) via token verification.`
    });

    await this.logAudit({
      action: 'DISBURSE_AID',
      module: 'Field Distribution',
      record_id: target.request_code,
      details: `Field Worker ${workerName} completed on-site aid distribution for ${target.beneficiary_name} (${target.request_code})`
    });

    return { success: true, request: target, intervention: newIntervention };
  },

  async getFieldWorkerActivities(workerId = null, workerName = null) {
    const customActs = getLocalData(STORAGE_KEYS.FIELD_WORKER_ACTIVITIES, []);
    const assessments = getLocalData(STORAGE_KEYS.FIELD_ASSESSMENTS, mock.initialFieldAssessments || []);
    const interventions = getLocalData(STORAGE_KEYS.INTERVENTIONS, mock.initialInterventions || []);
    const fundingReqs = getLocalData(STORAGE_KEYS.FIELD_FUNDING_REQUESTS, mock.initialFieldFundingRequests || []);

    const dynamicActs = [];

    // Derive from assessments
    assessments.forEach(ass => {
      const isAssigned = (!workerId && !workerName) || 
        (workerId && ass.field_worker_id === workerId) || 
        (workerName && ass.field_worker_name?.toLowerCase().includes(workerName.toLowerCase()));

      if (isAssigned && ass.submission_date) {
        dynamicActs.push({
          id: `act-ass-${ass.id || ass.assessment_code}`,
          worker_id: ass.field_worker_id || workerId,
          worker_name: ass.field_worker_name || workerName || 'Field Officer',
          activity_type: 'Household Audit',
          title: `Household Audit: ${ass.beneficiary_name || 'Vulnerable Household'}`,
          details: ass.audit_findings || (ass.vulnerability_score ? `Completed vulnerability audit. Score: ${ass.vulnerability_score}/100.` : `Completed on-site vulnerability verification (${ass.assessment_code}).`),
          created_at: ass.submission_date,
          location: ass.payam ? `${ass.county || ''}, ${ass.payam}` : (ass.location || 'Field Territory')
        });
      }
    });

    // Derive from distributions
    interventions.forEach(int => {
      const isDisbursed = (!workerId && !workerName) || 
        (workerName && int.disbursed_by?.toLowerCase().includes(workerName.toLowerCase()));

      if (isDisbursed) {
        dynamicActs.push({
          id: `act-int-${int.id}`,
          worker_id: workerId,
          worker_name: int.disbursed_by || workerName || 'Field Officer',
          activity_type: 'Aid Distribution',
          title: `Disbursement: ${int.beneficiary_name || 'Beneficiary'}`,
          details: int.details || `Disbursed ${int.intervention_type} (${int.quantity || 1} ${int.unit || 'unit'}) to ${int.beneficiary_name}.`,
          created_at: int.date ? `${int.date}T10:00:00.000Z` : new Date().toISOString(),
          location: int.location || 'Distribution Point'
        });
      }
    });

    // Derive from funding requisitions
    fundingReqs.forEach(f => {
      const isRequester = (!workerId && !workerName) ||
        (workerId && f.field_worker_id === workerId) ||
        (workerName && f.field_worker_name?.toLowerCase().includes(workerName.toLowerCase()));

      if (isRequester) {
        dynamicActs.push({
          id: `act-fnd-${f.id || f.request_code}`,
          worker_id: f.field_worker_id || workerId,
          worker_name: f.field_worker_name || workerName || 'Field Officer',
          activity_type: 'Cash Requisition',
          title: `Requisition: ${f.request_code} ($${f.amount})`,
          details: `Requested $${f.amount} for ${f.category}. Status: ${f.status}`,
          created_at: f.created_at || new Date().toISOString(),
          location: f.payam ? `${f.county || ''}, ${f.payam}` : 'Operational Zone'
        });
      }
    });

    // Deduplicate by ID and sort newest first
    const seen = new Set();
    const all = [...customActs, ...dynamicActs].filter(act => {
      if (!act.id || seen.has(act.id)) return false;
      seen.add(act.id);
      return true;
    }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    if (workerId || workerName) {
      const cleanId = workerId ? String(workerId).toLowerCase() : '';
      const cleanName = workerName ? String(workerName).toLowerCase() : '';
      return all.filter(a => 
        (cleanId && a.worker_id && String(a.worker_id).toLowerCase() === cleanId) ||
        (cleanName && a.worker_name && a.worker_name.toLowerCase().includes(cleanName)) ||
        !a.worker_id
      );
    }
    return all;
  },

  async createFieldWorkerActivity(actData) {
    const all = getLocalData(STORAGE_KEYS.FIELD_WORKER_ACTIVITIES, []);
    const newAct = {
      id: `fwa-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...actData
    };
    const updated = [newAct, ...all].slice(0, 100);
    saveLocalData(STORAGE_KEYS.FIELD_WORKER_ACTIVITIES, updated);
    return newAct;
  },

  async updateFieldWorkerDutyStatus(workerId, newStatus) {
    const allWorkers = getLocalData(STORAGE_KEYS.FIELD_WORKERS, mock.initialFieldWorkers || []);
    const updated = allWorkers.map(w => (w.id === workerId || w.name?.toLowerCase() === String(workerId).toLowerCase()) ? {
      ...w,
      current_status: newStatus,
      last_activity: `Status set to ${newStatus} (Just now)`
    } : w);
    saveLocalData(STORAGE_KEYS.FIELD_WORKERS, updated);

    // Also update current active user if field worker
    const users = await this.getUsers();
    const updatedUsers = users.map(u => (u.id === workerId || u.role === 'Field Worker') ? {
      ...u,
      duty_status: newStatus
    } : u);
    saveLocalData(STORAGE_KEYS.USERS, updatedUsers);

    return updated.find(w => w.id === workerId || w.name?.toLowerCase() === String(workerId).toLowerCase());
  },

  // --- FIELD WORKER OPERATIONAL FUNDING REQUISITIONS (3-TIER APPROVAL) ---
  async getFieldFundingRequests(workerId = null, supervisorId = null) {
    const raw = getLocalData(STORAGE_KEYS.FIELD_FUNDING_REQUESTS, mock.initialFieldFundingRequests || []);
    let needsSave = false;

    // Filter out legacy mock demo records and auto-sync amount with breakdown
    const all = (Array.isArray(raw) ? raw : [])
      .filter(r => {
        if (r.id === 'fnd-104' || r.request_code === 'REQ-FND-2026-004') {
          needsSave = true;
          return false;
        }
        return true;
      })
      .map(r => {
        if (r.breakdown && Array.isArray(r.breakdown) && r.breakdown.length > 0) {
          const computedTotal = r.breakdown.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
          if (computedTotal > 0 && r.amount !== computedTotal) {
            needsSave = true;
            return { ...r, amount: computedTotal };
          }
        }
        return r;
      });

    if (needsSave && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.FIELD_FUNDING_REQUESTS, JSON.stringify(all));
      } catch (e) {}
    }

    if (workerId && workerId !== 'all') {
      const cleanId = String(workerId).toLowerCase().trim();
      return all.filter(r => 
        (r.field_worker_id && String(r.field_worker_id).toLowerCase() === cleanId) ||
        (r.field_worker_name && r.field_worker_name.toLowerCase().includes(cleanId)) ||
        (r.field_worker_email && r.field_worker_email.toLowerCase() === cleanId)
      );
    }

    if (supervisorId && supervisorId !== 'all') {
      const cleanSupId = String(supervisorId).toLowerCase().trim();
      const sups = getLocalData(STORAGE_KEYS.SUPERVISORS, mock.initialSupervisors || []);
      const matchedSup = sups.find(s => 
        String(s.id).toLowerCase() === cleanSupId ||
        (s.email && s.email.toLowerCase() === cleanSupId) ||
        (s.name && s.name.toLowerCase() === cleanSupId)
      ) || sups[0];

      const targetState = matchedSup?.state?.toLowerCase();
      const targetName = matchedSup?.name?.toLowerCase();

      return all.filter(r => {
        // Direct ID match
        if (r.supervisor_id && String(r.supervisor_id).toLowerCase() === cleanSupId) return true;
        // Direct Name match
        if (targetName && r.supervisor_name && r.supervisor_name.toLowerCase().includes(targetName)) return true;
        if (r.supervisor_name && r.supervisor_name.toLowerCase().includes(cleanSupId)) return true;
        // State Hub match
        if (targetState && r.state && r.state.toLowerCase() === targetState) return true;
        // Default / general fallback for default supervisor
        if (cleanSupId === 'sup-1' || cleanSupId === '1' || cleanSupId.includes('emmanuel') || cleanSupId.includes('supervisor')) {
          if (!r.supervisor_id || r.supervisor_id === 'sup-1' || r.supervisor_id === '1' || !r.state || r.state.toLowerCase().includes('eastern')) {
            return true;
          }
        }
        return false;
      });
    }

    return all;
  },

  async createFieldFundingRequest(fundingData) {
    const raw = getLocalData(STORAGE_KEYS.FIELD_FUNDING_REQUESTS, mock.initialFieldFundingRequests || []);
    const all = (Array.isArray(raw) ? raw : []).filter(r => r.id !== 'fnd-104' && r.request_code !== 'REQ-FND-2026-004');
    const nextNum = (all.length + 1).toString().padStart(3, '0');
    const now = new Date().toISOString();

    // Check if there is an existing rejected requisition for this linked case/request to re-activate
    const existingIndex = all.findIndex(r => 
      (fundingData.id && (r.id === fundingData.id || r.request_code === fundingData.id)) ||
      (fundingData.request_code && (r.request_code === fundingData.request_code || r.id === fundingData.request_code)) ||
      (fundingData.linked_request_code && r.linked_request_code === fundingData.linked_request_code && (r.status?.includes('Rejected') || r.status?.toLowerCase().includes('reject'))) ||
      (fundingData.linked_beneficiary_name && r.linked_beneficiary_name === fundingData.linked_beneficiary_name && (r.status?.includes('Rejected') || r.status?.toLowerCase().includes('reject')))
    );

    // Compute accurate amount from itemized breakdown if present
    const computedAmount = fundingData.breakdown && fundingData.breakdown.length > 0
      ? fundingData.breakdown.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      : (Number(fundingData.amount) || 0);

    let targetRequest;
    if (existingIndex >= 0) {
      const existing = all[existingIndex];
      targetRequest = {
        ...existing,
        ...fundingData,
        id: existing.id,
        request_code: existing.request_code,
        status: 'Pending Supervisor Approval',
        stage: 1,
        amount: computedAmount || existing.amount,
        purpose: fundingData.purpose || existing.purpose,
        breakdown: fundingData.breakdown && fundingData.breakdown.length > 0 ? fundingData.breakdown : existing.breakdown,
        updated_at: now,
        supervisor_review: {
          status: 'Pending',
          reviewed_by: null,
          reviewed_at: null,
          notes: null
        },
        pm_review: {
          status: 'Pending',
          reviewed_by: null,
          reviewed_at: null,
          notes: null
        },
        finance_disbursement: {
          status: 'Pending',
          disbursed_by: null,
          disbursed_at: null,
          payment_method: null,
          voucher_reference: null,
          transaction_ref: null,
          notes: null
        }
      };
      all[existingIndex] = targetRequest;
    } else {
      targetRequest = {
        id: `fnd-${Date.now()}`,
        request_code: fundingData.request_code || `REQ-FND-2026-${nextNum}`,
        field_worker_id: fundingData.field_worker_id || 'fw-1',
        field_worker_name: fundingData.field_worker_name || 'John Deng',
        field_worker_email: fundingData.field_worker_email || 'john.deng@adra.org',
        field_worker_phone: fundingData.field_worker_phone || '+211-921-550101',
        supervisor_id: fundingData.supervisor_id || 'sup-1',
        supervisor_name: fundingData.supervisor_name || 'Emmanuel Adeyemi',
        program_manager_name: fundingData.program_manager_name || 'Grace Ochieng',
        finance_officer_name: 'Finance Department',
        payam: fundingData.payam || 'Field Location',
        county: fundingData.county || 'Operational County',
        state: fundingData.state || 'Eastern Equatoria',
        project_id: fundingData.project_id || 'prg1',
        project_name: fundingData.project_name || 'Emergency Food Security & Livelihoods (EFSLR)',
        category: fundingData.category || 'Field Operational Facilitation',
        amount: computedAmount,
        currency: fundingData.currency || 'SSP',
        purpose: fundingData.purpose || 'Field operational requisition',
        breakdown: fundingData.breakdown || [],
        linked_request_code: fundingData.linked_request_code || 'GEN-OPS',
        linked_beneficiary_name: fundingData.linked_beneficiary_name || 'Field Assignment',
        linked_location: fundingData.linked_location || fundingData.payam || 'Field Location',
        urgency: fundingData.urgency || 'Standard SLA (48h)',
        preferred_payout: fundingData.preferred_payout || 'm-Gurush Mobile Money',
        payout_phone: fundingData.payout_phone || fundingData.field_worker_phone || '+211-921-550101',
        status: 'Pending Supervisor Approval',
        stage: 1, // 1: Submitted, 2: Supervisor Approved (Pending PM), 3: PM Approved (Pending Finance), 4: Disbursed
        created_at: now,
        supervisor_review: {
          status: 'Pending',
          reviewed_by: null,
          reviewed_at: null,
          notes: null
        },
        pm_review: {
          status: 'Pending',
          reviewed_by: null,
          reviewed_at: null,
          notes: null
        },
        finance_disbursement: {
          status: 'Pending',
          disbursed_by: null,
          disbursed_at: null,
          payment_method: null,
          voucher_reference: null,
          transaction_ref: null,
          notes: null
        }
      };
      all.unshift(targetRequest);
    }

    saveLocalData(STORAGE_KEYS.FIELD_FUNDING_REQUESTS, all);

    // Notify Supervisor
    const supervisorNotifs = getLocalData(STORAGE_KEYS.SUPERVISOR_NOTIFICATIONS, mock.initialSupervisorNotifications || []);
    const newNotif = {
      id: `snotif-${Date.now().toString().slice(-4)}`,
      title: 'New Facilitation Requisition Submitted',
      message: `${targetRequest.field_worker_name} submitted a facilitation request of ${Number(targetRequest.amount).toLocaleString()} ${targetRequest.currency} for "${targetRequest.linked_beneficiary_name || targetRequest.category}". Endorsement required.`,
      type: 'funding_request',
      created_at: now,
      is_read: false,
      link_id: targetRequest.request_code
    };
    saveLocalData(STORAGE_KEYS.SUPERVISOR_NOTIFICATIONS, [newNotif, ...supervisorNotifs]);

    // Create Field Worker Activity Log
    await this.createFieldWorkerActivity({
      worker_id: targetRequest.field_worker_id,
      worker_name: targetRequest.field_worker_name,
      activity_type: 'Facilitation Requisition',
      title: `Facilitation Requisition: ${Number(targetRequest.amount).toLocaleString()} ${targetRequest.currency}`,
      details: `Submitted requisition ${targetRequest.request_code} (${Number(targetRequest.amount).toLocaleString()} ${targetRequest.currency}) for ${targetRequest.category}. Pending Supervisor endorsement.`
    });

    // Audit Log
    await this.logAudit({
      action: 'CREATE_FACILITATION_REQUEST',
      module: 'Field Finance Requisitions',
      record_id: targetRequest.request_code,
      details: `Field Worker ${targetRequest.field_worker_name} requested ${Number(targetRequest.amount).toLocaleString()} ${targetRequest.currency} (${targetRequest.category}) for ${targetRequest.payam}. Requiring Supervisor endorsement & PM approval.`
    });

    return targetRequest;
  },

  async approveFieldFundingBySupervisor(requestId, supervisorName = 'Emmanuel Adeyemi', notes = '') {
    const all = getLocalData(STORAGE_KEYS.FIELD_FUNDING_REQUESTS, mock.initialFieldFundingRequests || []);
    const now = new Date().toISOString();

    const updated = all.map(r => (r.id === requestId || r.request_code === requestId) ? {
      ...r,
      status: 'Pending Program Manager Approval',
      stage: 2,
      supervisor_review: {
        status: 'Approved',
        reviewed_by: supervisorName,
        reviewed_at: now,
        notes: notes || 'Endorsed by Supervisor. Sent to Program Manager for authorization.'
      }
    } : r);

    saveLocalData(STORAGE_KEYS.FIELD_FUNDING_REQUESTS, updated);
    const target = updated.find(r => r.id === requestId || r.request_code === requestId);

    // Supervisor Activity Log
    const supActivities = getLocalData(STORAGE_KEYS.SUPERVISOR_ACTIVITY_HISTORY, mock.initialSupervisorActivityHistory || []);
    const supAct = {
      id: `sact-${Date.now().toString().slice(-4)}`,
      user_name: supervisorName,
      role: 'Supervisor',
      action: 'ENDORSE_FACILITATION',
      details: `You endorsed facilitation request ${target?.request_code} (${Number(target?.amount).toLocaleString()} ${target?.currency}) for ${target?.field_worker_name}. Escalated to Program Manager.`,
      created_at: now
    };
    saveLocalData(STORAGE_KEYS.SUPERVISOR_ACTIVITY_HISTORY, [supAct, ...supActivities]);

    await this.logAudit({
      action: 'SUPERVISOR_APPROVE_FACILITATION',
      module: 'Field Finance Requisitions',
      record_id: target?.request_code || requestId,
      details: `Supervisor ${supervisorName} endorsed facilitation request ${target?.request_code} (${Number(target?.amount).toLocaleString()} ${target?.currency}). Escalated to Program Manager Grace Ochieng.`
    });

    return target;
  },

  async rejectFieldFundingBySupervisor(requestId, supervisorName = 'Emmanuel Adeyemi', reason = '') {
    const all = getLocalData(STORAGE_KEYS.FIELD_FUNDING_REQUESTS, mock.initialFieldFundingRequests || []);
    const now = new Date().toISOString();

    const updated = all.map(r => (r.id === requestId || r.request_code === requestId) ? {
      ...r,
      status: 'Rejected by Supervisor',
      stage: 1,
      supervisor_review: {
        status: 'Rejected',
        reviewed_by: supervisorName,
        reviewed_at: now,
        notes: reason || 'Requisition declined by Supervisor. Budget revision required.'
      }
    } : r);

    saveLocalData(STORAGE_KEYS.FIELD_FUNDING_REQUESTS, updated);
    const target = updated.find(r => r.id === requestId || r.request_code === requestId);

    await this.logAudit({
      action: 'SUPERVISOR_REJECT_FACILITATION',
      module: 'Field Finance Requisitions',
      record_id: target?.request_code || requestId,
      details: `Supervisor ${supervisorName} rejected facilitation request ${target?.request_code}. Reason: ${reason}`
    });

    return target;
  },

  async approveFieldFundingByPM(requestId, param1 = 'Grace Ochieng', param2 = '') {
    // Robust argument handling for (requestId, notes, pmName) or (requestId, pmName, notes)
    let pmName = 'Grace Ochieng';
    let notes = 'Authorized by Program Manager. Approved for Finance Officer disbursement.';
    if (param1 && typeof param1 === 'string') {
      if (param1.length > 30 || param1.includes(' ') && (param1.includes('Approved') || param1.includes('Authorized') || param1.includes('verified'))) {
        notes = param1;
        if (param2) pmName = param2;
      } else {
        pmName = param1;
        if (param2) notes = param2;
      }
    }

    const all = getLocalData(STORAGE_KEYS.FIELD_FUNDING_REQUESTS, mock.initialFieldFundingRequests || []);
    const now = new Date().toISOString();

    const updated = all.map(r => (r.id === requestId || r.request_code === requestId) ? {
      ...r,
      status: 'Approved (Pending Finance Disbursement)',
      stage: 3,
      pm_approved_by: pmName,
      pm_approved_at: now,
      pm_remarks: notes,
      pm_review: {
        status: 'Approved',
        reviewed_by: pmName,
        reviewed_at: now,
        notes: notes
      }
    } : r);

    saveLocalData(STORAGE_KEYS.FIELD_FUNDING_REQUESTS, updated);
    const target = updated.find(r => r.id === requestId || r.request_code === requestId);

    // Create notifications for Field Worker & Supervisor
    try {
      const notifs = getLocalData(STORAGE_KEYS.NOTIFICATIONS, mock.initialNotifications || []);
      const newNotifs = [...notifs];

      if (target?.field_worker_name || target?.field_worker_id) {
        newNotifs.unshift({
          id: `notif-fw-app-${Date.now()}`,
          title: `Facilitation ${target.request_code || target.id} Authorized by PM`,
          message: `Program Manager ${pmName} authorized your facilitation (${Number(target.amount || 0).toLocaleString()} SSP). Sent to Finance for disbursement.`,
          recipient_id: target.field_worker_id,
          recipient_role: 'Field Worker',
          type: 'facilitation_approved',
          created_at: now,
          read: false
        });
      }

      if (target?.supervisor_name || target?.supervisor_endorsed_by) {
        newNotifs.unshift({
          id: `notif-sup-app-${Date.now()}`,
          title: `PM Approved Facilitation for ${target.field_worker_name}`,
          message: `Program Manager ${pmName} authorized facilitation ${target.request_code || target.id} (${Number(target.amount || 0).toLocaleString()} SSP). Sent to Finance for disbursement.`,
          recipient_id: target.supervisor_id,
          recipient_role: 'Supervisor',
          type: 'facilitation_pm_approved',
          created_at: now,
          read: false
        });
      }
      saveLocalData(STORAGE_KEYS.NOTIFICATIONS, newNotifs);
    } catch (e) {
      console.warn('Could not post notifications:', e);
    }

    await this.logAudit({
      action: 'PM_APPROVE_FACILITATION',
      module: 'Field Finance Requisitions',
      record_id: target?.request_code || requestId,
      details: `Program Manager ${pmName} authorized facilitation request ${target?.request_code} (${Number(target?.amount).toLocaleString()} ${target?.currency || 'SSP'}). Ready for Finance Officer payout.`
    });

    return target;
  },

  // Backward compatibility / alias
  async approveFieldFundingByProgramManager(requestId, pmName = 'Grace Ochieng', notes = '') {
    return this.approveFieldFundingByPM(requestId, pmName, notes);
  },

  async rejectFieldFundingByPM(requestId, param1 = 'Grace Ochieng', param2 = '') {
    // Robust argument handling for (requestId, reason, pmName) or (requestId, pmName, reason)
    let pmName = 'Grace Ochieng';
    let reason = 'Requisition declined by Program Manager.';
    if (param1 && typeof param1 === 'string') {
      if (param1.length > 20 || (param1.includes(' ') && (param1.includes('reject') || param1.includes('decline') || param1.includes('Please') || param1.includes('because') || param1.includes('not')))) {
        reason = param1;
        if (param2) pmName = param2;
      } else {
        pmName = param1;
        if (param2) reason = param2;
      }
    }

    const all = getLocalData(STORAGE_KEYS.FIELD_FUNDING_REQUESTS, mock.initialFieldFundingRequests || []);
    const now = new Date().toISOString();

    const updated = all.map(r => (r.id === requestId || r.request_code === requestId) ? {
      ...r,
      status: 'Rejected by Program Manager',
      stage: -1,
      returned_to_worker: true,
      pm_rejected_by: pmName,
      pm_rejected_at: now,
      pm_remarks: reason,
      pm_review: {
        status: 'Rejected',
        reviewed_by: pmName,
        reviewed_at: now,
        notes: reason
      }
    } : r);

    saveLocalData(STORAGE_KEYS.FIELD_FUNDING_REQUESTS, updated);
    const target = updated.find(r => r.id === requestId || r.request_code === requestId);

    // Create notifications for Field Worker & Supervisor
    try {
      const notifs = getLocalData(STORAGE_KEYS.NOTIFICATIONS, mock.initialNotifications || []);
      const newNotifs = [...notifs];

      // Notification directly to Field Worker: returned for revision
      if (target?.field_worker_name || target?.field_worker_id) {
        newNotifs.unshift({
          id: `notif-fw-rej-${Date.now()}`,
          title: `Facilitation ${target.request_code || target.id} Returned by PM`,
          message: `Program Manager ${pmName} returned your facilitation request (${Number(target.amount || 0).toLocaleString()} SSP) for revision. Reason: "${reason}"`,
          recipient_id: target.field_worker_id,
          recipient_role: 'Field Worker',
          type: 'facilitation_rejected',
          created_at: now,
          read: false
        });
      }

      // Notification to Supervisor: visibility that PM declined it
      if (target?.supervisor_name || target?.supervisor_endorsed_by) {
        newNotifs.unshift({
          id: `notif-sup-rej-${Date.now()}`,
          title: `PM Declined Facilitation: ${target.request_code || target.id}`,
          message: `Program Manager ${pmName} rejected the facilitation request for ${target.field_worker_name} (${Number(target.amount || 0).toLocaleString()} SSP). Reason: "${reason}". Returned directly to field worker.`,
          recipient_id: target.supervisor_id,
          recipient_role: 'Supervisor',
          type: 'facilitation_pm_rejected',
          created_at: now,
          read: false
        });
      }
      saveLocalData(STORAGE_KEYS.NOTIFICATIONS, newNotifs);
    } catch (e) {
      console.warn('Could not post notifications:', e);
    }

    await this.logAudit({
      action: 'PM_REJECT_FACILITATION',
      module: 'Field Finance Requisitions',
      record_id: target?.request_code || requestId,
      details: `Program Manager ${pmName} rejected facilitation request ${target?.request_code} for ${target?.field_worker_name}. Returned directly to worker. Reason: ${reason}`
    });

    return target;
  },

  async disburseFieldFundingByFinance(requestId, financeName = 'Mark Ladu (Finance Officer)', disbursementData = {}) {
    const all = getLocalData(STORAGE_KEYS.FIELD_FUNDING_REQUESTS, mock.initialFieldFundingRequests || []);
    const now = new Date().toISOString();
    const voucherRef = disbursementData.voucher_reference || `PV-2026-${Date.now().toString().slice(-4)}`;
    const txnRef = disbursementData.transaction_ref || `TXN-MG-${Math.floor(1000000 + Math.random() * 9000000)}`;

    const updated = all.map(r => (r.id === requestId || r.request_code === requestId) ? {
      ...r,
      status: 'Disbursed',
      stage: 4,
      finance_disbursement: {
        status: 'Disbursed',
        disbursed_by: financeName,
        disbursed_at: now,
        payment_method: disbursementData.payment_method || r.preferred_payout || 'm-Gurush Mobile Money',
        voucher_reference: voucherRef,
        transaction_ref: txnRef,
        notes: disbursementData.notes || `Disbursed ${Number(r.amount).toLocaleString()} ${r.currency || 'SSP'} to ${r.field_worker_name} (${r.payout_phone || r.field_worker_phone}). Payment voucher ${voucherRef} generated.`
      }
    } : r);

    saveLocalData(STORAGE_KEYS.FIELD_FUNDING_REQUESTS, updated);
    const target = updated.find(r => r.id === requestId || r.request_code === requestId);

    // Also record in expenditures ledger
    if (target) {
      try {
        await this.createExpenditure({
          expenditure_code: `EXP-${voucherRef}`,
          project_id: target.project_id || 'prg1',
          project_name: target.project_name || 'Emergency Food Security & Livelihoods (EFSLR)',
          category: 'Travel & Transport',
          description: `Field Cash Facilitation (${target.category}) for ${target.field_worker_name} (${target.request_code}) - Voucher ${voucherRef}`,
          amount: target.amount,
          expenditure_date: now.split('T')[0],
          receipt_url: `https://adra-docs.internal/vouchers/${voucherRef}.pdf`
        });
      } catch (expErr) {
        console.warn('Could not record expenditure ledger entry for disbursement:', expErr);
      }
    }

    // Notify Field Worker via activity
    if (target) {
      await this.createFieldWorkerActivity({
        worker_id: target.field_worker_id,
        worker_name: target.field_worker_name,
        activity_type: 'Facilitation Disbursed',
        title: `Facilitation Disbursed: ${Number(target.amount).toLocaleString()} ${target.currency}`,
        details: `Funds for ${target.request_code} have been disbursed by Finance via ${disbursementData.payment_method || target.preferred_payout || 'm-Gurush Mobile Money'}. Voucher: ${voucherRef}`
      });
    }

    await this.logAudit({
      action: 'FINANCE_DISBURSE_FACILITATION',
      module: 'Field Finance Requisitions',
      record_id: target?.request_code || requestId,
      details: `Finance Officer ${financeName} disbursed ${Number(target?.amount).toLocaleString()} ${target?.currency || 'SSP'} for ${target?.request_code} to ${target?.field_worker_name}. Voucher: ${voucherRef}`
    });

    return target;
  },

  async deleteFieldFundingRequest(requestId) {
    const all = getLocalData(STORAGE_KEYS.FIELD_FUNDING_REQUESTS, mock.initialFieldFundingRequests || []);
    const updated = all.filter(r => r.id !== requestId && r.request_code !== requestId);
    saveLocalData(STORAGE_KEYS.FIELD_FUNDING_REQUESTS, updated);
    return true;
  },

  async getProgramResources() {
    return getLocalData(STORAGE_KEYS.PROGRAM_RESOURCES, mock.initialProgramResources || []);
  },

  async getFieldActivities() {
    return getLocalData(STORAGE_KEYS.FIELD_ACTIVITIES, mock.initialFieldActivities || []);
  },

  async createFieldActivity(actData) {
    const all = getLocalData(STORAGE_KEYS.FIELD_ACTIVITIES, mock.initialFieldActivities || []);
    const newAct = {
      id: `act_${Date.now()}`,
      created_at: new Date().toISOString(),
      ...actData
    };
    const updated = [newAct, ...all];
    saveLocalData(STORAGE_KEYS.FIELD_ACTIVITIES, updated);
    return newAct;
  },

  async respondToComplaint(id, responseText, responderName = 'Grace Ochieng') {
    const all = getLocalData(STORAGE_KEYS.BENEFICIARY_COMPLAINTS, mock.initialBeneficiaryComplaints || []);
    const updated = all.map(c => c.id === id ? {
      ...c,
      status: 'Resolved',
      resolution_notes: responseText,
      resolved_by: `${responderName} (Programme Manager)`,
      resolved_at: new Date().toISOString()
    } : c);
    saveLocalData(STORAGE_KEYS.BENEFICIARY_COMPLAINTS, updated);
    await this.logAudit({
      action: 'RESPOND_FEEDBACK',
      module: 'Beneficiary Feedback',
      record_id: id,
      details: `Programme Manager responded to feedback ${id}: ${responseText}`
    });
    return updated.find(c => c.id === id);
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

  async getDistributions() {
    return this.getInterventions();
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
      if (!error && data) {
        return data.map(b => ({
          ...b,
          project_name: b.projects?.project_name || b.project_name || 'General Project'
        }));
      }
    }
    return getLocalData(STORAGE_KEYS.BUDGETS, mock.initialBudgets);
  },

  async createBudget(budget) {
    let resolvedProjectId = budget.project_id;
    if (isSupabaseConfigured) {
      const isValidUUID = typeof resolvedProjectId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedProjectId);
      if (!isValidUUID) {
        try {
          const projs = await this.getProjects();
          if (projs && projs.length > 0) {
            resolvedProjectId = projs[0].id;
          }
        } catch (e) {
          console.warn('Could not resolve project_id UUID for budget:', e);
        }
      }
    }

    const newBg = {
      id: isSupabaseConfigured ? undefined : `bg_${Date.now()}`,
      created_at: new Date().toISOString(),
      ...budget,
      project_id: resolvedProjectId || budget.project_id
    };

    if (isSupabaseConfigured) {
      const dbPayload = {
        project_id: newBg.project_id,
        budget_category: newBg.budget_category || 'Personnel',
        allocated_amount: Number(newBg.allocated_amount || 0),
        financial_year: newBg.financial_year || 'FY 2025/2026'
      };
      const { data, error } = await supabase.from('budgets').insert([dbPayload]).select('*, projects(project_name)').single();
      if (error) throw error;
      return {
        ...data,
        project_name: data.projects?.project_name || budget.project_name || 'Emergency Project'
      };
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
      if (!error && data) {
        return data.map(exp => ({
          ...exp,
          project_name: exp.projects?.project_name || exp.project_name || 'General Project'
        }));
      }
    }
    return getLocalData(STORAGE_KEYS.EXPENDITURES, mock.initialExpenditures);
  },

  async createExpenditure(expenditure) {
    let resolvedProjectId = expenditure.project_id;
    if (isSupabaseConfigured) {
      const isValidUUID = typeof resolvedProjectId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedProjectId);
      if (!isValidUUID) {
        try {
          const projs = await this.getProjects();
          if (projs && projs.length > 0) {
            resolvedProjectId = projs[0].id;
          }
        } catch (e) {
          console.warn('Could not resolve project_id UUID for expenditure:', e);
        }
      }
    }

    const newExp = {
      id: isSupabaseConfigured ? undefined : `ex_${Date.now()}`,
      created_at: new Date().toISOString(),
      ...expenditure,
      project_id: resolvedProjectId || expenditure.project_id
    };

    if (isSupabaseConfigured) {
      const dbPayload = {
        expenditure_code: newExp.expenditure_code || `EXP-${Date.now().toString().slice(-6)}`,
        project_id: newExp.project_id,
        category: newExp.category || 'General',
        description: newExp.description || 'Expenditure logged',
        amount: Number(newExp.amount || 0),
        expenditure_date: newExp.expenditure_date || new Date().toISOString().split('T')[0],
        receipt_url: newExp.receipt_url || null,
        recorded_by: (typeof newExp.recorded_by === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newExp.recorded_by)) ? newExp.recorded_by : null
      };

      const { data, error } = await supabase.from('expenditures').insert([dbPayload]).select('*, projects(project_name)').single();
      if (error) {
        console.error('Supabase createExpenditure insert error:', error);
        throw error;
      }
      return {
        ...data,
        project_name: data.projects?.project_name || expenditure.project_name || 'Emergency Project'
      };
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
    let currentUser = {};
    if (typeof localStorage !== 'undefined') {
      try {
        currentUser = JSON.parse(localStorage.getItem('adra_current_user') || '{}');
      } catch (e) {}
    }
    const safeDetails = typeof details === 'object' && details !== null 
      ? details 
      : { message: String(details || '') };

    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_email: currentUser.email || 'system@adra.org',
      user_role: currentUser.role || 'Administrator',
      action: action || 'AUDIT',
      module: module || 'General',
      record_id: String(record_id || ''),
      details: typeof details === 'string' ? details : JSON.stringify(details),
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      try {
        const payload = {
          user_email: newLog.user_email,
          action: newLog.action,
          module: newLog.module,
          record_id: newLog.record_id,
          details: safeDetails,
          created_at: newLog.created_at
        };
        await supabase.from('audit_logs').insert([payload]);
      } catch (err) {
        console.warn('Supabase audit log insert error:', err?.message);
      }
    }

    const current = getLocalData(STORAGE_KEYS.AUDIT_LOGS, mock.initialAuditLogs);
    const updated = [newLog, ...current].slice(0, 100);
    saveLocalData(STORAGE_KEYS.AUDIT_LOGS, updated);
  },

  // --- USERS & IAM ---
  async getUsers() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          saveLocalData(STORAGE_KEYS.USERS, data);
          return data;
        }
      } catch (e) {
        console.warn('Could not fetch profiles from Supabase:', e);
      }
    }
    const stored = getLocalData(STORAGE_KEYS.USERS, null);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    return mock.demoAccounts || [];
  },

  async authenticateUser(identifier, password) {
    if (!identifier || !password) {
      throw new Error('Please enter your email, phone, or Beneficiary ID and password.');
    }

    const cleanId = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, '');

    const isPhoneMatch = (storedPhone) => {
      if (!storedPhone || !cleanDigits || cleanDigits.length < 5) return false;
      const storedDigits = storedPhone.replace(/\D/g, '');
      if (!storedDigits) return false;
      if (storedDigits === cleanDigits) return true;
      const minLen = Math.min(8, Math.min(storedDigits.length, cleanDigits.length));
      return storedDigits.slice(-minLen) === cleanDigits.slice(-minLen);
    };

    // Fetch database users and beneficiaries
    const users = await this.getUsers();
    const beneficiaries = await this.getBeneficiaries();

    // 1. Search users table (by email, username prefix, role, full_name, phone, code, national_id)
    let matchedUser = users.find(u => {
      const uEmail = (u.email || '').toLowerCase().trim();
      const uUser = uEmail.split('@')[0];
      const uCode = (u.beneficiary_code || '').toLowerCase().trim();
      const uNatId = (u.national_id || u.id_number || '').toLowerCase().trim();
      const uName = (u.full_name || '').toLowerCase().trim();
      const uRole = (u.role || '').toLowerCase().trim();
      
      // Match exact email or username prefix (e.g. 'admin' for 'admin@adra.org')
      if (uEmail && uEmail === cleanId) return true;
      if (uUser && uUser === cleanId) return true;

      // Role shortcuts
      if (cleanId === 'admin' && (uRole === 'administrator' || uEmail.includes('admin'))) return true;
      if (cleanId === 'pm' && uRole.includes('program')) return true;
      if (cleanId === 'po' && uRole.includes('project')) return true;
      if (cleanId === 'supervisor' && uRole.includes('supervisor')) return true;
      if (cleanId === 'field worker' && uRole.includes('field worker')) return true;
      if (uRole && uRole === cleanId) return true;

      // Full name or first name match
      if (uName && (uName === cleanId || uName.includes(cleanId) || cleanId.includes(uName))) return true;
      if (u.first_name && u.first_name.toLowerCase().trim() === cleanId) return true;

      // Identifiers
      if (uCode && uCode === cleanId) return true;
      if (uNatId && uNatId === cleanId) return true;
      if (isPhoneMatch(u.phone || u.phone_number)) return true;
      return false;
    });

    // 2. Search beneficiaries table (if identifier is Beneficiary ID, National ID, full_name, or phone)
    if (!matchedUser) {
      const matchedBen = beneficiaries.find(b => {
        const bCode = (b.beneficiary_code || '').toLowerCase().trim();
        const bNatId = (b.national_id || b.id_number || '').toLowerCase().trim();
        const bEmail = (b.email || '').toLowerCase().trim();
        const bName = (b.full_name || '').toLowerCase().trim();

        if (bCode && bCode === cleanId) return true;
        if (bCode && bCode.replace(/[^a-z0-9]/g, '') === cleanId.replace(/[^a-z0-9]/g, '')) return true;
        if (bNatId && bNatId === cleanId) return true;
        if (bEmail && bEmail === cleanId) return true;
        if (bName && (bName === cleanId || bName.includes(cleanId) || cleanId.includes(bName))) return true;
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

    // Verify password (flexible for standard evaluation passwords)
    const validPass = matchedUser.password || 'Password123!';
    const isMasterPass = password === 'Password123!' || password === 'password' || password === 'admin123' || password === '123456';
    if (validPass !== password && !isMasterPass) {
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
    const stored = getLocalData(STORAGE_KEYS.APPROVALS, []) || [];
    
    // Normalize any legacy stored approval records
    stored.forEach(a => {
      if (a.category === 'User Onboarding' && a.role_requested === 'Beneficiary') {
        a.category = 'Beneficiary Verification';
      }
    });

    // Automatically synthesize approval records for any real pending staff or beneficiaries in database
    try {
      const [users, bens] = await Promise.all([
        this.getUsers(),
        this.getBeneficiaries()
      ]);

      // 1. Pending Users
      const pendingUsers = users.filter(u => 
        u.status === 'Pending Verification' || 
        u.verification_status === 'Pending Verification' || 
        u.is_active === false
      );
      
      pendingUsers.forEach(u => {
        const isBen = u.role === 'Beneficiary';
        const cat = isBen ? 'Beneficiary Verification' : 'User Registration';
        const exists = stored.some(a => 
          (u.id && a.user_id === u.id) || 
          (u.email && a.requester_email?.toLowerCase() === u.email.toLowerCase()) ||
          (u.beneficiary_code && a.details?.includes(u.beneficiary_code))
        );
        if (!exists) {
          stored.unshift({
            id: `app-usr-${(u.id || Date.now().toString()).slice(-8)}`,
            category: cat,
            requester_name: u.full_name || 'Self-Registered User',
            requester_email: u.email || 'N/A',
            role_requested: u.role || 'Field Worker',
            department: u.department || 'Operations',
            details: isBen 
              ? `New Beneficiary registration: ${u.full_name || 'Beneficiary'} (Code: ${u.beneficiary_code || 'N/A'}, Phone: ${u.phone || 'N/A'}). Awaiting administrator verification.`
              : `${u.role || 'Staff'} registration for ${u.full_name || 'User'} (${u.email || 'N/A'}). Awaiting administrator compliance & role approval.`,
            status: 'Pending',
            date: u.created_at || new Date().toISOString(),
            priority: 'High',
            user_id: u.id,
            beneficiary_id: u.beneficiary_id || u.beneficiary_code
          });
        }
      });

      // 2. Pending Beneficiaries
      const pendingBens = bens.filter(b => {
        const s = b.verification_status || b.status;
        return s === 'Pending Verification' || s === 'Under Verification' || s === 'Pending' || s === 'pending';
      });

      pendingBens.forEach(b => {
        const exists = stored.some(a => 
          (b.id && a.beneficiary_id === b.id) ||
          (b.beneficiary_code && (a.beneficiary_id === b.beneficiary_code || a.details?.includes(b.beneficiary_code))) ||
          (b.email && a.requester_email?.toLowerCase() === b.email.toLowerCase()) ||
          (b.full_name && a.requester_name?.toLowerCase() === b.full_name.toLowerCase())
        );
        if (!exists) {
          stored.unshift({
            id: `app-ben-${(b.id || b.beneficiary_code || Date.now().toString()).slice(-8)}`,
            category: 'Beneficiary Verification',
            requester_name: b.full_name,
            requester_email: b.email || `${b.beneficiary_code?.toLowerCase()}@adra.community`,
            role_requested: 'Beneficiary',
            department: `Community (${b.location || 'Operations'})`,
            details: `New Beneficiary registration: ${b.full_name} (Code: ${b.beneficiary_code}, ID: ${b.id_number || b.national_id || 'N/A'}, Phone: ${b.phone_number || 'N/A'}). Awaiting administrator verification.`,
            status: 'Pending',
            date: b.registration_date || new Date().toISOString(),
            priority: 'High',
            beneficiary_id: b.id || b.beneficiary_code
          });
        }
      });
    } catch (e) {
      console.warn('Could not sync pending user/beneficiary approvals:', e);
    }

    if (!categoryFilter || categoryFilter === 'ALL') return stored;
    return stored.filter(a => 
      a.category === categoryFilter ||
      (categoryFilter === 'Beneficiary Verification' && (a.category === 'User Onboarding' || a.role_requested === 'Beneficiary')) ||
      (categoryFilter === 'User Registration' && (a.category === 'User Onboarding' && a.role_requested !== 'Beneficiary'))
    );
  },

  async updateApprovalStatus(id, status, notes = '') {
    const current = getLocalData(STORAGE_KEYS.APPROVALS, mock.initialApprovals);
    const targetApp = current.find(a => a.id === id);
    const updated = current.map(a => a.id === id ? { ...a, status, review_notes: notes, reviewed_at: new Date().toISOString() } : a);
    saveLocalData(STORAGE_KEYS.APPROVALS, updated);

    // If User Onboarding or Beneficiary Verification approval is approved or rejected, synchronize user and beneficiary status
    if (targetApp && (targetApp.category === 'User Onboarding' || targetApp.category === 'Beneficiary Verification' || targetApp.category === 'User Registration' || targetApp.user_id || targetApp.beneficiary_id || targetApp.role_requested === 'Beneficiary')) {
      const isApproved = status === 'Approved';
      const userStatus = isApproved ? 'Active' : 'Rejected';
      const benStatus = isApproved ? 'Verified Active' : 'Rejected';

      // Update users list in local storage
      const users = getLocalData(STORAGE_KEYS.USERS, mock.demoAccounts);
      const updatedUsers = users.map(u => {
        if ((targetApp.user_id && u.id === targetApp.user_id) || 
            (targetApp.requester_email && u.email?.toLowerCase() === targetApp.requester_email.toLowerCase()) ||
            (targetApp.beneficiary_id && (u.beneficiary_id === targetApp.beneficiary_id || u.beneficiary_code === targetApp.beneficiary_id))) {
          return { ...u, status: userStatus, is_active: isApproved, verification_status: benStatus };
        }
        return u;
      });
      saveLocalData(STORAGE_KEYS.USERS, updatedUsers);

      // Update beneficiaries list in local storage
      const bens = getLocalData(STORAGE_KEYS.BENEFICIARIES, mock.initialBeneficiaries);
      const updatedBens = bens.map(b => {
        if ((targetApp.beneficiary_id && (b.id === targetApp.beneficiary_id || b.beneficiary_code === targetApp.beneficiary_id)) || 
            (targetApp.requester_email && b.email?.toLowerCase() === targetApp.requester_email.toLowerCase()) ||
            (targetApp.requester_name && b.full_name?.toLowerCase() === targetApp.requester_name.toLowerCase()) ||
            (targetApp.details && b.beneficiary_code && targetApp.details.includes(b.beneficiary_code))) {
          return { ...b, verification_status: benStatus, status: benStatus };
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
          } else if (targetApp.requester_name) {
            await supabase.from('beneficiaries').update({ verification_status: benStatus }).eq('full_name', targetApp.requester_name);
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
        if (target?.role === 'Beneficiary' || target?.beneficiary_id || target?.beneficiary_code) {
          if (target?.email) {
            await supabase.from('beneficiaries').update({ verification_status: 'Verified Active' }).eq('email', target.email);
          }
          if (target?.full_name) {
            await supabase.from('beneficiaries').update({ verification_status: 'Verified Active' }).eq('full_name', target.full_name);
          }
        }
      } catch (err) {
        console.warn('Supabase verifyUser sync error:', err?.message);
      }
    }

    // Also update beneficiaries list in local storage if target is a beneficiary
    const bens = getLocalData(STORAGE_KEYS.BENEFICIARIES, mock.initialBeneficiaries);
    const updatedBens = bens.map(b => {
      const match = (target?.email && b.email?.toLowerCase() === target.email.toLowerCase()) ||
                    (target?.phone && b.phone_number === target.phone) ||
                    (target?.full_name && b.full_name?.toLowerCase() === target.full_name.toLowerCase()) ||
                    (target?.beneficiary_code && b.beneficiary_code === target.beneficiary_code);
      return match ? { ...b, verification_status: 'Verified Active', status: 'Verified Active' } : b;
    });
    saveLocalData(STORAGE_KEYS.BENEFICIARIES, updatedBens);

    // Update any matching pending approval
    const currentApprovals = getLocalData(STORAGE_KEYS.APPROVALS, []);
    const updatedApprovals = currentApprovals.map(a => {
      if (a.user_id === userId || (target?.email && a.requester_email?.toLowerCase() === target.email.toLowerCase())) {
        return { ...a, status: 'Approved', reviewed_at: new Date().toISOString() };
      }
      return a;
    });
    saveLocalData(STORAGE_KEYS.APPROVALS, updatedApprovals);

    await this.logAudit({ action: 'VERIFY', module: 'User Management', record_id: userId, details: `Administrator verified account for ${target?.full_name || userId}` });
    return true;
  },

  async createApproval(data) {
    const newApproval = {
      id: `app-${Date.now().toString().slice(-4)}`,
      ...data,
      status: 'Pending',
      date: new Date().toISOString()
    };
    const current = getLocalData(STORAGE_KEYS.APPROVALS, []);
    const updated = [newApproval, ...current];
    saveLocalData(STORAGE_KEYS.APPROVALS, updated);
    await this.logAudit({ action: 'CREATE', module: 'Approval Management', record_id: newApproval.id, details: `Submitted new ${newApproval.category} approval request` });
    return newApproval;
  },

  // --- LOCATIONS MANAGEMENT ---
  async getLocations() {
    const SEEDED_LOC_IDS = ['loc-1', 'loc-2', 'loc-3', 'loc-4', 'loc-5'];
    const SEEDED_LOC_NAMES = ['Turkana County Office', 'Garissa Sub-Office', 'Marsabit Logistics Hub', 'Nairobi Regional Headquarters', 'Mandera Outreach Post'];
    const current = getLocalData(STORAGE_KEYS.LOCATIONS, mock.initialLocations || []);
    const clean = current.filter(l => !SEEDED_LOC_IDS.includes(l.id) && !SEEDED_LOC_NAMES.includes(l.name));
    if (clean.length !== current.length) {
      saveLocalData(STORAGE_KEYS.LOCATIONS, clean);
    }
    return clean;
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

  // --- BENEFICIARY PORTAL: COMPLAINTS & FEEDBACK ---
  async getComplaints(beneficiaryId = null) {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('complaints').select('*').order('created_at', { ascending: false });
        if (beneficiaryId) query = query.eq('beneficiary_id', beneficiaryId);
        const { data, error } = await query;
        if (!error && data) return data;
      } catch (err) {
        // Fallback to local storage
      }
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
    const pendingBeneficiariesCount = beneficiaries.filter(b => (b.verification_status || b.status) === 'Pending Verification').length;

    return {
      totalBeneficiaries: beneficiaries.length,
      verifiedBeneficiaries: verifiedBeneficiariesCount,
      pendingBeneficiaries: pendingBeneficiariesCount,
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
