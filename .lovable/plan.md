
# Renomeacao dos Secret Keys: Remover Prefixo Reservado `SUPABASE_`

## Problema

O Supabase Dashboard proibe secrets cujo nome comeca com `SUPABASE_` pois esse namespace e reservado para variaveis auto-injetadas pela plataforma (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`).

Os 3 secrets de dominio atuais violam essa restricao:
- `SUPABASE_SECRET_WEBHOOKS` -- BLOQUEADO pelo Dashboard
- `SUPABASE_SECRET_PAYMENTS` -- BLOQUEADO pelo Dashboard
- `SUPABASE_SECRET_ADMIN` -- BLOQUEADO pelo Dashboard

## Analise de Solucoes

### Solucao A: Prefixo `RISE_`
Nomes: `RISE_SECRET_WEBHOOKS`, `RISE_SECRET_PAYMENTS`, `RISE_SECRET_ADMIN`

- Manutenibilidade: 10/10 -- Prefixo unico do projeto, zero conflito com qualquer servico
- Zero DT: 10/10 -- Resolve o problema de forma definitiva
- Arquitetura: 10/10 -- Namespace proprio do projeto (RISE), semanticamente correto
- Escalabilidade: 10/10 -- Novos dominios seguem o mesmo padrao (`RISE_SECRET_*`)
- Seguranca: 10/10 -- Sem exposicao, sem conflitos
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 1 hora

### Solucao B: Prefixo `SB_`
Nomes: `SB_SECRET_WEBHOOKS`, `SB_SECRET_PAYMENTS`, `SB_SECRET_ADMIN`

- Manutenibilidade: 8/10 -- `SB_` pode conflitar com futuras convencoes do Supabase
- Zero DT: 9/10 -- Funciona hoje, mas o prefixo `SB_` pode ser reservado no futuro
- Arquitetura: 7/10 -- Ainda amarrado ao namespace do Supabase
- Escalabilidade: 8/10 -- Funcional mas nao semanticamente independente
- Seguranca: 10/10 -- Sem exposicao
- **NOTA FINAL: 8.3/10**
- Tempo estimado: 1 hora

### Solucao C: Prefixo `SECRET_KEY_`
Nomes: `SECRET_KEY_WEBHOOKS`, `SECRET_KEY_PAYMENTS`, `SECRET_KEY_ADMIN`

- Manutenibilidade: 9/10 -- Generico, claro
- Zero DT: 10/10 -- Sem conflito com reservados
- Arquitetura: 8/10 -- Perde a identidade do projeto
- Escalabilidade: 9/10 -- Funcional
- Seguranca: 10/10 -- Sem exposicao
- **NOTA FINAL: 9.1/10**
- Tempo estimado: 1 hora

### DECISAO: Solucao A - Prefixo `RISE_` (Nota 10.0)

O prefixo `RISE_` e o namespace proprio do projeto, semanticamente correto, impossivel de conflitar com reservas do Supabase ou qualquer outro servico. As solucoes B e C sao inferiores por dependencia semantica (B) ou genericidade (C).

## Mapeamento da Renomeacao

| Nome Antigo (BLOQUEADO) | Nome Novo | Dominio |
|-------------------------|-----------|---------|
| `SUPABASE_SECRET_WEBHOOKS` | `RISE_SECRET_WEBHOOKS` | webhooks |
| `SUPABASE_SECRET_PAYMENTS` | `RISE_SECRET_PAYMENTS` | payments |
| `SUPABASE_SECRET_ADMIN` | `RISE_SECRET_ADMIN` | admin |
| `SUPABASE_SERVICE_ROLE_KEY` | Inalterado (auto-injetado) | general |

## Arquivos Modificados (7 arquivos)

```text
CODIGO (2):
  supabase/functions/_shared/supabase-client.ts        <- DOMAIN_KEY_MAP (SSOT)
  supabase/functions/check-secrets/index.ts             <- expectedSecrets list

TESTES (1):
  supabase/functions/check-secrets/tests/_shared.ts     <- EXPECTED_SECRETS + SECRETS_BY_CATEGORY

DOCUMENTACAO (4):
  docs/EDGE_FUNCTIONS_REGISTRY.md                       <- 3 tabelas com env vars
  docs/API_GATEWAY_ARCHITECTURE.md                      <- 1 tabela com env vars
  docs/SECURITY_OVERVIEW.md                             <- 1 tabela com env vars
  .env.example                                          <- 3 placeholders
```

## Detalhes Tecnicos

### 1. Factory SSOT (`_shared/supabase-client.ts`)
Unica mudanca necessaria -- as 3 linhas do `DOMAIN_KEY_MAP`:

```text
// ANTES
webhooks: "SUPABASE_SECRET_WEBHOOKS",
payments: "SUPABASE_SECRET_PAYMENTS",
admin:    "SUPABASE_SECRET_ADMIN",

// DEPOIS
webhooks: "RISE_SECRET_WEBHOOKS",
payments: "RISE_SECRET_PAYMENTS",
admin:    "RISE_SECRET_ADMIN",
```

### 2. Check-Secrets (`check-secrets/index.ts`)
Renomear as 3 entries na lista `expectedSecrets` e a categoria de `'supabase-domains'` para `'rise-domains'`:

```text
// ANTES
'SUPABASE_SECRET_WEBHOOKS': 'supabase-domains',
'SUPABASE_SECRET_PAYMENTS': 'supabase-domains',
'SUPABASE_SECRET_ADMIN': 'supabase-domains',

// DEPOIS
'RISE_SECRET_WEBHOOKS': 'rise-domains',
'RISE_SECRET_PAYMENTS': 'rise-domains',
'RISE_SECRET_ADMIN': 'rise-domains',
```

### 3. Check-Secrets Test Shared (`check-secrets/tests/_shared.ts`)
Renomear no `EXPECTED_SECRETS`, `EXPECTED_CATEGORIES`, e `SECRETS_BY_CATEGORY`.

### 4. Documentacao (3 arquivos)
Substituicao direta de `SUPABASE_SECRET_WEBHOOKS` por `RISE_SECRET_WEBHOOKS` (e equivalentes) em todas as tabelas.

### 5. `.env.example`
Atualizar os 3 placeholders com os novos nomes.

## Instrucoes para o Dashboard (pos-implementacao)

Apos a aplicacao do codigo, configurar no Supabase Dashboard (Settings > Edge Functions > Manage Secrets):

| Nome do Secret | Valor |
|----------------|-------|
| `RISE_SECRET_WEBHOOKS` | Valor da secret key "webhooks" criada na Etapa 1 |
| `RISE_SECRET_PAYMENTS` | Valor da secret key "payments" criada na Etapa 1 |
| `RISE_SECRET_ADMIN` | Valor da secret key "admin" criada na Etapa 1 |

## Impacto

- **Zero breaking changes em runtime**: O fallback para `SUPABASE_SERVICE_ROLE_KEY` (general) continua funcionando ate os novos secrets serem configurados
- **107/107 funcoes**: Nenhuma funcao precisa ser alterada -- todas chamam `getSupabaseClient('domain')` que resolve via `DOMAIN_KEY_MAP`
- **SSOT preservado**: A unica fonte de verdade continua sendo o `DOMAIN_KEY_MAP` no factory
