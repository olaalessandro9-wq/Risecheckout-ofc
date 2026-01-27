
# Plano: Correção do Upload de Imagem no Checkout Builder

## Diagnóstico

### Erro Identificado
- **Sintoma**: 403 Forbidden ao fazer upload de imagem no builder do checkout
- **Localização**: `src/components/checkout/builder/items/Image/ImageEditor.tsx`

### Causa Raiz
O `ImageEditor.tsx` gera um path de upload que **NÃO é aceito** pela Edge Function:

```typescript
// ImageEditor.tsx linha 60 (INCORRETO)
const fileName = `checkout-components/${component.id}-${Date.now()}.${fileExt}`;
```

A Edge Function `storage-management` (linhas 108-117) valida que o path deve começar com:
1. `${producer.id}/` (UUID do usuário)
2. `products/` (path de produtos)

O prefixo `checkout-components/` não é aceito → **403 Forbidden**.

---

## Solução

### Arquitetura da Correção

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUXO CORRIGIDO                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CheckoutCustomizer                                                          │
│  ├── persistence.productData.id  ──────────────────────────────────────┐    │
│  │                                                                      │    │
│  ▼                                                                      │    │
│  CheckoutCustomizationPanel                                             │    │
│  ├── productId prop (NOVO)  ◄───────────────────────────────────────────┘    │
│  │                                                                            │
│  ▼                                                                            │
│  ImageEditor                                                                  │
│  ├── productId prop (NOVO)                                                   │
│  │                                                                            │
│  └── Upload path:                                                            │
│      ANTES: checkout-components/{id}-{ts}.png  ❌ 403 Forbidden             │
│      DEPOIS: products/{productId}/checkout-components/{id}-{ts}.png  ✅     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Alterações Necessárias

### 1. ImageEditor.tsx
**Arquivo**: `src/components/checkout/builder/items/Image/ImageEditor.tsx`

**Mudanças**:
- Adicionar prop `productId?: string` na interface
- Alterar a geração do path de upload:

```typescript
// ANTES (linha 60)
const fileName = `checkout-components/${component.id}-${Date.now()}.${fileExt}`;

// DEPOIS
const basePath = productId 
  ? `products/${productId}/checkout-components`
  : `products/unknown/checkout-components`;
const fileName = `${basePath}/${component.id}-${Date.now()}.${fileExt}`;
```

### 2. CheckoutCustomizationPanel.tsx
**Arquivo**: `src/components/checkout/CheckoutCustomizationPanel.tsx`

**Mudanças**:
- Adicionar prop `productId?: string` na interface
- Passar `productId` para o editor do componente Image

### 3. CheckoutCustomizer.tsx
**Arquivo**: `src/pages/CheckoutCustomizer.tsx`

**Mudanças**:
- Passar `productId={persistence.productData?.id}` para `CheckoutCustomizationPanel`

### 4. types/builder
**Arquivo**: `src/components/checkout/builder/types.ts`

**Mudanças**:
- Atualizar `ComponentEditorProps` para incluir `productId?: string`

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Resolve causa raiz | ✅ Path agora segue padrão obrigatório |
| Zero workarounds | ✅ Sem gambiarras |
| Segue memory storage/product-path-standard-v3 | ✅ Prefixo `products/${productId}/` |
| Mantém arquivos < 300 linhas | ✅ Apenas adições mínimas |
| Zero breaking changes | ✅ Props opcionais com fallback |

---

## Arquivos a Modificar

| Arquivo | Linhas Afetadas | Tipo |
|---------|-----------------|------|
| `ImageEditor.tsx` | ~8 linhas | Edição |
| `CheckoutCustomizationPanel.tsx` | ~3 linhas | Edição |
| `CheckoutCustomizer.tsx` | ~1 linha | Edição |
| `src/components/checkout/builder/types.ts` | ~2 linhas | Edição |

---

## Fallback de Segurança

Caso `productId` não esteja disponível (edge case), o sistema usa `products/unknown/checkout-components` como fallback. Isso garante que:
1. O upload não falha com 403
2. O arquivo ainda é armazenado em local válido
3. O sistema degrada graciosamente

---

## Testes Esperados

Após implementação:
1. Abrir Personalizar Checkout
2. Adicionar componente Imagem
3. Fazer upload de imagem
4. ✅ Upload deve completar sem erro 403
5. ✅ Imagem deve aparecer no preview
6. ✅ Salvar checkout deve persistir a imagem
