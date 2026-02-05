

# Diagnostico e Correcao: Crop Dialog com Imagem Invisivel

## Causa Raiz Identificada (Investigacao Profunda)

Ao rastrear o codigo-fonte do `react-advanced-cropper` v0.20.1 (linha por linha), identifiquei que o componente usa um sistema de "fade" para exibir a imagem:

```text
CSS do Cropper Interno:

.advanced-cropper-fade {
  visibility: hidden;    <-- INVISIVEL por padrao
  opacity: 0;            <-- TRANSPARENTE por padrao
}
.advanced-cropper-fade--visible {
  opacity: 1;
  visibility: visible;   <-- So aparece quando 'loaded' = true
}
```

O `CropperWrapper` so adiciona `--visible` quando `state && loaded` e verdadeiro. Se a imagem falha ao carregar internamente, `loaded` nunca se torna `true` e a imagem permanece **invisivel** -- mas o stencil e o checkerboard continuam visiveis porque estao fora do fade.

### Por que a imagem falha ao carregar?

Tres problemas combinados:

**PROBLEMA 1: Layout CSS incompativel**

O container do FixedCropper usa `flex items-center justify-center`:
```text
<div class="flex-1 flex items-center justify-center ...">
  <FixedCropper class="h-full w-full" />
</div>
```

O `.advanced-cropper` interno e `display: flex; flex-direction: column; max-height: 100%`. Seu filho `.advanced-cropper__boundary` usa `flex-grow: 1; min-height: 0`. Em um container `flex` com `items-center`, o boundary pode colapsar para 0 de altura, impedindo o stretcher de calcular as dimensoes corretas.

**PROBLEMA 2: `crossOrigin` desnecessario para blob/object URLs**

O FixedCropper tem `crossOrigin={true}` como default (linha 1309 do bundle). Internamente, `createImage()` adiciona `crossOrigin="anonymous"` no `<img>`. Para URLs de blob (re-crop), isso e inofensivo. Mas para URLs do Supabase Storage (re-crop de imagem existente), se o bucket nao retornar headers CORS adequados, o `createImage` falha silenciosamente e `loaded` nunca se torna true.

**PROBLEMA 3: Zero feedback de erro**

O `ImageCropDialog` nao passa `onError` para o FixedCropper. Se `loadImage` falha internamente, nao ha log, nao ha toast, nao ha nada. O dialog abre com checkerboard visivel mas a imagem simplesmente nao aparece.

---

## Solucao (10.0/10)

### Correcao 1: Remover layout flex incompativel

O container do cropper NAO deve usar `flex items-center justify-center`. O FixedCropper gerencia seu proprio layout internamente. O container deve apenas fornecer dimensoes explicitas.

```text
ANTES (quebrado):
<div class="flex-1 flex items-center justify-center ...">
  <FixedCropper class="h-full w-full" />
</div>

DEPOIS (correto):
<div class="flex-1 relative ...">
  <FixedCropper class="absolute inset-0" />
</div>
```

Usar `position: relative` no container e `position: absolute; inset: 0` no cropper garante que o cropper receba dimensoes explicitas do container, sem depender de flex sizing.

### Correcao 2: Desabilitar crossOrigin para blob URLs

Passar `crossOrigin={false}` no FixedCropper. O componente ImageCropDialog recebe um File (blob), entao a URL sera sempre um object URL (blob:) que e same-origin. crossOrigin e desnecessario e potencialmente prejudicial.

### Correcao 3: Adicionar onError handler

Passar `onError` para o FixedCropper para logar falhas de carregamento. Isso garante que qualquer falha futura seja diagnosticavel.

### Correcao 4: Adicionar altura minima explicita no container

Garantir que o container do cropper tenha `min-h-[400px]` E use posicionamento absoluto para dar dimensoes explicitas ao boundary.

---

## Arquivos a Modificar

```text
src/components/ui/image-crop-dialog/
  ImageCropDialog.tsx     -- EDITAR (layout fix + crossOrigin + onError)
```

Apenas 1 arquivo. A correcao e cirurgica e ataca a raiz.

---

## Mudancas Especificas

### ImageCropDialog.tsx

1. **Container do cropper** (linha 179-200):
   - Remover `flex items-center justify-center`
   - Adicionar `relative`
   - Mudar FixedCropper para `className="absolute inset-0"`

2. **FixedCropper props** (linha 184-198):
   - Adicionar `crossOrigin={false}`
   - Adicionar `onError` callback com log

3. **Feedback visual** (novo):
   - Mostrar estado de loading enquanto a imagem carrega

---

## Validacao de Sucesso

1. Abrir crop dialog ao selecionar nova imagem -- imagem aparece
2. Abrir crop dialog ao clicar "Recortar" em imagem existente -- imagem aparece
3. Zoom/pan funcionam corretamente
4. Salvar produz arquivo com dimensoes corretas
5. Erros de carregamento mostram feedback ao usuario

