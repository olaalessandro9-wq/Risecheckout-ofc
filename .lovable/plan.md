

# Stencil Arrastavel e Redimensionavel (Estilo Cakto)

## Entendimento do Requisito

Na Cakto, a **imagem fica fixa** e preenche o container. O **stencil azul** (area de recorte) e arrastavel e tem **handles de redimensionamento** (quadradinhos nos cantos e bordas). O usuario arrasta e redimensiona o stencil para selecionar exatamente qual parte da imagem recortar. O aspect ratio e mantido durante o redimensionamento.

## Mudanca Arquitetural

O modelo de interacao muda fundamentalmente:

```text
ANTES (nosso sistema atual):
  - Imagem: centralizada e dimensionada para caber no stencil
  - Stencil: fixo no centro, imutavel
  - Interacao: apenas zoom

DEPOIS (estilo Cakto):
  - Imagem: preenche o container (object-fit: contain), fixa
  - Stencil: arrastavel, redimensionavel via handles, com aspect ratio travado
  - Interacao: arrastar stencil + redimensionar via handles + zoom na imagem
```

## Analise de Solucoes (Secao 4.4)

### Solucao A: Stencil arrastavel/redimensionavel com handles nativos
- Manutenibilidade: 10/10 - Codigo 100% nosso, sem biblioteca, cada linha compreensivel
- Zero DT: 10/10 - MouseEvent e TouchEvent sao APIs estaveis ha 15+ anos
- Arquitetura: 10/10 - Separacao clara: estado do stencil (rect), rendering (CSS), interacao (event handlers), export (canvas math)
- Escalabilidade: 10/10 - Facil adicionar rotacao, flip, filtros no futuro
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**

### Solucao B: Mover a imagem em vez do stencil (drag pan)
- Manutenibilidade: 7/10 - Funciona mas nao replica o UX da Cakto
- Zero DT: 6/10 - Nao atende ao requisito do usuario (handles de resize)
- Arquitetura: 7/10 - Modelo de interacao diferente do requisito
- Escalabilidade: 7/10 - Nao suporta resize do crop area
- Seguranca: 10/10
- **NOTA FINAL: 7.2/10**

### DECISAO: Solucao A (Nota 10.0)
Solucao B nao atende ao requisito. O usuario quer EXATAMENTE o comportamento da Cakto: stencil arrastavel com handles de redimensionamento.

## Detalhes Tecnicos

### Estado do Stencil

O stencil e representado por um retangulo `{ x, y, width, height }` relativo ao container:

```text
stencilRect: {
  x: posicao horizontal do canto superior esquerdo
  y: posicao vertical do canto superior esquerdo
  width: largura do stencil
  height: altura do stencil (calculada automaticamente pelo aspect ratio)
}
```

O stencil e inicializado centralizado sobre a imagem, com tamanho maximo que cabe na imagem mantendo o aspect ratio.

### Layout da Imagem

A imagem agora preenche o container com `object-fit: contain`. Para calcular a posicao real da imagem dentro do container (necessario para constraintar o stencil), computamos o "image rect" -- a area real que a imagem ocupa dentro do container:

```text
imageRect = {
  x: (containerWidth - displayedImageWidth) / 2,
  y: (containerHeight - displayedImageHeight) / 2,
  width: displayedImageWidth,
  height: displayedImageHeight,
}
```

O stencil NUNCA pode sair dos limites do imageRect.

### Handles de Redimensionamento (8 pontos)

```text
  nw ---- n ---- ne
  |                |
  w    stencil     e
  |                |
  sw ---- s ---- se
```

Cada handle e um quadrado de 10x10px posicionado nos cantos e pontos medios das bordas. Ao arrastar um handle:
- O aspect ratio e SEMPRE mantido
- O stencil nao pode sair dos limites da imagem
- Handles opostos ficam fixos (ex: arrastar SE fixa NW)

### Drag do Corpo do Stencil

Ao arrastar o corpo do stencil (nao um handle):
- O stencil move mantendo suas dimensoes
- O stencil nao pode sair dos limites da imagem (clamped)

### Export (cropExport.ts)

O export precisa mapear a posicao do stencil no display para coordenadas na imagem original:

```text
// Escala display -> imagem original
scaleX = naturalWidth / displayedImageWidth
scaleY = naturalHeight / displayedImageHeight

// Posicao do stencil relativa a imagem (nao ao container)
sourceX = (stencilRect.x - imageRect.x) * scaleX
sourceY = (stencilRect.y - imageRect.y) * scaleY
sourceW = stencilRect.width * scaleX
sourceH = stencilRect.height * scaleY

// Desenhar no canvas de output
ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, outputWidth, outputHeight)
```

## Arquivos Afetados

```text
src/components/ui/image-crop-dialog/
  ImageCropDialog.tsx   <-- REESCRITA (stencil arrastavel/redimensionavel)
  ImageCropDialog.css   <-- EDITAR (handles, cursors, stencil interativo)
  cropExport.ts         <-- REESCRITA (export baseado em stencilRect + imageRect)
  types.ts              <-- SEM MUDANCA
  presets.ts            <-- SEM MUDANCA
  index.ts              <-- SEM MUDANCA
```

### ImageCropDialog.tsx (Reescrita)

**Novos estados:**
- `stencilRect: { x, y, width, height }` -- posicao e tamanho do stencil relativo ao container
- `isDragging: boolean` -- flag de drag do corpo do stencil
- `resizeHandle: HandleType | null` -- qual handle esta sendo arrastado (null = nenhum)
- `dragStart: { mouseX, mouseY, rect }` -- posicao inicial do drag/resize

**Novo computado:**
- `imageRect: { x, y, width, height }` -- area real que a imagem ocupa no container (baseado em object-fit: contain)

**Inicializacao do stencil:**
- Quando a imagem carrega (onLoad), calcula imageRect e inicializa stencilRect centralizado na imagem com tamanho maximo que cabe mantendo o aspect ratio

**Event handlers (todos via addEventListener, nao JSX):**
- `mousedown` no stencil body: inicia drag
- `mousedown` em handle: inicia resize com handle especifico
- `mousemove` no document: processa drag ou resize
- `mouseup` no document: finaliza interacao
- Touch equivalentes para mobile

**CSS da imagem:**
- A imagem usa `object-fit: contain` e preenche o container inteiro (`width: 100%; height: 100%`)
- Removido o calculo de `imageDisplaySize` -- a imagem agora e gerenciada por CSS
- O zoom multiplica as dimensoes da imagem (a imagem cresce/encolhe dentro do container)

**Stencil render:**
- `pointer-events: auto` (nao mais `pointer-events-none`)
- Handles renderizados como 8 `<div>` posicionados nos cantos e bordas
- Cursor muda conforme o handle (nw-resize, n-resize, ne-resize, e-resize, etc.)
- Overlay escurecido FORA do stencil (opcional, estilo Cakto)

### cropExport.ts (Reescrita)

**Novos parametros:**
- `stencilRect: { x, y, width, height }` -- posicao/tamanho do stencil no display
- `imageRect: { x, y, width, height }` -- area real da imagem no display
- `naturalWidth, naturalHeight` -- dimensoes originais da imagem
- `outputWidth, outputHeight` -- dimensoes do PNG final

**Logica:**
1. Calcula a regiao fonte na imagem original (mapeia stencilRect para coordenadas naturais)
2. Cria canvas com outputWidth x outputHeight
3. Desenha apenas a regiao da imagem que esta sob o stencil
4. Retorna File PNG

### ImageCropDialog.css (Editar)

**Adicionar:**
- `.crop-stencil` com `cursor: move` (arrastavel)
- `.crop-handle` -- estilo dos quadradinhos de resize (10x10px, borda azul, fundo branco)
- Cursores especificos para cada handle (nw-resize, n-resize, ne-resize, etc.)
- Overlay escuro fora do stencil (opcional)

## Resumo Visual do Resultado

```text
+------------------------------------------+
|  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  |  <-- Overlay escuro (fora do stencil)
|  xx+--[nw]------[n]------[ne]--+xxxxxxx  |
|  xx|                            |xxxxxxx  |
|  xx[w]     IMAGEM VISIVEL      [e]xxxxx  |  <-- Dentro do stencil = imagem clara
|  xx|                            |xxxxxxx  |
|  xx+--[sw]------[s]------[se]--+xxxxxxx  |
|  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  |  <-- Overlay escuro
+------------------------------------------+
     ↑ Container com checkerboard background
```

- O usuario arrasta o corpo do stencil para mover
- O usuario arrasta os handles [nw], [n], [ne], [e], [se], [s], [sw], [w] para redimensionar
- O aspect ratio e SEMPRE mantido (travado pelo preset)
- O stencil nunca sai dos limites da imagem

## Checkpoint de Qualidade (Secao 7.2)

| Pergunta | Resposta |
|----------|----------|
| Esta e a MELHOR solucao possivel? | Sim -- replica exatamente o UX da Cakto com codigo 100% nosso |
| Existe alguma solucao com nota maior? | Nao |
| Isso cria divida tecnica? | Zero -- APIs nativas do browser, CSS puro, matematica simples |
| Precisaremos "melhorar depois"? | Nao |
| O codigo sobrevive 10 anos sem refatoracao? | Sim -- MouseEvent, TouchEvent, Canvas sao APIs estaveis |
| Estou escolhendo isso por ser mais rapido? | Nao -- e a unica forma de replicar o comportamento da Cakto |

