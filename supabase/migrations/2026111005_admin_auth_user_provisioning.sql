ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN (
        'Administrator',
        'Program Manager',
        'Programme Manager',
        'Supervisor',
        'Project Officer',
        'Finance Officer',
        'M&E Officer',
        'Inventory Manager',
        'Field Worker',
        'Supplier',
        'Donor',
        'Beneficiary',
        'Compliance Officer'
    ));

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS status TEXT;

UPDATE public.profiles
SET status = CASE WHEN is_active THEN 'Active' ELSE 'Deactivated' END
WHERE status IS NULL;

ALTER TABLE public.profiles
    ALTER COLUMN status SET DEFAULT 'Active',
    ALTER COLUMN status SET NOT NULL;

NOTIFY pgrst, 'reload schema';
