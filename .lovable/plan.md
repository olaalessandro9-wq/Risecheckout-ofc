
# Plano de Correção: Facebook CAPI com Order Bumps e numItems

## Resumo Executivo

A auditoria identificou que o Facebook CAPI está funcionando corretamente para valor (com cupom e bumps), deduplicação e resiliência. Porém, **dois campos críticos estão incompletos**:

1. `content_ids` — só envia o produto principal, ignorando order bumps
2. `numItems` — não é enviado (deveria ser a quantidade total de itens)

Isso prejudica a otimização de campanhas e relatórios no Facebook Ads Manager.

---

## Análise de Soluções (RISE V3 Obrigatório)

### Solução A: Patch Mínimo no Dispatcher

Adicionar extração de todos os product_ids diretamente na função `dispatchFacebookCAPIForOrder`.

- Manutenibilidade: 7/10 — Lógica misturada no dispatcher
- Zero DT: 6/10 — Pode precisar ajustes futuros se order_items mudar
- Arquitetura: 6/10 — Viola SRP (dispatcher faz parse de dados)
- Escalabilidade: 7/10 — Funciona mas não é extensível
- Segurança: 10/10 — Sem impacto
- **NOTA FINAL: 7.2/10**
- Tempo estimado: 30 minutos

### Solução B: Refatoração do Order Fetcher (SSOT)

Refatorar `fetchOrderForCAPI` para retornar estrutura completa com todos os itens, e atualizar o tipo `FacebookCAPIOrderData`. O dispatcher apenas orquestra, sem fazer parse de dados.

- Manutenibilidade: 10/10 — Dados estruturados na origem
- Zero DT: 10/10 — Tipo correto reflete realidade do banco
- Arquitetura: 10/10 — SSOT + SRP respeitados
- Escalabilidade: 10/10 — Adicionar mais campos é trivial
- Segurança: 10/10 — Sem impacto
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 1 hora

### DECISÃO: Solução B (Nota 10.0)

A Solução A é um patch que cria dívida técnica. A Solução B resolve na raiz, mantendo o padrão SSOT do projeto.

---

## Arquivos a Modificar

### 1. `supabase/functions/_shared/facebook-capi/types.ts`

Adicionar array de itens no tipo `FacebookCAPIOrderData`:

```typescript
export interface FacebookCAPIOrderItem {
  productId: string;
  productName: string | null;
  isBump: boolean;
}

export interface FacebookCAPIOrderData {
  // ... campos existentes ...
  items: FacebookCAPIOrderItem[];  // NOVO
}
```

### 2. `supabase/functions/_shared/facebook-capi/dispatcher.ts`

**fetchOrderForCAPI:**
- Adicionar `is_bump` ao select de `order_items`
- Mapear todos os itens para o array `items`

**dispatchFacebookCAPIForOrder:**
- Extrair `contentIds` de todos os `order.items`
- Calcular `numItems` = `order.items.length`

```typescript
// ANTES
contentIds: [order.productId],

// DEPOIS
contentIds: order.items.map(item => item.productId),
numItems: order.items.length,
```

### 3. Deploy

Redeployar a edge function após correção (o dispatcher é código compartilhado, usado pelo webhook-post-payment).

---

## Fluxo Corrigido

```text
┌─────────────────────────────────────────────────────────────┐
│  Pedido: Produto Principal + 2 Order Bumps                  │
│  Total: R$ 297,00 (após cupom de 10%)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  fetchOrderForCAPI                                           │
│  - orderId: "abc-123"                                        │
│  - amountCents: 29700 (valor FINAL com desconto)            │
│  - items: [                                                  │
│      { productId: "prod-1", productName: "Curso", isBump: false },
│      { productId: "prod-2", productName: "Ebook", isBump: true },
│      { productId: "prod-3", productName: "Planilha", isBump: true }
│    ]                                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Facebook CAPI Payload                                       │
│  - event_name: "Purchase"                                    │
│  - event_id: "purchase_abc-123"                              │
│  - value: 297.00 (BRL)                                       │
│  - content_ids: ["prod-1", "prod-2", "prod-3"]              │
│  - content_type: "product"                                   │
│  - num_items: 3                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Validação Pós-Correção

Após aplicar as correções, você pode testar:

1. **Criar um pedido com bumps** no checkout
2. **Verificar logs** da edge function `facebook-conversion-api`
3. **Conferir no Events Manager** se todos os `content_ids` aparecem
4. **Verificar numItems** = quantidade de produtos no pedido

---

## Resumo da Auditoria

| Aspecto | Status Antes | Status Após |
|---------|--------------|-------------|
| Valor com Cupom | ✅ Correto | ✅ Correto |
| Valor com Bumps | ✅ Correto | ✅ Correto |
| content_ids (todos os produtos) | ❌ Só principal | ✅ Todos os itens |
| numItems | ❌ Ausente | ✅ Presente |
| Deduplicação | ✅ Correto | ✅ Correto |
| Resiliência (retry + queue) | ✅ Correto | ✅ Correto |

**Após esta correção, o sistema de Facebook Pixel + CAPI estará 100% funcional para todos os cenários.**
