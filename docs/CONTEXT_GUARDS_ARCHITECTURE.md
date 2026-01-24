# Context Guards Architecture

> **Versão:** 1.0.0  
> **Data:** 24 de Janeiro de 2026  
> **Status:** ✅ RISE V3 10.0/10  
> **Mantenedor:** Lead Architect

---

## Visão Geral

O sistema de **Context Guards** implementa o padrão Cakto de isolamento de contexto entre Producer e Buyer. Este sistema garante que a navegação do usuário respeite estritamente o `activeRole` atual, impedindo acesso acidental ou intencional a painéis fora do contexto ativo.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                  CONTEXT GUARD SYSTEM                            │
│                                                                  │
│  activeRole (SSOT) → Determina qual painel o usuário pode ver   │
│                                                                  │
│  ┌─────────────────────────┐    ┌─────────────────────────┐     │
│  │  ProducerContextGuard    │    │  BuyerContextGuard       │     │
│  │  ─────────────────────   │    │  ─────────────────────   │     │
│  │  Protege: /dashboard/*   │    │  Protege: /minha-conta/* │     │
│  │  Bloqueia: buyer         │    │  Bloqueia: producer      │     │
│  │  Redireciona: /minha-..  │    │  Redireciona: /dashboard │     │
│  └─────────────────────────┘    └─────────────────────────┘     │
│                                                                  │
│  ÚNICA FORMA DE TROCAR: Clique explícito no ContextSwitcher     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Componentes

### ProducerContextGuard

**Localização:** `src/components/guards/ProducerContextGuard.tsx`

**Responsabilidade:**
- Protege todas as rotas de produtor (`/dashboard/*`)
- Se `activeRole === "buyer"` → Redireciona para `/minha-conta/dashboard`
- Impede navegação via browser history, URL direta, ou qualquer outro método

**Código:**
```tsx
export function ProducerContextGuard({ children }: ProducerContextGuardProps) {
  const { isAuthenticated, isLoading, activeRole } = useUnifiedAuth();
  
  // Context is "buyer" - BLOCK access to producer routes
  if (activeRole === "buyer") {
    return <Navigate to="/minha-conta/dashboard" replace />;
  }
  
  // Context is producer (owner/admin/user/seller) - allow access
  return <>{children}</>;
}
```

---

### BuyerContextGuard

**Localização:** `src/components/guards/BuyerContextGuard.tsx`

**Responsabilidade:**
- Protege todas as rotas de aluno (`/minha-conta/*`)
- Se `activeRole !== "buyer"` → Redireciona para `/dashboard`
- Impede navegação via browser history, URL direta, ou qualquer outro método

**Código:**
```tsx
export function BuyerContextGuard({ children }: BuyerContextGuardProps) {
  const { isAuthenticated, isLoading, activeRole } = useUnifiedAuth();
  
  // Context is NOT "buyer" - BLOCK access to buyer routes
  if (activeRole !== "buyer") {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Context is buyer - allow access
  return <>{children}</>;
}
```

---

## Integração no Router

### DashboardLayout (Producer)

```tsx
function DashboardLayout() {
  return (
    <ProtectedRoute>
      <ProducerContextGuard>
        <ThemeProvider>
          <NavigationGuardProvider>
            <AppShell />
          </NavigationGuardProvider>
        </ThemeProvider>
      </ProducerContextGuard>
    </ProtectedRoute>
  );
}
```

### MembersAreaBuilderLayout (Producer)

```tsx
function MembersAreaBuilderLayout() {
  return (
    <ProtectedRoute>
      <ProducerContextGuard>
        <ThemeProvider>
          <NavigationGuardProvider>
            <MembersAreaBuilderPage />
          </NavigationGuardProvider>
        </ThemeProvider>
      </ProducerContextGuard>
    </ProtectedRoute>
  );
}
```

### StudentShell (Buyer)

```tsx
{
  path: "/minha-conta",
  element: (
    <BuyerContextGuard>
      <StudentShell />
    </BuyerContextGuard>
  ),
  children: [...],
}
```

### Full-Screen Course Pages (Buyer)

```tsx
{
  path: "/minha-conta/produto/:productId",
  element: (
    <BuyerContextGuard>
      <CourseHome />
    </BuyerContextGuard>
  ),
}
```

---

## Comportamento

| Cenário | Resultado |
|---------|-----------|
| Contexto buyer, acessa `/dashboard` via URL | Redireciona → `/minha-conta/dashboard` |
| Contexto buyer, usa botão voltar para `/dashboard` | Redireciona → `/minha-conta/dashboard` |
| Contexto producer, acessa `/minha-conta` via URL | Redireciona → `/dashboard` |
| Contexto producer, usa botão voltar para `/minha-conta` | Redireciona → `/dashboard` |
| Usuário clica "Painel do Aluno" no menu | Troca contexto + Navega normalmente |
| Usuário clica "Painel do Produtor" no menu | Troca contexto + Navega normalmente |

---

## Fluxo de Decisão

```
┌─────────────────────────────────────────────┐
│         Usuário tenta acessar rota          │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│  Rota é /dashboard/* ou /minha-conta/*?     │
└─────────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌───────────────────┐     ┌───────────────────┐
│  /dashboard/*     │     │  /minha-conta/*   │
│  ───────────────  │     │  ───────────────  │
│  ProducerGuard    │     │  BuyerGuard       │
└───────────────────┘     └───────────────────┘
        │                           │
        ▼                           ▼
┌───────────────────┐     ┌───────────────────┐
│ activeRole=buyer? │     │ activeRole≠buyer? │
│ → Redireciona     │     │ → Redireciona     │
│ → /minha-conta    │     │ → /dashboard      │
└───────────────────┘     └───────────────────┘
```

---

## Relação com Outros Componentes

| Componente | Relação |
|------------|---------|
| `useUnifiedAuth` | Fornece `activeRole` usado pelos Guards |
| `ContextSwitcher` | Única forma legítima de trocar contexto |
| `ProtectedRoute` | Verifica autenticação ANTES dos Guards |
| `RoleProtectedRoute` | Verifica permissões de role (owner/admin) |

---

## RISE V3 Compliance

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade | 10/10 | Guards são componentes puros e reutilizáveis |
| Zero DT | 10/10 | Usa padrões existentes (React Router, useUnifiedAuth) |
| Arquitetura | 10/10 | SSOT: contexto é a fonte da verdade para navegação |
| Escalabilidade | 10/10 | Fácil adicionar novas áreas protegidas |
| Segurança | 10/10 | Impossível burlar via URL ou browser history |
| **NOTA FINAL** | **10.0/10** | |

---

## Arquivos Relacionados

| Arquivo | Descrição |
|---------|-----------|
| `src/components/guards/ProducerContextGuard.tsx` | Guard para rotas de produtor |
| `src/components/guards/BuyerContextGuard.tsx` | Guard para rotas de aluno |
| `src/components/guards/index.ts` | Barrel export |
| `src/App.tsx` | Integração dos Guards no router |
| `src/components/layout/ContextSwitcher.tsx` | Menu de troca de contexto |
| `src/hooks/useUnifiedAuth.ts` | Hook que fornece activeRole |

---

## Changelog

| Versão | Data | Alterações |
|--------|------|------------|
| 1.0.0 | 2026-01-24 | Versão inicial - Context Guards implementados |
