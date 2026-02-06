
# Fix: Stencil Inicial Deve Cobrir Toda a Imagem

## Problema

A funcao `initStencilRect` (linha 114) calcula o stencil inicial maximizando-o dentro da imagem mantendo o aspect ratio do preset. Exemplo concreto:

- Preset module: aspect ratio 2:3 (0.667)
- Imagem do usuario: 720x1280 (aspect ratio 0.5625)
- Como 0.667 > 0.5625, o stencil pega a largura toda mas NAO a altura toda
- Resultado: partes de cima e de baixo ficam fora do stencil

O usuario precisa manualmente arrastar os handles para cobrir a imagem inteira -- trabalho desnecessario.

## Solucao

Como os handles agora sao **livres** (sem trava de aspect ratio), nao ha razao para o stencil inicial respeitar o aspect ratio do preset. O comportamento correto e: **o stencil sempre inicia cobrindo a imagem inteira**. O usuario pode ajustar livremente se quiser recortar apenas uma parte.

Isso e exatamente o que o usuario pediu: "ja poderia vir pegando o recorte em toda a imagem".

## Mudanca

### Arquivo: `src/components/ui/image-crop-dialog/ImageCropDialog.tsx`

**Funcao `initStencilRect` (linhas 114-134):**

```text
// ANTES: calcula stencil com aspect ratio do preset
function initStencilRect(imageRect: Rect, aspectRatio: number): Rect {
  const imgAspect = imageRect.width / imageRect.height;
  let w, h;
  if (aspectRatio > imgAspect) {
    w = imageRect.width;
    h = w / aspectRatio;
  } else {
    h = imageRect.height;
    w = h * aspectRatio;
  }
  return { x: ..., y: ..., width: w, height: h };
}

// DEPOIS: stencil cobre toda a imagem
function initStencilRect(imageRect: Rect): Rect {
  return {
    x: imageRect.x,
    y: imageRect.y,
    width: imageRect.width,
    height: imageRect.height,
  };
}
```

**Chamada da funcao (linha 331):**

```text
// ANTES:
setStencilRect(initStencilRect(imageRect, config.aspectRatio));

// DEPOIS:
setStencilRect(initStencilRect(imageRect));
```

A funcao perde o parametro `aspectRatio` pois nao e mais necessario. O stencil sempre inicia como um clone exato do `imageRect`.

## Arquivos Afetados

```text
src/components/ui/image-crop-dialog/
  ImageCropDialog.tsx   <-- EDITAR (initStencilRect simplificada)
  cropExport.ts         <-- SEM MUDANCA
  ImageCropDialog.css   <-- SEM MUDANCA
  types.ts              <-- SEM MUDANCA
  presets.ts            <-- SEM MUDANCA
  index.ts              <-- SEM MUDANCA
```

## Comportamento Resultante

- Imagem que cabe perfeitamente: stencil cobre tudo, usuario so clica Salvar
- Imagem com formato diferente: stencil cobre tudo, usuario redimensiona/arrasta os handles para selecionar a area desejada
- Em ambos os casos, o default de "cobrir tudo" e o mais util e elimina trabalho manual desnecessario
