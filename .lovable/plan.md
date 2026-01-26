
# Plano: Simplificação do CORS (Single Secret Architecture)

## Objetivo

Simplificar o sistema CORS removendo a lógica de ambiente (dev/prod) e usando apenas uma secret `CORS_ALLOWED_ORIGINS`.

## Mudanças

### 1. Simplificar `supabase/functions/_shared/cors-v2.ts`

**Remover:**
- Variável `cachedEnvironment`
- Função `getEnvironment()`
- Lógica condicional de `CORS_ALLOWED_ORIGINS_DEV`
- Referências a `ENVIRONMENT`

**Manter:**
- Lógica de cache de origins
- Validação fail-secure
- Todas as funções públicas (`handleCorsV2`, `getCorsHeadersV2`, etc.)

**Código Simplificado:**
```typescript
function loadAllowedOrigins(): Set<string> {
  if (cachedOrigins) return cachedOrigins;
  
  const originsRaw = Deno.env.get("CORS_ALLOWED_ORIGINS");
  
  if (!originsRaw) {
    log.error("CRITICAL: CORS_ALLOWED_ORIGINS not configured - blocking ALL origins");
    cachedOrigins = new Set();
    return cachedOrigins;
  }
  
  const origins = originsRaw.split(",").map(o => o.trim()).filter(o => o.length > 0);
  cachedOrigins = new Set(origins);
  log.info(`Loaded ${cachedOrigins.size} allowed origins`);
  
  return cachedOrigins;
}
```

### 2. Adicionar Secret `CORS_ALLOWED_ORIGINS`

**Valor:**
```
https://risecheckout.com,https://www.risecheckout.com,https://app.risecheckout.com,https://pay.risecheckout.com,https://api.risecheckout.com,https://id-preview--ed9257df-d9f6-4a5e-961f-eca053f14944.lovable.app
```

### 3. Atualizar Documentação

Atualizar comentários do arquivo para refletir a nova arquitetura simplificada.

## Resultado

| Antes | Depois |
|-------|--------|
| 3 secrets possíveis | 1 secret |
| Lógica dev/prod | Código direto |
| ~95 linhas | ~70 linhas |
| CORS_ALLOWED_ORIGINS_DEV | Removido |
| ENVIRONMENT | Desnecessário |

## Seção Técnica

### Arquivo: `supabase/functions/_shared/cors-v2.ts`

O arquivo será reduzido de ~190 linhas para ~150 linhas, removendo toda a lógica de detecção de ambiente que não é utilizada.

### Secret Required

A secret `CORS_ALLOWED_ORIGINS` deve conter todos os domínios permitidos separados por vírgula, incluindo:
- Domínio principal: `https://risecheckout.com`
- WWW: `https://www.risecheckout.com`
- App: `https://app.risecheckout.com`
- Pay (checkout): `https://pay.risecheckout.com`
- API: `https://api.risecheckout.com`
- Preview Lovable: `https://id-preview--ed9257df-d9f6-4a5e-961f-eca053f14944.lovable.app`
