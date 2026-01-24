-- Criar bucket dedicado para anexos de conteúdo (suporta todos os tipos de arquivo)
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES (
  'content-attachments',
  'content-attachments',
  true,
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
    'application/pdf',
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
    'application/epub+zip',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- RLS: Upload público (produtores autenticados via Edge Function)
CREATE POLICY "Public upload for content attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'content-attachments');

-- RLS: Leitura pública para anexos
CREATE POLICY "Public read for content attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-attachments');

-- RLS: Deleção permitida
CREATE POLICY "Delete content attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'content-attachments');