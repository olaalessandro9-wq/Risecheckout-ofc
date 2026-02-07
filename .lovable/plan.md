
# Plano de Correção: Diagnóstico e Fix do Login Silencioso

## Problema Identificado

A função `verifyPassword` em `supabase/functions/_shared/unified-auth-v2.ts` silencia exceções do bcrypt, retornando `false` (aparenta "senha errada") quando a causa real pode ser um crash na biblioteca bcrypt WASM do Deno.

O usuario tem sessoes anteriores validas (ultima em 07/02 02:43 UTC), confirmando que a senha JA FUNCIONOU no mesmo dia. A falha e intermitente.

## Analise de Solucoes

### Solucao A: Apenas Adicionar Logging

Adicionar `log.error` no catch block existente.

- Manutenibilidade: 7/10 - Nao resolve a causa raiz, apenas diagnostica
- Zero DT: 6/10 - Silenciamento parcial permanece
- Arquitetura: 6/10 - Catch generico continua existindo
- Escalabilidade: 7/10 - Funcional mas fraco
- Seguranca: 8/10 - Sem impacto
- **NOTA FINAL: 6.8/10**

### Solucao B: Logging + Propagacao Correta de Erro + Diagnostico no Login Handler

1. Remover o try-catch silencioso do `verifyPassword`
2. Adicionar logging diagnostico no login handler para distinguir entre "senha errada" e "bcrypt crash"
3. Se bcrypt crash, retornar 500 (erro interno) em vez de 401 (credenciais invalidas)
4. Adicionar log de nivel INFO no login handler para cada etapa do fluxo

- Manutenibilidade: 10/10 - Erros jamais silenciados
- Zero DT: 10/10 - Nenhuma falha oculta
- Arquitetura: 10/10 - Separacao clara entre "senha errada" e "erro interno"
- Escalabilidade: 10/10 - Diagnostico robusto para qualquer cenario futuro
- Seguranca: 10/10 - Nao expoe dados sensiveis nos logs
- **NOTA FINAL: 10.0/10**

### DECISAO: Solucao B (Nota 10.0)

A Solucao A apenas diagnostica sem corrigir a violacao do protocolo. A Solucao B resolve a causa raiz (erro silenciado) e adiciona distinção semantica entre tipos de falha.

---

## Arquivos a Modificar

### 1. `supabase/functions/_shared/unified-auth-v2.ts`

**Funcao `verifyPassword` (linhas ~378-384):**

Antes:
```typescript
export function verifyPassword(password: string, hash: string): boolean {
  try {
    return compareSync(password, hash);
  } catch {
    return false;
  }
}
```

Depois:
```typescript
export function verifyPassword(password: string, hash: string): { valid: boolean; error?: string } {
  try {
    const result = compareSync(password, hash);
    return { valid: result };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("bcrypt compareSync threw an exception (NOT a password mismatch):", msg);
    return { valid: false, error: msg };
  }
}
```

A mudanca de retorno de `boolean` para `{ valid: boolean; error?: string }` permite ao chamador distinguir entre "senha errada" e "bcrypt crash".

### 2. `supabase/functions/unified-auth/handlers/login.ts`

**Secao de verificacao de senha (linhas ~87-92):**

Antes:
```typescript
const validPassword = verifyPassword(password, user.password_hash);
if (!validPassword) {
  log.debug("Invalid password for:", normalizedEmail);
  return errorResponse("Credenciais invalidas", corsHeaders, 401);
}
```

Depois:
```typescript
const passwordResult = verifyPassword(password, user.password_hash);

if (passwordResult.error) {
  // bcrypt internal crash - NOT a password mismatch
  log.error("bcrypt crash during login", {
    email: normalizedEmail,
    error: passwordResult.error,
  });
  return errorResponse("Erro interno ao verificar credenciais", corsHeaders, 500);
}

if (!passwordResult.valid) {
  log.info("Invalid password attempt", { email: normalizedEmail });
  return errorResponse("Credenciais invalidas", corsHeaders, 401);
}
```

Isso garante:
- bcrypt crash -> HTTP 500 (erro interno) com log.error
- Senha errada -> HTTP 401 (credenciais invalidas) com log.info
- Nunca mais confundir os dois cenarios

### 3. `supabase/functions/_shared/password-utils.ts`

Atualizar a funcao `verifyPassword` duplicada neste arquivo para manter consistencia (mesma assinatura).

### 4. Verificar outros chamadores de `verifyPassword`

Buscar e atualizar todos os locais que chamam `verifyPassword` para usar a nova assinatura `{ valid, error }`.

### 5. Deploy

Redeployar `unified-auth` apos as correcoes.

---

## Fluxo de Diagnostico Pos-Deploy

```text
1. Usuario tenta login
2. Login handler encontra usuario no banco (OK)
3. Chama verifyPassword(password, hash)
4a. Se bcrypt crash:
    -> log.error com mensagem do erro
    -> Retorna HTTP 500 "Erro interno"
    -> Podemos ver nos logs qual foi o crash
4b. Se senha errada:
    -> log.info "Invalid password attempt"
    -> Retorna HTTP 401 "Credenciais invalidas"
4c. Se senha correta:
    -> Continua fluxo normal (MFA check, etc.)
```

---

## Acao Imediata Para o Usuario

Enquanto o fix nao e deployado, o usuario pode:
1. Usar o link "Redefina aqui" na pagina de login para redefinir a senha
2. Isso gera um novo hash bcrypt pela mesma funcao `hashPassword`, garantindo compatibilidade

---

## Resumo

| Aspecto | Antes | Depois |
|---------|-------|--------|
| bcrypt crash detectado | Nao (silenciado) | Sim (log.error) |
| Resposta ao usuario | 401 "Credenciais invalidas" | 500 "Erro interno" |
| Senha errada detectada | Sim mas sem log visivel | Sim com log.info |
| Violacao RISE V3 | Sim (catch generico) | Corrigida |
