
# Plano: Teste de Isolamento - Tamanho do Logo

## Objetivo do Teste

Alterar **APENAS** o tamanho do logo no template `purchase` para igualar ao que funciona (`members-area`). Se o problema persistir após essa mudança, confirmamos que o tamanho do logo **NÃO É** a causa do truncamento no Gmail.

## Mudanças Mínimas (Teste de Isolamento)

### Arquivo: `email-templates-purchase.ts`

| Linha | ANTES | DEPOIS |
|-------|-------|--------|
| 31 | `.header { padding: 0; line-height: 0; }` | `.header { padding: 40px 20px; border-bottom: 1px solid #E9ECEF; }` |
| 32 | `.header img { max-width: 400px; }` | `.header img { max-width: 180px; }` |
| 77 | `<img ... width="400">` | `<img ...>` (remover atributo width) |

### Código Específico

**CSS (linhas 31-32):**
```css
// ANTES:
.header { text-align: center; padding: 0; line-height: 0; }
.header img { display: block; width: 100%; max-width: 400px; height: auto; margin: 0 auto; }

// DEPOIS:
.header { text-align: center; padding: 40px 20px; border-bottom: 1px solid #E9ECEF; }
.header img { max-width: 180px; }
```

**HTML (linha 77):**
```html
// ANTES:
<img src="${logoUrl}" alt="Rise Checkout" width="400">

// DEPOIS:
<img src="${logoUrl}" alt="Rise Checkout Logo">
```

## Lógica do Teste

```text
┌─────────────────────────────────────────────────────────────┐
│                    TESTE DE ISOLAMENTO                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│   Alterar APENAS tamanho do logo (400px → 180px)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│   Enviar preview via Email Preview                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
     ┌─────────────────┐             ┌─────────────────┐
     │ EMAIL COMPLETO  │             │ 3 PONTINHOS     │
     │ (sem truncar)   │             │ (ainda trunca)  │
     └─────────────────┘             └─────────────────┘
              │                               │
              ▼                               ▼
     ┌─────────────────┐             ┌─────────────────┐
     │ CAUSA ENCONTRADA│             │ LOGO NÃO É A   │
     │ Era o tamanho   │             │ CAUSA - buscar │
     │ do logo         │             │ outro motivo   │
     └─────────────────┘             └─────────────────┘
```

## Resultado Esperado

**Se funcionar:** O problema era o `line-height: 0`, `padding: 0`, ou o tamanho 400px do logo.

**Se NÃO funcionar:** Confirma que o tamanho do logo é irrelevante e devemos investigar outras diferenças estruturais.

## Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `supabase/functions/_shared/email-templates-purchase.ts` | 3 linhas (31, 32, 77) |

## Próximos Passos Após Teste

1. Enviar preview pelo Email Preview
2. Verificar no Gmail
3. Se funcionar → Manter mudanças
4. Se não funcionar → Reverter e investigar outras diferenças (flexbox, estrutura HTML, etc.)
