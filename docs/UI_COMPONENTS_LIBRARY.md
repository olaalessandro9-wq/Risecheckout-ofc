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

## Changelog

| Versão | Data | Alterações |
|--------|------|------------|
| 1.0.0 | 2026-01-24 | Versão inicial - LoadingSwitch documentado |
