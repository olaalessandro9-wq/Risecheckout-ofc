

# Plano: Restaurar Template EXATAMENTE ao Estado Original

## Diagnóstico Final (RISE V3)

O Gemini analisou incorretamente - as críticas dele não refletem o código atual. Porém, ele sugeriu uma estrutura que **é praticamente idêntica ao código antigo** que você me enviou.

A diferença REAL é:
1. O template antigo **NÃO TINHA success-banner**
2. O template antigo usava **logo diferente** (risecheckout.com vs Supabase Storage)
3. O template antigo tinha **header com padding 40px**

## Análise de Soluções (RISE V3 Seção 4.4)

### Solução A: Usar código do Gemini
Copiar o código sugerido pelo Gemini literalmente.

- Manutenibilidade: 7/10 (cria função duplicada `formatMoney`)
- Zero DT: 6/10 (ignora arquitetura existente)
- Arquitetura: 5/10 (usa URL externa `risecheckout.com` que pode cair)
- Escalabilidade: 7/10
- Segurança: 10/10
- **NOTA FINAL: 7.0/10**

### Solução B: Restaurar ao código ORIGINAL que você enviou
Usar exatamente o código que você compartilhou como "versão original que funcionava", mas mantendo as imports corretas da arquitetura existente.

- Manutenibilidade: 10/10 (código comprovadamente funcional)
- Zero DT: 10/10
- Arquitetura: 10/10 (mantém imports do projeto)
- Escalabilidade: 10/10
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**

### DECISÃO: Solução B (Nota 10.0)

## Implementação

Vou restaurar o template **exatamente** como o código original que você enviou, com estas adaptações mínimas:

| Aspecto | Ação |
|---------|------|
| Estrutura HTML/CSS | Exatamente como o original (sem success-banner) |
| Header | `padding: 40px 20px`, img `max-width: 180px` |
| formatCurrency | Mantém import existente (não duplicar função) |
| Logo URL | Manter Supabase Storage (asset permanente nosso) |
| Types | Manter interface existente |

## Arquivo a Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/_shared/email-templates-purchase.ts` | Reescrever com estrutura original |

## Código Proposto

```text
Estrutura Original (sem success-banner):
┌─────────────────────────────────────┐
│ HEADER (padding: 40px 20px)         │
│   Logo (max-width: 180px)           │
├─────────────────────────────────────┤
│ CONTENT                             │
│   H1: "Sua compra foi confirmada!"  │
│   P: Mensagem de boas-vindas        │
│                                     │
│   [CTA Section - se deliveryUrl]    │
│                                     │
│   Order Details Box                 │
├─────────────────────────────────────┤
│ SUPPORT                             │
│   Link de contato                   │
├─────────────────────────────────────┤
│ FOOTER                              │
│   Vendido por / Rise Checkout       │
└─────────────────────────────────────┘
```

## CSS Original a Restaurar

```css
.header { text-align: center; padding: 40px 20px; border-bottom: 1px solid #E9ECEF; }
.header img { max-width: 180px; }
.content { padding: 32px; }
.content h1 { font-size: 24px; font-weight: 700; color: #212529; margin: 0 0 12px; }
.content p { font-size: 16px; line-height: 1.6; margin: 0 0 24px; color: #495057; }
/* ... resto do CSS original ... */
```

## Checklist RISE V3

- [x] Análise de múltiplas soluções com notas
- [x] Escolha da solução de maior nota (10.0)
- [x] Usa código comprovadamente funcional
- [x] Mantém arquitetura existente (imports)
- [x] Remove success-banner (não existia no original)
- [x] Restaura header padding original

