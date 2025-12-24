# Causa Raiz do Erro 22P02: Bumps Não Sendo Salvos

## O Erro

```
invalid input syntax for type integer: "3.99"
```

## Análise

### O Que Está Acontecendo

A função `create-order` está tentando inserir o valor `"3.99"` (string em REAIS) no campo `amount_cents` da tabela `order_items`, que espera um **INTEGER** (número inteiro em centavos).

### O Código Problemático (Linhas 343-346)

```typescript
// offers.price já está em CENTAVOS
bump_price_cents = Number(offerData.price);
bump_product_name = offerData.name;
bump_product_id = offerData.product_id;
```

### O Problema

O comentário na linha 343 diz que `offers.price` **"já está em CENTAVOS"**, mas isso está **INCORRETO**.

Na tabela `offers`, o campo `price` está armazenando valores em **REAIS** (ex: 3.99) e não em centavos (ex: 399).

Quando o código faz `Number(offerData.price)`, ele converte a string `"3.99"` para o número `3.99`, mas **NÃO multiplica por 100** para converter para centavos.

Resultado: Tenta inserir `3.99` (número decimal) em um campo INTEGER, causando o erro.

### Comparação com o Caminho Alternativo

Quando o bump **NÃO** tem `offer_id` e usa apenas `product_id` (linhas 361-362):

```typescript
// products.price está em REAIS, converter para CENTAVOS
bump_price_cents = toCents(Number(productData.price));
```

Aqui o código **está correto**: converte o preço de REAIS para CENTAVOS usando a função `toCents()`.

## Solução

Aplicar a mesma conversão para o caminho de `offers`:

### Antes (Errado)

```typescript
// offers.price já está em CENTAVOS
bump_price_cents = Number(offerData.price);
```

### Depois (Correto)

```typescript
// offers.price está em REAIS, converter para CENTAVOS
bump_price_cents = toCents(Number(offerData.price));
```

## Impacto

- **Risco:** Muito baixo - Correção simples e direta
- **Benefício:** Alto - Resolve o problema dos bumps não serem salvos
- **Compatibilidade:** 100% - Não afeta outros fluxos

## Conclusão

O problema é um **comentário incorreto** que levou a uma **lógica errada**. A tabela `offers` armazena preços em REAIS (assim como a tabela `products`), mas o código assumiu que estava em centavos.

A correção é simples: aplicar a função `toCents()` também para o preço vindo de `offers`.
