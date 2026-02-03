
# Plano de Limpeza Final - Remoção de Elementos Legados (RISE V3)

## Resumo Executivo

Auditoria completa realizada. Identificados elementos legados que precisam ser removidos para garantir **Zero Dívida Técnica** conforme RISE Protocol V3.

---

## Análise de Soluções (RISE V3 Seção 4.4)

### Solução A: Remoção Cirúrgica Completa

- Manutenibilidade: 10/10 (Elimina toda confusão futura)
- Zero DT: 10/10 (Zero referências legadas)
- Arquitetura: 10/10 (Código reflete realidade)
- Escalabilidade: 10/10 (Novos devs não se confundem)
- Segurança: 10/10 (Secrets não usados removidos)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 30 minutos

### Solução B: Manter Legado Documentado

- Manutenibilidade: 6/10 (Secrets e comentários confusos)
- Zero DT: 5/10 (Dívida implícita)
- Arquitetura: 6/10 (Inconsistência)
- Escalabilidade: 5/10 (Onboarding complicado)
- Segurança: 8/10 (Secrets não usados existem)
- **NOTA FINAL: 6.0/10**

### DECISÃO: Solução A (Nota 10.0)

---

## Inventário de Elementos Legados

### 1. Secrets no Supabase (AÇÃO DO USER)

| Secret | Status | Ação |
|--------|--------|------|
| `PUBLIC_SITE_URL` | Não usado em nenhum código | **DELETAR** |
| `STRIPE_REDIRECT_URL` | Substituído por `stripe-oauth-config.ts` SSOT | **DELETAR** |

**Secrets que DEVEM permanecer:**
- `CORS_ALLOWED_ORIGINS` - Usado ativamente por `cors-v2.ts`
- `SITE_BASE_DOMAIN` - SSOT obrigatório para URLs e emails
- Todos os outros 17 secrets são ativos

### 2. Código Backend (Edge Functions)

| Arquivo | Status | Ação |
|---------|--------|------|
| Todos os `.ts` | LIMPO | Nenhuma referência a secrets legados |

**Verificação:**
- `PUBLIC_SITE_URL`: 0 referências em código
- `APP_BASE_URL`: 0 referências em código
- `FRONTEND_URL`: 0 referências em código
- `STRIPE_REDIRECT_URL`: 0 referências em código (apenas comentário explicativo)

### 3. Código Frontend

| Arquivo | Status | Ação |
|---------|--------|------|
| `src/lib/urls.ts` | LIMPO | Usa `VITE_SITE_BASE_DOMAIN` |
| `src/config/env.ts` | LIMPO | Usa `VITE_SITE_BASE_DOMAIN` |

### 4. Documentação

| Arquivo | Status | Ação |
|---------|--------|------|
| `docs/LGPD_IMPLEMENTATION.md` | ATUALIZADO | Já documenta que `PUBLIC_SITE_URL` é legado |

### 5. Cookies Legados

| Cookie | Status | Ação |
|--------|--------|------|
| `__Host-rise_*` | Apenas em testes (validando rejeição) | MANTER (testes são válidos) |
| `producer_session` | Apenas em testes (validando rejeição) | MANTER (testes são válidos) |

### 6. Tabelas Legadas

| Tabela | Status | Ação |
|--------|--------|------|
| `profiles` | Todas referências são comentários de migração | MANTER comentários (documentam história) |
| `buyer_profiles` | Todas referências são comentários de migração | MANTER comentários (documentam história) |
| `auth.users` | Zero uso ativo (abandonada conforme RISE V3) | Nenhuma ação necessária |

---

## Ações Detalhadas

### Ações que EU (AI) vou executar:

**NENHUMA** - O código já está 100% limpo. Não há código morto relacionado a esta migração.

### Ações que VOCÊ (User) deve executar manualmente:

#### 1. Deletar `PUBLIC_SITE_URL` do Supabase

```text
1. Acesse: https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/settings/functions
2. Na seção "Edge Function Secrets"
3. Encontre "PUBLIC_SITE_URL"
4. Clique no ícone de lixeira para deletar
5. Confirme a exclusão
```

#### 2. Deletar `STRIPE_REDIRECT_URL` do Supabase

```text
1. Mesma página: Settings > Edge Functions > Secrets
2. Encontre "STRIPE_REDIRECT_URL"
3. Delete
4. Confirme
```

---

## Validação Pós-Limpeza

Após deletar os secrets, execute estes testes:

| Teste | Como Validar |
|-------|--------------|
| Email Preview | Admin → Preview de Emails → Enviar "Compra Confirmada" |
| OAuth MercadoPago | Dashboard → Financeiro → Conectar MercadoPago |
| OAuth Stripe | Dashboard → Financeiro → Conectar Stripe |
| Links de Pagamento | Criar link de pagamento e verificar URL |

---

## Estado Final do Sistema

```text
╔═══════════════════════════════════════════════════════════════╗
║  RISE PROTOCOL V3 - URL CENTRALIZATION - 10.0/10              ║
║                                                                ║
║  SECRETS ATIVOS: 17 (todos necessários)                       ║
║  SECRETS REMOVIDOS: 2 (PUBLIC_SITE_URL, STRIPE_REDIRECT_URL)  ║
║                                                                ║
║  SSOT URLs: SITE_BASE_DOMAIN → site-urls.ts → All Modules    ║
║  SSOT CORS: CORS_ALLOWED_ORIGINS → cors-v2.ts                 ║
║  SSOT Emails: SITE_BASE_DOMAIN → email-config.ts              ║
║                                                                ║
║  CÓDIGO MORTO: 0 arquivos                                     ║
║  FALLBACKS LEGADOS: 0 linhas                                  ║
║  DÍVIDA TÉCNICA: ZERO                                         ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Detalhes Técnicos

### Por que o código está limpo?

1. **`site-urls.ts`**: Usa apenas `SITE_BASE_DOMAIN`, lança erro se não configurado
2. **`email-config.ts`**: Usa apenas `SITE_BASE_DOMAIN`, lança erro se não configurado
3. **`stripe-oauth-config.ts`**: URL hardcoded como SSOT, não usa secret
4. **`cors-v2.ts`**: Usa `CORS_ALLOWED_ORIGINS` ativamente

### Por que os testes mencionam cookies legados?

Os testes em `session-reader.test.ts` e `unified-auth-v2.test.ts` **validam que cookies legados são IGNORADOS**. Isso é correto - estamos testando que o sistema rejeita formatos antigos. Esses testes **DEVEM** permanecer.

### Referências a `profiles` e `buyer_profiles`

Todas as 200+ referências encontradas são:
- Comentários JSDoc documentando migração (ex: `@version 2.0.0 - Migrated from profiles to users`)
- Comentários inline explicando a mudança (ex: `// RISE V3: Uses 'users' table instead of profiles`)
- Testes validando que não usamos mais essas tabelas

**Não há código ativo usando essas tabelas.** A documentação é valiosa para contexto histórico.

---

## Checklist Final

| Item | Status |
|------|--------|
| Secrets legados identificados | 2 encontrados |
| Código usando secrets legados | ZERO |
| Edge Functions com fallbacks | ZERO |
| Frontend com URLs hardcoded | ZERO |
| Documentação atualizada | SIM |
| Testes cobrindo rejeição de legacy | SIM |

---

## Ação Imediata

Após aprovar este plano, você deve:

1. **Deletar** `PUBLIC_SITE_URL` no Supabase Dashboard
2. **Deletar** `STRIPE_REDIRECT_URL` no Supabase Dashboard
3. **Testar** envio de email no Admin Preview

Eu não preciso fazer nenhuma alteração de código - o sistema já está 100% limpo.
