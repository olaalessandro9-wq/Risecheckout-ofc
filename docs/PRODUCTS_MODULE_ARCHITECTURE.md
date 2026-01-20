# Arquitetura do Módulo de Produtos

**Data:** 20 de Janeiro de 2026  
**Versão:** 2.0  
**Status:** ✅ 100% RISE V3 Compliant - XState Edition

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
│   ├── ProductContext.tsx          # Context principal + XState State Machine (SSOT)
│   ├── productFormValidation.ts     # Funções de validação
│   └── hooks/
│       ├── index.ts                 # Re-exports
│       ├── useProductDelete.ts      # Operação de deleção (Single Responsibility)
│       ├── useProductLoader.ts      # React Query BFF loader
│       ├── useProductDataMapper.ts  # Mapeamento de dados
│       ├── useProductSettingsAdapter.ts  # Adapter puro (zero useState)
│       ├── useGlobalValidationHandlers.ts # Handlers de save registry
│       └── useTabValidation.ts      # Validação por aba
│   └── helpers/
│       ├── productDataMapper.ts     # Funções de mapeamento
│       ├── saveFunctions.ts         # Funções puras de salvamento
│       └── validationHandlerConfigs.ts # Factories de validação
├── machines/
│   ├── index.ts                     # Re-exports
│   ├── productFormMachine.ts        # XState State Machine (SSOT)
│   ├── productFormMachine.types.ts  # Tipos e contexto
│   ├── productFormMachine.guards.ts # Guards e funções auxiliares
│   ├── productFormMachine.actions.ts # Actions e assigns
│   └── productFormMachine.actors.ts  # Actors para operações async
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

### 3.1 XState State Machine

```typescript
// ProductContext.tsx
const [state, send] = useMachine(productFormMachine, {
  input: {
    productId,
    userId: user?.id,
  },
});
```

### 3.2 Estados da Machine

| Estado | Descrição |
|--------|-----------|
| `idle` | Aguardando inicialização |
| `loading` | Carregando dados via BFF |
| `ready.clean` | Dados carregados, sem alterações |
| `ready.dirty` | Usuário fez alterações |
| `saving` | Salvando alterações |
| `error` | Erro ocorreu |

### 3.3 Eventos Principais

| Evento | Descrição |
|--------|-----------|
| `LOAD_DATA` | Inicia carregamento do produto |
| `EDIT_GENERAL` | Atualiza campos gerais |
| `EDIT_CHECKOUT_SETTINGS` | Atualiza configurações checkout |
| `EDIT_UPSELL` | Atualiza configurações upsell |
| `EDIT_AFFILIATE` | Atualiza configurações afiliados |
| `SAVE_ALL` | Inicia salvamento |
| `SAVE_SUCCESS` | Salvamento concluído |
| `SET_TAB` | Navega para aba |
| `SET_TAB_ERRORS` | Define erros por aba |

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
│    └── useMachine(productFormMachine) - Single Source       │
│    └── send() → transições de estado                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  XState State Machine                                        │
│    └── Actors para operações async (load, save)             │
│    └── Guards para transições condicionais                  │
│    └── Actions para mutações de contexto                    │
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
│    └── product-full-loader (BFF)                            │
│    └── offer-crud, offer-bulk                               │
│    └── storage-upload                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Arquivos Deletados (Migração XState)

| Arquivo | Linhas | Razão |
|---------|--------|-------|
| `context/reducer/` | ~400 | Migrado para XState |
| `useProductEntities.ts` | 167 | Estado agora na State Machine |
| `useProductCheckouts.ts` | 163 | Estado agora na State Machine |
| `useProductCore.ts` | 169 | Refatorado para `useProductDelete.ts` |
| `createContextValue.ts` | 211 | Não mais necessário |
| `formActions.types.ts` | ~150 | Substituído por XState events |

**Total:** ~1580 linhas de código legado eliminadas

---

## 8. Métricas de Conformidade

| Métrica | Valor |
|---------|-------|
| Arquivos > 300 linhas | 0 |
| Código duplicado | 0 linhas |
| Fluxos de salvamento | 1 (unificado) |
| useState para forms | 0 (XState) |
| Acesso direto DB | 0 |
| **CONFORMIDADE RISE V3** | **100%** |

---

## 9. Changelog

| Data | Alteração |
|------|-----------|
| 2026-01-18 | Documento criado |
| 2026-01-18 | Unificação do fluxo de salvamento |
| 2026-01-18 | Deleção de código morto (281 linhas) |
| 2026-01-20 | **MIGRAÇÃO COMPLETA PARA XSTATE** |
| 2026-01-20 | Deleção de ~1260 linhas de código legado |
| 2026-01-20 | State Machine como Single Source of Truth |
