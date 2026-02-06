

# Plano: Corrigir Stencil Invisivel, Posicionamento da Imagem e Comportamento de Arraste

## Diagnostico Raiz (Root Cause Analysis)

Investigacao profunda revelou **3 bugs criticos** no codigo atual, todos causados por **props com nomes incorretos** sendo passados ao `RectangleStencil` do `react-advanced-cropper`.

### Bug 1: Stencil completamente invisivel (Causa Raiz)

O codigo atual passa `lineClassName: "crop-stencil-line"` como prop do stencil. Porem, **essa prop NAO EXISTE** no `RectangleStencil`.

Consultando o arquivo `node_modules/react-advanced-cropper/dist/components/stencils/RectangleStencil.d.ts`, as props corretas sao:

```text
lineClassNames?: LineClassNames    (objeto, NAO string)
overlayClassName?: string          (existe e esta sendo usado corretamente)
boundingBoxClassName?: string      (disponivel mas nao utilizado)
previewClassName?: string          (disponivel mas nao utilizado)
```

Onde `LineClassNames` e um objeto:

```text
interface LineClassNames {
  default?: string;
  disabled?: string;
  hover?: string;
  north?: string;
  south?: string;
  east?: string;
  west?: string;
}
```

Resultado: a prop `lineClassName` (string singular) e simplesmente **ignorada silenciosamente** pelo React (prop desconhecida). O CSS `.crop-stencil-line` nunca e aplicado. As linhas mantem o estilo padrao: `border-color: rgba(255,255,255,0.3)` - quase invisivel. Combinado com o overlay transparente (que ESTA funcionando), o stencil fica **100% invisivel**.

### Bug 2: Imagem posicionada no topo

Com `ImageRestriction.none`, o FixedCropper posiciona a imagem livremente. A inicializacao padrao nao garante centralizacao vertical quando a imagem tem proporcao diferente do stencil. O cropper posiciona a imagem no topo-esquerda por padrao.

### Bug 3: "Nao tem a parte do recorte"

Consequencia direta do Bug 1. Sem bordas visiveis no stencil, nao ha indicacao visual de onde esta a area de recorte. O usuario nao consegue identificar o que sera cortado e o que sera descartado.

---

## Analise de Solucoes (RISE V3 Secao 4.4)

### Solucao A: Corrigir props + CSS global override das classes da biblioteca
- Manutenibilidade: 10/10 - Usa API documentada do componente com nomes corretos
- Zero DT: 10/10 - Correcao cirurgica dos nomes de props + CSS preciso
- Arquitetura: 10/10 - Segue a API do componente conforme documentacao oficial
- Escalabilidade: 10/10 - Funciona com qualquer preset/configuracao
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**

### Solucao B: Criar stencil customizado (Custom Stencil Component)
- Manutenibilidade: 7/10 - Componente adicional para manter, acoplado a API interna
- Zero DT: 8/10 - Mais codigo, mais superficie de bugs
- Arquitetura: 7/10 - Over-engineering para o problema (apenas nomes de props errados)
- Escalabilidade: 8/10 - Mais flexivel mas desnecessario
- Seguranca: 10/10
- **NOTA FINAL: 7.8/10**

### DECISAO: Solucao A (Nota 10.0)
A Solucao B e inferior pois cria um componente customizado inteiro para resolver um problema que e simplesmente **nomes de props incorretos**. A API nativa do `RectangleStencil` ja suporta tudo que precisamos.

---

## Mudancas Planejadas (1 arquivo)

### Arquivo: `src/components/ui/image-crop-dialog/ImageCropDialog.tsx`

### Mudanca 1: Corrigir prop `lineClassName` para `lineClassNames`

```text
ANTES (linha 224):
lineClassName: "crop-stencil-line",

DEPOIS:
lineClassNames: { default: "crop-stencil-line" },
```

Isso faz o CSS `.crop-stencil-line` ser aplicado corretamente nas 4 linhas do stencil (north, south, east, west).

### Mudanca 2: Atualizar CSS para estilo Cakto com borda tracejada

O CSS da biblioteca define as linhas como `border-style: solid` com `border-color: rgba(255,255,255,0.3)`. Para replicar o estilo Cakto (borda azul tracejada), o override CSS precisa ser mais completo:

```text
ANTES:
.crop-stencil-line {
  border-color: rgba(59, 130, 246, 0.8) !important;
  border-width: 2px !important;
}

DEPOIS:
.crop-stencil-line {
  border-color: rgba(59, 130, 246, 0.8) !important;
  border-width: 2px !important;
  border-style: dashed !important;
}
```

A borda tracejada (`dashed`) replica o visual da Cakto. `!important` e necessario pois a biblioteca define `border-style: solid` no CSS padrao do `.advanced-cropper-simple-line`.

### Mudanca 3: Adicionar `previewClassName` para borda interna do stencil

A Cakto tem uma borda visivel no contorno do stencil. Alem das linhas (que sao elementos separados posicionados nos 4 lados), podemos usar `previewClassName` para adicionar uma borda ao preview area (a area que mostra a parte da imagem dentro do stencil):

```text
stencilProps={{
  ...
  previewClassName: "crop-stencil-preview",
}}
```

CSS:
```text
.crop-stencil-preview {
  border: 2px dashed rgba(59, 130, 246, 0.8) !important;
}
```

Nota: Usar `previewClassName` ao inves de `lineClassNames` pode ser mais eficaz pois cria UMA borda continua ao redor da area do stencil, ao inves de 4 linhas separadas. Vamos usar ambos para garantir visibilidade maxima.

### Mudanca 4: Corrigir posicionamento da imagem (centralizacao)

Adicionar `defaultTransforms` nao e uma prop do FixedCropper. A abordagem correta para centralizar a imagem e usar o callback `onReady` para ajustar o posicionamento apos o carregamento:

No `handleReady`, apos a imagem carregar, podemos verificar o state e ajustar se necessario. Porem, a centralizacao no FixedCropper normalmente e feita automaticamente pela funcao `stencilSize` - se a imagem tem proporcao diferente do stencil, o cropper faz fit-to-boundary e centra.

O problema real pode ser que `ImageRestriction.none` permite que a imagem fique em qualquer posicao. Mudar para `ImageRestriction.stencil` forca a imagem a cobrir o stencil, centralizando-a. Porem isso impede zoom-out alem do stencil (que a Cakto permite).

A solucao correta e manter `ImageRestriction.none` e verificar se a centralizacao inicial esta funcionando. Se nao, usar o `onReady` para chamar `cropperRef.current.reset()` ou ajustar a visible area.

---

## Secao Tecnica: Detalhes

### API correta do RectangleStencil (confirmado via .d.ts)

```text
Props disponiveis:
- handlers?: Partial<Record<OrdinalDirection, boolean>>
- handlerClassNames?: HandlerClassNames
- lines?: Partial<Record<CardinalDirection, boolean>>
- lineClassNames?: LineClassNames        ← PLURAL, OBJETO
- lineWrapperClassNames?: LineClassNames
- overlayClassName?: string              ← SINGULAR, STRING (ja correto)
- previewClassName?: string
- boundingBoxClassName?: string
- gridClassName?: string
- movable?: boolean
- resizable?: boolean
- grid?: boolean
```

### Porque o stencil ficou 100% invisivel

Dois fatores combinados:
1. `overlayClassName: "crop-overlay-transparent"` → overlay fica transparente (correto, desejado)
2. `lineClassName: "crop-stencil-line"` → prop IGNORADA (nome errado), linhas mantem estilo padrao quase invisivel (`rgba(255,255,255,0.3)`)

Resultado: sem overlay E sem linhas visiveis = stencil completamente invisivel.

### Justificativa do !important (mantida)

O `!important` continua sendo necessario pois estamos sobrescrevendo estilos padrao definidos na stylesheet da biblioteca (`react-advanced-cropper/dist/style.css`). A alternativa seria injetar CSS com especificidade maior, o que seria pior arquiteturalmente.

---

## Validacao de Sucesso

1. Abrir crop dialog com qualquer imagem
2. **Stencil visivel** com borda azul tracejada (identico a Cakto)
3. **Imagem centralizada** no stencil ao abrir
4. **Overlay transparente** - xadrez uniforme fora do stencil
5. Zoom via scroll e slider funcionando
6. Pan (arrastar) funciona quando imagem esta com zoom
7. Salvar produz PNG com transparencia

