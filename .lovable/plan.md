

# Plano: Melhorias no Template de Email "Compra Confirmada"

## Problemas Identificados

| # | Problema | Causa |
|---|----------|-------|
| 1 | **Blocos separados** | As divs `.content`, `.support` e `.footer` têm backgrounds e paddings diferentes, criando separação visual |
| 2 | **Falta espaço após ":"** | No HTML, o `:` está colado ao `<span>` seguinte: `Produto:</span> <span>` - o espaço existe no código mas não renderiza corretamente |
| 3 | **Email cortado (3 pontinhos)** | Gmail corta emails com mais de ~102KB. Além disso, `display: flex` pode não ser bem suportado em todos clientes de email |

---

## Solução

### 1. Unificar blocos visualmente

**Antes:**
```css
.support { text-align: center; padding: 32px; ... }
.footer { background-color: #F8F9FA; padding: 24px; ... }
```

**Depois:**
- Remover a borda/separação visual entre `.support` e `.footer`
- Unificar em um único bloco visual contínuo

### 2. Adicionar espaço após ":"

**Antes (linha 69):**
```html
<span class="order-label">Produto:</span> <span class="order-value">${data.productName}</span>
```

**Depois:**
```html
<span class="order-label">Produto: </span><span class="order-value">${data.productName}</span>
```

O espaço deve estar DENTRO do primeiro `<span>` para garantir que renderize corretamente.

### 3. Melhorar compatibilidade para evitar corte

- Usar `table` layout em vez de `flex` (melhor suporte em clientes de email)
- Reduzir CSS inline duplicado
- Adicionar meta tag para prevenir corte do Gmail

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/_shared/email-templates-purchase.ts` | Todas as correções acima |

---

## Detalhes Técnicos

### Mudanças no CSS (linhas 21-47):

```css
/* Unificar support e footer visualmente */
.support { 
  text-align: center; 
  padding: 24px 32px 16px; /* reduzir padding inferior */
  font-size: 14px; 
  color: #6C757D; 
  border-top: 1px solid #E9ECEF; /* borda sutil no topo */
}
.footer { 
  background-color: transparent; /* remover fundo diferente */
  padding: 0 24px 24px; /* só padding inferior */
  text-align: center; 
  font-size: 12px; 
  color: #6C757D; 
}

/* Usar table layout para order-item (melhor compatibilidade) */
.order-item { 
  padding: 16px 20px; 
  border-bottom: 1px solid #E9ECEF; 
}
.order-label { 
  font-size: 14px; 
  color: #495057; 
}
.order-value { 
  font-size: 14px; 
  font-weight: 600; 
  color: #212529; 
}
```

### Mudanças no HTML (linhas 68-77):

**Adicionar espaço após ":" dentro do span:**

```html
<div class="order-item">
  <span class="order-label">Produto: </span><span class="order-value">${data.productName}</span>
</div>
<div class="order-item">
  <span class="order-label">Nº do Pedido: </span><span class="order-value">#${data.orderId.substring(0, 8).toUpperCase()}</span>
</div>
${data.paymentMethod ? `
<div class="order-item">
  <span class="order-label">Forma de Pagamento: </span><span class="order-value">${data.paymentMethod}</span>
</div>
` : ''}
<div class="total-row">
  <span>Total: </span><span>${formatCurrency(data.amountCents)}</span>
</div>
```

### Converter order-item para table layout:

Para máxima compatibilidade com clientes de email, converter de `flex` para `table`:

```html
<table class="order-details" width="100%" cellpadding="0" cellspacing="0">
  <tr class="order-header">
    <td colspan="2"><h2>Resumo do Pedido</h2></td>
  </tr>
  <tr class="order-item">
    <td class="order-label">Produto: </td>
    <td class="order-value">${data.productName}</td>
  </tr>
  <!-- ... demais itens ... -->
</table>
```

---

## Resultado Esperado

Após as correções:

1. **Blocos unificados** - Suporte e footer em um único bloco visual contínuo
2. **Espaços corretos** - "Produto: Curso..." em vez de "Produto:Curso..."
3. **Melhor compatibilidade** - Layout table funciona em todos clientes de email
4. **Menos corte** - HTML mais enxuto = menor chance de Gmail cortar

---

## Observação sobre o Corte (3 pontinhos)

O corte do Gmail acontece quando:
- Email tem mais de ~102KB
- Há muito CSS inline duplicado
- Estruturas HTML muito aninhadas

A conversão para table layout e remoção de CSS desnecessário deve reduzir significativamente o tamanho do email. Porém, se o email ainda for cortado, é um comportamento do cliente de email que não pode ser 100% controlado.

