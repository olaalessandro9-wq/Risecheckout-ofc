

# Auditoria Completa: Email Verification + Terms Acceptance

## Resultado da Auditoria

### Banco de Dados - OK
- Coluna `email_verification_token` (text, nullable) -- presente
- Coluna `email_verification_token_expires_at` (timestamptz, nullable) -- presente
- Coluna `terms_accepted_at` (timestamptz, nullable) -- presente
- Coluna `email_verified` (boolean, default false) -- presente
- Enum `account_status_enum` inclui `pending_email_verification` -- presente

### Frontend - OK
- `VerificarEmail.tsx` -- funcional, mascara email, resend com cooldown
- `ConfirmarEmail.tsx` -- funcional, estados loading/success/error/expired
- `ProducerRegistrationForm.tsx` -- checkbox obrigatorio, redirect correto
- Rotas `/verificar-email` e `/confirmar-email` registradas em `publicRoutes.tsx`

### Edge Functions Registry (`EDGE_FUNCTIONS_REGISTRY.md`) - OK
- Linha 99: `unified-auth` documenta `Verify-Email/Resend-Verification`
- Endpoints listados corretamente

### Email Template (`email-templates-verification.ts`) - OK
- Self-contained, sem wrappers deprecados
- Gmail-compatible com `<style>` block
- Re-exportado em `email-templates.ts` (agregador)

---

## PROBLEMAS ENCONTRADOS (3 violacoes RISE V3)

### Problema 1: String literals em vez do enum AccountStatus

**Gravidade: ALTA** -- Viola Single Source of Truth (SOLID)

Tres handlers usam strings literais `"pending_email_verification"` e `"active"` em vez do enum `AccountStatus`:

| Arquivo | Linha | String Literal | Deveria Usar |
|---------|-------|----------------|--------------|
| `register.ts` | 126 | `"pending_email_verification"` | `AccountStatus.PENDING_EMAIL_VERIFICATION` |
| `resend-verification.ts` | 60 | `"pending_email_verification"` | `AccountStatus.PENDING_EMAIL_VERIFICATION` |
| `verify-email.ts` | 48 | `"active"` | `AccountStatus.ACTIVE` |
| `verify-email.ts` | 67 | `"active"` | `AccountStatus.ACTIVE` |

Se o valor do enum mudar no futuro, esses arquivos quebram silenciosamente (sem erro de compilacao).

**Correcao**: Importar `AccountStatus` de `auth-constants.ts` e substituir todas as string literals.

### Problema 2: Docblock de `unified-auth/index.ts` desatualizado

**Gravidade: MEDIA** -- Documentacao incompleta

O docblock (linhas 9-19) lista apenas 9 endpoints, mas a funcao roteia 16 endpoints. Os 7 endpoints ausentes:

| Endpoint ausente | Handler |
|------------------|---------|
| `request-refresh` | `handleRequestRefresh` |
| `check-producer-buyer` | `handleCheckProducerBuyer` |
| `ensure-producer-access` | `handleEnsureProducerAccess` |
| `producer-login` | `handleProducerLogin` |
| `check-email` | `handleCheckEmail` |
| `verify-email` | `handleVerifyEmail` |
| `resend-verification` | `handleResendVerification` |

**Correcao**: Atualizar o docblock para listar todos os 16 endpoints.

### Problema 3: `verify-email.ts` sem import do AccountStatus

**Gravidade: ALTA** -- Mesmo problema do item 1, mas tambem falta o import

O arquivo nao importa `AccountStatus` de `auth-constants.ts`. Precisa adicionar o import E substituir as strings.

---

## Nenhum Codigo Morto Encontrado

- Zero referencias a tabelas legadas (`buyer_sessions`, `producer_sessions`)
- Zero headers legados (`x-buyer-token`, `x-producer-session-token`)
- Zero imports nao utilizados
- Todos os handlers importados em `index.ts` sao utilizados no switch
- Template de email re-exportado corretamente no agregador

---

## Plano de Correcao

### Arquivo 1: `supabase/functions/unified-auth/handlers/register.ts`
- Adicionar import: `import { AccountStatus } from "../../_shared/auth-constants.ts";`
- Linha 126: trocar `"pending_email_verification"` por `AccountStatus.PENDING_EMAIL_VERIFICATION`

### Arquivo 2: `supabase/functions/unified-auth/handlers/verify-email.ts`
- Adicionar import: `import { AccountStatus } from "../../_shared/auth-constants.ts";`
- Linha 48: trocar `"active"` por `AccountStatus.ACTIVE`
- Linha 67: trocar `"active"` por `AccountStatus.ACTIVE`

### Arquivo 3: `supabase/functions/unified-auth/handlers/resend-verification.ts`
- Adicionar import: `import { AccountStatus } from "../../_shared/auth-constants.ts";`
- Linha 60: trocar `"pending_email_verification"` por `AccountStatus.PENDING_EMAIL_VERIFICATION`

### Arquivo 4: `supabase/functions/unified-auth/index.ts`
- Atualizar docblock (linhas 9-19) para listar todos os 16 endpoints

### Deploy
- Re-deploy `unified-auth` apos as correcoes

---

## Secao Tecnica

### Analise de Solucoes

#### Solucao A: Corrigir apenas os 3 handlers com string literals
- Manutenibilidade: 10/10
- Zero DT: 10/10
- Arquitetura: 10/10
- Escalabilidade: 10/10
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 15 minutos

#### Solucao B: Nao corrigir, "funciona igual"
- Manutenibilidade: 6/10 (strings podem dessincronizar do enum)
- Zero DT: 4/10 (e divida tecnica por definicao)
- Arquitetura: 5/10 (viola SSOT/DRY)
- Escalabilidade: 7/10 (se enum mudar, bugs silenciosos)
- Seguranca: 8/10 (sem impacto direto)
- **NOTA FINAL: 5.8/10**

### DECISAO: Solucao A (Nota 10.0)
A Solucao B e inferior porque viola o principio SSOT do Protocolo RISE V3. Strings literais duplicadas sao divida tecnica que pode causar bugs silenciosos se o enum for renomeado no futuro.

### Arquivos modificados (resumo)

| Arquivo | Linhas alteradas | Tipo |
|---------|-----------------|------|
| `unified-auth/handlers/register.ts` | +1 import, 1 string substituida | Correcao SSOT |
| `unified-auth/handlers/verify-email.ts` | +1 import, 2 strings substituidas | Correcao SSOT |
| `unified-auth/handlers/resend-verification.ts` | +1 import, 1 string substituida | Correcao SSOT |
| `unified-auth/index.ts` | Docblock atualizado | Documentacao |

### Impacto zero em funcionalidade
Todas as correcoes sao refatoracoes seguras: o valor das constantes do enum e identico as strings que estao sendo substituidas. Nenhum comportamento muda em runtime.

