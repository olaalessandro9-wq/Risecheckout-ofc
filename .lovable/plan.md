
# Plano: Atualizar URLs de Logo para Usar Storage Permanente

## Situação Atual

O arquivo foi uploaded com sucesso no Supabase Storage:
- **Caminho**: `brand-assets/logo/main.jpeg`
- **Problema**: O código em `src/lib/brand-assets.ts` está configurado para `.jpg`, mas o arquivo está como `.jpeg`
- **Problema adicional**: A função `getLogoUrl()` nas Edge Functions ainda usa a URL antiga (`/risecheckout-email-banner.jpg`) que depende de `SITE_BASE_DOMAIN`

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/lib/brand-assets.ts` | Corrigir extensão de `.jpg` para `.jpeg` |
| `supabase/functions/_shared/email-templates-base.ts` | Substituir `getLogoUrl()` para usar URL permanente do Storage |

---

## Implementação Detalhada

### Etapa 1: Corrigir extensão em brand-assets.ts

```typescript
// src/lib/brand-assets.ts
const STORAGE_BASE = "https://wivbtmtgpsxupfjwwovf.supabase.co/storage/v1/object/public";
const BUCKET = "brand-assets";

export const BRAND_ASSETS = {
  /** Logo principal (fundo azul, texto branco) */
  LOGO_MAIN: `${STORAGE_BASE}/${BUCKET}/logo/main.jpeg`, // Corrigido: .jpeg
  
  /** Alias para compatibilidade com código existente */
  EMAIL_BANNER: `${STORAGE_BASE}/${BUCKET}/logo/main.jpeg`, // Corrigido: .jpeg
} as const;
```

### Etapa 2: Simplificar getLogoUrl() nas Edge Functions

A função atual depende de `SITE_BASE_DOMAIN` e usa fallback para `risecheckout.com`. Vamos substituir por URL permanente do Storage:

```typescript
// supabase/functions/_shared/email-templates-base.ts

// URL permanente do Supabase Storage - nunca muda
const LOGO_STORAGE_URL = "https://wivbtmtgpsxupfjwwovf.supabase.co/storage/v1/object/public/brand-assets/logo/main.jpeg";

/**
 * Gets the logo URL from Supabase Storage.
 * Permanent URL that never changes.
 */
export function getLogoUrl(): string {
  return LOGO_STORAGE_URL;
}
```

---

## Resultado Final

**URL permanente da logo:**
```
https://wivbtmtgpsxupfjwwovf.supabase.co/storage/v1/object/public/brand-assets/logo/main.jpeg
```

### Benefícios

| Antes | Depois |
|-------|--------|
| Dependia de `SITE_BASE_DOMAIN` | URL fixa do Supabase Storage |
| Fallback para `risecheckout.com` | Zero fallbacks necessários |
| Arquivo deveria estar no servidor web | Arquivo no CDN global do Supabase |
| Poderia quebrar se domínio mudasse | Permanente e estável |

---

## Checklist RISE Protocol V3

- [x] Solução definitiva (não temporária)
- [x] Zero dependência de variáveis de ambiente
- [x] URL pública permanente via CDN
- [x] Single source of truth para logo
- [x] Zero dívida técnica
