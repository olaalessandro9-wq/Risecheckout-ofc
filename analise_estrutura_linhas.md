# Análise da Estrutura Atual de Linhas (Rows)

## 📋 **Estrutura Identificada**

### **1. Tipos e Interfaces**

```typescript
// src/pages/CheckoutCustomizer.tsx

export type LayoutType = "single" | "two-columns" | "two-columns-asymmetric" | "three-columns";

export interface CheckoutRow {
  id: string;
  layout: LayoutType;
  columns: CheckoutComponent[][];
}

export interface CheckoutCustomization {
  design: CheckoutDesign;
  rows: CheckoutRow[];
  topComponents: CheckoutComponent[];
  bottomComponents: CheckoutComponent[];
}
```

### **2. Layouts Disponíveis**

| Layout | Descrição | Colunas |
|:-------|:----------|:--------|
| `single` | 1 Coluna | 1 |
| `two-columns` | 2 Colunas (50/50) | 2 |
| `two-columns-asymmetric` | 2 Colunas (33/66) | 2 |
| `three-columns` | 3 Colunas (33/33/33) | 3 |

### **3. Localização dos Arquivos**

- **Tipos:** `src/pages/CheckoutCustomizer.tsx`
- **UI de Seleção:** `src/components/checkout/CheckoutCustomizationPanel.tsx` (linhas 1124-1195)
- **Renderização:** `src/components/checkout/CheckoutPreview.tsx`

### **4. Estrutura de Diretórios (Atual)**

```
src/
├── features/
│   └── checkout-builder/
│       ├── components/        ✅ (Refatorado na Fase 1)
│       ├── hooks/
│       ├── layouts/           ❌ (Vazio - será usado na Fase 2)
│       ├── managers/
│       └── settings/
```

---

## 🎯 **Plano de Refatoração - Fase 2**

### **Objetivo:**
Refatorar o módulo de linhas com suporte completo a responsividade desktop/mobile.

### **Requisitos:**

1. **Desktop:** Todas as 4 opções de layout disponíveis
2. **Mobile:** Apenas layout `single` (1 coluna)
3. **Builder:** Mostrar/ocultar layouts baseado no `viewMode`
4. **Preview:** Ajustar largura do preview (desktop: ~1100px, mobile: ~375px)
5. **Checkout Público:** Detectar largura da tela e forçar 1 coluna em mobile

---

## 🏗️ **Arquitetura Proposta**

### **1. Configuração de Layouts**

**Arquivo:** `src/features/checkout-builder/layouts/layouts.config.ts`

```typescript
export type LayoutType = "single" | "two-columns" | "two-columns-asymmetric" | "three-columns";

export interface LayoutConfig {
  id: LayoutType;
  label: string;
  columns: number;
  ratio?: number[];
  availableOn: ("desktop" | "mobile")[];
  icon: React.ComponentType;
}

export const LAYOUTS: Record<LayoutType, LayoutConfig> = {
  single: {
    id: "single",
    label: "1 Coluna",
    columns: 1,
    availableOn: ["desktop", "mobile"],
    icon: Columns,
  },
  "two-columns": {
    id: "two-columns",
    label: "2 Colunas",
    columns: 2,
    ratio: [50, 50],
    availableOn: ["desktop"],
    icon: Columns2,
  },
  "two-columns-asymmetric": {
    id: "two-columns-asymmetric",
    label: "2 Colunas (33/66)",
    columns: 2,
    ratio: [33, 66],
    availableOn: ["desktop"],
    icon: LayoutGrid,
  },
  "three-columns": {
    id: "three-columns",
    label: "3 Colunas",
    columns: 3,
    ratio: [33, 33, 33],
    availableOn: ["desktop"],
    icon: Columns3,
  },
};
```

### **2. Componentes de Linha Refatorados**

**Estrutura:**
```
src/features/checkout-builder/layouts/
├── layouts.config.ts          # Configuração de layouts
├── SingleColumnRow.tsx        # Layout de 1 coluna
├── TwoColumnRow.tsx           # Layout de 2 colunas (50/50)
├── TwoColumnAsymmetricRow.tsx # Layout de 2 colunas (33/66)
├── ThreeColumnRow.tsx         # Layout de 3 colunas
└── index.ts                   # Exports
```

### **3. RowManager**

**Arquivo:** `src/features/checkout-builder/managers/RowManager.tsx`

**Responsabilidades:**
- Renderizar todas as linhas (rows)
- Receber prop `viewMode: 'desktop' | 'mobile'`
- Se `viewMode === 'mobile'`, forçar layout `single` para todas as linhas
- Se `viewMode === 'desktop'`, respeitar o layout configurado

### **4. Atualização do CheckoutCustomizationPanel**

**Mudanças:**
- Filtrar layouts disponíveis baseado no `viewMode`
- Se `viewMode === 'mobile'`, mostrar apenas "1 Coluna"
- Se `viewMode === 'desktop'`, mostrar todas as opções

### **5. Botões Desktop/Mobile no Builder**

**Localização:** `src/pages/CheckoutCustomizer.tsx`

**UI:**
```tsx
<div className="flex gap-2">
  <Button
    variant={viewMode === "desktop" ? "default" : "outline"}
    onClick={() => setViewMode("desktop")}
  >
    <Monitor className="h-4 w-4 mr-2" />
    Desktop
  </Button>
  <Button
    variant={viewMode === "mobile" ? "default" : "outline"}
    onClick={() => setViewMode("mobile")}
  >
    <Smartphone className="h-4 w-4 mr-2" />
    Mobile
  </Button>
</div>
```

### **6. Responsividade no Checkout Público**

**Arquivo:** `src/pages/PublicCheckout.tsx`

**Lógica:**
```typescript
const isMobile = window.innerWidth < 768;
const effectiveViewMode = isMobile ? "mobile" : "desktop";
```

---

## 📝 **Checklist de Implementação**

### **Fase 2.1: Configuração Base**
- [ ] Criar `layouts.config.ts` com configuração de layouts
- [ ] Criar tipos e interfaces em `src/features/checkout-builder/layouts/types.ts`
- [ ] Adicionar `viewMode` ao estado do `CheckoutCustomizer`

### **Fase 2.2: Componentes de Layout**
- [ ] Criar `SingleColumnRow.tsx`
- [ ] Criar `TwoColumnRow.tsx`
- [ ] Criar `TwoColumnAsymmetricRow.tsx`
- [ ] Criar `ThreeColumnRow.tsx`
- [ ] Criar `index.ts` com exports

### **Fase 2.3: RowManager**
- [ ] Criar `RowManager.tsx` com suporte a `viewMode`
- [ ] Implementar lógica de forçar `single` em mobile
- [ ] Testar renderização de linhas

### **Fase 2.4: UI do Builder**
- [ ] Adicionar botões Desktop/Mobile no `CheckoutCustomizer`
- [ ] Filtrar layouts no `CheckoutCustomizationPanel` baseado em `viewMode`
- [ ] Ajustar largura do preview baseado em `viewMode`

### **Fase 2.5: Integração e Testes**
- [ ] Atualizar `CheckoutPreview.tsx` para usar `RowManager`
- [ ] Atualizar `PublicCheckout.tsx` para detectar mobile
- [ ] Testar em todos os modos (Builder Desktop, Builder Mobile, Preview Desktop, Preview Mobile, Public Desktop, Public Mobile)
- [ ] Corrigir bugs

---

## 🎨 **Princípios de Vibe Coding Aplicados**

1. **Separação de Responsabilidades:** Cada layout em seu próprio componente
2. **Single Source of Truth:** `layouts.config.ts` é a fonte única de verdade
3. **No Code Duplication:** Lógica de responsividade centralizada no `RowManager`
4. **Clear Component Boundaries:** Componentes de layout isolados e reutilizáveis
5. **Conditional Rendering:** `viewMode` controla o comportamento, não props complexas

---

## ⏱️ **Estimativa de Tempo**

| Fase | Tarefa | Tempo Estimado |
|:-----|:-------|:---------------|
| 2.1 | Configuração Base | 30min |
| 2.2 | Componentes de Layout | 1h |
| 2.3 | RowManager | 45min |
| 2.4 | UI do Builder | 45min |
| 2.5 | Integração e Testes | 1-2h |
| **Total** | | **3h30min - 4h30min** |

---

## 🚀 **Próximos Passos**

1. Criar `layouts.config.ts`
2. Criar componentes de layout
3. Criar `RowManager`
4. Adicionar botões Desktop/Mobile
5. Integrar e testar
