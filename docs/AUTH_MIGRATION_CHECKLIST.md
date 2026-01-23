# AUTH Migration Checklist - Sistema Unificado de Autenticação

**RISE V3 Score: 10.0/10**  
**Início: 23 de Janeiro de 2026**  
**Objetivo: NUNCA MAIS mexer nisso**

---

## 📋 Status Geral

| Fase | Descrição | Status |
|------|-----------|--------|
| 1 | Token Service Unificado | ✅ CONCLUÍDO |
| 2 | Migração Frontend | 🔄 EM PROGRESSO |
| 3 | Migração Edge Functions | ⏳ PENDENTE |
| 4 | Migração de Dados SQL | ⏳ PENDENTE |
| 5 | Cleanup Final | ⏳ PENDENTE |

---

## ✅ Fase 1: Token Service Unificado (CONCLUÍDO)

- [x] Criar `src/lib/token-manager/unified-service.ts`
- [x] Atualizar `src/lib/token-manager/index.ts` - exportar unifiedTokenService
- [x] Atualizar `src/lib/api/client.ts` - usar unifiedTokenService (linha 147)
- [x] Endpoint `unified-auth/refresh` já existia e funciona

---

## 📂 Fase 2: Migração Frontend

### Hooks Legacy a Substituir

| Arquivo | Referências | Prioridade | Status |
|---------|-------------|------------|--------|
| `src/hooks/useBuyerAuth.ts` | ~10 arquivos | 🔴 CRÍTICO | ⬜ |
| `src/hooks/useBuyerSession.ts` | ~5 arquivos | 🔴 CRÍTICO | ⬜ |
| `src/hooks/useProducerAuth.ts` | ~8 arquivos | 🟠 ALTO | ⬜ |
| `src/hooks/useProducerSession.ts` | ~3 arquivos | 🟠 ALTO | ⬜ |
| `src/hooks/useProducerBuyerLink.ts` | ~2 arquivos | 🟡 MÉDIO | ⬜ |

### Componentes/Páginas a Migrar

#### Área de Membros (🔴 CRÍTICO)

- [ ] `src/modules/members-area/pages/buyer/CourseHome.tsx`
- [ ] `src/modules/members-area/pages/buyer/BuyerDashboard.tsx`
- [ ] `src/modules/members-area/pages/buyer/components/layout/BuyerSidebar.tsx`
- [ ] `src/modules/members-area/pages/buyer/components/layout/BuyerHeader.tsx`
- [ ] `src/modules/members-area/pages/buyer/BuyerCertificates.tsx`
- [ ] `src/modules/members-area/pages/buyer/BuyerOrders.tsx`
- [ ] `src/modules/members-area/pages/buyer/BuyerProfile.tsx`
- [ ] `src/modules/members-area/pages/buyer/BuyerAffiliations.tsx`
- [ ] `src/layouts/StudentShell.tsx`

#### Services (🔴 CRÍTICO)

- [ ] `src/modules/members-area/services/students.service.ts`
- [ ] `src/hooks/useBuyerOrders.ts`
- [ ] `src/hooks/useAffiliateRequest.ts`
- [ ] `src/hooks/useAffiliationStatusCache.ts`

#### Auth Components (🟠 ALTO)

- [ ] `src/components/auth/ProducerRegistrationForm.tsx`
- [ ] `src/components/auth/BuyerLoginForm.tsx`
- [ ] `src/pages/minha-conta/Login.tsx`
- [ ] `src/pages/minha-conta/Cadastro.tsx`
- [ ] `src/pages/minha-conta/RecuperarSenha.tsx`

#### Dashboard Producer (🟡 MÉDIO)

- [ ] Verificar se todos os componentes usam `useUnifiedAuth`

---

## 🔧 Fase 3: Migração Edge Functions

### Funções que usam autenticação buyer

| Edge Function | Usa tabela legacy? | Status |
|---------------|-------------------|--------|
| `buyer-auth/` | `buyer_sessions` | ⬜ MANTER COMO PROXY |
| `buyer-orders/` | `buyer_sessions` | ⬜ |
| `buyer-session/` | `buyer_sessions` | ⬜ DELETAR |
| `members-area-quizzes/` | `buyer_sessions` | ⬜ |
| `members-area-students-data/` | `buyer_sessions` | ⬜ |

### Funções que usam autenticação producer

| Edge Function | Usa tabela legacy? | Status |
|---------------|-------------------|--------|
| `producer-auth/` | `producer_sessions` | ⬜ MANTER COMO PROXY |
| `coupon-management/` | `producer_sessions` | ⬜ |
| `coupon-read/` | `producer_sessions` | ⬜ |
| `content-library/` | `producer_sessions` | ⬜ |
| `students-list/` | `producer_sessions` | ⬜ |
| `students-invite/` | `producer_sessions` | ⬜ |
| `get-users-with-emails/` | `producer_sessions` | ⬜ |
| `vault-save/` | `producer_sessions` | ⬜ |
| `admin-health/` | `producer_sessions` | ⬜ |
| `admin-data/` | `producer_sessions` | ⬜ |
| `dashboard-analytics/` | `producer_sessions` | ⬜ |
| `order-management/` | `producer_sessions` | ⬜ |
| `product-management/` | `producer_sessions` | ⬜ |

### Arquivos _shared a Atualizar

- [ ] `supabase/functions/_shared/unified-auth.ts` - Deprecar em favor de `unified-auth-v2.ts`
- [ ] `supabase/functions/_shared/buyer-auth-handlers.ts` - Migrar para unified
- [ ] `supabase/functions/_shared/buyer-auth-handlers-extended.ts` - Migrar para unified
- [ ] `supabase/functions/_shared/producer-auth-session-handlers.ts` - Deprecar

---

## 🗄️ Fase 4: Migração de Dados SQL

### Script de Migração

```sql
-- 1. Migrar producer_sessions válidas para sessions
INSERT INTO sessions (user_id, session_token, refresh_token, active_role, ...)
SELECT producer_id, session_token, refresh_token, 'user', ...
FROM producer_sessions 
WHERE is_valid = true AND refresh_token_expires_at > NOW()
ON CONFLICT (session_token) DO NOTHING;

-- 2. Migrar buyer_sessions válidas para sessions
INSERT INTO sessions (user_id, session_token, refresh_token, active_role, ...)
SELECT u.id, bs.session_token, bs.refresh_token, 'buyer', ...
FROM buyer_sessions bs
JOIN buyer_profiles bp ON bp.id = bs.buyer_id
JOIN users u ON u.email = bp.email
WHERE bs.is_valid = true
ON CONFLICT (session_token) DO NOTHING;

-- 3. Invalidar sessões antigas
UPDATE producer_sessions SET is_valid = false WHERE is_valid = true;
UPDATE buyer_sessions SET is_valid = false WHERE is_valid = true;
```

### Checklist SQL

- [ ] Backup das tabelas legacy
- [ ] Executar migração producer_sessions → sessions
- [ ] Executar migração buyer_sessions → sessions
- [ ] Invalidar sessões legacy
- [ ] Testar login/logout em ambos contextos
- [ ] Testar switch-context

---

## 🧹 Fase 5: Cleanup Final

### Deletar Edge Functions

- [ ] `supabase/functions/buyer-session/` (substituído por unified-auth)

### Deletar Hooks Frontend

- [ ] `src/hooks/useBuyerAuth.ts`
- [ ] `src/hooks/useProducerAuth.ts`
- [ ] `src/hooks/useBuyerSession.ts`
- [ ] `src/hooks/useProducerSession.ts`
- [ ] `src/hooks/useProducerBuyerLink.ts`

### Deprecar/Arquivar Tabelas (após 30 dias de estabilidade)

- [ ] `producer_sessions`
- [ ] `buyer_sessions`

### Atualizar Documentação

- [ ] `docs/UNIFIED_IDENTITY_ARCHITECTURE.md` - Marcar como COMPLETE
- [ ] `docs/EDGE_FUNCTIONS_REGISTRY.md` - Remover entradas legacy
- [ ] Criar `docs/AUTH_MIGRATION_COMPLETE.md`

---

## ✅ Critérios de Sucesso

| # | Critério | Teste | Status |
|---|----------|-------|--------|
| 1 | Sessão persiste 30 dias | Fechar aba → reabrir após 1 dia | ⬜ |
| 2 | Zero re-login ao trocar contexto | Produtor → Aluno → Produtor | ⬜ |
| 3 | Um único cookie de acesso | DevTools mostra `__Host-rise_access` | ⬜ |
| 4 | Uma única tabela de sessões | Query `SELECT * FROM sessions` | ⬜ |
| 5 | Um único hook de auth | Nenhum uso de hooks legacy | ⬜ |
| 6 | Refresh automático funciona | Token expira → refresh transparente | ⬜ |
| 7 | Login unificado | Mesmo email/senha em `/login` e `/minha-conta/login` | ⬜ |

---

## 📅 Changelog

| Data | Fase | Alteração |
|------|------|-----------|
| 2026-01-23 | 1 | Criado `unified-service.ts`, corrigido `api/client.ts` |
