

# Plano: Corrigir Content-Security-Policy no vercel.json

## Diagnóstico Confirmado

O erro de login NÃO é mais CORS - agora é **CSP (Content-Security-Policy)**.

O arquivo `vercel.json` linha 29 define a diretiva `connect-src` que **não inclui** os domínios necessários:

| Domínio | Status | Necessário para |
|---------|--------|-----------------|
| `https://api.risecheckout.com` | **FALTANDO** | Login e todas Edge Functions |
| `https://*.sentry.io` | **FALTANDO** | Captura de erros (Sentry) |
| `https://*.ingest.us.sentry.io` | **FALTANDO** | Sentry Ingest |
| `wss://wivbtmtgpsxupfjwwovf.supabase.co` | **FALTANDO** | Realtime (se usado) |

## Mudança Necessária

### Arquivo: `vercel.json`

**Antes (linha 29):**
```
connect-src 'self' https://wivbtmtgpsxupfjwwovf.supabase.co https://www.google-analytics.com https://api.mercadopago.com;
```

**Depois:**
```
connect-src 'self' https://api.risecheckout.com https://wivbtmtgpsxupfjwwovf.supabase.co wss://wivbtmtgpsxupfjwwovf.supabase.co https://*.sentry.io https://*.ingest.us.sentry.io https://www.google-analytics.com https://api.mercadopago.com https://api.stripe.com;
```

## CSP Completo Atualizado

O valor completo do CSP será:

```text
default-src 'self'; 
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://wivbtmtgpsxupfjwwovf.supabase.co https://www.googletagmanager.com https://www.google-analytics.com https://sdk.mercadopago.com https://js.stripe.com; 
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
font-src 'self' https://fonts.gstatic.com data:; 
img-src 'self' data: https: blob:; 
connect-src 'self' https://api.risecheckout.com https://wivbtmtgpsxupfjwwovf.supabase.co wss://wivbtmtgpsxupfjwwovf.supabase.co https://*.sentry.io https://*.ingest.us.sentry.io https://www.google-analytics.com https://api.mercadopago.com https://api.stripe.com; 
frame-src 'self' https://www.mercadopago.com.br https://js.stripe.com; 
object-src 'none'; 
base-uri 'self'; 
form-action 'self'; 
upgrade-insecure-requests;
```

## Domínios Adicionados

| Diretiva | Domínios Adicionados | Motivo |
|----------|---------------------|--------|
| `connect-src` | `https://api.risecheckout.com` | **Proxy para Edge Functions (LOGIN!)** |
| `connect-src` | `wss://wivbtmtgpsxupfjwwovf.supabase.co` | Supabase Realtime WebSocket |
| `connect-src` | `https://*.sentry.io` | Sentry error tracking |
| `connect-src` | `https://*.ingest.us.sentry.io` | Sentry ingest endpoint |
| `connect-src` | `https://api.stripe.com` | Stripe API |
| `script-src` | `https://sdk.mercadopago.com` | MercadoPago SDK |
| `script-src` | `https://js.stripe.com` | Stripe.js |
| `frame-src` | `https://js.stripe.com` | Stripe 3D Secure iframe |

## Resultado Esperado

Após esta correção:
- Login funcionará em `risecheckout.com/auth`
- Sentry capturará erros corretamente
- Pagamentos com Stripe e MercadoPago funcionarão
- Realtime (se usado) funcionará

## Seção Técnica

O CSP é aplicado pelo navegador no momento do carregamento da página. Quando o frontend tenta fazer um `fetch()` para `api.risecheckout.com`, o navegador verifica a diretiva `connect-src`. Como o domínio não estava listado, a requisição era bloqueada ANTES mesmo de sair do navegador - por isso não há logs no servidor.

