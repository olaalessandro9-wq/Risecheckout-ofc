
# Fase 3, Etapa 4: Testes para Contextos e Providers

## Análise de Soluções (RISE V3 Seção 4.4)

### Solução A: Testes Unitários Simples
- Manutenibilidade: 7/10 (falta cobertura de edge cases)
- Zero DT: 6/10 (não testa integrações entre providers)
- Arquitetura: 6/10 (viola SOLID - não testa contratos completos)
- Escalabilidade: 7/10 (difícil adicionar testes de integração depois)
- Segurança: 8/10 (testa XSS básico)
- **NOTA FINAL: 6.8/10**
- Tempo estimado: 2 horas

### Solução B: Testes Unitários + Integração Completos
- Manutenibilidade: 10/10 (modularização por responsabilidade)
- Zero DT: 10/10 (cobre todos os edge cases e integrações)
- Arquitetura: 10/10 (testa contratos, hooks e providers separadamente)
- Escalabilidade: 10/10 (estrutura permite expansão futura)
- Segurança: 10/10 (testa XSS, localStorage, beforeunload)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 6 horas

### DECISÃO: Solução B (Nota 10.0/10)
A Solução A é inferior porque não cobre a integração entre providers (ex: UnsavedChangesGuard + NavigationGuardProvider), não testa edge cases de localStorage, e não valida o comportamento do useBlocker do react-router-dom.

---

## Arquivos a Criar

| # | Arquivo | Responsabilidade | Linhas Est. | Testes Est. |
|---|---------|------------------|-------------|-------------|
| 1 | `src/contexts/__tests__/CheckoutContext.test.tsx` | Provider dual-mode, hook, erro fora do provider | ~180 | 18 |
| 2 | `src/contexts/__tests__/UltrawidePerformanceContext.test.tsx` | matchMedia, configs ultrawide, hooks especializados | ~160 | 15 |
| 3 | `src/providers/__tests__/theme.test.tsx` | localStorage, classList, fallback fora do provider | ~140 | 12 |
| 4 | `src/providers/__tests__/NavigationGuardProvider.test.tsx` | registerDirty, hasAnyDirty, blocker state | ~200 | 20 |
| 5 | `src/providers/__tests__/UnsavedChangesGuard.test.tsx` | Integração com NavigationGuardProvider, auto-ID | ~120 | 10 |
| 6 | `src/hooks/__tests__/useFormDirtyGuard.test.tsx` | register/unregister lifecycle, cleanup | ~100 | 8 |

**Total:** 6 arquivos, ~900 linhas, ~83 testes

---

## Detalhes Técnicos de Implementação

### 1. CheckoutContext.test.tsx (~18 testes)

```text
DESCRIBE: CheckoutProvider
├── IT: fornece valor quando usado com prop value
├── IT: fornece valor quando usado com props separadas
├── IT: memoiza valor corretamente (evita re-renders)
├── IT: retorna checkout null quando não fornecido
├── IT: retorna orderBumps vazio quando não fornecido
├── IT: retorna vendorId null para segurança
├── IT: aceita productData opcional
├── IT: aceita customization opcional
└── IT: atualiza valor quando props mudam

DESCRIBE: useCheckoutContext
├── IT: retorna valor do contexto quando dentro do provider
├── IT: lança erro quando fora do provider
├── IT: retorna todos os campos esperados
├── IT: retorna design quando fornecido via value
├── IT: retorna design quando fornecido via prop design
└── IT: permite acesso a orderBumps do contexto
```

**Mocks Necessários:**
- Não precisa de mocks externos (contexto puro)

---

### 2. UltrawidePerformanceContext.test.tsx (~15 testes)

```text
DESCRIBE: UltrawidePerformanceProvider
├── IT: detecta monitor ultrawide (≥2560px)
├── IT: detecta monitor normal (<2560px)
├── IT: responde a mudanças de media query
├── IT: retorna chartConfig padrão para normal
├── IT: retorna chartConfig otimizado para ultrawide
├── IT: disableAnimations é true para ultrawide
├── IT: disableBlur é true para ultrawide
├── IT: disableHoverEffects é true para ultrawide
└── IT: memoiza value corretamente

DESCRIBE: useUltrawidePerformance
├── IT: retorna valor padrão fora do provider
├── IT: retorna valor correto dentro do provider
└── IT: reflete mudanças de ultrawide

DESCRIBE: useChartPerformanceConfig
├── IT: retorna apenas chartConfig
└── IT: retorna config correto baseado em ultrawide
```

**Mocks Necessários:**
- `window.matchMedia` (configurável para testes)
- `window.innerWidth` (para estado inicial)
- `@/lib/logger` (createLogger mock)

---

### 3. theme.test.tsx (~12 testes)

```text
DESCRIBE: ThemeProvider
├── IT: inicializa com tema do localStorage
├── IT: inicializa com 'light' se localStorage vazio
├── IT: inicializa com 'light' se localStorage inválido
├── IT: aplica classe ao documentElement
├── IT: remove classe anterior ao mudar tema
├── IT: salva tema no localStorage ao mudar
├── IT: trata erro de localStorage graciosamente
└── IT: memoiza value corretamente

DESCRIBE: useTheme
├── IT: retorna tema atual
├── IT: permite mudar tema via setTheme
├── IT: retorna fallback fora do provider
└── IT: fallback setTheme é no-op seguro
```

**Mocks Necessários:**
- `localStorage` (getItem, setItem)
- `document.documentElement.classList` (add, remove)
- `@/lib/logger` (createLogger mock)

---

### 4. NavigationGuardProvider.test.tsx (~20 testes)

```text
DESCRIBE: NavigationGuardProvider
├── IT: renderiza children corretamente
├── IT: fornece valor de contexto
├── IT: aceita textos customizados do diálogo
└── IT: registra beforeunload handler

DESCRIBE: registerDirty/unregisterDirty
├── IT: registra formulário como dirty
├── IT: remove registro quando isDirty=false
├── IT: permite múltiplos registros simultâneos
├── IT: unregister remove formulário específico
└── IT: não afeta outros registros ao unregister

DESCRIBE: hasAnyDirty/isDirtyById
├── IT: retorna false quando nenhum dirty
├── IT: retorna true quando pelo menos um dirty
├── IT: isDirtyById retorna true para ID específico
├── IT: isDirtyById retorna false para ID inexistente
└── IT: reflete mudanças em tempo real

DESCRIBE: attemptNavigation
├── IT: chama navigate com path correto
└── IT: passa state opcional para navigate

DESCRIBE: AlertDialog (blocker state)
├── IT: não exibe dialog quando não bloqueado
├── IT: handleCancel reseta blocker
└── IT: handleProceed limpa dirty e prossegue
```

**Mocks Necessários:**
- `react-router-dom` (useNavigate, useBlocker)
- `window.addEventListener` (beforeunload)
- AlertDialog components (render verification)

---

### 5. UnsavedChangesGuard.test.tsx (~10 testes)

```text
DESCRIBE: UnsavedChangesGuard
├── IT: renderiza children
├── IT: gera ID automático se não fornecido
├── IT: usa ID fornecido quando disponível
├── IT: registra como dirty quando isDirty=true
├── IT: registra como não-dirty quando isDirty=false
├── IT: atualiza registro quando isDirty muda
├── IT: faz unregister ao desmontar
├── IT: props deprecated não afetam comportamento
└── IT: funciona com múltiplos guards simultâneos
```

**Mocks Necessários:**
- NavigationGuardProvider (wrapper obrigatório)
- `useFormDirtyGuard` (mock para isolamento)

---

### 6. useFormDirtyGuard.test.tsx (~8 testes)

```text
DESCRIBE: useFormDirtyGuard
├── IT: chama registerDirty no mount
├── IT: chama registerDirty quando isDirty muda
├── IT: chama unregisterDirty no unmount
├── IT: usa ID correto ao registrar
├── IT: atualiza registro quando ID muda
├── IT: lança erro fora do NavigationGuardProvider
├── IT: cleanup é chamado corretamente
└── IT: não re-registra se valores iguais
```

**Mocks Necessários:**
- NavigationGuardProvider (wrapper obrigatório)
- `useNavigationGuard` (mock parcial para spy)

---

## Infraestrutura de Mocks

### Mock de matchMedia (Configurável)

```typescript
function createMatchMediaMock(matches: boolean) {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}
```

### Mock de useBlocker (react-router-dom)

```typescript
const mockBlocker = {
  state: "unblocked" as "blocked" | "unblocked" | "proceeding",
  proceed: vi.fn(),
  reset: vi.fn(),
};

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useBlocker: vi.fn(() => mockBlocker),
    useNavigate: vi.fn(() => vi.fn()),
  };
});
```

### Wrapper de Teste com NavigationGuardProvider

```typescript
function renderWithNavigationGuard(ui: ReactElement) {
  return render(
    <BrowserRouter>
      <NavigationGuardProvider>
        {ui}
      </NavigationGuardProvider>
    </BrowserRouter>
  );
}
```

---

## Projeção de Cobertura

```text
ANTES (Atual):
Arquivos com Teste: 80/478 (16.7%)
Testes Totais: ~1,400

APÓS (Etapa 4):
Arquivos com Teste: 86/478 (18.0%)
Testes Totais: ~1,483

INCREMENTO: +1.3% cobertura, +83 testes
```

---

## Ordem de Implementação

```text
1. theme.test.tsx (mais simples, sem dependências)
2. CheckoutContext.test.tsx (contexto puro, sem mocks complexos)
3. UltrawidePerformanceContext.test.tsx (matchMedia mock)
4. useFormDirtyGuard.test.tsx (hook isolado)
5. NavigationGuardProvider.test.tsx (useBlocker mock)
6. UnsavedChangesGuard.test.tsx (integração final)
```

---

## Validação RISE V3

| Critério | Status |
|----------|--------|
| LEI SUPREMA (Seção 4) | Solução B (nota 10.0) |
| Zero Tipos `any` | Obrigatório |
| Limite 300 Linhas | Todos <200 linhas |
| Testing Pyramid | 70% Unit |
| Documentação JSDoc | Obrigatório em cada arquivo |
| Frases Proibidas | Nenhuma utilizada |

---

## Entregáveis

1. **6 arquivos de teste** seguindo RISE V3 10.0/10
2. **~83 testes** cobrindo todos os edge cases
3. **Zero violações** de limite de linhas
4. **Documentação JSDoc** completa em cada arquivo
5. **Mocks reutilizáveis** para testes futuros
