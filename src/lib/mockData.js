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

export const initialPrograms = [
  {
    id: 'prg1',
    program_code: 'PRG-SS-001',
    program_name: 'Emergency Food Security & Livelihoods Resilience (EFSLR)',
    sector: 'Food Security & Livelihoods',
    description: 'Multi-county food security pillar delivering emergency food distributions, drought-resistant seeds, drip-irrigation kits, and climate-smart agronomy extension services to agro-pastoral communities.',
    strategic_objective: 'Sustained reduction in acute food insecurity (IPC Phase 3+) and climate adaptation capacity for 45,000 households.',
    program_manager: 'Grace Ochieng',
    program_manager_email: 'program.manager@adra.org',
    program_manager_phone: '+211-920-000002',
    budget: 3200000,
    expenditure: 2180000,
    target_beneficiaries: 45000,
    reached_beneficiaries: 38400,
    status: 'Active',
    start_date: '2024-01-01',
    end_date: '2026-12-31',
    location: 'Turkana, Garissa & Central Equatoria',
    donors: ['USAID (BHA)', 'ADRA International'],
    partners: ['Ministry of Agriculture', 'FAO'],
    linked_project_ids: ['pr1', 'pr4'],
    key_indicators: [
      { name: 'Households with Acceptable Food Consumption Score (FCS)', target: '80%', current: '74%' },
      { name: 'Smallholder farmers adopting climate-smart tillage', target: '5,000', current: '3,850' },
      { name: 'Metric tonnes of drought-certified seed disbursed', target: '120 MT', current: '98 MT' }
    ]
  },
  {
    id: 'prg2',
    program_code: 'PRG-SS-002',
    program_name: 'Sustainable WASH & Clean Water Infrastructure (SWCWI)',
    sector: 'WASH & Clean Water',
    description: 'Constructing solar-powered hybrid boreholes, school hygiene facilities, and institutional rainwater harvesting while training community Water User Committees (WUC) for long-term sustainability.',
    strategic_objective: 'Universal access to potable water (<30 min collection time) and zero water-borne epidemic outbreaks across project districts.',
    program_manager: 'Grace Ochieng',
    program_manager_email: 'program.manager@adra.org',
    program_manager_phone: '+211-920-000002',
    budget: 1850000,
    expenditure: 1120000,
    target_beneficiaries: 28000,
    reached_beneficiaries: 21950,
    status: 'Active',
    start_date: '2024-06-01',
    end_date: '2026-05-31',
    location: 'Marsabit District, Juba Na Bari & Eastern Equatoria',
    donors: ['European Commission (ECHO)'],
    partners: ['Community Water & Sanitation Trust'],
    linked_project_ids: ['pr2'],
    key_indicators: [
      { name: 'Functional solar water boreholes commissioned', target: '24 Boreholes', current: '18 Boreholes' },
      { name: 'Litres per person per day (LPPD) available', target: '20 L/day', current: '17.5 L/day' },
      { name: 'Water User Committees certified active & trained', target: '24 Committees', current: '21 Committees' }
    ]
  },
  {
    id: 'prg3',
    program_code: 'PRG-SS-003',
    program_name: 'Youth Livelihoods, Vocational Empowerment & Entrepreneurship',
    sector: 'Education & Economic Empowerment',
    description: 'Providing market-relevant technical vocational education (solar installation, artisanal mechanics, tailoring, agro-processing) along with starter toolkits and micro-grant revolving seed funds.',
    strategic_objective: 'Economic inclusion, gainful self-employment, and livelihood resilience for marginalized vulnerable youth and young women.',
    program_manager: 'Grace Ochieng',
    program_manager_email: 'program.manager@adra.org',
    program_manager_phone: '+211-920-000002',
    budget: 950000,
    expenditure: 590000,
    target_beneficiaries: 5200,
    reached_beneficiaries: 3850,
    status: 'Active',
    start_date: '2025-01-15',
    end_date: '2026-12-31',
    location: 'Nairobi Urban Settlements & Juba Central',
    donors: ['ADRA International', 'Global Affairs Canada (GAC)'],
    partners: ['Hope Technical Training Institute'],
    linked_project_ids: ['pr3'],
    key_indicators: [
      { name: 'Youth certified in certified vocational courses', target: '1,200 Youth', current: '940 Youth' },
      { name: 'Graduates starting profitable micro-enterprises', target: '70%', current: '68%' },
      { name: 'Artisanal starter toolkits distributed', target: '1,200 Kits', current: '850 Kits' }
    ]
  },
  {
    id: 'prg4',
    program_code: 'PRG-SS-004',
    program_name: 'Maternal, Infant & Child Health and Nutrition (MICHN)',
    sector: 'Health & Nutrition',
    description: 'Community-based acute malnutrition management (CMAM), supplementary feeding (RUSF), antenatal hygiene education, and mobile health clinics for mothers and under-5 children.',
    strategic_objective: 'Reduction of Global Acute Malnutrition (GAM) prevalence below WHO emergency thresholds in targeted conflict-affected counties.',
    program_manager: 'Grace Ochieng',
    program_manager_email: 'program.manager@adra.org',
    program_manager_phone: '+211-920-000002',
    budget: 1400000,
    expenditure: 420000,
    target_beneficiaries: 18500,
    reached_beneficiaries: 7200,
    status: 'Planned',
    start_date: '2025-04-01',
    end_date: '2027-03-31',
    location: 'Wajir South, Kapoeta Town & Upper Nile',
    donors: ['USAID (BHA)'],
    partners: ['Ministry of Health', 'UNICEF'],
    linked_project_ids: ['pr5'],
    key_indicators: [
      { name: 'SAM/MAM Children cured under therapeutic protocols', target: '85%', current: '88%' },
      { name: 'Mothers attending infant and young child feeding (IYCF) counseling', target: '6,000', current: '2,400' },
      { name: 'Mobile clinic outreach days executed', target: '96 Days', current: '28 Days' }
    ]
  },
  {
    id: 'prg5',
    program_code: 'PRG-SS-005',
    program_name: 'Rapid Emergency Disaster Response & Shelter Recovery',
    sector: 'Emergency Response & Protection',
    description: 'Fast-track emergency relief mechanism providing unconditional multi-purpose cash grants, emergency shelter kits, dignity kits, and non-food items (NFI) to internally displaced flood and conflict survivors.',
    strategic_objective: 'Immediate preservation of life and human dignity through rapid response delivery within 72 hours of sudden disaster declaration.',
    program_manager: 'Grace Ochieng',
    program_manager_email: 'program.manager@adra.org',
    program_manager_phone: '+211-920-000002',
    budget: 1200000,
    expenditure: 1150000,
    target_beneficiaries: 22000,
    reached_beneficiaries: 21800,
    status: 'Completed',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    location: 'Tana River Basin & Jonglei Corridor',
    donors: ['Global Affairs Canada (GAC)', 'European Commission (ECHO)'],
    partners: ['Community Water Trust', 'Red Cross / OCHA'],
    linked_project_ids: ['pr4'],
    key_indicators: [
      { name: 'Families receiving emergency non-food item kits', target: '3,500 HH', current: '3,480 HH' },
      { name: 'Emergency cash disbursement completed within 72h', target: '95%', current: '96%' },
      { name: 'Temporary shelter kits constructed & inspected', target: '1,800 Kits', current: '1,800 Kits' }
    ]
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
    project_name: 'Drought Resilience & Climate-Smart Agriculture',
    verification_status: 'Verified Active'
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
    project_name: 'Drought Resilience & Climate-Smart Agriculture',
    verification_status: 'Verified Active'
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
    project_name: 'Clean Water Access & WASH Infrastructure',
    verification_status: 'Verified Active'
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
    project_name: 'Youth Vocational Livelihoods & Entrepreneurship',
    verification_status: 'Verified Active'
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
    project_name: 'Youth Vocational Livelihoods & Entrepreneurship',
    verification_status: 'Verified Active'
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
    project_name: 'Emergency Flood Relief',
    verification_status: 'Verified Active'
  },
  {
    id: 'b7',
    beneficiary_code: 'ADRA-SS-000125',
    full_name: 'John Machar',
    email: 'john.machar@adra.community',
    gender: 'Male',
    date_of_birth: '1989-06-18',
    age: 36,
    phone_number: '+211-92-011-4025',
    national_id: 'SS-ID-29481023',
    location: 'Lodwar Central, Turkana West',
    household_size: 5,
    vulnerability_category: 'Female-headed Household',
    verification_status: 'Verified Active',
    registration_date: '2025-01-20',
    project_id: 'pr1',
    project_name: 'Drought Resilience & Climate-Smart Agriculture',
    emergency_contact: 'Peter Lokidor (+254-722-114455)',
    primary_needs: ['Food', 'Water', 'Agricultural support'],
    qr_token: 'ADRA-SS-000125-VFD891'
  },
  {
    id: 'b8',
    beneficiary_code: 'ADRA-SS-000126',
    full_name: 'Deng Majok Garang',
    email: 'deng.majok@adra.community',
    gender: 'Male',
    date_of_birth: '1982-11-14',
    age: 43,
    phone_number: '+254-719-882211',
    national_id: '31849201',
    location: 'Kakuma Camp 3, Turkana West',
    household_size: 6,
    vulnerability_category: 'Internally Displaced Person (IDP)',
    verification_status: 'Pending Verification',
    registration_date: '2025-02-01',
    project_id: 'pr1',
    project_name: 'Drought Resilience & Climate-Smart Agriculture',
    emergency_contact: 'Rebecca Garang (+254-719-994433)',
    primary_needs: ['Emergency Shelter', 'Food Rations', 'WASH Kits']
  },
  {
    id: 'b9',
    beneficiary_code: 'ADRA-SS-000127',
    full_name: 'Amina Halima Hussein',
    email: 'amina.hussein@adra.community',
    gender: 'Female',
    date_of_birth: '1995-04-03',
    age: 30,
    phone_number: '+254-728-445566',
    national_id: '28941054',
    location: 'Garissa Central Sub-county',
    household_size: 4,
    vulnerability_category: 'Female-headed Household',
    verification_status: 'Pending Verification',
    registration_date: '2025-02-05',
    project_id: 'pr1',
    project_name: 'Drought Resilience & Climate-Smart Agriculture',
    emergency_contact: 'Hassan Hussein (+254-728-112233)',
    primary_needs: ['Clean Water Access', 'Agricultural Kit']
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
  },
  {
    id: 'i6',
    intervention_code: 'INT-2025-006',
    beneficiary_id: 'b7',
    beneficiary_name: 'Mary Nyambura',
    project_id: 'pr1',
    project_name: 'Drought Resilience & Climate-Smart Agriculture',
    intervention_type: 'Agricultural Support',
    description: 'Certified Drought-Resistant Sorghum Seeds (10kg) and Micro-Drip Irrigation kit with training manual.',
    quantity_or_value: '1 Irrigation Kit + 10kg Sorghum ($160 value)',
    intervention_date: '2025-02-18',
    responsible_officer: 'John Mwangi'
  },
  {
    id: 'i7',
    intervention_code: 'INT-2025-007',
    beneficiary_id: 'b7',
    beneficiary_name: 'Mary Nyambura',
    project_id: 'pr2',
    project_name: 'Clean Water Access & WASH Infrastructure',
    intervention_type: 'Clean Water & WASH',
    description: 'Emergency clean water jerrycans (2 x 20L) and 100-tablet water purification Aquatabs blister pack.',
    quantity_or_value: '2 Jerrycans + 100 Aquatabs ($40 value)',
    intervention_date: '2025-07-18',
    responsible_officer: 'Sarah Kimani'
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
    phone: '+211-920-000001',
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
    phone: '+211-920-000002',
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
    phone: '+211-920-000003',
    password: 'Password123!',
    full_name: 'Emmanuel Adeyemi',
    role: 'Supervisor',
    department: 'Field Operations & Supervisory (Eastern Equatoria State)',
    state: 'Eastern Equatoria',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-sup-ce',
    email: 'mary.akech@adra.org',
    phone: '+211-922-345002',
    password: 'Password123!',
    full_name: 'Mary Akech',
    role: 'Supervisor',
    department: 'Field Operations & Supervisory (Central Equatoria State)',
    state: 'Central Equatoria',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-sup-jonglei',
    email: 'david.deng@adra.org',
    phone: '+211-920-000012',
    password: 'Password123!',
    full_name: 'David Deng',
    role: 'Supervisor',
    department: 'Field Operations & Supervisory (Jonglei State)',
    state: 'Jonglei',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-sup-lakes',
    email: 'santino.bol@adra.org',
    phone: '+211-920-000014',
    password: 'Password123!',
    full_name: 'Santino Bol',
    role: 'Supervisor',
    department: 'Field Operations & Supervisory (Lakes State)',
    state: 'Lakes',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-sup-nbg',
    email: 'garang.deng@adra.org',
    phone: '+211-920-000015',
    password: 'Password123!',
    full_name: 'Garang Deng Akol',
    role: 'Supervisor',
    department: 'Field Operations & Supervisory (Northern Bahr el Ghazal State)',
    state: 'Northern Bahr el Ghazal',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-sup-unity',
    email: 'nyaluak.gatluak@adra.org',
    phone: '+211-920-000016',
    password: 'Password123!',
    full_name: 'Nyaluak Gatluak',
    role: 'Supervisor',
    department: 'Field Operations & Supervisory (Unity State)',
    state: 'Unity',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-sup-un',
    email: 'amina.hassan@adra.org',
    phone: '+211-920-000013',
    password: 'Password123!',
    full_name: 'Amina Hassan',
    role: 'Supervisor',
    department: 'Field Operations & Supervisory (Upper Nile State)',
    state: 'Upper Nile',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-sup-warrap',
    email: 'achol.malual@adra.org',
    phone: '+211-920-000017',
    password: 'Password123!',
    full_name: 'Achol Malual',
    role: 'Supervisor',
    department: 'Field Operations & Supervisory (Warrap State)',
    state: 'Warrap',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-sup-wbg',
    email: 'michael.loba@adra.org',
    phone: '+211-920-000018',
    password: 'Password123!',
    full_name: 'Michael Loba',
    role: 'Supervisor',
    department: 'Field Operations & Supervisory (Western Bahr el Ghazal State)',
    state: 'Western Bahr el Ghazal',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-sup-we',
    email: 'grace.zambia@adra.org',
    phone: '+211-920-000019',
    password: 'Password123!',
    full_name: 'Grace Samuel Zambia',
    role: 'Supervisor',
    department: 'Field Operations & Supervisory (Western Equatoria State)',
    state: 'Western Equatoria',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-sup-aa',
    email: 'baba.konyi@adra.org',
    phone: '+211-920-000020',
    password: 'Password123!',
    full_name: 'Baba Konyi',
    role: 'Supervisor',
    department: 'Field Operations & Supervisory (Administrative Areas)',
    state: 'Administrative Areas',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-po',
    email: 'project.officer@adra.org',
    phone: '+211-920-000004',
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
    phone: '+211-920-000005',
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
    phone: '+211-920-000006',
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
    phone: '+211-920-000007',
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
    phone: '+1-202-555-0143',
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
    phone: '+254-718-920114',
    national_id: '29481023',
    beneficiary_code: 'ADRA-SS-000125',
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
  },
  {
    id: 'app-005',
    category: 'Beneficiary Verification',
    requester_name: 'Deng Majok Garang',
    requester_email: 'deng.majok@adra.community',
    role_requested: 'Beneficiary',
    department: 'Community (Kakuma Camp 3, Turkana West)',
    details: 'New Beneficiary household self-registration: Deng Majok Garang (National ID: 31849201, Household: 6, Vulnerability: IDP). Awaiting administrator identity and vulnerability compliance verification.',
    status: 'Pending',
    date: new Date(Date.now() - 3600000 * 6).toISOString(),
    priority: 'High',
    beneficiary_code: 'ADRA-SS-000126'
  },
  {
    id: 'app-006',
    category: 'Beneficiary Verification',
    requester_name: 'Amina Halima Hussein',
    requester_email: 'amina.hussein@adra.community',
    role_requested: 'Beneficiary',
    department: 'Community (Garissa Central Sub-county)',
    details: 'New Beneficiary household registration: Amina Halima Hussein (National ID: 28941054, Household: 4, Vulnerability: Female-headed Household). Awaiting administrator verification.',
    status: 'Pending',
    date: new Date(Date.now() - 3600000 * 14).toISOString(),
    priority: 'Normal',
    beneficiary_code: 'ADRA-SS-000127'
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

export const initialAssistanceRequests = [];

export const initialSupervisors = [
  {
    id: 'sup-1',
    name: 'Emmanuel Adeyemi',
    email: 'supervisor@adra.org',
    phone: '+211-920-000003',
    programme_id: 'prg1',
    programme_name: 'Emergency Food Security & Livelihoods Resilience',
    state: 'Eastern Equatoria',
    county: 'Kapoeta South',
    payam: 'Kapoeta Town',
    boma: 'Longeleya & Machi',
    assigned_area: 'Eastern Equatoria State (Kapoeta South, East & Torit)',
    active_tasks: 4,
    completed_tasks: 28,
    pending_reports: 2,
    approved_reports: 26,
    workload_percentage: 65,
    status: 'Active',
    managed_field_workers: 6,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'sup-2',
    name: 'Mary Akech',
    email: 'mary.akech@adra.org',
    phone: '+211-922-345002',
    programme_id: 'prg2',
    programme_name: 'Sustainable WASH & Clean Water Infrastructure',
    state: 'Central Equatoria',
    county: 'Juba',
    payam: 'Juba Na Bari',
    boma: 'Tongping & Munuki',
    assigned_area: 'Central Equatoria State (Juba Urban, Yei & Kajo-Keji)',
    active_tasks: 3,
    completed_tasks: 34,
    pending_reports: 1,
    approved_reports: 33,
    workload_percentage: 50,
    status: 'Active',
    managed_field_workers: 8,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'sup-3',
    name: 'David Deng',
    email: 'david.deng@adra.org',
    phone: '+211-920-000012',
    programme_id: 'prg5',
    programme_name: 'Rapid Emergency Disaster Response & Shelter Recovery',
    state: 'Jonglei',
    county: 'Bor',
    payam: 'Baidit',
    boma: 'Kolnyang & Anyidi',
    assigned_area: 'Jonglei State (Bor South, Twic East & Riverine Axis)',
    active_tasks: 6,
    completed_tasks: 19,
    pending_reports: 3,
    approved_reports: 16,
    workload_percentage: 85,
    status: 'High Load',
    managed_field_workers: 5,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'sup-4',
    name: 'Santino Bol',
    email: 'santino.bol@adra.org',
    phone: '+211-920-000014',
    programme_id: 'prg1',
    programme_name: 'Emergency Food Security & Livelihoods Resilience',
    state: 'Lakes',
    county: 'Rumbek Centre',
    payam: 'Matangai',
    boma: 'Aduel & Meen',
    assigned_area: 'Lakes State (Rumbek Centre, Yirol & Cueibet)',
    active_tasks: 2,
    completed_tasks: 25,
    pending_reports: 1,
    approved_reports: 24,
    workload_percentage: 45,
    status: 'Active',
    managed_field_workers: 5,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'sup-5',
    name: 'Garang Deng Akol',
    email: 'garang.deng@adra.org',
    phone: '+211-920-000015',
    programme_id: 'prg1',
    programme_name: 'Emergency Food Security & Livelihoods Resilience',
    state: 'Northern Bahr el Ghazal',
    county: 'Aweil Centre',
    payam: 'Aweil Town',
    boma: 'Maper & Malweil',
    assigned_area: 'Northern Bahr el Ghazal State (Aweil Centre, East & North)',
    active_tasks: 3,
    completed_tasks: 31,
    pending_reports: 1,
    approved_reports: 30,
    workload_percentage: 55,
    status: 'Active',
    managed_field_workers: 6,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'sup-6',
    name: 'Nyaluak Gatluak',
    email: 'nyaluak.gatluak@adra.org',
    phone: '+211-920-000016',
    programme_id: 'prg5',
    programme_name: 'Rapid Emergency Disaster Response & Shelter Recovery',
    state: 'Unity',
    county: 'Rubkona',
    payam: 'Bentiu Town',
    boma: 'Sector 2 & Rubkona Port',
    assigned_area: 'Unity State (Bentiu, Rubkona, Leer & Mayom)',
    active_tasks: 5,
    completed_tasks: 21,
    pending_reports: 2,
    approved_reports: 19,
    workload_percentage: 75,
    status: 'Active',
    managed_field_workers: 5,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'sup-7',
    name: 'Amina Hassan',
    email: 'amina.hassan@adra.org',
    phone: '+211-920-000013',
    programme_id: 'prg4',
    programme_name: 'Maternal, Infant & Child Health and Nutrition',
    state: 'Upper Nile',
    county: 'Malakal',
    payam: 'Malakal Central',
    boma: 'Sector 3 & POC Zone',
    assigned_area: 'Upper Nile State (Malakal Town, Renk & Maban)',
    active_tasks: 2,
    completed_tasks: 22,
    pending_reports: 0,
    approved_reports: 22,
    workload_percentage: 40,
    status: 'Active',
    managed_field_workers: 4,
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'sup-8',
    name: 'Achol Malual',
    email: 'achol.malual@adra.org',
    phone: '+211-920-000017',
    programme_id: 'prg1',
    programme_name: 'Emergency Food Security & Livelihoods Resilience',
    state: 'Warrap',
    county: 'Gogrial West',
    payam: 'Kuajok Town',
    boma: 'Alek & Gogrial Central',
    assigned_area: 'Warrap State (Kuajok, Tonj South & Twic)',
    active_tasks: 3,
    completed_tasks: 27,
    pending_reports: 1,
    approved_reports: 26,
    workload_percentage: 60,
    status: 'Active',
    managed_field_workers: 5,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'sup-9',
    name: 'Michael Loba',
    email: 'michael.loba@adra.org',
    phone: '+211-920-000018',
    programme_id: 'prg2',
    programme_name: 'Sustainable WASH & Clean Water Infrastructure',
    state: 'Western Bahr el Ghazal',
    county: 'Wau',
    payam: 'Wau North',
    boma: 'Hai Kosti & Bazia',
    assigned_area: 'Western Bahr el Ghazal State (Wau, Raja & Jur River)',
    active_tasks: 2,
    completed_tasks: 29,
    pending_reports: 0,
    approved_reports: 29,
    workload_percentage: 45,
    status: 'Active',
    managed_field_workers: 5,
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'sup-10',
    name: 'Grace Samuel Zambia',
    email: 'grace.zambia@adra.org',
    phone: '+211-920-000019',
    programme_id: 'prg3',
    programme_name: 'Youth Livelihoods, Vocational Empowerment & Entrepreneurship',
    state: 'Western Equatoria',
    county: 'Yambio',
    payam: 'Yambio Central',
    boma: 'Hai Gabat & Ikpiro',
    assigned_area: 'Western Equatoria State (Yambio, Maridi & Nzara)',
    active_tasks: 3,
    completed_tasks: 26,
    pending_reports: 1,
    approved_reports: 25,
    workload_percentage: 50,
    status: 'Active',
    managed_field_workers: 6,
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'sup-11',
    name: 'Baba Konyi',
    email: 'baba.konyi@adra.org',
    phone: '+211-920-000020',
    programme_id: 'prg5',
    programme_name: 'Rapid Emergency Disaster Response & Shelter Recovery',
    state: 'Administrative Areas',
    county: 'Pibor',
    payam: 'Pibor Town',
    boma: 'Verteth & Manyabol',
    assigned_area: 'Administrative Areas (Greater Pibor, Abyei & Ruweng)',
    active_tasks: 4,
    completed_tasks: 18,
    pending_reports: 2,
    approved_reports: 16,
    workload_percentage: 70,
    status: 'Active',
    managed_field_workers: 4,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
  }
];

export const initialProgramResources = [
  {
    id: 'res-1',
    name: 'Fortified Maize Flour (25kg Bag)',
    category: 'Food Commodities',
    program_id: 'prg1',
    programme: 'Emergency Food Security & Livelihoods Resilience',
    warehouse: 'Kapoeta Central Humanitarian Hub',
    quantity_available: 4800,
    quantity_allocated: 3600,
    quantity_distributed: 2400,
    remaining_quantity: 1200,
    unit: 'Bags',
    low_stock_threshold: 500,
    unit_cost: 28.50,
    status: 'Normal'
  },
  {
    id: 'res-2',
    name: 'Yellow Split Peas / Pulses (10kg Bag)',
    category: 'Food Commodities',
    program_id: 'prg1',
    programme: 'Emergency Food Security & Livelihoods Resilience',
    warehouse: 'Kapoeta Central Humanitarian Hub',
    quantity_available: 2400,
    quantity_allocated: 2000,
    quantity_distributed: 1500,
    remaining_quantity: 400,
    unit: 'Bags',
    low_stock_threshold: 450,
    unit_cost: 16.20,
    status: 'Low Stock'
  },
  {
    id: 'res-3',
    name: 'Certified Drought-Resistant Sorghum Seeds (15kg)',
    category: 'Agricultural Inputs',
    program_id: 'prg1',
    programme: 'Emergency Food Security & Livelihoods Resilience',
    warehouse: 'Torit Seed Store',
    quantity_available: 1500,
    quantity_allocated: 1200,
    quantity_distributed: 950,
    remaining_quantity: 300,
    unit: 'Packs',
    low_stock_threshold: 200,
    unit_cost: 32.00,
    status: 'Normal'
  },
  {
    id: 'res-4',
    name: 'Food-Grade 20L Water Jerricans',
    category: 'WASH Equipment',
    program_id: 'prg2',
    programme: 'Sustainable WASH & Clean Water Infrastructure',
    warehouse: 'Juba Central Logistics Base',
    quantity_available: 3000,
    quantity_allocated: 2850,
    quantity_distributed: 2600,
    remaining_quantity: 150,
    unit: 'Units',
    low_stock_threshold: 400,
    unit_cost: 6.80,
    status: 'Low Stock'
  },
  {
    id: 'res-5',
    name: 'Aquatabs Water Purification Strips (100 Tabs)',
    category: 'WASH Equipment',
    program_id: 'prg2',
    programme: 'Sustainable WASH & Clean Water Infrastructure',
    warehouse: 'Juba Central Logistics Base',
    quantity_available: 10000,
    quantity_allocated: 7500,
    quantity_distributed: 6200,
    remaining_quantity: 2500,
    unit: 'Boxes',
    low_stock_threshold: 1000,
    unit_cost: 4.50,
    status: 'Normal'
  },
  {
    id: 'res-6',
    name: 'Solar PV Electrician Apprenticeship Toolkits',
    category: 'Vocational Toolsets',
    program_id: 'prg3',
    programme: 'Youth Livelihoods, Vocational Empowerment & Entrepreneurship',
    warehouse: 'Hope TTI Mathare Campus',
    quantity_available: 500,
    quantity_allocated: 420,
    quantity_distributed: 350,
    remaining_quantity: 80,
    unit: 'Toolkits',
    low_stock_threshold: 100,
    unit_cost: 145.00,
    status: 'Low Stock'
  },
  {
    id: 'res-7',
    name: 'Plumpy\'Nut Ready-to-Use Therapeutic Food (RUSF)',
    category: 'Health & Nutrition',
    program_id: 'prg4',
    programme: 'Maternal, Infant & Child Health and Nutrition',
    warehouse: 'Wajir Emergency Health Clinic',
    quantity_available: 1200,
    quantity_allocated: 900,
    quantity_distributed: 780,
    remaining_quantity: 300,
    unit: 'Cartons',
    low_stock_threshold: 250,
    unit_cost: 55.00,
    status: 'Normal'
  },
  {
    id: 'res-8',
    name: 'Family Disaster Shelter Tarpaulin & Tent Kits',
    category: 'Emergency Shelter & NFI',
    program_id: 'prg5',
    programme: 'Rapid Emergency Disaster Response & Shelter Recovery',
    warehouse: 'Bor Riverine Emergency Depot',
    quantity_available: 800,
    quantity_allocated: 720,
    quantity_distributed: 650,
    remaining_quantity: 80,
    unit: 'Kits',
    low_stock_threshold: 120,
    unit_cost: 92.00,
    status: 'Low Stock'
  }
];

export const initialFieldActivities = [
  {
    id: 'act-201',
    request_id: 'req-102',
    activity_code: 'ACT-SS-2026-001',
    programme: 'Sustainable WASH & Clean Water Infrastructure (SWCWI)',
    activity_type: 'WASH Jerrican & Aquatabs Verification Delivery',
    supervisor_id: 'sup-1',
    supervisor_name: 'Emmanuel Adeyemi',
    field_worker_name: 'Amina Abdi',
    location: 'Kapoeta South, Longeleya, Hai Malakal South',
    state: 'Eastern Equatoria',
    county: 'Kapoeta South',
    scheduled_date: '2026-09-14',
    completion_date: null,
    status: 'Scheduled',
    progress_percentage: 45,
    field_notes: 'Community mobilization confirmed with Payam elder. Token validation ready.'
  },
  {
    id: 'act-202',
    request_id: 'req-105',
    activity_code: 'ACT-SS-2026-002',
    programme: 'Sustainable WASH & Clean Water Infrastructure (SWCWI)',
    activity_type: 'Home-Delivery of Assistive WASH Pack for Elder',
    supervisor_id: 'sup-1',
    supervisor_name: 'Emmanuel Adeyemi',
    field_worker_name: 'Amina Abdi',
    location: 'Kapoeta South, Township Central, Zone 3',
    state: 'Eastern Equatoria',
    county: 'Kapoeta South',
    scheduled_date: '2026-09-12',
    completion_date: null,
    status: 'In Progress',
    progress_percentage: 75,
    field_notes: 'Jerrican kit loaded onto field motorcycle. Approaching beneficiary compound.'
  },
  {
    id: 'act-203',
    request_id: 'req-106',
    activity_code: 'ACT-SS-2026-003',
    programme: 'Youth Livelihoods, Vocational Empowerment & Entrepreneurship',
    activity_type: 'Solar PV Apprenticeship Toolkit Handover & Verification',
    supervisor_id: 'sup-2',
    supervisor_name: 'Mary Akech',
    field_worker_name: 'John Mwangi',
    location: 'Juba, Juba Na Bari, Block 2',
    state: 'Central Equatoria',
    county: 'Juba',
    scheduled_date: '2026-08-28',
    completion_date: '2026-08-28',
    status: 'Completed',
    progress_percentage: 100,
    field_notes: 'Toolkit successfully handed over. Signed receipt and serial number logged.'
  },
  {
    id: 'act-204',
    request_id: 'req-104',
    activity_code: 'ACT-SS-2026-004',
    programme: 'Emergency Food Security & Livelihoods Resilience (EFSLR)',
    activity_type: 'Agronomy Seed Assessment & Land Tillage Inspection',
    supervisor_id: 'sup-2',
    supervisor_name: 'Mary Akech',
    field_worker_name: 'Pending Assignment',
    location: 'Juba, Juba Na Bari, Block 4',
    state: 'Central Equatoria',
    county: 'Juba',
    scheduled_date: '2026-09-16',
    completion_date: null,
    status: 'Assigned',
    progress_percentage: 20,
    field_notes: 'Supervisor Mary Akech assigned. Field worker dispatch pending.'
  },
  {
    id: 'act-205',
    request_id: 'req-108',
    activity_code: 'ACT-SS-2026-005',
    programme: 'Rapid Emergency Disaster Response & Shelter Recovery',
    activity_type: 'Flood Damage Ground Verification & GPS Tagging',
    supervisor_id: 'sup-3',
    supervisor_name: 'David Deng',
    field_worker_name: 'Pending Assignment',
    location: 'Bor, Baidit, Makol Chuei',
    state: 'Jonglei',
    county: 'Bor',
    scheduled_date: '2026-09-13',
    completion_date: null,
    status: 'Pending Assignment',
    progress_percentage: 0,
    field_notes: 'Rapid verification task created upon emergency flood report.'
  }
];

export const initialBeneficiaryComplaints = [
  {
    id: 'cmp-1',
    ticket_code: 'CMP-2025-001',
    beneficiary_id: 'b7',
    beneficiary_name: 'Mary Nyambura',
    category: 'Distribution Logistics',
    severity: 'Medium',
    is_anonymous: false,
    subject: 'Long waiting hours at Lodwar depot checkpoint',
    description: 'During the July 18 distribution, elderly and mothers with infants queued for over 4 hours under the sun before registration desks opened.',
    status: 'Resolved',
    created_at: '2025-07-19T10:00:00Z',
    resolution_notes: 'Shaded waiting canopy and priority queue line for vulnerable mothers established for all future distributions.',
    resolved_by: 'David Ochieng (Compliance Officer)',
    resolved_at: '2025-07-24T16:00:00Z'
  }
];

export const initialAidDistributions = [
  {
    id: 'dist-1',
    distribution_code: 'DST-2025-08',
    project_id: 'pr1',
    project_name: 'Drought Resilience & Climate-Smart Agriculture',
    title: 'September Emergency Food & Nutrition Dispatch',
    centre_name: 'Lodwar Central Humanitarian Depot',
    location: 'Turkana West, Lodwar Town (Opposite County Commissioner)',
    date: '2025-09-15',
    time_window: '08:30 AM - 03:30 PM',
    status: 'Upcoming',
    allocated_items: [
      '25kg Fortified Maize Flour',
      '10kg Yellow Split Peas / Pulses',
      '5 Litres Fortified Vegetable Oil',
      '1kg Iodized Salt',
      '500g Super Cereal (CSB+) for Children'
    ],
    collection_token: 'TKN-LOD-9182',
    officer_in_charge: 'John Mwangi (+254-712-889900)',
    instructions: 'Please bring your digital or printed ADRA Beneficiary ID with QR code. Face-to-face biometric or token verification required upon entry.'
  },
  {
    id: 'dist-2',
    distribution_code: 'DST-2025-09',
    project_id: 'pr2',
    project_name: 'Clean Water Access & WASH Infrastructure',
    title: 'Q4 Community Hygiene & Jerrycan Allocation',
    centre_name: 'Kakuma Community Water Point 3',
    location: 'Kakuma Sub-County, Turkana North',
    date: '2025-09-28',
    time_window: '09:00 AM - 01:00 PM',
    status: 'Scheduled',
    allocated_items: [
      '2 x 20L Food-grade Water Jerrycans',
      'Aquatabs Water Purification Pack (100 tablets)',
      '1 Family Hygiene Bar Soap Pack (6 bars)'
    ],
    collection_token: 'TKN-KAK-4412',
    officer_in_charge: 'Sarah Kimani (+254-723-778811)',
    instructions: 'Each household receives 1 package. Tokens can be redeemed by designated secondary household representative.'
  }
];

export const initialBeneficiaryFaqs = [
  {
    id: 'bfaq-1',
    category: 'Eligibility & Registration',
    question: 'How do I know if my household qualifies for ADRA emergency assistance?',
    answer: 'ADRA prioritizes the most vulnerable community members including female-headed households, elderly individuals living alone, persons with severe disabilities, orphans, and families displaced by climate disasters. Registration is verified by local community elders and ADRA field assessment officers.'
  },
  {
    id: 'bfaq-2',
    category: 'Beneficiary ID & Verification',
    question: 'What do I do if I lose my phone or cannot print my digital Beneficiary ID card?',
    answer: 'Your unique Beneficiary ID number (e.g., BEN-2025-007) and phone number are recorded in the central database. When you visit any ADRA distribution centre or field office, our officer can look up your record using your National ID, phone number, or biometric verification.'
  },
  {
    id: 'bfaq-3',
    category: 'Aid Collection',
    question: 'Can a family member collect my allocated rations on my behalf?',
    answer: 'Yes. When submitting a request or updating your profile, register an Emergency Contact / Secondary Representative. The designated person must present your digital token and a valid identification document at the distribution point.'
  },
  {
    id: 'bfaq-4',
    category: 'Complaints & Confidentiality',
    question: 'Is it safe to report an issue or complaint about aid distribution?',
    answer: 'Yes, 100%. ADRA has a strict zero-retaliation policy. You can submit complaints anonymously through the "Feedback & Complaints" tab in this portal. All reports are routed directly to the Independent Compliance and Safeguarding team.'
  }
];

export const approvedAdraContacts = [
  {
    id: 'cont-1',
    office: 'National Headquarters (Nairobi)',
    address: 'ADRA Complex, Riverside Drive, Westlands, Nairobi',
    phone: '+254-20-2718870',
    toll_free_hotline: '0800-720-112',
    email: 'info@adrakenya.org',
    whatsapp: '+254-712-345678',
    hours: 'Monday - Thursday: 8:00 AM - 5:00 PM, Friday: 8:00 AM - 1:00 PM'
  },
  {
    id: 'cont-2',
    office: 'Turkana Regional Field Office (Lodwar)',
    address: 'Opposite County Commissioner compound, Lodwar Town',
    phone: '+254-718-990011',
    toll_free_hotline: '0800-720-112',
    email: 'turkana.field@adrakenya.org',
    whatsapp: '+254-718-990011',
    hours: 'Monday - Friday: 8:00 AM - 4:30 PM'
  },
  {
    id: 'cont-3',
    office: 'Garissa Regional Field Office',
    address: 'Kismayu Road, Next to Red Cross Centre, Garissa',
    phone: '+254-722-556677',
    toll_free_hotline: '0800-720-112',
    email: 'garissa.field@adrakenya.org',
    whatsapp: '+254-722-556677',
    hours: 'Monday - Friday: 8:00 AM - 4:30 PM'
  },
  {
    id: 'cont-4',
    office: 'Moyale Sub-County Field Base',
    address: 'Moyale Town Centre, Marsabit County',
    phone: '+254-733-441122',
    toll_free_hotline: '0800-720-112',
    email: 'moyale.field@adrakenya.org',
    whatsapp: '+254-733-441122',
    hours: 'Monday - Friday: 8:00 AM - 4:00 PM'
  }
];

// --- 55 SOUTH SUDAN FIELD WORKERS (5 PER STATE SUPERVISOR) ---
export { initialFieldWorkers } from './fieldWorkersRoster.js';

// --- FIELD ASSESSMENTS & REPORTS ---
export const initialFieldAssessments = [
  {
    id: 'ass-892',
    assessment_code: 'FA-00892',
    request_id: 'req-140',
    request_code: 'ADR-REQ-2026-00140',
    beneficiary_id: 'b7',
    beneficiary_code: 'ADRA-SS-000125',
    beneficiary_name: 'Mary Nyambura',
    field_worker_id: 'fw-1',
    field_worker_name: 'John Deng',
    supervisor_id: 'sup-1',
    supervisor_name: 'Emmanuel Adeyemi',
    programme: 'Emergency Food Security & Livelihoods Resilience',
    assistance_requested: 'Emergency Household Food Rations & Water Kit',
    date_conducted: '2026-09-12',
    submission_date: '2026-09-12T16:30:00Z',
    status: 'Under Supervisor Review',
    state: 'Eastern Equatoria',
    county: 'Kapoeta South',
    payam: 'Kapoeta Town',
    boma: 'Machi',
    village: 'Zone 4 Camp',
    location: 'Eastern Equatoria, Kapoeta South, Kapoeta Town, Machi, Zone 4 Camp',
    household_members: 6,
    vulnerability_level: 'High Vulnerability (Female Headed, 3 Children < 5)',
    assessment_findings: {
      household_composition: '6 total residents: 1 female head (Mary Nyambura), 1 elderly grandmother (72 yrs), 4 children (ages 2, 4, 7, 11).',
      food_security_status: 'Severe food gap (IPC Phase 4 border). Surviving on 1 meal per day of boiled wild leaves and leftover maize. Food reserves depleted for 18 days.',
      shelter_condition: 'Semi-permanent thatched structure (tukul) with damaged roof tarpaulin. Low flood protection.',
      water_sanitation: 'Nearest functional borehole is 4.2 km away. Household currently collects unpurified water from seasonal dry riverbed scoop holes.',
      livelihood_assets: 'Zero livestock remaining following dry season loss. No active source of income or remittances.'
    },
    recommendations: {
      assistance_type: 'Immediate Emergency Food Ration Pack + Household WASH & Jerrycan Kit',
      recommended_quantity: '50kg Fortified Maize Meal, 20kg Yellow Split Peas, 5L Fortified Oil, 2x 20L Jerrycans, 100x Aquatabs Purifier',
      urgency_rating: 'Critical / Immediate Dispatch',
      target_distribution_depot: 'Kapoeta Central Humanitarian Hub'
    },
    evidence_photos: [
      {
        id: 'ev-1',
        title: 'Household Verification & Family Registry',
        caption: 'Field Worker John Deng conducting on-site verification with Mary Nyambura.',
        url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'ev-2',
        title: 'Depleted Food Store & Cooking Tukul',
        caption: 'Empty food store container verified at compound in Machi Boma.',
        url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80'
      }
    ],
    field_worker_notes: 'Beneficiary meets all vulnerability criteria under EFSLR Phase II. Biometric thumbprint and National ID cross-checked with community elders. High priority for immediate allocation.',
    supervisor_notes: '',
    correction_reason: null
  },
  {
    id: 'ass-890',
    assessment_code: 'FA-00890',
    request_id: 'req-141',
    request_code: 'ADR-REQ-2026-00141',
    beneficiary_id: 'b8',
    beneficiary_code: 'ADRA-SS-000126',
    beneficiary_name: 'John Garang Akot',
    field_worker_id: 'fw-2',
    field_worker_name: 'Mary James',
    supervisor_id: 'sup-1',
    supervisor_name: 'Emmanuel Adeyemi',
    programme: 'Emergency Food Security & Livelihoods Resilience',
    assistance_requested: 'Drought-Resistant Sorghum Seeds & Tool Pack',
    date_conducted: '2026-09-11',
    submission_date: '2026-09-11T14:15:00Z',
    status: 'Correction Required',
    state: 'Eastern Equatoria',
    county: 'Kapoeta South',
    payam: 'Longeleya',
    boma: 'Hai Malakal South',
    village: 'Longeleya Block 2',
    location: 'Eastern Equatoria, Kapoeta South, Longeleya, Hai Malakal South',
    household_members: 5,
    vulnerability_level: 'Medium Vulnerability (Smallholder Agro-pastoralist)',
    assessment_findings: {
      household_composition: '5 residents: 2 adults, 3 school-age children.',
      food_security_status: 'Moderate food stress (IPC Phase 3). Has 1 hectare of tilled farmland ready for early planting.',
      shelter_condition: 'Stable thatched tukul compound.',
      water_sanitation: 'Has access to community hand-pump 800m away.',
      livelihood_assets: 'Owns 3 goats and hand tools.'
    },
    recommendations: {
      assistance_type: 'Certified Sorghum Seeds (15kg) & Drip Irrigation Accessories',
      recommended_quantity: '1 Standard Agronomy Support Kit',
      urgency_rating: 'High / Upcoming Planting Window',
      target_distribution_depot: 'Kapoeta South Extension Office'
    },
    evidence_photos: [
      {
        id: 'ev-3',
        title: 'Farmland Inspection',
        caption: 'Inspection of tilled agricultural parcel in Longeleya.',
        url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80'
      }
    ],
    field_worker_notes: 'Farmland is ready for certified seeds disbursement.',
    supervisor_notes: 'Returned for correction: Please provide clearer evidence of household vulnerability verification and co-signature of Payam administrator.',
    correction_reason: 'Please provide clearer evidence of household vulnerability verification and co-signature of Payam administrator.'
  },
  {
    id: 'ass-885',
    assessment_code: 'FA-00885',
    request_id: 'req-135',
    request_code: 'ADR-REQ-2026-00135',
    beneficiary_id: 'b9',
    beneficiary_code: 'ADRA-SS-000127',
    beneficiary_name: 'Rebecca Nyandeng',
    field_worker_id: 'fw-3',
    field_worker_name: 'Amina Abdi',
    supervisor_id: 'sup-1',
    supervisor_name: 'Emmanuel Adeyemi',
    programme: 'Sustainable WASH & Clean Water Infrastructure',
    assistance_requested: 'Solar Borehole Water Access & Hygiene Kit',
    date_conducted: '2026-09-08',
    submission_date: '2026-09-08T11:00:00Z',
    status: 'Forwarded to Program Manager',
    state: 'Eastern Equatoria',
    county: 'Kapoeta South',
    payam: 'Kapoeta Town',
    boma: 'Machi',
    village: 'Machi East',
    location: 'Eastern Equatoria, Kapoeta South, Kapoeta Town, Machi',
    household_members: 7,
    vulnerability_level: 'High Vulnerability (Displaced Household)',
    assessment_findings: {
      household_composition: '7 residents including 2 disabled family members.',
      food_security_status: 'High reliance on emergency assistance.',
      shelter_condition: 'Displacement tent in community transit site.',
      water_sanitation: 'Severe lack of clean water containers.',
      livelihood_assets: 'None.'
    },
    recommendations: {
      assistance_type: 'WASH Jerrycan & Aquatabs Pack',
      recommended_quantity: '2 Jerrycans + 200 Aquatabs',
      urgency_rating: 'High',
      target_distribution_depot: 'Kapoeta Central Humanitarian Hub'
    },
    evidence_photos: [],
    field_worker_notes: 'Verified displaced status. Recommended for full allocation.',
    supervisor_notes: 'Verified by Supervisor Emmanuel Adeyemi. Forwarded with recommendation for approval to Program Manager Grace Ochieng.',
    correction_reason: null
  }
];

// --- SUPERVISOR NOTIFICATIONS ---
export const initialSupervisorNotifications = [
  {
    id: 'snotif-1',
    title: 'New Assignment from Program Manager',
    message: 'Program Manager Grace Ochieng assigned assistance request ADR-REQ-2026-00140 to your team.',
    type: 'assignment',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    is_read: false,
    link_id: 'ADR-REQ-2026-00140'
  },
  {
    id: 'snotif-2',
    title: 'Assessment Report Submitted',
    message: 'John Deng submitted field assessment FA-00892 for Mary Nyambura. Review required.',
    type: 'report_submitted',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    is_read: false,
    link_id: 'FA-00892'
  },
  {
    id: 'snotif-3',
    title: 'Field Worker Accepted Assignment',
    message: 'Mary James accepted assignment for request ADR-REQ-2026-00141.',
    type: 'accepted',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    is_read: true,
    link_id: 'ADR-REQ-2026-00141'
  },
  {
    id: 'snotif-4',
    title: 'Program Manager Feedback',
    message: 'Grace Ochieng approved your forwarded report FA-00880 for distribution.',
    type: 'pm_feedback',
    created_at: new Date(Date.now() - 3600000 * 28).toISOString(),
    is_read: true,
    link_id: 'FA-00880'
  },
  {
    id: 'snotif-5',
    title: 'Overdue Activity Alert',
    message: 'Water Point GPS tagging in Torit is overdue by 24 hours (Assigned: Peter Lado).',
    type: 'overdue',
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    is_read: true,
    link_id: 'ACT-SS-2026-004'
  }
];

// --- SUPERVISOR RECENT ACTIVITY STREAM ---
export const initialSupervisorActivities = [
  {
    id: 'sact-1',
    user_name: 'John Deng',
    role: 'Field Worker',
    action: 'SUBMIT_REPORT',
    details: 'John Deng completed assessment FA-00892 for Mary Nyambura.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'sact-2',
    user_name: 'Emmanuel Adeyemi',
    role: 'Supervisor',
    action: 'ASSIGN_WORKER',
    details: 'You assigned request ADR-REQ-2026-00140 to John Deng.',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'sact-3',
    user_name: 'Grace Ochieng',
    role: 'Program Manager',
    action: 'ASSIGN_SUPERVISOR',
    details: 'Program Manager assigned request ADR-REQ-2026-00140 to your operational area.',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 'sact-4',
    user_name: 'Emmanuel Adeyemi',
    role: 'Supervisor',
    action: 'REQUEST_CORRECTION',
    details: 'You requested correction for FA-00890 from Mary James.',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'sact-5',
    user_name: 'Mary James',
    role: 'Field Worker',
    action: 'ACCEPT_TASK',
    details: 'Mary James accepted assignment for request ADR-REQ-2026-00141.',
    created_at: new Date(Date.now() - 3600000 * 28).toISOString()
  },
  {
    id: 'sact-6',
    user_name: 'Emmanuel Adeyemi',
    role: 'Supervisor',
    action: 'FORWARD_REPORT',
    details: 'You forwarded assessment FA-00885 to Program Manager Grace Ochieng.',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];



