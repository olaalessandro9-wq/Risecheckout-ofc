# Arquitetura: Criptografia de Credenciais com Supabase Vault

**Autor:** Manus AI  
**Data:** 12 de Dezembro de 2025  
**Status:** Planejamento Arquitetural  
**Versão:** 1.0

---

## 1. Problema Atual

As credenciais de API (access tokens, API keys, secrets) dos vendedores estão armazenadas em **texto plano** na tabela `vendor_integrations`, campo `config` (JSONB).

**Exemplo do campo `config` atual:**
```json
{
  "access_token": "APP-1234567890-121212-abc123...",
  "public_key": "APP-...",
  "refresh_token": "TG-...",
  "webhook_secret": "whsec_..."
}
```

**Risco:** 🔴 **CRÍTICO**
- Se um atacante conseguir acesso ao banco de dados (SQL injection, credenciais vazadas, backup comprometido), terá acesso a **TODAS** as credenciais de **TODOS** os vendedores.
- Violação de compliance (PCI DSS, LGPD).

---

## 2. Solução Proposta: Supabase Vault

O **Supabase Vault** é um sistema de gerenciamento de secrets nativo do Supabase que:
- Armazena secrets em um schema separado (`vault.secrets`)
- Criptografa os secrets em repouso
- Permite acesso controlado via permissões SQL
- Fornece uma view descriptografada (`vault.decrypted_secrets`) acessível apenas por funções autorizadas

**Confirmação:** ✅ O Vault está disponível no projeto (verificado via SQL).

---

## 3. Arquitetura da Solução

### 3.1. Estrutura de Dados

**ANTES (Atual):**
```
vendor_integrations
├── id (uuid)
├── vendor_id (uuid)
├── integration_type (text) → "mercadopago", "pushinpay", etc.
├── config (jsonb) → { "access_token": "...", "public_key": "..." }
└── active (boolean)
```

**DEPOIS (Nova Arquitetura):**
```
vendor_integrations
├── id (uuid)
├── vendor_id (uuid)
├── integration_type (text)
├── config (jsonb) → { "public_key": "..." } ← Apenas dados NÃO sensíveis
└── active (boolean)

vault.secrets (gerenciado pelo Supabase)
├── id (uuid)
├── name (text) → "vendor_{vendor_id}_{integration_type}_access_token"
├── secret (text) → Criptografado automaticamente
└── created_at (timestamp)
```

**Convenção de Nomes:**
- `vendor_{vendor_id}_mercadopago_access_token`
- `vendor_{vendor_id}_mercadopago_refresh_token`
- `vendor_{vendor_id}_pushinpay_token`

---

### 3.2. Fluxo de Salvamento de Credenciais

**Quando um vendedor conecta uma integração (ex: Mercado Pago via OAuth):**

1. **Frontend** recebe o `access_token` do callback OAuth
2. **Frontend** chama Edge Function `save-vendor-credentials`
3. **Edge Function** salva:
   - Dados públicos (ex: `public_key`) → `vendor_integrations.config`
   - Dados sensíveis (ex: `access_token`) → `vault.secrets`
4. **Edge Function** retorna sucesso

**Código Conceitual:**
```typescript
// supabase/functions/save-vendor-credentials/index.ts
const { vendor_id, integration_type, access_token, public_key } = await req.json();

// 1. Salvar dados públicos na tabela normal
await supabase
  .from('vendor_integrations')
  .upsert({
    vendor_id,
    integration_type,
    config: { public_key }, // Apenas dados não sensíveis
    active: true
  });

// 2. Salvar access_token no Vault
await supabase.rpc('vault.create_secret', {
  secret_name: `vendor_${vendor_id}_${integration_type}_access_token`,
  secret_value: access_token
});
```

---

### 3.3. Fluxo de Leitura de Credenciais

**Quando uma Edge Function precisa usar as credenciais (ex: criar pagamento):**

1. **Edge Function** (`mercadopago-create-payment`) recebe `vendor_id`
2. **Edge Function** busca o `access_token` do Vault
3. **Edge Function** usa o token para chamar a API do Mercado Pago

**Código Conceitual:**
```typescript
// supabase/functions/mercadopago-create-payment/index.ts
const { vendor_id } = await req.json();

// 1. Buscar access_token do Vault
const { data: secrets } = await supabase
  .from('vault.decrypted_secrets')
  .select('secret')
  .eq('name', `vendor_${vendor_id}_mercadopago_access_token`)
  .single();

const accessToken = secrets?.secret;

// 2. Usar o token para criar pagamento
const mpAdapter = new MercadoPagoAdapter(accessToken, 'production');
const result = await mpAdapter.createCreditCard(paymentRequest);
```

---

### 3.4. Migração de Dados Existentes

**Script de Migração:**

Precisamos criar um script que:
1. Lê todos os registros de `vendor_integrations`
2. Para cada registro:
   - Extrai os secrets do campo `config`
   - Salva os secrets no `vault.secrets`
   - Remove os secrets do campo `config`
   - Atualiza o registro

**Código Conceitual:**
```typescript
// supabase/functions/migrate-credentials-to-vault/index.ts
const { data: integrations } = await supabase
  .from('vendor_integrations')
  .select('*');

for (const integration of integrations) {
  const { id, vendor_id, integration_type, config } = integration;
  
  // Extrair secrets do config
  const { access_token, refresh_token, webhook_secret, ...publicConfig } = config;
  
  // Salvar secrets no Vault
  if (access_token) {
    await supabase.rpc('vault.create_secret', {
      secret_name: `vendor_${vendor_id}_${integration_type}_access_token`,
      secret_value: access_token
    });
  }
  
  if (refresh_token) {
    await supabase.rpc('vault.create_secret', {
      secret_name: `vendor_${vendor_id}_${integration_type}_refresh_token`,
      secret_value: refresh_token
    });
  }
  
  // Atualizar config removendo secrets
  await supabase
    .from('vendor_integrations')
    .update({ config: publicConfig })
    .eq('id', id);
}
```

---

## 4. Impacto nas Edge Functions

### Funções que Precisam Ser Atualizadas:

| Função | O Que Muda |
| :--- | :--- |
| `mercadopago-create-payment` | Buscar `access_token` do Vault em vez da tabela |
| `pushinpay-create-pix` | Buscar `token` do Vault em vez da tabela |
| `mercadopago-oauth-callback` | Salvar `access_token` no Vault em vez da tabela |
| **NOVA:** `save-vendor-credentials` | Criar nova função para salvar credenciais no Vault |
| **NOVA:** `migrate-credentials-to-vault` | Criar script de migração one-time |

---

## 5. Permissões e Segurança

### Permissões do Vault:

**Quem pode acessar `vault.decrypted_secrets`?**
- ✅ Edge Functions (via Service Role Key)
- ❌ Frontend (via anon key)
- ❌ Usuários autenticados (via auth.uid())

**Como garantir isso?**
- O Vault já vem com RLS ativado por padrão
- Apenas funções com `SUPABASE_SERVICE_ROLE_KEY` podem acessar

---

## 6. Plano de Rollback

**Se algo der errado:**

1. **Backup:** Antes da migração, fazer backup da tabela `vendor_integrations`
2. **Rollback:** Restaurar o backup se necessário
3. **Validação:** Testar em ambiente de dev antes de produção

---

## 7. Checklist de Implementação

- [ ] Criar Edge Function `save-vendor-credentials`
- [ ] Criar Edge Function `migrate-credentials-to-vault` (script one-time)
- [ ] Atualizar `mercadopago-create-payment` para ler do Vault
- [ ] Atualizar `pushinpay-create-pix` para ler do Vault
- [ ] Atualizar `mercadopago-oauth-callback` para salvar no Vault
- [ ] Fazer backup da tabela `vendor_integrations`
- [ ] Executar script de migração
- [ ] Validar que as integrações ainda funcionam
- [ ] Documentar o processo

---

## 8. Próximos Passos

Você aprova esta arquitetura? Podemos começar a implementar?

**Ordem de Implementação Sugerida:**
1. Criar `save-vendor-credentials` (nova função)
2. Atualizar `mercadopago-create-payment` (ler do Vault)
3. Criar `migrate-credentials-to-vault` (script de migração)
4. Executar migração em dev
5. Testar
6. Executar migração em produção
