-- This function needs to be created in your Supabase SQL editor
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(email_param TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = email_param;
  RETURN user_id;
END;
$$;
