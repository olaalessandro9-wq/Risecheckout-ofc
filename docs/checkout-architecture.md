# Arquitetura de Checkout Unificado

## Visão Geral

Este documento descreve a arquitetura de componentes compartilhados implementada para unificar as três visualizações do checkout: **Builder/Editor**, **Preview** e **Checkout Público**. O objetivo principal é garantir **consistência visual e de código**, eliminando a necessidade de manter três bases de código separadas.

Com esta nova arquitetura, qualquer alteração em um componente compartilhado é refletida automaticamente em todas as três visualizações, garantindo um **Single Source of Truth**.

## Estrutura de Arquivos

```
/src
├── components
│   └── checkout
│       ├── shared          # ✅ Componentes compartilhados (Single Source of Truth)
│       │   ├── SharedProductSection.tsx
│       │   ├── SharedPersonalDataForm.tsx
│       │   ├── SharedPaymentMethodSelector.tsx
│       │   ├── SharedOrderBumps.tsx
│       │   ├── SharedOrderSummary.tsx
│       │   └── SharedCheckoutButton.tsx
│       └── v2
│           └── PublicCheckoutV2.tsx # 🗑️ Componentes antigos (depreciados)
├── features
│   └── checkout-builder
│       ├── components
│       │   ├── CheckoutEditorMode.tsx # ♻️ Refatorado
│       │   └── CheckoutPreviewLayout.tsx # ♻️ Refatorado
│       └── config
│           └── settings.config.ts # Ordem das seções no builder
└── pages
    └── PublicCheckoutV2.tsx # ♻️ Refatorado
```

## Componentes Compartilhados

O coração da nova arquitetura são os componentes localizados em `/src/components/checkout/shared/`. Cada componente é responsável por uma seção específica do checkout e é projetado para funcionar em três modos diferentes: `editor`, `preview` e `public`.

| Componente | Responsabilidade | Modos Suportados |
|---|---|---|
| `SharedProductSection` | Exibe imagem, nome, descrição e preço do produto | `editor`, `preview`, `public` |
| `SharedPersonalDataForm` | Formulário de dados pessoais (nome, email, CPF, telefone) | `editor`, `preview`, `public` |
| `SharedPaymentMethodSelector` | Seleção de método de pagamento (PIX/Cartão) | `editor`, `preview`, `public` |
| `SharedOrderBumps` | Ofertas de order bump | `editor`, `preview`, `public` |
| `SharedOrderSummary` | Resumo do pedido com total | `editor`, `preview`, `public` |
| `SharedCheckoutButton` | Botão de finalizar compra + mensagens de segurança | `editor`, `preview`, `public` |

### Modo de Operação

Cada componente compartilhado aceita uma prop `mode` que controla seu comportamento:

- **`mode=\'editor\'`**: Usado no **Builder**. Exibe todos os elementos, mas com interações desabilitadas para permitir a edição visual.
- **`mode=\'preview\'`**: Usado no **Preview do Builder**. Simula a aparência do checkout público, mas com dados de exemplo e interações desabilitadas.
- **`mode=\'public\'`**: Usado no **Checkout Público**. Funcionalidade completa, com validação de formulário, processamento de pagamento e tracking.

## Fluxo de Dados

O fluxo de dados foi centralizado em uma série de hooks customizados para garantir a separação de responsabilidades:

| Hook | Responsabilidade |
|---|---|
| `useCheckoutData` | Busca os dados do checkout, produto, design e order bumps. |
| `useFormManager` | Gerencia o estado do formulário (dados, erros, bumps selecionados), validação e cálculo do total. |
| `usePaymentGateway` | Orquestra o ciclo de vida do pagamento (SDK do Mercado Pago, criação de pedido, submissão de pagamento). |
| `useTrackingService` | Dispara eventos de tracking (Facebook Pixel, Google Ads, etc.). |

## Ordem Correta dos Elementos

A ordem das seções do checkout é definida em `/src/features/checkout-builder/config/settings.config.ts` e renderizada na seguinte sequência:

1. **Produto** (`SharedProductSection`)
2. **Dados Pessoais** (`SharedPersonalDataForm`)
3. **Método de Pagamento** (`SharedPaymentMethodSelector`)
4. **Order Bumps** (`SharedOrderBumps`)
5. **Resumo do Pedido** (`SharedOrderSummary`)
6. **Botão de Finalizar Compra** (`SharedCheckoutButton`)

## Como Adicionar Novas Funcionalidades

Para adicionar uma nova seção ou funcionalidade ao checkout, siga estes passos:

1. **Crie um novo componente compartilhado** em `/src/components/checkout/shared/`.
2. **Adicione suporte aos 3 modos** (`editor`, `preview`, `public`).
3. **Integre o novo componente** nos layouts `CheckoutEditorMode`, `CheckoutPreviewLayout` e `PublicCheckoutV2`.
4. **Adicione a nova seção** ao arquivo de configuração `settings.config.ts` para que ela apareça no painel de Design do builder.

## Conclusão

Esta arquitetura unificada reduz drasticamente a complexidade de manutenção, elimina inconsistências e cria uma base de código sólida e escalável para o futuro. Qualquer desenvolvedor pode agora adicionar ou modificar funcionalidades de forma rápida e segura, com a garantia de que as alterações serão refletidas em todo o sistema.
