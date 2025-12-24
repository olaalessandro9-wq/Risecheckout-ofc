# Plano de Ação: Melhorias de Layout do Checkout

**Data:** 07/12/2024  
**Executor:** Manus AI  
**Baseado em:** ANALISE_LAYOUT_CHECKOUT.md

---

## 🎯 Objetivo

Garantir **consistência total** entre o checkout público, o preview no builder e o editor, eliminando bugs visuais e melhorando a manutenibilidade do código.

---

## 📋 Fases do Plano

### ✅ **Fase 1: Consistência de Design** (Prioridade ALTA)

**Tempo Estimado:** 1-2 horas  
**Complexidade:** Baixa  
**Impacto:** Alto

#### Problemas a Resolver:
1. Preview não usa `normalizeDesign` → cores inconsistentes
2. Grid diferente entre público e preview
3. Breakpoints inconsistentes (`md:` vs `lg:`)

#### Tarefas:

##### 1.1. Aplicar `normalizeDesign` no CheckoutPreview
**Arquivo:** `src/components/checkout/CheckoutPreview.tsx`

**Mudança:**
```typescript
// ANTES
const CheckoutPreviewComponent = ({
  customization,
  ...
}: CheckoutPreviewProps) => {
  // Usa customization.design diretamente
  const design = customization.design;
  
// DEPOIS
import { normalizeDesign } from "@/lib/checkout/normalizeDesign";

const CheckoutPreviewComponent = ({
  customization,
  ...
}: CheckoutPreviewProps) => {
  // Normaliza o design para garantir cores consistentes
  const design = useMemo(() => 
    normalizeDesign({ design: customization.design }),
    [customization.design]
  );
```

**Benefício:** Garante que as cores do preview sejam iguais ao checkout público.

---

##### 1.2. Padronizar Grid entre Público e Preview
**Arquivos:** 
- `src/pages/PublicCheckout.tsx`
- `src/components/checkout/CheckoutPreview.tsx`

**Mudança no PublicCheckout:**
```typescript
// ANTES (grid customizado)
<div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-6 md:gap-8">

// DEPOIS (usa CheckoutLayout com rightColumn)
<CheckoutLayout
  backgroundColor="transparent"
  maxWidth="1100px"
  gridRatio="7/5"
  rightColumn={
    <div className="space-y-6">
      <PaymentSectionV2 />
      <OrderBumpList />
      <OrderSummary />
      <SecurityBadges />
    </div>
  }
>
  {/* Conteúdo da coluna esquerda */}
  <div className="space-y-6">
    <ProductInfo />
    <CheckoutForm />
    {/* Mobile: mostrar payment, bumps e summary aqui */}
  </div>
</CheckoutLayout>
```

**Benefício:** Layout idêntico entre público e preview.

---

##### 1.3. Padronizar Breakpoints
**Mudança Global:**
- Substituir todos os `md:` por `lg:` (1024px)
- Usar o mesmo breakpoint que o CheckoutLayout

**Arquivos Afetados:**
- `src/pages/PublicCheckout.tsx` (5 ocorrências de `md:hidden`)

**Benefício:** Responsividade consistente.

---

#### Critérios de Sucesso:
- [ ] Preview usa `normalizeDesign`
- [ ] Grid idêntico entre público e preview
- [ ] Breakpoints consistentes (`lg:` em todos os lugares)
- [ ] Teste visual: público e preview são idênticos

---

### ⚠️ **Fase 2: Refatoração do CheckoutPreview** (Prioridade MÉDIA)

**Tempo Estimado:** 3-4 horas  
**Complexidade:** Alta  
**Impacto:** Médio (manutenibilidade)

#### Problema a Resolver:
CheckoutPreview tem **1.167 linhas** e mistura lógica de UI com lógica de editor.

#### Tarefas:

##### 2.1. Separar em Componentes Menores

**Nova Estrutura:**
```
CheckoutPreview.tsx (orquestrador - 200 linhas)
  ├── CheckoutPreviewLayout.tsx (UI pura - 300 linhas)
  ├── CheckoutEditorWrapper.tsx (drag-and-drop - 200 linhas)
  ├── ComponentRenderer.tsx (já existe - mover para arquivo separado)
  └── RowRenderer.tsx (já existe - mover para arquivo separado)
```

**Benefício:** Código mais organizado e fácil de manter.

---

##### 2.2. Extrair Lógica de Drag-and-Drop

**Criar:** `src/components/checkout/builder/CheckoutEditorWrapper.tsx`

```typescript
interface CheckoutEditorWrapperProps {
  customization: CheckoutCustomization;
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  // ... outras props de editor
}

export const CheckoutEditorWrapper = ({ ... }) => {
  // Toda a lógica de DnD Kit aqui
  const sensors = useSensors(...);
  
  return (
    <DndContext sensors={sensors} onDragEnd={...}>
      <CheckoutPreviewLayout
        customization={customization}
        isEditorMode={true}
      />
    </DndContext>
  );
};
```

**Benefício:** Separação clara entre UI e lógica de editor.

---

##### 2.3. Criar CheckoutPreviewLayout (UI Pura)

**Criar:** `src/components/checkout/builder/CheckoutPreviewLayout.tsx`

```typescript
interface CheckoutPreviewLayoutProps {
  customization: CheckoutCustomization;
  isEditorMode: boolean;
  onComponentClick?: (id: string) => void;
}

export const CheckoutPreviewLayout = ({ ... }) => {
  // Apenas renderização, sem lógica de drag-and-drop
  const design = normalizeDesign({ design: customization.design });
  
  return (
    <CheckoutLayout
      backgroundColor={design.colors.background}
      maxWidth="1100px"
      gridRatio="7/5"
      rightColumn={<RightColumnContent />}
    >
      {/* Conteúdo */}
    </CheckoutLayout>
  );
};
```

**Benefício:** Componente reutilizável e testável.

---

#### Critérios de Sucesso:
- [ ] CheckoutPreview.tsx reduzido para ~200 linhas
- [ ] Lógica de drag-and-drop isolada
- [ ] UI pura em componente separado
- [ ] Testes unitários para cada componente

---

### 🔧 **Fase 3: Eliminação de `md:hidden`** (Prioridade MÉDIA)

**Tempo Estimado:** 1-2 horas  
**Complexidade:** Baixa  
**Impacto:** Médio (código mais limpo)

#### Problema a Resolver:
PublicCheckout ainda usa `md:hidden` em 5 lugares para duplicar conteúdo mobile.

#### Tarefas:

##### 3.1. Usar CSS Grid Order para Reordenar

**Estratégia:**
- Renderizar cada componente **apenas 1x**
- Usar `order` do CSS Grid para reordenar no mobile

**Exemplo:**
```typescript
// ANTES (duplicado)
<div className="md:hidden">
  <OrderBumpList />
</div>
...
<div className="hidden md:block">
  <OrderBumpList />
</div>

// DEPOIS (único, reordenado)
<div className="order-3 md:order-2">
  <OrderBumpList />
</div>
```

---

##### 3.2. Refatorar PublicCheckout com Order

**Estrutura:**
```typescript
<div className="grid grid-cols-1 gap-6">
  {/* Ordem Mobile: 1-2-3-4-5 */}
  {/* Ordem Desktop: 1-2-4-5-3 */}
  
  <div className="order-1">
    <ProductInfo />
  </div>
  
  <div className="order-2">
    <CheckoutForm />
  </div>
  
  <div className="order-3 md:order-5">
    <PaymentSectionV2 />
  </div>
  
  <div className="order-4 md:order-3">
    <OrderBumpList />
  </div>
  
  <div className="order-5 md:order-4">
    <OrderSummary />
  </div>
</div>
```

**Benefício:** Cada componente renderizado apenas 1x.

---

#### Critérios de Sucesso:
- [ ] Zero usos de `md:hidden` no PublicCheckout
- [ ] Cada componente renderizado apenas 1x
- [ ] Layout responsivo funciona perfeitamente
- [ ] Teste em mobile e desktop

---

### 🎨 **Fase 4: Preview Fiel ao Público** (Prioridade BAIXA)

**Tempo Estimado:** 2-3 horas  
**Complexidade:** Média  
**Impacto:** Alto (UX do builder)

#### Problema a Resolver:
Preview renderiza formulário de cartão mockado, não o Brick real.

#### Tarefas:

##### 4.1. Renderizar Brick Real no Preview

**Criar:** `src/components/checkout/builder/PreviewPaymentBrick.tsx`

```typescript
interface PreviewPaymentBrickProps {
  design: ThemePreset;
  publicKey: string; // Sandbox key
}

export const PreviewPaymentBrick = ({ design, publicKey }) => {
  const [brickLoaded, setBrickLoaded] = useState(false);
  
  useEffect(() => {
    // Carregar SDK do Mercado Pago
    // Inicializar Brick em modo sandbox
    // Aplicar customization do design
  }, [publicKey, design]);
  
  return (
    <div id="preview-payment-brick-container">
      {!brickLoaded && <Skeleton />}
    </div>
  );
};
```

**Benefício:** Preview 100% fiel ao checkout público.

---

##### 4.2. Adicionar Modo Sandbox

**Configuração:**
```typescript
const mp = new window.MercadoPago(publicKey, {
  locale: 'pt-BR',
  sandbox: true, // ← Modo sandbox
});
```

**Benefício:** Não cria transações reais durante o preview.

---

##### 4.3. Sincronizar Customization

**Lógica:**
```typescript
// Quando o usuário muda cores no editor
useEffect(() => {
  if (brickInstance) {
    brickInstance.update({
      customization: {
        visual: {
          style: {
            customVariables: {
              borderRadiusMedium: design.colors.borderRadius,
              // ... outras variáveis
            }
          }
        }
      }
    });
  }
}, [design]);
```

**Benefício:** Preview atualiza em tempo real.

---

#### Critérios de Sucesso:
- [ ] Brick real renderizado no preview
- [ ] Modo sandbox ativo
- [ ] Customization sincronizada
- [ ] Preview idêntico ao público

---

## 📊 Resumo do Plano

| Fase | Prioridade | Tempo | Complexidade | Impacto |
|------|-----------|-------|--------------|---------|
| **Fase 1: Consistência** | 🔴 Alta | 1-2h | Baixa | Alto |
| **Fase 2: Refatoração** | 🟡 Média | 3-4h | Alta | Médio |
| **Fase 3: md:hidden** | 🟡 Média | 1-2h | Baixa | Médio |
| **Fase 4: Preview Fiel** | 🟢 Baixa | 2-3h | Média | Alto |

**Tempo Total:** 7-11 horas

---

## 🚀 Ordem de Execução Recomendada

### Sessão 1 (1-2 horas):
1. ✅ **Fase 1** completa
   - Aplicar normalizeDesign
   - Padronizar grid
   - Padronizar breakpoints

### Sessão 2 (3-4 horas):
2. ✅ **Fase 2** completa
   - Separar CheckoutPreview
   - Extrair lógica de drag-and-drop
   - Criar CheckoutPreviewLayout

### Sessão 3 (1-2 horas):
3. ✅ **Fase 3** completa
   - Eliminar md:hidden
   - Usar CSS Grid order

### Sessão 4 (2-3 horas):
4. ✅ **Fase 4** completa
   - Renderizar Brick real
   - Modo sandbox
   - Sincronizar customization

---

## 📝 Checklist Final

Após completar todas as fases:

- [ ] Público e preview são visualmente idênticos
- [ ] Zero usos de `md:hidden` no PublicCheckout
- [ ] CheckoutPreview reduzido para ~200 linhas
- [ ] Brick real renderizado no preview
- [ ] Testes visuais passando
- [ ] Documentação atualizada

---

## 🎯 Próximo Passo

**Começar pela Fase 1** (Consistência de Design) - é a mais importante e tem o maior impacto com o menor esforço.

Posso começar agora?

---

**Desenvolvido por:** Manus AI  
**Data:** 07/12/2024  
**Versão:** 1.0
