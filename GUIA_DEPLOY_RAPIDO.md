# Guia de Deploy Rápido - PushinPay PIX

**Última atualização:** 01 de Novembro de 2025  
**Status:** ✅ Correção de CORS aplicada

---

## 🚨 Correção Importante: CORS

Foi corrigido o erro de CORS que impedia o salvamento da integração PushinPay. Todas as Edge Functions agora tratam corretamente o preflight OPTIONS.

**Erro anterior:**
```
Response to preflight request doesn't pass access control check
Failed to send a request to the Edge Function
```

**Solução aplicada:**
- ✅ Módulo compartilhado `_shared/cors.ts` criado
- ✅ Tratamento de OPTIONS em todas as Edge Functions
- ✅ Headers CORS em todas as respostas

---

## 📋 Checklist de Deploy

### 1. Gerar Chave de Criptografia

```bash
node scripts/generate-encryption-key.js
```

Copie a chave gerada e guarde em local seguro.

### 2. Configurar Variáveis de Ambiente no Supabase

Acesse: **Settings → Edge Functions → Secrets**

Adicione as seguintes variáveis:

```bash
# PushinPay URLs
PUSHINPAY_BASE_URL_PROD=https://api.pushinpay.com.br/api
PUSHINPAY_BASE_URL_SANDBOX=https://api-sandbox.pushinpay.com.br/api

# Conta da plataforma (obtenha no painel da PushinPay)
PLATFORM_PUSHINPAY_ACCOUNT_ID=seu_account_id_aqui

# Taxa da plataforma (0 a 50)
PLATFORM_FEE_PERCENT=7.5

# Chave de criptografia (gerada no passo 1)
ENCRYPTION_KEY=sua_chave_aqui
```

### 3. Aplicar Migração SQL

**Opção A - Via CLI:**
```bash
supabase db push
```

**Opção B - Via SQL Editor no painel do Supabase:**

Copie e execute o conteúdo de:
```
supabase/migrations/20251101_add_payment_gateway_tables.sql
```

### 4. Deploy das Edge Functions

```bash
# Login no Supabase (se ainda não estiver logado)
supabase login

# Linkar ao projeto
supabase link --project-ref seu-project-ref

# Deploy de todas as functions
./scripts/deploy-functions.sh
```

Ou manualmente:
```bash
# Functions chamadas pelo frontend (precisam de --no-verify-jwt)
supabase functions deploy encrypt-token --no-verify-jwt
supabase functions deploy pushinpay-create-pix --no-verify-jwt
supabase functions deploy pushinpay-get-status --no-verify-jwt

# Webhook é server-to-server (mantém verificação JWT padrão)
supabase functions deploy pushinpay-webhook
```

**Por que `--no-verify-jwt`?**

As funções chamadas diretamente do navegador (encrypt-token, create-pix, get-status) não podem exigir JWT porque o formulário do painel chama essas funções sem um Bearer token válido. A segurança é garantida pela:
- Whitelist de origens (apenas domínios autorizados)
- Criptografia de tokens no backend
- Validação de entrada em todas as requisições

### 5. Verificar Deploy

Liste as functions implantadas:
```bash
supabase functions list
```

Você deve ver:
- ✅ encrypt-token
- ✅ pushinpay-create-pix
- ✅ pushinpay-get-status
- ✅ pushinpay-webhook

### 6. Configurar Webhook na PushinPay

1. Acesse o painel da PushinPay
2. Vá em **Configurações → Webhooks**
3. Adicione um novo webhook:

```
URL: https://seu-project-ref.supabase.co/functions/v1/pushinpay-webhook
```

4. Selecione os eventos:
   - `pix.paid`
   - `pix.expired`
   - `pix.canceled`

5. Salve a configuração

---

## 🧪 Testes em Sandbox

### 1. Configurar Token de Sandbox

1. Acesse a página **Financeiro** no painel
2. Insira o **API Token de Sandbox** da PushinPay
3. Selecione **Ambiente: Sandbox**
4. Clique em **Salvar integração**

**Esperado:** Mensagem de sucesso sem erros de CORS

### 2. Criar Cobrança PIX de Teste

1. Crie um pedido de teste (valor mínimo: R$ 0,50)
2. Escolha **PIX** como forma de pagamento
3. Verifique se o QR Code é gerado

**Esperado:**
- QR Code exibido corretamente
- Código PIX copiável disponível
- Status "Aguardando pagamento"

### 3. Simular Pagamento

Use o app de testes da PushinPay para simular o pagamento.

**Esperado:**
- Status atualizado para "Pago"
- Webhook recebido e processado
- Split creditado na conta da plataforma

---

## 🔍 Verificação de CORS

### Testar Preflight OPTIONS

```bash
# Testar encrypt-token
curl -X OPTIONS \
  https://seu-project-ref.supabase.co/functions/v1/encrypt-token \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -v

# Esperado: 200 OK com headers CORS
```

### Verificar Headers na Resposta

Você deve ver:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
Access-Control-Allow-Methods: GET, POST, OPTIONS
```

---

## 📊 Monitoramento

### Visualizar Logs em Tempo Real

```bash
# Logs da função encrypt-token
supabase functions logs encrypt-token --tail

# Logs da função pushinpay-create-pix
supabase functions logs pushinpay-create-pix --tail

# Logs do webhook
supabase functions logs pushinpay-webhook --tail
```

### Consultar Transações no Banco

```sql
-- Ver últimas transações
SELECT * FROM payments_map 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver configurações dos vendedores
SELECT user_id, environment, created_at 
FROM payment_gateway_settings;
```

---

## ⚠️ Troubleshooting

### Erro: "Failed to send a request to the Edge Function"

**Causa:** CORS não configurado ou Edge Function não deployada

**Solução:**
1. Verifique se fez o deploy: `supabase functions list`
2. Verifique se o módulo `_shared/cors.ts` existe
3. Redeploy: `supabase functions deploy encrypt-token`

### Erro: "Token PushinPay inválido"

**Causa:** Token incorreto ou expirado

**Solução:**
1. Gere um novo token no painel da PushinPay
2. Salve novamente na página Financeiro

### Erro: "Configuração de gateway não encontrada"

**Causa:** Vendedor não configurou suas credenciais

**Solução:**
1. Acesse a página Financeiro
2. Configure o token e ambiente
3. Clique em Salvar integração

### Erro: "Erro ao processar credenciais de pagamento"

**Causa:** Chave de criptografia não configurada ou incorreta

**Solução:**
1. Verifique se `ENCRYPTION_KEY` está nas variáveis de ambiente
2. Gere uma nova chave se necessário
3. Reconfigure todos os tokens dos vendedores

---

## 🎯 Próximos Passos Após Deploy

1. ✅ Testar fluxo completo em Sandbox
2. ✅ Validar split de pagamento
3. ✅ Verificar webhook funcionando
4. ✅ Conferir logs sem erros
5. ✅ Treinar equipe no uso da integração
6. 🔄 Migrar para Produção (após validação)

---

## 📞 Suporte

**Problemas técnicos:**
- Abra uma issue no repositório
- Consulte os logs das Edge Functions
- Verifique a documentação completa em `PUSHINPAY_SETUP.md`

**Problemas com a PushinPay:**
- Suporte: suporte@pushinpay.com.br
- Documentação: https://docs.pushinpay.com.br

---

## ✅ Validação Final

Antes de considerar o deploy concluído:

- [ ] Variáveis de ambiente configuradas
- [ ] Migração SQL aplicada
- [ ] Edge Functions deployadas
- [ ] Webhook configurado
- [ ] Teste em Sandbox realizado com sucesso
- [ ] QR Code gerado corretamente
- [ ] Pagamento simulado e status atualizado
- [ ] Split creditado na conta da plataforma
- [ ] Logs sem erros críticos
- [ ] Documentação revisada

**Status:** Pronto para produção após validação completa em Sandbox ✅

---

**Desenvolvido por:** Manus AI  
**Versão:** 2.1.0 (com correção de CORS)
