
# Plano: Corrigir Centralizacao, Remover Zoom Slider, Fixar Imagem

## Root Cause Analysis (Investigacao Profunda)

### Porque `moveImage()` no `onReady` NAO funciona

Tracei o codigo-fonte completo da biblioteca (`AbstractCropperInstance.js`, linhas 225-234):

```text
moveImage(left, top)
  -> transformImage({move: {left, top}}, {immediately: true})
    -> transformImageAlgorithm(state, settings, transform)
    -> applyPostProcess({immediately: true}, result)
      -> fixedStencilAlgorithm(state, settings)  // RECALCULA TUDO!
```

O `moveImage()` usa `immediately: true` por default. Isso faz o `fixedStencilAlgorithm` rodar como postProcess, que **RECALCULA e REPOSICIONA** a visibleArea inteira, desfazendo a correcao de centralizacao.

O `fixedStencilAlgorithm` (linhas 82-101 de `stencil-size/index.js`) faz:
1. `applyScale(visibleArea, scaleFactor)` - escala ao redor do centro
2. `applyMove(visibleArea, diff(center(coords), center(visibleArea)))` - centra na coords
3. `moveToPositionRestrictions(...)` - aplica restricoes

O problema esta no passo 1: `applyScale` escala ao redor do centro da visibleArea. Quando a visibleArea tem `top` negativo (para centralizar a imagem), a escala ELIMINA esse offset negativo, resultando em `top ≈ 0`. O passo 2 recalcula o centro e confirma que ja esta centrado (porque ambos os centros coincidem no centro da imagem). Mas visualmente a imagem fica no topo porque a proporcao entre visibleArea e boundary mudou.

### A solucao correta: `setState()` com `postprocess: false`

Confirmado no codigo-fonte (`AbstractCropperInstance.js`, linhas 257-276):

```text
setState(modifier, options) {
  var postprocess = options.postprocess || false;  // DEFAULT: false!
  
  if (postprocess) {
    return applyPostProcess(..., newState);  // Roda fixedStencilAlgorithm
  } else {
    return newState;  // PRESERVA o state como passamos!
  }
}
```

`setState()` com `postprocess: false` (que e o DEFAULT) NAO roda `fixedStencilAlgorithm`. Isso significa que podemos ajustar a `visibleArea` diretamente e a correcao sera preservada.

---

## 3 Problemas a Resolver

| Problema | Causa Raiz | Solucao |
|----------|-----------|---------|
| Imagem no topo | `moveImage()` e desfeito pelo postProcess | Usar `setState()` sem postProcess |
| Imagem se move ao arrastar | `moveImage={true}` e o default no `CropperBackgroundWrapper` | Passar `backgroundWrapperProps={{ moveImage: false }}` |
| Barra de zoom indesejada | UI explicita no componente | Remover o Slider e os icones ZoomIn/ZoomOut |

---

## Analise de Solucoes (RISE V3 Secao 4.4)

### Solucao A: setState sem postProcess + backgroundWrapperProps + remover slider UI
- Manutenibilidade: 10/10 - Usa API documentada da biblioteca corretamente
- Zero DT: 10/10 - Corrige a causa raiz, nao o sintoma
- Arquitetura: 10/10 - Zero hacks, zero workarounds, cada prop faz exatamente o que deve
- Escalabilidade: 10/10 - Funciona com qualquer preset/imagem
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**

### Solucao B: Delay/setTimeout antes de moveImage para esperar animacao do dialog
- Manutenibilidade: 6/10 - Timing fragil, depende de duracao de animacao
- Zero DT: 4/10 - Race condition potencial
- Arquitetura: 3/10 - Hack temporal
- Escalabilidade: 5/10 - Quebra em dispositivos lentos
- Seguranca: 10/10
- **NOTA FINAL: 5.0/10**

### DECISAO: Solucao A (Nota 10.0)
Solucao B e um hack temporal que viola a Secao 5.1 (Zero Remendos). A Solucao A usa a API correta da biblioteca conforme documentacao no codigo-fonte.

---

## Mudancas Planejadas

### Arquivo: `src/components/ui/image-crop-dialog/ImageCropDialog.tsx`

**Mudanca 1: Corrigir `handleReady` - usar `setState` sem postProcess**

```text
ANTES:
  cropper.moveImage(-diffX, -diffY);

DEPOIS:
  cropper.setState((currentState) => {
    if (!currentState) return null;
    return {
      ...currentState,
      visibleArea: {
        ...currentState.visibleArea,
        left: currentState.visibleArea.left + diffX,
        top: currentState.visibleArea.top + diffY,
      },
    };
  }, { transitions: false });
```

`setState` sem `postprocess: true` (default e `false`) NAO executa `fixedStencilAlgorithm`, preservando a centralizacao.

**Mudanca 2: Desabilitar arraste da imagem**

Adicionar prop `backgroundWrapperProps` ao FixedCropper para desabilitar o drag:

```text
ANTES:
<FixedCropper
  ...
/>

DEPOIS:
<FixedCropper
  ...
  backgroundWrapperProps={{ moveImage: false }}
/>
```

Confirmado no codigo-fonte (`CropperBackgroundWrapper`, linha 1300):
- `moveImage` e passado ao `TransformableImage` como `mouseMove` e `touchMove`
- Com `moveImage: false`, ambos ficam `false`, desabilitando drag completamente
- `scaleImage` (zoom via scroll) continua `true` por default

**Mudanca 3: Remover barra de zoom (slider + icones)**

Remover completamente:
- O `<Slider>` de zoom
- Os icones `<ZoomOut>` e `<ZoomIn>`
- O texto de porcentagem `{zoom}%`
- O state `zoom` e o handler `handleZoomChange`
- O callback `handleTransformEnd` (so servia para sincronizar o slider)
- Os imports de `Slider`, `ZoomIn`, `ZoomOut`

O zoom continua funcionando via scroll do mouse (comportamento nativo do FixedCropper via `scaleImage={true}` que e o default).

**Mudanca 4: Limpar imports nao utilizados**

Remover:
- `Slider` de `@/components/ui/slider`
- `ZoomIn`, `ZoomOut` de `lucide-react`
- State `zoom` e `setZoom`

---

## Arvore de Arquivos

```text
src/components/ui/image-crop-dialog/
  ImageCropDialog.tsx      <- EDITAR (3 mudancas cirurgicas)
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
| Esta e a MELHOR solucao possivel? | Sim, usa API correta da biblioteca |
| Existe alguma solucao com nota maior? | Nao |
| Isso cria divida tecnica? | Zero |
| Precisaremos "melhorar depois"? | Nao |
| O codigo sobrevive 10 anos sem refatoracao? | Sim |
| Estou escolhendo isso por ser mais rapido? | Nao, e por ser CORRETO |

## Validacao de Sucesso

1. Abrir crop dialog com banner 16:9 - imagem CENTRALIZADA (igual Cakto)
2. Tentar arrastar imagem - NAO se move (fixa)
3. Barra de zoom - NAO existe (removida)
4. Zoom via scroll do mouse - FUNCIONA
5. Salvar - produz PNG correto
6. Limite 300 linhas - respeitado (arquivo ficara ~230 linhas, menos que atual)
