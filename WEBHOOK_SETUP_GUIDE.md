# Guia de Configuração do Webhook do Mercado Pago

## 📋 Resumo

Este guia explica como configurar o webhook do Mercado Pago para receber notificações automáticas de pagamento e atualizar os pedidos no RiseCheckout.

---

## ✅ Status Atual

- ✅ Edge Function `mercadopago-webhook` criada (versão 9)
- ✅ Código do webhook implementado e deployado
- ✅ Busca pedidos pelo campo correto (`gateway_payment_id`)
- ✅ Atualiza status automaticamente
- ✅ Dispara webhook do vendedor quando pagamento é aprovado
- ⚠️ **PENDENTE:** Desabilitar JWT e configurar URL no Mercado Pago

---

## 🔧 Passo 1: Desabilitar JWT no Supabase Dashboard

### Por que preciso fazer isso?
O Mercado Pago não envia token JWT de autenticação. Se o JWT estiver habilitado, todas as notificações serão bloqueadas.

### Como fazer:

1. **Acesse o Supabase Dashboard:**
   - URL: https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/functions

2. **Encontre a função `mercadopago-webhook`:**
   - Na lista de Edge Functions, clique em `mercadopago-webhook`

3. **Desabilite o JWT:**
   - Procure pela opção "Verify JWT" ou "JWT Verification"
   - **Desabilite** essa opção
   - Salve as alterações

---

## 🌐 Passo 2: Configurar Webhook no Mercado Pago

### URL do Webhook:
```
https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/mercadopago-webhook
```

### Como configurar:

1. **Acesse o painel do Mercado Pago:**
   - URL: https://www.mercadopago.com.br/developers/panel/app/2354396984038370/webhooks
   - (Você já estava nessa página nas screenshots)

2. **Clique em "Configurar notificações"**

3. **Configure a URL:**
   - **Modo de teste:** Cole a URL do webhook acima
   - **Modo de produção:** Cole a mesma URL (funciona para ambos)

4. **Selecione os eventos:**
   - ✅ **Pagamentos** (obrigatório)
   - ✅ **Order (Mercado Pago)** (opcional, mas recomendado)
   - Outros eventos são opcionais

5. **Salve a configuração**

---

## 🧪 Passo 3: Testar o Webhook

### Teste com Cartão de Crédito:

1. **Faça um pagamento de teste** usando cartão de crédito
2. **Aguarde alguns segundos** (o MP pode demorar até 30s para enviar a notificação)
3. **Verifique os logs** no Supabase Dashboard:
   - Vá em: Edge Functions > mercadopago-webhook > Logs
   - Procure por mensagens como:
     - `🔔 Webhook recebido do Mercado Pago`
     - `✅ Pedido encontrado`
     - `💳 Status do pagamento no MP: approved`
     - `✅ Pedido atualizado com sucesso!`

4. **Verifique o banco de dados:**
   - Abra a tabela `orders`
   - Encontre o pedido pelo `gateway_payment_id`
   - Verifique se o `status` mudou para `PAID`
   - Verifique se o `payment_status` mudou para `PAID`

---

## 📊 Eventos do Webhook

O webhook processa os seguintes status do Mercado Pago:

| Status MP | Status Order | Payment Status | Descrição |
|-----------|--------------|----------------|-----------|
| `approved` | `PAID` | `PAID` | Pagamento aprovado ✅ |
| `pending` | `PENDING` | `PENDING` | Aguardando pagamento ⏳ |
| `in_process` | `PENDING` | `PENDING` | Processando pagamento 🔄 |
| `in_mediation` | `PENDING` | `PENDING` | Em mediação ⚖️ |
| `rejected` | `CANCELLED` | `FAILED` | Pagamento rejeitado ❌ |
| `cancelled` | `CANCELLED` | `FAILED` | Pagamento cancelado 🚫 |
| `refunded` | `REFUNDED` | `REFUNDED` | Pagamento estornado 💸 |
| `charged_back` | `REFUNDED` | `REFUNDED` | Chargeback 🔙 |

---

## 🔍 Troubleshooting

### Webhook não está recebendo notificações:

1. **Verifique se o JWT está desabilitado** no Supabase Dashboard
2. **Verifique se a URL está correta** no painel do Mercado Pago
3. **Verifique os logs** no Supabase para ver se há erros
4. **Teste manualmente** enviando um POST para a URL do webhook:
   ```bash
   curl -X POST https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/mercadopago-webhook \
     -H "Content-Type: application/json" \
     -d '{"type":"payment","data":{"id":"123456789"}}'
   ```

### Pedido não está sendo atualizado:

1. **Verifique se o `gateway_payment_id` está sendo salvo** corretamente no pedido
2. **Verifique os logs** para ver se o pedido foi encontrado
3. **Verifique as credenciais** do Mercado Pago na tabela `vendor_integrations`

### Webhook do vendedor não está sendo disparado:

1. **Verifique se existe uma integração WEBHOOK** ativa na tabela `vendor_integrations`
2. **Verifique se o `webhook_url` está configurado** corretamente
3. **Verifique os logs** para ver se houve erro ao disparar o webhook

---

## 📝 Código do Webhook

O webhook implementa as seguintes funcionalidades:

1. **Recebe notificação do MP** com tipo e ID do pagamento
2. **Valida tipo de evento** (processa apenas `payment`)
3. **Busca pedido no banco** usando `gateway_payment_id`
4. **Busca credenciais do MP** do vendedor
5. **Consulta detalhes do pagamento** na API do Mercado Pago
6. **Mapeia status** do MP para status do RiseCheckout
7. **Atualiza pedido** no banco de dados
8. **Dispara webhook do vendedor** se pagamento foi aprovado

---

## 🔗 Links Úteis

- [Documentação Webhooks MP](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [Painel de Webhooks MP](https://www.mercadopago.com.br/developers/panel/app/2354396984038370/webhooks)
- [Supabase Dashboard](https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/functions)
- [Logs do Webhook](https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/functions/mercadopago-webhook/logs)

---

## ⚠️ Importante

- **Sempre teste em modo de teste primeiro** antes de configurar em produção
- **Nunca compartilhe** a URL do webhook publicamente (embora seja pública, não deve ser divulgada)
- **Monitore os logs** regularmente para detectar problemas
- **O webhook retorna sempre 200 OK** para evitar retry infinito do Mercado Pago

---

**Data:** 19 de Novembro de 2025  
**Versão do Webhook:** v9  
**Status:** Pronto para configuração
