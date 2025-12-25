# ✅ Checklist Rápido - Deploy PushinPay

**Tempo Estimado:** 1h55min  
**Data:** 01/11/2025

---

## 🚀 Opção 1: Script Automatizado (Recomendado)

```bash
cd /path/to/risecheckout
./scripts/deploy-completo.sh
```

O script fará:
1. ✅ Configurar 6 secrets
2. ✅ Deploy de 4 Edge Functions
3. ✅ Guiar você nos testes
4. ✅ Validar checklist final

---

## 📋 Opção 2: Manual (Passo a Passo)

**IMPORTANTE:** Substitua os placeholders pelos valores reais:
- `<YOUR_PROJECT_REF>` → Seu project reference do Supabase
- `<YOUR_SUPABASE_ANON_KEY>` → Sua anon key do Supabase
- `<YOUR_ENCRYPTION_KEY>` → Sua chave de criptografia
- `<YOUR_ACCOUNT_ID>` → ID da conta PushinPay da plataforma
- `<YOUR_WEBHOOK_TOKEN>` → Token de segurança do webhook

### **Etapa 1: Secrets** ⏱️ 15 min

```bash
supabase secrets set ENCRYPTION_KEY="<YOUR_ENCRYPTION_KEY>" --project-ref <YOUR_PROJECT_REF>
supabase secrets set PLATFORM_PUSHINPAY_ACCOUNT_ID="<YOUR_ACCOUNT_ID>" --project-ref <YOUR_PROJECT_REF>
supabase secrets set PLATFORM_FEE_PERCENT="7.5" --project-ref <YOUR_PROJECT_REF>
supabase secrets set PUSHINPAY_BASE_URL_PROD="https://api.pushinpay.com.br/api" --project-ref <YOUR_PROJECT_REF>
supabase secrets set PUSHINPAY_BASE_URL_SANDBOX="https://api-sandbox.pushinpay.com.br/api" --project-ref <YOUR_PROJECT_REF>
supabase secrets set PUSHINPAY_WEBHOOK_TOKEN="<YOUR_WEBHOOK_TOKEN>" --project-ref <YOUR_PROJECT_REF>
```

- [ ] 6 secrets configuradas

---

### **Etapa 2: Deploy** ⏱️ 30 min

```bash
supabase functions deploy encrypt-token --no-verify-jwt --project-ref <YOUR_PROJECT_REF>
supabase functions deploy pushinpay-create-pix --no-verify-jwt --project-ref <YOUR_PROJECT_REF>
supabase functions deploy pushinpay-get-status --no-verify-jwt --project-ref <YOUR_PROJECT_REF>
supabase functions deploy pushinpay-webhook --project-ref <YOUR_PROJECT_REF>
```

- [ ] 4 Edge Functions deployadas

---

### **Etapa 3: Webhook** ⏱️ 10 min

Acesse: https://app.pushinpay.com.br/settings/webhooks

| Campo | Valor |
|-------|-------|
| URL | `https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/pushinpay-webhook` |
| Token | `<YOUR_WEBHOOK_TOKEN>` |
| Eventos | `pix.created`, `pix.paid`, `pix.expired`, `pix.canceled` |

- [ ] Webhook configurado

---

### **Etapa 4: Testes** ⏱️ 40 min

#### **Teste 1: encrypt-token**

```bash
curl -X POST https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/encrypt-token \
  -H "Content-Type: application/json" \
  -H "apikey: <YOUR_SUPABASE_ANON_KEY>" \
  -d '{"token":"teste123"}'
```

Esperado: `{"encrypted":"..."}`

- [ ] encrypt-token retorna 200 OK

---

#### **Teste 2: Salvar Integração**

1. Acesse: https://risecheckout.com/financeiro
2. Cole token de Sandbox da PushinPay
3. Selecione "Sandbox (testes)"
4. Clique em "Salvar integração"

Esperado: Toast de sucesso, sem erro 500

- [ ] Integração salva com sucesso

---

#### **Teste 3: Criar PIX**

1. Crie pedido de R$ 0,50
2. Selecione PIX
3. Aguarde QR Code

Esperado: QR Code exibido

- [ ] QR Code gerado

---

#### **Teste 4: Simular Pagamento**

1. Painel PushinPay → Transação
2. Simular Pagamento
3. Aguardar webhook

Esperado: Status "paid"

- [ ] Webhook recebido

---

#### **Teste 5: Validar Split**

1. Banco de dados → `payments_map`
2. Verificar `split_rules`

Esperado: 7.5% aplicado

- [ ] Split correto

---

### **Etapa 5: Validação** ⏱️ 20 min

- [ ] Todos os testes passaram
- [ ] Nenhum erro 500
- [ ] Split de 7.5% aplicado
- [ ] Webhook funcionando

---

## 🎯 Resultado Final

✅ Integração PushinPay 100% funcional  
✅ Erro 500 resolvido  
✅ PIX criado e pago em tempo real  
✅ Split automático funcionando  
✅ Webhook ativo e seguro

---

## 📚 Documentação Completa

- `DEPLOY_IMEDIATO.md` - Comandos prontos detalhados
- `RESUMO_EXECUTIVO_FINAL.md` - Visão geral completa
- `GUIA_QA_SANDBOX.md` - Roteiro de testes completo
- `CHECKLIST_CONCLUSAO.md` - Checklist de aceite (33 itens)

---

**Criado por:** Manus AI  
**Data:** 01/11/2025
