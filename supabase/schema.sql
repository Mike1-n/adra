-- ============================================================================
-- ADRA Development Management System - Database Schema
-- Academic Software Engineering Project (Idempotent Migration)
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE (Extends Supabase auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Administrator', 'Project Officer', 'Finance Officer', 'M&E Officer')),
    phone TEXT,
    department TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ----------------------------------------------------------------------------
-- 2. DONORS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.donors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    funding_amount NUMERIC(14,2) DEFAULT 0.00 NOT NULL CHECK (funding_amount >= 0),
    funding_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ----------------------------------------------------------------------------
-- 3. PARTNERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ----------------------------------------------------------------------------
-- 4. PROJECTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_code TEXT NOT NULL UNIQUE,
    project_name TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location TEXT NOT NULL,
    budget NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (budget >= 0),
    status TEXT NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned', 'Active', 'Completed', 'Suspended')),
    project_officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    donor_id UUID REFERENCES public.donors(id) ON DELETE SET NULL,
    partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_officer ON public.projects(project_officer_id);

-- ----------------------------------------------------------------------------
-- 5. BENEFICIARIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beneficiaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_code TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    date_of_birth DATE,
    age INTEGER,
    phone_number TEXT,
    location TEXT NOT NULL,
    vulnerability_category TEXT NOT NULL CHECK (vulnerability_category IN (
        'Child-headed Household', 'Female-headed Household', 'Elderly', 
        'Persons with Disability', 'Internally Displaced Person (IDP)', 
        'Extremely Poor Household', 'Youth at Risk', 'General Community'
    )),
    registration_date DATE DEFAULT CURRENT_DATE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_beneficiaries_project ON public.beneficiaries(project_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_vulnerability ON public.beneficiaries(vulnerability_category);

-- ----------------------------------------------------------------------------
-- 6. ACTIVITIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_code TEXT NOT NULL UNIQUE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    activity_name TEXT NOT NULL,
    description TEXT,
    activity_date DATE NOT NULL,
    location TEXT NOT NULL,
    responsible_officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned', 'Ongoing', 'Completed', 'Cancelled')),
    expected_output TEXT,
    actual_output TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activities_project ON public.activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON public.activities(status);

-- ----------------------------------------------------------------------------
-- 7. INTERVENTIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intervention_code TEXT NOT NULL UNIQUE,
    beneficiary_id UUID NOT NULL REFERENCES public.beneficiaries(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    intervention_type TEXT NOT NULL CHECK (intervention_type IN (
        'Food Assistance', 'Education Support', 'Agricultural Support', 
        'Skills Training', 'Health Support', 'Water & Sanitation (WASH)', 
        'Shelter & NFI', 'Cash Transfer'
    )),
    description TEXT NOT NULL,
    quantity_or_value TEXT NOT NULL,
    intervention_date DATE DEFAULT CURRENT_DATE NOT NULL,
    responsible_officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_interventions_beneficiary ON public.interventions(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_interventions_project ON public.interventions(project_id);

-- ----------------------------------------------------------------------------
-- 8. INDICATORS TABLE (M&E)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    indicator_code TEXT NOT NULL UNIQUE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    indicator_name TEXT NOT NULL,
    description TEXT,
    baseline NUMERIC(12,2) DEFAULT 0 NOT NULL,
    target NUMERIC(12,2) NOT NULL CHECK (target > 0),
    actual_result NUMERIC(12,2) DEFAULT 0 NOT NULL,
    measurement_unit TEXT NOT NULL,
    reporting_period TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_indicators_project ON public.indicators(project_id);

-- ----------------------------------------------------------------------------
-- 9. BUDGETS TABLE (Finance)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    budget_category TEXT NOT NULL CHECK (budget_category IN (
        'Personnel', 'Travel & Transport', 'Equipment & Supplies', 
        'Direct Activity Costs', 'Training & Workshops', 'Administrative / Overhead'
    )),
    allocated_amount NUMERIC(14,2) NOT NULL CHECK (allocated_amount >= 0),
    financial_year TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_budgets_project ON public.budgets(project_id);

-- ----------------------------------------------------------------------------
-- 10. EXPENDITURES TABLE (Finance)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenditures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expenditure_code TEXT NOT NULL UNIQUE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    expenditure_date DATE NOT NULL,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expenditures_project ON public.expenditures(project_id);

-- ----------------------------------------------------------------------------
-- 11. AUDIT LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    record_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON public.audit_logs(module);

-- ----------------------------------------------------------------------------
-- 12. PROJECT DOCUMENTS TABLE (Storage Metadata)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('Report', 'Activity Doc', 'Financial Receipt', 'Photo', 'Supporting Doc')),
    file_path TEXT NOT NULL,
    file_size BIGINT,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_project_documents_project ON public.project_documents(project_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES & HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenditures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Profiles read access for authenticated users" ON public.profiles;
CREATE POLICY "Profiles read access for authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Profiles update for user or admin" ON public.profiles;
CREATE POLICY "Profiles update for user or admin" ON public.profiles FOR UPDATE TO authenticated 
USING (id = auth.uid() OR public.get_auth_role() = 'Administrator');

DROP POLICY IF EXISTS "Admin full manage profiles" ON public.profiles;
CREATE POLICY "Admin full manage profiles" ON public.profiles FOR ALL TO authenticated 
USING (public.get_auth_role() = 'Administrator');

-- 2. Projects & Reference Tables Policies
DROP POLICY IF EXISTS "Allow authenticated read on projects" ON public.projects;
CREATE POLICY "Allow authenticated read on projects" ON public.projects FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow admin and project officer write on projects" ON public.projects;
CREATE POLICY "Allow admin and project officer write on projects" ON public.projects FOR ALL TO authenticated 
USING (public.get_auth_role() IN ('Administrator', 'Project Officer'))
WITH CHECK (public.get_auth_role() IN ('Administrator', 'Project Officer'));

DROP POLICY IF EXISTS "Allow authenticated read on donors" ON public.donors;
CREATE POLICY "Allow authenticated read on donors" ON public.donors FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow admin write on donors" ON public.donors;
CREATE POLICY "Allow admin write on donors" ON public.donors FOR ALL TO authenticated 
USING (public.get_auth_role() = 'Administrator')
WITH CHECK (public.get_auth_role() = 'Administrator');

DROP POLICY IF EXISTS "Allow authenticated read on partners" ON public.partners;
CREATE POLICY "Allow authenticated read on partners" ON public.partners FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow admin write on partners" ON public.partners;
CREATE POLICY "Allow admin write on partners" ON public.partners FOR ALL TO authenticated 
USING (public.get_auth_role() = 'Administrator')
WITH CHECK (public.get_auth_role() = 'Administrator');

-- 3. Beneficiaries, Activities, Interventions Policies
DROP POLICY IF EXISTS "Allow authenticated read on beneficiaries" ON public.beneficiaries;
CREATE POLICY "Allow authenticated read on beneficiaries" ON public.beneficiaries FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow admin and project officer write on beneficiaries" ON public.beneficiaries;
CREATE POLICY "Allow admin and project officer write on beneficiaries" ON public.beneficiaries FOR ALL TO authenticated 
USING (public.get_auth_role() IN ('Administrator', 'Project Officer'))
WITH CHECK (public.get_auth_role() IN ('Administrator', 'Project Officer'));

DROP POLICY IF EXISTS "Allow authenticated read on activities" ON public.activities;
CREATE POLICY "Allow authenticated read on activities" ON public.activities FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow admin and project officer write on activities" ON public.activities;
CREATE POLICY "Allow admin and project officer write on activities" ON public.activities FOR ALL TO authenticated 
USING (public.get_auth_role() IN ('Administrator', 'Project Officer'))
WITH CHECK (public.get_auth_role() IN ('Administrator', 'Project Officer'));

DROP POLICY IF EXISTS "Allow authenticated read on interventions" ON public.interventions;
CREATE POLICY "Allow authenticated read on interventions" ON public.interventions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow admin and project officer write on interventions" ON public.interventions;
CREATE POLICY "Allow admin and project officer write on interventions" ON public.interventions FOR ALL TO authenticated 
USING (public.get_auth_role() IN ('Administrator', 'Project Officer'))
WITH CHECK (public.get_auth_role() IN ('Administrator', 'Project Officer'));

-- 4. Indicators (M&E) Policies
DROP POLICY IF EXISTS "Allow authenticated read on indicators" ON public.indicators;
CREATE POLICY "Allow authenticated read on indicators" ON public.indicators FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow admin and me officer write on indicators" ON public.indicators;
CREATE POLICY "Allow admin and me officer write on indicators" ON public.indicators FOR ALL TO authenticated 
USING (public.get_auth_role() IN ('Administrator', 'M&E Officer'))
WITH CHECK (public.get_auth_role() IN ('Administrator', 'M&E Officer'));

-- 5. Budgets & Expenditures (Finance) Policies
DROP POLICY IF EXISTS "Allow authenticated read on budgets" ON public.budgets;
CREATE POLICY "Allow authenticated read on budgets" ON public.budgets FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow admin and finance officer write on budgets" ON public.budgets;
CREATE POLICY "Allow admin and finance officer write on budgets" ON public.budgets FOR ALL TO authenticated 
USING (public.get_auth_role() IN ('Administrator', 'Finance Officer'))
WITH CHECK (public.get_auth_role() IN ('Administrator', 'Finance Officer'));

DROP POLICY IF EXISTS "Allow authenticated read on expenditures" ON public.expenditures;
CREATE POLICY "Allow authenticated read on expenditures" ON public.expenditures FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow admin and finance officer write on expenditures" ON public.expenditures;
CREATE POLICY "Allow admin and finance officer write on expenditures" ON public.expenditures FOR ALL TO authenticated 
USING (public.get_auth_role() IN ('Administrator', 'Finance Officer'))
WITH CHECK (public.get_auth_role() IN ('Administrator', 'Finance Officer'));

-- 6. Audit Logs & Documents Policies
DROP POLICY IF EXISTS "Allow admin read on audit logs" ON public.audit_logs;
CREATE POLICY "Allow admin read on audit logs" ON public.audit_logs FOR SELECT TO authenticated 
USING (public.get_auth_role() = 'Administrator');

DROP POLICY IF EXISTS "Allow authenticated users to insert audit logs" ON public.audit_logs;
CREATE POLICY "Allow authenticated users to insert audit logs" ON public.audit_logs FOR INSERT TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated read on documents" ON public.project_documents;
CREATE POLICY "Allow authenticated read on documents" ON public.project_documents FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated write on documents" ON public.project_documents;
CREATE POLICY "Allow authenticated write on documents" ON public.project_documents FOR ALL TO authenticated 
USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 13. ASSISTANCE REQUESTS TABLE (Beneficiary Portal & PM Authorization)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assistance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_code TEXT NOT NULL UNIQUE,
    beneficiary_id UUID REFERENCES public.beneficiaries(id) ON DELETE SET NULL,
    beneficiary_name TEXT NOT NULL,
    beneficiary_code TEXT,
    category TEXT NOT NULL,
    assistance_type TEXT,
    urgency TEXT DEFAULT 'Medium',
    priority TEXT DEFAULT 'Medium',
    status TEXT NOT NULL DEFAULT 'Submitted',
    status_label TEXT DEFAULT 'Pending Review',
    status_stage INT DEFAULT 1,
    reason TEXT,
    description TEXT,
    state TEXT,
    county TEXT,
    payam TEXT,
    boma TEXT,
    village TEXT,
    location TEXT,
    program_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    program_name TEXT,
    programme_name TEXT,
    household_members INT DEFAULT 1,
    preferred_depot TEXT,
    eligibility TEXT DEFAULT 'Eligible',
    eligibility_status TEXT DEFAULT 'Verified',
    verification_status TEXT DEFAULT 'Verified Active',
    is_duplicate BOOLEAN DEFAULT FALSE,
    assigned_supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_supervisor_name TEXT,
    assigned_field_worker_name TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    review_notes TEXT,
    expected_dispatch_date TEXT,
    additional_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assistance_requests_beneficiary ON public.assistance_requests(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_assistance_requests_status ON public.assistance_requests(status);
CREATE INDEX IF NOT EXISTS idx_assistance_requests_created_at ON public.assistance_requests(created_at DESC);

ALTER TABLE public.assistance_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read on assistance_requests" ON public.assistance_requests;
CREATE POLICY "Allow authenticated read on assistance_requests" ON public.assistance_requests FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on assistance_requests" ON public.assistance_requests;
CREATE POLICY "Allow authenticated insert on assistance_requests" ON public.assistance_requests FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update on assistance_requests" ON public.assistance_requests;
CREATE POLICY "Allow authenticated update on assistance_requests" ON public.assistance_requests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 14. STATE WAREHOUSES & DEPOTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.warehouses (
    id TEXT PRIMARY KEY,
    code TEXT,
    name TEXT NOT NULL,
    location TEXT,
    manager_name TEXT,
    contact_phone TEXT,
    capacity_sqm NUMERIC DEFAULT 0,
    utilized_pct NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_warehouses_name ON public.warehouses(name);
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read on warehouses" ON public.warehouses;
CREATE POLICY "Allow authenticated read on warehouses" ON public.warehouses FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated write on warehouses" ON public.warehouses;
CREATE POLICY "Allow authenticated write on warehouses" ON public.warehouses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 15. SUPPLIERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    category TEXT,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'Active',
    rating NUMERIC(3,2) DEFAULT 5.0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_suppliers_name ON public.suppliers(company_name);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read on suppliers" ON public.suppliers;
CREATE POLICY "Allow authenticated read on suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated write on suppliers" ON public.suppliers;
CREATE POLICY "Allow authenticated write on suppliers" ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 16. INVENTORY & STOCK ITEMS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory (
    id TEXT PRIMARY KEY,
    sku TEXT,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    warehouse TEXT NOT NULL,
    min_threshold NUMERIC DEFAULT 10,
    unit_cost NUMERIC(12,2) DEFAULT 0.00,
    total_value NUMERIC(14,2) DEFAULT 0.00,
    batch_number TEXT,
    expiry_date TEXT,
    supplier_name TEXT,
    status TEXT DEFAULT 'In Stock',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON public.inventory(warehouse);
CREATE INDEX IF NOT EXISTS idx_inventory_item_name ON public.inventory(item_name);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON public.inventory(status);
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read on inventory" ON public.inventory;
CREATE POLICY "Allow authenticated read on inventory" ON public.inventory FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated write on inventory" ON public.inventory;
CREATE POLICY "Allow authenticated write on inventory" ON public.inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 17. STOCK TRANSACTIONS LEDGER
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_transactions (
    id TEXT PRIMARY KEY,
    transaction_type TEXT NOT NULL,
    reference_code TEXT,
    item_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    unit TEXT,
    warehouse TEXT,
    target_warehouse TEXT,
    supplier_name TEXT,
    po_number TEXT,
    batch_number TEXT,
    performed_by TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stock_tx_warehouse ON public.stock_transactions(warehouse);
CREATE INDEX IF NOT EXISTS idx_stock_tx_type ON public.stock_transactions(transaction_type);
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read on stock_transactions" ON public.stock_transactions;
CREATE POLICY "Allow authenticated read on stock_transactions" ON public.stock_transactions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated write on stock_transactions" ON public.stock_transactions;
CREATE POLICY "Allow authenticated write on stock_transactions" ON public.stock_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 18. PURCHASE ORDERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id TEXT PRIMARY KEY,
    po_number TEXT NOT NULL UNIQUE,
    supplier_name TEXT,
    item_name TEXT,
    category TEXT,
    quantity NUMERIC,
    unit TEXT,
    unit_cost NUMERIC(12,2),
    total_amount NUMERIC(14,2),
    destination_warehouse TEXT,
    order_date DATE,
    expected_delivery DATE,
    status TEXT DEFAULT 'Pending Delivery',
    issued_by TEXT,
    grn_number TEXT,
    inspected_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read on purchase_orders" ON public.purchase_orders;
CREATE POLICY "Allow authenticated read on purchase_orders" ON public.purchase_orders FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated write on purchase_orders" ON public.purchase_orders;
CREATE POLICY "Allow authenticated write on purchase_orders" ON public.purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 19. DISPATCHES & WAYBILLS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dispatches (
    id TEXT PRIMARY KEY,
    waybill_number TEXT NOT NULL UNIQUE,
    dispatch_token TEXT,
    origin_warehouse TEXT,
    destination TEXT,
    project_name TEXT,
    linked_request_id TEXT,
    beneficiary_name TEXT,
    transport_mode TEXT,
    vehicle_reg TEXT,
    driver_name TEXT,
    driver_phone TEXT,
    dispatch_date DATE,
    items JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'In Transit',
    released_by TEXT,
    received_by TEXT,
    qr_token_verified BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.dispatches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read on dispatches" ON public.dispatches;
CREATE POLICY "Allow authenticated read on dispatches" ON public.dispatches FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated write on dispatches" ON public.dispatches;
CREATE POLICY "Allow authenticated write on dispatches" ON public.dispatches FOR ALL TO authenticated USING (true) WITH CHECK (true);

