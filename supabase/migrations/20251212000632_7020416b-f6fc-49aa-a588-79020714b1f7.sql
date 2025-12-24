-- Adicionar service_role_key para o trigger poder chamar Edge Functions
INSERT INTO public.app_settings (key, value) 
VALUES ('service_role_key', to_jsonb('***REMOVED***'::text))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();