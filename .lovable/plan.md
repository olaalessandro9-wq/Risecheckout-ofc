
## Contexto e evidência (o que está acontecendo de verdade)

Você está certo em dois pontos:

1) **Os secrets existem** (o print do Supabase confirma).  
2) O erro atual **não é “falta de secret”** — é **mismatch de configuração**.

O dado objetivo que encerra a dúvida é este:

- **Logs reais da Edge Function `mercadopago-oauth-callback` mostram que o `redirect_uri` usado no TOKEN EXCHANGE ainda é o antigo**:

```
Redirect URI: https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/mercadopago-oauth-callback
```

Ou seja: mesmo que o painel do Mercado Pago agora esteja com:

```
https://api.risecheckout.com/functions/v1/mercadopago-oauth-callback
```

…a etapa **3 (troca do code por token)** está mandando **outro redirect_uri**, e o Mercado Pago **nega** (isso gera `token_exchange_failed`).

Além disso, existe um segundo bug independente:
- `public/oauth-error.html` envia `postMessage(..., window.location.origin)`.  
Se o opener é `app.risecheckout.com` e o popup está em `risecheckout.com`, dá erro de origin e o app não recebe o evento de erro corretamente. (O sucesso já usa `'*'`, o erro não.)

---

## Root Cause (sem “workarounds”)

### Root Cause #1 (principal)
**O OAuth está com SSOT quebrado**:  
- O **Authorization** (frontend) usa `redirect_uri = https://api.risecheckout.com/...`  
- O **Token Exchange** (edge function) usa `redirect_uri = https://wivbtmt...supabase.co/...`

Isso é suficiente para o Mercado Pago recusar o token exchange.

### Root Cause #2 (secundário, mas real)
**`oauth-error.html` usa targetOrigin restritivo** no `postMessage`, causando falhas de comunicação cross-subdomain.

---

## Análise de Soluções (RISE V3)

### Solução A: Ajustar o secret `MERCADOPAGO_REDIRECT_URI` para `api.risecheckout.com` e pronto
- Manutenibilidade: 6/10 (depende de humano não errar de novo)
- Zero DT: 6/10 (SSOT continua duplicado: frontend + backend)
- Arquitetura: 5/10 (risco recorrente de mismatch)
- Escalabilidade: 6/10
- Segurança: 9/10
- **NOTA FINAL: 6.2/10**
- Tempo estimado: 15 min

### Solução B: SSOT definitivo — gerar a Authorization URL no backend (integration-management) e usar o MESMO config no token exchange + corrigir postMessage do erro
- Manutenibilidade: 10/10 (SSOT real: um lugar só)
- Zero DT: 10/10 (remove classe inteira de bugs)
- Arquitetura: 10/10 (Clean: UI não monta URL sensível de OAuth)
- Escalabilidade: 10/10 (fácil adicionar sandbox, múltiplas apps, etc.)
- Segurança: 10/10 (nenhuma secret no frontend; redirect controlado)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 1–2 dias (com testes + docs)

### Solução C: Hardcode do redirect_uri correto no token exchange (ignorando secret) + manter frontend como está + corrigir postMessage do erro
- Manutenibilidade: 8/10 (menos risco, mas ainda duplicação entre FE/BE)
- Zero DT: 7/10 (SSOT ainda duplicado; melhora parcial)
- Arquitetura: 7/10
- Escalabilidade: 7/10
- Segurança: 10/10
- **NOTA FINAL: 7.9/10**
- Tempo estimado: 1–3 horas

### DECISÃO: Solução B (10.0/10)
Porque elimina a causa estrutural (mismatch recorrente) e deixa o fluxo blindado a mudanças de domínio (api gateway vs supabase direto).

---

## Plano de Execução (Solução B)

### 1) Backend vira SSOT do OAuth (authorization URL + token exchange)
**Objetivo:** o frontend nunca mais “monta URL OAuth manualmente”.

**Mudanças:**
- `supabase/functions/_shared/integration-oauth-handlers.ts`
  - Evoluir `handleInitOAuth` para retornar também:
    - `authorizationUrl` (string já pronta para `window.open`)
    - opcional: `provider: 'mercadopago'`
  - Essa URL será montada usando um único módulo de config (ver item 2).

- `supabase/functions/mercadopago-oauth-callback/handlers/token-exchange.ts`
  - Parar de depender de redirect_uri “solto” e usar o MESMO módulo de config.
  - Fazer validação “fail-fast”:
    - se `MERCADOPAGO_CLIENT_SECRET` estiver vazio → erro explícito e log claro.
    - redirect_uri sempre consistente com a URL emitida no init.

### 2) Criar um módulo único de configuração (Edge SSOT)
Criar arquivo novo (<= 300 linhas):
- `supabase/functions/_shared/mercadopago-oauth-config.ts`

Ele será a única fonte para:
- `client_id` (pode ser env ou constante pública)
- `redirect_uri` (SSOT, preferencialmente constante `https://api.risecheckout.com/functions/v1/mercadopago-oauth-callback`)
- `buildAuthorizationUrl(state: string): string`
- `getTokenExchangeParams(code: string): URLSearchParams` (sem expor secrets)

### 3) Frontend passa a usar `authorizationUrl` do backend
**Arquivo:**
- `src/integrations/gateways/mercadopago/hooks/useMercadoPagoConnection.ts`

**Mudança:**
- Trocar:
  - montar URL manualmente com `MERCADOPAGO_CLIENT_ID` + `MERCADOPAGO_REDIRECT_URI`
- Por:
  - `init-oauth` retorna `authorizationUrl`
  - `window.open(authorizationUrl, ...)`

Resultado: o frontend não precisa mais de `src/config/mercadopago.ts` (podemos manter por enquanto, mas ficará obsoleto; ideal é remover depois para evitar SSOT duplicado).

### 4) Corrigir `oauth-error.html` (postMessage cross-subdomain)
**Arquivo:**
- `public/oauth-error.html`

**Mudança:**
- Trocar targetOrigin:
  - de `window.location.origin`
  - para `'*'` (mesmo padrão do success)
  
Isso elimina erros do tipo “target origin does not match recipient origin”.

### 5) Atualizar SSOT de Secrets (arquivo que você citou como fonte máxima)
**Arquivo:**
- `supabase/functions/_shared/platform-secrets.ts`

**Mudança:**
- Adicionar ao `SECRETS_MANIFEST` (gateway mercadopago):
  - `MERCADOPAGO_CLIENT_SECRET` (required: true)
  - `MERCADOPAGO_WEBHOOK_SECRET` (required: true/false conforme uso real)
  - (Opcional) `MERCADOPAGO_CLIENT_ID` e `MERCADOPAGO_REDIRECT_URI` como “config” (se decidirmos manter em env).  
    Observação: redirect_uri não é secret, mas pode estar documentado ali como “config required” se for política interna.

### 6) Observabilidade e Debug 10/10
- Melhorar logs no `token-exchange.ts`:
  - manter log do Redirect URI (não é secret)
  - logar status code e body do MP quando `!ok` (já existe) e mapear para um `reason` interno quando possível.
- Opcional: propagar `reason` mais específico para `oauth-error.html?reason=...` (ex: `redirect_uri_mismatch`), sem vazar informações sensíveis.

---

## Passos Manuais (curtos, para “destravar agora” enquanto implementamos B)

Mesmo com a Solução B, hoje existe um fato:
- **O token exchange ainda está usando redirect antigo** (supabase.co).

Então, antes/depois do deploy da Solução B, vamos validar:

1) Tentar integrar novamente
2) Ver logs do `mercadopago-oauth-callback` e confirmar que aparece:
   - `Redirect URI: https://api.risecheckout.com/functions/v1/mercadopago-oauth-callback`

Se continuar mostrando `supabase.co`, significa que algum lugar ainda está definindo config errada e será eliminado pela Solução B (porque deixaremos de depender desse secret para redirect_uri).

---

## Testes (obrigatórios)

1) Teste de unidade (Deno) para `buildAuthorizationUrl`:
   - garante query params corretos (`client_id`, `redirect_uri`, `state`, etc.)
2) Teste de unidade para token exchange params:
   - garante que `redirect_uri` usado no exchange é idêntico ao de authorization
3) Teste manual ponta-a-ponta:
   - conectar → sucesso → `vendor_integrations` atualizado → UI reflete conectado
   - erro proposital (cancelar no MP) → `oauth-error.html` envia postMessage e UI mostra erro

---

## Arquivos impactados (resumo)

**Backend**
- `supabase/functions/_shared/integration-oauth-handlers.ts` (editar)
- `supabase/functions/_shared/mercadopago-oauth-config.ts` (criar)
- `supabase/functions/mercadopago-oauth-callback/handlers/token-exchange.ts` (editar)
- `supabase/functions/_shared/platform-secrets.ts` (editar)

**Frontend**
- `src/integrations/gateways/mercadopago/hooks/useMercadoPagoConnection.ts` (editar)

**Public**
- `public/oauth-error.html` (editar)

---

## Critério de aceite (Definition of Done)

- Integrar Mercado Pago funciona com redirect do **api gateway**.
- Logs mostram `Redirect URI` correto (api.risecheckout.com).
- `oauth-error.html` consegue notificar o opener em qualquer subdomínio.
- Nenhuma dependência do frontend em “montar OAuth URL manualmente” (SSOT no backend).
