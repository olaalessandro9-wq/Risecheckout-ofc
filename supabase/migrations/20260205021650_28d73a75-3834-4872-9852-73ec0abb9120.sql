-- Criar bucket público para assets da marca RiseCheckout
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-assets',
  'brand-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Qualquer pessoa pode LER (necessário para emails, páginas públicas)
CREATE POLICY "Anyone can read brand assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'brand-assets');