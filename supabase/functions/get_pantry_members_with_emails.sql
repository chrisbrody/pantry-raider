-- This function needs to be created in your Supabase SQL editor
CREATE OR REPLACE FUNCTION public.get_pantry_members_with_emails(pantry_id_arg UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.user_id,
    au.email,
    pm.role::TEXT
  FROM 
    public.pantry_members pm
  JOIN 
    auth.users au ON pm.user_id = au.id
  WHERE 
    pm.pantry_id = pantry_id_arg;
END;
$$;
