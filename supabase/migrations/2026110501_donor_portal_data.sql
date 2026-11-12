CREATE TABLE IF NOT EXISTS public.donor_grants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grant_code TEXT NOT NULL UNIQUE,
    donor_id UUID NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    total_committed NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_committed >= 0),
    disbursed_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (disbursed_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    start_date DATE,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'Active',
    focal_officer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.donor_grant_tranches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_grant_id UUID NOT NULL REFERENCES public.donor_grants(id) ON DELETE CASCADE,
    tranche_name TEXT NOT NULL,
    release_date DATE,
    eft_reference TEXT,
    amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    status TEXT NOT NULL DEFAULT 'Scheduled',
    utilization_pct NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (utilization_pct >= 0 AND utilization_pct <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.donor_deliverables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_id UUID NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
    donor_grant_id UUID REFERENCES public.donor_grants(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    type TEXT,
    due_date DATE,
    submitted_date DATE,
    status TEXT NOT NULL DEFAULT 'Scheduled',
    file_name TEXT,
    file_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.donor_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_id UUID NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
    ticket_code TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    sender_name TEXT,
    sender_role TEXT,
    recipient_name TEXT,
    recipient_role TEXT,
    status TEXT NOT NULL DEFAULT 'Under Review',
    response TEXT,
    responded_by TEXT,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS donor_id UUID REFERENCES public.donors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_donor ON public.profiles(donor_id);

UPDATE public.profiles AS profile
SET donor_id = matching_donor.id
FROM (
    SELECT lower(email) AS normalized_email, min(id::text)::uuid AS id
    FROM public.donors
    WHERE email IS NOT NULL
    GROUP BY lower(email)
    HAVING count(*) = 1
) AS matching_donor
WHERE profile.donor_id IS NULL
  AND lower(profile.email) = matching_donor.normalized_email;

CREATE INDEX IF NOT EXISTS idx_donor_grants_donor ON public.donor_grants(donor_id);
CREATE INDEX IF NOT EXISTS idx_donor_grants_project ON public.donor_grants(project_id);
CREATE INDEX IF NOT EXISTS idx_donor_tranches_grant ON public.donor_grant_tranches(donor_grant_id);
CREATE INDEX IF NOT EXISTS idx_donor_deliverables_donor ON public.donor_deliverables(donor_id);
CREATE INDEX IF NOT EXISTS idx_donor_queries_donor_created ON public.donor_queries(donor_id, created_at DESC);

ALTER TABLE public.donor_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_grant_tranches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_queries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read donor grants" ON public.donor_grants;
CREATE POLICY "Authenticated read donor grants" ON public.donor_grants
    FOR SELECT TO authenticated USING (
        public.get_auth_role() IN ('Administrator', 'Program Manager', 'Programme Manager', 'Finance Officer', 'Project Officer', 'M&E Officer')
        OR EXISTS (
            SELECT 1 FROM public.donors d
            WHERE d.id = donor_grants.donor_id
              AND lower(d.email) = lower(auth.jwt() ->> 'email')
        )
    );
DROP POLICY IF EXISTS "Finance manage donor grants" ON public.donor_grants;
CREATE POLICY "Finance manage donor grants" ON public.donor_grants
    FOR ALL TO authenticated
    USING (public.get_auth_role() IN ('Administrator', 'Finance Officer'))
    WITH CHECK (public.get_auth_role() IN ('Administrator', 'Finance Officer'));

DROP POLICY IF EXISTS "Authenticated read donor grant tranches" ON public.donor_grant_tranches;
CREATE POLICY "Authenticated read donor grant tranches" ON public.donor_grant_tranches
    FOR SELECT TO authenticated USING (
        public.get_auth_role() IN ('Administrator', 'Program Manager', 'Programme Manager', 'Finance Officer', 'Project Officer', 'M&E Officer')
        OR EXISTS (
            SELECT 1
            FROM public.donor_grants g
            JOIN public.donors d ON d.id = g.donor_id
            WHERE g.id = donor_grant_tranches.donor_grant_id
              AND lower(d.email) = lower(auth.jwt() ->> 'email')
        )
    );
DROP POLICY IF EXISTS "Finance manage donor grant tranches" ON public.donor_grant_tranches;
CREATE POLICY "Finance manage donor grant tranches" ON public.donor_grant_tranches
    FOR ALL TO authenticated
    USING (public.get_auth_role() IN ('Administrator', 'Finance Officer'))
    WITH CHECK (public.get_auth_role() IN ('Administrator', 'Finance Officer'));

DROP POLICY IF EXISTS "Authenticated read donor deliverables" ON public.donor_deliverables;
CREATE POLICY "Authenticated read donor deliverables" ON public.donor_deliverables
    FOR SELECT TO authenticated USING (
        public.get_auth_role() IN ('Administrator', 'Program Manager', 'Programme Manager', 'Finance Officer', 'Project Officer', 'M&E Officer')
        OR EXISTS (
            SELECT 1 FROM public.donors d
            WHERE d.id = donor_deliverables.donor_id
              AND lower(d.email) = lower(auth.jwt() ->> 'email')
        )
    );
DROP POLICY IF EXISTS "Staff manage donor deliverables" ON public.donor_deliverables;
CREATE POLICY "Staff manage donor deliverables" ON public.donor_deliverables
    FOR ALL TO authenticated
    USING (public.get_auth_role() IN ('Administrator', 'Program Manager', 'Programme Manager', 'Finance Officer'))
    WITH CHECK (public.get_auth_role() IN ('Administrator', 'Program Manager', 'Programme Manager', 'Finance Officer'));

DROP POLICY IF EXISTS "Donor and staff read donor queries" ON public.donor_queries;
CREATE POLICY "Donor and staff read donor queries" ON public.donor_queries
    FOR SELECT TO authenticated USING (
        public.get_auth_role() IN ('Administrator', 'Program Manager', 'Programme Manager', 'Finance Officer')
        OR EXISTS (
            SELECT 1 FROM public.donors d
            WHERE d.id = donor_id
              AND lower(d.email) = lower(auth.jwt() ->> 'email')
        )
    );
DROP POLICY IF EXISTS "Donor submit donor queries" ON public.donor_queries;
CREATE POLICY "Donor submit donor queries" ON public.donor_queries
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.donors d
            WHERE d.id = donor_id
              AND lower(d.email) = lower(auth.jwt() ->> 'email')
        )
    );
DROP POLICY IF EXISTS "Staff respond to donor queries" ON public.donor_queries;
CREATE POLICY "Staff respond to donor queries" ON public.donor_queries
    FOR UPDATE TO authenticated
    USING (public.get_auth_role() IN ('Administrator', 'Program Manager', 'Programme Manager', 'Finance Officer'))
    WITH CHECK (public.get_auth_role() IN ('Administrator', 'Program Manager', 'Programme Manager', 'Finance Officer'));
