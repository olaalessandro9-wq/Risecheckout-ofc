
# Migracao Completa: Cloudflare Worker + Limpeza de Legacy Secrets

## Contexto

A investigacao profunda revelou **4 areas de acao** necessarias para finalizar a migracao 100%:

1. **Cloudflare Worker** - Atualizar o nome do secret e o codigo no repositorio
2. **Secrets Legadas no Lovable Cloud** - Remover 2 secrets orfas
3. **Arquivo morto no repositorio** - `src/integrations/supabase/client.ts` contem JWT legado
4. **Documentacao do Worker** - Sincronizar o arquivo local com a versao real da Cloudflare

---

## AREA 1: Cloudflare Worker (Acao Manual do User)

O Worker atual usa `env.SUPABASE_ANON_KEY` (nome legado). Precisa ser atualizado para `env.SUPABASE_PUBLISHABLE_KEY`.

### O que fazer no Cloudflare Dashboard:

**Passo 1:** Criar um novo secret no Worker com o nome correto:
- Workers & Pages > rise-api-proxy > Settings > Variables and Secrets
- Adicionar novo secret:

| Nome (NOVO) | Valor |
|-------------|-------|
| `SUPABASE_PUBLISHABLE_KEY` | A publishable key (`sb_publishable_...`) que voce criou no Supabase Dashboard |

**Passo 2:** Atualizar o codigo do Worker (na aba "Edit Code" ou via Wrangler):

Mudar a linha 93 de:
```javascript
headers.set("apikey", env.SUPABASE_ANON_KEY);
```
Para:
```javascript
headers.set("apikey", env.SUPABASE_PUBLISHABLE_KEY);
```

Tambem atualizar o comentario do header (linha 1-4) e adicionar o `EXPLICIT_ORIGINS` que voce ja tem na versao real (o arquivo no repositorio esta desatualizado).

**Passo 3:** Apos confirmar que funciona, **remover** o secret antigo:
- Deletar `SUPABASE_ANON_KEY` dos secrets do Worker

**Passo 4:** Deploy do Worker

---

## AREA 2: Secrets Legadas no Lovable Cloud (Acao no Plano)

A auditoria identificou **2 secrets orfas** que nenhuma Edge Function utiliza:

| Secret Legada | Status | Motivo da Remocao |
|---------------|--------|-------------------|
| `PUBLIC_SITE_URL` | Orfao | Substituido por `SITE_BASE_DOMAIN` (SSOT desde RISE V3) |
| `STRIPE_REDIRECT_URL` | Orfao | Hardcoded em `stripe-oauth-config.ts` (SSOT) |

Tambem identificada **1 secret suspeita**:

| Secret | Status | Analise |
|--------|--------|---------|
| `BUYER_SESSION_SECRET` | Potencialmente Orfao | Zero referencias no codigo (`0 matches`). Possivel legado do sistema de sessoes antigo |

Acao: Vou solicitar a remocao dessas 3 secrets via ferramenta.

---

## AREA 3: Atualizar Arquivo do Worker no Repositorio

O arquivo `docs/cloudflare-worker/rise-api-proxy.js` esta desatualizado:
- Nao tem o `EXPLICIT_ORIGINS` (que voce ja adicionou na Cloudflare real)
- Usa `env.SUPABASE_ANON_KEY` (nome legado)
- Comentario de header desatualizado

Acao: Atualizar para refletir a versao correta com:
- `env.SUPABASE_PUBLISHABLE_KEY`
- `EXPLICIT_ORIGINS` array
- Header atualizado com data de 2026-02-06

---

## AREA 4: Arquivo `src/integrations/supabase/client.ts`

Este arquivo contem o **JWT legacy anon key hardcoded** (`eyJhbGci...`). Ele e gerado automaticamente pelo Lovable e nao pode ser editado manualmente. Porem, ele nao e importado por nenhum modulo de producao (0 imports encontrados). A arquitetura RISE V3 usa exclusivamente `api.call()` e `publicApi.call()` que passam pelo API Gateway.

**Decisao:** Este arquivo e gerenciado pelo Lovable e nao pode ser removido. Como nao e utilizado em producao, nao representa risco de seguranca. Sera documentado como "arquivo auto-gerado, nao utilizado".

---

## Resumo de Acoes

### Acoes que EU vou executar (codigo):
1. Atualizar `docs/cloudflare-worker/rise-api-proxy.js` com `SUPABASE_PUBLISHABLE_KEY` + `EXPLICIT_ORIGINS`
2. Solicitar remocao das 3 secrets legadas (`PUBLIC_SITE_URL`, `STRIPE_REDIRECT_URL`, `BUYER_SESSION_SECRET`)
3. Atualizar documentacao em `API_GATEWAY_ARCHITECTURE.md` removendo nota de migracao (agora completa)

### Acoes que VOCE executa (manual):
1. **Cloudflare Dashboard:** Criar secret `SUPABASE_PUBLISHABLE_KEY` no Worker
2. **Cloudflare Dashboard:** Atualizar codigo do Worker (linha `env.SUPABASE_ANON_KEY` -> `env.SUPABASE_PUBLISHABLE_KEY`)
3. **Cloudflare Dashboard:** Deploy do Worker
4. **Cloudflare Dashboard:** Apos validar, remover secret `SUPABASE_ANON_KEY` do Worker
5. **Supabase Dashboard:** Apos validar a migracao completa, revogar as legacy API keys (JWT `anon` e `service_role` antigas)

---

## Checklist Final Pos-Migracao

| Item | Responsavel |
|------|-------------|
| Worker usa `SUPABASE_PUBLISHABLE_KEY` | User (Cloudflare) |
| Secret `SUPABASE_ANON_KEY` removida do Worker | User (Cloudflare) |
| Secrets legadas removidas do Lovable Cloud | AI (automatico) |
| Arquivo do Worker no repo atualizado | AI (automatico) |
| Legacy JWT keys revogadas no Supabase Dashboard | User (Supabase) |
| Validar login/checkout funciona apos migracao | User (teste manual) |
