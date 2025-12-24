# Guia de Configuração: Webhook do PushinPay

**Data:** 17 de Dezembro de 2025  
**Status:** ✅ Edge Function Deployada e Ativa

## 🎯 Objetivo

Configurar o webhook do PushinPay para que os pagamentos sejam processados automaticamente, sem necessidade do usuário clicar em "Confirmar Pagamento".

## 📋 Pré-requisitos

- ✅ Edge Function `pushinpay-webhook` deployada (Versão 156)
- ✅ Secret `PUSHINPAY_WEBHOOK_TOKEN` configurado no Supabase
- ✅ Conta ativa no PushinPay

## 🔧 Passo a Passo

### 1. Verificar o Token no Supabase

Antes de configurar no PushinPay, você precisa saber qual é o token configurado no Supabase.

**Opção A: Via Dashboard do Supabase**
1. Acesse: https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf
2. Vá em **Settings** → **Edge Functions** → **Secrets**
3. Procure por `PUSHINPAY_WEBHOOK_TOKEN`
4. Copie o valor (você vai precisar dele no próximo passo)

**Opção B: Se o token não existir, crie um**
1. Gere um token aleatório seguro (ex: `openssl rand -base64 32`)
2. Adicione como secret no Supabase com o nome `PUSHINPAY_WEBHOOK_TOKEN`

### 2. Configurar Webhook no Painel do PushinPay

1. **Acesse o painel do PushinPay:**
   - Produção: https://app.pushinpay.com.br/app/settings
   - Sandbox: https://app-sandbox.pushinpay.com.br/app/settings

2. **Navegue até a seção "Webhooks"**

3. **Configure o Token:**
   - Localize o campo **"Token"**
   - Cole o valor de `PUSHINPAY_WEBHOOK_TOKEN` que você copiou do Supabase
   - Clique em **"Atualizar Token"** ou **"Salvar"**

4. **Verifique a URL do Webhook (se houver campo):**
   - Alguns painéis permitem configurar a URL diretamente
   - Se houver, use: `https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/pushinpay-webhook`

### 3. Testar a Configuração

1. **Crie um pedido de teste:**
   - Acesse seu checkout
   - Crie um pedido com PIX

2. **Pague o PIX:**
   - Use o ambiente de teste (sandbox)
   - Pague o PIX gerado

3. **Verifique os logs:**
   - Acesse: https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/logs/edge-functions
   - Filtre por `pushinpay-webhook`
   - Você deve ver logs como:
     ```
     [pushinpay-webhook] [v2] [INFO] Webhook recebido do PushinPay
     [pushinpay-webhook] [v2] [INFO] ✅ Token validado com sucesso
     [pushinpay-webhook] [v2] [INFO] ✅ Pedido atualizado com sucesso
     ```

4. **Verifique o status do pedido:**
   - No banco de dados, o pedido deve estar com status `paid`
   - O vendedor deve ter recebido o webhook (se configurado)

## 🔍 Troubleshooting

### Erro: "Token inválido"

**Causa:** O token configurado no PushinPay não corresponde ao secret no Supabase.

**Solução:**
1. Verifique o valor de `PUSHINPAY_WEBHOOK_TOKEN` no Supabase
2. Certifique-se de que o mesmo valor está no painel do PushinPay
3. Não deve haver espaços extras ou caracteres invisíveis

### Erro: "Pedido não encontrado"

**Causa:** O `payment_id` enviado pelo PushinPay não corresponde a nenhum pedido no banco.

**Solução:**
1. Verifique se o pedido foi criado corretamente
2. Verifique se o campo `payment_id` no banco corresponde ao `id` retornado pela API do PushinPay

### Webhook não está sendo recebido

**Causa:** O PushinPay pode não estar enviando webhooks.

**Solução:**
1. Verifique se o token está configurado no painel
2. Verifique se a URL está correta (se houver campo para configurar)
3. Entre em contato com o suporte do PushinPay para confirmar que os webhooks estão ativos

## 📊 Monitoramento

### Logs da Edge Function

**Acesse:**
```
https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/logs/edge-functions
```

**Filtre por:**
- Function: `pushinpay-webhook`
- Level: Todos ou apenas Errors

**Logs de Sucesso:**
```
[pushinpay-webhook] [v2] [INFO] Webhook recebido do PushinPay
[pushinpay-webhook] [v2] [INFO] ✅ Token validado com sucesso
[pushinpay-webhook] [v2] [INFO] Payload recebido {"id":"...","status":"paid"}
[pushinpay-webhook] [v2] [INFO] Processando evento {"order_id":"...","new_status":"paid"}
[pushinpay-webhook] [v2] [INFO] ✅ Pedido atualizado com sucesso
[pushinpay-webhook] [v2] [INFO] ✅ Outbound webhooks disparados
```

**Logs de Erro:**
```
[pushinpay-webhook] [v2] [WARN] Token ausente no header
[pushinpay-webhook] [v2] [WARN] Token inválido
[pushinpay-webhook] [v2] [ERROR] Pedido não encontrado
```

### Verificar Pedidos Processados

**Query SQL:**
```sql
SELECT 
  id,
  payment_id,
  status,
  created_at,
  updated_at
FROM orders
WHERE payment_id IS NOT NULL
  AND status = 'paid'
ORDER BY updated_at DESC
LIMIT 10;
```

### Verificar Eventos Registrados

**Query SQL:**
```sql
SELECT 
  order_id,
  event_type,
  event_data,
  created_at
FROM order_events
WHERE event_type LIKE 'pix.%'
ORDER BY created_at DESC
LIMIT 10;
```

## 🎉 Resultado Esperado

Após a configuração correta:

1. ✅ Usuário cria pedido e gera PIX
2. ✅ Usuário paga o PIX
3. ✅ **PushinPay envia webhook automaticamente**
4. ✅ **Edge Function valida token e processa evento**
5. ✅ **Pedido é atualizado para `paid` automaticamente**
6. ✅ **Vendedor recebe webhook (se configurado)**
7. ✅ Usuário vê "Pagamento Confirmado" (mesmo sem clicar em nada)

**Vantagem:** Sistema mais robusto com duas formas de detectar pagamento (webhook + polling).

---

**Guia criado por:** Manus AI  
**Data:** 17/12/2025  
**Versão da Edge Function:** 156
