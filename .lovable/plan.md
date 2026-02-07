
# Step-Up MFA: Verificacao do Owner para Operacoes Criticas

## Contexto do Problema

### Estado Atual

O sistema de MFA hoje tem **apenas 2 funcoes**:
1. Proteger o LOGIN de admin/owner (exige TOTP para entrar)
2. Forcar o SETUP de MFA (bloqueia dashboard ate configurar)

### Brechas Identificadas

| Brecha | Gravidade | Cenario de Ataque |
|--------|-----------|-------------------|
| `manage-user-role` nao exige MFA | CRITICA | Admin com sessao roubada promove hacker a admin |
| Sessao nao marca se MFA foi verificado | ALTA | Nao da para distinguir sessao MFA-verified de nao-verified |
| Zero re-autenticacao em acoes criticas | CRITICA | Admin logado faz qualquer acao sem confirmar identidade |
| Nao existe conceito de "MFA do Owner" | CRITICA | Admin promove outro admin sem aprovacao do Owner |

---

## Analise de Solucoes

### Solucao A: Flag `mfa_verified` na sessao + check nas Edge Functions

Marcar na sessao se o usuario passou MFA e verificar nas edge functions criticas.

- Manutenibilidade: 6/10 (nao resolve o problema do Owner)
- Zero DT: 5/10 (precisa ser expandida depois para step-up do owner)
- Arquitetura: 6/10 (incompleta - falta re-autenticacao)
- Escalabilidade: 7/10
- Seguranca: 6/10 (protege contra sessao sem MFA, mas nao contra admin comprometido)
- **NOTA FINAL: 6.0/10**

### Solucao B: Step-Up MFA Completo com Verificacao do Owner

Arquitetura completa de 3 niveis:
1. `mfa_verified_at` na tabela `sessions` (marca quando MFA foi usado no login)
2. **Step-Up MFA Middleware** no backend que exige TOTP em tempo real para acoes criticas
3. **Owner-Only Step-Up** para acoes ultra-criticas: exige o TOTP do OWNER, nao do caller

- Manutenibilidade: 10/10 (middleware reutilizavel em qualquer edge function)
- Zero DT: 10/10 (cobre todos os cenarios de ataque)
- Arquitetura: 10/10 (3 niveis claros, SOLID, desacoplado)
- Escalabilidade: 10/10 (novas operacoes criticas sao protegidas adicionando 1 linha)
- Seguranca: 10/10 (ate admin comprometido nao escala privilegios sem TOTP do owner)
- **NOTA FINAL: 10.0/10**

### DECISAO: Solucao B (Nota 10.0)

A Solucao A protege contra sessoes nao-verificadas, mas NAO resolve o cenario principal: admin comprometido tentando escalar privilegios. A Solucao B cria uma camada de seguranca que NENHUM compromisso de admin pode ultrapassar.

---

## Arquitetura de 3 Niveis de MFA

```text
NIVEL 1: MFA de Login (ja existe)
  Quando: Login de admin/owner
  Quem verifica: O proprio usuario
  O que protege: Acesso ao dashboard
  Status: IMPLEMENTADO

NIVEL 2: Step-Up MFA (Self)
  Quando: Operacoes sensiveis (alterar email, desativar MFA, etc.)
  Quem verifica: O proprio usuario (seu proprio TOTP)
  O que protege: Acoes que afetam a propria conta
  Status: A IMPLEMENTAR

NIVEL 3: Step-Up MFA (Owner)
  Quando: Operacoes ultra-criticas (promover admin, alterar roles)
  Quem verifica: O OWNER (o TOTP do owner, nao do caller)
  O que protege: Escalacao de privilegios e acoes destrutivas
  Status: A IMPLEMENTAR
```

---

## Classificacao de Operacoes Criticas

```text
NIVEL 2 - Requer MFA do proprio usuario:
  - Alterar email da propria conta
  - Desativar MFA
  - Excluir propria conta
  - Alterar senha (alem de confirmar senha atual)

NIVEL 3 - Requer MFA do OWNER:
  - manage-user-role: Promover/rebaixar qualquer usuario
  - manage-user-status: Desativar/suspender contas
  - Alterar configuracoes criticas do sistema
  - Acessar dados financeiros sensiveis
  - Qualquer operacao futura de risco
```

---

## Plano de Execucao

### Fase 1: Infraestrutura de Step-Up MFA

#### 1.1 Migracao SQL: `mfa_verified_at` na tabela `sessions`

Adicionar coluna na tabela `sessions` para rastrear quando a sessao passou por MFA:

```text
ALTER TABLE sessions ADD COLUMN mfa_verified_at TIMESTAMPTZ DEFAULT NULL;
```

Quando o login passa por MFA (handler `mfa-verify.ts`), marcar o timestamp. Sessoes sem MFA (admin que ainda nao configurou) terao `NULL`.

#### 1.2 Shared Module: `step-up-mfa.ts`

Novo arquivo em `supabase/functions/_shared/step-up-mfa.ts` com:

**Funcao `requireSelfMfa(supabase, req, userId, totpCode)`**
- Verifica o TOTP do proprio usuario em tempo real
- Busca o `user_mfa` do `userId` que fez a requisicao
- Decodifica o secret e valida o codigo
- Retorna `{ verified: true }` ou `{ verified: false, error: "..." }`

**Funcao `requireOwnerMfa(supabase, req, ownerTotpCode)`**
- Encontra o usuario com role `owner` no sistema
- Busca o `user_mfa` do OWNER (nao do caller)
- Decodifica o secret do owner e valida o codigo informado
- Retorna `{ verified: true }` ou `{ verified: false, error: "..." }`
- Se o owner nao tem MFA configurado, retorna erro especifico

**Funcao auxiliar `getOwnerUserId(supabase)`**
- Query na tabela `user_roles` buscando `role = 'owner'`
- Cache em memoria para evitar query repetida dentro da mesma requisicao

#### 1.3 Shared Module: `critical-operation-guard.ts`

Middleware que classifica e protege operacoes:

```text
enum CriticalLevel {
  NONE = 0,      // Sem verificacao adicional
  SELF_MFA = 1,  // Requer TOTP do proprio usuario
  OWNER_MFA = 2, // Requer TOTP do owner
}
```

Funcao `guardCriticalOperation(supabase, req, level, totpCode)`:
- Nivel 0: Pass-through
- Nivel 1: Chama `requireSelfMfa`
- Nivel 2: Chama `requireOwnerMfa`
- Retorna Response de erro (403 + mensagem clara) ou null (passou)

### Fase 2: Integracao com Edge Functions Existentes

#### 2.1 `manage-user-role/index.ts`

Alterar para:
- Receber campo `ownerMfaCode` no body da requisicao
- Antes de executar a mudanca de role, chamar `guardCriticalOperation(supabase, req, OWNER_MFA, ownerMfaCode)`
- Se falhar: retornar 403 com mensagem "Codigo MFA do Owner necessario para esta operacao"
- Registrar no audit log se a verificacao MFA falhou

#### 2.2 `manage-user-status` (se existir)

Mesma logica: exigir TOTP do owner para desativar/suspender contas.

#### 2.3 `mfa-verify.ts` (handler de login)

Apos verificacao MFA bem-sucedida, atualizar a sessao criada com `mfa_verified_at = now()`.

### Fase 3: Frontend - Modal de Step-Up MFA

#### 3.1 Componente `OwnerMfaModal`

Modal reutilizavel que:
- Exibe mensagem explicando que a operacao requer o codigo do OWNER
- Input de 6 digitos para o TOTP
- Retorna o codigo para o caller via callback `onVerified(code: string)`
- Nao faz verificacao local - o backend valida

#### 3.2 Integracao na UI de Gerenciamento de Roles

Quando admin/owner clica para alterar um role:
1. Abre o `OwnerMfaModal`
2. Coleta o codigo TOTP
3. Envia para `manage-user-role` com o campo `ownerMfaCode`
4. Se backend retorna 403 (MFA invalido): exibe erro no modal
5. Se backend retorna 200: fecha modal, mostra sucesso

### Fase 4: Registro e Documentacao

#### 4.1 Atualizar `EDGE_FUNCTIONS_REGISTRY.md`

Documentar os novos modulos shared:
- `_shared/step-up-mfa.ts`
- `_shared/critical-operation-guard.ts`

#### 4.2 Audit Log

Todas as tentativas de step-up MFA (sucesso e falha) serao registradas via `log_security_event` com acoes:
- `STEP_UP_MFA_SUCCESS`
- `STEP_UP_MFA_FAILED`
- `OWNER_MFA_REQUIRED`

---

## Fluxo de Ataque Mitigado

```text
CENARIO: Hacker rouba cookies de sessao de um Admin

ANTES (vulneravel):
  Hacker → manage-user-role(promover hacker para admin) → SUCESSO
  Hacker agora e admin com acesso total

DEPOIS (com Step-Up MFA do Owner):
  Hacker → manage-user-role(promover hacker para admin)
  Backend → "Informe o codigo MFA do Owner"
  Hacker → NAO tem o celular do Owner
  Backend → 403 BLOQUEADO
  Audit Log → ALERTA de tentativa de escalacao

CENARIO: Admin comprometido (email+senha vazados, MFA do admin tambem)
  Hacker loga como admin (passa MFA do admin)
  Hacker → manage-user-role(promover complice)
  Backend → "Informe o codigo MFA do OWNER" (nao do admin!)
  Hacker → NAO tem acesso ao autenticador do Owner
  Backend → 403 BLOQUEADO
```

---

## Arvore de Arquivos

```text
Novos:
  supabase/functions/_shared/step-up-mfa.ts        (~80 linhas)
  supabase/functions/_shared/critical-operation-guard.ts (~60 linhas)
  src/components/auth/OwnerMfaModal.tsx             (~120 linhas)

Modificados:
  supabase/functions/unified-auth/handlers/mfa-verify.ts  (adicionar mfa_verified_at)
  supabase/functions/manage-user-role/index.ts             (integrar guardCriticalOperation)
  src/services/mfaService.ts                               (adicionar tipo para step-up)
  docs/EDGE_FUNCTIONS_REGISTRY.md                          (documentar novos modulos)

Migracao SQL:
  ALTER TABLE sessions ADD COLUMN mfa_verified_at TIMESTAMPTZ DEFAULT NULL;
```

---

## Checkpoint RISE V3

| Pergunta | Resposta |
|----------|----------|
| Esta e a MELHOR solucao possivel? | Sim, nota 10.0 - protecao em 3 niveis |
| Existe alguma solucao com nota maior? | Nao |
| Isso cria divida tecnica? | Zero - middleware reutilizavel para qualquer operacao futura |
| Precisaremos "melhorar depois"? | Nao - o sistema de niveis e extensivel por design |
| O codigo sobrevive 10 anos sem refatoracao? | Sim - padroes de step-up MFA sao standard da industria |
| Estou escolhendo isso por ser mais rapido? | Nao - e a unica que cobre admin comprometido |
