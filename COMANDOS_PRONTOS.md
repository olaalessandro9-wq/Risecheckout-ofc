# 🚀 COMANDOS PRONTOS - Deploy PushinPay

**Copie e cole os blocos abaixo no terminal.**  
**NÃO é necessário substituir nenhum valor!**

---

## ⚡ Opção 1: Comandos Rápidos (Copiar/Colar)

### **Bloco 1: Gerar e Configurar Secrets**

```bash
# (1) Gere uma ENCRYPTION_KEY forte (32 bytes em base64) e grave nas secrets
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

# (2) Grave TODAS as secrets no seu projeto Supabase
supabase secrets set ENCRYPTION_KEY="$ENCRYPTION_KEY" --project-ref wivbtmtgpsxupfjwwovf
supabase secrets set PLATFORM_PUSHINPAY_ACCOUNT_ID="9F73D854-4DA8-45E1-AFB6-9A8F803EFB7A" --project-ref wivbtmtgpsxupfjwwovf
supabase secrets set PLATFORM_FEE_PERCENT="7.5" --project-ref wivbtmtgpsxupfjwwovf
supabase secrets set PUSHINPAY_BASE_URL_PROD="https://api.pushinpay.com.br/api" --project-ref wivbtmtgpsxupfjwwovf
supabase secrets set PUSHINPAY_BASE_URL_SANDBOX="https://api-sandbox.pushinpay.com.br/api" --project-ref wivbtmtgpsxupfjwwovf
supabase secrets set PUSHINPAY_WEBHOOK_TOKEN="<REDACTED_WEBHOOK_TOKEN>" --project-ref wivbtmtgpsxupfjwwovf
```

---

### **Bloco 2: Deploy das Edge Functions**

```bash
# (3) Deploy das 4 Edge Functions (ordem importa)
supabase functions deploy encrypt-token        --no-verify-jwt --project-ref wivbtmtgpsxupfjwwovf
supabase functions deploy pushinpay-create-pix --no-verify-jwt --project-ref wivbtmtgpsxupfjwwovf
supabase functions deploy pushinpay-get-status --no-verify-jwt --project-ref wivbtmtgpsxupfjwwovf
supabase functions deploy pushinpay-webhook                   --project-ref wivbtmtgpsxupfjwwovf
```

---

### **Bloco 3: Teste Rápido (Opcional)**

```bash
# (4) Teste rápido da encrypt-token (confirma 200 OK)
# SUBSTITUA <SUPABASE_ANON_KEY> pela sua chave anon
curl -X POST "https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/encrypt-token" \
  -H "Content-Type: application/json" \
  -H "apikey: <SUPABASE_ANON_KEY>" \
  -d '{"token":"token_teste_123"}'
```

**Resultado esperado:**
```json
{"encrypted":"..."}
```

---

## 🌐 Configuração do Webhook na PushinPay

Acesse: https://app.pushinpay.com.br/settings/webhooks

| Campo | Valor |
|-------|-------|
| **URL** | `https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/pushinpay-webhook` |
| **Header** | `x-pushinpay-token: <REDACTED_WEBHOOK_TOKEN>` |
| **Eventos** | `pix.created`, `pix.paid`, `pix.expired`, `pix.canceled` |

---

## 🔧 Opção 2: Script Automatizado

Se preferir rodar como script:

```bash
cd /path/to/risecheckout
./scripts/deploy_final.sh
```

O script fará:
1. ✅ Gerar ENCRYPTION_KEY automaticamente
2. ✅ Configurar 6 secrets
3. ✅ Deploy de 4 Edge Functions
4. ✅ Exibir instruções finais

---

## 📊 Valores Configurados

| Item | Valor |
|------|-------|
| **Project Ref** | `wivbtmtgpsxupfjwwovf` |
| **Account ID PushinPay** | `9F73D854-4DA8-45E1-AFB6-9A8F803EFB7A` |
| **Webhook Token** | `<REDACTED_WEBHOOK_TOKEN>` |
| **Taxa da Plataforma** | `7.5%` |
| **URL Produção** | `https://api.pushinpay.com.br/api` |
| **URL Sandbox** | `https://api-sandbox.pushinpay.com.br/api` |

---

## ✅ Checklist Rápido

- [ ] Bloco 1 executado (6 secrets configuradas)
- [ ] Bloco 2 executado (4 Edge Functions deployadas)
- [ ] Webhook configurado na PushinPay
- [ ] Teste encrypt-token (200 OK)
- [ ] Salvar integração no frontend (sem erro 500)
- [ ] Criar cobrança PIX (QR Code gerado)
- [ ] Simular pagamento (webhook recebido)
- [ ] Split de 7.5% aplicado

---

## 🎯 Resultado Esperado

Após executar os comandos:

✅ Nenhum erro 500 no console  
✅ Integração PushinPay 100% funcional  
✅ Criação e pagamento de PIX em tempo real  
✅ Split automático de 7.5% aplicado  
✅ Webhook ativo e seguro

---

## 📚 Documentação Completa

- `DEPLOY_IMEDIATO.md` - Guia detalhado com troubleshooting
- `CHECKLIST_RAPIDO.md` - Referência rápida
- `RESUMO_EXECUTIVO_FINAL.md` - Visão geral completa
- `GUIA_QA_SANDBOX.md` - Roteiro de testes completo

---

## 💡 Por Que a ENCRYPTION_KEY é Gerada na Hora?

É obrigatório que seja **aleatória e segura** (32 bytes).

Gerando no momento do deploy você evita:
- ❌ Chave fraca ou repetida
- ❌ Erro 500 na encrypt-token
- ❌ Vazamento de chave em commits

---

**Criado por:** Manus AI  
**Data:** 01/11/2025  
**Versão:** 2.0 (Account ID Atualizado)
