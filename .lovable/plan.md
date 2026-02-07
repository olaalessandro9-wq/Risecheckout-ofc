
# Auditoria Completa: Step-Up MFA Implementation

## Resultado Geral

A implementacao do Step-Up MFA esta **estruturalmente correta** - a arquitetura de 3 niveis funciona, o fluxo end-to-end esta conectado corretamente do frontend ao backend, e a seguranca critica (Owner MFA para operacoes de role/status) esta em vigor.

Porem, a auditoria encontrou **6 problemas** que violam o Protocolo RISE V3. Nenhum compromete a seguranca diretamente, mas todos representam divida tecnica ou inconsistencia que devem ser eliminadas.

---

## Problemas Encontrados

### PROBLEMA 1 - BUG CRITICO: `isChangingRole` e estado morto (isPending sempre false)

| Severidade | Tipo | Arquivo(s) |
|------------|------|------------|
| CRITICA | Bug funcional | `adminMachine.types.ts`, `adminMachine.ts`, `AdminUsersTab.tsx` |

**Diagnostico:**
- O campo `isChangingRole` existe em `UsersRegionContext` (tipo na linha 45 + valor inicial na linha 203)
- NENHUMA transicao da state machine (`adminMachine.ts`) JAMAIS altera esse campo para `true`
- `CONFIRM_ROLE_CHANGE` (linha 57) faz `usersLoading: true` (campo TOP-LEVEL), NAO `users.isChangingRole`
- `AdminUsersTab.tsx` (linha 239) passa `isPending={usersContext.isChangingRole || false}` que e SEMPRE `false`

**Impacto:**
- O botao "Confirmar com MFA" do `RoleChangeDialog` NUNCA fica desabilitado durante a chamada API
- O texto "Verificando..." NUNCA aparece
- O usuario pode clicar multiplas vezes enviando requisicoes duplicadas

**Correcao:**
Usar `isUsersLoading` (que ja e exposto pelo `AdminContext` na linha 185) no `AdminUsersTab.tsx` ao inves de `usersContext.isChangingRole`. E remover o campo morto `isChangingRole` do tipo e do contexto inicial.

---

### PROBLEMA 2 - CODIGO MORTO: `ROLE_HIERARCHY` em manage-user-role

| Severidade | Tipo | Arquivo(s) |
|------------|------|------------|
| ALTA | Codigo morto | `manage-user-role/index.ts` (linhas 32-37) |

**Diagnostico:**
A constante `ROLE_HIERARCHY` e declarada mas NUNCA referenciada em nenhum lugar do arquivo. Zero ocorrencias de uso.

**Correcao:**
Deletar as linhas 32-37.

---

### PROBLEMA 3 - DOCUMENTACAO INCONSISTENTE: Numeracao de niveis MFA

| Severidade | Tipo | Arquivo(s) |
|------------|------|------------|
| ALTA | Documentacao | `step-up-mfa.ts`, `critical-operation-guard.ts`, `EDGE_FUNCTIONS_REGISTRY.md` |

**Diagnostico:**
Tres sistemas de numeracao diferentes para os mesmos conceitos:

| Local | Self MFA | Owner MFA |
|-------|----------|-----------|
| `step-up-mfa.ts` header (linhas 7-8) | "Level 2 (Self)" | "Level 3 (Owner)" |
| `CriticalLevel` enum (linhas 41-45) | `SELF_MFA = 1` | `OWNER_MFA = 2` |
| `EDGE_FUNCTIONS_REGISTRY.md` (linhas 243-244) | "Level 1 (SELF_MFA)" | "Level 2 (OWNER_MFA)" |

**Correcao:**
Unificar para a numeracao do `CriticalLevel` enum (que e o codigo executavel e portanto a SSOT):
- Level 0 = NONE
- Level 1 = SELF_MFA
- Level 2 = OWNER_MFA

Atualizar header do `step-up-mfa.ts` de "Level 2/3" para "Level 1/2".

---

### PROBLEMA 4 - DOCUMENTACAO DESATUALIZADA: manage-user-status version

| Severidade | Tipo | Arquivo(s) |
|------------|------|------------|
| MEDIA | Documentacao | `manage-user-status/index.ts` (linha 14) |

**Diagnostico:**
O docstring diz `@version 2.0.0 - Migrated from profiles to users (SSOT)`. Nao menciona a integracao com Step-Up MFA que acabou de ser implementada.

**Correcao:**
Atualizar para `@version 3.0.0 - Step-Up MFA Owner integration` e adicionar descricao do MFA nas regras de seguranca do header.

---

### PROBLEMA 5 - UX: mfaCode nao limpo apos erro de MFA

| Severidade | Tipo | Arquivo(s) |
|------------|------|------------|
| MEDIA | UX | `RoleChangeDialog.tsx`, `UserActionDialog.tsx` |

**Diagnostico:**
Quando o backend retorna `STEP_UP_MFA_FAILED` (codigo invalido), o modal permanece aberto com a mensagem de erro corretamente, porem o input OTP mantem o codigo antigo. Codigos TOTP rotacionam a cada 30 segundos, entao o codigo antigo e inutil.

**Correcao:**
Limpar `mfaCode` via `setMfaCode("")` quando `error` prop muda para um valor non-null. Usar `useEffect` observando `error`.

---

### PROBLEMA 6 - INCONSISTENCIA: manage-user-role sem Sentry wrapper

| Severidade | Tipo | Arquivo(s) |
|------------|------|------------|
| MEDIA | Consistencia | `manage-user-role/index.ts` (linha 45) |

**Diagnostico:**
Usa `Deno.serve(async (req) => {...})` diretamente, enquanto outras edge functions (coupon-management, webhook-crud, etc.) usam `serve(withSentry("...", async (req) => {...}))`.

Isso significa que erros nao capturados nesta funcao NAO sao reportados ao Sentry.

**Correcao:**
Migrar para `serve(withSentry("manage-user-role", async (req) => {...}))` seguindo o padrao das outras funcoes.

---

## Resumo de Impacto

| # | Problema | Violacao RISE V3 |
|---|----------|-----------------|
| 1 | `isChangingRole` morto / `isPending` sempre false | Secao 6.4 (Higiene de Codigo) + Bug funcional |
| 2 | `ROLE_HIERARCHY` nunca usado | Secao 5.4 (Divida Tecnica Zero) |
| 3 | Numeracao de niveis inconsistente em 3 arquivos | Secao 6.4 (Nomenclatura clara) |
| 4 | Version/docstring desatualizado | Secao 8 (Registry como fonte de verdade) |
| 5 | mfaCode nao limpo apos erro | Secao 5.5 (Feature deve funcionar corretamente) |
| 6 | Missing Sentry wrapper | Secao 6.3 (Desacoplamento Radical - observabilidade consistente) |

---

## Plano de Correcao

### Arquivo 1: `src/modules/admin/machines/adminMachine.types.ts`
- Remover campo `isChangingRole` de `UsersRegionContext` (linha 45)
- Remover `isChangingRole: false` de `initialUsersContext` (linha 203)

### Arquivo 2: `src/modules/admin/machines/adminMachine.ts`
- `CONFIRM_ROLE_CHANGE`: Adicionar `users: ({ context }) => ({ ...context.users, mfaError: null, isChangingRole: true })` 

Na verdade a melhor correcao e: REMOVER `isChangingRole` completamente (codigo morto) e usar `usersLoading` que ja funciona corretamente. A transicao `CONFIRM_ROLE_CHANGE` ja faz `usersLoading: true`. Entao:

### Arquivo 3: `src/components/admin/AdminUsersTab.tsx`
- Linha 239: Trocar `isPending={usersContext.isChangingRole || false}` para `isPending={isUsersLoading}`
- Usar `isUsersLoading` que ja e exposto pelo AdminContext

### Arquivo 4: `supabase/functions/manage-user-role/index.ts`
- Remover `ROLE_HIERARCHY` (linhas 32-37)
- Migrar `Deno.serve` para `serve(withSentry("manage-user-role", ...))` com imports necessarios

### Arquivo 5: `supabase/functions/_shared/step-up-mfa.ts`
- Corrigir header: "Level 2 (Self)" para "Level 1 (Self)" e "Level 3 (Owner)" para "Level 2 (Owner)"

### Arquivo 6: `supabase/functions/manage-user-status/index.ts`
- Atualizar `@version` para `3.0.0 - Step-Up MFA Owner integration`
- Adicionar "Step-Up MFA (Owner)" nas regras de seguranca do header

### Arquivo 7: `src/modules/admin/components/users/RoleChangeDialog.tsx`
- Adicionar `useEffect` para limpar `mfaCode` quando `error` muda para valor non-null

### Arquivo 8: `src/modules/admin/components/sheets/UserActionDialog.tsx`
- Adicionar `useEffect` para limpar `mfaCode` quando `mfaError` muda para valor non-null

### Deploy
- Redeployar `manage-user-role` e `manage-user-status` apos correcoes

---

## Checkpoint RISE V3

| Pergunta | Resposta |
|----------|----------|
| Todos os problemas sao REAIS? | Sim - 6 problemas verificados via leitura direta do codigo |
| Alguma suposicao sem ler codigo? | Nenhuma - cada achado tem arquivo/linha especifica |
| As correcoes criam divida tecnica? | Zero - removem divida existente |
| O resultado final sobrevive 10 anos? | Sim - elimina inconsistencias e dead code |
