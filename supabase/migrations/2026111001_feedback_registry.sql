CREATE TABLE IF NOT EXISTS public.user_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_code TEXT NOT NULL,
    module TEXT NOT NULL,
    module_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_role TEXT NOT NULL,
    category TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Normal',
    status TEXT NOT NULL DEFAULT 'Submitted',
    admin_response TEXT,
    responded_by TEXT,
    responded_at TIMESTAMPTZ,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_feedbacks_created_at
    ON public.user_feedbacks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_feedbacks_module_id
    ON public.user_feedbacks(module_id);

CREATE TABLE IF NOT EXISTS public.beneficiary_complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_code TEXT NOT NULL,
    beneficiary_id TEXT,
    beneficiary_name TEXT,
    sender_email TEXT,
    sender_name TEXT,
    sender_role TEXT,
    sender_location TEXT,
    recipient_id TEXT,
    recipient_email TEXT,
    recipient_name TEXT,
    recipient_role TEXT,
    recipient_department TEXT,
    category TEXT,
    severity TEXT,
    priority TEXT,
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    subject TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Submitted',
    resolution_notes TEXT,
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ,
    responses JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.beneficiary_complaints
    ADD COLUMN IF NOT EXISTS ticket_code TEXT,
    ADD COLUMN IF NOT EXISTS beneficiary_id TEXT,
    ADD COLUMN IF NOT EXISTS beneficiary_name TEXT,
    ADD COLUMN IF NOT EXISTS sender_email TEXT,
    ADD COLUMN IF NOT EXISTS sender_name TEXT,
    ADD COLUMN IF NOT EXISTS sender_role TEXT,
    ADD COLUMN IF NOT EXISTS sender_location TEXT,
    ADD COLUMN IF NOT EXISTS recipient_id TEXT,
    ADD COLUMN IF NOT EXISTS recipient_name TEXT,
    ADD COLUMN IF NOT EXISTS recipient_role TEXT,
    ADD COLUMN IF NOT EXISTS recipient_department TEXT,
    ADD COLUMN IF NOT EXISTS category TEXT,
    ADD COLUMN IF NOT EXISTS severity TEXT,
    ADD COLUMN IF NOT EXISTS priority TEXT,
    ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS subject TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Submitted',
    ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
    ADD COLUMN IF NOT EXISTS resolved_by TEXT,
    ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS responses JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_beneficiary_complaints_created_at
    ON public.beneficiary_complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beneficiary_complaints_beneficiary_id
    ON public.beneficiary_complaints(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_beneficiary_complaints_recipient_id
    ON public.beneficiary_complaints(recipient_id);

ALTER TABLE public.user_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiary_complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read feedback registry" ON public.user_feedbacks;
CREATE POLICY "Read feedback registry" ON public.user_feedbacks
    FOR SELECT TO authenticated
    USING (
        lower(user_email) = lower(auth.jwt() ->> 'email')
        OR public.get_auth_role() IN (
            'Administrator', 'Program Manager', 'Programme Manager',
            'Finance Officer', 'Project Officer', 'M&E Officer',
            'Inventory Manager', 'Logistics Officer'
        )
    );

DROP POLICY IF EXISTS "Submit own user feedback" ON public.user_feedbacks;
CREATE POLICY "Submit own user feedback" ON public.user_feedbacks
    FOR INSERT TO authenticated
    WITH CHECK (lower(user_email) = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Staff respond to user feedback" ON public.user_feedbacks;
CREATE POLICY "Staff respond to user feedback" ON public.user_feedbacks
    FOR UPDATE TO authenticated
    USING (public.get_auth_role() IN (
        'Administrator', 'Program Manager', 'Programme Manager',
        'Finance Officer', 'Project Officer', 'M&E Officer',
        'Inventory Manager', 'Logistics Officer'
    ))
    WITH CHECK (public.get_auth_role() IN (
        'Administrator', 'Program Manager', 'Programme Manager',
        'Finance Officer', 'Project Officer', 'M&E Officer',
        'Inventory Manager', 'Logistics Officer'
    ));

DROP POLICY IF EXISTS "Administrators delete user feedback" ON public.user_feedbacks;
CREATE POLICY "Administrators delete user feedback" ON public.user_feedbacks
    FOR DELETE TO authenticated
    USING (public.get_auth_role() = 'Administrator');

DROP POLICY IF EXISTS "Read complaints registry" ON public.beneficiary_complaints;
CREATE POLICY "Read complaints registry" ON public.beneficiary_complaints
    FOR SELECT TO authenticated
    USING (
        lower(sender_email) = lower(auth.jwt() ->> 'email')
        OR beneficiary_id = auth.uid()::text
        OR public.get_auth_role() IN (
            'Administrator', 'Program Manager', 'Programme Manager',
            'Finance Officer', 'Project Officer', 'M&E Officer',
            'Inventory Manager', 'Logistics Officer', 'Supervisor',
            'Field Worker', 'Compliance Officer'
        )
    );

DROP POLICY IF EXISTS "Submit complaints" ON public.beneficiary_complaints;
CREATE POLICY "Submit complaints" ON public.beneficiary_complaints
    FOR INSERT TO authenticated
    WITH CHECK (
        lower(sender_email) = lower(auth.jwt() ->> 'email')
        OR
        beneficiary_id = auth.uid()::text
        OR public.get_auth_role() IN (
            'Administrator', 'Program Manager', 'Programme Manager',
            'Finance Officer', 'Project Officer', 'M&E Officer',
            'Inventory Manager', 'Logistics Officer', 'Supervisor',
            'Field Worker', 'Compliance Officer', 'Supplier', 'Donor',
            'Beneficiary'
        )
    );

DROP POLICY IF EXISTS "Staff update complaints" ON public.beneficiary_complaints;
CREATE POLICY "Staff update complaints" ON public.beneficiary_complaints
    FOR UPDATE TO authenticated
    USING (public.get_auth_role() IN (
        'Administrator', 'Program Manager', 'Programme Manager',
        'Finance Officer', 'Project Officer', 'M&E Officer',
        'Inventory Manager', 'Logistics Officer', 'Supervisor',
        'Field Worker', 'Compliance Officer'
    ))
    WITH CHECK (public.get_auth_role() IN (
        'Administrator', 'Program Manager', 'Programme Manager',
        'Finance Officer', 'Project Officer', 'M&E Officer',
        'Inventory Manager', 'Logistics Officer', 'Supervisor',
        'Field Worker', 'Compliance Officer'
    ));

NOTIFY pgrst, 'reload schema';
