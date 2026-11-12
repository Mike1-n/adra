UPDATE public.profiles AS profile
SET donor_id = matching_donor.id
FROM (
    SELECT lower(email) AS normalized_email, min(id::text)::uuid AS id
    FROM public.donors
    WHERE email IS NOT NULL
      AND btrim(email) <> ''
    GROUP BY lower(email)
    HAVING count(*) = 1
) AS matching_donor
WHERE profile.donor_id IS NULL
  AND lower(profile.email) = matching_donor.normalized_email;

DROP POLICY IF EXISTS "Donor and staff read donor queries" ON public.donor_queries;
CREATE POLICY "Donor and staff read donor queries" ON public.donor_queries
    FOR SELECT TO authenticated
    USING (
        public.get_auth_role() IN (
            'Administrator', 'Program Manager', 'Programme Manager', 'Finance Officer'
        )
        OR EXISTS (
            SELECT 1
            FROM public.donors d
            WHERE d.id = donor_queries.donor_id
              AND lower(d.email) = lower(auth.jwt() ->> 'email')
        )
        OR EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.donor_id = donor_queries.donor_id
        )
    );

DROP POLICY IF EXISTS "Donor submit donor queries" ON public.donor_queries;
CREATE POLICY "Donor submit donor queries" ON public.donor_queries
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.donors d
            WHERE d.id = donor_queries.donor_id
              AND lower(d.email) = lower(auth.jwt() ->> 'email')
        )
        OR EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.donor_id = donor_queries.donor_id
        )
    );

NOTIFY pgrst, 'reload schema';
