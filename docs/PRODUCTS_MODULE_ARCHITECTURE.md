# Arquitetura do Módulo de Produtos

**Data:** 18 de Janeiro de 2026  
**Versão:** 1.0  
**Status:** ✅ 100% RISE V3 Compliant

---

## 1. Visão Geral

O módulo de produtos gerencia todo o ciclo de vida de produtos na plataforma RiseCheckout, incluindo:

- Informações gerais (nome, descrição, preço)
- Imagens de produto
- Ofertas e variações de preço
- Configurações de checkout
- Upsells e Order Bumps
- Sistema de afiliados
- Área de membros

---

## 2. Estrutura de Diretórios

```
src/modules/products/
├── context/
│   ├── ProductContext.tsx          # Context principal + useReducer (SSOT)
│   ├── reducer.ts                   # Reducer com todas as actions
│   ├── productFormValidation.ts     # Funções de validação
│   └── hooks/
│       ├── index.ts                 # Re-exports
│       ├── useProductCore.ts        # Dados core do produto
│       ├── useProductEntities.ts    # Offers, checkouts, links
│       ├── useProductCheckouts.ts   # Operações de checkout
│       ├── useProductSettingsAdapter.ts  # Adapter puro (zero useState)
│       ├── useGlobalValidationHandlers.ts # Handlers de save registry
│       └── useTabValidation.ts      # Validação por aba
│   └── helpers/
│       ├── saveFunctions.ts         # Funções puras de salvamento
│       ├── saveWrappers.ts          # Wrappers com estado
│       ├── createSaveAll.ts         # Orquestrador de save
│       └── validationHandlerConfigs.ts # Factories de validação
├── tabs/
│   ├── GeneralTab.tsx               # Aba Geral
│   ├── general/
│   │   ├── index.ts                 # Re-exports
│   │   ├── useGeneralTab.ts         # Hook orquestrador (view only)
│   │   ├── types.ts                 # Tipos da aba
│   │   ├── GeneralTabActions.tsx    # Botão de exclusão
│   │   ├── ProductInfoSection.tsx   # Seção info
│   │   ├── ProductImageSection.tsx  # Seção imagem
│   │   ├── ProductOffersSection.tsx # Seção ofertas
│   │   ├── ProductSupportSection.tsx # Seção suporte
│   │   ├── ProductDeliverySection.tsx # Seção entrega
│   │   └── hooks/
│   │       ├── useGeneralTabImage.ts     # View only
│   │       ├── useGeneralTabOffers.ts    # View only
│   │       └── useGeneralTabMemberGroups.ts
│   ├── SettingsTab.tsx              # Aba Configurações
│   ├── UpsellTab.tsx                # Aba Upsell
│   └── AffiliatesTab.tsx            # Aba Afiliados
└── types/
    ├── product.types.ts             # Tipos de produto
    ├── productForm.types.ts         # Tipos de formulário
    └── saveRegistry.types.ts        # Tipos do registry
```

---

## 3. State Management (Single Source of Truth)

### 3.1 Padrão Reducer

```typescript
// ProductContext.tsx
const [formState, dispatchForm] = useReducer(productFormReducer, initialFormState);
```

### 3.2 Actions Disponíveis

| Action | Descrição |
|--------|-----------|
| `INIT_FROM_PRODUCT` | Inicializa estado do produto |
| `UPDATE_GENERAL` | Atualiza campos gerais |
| `UPDATE_CHECKOUT_SETTINGS` | Atualiza configurações checkout |
| `UPDATE_UPSELL` | Atualiza configurações upsell |
| `UPDATE_AFFILIATE` | Atualiza configurações afiliados |
| `SET_VALIDATION_ERROR` | Define erro de validação |
| `CLEAR_VALIDATION_ERRORS` | Limpa erros |
| `MARK_SAVED` | Marca seção como salva |
| `RESET_OFFERS` | Reseta estado de ofertas |

---

## 4. Sistema de Validação Global

### 4.1 Fluxo

```
Botão "Salvar Produto" (header)
    └── saveAll()
          └── useGlobalValidationHandlers
                ├── Valida General (order: 10)
                ├── Valida Checkout Settings (order: 20)
                ├── Valida Upsell (order: 30)
                └── Valida Affiliate (order: 40)
          └── Se válido: executa saves em paralelo
          └── Se inválido: navega para aba com erro
```

### 4.2 Handlers Registrados

| Handler | Order | Tab Key | Arquivo |
|---------|-------|---------|---------|
| general | 10 | geral | validationHandlerConfigs.ts |
| checkout-settings | 20 | configuracoes | validationHandlerConfigs.ts |
| upsell | 30 | upsell | validationHandlerConfigs.ts |
| affiliate | 40 | afiliados | validationHandlerConfigs.ts |

---

## 5. Funções de Salvamento

### 5.1 Localização

Todas as funções de save estão em `saveFunctions.ts`:

| Função | Responsabilidade |
|--------|-----------------|
| `uploadProductImage` | Upload de imagem via Edge Function |
| `saveDeletedOffers` | Deleta ofertas marcadas |
| `saveOffers` | Salva ofertas em bulk |
| `saveGeneralProduct` | Salva informações gerais |
| `saveCheckoutSettingsProduct` | Salva configurações checkout |

### 5.2 Zero Duplicação

**ANTES:** Funções duplicadas em hooks locais + saveFunctions  
**DEPOIS:** Apenas em saveFunctions.ts (único lugar)

---

## 6. Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│  UI Components (Pure Views)                                  │
│    └── Consomem estado via useProductContext()              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  ProductContext (Provider)                                   │
│    └── useReducer → formState (Single Source of Truth)      │
│    └── dispatchForm → mutações de estado                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  useGlobalValidationHandlers                                 │
│    └── Registra handlers de save                            │
│    └── Executa validação global                             │
│    └── Chama saveFunctions.ts                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Edge Functions (Backend)                                    │
│    └── product-settings                                      │
│    └── offer-crud, offer-bulk                               │
│    └── storage-upload                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Arquivos Deletados (Código Morto)

| Arquivo | Linhas | Razão |
|---------|--------|-------|
| `useSettingsHandlerRegistration.ts` | 138 | Nunca importado, substituído por useGlobalValidationHandlers |
| `useGeneralTabSave.ts` | 143 | Salvamento duplicado, unificado via header global |

**Total:** 281 linhas de código morto eliminadas

---

## 8. Métricas de Conformidade

| Métrica | Valor |
|---------|-------|
| Arquivos > 300 linhas | 0 |
| Código duplicado | 0 linhas |
| Fluxos de salvamento | 1 (unificado) |
| useState para forms | 0 (useReducer) |
| Acesso direto DB | 0 |
| **CONFORMIDADE RISE V3** | **100%** |

---

## 9. Changelog

| Data | Alteração |
|------|-----------|
| 2026-01-18 | Documento criado |
| 2026-01-18 | Unificação do fluxo de salvamento |
| 2026-01-18 | Deleção de código morto (281 linhas) |
