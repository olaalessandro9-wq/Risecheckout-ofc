# UI Components Library

> **Versão:** 1.0.0  
> **Data:** 24 de Janeiro de 2026  
> **Status:** ✅ RISE V3  
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

#### Características Visuais

- **Spinner integrado:** Aparece ao lado do switch durante loading
- **Animação pulse:** Switch pulsa sutilmente durante loading
- **Label dinâmico:** Muda baseado no estado atual
- **Desabilita interação:** Impede cliques durante loading
- **Cursor contextual:** `cursor-wait` durante loading

#### Estados Visuais

| Estado | Aparência |
|--------|-----------|
| Unchecked | Switch cinza, label "Inativo" |
| Checked | Switch primary color, label "Ativo" |
| Loading (unchecked) | Switch pulsando, spinner, label custom |
| Loading (checked) | Switch pulsando, spinner, label custom |
| Disabled | Opacidade 50%, cursor not-allowed |

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

### Loading States

Padrão para operações assíncronas:

```tsx
// ✅ CORRETO - LoadingSwitch encapsula o padrão
<LoadingSwitch isLoading={isSaving} ... />

// ✅ CORRETO - Botões com loading
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
  Salvar
</Button>
```

### Acessibilidade

- Todos os inputs devem ter `Label` associado
- Botões de ícone devem ter `aria-label`
- Modais devem ter `DialogTitle` e `DialogDescription`

---

## Landing Page Design Tokens

> **Versão:** 1.0.0  
> **Data:** 24 de Janeiro de 2026  
> **Status:** ✅ RISE V3 10.0/10

### Visão Geral

A Landing Page utiliza um sistema de design tokens exclusivo definido em `src/index.css`. Este sistema garante consistência visual, elimina cores hardcoded e resolve conflitos entre tema claro/escuro.

### Arquitetura

| Componente | Responsabilidade |
|------------|------------------|
| `LandingThemeProvider` | Wrapper que aplica classe `.dark` e tokens da landing |
| `index.css` (linhas 222-257) | Definição das variáveis CSS `--landing-*` |

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

#### Border

| Token | Valor HSL | Uso |
|-------|-----------|-----|
| `--landing-border` | `0 0% 100%` | Bordas (usar com opacity) |

### Uso Correto

```tsx
// ✅ CORRETO - Usar tokens
className="bg-[hsl(var(--landing-bg))]"
className="text-[hsl(var(--landing-text-primary))]"
className="border-[hsl(var(--landing-border)/0.1)]"

// ❌ PROIBIDO - Cores hardcoded
className="bg-[#0A0A0B]"
className="text-white"
className="text-slate-400"
```

### LandingThemeProvider

Wrapper obrigatório para todas as páginas que usam o tema da landing:

```tsx
import { LandingThemeProvider } from "@/components/landing";

function LandingPage() {
  return (
    <LandingThemeProvider>
      <HeroSection />
      <FeaturesSection />
      {/* ... */}
    </LandingThemeProvider>
  );
}
```

**Responsabilidades:**
- Aplica classe `.dark` para ativar variáveis do tema escuro
- Define background e text-color base usando tokens
- Garante `overflow-x-hidden` para evitar scroll horizontal
- Define `selection:` styles para texto selecionado

### Componentes Migrados

Todos os 12 componentes da landing page utilizam 100% tokens:

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

## Auth & Payment Design Tokens

> **Versão:** 1.0.0  
> **Data:** 24 de Janeiro de 2026  
> **Status:** ✅ RISE V3 10.0/10

### Tokens Disponíveis

Os tokens `--auth-*` e `--payment-*` foram adicionados ao `src/index.css` para páginas de autenticação e pagamento.

**Auth Tokens:** `--auth-bg`, `--auth-text-primary`, `--auth-text-secondary`, `--auth-accent`, `--auth-purple`, `--auth-border`, `--auth-input-bg`, `--auth-panel-bg`, `--auth-success`, `--auth-error`

**Payment Tokens:** `--payment-bg`, `--payment-card-bg`, `--payment-text-primary`, `--payment-card-text-primary`, `--payment-card-text-secondary`, `--payment-success`, `--payment-error`, `--payment-input-bg`, `--payment-progress-bg`, `--payment-progress-fill`

### Páginas Migradas

| Página | Status |
|--------|--------|
| `Auth.tsx` | ✅ 100% tokens |
| `Cadastro.tsx` | ✅ 100% tokens |
| `RecuperarSenha.tsx` | ✅ 100% tokens |
| `RedefinirSenha.tsx` | ✅ 100% tokens |
| `BuyerAuth.tsx` | ✅ 100% tokens |
| `BuyerCadastro.tsx` | ✅ 100% tokens |
| `BuyerRecuperarSenha.tsx` | ✅ 100% tokens |
| `ResetPasswordLayout.tsx` | ✅ 100% tokens |
| `PixPaymentPage.tsx` | ✅ 100% tokens |
| `PaymentSuccessPage.tsx` | ✅ 100% tokens |
| `OAuthSuccess.tsx` | ✅ 100% tokens |

---

## Changelog

| Versão | Data | Alterações |
|--------|------|------------|
| 1.2.0 | 2026-01-24 | Auth & Payment Design Tokens - 30+ páginas migradas |
| 1.1.0 | 2026-01-24 | Landing Page Design Tokens |
| 1.0.0 | 2026-01-24 | Versão inicial - LoadingSwitch documentado |
