// Initial Mock Database for ADRA Management System
export const initialDonors = [
  {
    id: 'd1',
    donor_name: 'USAID (Bureau for Humanitarian Assistance)',
    contact_person: 'Sarah Jenkins',
    email: 'sjenkins@usaid.gov',
    phone: '+1-202-555-0143',
    funding_amount: 2500000,
    funding_date: '2025-01-15'
  },
  {
    id: 'd2',
    donor_name: 'European Commission (ECHO)',
    contact_person: 'Marc Dupont',
    email: 'm.dupont@ec.europa.eu',
    phone: '+32-2-299-1111',
    funding_amount: 1800000,
    funding_date: '2025-03-01'
  },
  {
    id: 'd3',
    donor_name: 'ADRA International Partnership Fund',
    contact_person: 'Dr. David Miller',
    email: 'dmiller@adra.org',
    phone: '+1-301-680-6000',
    funding_amount: 950000,
    funding_date: '2025-02-10'
  },
  {
    id: 'd4',
    donor_name: 'Global Affairs Canada (GAC)',
    contact_person: 'Elena Rostova',
    email: 'elena.rostova@international.gc.ca',
    phone: '+1-613-996-2000',
    funding_amount: 1200000,
    funding_date: '2025-04-20'
  }
];

export const initialPartners = [
  {
    id: 'p1',
    partner_name: 'Ministry of Agriculture and Food Security',
    contact_person: 'Eng. Samuel Otieno',
    email: 's.otieno@agriculture.gov.ke',
    phone: '+254-20-2718870',
    description: 'Government partner supporting agronomy extension and certified seed quality inspection.'
  },
  {
    id: 'p2',
    partner_name: 'Community Water & Sanitation Trust',
    contact_person: 'Amina Hassan',
    email: 'ahassan@waterstrust.org',
    phone: '+254-722-123456',
    description: 'Specialized local NGO for solar borehole hydro-drilling and hygiene advocacy.'
  },
  {
    id: 'p3',
    partner_name: 'Hope Technical Training Institute',
    contact_person: 'Pastor Joseph Kiprotich',
    email: 'admin@hopetti.ac.ke',
    phone: '+254-733-987654',
    description: 'Accredited vocational center providing certified artisanal courses for marginalized youth.'
  }
];

export const initialProjects = [
  {
    id: 'pr1',
    project_code: 'PRJ-2025-001',
    project_name: 'Drought Resilience & Climate-Smart Agriculture',
    description: 'Enhancing food security and climate-smart agronomy for 3,500 vulnerable smallholder farmers across semi-arid zones.',
    start_date: '2025-01-01',
    end_date: '2026-12-31',
    location: 'Turkana & Garissa Counties',
    budget: 1450000,
    status: 'Active',
    project_officer_name: 'John Mwangi',
    donor_id: 'd1',
    donor_name: 'USAID (BHA)',
    partner_id: 'p1',
    partner_name: 'Ministry of Agriculture'
  },
  {
    id: 'pr2',
    project_code: 'PRJ-2025-002',
    project_name: 'Clean Water Access & WASH Infrastructure Expansion',
    description: 'Drilling solar-powered community boreholes and promoting sanitation practices in underserved rural primary schools.',
    start_date: '2025-02-15',
    end_date: '2025-11-30',
    location: 'Marsabit District',
    budget: 680000,
    status: 'Active',
    project_officer_name: 'John Mwangi',
    donor_id: 'd2',
    donor_name: 'European Commission (ECHO)',
    partner_id: 'p2',
    partner_name: 'Community Water Trust'
  },
  {
    id: 'pr3',
    project_code: 'PRJ-2025-003',
    project_name: 'Youth Vocational Livelihoods & Entrepreneurship',
    description: 'Equipping marginalized out-of-school youth and young women with vocational skills, toolkits, and micro-grant seed capital.',
    start_date: '2025-03-01',
    end_date: '2026-02-28',
    location: 'Nairobi Urban Settlements',
    budget: 520000,
    status: 'Active',
    project_officer_name: 'Sarah Kimani',
    donor_id: 'd3',
    donor_name: 'ADRA International',
    partner_id: 'p3',
    partner_name: 'Hope Technical Institute'
  },
  {
    id: 'pr4',
    project_code: 'PRJ-2024-004',
    project_name: 'Emergency Flood Relief & Shelter Rehabilitation',
    description: 'Provided emergency cash grants, hygiene kits, and temporary shelter rehabilitation for households affected by heavy flooding.',
    start_date: '2024-04-01',
    end_date: '2024-12-15',
    location: 'Tana River Basin',
    budget: 890000,
    status: 'Completed',
    project_officer_name: 'John Mwangi',
    donor_id: 'd4',
    donor_name: 'Global Affairs Canada',
    partner_id: 'p2',
    partner_name: 'Community Water Trust'
  },
  {
    id: 'pr5',
    project_code: 'PRJ-2026-005',
    project_name: 'Maternal & Child Nutrition Support Initiative',
    description: 'Community-based screening, supplementary therapeutic feeding, and hygiene education for mothers with under-5 children.',
    start_date: '2026-04-01',
    end_date: '2027-03-31',
    location: 'Wajir South',
    budget: 750000,
    status: 'Planned',
    project_officer_name: 'Sarah Kimani',
    donor_id: 'd1',
    donor_name: 'USAID (BHA)',
    partner_id: 'p1',
    partner_name: 'Ministry of Agriculture'
  }
];

export const initialBeneficiaries = [
  {
    id: 'b1',
    beneficiary_code: 'BEN-2025-001',
    full_name: 'Grace Akinyi Omolo',
    gender: 'Female',
    date_of_birth: '1984-05-12',
    age: 41,
    phone_number: '+254-712-345678',
    location: 'Lodwar Village, Turkana',
    vulnerability_category: 'Female-headed Household',
    registration_date: '2025-01-10',
    project_id: 'pr1',
    project_name: 'Drought Resilience & Climate-Smart Agriculture'
  },
  {
    id: 'b2',
    beneficiary_code: 'BEN-2025-002',
    full_name: 'Abdullahi Mohamed Noor',
    gender: 'Male',
    date_of_birth: '1970-11-03',
    age: 55,
    phone_number: '+254-723-456789',
    location: 'Garissa Central Ward',
    vulnerability_category: 'Extremely Poor Household',
    registration_date: '2025-01-14',
    project_id: 'pr1',
    project_name: 'Drought Resilience & Climate-Smart Agriculture'
  },
  {
    id: 'b3',
    beneficiary_code: 'BEN-2025-003',
    full_name: 'Fatuma Halake Wako',
    gender: 'Female',
    date_of_birth: '1959-08-22',
    age: 66,
    phone_number: '+254-734-567890',
    location: 'Moyale Sub-county',
    vulnerability_category: 'Elderly',
    registration_date: '2025-02-18',
    project_id: 'pr2',
    project_name: 'Clean Water Access & WASH Infrastructure'
  },
  {
    id: 'b4',
    beneficiary_code: 'BEN-2025-004',
    full_name: 'Kevin Mwangi Kamau',
    gender: 'Male',
    date_of_birth: '2003-03-15',
    age: 22,
    phone_number: '+254-745-678901',
    location: 'Mathare North, Nairobi',
    vulnerability_category: 'Youth at Risk',
    registration_date: '2025-03-05',
    project_id: 'pr3',
    project_name: 'Youth Vocational Livelihoods & Entrepreneurship'
  },
  {
    id: 'b5',
    beneficiary_code: 'BEN-2025-005',
    full_name: 'Joyce Chebet Rono',
    gender: 'Female',
    date_of_birth: '2001-09-28',
    age: 24,
    phone_number: '+254-756-789012',
    location: 'Kibera Lindi, Nairobi',
    vulnerability_category: 'Persons with Disability',
    registration_date: '2025-03-08',
    project_id: 'pr3',
    project_name: 'Youth Vocational Livelihoods & Entrepreneurship'
  },
  {
    id: 'b6',
    beneficiary_code: 'BEN-2025-006',
    full_name: 'Hassan Ali Warsame',
    gender: 'Male',
    date_of_birth: '1988-12-04',
    age: 37,
    phone_number: '+254-767-890123',
    location: 'Hola Town, Tana River',
    vulnerability_category: 'Internally Displaced Person (IDP)',
    registration_date: '2024-04-12',
    project_id: 'pr4',
    project_name: 'Emergency Flood Relief'
  }
];

export const initialActivities = [
  {
    id: 'a1',
    activity_code: 'ACT-2025-101',
    project_id: 'pr1',
    project_name: 'Drought Resilience & Climate-Smart Agriculture',
    activity_name: 'Drought-Tolerant Seed & Drip Irrigation Kit Distribution',
    description: 'Procure and distribute certified sorghum, cowpea seeds, and solar drip sets to farmer cluster groups.',
    activity_date: '2025-02-10',
    location: 'Lodwar Agricultural Center',
    status: 'Completed',
    responsible_officer: 'John Mwangi',
    expected_output: 'Distribute kits to 500 farmer heads',
    actual_output: 'Successfully distributed to 520 registered farmers with verified sign-off sheets.'
  },
  {
    id: 'a2',
    activity_code: 'ACT-2025-102',
    project_id: 'pr1',
    project_name: 'Drought Resilience & Climate-Smart Agriculture',
    activity_name: 'Farmer Field School (FFS) Agronomy Training',
    description: 'Hands-on training sessions in soil moisture retention, mulching, pest management, and post-harvest storage.',
    activity_date: '2025-03-15',
    location: 'Garissa Training Demo Farm',
    status: 'Ongoing',
    responsible_officer: 'John Mwangi',
    expected_output: 'Train 25 Farmer Field School cohorts',
    actual_output: '18 cohorts trained to date; remaining 7 scheduled for next month.'
  },
  {
    id: 'a3',
    activity_code: 'ACT-2025-201',
    project_id: 'pr2',
    project_name: 'Clean Water Access & WASH Infrastructure Expansion',
    activity_name: 'Solar-Powered Borehole Drilling & Water Quality Testing',
    description: 'Drilling two high-yield boreholes, installing submersible DC pumps, overhead storage tanks, and solar arrays.',
    activity_date: '2025-03-20',
    location: 'Marsabit Township & Bubisa',
    status: 'Ongoing',
    responsible_officer: 'Sarah Kimani',
    expected_output: '2 operational boreholes with potability certification',
    actual_output: 'Site 1 drilling and casing complete; solar array installation underway.'
  },
  {
    id: 'a4',
    activity_code: 'ACT-2025-301',
    project_id: 'pr3',
    project_name: 'Youth Vocational Livelihoods & Entrepreneurship',
    activity_name: 'Vocational Skills Enrollment & Toolkit Handover',
    description: 'Enrolling selected candidates in electrical installation, catering, solar tech, and mechanics courses.',
    activity_date: '2025-04-05',
    location: 'Hope TTI Mathare Campus',
    status: 'Planned',
    responsible_officer: 'Sarah Kimani',
    expected_output: '150 youth enrolled with starters toolkits',
    actual_output: 'Course syllabi verified; student induction day scheduled.'
  }
];

export const initialInterventions = [
  {
    id: 'i1',
    intervention_code: 'INT-2025-001',
    beneficiary_id: 'b1',
    beneficiary_name: 'Grace Akinyi Omolo',
    project_id: 'pr1',
    project_name: 'Drought Resilience & Climate-Smart Agriculture',
    intervention_type: 'Agricultural Support',
    description: 'Distributed certified drought-resistant sorghum seed pack (15kg) and micro-drip irrigation system.',
    quantity_or_value: '1 Irrigation Kit + 15kg Seeds ($180 value)',
    intervention_date: '2025-02-12',
    responsible_officer: 'John Mwangi'
  },
  {
    id: 'i2',
    intervention_code: 'INT-2025-002',
    beneficiary_id: 'b2',
    beneficiary_name: 'Abdullahi Mohamed Noor',
    project_id: 'pr1',
    project_name: 'Drought Resilience & Climate-Smart Agriculture',
    intervention_type: 'Agricultural Support',
    description: 'Provision of climate-smart farming tool package (hoe, spade, watering can, sprayers) and bio-fertilizer.',
    quantity_or_value: '1 Farm Tool Package ($120 value)',
    intervention_date: '2025-02-15',
    responsible_officer: 'John Mwangi'
  },
  {
    id: 'i3',
    intervention_code: 'INT-2025-003',
    beneficiary_id: 'b3',
    beneficiary_name: 'Fatuma Halake Wako',
    project_id: 'pr2',
    project_name: 'Clean Water Access & WASH Infrastructure',
    intervention_type: 'Water & Sanitation (WASH)',
    description: 'Distributed 20-litre food-grade Jerry cans, water purification tablets (Aquatabs 100-pack), and hygiene kit.',
    quantity_or_value: '1 WASH Sanitation Pack ($45 value)',
    intervention_date: '2025-02-22',
    responsible_officer: 'Sarah Kimani'
  },
  {
    id: 'i4',
    intervention_code: 'INT-2025-004',
    beneficiary_id: 'b4',
    beneficiary_name: 'Kevin Mwangi Kamau',
    project_id: 'pr3',
    project_name: 'Youth Vocational Livelihoods & Entrepreneurship',
    intervention_type: 'Skills Training',
    description: 'Full scholarship tuition payment for 6-month certified Solar PV installation course.',
    quantity_or_value: 'Full Tuition Fee Grant ($350 value)',
    intervention_date: '2025-03-10',
    responsible_officer: 'Sarah Kimani'
  },
  {
    id: 'i5',
    intervention_code: 'INT-2025-005',
    beneficiary_id: 'b6',
    beneficiary_name: 'Hassan Ali Warsame',
    project_id: 'pr4',
    project_name: 'Emergency Flood Relief',
    intervention_type: 'Cash Transfer',
    description: 'Unconditional emergency cash transfer via mobile money for flood-displaced household sustenance.',
    quantity_or_value: '2-Month Cash Stipend ($200 value)',
    intervention_date: '2024-05-18',
    responsible_officer: 'John Mwangi'
  }
];

export const initialIndicators = [
  {
    id: 'ind1',
    indicator_code: 'IND-DRCSA-01',
    project_id: 'pr1',
    project_name: 'Drought Resilience & Climate-Smart Agriculture',
    indicator_name: 'Farmers adopting climate-smart agricultural techniques',
    description: 'Number of smallholder farmers adopting at least 2 climate-smart practices on their farm parcels.',
    baseline: 200,
    target: 3500,
    actual_result: 2450,
    measurement_unit: 'Farmers',
    reporting_period: 'Q1 2025'
  },
  {
    id: 'ind2',
    indicator_code: 'IND-DRCSA-02',
    project_id: 'pr1',
    project_name: 'Drought Resilience & Climate-Smart Agriculture',
    indicator_name: 'Hectares of farmland under drip irrigation',
    description: 'Total land acreage converted from rain-fed to efficient micro-irrigation systems.',
    baseline: 50,
    target: 800,
    actual_result: 560,
    measurement_unit: 'Hectares',
    reporting_period: 'Q1 2025'
  },
  {
    id: 'ind3',
    indicator_code: 'IND-WASH-01',
    project_id: 'pr2',
    project_name: 'Clean Water Access & WASH Infrastructure',
    indicator_name: 'People with daily access to safe drinking water within 500m',
    description: 'Community members utilizing newly rehabilitated solar water schemes.',
    baseline: 1500,
    target: 12000,
    actual_result: 8900,
    measurement_unit: 'Individuals',
    reporting_period: 'Q1 2025'
  },
  {
    id: 'ind4',
    indicator_code: 'IND-YOUTH-01',
    project_id: 'pr3',
    project_name: 'Youth Vocational Livelihoods & Entrepreneurship',
    indicator_name: 'Youth graduating with certified marketable skills',
    description: 'Trainees completing approved technical syllabus and receiving certification.',
    baseline: 0,
    target: 300,
    actual_result: 145,
    measurement_unit: 'Youth',
    reporting_period: 'Semi-Annual 2025'
  },
  {
    id: 'ind5',
    indicator_code: 'IND-FLOOD-01',
    project_id: 'pr4',
    project_name: 'Emergency Flood Relief',
    indicator_name: 'Flood-affected households receiving essential relief kits',
    description: 'Families receiving emergency shelter sheets, hygiene supplies, and water kits.',
    baseline: 0,
    target: 2000,
    actual_result: 2000,
    measurement_unit: 'Households',
    reporting_period: 'Final 2024'
  }
];

export const initialBudgets = [
  {
    id: 'bg1',
    project_id: 'pr1',
    project_name: 'Drought Resilience & Climate-Smart Agriculture',
    budget_category: 'Direct Activity Costs',
    allocated_amount: 850000,
    financial_year: 'FY 2025'
  },
  {
    id: 'bg2',
    project_id: 'pr1',
    project_name: 'Drought Resilience & Climate-Smart Agriculture',
    budget_category: 'Personnel',
    allocated_amount: 320000,
    financial_year: 'FY 2025'
  },
  {
    id: 'bg3',
    project_id: 'pr1',
    project_name: 'Drought Resilience & Climate-Smart Agriculture',
    budget_category: 'Equipment & Supplies',
    allocated_amount: 180000,
    financial_year: 'FY 2025'
  },
  {
    id: 'bg4',
    project_id: 'pr1',
    project_name: 'Drought Resilience & Climate-Smart Agriculture',
    budget_category: 'Administrative / Overhead',
    allocated_amount: 100000,
    financial_year: 'FY 2025'
  },
  {
    id: 'bg5',
    project_id: 'pr2',
    project_name: 'Clean Water Access & WASH Infrastructure',
    budget_category: 'Direct Activity Costs',
    allocated_amount: 450000,
    financial_year: 'FY 2025'
  },
  {
    id: 'bg6',
    project_id: 'pr2',
    project_name: 'Clean Water Access & WASH Infrastructure',
    budget_category: 'Equipment & Supplies',
    allocated_amount: 150000,
    financial_year: 'FY 2025'
  },
  {
    id: 'bg7',
    project_id: 'pr3',
    project_name: 'Youth Vocational Livelihoods & Entrepreneurship',
    budget_category: 'Training & Workshops',
    allocated_amount: 350000,
    financial_year: 'FY 2025'
  },
  {
    id: 'bg8',
    project_id: 'pr3',
    project_name: 'Youth Vocational Livelihoods & Entrepreneurship',
    budget_category: 'Equipment & Supplies',
    allocated_amount: 120000,
    financial_year: 'FY 2025'
  }
];

export const initialExpenditures = [
  {
    id: 'ex1',
    expenditure_code: 'EXP-2025-001',
    project_id: 'pr1',
    project_name: 'Drought Resilience & Climate-Smart Agriculture',
    category: 'Direct Activity Costs',
    description: 'Bulk procurement of certified sorghum & drought seeds from certified agro-dealers',
    amount: 92500,
    expenditure_date: '2025-01-28',
    recorded_by: 'Alex Morgan',
    receipt_url: 'receipt_exp001.pdf'
  },
  {
    id: 'ex2',
    expenditure_code: 'EXP-2025-002',
    project_id: 'pr1',
    project_name: 'Drought Resilience & Climate-Smart Agriculture',
    category: 'Equipment & Supplies',
    description: 'Procurement of 500 low-pressure micro drip irrigation lines & fittings',
    amount: 64800,
    expenditure_date: '2025-02-05',
    recorded_by: 'Alex Morgan',
    receipt_url: 'receipt_exp002.pdf'
  },
  {
    id: 'ex3',
    expenditure_code: 'EXP-2025-003',
    project_id: 'pr1',
    project_name: 'Drought Resilience & Climate-Smart Agriculture',
    category: 'Personnel',
    description: 'Agronomy extension field officers salary for January & February 2025',
    amount: 28000,
    expenditure_date: '2025-02-28',
    recorded_by: 'Alex Morgan',
    receipt_url: 'payroll_summary.pdf'
  },
  {
    id: 'ex4',
    expenditure_code: 'EXP-2025-004',
    project_id: 'pr2',
    project_name: 'Clean Water Access & WASH Infrastructure',
    category: 'Direct Activity Costs',
    description: 'Geophysical hydrogeological surveys & contractor mobilization fee',
    amount: 48500,
    expenditure_date: '2025-02-25',
    recorded_by: 'Alex Morgan',
    receipt_url: 'survey_invoice.pdf'
  },
  {
    id: 'ex5',
    expenditure_code: 'EXP-2025-005',
    project_id: 'pr3',
    project_name: 'Youth Vocational Livelihoods & Entrepreneurship',
    category: 'Training & Workshops',
    description: 'First tranche institutional tuition disbursement for 75 students at Hope TTI',
    amount: 37500,
    expenditure_date: '2025-03-05',
    recorded_by: 'Alex Morgan',
    receipt_url: 'tuition_grant_receipt.pdf'
  }
];

export const initialDocuments = [
  {
    id: 'doc1',
    project_id: 'pr1',
    project_name: 'Drought Resilience & Climate-Smart Agriculture',
    document_name: 'Q1_2025_Progress_Evaluation_Report.pdf',
    document_type: 'Report',
    file_path: 'projects/pr1/Q1_2025_Progress_Evaluation_Report.pdf',
    file_size: 2450000,
    uploaded_at: '2025-02-15',
    uploaded_by: 'M&E Officer'
  },
  {
    id: 'doc2',
    project_id: 'pr2',
    project_name: 'Clean Water Access & WASH Infrastructure',
    document_name: 'Hydrogeological_Survey_Report_Marsabit.pdf',
    document_type: 'Supporting Doc',
    file_path: 'projects/pr2/Hydrogeological_Survey_Report_Marsabit.pdf',
    file_size: 4800000,
    uploaded_at: '2025-02-28',
    uploaded_by: 'Project Officer'
  },
  {
    id: 'doc3',
    project_id: 'pr1',
    project_name: 'Drought Resilience & Climate-Smart Agriculture',
    document_name: 'Seed_Distribution_Signed_Beneficiary_Log.pdf',
    document_type: 'Activity Doc',
    file_path: 'projects/pr1/Seed_Distribution_Signed_Beneficiary_Log.pdf',
    file_size: 1950000,
    uploaded_at: '2025-02-12',
    uploaded_by: 'Project Officer'
  }
];

export const initialAuditLogs = [
  {
    id: 'l1',
    user_email: 'admin@adra.org',
    user_role: 'Administrator',
    action: 'CREATE',
    module: 'Projects',
    record_id: 'PRJ-2025-001',
    details: 'Created Project: Drought Resilience & Climate-Smart Agriculture ($1,450,000)',
    created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString()
  },
  {
    id: 'l2',
    user_email: 'project.officer@adra.org',
    user_role: 'Project Officer',
    action: 'CREATE',
    module: 'Beneficiaries',
    record_id: 'BEN-2025-001',
    details: 'Registered beneficiary Grace Akinyi Omolo under PRJ-2025-001',
    created_at: new Date(Date.now() - 3600000 * 24 * 20).toISOString()
  },
  {
    id: 'l3',
    user_email: 'project.officer@adra.org',
    user_role: 'Project Officer',
    action: 'CREATE',
    module: 'Interventions',
    record_id: 'INT-2025-001',
    details: 'Recorded Agricultural Support intervention for Grace Akinyi Omolo',
    created_at: new Date(Date.now() - 3600000 * 24 * 15).toISOString()
  },
  {
    id: 'l4',
    user_email: 'finance.officer@adra.org',
    user_role: 'Finance Officer',
    action: 'CREATE',
    module: 'Finance',
    record_id: 'EXP-2025-001',
    details: 'Recorded expenditure of $92,500.00 for Direct Activity Costs',
    created_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString()
  },
  {
    id: 'l5',
    user_email: 'me.officer@adra.org',
    user_role: 'M&E Officer',
    action: 'UPDATE',
    module: 'M&E',
    record_id: 'IND-DRCSA-01',
    details: 'Updated actual indicator result to 2,450 Farmers (70% achieved)',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
  }
];

export const demoAccounts = [
  {
    id: 'user-admin',
    email: 'admin@adra.org',
    password: 'Password123!',
    full_name: 'Dr. Elizabeth Warren',
    role: 'Administrator',
    department: 'Executive Country Leadership',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-pm',
    email: 'program.manager@adra.org',
    password: 'Password123!',
    full_name: 'Grace Ochieng',
    role: 'Program Manager',
    department: 'Emergency Response & Programs',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-sup',
    email: 'supervisor@adra.org',
    password: 'Password123!',
    full_name: 'Emmanuel Adeyemi',
    role: 'Supervisor',
    department: 'Field Quality & Compliance',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-po',
    email: 'project.officer@adra.org',
    password: 'Password123!',
    full_name: 'John Mwangi',
    role: 'Project Officer',
    department: 'Humanitarian Operations',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-fw',
    email: 'field.worker@adra.org',
    password: 'Password123!',
    full_name: 'Amina Abdi',
    role: 'Field Worker',
    department: 'Community Mobilization',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-fo',
    email: 'finance.officer@adra.org',
    password: 'Password123!',
    full_name: 'Alex Morgan',
    role: 'Finance Officer',
    department: 'Financial Control & Grants',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-sup-vendor',
    email: 'procurement@africasupplies.com',
    password: 'Password123!',
    full_name: 'Hassan Gedi',
    role: 'Supplier',
    department: 'Equatorial Relief Logistics',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-donor',
    email: 'sjenkins@usaid.gov',
    password: 'Password123!',
    full_name: 'Sarah Jenkins',
    role: 'Donor',
    department: 'USAID Bureau for Humanitarian Assistance',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-ben',
    email: 'mary.nyambura@adra.community',
    password: 'Password123!',
    full_name: 'Mary Nyambura',
    role: 'Beneficiary',
    department: 'Community Self-Help Group (Lodwar)',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  }
];

export const initialRoles = [
  'Administrator',
  'Program Manager',
  'Supervisor',
  'Field Worker',
  'Finance Officer',
  'Supplier',
  'Donor',
  'Beneficiary'
];

export const initialPermissions = [
  { role: 'Administrator', can_view: true, can_create: true, can_edit: true, can_approve: true, can_delete: true, can_export: true },
  { role: 'Program Manager', can_view: true, can_create: true, can_edit: true, can_approve: true, can_delete: false, can_export: true },
  { role: 'Supervisor', can_view: true, can_create: true, can_edit: true, can_approve: true, can_delete: false, can_export: true },
  { role: 'Project Officer', can_view: true, can_create: true, can_edit: true, can_approve: false, can_delete: false, can_export: true },
  { role: 'Finance Officer', can_view: true, can_create: true, can_edit: true, can_approve: true, can_delete: false, can_export: true },
  { role: 'Field Worker', can_view: true, can_create: true, can_edit: false, can_approve: false, can_delete: false, can_export: false },
  { role: 'Supplier', can_view: true, can_create: false, can_edit: false, can_approve: false, can_delete: false, can_export: false },
  { role: 'Donor', can_view: true, can_create: false, can_edit: false, can_approve: false, can_delete: false, can_export: true },
  { role: 'Beneficiary', can_view: true, can_create: false, can_edit: false, can_approve: false, can_delete: false, can_export: false }
];

export const initialLocations = [
  { id: 'loc-1', name: 'Turkana County Office', type: 'Field Office', state: 'Rift Valley', county: 'Turkana', district: 'Lodwar Central', community: 'Zone 4 Camp', active: true, contact: '+254-54-21045' },
  { id: 'loc-2', name: 'Garissa Sub-Office', type: 'Field Office', state: 'North Eastern', county: 'Garissa', district: 'Dadaab', community: 'Hagadera Sector B', active: true, contact: '+254-46-21012' },
  { id: 'loc-3', name: 'Marsabit Logistics Hub', type: 'Distribution Center', state: 'Eastern', county: 'Marsabit', district: 'Moyale Border', community: 'Township Village', active: true, contact: '+254-69-21088' },
  { id: 'loc-4', name: 'Nairobi Regional Headquarters', type: 'Headquarters', state: 'Nairobi', county: 'Nairobi', district: 'Westlands', community: 'HQ Compound', active: true, contact: '+254-20-2718870' },
  { id: 'loc-5', name: 'Mandera Outreach Post', type: 'Community Post', state: 'North Eastern', county: 'Mandera', district: 'Rhamu', community: 'Riverine Zone', active: false, contact: '+254-46-31002' }
];

export const initialApprovals = [
  {
    id: 'app-001',
    category: 'User Registration',
    requester_name: 'Kevin Otieno',
    requester_email: 'kevin.otieno@adra.org',
    role_requested: 'Field Worker',
    department: 'Turkana WASH Taskforce',
    details: 'New field worker recruitment for boreholes rehabilitation phase 2.',
    status: 'Pending',
    date: new Date(Date.now() - 3600000 * 4).toISOString(),
    priority: 'High'
  },
  {
    id: 'app-002',
    category: 'Supplier Onboarding',
    requester_name: 'Al-Madina Agro Commodities Ltd',
    requester_email: 'procure@almadina-agro.co.ke',
    role_requested: 'Supplier',
    department: 'Drought Seeds & Fodder',
    details: 'Prequalified vendor application for supplying 5,000 bags of certified drought-resistant sorghum.',
    status: 'Pending',
    date: new Date(Date.now() - 3600000 * 18).toISOString(),
    priority: 'Medium'
  },
  {
    id: 'app-003',
    category: 'Operational Budget',
    requester_name: 'Alex Morgan (Finance Officer)',
    requester_email: 'finance.officer@adra.org',
    role_requested: 'Budget Release',
    department: 'Financial Control',
    details: 'Emergency cash disbursement authorization of $45,000 for flood response voucher redemption in Garissa.',
    status: 'Pending',
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    priority: 'Urgent'
  },
  {
    id: 'app-004',
    category: 'Aid Distribution Batch',
    requester_name: 'John Mwangi (Project Officer)',
    requester_email: 'project.officer@adra.org',
    role_requested: 'Distribution Dispatch',
    department: 'DR-CSA Programme',
    details: 'Authorization to disburse 1,200 Solar Irrigation & Drip Kits to verified smallholder farmer cooperatives.',
    status: 'Approved',
    date: new Date(Date.now() - 3600000 * 48).toISOString(),
    priority: 'High'
  }
];

export const initialSuppliers = [
  { id: 'sup-1', company_name: 'Equatorial Relief Logistics', category: 'Fleet & Cargo', contact_person: 'Hassan Gedi', phone: '+254-711-234567', email: 'procurement@africasupplies.com', status: 'Active', rating: 4.8 },
  { id: 'sup-2', company_name: 'Simlaw Certified Seeds Kenya', category: 'Agriculture & Inputs', contact_person: 'Faith Waweru', phone: '+254-722-456789', email: 'orders@simlaw.co.ke', status: 'Active', rating: 4.9 },
  { id: 'sup-3', company_name: 'Davis & Shirtliff Water Technologies', category: 'WASH Equipment', contact_person: 'Eng. Paul Kilonzo', phone: '+254-733-678901', email: 'humanitarian@dayliff.com', status: 'Active', rating: 5.0 },
  { id: 'sup-4', company_name: 'MedAid Kenya Pharmaceuticals', category: 'Medical & Hygiene', contact_person: 'Dr. James Kariuki', phone: '+254-700-112233', email: 'supplies@medaid.ke', status: 'Pending Review', rating: 4.2 }
];

export const initialInventory = [
  { id: 'inv-1', item_name: 'Solar Borehole Submersible Pump Units', category: 'WASH', quantity: 24, unit: 'Sets', warehouse: 'Lodwar Central Depot', min_threshold: 5, status: 'In Stock' },
  { id: 'inv-2', item_name: 'Certified Drought Sorghum Seeds (25kg bags)', category: 'Agriculture', quantity: 850, unit: 'Bags', warehouse: 'Marsabit Logistics Hub', min_threshold: 100, status: 'In Stock' },
  { id: 'inv-3', item_name: 'Family Hygiene Dignity Kits', category: 'Health & Shelter', quantity: 1420, unit: 'Kits', warehouse: 'Garissa Sub-Office', min_threshold: 200, status: 'In Stock' },
  { id: 'inv-4', item_name: 'Water Purification Chlorination Tablets (Boxes of 100)', category: 'WASH', quantity: 3200, unit: 'Boxes', warehouse: 'Nairobi Central Store', min_threshold: 500, status: 'In Stock' },
  { id: 'inv-5', item_name: 'Micro-Drip Irrigation Line Bundles', category: 'Agriculture', quantity: 65, unit: 'Bundles', warehouse: 'Lodwar Central Depot', min_threshold: 80, status: 'Low Stock' }
];

export const initialSecuritySettings = {
  min_password_length: 10,
  require_special_chars: true,
  require_numbers: true,
  session_timeout_minutes: 60,
  max_login_attempts: 5,
  account_lockout_duration_minutes: 30,
  two_factor_auth_required: false,
  ip_whitelist_enabled: false,
  active_sessions_count: 8,
  suspicious_activities: [
    { id: 'sec-1', ip: '197.232.14.88', location: 'Nairobi, KE', user: 'admin@adra.org', event: 'Successful Login', time: '10 mins ago', status: 'Normal' },
    { id: 'sec-2', ip: '102.68.79.12', location: 'Mombasa, KE', user: 'unknown@external.net', event: 'Failed Login (3 attempts)', time: '4 hours ago', status: 'Blocked' },
    { id: 'sec-3', ip: '41.89.24.110', location: 'Lodwar, KE', user: 'project.officer@adra.org', event: 'Password Changed', time: '1 day ago', status: 'Normal' }
  ]
};

export const initialSystemSettings = {
  org_name: 'ADRA (Adventist Development and Relief Agency)',
  country_office: 'Kenya & East Central Africa Division',
  registration_number: 'NGO-REG-1983-00412',
  tax_pin: 'P051239841K',
  default_currency: 'USD ($)',
  fiscal_year_start: 'January 1',
  contact_email: 'info@adrakenya.org',
  contact_phone: '+254-20-2718870',
  headquarters_address: 'ADRA Complex, Riverside Drive, Nairobi',
  id_formats: {
    project: 'PRJ-YYYY-###',
    beneficiary: 'BEN-YYYY-#####',
    intervention: 'INT-YYYY-####',
    voucher: 'VCH-YYYY-####'
  },
  reporting_frequency: 'Monthly',
  auto_audit_logging: true
};

export const initialNotifications = [
  { id: 'notif-1', title: 'Q3 Humanitarian Audit Scheduled', message: 'Annual external compliance and donor audit commencing on October 15. All field officers must finalize logframe indicators.', type: 'Announcement', target_roles: ['All'], active: true, created_at: '2025-08-15' },
  { id: 'notif-2', title: 'New Drought Emergency Appeal (ECHO)', message: 'New funding stream of $1.8M allocated for rapid livestock feed and clean water distribution in Marsabit.', type: 'Alert', target_roles: ['Program Manager', 'Finance Officer', 'Project Officer'], active: true, created_at: '2025-08-20' },
  { id: 'notif-3', title: 'System Security Protocol Update', message: 'Mandatory password renewal rule active for all field staff accounts. Review complexity in Security Management.', type: 'Security', target_roles: ['All'], active: true, created_at: '2025-08-22' }
];

export const initialFaqs = [
  { id: 'faq-1', category: 'User & Access', question: 'How do I approve newly registered field workers or partners?', answer: 'Navigate to Admin Console > User Approvals. Click "Review Application", check credentials, and select Approve to grant immediate role-based system access.' },
  { id: 'faq-2', category: 'Operations', question: 'How are project codes generated across country programs?', answer: 'Project codes are formatted automatically according to the Organization ID Settings (e.g., PRJ-2025-001) ensuring unique traceable accounting across multi-donor grants.' },
  { id: 'faq-3', category: 'Compliance', question: 'Where can I inspect immutable audit records for viva or donor verification?', answer: 'Go to Admin Console > Audit Trail or System Reports. You can filter by action (LOGIN, CREATE, UPDATE, DELETE), view full JSON payloads, and download signed PDF reports.' },
  { id: 'faq-4', category: 'Data Safety', question: 'How do I generate an offline data backup before field deployments?', answer: 'Under Admin Console > Data Management, click "Export Database Backup (JSON)". This saves a full cryptographically-timestamped snapshot of all 12 modules.' }
];

