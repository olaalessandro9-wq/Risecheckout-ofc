# Política de Segurança

## 1. Introdução

Esta política de segurança descreve as diretrizes e melhores práticas para garantir a segurança do projeto RiseCheckout.

## 2. Gerenciamento de Secrets

### 2.1 Armazenamento de Secrets

**NUNCA** faça commit de secrets diretamente no repositório. Todos os secrets devem ser armazenados no **Supabase Vault** ou no sistema de **Secrets** do Supabase.

#### Secrets que NUNCA devem ir para o código:

| Tipo | Exemplos | Onde Armazenar |
|------|----------|----------------|
| Service Role Keys | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` com role "service_role" | Supabase Secrets |
| API Keys Privadas | Stripe Secret Key, PushinPay Token | Supabase Secrets |
| Chaves de Criptografia | `ENCRYPTION_KEY` | Supabase Secrets |
| Tokens de Webhook | `PUSHINPAY_WEBHOOK_TOKEN` | Supabase Secrets |
| Senhas de Banco | Database passwords | Nunca em código |
| Credenciais OAuth | Client secrets | Supabase Secrets |

#### Chaves que PODEM estar no código (públicas):

| Tipo | Exemplos | Motivo |
|------|----------|--------|
| Supabase Anon Key | `SUPABASE_ANON_KEY` | Projetada para ser pública |
| Supabase URL | `SUPABASE_URL` | Pública por design |
| Stripe Publishable Key | `pk_live_...`, `pk_test_...` | Projetada para frontend |

### 2.2 Acesso a Secrets

- **Edge Functions:** Use `Deno.env.get("SECRET_NAME")` para acessar secrets do Supabase.
- **Frontend:** Use apenas as chaves públicas (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).

### 2.3 Rotação de Secrets

| Frequência | Tipo de Secret |
|------------|----------------|
| Imediata | Qualquer secret exposto em código ou logs |
| 90 dias | Chaves de criptografia, tokens de webhook |
| 180 dias | API keys de serviços terceiros |
| Anual | Service role keys (se possível) |

## 3. Prevenção de Vazamento de Secrets

### 3.1 Gitleaks CI/CD

O repositório está configurado com **Gitleaks** que roda em cada `push` e `pull_request`. Commits com secrets serão **automaticamente bloqueados**.

### 3.2 Pre-commit Hooks

Para prevenir commits locais com secrets, instale o `pre-commit`:

```bash
# Instalar pre-commit
pip install pre-commit

# Ativar hooks
pre-commit install

# Testar manualmente
pre-commit run --all-files
```

O arquivo `.pre-commit-config.yaml` já está configurado no repositório.

### 3.3 .gitignore

O `.gitignore` está configurado para ignorar:

```
# Arquivos de ambiente
.env
.env.local
.env.*.local

# Chaves e certificados
*.key
*.pem
*.p12
*.pfx

# Arquivos com secrets no nome
*secret*
*SECRET*
*credential*
*CREDENTIAL*
```

## 4. Documentação Segura

### 4.1 Placeholders em Documentação

**NUNCA** inclua valores reais de secrets em documentação. Use placeholders:

```markdown
# ❌ ERRADO
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6..."

# ✅ CORRETO
curl -H "Authorization: Bearer <YOUR_SUPABASE_ANON_KEY>"
```

### 4.2 Lista de Placeholders Padrão

| Placeholder | Descrição |
|-------------|-----------|
| `<YOUR_PROJECT_REF>` | Project reference do Supabase |
| `<YOUR_SUPABASE_ANON_KEY>` | Anon key do Supabase |
| `<YOUR_ENCRYPTION_KEY>` | Chave de criptografia |
| `<YOUR_WEBHOOK_TOKEN>` | Token de webhook |
| `<YOUR_API_KEY>` | API key genérica |
| `<YOUR_ACCOUNT_ID>` | ID de conta de gateway |

## 5. Segurança de Banco de Dados

### 5.1 Row Level Security (RLS)

**TODAS** as tabelas com dados de usuário devem ter RLS habilitado:

```sql
-- Habilitar RLS
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;

-- Política de leitura
CREATE POLICY "Users can read own data"
ON public.my_table FOR SELECT
USING (auth.uid() = user_id);

-- Política de escrita
CREATE POLICY "Users can write own data"
ON public.my_table FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### 5.2 Dados Sensíveis

| Campo | Tratamento |
|-------|------------|
| `cpf_cnpj` | Criptografar com Vault |
| `token_encrypted` | Já criptografado |
| `payer_document` | Criptografar com Vault |
| `ip_address` | Anonimizar ou hash |
| `customer_email` | Proteger com RLS |

## 6. Edge Functions

### 6.1 CORS

Configure CORS restritivo em todas as Edge Functions:

```typescript
const ALLOWED_ORIGINS = [
  'https://risecheckout.com',
  'https://preview.risecheckout.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

// Validar origem
const origin = req.headers.get('Origin') || '';
if (!ALLOWED_ORIGINS.includes(origin)) {
  return new Response('Forbidden', { status: 403 });
}
```

### 6.2 Autenticação

| Função | JWT Verification |
|--------|------------------|
| Chamada por frontend | `--no-verify-jwt` + validação custom |
| Chamada por webhook | Validar token de webhook |
| Chamada interna | `--verify-jwt` (padrão) |

## 7. Resposta a Incidentes

### 7.1 Passos Imediatos

Em caso de exposição de secrets:

1. **Rotacionar o secret imediatamente**
   - Gere novo valor no dashboard correspondente
   - Atualize no Supabase Secrets

2. **Identificar o escopo**
   - Qual secret foi exposto?
   - Por quanto tempo ficou exposto?
   - Quem pode ter tido acesso?

3. **Sanitizar o código**
   - Remova o secret do código
   - Substitua por placeholder
   - Commit e push

4. **Limpar histórico Git** (se necessário)
   ```bash
   git filter-repo --invert-paths --path <arquivo-com-secret>
   git push --force-with-lease
   ```

5. **Auditar logs**
   - Verifique acessos suspeitos
   - Revise logs de Edge Functions
   - Monitore atividade incomum

6. **Documentar o incidente**
   - Crie issue no repositório (privado)
   - Registre timeline e ações tomadas
   - Documente lições aprendidas

### 7.2 Contatos de Emergência

- **Security Lead:** olaalessandro9@gmail.com
- **Supabase Support:** https://supabase.com/dashboard/support

## 8. Checklist de Revisão de Código

### 8.1 Antes de Criar PR

- [ ] Não há secrets hardcoded no código
- [ ] Não há JWTs ou tokens em documentação
- [ ] Novos endpoints têm CORS configurado
- [ ] Novas tabelas têm RLS habilitado
- [ ] Dados sensíveis estão criptografados
- [ ] Pre-commit hooks passaram

### 8.2 Durante Code Review

- [ ] Verificar imports de secrets
- [ ] Verificar console.log com dados sensíveis
- [ ] Verificar comentários com informações sensíveis
- [ ] Verificar URLs com tokens query params

## 9. Atualizações desta Política

Esta política deve ser revisada:
- A cada 6 meses
- Após qualquer incidente de segurança
- Quando novas integrações forem adicionadas

**Última atualização:** Dezembro 2025
**Versão:** 2.0
