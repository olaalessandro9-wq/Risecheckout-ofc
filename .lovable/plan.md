
# PLANO: COOKIE-FIRST ARCHITECTURE
## RISE ARCHITECT PROTOCOL V3 - NOTA 10.0/10

---

## PRÉ-REQUISITOS CONFIRMADOS

| Item | Status |
|------|--------|
| CNAME `api.risecheckout.com` → Supabase | Configurado e propagado |
| Secret `CORS_ALLOWED_ORIGINS` com todos os domínios | Configurado |

---

## RESUMO EXECUTIVO

**Problema Atual:** Third-party cookies (`__Host-` prefix, `SameSite=None`) estão sendo bloqueados por navegadores modernos (Safari, Firefox, Chrome com proteção), causando logouts inesperados ao atualizar a página.

**Solução:** Migrar para first-party cookies (`SameSite=Lax`, `domain=.risecheckout.com`) usando o novo CNAME `api.risecheckout.com` que aponta para o Supabase.

---

## ANÁLISE DE SOLUÇÕES (RISE V3 OBRIGATÓRIO)

### Solução A: Cookie-First Architecture (First-Party Cookies)
| Critério | Nota |
|----------|------|
| Manutenibilidade | 10/10 - Cookies gerenciados pelo navegador |
| Zero DT | 10/10 - Elimina toda dependência de localStorage |
| Arquitetura | 10/10 - Backend como ÚNICA fonte de verdade |
| Escalabilidade | 10/10 - Funciona em todos os browsers |
| Segurança | 10/10 - First-party + httpOnly + Secure |
| **NOTA FINAL** | **10.0/10** |
| Tempo estimado | 1-2 horas |

### Solução B: Manter Third-Party Cookies (Status Quo)
| Critério | Nota |
|----------|------|
| Manutenibilidade | 4/10 - Dependência de Partitioned, polyfills |
| Zero DT | 3/10 - localStorage como fallback cria bugs |
| Arquitetura | 5/10 - Frontend decide, backend é secundário |
| Escalabilidade | 2/10 - Safari/Firefox bloqueiam |
| Segurança | 6/10 - Third-party é considerado menos seguro |
| **NOTA FINAL** | **4.0/10** |
| Tempo estimado | 0 (já está assim) |

### DECISÃO: Solução A (Nota 10.0)
A Solução B é inferior porque depende de tecnologia que está sendo ativamente depreciada pelos navegadores (third-party cookies).

---

## FASES DE IMPLEMENTAÇÃO

### FASE 2: MIGRAÇÃO DE COOKIES (BACKEND)
**Arquivos: 2 | Objetivo: First-Party Cookies**

#### 2.1 `supabase/functions/_shared/cookie-helper.ts`

**Mudanças:**
```text
ANTES:
- COOKIE_NAMES = { access: "__Host-rise_access", refresh: "__Host-rise_refresh" }
- sameSite: "None"
- Partitioned: true

DEPOIS:
- COOKIE_NAMES = { access: "rise_access", refresh: "rise_refresh" }
- sameSite: "Lax"
- domain: ".risecheckout.com"
- Partitioned: REMOVIDO
```

**Detalhes Técnicos:**
1. Remover prefixo `__Host-` dos nomes dos cookies
   - `__Host-` requer `path=/` e não permite `domain=`
   - Para first-party com domain, usar nome simples
2. Adicionar `domain: ".risecheckout.com"` para compartilhamento entre subdomínios
3. Mudar `sameSite: "None"` para `sameSite: "Lax"`
   - Lax é o padrão seguro para first-party
4. Remover atributo `Partitioned`
   - Não é necessário para first-party cookies

#### 2.2 `supabase/functions/_shared/unified-auth-v2.ts`

**Mudanças:**
- Atualizar `createUnifiedAuthCookies()` com novos atributos
- Atualizar `createUnifiedLogoutCookies()` com domain
- Manter clearing de cookies legados (producer/buyer) para retrocompatibilidade

---

### FASE 3: ATUALIZAÇÃO DO FRONTEND
**Arquivos: 2 | Objetivo: Apontar para api.risecheckout.com**

#### 3.1 `src/config/supabase.ts`

**Mudanças:**
```typescript
// ANTES
export const SUPABASE_URL = "https://wivbtmtgpsxupfjwwovf.supabase.co";

// DEPOIS
export const SUPABASE_URL = "https://api.risecheckout.com";
```

#### 3.2 `src/integrations/supabase/client.ts`

**Mudanças:**
```typescript
// Importar de config
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/config/supabase";

// Desabilitar localStorage para sessão
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: undefined,       // Sem localStorage
    persistSession: false,    // Cookies são a fonte de verdade
    autoRefreshToken: false,  // Backend gerencia refresh
  },
});
```

---

### FASE 4: COOKIE-FIRST ARCHITECTURE (CORE FRONTEND)
**Arquivos: 4 | Objetivo: Backend como ÚNICA fonte de verdade**

#### 4.1 `src/hooks/useUnifiedAuth.ts`

**Mudanças:**
1. Remover dependência de `hasValidToken()` para decisões de autenticação
2. Sempre consultar backend via `/unified-auth/validate`
3. TokenService se torna cache/proxy, não fonte de verdade

```typescript
// validateSession() - Simplificado
async function validateSession(): Promise<ValidateResponse> {
  try {
    // RISE V3: Backend é a ÚNICA fonte de verdade
    // Cookies são enviados automaticamente com credentials: include
    const { data, error } = await api.publicCall<ValidateResponse>("unified-auth/validate", {});
    
    if (error || !data) {
      return { valid: false };
    }
    
    return data;
  } catch {
    return { valid: false };
  }
}
```

#### 4.2 `src/lib/token-manager/service.ts`

**Mudanças:**
1. `hasValidToken()`: Retornar `true` quando em estado `idle` (cookies podem estar válidos)
2. `refresh()`: Não bloquear em estado `idle`
3. `restoreState()`: Sempre iniciar em `idle` (não ler localStorage)
4. `handleVisibilityRestore()`: Sempre notificar subscribers para revalidar

```typescript
// hasValidToken() - Cookie-First
hasValidToken(): boolean {
  // Em Cookie-First, o backend decide
  // Retornar true permite que a chamada API aconteça
  if (this.state === "idle") {
    return true; // Let the API call happen
  }
  const validStates: TokenState[] = ["authenticated", "expiring", "refreshing"];
  return validStates.includes(this.state);
}

// restoreState() - Cookie-First (NO-OP)
private restoreState(): void {
  // RISE V3: Backend é SSOT - não restaurar do localStorage
  this.log.info("Cookie-First: Backend is source of truth");
  // Stay in idle, let validation happen via API
}
```

#### 4.3 `src/lib/token-manager/persistence.ts`

**Mudanças:**
Transformar em NO-OP para eliminar localStorage como fonte de autenticação:

```typescript
// persistTokenState() - NO-OP
export function persistTokenState(): void {
  // RISE V3: Cookie-First - No localStorage persistence
  // Backend cookies are the source of truth
}

// restoreTokenState() - Always empty
export function restoreTokenState(): PersistedState {
  // RISE V3: Cookie-First - Always return empty state
  return { state: null, expiresAt: null, lastRefreshAttempt: null };
}

// clearPersistedState() - Keep for cleanup
export function clearPersistedState(type: TokenType): void {
  // Keep this to clear any legacy data
  // ... existing implementation ...
}
```

#### 4.4 `src/lib/token-manager/cross-tab-lock.ts`

**Mudanças:**
Backend agora gerencia locking via tabela `refresh_locks`. Client-side lock se torna secundário:

```typescript
// tryAcquire() - Always succeed (backend does real locking)
tryAcquire(): boolean {
  // RISE V3: Server-side refresh_locks is primary
  // Client lock is just a courtesy to reduce duplicate requests
  return true;
}

// release() - NO-OP
release(): void {
  // RISE V3: Server manages lock lifecycle
}
```

---

### FASE 5: LIMPEZA DE LEGADO (BACKEND)
**Arquivos: 3 | Objetivo: users como ÚNICA fonte de verdade**

#### 5.1 `supabase/functions/unified-auth/handlers/password-reset-verify.ts`

**Mudança:** Remover fallback para `buyer_profiles` (linhas 51-88)

```typescript
// REMOVER TODO ESTE BLOCO:
// RISE V3 FALLBACK: If not found in users, check buyer_profiles
if (findError || !user) {
  const { data: buyer, error: buyerError } = await supabase
    .from("buyer_profiles")
    // ...
}
```

**Novo comportamento:** Se token não existe em `users`, retornar inválido.

#### 5.2 `supabase/functions/unified-auth/handlers/password-reset.ts`

**Mudança:** Remover fallback para `buyer_profiles` (linhas 67-152)

O mesmo padrão: remover todo o bloco de fallback e manter apenas a lógica da tabela `users`.

#### 5.3 `supabase/functions/unified-auth/handlers/ensure-producer-access.ts`

**Mudança:** Remover fallback para `buyer_profiles` (linhas 44-48, 51, 87)

```typescript
// REMOVER:
let { data: buyer } = await supabase
  .from("buyer_profiles")
  .select("id")
  .eq("email", normalizedEmail)
  .single();

// REMOVER:
if (!user && !buyer) {
// MUDAR PARA:
if (!user) {

// REMOVER:
const userId = user?.id || buyer?.id;
// MUDAR PARA:
const userId = user.id;
```

---

## ARQUIVOS AFETADOS

| # | Arquivo | Tipo | Mudança Principal |
|---|---------|------|-------------------|
| 1 | `supabase/functions/_shared/cookie-helper.ts` | Backend | First-party cookies |
| 2 | `supabase/functions/_shared/unified-auth-v2.ts` | Backend | First-party cookies |
| 3 | `src/config/supabase.ts` | Frontend | URL para api.risecheckout.com |
| 4 | `src/integrations/supabase/client.ts` | Frontend | Desabilitar localStorage |
| 5 | `src/hooks/useUnifiedAuth.ts` | Frontend | Backend como SSOT |
| 6 | `src/lib/token-manager/service.ts` | Frontend | Cookie-First logic |
| 7 | `src/lib/token-manager/persistence.ts` | Frontend | NO-OP (sem localStorage) |
| 8 | `src/lib/token-manager/cross-tab-lock.ts` | Frontend | Simplificado (backend locking) |
| 9 | `password-reset-verify.ts` | Backend | Remover fallback buyer_profiles |
| 10 | `password-reset.ts` | Backend | Remover fallback buyer_profiles |
| 11 | `ensure-producer-access.ts` | Backend | Remover fallback buyer_profiles |

**Total: 11 arquivos**

---

## ORDEM DE EXECUÇÃO

```text
┌─────────────────────────────────────────────────────────────┐
│  1. Backend: cookie-helper.ts + unified-auth-v2.ts         │
│     → First-party cookies com domain=.risecheckout.com     │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Frontend Config: supabase.ts + client.ts               │
│     → Apontar para api.risecheckout.com                    │
│     → Desabilitar localStorage                             │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Frontend Core: useUnifiedAuth + TokenService           │
│     → Backend como ÚNICA fonte de verdade                  │
│     → persistence.ts e cross-tab-lock.ts simplificados     │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Backend Cleanup: password-reset handlers               │
│     → Remover fallbacks para buyer_profiles                │
│     → users como SSOT absoluto                             │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Deploy: Edge Functions (automático pelo Lovable)       │
└─────────────────────────────────────────────────────────────┘
```

---

## RESULTADO ESPERADO

| Problema | Antes | Depois |
|----------|-------|--------|
| Logout ao atualizar (F5) | Acontece | Resolvido |
| Sessões instáveis | Frequente | Estável |
| Third-party cookies | Bloqueados pelo Safari/Firefox | First-party funcionam |
| localStorage como fonte | Causa dessincronização | Backend é SSOT |
| Fallbacks para buyer_profiles | Existem | Removidos (users SSOT) |

---

## CRITÉRIOS DE SUCESSO

1. **Login:** Usuário faz login, recebe cookies first-party
2. **F5:** Usuário atualiza página, permanece logado
3. **Nova aba:** Usuário abre nova aba, está logado
4. **Safari/Firefox:** Funciona corretamente (sem bloqueio de cookies)
5. **Password Reset:** Funciona apenas com tabela `users`

---

## NOTAS TÉCNICAS

### Por que remover `__Host-` prefix?

O prefixo `__Host-` impõe restrições de segurança:
- Cookie DEVE ter `Secure`
- Cookie DEVE ter `Path=/`
- Cookie NÃO PODE ter `Domain=`

Como precisamos de `domain=.risecheckout.com` para compartilhamento entre subdomínios (app, api, pay), não podemos usar `__Host-`.

### Por que `SameSite=Lax` em vez de `Strict`?

- `Strict`: Cookie não enviado em navegações top-level vindas de outros sites
- `Lax`: Cookie enviado em navegações GET top-level (links)

`Lax` é o padrão seguro que permite usuários chegarem via links externos sem perder sessão.

### Migração de Sessões Existentes

Usuários com sessões existentes (`__Host-rise_*`) precisarão fazer login novamente, pois os novos cookies têm nomes diferentes (`rise_*`). Isso é esperado e acontece uma única vez.

---

## NOTA RISE V3 FINAL

| Critério | Nota |
|----------|------|
| Manutenibilidade Infinita | 10/10 |
| Zero Dívida Técnica | 10/10 |
| Arquitetura Correta | 10/10 |
| Escalabilidade | 10/10 |
| Segurança | 10/10 |
| **NOTA FINAL** | **10.0/10** |

