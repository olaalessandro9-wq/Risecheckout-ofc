

# Plano: Eliminação Total de Código Legado de Cookies/Sessões

## Status Atual

**RISE V3 Score: 7.5/10** - Código de transição ainda presente

A migração do banco de dados foi bem-sucedida, mas o código mantém fallbacks desnecessários que constituem dívida técnica.

## Análise de Soluções (RISE Protocol V3 §4.4)

### Solução A: Manter Estado Atual
- Manutenibilidade: 6/10 (código confuso)
- Zero DT: 5/10 (fallback é dívida)
- Arquitetura: 7/10 (funciona mas está sujo)
- Escalabilidade: 8/10 (não bloqueia)
- Segurança: 9/10 (cookies funcionam)
- **NOTA FINAL: 6.7/10**
- Tempo estimado: 0 minutos

### Solução B: Remover Fallback, Manter Cleanup
- Manutenibilidade: 9/10 (código limpo)
- Zero DT: 9/10 (quase zero)
- Arquitetura: 9/10 (separação clara)
- Escalabilidade: 10/10 (sem overhead)
- Segurança: 10/10 (melhor)
- **NOTA FINAL: 9.3/10**
- Tempo estimado: 30 minutos

### Solução C: Eliminação Total (Purge Absoluto)
- Manutenibilidade: 10/10 (zero código morto)
- Zero DT: 10/10 (absolutamente zero)
- Arquitetura: 10/10 (Clean Architecture)
- Escalabilidade: 10/10 (sem overhead)
- Segurança: 10/10 (superfície reduzida)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 45 minutos

### DECISAO: Solucao C (Nota 10.0)

Conforme Lei Suprema §4.6: A melhor solucao VENCE. SEMPRE.

---

## Arquivos a Modificar

```text
supabase/functions/_shared/
├── cookie-helper.ts                    # Remover LEGACY_COOKIE_NAMES, fallback
├── session-reader.ts                   # Remover hasLegacyCookies()
├── unified-auth-v2.ts                  # Remover referencias V3
└── __tests__/
    └── unified-auth-v2.test.ts         # Remover testes V3

supabase/functions/
├── affiliate-pixel-management/tests/
│   ├── _shared.ts                      # Cookie: __Secure-rise_access
│   └── error-handling.test.ts          # Cookie: __Secure-rise_access
├── pixel-management/tests/
│   ├── _shared.ts                      # Cookie: __Secure-rise_access
│   └── authentication.test.ts          # Cookie: __Secure-rise_access
├── webhook-crud/tests/_shared.ts       # Cookie: __Secure-rise_access
├── send-webhook-test/tests/_shared.ts  # Cookie: __Secure-rise_access
└── pushinpay-stats/tests/_shared.ts    # Cookie: __Secure-rise_access
```

---

## Mudancas Detalhadas

### 1. cookie-helper.ts - Remover Fallback e Constantes Legadas

**ANTES (linhas 38-58):**
```typescript
export const LEGACY_COOKIE_NAMES = {
  v3: {
    access: "__Host-rise_access",
    refresh: "__Host-rise_refresh",
  },
  producer: { ... },
  buyer: { ... },
};
```

**DEPOIS:**
```typescript
// RISE V3: LEGACY_COOKIE_NAMES REMOVIDO
// Migração 100% completa - zero fallback necessário
```

**ANTES (linhas 108-119):**
```typescript
export function getAccessToken(req: Request): string | null {
  const cookieHeader = req.headers.get("Cookie");
  if (!cookieHeader) return null;
  
  const newToken = getCookie(cookieHeader, COOKIE_NAMES.access);
  if (newToken) return newToken;
  
  // Fallback to V3 format during migration period
  return getCookie(cookieHeader, LEGACY_COOKIE_NAMES.v3.access);
}
```

**DEPOIS:**
```typescript
export function getAccessToken(req: Request): string | null {
  const cookieHeader = req.headers.get("Cookie");
  if (!cookieHeader) return null;
  
  return getCookie(cookieHeader, COOKIE_NAMES.access);
}
```

### 2. session-reader.ts - Remover hasLegacyCookies()

Remover funcao `hasLegacyCookies()` (linhas 50-67) e import de `LEGACY_COOKIE_NAMES`.

### 3. unified-auth-v2.ts - Remover Limpeza de Cookies V3

Simplificar `createUnifiedLogoutCookies()` para limpar apenas cookies atuais.

### 4. Testes - Atualizar para Cookie Correto

Todos os 7 arquivos de teste terao:
```typescript
"Cookie": "producer_session=valid-token"
```
Substituido por:
```typescript
"Cookie": "__Secure-rise_access=valid-token"
```

### 5. unified-auth-v2.test.ts - Remover Testes de Fallback

Remover testes:
- `"getUnifiedAccessToken: should fallback to V3 cookie"`
- `"getUnifiedRefreshToken: should fallback to V3 cookie"`
- `"createUnifiedLogoutCookies: should clear V3 format cookies"`

---

## Secao Tecnica

### Impacto

| Aspecto | Impacto |
|---------|---------|
| Sessoes ativas | Zero impacto - todas usam V4 |
| Usuarios logados | Mantem sessao (cookie novo) |
| Logout | Simplificado (menos cookies) |
| Performance | Melhora (menos parsing) |

### Validacao Pos-Implementacao

1. Deploy Edge Functions afetadas
2. Executar testes de autenticacao
3. Verificar login/logout funciona
4. Confirmar zero referencias legadas

### Resultado Final

**RISE V3 Score: 10.0/10** - Zero codigo morto, zero fallbacks, zero divida tecnica

