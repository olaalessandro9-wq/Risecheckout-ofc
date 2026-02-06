

# 2 Melhorias: Zoom + Handles Livres (Estilo Cakto Completo)

## Requisitos Identificados

### Melhoria 1: Zoom via Scroll do Mouse
Atualmente nao existe nenhum handler de `wheel` no componente -- o zoom foi perdido na reescrita. Precisa ser re-adicionado com `addEventListener` nao-passivo.

### Melhoria 2: Handles Livres (Sem Aspect Ratio Travado)
Atualmente o `computeResize` forca o aspect ratio do preset em TODOS os handles. O comportamento correto (estilo Cakto):
- Cada handle move independentemente
- Handle N: so altera a borda de cima
- Handle S: so altera a borda de baixo
- Handle E: so altera a borda direita
- Handle W: so altera a borda esquerda
- Handles de canto (NW, NE, SW, SE): alteram ambas as bordas que tocam
- O stencil pode se estender ALEM da imagem, entrando na area de xadrez (que e fundo transparente)

## Mudancas Tecnicas

### 1. Zoom (ImageCropDialog.tsx)

**Novo estado:**
```text
zoom: number (default 1.0, range 0.1 a 5.0)
```

**Imagem com dimensionamento manual (removido object-fit):**

A imagem deixa de usar `object-fit: contain` e passa a ser dimensionada manualmente para que o zoom funcione:

```text
// Base: caber imagem no container (logica contain)
baseW = computeContainWidth(containerW, containerH, naturalW, naturalH)
baseH = computeContainHeight(...)

// Com zoom:
displayW = baseW * zoom
displayH = baseH * zoom

// Centralizar no container:
imageX = (containerW - displayW) / 2
imageY = (containerH - displayH) / 2

// Renderizar:
<img style={{
  position: absolute,
  left: imageX, top: imageY,
  width: displayW, height: displayH,
}} />
```

**Event listener nao-passivo:**

```text
useEffect(() => {
  if (!containerEl) return;
  const handler = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.1, Math.min(5.0, prev + delta)));
  };
  containerEl.addEventListener("wheel", handler, { passive: false });
  return () => containerEl.removeEventListener("wheel", handler);
}, [containerEl]);
```

**imageRect como computed (depende do zoom):**

O `imageRect` ja e computado por `useMemo`. Ele passara a incluir o fator de zoom:

```text
const imageRect = useMemo(() => {
  if (!containerSize || !naturalSize) return null;
  const base = computeImageRect(containerSize.width, containerSize.height, ...);
  return {
    x: (containerSize.width - base.width * zoom) / 2,
    y: (containerSize.height - base.height * zoom) / 2,
    width: base.width * zoom,
    height: base.height * zoom,
  };
}, [containerSize, naturalSize, zoom]);
```

### 2. Handles Livres (ImageCropDialog.tsx)

**`computeResize` reescrito -- SEM aspect ratio:**

Cada handle movimenta apenas as bordas que ele toca:

```text
// Handle N: so move borda top
// Handle S: so move borda bottom
// Handle E: so move borda right
// Handle W: so move borda left
// Handle NW: move bordas top + left
// Handle NE: move bordas top + right
// Handle SW: move bordas bottom + left
// Handle SE: move bordas bottom + right
```

A logica calcula as 4 bordas (top, right, bottom, left) e aplica o delta apenas nas bordas relevantes ao handle. Nao ha calculo de aspect ratio.

**Tamanho minimo:** Mantido em 30px para evitar stencil invisivel.

### 3. Stencil Alem da Imagem (ImageCropDialog.tsx)

**Bounds = Container (nao Image):**

A funcao `clampRect` passa a usar os bounds do CONTAINER em vez dos bounds da imagem:

```text
// ANTES: clamped ao imageRect
clampRect(rect, imageRect)

// DEPOIS: clamped ao container (0, 0, containerWidth, containerHeight)
clampRect(rect, { x: 0, y: 0, width: containerSize.width, height: containerSize.height })
```

O stencil pode se estender livremente sobre a area de xadrez.

**Inicializacao do stencil:** Continua centralizada sobre a imagem (nao sobre o container), mas sem restricao de ficar dentro da imagem.

### 4. Export com Cobertura Parcial (cropExport.ts)

Quando o stencil se estende alem da imagem, a area fora da imagem e transparente. A logica de export precisa calcular a INTERSECAO entre o stencil e a imagem:

```text
// Intersecao em coordenadas de display:
intersectLeft = max(stencilRect.x, imageRect.x)
intersectTop = max(stencilRect.y, imageRect.y)
intersectRight = min(stencilRect.x + stencilRect.width, imageRect.x + imageRect.width)
intersectBottom = min(stencilRect.y + stencilRect.height, imageRect.y + imageRect.height)

// Se nao ha intersecao: canvas totalmente transparente
if (intersectLeft >= intersectRight || intersectTop >= intersectBottom) return transparent PNG

// Source (coordenadas na imagem original):
scaleX = naturalWidth / imageRect.width
sourceX = (intersectLeft - imageRect.x) * scaleX
sourceW = (intersectRight - intersectLeft) * scaleX

// Destination (coordenadas no canvas de output):
destScaleX = outputWidth / stencilRect.width
destX = (intersectLeft - stencilRect.x) * destScaleX
destW = (intersectRight - intersectLeft) * destScaleX

// Desenhar apenas a parte da imagem que esta sob o stencil
ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH)
```

O canvas comeca transparente (`clearRect`), entao areas fora da intersecao permanecem transparentes automaticamente. Resultado: PNG com transparencia real nas areas de xadrez.

## Arquivos Afetados

```text
src/components/ui/image-crop-dialog/
  ImageCropDialog.tsx   <-- EDITAR (zoom + handles livres + bounds do container)
  cropExport.ts         <-- EDITAR (export com intersecao parcial)
  ImageCropDialog.css   <-- SEM MUDANCA
  types.ts              <-- SEM MUDANCA
  presets.ts            <-- SEM MUDANCA
  index.ts              <-- SEM MUDANCA
```

## Checkpoint de Qualidade (Secao 7.2)

| Pergunta | Resposta |
|----------|----------|
| Esta e a MELHOR solucao possivel? | Sim -- replica o UX da Cakto com codigo 100% nosso |
| Existe alguma solucao com nota maior? | Nao |
| Isso cria divida tecnica? | Zero -- APIs nativas do browser, matematica de intersecao |
| Precisaremos "melhorar depois"? | Nao |
| O codigo sobrevive 10 anos sem refatoracao? | Sim -- WheelEvent, MouseEvent, Canvas 2D sao estaveis |
| Estou escolhendo isso por ser mais rapido? | Nao -- e a unica forma de replicar o Cakto fielmente |

