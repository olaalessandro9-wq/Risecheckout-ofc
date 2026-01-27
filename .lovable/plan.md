
# Plano: Componentes "Em Breve" no Checkout Builder

## Objetivo

Marcar os componentes **Vantagem**, **Selo** e **Depoimento** como "Em Breve" no painel de componentes do Checkout Builder, posicionando-os no final da lista.

---

## Alterações no Arquivo

### Arquivo: `src/components/checkout/CheckoutCustomizationPanel.tsx`

---

### Mudança 1: Adicionar `ComingSoonComponent` após `DraggableComponent` (linha 62)

Inserir novo componente:

```typescript
// Item "Em Breve" (não arrastável, desabilitado visualmente)
const ComingSoonComponent = ({ icon, label }: { icon: React.ReactNode; label: string }) => {
  return (
    <div
      className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed opacity-50 cursor-not-allowed relative"
    >
      {icon}
      <span className="text-sm mt-2 text-muted-foreground">{label}</span>
      <span className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
        Em Breve
      </span>
    </div>
  );
};
```

---

### Mudança 2: Reorganizar grid de componentes (linhas 217-225)

**ANTES:**
```typescript
<div className="grid grid-cols-2 gap-3">
  <DraggableComponent type="text" icon={<TypeIcon size={24} />} label="Texto" />
  <DraggableComponent type="image" icon={<ImageIcon size={24} />} label="Imagem" />
  <DraggableComponent type="advantage" icon={<CheckCircleIcon size={24} />} label="Vantagem" />
  <DraggableComponent type="seal" icon={<AwardIcon size={24} />} label="Selo" />
  <DraggableComponent type="timer" icon={<TimerIcon size={24} />} label="Cronômetro" />
  <DraggableComponent type="testimonial" icon={<QuoteIcon size={24} />} label="Depoimento" />
  <DraggableComponent type="video" icon={<VideoIcon size={24} />} label="Vídeo" />
</div>
```

**DEPOIS:**
```typescript
<div className="grid grid-cols-2 gap-3">
  {/* Componentes Funcionais */}
  <DraggableComponent type="text" icon={<TypeIcon size={24} />} label="Texto" />
  <DraggableComponent type="image" icon={<ImageIcon size={24} />} label="Imagem" />
  <DraggableComponent type="timer" icon={<TimerIcon size={24} />} label="Cronômetro" />
  <DraggableComponent type="video" icon={<VideoIcon size={24} />} label="Vídeo" />
  
  {/* Componentes "Em Breve" (desabilitados, no final) */}
  <ComingSoonComponent icon={<CheckCircleIcon size={24} />} label="Vantagem" />
  <ComingSoonComponent icon={<AwardIcon size={24} />} label="Selo" />
  <ComingSoonComponent icon={<QuoteIcon size={24} />} label="Depoimento" />
</div>
```

---

## Resultado Visual

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Componentes Disponíveis                                                     │
│  Arraste para adicionar ao checkout                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐  ┌─────────────┐                                          │
│   │     T       │  │     🖼️      │                                          │
│   │   Texto     │  │   Imagem    │  ← Funcionais                            │
│   └─────────────┘  └─────────────┘                                          │
│                                                                              │
│   ┌─────────────┐  ┌─────────────┐                                          │
│   │     ⏱️      │  │     🎥      │                                          │
│   │ Cronômetro  │  │   Vídeo     │  ← Funcionais                            │
│   └─────────────┘  └─────────────┘                                          │
│                                                                              │
│   ┌─────────────┐  ┌─────────────┐                                          │
│   │ [Em Breve]  │  │ [Em Breve]  │                                          │
│   │     ✓       │  │     🏆      │  ← Desabilitados (50% opacidade)         │
│   │  Vantagem   │  │    Selo     │                                          │
│   └─────────────┘  └─────────────┘                                          │
│                                                                              │
│   ┌─────────────┐                                                            │
│   │ [Em Breve]  │                                                            │
│   │     💬      │  ← Desabilitado (50% opacidade)                           │
│   │ Depoimento  │                                                            │
│   └─────────────┘                                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Características do `ComingSoonComponent`

| Propriedade | Valor |
|-------------|-------|
| Opacidade | 50% (`opacity-50`) |
| Cursor | `cursor-not-allowed` |
| Badge | "Em Breve" no canto superior direito |
| Texto | `text-muted-foreground` |
| Eventos | Nenhum (não arrastável, não clicável) |

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Consistência visual | Segue padrão de `OwnerGatewayCard` e `SidebarItem` |
| Zero breaking changes | Componentes continuam no registry para uso futuro |
| Mantém arquivos < 300 linhas | Arquivo continua com ~260 linhas |
| Reutilização | Componente pode ser usado para outros itens "Em Breve" |
