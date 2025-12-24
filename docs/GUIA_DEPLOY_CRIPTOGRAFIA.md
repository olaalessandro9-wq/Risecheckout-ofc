# Guia de Deploy: Criptografia de Credenciais

**Autor:** Manus AI  
**Data:** 12 de Dezembro de 2025  
**Versão:** 1.0

---

## 📋 Resumo

Este guia descreve como fazer o deploy das 3 Edge Functions criadas para implementar a criptografia de credenciais com Supabase Vault.

---

## 🚀 Opção 1: Deploy via Lovable (RECOMENDADO)

Como você trabalha com Lovable, o deploy será automático quando você fizer push para a branch `main` (que já foi feito).

**Verificar se o deploy foi feito:**

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/functions)
2. Verifique se as seguintes funções aparecem:
   - `save-vendor-credentials`
   - `migrate-credentials-to-vault`
3. Verifique se `mercadopago-create-payment` foi atualizada (versão mais recente)

---

## 🔧 Opção 2: Deploy via Supabase CLI

Se o deploy automático não funcionar, você pode fazer manualmente:

### Passo 1: Instalar Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
brew install supabase/tap/supabase
```

### Passo 2: Fazer Login

```bash
supabase login
```

### Passo 3: Linkar ao Projeto

```bash
cd /caminho/para/risecheckout-84776
supabase link --project-ref wivbtmtgpsxupfjwwovf
```

### Passo 4: Deploy das Funções

```bash
# Deploy save-vendor-credentials
supabase functions deploy save-vendor-credentials

# Deploy migrate-credentials-to-vault  
supabase functions deploy migrate-credentials-to-vault

# Deploy mercadopago-create-payment (atualização)
supabase functions deploy mercadopago-create-payment
```

---

## ✅ Passo 3: Executar a Migração

Depois que as funções estiverem deployadas, você precisa executar a migração **UMA ÚNICA VEZ**.

### Via cURL:

```bash
curl -X POST \
  'https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/migrate-credentials-to-vault' \
  -H 'Authorization: Bearer SEU_TOKEN_JWT_AQUI' \
  -H 'Content-Type: application/json'
```

**Como obter o token JWT:**
1. Faça login no RiseCheckout
2. Abra o DevTools (F12)
3. Vá em Application > Local Storage
4. Procure por `sb-wivbtmtgpsxupfjwwovf-auth-token`
5. Copie o valor do `access_token`

### Ou via Postman/Insomnia:

1. **Method:** POST
2. **URL:** `https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/migrate-credentials-to-vault`
3. **Headers:**
   - `Authorization: Bearer SEU_TOKEN_JWT`
   - `Content-Type: application/json`
4. **Body:** (vazio)

---

## 📊 Verificar Resultado da Migração

A resposta da migração será algo assim:

```json
{
  "success": true,
  "message": "Migração concluída",
  "summary": {
    "total": 5,
    "success": 5,
    "errors": 0
  },
  "results": [
    {
      "vendor_id": "abc-123",
      "integration_type": "mercadopago",
      "secrets_migrated": ["access_token", "refresh_token"],
      "status": "success"
    },
    ...
  ]
}
```

---

## 🧪 Testar se Funcionou

Depois da migração, faça um teste de compra:

1. Acesse um checkout
2. Faça uma compra de teste com cartão
3. Verifique os logs da função `mercadopago-create-payment`
4. Procure por: `"Usando credenciais de produção (Vault)"`

Se aparecer essa mensagem, significa que está funcionando! ✅

---

## 🔄 Rollback (Se Algo Der Errado)

Se algo der errado, você pode fazer rollback:

1. **Restaurar versão anterior da função:**
   ```bash
   supabase functions deploy mercadopago-create-payment --version VERSAO_ANTERIOR
   ```

2. **As credenciais antigas ainda estão na tabela** (a migração não deleta, apenas remove do campo `config`). Você pode restaurar manualmente se necessário.

---

## 📝 Checklist Final

- [ ] Funções deployadas no Supabase
- [ ] Migração executada com sucesso
- [ ] Teste de compra realizado
- [ ] Logs confirmam uso do Vault
- [ ] Nenhum erro nos logs

---

## 🆘 Troubleshooting

### Erro: "Access token não encontrado nem no Vault nem na tabela"

**Causa:** A migração não foi executada ou falhou.

**Solução:** Execute a migração novamente.

---

### Erro: "vault.decrypted_secrets: permission denied"

**Causa:** A função não tem permissão para acessar o Vault.

**Solução:** Verifique se a função está usando `SUPABASE_SERVICE_ROLE_KEY`.

---

### Erro: "Secret já existe no Vault"

**Causa:** A migração foi executada mais de uma vez.

**Solução:** Não é um problema. A migração deleta o secret existente antes de inserir.

---

## 📞 Próximos Passos

Depois que a migração estiver completa e testada:

1. ✅ Atualizar as outras funções (pushinpay, etc.) para ler do Vault
2. ✅ Atualizar o Dashboard do vendedor para usar `save-vendor-credentials`
3. ✅ Documentar o processo para a equipe

---

**Dúvidas?** Me avise que eu te ajudo! 🚀
