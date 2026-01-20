# 💰 PriceDisplay Component - Guia Completo

## 📖 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Por que usar?](#por-que-usar)
3. [Instalação](#instalação)
4. [Uso Básico](#uso-básico)
5. [Variantes](#variantes)
6. [Exemplos Práticos](#exemplos-práticos)
7. [API Reference](#api-reference)
8. [Boas Práticas](#boas-práticas)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 VISÃO GERAL

O `PriceDisplay` é um componente React criado para **padronizar a exibição de preços** em toda a aplicação RiseCheckout.

### Características

- ✅ Recebe valores em **CENTAVOS** (integer)
- ✅ Exibe valores formatados em **REAIS** (R$ X,XX)
- ✅ Garante **consistência** em toda a aplicação
- ✅ Suporta **customização** de estilo
- ✅ **TypeScript** completo
- ✅ **Documentação** inline (JSDoc)

---

## 🤔 POR QUE USAR?

### ❌ ANTES (Sem PriceDisplay)

```typescript
// Problema 1: Formatação manual inconsistente
<p>R$ {price.toFixed(2)}</p>                           // ❌
<p>R$ {price.toFixed(2).replace('.', ',')}</p>         // ❌
<p>{price.toLocaleString('pt-BR', { ... })}</p>        // ❌

// Problema 2: Confusão entre centavos e reais
<p>R$ {(price / 100).toFixed(2)}</p>                   // ❌ Divisão manual
<p>R$ {price.toFixed(2)}</p>                           // ❌ Sem divisão

// Problema 3: Código duplicado
// Cada desenvolvedor cria sua própria formatação
```

### ✅ DEPOIS (Com PriceDisplay)

```typescript
// Solução: Um único componente padronizado
<PriceDisplay cents={price} />  // ✅ SEMPRE correto!
```

---

## 📦 INSTALAÇÃO

O componente já está disponível em:

```
src/components/ui/price-display.tsx
```

### Import

```typescript
import { PriceDisplay } from "@/components/ui/price-display";
```

---

## 🚀 USO BÁSICO

### Exemplo Simples

```typescript
import { PriceDisplay } from "@/components/ui/price-display";

function ProductCard({ product }) {
  return (
    <div>
      <h3>{product.name}</h3>
      <PriceDisplay cents={product.price} />
    </div>
  );
}

// product.price = 2990 (centavos)
// Exibe: R$ 29,90
```

### Com Estilo Customizado

```typescript
<PriceDisplay 
  cents={product.price} 
  className="text-2xl font-bold text-green-600" 
/>
```

### Com Estilo Inline

```typescript
<PriceDisplay 
  cents={product.price} 
  style={{ color: 'var(--primary)' }} 
/>
```

---

## 🎨 VARIANTES

### 1. PriceDisplay (Padrão)

Exibe preço formatado em BRL.

```typescript
<PriceDisplay cents={2990} />
// Output: R$ 29,90
```

**Props:**
- `cents` (number, required): Valor em centavos
- `className` (string, optional): Classes CSS
- `style` (CSSProperties, optional): Estilos inline

---

### 2. PriceDisplayWithDiscount

Exibe preço original (riscado) e preço com desconto.

```typescript
<PriceDisplayWithDiscount 
  originalCents={2990}   // R$ 29,90 (riscado)
  discountCents={1990}   // R$ 19,90 (destaque)
/>
```

**Props:**
- `originalCents` (number, required): Preço original em centavos
- `discountCents` (number, required): Preço com desconto em centavos
- `originalClassName` (string, optional): Classes para preço original
- `discountClassName` (string, optional): Classes para preço com desconto
- `layout` ("horizontal" | "vertical", optional): Layout do componente

**Layouts:**

```typescript
// Horizontal (padrão)
<PriceDisplayWithDiscount 
  originalCents={2990} 
  discountCents={1990} 
  layout="horizontal" 
/>
// Output: R$ 29,90  R$ 19,90

// Vertical
<PriceDisplayWithDiscount 
  originalCents={2990} 
  discountCents={1990} 
  layout="vertical" 
/>
// Output: 
// R$ 29,90
// R$ 19,90
```

---

### 3. PriceDisplayNumeric

Exibe apenas o valor numérico (sem "R$").

```typescript
<PriceDisplayNumeric cents={2990} />
// Output: 29,90
```

**Props:**
- `cents` (number, required): Valor em centavos
- `className` (string, optional): Classes CSS
- `style` (CSSProperties, optional): Estilos inline

**Uso:**
- Inputs de preço
- Exportação de dados
- Casos específicos onde "R$" não é necessário

---

### 4. usePriceFormatter (Hook)

Hook para formatar preços em lógica (não em JSX).

```typescript
import { usePriceFormatter } from "@/components/ui/price-display";

function MyComponent() {
  const { formatPrice, formatPriceNumeric } = usePriceFormatter();
  
  const priceText = formatPrice(2990);           // "R$ 29,90"
  const priceNumeric = formatPriceNumeric(2990); // "29,90"
  
  return <div>{priceText}</div>;
}
```

---

## 💡 EXEMPLOS PRÁTICOS

### Exemplo 1: Tabela de Produtos

```typescript
function ProductsTable({ products }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Preço</th>
        </tr>
      </thead>
      <tbody>
        {products.map(product => (
          <tr key={product.id}>
            <td>{product.name}</td>
            <td>
              <PriceDisplay cents={product.price} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

### Exemplo 2: Card de Produto com Desconto

```typescript
function ProductCard({ product, discount }) {
  const hasDiscount = discount && discount.active;
  
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      
      {hasDiscount ? (
        <PriceDisplayWithDiscount
          originalCents={product.price}
          discountCents={discount.price}
          layout="vertical"
          originalClassName="text-sm"
          discountClassName="text-2xl"
        />
      ) : (
        <PriceDisplay 
          cents={product.price} 
          className="text-2xl font-bold" 
        />
      )}
    </div>
  );
}
```

---

### Exemplo 3: Resumo de Pedido

```typescript
function OrderSummary({ items, total }) {
  return (
    <div className="order-summary">
      <h3>Resumo do Pedido</h3>
      
      {items.map(item => (
        <div key={item.id} className="flex justify-between">
          <span>{item.name}</span>
          <PriceDisplay cents={item.price} />
        </div>
      ))}
      
      <div className="border-t mt-4 pt-4">
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <PriceDisplay 
            cents={total} 
            className="text-primary" 
          />
        </div>
      </div>
    </div>
  );
}
```

---

### Exemplo 4: Dashboard com Métricas

```typescript
function DashboardMetrics({ metrics }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="metric-card">
        <h4>Faturamento</h4>
        <PriceDisplay 
          cents={metrics.revenue} 
          className="text-3xl font-bold text-green-600" 
        />
      </div>
      
      <div className="metric-card">
        <h4>Vendas Pendentes</h4>
        <PriceDisplay 
          cents={metrics.pending} 
          className="text-3xl font-bold text-yellow-600" 
        />
      </div>
      
      <div className="metric-card">
        <h4>Taxas</h4>
        <PriceDisplay 
          cents={metrics.fees} 
          className="text-3xl font-bold text-red-600" 
        />
      </div>
    </div>
  );
}
```

---

### Exemplo 5: Order Bump

```typescript
function OrderBump({ bump }) {
  return (
    <div className="order-bump">
      <h4>{bump.title}</h4>
      <p>{bump.description}</p>
      
      {bump.discount_price ? (
        <PriceDisplayWithDiscount
          originalCents={bump.original_price}
          discountCents={bump.discount_price}
          layout="horizontal"
        />
      ) : (
        <PriceDisplay 
          cents={bump.price} 
          className="text-xl font-bold" 
        />
      )}
    </div>
  );
}
```

---

## 📚 API REFERENCE

### PriceDisplay

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `cents` | `number` | ✅ | - | Valor em centavos (ex: 2990 = R$ 29,90) |
| `className` | `string` | ❌ | - | Classes CSS adicionais |
| `style` | `CSSProperties` | ❌ | - | Estilos inline |

---

### PriceDisplayWithDiscount

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `originalCents` | `number` | ✅ | - | Preço original em centavos |
| `discountCents` | `number` | ✅ | - | Preço com desconto em centavos |
| `originalClassName` | `string` | ❌ | `"line-through text-muted-foreground"` | Classes para preço original |
| `discountClassName` | `string` | ❌ | `"font-bold text-primary"` | Classes para preço com desconto |
| `layout` | `"horizontal" \| "vertical"` | ❌ | `"horizontal"` | Layout do componente |

---

### PriceDisplayNumeric

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `cents` | `number` | ✅ | - | Valor em centavos |
| `className` | `string` | ❌ | - | Classes CSS adicionais |
| `style` | `CSSProperties` | ❌ | - | Estilos inline |

---

### usePriceFormatter

**Retorna:**

```typescript
{
  formatPrice: (cents: number) => string;        // "R$ 29,90"
  formatPriceNumeric: (cents: number) => string; // "29,90"
}
```

---

## ✅ BOAS PRÁTICAS

### 1. SEMPRE use PriceDisplay para exibir preços

```typescript
// ✅ CERTO
<PriceDisplay cents={product.price} />

// ❌ ERRADO
<p>R$ {product.price.toFixed(2)}</p>
<p>{formatBRL(product.price)}</p>  // Use o componente!
```

---

### 2. NUNCA faça conversões manuais

```typescript
// ✅ CERTO
<PriceDisplay cents={product.price} />

// ❌ ERRADO
<p>R$ {(product.price / 100).toFixed(2)}</p>
<p>R$ {(product.price * 100).toFixed(2)}</p>
```

---

### 3. Use variantes apropriadas

```typescript
// ✅ CERTO - Preço com desconto
<PriceDisplayWithDiscount 
  originalCents={2990} 
  discountCents={1990} 
/>

// ❌ ERRADO - Fazer manualmente
<div>
  <span className="line-through">R$ 29,90</span>
  <span>R$ 19,90</span>
</div>
```

---

### 4. Customize com classes CSS

```typescript
// ✅ CERTO
<PriceDisplay 
  cents={product.price} 
  className="text-2xl font-bold text-primary" 
/>

// ❌ ERRADO - Wrapper desnecessário
<div className="text-2xl font-bold text-primary">
  <PriceDisplay cents={product.price} />
</div>
```

---

## 🐛 TROUBLESHOOTING

### Problema: Preço exibido como "R$ 2.990,00" ao invés de "R$ 29,90"

**Causa**: Valor está em REAIS ao invés de CENTAVOS

**Solução**: Multiplicar por 100 antes de passar para o componente

```typescript
// ❌ ERRADO
<PriceDisplay cents={29.90} />  // R$ 0,29

// ✅ CERTO
<PriceDisplay cents={2990} />   // R$ 29,90
```

---

### Problema: TypeScript reclamando de tipo

**Causa**: Passando string ao invés de number

**Solução**: Converter para number

```typescript
// ❌ ERRADO
<PriceDisplay cents="2990" />

// ✅ CERTO
<PriceDisplay cents={Number(product.price)} />
<PriceDisplay cents={2990} />
```

---

### Problema: Preço não aparece

**Causa**: Valor undefined ou null

**Solução**: Usar fallback

```typescript
// ✅ CERTO
<PriceDisplay cents={product.price || 0} />
<PriceDisplay cents={product.price ?? 0} />
```

---

## 🎓 REGRAS PARA NOVOS DESENVOLVEDORES

### ✅ SEMPRE FAÇA

1. Use `<PriceDisplay cents={price} />` para exibir preços
2. Passe valores em **CENTAVOS** (integer)
3. Use variantes apropriadas (`WithDiscount`, `Numeric`)
4. Customize com `className` ou `style`

### ❌ NUNCA FAÇA

1. Use `toFixed()` ou `toLocaleString()` diretamente
2. Faça conversões manuais (multiplicar/dividir por 100)
3. Crie sua própria formatação de preço
4. Passe valores em REAIS (decimais)

---

## 📞 SUPORTE

Dúvidas sobre o componente? Entre em contato:

- **GitHub**: @olaalessandro9-wq
- **Issue Tracker**: https://github.com/olaalessandro9-wq/risecheckout-84776/issues

---

**Última atualização**: 12/12/2024  
**Versão**: 1.0  
**Status**: ✅ Ativo
