

# Correção Final: 2 Issues de Consistência e Limpeza Legacy

## Contexto

A auditoria completa da Multi-Secret Key Architecture revelou que 107/107 funcoes estao corretamente migradas para o factory centralizado. Porem, 2 issues menores foram identificados que violam o padrao RISE V3 de "Zero Legacy".

## Issue 1: Chamada Implicita em `utmify-validate-credentials`

**Arquivo:** `supabase/functions/utmify-validate-credentials/index.ts` (linha 86)

**Problema:** Usa `getSupabaseClient()` (sem parametro) ao inves de `getSupabaseClient('general')` (explicito). Funcionalmente identico pois o default e `'general'`, mas inconsistente com o padrao explicito usado nas outras 103 funcoes.

**Correcao:**
```text
// ANTES
const supabase = getSupabaseClient();

// DEPOIS
const supabase = getSupabaseClient('general');
```

## Issue 2: 5 Comentarios Legacy Referenciando `service_role`

Comentarios antigos que mencionam `service_role` diretamente, quando deveriam referenciar a arquitetura de dominios.

| Arquivo | Linha | Comentario Atual | Comentario Corrigido |
|---------|-------|------------------|---------------------|
| `get-my-affiliations/index.ts` | 7 | "Usa service_role para bypass de RLS" | "Usa domain 'general' para bypass de RLS via factory centralizado" |
| `get-affiliation-status/index.ts` | 5 | "Usa service_role para bypass de RLS" | "Usa domain 'general' para bypass de RLS via factory centralizado" |
| `get-affiliation-status/index.ts` | 52 | "Criar cliente Supabase com service_role para bypass de RLS" | "Criar cliente Supabase via factory centralizado (domain: general)" |
| `update-affiliate-settings/index.ts` | 125 | "Reutilizar supabaseAdmin para queries (RISE V3: service_role only)" | "Reutilizar supabaseAdmin para queries (RISE V3: domain 'general')" |
| `track-visit/index.ts` | 51 | "Create Supabase client with service role (bypass RLS)" | "Create Supabase client via centralized factory (domain: general)" |

## Arvore de Arquivos Modificados

```text
MODIFICADOS (6 arquivos - correcoes cirurgicas):
  supabase/functions/utmify-validate-credentials/index.ts  <- getSupabaseClient('general')
  supabase/functions/get-my-affiliations/index.ts           <- Comentario atualizado
  supabase/functions/get-affiliation-status/index.ts        <- 2 comentarios atualizados
  supabase/functions/update-affiliate-settings/index.ts     <- Comentario atualizado
  supabase/functions/track-visit/index.ts                   <- Comentario atualizado
```

## Pos-Correcao

Apos estas 6 correcoes, a migracao estara em **100% de conformidade** com o RISE Protocol V3:
- Zero chamadas legadas a `createClient`
- Zero referencias diretas a `SUPABASE_SERVICE_ROLE_KEY` em codigo de producao
- Zero comentarios referenciando o sistema legado
- 107/107 funcoes usando o factory centralizado com dominio explicito
- Documentacao 100% atualizada

O User podera entao prosseguir com a **Fase 6 (Manual)**: criar as 3 secret keys no Supabase Dashboard e configurar os Supabase Secrets.

