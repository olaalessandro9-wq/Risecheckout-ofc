
# Auditoria Técnica Completa: Sistema UTMify Backend SSOT

## 1. Resumo Executivo

A implementação do sistema UTMify Backend SSOT foi **80% bem-sucedida**, com algumas questões que requerem atenção para alcançar conformidade total com o Protocolo RISE V3.

| Critério | Status | Nota |
|----------|--------|------|
| Migração de banco de dados (colunas UTM) | ✅ SUCESSO | 10/10 |
| Persistência de UTM no create-order | ✅ SUCESSO | 10/10 |
| Dispatcher centralizado | ✅ SUCESSO | 10/10 |
| Paridade entre gateways (pix_generated) | ✅ SUCESSO | 10/10 |
| Eventos purchase_approved (webhook) | ✅ SUCESSO | 10/10 |
| Eventos purchase_refused | ✅ SUCESSO | 10/10 |
| Eventos refund/chargeback | ✅ SUCESSO | 10/10 |
| Filtro multi-produto | ✅ SUCESSO | 10/10 |
| Sanitização de token | ✅ SUCESSO | 10/10 |
| **Código morto/duplicação** | ⚠️ PROBLEMA | 6/10 |
| Documentação atualizada | ✅ SUCESSO | 10/10 |

---

## 2. Problemas Identificados

### Problema 1: Duplicação de Disparo UTMify (VIOLAÇÃO RISE V3 - Seção 4)

**Localização:** `src/pages/PaymentSuccessPage.tsx` (linhas 119-184)

**Descrição:** O frontend ainda dispara `purchase_approved` via `sendUTMifyConversion()`, enquanto o backend agora também dispara via `webhook-post-payment.ts`. Isso causa:

1. **Disparo duplicado** do mesmo evento para a API UTMify
2. **Violação do conceito SSOT** (Single Source of Truth)
3. **Dívida técnica** - código legado que deveria ter sido removido

**Evidência:**
```typescript
// PaymentSuccessPage.tsx - LINHA 133-176
await sendUTMifyConversion(
  orderDetails.vendor_id!,
  { ... },
  "purchase_approved",
  orderDetails.product_id
);
```

**Impacto:** O UTMify pode registrar a mesma venda 2 vezes.

---

### Problema 2: Código Morto no Frontend (VIOLAÇÃO RISE V3 - Seção 6.4)

**Localização:** `src/integrations/tracking/utmify/events.ts`

**Descrição:** As funções `trackPageView`, `trackAddToCart`, `trackPurchase` e `trackRefund` existem no frontend mas:
- `trackPageView` e `trackAddToCart` chamam UTMify com dados anônimos inválidos
- `trackPurchase` e `trackRefund` são redundantes com o backend
- Estas funções não são mais necessárias com a arquitetura Backend SSOT

---

### Problema 3: Comentário Desatualizado na Documentação

**Localização:** `docs/EDGE_FUNCTIONS_REGISTRY.md` (linha 247)

**Descrição:** O documento diz:
```markdown
| `utmify-conversion` | `.../utmify-conversion` | ✅ | public | Legacy frontend call (deprecated) |
```

Porém o frontend ainda usa ativamente esta edge function via `PaymentSuccessPage.tsx`.

---

## 3. Verificação de Conformidade Completa

### Schema do Banco (RISE V3 - Seção 6.3)

| Coluna | Existe? | Tipo | Comentário |
|--------|---------|------|------------|
| `utm_source` | ✅ | text | Documentado |
| `utm_medium` | ✅ | text | Documentado |
| `utm_campaign` | ✅ | text | Documentado |
| `utm_content` | ✅ | text | Documentado |
| `utm_term` | ✅ | text | Documentado |
| `src` | ✅ | text | Documentado |
| `sck` | ✅ | text | Documentado |

### Paridade de Gateways (RISE V3 - Seção 4.2)

| Gateway | pix_generated | purchase_approved | purchase_refused | refund | chargeback |
|---------|---------------|-------------------|------------------|--------|------------|
| PushinPay | ✅ post-pix.ts | ✅ webhook-post-payment | ✅ webhook | ✅ webhook-post-refund | ✅ |
| Asaas | ✅ charge-creator.ts | ✅ webhook-post-payment | ✅ webhook | ✅ webhook-post-refund | ✅ |
| Stripe | ✅ post-payment.ts | ✅ webhook-post-payment | ✅ stripe-webhook | ✅ webhook-post-refund | ✅ |
| MercadoPago | ✅ mercadopago-create-payment | ✅ webhook-post-payment | ✅ mercadopago-webhook | ✅ webhook-post-refund | ✅ |

### Filtro por Evento/Produto (RISE V3)

| Funcionalidade | Implementado? | Localização |
|----------------|---------------|-------------|
| Verificar selected_events | ✅ | utmify-dispatcher.ts:141 |
| Verificar selected_products | ✅ | utmify-dispatcher.ts:147-149 |
| Suporte multi-itens (bumps) | ✅ | utmify-dispatcher.ts:148 `productIds.some()` |
| Skip quando não habilitado | ✅ | utmify-dispatcher.ts:279 `reason: "not_enabled"` |

### Sanitização de Token

| Local | Implementado? | Método |
|-------|---------------|--------|
| vault-save (ao salvar) | ✅ | linhas 182-203 |
| utmify-dispatcher (ao usar) | ✅ | linhas 185-189 |
| utmify-conversion (ao usar) | ✅ | linhas 117-121 |

---

## 4. Correções Necessárias

### Correção 1: Remover Disparo Duplicado do Frontend

**Arquivo:** `src/pages/PaymentSuccessPage.tsx`

**Ação:** Remover o bloco de código que dispara UTMify (linhas 119-184), mantendo apenas o backend como SSOT.

**Justificativa RISE V3:**
- Seção 4.2: Manutenibilidade Infinita - Código duplicado viola este princípio
- Seção 4.5: "Nada é temporário" - O código legado não pode coexistir com a nova arquitetura
- Seção 5.4: Zero Dívida Técnica - Cada linha deve ser um ativo, não passivo

### Correção 2: Limpar Funções Mortas do Frontend

**Arquivo:** `src/integrations/tracking/utmify/events.ts`

**Ação:** Manter apenas:
- `extractUTMParameters` (usado pelo createOrderActor)
- `formatDateForUTMify` (pode ser útil para UI)

Remover ou deprecar formalmente:
- `sendUTMifyConversion` (agora é backend-only)
- `trackPageView` (não implementado corretamente)
- `trackAddToCart` (não implementado corretamente)
- `trackPurchase` (redundante com backend)
- `trackRefund` (redundante com backend)

### Correção 3: Atualizar Documentação do EDGE_FUNCTIONS_REGISTRY

**Arquivo:** `docs/EDGE_FUNCTIONS_REGISTRY.md`

**Ação:** Atualizar a nota sobre `utmify-conversion`:

```markdown
> **RISE V3 - UTMify Backend SSOT**: Eventos UTMify (`pix_generated`, `purchase_approved`, 
> `purchase_refused`, `refund`, `chargeback`) são disparados diretamente no backend via 
> `_shared/utmify-dispatcher.ts`. O endpoint `utmify-conversion` deve ser removido do frontend.
> **Código legado em PaymentSuccessPage.tsx deve ser removido.**
```

---

## 5. Análise de Soluções (RISE V3 Seção 4.4)

### Solução A: Correção Completa - Remover Toda Duplicação
- Manutenibilidade: 10/10 - Zero código duplicado
- Zero DT: 10/10 - Nenhum código legado restante
- Arquitetura: 10/10 - Backend SSOT puro
- Escalabilidade: 10/10 - Única fonte de verdade
- Segurança: 10/10 - Sem exposição desnecessária
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 1-2 horas

### Solução B: Manter Frontend como Fallback
- Manutenibilidade: 6/10 - Duplicação intencional
- Zero DT: 4/10 - Código "backup" é dívida
- Arquitetura: 5/10 - Viola SSOT
- Escalabilidade: 7/10 - Funciona mas é redundante
- Segurança: 8/10 - OK
- **NOTA FINAL: 6.0/10**
- Tempo estimado: 0 horas (não fazer nada)

### DECISÃO: Solução A (Nota 10.0/10)

Conforme RISE V3 Seção 4.6:
> "Se durante uma análise você identificar que a Solução A é nota 10 e a Solução B é nota 6, a escolha é OBRIGATORIAMENTE a Solução A."

---

## 6. Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/pages/PaymentSuccessPage.tsx` | MODIFICAR | Remover bloco UTMify (linhas 119-184) + imports |
| `src/integrations/tracking/utmify/events.ts` | MODIFICAR | Deprecar funções redundantes |
| `src/integrations/tracking/utmify/index.ts` | MODIFICAR | Atualizar exports |
| `docs/EDGE_FUNCTIONS_REGISTRY.md` | MODIFICAR | Documentar remoção do frontend |

---

## 7. O que Está Funcionando Corretamente

1. **Migração de banco aplicada** - 7 colunas UTM existem na tabela `orders`
2. **Frontend envia UTMs no create-order** - `createOrderActor.ts` extrai e envia
3. **Backend persiste UTMs** - `order-creator.ts` salva no banco
4. **Dispatcher centralizado funciona** - `utmify-dispatcher.ts` com 515 linhas bem estruturadas
5. **Todos os 4 gateways disparam pix_generated** - PushinPay, Asaas, Stripe, MercadoPago
6. **Webhooks disparam purchase_approved** - via `webhook-post-payment.ts`
7. **Webhooks disparam purchase_refused** - via stripe-webhook e mercadopago-webhook
8. **Webhooks disparam refund/chargeback** - via `webhook-post-refund.ts`
9. **Filtro por evento/produto funciona** - `isEventEnabled()` com suporte multi-itens
10. **Sanitização de token implementada** - em vault-save, dispatcher e utmify-conversion
11. **Documentação atualizada** - EDGE_FUNCTIONS_REGISTRY.md menciona Backend SSOT

---

## 8. Conformidade Final RISE V3

### Antes das Correções

| Critério | Peso | Nota | Ponderado |
|----------|------|------|-----------|
| Manutenibilidade Infinita | 30% | 7/10 | 2.1 |
| Zero Dívida Técnica | 25% | 6/10 | 1.5 |
| Arquitetura Correta | 20% | 8/10 | 1.6 |
| Escalabilidade | 15% | 10/10 | 1.5 |
| Segurança | 10% | 10/10 | 1.0 |
| **TOTAL** | 100% | | **7.7/10** |

### Após as Correções Propostas

| Critério | Peso | Nota | Ponderado |
|----------|------|------|-----------|
| Manutenibilidade Infinita | 30% | 10/10 | 3.0 |
| Zero Dívida Técnica | 25% | 10/10 | 2.5 |
| Arquitetura Correta | 20% | 10/10 | 2.0 |
| Escalabilidade | 15% | 10/10 | 1.5 |
| Segurança | 10% | 10/10 | 1.0 |
| **TOTAL** | 100% | | **10.0/10** |

---

## 9. Próximos Passos (Implementação)

1. **Remover disparo UTMify do PaymentSuccessPage.tsx**
   - Deletar imports de sendUTMifyConversion e formatDateForUTMify
   - Deletar useRef utmifyFiredRef
   - Deletar useEffect que dispara trackPurchase

2. **Deprecar funções no events.ts**
   - Adicionar JSDoc @deprecated nas funções redundantes
   - Ou remover completamente se não há outros usos

3. **Atualizar barrel exports**
   - Remover exports das funções deprecated de index.ts

4. **Atualizar documentação**
   - Marcar utmify-conversion como "backend-only" ou "to be deprecated"

5. **Testar end-to-end**
   - Criar pedido via checkout
   - Verificar que UTM é persistido no banco
   - Verificar que apenas o backend dispara para UTMify (sem duplicação)
