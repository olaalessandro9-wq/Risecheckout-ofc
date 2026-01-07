-- ============================================
-- FASE 1: Criar bucket para anexos da área de membros
-- ============================================

-- 1. Criar bucket público para anexos de conteúdo
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'member-content',
  'member-content',
  true,
  104857600, -- 100MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
    'application/pdf',
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
    'application/epub+zip',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'audio/mpeg', 'audio/mp3', 'audio/wav',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
);

-- 2. Policy: Usuários autenticados podem fazer upload em pastas do seu produto
CREATE POLICY "Authenticated users can upload to their products"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'member-content' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM products WHERE user_id = auth.uid()
  )
);

-- 3. Policy: Qualquer pessoa pode ler arquivos (bucket público)
CREATE POLICY "Public read access for member-content"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'member-content');

-- 4. Policy: Usuários autenticados podem deletar arquivos dos seus produtos
CREATE POLICY "Users can delete files from their products"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'member-content' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM products WHERE user_id = auth.uid()
  )
);

-- 5. Policy: Usuários autenticados podem atualizar arquivos dos seus produtos
CREATE POLICY "Users can update files in their products"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'member-content' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM products WHERE user_id = auth.uid()
  )
);