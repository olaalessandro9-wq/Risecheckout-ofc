-- Adicionar service_role_key para o trigger poder chamar Edge Functions
INSERT INTO public.app_settings (key, value) 
VALUES ('service_role_key', to_jsonb('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdmJ0bXRncHN4dXBmand3b3ZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA2NjMyOCwiZXhwIjoyMDc2NjQyMzI4fQ.c0mXYjY-uaXnpn3pHEhJLH5KH3t5A0i4gXvHi6olPqM'::text))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();