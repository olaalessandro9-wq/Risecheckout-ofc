# Guia de Testes: Validação de Segurança do Webhook Mercado Pago

**Data:** 12 de Dezembro de 2025  
**Versão da Função:** 144+  
**Objetivo:** Validar que a implementação de segurança está funcionando sem quebrar o fluxo existente

---

## 🎯 O Que Vamos Testar

1. ✅ **Teste Real:** Fazer uma compra de teste e verificar se o webhook funciona
2. 📊 **Verificar Logs:** Analisar os logs do Supabase para confirmar validação
3. 🔒 **Teste de Segurança:** Simular um webhook inválido e verificar se é rejeitado

---

## 📋 Teste 1: Compra Real no Ambiente de Teste

Este é o teste mais importante - garante que o fluxo completo está funcionando.

### Passo 1: Preparar o Ambiente de Teste

1. Acesse o RiseCheckout
2. Certifique-se de estar usando uma conta de teste do Mercado Pago
3. Verifique se o "Modo Teste" está ativado

### Passo 2: Criar um Produto de Teste

1. Crie um produto simples (ex: "Produto Teste - R$ 10,00")
2. Configure o checkout para usar Mercado Pago
3. Copie o link do checkout

### Passo 3: Fazer uma Compra de Teste

**Opção A: Pagamento com Cartão de Crédito (Mais Rápido)**

1. Acesse o link do checkout
2. Preencha os dados do comprador
3. Use um cartão de teste do Mercado Pago:
   - **Cartão:** `5031 4332 1540 6351`
   - **Validade:** Qualquer data futura (ex: 12/25)
   - **CVV:** `123`
   - **Nome:** Qualquer nome
   - **CPF:** `12345678909`

4. Finalize a compra

**Opção B: Pagamento com PIX (Mais Lento)**

1. Acesse o link do checkout
2. Escolha PIX como forma de pagamento
3. Copie o código PIX
4. Acesse o [Simulador de Pagamentos do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/testing)
5. Simule o pagamento do PIX

### Passo 4: Verificar o Resultado

**O que deve acontecer:**

1. ✅ O pedido deve aparecer no painel do RiseCheckout
2. ✅ O status do pedido deve mudar para "PAID" (Pago)
3. ✅ O webhook deve ter sido processado com sucesso

**Se algo der errado:**
- ❌ O status não mudou para "PAID" → Vamos verificar os logs (próximo teste)

---

## 📊 Teste 2: Verificar os Logs do Supabase

Vamos verificar se o webhook está chegando e sendo processado corretamente.

### Passo 1: Acessar os Logs

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto: `wivbtmtgpsxupfjwwovf`
3. No menu lateral, clique em **Edge Functions**
4. Clique na função **mercadopago-webhook**
5. Clique na aba **Logs**

### Passo 2: Analisar os Logs

**Logs de SUCESSO (o que você DEVE ver):**

```
[mercadopago-webhook] [v144] [INFO] 🚀 Webhook recebido - Versão 144 (Security Fix)
[mercadopago-webhook] [v144] [INFO] Webhook payload {"type":"payment","data":{"id":"12345678"}}
[mercadopago-webhook] [v144] [INFO] 🔒 Iniciando validação de assinatura (v144 - Security Fix)
[mercadopago-webhook] [v144] [INFO] Headers recebidos {"hasSignature":true,"hasRequestId":true}
[mercadopago-webhook] [v144] [INFO] Verificando idade do webhook {"age":2,"maxAge":300}
[mercadopago-webhook] [v144] [INFO] Comparando assinaturas {"expected":"abc123...","received":"abc123..."}
[mercadopago-webhook] [v144] [INFO] ✅ Assinatura validada com sucesso
[mercadopago-webhook] [v144] [INFO] ✅ Assinatura validada com sucesso - Prosseguindo com processamento
[mercadopago-webhook] [v144] [INFO] Buscando pedido {"paymentId":"12345678"}
[mercadopago-webhook] [v144] [INFO] Pedido encontrado {"orderId":"..."}
[mercadopago-webhook] [v144] [INFO] Atualizando pedido {"orderId":"...","newStatus":"PAID"}
[mercadopago-webhook] [v144] [INFO] Pedido atualizado com sucesso {"orderId":"..."}
```

**Logs de ERRO (o que você NÃO deve ver em um webhook legítimo):**

```
🔴 MERCADOPAGO_WEBHOOK_SECRET não configurado - REJEITANDO webhook
🔴 Headers de assinatura ausentes - REJEITANDO webhook
🔴 Assinatura não corresponde - REJEITANDO webhook
```

### Passo 3: Interpretar os Resultados

| Situação | O Que Significa | Ação |
| :--- | :--- | :--- |
| ✅ Vejo "Assinatura validada com sucesso" | Tudo funcionando perfeitamente! | Nenhuma ação necessária |
| 🔴 Vejo "MERCADOPAGO_WEBHOOK_SECRET não configurado" | O secret não está configurado no Supabase | Configurar o secret (vou te ajudar) |
| 🔴 Vejo "Assinatura não corresponde" | O secret está incorreto | Verificar se o secret está correto |
| ❌ Não vejo nenhum log | O webhook não está chegando | Verificar configuração no painel do MP |

---

## 🔒 Teste 3: Simular Webhook Inválido (Teste de Segurança)

Este teste confirma que a validação está **rejeitando** webhooks forjados.

### Opção A: Usar o Script Python (Recomendado)

**Passo 1: Preparar o Script**

```bash
# Navegar até o diretório do projeto
cd /home/ubuntu/risecheckout-84776

# Editar o script de teste
nano test_mercadopago_webhook_security.py
```

**Passo 2: Configurar o Secret**

Dentro do script, localize a linha:

```python
WEBHOOK_SECRET = "seu_secret_aqui"  # ⚠️ SUBSTITUIR
```

**IMPORTANTE:** Você precisa do secret real configurado no Supabase. Se não souber qual é, vou te ajudar a descobrir.

**Passo 3: Executar o Teste**

```bash
python3 test_mercadopago_webhook_security.py
```

**Resultado Esperado:**

```
TESTE 1: Webhook Válido (Assinatura Correta)
✅ PASSOU: Webhook válido foi aceito

TESTE 2: Webhook Sem Headers de Assinatura
✅ PASSOU: Webhook sem headers foi rejeitado (401)

TESTE 3: Webhook com Assinatura Inválida
✅ PASSOU: Webhook com assinatura inválida foi rejeitado (401)

TESTE 4: Webhook Expirado (Timestamp Antigo)
✅ PASSOU: Webhook expirado foi rejeitado (401)

TESTE 5: Webhook com Formato de Assinatura Incorreto
✅ PASSOU: Webhook com formato inválido foi rejeitado (401)

🎉 TODOS OS TESTES PASSARAM!
```

### Opção B: Teste Manual com cURL (Mais Simples)

Se você não quiser usar o script Python, pode fazer um teste manual:

```bash
# Teste 1: Enviar webhook SEM assinatura (deve ser rejeitado com 401)
curl -X POST https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/mercadopago-webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"payment","data":{"id":"12345678"}}'
```

**Resultado Esperado:**
```json
{
  "success": false,
  "error": "Assinatura do webhook inválida",
  "code": "MISSING_SIGNATURE_HEADERS"
}
```

**Status HTTP:** `400` ou `401`

---

## 🎯 Checklist de Validação

Marque cada item conforme você testa:

- [ ] **Teste 1 - Compra Real:** Fiz uma compra de teste e o status mudou para "PAID"
- [ ] **Teste 2 - Logs:** Vi nos logs a mensagem "✅ Assinatura validada com sucesso"
- [ ] **Teste 3 - Segurança:** Webhooks sem assinatura são rejeitados com erro 401/400

**Se todos os itens estiverem marcados:** 🎉 **A implementação está funcionando perfeitamente!**

---

## 🆘 Troubleshooting

### Problema 1: "MERCADOPAGO_WEBHOOK_SECRET não configurado"

**Solução:** Precisamos configurar o secret no Supabase.

1. Descubra qual é o secret:
   - Acesse o [Mercado Pago Developers](https://www.mercadopago.com.br/developers/panel)
   - Vá em **Suas integrações** > Selecione sua aplicação
   - Vá em **Webhooks** ou **Notificações**
   - Copie o **Secret**

2. Configure no Supabase:
   - Acesse o Supabase Dashboard
   - Vá em **Settings** > **Edge Functions** > **Secrets**
   - Adicione:
     - **Nome:** `MERCADOPAGO_WEBHOOK_SECRET`
     - **Valor:** O secret copiado do MP

### Problema 2: "Assinatura não corresponde"

**Possíveis Causas:**

1. O secret no Supabase está diferente do secret no Mercado Pago
2. O webhook está sendo enviado de uma aplicação diferente

**Solução:** Verificar se o secret está correto em ambos os lados.

### Problema 3: Webhook não está chegando

**Possíveis Causas:**

1. A URL do webhook não está configurada no Mercado Pago
2. O `verify_jwt` está como `true` (deve ser `false`)

**Solução:** Verificar a configuração no painel do MP e no Supabase.

---

## 📞 Precisa de Ajuda?

Se encontrar algum problema durante os testes, me avise e vou te ajudar a diagnosticar!

**Informações úteis para compartilhar:**

1. Print dos logs do Supabase
2. Mensagem de erro específica
3. Se a compra de teste foi criada ou não

---

**Boa sorte com os testes!** 🚀
