
# Auditoria Completa: Facebook Pixel + CAPI - Resultado e Correcoes

## Resultado Geral

A implementacao foi **95% bem-sucedida**. A arquitetura esta correta, modular, e segue o padrao UTMify validado. Porem, a auditoria identificou **5 problemas** que precisam ser corrigidos para atingir 10.0/10 no Protocolo RISE V3.

---

## Checklist de Validacao

| Item | Status | Detalhes |
|------|--------|----------|
| Event ID deterministico (frontend) | OK | `purchase_{orderId}` em `events.ts` |
| Event ID deterministico (backend) | OK | `purchase_{orderId}` em `_shared/facebook-capi/event-id.ts` |
| Frontend/Backend geram MESMO ID | OK | Ambos usam `purchase_{orderId}` |
| `fbq()` recebe `eventID` como 4o parametro | OK | `global.d.ts` atualizado, `events.ts` passa `{eventID}` |
| Retry com exponential backoff (3x) | OK | `facebook-conversion-api/index.ts` com 1s, 2s, 4s |
| Diferenciacao 4xx (nao retry) vs 5xx (retry) | OK | `isRetryableStatus()` implementado |
| Tabela `failed_facebook_events` | OK | Migration com RPCs e cleanup |
| RLS DENY ALL na tabela | OK | `ENABLE ROW LEVEL SECURITY` sem policies |
| Reprocessador Cron | OK | `reprocess-failed-facebook-events/index.ts` |
| Integracao `webhook-post-payment.ts` Step 5 | OK | `dispatchFacebookCAPIForOrder()` chamado |
| `PostPaymentResult.facebookCAPIDispatched` | OK | Campo adicionado |
| Pixel Resolver | OK | Query `product_pixels` JOIN `vendor_pixels` |
| Dispatcher | OK | Orquestra resolve -> dispatch -> agrega |
| Barrel export `_shared/facebook-capi/index.ts` | OK | Exporta tudo corretamente |
| `config.toml` atualizado | OK | Ambas funcoes registradas |
| `EDGE_FUNCTIONS_REGISTRY.md` atualizado | OK | Documentacao detalhada do modulo |
| Testes frontend (19 testes) | OK | Todos passando |
| Limite 300 linhas | OK | Nenhum arquivo excede |

---

## Problemas Identificados

### PROBLEMA 1: Tipo `RawPixelRow` nao utilizado (Codigo Morto)

**Arquivo:** `supabase/functions/_shared/facebook-capi/types.ts` (linhas 112-120)

A interface `RawPixelRow` esta definida mas **nunca e importada ou usada** em nenhum arquivo do projeto. O `pixel-resolver.ts` usa um tipo inline (cast via `as unknown as {...}`) em vez deste tipo.

**Violacao:** RISE V3 Secao 5.4 (Zero Divida Tecnica) - codigo morto.

**Correcao:** Remover `RawPixelRow` de `types.ts` e do barrel export `index.ts`.

---

### PROBLEMA 2: Versao FB API desatualizada no arquivo de testes

**Arquivo:** `supabase/functions/facebook-conversion-api/tests/_shared.ts` (linha 14)

```
const FB_API_VERSION = "v18.0";  // DESATUALIZADO
```

O codigo de producao (`facebook-conversion-api/index.ts` e `reprocess-failed-facebook-events/index.ts`) usa corretamente `v21.0`, mas o arquivo de testes compartilhado ainda referencia `v18.0`.

**Violacao:** RISE V3 Secao 6.4 (Higiene de Codigo) - documentacao/testes desalinhados com producao.

**Correcao:** Atualizar `FB_API_VERSION` para `"v21.0"` em `tests/_shared.ts`.

---

### PROBLEMA 3: Tabela `failed_facebook_events` sem CHECK constraint no `status`

**Arquivo:** `supabase/migrations/20260207183347_*.sql`

O plano original especificava:
```sql
status TEXT DEFAULT 'pending' CHECK (pending, reprocessing, success, failed)
```

Porem a migration implementada usa apenas:
```sql
status TEXT NOT NULL DEFAULT 'pending'
```

Sem CHECK constraint, qualquer string invalida pode ser inserida no campo `status`, violando integridade de dados.

**Violacao:** RISE V3 Secao 4.2 (Seguranca - 10%) - falta validacao de integridade no banco.

**Correcao:** Criar migration para adicionar CHECK constraint:
```sql
ALTER TABLE public.failed_facebook_events
  ADD CONSTRAINT chk_failed_fb_events_status
  CHECK (status IN ('pending', 'reprocessing', 'success', 'failed'));
```

---

### PROBLEMA 4: Barrel export (`index.ts`) expoe tipo morto

**Arquivo:** `supabase/functions/_shared/facebook-capi/index.ts`

O barrel export NAO exporta `RawPixelRow` (o que e correto), mas tambem NAO exporta `FacebookCAPIOrderData` -- este tipo e usado internamente pelo `dispatcher.ts` e nao precisa ser exportado, porem esta no barrel.

Na verdade, o barrel export inclui `FacebookCAPIOrderData` na linha 22 -- revisando: este tipo e usado apenas internamente por `dispatcher.ts` (funcao `fetchOrderForCAPI` retorna `FacebookCAPIOrderData | null`). Como o dispatcher e chamado via `dispatchFacebookCAPIForOrder()` que retorna `FacebookCAPIDispatchResult`, o tipo `FacebookCAPIOrderData` e de uso **exclusivamente interno**.

**Impacto:** Baixo -- nao causa bug, mas expoe superficie de API desnecessaria.

**Correcao:** Mover `FacebookCAPIOrderData` para export interno (remover do barrel).

---

### PROBLEMA 5: Versao do barrel export desatualizada

**Arquivo:** `src/integrations/tracking/facebook/index.ts` (linha 6)

```
@version 2.0.0 - RISE Protocol V3 Compliant
```

O `events.ts` ja esta na versao `3.0.0` (com Event ID Deduplication), mas o barrel export ainda diz `2.0.0`. Inconsistencia de documentacao.

**Correcao:** Atualizar para `@version 3.0.0 - RISE Protocol V3 - Event ID Deduplication`.

---

## Analise de Solucoes para Correcao

### Solucao A: Ignorar os 5 problemas (ja funciona)

- Manutenibilidade: 7/10 (codigo morto e versoes inconsistentes confundem futuros mantenedores)
- Zero DT: 5/10 (5 itens de divida tecnica)
- Arquitetura: 8/10 (CHECK constraint ausente e exposicao desnecessaria de API)
- Escalabilidade: 9/10 (nao impacta)
- Seguranca: 8/10 (CHECK constraint ausente permite dados invalidos)
- **NOTA FINAL: 7.0/10**

### Solucao B: Corrigir todos os 5 problemas

- Manutenibilidade: 10/10 (zero codigo morto, versoes alinhadas)
- Zero DT: 10/10 (nenhum item pendente)
- Arquitetura: 10/10 (CHECK constraint garante integridade, API surface minima)
- Escalabilidade: 10/10 (nao impacta)
- Seguranca: 10/10 (integridade de dados garantida)
- **NOTA FINAL: 10.0/10**

### DECISAO: Solucao B (Nota 10.0)

A Solucao A deixa 5 itens de divida tecnica. O Protocolo RISE V3 exige zero.

---

## Plano de Execucao

### 1. Remover `RawPixelRow` de `types.ts`

Remover as linhas 107-120 (docstring + interface) de `supabase/functions/_shared/facebook-capi/types.ts`.

### 2. Atualizar versao FB API nos testes

Em `supabase/functions/facebook-conversion-api/tests/_shared.ts`, alterar linha 14:
- De: `export const FB_API_VERSION = "v18.0";`
- Para: `export const FB_API_VERSION = "v21.0";`

### 3. Criar migration para CHECK constraint

Nova migration SQL:
```sql
ALTER TABLE public.failed_facebook_events
  ADD CONSTRAINT chk_failed_fb_events_status
  CHECK (status IN ('pending', 'reprocessing', 'success', 'failed'));
```

### 4. Remover `FacebookCAPIOrderData` do barrel export

Em `supabase/functions/_shared/facebook-capi/index.ts`, remover `FacebookCAPIOrderData` da lista de re-exports de tipo.

### 5. Atualizar versao do barrel export frontend

Em `src/integrations/tracking/facebook/index.ts`, atualizar o docstring de `@version 2.0.0` para `@version 3.0.0`.

---

## Arvore de Arquivos Modificados

```text
Modificados:
  supabase/functions/_shared/facebook-capi/types.ts        (remover RawPixelRow)
  supabase/functions/_shared/facebook-capi/index.ts        (remover FacebookCAPIOrderData do export)
  supabase/functions/facebook-conversion-api/tests/_shared.ts (v18.0 -> v21.0)
  src/integrations/tracking/facebook/index.ts              (version 2.0.0 -> 3.0.0)

Novos:
  supabase/migrations/YYYYMMDD_check_constraint_failed_fb_events.sql
```

---

## Checkpoint RISE V3

| Pergunta | Resposta |
|----------|----------|
| Esta e a MELHOR solucao possivel? | Sim, nota 10.0 |
| Existe alguma solucao com nota maior? | Nao |
| Isso cria divida tecnica? | Zero -- remove divida existente |
| Precisaremos "melhorar depois"? | Nao |
| O codigo sobrevive 10 anos sem refatoracao? | Sim |
| Estou escolhendo isso por ser mais rapido? | Nao |
