-- Migration: Storage Policies (P0-7)
-- Data: 2025-12-14
-- Objetivo: Defesa em profundidade - mesmo com endpoint protegido, adicionar RLS no storage

-- 1) Habilitar RLS nos buckets (se ainda não estiver)
-- Nota: Buckets já devem existir, apenas garantir que RLS está ativo

-- 2) Policy: Usuários podem deletar apenas seus próprios arquivos
DO $$
BEGIN
  -- Bucket: products
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can delete own files in products'
  ) THEN
    CREATE POLICY "Users can delete own files in products"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'products'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  -- Bucket: checkouts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can delete own files in checkouts'
  ) THEN
    CREATE POLICY "Users can delete own files in checkouts"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'checkouts'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  -- Bucket: avatars
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can delete own files in avatars'
  ) THEN
    CREATE POLICY "Users can delete own files in avatars"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  -- Bucket: product-images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can delete own files in product-images'
  ) THEN
    CREATE POLICY "Users can delete own files in product-images"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'product-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- 3) Policy: Usuários podem ler seus próprios arquivos (opcional, mas recomendado)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can read own files'
  ) THEN
    CREATE POLICY "Users can read own files"
      ON storage.objects FOR SELECT
      USING (
        bucket_id IN ('products', 'checkouts', 'avatars', 'product-images')
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- Log
DO $$
BEGIN
  RAISE NOTICE 'Storage Policies criadas com sucesso (defesa em profundidade)';
END $$;
