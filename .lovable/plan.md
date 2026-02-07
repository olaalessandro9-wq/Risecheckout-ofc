
# Auditoria e Correcao de Divida Tecnica MFA

## Descobertas da Auditoria

A investigacao profunda do codigo MFA revelou **6 problemas**, sendo 2 de severidade CRITICA sob o Protocolo RISE V3 e 4 de severidade ALTA.

| # | Problema | Severidade | Arquivo |
|---|----------|-----------|---------|
| 1 | Race condition no `incrementMfaAttempts` (SELECT+UPDATE) | CRITICA | `_shared/mfa-session.ts` |
| 2 | `mfa_setup_required` nao tratado no frontend | CRITICA | `Auth.tsx` / `useUnifiedAuth.ts` |
| 3 | `.single()` ao inves de `.maybeSingle()` em queries MFA | ALTA | `mfa-setup.ts`, `mfa-status.ts` |
| 4 | `LoginResponse` sem tipagem MFA (casting inseguro) | ALTA | `useUnifiedAuth.ts`, `Auth.tsx` |
| 5 | Sessoes MFA expiradas acumulam no banco sem limpeza | ALTA | `mfa-session.ts` |
| 6 | Comentario contraditorio ("10.0/10" com race condition documentada) | ALTA | `mfa-session.ts` |

---

## Analise de Solucoes (Secao 4 RISE V3)

### Problema 1: Race Condition `incrementMfaAttempts`

#### Solucao A: Manter padrao atual (SELECT+UPDATE com comentario)
- Manutenibilidade: 7/10 (comentario nao elimina o problema)
- Zero DT: 5/10 (race condition documentada = divida tecnica aceita)
- Arquitetura: 6/10 (viola atomicidade)
- Escalabilidade: 8/10 (funcional no contexto single-user)
- Seguranca: 7/10 (rate limiting pode ser burlado)
- **NOTA FINAL: 6.5/10**

#### Solucao B: RPC function atomica no Postgres
- Manutenibilidade: 10/10 (operacao atomica, auto-explicativa)
- Zero DT: 10/10 (zero race conditions possiveis)
- Arquitetura: 10/10 (banco garante atomicidade - responsabilidade correta)
- Escalabilidade: 10/10 (funciona sob qualquer concorrencia)
- Seguranca: 10/10 (rate limiting garantido por construcao)
- **NOTA FINAL: 10.0/10**

**DECISAO: Solucao B (Nota 10.0)**  
Criar uma funcao PostgreSQL `increment_mfa_attempts(p_token TEXT)` que executa `UPDATE mfa_sessions SET attempts = attempts + 1 WHERE token = p_token` atomicamente. O comentario que justifica a Solucao A viola diretamente a Secao 4.1 do protocolo ("Se nota 10 demora mais, escolhemos nota 10").

---

## Plano de Correcao

### Correcao 1: RPC atomica para incremento de tentativas

**Migracao SQL:**
```sql
CREATE OR REPLACE FUNCTION public.increment_mfa_attempts(p_token TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE mfa_sessions
  SET attempts = attempts + 1
  WHERE token = p_token;
END;
$$;
```

**Arquivo:** `supabase/functions/_shared/mfa-session.ts`

Reescrever `incrementMfaAttempts`:
```typescript
export async function incrementMfaAttempts(
  supabase: SupabaseClient,
  token: string
): Promise<void> {
  const { error } = await supabase.rpc("increment_mfa_attempts", {
    p_token: token,
  });

  if (error) {
    log.error("Failed to increment MFA attempts:", error.message);
  }
}
```

Remover comentario longo sobre race condition e substituir por documentacao limpa.

### Correcao 2: Tratar `mfa_setup_required` no frontend

**Arquivo:** `src/hooks/useUnifiedAuth.ts`

Adicionar campos MFA ao `LoginResponse`:
```typescript
interface LoginResponse {
  success: boolean;
  mfa_required?: boolean;
  mfa_session_token?: string;
  mfa_setup_required?: boolean;
  user?: UnifiedUser;
  roles?: AppRole[];
  activeRole?: AppRole;
  expiresIn?: number;
  error?: string;
}
```

**Arquivo:** `src/pages/Auth.tsx`

Tratar `mfa_setup_required` apos login bem-sucedido:
- Exibir toast informativo: "Recomendamos ativar a autenticacao de dois fatores em seu perfil"
- Nao bloquear o login (a sessao ja foi criada pelo backend)
- Eliminar casting inseguro `Record<string, unknown>`

### Correcao 3: `.single()` para `.maybeSingle()`

**Arquivos afetados:**
- `mfa-setup.ts` linha 57: `.single()` -> `.maybeSingle()`
- `mfa-status.ts` linha 30: `.single()` -> `.maybeSingle()`

Estas queries buscam registros em `user_mfa` que podem nao existir (primeiro acesso). `.single()` lanca erro PostgREST quando nenhum registro e encontrado, enquanto `.maybeSingle()` retorna `null` graciosamente.

### Correcao 4: Tipagem segura no fluxo MFA do login

**Arquivo:** `src/pages/Auth.tsx`

Eliminar casting inseguro:
```typescript
// ANTES (inseguro):
if (result && 'mfa_required' in result && (result as Record<string, unknown>).mfa_required) {
  const mfaResult = result as Record<string, unknown>;
  setMfaSessionToken(mfaResult.mfa_session_token as string);

// DEPOIS (tipado):
if (result.mfa_required) {
  setMfaSessionToken(result.mfa_session_token ?? "");
```

### Correcao 5: Limpeza de sessoes MFA expiradas

Adicionar limpeza automatica em `createMfaSession`:
```typescript
// Before creating a new session, purge expired ones for this user
await supabase
  .from("mfa_sessions")
  .delete()
  .eq("user_id", userId)
  .or("is_used.eq.true,expires_at.lt." + new Date().toISOString());
```

Isso garante que cada novo login limpa sessoes antigas do mesmo usuario, sem necessidade de cron job separado.

### Correcao 6: Atualizar documentacao e comentarios

**Arquivo:** `supabase/functions/_shared/mfa-session.ts`

Remover o bloco de comentario nas linhas 110-124 que documenta a race condition aceita e substituir por documentacao correta referenciando a RPC atomica.

Atualizar o header do modulo para refletir o uso da RPC.

---

## Arvore de Arquivos Modificados

```text
Migracao SQL (nova):
  - increment_mfa_attempts RPC function

Modificados:
  - supabase/functions/_shared/mfa-session.ts       (RPC atomica + limpeza)
  - supabase/functions/unified-auth/handlers/mfa-setup.ts   (.maybeSingle)
  - supabase/functions/unified-auth/handlers/mfa-status.ts  (.maybeSingle)
  - src/hooks/useUnifiedAuth.ts                     (LoginResponse tipagem)
  - src/pages/Auth.tsx                              (MFA tipagem + setup notification)
```

## Checkpoint RISE V3

| Pergunta | Resposta |
|----------|----------|
| Esta e a MELHOR solucao possivel? | Sim, nota 10.0 |
| Existe alguma solucao com nota maior? | Nao |
| Isso cria divida tecnica? | Zero |
| Precisaremos "melhorar depois"? | Nao |
| O codigo sobrevive 10 anos sem refatoracao? | Sim |
| Estou escolhendo isso por ser mais rapido? | Nao |
