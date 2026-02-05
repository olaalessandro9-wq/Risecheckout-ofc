
# Plano: Criar Bucket `brand-assets` para Logo Oficial

## Objetivo

Criar infraestrutura de armazenamento dedicada para assets da marca RiseCheckout no Supabase Storage, começando pela logo oficial (fundo azul, texto branco).

## Visão Geral

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        SUPABASE STORAGE                              │
├─────────────────────────────────────────────────────────────────────┤
│  Bucket: brand-assets (PÚBLICO)                                     │
│  ├── logo/                                                          │
│  │   └── main.jpg         ← Logo principal (fundo azul)             │
│  │   └── (futuro) icon.png, dark.png, light.png...                  │
│  └── (futuro) banners/, icons/, etc.                                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  URL Pública Final:                                                 │
│  https://wivbtmtgpsxupfjwwovf.supabase.co/storage/v1/object/public/ │
│  brand-assets/logo/main.jpg                                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/migrations/[timestamp]_create_brand_assets_bucket.sql` | CRIAR | Migration para criar bucket público |
| `supabase/functions/storage-management/index.ts` | MODIFICAR | Adicionar `brand-assets` ao ALLOWED_BUCKETS |
| `src/lib/brand-assets.ts` | CRIAR | Constantes centralizadas com URLs dos assets |

---

## Implementação Detalhada

### Etapa 1: Migration SQL - Criar Bucket

Cria o bucket `brand-assets` como **público** com policies adequadas:

```sql
-- Criar bucket público para assets da marca
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-assets',
  'brand-assets',
  true,
  5242880, -- 5MB max (logos não precisam de mais)
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Qualquer pessoa pode LER (necessário para emails, páginas públicas)
CREATE POLICY "Anyone can read brand assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'brand-assets');

-- Nota: Sem policy de INSERT/UPDATE/DELETE para usuários normais
-- Uploads serão feitos manualmente via Dashboard ou via service_role
```

### Etapa 2: Atualizar storage-management

Adicionar o novo bucket à lista de permitidos:

```typescript
// Antes:
const ALLOWED_BUCKETS = ["product-images", "avatars", "documents"];

// Depois:
const ALLOWED_BUCKETS = ["product-images", "avatars", "documents", "brand-assets"];
```

### Etapa 3: Criar lib de Brand Assets

Arquivo centralizado para URLs dos assets da marca:

```typescript
// src/lib/brand-assets.ts

/**
 * Brand Assets - URLs centralizadas
 * 
 * Todos os assets oficiais da marca RiseCheckout.
 * Armazenados no Supabase Storage bucket 'brand-assets'.
 * 
 * @see RISE Protocol V3 - Single Source of Truth
 */

const STORAGE_BASE = "https://wivbtmtgpsxupfjwwovf.supabase.co/storage/v1/object/public";
const BUCKET = "brand-assets";

export const BRAND_ASSETS = {
  /** Logo principal (fundo azul, texto branco) */
  LOGO_MAIN: `${STORAGE_BASE}/${BUCKET}/logo/main.jpg`,
  
  /** Alias para compatibilidade com código existente */
  EMAIL_BANNER: `${STORAGE_BASE}/${BUCKET}/logo/main.jpg`,
} as const;

/** Tipo para os assets disponíveis */
export type BrandAssetKey = keyof typeof BRAND_ASSETS;

/** Helper para obter URL de um asset */
export function getBrandAssetUrl(asset: BrandAssetKey): string {
  return BRAND_ASSETS[asset];
}
```

---

## Upload da Logo

Após a migration ser executada, você precisará fazer upload da logo.

**Opção recomendada - Via Dashboard Supabase:**
1. Acesse Supabase Dashboard > Storage
2. Vá no bucket `brand-assets`
3. Crie pasta `logo/`
4. Faça upload do arquivo como `main.jpg`

---

## URL Final

Após implementação e upload:

```
https://wivbtmtgpsxupfjwwovf.supabase.co/storage/v1/object/public/brand-assets/logo/main.jpg
```

Esta URL:
- **Pública**: Qualquer um pode acessar (sem auth)
- **CDN Global**: Supabase Storage é distribuído globalmente
- **Estável**: Nunca muda, nunca depende de domínio ou secret
- **Reutilizável**: Use em emails, frontend, landing pages, etc.

---

## Benefícios

| Benefício | Descrição |
|-----------|-----------|
| URL estável | Não depende de `SITE_BASE_DOMAIN` ou qualquer secret |
| CDN global | Supabase Storage tem edge locations globais |
| Single source of truth | `BRAND_ASSETS.LOGO_MAIN` em qualquer lugar do código |
| Expansível | Adicione mais logos/assets no futuro |
| Seguro | Apenas admins podem modificar (via Dashboard/service_role) |

---

## Checklist RISE Protocol V3

- [x] Solução definitiva (não temporária)
- [x] Zero dependência de configurações externas
- [x] URL pública garantida
- [x] Single source of truth para assets
- [x] Escalável para futuros assets
- [x] Zero dívida técnica
