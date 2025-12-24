# INSTRUÇÕES FINAIS PARA MANUS - INTEGRAÇÃO PUSHINPAY

## OBJETIVO

Concluir as configurações pós-deploy no Supabase e no Painel da PushinPay para permitir que o checkout gere e valide PIX corretamente (ambientes Sandbox e Produção).

---

## ETAPA 1 - CONFIGURAR O WEBHOOK NA PUSHINPAY

### 1. Acesse o painel da PushinPay:
https://app.pushinpay.com.br/settings/webhooks

### 2. Adicione o seguinte webhook (para produção e sandbox):

| Campo | Valor |
|-------|-------|
| **URL** | `https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/pushinpay-webhook` |
| **Token (x-pushinpay-token)** | `<SEU_TOKEN_CONFIGURADO>` |
| **Eventos** | `pix.created`, `pix.paid`, `pix.expired`, `pix.canceled` |

### 3. Salve as configurações.

---

## ETAPA 2 - CONFIRMAR SECRETS NO SUPABASE

Confirme no painel do Supabase > Project Settings > Secrets se constam as seguintes chaves:

- ✅ `ENCRYPTION_KEY` (gerado automaticamente)
- ✅ `PLATFORM_PUSHINPAY_ACCOUNT_ID` = `<SEU_ACCOUNT_ID>`
- ✅ `PLATFORM_FEE_PERCENT` = `7.5`
- ✅ `PUSHINPAY_BASE_URL_PROD` = `https://api.pushinpay.com.br/api`
- ✅ `PUSHINPAY_BASE_URL_SANDBOX` = `https://api-sandbox.pushinpay.com.br/api`
- ✅ `PUSHINPAY_WEBHOOK_TOKEN` = `<SEU_TOKEN_SEGURO>`

**Link direto:** https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/settings/secrets

---

## ETAPA 3 - DEPLOY DAS EDGE FUNCTIONS

Executar caso o script não tenha completado alguma função:

```bash
supabase functions deploy encrypt-token --no-verify-jwt --project-ref wivbtmtgpsxupfjwwovf

supabase functions deploy pushinpay-create-pix --no-verify-jwt --project-ref wivbtmtgpsxupfjwwovf

supabase functions deploy pushinpay-get-status --no-verify-jwt --project-ref wivbtmtgpsxupfjwwovf

supabase functions deploy pushinpay-webhook --project-ref wivbtmtgpsxupfjwwovf
```

---

## ETAPA 4 - TESTES DE VALIDAÇÃO

### **Teste 1: Criptografia**

```bash
curl -X POST https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/encrypt-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SEU_ANON_KEY>" \
  -d '{"token": "test_token_123"}'
```

**Resposta esperada:**
```json
{"encrypted":"<ENCRYPTED_STRING>"}
```

### **Teste 2: Criar PIX**

```bash
curl -X POST https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/pushinpay-create-pix \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SEU_ANON_KEY>" \
  -d '{
    "vendor_id": "<UUID_DO_VENDEDOR>",
    "value_cents": 1000,
    "description": "Teste PIX"
  }'
```

---

## ETAPA 5 - CONFIGURAR FRONTEND

1. Acesse a página **Financeiro** no RiseCheckout
2. Insira seu **Token PushinPay**
3. Selecione o **Ambiente** (Sandbox ou Produção)
4. Clique em **Salvar Configurações**

---

## CHECKLIST FINAL

- [ ] Webhook configurado no PushinPay
- [ ] 6 Secrets configuradas no Supabase
- [ ] 4 Edge Functions deployadas
- [ ] Teste de criptografia funcionando
- [ ] Teste de PIX funcionando
- [ ] Frontend configurado

---

## LINKS ÚTEIS

- **Supabase Secrets:** https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/settings/secrets
- **Edge Functions:** https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/functions
- **PushinPay Webhooks:** https://app.pushinpay.com.br/settings/webhooks

---

**✅ Após completar estas etapas, a integração estará 100% operacional!**
