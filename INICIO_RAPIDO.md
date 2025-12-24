# 🚀 Início Rápido - Integração PushinPay PIX

## ✅ Status Atual

**TODAS AS 4 EDGE FUNCTIONS FORAM DEPLOYADAS COM SUCESSO!**

As funções estão **ATIVAS** no Supabase, mas precisam dos **secrets configurados** para funcionar.

---

## 🎯 Próximos 3 Passos

### 1️⃣ Configurar Secrets (5 minutos)

**Acesse:** https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/settings/secrets

**Adicione os 6 secrets:**

```
ENCRYPTION_KEY = <GERE_COM: openssl rand -base64 32>
PLATFORM_PUSHINPAY_ACCOUNT_ID = <SEU_ACCOUNT_ID>
PLATFORM_FEE_PERCENT = 7.5
PUSHINPAY_BASE_URL_PROD = https://api.pushinpay.com.br/api
PUSHINPAY_BASE_URL_SANDBOX = https://api-sandbox.pushinpay.com.br/api
PUSHINPAY_WEBHOOK_TOKEN = <GERE_COM: openssl rand -base64 32>
```

**Como adicionar:**
- Clique em "Add Secret" ou "New Secret"
- Cole o **nome** exato (ex: `ENCRYPTION_KEY`)
- Cole o **valor** correspondente
- Clique em "Save"
- Repita para os 6 secrets

---

### 2️⃣ Testar Função encrypt-token (2 minutos)

Após configurar os secrets, teste se está funcionando:

```bash
curl -X POST https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/encrypt-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SEU_ANON_KEY>" \
  -d '{"token":"test_token_123"}'
```

**Resposta esperada:**
```json
{
  "encrypted": "base64_encrypted_string..."
}
```

✅ Se retornar o JSON acima, está funcionando!  
❌ Se retornar erro, verifique se os secrets foram salvos corretamente.

---

### 3️⃣ Configurar Webhook na PushinPay (3 minutos)

**Acesse o dashboard da PushinPay:**
- Vá em Configurações → Webhooks
- Adicione nova URL de webhook

**Configure:**
- **URL:** `https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/pushinpay-webhook`
- **Token:** `<SEU_WEBHOOK_TOKEN_CONFIGURADO>`
- **Eventos:** Marque todos (pix.paid, pix.expired, pix.canceled)

✅ Salve as configurações.

---

## 🎉 Pronto! Agora você pode usar

### No Frontend (RiseCheckout)

1. **Configure suas credenciais:**
   - Acesse a página **"Financeiro"**
   - Insira seu **Token PushinPay**
   - Selecione o **Ambiente** (Sandbox para testes, Produção para real)
   - Clique em **"Salvar Configurações"**

2. **Teste um pagamento:**
   - Crie um pedido de teste
   - Clique em **"Pagar com PIX"**
   - Copie o código PIX ou escaneie o QR Code
   - Pague (no Sandbox, simule o pagamento no dashboard PushinPay)
   - O status do pedido será atualizado automaticamente! 🎉

---

## 📚 Documentação Completa

- **CONFIGURAR_SECRETS.md** - Guia detalhado de configuração de secrets
- **DEPLOY_COMPLETO.md** - Resumo completo do deploy e funcionalidades
- **PLANO_FINAL_DEPLOY.md** - Plano técnico completo
- **INSTRUCOES_FINAIS.md** - Instruções finais em português

---

## 🆘 Precisa de Ajuda?

**Logs das Edge Functions:**
https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/functions

**Secrets configurados:**
https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/settings/secrets

---

**✅ Deploy: COMPLETO**  
**🔐 Secrets: AGUARDANDO CONFIGURAÇÃO**  
**🎯 Tempo estimado: 10 minutos**

Boa sorte! 🚀
