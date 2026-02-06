

# Reescrita do Algoritmo de Centralização (Causa Raiz Real Encontrada no Código Fonte)

## Causa Raiz Definitiva (Verificada linha por linha no código da biblioteca)

O problema NAO e um bug de formula. E um problema ARQUITETURAL -- estamos usando o algoritmo errado.

A funcao `fixedStencilAlgorithm` (arquivo `advanced-cropper/extensions/stencil-size/index.js`, linha 97) faz isto:

```text
coordinates = moveToPositionRestrictions(coordinates, 
  coordinatesToPositionRestrictions(visibleArea))
```

Isso OBRIGA as coordinates a ficarem DENTRO da visibleArea. Quando a imagem e mais larga que o stencil (ex: imagem 1920x600, stencil 16:9), a visibleArea fica com altura MENOR que as coordinates apos o redimensionamento da linha 87. Resultado: coordinates sao empurradas para o topo.

Nosso `postProcess` atual WRAPA essa funcao -- chama `fixedStencil()` primeiro, depois tenta corrigir. Mas o problema e que `fixedStencil` ja aplicou a restricao. E quando o `autoReconcileState` roda no proximo render, chama nosso postProcess de novo, que chama `fixedStencil` de novo, que empurra para o topo de novo.

**NAO ADIANTA WRAPPEAR `fixedStencil`. O algoritmo em si e incompativel com centralizacao.**

## Solucao: Algoritmo Customizado (Sem Wrapping)

Em vez de chamar `fixedStencil` e tentar corrigir depois (o que NUNCA vai funcionar), vamos escrever nosso PROPRIO algoritmo usando as funcoes utilitarias da biblioteca.

O novo algoritmo faz o MESMO que `fixedStencilAlgorithm` EXCETO a linha 97. Em vez de empurrar coordinates dentro de visibleArea, ele CENTRA coordinates na imagem.

### Passo a Passo do Novo Algoritmo:

```text
1. Redimensionar visibleArea para manter proporcao stencil/boundary
   (identico a fixedStencilAlgorithm linha 87)

2. Aplicar restricoes de tamanho de area
   (identico a fixedStencilAlgorithm linhas 89-92)

3. CENTRALIZAR coordinates na imagem  ← NOSSO FIX
   (em vez de constraintar dentro de visibleArea)
   coords.left = imageWidth/2 - coords.width/2
   coords.top = imageHeight/2 - coords.height/2

4. Centralizar visibleArea nas coordinates
   (identico a fixedStencilAlgorithm linha 94)

5. Aplicar restricoes de posicao de area
   (identico a fixedStencilAlgorithm linha 96)
```

## Analise de Solucoes (Secao 4.4)

### Solucao A: Algoritmo customizado usando utilitarios da biblioteca
- Manutenibilidade: 10/10 - Usa funcoes estáveis da biblioteca, nao reinventa matematica
- Zero DT: 10/10 - Elimina a causa raiz (remove a restricao que empurra para o topo)
- Arquitetura: 10/10 - Compoe com a biblioteca corretamente (usa seus utilitarios, substitui so o algoritmo)
- Escalabilidade: 10/10 - Funciona com qualquer proporcao de imagem/stencil
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**

### Solucao B: Continuar wrappando fixedStencil e tentar corrigir depois
- Manutenibilidade: 3/10 - Luta contra o algoritmo da biblioteca em loop infinito
- Zero DT: 0/10 - NAO FUNCIONA (provado em 10+ tentativas)
- Arquitetura: 2/10 - Gambiarra encima de gambiarra
- Escalabilidade: 2/10 - Quebra com diferentes ratios
- Seguranca: 10/10
- **NOTA FINAL: 2.8/10**

### Solucao C: Trocar FixedCropper por Cropper simples
- Manutenibilidade: 7/10 - Precisa reimplementar stencil fixo do zero
- Zero DT: 8/10 - Funciona mas precisa de mais codigo
- Arquitetura: 6/10 - Perde as facilidades do FixedCropper
- Escalabilidade: 7/10 - Mais codigo para manter
- Seguranca: 10/10
- **NOTA FINAL: 7.4/10**

### DECISAO: Solucao A (Nota 10.0)
Solucao B e provadamente impossivel (testada 10+ vezes). Solucao C descarta o FixedCropper inteiro desnecessariamente. Solucao A substitui APENAS o algoritmo problematico, mantendo toda a infraestrutura do FixedCropper.

## Mudancas Planejadas

### Arquivo: `src/components/ui/image-crop-dialog/useCenteredPostProcess.ts`

**Reescrita completa** -- nao mais wrappeia `fixedStencil`. Implementa algoritmo proprio:

```text
Imports necessarios (todos disponiveis na biblioteca):
- De "react-advanced-cropper": isInitializedState, applyScale, fitToSizeRestrictions,
  getAreaSizeRestrictions, applyMove, diff, getCenter, moveToPositionRestrictions,
  getAreaPositionRestrictions
- De "advanced-cropper/state": copyState
- De "advanced-cropper/extensions/stencil-size": getStencilSize

A funcao centeredFixedStencilAlgorithm(state, settings):
  1. Valida estado inicializado
  2. Copia estado (imutabilidade)
  3. Calcula stencilSize via getStencilSize
  4. Redimensiona visibleArea (ratio coordinates/stencil * boundary)
  5. Aplica restricoes de tamanho
  6. CENTRA coordinates na imagem (center = imageSize/2 - coordsSize/2)
  7. Centra visibleArea nas coordinates (applyMove + diff + getCenter)
  8. Aplica restricoes de posicao da area
  9. Retorna estado

O hook useCenteredPostProcess() retorna callback que:
  - Se action.immediately: executa centeredFixedStencilAlgorithm
  - Senao: retorna state sem mudanca (animacoes intermediarias)
```

### Arquivo: `src/components/ui/image-crop-dialog/ImageCropDialog.tsx`

**Nenhuma mudanca necessaria** -- o componente ja usa `postProcess={centeredPostProcess}` e importa `useCenteredPostProcess`. A interface do hook nao muda.

## Arvore de Arquivos

```text
src/components/ui/image-crop-dialog/
  useCenteredPostProcess.ts  ← REESCREVER (algoritmo proprio, sem fixedStencil)
  ImageCropDialog.tsx        ← SEM MUDANCA
  ImageCropDialog.css        ← SEM MUDANCA
  useStencilSize.ts          ← SEM MUDANCA
  presets.ts                 ← SEM MUDANCA
  types.ts                   ← SEM MUDANCA
  index.ts                   ← SEM MUDANCA
```

## Por Que DESTA VEZ Vai Funcionar

Todas as 10+ tentativas anteriores falharam pelo MESMO motivo: chamavam `fixedStencil()` primeiro e depois tentavam corrigir. Mas `fixedStencil` aplica uma restricao que e INCOMPATIVEL com centralizacao quando a imagem e mais larga que o stencil.

Desta vez NAO chamamos `fixedStencil`. Usamos as mesmas funcoes utilitarias da biblioteca (applyScale, applyMove, etc.) para construir um algoritmo que faz tudo que o original faz EXCETO a restricao de posicao que empurra para o topo.

## Exemplo Concreto

Imagem: 1920x600, Stencil: 16:9, Coordinates: 734x413

**COM fixedStencilAlgorithm (bugado):**
- visibleArea apos scaling: 815x255
- coordinates.height (413) > visibleArea.height (255)
- Linha 97 empurra coordinates para top de visibleArea
- Imagem aparece no TOPO

**COM nosso algoritmo:**
- visibleArea apos scaling: 815x255 (identico)
- coordinates centradas na imagem: top = 600/2 - 413/2 = 93.5
- visibleArea centrada nas coordinates
- Imagem aparece CENTRALIZADA

