-- Function to get user email from auth.users (for members area producer display)
CREATE OR REPLACE FUNCTION get_user_email(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;
  
  RETURN user_email;
END;
$$;

-- Allow authenticated users to call this function
GRANT EXECUTE ON FUNCTION get_user_email(uuid) TO authenticated;