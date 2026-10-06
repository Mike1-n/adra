-- ============================================================================
-- ADRA Development Management System - Seed Data
-- Valid UUID hex format for PostgreSQL
-- ============================================================================

-- Clean up any existing data in reverse FK order
TRUNCATE TABLE public.project_documents CASCADE;
TRUNCATE TABLE public.audit_logs CASCADE;
TRUNCATE TABLE public.expenditures CASCADE;
TRUNCATE TABLE public.budgets CASCADE;
TRUNCATE TABLE public.indicators CASCADE;
TRUNCATE TABLE public.interventions CASCADE;
TRUNCATE TABLE public.activities CASCADE;
TRUNCATE TABLE public.beneficiaries CASCADE;
TRUNCATE TABLE public.projects CASCADE;
TRUNCATE TABLE public.partners CASCADE;
TRUNCATE TABLE public.donors CASCADE;

-- 1. Insert Donors
INSERT INTO public.donors (id, donor_name, contact_person, email, phone, funding_amount, funding_date) VALUES
('d1111111-1111-1111-1111-111111111111', 'USAID (Bureau for Humanitarian Assistance)', 'Sarah Jenkins', 'sjenkins@usaid.gov', '+1-202-555-0143', 2500000.00, '2025-01-15'),
('d2222222-2222-2222-2222-222222222222', 'European Commission (ECHO)', 'Marc Dupont', 'm.dupont@ec.europa.eu', '+32-2-299-1111', 1800000.00, '2025-03-01'),
('d3333333-3333-3333-3333-333333333333', 'ADRA International Partnership Fund', 'Dr. David Miller', 'dmiller@adra.org', '+1-301-680-6000', 950000.00, '2025-02-10'),
('d4444444-4444-4444-4444-444444444444', 'Global Affairs Canada (GAC)', 'Elena Rostova', 'elena.rostova@international.gc.ca', '+1-613-996-2000', 1200000.00, '2025-04-20');

-- 2. Insert Partners
INSERT INTO public.partners (id, partner_name, contact_person, email, phone, description) VALUES
('e1111111-1111-1111-1111-111111111111', 'Ministry of Agriculture and Food Security', 'Eng. Samuel Otieno', 's.otieno@agriculture.gov.ke', '+254-20-2718870', 'Government partner supporting agronomy extension and seed quality certification.'),
('e2222222-2222-2222-2222-222222222222', 'Community Water & Sanitation Trust', 'Amina Hassan', 'ahassan@waterstrust.org', '+254-722-123456', 'Local NGO specialized in solar borehole rehabilitation and hygiene promotion.'),
('e3333333-3333-3333-3333-333333333333', 'Hope Technical Training Institute', 'Pastor Joseph Kiprotich', 'admin@hopetti.ac.ke', '+254-733-987654', 'Vocational institute providing accredited technical and youth empowerment courses.');

-- 3. Insert Projects
INSERT INTO public.projects (id, project_code, project_name, description, start_date, end_date, location, budget, status, donor_id, partner_id) VALUES
('f1111111-1111-1111-1111-111111111111', 'PRJ-2025-001', 'Drought Resilience & Climate-Smart Agriculture (DR-CSA)', 'Enhancing food security and climate-smart agronomy for 3,500 vulnerable smallholder farmers across semi-arid zones.', '2025-01-01', '2026-12-31', 'Turkana & Garissa Counties', 1450000.00, 'Active', 'd1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111'),
('f2222222-2222-2222-2222-222222222222', 'PRJ-2025-002', 'Clean Water Access & WASH Infrastructure Expansion', 'Drilling solar-powered community boreholes and promoting sanitation practices in underserved rural primary schools.', '2025-02-15', '2025-11-30', 'Marsabit District', 680000.00, 'Active', 'd2222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222'),
('f3333333-3333-3333-3333-333333333333', 'PRJ-2025-003', 'Youth Vocational Livelihoods & Entrepreneurship', 'Equipping marginalized out-of-school youth and young women with vocational skills, toolkits, and micro-grant seed capital.', '2025-03-01', '2026-02-28', 'Nairobi Urban Settlements', 520000.00, 'Active', 'd3333333-3333-3333-3333-333333333333', 'e3333333-3333-3333-3333-333333333333'),
('f4444444-4444-4444-4444-444444444444', 'PRJ-2024-004', 'Emergency Flood Relief & Shelter Rehabilitation', 'Provided emergency cash grants, hygiene kits, and temporary shelter rehabilitation for households affected by El Niño flooding.', '2024-04-01', '2024-12-15', 'Tana River Basin', 890000.00, 'Completed', 'd4444444-4444-4444-4444-444444444444', 'e2222222-2222-2222-2222-222222222222'),
('f5555555-5555-5555-5555-555555555555', 'PRJ-2026-005', 'Maternal & Child Nutrition Support Initiative', 'Community-based screening, supplementary therapeutic feeding, and hygiene education for mothers with under-5 children.', '2026-04-01', '2027-03-31', 'Wajir South', 750000.00, 'Planned', 'd1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111');

-- 4. Insert Beneficiaries
INSERT INTO public.beneficiaries (id, beneficiary_code, full_name, gender, date_of_birth, age, phone_number, location, vulnerability_category, registration_date, project_id) VALUES
('b1111111-1111-1111-1111-111111111111', 'BEN-2025-001', 'Grace Akinyi Omolo', 'Female', '1984-05-12', 41, '+254-712-345678', 'Lodwar Village, Turkana', 'Female-headed Household', '2025-01-10', 'f1111111-1111-1111-1111-111111111111'),
('b2222222-2222-2222-2222-222222222222', 'BEN-2025-002', 'Abdullahi Mohamed Noor', 'Male', '1970-11-03', 55, '+254-723-456789', 'Garissa Central Ward', 'Extremely Poor Household', '2025-01-14', 'f1111111-1111-1111-1111-111111111111'),
('b3333333-3333-3333-3333-333333333333', 'BEN-2025-003', 'Fatuma Halake Wako', 'Female', '1959-08-22', 66, '+254-734-567890', 'Moyale Sub-county', 'Elderly', '2025-02-18', 'f2222222-2222-2222-2222-222222222222'),
('b4444444-4444-4444-4444-444444444444', 'BEN-2025-004', 'Kevin Mwangi Kamau', 'Male', '2003-03-15', 22, '+254-745-678901', 'Mathare North, Nairobi', 'Youth at Risk', '2025-03-05', 'f3333333-3333-3333-3333-333333333333'),
('b5555555-5555-5555-5555-555555555555', 'BEN-2025-005', 'Joyce Chebet Rono', 'Female', '2001-09-28', 24, '+254-756-789012', 'Kibera Lindi, Nairobi', 'Persons with Disability', '2025-03-08', 'f3333333-3333-3333-3333-333333333333'),
('b6666666-6666-6666-6666-666666666666', 'BEN-2025-006', 'Hassan Ali Warsame', 'Male', '1988-12-04', 37, '+254-767-890123', 'Hola Town, Tana River', 'Internally Displaced Person (IDP)', '2024-04-12', 'f4444444-4444-4444-4444-444444444444');

-- 5. Insert Activities
INSERT INTO public.activities (id, activity_code, project_id, activity_name, description, activity_date, location, status, expected_output, actual_output) VALUES
('a1111111-1111-1111-1111-111111111111', 'ACT-2025-101', 'f1111111-1111-1111-1111-111111111111', 'Drought-Tolerant Seed & Drip Irrigation Kit Distribution', 'Procure and distribute certified sorghum, cowpea seeds, and solar drip sets to farmer cluster groups.', '2025-02-10', 'Lodwar Agricultural Center', 'Completed', 'Distribute kits to 500 farmer heads', 'Successfully distributed to 520 registered farmers with verified sign-off sheets.'),
('a2222222-2222-2222-2222-222222222222', 'ACT-2025-102', 'f1111111-1111-1111-1111-111111111111', 'Farmer Field School (FFS) Agronomy Training', 'Hands-on training sessions in soil moisture retention, mulching, pest management, and post-harvest storage.', '2025-03-15', 'Garissa Training Demo Farm', 'Ongoing', 'Train 25 Farmer Field School cohorts', '18 cohorts trained to date; remaining 7 scheduled for next month.'),
('a3333333-3333-3333-3333-333333333333', 'ACT-2025-201', 'f2222222-2222-2222-2222-222222222222', 'Solar-Powered Borehole Drilling & Water Quality Testing', 'Drilling two high-yield boreholes, installing submersible DC pumps, overhead storage tanks, and solar arrays.', '2025-03-20', 'Marsabit Township & Bubisa', 'Ongoing', '2 operational boreholes with potability certification', 'Site 1 drilling and casing complete; solar array installation underway.'),
('a4444444-4444-4444-4444-444444444444', 'ACT-2025-301', 'f3333333-3333-3333-3333-333333333333', 'Vocational Skills Enrollment & Toolkit Handover', 'Enrolling selected candidates in electrical installation, catering, solar tech, and mechanics courses.', '2025-04-05', 'Hope TTI Mathare Campus', 'Planned', '150 youth enrolled with starters toolkits', 'Course syllabi verified; student induction day scheduled.');

-- 6. Insert Interventions
INSERT INTO public.interventions (id, intervention_code, beneficiary_id, project_id, intervention_type, description, quantity_or_value, intervention_date) VALUES
('c1111111-1111-1111-1111-111111111111', 'INT-2025-001', 'b1111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', 'Agricultural Support', 'Distributed certified drought-resistant sorghum seed pack (15kg) and micro-drip irrigation system.', '1 Irrigation Kit + 15kg Seeds (Value: $180)', '2025-02-12'),
('c2222222-2222-2222-2222-222222222222', 'INT-2025-002', 'b2222222-2222-2222-2222-222222222222', 'f1111111-1111-1111-1111-111111111111', 'Agricultural Support', 'Provision of climate-smart farming tool package (hoe, spade, watering can, sprayers) and bio-fertilizer.', '1 Farm Tool Package (Value: $120)', '2025-02-15'),
('c3333333-3333-3333-3333-333333333333', 'INT-2025-003', 'b3333333-3333-3333-3333-333333333333', 'f2222222-2222-2222-2222-222222222222', 'Water & Sanitation (WASH)', 'Distributed 20-litre food-grade Jerry cans, water purification tablets (Aquatabs 100-pack), and hygiene kit.', '1 WASH Sanitation Pack (Value: $45)', '2025-02-22'),
('c4444444-4444-4444-4444-444444444444', 'INT-2025-004', 'b4444444-4444-4444-4444-444444444444', 'f3333333-3333-3333-3333-333333333333', 'Skills Training', 'Full scholarship tuition payment for 6-month certified Solar PV installation course.', 'Full Tuition Fee Grant ($350)', '2025-03-10'),
('c5555555-5555-5555-5555-555555555555', 'INT-2025-005', 'b6666666-6666-6666-6666-666666666666', 'f4444444-4444-4444-4444-444444444444', 'Cash Transfer', 'Unconditional emergency cash transfer via mobile money for flood-displaced household sustenance.', '2-Month Cash Stipend ($200)', '2024-05-18');

-- 7. Insert Indicators (M&E)
INSERT INTO public.indicators (id, indicator_code, project_id, indicator_name, description, baseline, target, actual_result, measurement_unit, reporting_period) VALUES
('aa111111-1111-1111-1111-111111111111', 'IND-DRCSA-01', 'f1111111-1111-1111-1111-111111111111', 'Farmers adopting climate-smart agricultural techniques', 'Number of smallholder farmers adopting at least 2 climate-smart practices on their farm parcels.', 200, 3500, 2450, 'Farmers', 'Q1 2025'),
('aa222222-2222-2222-2222-222222222222', 'IND-DRCSA-02', 'f1111111-1111-1111-1111-111111111111', 'Hectares of farmland under drip irrigation', 'Total land acreage converted from rain-fed to efficient micro-irrigation systems.', 50, 800, 560, 'Hectares', 'Q1 2025'),
('aa333333-3333-3333-3333-333333333333', 'IND-WASH-01', 'f2222222-2222-2222-2222-222222222222', 'People with daily access to safe drinking water within 500m', 'Community members utilizing newly rehabilitated solar water schemes.', 1500, 12000, 8900, 'Individuals', 'Q1 2025'),
('aa444444-4444-4444-4444-444444444444', 'IND-YOUTH-01', 'f3333333-3333-3333-3333-333333333333', 'Youth graduating with certified marketable skills', 'Trainees completing approved technical syllabus and receiving certification.', 0, 300, 145, 'Youth', 'Semi-Annual 2025'),
('aa555555-5555-5555-5555-555555555555', 'IND-FLOOD-01', 'f4444444-4444-4444-4444-444444444444', 'Flood-affected households receiving essential relief kits', 'Families receiving emergency shelter sheets, hygiene supplies, and water kits.', 0, 2000, 2000, 'Households', 'Final 2024');

-- 8. Insert Budgets (Finance)
INSERT INTO public.budgets (id, project_id, budget_category, allocated_amount, financial_year) VALUES
('ba111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', 'Direct Activity Costs', 850000.00, 'FY 2025'),
('ba222222-2222-2222-2222-222222222222', 'f1111111-1111-1111-1111-111111111111', 'Personnel', 320000.00, 'FY 2025'),
('ba333333-3333-3333-3333-333333333333', 'f1111111-1111-1111-1111-111111111111', 'Equipment & Supplies', 180000.00, 'FY 2025'),
('ba444444-4444-4444-4444-444444444444', 'f1111111-1111-1111-1111-111111111111', 'Administrative / Overhead', 100000.00, 'FY 2025'),
('ba555555-5555-5555-5555-555555555555', 'f2222222-2222-2222-2222-222222222222', 'Direct Activity Costs', 450000.00, 'FY 2025'),
('ba666666-6666-6666-6666-666666666666', 'f2222222-2222-2222-2222-222222222222', 'Equipment & Supplies', 150000.00, 'FY 2025'),
('ba777777-7777-7777-7777-777777777777', 'f3333333-3333-3333-3333-333333333333', 'Training & Workshops', 350000.00, 'FY 2025'),
('ba888888-8888-8888-8888-888888888888', 'f3333333-3333-3333-3333-333333333333', 'Equipment & Supplies', 120000.00, 'FY 2025');

-- 9. Insert Expenditures (Finance)
INSERT INTO public.expenditures (id, expenditure_code, project_id, category, description, amount, expenditure_date, receipt_url) VALUES
('ea111111-1111-1111-1111-111111111111', 'EXP-2025-001', 'f1111111-1111-1111-1111-111111111111', 'Direct Activity Costs', 'Bulk procurement of certified sorghum & drought seeds from certified agro-dealers', 92500.00, '2025-01-28', 'https://example.com/receipts/exp001.pdf'),
('ea222222-2222-2222-2222-222222222222', 'EXP-2025-002', 'f1111111-1111-1111-1111-111111111111', 'Equipment & Supplies', 'Procurement of 500 low-pressure micro drip irrigation lines & fittings', 64800.00, '2025-02-05', 'https://example.com/receipts/exp002.pdf'),
('ea333333-3333-3333-3333-333333333333', 'EXP-2025-003', 'f1111111-1111-1111-1111-111111111111', 'Personnel', 'Agronomy extension field officers salary for January & February 2025', 28000.00, '2025-02-28', 'https://example.com/receipts/exp003.pdf'),
('ea444444-4444-4444-4444-444444444444', 'EXP-2025-004', 'f2222222-2222-2222-2222-222222222222', 'Direct Activity Costs', 'Geophysical hydrogeological surveys & contractor mobilization fee', 48500.00, '2025-02-25', 'https://example.com/receipts/exp004.pdf'),
('ea555555-5555-5555-5555-555555555555', 'EXP-2025-005', 'f3333333-3333-3333-3333-333333333333', 'Training & Workshops', 'First tranche institutional tuition disbursement for 75 students at Hope TTI', 37500.00, '2025-03-05', 'https://example.com/receipts/exp005.pdf');

-- 10. Insert Audit Logs
INSERT INTO public.audit_logs (id, user_email, action, module, record_id, details, created_at) VALUES
(gen_random_uuid(), 'admin@adra.org', 'CREATE', 'Projects', 'PRJ-2025-001', '{"project_name": "Drought Resilience & Climate-Smart Agriculture", "budget": 1450000}'::jsonb, NOW() - INTERVAL '45 days'),
(gen_random_uuid(), 'project.officer@adra.org', 'CREATE', 'Beneficiaries', 'BEN-2025-001', '{"full_name": "Grace Akinyi Omolo", "vulnerability": "Female-headed Household"}'::jsonb, NOW() - INTERVAL '30 days'),
(gen_random_uuid(), 'project.officer@adra.org', 'CREATE', 'Interventions', 'INT-2025-001', '{"type": "Agricultural Support", "beneficiary": "Grace Akinyi Omolo"}'::jsonb, NOW() - INTERVAL '25 days'),
(gen_random_uuid(), 'finance.officer@adra.org', 'CREATE', 'Finance', 'EXP-2025-001', '{"amount": 92500, "category": "Direct Activity Costs"}'::jsonb, NOW() - INTERVAL '20 days'),
(gen_random_uuid(), 'me.officer@adra.org', 'UPDATE', 'M&E', 'IND-DRCSA-01', '{"indicator": "IND-DRCSA-01", "new_actual": 2450}'::jsonb, NOW() - INTERVAL '5 days');

-- 11. Insert State Warehouses & Depots
INSERT INTO public.warehouses (id, code, name, location, manager_name, contact_phone, capacity_sqm, utilized_pct, status) VALUES
('wh-1', 'DEP-CEQ-01', 'Central Equatoria State Depot', 'Central Equatoria State, Juba Port Zone', 'Gabriel Majok', '+211-920-000008', 4500, 68, 'Active'),
('wh-2', 'DEP-EEQ-02', 'Eastern Equatoria State Depot', 'Eastern Equatoria State, Torit / Kapoeta Hub', 'Mary Naita', '+211-923-440055', 2400, 61, 'Active'),
('wh-3', 'DEP-WEQ-03', 'Western Equatoria State Depot', 'Western Equatoria State, Yambio Base', 'Emmanuel Kenyi', '+211-925-660077', 2200, 45, 'Active'),
('wh-4', 'DEP-JON-04', 'Jonglei State Depot', 'Jonglei State, Bor River Port', 'James Manyok', '+211-924-550066', 3000, 58, 'Active'),
('wh-5', 'DEP-UNI-05', 'Unity State Depot', 'Unity State, Bentiu Humanitarian Base', 'Gatluak Biel', '+211-926-770088', 2600, 50, 'Active'),
('wh-6', 'DEP-UPN-06', 'Upper Nile State Depot', 'Upper Nile State, Malakal River Port', 'Peter Chol', '+211-921-110022', 3200, 54, 'Active'),
('wh-7', 'DEP-LAK-07', 'Lakes State Depot', 'Lakes State, Rumbek Central Hub', 'Daniel Mabor', '+211-927-880099', 2500, 48, 'Active'),
('wh-8', 'DEP-WAR-08', 'Warrap State Depot', 'Warrap State, Kuajok Supply Base', 'Deng Deng', '+211-928-990011', 2300, 52, 'Active'),
('wh-9', 'DEP-NBG-09', 'Northern Bahr el Ghazal State Depot', 'Northern Bahr el Ghazal State, Aweil Town', 'Garang Akok', '+211-929-110033', 2700, 56, 'Active'),
('wh-10', 'DEP-WBG-10', 'Western Bahr el Ghazal State Depot', 'Western Bahr el Ghazal State, Wau Town', 'Santino Alier', '+211-922-330044', 2800, 42, 'Active')
ON CONFLICT (id) DO NOTHING;

-- 12. Insert Suppliers
INSERT INTO public.suppliers (id, company_name, category, contact_person, phone, email, status, rating) VALUES
('sup-1', 'Davis & Shirtliff Water Technologies', 'WASH (Water & Sanitation)', 'Eng. Paul Kilonzo', '+254-733-678901', 'humanitarian@dayliff.com', 'Active', 5.0),
('sup-2', 'MedAid Kenya Pharmaceuticals', 'WASH (Water & Sanitation)', 'Dr. James Kariuki', '+254-700-112233', 'supplies@medaid.ke', 'Active', 4.9),
('sup-3', 'Nutriset Humanitarian Supplies', 'Food Assistance', 'Claire Dubois', '+33-2-35-12-34-56', 'relief-orders@nutriset.fr', 'Active', 5.0),
('sup-4', 'Simlaw Certified Seeds', 'Agriculture & Livelihoods', 'Faith Waweru', '+254-722-456789', 'orders@simlaw.co.ke', 'Active', 4.8),
('sup-5', 'Equatorial Relief Logistics', 'Shelter & Non-Food Items', 'Hassan Gedi', '+254-711-234567', 'procurement@africasupplies.com', 'Active', 4.8)
ON CONFLICT (id) DO NOTHING;

-- 13. Insert Inventory Items
INSERT INTO public.inventory (id, sku, item_name, category, quantity, unit, warehouse, min_threshold, unit_cost, total_value, batch_number, expiry_date, supplier_name, status) VALUES
('inv-101', 'FOD-MZ-011', 'Fortified Maize Flour (25kg Bags)', 'Food Assistance', 3600, 'Bags', 'Eastern Equatoria State Depot', 600, 28.50, 102600.00, 'BATCH-2026-FOD-55', '2027-03-31', 'Equatorial Relief Logistics', 'In Stock'),
('inv-102', 'FOD-PLS-012', 'Yellow Split Peas / Pulses (10kg Bags)', 'Food Assistance', 80, 'Bags', 'Eastern Equatoria State Depot', 250, 16.20, 1296.00, 'BATCH-2026-PLS-22', '2027-02-28', 'Equatorial Relief Logistics', 'Low Stock'),
('inv-103', 'ADRA-FOD-FB01', 'Emergency Household Food Basket (Maize Flour, Beans, Rice, Oil, Salt)', 'Food Assistance', 950, 'Baskets', 'Central Equatoria State Depot', 150, 42.00, 39900.00, 'BATCH-2026-FOD-01', '2027-06-30', 'Equatorial Relief Logistics', 'In Stock'),
('inv-104', 'ADRA-FOD-OIL02', 'Fortified Vegetable Cooking Oil (20L Food-Grade Jerrycans)', 'Food Assistance', 120, 'Jerrycans', 'Central Equatoria State Depot', 150, 28.50, 3420.00, 'BATCH-2026-OIL-02', '2027-08-31', 'Equatorial Relief Logistics', 'Low Stock'),
('inv-105', 'ADRA-FOD-BP5', 'BP-5 High-Nutrition Emergency Compact Food Rations (Box of 24 Bars)', 'Food Assistance', 480, 'Cartons', 'Western Bahr el Ghazal State Depot', 100, 55.00, 26400.00, 'BATCH-2026-BP5-09', '2029-12-31', 'Equatorial Relief Logistics', 'In Stock'),
('inv-106', 'WASH-TAB-004', 'Aquatabs Water Chlorination Tablets (Boxes of 100 strips)', 'WASH (Water & Sanitation)', 4800, 'Boxes', 'Central Equatoria State Depot', 1000, 4.50, 21600.00, 'BATCH-2026-TAB-44', '2028-06-30', 'MedAid Kenya Pharmaceuticals', 'In Stock'),
('inv-107', 'WASH-JCN-013', 'Food-Grade 20L Water Jerricans with Tap', 'WASH (Water & Sanitation)', 120, 'Units', 'Central Equatoria State Depot', 300, 6.80, 816.00, 'BATCH-2026-JCN-18', 'N/A', 'Equatorial Relief Logistics', 'Low Stock'),
('inv-108', 'HLT-DIG-003', 'Family Hygiene & Dignity Kits (Jerrycan, Soap, Towels, Pads)', 'WASH (Water & Sanitation)', 620, 'Kits', 'Eastern Equatoria State Depot', 150, 22.00, 13640.00, 'BATCH-2026-HYG-12', 'N/A', 'Equatorial Relief Logistics', 'In Stock'),
('inv-109', 'SHT-TRP-006', 'Emergency Heavy-Duty Shelter Tarpaulins (4x5m UV-Resistant)', 'Shelter & Non-Food Items', 850, 'Tarpaulins', 'Jonglei State Depot', 200, 18.00, 15300.00, 'BATCH-2026-TRP-03', 'N/A', 'Equatorial Relief Logistics', 'In Stock'),
('inv-110', 'SHT-BLK-009', 'Thermal Humanitarian Fleece Blankets (Bundles of 20)', 'Shelter & Non-Food Items', 420, 'Bundles', 'Jonglei State Depot', 100, 48.00, 20160.00, 'BATCH-2026-BLK-15', 'N/A', 'Equatorial Relief Logistics', 'In Stock'),
('inv-111', 'AGR-SD-002', 'Certified Drought Sorghum & Maize Seeds (25kg bags)', 'Agriculture & Livelihoods', 1250, 'Bags', 'Eastern Equatoria State Depot', 300, 28.50, 35625.00, 'BATCH-2026-SD-88', '2027-12-31', 'Simlaw Certified Seeds', 'In Stock'),
('inv-112', 'EDU-KIT-014', 'Student Educational & Literacy Kits (Backpacks, Books, Pens)', 'Education & Youth', 1100, 'Kits', 'Upper Nile State Depot', 200, 14.50, 15950.00, 'BATCH-2026-EDU-02', 'N/A', 'Equatorial Relief Logistics', 'In Stock')
ON CONFLICT (id) DO UPDATE SET 
  quantity = EXCLUDED.quantity,
  total_value = EXCLUDED.total_value,
  status = EXCLUDED.status;
