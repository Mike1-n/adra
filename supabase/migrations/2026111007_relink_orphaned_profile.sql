CREATE OR REPLACE FUNCTION public.relink_profile_to_auth_user(
    old_profile_id UUID,
    new_auth_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    profile_email TEXT;
    auth_email TEXT;
    reference RECORD;
BEGIN
    IF old_profile_id = new_auth_user_id THEN
        RAISE EXCEPTION 'The profile and Auth user IDs are already the same.';
    END IF;

    SELECT profile.email, auth_user.email
    INTO profile_email, auth_email
    FROM public.profiles AS profile
    CROSS JOIN auth.users AS auth_user
    WHERE profile.id = old_profile_id
      AND auth_user.id = new_auth_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'The profile or new Auth user no longer exists.';
    END IF;

    IF lower(profile_email) <> lower(auth_email) THEN
        RAISE EXCEPTION 'The profile email does not match the new Auth user email.';
    END IF;

    FOR reference IN
        SELECT
            child_namespace.nspname AS schema_name,
            child_table.relname AS table_name,
            child_column.attname AS column_name
        FROM pg_catalog.pg_constraint AS foreign_key
        JOIN pg_catalog.pg_class AS child_table
          ON child_table.oid = foreign_key.conrelid
        JOIN pg_catalog.pg_namespace AS child_namespace
          ON child_namespace.oid = child_table.relnamespace
        JOIN LATERAL pg_catalog.unnest(foreign_key.conkey)
          WITH ORDINALITY AS child_key(attnum, position)
          ON TRUE
        JOIN LATERAL pg_catalog.unnest(foreign_key.confkey)
          WITH ORDINALITY AS parent_key(attnum, position)
          ON parent_key.position = child_key.position
        JOIN pg_catalog.pg_attribute AS child_column
          ON child_column.attrelid = child_table.oid
         AND child_column.attnum = child_key.attnum
        JOIN pg_catalog.pg_attribute AS parent_column
          ON parent_column.attrelid = foreign_key.confrelid
         AND parent_column.attnum = parent_key.attnum
        WHERE foreign_key.contype = 'f'
          AND foreign_key.confrelid = 'public.profiles'::REGCLASS
          AND parent_column.attname = 'id'
          AND pg_catalog.array_length(foreign_key.conkey, 1) = 1
    LOOP
        EXECUTE pg_catalog.format(
            'UPDATE %I.%I SET %I = $1 WHERE %I = $2',
            reference.schema_name,
            reference.table_name,
            reference.column_name,
            reference.column_name
        )
        USING new_auth_user_id, old_profile_id;
    END LOOP;

    UPDATE public.profiles
    SET id = new_auth_user_id,
        updated_at = pg_catalog.now()
    WHERE id = old_profile_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'The profile could not be relinked to the Auth user.';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.relink_profile_to_auth_user(UUID, UUID)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.relink_profile_to_auth_user(UUID, UUID)
    TO service_role;

NOTIFY pgrst, 'reload schema';
