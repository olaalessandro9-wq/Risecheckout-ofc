
# Plano RISE V3: Centralização Total (Padrão CORS + Site URLs)

## Resumo Executivo

A auditoria identificou **5 áreas principais** que podem receber o mesmo tratamento de centralização aplicado com sucesso em `cors-v2.ts` e `site-urls.ts`. Seguindo a Lei Suprema (Seção 4), todas as soluções propostas têm nota 10.0/10.

---

## Oportunidades Identificadas

| Area | Problema Atual | Solucao Proposta | Impacto |
|------|----------------|------------------|---------|
| **1. OAuth Callbacks** | `APP_BASE_URL`, `FRONTEND_URL` hardcoded | Migrar para `buildSiteUrl()` | 3 arquivos |
| **2. Supabase Client** | 50+ arquivos com `createClient()` duplicado | Helper `supabase-client.ts` | 50+ arquivos |
| **3. URLs Frontend** | `risecheckout.com` hardcoded em componentes | Helper `src/lib/urls.ts` | 5 arquivos |
| **4. Environment Flags** | `import.meta.env.DEV` espalhado | Helper `src/config/env.ts` | 10+ arquivos |
| **5. Platform Config** | Secrets validados manualmente | Adicionar `SITE_BASE_DOMAIN` ao manifest | 1 arquivo |

---

## Analise de Solucoes por Area (RISE Protocol V3 Secao 4.4)

### Area 1: OAuth Callbacks

#### Solucao A: Migrar para site-urls.ts (SSOT)
- Manutenibilidade: 10/10 (Um helper, um secret)
- Zero DT: 10/10 (Elimina `APP_BASE_URL` e `FRONTEND_URL`)
- Arquitetura: 10/10 (SSOT com cors-v2.ts)
- Escalabilidade: 10/10 (Novos subdomainios automaticos)
- Seguranca: 10/10 (Dominio base validado)
- **NOTA FINAL: 10.0/10**

#### Solucao B: Manter secrets separados
- Manutenibilidade: 6/10 (3 secrets diferentes para URLs)
- Zero DT: 5/10 (Cada oauth tem seu proprio fallback)
- Arquitetura: 5/10 (Inconsistente com site-urls.ts)
- Escalabilidade: 4/10 (Novo oauth = novo secret)
- Seguranca: 10/10
- **NOTA FINAL: 5.8/10**

**DECISAO: Solucao A** - Solucao B cria divida tecnica com secrets proliferando.

---

### Area 2: Supabase Client Factory

#### Solucao A: Helper Centralizado com Validacao
- Manutenibilidade: 10/10 (Unico ponto de criacao)
- Zero DT: 10/10 (Validacao de secrets em um lugar)
- Arquitetura: 10/10 (Factory Pattern, SOLID)
- Escalabilidade: 10/10 (Facil adicionar logging, tracing)
- Seguranca: 10/10 (Validacao antes de criar client)
- **NOTA FINAL: 10.0/10**

#### Solucao B: Manter pattern atual
- Manutenibilidade: 4/10 (50+ arquivos com mesmo codigo)
- Zero DT: 4/10 (Cada arquivo tem seu fallback)
- Arquitetura: 3/10 (Duplicacao massiva, viola DRY)
- Escalabilidade: 3/10 (Mudanca em 1 lugar = 50 edicoes)
- Seguranca: 6/10 (Validacao inconsistente)
- **NOTA FINAL: 3.9/10**

**DECISAO: Solucao A** - Solucao B e um antipattern classico.

---

### Area 3: URLs no Frontend

#### Solucao A: Helper com Contextos (Espelho do Backend)
- Manutenibilidade: 10/10 (Mesmo padrao do backend)
- Zero DT: 10/10 (Elimina hardcoded URLs)
- Arquitetura: 10/10 (Consistencia frontend/backend)
- Escalabilidade: 10/10 (Novos subdominios = zero mudanca)
- Seguranca: 10/10 (URL vem de env var)
- **NOTA FINAL: 10.0/10**

#### Solucao B: Manter URLs hardcoded
- Manutenibilidade: 3/10 (Mudanca de dominio = busca global)
- Zero DT: 2/10 (Cada componente tem sua URL)
- Arquitetura: 2/10 (Viola DRY, nao escala)
- Escalabilidade: 1/10 (Novo dominio = disaster)
- Seguranca: 8/10 (URLs sao publicas)
- **NOTA FINAL: 3.0/10**

**DECISAO: Solucao A** - Solucao B e bomb waiting to explode.

---

## Plano de Implementacao

### Fase 1: OAuth Callbacks (Backend)

**Arquivos a modificar:**

| Arquivo | Mudanca |
|---------|---------|
| `mercadopago-oauth-callback/index.ts` | `getAppBaseUrl()` para `buildSiteUrl()` |
| `stripe-connect-oauth/index.ts` | `FRONTEND_URL` para `buildSiteUrl()` |
| `stripe-connect-oauth/handlers/oauth-callback.ts` | `FRONTEND_URL` para `buildSiteUrl()` |

**Codigo antes:**
```typescript
// mercadopago-oauth-callback/index.ts
function getAppBaseUrl(): string {
  const envUrl = Deno.env.get('APP_BASE_URL');
  if (envUrl) return envUrl;
  return 'https://risecheckout.com';
}
```

**Codigo depois:**
```typescript
import { buildSiteUrl } from "../_shared/site-urls.ts";

// Remover getAppBaseUrl() - usar buildSiteUrl() diretamente
// buildSiteUrl('/oauth-success.html', 'default')
// buildSiteUrl('/dashboard/financeiro?stripe_success=true', 'dashboard')
```

---

### Fase 2: Supabase Client Factory (Backend)

**Criar:** `supabase/functions/_shared/supabase-client.ts`

```typescript
/**
 * Supabase Client Factory
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Centralizes Supabase client creation with:
 * - Environment validation
 * - Consistent error handling
 * - Logging integration
 * 
 * @version 1.0.0
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "./logger.ts";

const log = createLogger("SupabaseClient");

let cachedClient: SupabaseClient | null = null;

export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigError";
  }
}

/**
 * Gets or creates the Supabase service role client.
 * 
 * @throws SupabaseConfigError if SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are missing
 * @returns Supabase client with service role
 */
export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) {
    const missing = [];
    if (!url) missing.push("SUPABASE_URL");
    if (!key) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    
    log.error(`Missing config: ${missing.join(", ")}`);
    throw new SupabaseConfigError(`Supabase not configured: ${missing.join(", ")}`);
  }

  cachedClient = createClient(url, key);
  log.debug("Supabase client initialized");
  return cachedClient;
}

/**
 * Creates a fresh Supabase client (non-cached).
 * Use when you need isolation (e.g., testing).
 */
export function createSupabaseClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) {
    throw new SupabaseConfigError("Supabase not configured");
  }

  return createClient(url, key);
}

/**
 * Resets cached client (for testing).
 * @internal
 */
export function resetClientCache(): void {
  cachedClient = null;
}
```

**Migracao gradual:** As 50+ Edge Functions podem migrar incrementalmente. Nao e breaking change.

---

### Fase 3: URLs no Frontend

**Criar:** `src/lib/urls.ts`

```typescript
/**
 * Frontend URL Builder
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Mirrors backend site-urls.ts pattern.
 * Uses VITE_SITE_BASE_DOMAIN or fallback to risecheckout.com
 * 
 * @version 1.0.0
 */

export type UrlContext = 'default' | 'members' | 'checkout' | 'dashboard';

const SUBDOMAIN_MAP: Record<UrlContext, string> = {
  default: '',
  members: 'aluno.',
  checkout: 'pay.',
  dashboard: 'app.',
};

function getBaseDomain(): string {
  // In production, use env var. In dev, use current origin
  const envDomain = import.meta.env.VITE_SITE_BASE_DOMAIN;
  if (envDomain) {
    return envDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
  
  // Fallback for development
  if (import.meta.env.DEV) {
    return window.location.host;
  }
  
  return 'risecheckout.com';
}

/**
 * Builds a full URL for the given path and context.
 * 
 * @example
 * buildUrl('/pay/produto-x', 'checkout')
 * // -> "https://pay.risecheckout.com/pay/produto-x"
 * 
 * buildUrl('/afiliar/123', 'default')
 * // -> "https://risecheckout.com/afiliar/123"
 */
export function buildUrl(path: string, context: UrlContext = 'default'): string {
  const baseDomain = getBaseDomain();
  const subdomain = SUBDOMAIN_MAP[context] || '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // In development, don't add subdomain (single localhost)
  if (import.meta.env.DEV) {
    return `${window.location.origin}${cleanPath}`;
  }
  
  return `https://${subdomain}${baseDomain}${cleanPath}`;
}

/**
 * Gets the base URL for a context.
 */
export function getBaseUrl(context: UrlContext = 'default'): string {
  const baseDomain = getBaseDomain();
  const subdomain = SUBDOMAIN_MAP[context] || '';
  
  if (import.meta.env.DEV) {
    return window.location.origin;
  }
  
  return `https://${subdomain}${baseDomain}`;
}
```

**Arquivos a migrar:**

| Arquivo | Antes | Depois |
|---------|-------|--------|
| `AffiliateInviteLink.tsx` | `https://risecheckout.com/afiliar/...` | `buildUrl('/afiliar/...', 'default')` |
| `OffersTab.tsx` | `https://risecheckout.com/pay/...` | `buildUrl('/pay/...', 'checkout')` |
| `LinksTable.tsx` | `getCorrectUrl()` manual | `buildUrl(path, context)` |
| `useProductOffers.ts` | `window.location.origin` | `buildUrl('/checkout/...', 'checkout')` |

---

### Fase 4: Platform Secrets Manifest

**Atualizar:** `supabase/functions/_shared/platform-secrets.ts`

Adicionar `SITE_BASE_DOMAIN` ao catalogo de secrets:

```typescript
// Adicionar ao SECRETS_MANIFEST:
SITE_BASE_DOMAIN: {
  name: 'SITE_BASE_DOMAIN',
  description: 'Dominio base da plataforma (ex: risecheckout.com). Usado por site-urls.ts',
  required: false, // Opcional pois PUBLIC_SITE_URL funciona como fallback
},
```

---

### Fase 5: Cleanup de Secrets Legados

**Depois que tudo estiver migrado:**

| Secret Legado | Status | Acao |
|---------------|--------|------|
| `PUBLIC_SITE_URL` | Pode ser removido | Migrar para `SITE_BASE_DOMAIN` |
| `APP_BASE_URL` | Pode ser removido | Ja usa `buildSiteUrl()` |
| `FRONTEND_URL` | Pode ser removido | Ja usa `buildSiteUrl()` |

---

## Diagrama de Arquitetura Final

```text
+------------------------------------------------------------------+
|                    RISE V3 URL ARCHITECTURE                       |
+------------------------------------------------------------------+
|                                                                   |
|   SECRETS (Supabase)                                             |
|   +-----------------------------------------------------------+  |
|   | SITE_BASE_DOMAIN = risecheckout.com                       |  |
|   | CORS_ALLOWED_ORIGINS = *.risecheckout.com,...             |  |
|   +-----------------------------------------------------------+  |
|                           |                                       |
|                           v                                       |
|   BACKEND (_shared/)                                             |
|   +-----------------------------------------------------------+  |
|   | site-urls.ts          | cors-v2.ts      | supabase-client |  |
|   | buildSiteUrl(path,ctx)| handleCorsV2()  | getSupabaseClient()|
|   +-----------------------------------------------------------+  |
|          |                       |                    |          |
|          v                       v                    v          |
|   +-----------------------------------------------------------+  |
|   | unified-auth    | oauth-callbacks  | all 50+ functions   |  |
|   | students-invite | mercadopago      |                     |  |
|   | gdpr-request    | stripe-connect   |                     |  |
|   +-----------------------------------------------------------+  |
|                                                                   |
|   FRONTEND (src/)                                                |
|   +-----------------------------------------------------------+  |
|   | lib/urls.ts           | config/env.ts                     |  |
|   | buildUrl(path,ctx)    | isDev, isProd, etc                |  |
|   +-----------------------------------------------------------+  |
|          |                       |                               |
|          v                       v                               |
|   +-----------------------------------------------------------+  |
|   | AffiliateInviteLink | OffersTab | LinksTable | logger.ts  |  |
|   | useProductOffers    | Sentry    | etc                     |  |
|   +-----------------------------------------------------------+  |
|                                                                   |
+------------------------------------------------------------------+
```

---

## Ordem de Execucao Recomendada

| Prioridade | Fase | Complexidade | Impacto |
|------------|------|--------------|---------|
| 1 | OAuth Callbacks | Baixa (3 arquivos) | Alto (elimina 2 secrets) |
| 2 | Frontend URLs | Media (5 arquivos) | Alto (elimina hardcoded) |
| 3 | Supabase Client | Alta (50+ arquivos) | Muito Alto (DRY, logging) |
| 4 | Platform Secrets | Baixa (1 arquivo) | Medio (documentacao) |
| 5 | Cleanup Legados | Baixa (config) | Alto (elimina secrets) |

---

## Secao Tecnica

### Compatibilidade Retroativa

Todas as mudancas sao **100% retrocompativeis**:
- `site-urls.ts` ja suporta `PUBLIC_SITE_URL` como fallback
- `supabase-client.ts` seria opcional (funcoes existentes continuam funcionando)
- Frontend `urls.ts` tem fallback para `window.location.origin` em dev

### Testes Recomendados

| Fase | Teste |
|------|-------|
| OAuth | Testar fluxo MP e Stripe end-to-end |
| Frontend | Verificar links de afiliados em producao |
| Supabase | Deploy gradual, monitorar logs |

### RISE V3 Compliance

| Criterio | Status |
|----------|--------|
| Manutenibilidade Infinita | Um helper por dominio, zero duplicacao |
| Zero Divida Tecnica | Elimina secrets proliferando |
| Arquitetura Correta | SSOT pattern em todo projeto |
| Escalabilidade | Novos subdominios = 1 linha de codigo |
| Seguranca | Dominios validados, secrets centralizados |

**RISE V3 Score Projetado: 10.0/10**

---

## Resumo de Arquivos

### Criar
| Arquivo | Descricao |
|---------|-----------|
| `_shared/supabase-client.ts` | Factory de Supabase client |
| `src/lib/urls.ts` | Builder de URLs frontend |
| `src/config/env.ts` | Flags de ambiente centralizados |

### Modificar
| Arquivo | Mudanca |
|---------|---------|
| `mercadopago-oauth-callback/index.ts` | Usar `buildSiteUrl()` |
| `stripe-connect-oauth/index.ts` | Usar `buildSiteUrl()` |
| `stripe-connect-oauth/handlers/oauth-callback.ts` | Usar `buildSiteUrl()` |
| `AffiliateInviteLink.tsx` | Usar `buildUrl()` |
| `OffersTab.tsx` | Usar `buildUrl()` |
| `LinksTable.tsx` | Usar `buildUrl()` |
| `useProductOffers.ts` | Usar `buildUrl()` |
| `platform-secrets.ts` | Adicionar `SITE_BASE_DOMAIN` |

### Remover (Apos Migracao)
| Secret | Razao |
|--------|-------|
| `APP_BASE_URL` | Substituido por `SITE_BASE_DOMAIN` |
| `FRONTEND_URL` | Substituido por `SITE_BASE_DOMAIN` |
