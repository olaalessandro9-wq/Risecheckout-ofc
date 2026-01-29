
# Fase 6: Testes E2E com Playwright

## Objetivo

Implementar uma suite completa de testes E2E que valide os fluxos críticos de usuário da plataforma RiseCheckout, garantindo que a experiência do usuário funcione corretamente end-to-end.

---

## Escopo de Fluxos Críticos a Testar

### 1. Fluxos de Autenticação (Producer)
| Fluxo | Descrição |
|-------|-----------|
| Login Producer | Acesso ao /auth, preenchimento do formulário, redirecionamento para /dashboard |
| Cadastro Producer | Fluxo de registro em /cadastro, seleção de perfil, criação de conta |
| Recuperação de Senha | Solicitação de reset em /recuperar-senha |

### 2. Fluxo de Checkout Público
| Fluxo | Descrição |
|-------|-----------|
| Carregamento de Checkout | Acesso via /pay/:slug, verificação de loading e exibição de dados |
| Preenchimento de Formulário | Validação de campos, seleção de método de pagamento |
| Aplicação de Cupom | Inserção de código, validação de desconto aplicado |
| Order Bumps | Seleção/deseleção, verificação de atualização de preço |
| Finalização PIX | Submit do pagamento, navegação para página de PIX |
| Página de Sucesso | Verificação de detalhes do pedido após pagamento |

### 3. Fluxo da Área de Membros (Buyer)
| Fluxo | Descrição |
|-------|-----------|
| Login Buyer | Acesso via /minha-conta, autenticação |
| Setup de Acesso | Configuração inicial de senha via link de convite |
| Visualização de Curso | Navegação entre módulos e aulas |
| Marcação de Progresso | Toggle de aula concluída |

### 4. Landing Page
| Fluxo | Descrição |
|-------|-----------|
| Navegação | Scroll entre seções, CTAs funcionando |
| Links Críticos | Botões de cadastro e login redirecionando corretamente |

---

## Arquitetura dos Testes E2E

```text
e2e/
├── fixtures/
│   ├── test-data.ts          # Dados de teste centralizados
│   └── pages/                # Page Objects
│       ├── AuthPage.ts       # /auth page actions
│       ├── CadastroPage.ts   # /cadastro page actions
│       ├── CheckoutPage.ts   # /pay/:slug page actions
│       ├── PixPaymentPage.ts # /pay/pix/:orderId page actions
│       ├── SuccessPage.ts    # /success/:orderId page actions
│       ├── LandingPage.ts    # / page actions
│       └── BuyerPage.ts      # /minha-conta page actions
├── specs/
│   ├── auth.spec.ts          # Testes de autenticação producer
│   ├── checkout.spec.ts      # Testes de checkout público
│   ├── buyer-auth.spec.ts    # Testes de autenticação buyer
│   ├── landing.spec.ts       # Testes da landing page
│   └── smoke.spec.ts         # Smoke tests rápidos
├── members-area-flicker.spec.ts  # (existente - mantido)
└── README.md                 # Documentação dos testes E2E
```

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `e2e/fixtures/test-data.ts` | Dados de teste centralizados (emails, senhas) |
| `e2e/fixtures/pages/AuthPage.ts` | Page Object para /auth |
| `e2e/fixtures/pages/CheckoutPage.ts` | Page Object para checkout público |
| `e2e/fixtures/pages/LandingPage.ts` | Page Object para landing |
| `e2e/specs/smoke.spec.ts` | Smoke tests (renderização básica das rotas) |
| `e2e/specs/auth.spec.ts` | Testes de login/cadastro producer |
| `e2e/specs/checkout.spec.ts` | Testes completos de checkout |
| `e2e/specs/landing.spec.ts` | Testes de navegação da landing |
| `e2e/README.md` | Documentação dos testes E2E |
| `docs/TESTING_SYSTEM.md` | Atualização para Fase 6 |
| `.lovable/plan.md` | Atualização de status |

---

## Detalhes Técnicos

### Page Object Pattern
Cada página terá uma classe com:
- Locators centralizados (usando Playwright best practices)
- Métodos de ação (navigate, fill, click, submit)
- Métodos de asserção (expectVisible, expectText, expectUrl)

### Test Data Isolation
- Emails de teste com prefixo `e2e-test-` + timestamp
- Dados mockados para cenários onde não há ambiente real
- Variáveis de ambiente para credenciais de teste

### Smoke Tests
Testes rápidos que validam:
- Cada rota crítica carrega sem erro 500
- Elementos principais estão visíveis
- Sem erros de console críticos

---

## Estimativa de Testes

| Arquivo | Testes Estimados |
|---------|------------------|
| `smoke.spec.ts` | 8 |
| `auth.spec.ts` | 6 |
| `checkout.spec.ts` | 12 |
| `landing.spec.ts` | 5 |
| `members-area-flicker.spec.ts` | 6 (existente) |
| **TOTAL** | **37+ testes** |

---

## Seção Técnica

### Configuração do Playwright
O projeto já utiliza `lovable-agent-playwright-config` que fornece configuração base otimizada. Utilizaremos:

```typescript
// playwright-fixture.ts já existe
export { test, expect } from "lovable-agent-playwright-config/fixture";
```

### Exemplo de Page Object
```typescript
// e2e/fixtures/pages/AuthPage.ts
import type { Page, Locator } from "@playwright/test";

export class AuthPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByRole("textbox", { name: /email/i });
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.getByRole("button", { name: /entrar/i });
  }

  async navigate() {
    await this.page.goto("/auth");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

### Exemplo de Spec
```typescript
// e2e/specs/auth.spec.ts
import { test, expect } from "@playwright/test";
import { AuthPage } from "../fixtures/pages/AuthPage";

test.describe("Producer Authentication", () => {
  test("should display login form", async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.navigate();
    
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();
    await expect(authPage.submitButton).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.navigate();
    await authPage.login("invalid@test.com", "wrongpassword");
    
    await expect(page.getByText(/credenciais inválidas/i)).toBeVisible();
  });
});
```

### Data-TestId Strategy
Para garantir seletores estáveis, adicionaremos `data-testid` em componentes críticos:
- Forms de autenticação
- Botões de submit
- Cards de produto no checkout
- Status indicators

---

## Resultado Esperado

Após a implementação:

| Métrica | Antes | Depois |
|---------|-------|--------|
| Testes E2E | 6 (flicker) | 37+ |
| Page Objects | 0 | 5 |
| Smoke Tests | 0 | 8 |
| Cobertura de Rotas | ~10% | ~80% |

---

## Conclusão

Esta fase estabelece uma fundação sólida de testes E2E usando:
1. **Page Object Pattern** para manutenibilidade
2. **Smoke Tests** para detecção rápida de regressões
3. **Testes de Fluxo Completo** para validação de jornadas críticas
4. **Documentação Completa** para onboarding de novos desenvolvedores

O sistema de testes atingirá **580+ testes totais** (545 existentes + 37 E2E).
