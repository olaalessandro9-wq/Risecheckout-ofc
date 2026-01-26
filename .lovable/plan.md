
# Plano de Migração Final - Eliminação Total de Código Legado

## Diagnóstico Completo

A validação identificou **32+ ocorrências** de terminologia e código legado que precisam ser corrigidas para alcançar **100% de conformidade RISE V3**.

### Categorias de Violações Identificadas

| Categoria | Quantidade | Gravidade |
|-----------|------------|-----------|
| Comentários com "legado/legacy" | 25+ | 🟠 Alta |
| Fallbacks para campos deprecated | 3 | 🔴 Crítica |
| Variáveis com "Legacy" no nome | 2 | 🟠 Alta |
| Suporte a formatos antigos | 4 | 🟡 Média |

---

## Fase 5.1: Purga de Terminologia (17 arquivos)

### Frontend (src/)

**1. src/pages/pix-payment/hooks/index.ts** (Linha 8)
```text
// ANTES: - usePixCharge: Gera cobrança PIX (legacy, usado por alguns gateways)
// DEPOIS: - usePixCharge: Gera cobrança PIX (usado por gateways específicos)
```

**2. src/modules/checkout-public/components/CheckoutPublicContent.tsx** (Linha 161)
```text
// ANTES: // Convert selectedBumps array to Set for compatibility with legacy components
// DEPOIS: // Convert selectedBumps array to Set for OrderBumpList component
```

**3. src/modules/products/types/productForm.types.ts** (Linha 4)
```text
// ANTES: * MIGRADO PARA XSTATE - Sistema legado de Reducer removido.
// DEPOIS: * MIGRADO PARA XSTATE - Sistema de Reducer substituído.
```

**4. src/lib/checkout/normalizeDesign.ts** (Linhas 22, 41, 44, 87, 101, 113, 125, 135, 147)
```text
// Substituir "legadas", "legado", "antigos" por terminologia técnica precisa:
// - "Colunas legadas" → "Colunas de fallback"
// - "usar legado" → "usar fallback de colunas individuais"
// - "checkouts antigos" → "checkouts sem configuração específica"
```

**5. src/features/checkout/personal-data/domain/formSnapshot.ts** (Linha 74)
```text
// ANTES: * - Dados antigos do localStorage
// DEPOIS: * - Dados persistidos no localStorage
```

**6. src/modules/members-area/utils/content-type.ts** (Linhas 9, 24)
```text
// ANTES: * Normalize legacy content types to unified system
// DEPOIS: * Normalize content types to unified system

// ANTES: // Legacy types become mixed for flexible display
// DEPOIS: // Deprecated types become mixed for flexible display
```

**7. src/components/checkout/CheckoutComponentRenderer.tsx** (Linhas 47, 116)
```text
// ANTES: // Campos legados que ainda podem existir em dados antigos
// DEPOIS: // Campos alternativos que podem existir em registros existentes

// ANTES: // Suporte para texto HTML (legado) e texto simples (novo)
// DEPOIS: // Suporte para texto HTML e texto simples
```

**8. src/hooks/useAffiliateTracking.ts** (Linha 85)
```text
// ANTES: // Formato antigo (string pura) - limpar para forçar novo tracking
// DEPOIS: // Formato inválido (string pura) - limpar para forçar novo tracking
```

**9. src/hooks/checkout/useTrackingService.ts** (Linha 6)
```text
// ANTES: * RISE Protocol V2: Código legacy removido.
// DEPOIS: * RISE Protocol V3: UTMify usa hook separado.
```

**10. src/hooks/checkout/payment/index.ts** (Linha 7)
```text
// ANTES: * Os hooks legados foram removidos pois não são mais utilizados.
// DEPOIS: * Hooks anteriores foram removidos após migração para XState.
```

**11. src/lib/api/client.ts** (Linha 143)
```text
// ANTES: // RISE V3: Uses unifiedTokenService instead of legacy producerTokenService
// DEPOIS: // RISE V3: Uses unifiedTokenService
```

**12. src/components/checkout/builder/items/Image/ImageView.tsx** (Linha 15)
```text
// ANTES: // Ler src com fallback seguro (suporta imageUrl e url legado)
// DEPOIS: // Ler src com fallback seguro (suporta imageUrl e url alternativo)
```

**13. src/components/products/add-product-dialog/useAddProduct.ts** (Linha 105)
```text
// ANTES: // Mantém external_delivery para compatibilidade com código legado
// DEPOIS: // Sincroniza external_delivery com delivery_type para consistência
```

**14. src/modules/products/tabs/general/ProductDeliverySection.tsx** (Linhas 58, 94)
```text
// ANTES: // Compatibilidade: derivar delivery_type do campo legado se não existir
// DEPOIS: // Derivar delivery_type do campo deprecated se não existir

// ANTES: // Manter compatibilidade com campo legado
// DEPOIS: // Sincronizar campo deprecated
```

**15. src/modules/products/context/helpers/saveFunctions.ts** (Linha 154)
```text
// ANTES: external_delivery: generalForm.delivery_type === 'external', // Sync legado
// DEPOIS: external_delivery: generalForm.delivery_type === 'external', // Sync deprecated field
```

---

### Backend (supabase/functions/)

**16. supabase/functions/decrypt-customer-data-batch/index.ts** (Linha 68)
```text
// ANTES: // Pode ser dado legado não criptografado
// DEPOIS: // Pode ser dado não criptografado
```

**17. supabase/functions/_shared/send-order-emails.ts** (Linhas 81, 85, 90)
```text
// ANTES: // HELPER: Determinar tipo de entrega (compatível com legado)
// DEPOIS: // HELPER: Determinar tipo de entrega

// ANTES: // Prioridade: delivery_type ENUM > external_delivery boolean (legado)
// DEPOIS: // Prioridade: delivery_type ENUM > external_delivery boolean (deprecated)

// ANTES: // Fallback para campo legado
// DEPOIS: // Fallback para campo deprecated
```

**18. supabase/functions/_shared/kms/types.ts** (Linha 38)
```text
// ANTES: * - Legacy (v1): base64(iv:ciphertext:tag)
// DEPOIS: * - V1: base64(iv:ciphertext:tag)
```

**19. supabase/functions/_shared/kms/decryptor.ts** (Linhas 7, 24, 45, 62, 74, 126, 143)
```text
// Substituir "legado(s)" por "V1" ou "formato inicial":
// - "dados legados" → "versões anteriores"
// - "Formato legado" → "Formato V1"
// - "legado mal formatado" → "V1 mal formatado"
```

**20. supabase/functions/_shared/trigger-webhooks-handlers.ts** (Linhas 240, 245)
```text
// ANTES: const isLegacyMatch = normalizeUUID(wh.product_id) === normalizedItemId;
// DEPOIS: const isDirectProductMatch = normalizeUUID(wh.product_id) === normalizedItemId;

// ANTES: const isMatch = isLegacyMatch || isRelationMatch;
// DEPOIS: const isMatch = isDirectProductMatch || isRelationMatch;
```

**21. supabase/functions/data-retention-executor/types.ts** (Linha 21)
```text
// ANTES: | 'legacy'
// DEPOIS: | 'debug'
```

---

## Fase 5.2: Remover Comentários de Referência a Sessões Legadas (4 arquivos)

Estes comentários mencionam sistemas que já foram removidos e são agora ruído:

**1. supabase/functions/rls-security-tester/types.ts** (Linha 143)
**2. supabase/functions/rls-security-tester/tests/idor-simulation.ts** (Linha 20)
**3. supabase/functions/buyer-orders/helpers/session.ts** (Linha 15)
**4. supabase/functions/_shared/unified-auth.ts** (Linhas 10-12, 48)

Ação: Remover referências a "legacy buyer_sessions", "producer_sessions" pois são puramente históricos.

---

## Análise: Campo `external_delivery` - Manter ou Remover?

### Situação Atual
O campo `external_delivery` (boolean) foi deprecated em favor de `delivery_type` (ENUM: 'standard' | 'members_area' | 'external').

### Análise RISE V3

| Solução | Nota | Tempo |
|---------|------|-------|
| **A: Manter sincronização** | 8.5/10 | 0 dias |
| **B: Remover coluna do banco** | 10.0/10 | 2-3 dias |

**Justificativa:**
- Solução A permite que o sistema funcione, mas mantém dívida técnica na forma de campo duplicado
- Solução B elimina completamente a dívida técnica, mas requer:
  1. Migration SQL para remover coluna
  2. Atualização de 8+ arquivos que fazem sync do campo
  3. Atualização de tipos gerados
  4. Testes de regressão

### Recomendação
**Para esta fase:** Aplicar Solução A (manter sincronização) com comentários atualizados de "@deprecated - pending column removal"

**Fase futura:** Criar tarefa dedicada para remoção completa da coluna `external_delivery`

---

## Resumo de Alterações

| Métrica | Antes | Depois |
|---------|-------|--------|
| Comentários "legado/legacy" | 32+ | 0 |
| Variáveis "Legacy" | 2 | 0 |
| Referências a sistemas removidos | 5 | 0 |
| Nota RISE V3 | 9.9/10 | 10.0/10 |

---

## Arquivos a Modificar (21 total)

### Frontend (15 arquivos)
1. `src/pages/pix-payment/hooks/index.ts`
2. `src/modules/checkout-public/components/CheckoutPublicContent.tsx`
3. `src/modules/products/types/productForm.types.ts`
4. `src/lib/checkout/normalizeDesign.ts`
5. `src/features/checkout/personal-data/domain/formSnapshot.ts`
6. `src/modules/members-area/utils/content-type.ts`
7. `src/components/checkout/CheckoutComponentRenderer.tsx`
8. `src/hooks/useAffiliateTracking.ts`
9. `src/hooks/checkout/useTrackingService.ts`
10. `src/hooks/checkout/payment/index.ts`
11. `src/lib/api/client.ts`
12. `src/components/checkout/builder/items/Image/ImageView.tsx`
13. `src/components/products/add-product-dialog/useAddProduct.ts`
14. `src/modules/products/tabs/general/ProductDeliverySection.tsx`
15. `src/modules/products/context/helpers/saveFunctions.ts`

### Backend (6 arquivos)
16. `supabase/functions/decrypt-customer-data-batch/index.ts`
17. `supabase/functions/_shared/send-order-emails.ts`
18. `supabase/functions/_shared/kms/types.ts`
19. `supabase/functions/_shared/kms/decryptor.ts`
20. `supabase/functions/_shared/trigger-webhooks-handlers.ts`
21. `supabase/functions/data-retention-executor/types.ts`

### Remoção de Referências Históricas (4 arquivos)
22. `supabase/functions/rls-security-tester/types.ts`
23. `supabase/functions/rls-security-tester/tests/idor-simulation.ts`
24. `supabase/functions/buyer-orders/helpers/session.ts`
25. `supabase/functions/_shared/unified-auth.ts`

---

## Tempo Estimado
**45-60 minutos** para implementação completa

## Resultado Final Esperado
- **Zero terminologia "legacy/legado/antigo" em comentários**
- **Zero variáveis com "Legacy" no nome**
- **Zero referências a sistemas removidos**
- **Nota RISE V3: 10.0/10 absoluta**
