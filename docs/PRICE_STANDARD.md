# 💰 PADRÃO DE PREÇOS - RISECHECKOUT

## 📖 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Regra de Ouro](#regra-de-ouro)
3. [Arquitetura](#arquitetura)
4. [Funções Utilitárias](#funções-utilitárias)
5. [Componentes](#componentes)
6. [Banco de Dados](#banco-de-dados)
7. [Gateways de Pagamento](#gateways-de-pagamento)
8. [Exemplos Práticos](#exemplos-práticos)
9. [Troubleshooting](#troubleshooting)
10. [Histórico](#histórico)

---

## 🎯 VISÃO GERAL

O RiseCheckout utiliza o padrão **"Integer First"** para manipulação de valores monetários. Isso significa que **TODOS os cálculos e armazenamentos são feitos em CENTAVOS (inteiros)**, e a conversão para REAIS acontece **APENAS na exibição**.

### Por que centavos?

1. **Precisão**: Inteiros não têm erros de arredondamento (ex: 0.1 + 0.2 ≠ 0.3 em float)
2. **Compatibilidade**: Gateways de pagamento trabalham com centavos
3. **Performance**: Operações com inteiros são mais rápidas
4. **Simplicidade**: Menos conversões = menos bugs

---

## 🏆 REGRA DE OURO

> **"Centavos no banco, centavos no código, reais na tela"**

### ✅ CERTO

```typescript
// Banco de dados
price: 1990 // R$ 19,90 em centavos

// Código
const total = product.price + orderBump.price; // 1990 + 500 = 2490

// Exibição
<p>{formatBRL(total)}</p> // "R$ 24,90"
```

### ❌ ERRADO

```typescript
// Banco de dados
price: 19.90 // NUNCA use decimais!

// Código
const total = product.price * 100 + orderBump.price * 100; // Conversões manuais!

// Exibição
<p>R$ {total.toFixed(2)}</p> // Formatação manual!
```

---

## 🏗️ ARQUITETURA

```
┌─────────────────────────────────────────────────────────────┐
│                        CAMADAS                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. BANCO DE DADOS (PostgreSQL)                            │
│     ├─ CATÁLOGO (NUMERIC armazenando centavos):            │
│     │  ├─ products.price: NUMERIC(10,2)                    │
│     │  ├─ offers.price: NUMERIC(10,2)                      │
│     │  └─ order_bumps.discount_price: NUMERIC(10,2)        │
│     │                                                       │
│     └─ TRANSAÇÕES (INTEGER com sufixo _cents):             │
│        ├─ orders.amount_cents: INTEGER                     │
│        ├─ order_items.amount_cents: INTEGER                │
│        └─ pix_transactions.value_cents: INTEGER            │
│                                                             │
│  2. BACKEND (Supabase Edge Functions)                      │
│     ├─ Recebe: centavos                                    │
│     ├─ Processa: centavos                                  │
│     └─ Envia para gateway: converte para reais             │
│                                                             │
│  3. FRONTEND (React/TypeScript)                            │
│     ├─ Estado: centavos                                    │
│     ├─ Lógica: centavos                                    │
│     └─ Exibição: reais (via formatBRL / PriceDisplay)      │
│                                                             │
│  4. INTERFACE (UI Components)                              │
│     ├─ Input: CurrencyInput (recebe/retorna centavos)     │
│     └─ Display: PriceDisplay (recebe centavos, mostra BRL) │
│                                                             │
│  5. GATEWAYS (Mercado Pago, PushinPay, Stripe)             │
│     ├─ Recebe da Edge Function: centavos                   │
│     ├─ Converte internamente: centavos → reais            │
│     └─ Processa: reais (API do gateway)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ FUNÇÕES UTILITÁRIAS

### 📁 Localização: `src/lib/money.ts`

#### 1. `toCents(reais: number): number`

Converte REAIS para CENTAVOS.

```typescript
toCents(19.90)  // 1990
toCents(1.50)   // 150
toCents(0.01)   // 1
```

**Uso**: Ao salvar no banco (raramente necessário, CurrencyInput já retorna centavos)

#### 2. `toReais(centavos: number): number`

Converte CENTAVOS para REAIS.

```typescript
toReais(1990)  // 19.90
toReais(150)   // 1.50
toReais(1)     // 0.01
```

**Uso**: Cálculos que precisam de decimais (raro)

#### 3. `formatCentsToBRL(centavos: number): string`

Formata CENTAVOS para string em REAIS (BRL).

```typescript
formatCentsToBRL(1990)  // "R$ 19,90"
formatCentsToBRL(150)   // "R$ 1,50"
formatCentsToBRL(1)     // "R$ 0,01"
```

**Uso**: Exibição na interface (PRINCIPAL)

#### 4. `parseBRLInput(input: string): number`

Converte input brasileiro para CENTAVOS.

```typescript
parseBRLInput("R$ 19,90")    // 1990
parseBRLInput("1.234,56")    // 123456
parseBRLInput("19,90")       // 1990
```

**Uso**: Processar inputs de texto (raro, CurrencyInput já faz isso)

---

## 🎨 COMPONENTES

### 1. CurrencyInput

**Localização**: `src/components/ui/currency-input.tsx`

**Comportamento**:
- Recebe: CENTAVOS (via prop `value`)
- Exibe: REAIS formatados (ex: "R$ 19,90")
- Retorna: CENTAVOS (via prop `onChange`)

**Exemplo de uso**:

```typescript
const [price, setPrice] = useState(1990); // centavos

<CurrencyInput
  value={price}           // 1990 (centavos)
  onChange={setPrice}     // Retorna centavos
/>
// Usuário vê: "R$ 19,90"
// Usuário digita "2990" → onChange recebe 2990 (centavos)
```

### 2. formatBRL

**Localização**: `src/lib/formatters/money.ts`

**Comportamento**:
- Recebe: CENTAVOS
- Retorna: String formatada em REAIS

**Exemplo de uso**:

```typescript
<p>Preço: {formatBRL(product.price)}</p>
// product.price = 1990 → Exibe: "Preço: R$ 19,90"
```

---

## 🗄️ BANCO DE DADOS

### Schema - Tipos SQL

> ⚠️ **NOTA IMPORTANTE**: O sistema utiliza dois tipos SQL diferentes para armazenar centavos, dependendo do contexto. **Ambos armazenam valores em CENTAVOS**.

#### Tabelas de Catálogo (NUMERIC)

As tabelas de catálogo utilizam `NUMERIC(10,2)` para armazenar centavos. O `.00` é apenas precisão SQL, o valor inteiro representa centavos.

```sql
-- PRODUCTS
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,  -- CENTAVOS (ex: 1990.00 = R$ 19,90)
  ...
);

-- OFFERS
CREATE TABLE offers (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,  -- CENTAVOS (ex: 2990.00 = R$ 29,90)
  ...
);

-- ORDER_BUMPS
CREATE TABLE order_bumps (
  id UUID PRIMARY KEY,
  discount_price NUMERIC(10,2),  -- CENTAVOS (opcional)
  ...
);

-- COUPONS
CREATE TABLE coupons (
  id UUID PRIMARY KEY,
  discount_value NUMERIC(10,2),  -- CENTAVOS para tipo 'fixed'
  ...
);
```

#### Tabelas de Transação (INTEGER)

As tabelas de transação utilizam `INTEGER` puro para armazenar centavos.

```sql
-- ORDERS
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  amount_cents INTEGER NOT NULL,  -- CENTAVOS (ex: 1990 = R$ 19,90)
  discount_amount_cents INTEGER,
  commission_cents INTEGER,
  platform_fee_cents INTEGER,
  ...
);

-- ORDER_ITEMS
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  amount_cents INTEGER NOT NULL,  -- CENTAVOS
  ...
);

-- PIX_TRANSACTIONS
CREATE TABLE pix_transactions (
  id UUID PRIMARY KEY,
  value_cents INTEGER NOT NULL,  -- CENTAVOS
  ...
);
```

### Resumo de Tipos por Tabela

| Tabela | Coluna | Tipo SQL | Armazena |
|--------|--------|----------|----------|
| `products` | `price` | `NUMERIC(10,2)` | Centavos (ex: `4990.00` = R$49,90) |
| `offers` | `price` | `NUMERIC(10,2)` | Centavos |
| `order_bumps` | `discount_price` | `NUMERIC(10,2)` | Centavos |
| `coupons` | `discount_value` | `NUMERIC(10,2)` | Centavos |
| `orders` | `amount_cents` | `INTEGER` | Centavos |
| `order_items` | `amount_cents` | `INTEGER` | Centavos |
| `pix_transactions` | `value_cents` | `INTEGER` | Centavos |

### Por que dois tipos?

1. **NUMERIC(10,2)** - Usado em catálogo por flexibilidade histórica
2. **INTEGER** - Usado em transações por nomenclatura explícita (`_cents`)

**A regra permanece a mesma**: Todos os valores representam CENTAVOS, independente do tipo SQL.

### Queries

```sql
-- ✅ CERTO: Inserir preço em centavos
INSERT INTO products (name, price) 
VALUES ('Produto Teste', 1990);  -- R$ 19,90

-- ✅ CERTO: Buscar e exibir
SELECT name, price FROM products;
-- Resultado: price = 1990
-- Frontend: formatBRL(1990) → "R$ 19,90"

-- ❌ ERRADO: Inserir preço em reais
INSERT INTO products (name, price) 
VALUES ('Produto Teste', 19.90);  -- NÃO FAÇA ISSO!
```

---

## 💳 GATEWAYS DE PAGAMENTO

### Mercado Pago

**Edge Function**: `supabase/functions/mercadopago-create-payment`

```typescript
// Recebe centavos do frontend
const { amount_cents } = await req.json();

// Converte para reais para o gateway
const amount_reais = amount_cents / 100;

// Envia para Mercado Pago
const payment = await mercadopago.payment.create({
  transaction_amount: amount_reais,  // 19.90
  ...
});
```

### PushinPay

**Edge Function**: `supabase/functions/pushinpay-create-payment`

```typescript
// Recebe centavos do frontend
const { amount_cents } = await req.json();

// Converte para reais para o gateway
const amount_reais = amount_cents / 100;

// Envia para PushinPay
const response = await fetch('https://api.pushinpay.com.br/api/pix', {
  body: JSON.stringify({
    valor: amount_reais,  // 19.90
    ...
  })
});
```

---

## 💡 EXEMPLOS PRÁTICOS

### Exemplo 1: Criar Produto

```typescript
// 1. Usuário digita no CurrencyInput: "R$ 29,90"
// 2. CurrencyInput retorna: 2990 (centavos)
const [price, setPrice] = useState(0);

// 3. Salvar no banco
await supabase.from('products').insert({
  name: 'Produto Teste',
  price: price  // 2990 (centavos)
});

// 4. Exibir na lista
<p>{formatBRL(product.price)}</p>  // "R$ 29,90"
```

### Exemplo 2: Calcular Total com Order Bump

```typescript
const product = { price: 2990 };        // R$ 29,90
const orderBump = { price: 1990 };      // R$ 19,90

// Cálculo em centavos
const total = product.price + orderBump.price;  // 4980

// Exibição
<p>Total: {formatBRL(total)}</p>  // "Total: R$ 49,80"
```

### Exemplo 3: Aplicar Desconto

```typescript
const originalPrice = 2990;  // R$ 29,90
const discountPercent = 10;  // 10%

// Cálculo em centavos
const discountAmount = Math.round(originalPrice * (discountPercent / 100));
const finalPrice = originalPrice - discountAmount;  // 2691

// Exibição
<p>De: {formatBRL(originalPrice)}</p>      // "De: R$ 29,90"
<p>Por: {formatBRL(finalPrice)}</p>        // "Por: R$ 26,91"
<p>Economia: {discountPercent}%</p>        // "Economia: 10%"
```

---

## 🐛 TROUBLESHOOTING

### Problema: Preço exibido como "R$ 0,02" ao invés de "R$ 1,50"

**Causa**: Preço está em REAIS no banco (1.50) ao invés de CENTAVOS (150)

**Solução**:
```sql
UPDATE products SET price = price * 100 WHERE price < 100;
UPDATE offers SET price = price * 100 WHERE price < 100;
```

### Problema: Preço exibido como "R$ 199.000,00" ao invés de "R$ 1.990,00"

**Causa**: Conversão duplicada (multiplicando por 100 duas vezes)

**Solução**: Remover multiplicação manual, usar CurrencyInput diretamente

### Problema: Gateway rejeitando pagamento (valor muito alto)

**Causa**: Enviando centavos ao invés de reais para o gateway

**Solução**: Converter para reais na Edge Function:
```typescript
const amount_reais = amount_cents / 100;
```

---

## 📜 HISTÓRICO

### Versão 1.0 (Dezembro 2024)

**Problema**: Inconsistências de preços em todo o sistema
- Products em REAIS
- Offers em CENTAVOS
- Conversões manuais espalhadas

**Solução**: Refatoração completa (Vibe Coding)
- Padronização: Tudo em CENTAVOS
- Funções utilitárias: `formatBRL`, `CurrencyInput`
- Banco corrigido: SQL UPDATE
- 6 arquivos modificados
- 111 linhas alteradas
- 5+ bugs corrigidos

**Commit**: `c52e179`

**Desenvolvedor**: @olaalessandro9-wq

**Data**: 12/12/2024

---

## 🎓 REGRAS PARA NOVOS DESENVOLVEDORES

### ✅ SEMPRE FAÇA

1. Use `CurrencyInput` para inputs de preço
2. Use `formatBRL()` para exibir preços
3. Armazene preços em CENTAVOS no banco
4. Trabalhe com CENTAVOS no código
5. Converta para REAIS apenas na exibição

### ❌ NUNCA FAÇA

1. Armazene preços em REAIS (decimais) no banco
2. Use `toFixed()` para formatação manual
3. Multiplique/divida por 100 manualmente
4. Use `parseFloat()` para processar preços
5. Envie CENTAVOS diretamente para gateways

### 🚨 ATENÇÃO

- Se você precisa multiplicar/dividir por 100, **PARE!** Você está fazendo errado.
- Se você está usando `toFixed()`, **PARE!** Use `formatBRL()`.
- Se você está criando um novo input de preço, **USE** `CurrencyInput`.

---

## 📞 SUPORTE

Dúvidas sobre o padrão de preços? Entre em contato:

- **GitHub**: @olaalessandro9-wq
- **Issue Tracker**: https://github.com/olaalessandro9-wq/risecheckout-84776/issues

---

**Última atualização**: 12/12/2024
**Versão**: 1.0
**Status**: ✅ Ativo


---

## 🎨 COMPONENTE GLOBAL: PriceDisplay

### Visão Geral

Para **garantir consistência** e **facilitar o desenvolvimento**, criamos o componente global `PriceDisplay`.

**Localização**: `src/components/ui/price-display.tsx`

### Por que usar?

✅ **Padronização**: Um único componente para todos os preços  
✅ **Simplicidade**: Sem formatações manuais  
✅ **Segurança**: TypeScript garante tipos corretos  
✅ **Manutenibilidade**: Mudanças em um só lugar  

### Uso Básico

```typescript
import { PriceDisplay } from "@/components/ui/price-display";

// Simples
<PriceDisplay cents={product.price} />

// Com estilo
<PriceDisplay 
  cents={product.price} 
  className="text-2xl font-bold" 
/>

// Com desconto
<PriceDisplayWithDiscount 
  originalCents={2990} 
  discountCents={1990} 
/>
```

### Variantes Disponíveis

1. **PriceDisplay** - Exibição padrão
2. **PriceDisplayWithDiscount** - Preço original + desconto
3. **PriceDisplayNumeric** - Apenas valor numérico (sem "R$")
4. **usePriceFormatter** - Hook para lógica

### Documentação Completa

Consulte: `docs/PRICE_DISPLAY_COMPONENT.md`

---

## 🎓 REGRAS ATUALIZADAS PARA NOVOS DESENVOLVEDORES

### ✅ SEMPRE FAÇA

1. Use `<PriceDisplay cents={price} />` para exibir preços
2. Use `formatBRL()` apenas em lógica (não em JSX)
3. Armazene preços em CENTAVOS no banco
4. Trabalhe com CENTAVOS no código
5. Converta para REAIS apenas na exibição

### ❌ NUNCA FAÇA

1. Use `toFixed()` ou `toLocaleString()` diretamente
2. Faça conversões manuais (multiplicar/dividir por 100)
3. Crie sua própria formatação de preço
4. Armazene preços em REAIS (decimais) no banco
5. Use `formatBRL()` diretamente em JSX (use `<PriceDisplay />`)

### 🚨 ATENÇÃO ESPECIAL

**Antes de criar qualquer código que exiba preços:**

1. ✅ Use `<PriceDisplay cents={price} />`
2. ✅ Consulte `docs/PRICE_DISPLAY_COMPONENT.md`
3. ✅ Veja exemplos práticos na documentação
4. ✅ Se tiver dúvida, pergunte!

**Se você está:**
- ❌ Usando `toFixed()` → USE `<PriceDisplay />`
- ❌ Usando `toLocaleString()` → USE `<PriceDisplay />`
- ❌ Multiplicando/dividindo por 100 → USE `<PriceDisplay />`
- ❌ Criando formatação manual → USE `<PriceDisplay />`

---

## 📊 HISTÓRICO DE ATUALIZAÇÕES

### Versão 1.2 (Janeiro 2025)

**Correção**: Documentação atualizada para refletir schema real do banco

**Mudanças**:
- Documentado que tabelas de catálogo (`products`, `offers`, `order_bumps`) usam `NUMERIC(10,2)` para armazenar centavos
- Documentado que tabelas de transação (`orders`, `order_items`) usam `INTEGER` para armazenar centavos
- Adicionada tabela de resumo de tipos por tabela
- Esclarecido que ambos os tipos armazenam CENTAVOS

**Nota**: O sistema sempre funcionou corretamente. A discrepância era apenas entre a documentação e os tipos SQL reais.

**Data**: 07/01/2025

---

### Versão 1.1 (Dezembro 2024)

**Adição**: Componente global `PriceDisplay`

**Motivação**: Garantir que TODOS os futuros desenvolvimentos usem o padrão correto

**Arquivos criados**:
- `src/components/ui/price-display.tsx` (componente)
- `docs/PRICE_DISPLAY_COMPONENT.md` (documentação)

**Benefícios**:
- ✅ Padronização automática
- ✅ Menos erros de formatação
- ✅ Código mais limpo
- ✅ Onboarding mais fácil

**Desenvolvedor**: @olaalessandro9-wq

**Data**: 12/12/2024

---

**Última atualização**: 07/01/2025  
**Versão**: 1.2  
**Status**: ✅ Ativo
