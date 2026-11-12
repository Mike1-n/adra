CREATE OR REPLACE FUNCTION public.lookup_auth_user_id_by_email(lookup_email TEXT)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT auth_user.id
    FROM auth.users AS auth_user
    WHERE lower(auth_user.email) = lower(lookup_email)
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_auth_user_id_by_email(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_auth_user_id_by_email(TEXT) TO service_role;
