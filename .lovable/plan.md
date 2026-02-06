

# Corrigir Centralizacao da Imagem no Crop Dialog

## Root Cause Analysis (Diagnostico Definitivo)

### O bug: a formula de centralizacao esta ERRADA

O codigo atual calcula:

```text
diffX = coordsCenterX - viewCenterX
diffY = coordsCenterY - viewCenterY
```

Em um FixedCropper, as `coordinates` sao **SEMPRE** centradas na `visibleArea` (o stencil e fixo no centro do viewport). Portanto:

```text
coordsCenterX ≈ viewCenterX  (sempre)
coordsCenterY ≈ viewCenterY  (sempre)
diffX ≈ 0
diffY ≈ 0
```

A correcao de centralizacao **NAO FAZ NADA**. O `setState` e chamado mas com delta ~0, a imagem permanece no topo.

### O que deveria acontecer

O problema real: as `coordinates` (area de crop) estao posicionadas no **TOPO** da imagem (top=0), nao no **CENTRO**. A biblioteca inicializa o crop alinhado ao topo por padrao.

Exemplo concreto com imagem 1920x1200 e stencil 16:9:

```text
Estado atual:
  imageSize = { width: 1920, height: 1200 }
  coordinates = { left: 0, top: 0, width: 1920, height: 1080 }
  -> Crop no topo da imagem, 120px da imagem abaixo do stencil

Estado desejado:
  coordinates = { left: 0, top: 60, width: 1920, height: 1080 }
  -> Crop no CENTRO da imagem, 60px acima e 60px abaixo do stencil
```

### A formula correta

Centralizar as `coordinates` na **IMAGEM** (nao na visibleArea):

```text
imageCenterY = imageSize.height / 2
coordsCenterY = coordinates.top + coordinates.height / 2
deltaY = imageCenterY - coordsCenterY

(mesma logica para X)
```

Para manter o stencil fixo no centro do viewport, devemos deslocar **AMBOS** coordinates e visibleArea pelo mesmo delta:

```text
coordinates.left += deltaX
coordinates.top  += deltaY
visibleArea.left += deltaX
visibleArea.top  += deltaY
```

Confirmado na API: `setState()` com `postprocess: false` (default) preserva o state exatamente como passamos, sem recalculos do `fixedStencilAlgorithm`.

---

## Analise de Solucoes (RISE V3 Secao 4.4)

### Solucao A: Corrigir formula para centrar coordinates na imageSize

- Manutenibilidade: 10/10 - Formula matematica pura e verificavel
- Zero DT: 10/10 - Corrige a causa raiz (formula errada), nao o sintoma
- Arquitetura: 10/10 - Usa `imageSize` do CropperState (dado correto para o calculo correto)
- Escalabilidade: 10/10 - Funciona com qualquer proporcao de imagem e qualquer preset
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**

### Solucao B: Usar `defaultPosition` prop para definir posicao inicial das coordinates

- Manutenibilidade: 8/10 - Depende de prop especifica da biblioteca
- Zero DT: 9/10 - Resolve o sintoma mas nao corrige o onReady existente
- Arquitetura: 7/10 - Requer conhecimento de prop interna que pode mudar entre versoes
- Escalabilidade: 8/10 - Pode conflitar com outros algoritmos de inicializacao
- Seguranca: 10/10
- **NOTA FINAL: 8.2/10**

### DECISAO: Solucao A (Nota 10.0)

A Solucao B e inferior pois depende de uma prop de inicializacao que pode ser sobrescrita pelo `fixedStencilAlgorithm`. A Solucao A corrige diretamente no `onReady`, APOS toda a inicializacao, usando a formula matematica correta.

---

## Mudancas Planejadas

### Arquivo: `src/components/ui/image-crop-dialog/ImageCropDialog.tsx`

**Unica mudanca: Corrigir a formula no `handleReady`** (linhas 110-152)

Antes (formula ERRADA que compara coordinates vs visibleArea):

```text
// Centro das coordinates (crop area)
const coordsCenterX = coordinates.left + coordinates.width / 2;
const coordsCenterY = coordinates.top + coordinates.height / 2;

// Centro da visibleArea (viewport)
const viewCenterX = visibleArea.left + visibleArea.width / 2;
const viewCenterY = visibleArea.top + visibleArea.height / 2;

// Diferenca: quanto a visibleArea precisa mover...
const diffX = coordsCenterX - viewCenterX;
const diffY = coordsCenterY - viewCenterY;
```

Depois (formula CORRETA que centra coordinates na imageSize):

```text
// Centro da IMAGEM (onde queremos que o crop fique)
const imageCenterX = state.imageSize.width / 2;
const imageCenterY = state.imageSize.height / 2;

// Centro atual das COORDINATES (onde o crop esta agora)
const coordsCenterX = coordinates.left + coordinates.width / 2;
const coordsCenterY = coordinates.top + coordinates.height / 2;

// Delta para mover o crop ao centro da imagem
const deltaX = imageCenterX - coordsCenterX;
const deltaY = imageCenterY - coordsCenterY;
```

E no `setState`, deslocar AMBOS coordinates e visibleArea:

```text
cropper.setState((currentState) => {
  if (!currentState?.coordinates || !currentState.visibleArea) return currentState;
  return {
    ...currentState,
    coordinates: {
      ...currentState.coordinates,
      left: currentState.coordinates.left + deltaX,
      top: currentState.coordinates.top + deltaY,
    },
    visibleArea: {
      ...currentState.visibleArea,
      left: currentState.visibleArea.left + deltaX,
      top: currentState.visibleArea.top + deltaY,
    },
  };
}, { transitions: false });
```

**Nenhuma outra mudanca necessaria.** O resto do componente (imagem fixa, sem zoom slider, PNG com transparencia) esta correto e funcionando.

---

## Arvore de Arquivos

```text
src/components/ui/image-crop-dialog/
  ImageCropDialog.tsx      <- EDITAR (corrigir handleReady, ~15 linhas)
  ImageCropDialog.css      <- SEM MUDANCA
  useStencilSize.ts        <- SEM MUDANCA
  presets.ts               <- SEM MUDANCA
  types.ts                 <- SEM MUDANCA
  index.ts                 <- SEM MUDANCA
```

---

## Checkpoint de Qualidade (Secao 7.2)

| Pergunta | Resposta |
|----------|---------|
| Esta e a MELHOR solucao possivel? | Sim, corrige a formula matematica na raiz |
| Existe alguma solucao com nota maior? | Nao |
| Isso cria divida tecnica? | Zero |
| Precisaremos "melhorar depois"? | Nao |
| O codigo sobrevive 10 anos sem refatoracao? | Sim |
| Estou escolhendo isso por ser mais rapido? | Nao, e por ser CORRETO |

## Validacao de Sucesso

1. Abrir crop dialog com banner 16:9 - imagem CENTRALIZADA verticalmente
2. Imagem quadrada em stencil 16:9 - centralizada horizontal e verticalmente
3. Imagem ja na proporcao exata do stencil - sem deslocamento (delta = 0)
4. Imagem fixa (sem arraste) - preservado
5. Zoom via scroll - preservado
6. Salvar PNG - preservado
7. Limite 300 linhas - preservado (~230 linhas)

