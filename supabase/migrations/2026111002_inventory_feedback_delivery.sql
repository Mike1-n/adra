ALTER TABLE public.beneficiary_complaints
    ADD COLUMN IF NOT EXISTS ticket_code TEXT,
    ADD COLUMN IF NOT EXISTS beneficiary_id TEXT,
    ADD COLUMN IF NOT EXISTS beneficiary_name TEXT,
    ADD COLUMN IF NOT EXISTS sender_email TEXT,
    ADD COLUMN IF NOT EXISTS sender_name TEXT,
    ADD COLUMN IF NOT EXISTS sender_role TEXT,
    ADD COLUMN IF NOT EXISTS sender_location TEXT,
    ADD COLUMN IF NOT EXISTS recipient_id TEXT,
    ADD COLUMN IF NOT EXISTS recipient_email TEXT,
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

DROP POLICY IF EXISTS "Read complaints registry" ON public.beneficiary_complaints;
CREATE POLICY "Read complaints registry" ON public.beneficiary_complaints
    FOR SELECT TO authenticated
    USING (
        lower(sender_email) = lower(auth.jwt() ->> 'email')
        OR lower(recipient_email) = lower(auth.jwt() ->> 'email')
        OR beneficiary_id = auth.uid()::text
        OR recipient_id = auth.uid()::text
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
        OR beneficiary_id = auth.uid()::text
        OR public.get_auth_role() IN (
            'Administrator', 'Program Manager', 'Programme Manager',
            'Finance Officer', 'Project Officer', 'M&E Officer',
            'Inventory Manager', 'Logistics Officer', 'Supervisor',
            'Field Worker', 'Compliance Officer', 'Supplier', 'Donor',
            'Beneficiary'
        )
    );

NOTIFY pgrst, 'reload schema';
