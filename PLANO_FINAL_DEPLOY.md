# 🎯 PLANO DE AÇÃO FINAL – Integração PushinPay

## Situação Atual

✅ **Código e documentação da integração 100% corretos** segundo o relatório técnico.

⚠️ **Falta apenas:**
- Configuração correta das secrets no Supabase
- Redeploy das 4 Edge Functions

❌ **O erro 500 ocorre porque:**
- `ENCRYPTION_KEY` não está configurada corretamente
- `PLATFORM_PUSHINPAY_ACCOUNT_ID` estava divergente em alguns scripts

---

## 1️⃣ Configurar todas as secrets no Supabase

Rode este bloco completo no terminal, dentro do projeto RiseCheckout, logado no Supabase CLI.

```bash
# Gerar uma ENCRYPTION_KEY forte (32 bytes base64)
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

# Definir todas as secrets
supabase secrets set ENCRYPTION_KEY="$ENCRYPTION_KEY" --project-ref wivbtmtgpsxupfjwwovf

supabase secrets set PLATFORM_PUSHINPAY_ACCOUNT_ID="<SEU_ACCOUNT_ID>" --project-ref wivbtmtgpsxupfjwwovf

supabase secrets set PLATFORM_FEE_PERCENT="7.5" --project-ref wivbtmtgpsxupfjwwovf

supabase secrets set PUSHINPAY_BASE_URL_PROD="https://api.pushinpay.com.br/api" --project-ref wivbtmtgpsxupfjwwovf

supabase secrets set PUSHINPAY_BASE_URL_SANDBOX="https://api-sandbox.pushinpay.com.br/api" --project-ref wivbtmtgpsxupfjwwovf

supabase secrets set PUSHINPAY_WEBHOOK_TOKEN="<GERE_UM_TOKEN_SEGURO>" --project-ref wivbtmtgpsxupfjwwovf
```

> 📝 **Nota:** Substitua os valores `<PLACEHOLDER>` pelos valores reais.

---

## 2️⃣ Fazer deploy das 4 Edge Functions

Execute na ordem abaixo — as três primeiras com `--no-verify-jwt`, o webhook sem.

```bash
supabase functions deploy encrypt-token        --no-verify-jwt --project-ref wivbtmtgpsxupfjwwovf

supabase functions deploy pushinpay-create-pix --no-verify-jwt --project-ref wivbtmtgpsxupfjwwovf

supabase functions deploy pushinpay-get-status --no-verify-jwt --project-ref wivbtmtgpsxupfjwwovf

supabase functions deploy pushinpay-webhook                   --project-ref wivbtmtgpsxupfjwwovf
```

### ✅ Validação

Depois disso, confira se todas aparecem como deployadas:

```bash
supabase functions list --project-ref wivbtmtgpsxupfjwwovf
```

---

## 3️⃣ Testar encrypt-token

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

---

## 4️⃣ Configurar Webhook no PushinPay

1. Acesse o painel do PushinPay
2. Vá em Configurações → Webhooks
3. Adicione:
   - **URL:** `https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/pushinpay-webhook`
   - **Token:** O mesmo valor configurado em `PUSHINPAY_WEBHOOK_TOKEN`
   - **Eventos:** Todos relacionados a PIX

---

## 5️⃣ Testar Fluxo Completo

1. Acesse a página Financeiro no RiseCheckout
2. Configure suas credenciais PushinPay
3. Crie um pagamento PIX de teste
4. Verifique se o QR Code é exibido
5. Confirme se o webhook atualiza o status

---

## ✅ Checklist Final

- [ ] Secrets configuradas no Supabase
- [ ] Edge Functions deployadas
- [ ] encrypt-token retornando JSON válido
- [ ] Webhook configurado no PushinPay
- [ ] Teste de PIX completo funcionando

---

**🎯 Após estas etapas, a integração PushinPay estará 100% operacional!**
