# UI Components Library

> **Versão:** 2.0.0  
> **Data:** 24 de Janeiro de 2026  
> **Status:** ✅ RISE V3 10.0/10  
> **Mantenedor:** Lead Architect

---

## Visão Geral

Esta documentação cataloga os componentes UI reutilizáveis criados para o RiseCheckout, além dos componentes base do shadcn/ui.

---

## Componentes Customizados

### LoadingSwitch

**Localização:** `src/components/ui/loading-switch.tsx`

Switch com feedback visual integrado para operações assíncronas. Encapsula o padrão comum de exibir loading state durante toggles.

#### Props

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `isLoading` | `boolean` | `false` | Exibe estado de loading com spinner |
| `loadingLabel` | `string` | `undefined` | Label exibido durante loading |
| `activeLabel` | `string` | `"Ativo"` | Label quando `checked=true` |
| `inactiveLabel` | `string` | `"Inativo"` | Label quando `checked=false` |
| `showLabel` | `boolean` | `true` | Exibe label ao lado do switch |

**Herda todas as props de:** `@radix-ui/react-switch`

#### Uso Básico

```tsx
import { LoadingSwitch } from "@/components/ui/loading-switch";

function SettingsToggle() {
  const [enabled, setEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsSaving(true);
    await saveSettings({ enabled: checked });
    setEnabled(checked);
    setIsSaving(false);
  };

  return (
    <LoadingSwitch
      checked={enabled}
      onCheckedChange={handleToggle}
      isLoading={isSaving}
      loadingLabel={enabled ? "Desativando..." : "Ativando..."}
      activeLabel="Ativo"
      inactiveLabel="Inativo"
    />
  );
}
```

---

## Componentes Base (shadcn/ui)

O projeto utiliza shadcn/ui como biblioteca base. Principais componentes:

| Componente | Uso Principal |
|------------|---------------|
| `Button` | Ações e submits |
| `Input` | Campos de texto |
| `Select` | Dropdowns |
| `Dialog` | Modais |
| `Sheet` | Painéis laterais |
| `Tabs` | Navegação por abas |
| `Card` | Containers de conteúdo |
| `Table` | Listagens de dados |
| `Form` | Formulários com react-hook-form |
| `Toast` | Notificações (via Sonner) |

---

## Padrões de Design

### Cores

Todas as cores usam tokens semânticos do design system:

```tsx
// ✅ CORRETO
className="bg-primary text-primary-foreground"
className="bg-muted text-muted-foreground"
className="border-border"

// ❌ PROIBIDO
className="bg-blue-500 text-white"
className="bg-gray-100"
```

---

# Design Tokens System

## Landing Page Design Tokens

> **Status:** ✅ RISE V3 10.0/10

A Landing Page utiliza um sistema de design tokens exclusivo definido em `src/index.css`.

### Tokens Disponíveis

#### Background

| Token | Valor HSL | Uso |
|-------|-----------|-----|
| `--landing-bg` | `240 10% 4%` | Background principal (#0A0A0B) |
| `--landing-bg-elevated` | `240 10% 7%` | Cards e elementos elevados |
| `--landing-bg-footer` | `240 10% 2%` | Footer |
| `--landing-bg-subtle` | `0 0% 100%` | Com opacity (white/5) |

#### Text

| Token | Valor HSL | Uso |
|-------|-----------|-----|
| `--landing-text-primary` | `0 0% 100%` | Títulos e texto principal |
| `--landing-text-secondary` | `215 16% 75%` | Texto secundário |
| `--landing-text-muted` | `215 14% 65%` | Texto terciário |
| `--landing-text-subtle` | `215 13% 50%` | Texto mais sutil |

#### Accent

| Token | Valor HSL | Uso |
|-------|-----------|-----|
| `--landing-accent` | `217 91% 60%` | Cor de destaque (blue-500) |
| `--landing-accent-hover` | `217 91% 65%` | Hover state |
| `--landing-accent-glow` | `217 91% 60%` | Shadows e glows |
| `--landing-purple` | `271 81% 56%` | Accent secundário |

### Componentes Migrados

| Componente | Status |
|------------|--------|
| `LandingThemeProvider` | ✅ 100% tokens |
| `LandingPage` | ✅ 100% tokens |
| `LandingHeader` | ✅ 100% tokens |
| `HeroSection` | ✅ 100% tokens |
| `FeaturesSection` | ✅ 100% tokens |
| `ConversionSection` | ✅ 100% tokens |
| `BuilderSection` | ✅ 100% tokens |
| `IntegrationsSection` | ✅ 100% tokens |
| `StepsSection` | ✅ 100% tokens |
| `TestimonialsSection` | ✅ 100% tokens |
| `CtaSection` | ✅ 100% tokens |
| `LandingFooter` | ✅ 100% tokens |

---

## Auth Design Tokens

> **Status:** ✅ RISE V3 10.0/10

Sistema de tokens para todas as páginas de autenticação (tema escuro premium).

### Tokens Disponíveis

#### Background

| Token | Valor HSL | Uso |
|-------|-----------|-----|
| `--auth-bg` | `240 10% 4%` | Background principal (#0A0A0B) |
| `--auth-bg-elevated` | `0 0% 100%` | Cards com opacity (white/5) |
| `--auth-bg-card` | `0 0% 100%` | Cards com opacity |

#### Text

| Token | Valor HSL | Uso |
|-------|-----------|-----|
| `--auth-text-primary` | `0 0% 100%` | Títulos e texto principal (white) |
| `--auth-text-secondary` | `215 16% 75%` | Texto secundário (slate-300) |
| `--auth-text-muted` | `215 14% 65%` | Texto terciário (slate-400) |
| `--auth-text-subtle` | `215 13% 50%` | Texto mais sutil (slate-500) |

#### Input

| Token | Valor HSL | Uso |
|-------|-----------|-----|
| `--auth-input-bg` | `0 0% 100%` | Background de inputs (white/5) |
| `--auth-input-border` | `0 0% 100%` | Borda de inputs (white/10) |
| `--auth-input-placeholder` | `215 13% 40%` | Placeholder (slate-600) |

#### Accent

| Token | Valor HSL | Uso |
|-------|-----------|-----|
| `--auth-accent` | `217 91% 60%` | Cor principal (blue-500) |
| `--auth-accent-secondary` | `271 81% 56%` | Cor secundária (purple-600) |

#### Border

| Token | Valor HSL | Uso |
|-------|-----------|-----|
| `--auth-border` | `0 0% 100%` | Bordas (usar com opacity) |

### Páginas e Componentes Migrados

| Arquivo | Status |
|---------|--------|
| `Auth.tsx` | ✅ 100% tokens |
| `Cadastro.tsx` | ✅ 100% tokens |
| `RecuperarSenha.tsx` | ✅ 100% tokens |
| `RedefinirSenha.tsx` | ✅ 100% tokens |
| `ProducerRegistrationForm.tsx` | ✅ 100% tokens |
| `BuyerAuth.tsx` | ✅ 100% tokens |
| `BuyerCadastro.tsx` | ✅ 100% tokens |
| `BuyerRecuperarSenha.tsx` | ✅ 100% tokens |
| `ResetPasswordLayout.tsx` | ✅ 100% tokens |
| `ResetPasswordForm.tsx` | ✅ 100% tokens |
| `ResetPasswordSuccess.tsx` | ✅ 100% tokens |
| `ResetPasswordInvalid.tsx` | ✅ 100% tokens |
| `ResetPasswordValidating.tsx` | ✅ 100% tokens |
| `BusyProvider.tsx` | ✅ 100% tokens |

### Uso Correto

```tsx
// ✅ CORRETO - Usar tokens
className="bg-[hsl(var(--auth-bg))]"
className="text-[hsl(var(--auth-text-primary))]"
className="border-[hsl(var(--auth-border)/0.1)]"
className="bg-[hsl(var(--auth-input-bg)/0.05)]"

// ❌ PROIBIDO - Cores hardcoded
className="bg-[#0A0A0B]"
className="text-white"
className="text-slate-400"
```

---

## Payment Design Tokens

> **Status:** ✅ RISE V3 10.0/10

Sistema de tokens para páginas de pagamento PIX e cartão.

### Tokens Disponíveis

#### Background

| Token | Valor HSL | Uso |
|-------|-----------|-----|
| `--payment-bg` | `222 47% 11%` | Background principal (gray-900) |
| `--payment-card-bg` | `0 0% 100%` | Cards (white) |
| `--payment-card-elevated` | `210 40% 96%` | Cards elevados (gray-50) |

#### Text

| Token | Valor HSL | Uso |
|-------|-----------|-----|
| `--payment-text-primary` | `0 0% 100%` | Texto em fundo escuro (white) |
| `--payment-text-dark` | `224 71% 4%` | Texto em fundo claro (gray-900) |
| `--payment-text-secondary` | `220 9% 46%` | Texto secundário (gray-600) |
| `--payment-text-muted` | `220 9% 46%` | Texto muted (gray-700) |

#### Border

| Token | Valor HSL | Uso |
|-------|-----------|-----|
| `--payment-border` | `220 13% 91%` | Bordas (gray-200) |
| `--payment-border-dark` | `220 13% 80%` | Bordas mais escuras (gray-300) |

#### Status

| Token | Valor HSL | Uso |
|-------|-----------|-----|
| `--payment-success` | `142 76% 36%` | Sucesso (green-600) |
| `--payment-success-light` | `142 77% 73%` | Sucesso light (green-300) |

### Páginas e Componentes Migrados

| Arquivo | Status |
|---------|--------|
| `PixPaymentPage.tsx` | ✅ 100% tokens |
| `PixLoadingState.tsx` | ✅ 100% tokens |
| `PixErrorState.tsx` | ✅ 100% tokens |
| `PixWaitingState.tsx` | ✅ 100% tokens |
| `PixPaidState.tsx` | ✅ 100% tokens |
| `PixExpiredState.tsx` | ✅ 100% tokens |
| `PixProgressBar.tsx` | ✅ 100% tokens |
| `PixCopyButton.tsx` | ✅ 100% tokens |
| `PixInstructions.tsx` | ✅ 100% tokens |
| `PixQrCodeDisplay.tsx` | ✅ 100% tokens |
| `PixVerifyButton.tsx` | ✅ 100% tokens |
| `MercadoPagoPaymentPage.tsx` | ✅ 100% tokens |
| `PaymentSuccessPage.tsx` | ✅ 100% tokens |

---

## Success Pages Design Tokens

> **Status:** ✅ RISE V3 10.0/10

Sistema de tokens para páginas de sucesso e confirmação.

### Tokens Disponíveis

| Token | Valor HSL | Uso |
|-------|-----------|-----|
| `--success-bg` | `0 0% 4%` | Background (#0A0A0A) |
| `--success-card-bg` | `0 0% 7%` | Card background (#111111) |
| `--success-card-elevated` | `0 0% 4%` | Card elevado (#0A0A0A) |
| `--success-border` | `0 0% 12%` | Bordas (#1E1E1E) |
| `--success-border-hover` | `0 0% 16%` | Bordas hover (#2A2A2A) |
| `--success-text-primary` | `0 0% 100%` | Texto principal (white) |
| `--success-text-secondary` | `0 0% 53%` | Texto secundário (#888888) |
| `--success-text-muted` | `0 0% 40%` | Texto muted (#666666) |
| `--success-text-code` | `0 0% 80%` | Código (#CCCCCC) |
| `--success-green` | `142 71% 45%` | Verde sucesso |
| `--success-green-muted` | `142 71% 45%` | Verde muted (com opacity) |

### OAuth Success Tokens

| Token | Valor HSL | Uso |
|-------|-----------|-----|
| `--oauth-green` | `148 100% 50%` | Verde vibrante (#00FF41) |
| `--oauth-card-bg` | `0 0% 10%` | Card background (#1A1A1A) |
| `--oauth-card-border` | `0 0% 16%` | Card border (#2A2A2A) |
| `--oauth-text-secondary` | `0 0% 63%` | Texto secundário (#A0A0A0) |

### Páginas Migradas

| Arquivo | Status |
|---------|--------|
| `PaymentSuccessPage.tsx` | ✅ 100% tokens |
| `OAuthSuccess.tsx` | ✅ 100% tokens |

---

## Componentes Globais Migrados

> **Status:** ✅ RISE V3 10.0/10

Componentes de uso geral que usam tokens semânticos base (`--foreground`, `--background`, etc.):

| Arquivo | Status |
|---------|--------|
| `NotFound.tsx` | ✅ 100% tokens |
| `CountryCodeSelector.tsx` | ✅ 100% tokens |
| `GatewayCardForm.tsx` | ✅ 100% tokens |
| `CheckoutPublicLoader.tsx` | ✅ 100% tokens |
| `CheckoutFooter.tsx` | ✅ Copyright 2026 |

---

## Resumo de Migração

### Estatísticas Finais

| Categoria | Arquivos | Status |
|-----------|----------|--------|
| Landing Page | 12 | ✅ 100% |
| Auth Pages | 14 | ✅ 100% |
| Payment Pages | 13 | ✅ 100% |
| Success Pages | 2 | ✅ 100% |
| Componentes Globais | 5 | ✅ 100% |
| **TOTAL** | **46** | **✅ 100%** |

### Cores Hardcoded Eliminadas

| Padrão | Antes | Depois |
|--------|-------|--------|
| `text-slate-*` | 78 matches | 0 matches |
| `text-gray-*` (fora de condicionais) | 50+ matches | 0 matches |
| `bg-[#...]` | 100+ matches | 0 matches |
| Copyright 2025 | 3 matches | 0 matches |

---

## Changelog

| Versão | Data | Alterações |
|--------|------|------------|
| 2.0.0 | 2026-01-24 | Migração completa - 46 arquivos, documentação expandida |
| 1.2.0 | 2026-01-24 | Auth & Payment Design Tokens - 30+ páginas migradas |
| 1.1.0 | 2026-01-24 | Landing Page Design Tokens |
| 1.0.0 | 2026-01-24 | Versão inicial - LoadingSwitch documentado |
