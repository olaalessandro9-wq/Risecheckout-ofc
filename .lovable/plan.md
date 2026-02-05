
# Auditoria Completa: Sistema de Recorte de Imagem (Estilo Cakto)

## Resultado da Auditoria

### Verificacao dos Arquivos Principais (Crop Dialog)

| Arquivo | Linhas | Status | Observacao |
|---------|--------|--------|------------|
| `ImageCropDialog.tsx` | 236 | OK | FixedCropper + ImageRestriction.none correto |
| `useStencilSize.ts` | 60 | OK | Hook puro, memoizado, SRP perfeito |
| `types.ts` | 75 | PROBLEMA | Props `allowPresetChange`/`availablePresets` declaradas mas nao consumidas |
| `presets.ts` | 131 | OK | Todos presets com backgroundColor, getCropConfig correto |
| `index.ts` | 21 | PROBLEMA | Exporta `useStencilSize` que e interno do modulo (nao e consumido externamente) |

### Verificacao dos Previews (object-contain)

| Arquivo | Linhas | Status | Observacao |
|---------|--------|--------|------------|
| `ImageSelector.tsx` | 219 | OK | object-contain + bg-neutral-800 correto |
| `ImageUploadZoneCompact.tsx` | 187 | OK | object-contain + bg-neutral-800 correto |
| `ModuleCardPreview.tsx` | 84 | OK | object-contain + bg-neutral-800 correto |
| `FixedHeaderImageUpload.tsx` | 312 | PROBLEMA | Excede limite de 300 linhas (312) |
| `BannerSlideUpload.tsx` | 312 | PROBLEMA | Excede limite de 300 linhas (312) |
| `EditMemberModuleDialog.tsx` | 385 | PROBLEMA | Preview ainda usa `object-cover` (linha 276) + excede 300 linhas |

### Verificacao de Codigo Morto/Legado

| Item | Status | Observacao |
|------|--------|------------|
| Import de `Cropper` generico | OK | Zero referencias. Apenas `FixedCropper` |
| Import de `react-cropper`/`cropperjs` | OK | Zero referencias. Migrado 100% |
| Referencia a `fillArea` | OK | Zero referencias. Usa `ImageRestriction.none` |
| object-cover em previews | PROBLEMA | `EditMemberModuleDialog.tsx` linha 276 ainda usa `object-cover` |

---

## Problemas Identificados (5 itens)

### PROBLEMA 1: Props declaradas mas nao consumidas (Codigo Morto)
**Arquivo:** `types.ts` (linhas 67-74)
**Gravidade:** ALTA (violacao RISE V3 - Zero Codigo Morto)

As props `allowPresetChange` e `availablePresets` foram declaradas na interface `ImageCropDialogProps` mas **nunca sao usadas** no `ImageCropDialog.tsx`. O componente nao faz destructuring delas, nao renderiza nenhum dropdown de preset.

**Solucao:** Remover essas duas props de `types.ts`. Se/quando a funcionalidade de dropdown de presets for necessaria, sera adicionada completa (tipo + implementacao juntos). Declarar props sem implementacao e divida tecnica.

### PROBLEMA 2: Export desnecessario no barrel
**Arquivo:** `index.ts` (linha 20)
**Gravidade:** MEDIA

`useStencilSize` e exportado no barrel, mas e um hook **interno** do modulo. Nenhum consumidor externo o usa. Expor internals viola o principio de encapsulamento.

**Solucao:** Remover `export { useStencilSize }` do `index.ts`. O hook continua disponivel internamente via import direto.

### PROBLEMA 3: EditMemberModuleDialog ainda usa object-cover no preview
**Arquivo:** `EditMemberModuleDialog.tsx` (linha 276)
**Gravidade:** ALTA (inconsistencia com o padrao)

Todos os outros previews foram migrados para `object-contain` + `bg-neutral-800`, mas o preview de imagem dentro do `EditMemberModuleDialog` ainda usa `object-cover`, cortando a imagem no preview.

**Solucao:** Aplicar o mesmo padrao: `bg-neutral-800` + `object-contain` no container de preview do modulo.

### PROBLEMA 4: FixedHeaderImageUpload e BannerSlideUpload excedem 300 linhas
**Arquivo:** Ambos com 312 linhas
**Gravidade:** MEDIA (violacao RISE V3 secao 6.4)

O limite de 300 linhas e uma regra do protocolo. Estes arquivos ja estavam com 310 linhas antes da mudanca; a adicao do div wrapper adicionou 2 linhas.

**Solucao:** Extrair a logica de drag-and-drop para um hook reutilizavel `useImageDragDrop` (compartilhado entre ambos), reduzindo cada arquivo para ~280 linhas. Ambos os arquivos tem logica identica de drag-and-drop que pode ser unificada.

### PROBLEMA 5: EditMemberModuleDialog excede 300 linhas (385 linhas)
**Arquivo:** `EditMemberModuleDialog.tsx`
**Gravidade:** ALTA (violacao RISE V3 secao 6.4 - God Object)

Este arquivo com 385 linhas e um "God Object" que mistura dialog UI, logica de upload, logica de crop, state management e rendering.

**Solucao:** Extrair a secao de upload de imagem para um componente dedicado `ModuleImageUploadSection`, reduzindo o dialog para ~250 linhas.

---

## Plano de Correcao (Ordem de Execucao)

### Etapa 1: Remover codigo morto em types.ts
- Remover props `allowPresetChange` e `availablePresets` de `ImageCropDialogProps`
- Atualizar documentacao do modulo

### Etapa 2: Limpar barrel export
- Remover `export { useStencilSize }` de `index.ts`

### Etapa 3: Corrigir preview do EditMemberModuleDialog
- Mudar `object-cover` para `object-contain` + `bg-neutral-800` na linha 276

### Etapa 4: Extrair hook useImageDragDrop
- Criar `src/modules/members-area-builder/hooks/useImageDragDrop.ts`
- Mover logica compartilhada de drag/drop de `FixedHeaderImageUpload` e `BannerSlideUpload`
- Ambos os arquivos ficam abaixo de 300 linhas

### Etapa 5: Extrair ModuleImageUploadSection de EditMemberModuleDialog
- Criar componente dedicado para a secao de upload/preview de imagem do modulo
- EditMemberModuleDialog cai para ~250 linhas

---

## Arquivos a Modificar/Criar

```text
src/components/ui/image-crop-dialog/
  types.ts                              -- EDITAR (remover props mortas)
  index.ts                              -- EDITAR (remover export interno)

src/modules/members-area-builder/
  hooks/
    useImageDragDrop.ts                 -- CRIAR (hook compartilhado)
  components/
    dialogs/
      EditMemberModuleDialog.tsx        -- EDITAR (object-contain + extrair upload section)
      ModuleImageUploadSection.tsx      -- CRIAR (extraido do dialog)
    sections/
      FixedHeader/
        FixedHeaderImageUpload.tsx      -- EDITAR (usar hook)
      Banner/
        BannerSlideUpload.tsx           -- EDITAR (usar hook)
```

---

## Resultado Apos Correcoes

| Criterio | Status |
|----------|--------|
| Zero codigo morto | OK (props removidas, export limpo) |
| Zero object-cover em previews | OK (todos os 6 consumidores com object-contain) |
| Todos arquivos < 300 linhas | OK |
| Documentacao atualizada | OK |
| RISE Protocol V3 compliant | OK (10.0/10) |
| Manutenibilidade Infinita | OK (hook reutilizavel, componentes SRP) |
