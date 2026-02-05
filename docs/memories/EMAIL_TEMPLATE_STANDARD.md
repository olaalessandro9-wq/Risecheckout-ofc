# Email Template Standard

> RISE Protocol V3 - Documentação Técnica Obrigatória
> 
> Versão: 1.0.0
> Data: 2026-02-05
> Status: ATIVO

---

## 1. Visão Geral

Este documento define o padrão **obrigatório** para todos os templates de email do Rise Checkout.
O padrão foi estabelecido para garantir compatibilidade total com clientes de email (especialmente Gmail)
e eliminar problemas de truncamento ("3 pontinhos").

---

## 2. Arquitetura Obrigatória

### 2.1 Estrutura de Cada Template

Cada template DEVE ser **autossuficiente**:

```typescript
export function getMyTemplate(data: MyData): string {
  // 1. Define estilos INLINE neste arquivo
  const styles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      body { font-family: 'Inter', sans-serif; ... }
      .container { max-width: 600px; ... }
      // ... todos os estilos
    </style>
  `;

  // 2. Monta o conteúdo
  const content = `
    <div class="header">...</div>
    <div class="content">...</div>
    <div class="footer">...</div>
  `;

  // 3. Retorna HTML COMPLETO
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Título do Email</title>
  ${styles}
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>`;
}
```

### 2.2 O Que PODE Ser Importado de `email-templates-base.ts`

| Item | Status | Uso |
|------|--------|-----|
| `formatCurrency()` | ✅ Permitido | Formatar valores em R$ |
| `getLogoUrl()` | ✅ Permitido | URL do logo do Storage |
| Types (`PurchaseConfirmationData`, etc.) | ✅ Permitido | Tipagem TypeScript |

### 2.3 O Que NÃO PODE Ser Usado

| Item | Status | Motivo |
|------|--------|--------|
| `getBaseStyles()` | ❌ **DEPRECATED** | Causa truncamento no Gmail |
| `getEmailWrapper()` | ❌ **DEPRECATED** | Causa truncamento no Gmail |

---

## 3. Templates de Referência

Use estes arquivos como modelo para novos templates:

| Template | Arquivo | Descrição |
|----------|---------|-----------|
| Purchase Confirmation | `email-templates-purchase.ts` | Confirmação de compra padrão |
| Members Area | `email-templates-members-area.ts` | Acesso à área de membros |
| External Delivery | `email-templates-external.ts` | Entrega via vendedor |
| Payment Pending | `email-templates-payment.ts` | Aguardando pagamento PIX/boleto |
| New Sale (Seller) | `email-templates-seller.ts` | Notificação de venda ao vendedor |

---

## 4. Checklist para Novos Templates

Antes de criar um novo template, verifique:

- [ ] Template define seu próprio bloco `<style>` inline
- [ ] Template retorna HTML completo (`<!DOCTYPE html>` até `</html>`)
- [ ] Importa apenas `formatCurrency`, `getLogoUrl` e types de `email-templates-base.ts`
- [ ] **NÃO** usa `getBaseStyles()` ou `getEmailWrapper()`
- [ ] Inclui versão texto (`getMyTemplateText`)
- [ ] Exportado em `email-templates.ts`
- [ ] Testes criados verificando estrutura `<style>`

---

## 5. Padrão Visual

### 5.1 Cores Padrão

| Elemento | Cor | Uso |
|----------|-----|-----|
| Background body | `#F8F9FA` | Fundo externo |
| Container | `#FFFFFF` | Fundo do email |
| Bordas | `#E9ECEF` | Separadores e bordas |
| Título h1 | `#212529` | Títulos principais |
| Texto | `#495057` | Corpo do texto |
| Labels | `#6B7280` | Labels de campos |
| Links | `#007BFF` | Links clicáveis |
| Footer | `#6C757D` | Texto do footer |

### 5.2 Cores por Tipo de Template

| Tipo | Header/Banner | Uso |
|------|---------------|-----|
| Sucesso (Compra) | Azul `#007BFF` | Compra confirmada |
| Members Area | Verde `#10B981` → `#059669` | Acesso liberado |
| Pending | Amarelo `#F59E0B` → `#D97706` | Aguardando pagamento |
| Seller | Verde `#10B981` → `#059669` | Nova venda |

### 5.3 Tipografia

- Fonte: Inter (Google Fonts)
- Fallback: `sans-serif`
- Títulos: 700 (bold)
- Subtítulos: 600 (semibold)
- Corpo: 400 (regular)

---

## 6. Estrutura de Arquivos

```
supabase/functions/_shared/
├── email-templates-base.ts      # Types, formatCurrency, getLogoUrl
├── email-templates.ts           # Re-exports (aggregator)
├── email-templates-purchase.ts  # Confirmação de compra
├── email-templates-members-area.ts
├── email-templates-external.ts
├── email-templates-payment.ts
├── email-templates-seller.ts
└── email-templates-*.test.ts    # Testes correspondentes
```

---

## 7. Histórico de Decisões

| Data | Decisão | Motivo |
|------|---------|--------|
| 2026-02-05 | Deprecar `getEmailWrapper()` | Gmail truncava emails |
| 2026-02-05 | Deprecar `getBaseStyles()` | Inconsistência arquitetural |
| 2026-02-05 | Padrão único: inline styles | Compatibilidade total |

---

## 8. Contato

Dúvidas sobre este padrão? Consulte o Lead Architect ou este documento.

**Última atualização:** 2026-02-05
**Responsável:** RISE Protocol V3