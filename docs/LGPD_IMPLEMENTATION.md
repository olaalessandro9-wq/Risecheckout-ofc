# Implementação LGPD - Direito ao Esquecimento

## Visão Geral

Este documento descreve a implementação do **Direito ao Esquecimento** (Art. 18, VI da LGPD) no RiseCheckout. O sistema permite que compradores solicitem a anonimização de seus dados pessoais de forma automatizada, segura e auditável.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FLUXO LGPD                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│   │   Frontend   │───▶│ gdpr-request │───▶│   ZeptoMail  │          │
│   │ /lgpd/       │    │ Edge Function│    │  Email API   │          │
│   │ esquecimento │    └──────────────┘    └──────────────┘          │
│   └──────────────┘           │                    │                  │
│                              ▼                    ▼                  │
│                    ┌──────────────────────────────────┐             │
│                    │       gdpr_requests table        │             │
│                    │  (token, status, timestamps)     │             │
│                    └──────────────────────────────────┘             │
│                                                                      │
│   ┌──────────────┐    ┌──────────────┐                              │
│   │   Frontend   │───▶│ gdpr-forget  │                              │
│   │ /lgpd/       │    │ Edge Function│                              │
│   │ confirmar    │    └──────────────┘                              │
│   └──────────────┘           │                                      │
│                              ▼                                      │
│                    ┌──────────────────────────────────┐             │
│                    │   Anonimização em 2 tabelas:     │             │
│                    │   - orders                       │             │
│                    │   - users                        │             │
│                    └──────────────────────────────────┘             │
│                              │                                      │
│                              ▼                                      │
│                    ┌──────────────────────────────────┐             │
│                    │      gdpr_audit_log table        │             │
│                    │   (auditoria completa)           │             │
│                    └──────────────────────────────────┘             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Componentes

### 1. Páginas Frontend

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/lgpd/esquecimento` | `src/pages/lgpd/GdprRequest.tsx` | Formulário de solicitação |
| `/lgpd/confirmar` | `src/pages/lgpd/GdprConfirm.tsx` | Confirmação via token |

### 2. Edge Functions

| Função | Arquivo | Descrição |
|--------|---------|-----------|
| `gdpr-request` | `supabase/functions/gdpr-request/index.ts` | Cria solicitação e envia email |
| `gdpr-forget` | `supabase/functions/gdpr-forget/index.ts` | Executa anonimização |

### 3. Tabelas do Banco de Dados

#### `gdpr_requests`

Armazena as solicitações de esquecimento:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único |
| `email` | TEXT | Email do solicitante (anonimizado após processamento) |
| `email_normalized` | TEXT | Email normalizado (lowercase, trim) |
| `verification_token` | TEXT | Token de verificação (24h validade) |
| `token_expires_at` | TIMESTAMPTZ | Expiração do token |
| `status` | TEXT | `pending`, `verified`, `processed`, `expired`, `rejected` |
| `verified_at` | TIMESTAMPTZ | Quando o email foi verificado |
| `processed_at` | TIMESTAMPTZ | Quando a anonimização foi executada |
| `records_anonymized` | INTEGER | Total de registros anonimizados |
| `tables_affected` | JSONB | Detalhamento por tabela |
| `ip_address` | TEXT | IP do solicitante (para auditoria) |
| `user_agent` | TEXT | User-agent do navegador |
| `rejection_reason` | TEXT | Motivo de rejeição (se aplicável) |

**Índices:**
- `idx_gdpr_requests_email_normalized` - Busca por email
- `idx_gdpr_requests_token` - Validação de token
- `idx_gdpr_requests_status` - Filtro por status
- `idx_gdpr_requests_created_at` - Ordenação temporal

#### `gdpr_audit_log`

Auditoria de todas as ações LGPD:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único |
| `gdpr_request_id` | UUID | FK para gdpr_requests |
| `action` | TEXT | Tipo de ação executada |
| `table_name` | TEXT | Tabela afetada |
| `records_affected` | INTEGER | Registros modificados |
| `original_email_hash` | TEXT | Hash do email original |
| `anonymized_email` | TEXT | Email após anonimização |
| `executed_by` | TEXT | Identificador do executor |
| `executed_at` | TIMESTAMPTZ | Timestamp da execução |
| `ip_address` | TEXT | IP do executor |
| `metadata` | JSONB | Dados adicionais |

### 4. Funções Auxiliares do Banco

| Função | Descrição |
|--------|-----------|
| `check_gdpr_request_limit(TEXT)` | Verifica rate limit (3 req/hora por email) |
| `hash_email(TEXT)` | Gera hash SHA-256 do email |
| `update_gdpr_updated_at()` | Trigger para atualizar `updated_at` |

## Fluxo Detalhado

### Fase 1: Solicitação

1. Usuário acessa `/lgpd/esquecimento`
2. Preenche email e confirma estar ciente
3. Frontend chama `gdpr-request`
4. Edge Function:
   - Valida rate limit (máx 3/hora)
   - Gera token UUID com validade de 24h
   - Salva em `gdpr_requests` com status `pending`
   - Envia email via ZeptoMail com link de confirmação
5. Usuário recebe email com link

### Fase 2: Confirmação

1. Usuário clica no link do email
2. Redirecionado para `/lgpd/confirmar?token=xxx`
3. Página valida token e mostra preview dos dados
4. Usuário confirma exclusão
5. Frontend chama `gdpr-forget` com token

### Fase 3: Anonimização

1. Edge Function valida token (não expirado, não usado)
2. Atualiza status para `verified`
3. Executa anonimização em 2 tabelas:

   **`orders`:**
   ```sql
   UPDATE orders SET
     customer_email = 'anonymized_xxx@deleted.lgpd',
     customer_name = 'Dados Removidos (LGPD)',
     customer_phone = NULL,
     customer_document = NULL,
     customer_ip = NULL
   WHERE customer_email = <email>
   ```

   **`users`:**
   ```sql
   UPDATE users SET
     email = 'anonymized_xxx@deleted.lgpd',
     name = 'Dados Removidos (LGPD)',
     phone = NULL,
     cpf_cnpj = NULL,
     document_encrypted = NULL,
     document_hash = NULL,
     is_active = false
   WHERE email = <email>
   ```

4. Registra em `gdpr_audit_log`
5. Atualiza `gdpr_requests` com:
   - `status = 'processed'`
   - `processed_at = now()`
   - `records_anonymized = total`
   - `tables_affected = {orders: X, users: Y}`
6. Anonimiza o próprio email na solicitação

### Fase 4: Retenção Fiscal

**IMPORTANTE:** Alguns dados são mantidos por obrigação legal:

| Dado | Período de Retenção | Base Legal |
|------|---------------------|------------|
| `order.id` | 5 anos | Art. 173, CTN |
| `order.amount_cents` | 5 anos | Art. 173, CTN |
| `order.status` | 5 anos | Art. 173, CTN |
| `order.paid_at` | 5 anos | Art. 173, CTN |
| `order.gateway_payment_id` | 5 anos | Art. 173, CTN |
| `order.vendor_id` | 5 anos | Art. 173, CTN |

## Configuração

### Variáveis de Ambiente Necessárias

```bash
# Domínio base da plataforma (SSOT para URLs e emails)
# IMPORTANTE: Use SITE_BASE_DOMAIN (obrigatório desde RISE V3)
# NÃO use PUBLIC_SITE_URL (legado, removido)
SITE_BASE_DOMAIN=risecheckout.com

# API Key do ZeptoMail para envio de emails
ZEPTOMAIL_API_KEY=<sua_chave_api>
```

### Como Configurar

1. Acesse o dashboard do Supabase
2. Vá em **Settings > Edge Functions > Secrets**
3. Adicione `SITE_BASE_DOMAIN` e `ZEPTOMAIL_API_KEY`
4. (Opcional) Adicione ao Vault para uso em triggers SQL

## Segurança

### Proteções Implementadas

| Proteção | Descrição |
|----------|-----------|
| **Rate Limiting** | Máximo 3 solicitações por email/hora |
| **Token Expirável** | Token válido por apenas 24 horas |
| **Token Único** | Cada token só pode ser usado uma vez |
| **Verificação de Email** | Dupla confirmação (email + clique) |
| **Auditoria Completa** | Todas as ações são logadas |
| **RLS** | Row Level Security em todas as tabelas |
| **Hash de Email** | Email original é hasheado para auditoria |
| **Anonimização** | Dados são anonimizados, não deletados |

### Row Level Security

```sql
-- gdpr_requests: Ninguém pode ler diretamente
CREATE POLICY "No direct access" ON gdpr_requests
  FOR ALL USING (false);

-- gdpr_audit_log: Apenas leitura para service role
CREATE POLICY "No direct access" ON gdpr_audit_log
  FOR ALL USING (false);
```

## Testes

### Testar Fluxo Completo

1. Acesse `/lgpd/esquecimento`
2. Insira um email de teste
3. Verifique o email recebido
4. Clique no link de confirmação
5. Confirme a exclusão
6. Verifique em `gdpr_audit_log` se foi registrado

### Verificar Rate Limit

```sql
SELECT * FROM check_gdpr_request_limit('test@example.com');
-- Deve retornar TRUE se dentro do limite
```

### Verificar Anonimização

```sql
-- Antes
SELECT customer_email, customer_name FROM orders WHERE customer_email = 'test@example.com';

-- Depois
SELECT customer_email, customer_name FROM orders WHERE customer_email LIKE 'anonymized_%';
```

## Métricas e Monitoramento

### Queries Úteis

```sql
-- Solicitações por status
SELECT status, COUNT(*) FROM gdpr_requests GROUP BY status;

-- Tempo médio de processamento
SELECT 
  AVG(EXTRACT(EPOCH FROM (processed_at - created_at))/3600) as avg_hours
FROM gdpr_requests 
WHERE status = 'processed';

-- Registros anonimizados por dia
SELECT 
  DATE(executed_at) as date,
  SUM(records_affected) as total
FROM gdpr_audit_log 
WHERE action = 'anonymize'
GROUP BY DATE(executed_at)
ORDER BY date DESC;
```

## Compliance Checklist

- [x] Formulário de solicitação acessível publicamente
- [x] Verificação de identidade via email
- [x] Confirmação explícita antes da exclusão
- [x] Anonimização ao invés de deleção
- [x] Retenção de dados fiscais por 5 anos
- [x] Auditoria completa de todas as ações
- [x] Rate limiting para prevenir abuso
- [x] Token expirável e de uso único
- [x] RLS em todas as tabelas LGPD
- [x] Hash do email original para rastreabilidade

## Referências

- [LGPD - Lei 13.709/2018](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [Art. 18 - Direitos do Titular](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm#art18)
- [Art. 173 CTN - Retenção Fiscal](http://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm#art173)

---

**Última atualização:** Janeiro 2026  
**Versão:** 1.0  
**Responsável:** Equipe RiseCheckout
