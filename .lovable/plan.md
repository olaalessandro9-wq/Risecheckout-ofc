
# Correção do email-mock-data.ts - Eliminação de URLs Hardcoded

## Diagnóstico

O arquivo `supabase/functions/_shared/email-mock-data.ts` contém **5 URLs hardcoded** que violam o Protocolo RISE V3:

| Linha | URL Hardcoded | Problema |
|-------|---------------|----------|
| 29 | `https://risecheckout.com/minha-conta/produtos/preview` | Hardcoded + caminho errado (plural) |
| 46 | `https://risecheckout.com/minha-conta/produtos/preview-123` | Hardcoded + caminho errado (plural) |
| 110 | `https://risecheckout.com/reset-password?token=preview-token-123` | Hardcoded |
| 130 | `https://risecheckout.com/convite/preview-token-456` | Hardcoded |
| 146 | `https://risecheckout.com/gdpr/confirm?token=preview-gdpr-789` | Hardcoded |

**Caminho correto verificado:** `/minha-conta/produto/:productId` (singular, conforme `buyerRoutes.tsx` linha 92)

---

## Análise de Soluções (RISE V3 Seção 4.4)

### Solução A: Usar buildSiteUrl() do site-urls.ts

- Manutenibilidade: 10/10 (Centralizado no helper existente)
- Zero DT: 10/10 (Elimina todos os hardcoded)
- Arquitetura: 10/10 (Consistente com padrão do projeto)
- Escalabilidade: 10/10 (Mudança de domínio = 1 secret)
- Segurança: 10/10 (Sem impacto)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 10 minutos

### Solução B: Manter código atual

- Manutenibilidade: 4/10 (5 URLs fora do padrão)
- Zero DT: 3/10 (Dívida técnica explícita)
- Arquitetura: 4/10 (Inconsistência com padrão estabelecido)
- Escalabilidade: 3/10 (Mudança de domínio requer buscar hardcoded)
- Segurança: 10/10 (Não afeta segurança)
- **NOTA FINAL: 4.8/10**

### DECISÃO: Solução A

---

## Plano de Implementação

### Alterações no Arquivo

**Arquivo:** `supabase/functions/_shared/email-mock-data.ts`

**1. Adicionar import do helper:**
```typescript
import { buildSiteUrl } from "./site-urls.ts";
```

**2. Corrigir getMockPurchaseData() - Linha 29:**
```typescript
// DE:
deliveryUrl: "https://risecheckout.com/minha-conta/produtos/preview",

// PARA:
deliveryUrl: buildSiteUrl("/minha-conta/produto/preview-product-id"),
```

**3. Corrigir getMockMembersAreaData() - Linha 46:**
```typescript
// DE:
deliveryUrl: "https://risecheckout.com/minha-conta/produtos/preview-123",

// PARA:
deliveryUrl: buildSiteUrl("/minha-conta/produto/preview-product-123"),
```

**4. Corrigir getMockPasswordResetData() - Linha 110:**
```typescript
// DE:
resetLink: "https://risecheckout.com/reset-password?token=preview-token-123",

// PARA:
resetLink: buildSiteUrl("/reset-password?token=preview-token-123"),
```

**5. Corrigir getMockStudentInviteData() - Linha 130:**
```typescript
// DE:
accessLink: "https://risecheckout.com/convite/preview-token-456",

// PARA:
accessLink: buildSiteUrl("/convite/preview-token-456"),
```

**6. Corrigir getMockGdprData() - Linha 146:**
```typescript
// DE:
confirmationLink: "https://risecheckout.com/gdpr/confirm?token=preview-gdpr-789",

// PARA:
confirmationLink: buildSiteUrl("/gdpr/confirm?token=preview-gdpr-789"),
```

---

## Detalhes Técnicos

### Por que buildSiteUrl() e não getSiteBaseUrl()?

O helper `buildSiteUrl(path, context)` é o correto porque:
1. Já concatena o path automaticamente
2. Garante que o path comece com `/`
3. Usa o contexto `'default'` por padrão (domínio principal)

### Por que /minha-conta/produto/ (singular)?

Verificado em `src/routes/buyerRoutes.tsx` linha 92:
```typescript
{ 
  path: "/minha-conta/produto/:productId", 
  element: <BuyerRoute><CourseHome /></BuyerRoute>
}
```

O frontend usa **singular** (`produto`), não plural (`produtos`).

---

## Deploy

Após a correção:
1. Deploy da Edge Function `email-preview` (que consome este arquivo)
2. Testar novamente os templates no painel de Admin
3. Verificar que os links agora apontam para URLs corretas

---

## Validação Final

Busca por `risecheckout.com` no arquivo após correção:
- Esperado: **0 ocorrências** (apenas imports e comentários JSDoc são aceitáveis)

---

## RISE V3 Compliance Score Após Correção

| Critério | Nota |
|----------|------|
| Manutenibilidade Infinita | 10.0/10 |
| Zero Dívida Técnica | 10.0/10 |
| Arquitetura Correta | 10.0/10 |
| Escalabilidade | 10.0/10 |
| Segurança | 10.0/10 |
| **NOTA FINAL** | **10.0/10** |
