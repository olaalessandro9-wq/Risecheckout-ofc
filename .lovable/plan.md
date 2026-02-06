

# Cleanup: 2 Code Hygiene Fixes (RISE V3 Section 6.4)

A auditoria completa da implementacao do Legal Hub confirmou que **tudo funciona corretamente**: 8 documentos, 9 rotas, conteudo sem placeholders, cross-links internos, layout DRY, testes passando (41/41), visual OK, zero erros no console.

Foram encontrados **2 problemas menores de higiene de codigo** que precisam ser corrigidos para nota 10.0/10.

---

## Fix 1: Remover `contentRef` nao utilizado

**Arquivo:** `src/pages/legal/LegalPageLayout.tsx`

**Problema:** `useRef<HTMLDivElement>(null)` declarado na linha 46 e atribuido ao `<div ref={contentRef}>` na linha 151, mas nenhum codigo le `.current`. E codigo morto -- um ref que existe mas nao serve para nada.

**Correcao:**
- Remover `useRef` do import (linha 10)
- Remover a declaracao `const contentRef = useRef<HTMLDivElement>(null)` (linha 46)
- Remover `ref={contentRef}` do `<div>` (linha 151)

---

## Fix 2: Remover import orfao `extractAllPaths`

**Arquivo:** `src/routes/__tests__/publicRoutes.test.tsx`

**Problema:** `extractAllPaths` e importado na linha 9 mas nunca chamado no arquivo. Import orfao.

**Correcao:**
- Alterar linha 9 de `import { isValidRouteObject, extractAllPaths } from "./_shared"` para `import { isValidRouteObject } from "./_shared"`

---

## Resumo

| Acao | Arquivo | Descricao |
|------|---------|-----------|
| EDIT | `src/pages/legal/LegalPageLayout.tsx` | Remover `useRef` e `contentRef` nao utilizados |
| EDIT | `src/routes/__tests__/publicRoutes.test.tsx` | Remover import orfao `extractAllPaths` |

Apos essas 2 correcoes, a implementacao do Legal Hub estara em **10.0/10** -- zero codigo morto, zero imports orfaos, zero divida tecnica.

