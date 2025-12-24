# 🔒 Relatório de Segurança: Sistema de Webhooks RiseCheckout

**Data:** 24 de novembro de 2025  
**Versão:** 1.0  
**Autor:** Manus AI

---

## Sumário Executivo

Este relatório documenta a implementação de melhorias de segurança no sistema de webhooks do RiseCheckout, incluindo a adição de assinatura criptográfica HMAC-SHA256 para proteger webhooks enviados ao N8N e a análise da segurança dos webhooks recebidos do Mercado Pago.

### Status Atual

✅ **Webhooks para N8N:** Implementado com assinatura HMAC-SHA256 (versão 94)  
⚠️ **Webhooks do Mercado Pago:** Funcionando, mas sem validação de assinatura (vulnerabilidade crítica)

---

## 1. Implementações Realizadas

### 1.1. Assinatura de Webhooks para N8N

**Problema Identificado:** Os webhooks enviados para o N8N não possuíam nenhuma forma de validação de autenticidade, permitindo que qualquer pessoa com a URL do webhook pudesse enviar dados falsos.

**Solução Implementada:** Adicionada assinatura criptográfica HMAC-SHA256 na função `dispatch-webhook` (versão 94).

#### Detalhes Técnicos

A função agora executa os seguintes passos:

1. **Busca o Secret:** Consulta a tabela `outbound_webhooks` para obter o `secret` configurado para aquele webhook específico.

2. **Gera a Assinatura:** Utiliza a Web Crypto API nativa do Deno para criar uma assinatura HMAC-SHA256:
   ```typescript
   async function generateHmacSignature(secret: string, payload: string): Promise<string> {
     const encoder = new TextEncoder();
     const keyData = encoder.encode(secret);
     const messageData = encoder.encode(payload);

     const key = await crypto.subtle.importKey(
       "raw",
       keyData,
       { name: "HMAC", hash: "SHA-256" },
       false,
       ["sign"]
     );

     const signature = await crypto.subtle.sign("HMAC", key, messageData);
     const hashArray = Array.from(new Uint8Array(signature));
     const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
     
     return hashHex;
   }
   ```

3. **Adiciona Header:** Inclui a assinatura no cabeçalho HTTP `X-Rise-Signature` antes de enviar a requisição.

4. **Logs de Segurança:** Registra no console se a assinatura foi gerada ou se o webhook está sem secret configurado.

#### Fluxo de Segurança

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Evento ocorre (ex: pagamento aprovado)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. trigger-webhooks consulta webhooks configurados          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. dispatch-webhook busca SECRET do banco                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Gera assinatura HMAC-SHA256(SECRET, payload)            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Envia POST com header X-Rise-Signature                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. N8N valida assinatura antes de processar                │
└─────────────────────────────────────────────────────────────┘
```

### 1.2. Configuração no N8N

Foi criado um guia completo (`CONFIGURACAO_N8N.md`) com instruções passo a passo para configurar a validação de assinatura no N8N. O código de validação utiliza:

-   `crypto.createHmac()` para recriar a assinatura
-   `crypto.timingSafeEqual()` para comparação segura (previne timing attacks)
-   Bloqueio automático do fluxo se a assinatura for inválida

---

## 2. Análise de Segurança: Webhooks do Mercado Pago

### 2.1. Status Atual

❌ **VULNERABILIDADE CRÍTICA IDENTIFICADA**

A função `mercadopago-webhook` **não valida a assinatura** enviada pelo Mercado Pago no header `X-Signature`. Isso significa que qualquer pessoa pode enviar requisições falsas simulando o Mercado Pago.

### 2.2. Como o Mercado Pago Assina Webhooks

O Mercado Pago envia três headers de segurança:

| Header | Descrição | Exemplo |
|--------|-----------|---------|
| `x-signature` | Assinatura HMAC-SHA256 do payload | `ts=1234567890,v1=abc123...` |
| `x-request-id` | ID único da requisição | `12345678-1234-1234-1234-123456789012` |

A assinatura segue o formato: `ts=<timestamp>,v1=<hash>`

O hash é calculado como: `HMAC-SHA256(secret, "id:<data.id>;request-id:<x-request-id>;ts:<timestamp>;")`

### 2.3. Configuração do Secret

**Status:** ❌ **NÃO CONFIGURADO**

Verificamos as tabelas do banco de dados:
- `payment_gateway_settings`: Não possui campo `webhook_secret`
- `vendor_integrations`: Não possui registros de Mercado Pago
- `mercadopago_split_config`: Não possui campo de secret

**Onde deveria estar:** O secret do webhook do Mercado Pago deve ser obtido no painel do Mercado Pago em **Configurações > Webhooks** e armazenado no banco de dados.

### 2.4. Impacto da Vulnerabilidade

| Risco | Severidade | Descrição |
|-------|------------|-----------|
| **Replay Attack** | 🔴 CRÍTICO | Atacante pode reenviar webhooks antigos para reprocessar pagamentos |
| **Injeção de Dados Falsos** | 🔴 CRÍTICO | Atacante pode forjar webhooks de "pagamento aprovado" sem realmente pagar |
| **Manipulação de Status** | 🟠 ALTO | Atacante pode alterar status de pedidos enviando webhooks falsos |

### 2.5. Recomendação de Correção

**Prioridade:** 🔴 **CRÍTICA**

Implementar validação de assinatura na função `mercadopago-webhook/index.ts`:

```typescript
// 1. Extrair headers
const signature = req.headers.get("x-signature");
const requestId = req.headers.get("x-request-id");

if (!signature || !requestId) {
  return new Response(JSON.stringify({ error: "Missing signature headers" }), { 
    status: 401 
  });
}

// 2. Parsear assinatura
const parts = signature.split(",");
const ts = parts.find(p => p.startsWith("ts="))?.split("=")[1];
const hash = parts.find(p => p.startsWith("v1="))?.split("=")[1];

// 3. Buscar secret do banco (precisa ser adicionado)
const webhookSecret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");

// 4. Recriar assinatura
const manifest = `id:${data.id};request-id:${requestId};ts:${ts};`;
const expectedHash = await generateHmacSignature(webhookSecret, manifest);

// 5. Validar
if (expectedHash !== hash) {
  console.error("[MP-Webhook] ⛔ Assinatura inválida - possível fraude!");
  return new Response(JSON.stringify({ error: "Invalid signature" }), { 
    status: 401 
  });
}

// 6. Verificar timestamp (previne replay attacks)
const now = Math.floor(Date.now() / 1000);
const age = now - parseInt(ts);

if (age > 300) { // 5 minutos
  console.error("[MP-Webhook] ⛔ Webhook expirado - possível replay attack!");
  return new Response(JSON.stringify({ error: "Webhook expired" }), { 
    status: 401 
  });
}

console.log("[MP-Webhook] ✅ Assinatura validada com sucesso!");
```

---

## 3. Outras Melhorias de Segurança Implementadas

### 3.1. Deduplicação de Webhooks

**Correção aplicada na versão 93 de `dispatch-webhook`:**

Adicionado `product_id` na verificação de duplicidade para diferenciar webhooks de produtos principais e order bumps:

```typescript
let query = supabase
  .from("webhook_deliveries")
  .select("id, status, created_at")
  .eq("webhook_id", webhook_id)
  .eq("order_id", order_id)
  .eq("event_type", event_type);

if (productId) {
  query = query.eq("product_id", productId); // <-- CRUCIAL
}
```

**Impacto:** Previne que webhooks de order bumps sejam bloqueados como duplicatas do produto principal.

### 3.2. Autenticação Entre Funções

**Status:** ✅ **IMPLEMENTADO**

As funções Edge utilizam dois métodos de autenticação:

1. **Service Role Key:** Para chamadas diretas do frontend/admin
2. **Internal Secret:** Para chamadas entre funções Edge

```typescript
const isServiceRole = authHeader?.replace("Bearer ", "") === serviceRoleKey;
const isInternal = internalSecret && expectedSecret && internalSecret === expectedSecret;

if (!isServiceRole && !isInternal) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { 
    status: 401 
  });
}
```

**Impacto:** Previne acesso não autorizado às funções internas.

---

## 4. Resumo de Versões

| Função | Versão | Mudanças de Segurança |
|--------|--------|----------------------|
| `dispatch-webhook` | v93 | Correção de deduplicação com `product_id` |
| `dispatch-webhook` | v94 | **Assinatura HMAC-SHA256 para N8N** |
| `trigger-webhooks` | v46 | Suporte a múltiplos produtos (correção de filtragem) |
| `mercadopago-create-payment` | v86 | Salvamento de `order_items` com bumps |
| `mercadopago-webhook` | atual | ⚠️ **Sem validação de assinatura** |

---

## 5. Próximos Passos Recomendados

### Prioridade CRÍTICA 🔴

1. **Implementar validação de assinatura do Mercado Pago**
   - Adicionar campo `webhook_secret` no banco de dados
   - Obter secret do painel do Mercado Pago
   - Implementar validação na função `mercadopago-webhook`
   - Testar com webhooks reais

### Prioridade ALTA 🟠

2. **Rate Limiting**
   - Implementar limitação de requisições por IP/webhook
   - Prevenir ataques de força bruta

3. **Monitoramento de Segurança**
   - Criar alertas para tentativas de webhook com assinatura inválida
   - Dashboard de métricas de segurança

### Prioridade MÉDIA 🟡

4. **Retry Logic Inteligente**
   - Implementar backoff exponencial para webhooks falhados
   - Limitar número máximo de tentativas

5. **Auditoria de Logs**
   - Revisar logs sensíveis para evitar vazamento de dados
   - Implementar rotação de logs

---

## 6. Conclusão

O sistema de webhooks do RiseCheckout foi significativamente melhorado com a adição de assinatura criptográfica para webhooks enviados ao N8N. No entanto, ainda existe uma vulnerabilidade crítica na validação de webhooks recebidos do Mercado Pago que deve ser corrigida imediatamente.

**Recomendação final:** Implementar a validação de assinatura do Mercado Pago antes de colocar o sistema em produção com transações reais.

---

## Anexos

- [Guia de Configuração do N8N](./CONFIGURACAO_N8N.md)
- [Relatório Final e Análise de Segurança](./RELATORIO_FINAL_E_SEGURANCA.md)
- [Código-fonte: dispatch-webhook v94](./supabase/functions/dispatch-webhook/index.ts)

---

**Documento gerado por:** Manus AI  
**Última atualização:** 24 de novembro de 2025
