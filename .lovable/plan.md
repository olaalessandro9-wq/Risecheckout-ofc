

# Fase 7: CI/CD Bloqueante com GitHub Actions

## Objetivo

Configurar um pipeline de CI/CD completo que **bloqueia merges** em PRs quando testes falham ou coverage está abaixo dos thresholds, garantindo que apenas código testado e validado seja integrado ao branch principal.

---

## Análise de Soluções

### Solução A: Workflow Único Monolítico
- Um único arquivo de workflow que executa todos os testes sequencialmente
- Sem paralelização de jobs
- Sem cache de dependências

**Avaliação:**
- Manutenibilidade: 6/10 (arquivo grande, difícil de manter)
- Zero DT: 6/10 (performance degradada, sem cache)
- Arquitetura: 5/10 (sem separação de responsabilidades)
- Escalabilidade: 5/10 (tempo de execução aumenta linearmente)
- Segurança: 10/10
- **NOTA FINAL: 6.4/10**
- Tempo estimado: 30 minutos

### Solução B: Pipeline Modular com Jobs Paralelos
- Jobs separados para: Unit Tests, E2E Tests, Edge Functions, Coverage Report
- Paralelização máxima de execução
- Cache de node_modules e Playwright browsers
- Job de "gate" que bloqueia merge baseado em todos os resultados
- Artifacts para relatórios de coverage
- Status checks obrigatórios configurados

**Avaliação:**
- Manutenibilidade: 10/10 (cada job com responsabilidade única)
- Zero DT: 10/10 (estrutura final, cache otimizado)
- Arquitetura: 10/10 (separação clara, reusabilidade)
- Escalabilidade: 10/10 (jobs paralelos, fácil adicionar novos)
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 2 horas

### DECISÃO: Solução B (Nota 10.0)

A Solução A seria "mais rápida" mas viola a LEI SUPREMA. A Solução B garante um pipeline que pode ser mantido por décadas sem refatoração.

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `.github/workflows/ci.yml` | CRIAR | Pipeline principal de CI |
| `.github/workflows/test.yml` | DELETAR | Substituído pelo novo ci.yml |
| `package.json` | MODIFICAR | Adicionar scripts de teste |
| `vitest.config.ts` | MANTER | Thresholds já configurados |
| `docs/TESTING_SYSTEM.md` | MODIFICAR | Documentar Fase 7 |
| `.lovable/plan.md` | MODIFICAR | Atualizar status |

---

## Arquitetura do Pipeline

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CI/CD Pipeline                                     │
│                         (ci.yml workflow)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INSTALL                                         │
│  - Checkout code                                                            │
│  - Setup Node.js 20                                                         │
│  - Cache node_modules (hash de pnpm-lock.yaml)                             │
│  - pnpm install                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          ▼                         ▼                         ▼
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   UNIT TESTS    │    │      E2E TESTS      │    │  EDGE FUNC TESTS    │
│                 │    │                     │    │                     │
│ - vitest run    │    │ - Install browsers  │    │ - Setup Deno        │
│ - coverage json │    │ - playwright test   │    │ - deno test         │
│ - Upload report │    │ - Upload artifacts  │    │ - Upload report     │
└─────────────────┘    └─────────────────────┘    └─────────────────────┘
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           QUALITY GATE                                       │
│  - Verificar resultados de todos os jobs                                    │
│  - Validar coverage thresholds (60% statements/lines/functions)            │
│  - Bloquear se qualquer check falhar                                        │
│  - Gerar summary report                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                        ┌─────────────────────┐
                        │    MERGE ALLOWED    │
                        │   (ou BLOCKED)      │
                        └─────────────────────┘
```

---

## Detalhes Técnicos

### 1. Workflow Principal (ci.yml)

```yaml
name: 🧪 CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # Job 1: Instalação com Cache
  install:
    name: 📦 Install Dependencies
    runs-on: ubuntu-latest
    steps:
      - Checkout
      - Setup Node.js 20
      - Setup pnpm
      - Cache node_modules
      - Install dependencies

  # Job 2: Testes Unitários + Coverage
  unit-tests:
    name: 🧪 Unit & Integration Tests
    needs: install
    runs-on: ubuntu-latest
    steps:
      - Checkout
      - Restore cache
      - Run vitest with coverage
      - Upload coverage report
      - Check thresholds (60% statements, 50% branches, 60% functions, 60% lines)

  # Job 3: Testes E2E
  e2e-tests:
    name: 🎭 E2E Tests (Playwright)
    needs: install
    runs-on: ubuntu-latest
    steps:
      - Checkout
      - Restore cache
      - Install Playwright browsers
      - Run playwright test
      - Upload test results artifacts

  # Job 4: Testes Edge Functions
  edge-functions:
    name: ⚡ Edge Functions Tests
    needs: install
    runs-on: ubuntu-latest
    steps:
      - Checkout
      - Setup Deno
      - Run deno tests
      - Upload results

  # Job 5: Quality Gate (Bloqueante)
  quality-gate:
    name: 🚦 Quality Gate
    needs: [unit-tests, e2e-tests, edge-functions]
    runs-on: ubuntu-latest
    if: always()
    steps:
      - Check all job results
      - Generate summary report
      - Fail if any check failed
```

### 2. Scripts do package.json

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### 3. Coverage Thresholds (vitest.config.ts - já configurado)

```typescript
coverage: {
  thresholds: {
    statements: 60,
    branches: 50,
    functions: 60,
    lines: 60,
  },
}
```

### 4. Branch Protection Rules (Manual no GitHub)

Após deploy do workflow, configurar no GitHub:

| Regra | Valor |
|-------|-------|
| Require status checks | ✅ Enabled |
| Required checks | `quality-gate` |
| Require branches to be up to date | ✅ Enabled |
| Require conversation resolution | ✅ Enabled |

---

## Features do Pipeline

### Cache Otimizado
- Cache de `node_modules` baseado em hash de `pnpm-lock.yaml`
- Cache de browsers Playwright
- Restore incremental entre runs

### Paralelização
- Unit Tests, E2E Tests, e Edge Functions rodam em paralelo
- Tempo total de CI reduzido de ~15min para ~5min

### Artifacts
- Coverage report HTML (7 dias retention)
- Playwright trace files em caso de falha
- Test results JSON para analytics

### Concurrency Control
- Cancela runs anteriores quando novo push é feito
- Evita desperdício de minutos de CI

### Summary Reports
- Relatório visual no GitHub Actions Summary
- Indicadores de coverage por categoria
- Lista de testes que falharam (se houver)

---

## Arquivos a Atualizar

### .github/workflows/ci.yml (NOVO)

Workflow completo com 5 jobs:
1. `install` - Instalação com cache
2. `unit-tests` - Vitest + coverage
3. `e2e-tests` - Playwright
4. `edge-functions` - Deno tests
5. `quality-gate` - Bloqueio condicional

### package.json

Adicionar scripts:
- `test`: Executa vitest run
- `test:watch`: Vitest em modo watch
- `test:ui`: Vitest UI
- `test:coverage`: Vitest com coverage
- `test:e2e`: Playwright test
- `test:e2e:ui`: Playwright UI mode

### supabase/functions/run-tests.sh

Atualizar para:
- Descoberta automática de arquivos *.test.ts
- Suporte a testes em _shared/
- Exit code correto para CI

---

## Métricas Esperadas

| Métrica | Antes | Depois |
|---------|-------|--------|
| Workflows de teste | 1 (básico) | 1 (completo) |
| Jobs paralelos | 0 | 4 |
| Cache de dependências | ❌ | ✅ |
| Coverage enforcement | ❌ | ✅ (60%) |
| Merge blocking | ❌ | ✅ |
| Summary reports | ❌ | ✅ |
| Artifacts | ❌ | ✅ |
| Tempo médio de CI | ~15min | ~5min |

---

## Resultado Final do Sistema de Testes

Após a Fase 7:

| Fase | Status | Descrição |
|------|--------|-----------|
| Fase 1 | ✅ | Infraestrutura Base |
| Fase 2 | ✅ | Testes Backend (129 testes) |
| Fase 3 | ✅ | Testes Frontend (150+ testes) |
| Fase 4 | ✅ | Testes Hooks (66 testes) |
| Fase 5 | ✅ | Testes Edge Functions (200+ testes) |
| Fase 6 | ✅ | Testes E2E (43+ testes) |
| Fase 7 | ✅ | CI/CD Bloqueante |

**Sistema de Testes 100% Completo - RISE V3 Certified 10.0/10**

