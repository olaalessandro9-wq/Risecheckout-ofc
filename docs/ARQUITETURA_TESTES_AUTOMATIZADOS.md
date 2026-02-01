# Arquitetura de Testes Automatizados - RiseCheckout

**Status:** ✅ IMPLEMENTADO  
**Última atualização:** 01 de Fevereiro de 2026  
**Versão:** 2.0.0

---

## Visão Geral

O RiseCheckout implementa uma arquitetura de testes em múltiplas camadas, seguindo o RISE Protocol V3:

| Camada | Framework | Localização | Cobertura |
|--------|-----------|-------------|-----------|
| Unit Tests | Vitest | `src/**/*.test.ts` | 70% |
| Integration Tests | Vitest | `src/**/*.test.tsx` | 20% |
| E2E Tests | Playwright | `e2e/**/*.spec.ts` | 10% |
| Edge Functions | Deno | `supabase/functions/**/*.test.ts` | 80%+ |

---

## Comandos de Execução

### Frontend (Vitest)
```bash
# Rodar todos os testes
npm run test

# Rodar com cobertura
npm run test:coverage

# Rodar em modo watch
npm run test:watch
```

### Edge Functions (Deno)
```bash
# Rodar todos os testes de Edge Functions
cd supabase/functions && ./run-tests.sh

# Rodar teste específico
deno test --allow-net --allow-env path/to/test.ts
```

### E2E (Playwright)
```bash
# Rodar testes E2E
npm run test:e2e
```

---

## Testes de Edge Functions Implementados

| Edge Function | Arquivo de Teste | Status |
|---------------|------------------|--------|
| `pushinpay-get-status` | `index.test.ts` | ✅ |
| `pushinpay-webhook` | `index.test.ts` | ✅ |
| `pushinpay-validate-token` | `index.test.ts` | ✅ |
| `vault-save` | `index.test.ts` | ✅ |
| `rls-security-tester` | `index.test.ts` | ✅ |
| `vendor-integrations` | `tests/*.test.ts` | ✅ |

---

## CI/CD Workflows

Os workflows do GitHub Actions estão configurados em `.github/workflows/`:

- `ci.yml` - Pipeline principal de CI
- `security-scan.yml` - Análise de segurança (TruffleHog, Dependency Audit, CodeQL)

---

## Branch Protection

Para configurar o Branch Protection no GitHub Enterprise:

1. Ative "Require status checks to pass before merging"
2. Adicione os checks após o primeiro push triggerar os workflows
3. Marque "Require branches to be up to date before merging"

---

**Documentação completa dos cenários de teste nos próprios arquivos `.test.ts`.**
