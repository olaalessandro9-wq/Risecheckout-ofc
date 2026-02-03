

# Auditoria de Conformidade RISE V3 - Migração de Centralização

## Status: INCOMPLETO - AÇÃO REQUERIDA

A auditoria identificou que a migração foi **PARCIALMENTE** bem-sucedida. Existem **2 arquivos críticos** com código legado que não foram migrados e violam o Protocolo RISE V3.

---

## Resumo Executivo

| Categoria | Status | Itens |
|-----------|--------|-------|
| Helpers Centralizados | OK | site-urls.ts, email-config.ts, cors-v2.ts, urls.ts |
| Edge Functions Críticas | OK | unified-auth, checkout-crud, zeptomail, oauth callbacks |
| Email Templates | OK | external, purchase, members-area (todos usam helpers) |
| **Código Legado Backend** | **FALHA** | 2 arquivos com email hardcoded |
| Documentação | OK | LGPD_IMPLEMENTATION.md atualizado |
| Secrets | OK | SITE_BASE_DOMAIN documentado como obrigatório |

---

## Problemas Identificados (CRÍTICOS)

### 1. send-confirmation-email/index.ts (Linha 118)

**Problema:** Email hardcoded `noreply@risecheckout.com`

```typescript
// ATUAL (ERRADO):
body: JSON.stringify({
  from: 'Rise Checkout <noreply@risecheckout.com>',
  to: order.customer_email,
  subject: 'Compra Confirmada! 🎉',
```

**Correção Necessária:**
```typescript
import { getNoReplyEmail } from "../_shared/email-config.ts";

// CORRETO:
const fromEmail = getNoReplyEmail();
const fromName = Deno.env.get('ZEPTOMAIL_FROM_NAME') || 'Rise Checkout';

body: JSON.stringify({
  from: `${fromName} <${fromEmail}>`,
  to: order.customer_email,
  subject: 'Compra Confirmada!',
```

### 2. send-pix-email/index.ts (Linha 139)

**Problema:** Email hardcoded `noreply@risecheckout.com`

```typescript
// ATUAL (ERRADO):
body: JSON.stringify({
  from: 'Rise Checkout <noreply@risecheckout.com>',
  to: order.customer_email,
```

**Correção Necessária:** Mesma correção do item anterior.

---

## Itens Verificados e APROVADOS

### Helpers Centralizados

| Arquivo | Status | Verificação |
|---------|--------|-------------|
| `_shared/site-urls.ts` | OK | SITE_BASE_DOMAIN obrigatório, sem fallback legado |
| `_shared/email-config.ts` | OK | buildEmail(), getSupportEmail(), getNoReplyEmail() funcionais |
| `_shared/cors-v2.ts` | OK | CORS_ALLOWED_ORIGINS com wildcards |
| `_shared/zeptomail.ts` | OK | Usa email-config.ts |
| `src/lib/urls.ts` | OK | Espelha site-urls.ts, fallback apenas em dev |
| `src/config/env.ts` | OK | VITE_SITE_BASE_DOMAIN usado |

### Edge Functions Migradas

| Função | Status | Verificação |
|--------|--------|-------------|
| checkout-crud | OK | Linha 99 usa getSiteBaseUrl('default') |
| unified-auth | OK | Usa site-urls.ts para redirects |
| mercadopago-oauth-callback | OK | Usa buildSiteUrl() |
| stripe-connect-oauth | OK | Usa buildSiteUrl() |
| students-invite | OK | Usa site-urls.ts |
| gdpr-request | OK | Usa site-urls.ts |

### Email Templates

| Template | Status | Verificação |
|----------|--------|-------------|
| email-templates-base.ts | OK | getLogoUrl() usa getSiteBaseUrl() |
| email-templates-external.ts | OK | getSupportEmail(), getSiteBaseUrl() |
| email-templates-purchase.ts | OK | getSupportEmail(), getSiteBaseUrl() |
| email-templates-members-area.ts | OK | getSupportEmail(), getSiteBaseUrl() |

### Documentação

| Documento | Status | Verificação |
|-----------|--------|-------------|
| LGPD_IMPLEMENTATION.md | OK | Linhas 194-207 atualizadas para SITE_BASE_DOMAIN |
| platform-secrets.ts | OK | SITE_BASE_DOMAIN marked as required |

---

## Categorização de Referências a risecheckout.com

### Aceitáveis (Não são código legado)

| Categoria | Razão | Exemplos |
|-----------|-------|----------|
| **Testes** | Valores de assertion/mock | 38 arquivos de teste |
| **Comentários/Docs** | Exemplos em JSDoc | site-urls.ts, email-config.ts |
| **Frontend Estático** | Páginas legais (termos, privacidade) | LandingFooter.tsx, PoliticaDePrivacidade.tsx |
| **Config Supabase** | Referência ao projeto | src/config/__tests__/supabase.test.ts |

### NÃO Aceitáveis (Código legado a corrigir)

| Arquivo | Linha | Problema |
|---------|-------|----------|
| send-confirmation-email/index.ts | 118 | Email hardcoded em chamada Resend |
| send-pix-email/index.ts | 139 | Email hardcoded em chamada Resend |

---

## Análise de Soluções (RISE V3 Seção 4.4)

### Solução A: Migrar para email-config.ts (SSOT)

- Manutenibilidade: 10/10 (Um helper para todos os emails)
- Zero DT: 10/10 (Elimina último hardcoded)
- Arquitetura: 10/10 (Consistente com zeptomail.ts)
- Escalabilidade: 10/10 (Mudança de domínio = 1 secret)
- Segurança: 10/10 (Emails validados por helper)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 15 minutos

### Solução B: Manter código atual

- Manutenibilidade: 5/10 (2 arquivos fora do padrão)
- Zero DT: 4/10 (Dívida técnica explícita)
- Arquitetura: 5/10 (Inconsistência com padrão estabelecido)
- Escalabilidade: 4/10 (Mudança de domínio requer buscar hardcoded)
- Segurança: 10/10 (Não afeta segurança)
- **NOTA FINAL: 5.4/10**
- Tempo estimado: 0 minutos

### DECISÃO: Solução A

A Solução B viola a Lei Suprema (Seção 4.1) ao manter dívida técnica quando existe solução melhor.

---

## Plano de Correção

### Fase 1: Atualizar send-confirmation-email/index.ts

```typescript
// Adicionar import no topo:
import { getNoReplyEmail } from "../_shared/email-config.ts";

// Linha 117-122, substituir:
const fromEmail = getNoReplyEmail();
const fromName = Deno.env.get('ZEPTOMAIL_FROM_NAME') || 'Rise Checkout';

body: JSON.stringify({
  from: `${fromName} <${fromEmail}>`,
  to: order.customer_email,
  subject: 'Compra Confirmada!',
  html: emailHtml,
}),
```

### Fase 2: Atualizar send-pix-email/index.ts

Mesma alteração aplicada.

### Fase 3: Deploy e Validação

- Deploy das duas funções
- Testar envio de email de confirmação
- Testar envio de email PIX

---

## RISE V3 Compliance Score

| Critério | Antes da Correção | Após Correção |
|----------|-------------------|---------------|
| Manutenibilidade Infinita | 9.8/10 | 10.0/10 |
| Zero Dívida Técnica | 9.6/10 | 10.0/10 |
| Arquitetura Correta | 9.8/10 | 10.0/10 |
| Escalabilidade | 9.9/10 | 10.0/10 |
| Segurança | 10.0/10 | 10.0/10 |
| **NOTA FINAL** | **9.8/10** | **10.0/10** |

---

## Checklist de Validação Pós-Correção

Após implementar as correções, executar:

- [ ] Busca por `noreply@risecheckout.com` em código (deve retornar apenas testes)
- [ ] Busca por `from.*risecheckout\.com` em código (deve retornar apenas testes)
- [ ] Deploy send-confirmation-email
- [ ] Deploy send-pix-email
- [ ] Testar envio de email de compra confirmada
- [ ] Testar envio de email PIX
- [ ] Verificar logs das Edge Functions

---

## Resumo de Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| send-confirmation-email/index.ts | Usar getNoReplyEmail() |
| send-pix-email/index.ts | Usar getNoReplyEmail() |

---

## Veredito Final

**A migração NÃO está 100% completa.** Existem 2 arquivos críticos com código legado que precisam ser corrigidos para atingir conformidade RISE V3 Score 10.0/10.

**Ação Requerida:** Aprovar este plano para implementar as correções finais.

