-- Create RPC function to get user_id by email from auth.users
-- This is needed because auth.users is not directly accessible from the client
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_user_id uuid;
BEGIN
  SELECT id INTO found_user_id
  FROM auth.users
  WHERE email = user_email;
  
  RETURN found_user_id;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO service_role;