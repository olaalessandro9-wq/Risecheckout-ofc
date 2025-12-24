# Guia de Configuração: PushinPay PIX com Split de Pagamento

Este documento fornece instruções completas para configurar e fazer o deploy da integração PushinPay no projeto RiseCheckout.

## 📋 Pré-requisitos

1. **Conta PushinPay**: Crie uma conta em [pushinpay.com.br](https://pushinpay.com.br)
2. **Supabase CLI**: Instale o CLI do Supabase
   ```bash
   npm install -g supabase
   ```
3. **Acesso ao projeto Supabase**: Credenciais de administrador do projeto

## 🔐 Passo 1: Gerar Chave de Criptografia

A chave de criptografia é usada para proteger os tokens da PushinPay no banco de dados.

```bash
# Gerar uma chave aleatória de 32 bytes em base64
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Salve esta chave - você precisará dela nas variáveis de ambiente.

## 🗄️ Passo 2: Aplicar Migrações do Banco de Dados

Execute a migração SQL no Supabase para criar as tabelas necessárias:

```bash
cd supabase
supabase db push
```

Ou aplique manualmente via SQL Editor no painel do Supabase:

```sql
-- Arquivo: supabase/migrations/20251101_add_payment_gateway_tables.sql
-- (Conteúdo completo disponível no arquivo)
```

## ⚙️ Passo 3: Configurar Variáveis de Ambiente

### 3.1 Edge Functions

Configure as seguintes variáveis de ambiente no Supabase (Settings → Edge Functions → Secrets):

```bash
# PushinPay
PUSHINPAY_BASE_URL_PROD=https://api.pushinpay.com.br/api
PUSHINPAY_BASE_URL_SANDBOX=https://api-sandbox.pushinpay.com.br/api
PLATFORM_PUSHINPAY_ACCOUNT_ID=<SEU_ACCOUNT_ID_DA_PLATAFORMA>

# Taxa da Plataforma (controlada apenas pelo administrador)
PLATFORM_FEE_PERCENT=7.5

# Criptografia
ENCRYPTION_KEY=<CHAVE_GERADA_NO_PASSO_1>

# Supabase (já configuradas automaticamente)
SUPABASE_URL=<url_do_projeto>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

### 3.2 Como obter o PLATFORM_PUSHINPAY_ACCOUNT_ID

1. Acesse o painel da PushinPay
2. Vá em **Configurações** → **Conta**
3. Copie o **Account ID** da sua conta de plataforma
4. Este ID será usado para receber o split de pagamento

## 🚀 Passo 4: Deploy das Edge Functions

Faça o deploy de todas as Edge Functions necessárias:

```bash
# Fazer login no Supabase
supabase login

# Linkar ao projeto
supabase link --project-ref <seu-project-ref>

# Deploy das functions
# Functions chamadas pelo frontend precisam de --no-verify-jwt
supabase functions deploy encrypt-token --no-verify-jwt
supabase functions deploy pushinpay-create-pix --no-verify-jwt
supabase functions deploy pushinpay-get-status --no-verify-jwt

# Webhook é server-to-server (mantém JWT padrão)
supabase functions deploy pushinpay-webhook
```

**Importante:** A flag `--no-verify-jwt` é necessária para funções chamadas diretamente do navegador, pois elas não possuem um token JWT válido. A segurança é garantida pela whitelist de origens e criptografia.

Verifique se todas as functions foram implantadas com sucesso:

```bash
supabase functions list
```

## 🔔 Passo 5: Configurar Webhook na PushinPay

1. Acesse o painel da PushinPay
2. Vá em **Configurações** → **Webhooks**
3. Adicione um novo webhook com a URL:
   ```
   https://<seu-project-ref>.supabase.co/functions/v1/pushinpay-webhook
   ```
4. Selecione os eventos:
   - `pix.paid` (pagamento confirmado)
   - `pix.expired` (pagamento expirado)
   - `pix.canceled` (pagamento cancelado)

5. (Opcional) Configure um header customizado para validação adicional

## 👤 Passo 6: Configuração do Vendedor

Cada vendedor precisa configurar suas credenciais individualmente:

1. Acesse a página **Financeiro** no painel
2. Insira o **API Token** da PushinPay
3. Selecione o **Ambiente** (Sandbox ou Produção)
4. Clique em **Salvar integração**

**Nota:** A taxa da plataforma é configurada apenas pelo administrador nas variáveis de ambiente (`PLATFORM_FEE_PERCENT`). Os vendedores não têm acesso a esse campo.

### Como obter o API Token da PushinPay

1. Acesse o painel da PushinPay
2. Vá em **Configurações** → **API**
3. Gere um novo token ou copie um existente
4. Para testes, solicite acesso ao ambiente Sandbox no suporte

## 🧪 Passo 7: Testar a Integração

### 7.1 Teste em Sandbox

1. Configure um vendedor com token de **Sandbox**
2. Crie um pedido de teste (valor mínimo: R$ 0,50)
3. Escolha **PIX** como forma de pagamento
4. Verifique se o QR Code é gerado corretamente
5. Use o app de testes da PushinPay para simular o pagamento
6. Confirme que o status do pedido é atualizado para **PAID**

### 7.2 Teste em Produção

1. Configure um vendedor com token de **Produção**
2. Crie um pedido com valor baixo (ex: R$ 1,00)
3. Realize um pagamento real via PIX
4. Verifique:
   - Status atualizado corretamente
   - Split creditado na conta da plataforma
   - Webhook recebido e processado

## 📊 Monitoramento e Logs

### Logs das Edge Functions

Visualize logs em tempo real:

```bash
supabase functions logs pushinpay-create-pix --tail
supabase functions logs pushinpay-webhook --tail
```

### Consultar Transações

```sql
-- Ver todas as transações PIX
SELECT * FROM payments_map ORDER BY created_at DESC;

-- Ver configurações dos vendedores
SELECT user_id, environment, platform_fee_percent, created_at 
FROM payment_gateway_settings;
```

## ⚠️ Mensagens de Erro Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `Token PushinPay inválido` | Token incorreto ou expirado | Gerar novo token no painel da PushinPay |
| `Valor mínimo é R$ 0,50` | Valor abaixo do mínimo | Aumentar valor do pedido |
| `Split não pode exceder 50%` | Taxa configurada > 50% | Ajustar taxa na página Financeiro |
| `Configuração de gateway não encontrada` | Vendedor não configurou PushinPay | Acessar Financeiro e salvar credenciais |
| `Erro ao processar credenciais` | Problema na descriptografia | Verificar ENCRYPTION_KEY nas variáveis |

## 🔒 Segurança

- ✅ Tokens são criptografados com AES-256-GCM antes de salvar
- ✅ RLS (Row-Level Security) ativo em todas as tabelas
- ✅ Tokens nunca são expostos ao cliente (mascaramento)
- ✅ Edge Functions usam SERVICE_ROLE para operações sensíveis
- ✅ Validação de entrada em todas as requisições

## 📝 Checklist de Deploy

- [ ] Chave de criptografia gerada e configurada
- [ ] Migrações SQL aplicadas
- [ ] Variáveis de ambiente configuradas
- [ ] Edge Functions implantadas
- [ ] Webhook configurado na PushinPay
- [ ] Teste em Sandbox realizado com sucesso
- [ ] Teste em Produção realizado com sucesso
- [ ] Documentação revisada pela equipe

## 🆘 Suporte

Para problemas técnicos:
- **PushinPay**: suporte@pushinpay.com.br
- **Supabase**: https://supabase.com/support
- **Projeto**: Abra uma issue no repositório

## 📚 Referências

- [Documentação PushinPay](https://docs.pushinpay.com.br)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
