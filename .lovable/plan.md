
# Plano de Correção para RISE V3 10.0/10

## Resumo Executivo

A auditoria identificou **8 violações** que impedem a certificação 10.0/10:
- 1 violação CRÍTICA (URL Supabase direta no OAuth)
- 5 violações ALTA (frases proibidas em docs)
- 2 violações MÉDIA (headers V2, CSP redundante)

## Violações Identificadas

### CRÍTICAS (Bloqueia 10.0)

| ID | Arquivo | Problema |
|----|---------|----------|
| V1 | `src/config/mercadopago.ts:9` | URL `wivbtmtgpsxupfjwwovf.supabase.co` direta |

### ALTAS (Impacta Score)

| ID | Arquivo | Problema |
|----|---------|----------|
| V2 | `src/config/mercadopago.ts:5` | Header "RISE Protocol V2" |
| V3 | `docs/API_GATEWAY_ARCHITECTURE.md:130` | Frase "mantido para compatibilidade" |
| V4 | `docs/PRODUCTS_MODULE_ARCHITECTURE.md:262` | Frase "mantido para compatibilidade" |
| V5 | `docs/CHANGELOG.md:30` | Frase "mantido para compatibilidade" |
| V6 | `src/components/checkout/payment/MIGRATION_GUIDE.md:66` | Frase "temporariamente" |

### MÉDIAS (Higiene)

| ID | Arquivo | Problema |
|----|---------|----------|
| V7 | 33 arquivos src/ | Headers com "RISE Protocol V2" |
| V8 | `index.html:20` | CSP com `*.supabase.co` desnecessário |

## Correções Planejadas

### Correção 1: MercadoPago OAuth URL (CRÍTICA)

**Arquivo:** `src/config/mercadopago.ts`

**Problema:** A URL de callback do OAuth aponta diretamente para Supabase, bypassando o API Gateway.

**Solução:** 
```text
Antes: https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/mercadopago-oauth-callback
Depois: https://api.risecheckout.com/functions/v1/mercadopago-oauth-callback
```

**Também:** Atualizar header para V3.

### Correção 2: Documentação - Frases Proibidas

**docs/API_GATEWAY_ARCHITECTURE.md:130**
```text
Antes: **Nota:** `*.supabase.co` foi mantido para compatibilidade, mas será removido em versões futuras.
Depois: **Nota:** `*.supabase.co` pode ser removido do CSP após validação completa do API Gateway em produção.
```

**docs/PRODUCTS_MODULE_ARCHITECTURE.md:262**
```text
Antes: O campo `external_delivery` (boolean) é mantido para compatibilidade com produtos existentes.
Depois: O campo `external_delivery` (boolean) existe para produtos criados antes do ENUM `delivery_type`.
```

**docs/CHANGELOG.md:30**
```text
Antes: Campo mantido para compatibilidade.
Depois: Campo existente em produtos anteriores ao ENUM.
```

**src/components/checkout/payment/MIGRATION_GUIDE.md:66**
```text
Antes: 📦 Código duplicado temporariamente
Depois: 📦 Código duplicado durante migração
```

### Correção 3: Headers V2 para V3 (33 arquivos)

Atualizar todos os arquivos com "RISE Protocol V2" para "RISE ARCHITECT PROTOCOL V3 - 10.0/10".

Lista completa de arquivos:
1. `src/modules/members-area/pages/buyer/SetupAccess.tsx`
2. `src/lib/storage/storageProxy.ts`
3. `src/hooks/checkout/helpers/fetchOfferData.ts`
4. `src/hooks/checkout/helpers/fetchCheckoutById.ts`
5. `src/hooks/checkout/helpers/fetchAffiliateInfo.ts`
6. `src/integrations/gateways/pushinpay/hooks.ts`
7. `src/pages/CheckoutCustomizer.tsx`
8. `src/hooks/checkout/useCouponValidation.ts`
9. `src/config/whatsapp.ts`
10. `src/lib/checkouts/cloneCheckoutDeep.ts`
11. `src/config/links.ts`
12. `src/pages/mercadopago-payment/hooks/index.ts`
13. `src/pages/mercadopago-payment/hooks/useMercadoPagoTimer.ts`
14. `src/pages/Perfil.tsx`
15. `src/integrations/gateways/mercadopago/hooks/useMercadoPagoConfig.ts`
16. `src/hooks/checkout/useCheckoutProductPixels.ts`
17. `src/lib/links/attachOfferToCheckoutSmart.ts`
18. `src/config/mercadopago.ts`
19. `src/hooks/useDecryptCustomerData.ts`
20. `src/lib/rpc/rpcProxy.ts`
21. `src/components/products/ProductsTable.tsx`
22. `src/modules/members-area/hooks/useContentDrip.ts`
23. `src/lib/payment-gateways/gateways/stripe/StripePix.tsx`
24. E mais 10 arquivos (serão identificados durante execução)

### Correção 4: CSP Cleanup (index.html)

**Arquivo:** `index.html`

**Problema:** `connect-src` inclui `https://*.supabase.co wss://*.supabase.co` que é redundante com API Gateway.

**Decisão:** Manter por ora para realtime/subscriptions que podem não passar pelo gateway. Documentar explicitamente no CSP.

**Ação:** Adicionar comentário explicativo (não é violação crítica).

## Sequência de Execução

1. Corrigir `src/config/mercadopago.ts` (CRÍTICA)
2. Corrigir frases proibidas em docs (4 arquivos)
3. Atualizar headers V2 para V3 (33 arquivos)
4. Validar final

## Impacto

- **Zero breaking changes**: Apenas texto/documentação
- **Melhoria de segurança**: OAuth via Gateway
- **Conformidade total**: 10.0/10 RISE V3

## Tempo Estimado

- Correção CRÍTICA: 2 minutos
- Correções de docs: 5 minutos
- Headers V2 para V3: 15 minutos
- **Total: ~25 minutos**

## Validação Pós-Correção

Buscar por:
1. `grep -r "Protocol V2" src/` → 0 resultados
2. `grep -r "mantido para compatibilidade" .` → 0 resultados
3. `grep -r "temporariamente" src/` → 0 resultados
4. `grep -r "wivbtmtgpsxupfjwwovf.supabase.co" src/` → 0 resultados
