# Plano de Refatoração: CheckoutPreview

**Data:** 07/12/2024  
**Objetivo:** Reduzir complexidade de 1.174 linhas para ~200 linhas  
**Foco:** Qualidade de código e escalabilidade

---

## 📊 Análise Atual

### Estrutura do CheckoutPreview.tsx (1.174 linhas):

```
CheckoutPreview.tsx (1.174 linhas)
├── DropZone (linha 35) - 13 linhas
├── ComponentRenderer (linha 50) - 59 linhas
├── RowRenderer (linha 109) - 108 linhas
└── CheckoutPreviewComponent (linha 217) - 956 linhas
    ├── Estado (selectedPayment, selectedBumps)
    ├── Cálculos (productPrice, bumpsTotal, totalPrice)
    ├── Estilos (buttonStyles)
    ├── Lógica DnD (drop zones, drag overlay)
    └── Renderização (layout completo)
```

### Problemas Identificados:

1. **Mistura de responsabilidades:**
   - UI pura (layout, estilos)
   - Lógica de editor (drag-and-drop, seleção)
   - Estado local (payment, bumps)
   - Cálculos de preço

2. **Componentes inline:**
   - `DropZone`, `ComponentRenderer`, `RowRenderer` estão no mesmo arquivo
   - Dificulta reutilização e testes

3. **Arquivo muito grande:**
   - 1.174 linhas é difícil de navegar
   - Alto risco de bugs ao fazer mudanças

---

## 🎯 Estratégia de Refatoração

### Nova Estrutura Proposta:

```
components/checkout/
├── CheckoutPreview.tsx (orquestrador - ~100 linhas)
│   └── Decide entre PreviewMode e EditorMode
│
├── preview/
│   ├── CheckoutPreviewLayout.tsx (UI pura - ~300 linhas)
│   │   └── Renderiza o layout do checkout (sem lógica de editor)
│   │
│   ├── PreviewPaymentSection.tsx (~100 linhas)
│   │   └── Formulário mockado de pagamento
│   │
│   └── PreviewOrderSummary.tsx (~80 linhas)
│       └── Resumo do pedido no preview
│
└── builder/
    ├── CheckoutEditorWrapper.tsx (drag-and-drop - ~200 linhas)
    │   └── Lógica de DnD Kit e seleção
    │
    ├── DropZone.tsx (~20 linhas)
    │   └── Componente de drop zone
    │
    ├── ComponentRenderer.tsx (~60 linhas)
    │   └── Renderiza componente com drag
    │
    └── RowRenderer.tsx (~110 linhas)
        └── Renderiza row com colunas
```

**Total:** ~970 linhas (distribuídas em 9 arquivos)  
**CheckoutPreview.tsx:** ~100 linhas (orquestrador)

---

## 📋 Fases da Refatoração

### Fase 1: Extrair Componentes Básicos ✅

**Criar:**
- `src/components/checkout/builder/DropZone.tsx`
- `src/components/checkout/builder/ComponentRenderer.tsx`
- `src/components/checkout/builder/RowRenderer.tsx`

**Benefício:** Componentes reutilizáveis e testáveis

**Tempo:** 30min

---

### Fase 2: Criar CheckoutPreviewLayout (UI Pura) ✅

**Criar:**
- `src/components/checkout/preview/CheckoutPreviewLayout.tsx`

**Responsabilidades:**
- Renderizar layout do checkout
- Aplicar design (cores, fontes)
- Renderizar componentes (produto, formulário, payment, bumps, resumo)
- **SEM** lógica de drag-and-drop
- **SEM** lógica de seleção

**Props:**
```typescript
interface CheckoutPreviewLayoutProps {
  design: ThemePreset;
  productData: any;
  orderBumps: any[];
  viewMode: "desktop" | "mobile";
  selectedPayment: "pix" | "credit_card";
  onPaymentChange: (payment: "pix" | "credit_card") => void;
  selectedBumps: Set<string>;
  onToggleBump: (bumpId: string) => void;
  // Componentes customizados
  topComponents?: CheckoutComponent[];
  rows?: CheckoutRow[];
  bottomComponents?: CheckoutRow[];
}
```

**Benefício:** UI pura, fácil de testar e manter

**Tempo:** 1h

---

### Fase 3: Criar CheckoutEditorWrapper (Drag-and-Drop) ✅

**Criar:**
- `src/components/checkout/builder/CheckoutEditorWrapper.tsx`

**Responsabilidades:**
- Lógica de DnD Kit (sensors, drag overlay)
- Gerenciar seleção de componentes
- Gerenciar seleção de rows
- Renderizar drop zones
- **Envolver** CheckoutPreviewLayout com lógica de editor

**Props:**
```typescript
interface CheckoutEditorWrapperProps {
  customization: CheckoutCustomization;
  viewMode: "desktop" | "mobile";
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  selectedRowId: string | null;
  onSelectRow: (id: string) => void;
  selectedColumn: number;
  onSelectColumn: (index: number) => void;
  productData?: any;
  orderBumps?: any[];
}
```

**Benefício:** Lógica de editor isolada

**Tempo:** 1h

---

### Fase 4: Refatorar CheckoutPreview (Orquestrador) ✅

**Modificar:**
- `src/components/checkout/CheckoutPreview.tsx`

**Nova Estrutura:**
```typescript
export const CheckoutPreview = memo(({
  customization,
  viewMode,
  isPreviewMode = false,
  // ... outras props
}: CheckoutPreviewProps) => {
  // Estado local (selectedPayment, selectedBumps)
  const [selectedPayment, setSelectedPayment] = useState<"pix" | "credit_card">("pix");
  const [selectedBumps, setSelectedBumps] = useState<Set<string>>(new Set());
  
  // Normalizar design
  const design = useMemo(() => 
    normalizeDesign({ design: customization.design }),
    [customization.design]
  );
  
  // Decidir qual modo renderizar
  if (isPreviewMode) {
    // Modo Preview: apenas UI
    return (
      <CheckoutPreviewLayout
        design={design}
        productData={productData}
        orderBumps={orderBumps}
        viewMode={viewMode}
        selectedPayment={selectedPayment}
        onPaymentChange={setSelectedPayment}
        selectedBumps={selectedBumps}
        onToggleBump={toggleBump}
        topComponents={customization.topComponents}
        rows={customization.rows}
        bottomComponents={customization.bottomComponents}
      />
    );
  }
  
  // Modo Editor: UI + drag-and-drop
  return (
    <CheckoutEditorWrapper
      customization={customization}
      viewMode={viewMode}
      selectedComponentId={selectedComponentId}
      onSelectComponent={onSelectComponent}
      selectedRowId={selectedRowId}
      onSelectRow={onSelectRow}
      selectedColumn={selectedColumn}
      onSelectColumn={onSelectColumn}
      productData={productData}
      orderBumps={orderBumps}
    />
  );
});
```

**Benefício:** Orquestrador simples e claro

**Tempo:** 30min

---

### Fase 5: Testes e Validação ✅

**Testar:**
1. Preview mode funciona (sem drag-and-drop)
2. Editor mode funciona (com drag-and-drop)
3. Seleção de componentes funciona
4. Drag-and-drop funciona
5. Layout é idêntico ao anterior

**Tempo:** 30min

---

## 📊 Resumo

| Fase | Tempo | Complexidade |
|------|-------|--------------|
| Fase 1: Extrair Componentes | 30min | Baixa |
| Fase 2: CheckoutPreviewLayout | 1h | Média |
| Fase 3: CheckoutEditorWrapper | 1h | Média |
| Fase 4: Refatorar CheckoutPreview | 30min | Baixa |
| Fase 5: Testes | 30min | Baixa |
| **Total** | **3,5h** | **Média** |

---

## 🎯 Benefícios Esperados

### Antes:
- ❌ 1 arquivo com 1.174 linhas
- ❌ Mistura UI com lógica de editor
- ❌ Difícil de manter
- ❌ Difícil de testar

### Depois:
- ✅ 9 arquivos com ~100 linhas cada
- ✅ UI separada de lógica de editor
- ✅ Fácil de manter
- ✅ Fácil de testar
- ✅ Componentes reutilizáveis
- ✅ Escalável

---

**Desenvolvido por:** Manus AI  
**Cliente:** Alessandro  
**Data:** 07/12/2024  
**Versão:** 1.0
