
# AUDITORIA COMPLETA - CATEGORIA B: SEGURANÇA & RLS

## Metodologia Aplicada (RISE V3)

Seguindo o protocolo de auditoria:
1. ✅ Li TODOS os arquivos relevantes
2. ✅ Identifiquei TODAS as violações do RISE V3
3. ✅ Proponho a MELHOR solução (nota 10.0)
4. ✅ Não escondi nenhum problema
5. ✅ Nenhuma sugestão "por ora" ou "temporária"

---

## B1: TABELA PROFILES SEM RLS ADEQUADA

### Status: ✅ **CONFORME** (Falso Positivo)

### Análise das Policies Existentes

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ POLICIES NA TABELA profiles                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. profiles_select_v3 (SELECT)                                              │
│    USING: (auth.uid() = id) OR has_min_role(auth.uid(), 'admin')            │
│    ✅ CORRETO: Usuário só vê próprio perfil OU admin vê todos              │
│                                                                              │
│ 2. profiles_insert_v2 (INSERT)                                              │
│    WITH CHECK: auth.uid() = id                                              │
│    ✅ CORRETO: Só pode inserir com seu próprio ID                          │
│                                                                              │
│ 3. profiles_update_v2 (UPDATE)                                              │
│    USING + WITH CHECK: auth.uid() = id                                      │
│    ✅ CORRETO: Só pode atualizar próprio perfil                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Dados Sensíveis na Tabela

| Campo | Sensibilidade | Proteção |
|-------|---------------|----------|
| password_hash | 🔴 CRÍTICA | ✅ RLS impede acesso cruzado |
| cpf_cnpj | 🔴 ALTA | ✅ RLS impede acesso cruzado |
| mercadopago_collector_id | 🟠 MÉDIA | ✅ RLS impede acesso cruzado |
| stripe_account_id | 🟠 MÉDIA | ✅ RLS impede acesso cruzado |
| custom_fee_percent | 🟡 BAIXA | ✅ RLS impede acesso cruzado |

### Veredicto
O scan de segurança (`supabase_lov`) reportou um falso positivo. As policies estão CORRETAMENTE implementadas:
- Usuários só acessam próprio perfil
- Admins podem ver todos (necessário para suporte)
- Não há exposição cruzada de dados

**AÇÃO NECESSÁRIA:** Nenhuma

---

## B2: TABELA USERS EXPOSTA PUBLICAMENTE

### Status: ✅ **CONFORME**

### Análise das Policies Existentes

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ POLICIES NA TABELA users                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. Service role full access on users (ALL)                                  │
│    USING: (auth.jwt() ->> 'role') = 'service_role'                          │
│    ✅ CORRETO: Apenas service_role tem acesso total                        │
│                                                                              │
│ 2. Users can view own data (SELECT)                                         │
│    USING: id = auth.uid()                                                   │
│    ✅ CORRETO: Usuário só vê próprios dados                                │
│                                                                              │
│ 3. Users can update own data (UPDATE)                                       │
│    USING: id = auth.uid()                                                   │
│    ✅ CORRETO: Usuário só atualiza próprios dados                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Dados Sensíveis na Tabela

| Campo | Sensibilidade | Proteção |
|-------|---------------|----------|
| password_hash | 🔴 CRÍTICA | ✅ RLS impede acesso cruzado |
| email | 🔴 ALTA | ✅ RLS impede acesso cruzado |
| cpf_cnpj | 🔴 ALTA | ✅ RLS impede acesso cruzado |
| document_encrypted | 🔴 CRÍTICA | ✅ RLS + criptografia |
| reset_token | 🔴 CRÍTICA | ✅ RLS impede acesso cruzado |

### Veredicto
A tabela `users` tem RLS adequada e restritiva. Não há exposição pública.

**AÇÃO NECESSÁRIA:** Nenhuma

---

## B3: TABELA SESSIONS POTENCIALMENTE EXPOSTA

### Status: ✅ **CONFORME**

### Análise das Policies Existentes

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ POLICIES NA TABELA sessions                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. Service role full access on sessions (ALL)                               │
│    USING: (auth.jwt() ->> 'role') = 'service_role'                          │
│    ✅ CORRETO: Apenas service_role gerencia sessões                        │
│                                                                              │
│ 2. Users can view own sessions (SELECT)                                     │
│    USING: user_id = auth.uid()                                              │
│    ✅ CORRETO: Usuário só vê próprias sessões                              │
│                                                                              │
│ 3. Users can delete own sessions (DELETE)                                   │
│    USING: user_id = auth.uid()                                              │
│    ✅ CORRETO: Usuário pode fazer logout das próprias sessões              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Dados Sensíveis na Tabela

| Campo | Sensibilidade | Proteção |
|-------|---------------|----------|
| session_token | 🔴 CRÍTICA | ✅ RLS impede acesso cruzado |
| refresh_token | 🔴 CRÍTICA | ✅ RLS impede acesso cruzado |
| ip_address | 🟠 MÉDIA | ✅ RLS impede acesso cruzado |

### Veredicto
A tabela `sessions` tem RLS correta. Os tokens são protegidos adequadamente.

**AÇÃO NECESSÁRIA:** Nenhuma

---

## B4: TABELA ORDERS EXPÕE DADOS SENSÍVEIS

### Status: ✅ **CONFORME**

### Análise das Policies Existentes

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ POLICIES NA TABELA orders                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. Service role full access on orders (ALL)                                 │
│    USING: true                                                              │
│    ROLES: {service_role}                                                    │
│    ✅ CORRETO: service_role gerencia todas as orders                       │
│                                                                              │
│ 2. orders_select_v2 (SELECT)                                                │
│    USING: vendor_id = auth.uid() OR has_role(auth.uid(), 'admin')           │
│    ✅ CORRETO: Vendor só vê SUAS orders, admin vê todas                    │
│                                                                              │
│ ⚠️ NOTA: Não há INSERT/UPDATE/DELETE para anon/authenticated               │
│    Todas as operações passam por Edge Functions com service_role            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Arquitetura de Acesso

```text
┌────────────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Frontend          │────▶│  Edge Function  │────▶│  Database    │
│  (Buyer/Vendor)    │     │  (service_role) │     │  (RLS)       │
└────────────────────┘     └─────────────────┘     └──────────────┘
         │                         │                      │
         │                         │                      │
    Sem acesso             Valida sessão           RLS adicional
    direto ao DB           antes de operar         para SELECT
```

### Buyers e Orders
Os buyers NÃO acessam orders via RLS diretamente. O acesso é via:
1. `buyer-orders` Edge Function valida sessão do buyer
2. Edge Function usa service_role para buscar orders
3. Filtra por `customer_email` do buyer autenticado

### Veredicto
A arquitetura está correta. Orders são protegidas por:
- RLS para vendors (só veem suas vendas)
- Edge Functions para buyers (validação de sessão)
- service_role para operações internas

**AÇÃO NECESSÁRIA:** Nenhuma

---

## B5: ANON KEY DUPLICADA EM DOIS ARQUIVOS

### Status: ⚠️ **PROBLEMA IDENTIFICADO**

### Análise

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ OCORRÊNCIAS DA ANON KEY ENCONTRADAS                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. .env (raiz do projeto)                                                   │
│    VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGci..."                              │
│    ❌ Este arquivo NÃO deveria estar no repo (está no .gitignore?)          │
│                                                                              │
│ 2. supabase/functions/update-affiliate-settings/index.ts (linha 130)        │
│    Deno.env.get('SUPABASE_ANON_KEY')                                        │
│    ⚠️ Uso desnecessário - função já usa service_role para autenticação     │
│                                                                              │
│ 3. supabase/functions/manage-user-role/index.ts (linha 49)                  │
│    supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")                      │
│    ⚠️ Variável declarada mas NÃO utilizada (dead code)                     │
│                                                                              │
│ 4. supabase/functions/check-secrets/index.ts (linha 38)                     │
│    'SUPABASE_ANON_KEY': 'supabase'                                          │
│    ✅ CORRETO: Apenas verifica se secret está configurado                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Problema Específico
O arquivo `update-affiliate-settings/index.ts` cria um cliente Supabase com anon key para fazer queries:

```typescript
// LINHA 128-131 - PROBLEMA
const supabase: SupabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''  // ← Desnecessário
);
```

Isso é um padrão anti-RISE V3 porque:
1. A função JÁ tem `supabaseAdmin` com service_role
2. O uso de anon key em Edge Functions é desnecessário
3. Todas as queries podem usar service_role (com validação de ownership explícita)

### Solução 10.0/10

**Remover uso de SUPABASE_ANON_KEY em Edge Functions**

| Solução | Nota | Descrição |
|---------|------|-----------|
| A. Manter anon key para RLS | 6.0/10 | Complexidade desnecessária |
| B. Usar apenas service_role | 10.0/10 | Simplifica, valida ownership manualmente |

**Escolha: Solução B (10.0/10)**

As Edge Functions devem:
1. Usar APENAS `SUPABASE_SERVICE_ROLE_KEY`
2. Validar ownership explicitamente no código
3. Eliminar referências a `SUPABASE_ANON_KEY`

**AÇÃO NECESSÁRIA:**
1. Refatorar `update-affiliate-settings/index.ts` para usar apenas service_role
2. Remover variável não utilizada em `manage-user-role/index.ts`
3. Verificar se `.env` está no `.gitignore`

---

## B6: SECRETS EXPOSTOS EM CÓDIGO OU LOGS

### Status: ✅ **CONFORME**

### Análise Realizada

1. **Busca por secrets hardcoded no frontend:**
   - ✅ Nenhuma API key ou secret encontrado em `src/`
   - ✅ `supabase/client.ts` é um stub que lança erro

2. **Busca por logs com secrets:**
   - ✅ Nenhum `log.*password`, `log.*token`, `log.*secret` encontrado
   - ✅ ESLint `no-console: error` ativo no frontend

3. **Configuração de secrets:**
   - ✅ 18 secrets configurados no Supabase
   - ✅ `CORS_ALLOWED_ORIGINS` presente
   - ✅ `INTERNAL_WEBHOOK_SECRET` presente

4. **Anon key no frontend:**
   - ✅ Removida - API Gateway injeta automaticamente
   - ✅ `src/config/supabase.ts` só exporta URL do gateway

### Arquivo Legado Encontrado

```text
docs/script_migracao_console.js
├── Contém URL hardcoded: wivbtmtgpsxupfjwwovf.supabase.co
├── É script de migração manual (não executa em produção)
└── ⚠️ Recomendação: Mover para docs/archive/ ou remover
```

### Veredicto
Não há secrets expostos no código de produção. O único arquivo com URL hardcoded é um script de migração em `docs/`.

**AÇÃO NECESSÁRIA:** Mover `docs/script_migracao_console.js` para `docs/archive/`

---

## B7: CORS CONFIGURATION EM EDGE FUNCTIONS

### Status: ⚠️ **ATENÇÃO NECESSÁRIA**

### Análise

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ USO DE CORS NAS EDGE FUNCTIONS                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ handleCorsV2 (Dinâmico):                                                    │
│ ├── Valida Origin contra CORS_ALLOWED_ORIGINS secret                       │
│ ├── Retorna 403 se origin não permitida                                    │
│ └── ✅ Uso correto para funções autenticadas                               │
│                                                                              │
│ PUBLIC_CORS_HEADERS (Estático '*'):                                         │
│ ├── Permite qualquer origin                                                │
│ ├── Encontrado em 32 arquivos                                              │
│ └── ⚠️ Alguns usos podem ser incorretos                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Usos CORRETOS de PUBLIC_CORS_HEADERS

| Função | Motivo | Status |
|--------|--------|--------|
| Webhooks (mercadopago, stripe, etc) | Chamados por gateways externos | ✅ |
| health | Monitoramento externo | ✅ |
| check-secrets | Diagnóstico interno | ✅ |
| verify-turnstile | Chamado de checkout público | ✅ |

### Usos QUESTIONÁVEIS

| Função | Problema | Ação |
|--------|----------|------|
| update-affiliate-settings | Usa handleCorsV2 ✅ | Nenhuma |
| manage-user-role | Usa handleCorsV2 ✅ | Nenhuma |
| rpc-proxy | Usa handleCorsV2 + PUBLIC para fallback de erro | Verificar |
| storage-management | Usa handleCorsV2 + PUBLIC para fallback de erro | Verificar |

### Padrão Problemático Identificado

```typescript
// rpc-proxy/index.ts e storage-management/index.ts
// Em caso de erro, usa PUBLIC_CORS_HEADERS
return new Response(
  JSON.stringify({ error: "Internal server error" }),
  { status: 500, headers: { ...PUBLIC_CORS_HEADERS, "Content-Type": "application/json" } }
);
```

Isso pode expor erros para qualquer origem. Deveria usar `corsHeaders` do handleCorsV2.

### Veredicto
A maioria das funções está correta. Há 2 funções que usam `PUBLIC_CORS_HEADERS` em respostas de erro quando deveriam usar as headers dinâmicas.

**AÇÃO NECESSÁRIA:**
1. Corrigir `rpc-proxy/index.ts` - usar corsHeaders em respostas de erro
2. Corrigir `storage-management/index.ts` - usar corsHeaders em respostas de erro

---

## RESUMO EXECUTIVO - CATEGORIA B

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RESULTADO DA AUDITORIA - CATEGORIA B                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  B1: Tabela profiles sem RLS adequada         ✅ CONFORME (Falso Positivo)  │
│  B2: Tabela users exposta publicamente        ✅ CONFORME                   │
│  B3: Tabela sessions potencialmente exposta   ✅ CONFORME                   │
│  B4: Tabela orders expõe dados sensíveis      ✅ CONFORME                   │
│  B5: Anon key duplicada em dois arquivos      ⚠️ CORREÇÃO NECESSÁRIA       │
│  B6: Secrets expostos em código ou logs       ✅ CONFORME                   │
│  B7: CORS configuration em Edge Functions     ⚠️ CORREÇÃO NECESSÁRIA       │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PONTOS CONFORMES:       5/7 (71%)                                          │
│  CORREÇÕES NECESSÁRIAS:  2/7 (29%)                                          │
│  CRITICIDADE DAS CORREÇÕES: 🟡 MÉDIA                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PLANO DE CORREÇÃO (Para Aprovação)

### Correção B5: Remover SUPABASE_ANON_KEY de Edge Functions

**Arquivos a modificar:**
1. `supabase/functions/update-affiliate-settings/index.ts`
   - Remover cliente supabase com anon key (linhas 128-131)
   - Usar supabaseAdmin para todas as queries
   
2. `supabase/functions/manage-user-role/index.ts`
   - Remover variável não utilizada `supabaseAnonKey` (linha 49)

**Complexidade:** Baixa
**Tempo estimado:** 15 minutos

### Correção B7: CORS em respostas de erro

**Arquivos a modificar:**
1. `supabase/functions/rpc-proxy/index.ts` (linha 211)
   - Trocar `PUBLIC_CORS_HEADERS` por `corsHeaders`
   
2. `supabase/functions/storage-management/index.ts` (linha 282)
   - Trocar `PUBLIC_CORS_HEADERS` por `corsHeaders`

**Complexidade:** Baixa
**Tempo estimado:** 10 minutos

### Limpeza Adicional (Recomendada)

1. Mover `docs/script_migracao_console.js` para `docs/archive/`

---

## NOTA FINAL DA CATEGORIA B

| Critério | Antes da Correção | Após Correção |
|----------|-------------------|---------------|
| Manutenibilidade | 9.0/10 | 10.0/10 |
| Zero DT | 8.5/10 | 10.0/10 |
| Arquitetura | 9.5/10 | 10.0/10 |
| Escalabilidade | 10.0/10 | 10.0/10 |
| Segurança | 9.0/10 | 10.0/10 |
| **NOTA FINAL** | **9.2/10** | **10.0/10** |

A Categoria B está em bom estado. As correções necessárias são de baixa complexidade e não afetam a funcionalidade - apenas melhoram a consistência e eliminam código desnecessário.
