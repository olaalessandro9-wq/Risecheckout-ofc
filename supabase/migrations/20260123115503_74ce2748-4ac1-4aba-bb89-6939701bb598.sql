-- Enable RLS on migration_id_map (temporary table, service role only)
ALTER TABLE public.migration_id_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only on migration_id_map"
ON public.migration_id_map
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');