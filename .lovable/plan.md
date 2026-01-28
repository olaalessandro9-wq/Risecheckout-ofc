
# Ajuste de Espaçamento: Título da Seção mais Próximo dos Cards

## Análise Visual

| Plataforma | Espaçamento Título → Cards |
|------------|---------------------------|
| Paramount+ | ~8-12px (referência) |
| RiseCheckout Atual | ~24px (muito distante) |

## Problema Identificado

No arquivo `ModuleCarousel.tsx`:
- Linha 84: `mb-2` = 8px margin-bottom no título
- Linha 121: `pt-4` = 16px padding-top no container de cards
- **Total: 24px** - o dobro do Paramount+

## Solução

Reduzir o espaçamento para ~10px (padrão Paramount+):

| Propriedade | Antes | Depois |
|-------------|-------|--------|
| Título `mb-*` | `mb-2` (8px) | `mb-1` (4px) |
| Container `pt-*` | `pt-4` (16px) | `pt-1.5` (6px) |
| **Total** | 24px | **~10px** |

## Arquivo a Alterar

| Arquivo | Alteração |
|---------|-----------|
| `ModuleCarousel.tsx` | Linha 84: `mb-2` → `mb-1` |
| `ModuleCarousel.tsx` | Linha 121: `pt-4` → `pt-1.5` |

## Resultado Esperado

O título "Recomendados" ficará visualmente próximo dos cards, igual ao estilo Paramount+.
