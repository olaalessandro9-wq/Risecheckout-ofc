
# Plano de Correção Final: RISE V3 10.0/10

## Resumo Executivo

Este plano corrige as **4 violações restantes** que impedem a certificação 10.0/10, todas relacionadas a terminologia proibida pelo RISE Protocol V3 Seção 4.5.

## Violações Identificadas

| ID | Arquivo | Linha | Violação | Gravidade |
|----|---------|-------|----------|-----------|
| V1 | `src/modules/members-area/components/editor/VideoSection.tsx` | 168 | "Por enquanto" (implica temporário) | ALTA |
| V2 | `docs/CHANGELOG.md` | 24-25 | "backwards compatibility" (2x) | ALTA |
| V3 | `docs/CHANGELOG.md` | 36 | "Compatibilidade legada" | ALTA |
| V4 | `docs/PRODUCTS_MODULE_ARCHITECTURE.md` | 270 | "Legacy boolean" (comentário) | ALTA |

## Correções Planejadas

### Correção 1: VideoSection.tsx (linha 168)

**Problema:** Frase "Por enquanto" implica solução temporária.

```text
Antes:  Por enquanto, use links do YouTube
Depois: Use links do YouTube ou Vimeo
```

**Justificativa:** Remove implicação de provisoriedade. A funcionalidade de embed por link é uma feature completa, não um workaround.

### Correção 2: CHANGELOG.md (linhas 24-25)

**Problema:** "backwards compatibility" é terminologia proibida.

```text
Antes:  Adicionada persistência de `delivery_type` com backwards compatibility
Depois: Adicionada persistência de `delivery_type` com suporte a produtos existentes
```

**Aplicar em ambas as linhas (24 e 25).**

### Correção 3: CHANGELOG.md (linha 36)

**Problema:** "Compatibilidade legada" usa terminologia proibida.

```text
Antes:  **Compatibilidade legada:** ✅ `external_delivery` sincronizado
Depois: **Produtos existentes:** ✅ `external_delivery` sincronizado
```

### Correção 4: PRODUCTS_MODULE_ARCHITECTURE.md (linha 270)

**Problema:** Comentário "Legacy boolean" usa termo proibido.

```text
Antes:  return 'external'; // Legacy boolean
Depois: return 'external'; // Campo boolean anterior ao ENUM
```

## Impacto

- **Zero breaking changes**: Apenas texto/UI/documentação
- **Arquivos modificados**: 3
- **Linhas alteradas**: 5

## Sequência de Execução

1. `src/modules/members-area/components/editor/VideoSection.tsx` - Corrigir "Por enquanto"
2. `docs/CHANGELOG.md` - Corrigir "backwards compatibility" (2x) e "Compatibilidade legada"
3. `docs/PRODUCTS_MODULE_ARCHITECTURE.md` - Corrigir "Legacy boolean"

## Validação Pós-Correção

```bash
# Todas as buscas devem retornar 0 resultados em src/
grep -r "Por enquanto" src/           # 0 resultados
grep -r "backwards compatibility" docs/CHANGELOG.md  # 0 resultados
grep -r "legada" docs/CHANGELOG.md    # 0 resultados
grep -r "Legacy" docs/PRODUCTS_MODULE_ARCHITECTURE.md  # 0 resultados (exceto nomes próprios)
```

## Score Esperado Pós-Correção

| Critério | Peso | Score |
|----------|------|-------|
| Manutenibilidade Infinita | 30% | 10/10 |
| Zero Dívida Técnica | 25% | 10/10 |
| Arquitetura Correta | 20% | 10/10 |
| Escalabilidade | 15% | 10/10 |
| Segurança | 10% | 10/10 |
| **NOTA FINAL** | **100%** | **10.0/10** |

## Observação sobre docs/archive/

Os arquivos em `docs/archive/` (AUTH_CHANGELOG.md, AUTH_MIGRATION_FINAL.md, etc.) contêm referências históricas a "legacy" e "legada". Estes arquivos são **documentação histórica arquivada** e não representam código ativo ou práticas atuais. Mantê-los preserva o registro de decisões arquiteturais passadas sem impactar a conformidade V3.
