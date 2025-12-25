-- Fix search_path for security function
CREATE OR REPLACE FUNCTION public.check_no_secrets_in_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Block any attempts to store obvious secrets
  IF NEW.key ILIKE '%secret%' 
     OR NEW.key ILIKE '%key%' 
     OR NEW.key ILIKE '%token%' 
     OR NEW.key ILIKE '%password%'
     OR NEW.key ILIKE '%credential%' THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Cannot store secrets in app_settings. Use Supabase Vault instead. Attempted key: %', NEW.key;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;