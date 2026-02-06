
# Legal Pages Overhaul - Central Hub + 8 Documents

## Overview

Replace the current 2 hardcoded legal pages (TermosDeUso, PoliticaDePrivacidade) with a clean, scalable architecture: a **Legal Hub page** that lists all 8 documents, plus individual pages for each one -- all using a shared reusable layout component to eliminate code duplication.

## Current State

- `src/pages/TermosDeUso.tsx` (726 lines) -- hardcoded with placeholders `[NOME DA EMPRESA]`, `[CNPJ]`, outdated content
- `src/pages/PoliticaDePrivacidade.tsx` (390 lines) -- outdated content, different email (privacidade@ vs suporte@)
- Only 2 routes exist: `/termos-de-uso` and `/politica-de-privacidade`
- References to legal links in: `CheckoutFooter.tsx`, `ProducerRegistrationForm.tsx`

## Architecture

A new `src/pages/legal/` directory with:

```text
src/pages/legal/
  LegalHub.tsx              -- Central page listing all 8 documents
  LegalPageLayout.tsx       -- Shared layout (header, sidebar, content area)
  TermosDeUso.tsx            -- Updated content from your file
  TermosDeCompra.tsx         -- NEW
  PoliticaDePrivacidade.tsx  -- Updated content from your file
  PoliticaDeCookies.tsx      -- NEW
  PoliticaDeReembolso.tsx    -- NEW
  PoliticaDePagamentos.tsx   -- NEW
  PoliticaDeConteudo.tsx     -- NEW
  PoliticaDeDireitosAutorais.tsx -- NEW
  index.ts                   -- Barrel exports
```

### LegalPageLayout (Reusable Component)

Each legal page will pass its sections and content to `LegalPageLayout`, which handles:
- Animated header with icon, title, date
- Sticky sidebar index with scroll-to-section
- Content area with ScrollArea
- Consistent styling across all 8 pages

This keeps each page focused on **content only**, and the layout component under 150 lines.

### LegalHub Page (`/legal`)

A clean page with 8 cards, each linking to the respective document. Cards organized in a grid with:
- Icon, title, short description
- "Last updated" date
- Click to navigate to the individual page

## Routes (8 new + 1 hub + cleanup)

| Route | Page | Status |
|-------|------|--------|
| `/legal` | LegalHub | NEW |
| `/termos-de-uso` | TermosDeUso (new content) | REPLACE |
| `/termos-de-compra` | TermosDeCompra | NEW |
| `/politica-de-privacidade` | PoliticaDePrivacidade (new content) | REPLACE |
| `/politica-de-cookies` | PoliticaDeCookies | NEW |
| `/politica-de-reembolso` | PoliticaDeReembolso | NEW |
| `/politica-de-pagamentos` | PoliticaDePagamentos | NEW |
| `/politica-de-conteudo` | PoliticaDeConteudo | NEW |
| `/politica-de-direitos-autorais` | PoliticaDeDireitosAutorais | NEW |

## Content Updates

All 8 documents will use the exact content you provided in the uploaded files:
- **Rise Community LTDA**, CNPJ **58.566.585/0001-91**
- Date: **06 de fevereiro de 2026**
- Email: **suporte@risecheckout.com**
- Address: Rua 11, Quadra 257, N 5, Dalva 4, Luziania/GO

No more `[NOME DA EMPRESA]`, `[CNPJ]`, `[ENDERECO COMPLETO]` placeholders.

## Link Updates

### CheckoutFooter.tsx
Currently shows: "Termos de Uso" and "Politica de Privacidade"

Will be updated to show: "Termos de Compra" (more relevant for checkout buyers), "Politica de Privacidade", and "Politica de Pagamentos" -- the three most relevant for a checkout context.

### ProducerRegistrationForm.tsx
Keep "Termos de Uso" and "Politica de Privacidade" links (correct for producer registration context).

### PoliticaDePrivacidade.tsx
The old page had links to `/termos-de-uso` and `/lgpd/esquecimento`. The new page will include cross-links to all related policies (Termos de Uso, Termos de Compra, Politica de Cookies) as referenced in the document content.

## Cleanup

- Delete old `src/pages/TermosDeUso.tsx` (726-line monolith)
- Delete old `src/pages/PoliticaDePrivacidade.tsx` (390-line monolith)
- Update `src/routes/publicRoutes.tsx` -- replace single TermosDeUso route with all legal routes
- Update `src/routes/lgpdRoutes.tsx` -- move PoliticaDePrivacidade route to the legal routes group
- Update `src/routes/__tests__/publicRoutes.test.tsx` -- update to reflect new routes

## Technical Details

- All pages use `lazyWithRetry()` for lazy loading with network failure retry
- Each individual page file stays well under 300 lines (content is structured as data, layout is shared)
- `LegalPageLayout` is a pure presentational component -- receives sections and content as props
- The layout pattern follows the exact same visual style as the current pages (gradient background, glassmorphic cards, sticky sidebar) but is DRY
- All pages are default exports for React.lazy compatibility
- Cross-links between documents use internal routes (e.g., `/politica-de-cookies`) instead of hardcoded `risecheckout.com` URLs

## Files Changed Summary

| Action | File | Reason |
|--------|------|--------|
| CREATE | `src/pages/legal/LegalPageLayout.tsx` | Shared layout component |
| CREATE | `src/pages/legal/LegalHub.tsx` | Central hub page |
| CREATE | `src/pages/legal/TermosDeUso.tsx` | Updated content |
| CREATE | `src/pages/legal/TermosDeCompra.tsx` | New document |
| CREATE | `src/pages/legal/PoliticaDePrivacidade.tsx` | Updated content |
| CREATE | `src/pages/legal/PoliticaDeCookies.tsx` | New document |
| CREATE | `src/pages/legal/PoliticaDeReembolso.tsx` | New document |
| CREATE | `src/pages/legal/PoliticaDePagamentos.tsx` | New document |
| CREATE | `src/pages/legal/PoliticaDeConteudo.tsx` | New document |
| CREATE | `src/pages/legal/PoliticaDeDireitosAutorais.tsx` | New document |
| CREATE | `src/pages/legal/index.ts` | Barrel exports |
| DELETE | `src/pages/TermosDeUso.tsx` | Replaced by legal/ version |
| DELETE | `src/pages/PoliticaDePrivacidade.tsx` | Replaced by legal/ version |
| EDIT | `src/routes/publicRoutes.tsx` | Add all legal routes |
| EDIT | `src/routes/lgpdRoutes.tsx` | Remove PoliticaDePrivacidade (moved) |
| EDIT | `src/components/checkout/CheckoutFooter.tsx` | Update legal links |
| EDIT | `src/routes/__tests__/publicRoutes.test.tsx` | Update test |
