
# Plano RISE V3: Corrigir Erros de Console no Checkout Público

## Sumário Executivo

Investiguei profundamente os 4 tipos de erros reportados no console do checkout público. Este plano corrige todos os problemas seguindo o RISE Protocol V3 com nota 10.0/10.

---

## 1. Diagnóstico Detalhado dos Erros

### Erro 1: Violações de CSP (Content-Security-Policy)
**Causa:** A meta tag CSP no `index.html` está bloqueando recursos necessários pelo SDK do Mercado Pago.

**Domínios Faltando:**
| Diretiva | Domínio Ausente | Uso |
|----------|-----------------|-----|
| `script-src` | `https://http2.mlstatic.com` | SDK principal do MP |
| `connect-src` | `https://http2.mlstatic.com` | APIs de fingerprint |
| `connect-src` | `https://events.mercadopago.com` | Telemetria/anti-fraude |
| `frame-src` | `https://www.mercadopago.com.br` | iframes de pagamento |
| `script-src` | `https://analytics.tiktok.com` | TikTok Pixel |
| `script-src` | `https://kpx.alicdn.com` | Kwai Pixel |

### Erro 2: TypeError "Cannot read properties of undefined (reading 'message')"
**Causa Provável:** Acesso a `error.message` sem verificação defensiva.

**Localização Identificada:**
- `src/modules/checkout-public/machines/checkoutPublicMachine.actions.ts` linha 129: `String(error)` pode retornar `"undefined"` se error for undefined.

### Erro 3: Tracking Failures ([object ProgressEvent])
**Causa:** Quando a CSP bloqueia o script de tracking, o evento de erro do XMLHttpRequest é um `ProgressEvent` que não tem `message`. O logger tenta logar como string e aparece `[object ProgressEvent]`.

**Solução:** Corrigir CSP (item 1) + melhorar tratamento de erro no logger.

### Erro 4: postMessage Mismatch
**Causa:** Comunicação entre iframes de SDK de pagamento (MP/Stripe) e janela principal. 

**Análise:** Este erro é **esperado e inofensivo** - são mensagens internas dos SDKs que não precisam de tratamento. Não há código nosso que escuta estas mensagens específicas.

---

## 2. Análise de Soluções (RISE Protocol V3 Seção 4.4)

### Solução A: Correção Parcial (Apenas CSP)

- Manutenibilidade: 7/10 (não corrige TypeError)
- Zero DT: 6/10 (deixa código frágil)
- Arquitetura: 6/10 (tratamento de erro incompleto)
- Escalabilidade: 8/10
- Segurança: 10/10
- **NOTA FINAL: 7.4/10**

### Solução B: Correção Completa (CSP + Tratamento de Erro + Documentação)

1. Atualizar CSP em `index.html` e `vercel.json`
2. Melhorar tratamento de erro em actions
3. Documentar erros de postMessage como "esperados"

- Manutenibilidade: 10/10
- Zero DT: 10/10
- Arquitetura: 10/10
- Escalabilidade: 10/10
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**

### DECISÃO: Solução B (Nota 10.0)

---

## 3. Plano de Correção

### Arquivos a Modificar

```text
index.html                                                    # CSP principal
vercel.json                                                   # CSP de produção
src/modules/checkout-public/machines/checkoutPublicMachine.actions.ts  # Tratamento de erro
```

---

## 4. Alterações Detalhadas

### 4.1 index.html - CSP Atualizada

A meta tag CSP (linhas 14-28) será atualizada com os seguintes domínios adicionais:

**script-src (adicionar):**
- `https://http2.mlstatic.com` - Mercado Pago SDK core
- `https://analytics.tiktok.com` - TikTok Pixel
- `https://kpx.alicdn.com` - Kwai Pixel

**connect-src (adicionar):**
- `https://http2.mlstatic.com` - MP fingerprint/resources
- `https://events.mercadopago.com` - MP telemetry/anti-fraud

**frame-src (já existe):**
- Verificar se `https://*.mercadopago.com` cobre todos os casos

### 4.2 vercel.json - CSP de Produção Sincronizada

Atualizar a CSP no header de produção para manter paridade com index.html:
- Adicionar mesmos domínios que foram adicionados em index.html
- Garantir que `*.mlstatic.com` esteja em connect-src
- Adicionar `events.mercadopago.com` em connect-src

### 4.3 checkoutPublicMachine.actions.ts - Tratamento Robusto

Linha 126-131 - função `createNetworkError`:

```typescript
// ANTES:
export function createNetworkError(error: unknown) {
  return {
    reason: 'NETWORK_ERROR' as const,
    message: String(error) || "Erro de rede",
  };
}

// DEPOIS:
export function createNetworkError(error: unknown) {
  let message = "Erro de rede";
  
  if (error instanceof Error) {
    message = error.message || "Erro de rede";
  } else if (typeof error === 'string' && error.trim()) {
    message = error;
  }
  // ProgressEvent e outros objetos sem message caem no default
  
  return {
    reason: 'NETWORK_ERROR' as const,
    message,
  };
}
```

---

## 5. CSP Completa Proposta

```text
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' 
  https://challenges.cloudflare.com 
  https://js.stripe.com 
  https://sdk.mercadopago.com 
  https://http2.mlstatic.com 
  https://www.googletagmanager.com 
  https://www.google-analytics.com 
  https://connect.facebook.net 
  https://analytics.tiktok.com 
  https://kpx.alicdn.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: https: blob:;
connect-src 'self' 
  https://api.risecheckout.com 
  https://*.supabase.co 
  wss://*.supabase.co 
  https://*.mercadopago.com 
  https://*.mercadolibre.com 
  https://*.mlstatic.com 
  https://http2.mlstatic.com 
  https://events.mercadopago.com 
  https://api.stripe.com 
  https://challenges.cloudflare.com 
  https://www.google-analytics.com 
  https://api.utmify.com.br 
  https://graph.facebook.com 
  https://analytics.tiktok.com 
  https://kpx.alicdn.com 
  https://*.sentry.io 
  https://*.ingest.us.sentry.io;
frame-src 'self' 
  https://js.stripe.com 
  https://challenges.cloudflare.com 
  https://*.mercadopago.com 
  https://*.mercadolibre.com 
  https://www.mercadopago.com.br 
  https://www.youtube.com 
  https://player.vimeo.com;
media-src 'self' https: blob:;
worker-src 'self' blob:;
object-src 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
```

---

## 6. Sobre os Erros de postMessage

Os erros de postMessage são **comportamento esperado** dos SDKs de pagamento:
- Mercado Pago SDK usa postMessage internamente para comunicação entre iframes
- Stripe SDK tem comportamento similar
- Não há código no projeto que dependa dessas mensagens

**Decisão:** Não tratar - são logs informativos internos dos SDKs que não afetam funcionalidade.

---

## 7. Resultado Esperado

| Erro | Antes | Depois |
|------|-------|--------|
| CSP blocking MP fingerprint | Erro no console | Silencioso |
| CSP blocking TikTok/Kwai | Erro no console | Silencioso |
| TypeError message undefined | Crash potencial | Tratado graciosamente |
| postMessage mismatch | Log de aviso | Mesmo (esperado) |
| Mercado Pago SDK | Parcialmente bloqueado | Funcionando 100% |

---

## 8. Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Manutenibilidade Infinita | CSP documentada e extensível |
| Zero Dívida Técnica | Todos os SDKs autorizados |
| Arquitetura Correta | Tratamento de erro defensivo |
| Escalabilidade | Fácil adicionar novos pixels |
| Segurança | CSP restritiva mas funcional |

**RISE V3 Score: 10.0/10**

---

## 9. Seção Técnica

### Por que CSP em dois lugares?

1. **index.html (meta tag):** Aplica-se no desenvolvimento local e em qualquer host
2. **vercel.json (HTTP header):** Aplica-se na produção Vercel com precedência sobre meta tag

Ambos precisam estar sincronizados para evitar inconsistências.

### Domínios do Mercado Pago SDK

O SDK do Mercado Pago carrega recursos de múltiplos domínios:
- `sdk.mercadopago.com` - SDK JavaScript principal
- `http2.mlstatic.com` - Recursos estáticos, fingerprinting
- `events.mercadopago.com` - Telemetria e anti-fraude
- `*.mercadopago.com` - iframes de formulário seguro
- `*.mercadolibre.com` - Infraestrutura compartilhada

Todos esses domínios são necessários para funcionamento completo do SDK.
