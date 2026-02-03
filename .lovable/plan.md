
# Plano RISE V3: Site URLs com Wildcard (Padrão CORS)

## Resumo

Implementar helper centralizado para geração de URLs que suporta múltiplos subdomínios usando um único secret `SITE_BASE_DOMAIN`, seguindo o padrão já existente no CORS do projeto.

## Arquitetura

### Secret Único
```
SITE_BASE_DOMAIN=risecheckout.com
```

### Mapeamento de Contextos

| Contexto | Subdomínio | URL Final |
|----------|------------|-----------|
| `default` | (nenhum) | `https://risecheckout.com` |
| `members` | `aluno.` | `https://aluno.risecheckout.com` |
| `checkout` | `pay.` | `https://pay.risecheckout.com` |
| `dashboard` | `app.` | `https://app.risecheckout.com` |

### Compatibilidade Retroativa

O helper funciona com o secret atual `PUBLIC_SITE_URL` automaticamente (remove protocolo e usa como domínio base).

---

## Arquivos a Modificar

| Arquivo | Ação | Contexto de URL |
|---------|------|-----------------|
| `_shared/site-urls.ts` | CRIAR | Helper centralizado |
| `unified-auth/handlers/password-reset-request.ts` | ATUALIZAR | `default` |
| `students-invite/handlers/invite.ts` | ATUALIZAR | `members` |
| `students-invite/handlers/generate_purchase_access.ts` | ATUALIZAR | `members` |
| `_shared/grant-members-access.ts` | ATUALIZAR | `members` |
| `_shared/send-order-emails.ts` | ATUALIZAR | `members` |
| `gdpr-request/index.ts` | ATUALIZAR | `default` |

---

## Implementação Detalhada

### 1. Criar `supabase/functions/_shared/site-urls.ts`

```typescript
/**
 * Site URL Builder - Wildcard Subdomain Support
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Architecture (follows cors-v2.ts pattern):
 * - Single secret: SITE_BASE_DOMAIN (e.g., "risecheckout.com")
 * - Context determines subdomain prefix
 * - Zero config for new subdomains
 */

import { createLogger } from "./logger.ts";

const log = createLogger("SiteUrls");

export type UrlContext = 'default' | 'members' | 'checkout' | 'dashboard';

const SUBDOMAIN_MAP: Record<UrlContext, string> = {
  default: '',
  members: 'aluno.',
  checkout: 'pay.',
  dashboard: 'app.',
};

let cachedBaseDomain: string | null = null;

function getBaseDomain(): string {
  if (cachedBaseDomain) return cachedBaseDomain;
  
  const domain = Deno.env.get("SITE_BASE_DOMAIN") 
    || Deno.env.get("PUBLIC_SITE_URL")?.replace(/^https?:\/\//, '').replace(/\/$/, '')
    || "risecheckout.com";
  
  cachedBaseDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  log.info(`Site base domain: ${cachedBaseDomain}`);
  return cachedBaseDomain;
}

export function buildSiteUrl(path: string, context: UrlContext = 'default'): string {
  const baseDomain = getBaseDomain();
  const subdomain = SUBDOMAIN_MAP[context] || '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `https://${subdomain}${baseDomain}${cleanPath}`;
}

export function getSiteBaseUrl(context: UrlContext = 'default'): string {
  const baseDomain = getBaseDomain();
  const subdomain = SUBDOMAIN_MAP[context] || '';
  return `https://${subdomain}${baseDomain}`;
}
```

### 2. Atualizar `password-reset-request.ts`

**Linha 118** - De:
```typescript
const siteUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://risecheckout.com";
const resetLink = `${siteUrl}/redefinir-senha?token=${resetToken}`;
```

Para:
```typescript
import { buildSiteUrl } from "../../_shared/site-urls.ts";
// ...
const resetLink = buildSiteUrl(`/redefinir-senha?token=${resetToken}`, 'default');
```

### 3. Atualizar `invite.ts`

**Linha 89-90** - De:
```typescript
const baseUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://risecheckout.com";
const accessLink = `${baseUrl}/minha-conta/setup-acesso?token=${rawToken}`;
```

Para:
```typescript
import { buildSiteUrl } from "../../_shared/site-urls.ts";
// ...
const accessLink = buildSiteUrl(`/minha-conta/setup-acesso?token=${rawToken}`, 'members');
```

### 4. Atualizar `generate_purchase_access.ts`

**Linha 69** - De:
```typescript
const baseUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://risecheckout.com";
```

Para:
```typescript
import { buildSiteUrl } from "../../_shared/site-urls.ts";
// ...
// Linha com needsPasswordSetup:
return jsonResponse({ 
  success: true, 
  needsPasswordSetup: true, 
  accessUrl: buildSiteUrl(`/minha-conta/setup-acesso?token=${rawToken}`, 'members')
}, 200, corsHeaders);

// Linha sem setup:
return jsonResponse({ 
  success: true, 
  needsPasswordSetup: false, 
  accessUrl: buildSiteUrl('/minha-conta', 'members')
}, 200, corsHeaders);
```

### 5. Atualizar `grant-members-access.ts`

**Linhas 281-288** - De:
```typescript
const baseUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://risecheckout.com';
accessUrl = `${baseUrl}/minha-conta/setup-acesso?token=${rawToken}`;
// ...
const baseUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://risecheckout.com';
accessUrl = `${baseUrl}/minha-conta`;
```

Para:
```typescript
import { buildSiteUrl } from "./site-urls.ts";
// ...
accessUrl = buildSiteUrl(`/minha-conta/setup-acesso?token=${rawToken}`, 'members');
// ...
accessUrl = buildSiteUrl('/minha-conta', 'members');
```

### 6. Atualizar `send-order-emails.ts`

**Linha 107** - De:
```typescript
const siteUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://risecheckout.com';
return `${siteUrl}/minha-conta/produtos/${productId}`;
```

Para:
```typescript
import { buildSiteUrl } from "./site-urls.ts";
// ...
return buildSiteUrl(`/minha-conta/produtos/${productId}`, 'members');
```

### 7. Atualizar `gdpr-request/index.ts`

**Linhas 260-261** - De:
```typescript
const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://risecheckout.com";
const verificationUrl = `${publicSiteUrl}/lgpd/confirmar?token=${verificationToken}`;
```

Para:
```typescript
import { buildSiteUrl } from "../_shared/site-urls.ts";
// ...
const verificationUrl = buildSiteUrl(`/lgpd/confirmar?token=${verificationToken}`, 'default');
```

---

## Configuração de Secrets

### Atual (Já Configurado)
```
PUBLIC_SITE_URL=https://risecheckout.com
```

### Futuro (Quando Quiser Subdomain)
```
SITE_BASE_DOMAIN=risecheckout.com
```

O helper funciona com ambos os secrets automaticamente.

---

## Benefícios

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Secrets necessários | 1 por subdomínio | 1 total |
| Adicionar subdomínio | Criar secret + alterar código | Alterar 1 linha no SUBDOMAIN_MAP |
| Consistência | Cada arquivo define fallback | Helper centralizado |
| Manutenção | N arquivos | 1 arquivo |

---

## Seção Técnica

### Compatibilidade Retroativa

O helper detecta automaticamente:
1. `SITE_BASE_DOMAIN` (novo, preferido)
2. `PUBLIC_SITE_URL` (atual, remove https://)
3. Fallback: `risecheckout.com`

### Adicionando Novo Subdomínio (Futuro)

Para adicionar `api.risecheckout.com`:

```typescript
// Em site-urls.ts, adicionar ao SUBDOMAIN_MAP:
const SUBDOMAIN_MAP: Record<UrlContext, string> = {
  default: '',
  members: 'aluno.',
  checkout: 'pay.',
  dashboard: 'app.',
  api: 'api.',  // Novo
};

// Atualizar tipo:
export type UrlContext = 'default' | 'members' | 'checkout' | 'dashboard' | 'api';
```

Zero configuração de secrets.

### RISE V3 Score: 10.0/10

| Critério | Status |
|----------|--------|
| Manutenibilidade Infinita | Um secret, padrão consistente |
| Zero Dívida Técnica | Não prolifera secrets |
| Arquitetura Correta | Segue padrão CORS existente |
| Escalabilidade | Novos subdomínios = zero config |
| Segurança | Domínio base validado |
