

# Reescrita Completa do Sistema de Recorte de Imagem + Previews (Estilo Cakto)

## Escopo Completo: 3 Contextos Diferentes

| Contexto | Comportamento | Implementação |
|----------|---------------|---------------|
| **1. Crop Dialog** | Imagem 100% visível + xadrez nas áreas vazias | `FixedCropper` + `ImageRestriction.none` |
| **2. Preview (campo de upload)** | Imagem SEMPRE 100% visível + background sólido | `object-contain` + `bg-neutral-800` |
| **3. Local real (uso final)** | Imagem se adapta, pode cortar se necessário | `object-cover` (mantém como está) |

---

## Problema Identificado

### No Crop Dialog (atual - quebrado)
- Usa `Cropper` genérico com `imageRestriction="fillArea"`
- Força zoom obrigatório mesmo em imagens no tamanho ideal
- Stencil redimensionável e movível (confuso)
- Zero liberdade para o usuário

### Nos Previews (atual - incorreto)
- Usa `object-cover` que **corta** a imagem
- Usuário não consegue ver a imagem completa
- Não sabe exatamente qual imagem está selecionada

---

## Solução Arquitetural (RISE Protocol V3 - Nota 10.0/10)

### Parte 1: Crop Dialog (FixedCropper)

```text
┌─────────────────────────────────────────────────┐
│                 CROP DIALOG                      │
│                                                  │
│   ┌───────────────────────────────────────┐     │
│   │   (xadrez)    │  IMAGEM  │  (xadrez)  │     │
│   │               │ COMPLETA │            │     │
│   │               │  (fit)   │            │     │
│   └───────────────────────────────────────┘     │
│            STENCIL FIXO (não move)              │
│                                                  │
│   [─────────────────●─────────] Zoom 100%       │
│                                                  │
│   [Cancelar]                          [Salvar]  │
└─────────────────────────────────────────────────┘
```

- `FixedCropper` com stencil fixo (não redimensiona, não move)
- `ImageRestriction.none` para liberdade total de zoom/pan
- Zoom range: 10% a 400%
- Áreas vazias: xadrez no editor, cor sólida ao salvar

### Parte 2: Previews (object-contain)

```text
┌──────────────────────────────┐
│      ████████████████        │  ← background sólido (cinza escuro)
│      ██            ██        │
│      ██   IMAGEM   ██        │  ← imagem 100% visível
│      ██  COMPLETA  ██        │     (object-contain)
│      ██            ██        │
│      ████████████████        │
│                              │
│  [✂️ Recortar]  [🗑️ Remover]  │
└──────────────────────────────┘
```

- `object-contain` para mostrar imagem inteira
- Background: `bg-neutral-800` ou pattern xadrez
- Mantém proporção do aspect ratio do container
- Usuário vê exatamente a imagem que selecionou

---

## Arquivos a Modificar/Criar

```text
src/components/ui/image-crop-dialog/
├── ImageCropDialog.tsx          ← REESCREVER (FixedCropper)
├── useStencilSize.ts            ← CRIAR (cálculo responsivo)
├── types.ts                     ← EDITAR (novas props)
├── presets.ts                   ← EDITAR (backgroundColor)
└── index.ts                     ← SEM MUDANÇAS

src/components/products/
└── ImageSelector.tsx            ← EDITAR (object-contain no preview)

src/modules/members-area/components/
├── ImageUploadZoneCompact.tsx   ← EDITAR (object-contain no preview)
└── ModuleCardPreview.tsx        ← EDITAR (object-contain no preview)

src/modules/members-area-builder/components/sections/
├── FixedHeader/
│   └── FixedHeaderImageUpload.tsx  ← EDITAR (object-contain no preview)
└── Banner/
    └── BannerSlideUpload.tsx        ← EDITAR (object-contain no preview)
```

---

## Implementação Técnica Detalhada

### 1. `useStencilSize.ts` (NOVO)

Hook que calcula o tamanho do stencil baseado na boundary:

```typescript
export function useStencilSize(aspectRatio: number) {
  return useCallback((state: CropperState, settings: Settings) => {
    const { boundary } = state;
    // Calcula stencil que cabe na boundary mantendo aspect ratio
    // Usa 90% da boundary como margem de segurança
  }, [aspectRatio]);
}
```

### 2. `ImageCropDialog.tsx` (REESCREVER)

Mudanças principais:
- `Cropper` → `FixedCropper`
- `stencilProps.aspectRatio` → `stencilSize={calculateStencilSize}`
- `imageRestriction={ImageRestriction.none}`
- `stencilProps`: handlers=false, lines=false, movable=false, resizable=false
- Zoom slider: 10% a 400%
- Salvar: `getCanvas({ fillColor: config.backgroundColor })`

### 3. `types.ts` (EDITAR)

```typescript
interface CropConfig {
  aspectRatio: number;
  outputWidth: number;
  outputHeight: number;
  label?: string;
  backgroundColor?: string; // ← NOVO (default: "#1a1a2e")
}

interface ImageCropDialogProps {
  // ... props existentes ...
  allowPresetChange?: boolean;      // ← NOVO
  availablePresets?: CropPresetName[]; // ← NOVO
}
```

### 4. `presets.ts` (EDITAR)

Adicionar `backgroundColor: "#1a1a2e"` a todos os presets.

### 5. Previews (EDITAR - 5 arquivos)

Padrão a aplicar em todos:

```tsx
// ANTES
<img className="w-full h-full object-cover" />

// DEPOIS
<div className="w-full h-full bg-neutral-800 flex items-center justify-center">
  <img className="max-w-full max-h-full object-contain" />
</div>
```

Arquivos:
1. `ImageSelector.tsx` (linha 79-83)
2. `ImageUploadZoneCompact.tsx` (linha 105-109)
3. `ModuleCardPreview.tsx` (linha 53-57)
4. `FixedHeaderImageUpload.tsx` (linhas 225-230)
5. `BannerSlideUpload.tsx` (linhas 225-230)

---

## Fluxo Completo de Uso

### 1. Usuário seleciona imagem
- Clica no campo de upload
- Escolhe imagem do computador

### 2. Crop Dialog abre
- Imagem aparece **COMPLETA** dentro do stencil fixo
- Áreas não cobertas mostram pattern xadrez
- Zoom in: imagem cresce, cobre mais do stencil
- Zoom out: imagem diminui, mais xadrez aparece
- Pan: arrasta para reposicionar

### 3. Usuário clica "Salvar"
- `getCanvas({ fillColor: "#1a1a2e" })` captura área do stencil
- Áreas vazias recebem cor sólida (cinza escuro)
- Arquivo salvo tem dimensões exatas do output

### 4. Preview exibe imagem
- Imagem aparece **COMPLETA** no campo de preview
- Background cinza nas áreas vazias
- Usuário vê exatamente o que salvou

### 5. Local real exibe imagem
- Container tem dimensão fixa (ex: 1080x1080)
- Imagem preenche container (`object-cover`)
- Se proporção diferente, corta para encaixar
- Isso é esperado - usuário teve liberdade no recorte

---

## Validação de Sucesso

### Crop Dialog
1. ✅ Imagem aparece 100% visível ao abrir
2. ✅ Stencil não redimensiona nem move
3. ✅ Zoom 10%-400% funciona suavemente
4. ✅ Pan funciona em todas direções
5. ✅ Xadrez visível nas áreas vazias
6. ✅ Salvamento preenche áreas vazias com cor sólida

### Previews
1. ✅ Imagem 100% visível em todos os previews
2. ✅ Background cinza nas áreas vazias
3. ✅ Proporção mantida (não distorce)
4. ✅ Botões de ação (recortar, remover) funcionam
5. ✅ Usuário consegue identificar qual imagem está

### Local Real
1. ✅ Mantém comportamento atual (`object-cover`)
2. ✅ Imagem se adapta ao container
3. ✅ Corta se necessário para preencher

