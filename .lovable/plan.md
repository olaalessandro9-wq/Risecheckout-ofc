
# Plano de Correção - Fase 1 (Finalização)

## RISE V3 Diagnosis

**Status Atual:** 95% completo  
**Bloqueador Encontrado:** Scripts de teste ausentes no `package.json`

---

## Problema Identificado

O `package.json` atual tem apenas:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "build:dev": "vite build --mode development",
  "lint": "eslint .",
  "preview": "vite preview"
}
```

**Faltam os scripts de teste essenciais.**

---

## Correções Necessárias

### 1. Adicionar Scripts de Teste ao package.json

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "build:dev": "vite build --mode development",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest run --coverage"
}
```

### 2. (Opcional) Mover Dependências de Teste para devDependencies

As seguintes dependências deveriam estar em `devDependencies`:
- `vitest`
- `@vitest/coverage-v8`
- `@vitest/ui`
- `@testing-library/jest-dom`
- `@testing-library/react`
- `@testing-library/user-event`
- `jsdom`
- `msw`

**Nota:** Isso é uma melhoria de organização, não um bloqueador.

---

## Arquivos a Modificar

| Arquivo | Ação | Prioridade |
|---------|------|------------|
| `package.json` | Adicionar scripts de teste | CRÍTICO |
| `package.json` | Mover test deps para devDependencies | BAIXA |

---

## Validação Pós-Correção

Após a correção, os seguintes comandos devem funcionar:

1. `pnpm test` - Executa todos os testes uma vez
2. `pnpm test:watch` - Modo watch para desenvolvimento
3. `pnpm test:ui` - Interface visual do Vitest
4. `pnpm test:coverage` - Relatório de cobertura

---

## Resultado Esperado

Após a correção:
- **Fase 1 será 100% completa**
- Todos os testes existentes poderão ser executados
- A infraestrutura estará pronta para as Fases 2-7
