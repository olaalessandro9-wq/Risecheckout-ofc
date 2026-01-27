
# Plano: Auto-Save de Ofertas com Card Inline

## Objetivo

Quando o vendedor clicar em "Adicionar Nova Oferta", ao invés de criar uma oferta temporária que requer "Salvar Produto":
1. Abre um **card inline** com campos Nome e Preço
2. Card tem botões próprios: **"Salvar"** e **"Cancelar"**
3. Ao clicar "Salvar" no card: oferta é criada via API imediatamente
4. Link de pagamento aparece na aba Links sem precisar F5

---

## Fluxo Visual Proposto

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  ANTES: Botão "Adicionar Nova Oferta" clicado                               │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Oferta Principal                                                       │ │
│  │ [Produto teste                    ] [R$ 9,90                         ] │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 🆕 Nova Oferta                                        [🗑️]             │ │
│  │                                                                        │ │
│  │ Nome da Oferta                           Preço                         │ │
│  │ ┌────────────────────────────────┐   ┌───────────────────────────────┐ │ │
│  │ │ Ex: Plano Premium              │   │ R$ 0,00                       │ │ │
│  │ └────────────────────────────────┘   └───────────────────────────────┘ │ │
│  │ Este nome será usado para gerar o link de pagamento                    │ │
│  │                                                                        │ │
│  │           ┌─────────────┐  ┌────────────────────────┐                  │ │
│  │           │  Cancelar   │  │   💾 Salvar Oferta     │                  │ │
│  │           └─────────────┘  └────────────────────────┘                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ + Adicionar Nova Oferta                                                │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUXO DE CRIAÇÃO                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Usuário clica "Adicionar Nova Oferta"                                   │
│     │                                                                        │
│     ▼                                                                        │
│  2. OffersManager mostra NewOfferCard                                       │
│     ├── State: isCreating = true                                            │
│     ├── Campos: name (vazio), price (0)                                     │
│     └── Botões: "Cancelar" | "Salvar Oferta"                               │
│     │                                                                        │
│     ▼                                                                        │
│  3. Usuário preenche nome + preço                                           │
│     │                                                                        │
│     ▼                                                                        │
│  4. Clica "Salvar Oferta":                                                  │
│     ├── Validação local (nome não vazio, preço > 0)                         │
│     ├── api.call('offer-crud', { action: 'create', product_id, ... })       │
│     ├── Loading spinner no botão                                            │
│     └── Trigger DB: create_payment_link_for_offer()                         │
│     │                                                                        │
│     ▼                                                                        │
│  5. Sucesso:                                                                 │
│     ├── Toast: "Oferta criada com sucesso!"                                 │
│     ├── NewOfferCard é removido (isCreating = false)                        │
│     ├── Oferta aparece na lista via refreshAll()                            │
│     └── Aba Links atualiza automaticamente                                  │
│                                                                              │
│  5b. Cancelar:                                                               │
│     └── NewOfferCard é removido (isCreating = false)                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Componentes e Arquivos

### 1. CRIAR: `src/components/products/offers-manager/NewOfferCard.tsx`

Componente para o card inline de criação de nova oferta:

```typescript
interface NewOfferCardProps {
  productId: string;
  onSave: (offer: CreatedOffer) => void;
  onCancel: () => void;
  hasMembersArea: boolean;
  memberGroups: MemberGroupOption[];
}

// Estrutura:
// - Card com borda destacada (border-primary/50)
// - Badge "Nova Oferta" no topo
// - Campos: Nome, Preço, (Member Group se aplicável)
// - Botões: "Cancelar" (outline) | "Salvar Oferta" (primary, com Loader2)
// - Validação inline
// - api.call('offer-crud', { action: 'create', ... }) no submit
```

### 2. MODIFICAR: `src/components/products/offers-manager/index.tsx`

Adicionar estado e lógica para o card inline:

```typescript
// Mudanças:
// - Importar NewOfferCard
// - Adicionar: const [isCreating, setIsCreating] = useState(false)
// - Botão "Adicionar Nova Oferta" → setIsCreating(true)
// - Renderizar NewOfferCard condicionalmente
// - Prop: onOfferCreated callback
```

### 3. MODIFICAR: `src/components/products/offers-manager/types.ts`

Adicionar tipos e callback:

```typescript
// Adicionar:
export interface OffersManagerProps {
  // ... existing props
  onOfferCreated?: () => void; // Callback após criar oferta via API
}
```

### 4. MODIFICAR: `src/modules/products/tabs/general/ProductOffersSection.tsx`

Passar callback de refresh:

```typescript
// Adicionar:
// - Importar useProductContext
// - Obter refreshAll do context
// - Passar onOfferCreated={() => refreshAll()} para OffersManager
```

---

## Detalhes Técnicos do NewOfferCard

### Campos do Formulário

| Campo | Tipo | Validação |
|-------|------|-----------|
| Nome | Input text | Obrigatório, não vazio |
| Preço | CurrencyInput | Mínimo R$ 0,01 (1 centavo) |
| Grupo de Membros | Select (opcional) | Só aparece se hasMembersArea |

### Chamada API

```typescript
const { data, error } = await api.call<{ success: boolean; offer?: Offer; error?: string }>(
  "offer-crud", 
  {
    action: "create",
    product_id: productId,
    name: name.trim(),
    price: priceInCents,
    is_default: false,
    member_group_id: memberGroupId || null,
  }
);
```

### Estados do Botão "Salvar Oferta"

| Estado | Visual |
|--------|--------|
| Normal | "Salvar Oferta" |
| Loading | `<Loader2 className="animate-spin" />` + "Salvando..." |
| Disabled | Campos inválidos |

---

## Comparação: Ofertas Existentes vs Nova Oferta

| Aspecto | Ofertas Existentes | Nova Oferta (Card Inline) |
|---------|-------------------|---------------------------|
| Como salva | Botão global "Salvar Produto" | Botão "Salvar Oferta" no card |
| Quando salva | Junto com outras alterações | Imediatamente |
| Link criado | Após salvar produto + F5 | Imediatamente (trigger DB) |
| Pode cancelar | Não (já existe) | Sim (botão "Cancelar") |

---

## Resumo das Alterações

| Arquivo | Ação | Linhas Est. |
|---------|------|-------------|
| `NewOfferCard.tsx` | CRIAR | ~120 linhas |
| `offers-manager/index.tsx` | MODIFICAR | +15 linhas |
| `offers-manager/types.ts` | MODIFICAR | +2 linhas |
| `ProductOffersSection.tsx` | MODIFICAR | +8 linhas |

---

## Benefícios

| Benefício | Descrição |
|-----------|-----------|
| UX Clara | Botões "Salvar" e "Cancelar" dentro do card |
| Feedback Imediato | Toast + oferta aparece na lista |
| Zero Confusão | Vendedor sabe exatamente o que foi salvo |
| Link Instantâneo | Aparece na aba Links sem F5 |
| Consistente | Ofertas existentes continuam no fluxo atual |

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Manutenibilidade Infinita | Componente isolado, reutilizável |
| Zero Dívida Técnica | Usa Edge Function existente (offer-crud) |
| Arquitetura Correta | Separação de responsabilidades |
| Escalabilidade | Card pode ter mais campos no futuro |
| Segurança | Autenticação via api.call() |
| Limite 300 linhas | NewOfferCard ~120 linhas |
