
# Plano: Eliminação de Headers Legados na Infraestrutura de Testes

## Status Atual

**RISE V3 Score: 9.4/10** - Headers legados em testing utilities

A migração de cookies/auth está 100% completa no código de produção, mas a infraestrutura de testes ainda usa o padrão `x-producer-session-token` em vez do cookie correto `__Secure-rise_access`.

## Violações Encontradas

| Arquivo | Linha | Código Legado |
|---------|-------|---------------|
| `testing/test-factories.ts` | 498 | `authHeaders["x-producer-session-token"] = sessionToken` |
| `testing/mock-responses.ts` | 23 | `"x-producer-session-token"` em CORS |
| `testing/__tests__/test-factories.test.ts` | 231 | `assertEquals(req.headers.get("x-producer-session-token"), ...)` |

## Analise de Solucoes (RISE Protocol V3 Secao 4.4)

### Solucao A: Manter Estado Atual
- Manutenibilidade: 7/10 (confuso para novos devs)
- Zero DT: 7/10 (header legado e divida)
- Arquitetura: 7/10 (inconsistencia teste vs producao)
- Escalabilidade: 9/10 (nao bloqueia)
- Seguranca: 10/10 (sem impacto)
- **NOTA FINAL: 7.8/10**
- Tempo estimado: 0 minutos

### Solucao B: Corrigir Testing Utilities
- Manutenibilidade: 10/10 (consistencia total)
- Zero DT: 10/10 (zero headers legados)
- Arquitetura: 10/10 (teste = producao)
- Escalabilidade: 10/10 (padrao unico)
- Seguranca: 10/10 (sem impacto)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 15 minutos

### DECISAO: Solucao B (Nota 10.0)

Conforme Lei Suprema Secao 4.6: A melhor solucao VENCE. SEMPRE.

---

## Arquivos a Modificar (3 arquivos)

```text
supabase/functions/_shared/testing/
├── test-factories.ts                   # Usar cookie em vez de header
├── mock-responses.ts                   # Remover header do CORS
└── __tests__/test-factories.test.ts    # Corrigir teste
```

---

## Mudancas Detalhadas

### 1. test-factories.ts - Usar Cookie em vez de Header

**ANTES (linha 497-499):**
```typescript
if (sessionToken) {
  authHeaders["x-producer-session-token"] = sessionToken;
}
```

**DEPOIS:**
```typescript
if (sessionToken) {
  authHeaders["Cookie"] = `__Secure-rise_access=${sessionToken}`;
}
```

### 2. mock-responses.ts - Remover Header Legado do CORS

**ANTES (linha 23):**
```typescript
"Access-Control-Allow-Headers": "Content-Type, Authorization, x-producer-session-token, x-internal-secret",
```

**DEPOIS:**
```typescript
"Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie, x-internal-secret",
```

### 3. test-factories.test.ts - Corrigir Teste

**ANTES (linhas 225-232):**
```typescript
Deno.test("createAuthenticatedRequest: includes session token", () => {
  const req = createAuthenticatedRequest({
    sessionToken: "test-token-123",
    body: { action: "list" },
  });
  
  assertEquals(req.headers.get("x-producer-session-token"), "test-token-123");
});
```

**DEPOIS:**
```typescript
Deno.test("createAuthenticatedRequest: includes session token as cookie", () => {
  const req = createAuthenticatedRequest({
    sessionToken: "test-token-123",
    body: { action: "list" },
  });
  
  const cookie = req.headers.get("Cookie");
  assertEquals(cookie?.includes("__Secure-rise_access=test-token-123"), true);
});
```

---

## Secao Tecnica

### Impacto

| Aspecto | Impacto |
|---------|---------|
| Testes existentes | Podem precisar de ajuste se usam `createAuthenticatedRequest` |
| Novos testes | Usarao padrao correto automaticamente |
| CI/CD | Nenhum impacto |
| Documentacao | Auto-documentado pelo codigo |

### Verificacao de Impacto

Antes de implementar, preciso verificar quais testes usam `createAuthenticatedRequest`:

```bash
grep -rn "createAuthenticatedRequest" supabase/functions/
```

Se houver muitos usos, a mudanca pode quebrar testes. Nesse caso, posso:
1. Adicionar novo parametro `useCookie: true` (default) para backward compat temporario
2. OU corrigir todos os testes que usam essa funcao

### Validacao Pos-Implementacao

1. Executar testes de test-factories
2. Buscar por `x-producer-session-token` - deve retornar 0 resultados
3. Confirmar score RISE V3 = 10.0/10

### Resultado Final

**RISE V3 Score: 10.0/10** - Zero codigo morto, zero headers legados, zero divida tecnica
