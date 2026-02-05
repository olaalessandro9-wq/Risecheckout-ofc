

# Correcao Definitiva: Crop Dialog (Imagem Invisivel + Layout Horizontal)

## Causa Raiz REAL Identificada (Rastreada Linha por Linha no Bundle)

### Bug #1: "Carregando imagem..." Permanente

Rastreando o codigo-fonte do `react-advanced-cropper` v0.20.1 (arquivo `index.esm-bundler.js`), descobri que o callback `onUpdate` **NAO** serve para detectar carregamento de imagem.

```text
Linha 438-442 do bundle:

useUpdateEffect(function () {
    if (cropperRef.current) {
        onUpdate?.(cropperRef.current);
    }
}, [cropperImage.isLoaded(), cropperImage.isLoading()]);
```

O `onUpdate` dispara quando `isLoaded()` ou `isLoading()` mudam. POREM, o `resetCropper` (que inicializa o state com as dimensoes do boundary) e **ASYNC** e roda DEPOIS que `onUpdate` dispara. Resultado: nosso `handleUpdate` chama `cropper.getState()` quando o state ainda e `null`.

A sequencia e:
1. Imagem carrega com sucesso -> `isLoaded()` muda -> `onUpdate` dispara
2. Nosso `handleUpdate` verifica `state` -> e `null` (resetCropper nao rodou ainda)
3. `isImageLoaded` permanece `false` PARA SEMPRE
4. `onUpdate` NUNCA dispara novamente (deps nao mudaram mais)
5. Loading overlay fica visivel eternamente

**A solucao correta**: usar `onReady` (linhas 433-436 do bundle):

```text
useUpdateEffect(function () {
    if (cropperRef.current && currentImage) {
        onReady?.(cropperRef.current);
    }
}, [currentImage]);
```

`onReady` dispara quando `currentImage` e definido, o que acontece DENTRO de `resetCropper` (apos `stretchTo` completar). Neste ponto, o state JA esta inicializado corretamente.

### Bug #2: Zoom slider desincronizado

O mesmo `onUpdate` era usado para sincronizar o slider de zoom com scroll/pinch do usuario. Mas `onUpdate` **NAO** dispara em interacoes de zoom/pan -- apenas quando loading state muda.

A callback correta e `onTransformImageEnd`, que faz parte das `AbstractCropperInstanceCallbacks` e dispara apos cada interacao de zoom/pan do usuario.

### Bug #3: Dialog super horizontal

`sm:max-w-[90vw]` no dialog = 1728px de largura em monitor 1080p. O Cakto usa ~600-700px com area de cropper quase quadrada. O container do cropper usa `flex-1 min-h-[400px]` que cria um retangulo super largo e baixo.

---

## Solucao

### Arquivo unico a modificar

```text
src/components/ui/image-crop-dialog/ImageCropDialog.tsx
```

### Mudanca 1: Dialog compacto estilo Cakto

```text
ANTES:  sm:max-w-[90vw] max-h-[90vh]
DEPOIS: sm:max-w-[680px] max-h-[90vh]
```

Largura maxima de 680px cria um dialog compacto similar ao Cakto.

### Mudanca 2: Area de crop quadrada

```text
ANTES:  flex-1 relative rounded-lg overflow-hidden min-h-[400px]
DEPOIS: w-full h-[500px] max-h-[60vh] relative rounded-lg overflow-hidden
```

- `h-[500px]`: altura fixa de 500px (quase quadrado com 640px de largura util)
- `max-h-[60vh]`: cap para telas menores (768px -> 460px)
- Remove `flex-1` que fazia o container expandir excessivamente
- Remove `min-h-[400px]` substituido pela altura fixa

### Mudanca 3: Substituir onUpdate por onReady

```text
ANTES:
  const handleUpdate = useCallback((cropper) => {
    const state = cropper.getState();
    if (state?.visibleArea && state.boundary.width > 0) {
      setZoom(Math.round(visibleAreaScale * 100));
    }
    if (state && !isImageLoaded) {
      setIsImageLoaded(true);
    }
  }, [isImageLoaded]);

DEPOIS:
  const handleReady = useCallback(() => {
    setIsImageLoaded(true);
  }, []);
```

`onReady` dispara no momento correto: apos `resetCropper` completar e o state estar inicializado.

### Mudanca 4: Substituir onUpdate zoom sync por onTransformImageEnd

```text
NOVO:
  const handleTransformEnd = useCallback((cropper) => {
    const state = cropper.getState();
    if (state?.visibleArea && state.boundary.width > 0) {
      const visibleAreaScale = state.boundary.width / state.visibleArea.width;
      setZoom(Math.round(visibleAreaScale * 100));
    }
  }, []);
```

`onTransformImageEnd` dispara apos cada zoom/pan do usuario, garantindo que o slider de zoom fique sincronizado.

### Mudanca 5: Atualizar props do FixedCropper

```text
ANTES:
  <FixedCropper
    onUpdate={handleUpdate}
    onError={handleCropperError}
  />

DEPOIS:
  <FixedCropper
    onReady={handleReady}
    onTransformImageEnd={handleTransformEnd}
    onError={handleCropperError}
  />
```

Remove `onUpdate` completamente. Adiciona os callbacks corretos para cada finalidade.

---

## Validacao de Sucesso

1. Abrir crop dialog -- imagem aparece (loading desaparece apos carregamento)
2. Dialog tem formato compacto, quase quadrado (estilo Cakto)
3. Zoom via scroll/pinch sincroniza com slider
4. Zoom via slider funciona corretamente
5. Salvar produz arquivo com dimensoes corretas do preset
6. onError mostra toast se a imagem falhar ao carregar

