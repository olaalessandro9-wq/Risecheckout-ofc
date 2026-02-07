
# Correcao: "supabaseUrl is not defined" no pushinpay-create-pix

## Diagnostico

Os logs da Edge Function confirmam o erro:

```
2026-02-07T03:57:28Z ERROR "supabaseUrl is not defined"
2026-02-07T03:53:40Z ERROR "supabaseUrl is not defined"
```

No arquivo `supabase/functions/pushinpay-create-pix/index.ts`, a variavel `supabaseUrl` e referenciada em **duas linhas** mas **nunca declarada**:

- **Linha 180:** passada para `buildPixPayload()` -- monta a `webhook_url` do PIX
- **Linha 197:** passada para `triggerPixGeneratedWebhook()` -- chama a Edge Function `trigger-webhooks`

JavaScript/TypeScript lanca `ReferenceError` na primeira referencia (linha 180), que e capturada pelo bloco `catch` e retornada como resposta `400 Bad Request` com `{ ok: false, error: "supabaseUrl is not defined" }`.

A variavel `SUPABASE_URL` e uma variavel de ambiente **automaticamente disponivel** em todas as Edge Functions do Supabase. Nao precisa configurar nenhum secret -- basta ler com `Deno.env.get('SUPABASE_URL')`.

## O Que Sera Feito

### Arquivo unico: `supabase/functions/pushinpay-create-pix/index.ts`

Adicionar 4 linhas apos a criacao do cliente Supabase (linha 99), antes do rate limiting (linha 102):

```text
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
if (!supabaseUrl) {
  log.error('SUPABASE_URL nao configurada');
  throw new Error('Configuracao do servidor incompleta: SUPABASE_URL');
}
```

Isso resolve ambas as referencias:
- Linha 180: `buildPixPayload({ ..., supabaseUrl, ... })` -- agora funciona
- Linha 197: `triggerPixGeneratedWebhook({ supabaseUrl, ... })` -- agora funciona

## Secao Tecnica

### Localizacao exata

Entre a linha 99 (`const supabase = getSupabaseClient('payments')`) e a linha 102 (`const rateLimitResult = ...`).

### Impacto

- Correcao de 4 linhas em 1 arquivo
- Zero breaking changes
- `SUPABASE_URL` e automatica no Supabase (nao precisa configurar secrets)
- Apos deploy, o PIX via PushinPay voltara a funcionar normalmente
