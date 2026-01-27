
# Plano: Correção Final de Código Morto e Documentação Desatualizada

## Diagnóstico Root Cause

A auditoria completa identificou **3 problemas críticos** que violam o RISE Protocol V3:

### Problema #1: Código Morto em `check-secrets/index.ts`

**Arquivo:** `supabase/functions/check-secrets/index.ts`
**Linha:** 53

```typescript
// CÓDIGO MORTO - Secret obsoleto
'STRIPE_REDIRECT_URL': 'stripe',
```

O secret `STRIPE_REDIRECT_URL` foi **tornado obsoleto** pela implementação do SSOT. A URL de redirect do Stripe agora é **hardcoded** em `stripe-oauth-config.ts` e NÃO deve mais existir como secret.

**Correção:** Remover referência a `STRIPE_REDIRECT_URL` e adicionar referência correta aos secrets que REALMENTE existem no manifest.

### Problema #2: Documentação Desatualizada em `_shared/README.md`

**Arquivo:** `supabase/functions/_shared/README.md`

Os novos módulos SSOT para OAuth não estão documentados:
- `mercadopago-oauth-config.ts` - SSOT para Mercado Pago OAuth
- `stripe-oauth-config.ts` - SSOT para Stripe OAuth

**Correção:** Adicionar seção documentando os módulos de OAuth config.

### Problema #3: Prefixo de Cookie Desatualizado em `EDGE_FUNCTIONS_REGISTRY.md`

**Arquivo:** `docs/EDGE_FUNCTIONS_REGISTRY.md`
**Linha:** 44

```markdown
| **sessions (unified)** | `__Host-rise_access` + `__Host-rise_refresh` | ...
```

O prefixo correto é `__Secure-` (não `__Host-`), conforme implementado para suportar multi-subdomain com `Domain=.risecheckout.com`.

**Correção:** Atualizar para `__Secure-rise_access` + `__Secure-rise_refresh`.

---

## Análise de Soluções (RISE V3)

### Solução A: Corrigir apenas os 3 problemas identificados

- Manutenibilidade: 10/10 (remove código morto)
- Zero DT: 10/10 (elimina inconsistências)
- Arquitetura: 10/10 (documentação reflete realidade)
- Escalabilidade: 10/10 (sem impacto)
- Segurança: 10/10 (sem impacto)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 30 minutos

### Solução B: Não fazer nada

- Manutenibilidade: 4/10 (código morto confunde desenvolvedores)
- Zero DT: 0/10 (documentação desatualizada é dívida técnica)
- Arquitetura: 3/10 (inconsistência entre código e docs)
- Escalabilidade: 5/10 (sem impacto direto)
- Segurança: 8/10 (sem vulnerabilidade, mas confunde)
- **NOTA FINAL: 4.0/10**
- Tempo estimado: 0 minutos

### DECISÃO: Solução A (10.0/10)

A Solução B é inferior porque mantém código morto e documentação inconsistente, violando diretamente o princípio de Zero Dívida Técnica do RISE V3.

---

## Plano de Execução

### Fase 1: Corrigir `check-secrets/index.ts`

**Arquivo:** `supabase/functions/check-secrets/index.ts`

**Mudanças:**
1. Remover `'STRIPE_REDIRECT_URL': 'stripe'` (linha 53)
2. Adicionar secrets corretos do manifest:
   - `STRIPE_CLIENT_ID` (se não existir)
   
**Antes (linhas 49-53):**
```typescript
// Stripe
'STRIPE_SECRET_KEY': 'stripe',
'STRIPE_WEBHOOK_SECRET': 'stripe',
'STRIPE_CLIENT_ID': 'stripe',
'STRIPE_REDIRECT_URL': 'stripe',  // ❌ REMOVER
```

**Depois:**
```typescript
// Stripe
'STRIPE_SECRET_KEY': 'stripe',
'STRIPE_WEBHOOK_SECRET': 'stripe',
'STRIPE_CLIENT_ID': 'stripe',
// STRIPE_REDIRECT_URL removido - agora hardcoded em stripe-oauth-config.ts (SSOT)
```

### Fase 2: Atualizar `_shared/README.md`

**Arquivo:** `supabase/functions/_shared/README.md`

**Adicionar após a estrutura de arquivos (linha ~27):**

```markdown
├── mercadopago-oauth-config.ts   # SSOT OAuth Mercado Pago (RISE V3)
├── stripe-oauth-config.ts        # SSOT OAuth Stripe (RISE V3)
```

**Adicionar nova seção após `## 🔧 Outros Módulos`:**

```markdown
## 🔐 OAuth Configuration (RISE V3 - SSOT)

### Arquitetura OAuth SSOT

Os fluxos OAuth dos gateways de pagamento usam módulos de configuração centralizados:

```text
┌─────────────────────────────────────────────────────────────────┐
│                     SSOT OAuth Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend                                                        │
│     │                                                            │
│     ▼ (1) Request init-oauth                                     │
│  integration-management                                          │
│     │                                                            │
│     ▼ (2) Import config                                          │
│  mercadopago-oauth-config.ts / stripe-oauth-config.ts           │
│     │                                                            │
│     ▼ (3) Return authorizationUrl                                │
│  Frontend → window.open(authorizationUrl)                        │
│     │                                                            │
│     ▼ (4) Callback with code                                     │
│  mercadopago-oauth-callback / stripe-connect-oauth               │
│     │                                                            │
│     ▼ (5) Token exchange (SAME redirect_uri from config)         │
│  Success!                                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### `mercadopago-oauth-config.ts`

SSOT para OAuth do Mercado Pago.

```typescript
import { 
  buildAuthorizationUrl,
  getTokenExchangeConfig,
  MERCADOPAGO_REDIRECT_URI,
  MERCADOPAGO_CLIENT_ID
} from "../_shared/mercadopago-oauth-config.ts";

// Gerar URL de autorização
const url = buildAuthorizationUrl({ state: 'abc123' });

// Obter config para token exchange
const config = getTokenExchangeConfig({ code: 'auth_code' });
```

### `stripe-oauth-config.ts`

SSOT para OAuth do Stripe Connect.

```typescript
import { 
  buildStripeAuthorizationUrl,
  STRIPE_REDIRECT_URI,
  getStripeClientId
} from "../_shared/stripe-oauth-config.ts";

// Gerar URL de autorização
const url = buildStripeAuthorizationUrl({ state: 'abc123' });
```

**Por que SSOT?**

1. **Zero mismatch de redirect_uri** - Mesmo valor usado em autorização e token exchange
2. **URL hardcoded** - Elimina dependência de secrets para configuração de URL
3. **Consistência** - Frontend não monta URLs OAuth manualmente
```

### Fase 3: Corrigir `EDGE_FUNCTIONS_REGISTRY.md`

**Arquivo:** `docs/EDGE_FUNCTIONS_REGISTRY.md`

**Mudança na linha 44:**

**Antes:**
```markdown
| **sessions (unified)** | `__Host-rise_access` + `__Host-rise_refresh` | `unified-auth-v2.ts` | TODAS as funções autenticadas |
```

**Depois:**
```markdown
| **sessions (unified)** | `__Secure-rise_access` + `__Secure-rise_refresh` | `unified-auth-v2.ts` | TODAS as funções autenticadas |
```

---

## Arquivos Impactados

| Arquivo | Ação | Mudança |
|---------|------|---------|
| `supabase/functions/check-secrets/index.ts` | MODIFICAR | Remover `STRIPE_REDIRECT_URL` |
| `supabase/functions/_shared/README.md` | MODIFICAR | Adicionar documentação OAuth SSOT |
| `docs/EDGE_FUNCTIONS_REGISTRY.md` | MODIFICAR | Corrigir prefixo de cookie |

---

## Validação Pós-Implementação

### Checklist de Sucesso Total

| Critério | Status Esperado |
|----------|-----------------|
| Zero referências a `STRIPE_REDIRECT_URL` no código | ✅ 0 matches |
| Zero referências a `__Host-rise_*` no código | ✅ 0 matches |
| Documentação lista `mercadopago-oauth-config.ts` | ✅ Presente |
| Documentação lista `stripe-oauth-config.ts` | ✅ Presente |
| `check-secrets` retorna lista correta de secrets | ✅ Sem obsoletos |

### Verificação de Código Morto (grep final)

```bash
# Não deve retornar nada:
grep -r "STRIPE_REDIRECT_URL" supabase/functions/
grep -r "__Host-rise_" docs/
```

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Root Cause Only | ✅ Remove código morto, não adiciona workarounds |
| Single Source of Truth | ✅ OAuth config documentado como SSOT |
| Zero Dívida Técnica | ✅ Elimina 3 inconsistências |
| Arquitetura Correta | ✅ Documentação reflete implementação real |
| Segurança | ✅ Sem impacto (apenas cleanup) |
| < 300 linhas | ✅ Todas mudanças menores |

---

## Resumo Executivo

A implementação do OAuth SSOT foi um **SUCESSO TOTAL** com nota 10.0/10 nos critérios RISE V3. A arquitetura está correta:

1. ✅ **Mercado Pago OAuth:** SSOT em `mercadopago-oauth-config.ts`
2. ✅ **Stripe OAuth:** SSOT em `stripe-oauth-config.ts`
3. ✅ **Frontend:** Usa `authorizationUrl` do backend
4. ✅ **postMessage:** Corrigido para cross-subdomain (`'*'`)
5. ✅ **Token Exchange:** Usa mesma config do authorization

Restam apenas **3 correções de cleanup** para atingir conformidade 100%:

1. Remover secret obsoleto de `check-secrets`
2. Atualizar documentação `_shared/README.md`
3. Corrigir prefixo de cookie em `EDGE_FUNCTIONS_REGISTRY.md`
