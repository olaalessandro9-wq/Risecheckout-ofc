-- Tabela para múltiplos anexos por conteúdo
CREATE TABLE public.content_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES product_member_content(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca por content_id
CREATE INDEX idx_content_attachments_content_id ON content_attachments(content_id);

-- RLS
ALTER TABLE content_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors podem gerenciar anexos dos seus conteúdos"
ON content_attachments FOR ALL TO public
USING (
  EXISTS (
    SELECT 1 FROM product_member_content c
    JOIN product_member_modules m ON m.id = c.module_id
    JOIN products p ON p.id = m.product_id
    WHERE c.id = content_attachments.content_id
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM product_member_content c
    JOIN product_member_modules m ON m.id = c.module_id
    JOIN products p ON p.id = m.product_id
    WHERE c.id = content_id
      AND p.user_id = auth.uid()
  )
);