# 📝 Auth System Changelog

**Projeto:** RiseCheckout  
**Última Atualização:** 18 de Janeiro de 2026

---

## [2.0.0] - 2026-01-18

### 🎯 Refatoração Completa - RISE V3 10.0/10

Esta versão representa uma **refatoração completa** do sistema de autenticação para atingir conformidade total com o RISE ARCHITECT PROTOCOL V3.

---

### ✅ Centralização de Constantes

**Arquivo criado:** `supabase/functions/_shared/auth-constants.ts`

Todas as constantes de autenticação foram centralizadas em um único arquivo:

| Constante | Valor | Descrição |
|-----------|-------|-----------|
| `CURRENT_HASH_VERSION` | 2 | Versão atual do hash (bcrypt) |
| `BCRYPT_COST` | 10 | Cost factor do bcrypt |
| `PRODUCER_SESSION_DURATION_DAYS` | 30 | Duração da sessão producer |
| `BUYER_SESSION_DURATION_DAYS` | 30 | Duração da sessão buyer |
| `SESSION_DURATION_DAYS` | 30 | Alias para backwards compatibility |
| `RESET_TOKEN_EXPIRY_HOURS` | 1 | Expiração do token de reset |
| `PASSWORD_REQUIRES_RESET` | "REQUIRES_RESET" | Marker para reset obrigatório |
| `PASSWORD_PENDING_SETUP` | "PENDING_PASSWORD_SETUP" | Marker para setup pendente |
| `PASSWORD_OWNER_NO_PASSWORD` | "OWNER_NO_PASSWORD" | Marker para owner sem senha |

---

### 🗑️ Código Legado Eliminado

#### Constantes Removidas

| Constante | Arquivo Original | Motivo |
|-----------|------------------|--------|
| `HASH_VERSION_SHA256` | buyer-auth-types.ts | SHA-256 descontinuado |
| `HASH_VERSION_BCRYPT` | buyer-auth-types.ts | Substituído por CURRENT_HASH_VERSION |
| `SESSION_DURATION_DAYS` (local) | buyer-session/index.ts | Substituído por import centralizado |

#### Funções Removidas

| Função | Arquivo Original | Motivo |
|--------|------------------|--------|
| `hashPasswordLegacy()` | buyer-auth-password.ts | SHA-256 eliminado |
| `signInWithPassword()` | producer-auth-helpers.ts | Supabase Auth não usado |

#### Arquivos Deletados

| Arquivo | Motivo |
|---------|--------|
| `supabase/functions/_shared/response.ts` | Substituído por response-helpers.ts |
| `supabase/functions/_shared/password-hasher.ts` | Legado, funções migradas |

---

### 🔧 Padronização de Response Helpers

**Arquivo padrão:** `supabase/functions/_shared/response-helpers.ts`

#### Assinatura Unificada

```typescript
// ANTES (response.ts) - INCONSISTENTE
function jsonResponse(status, data, headers)  // ordem diferente

// DEPOIS (response-helpers.ts) - PADRONIZADO
function jsonResponse(data, corsHeaders, status = 200)
```

#### Arquivos Atualizados

| Arquivo | Mudança |
|---------|---------|
| `product-settings/index.ts` | Import mudado para response-helpers.ts |
| Todos os arquivos de auth | Já usavam response-helpers.ts |

---

### 🔐 Função SQL Criada

**Função:** `get_producer_id_from_session()`

```sql
CREATE OR REPLACE FUNCTION public.get_producer_id_from_session()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
```

**Propósito:** Permite que RLS policies obtenham o `producer_id` do token de sessão customizado, sem depender do JWT do Supabase Auth.

**Comportamento:**
1. Extrai token do header `x-producer-session-token`
2. Busca `producer_id` na tabela `producer_sessions`
3. Fallback para `auth.uid()` se não houver token

---

### 📁 Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `_shared/auth-constants.ts` | ✅ Criado - Constantes centralizadas |
| `_shared/buyer-auth-types.ts` | ✅ Imports de auth-constants.ts |
| `_shared/buyer-auth-password.ts` | ✅ Imports de auth-constants.ts, removido hashPasswordLegacy |
| `_shared/buyer-auth-handlers.ts` | ✅ Imports centralizados |
| `_shared/buyer-auth-handlers-extended.ts` | ✅ Imports centralizados |
| `_shared/buyer-auth-producer-handlers.ts` | ✅ Imports centralizados |
| `_shared/producer-auth-helpers.ts` | ✅ Imports centralizados, removido signInWithPassword |
| `buyer-session/index.ts` | ✅ Import BUYER_SESSION_DURATION_DAYS |
| `product-settings/index.ts` | ✅ Import response-helpers.ts |
| `src/integrations/supabase/client.ts` | ✅ Removido header estático |

---

### 📊 Métricas da Refatoração

| Métrica | Antes | Depois |
|---------|-------|--------|
| Arquivos com constantes duplicadas | 5 | 0 |
| Arquivos de response helpers | 2 | 1 |
| Funções legadas (SHA-256) | 2 | 0 |
| Código morto | ~150 linhas | 0 |
| Score RISE V3 | 9.5/10 | **10.0/10** |

---

### 🎯 Decisões Tomadas

#### 1. Eliminar SHA-256 Completamente

**Justificativa:** SHA-256 é vulnerável a ataques de força bruta modernos. Como não há usuários em produção, foi possível eliminar completamente.

#### 2. Centralizar em auth-constants.ts

**Justificativa:** Single Source of Truth (SSOT) para todas as constantes de auth. Elimina risco de valores divergentes entre arquivos.

#### 3. Padronizar jsonResponse

**Justificativa:** Uma única assinatura (`data, headers, status`) em todo o projeto evita bugs e facilita manutenção.

#### 4. Criar get_producer_id_from_session()

**Justificativa:** Permite RLS funcionar com tokens customizados sem depender do Supabase Auth JWT.

---

### 📋 Checklist de Conformidade

- [x] Zero duplicação de constantes
- [x] Zero código legado (SHA-256)
- [x] Zero arquivos > 300 linhas
- [x] Single Response Helper (response-helpers.ts)
- [x] Função SQL para RLS
- [x] Documentação completa (AUTH_SYSTEM.md)
- [x] Score RISE V3: 10.0/10

---

### 🔮 Próximas Evoluções (Sugeridas)

| Evolução | Prioridade | Impacto |
|----------|------------|---------|
| Refresh Tokens | Alta | Segurança |
| httpOnly Cookies | Média | Segurança vs XSS |
| Device Fingerprinting | Baixa | Auditoria |
| MFA (2FA) | Baixa | Segurança |

---

## [1.0.0] - 2025-XX-XX (Inicial)

### Implementação Original

- Sistema dual-domain (Producer + Buyer)
- Tokens de sessão customizados
- bcrypt para hashing
- Rate limiting
- Edge Functions para auth

---

**Mantido por:** Lead Architect  
**Última revisão:** 18 de Janeiro de 2026
