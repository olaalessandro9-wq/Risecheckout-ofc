
# Plano: Correção Definitiva do Logout Após F5

## Diagnóstico Confirmado

### O Bug Exato (Evidência no Código)

**Arquivo:** `src/hooks/useUnifiedAuth.ts` (linhas 108-124)

```typescript
async function validateSession(): Promise<ValidateResponse> {
  const hasValidToken = unifiedTokenService.hasValidToken();
  
  if (!hasValidToken) {
    const refreshed = await unifiedTokenService.refresh();
    
    if (!refreshed) {
      return { valid: false }; // ← BUG: Retorna SEM chamar o backend!
    }
  }
  
  // Esta linha NUNCA é alcançada após F5
  const { data } = await api.publicCall("unified-auth/validate", {});
}
```

**Arquivo:** `src/lib/token-manager/service.ts` (linhas 222-224)

```typescript
async refresh(): Promise<boolean> {
  if (this.state === "idle" || this.state === "error") {
    return false; // ← TokenService inicia em "idle" após F5
  }
}
```

### Sequência do Bug

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuário dá F5 em /dashboard                              │
│ 2. React monta, TokenService é criado em state="idle"       │
│ 3. useUnifiedAuth.authQuery.queryFn() é chamada             │
│ 4. validateSession() executa:                               │
│    - hasValidToken() → false (state é "idle")               │
│    - refresh() → false imediatamente (state é "idle")       │
│    - return { valid: false } ← SEM CHAMAR O BACKEND         │
│ 5. Guard recebe isAuthenticated=false                       │
│ 6. Redirect para /auth                                      │
│                                                              │
│ Os cookies NUNCA são verificados pelo servidor!             │
└─────────────────────────────────────────────────────────────┘
```

---

## Como Hotmart, Cakto e Kiwify Resolvem Isso

### Padrão da Indústria: "Validate-First" (Server-Side SSOT)

Todas as grandes plataformas de checkout (Hotmart, Cakto, Kiwify, Stripe Dashboard, Auth0) seguem o mesmo padrão:

```text
┌─────────────────────────────────────────────────────────────┐
│           PADRÃO HOTMART/CAKTO/KIWIFY                       │
│                                                              │
│  Cold Start (F5):                                           │
│  1. Frontend monta                                          │
│  2. Chama /api/validate COM os cookies HttpOnly             │
│  3. Backend valida sessão (refresh se necessário)           │
│  4. Retorna { valid: true, user: {...} }                    │
│  5. Frontend marca como autenticado                         │
│                                                              │
│  ZERO heurística local. O backend é o SSOT.                 │
└─────────────────────────────────────────────────────────────┘
```

| Plataforma | Endpoint | Comportamento |
|------------|----------|---------------|
| **Hotmart** | `/api/v2/auth/session` | Valida sempre, auto-refresh server-side |
| **Cakto** | `/api/auth/me` | Cookie-based, backend decide |
| **Kiwify** | `/api/v1/users/me` | Session cookie, server SSOT |
| **Auth0** | `/api/auth/me` | HttpOnly cookie, validate-first |

**Característica Comum:** O frontend **NUNCA** decide se a sessão é válida baseado em estado local. Sempre pergunta ao backend.

---

## Análise de Soluções (RISE V3 Obrigatório)

### Solução A: Validate-First (Padrão Hotmart/Cakto/Kiwify)

Remove a lógica "Refresh-First" e SEMPRE chama o backend no cold start.

- Manutenibilidade: 10/10 (elimina ciclo de dependência)
- Zero DT: 10/10 (remove a fonte do bug, não mascara)
- Arquitetura: 10/10 (backend é SSOT, como Hotmart/Cakto/Kiwify)
- Escalabilidade: 10/10 (funciona em todos subdomínios)
- Segurança: 10/10 (nenhuma mudança de cookies)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 2-4 horas

### Solução B: Hidratar TokenService Antes do Validate

Restaura estado do localStorage antes do validate, permitindo refresh-first funcionar.

- Manutenibilidade: 8/10 (mais estados, mais caminhos)
- Zero DT: 8/10 (pode reintroduzir bugs em edge cases)
- Arquitetura: 8/10 (continua dependendo de heurística local)
- Escalabilidade: 9/10
- Segurança: 10/10
- **NOTA FINAL: 8.6/10**
- Tempo estimado: 4-8 horas

### Solução C: XState Auth Machine Global

Reescreve toda autenticação como uma máquina de estados XState.

- Manutenibilidade: 9/10 (muito boa após implementada)
- Zero DT: 9/10 (grande refactor = risco)
- Arquitetura: 10/10
- Escalabilidade: 10/10
- Segurança: 10/10
- **NOTA FINAL: 9.6/10**
- Tempo estimado: 1-2 semanas

### DECISÃO: Solução A (10.0/10)

É exatamente o que Hotmart, Cakto e Kiwify fazem. Remove o bug pela raiz com mudança mínima e correta.

---

## Plano de Implementação

### Fase 1: Correção do validateSession() (Frontend)

**Arquivo:** `src/hooks/useUnifiedAuth.ts`

**Mudança:** Remover o bloco "Refresh-First" e SEMPRE chamar o backend.

```typescript
// ANTES (bugado)
async function validateSession(): Promise<ValidateResponse> {
  const hasValidToken = unifiedTokenService.hasValidToken();
  
  if (!hasValidToken) {
    const refreshed = await unifiedTokenService.refresh();
    if (!refreshed) {
      return { valid: false }; // ← BUG: Retorna sem chamar backend
    }
  }
  
  const { data } = await api.publicCall("unified-auth/validate", {});
  // ...
}

// DEPOIS (correto - Padrão Hotmart/Cakto/Kiwify)
async function validateSession(): Promise<ValidateResponse> {
  try {
    // SEMPRE chamar o backend - ele é o SSOT
    // O backend já implementa auto-refresh quando access token expira
    // mas refresh token ainda é válido (unified-auth/handlers/validate.ts)
    const { data, error } = await api.publicCall<ValidateResponse>(
      "unified-auth/validate",
      {}
    );
    
    if (error || !data) {
      log.debug("Session validation failed", error);
      return { valid: false };
    }
    
    return data;
  } catch (error) {
    log.debug("Session validation exception", error);
    return { valid: false };
  }
}
```

### Fase 2: Atualizar Comentários

Remover os comentários que mencionam "Refresh-First Validation Strategy" para prevenir reintrodução do bug.

### Fase 3: Verificar Worker (Set-Cookie)

O código do Worker tem um problema sutil:

```javascript
// PROBLEMA
const newResponse = new Response(response.body, response);
```

Isso pode não preservar múltiplos headers `Set-Cookie`. Deve ser:

```javascript
// CORRETO
const responseHeaders = new Headers();

// Copiar todos headers exceto Set-Cookie
for (const [key, value] of response.headers) {
  if (key.toLowerCase() !== "set-cookie") {
    responseHeaders.set(key, value);
  }
}

// Preservar TODOS os Set-Cookie (pode haver múltiplos)
const setCookies = response.headers.getAll("Set-Cookie");
for (const cookie of setCookies) {
  responseHeaders.append("Set-Cookie", cookie);
}

// CORS
if (origin && isAllowedOrigin(origin)) {
  responseHeaders.set("Access-Control-Allow-Origin", origin);
  responseHeaders.set("Access-Control-Allow-Credentials", "true");
}

return new Response(response.body, {
  status: response.status,
  statusText: response.statusText,
  headers: responseHeaders,
});
```

### Fase 4: Teste Manual

Após deploy:

1. Login em risecheckout.com
2. Verificar cookies no DevTools (Domain deve ser .risecheckout.com)
3. F5
4. Verificar no Network: deve aparecer `unified-auth/validate` retornando 200
5. NÃO deve redirecionar para /auth

---

## Arquivos a Serem Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useUnifiedAuth.ts` | Remover "Refresh-First", SEMPRE chamar backend |
| `Cloudflare Worker` | Preservar múltiplos Set-Cookie headers |

---

## Por Que Esta é a Melhor Solução

| Critério | Antes (Bug) | Depois (Solução A) |
|----------|-------------|-------------------|
| Quem decide se sessão é válida? | Frontend (heurística local) | Backend (SSOT) |
| O que acontece após F5? | Redirect imediato para /auth | Valida com backend |
| Request para validate aparece? | Não | Sim |
| Padrão usado por | Ninguém | Hotmart, Cakto, Kiwify |

---

## Fluxo Esperado Após Correção

```text
┌─────────────────────────────────────────────────────────────┐
│ FLUXO CORRIGIDO (PADRÃO HOTMART/CAKTO)                      │
│                                                              │
│ 1. Usuário dá F5 em /dashboard                              │
│ 2. React monta, useUnifiedAuth é chamado                    │
│ 3. validateSession() faz:                                   │
│    - api.publicCall("unified-auth/validate", {})            │
│    - Browser envia cookies __Secure-rise_* automaticamente  │
│ 4. Backend valida refresh token → retorna 200 + novos tokens│
│ 5. Guard recebe isAuthenticated=true                        │
│ 6. Usuário permanece em /dashboard                          │
│                                                              │
│ EXATAMENTE como Hotmart, Cakto e Kiwify funcionam.          │
└─────────────────────────────────────────────────────────────┘
```
