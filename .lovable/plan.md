

# Plano: Aumentar Tamanho da Logo no Template de Compra

## Problema Identificado

A logo no header do email está muito pequena. O código atual usa:

```css
.header img { max-width: 180px; }
```

## Solução

Aumentar o `max-width` da imagem para que ela preencha melhor o espaço do header. Como o container tem `max-width: 600px`, sugiro usar `max-width: 300px` ou `max-width: 350px` para a logo.

## Alteração

| Arquivo | Linha | Antes | Depois |
|---------|-------|-------|--------|
| `supabase/functions/_shared/email-templates-purchase.ts` | CSS `.header img` | `max-width: 180px` | `max-width: 300px` |

## Código CSS Atualizado

```css
.header img { max-width: 300px; height: auto; display: block; margin: 0 auto; }
```

## Notas Técnicas

- Mantém `height: auto` para preservar proporção
- `display: block` e `margin: 0 auto` garantem centralização
- 300px é 50% do container (600px), proporção visualmente equilibrada
- Se 300px ainda parecer pequeno, podemos aumentar para 350px ou 400px

## Checklist

- [x] Alteração mínima (apenas 1 propriedade CSS)
- [x] Não afeta estrutura que resolveu o clipping
- [x] Mantém responsividade

