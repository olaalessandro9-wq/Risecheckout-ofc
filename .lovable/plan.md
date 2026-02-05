
# Plano: Reescrever Template de Compra Mantendo Visual Idêntico

## Diagnóstico Confirmado

| Aspecto | Template Atual (PROBLEMA) | Templates que Funcionam |
|---------|---------------------------|-------------------------|
| CSS | 100% inline | `<style>` tag com classes |
| Fontes | Arial, Helvetica | Google Fonts (Inter) via `@import` |
| Estrutura | Divs com style inline | Classes (.container, .header, .content) |
| Gmail | 3 PONTINHOS | COMPLETO |

## Estratégia de Conversão

Vou manter **exatamente os mesmos textos e layout visual** do template atual:
- "Sua compra foi confirmada!"
- "Olá, [nome], obrigado por comprar conosco..."
- Seção "Seu acesso está liberado!" (quando tem deliveryUrl)
- Tabela "Resumo do Pedido"
- Footer com suporte e Rise Checkout

Apenas a **estrutura técnica** muda para usar o padrão que funciona.

## Implementação Detalhada

### Etapa 1: Reescrever email-templates-purchase.ts

**Conversão de estrutura:**

```text
ANTES (inline CSS):                    DEPOIS (classes CSS):
─────────────────────                  ─────────────────────
<div style="max-width:600px...">       .container { max-width: 600px... }
<div style="text-align:center...">     .header { text-align: center... }
<table style="border:1px solid...">    .order-details { border: 1px solid... }
```

**Estrutura do novo template:**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de Compra</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; ... }
    .container { max-width: 600px; margin: 40px auto; ... }
    .header { text-align: center; padding: 0; line-height: 0; }
    .header img { display: block; width: 100%; max-width: 400px; height: auto; margin: 0 auto; }
    .content { padding: 32px; }
    .content h1 { ... }
    .content p { ... }
    .cta-section { background-color: #F1F3F5; ... }
    .cta-button { display: inline-block; background-color: #007BFF; ... }
    .order-details { border: 1px solid #E9ECEF; ... }
    .order-item { display: flex; justify-content: space-between; ... }
    .total-row { ... }
    .support { text-align: center; ... }
    .footer { ... }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="Rise Checkout" width="400">
    </div>
    <div class="content">
      <h1>Sua compra foi confirmada!</h1>
      <p>Olá, ${data.customerName}, obrigado por comprar conosco...</p>
      
      <!-- CTA Section (se tiver deliveryUrl) -->
      <div class="cta-section">
        <h2>Seu acesso está liberado!</h2>
        <p>Clique no botão abaixo para acessar o conteúdo.</p>
        <a href="${data.deliveryUrl}" class="cta-button">Acessar meu produto</a>
      </div>
      
      <!-- Order Details -->
      <div class="order-details">
        <h2>Resumo do Pedido</h2>
        <div class="order-item">
          <span class="order-label">Produto: </span>
          <span class="order-value">${data.productName}</span>
        </div>
        ...
      </div>
    </div>
    <div class="support">...</div>
    <div class="footer">...</div>
  </div>
</body>
</html>
```

### Textos Preservados (100% Idênticos)

| Elemento | Texto Atual (Mantido) |
|----------|----------------------|
| Título | "Sua compra foi confirmada!" |
| Saudação | "Olá, {nome}, obrigado por comprar conosco. Seu pagamento foi processado com sucesso." |
| CTA Título | "Seu acesso está liberado!" |
| CTA Subtítulo | "Clique no botão abaixo para acessar o conteúdo." |
| CTA Botão | "Acessar meu produto" |
| Seção Pedido | "Resumo do Pedido" |
| Labels | "Produto: ", "Nº do Pedido: ", "Forma de Pagamento: ", "Total: " |
| Suporte | "Em caso de dúvidas, entre em contato: {email}" |
| Vendedor | "Vendido por: {nome}" |
| Footer | "Pagamento processado com segurança por Rise Checkout." |

### Cores Preservadas

| Elemento | Cor Atual (Mantida) |
|----------|---------------------|
| Background body | #F8F9FA |
| Container background | #FFFFFF |
| Bordas | #E9ECEF |
| Título h1 | #212529 |
| Texto parágrafo | #495057 |
| CTA background | #F1F3F5 |
| Botão CTA | #007BFF (azul) |
| Total row background | #F8F9FA |
| Footer texto | #6C757D |
| Links | #007BFF |

### Etapa 2: Otimizar Logo

Adicionar atributo `width` explícito para carregamento mais rápido:

```html
<img src="${logoUrl}" alt="Rise Checkout" 
     style="display:block;width:100%;max-width:400px;height:auto;margin:0 auto;"
     width="400">
```

### Etapa 3: Atualizar Testes

Os testes atuais verificam:
- `<!DOCTYPE html>` 
- Textos como "João Silva", "Curso de Marketing Digital"
- "Acessar meu produto", "Rise Checkout"

Adicionar verificações para a nova estrutura:
- Presença de `<style>` tag
- Presença de classes `.container`, `.header`, `.content`

### Etapa 4: Versão Texto

A versão texto (`getPurchaseConfirmationTextTemplate`) já está correta e permanece inalterada.

## Arquivos a Modificar

| Arquivo | Ação | Mudança |
|---------|------|---------|
| `email-templates-purchase.ts` | REESCREVER | Usar `<style>` + classes, manter textos |
| `email-templates-purchase.test.ts` | ATUALIZAR | Adicionar verificação de `<style>` |

## Comparação Visual

```text
ANTES                              DEPOIS
──────────────────────────────     ──────────────────────────────
┌─────────────────────────────┐    ┌─────────────────────────────┐
│           LOGO              │    │           LOGO              │
├─────────────────────────────┤    ├─────────────────────────────┤
│ Sua compra foi confirmada!  │    │ Sua compra foi confirmada!  │
│ Olá, João, obrigado...      │    │ Olá, João, obrigado...      │
├─────────────────────────────┤    ├─────────────────────────────┤
│ Seu acesso está liberado!   │    │ Seu acesso está liberado!   │
│ [Acessar meu produto]       │    │ [Acessar meu produto]       │
├─────────────────────────────┤    ├─────────────────────────────┤
│ Resumo do Pedido            │    │ Resumo do Pedido            │
│ Produto: Curso...           │    │ Produto: Curso...           │
│ Nº: #ABC12345               │    │ Nº: #ABC12345               │
│ Total: R$ 199,00            │    │ Total: R$ 199,00            │
├─────────────────────────────┤    ├─────────────────────────────┤
│ suporte@...                 │    │ suporte@...                 │
│ Vendido por: XYZ            │    │ Vendido por: XYZ            │
│ Rise Checkout               │    │ Rise Checkout               │
└─────────────────────────────┘    └─────────────────────────────┘

     100% inline (QUEBRA)              <style> + classes (FUNCIONA)
```

## Verificação Final

Após implementação:

1. Fazer uma compra de teste ou usar "Preview de Emails" no Admin
2. Verificar no Gmail:
   - Email chega COMPLETO (sem 3 pontinhos)
   - Logo carrega rapidamente
   - Visual idêntico ao atual
3. Comparar com outros templates para garantir consistência

## Checklist RISE Protocol V3

- [x] Visual 100% preservado (mesmos textos, cores, layout)
- [x] Estrutura técnica alinhada com templates que funcionam
- [x] Logo otimizada com width explícito
- [x] Testes atualizados
- [x] Zero dívida técnica
- [x] Manutenibilidade infinita (padrão único)
