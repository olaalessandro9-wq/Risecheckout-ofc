

# Correcao: Stencil Invisivel + Xadrez Escondido

## Causas Raiz (3 problemas no mesmo arquivo)

### Problema 1: Borda do crop invisivel

No `stencilProps` (linha 207), `lines: false` remove completamente as linhas de borda do stencil. Sem essas linhas, o usuario nao consegue ver onde o recorte acontece.

```text
ANTES (invisivel):
stencilProps={{
  handlers: false,
  lines: false,      <-- REMOVE a borda do crop
  movable: false,
  resizable: false,
}}
```

No Cakto, a area de crop tem bordas tracejadas claras com handles nos cantos. Como usamos FixedCropper (stencil fixo), `handlers` e `resizable` devem permanecer `false` (o usuario move a imagem, nao o stencil). Porem `lines` DEVE ser `true` para mostrar a borda.

### Problema 2: Xadrez escondido pelo fundo preto do cropper

O CSS interno do `react-advanced-cropper` define:
```text
.advanced-cropper {
  background: black;    <-- COBRE o xadrez completamente
}
```

O nosso `CHECKERBOARD_STYLE` esta no div pai, mas o FixedCropper (com `className="absolute inset-0"`) renderiza por cima com fundo preto solido, escondendo o xadrez.

Para o xadrez ser visivel, o fundo do `.advanced-cropper` DEVE ser transparente.

### Problema 3: Overlay invisivel (consequencia do #2)

O CSS interno define o overlay fora do stencil como:
```text
.advanced-cropper-stencil-overlay {
  color: rgba(0, 0, 0, 0.5);    <-- semi-transparente
}
```

Este overlay FUNCIONA corretamente - ele escurece a area fora do crop. Porem, com fundo preto, `rgba(0,0,0,0.5)` sobre preto = preto. Com fundo TRANSPARENTE, `rgba(0,0,0,0.5)` sobre xadrez = xadrez escurecido (exatamente como o Cakto).

---

## Solucao (Cirurgica - 1 arquivo)

### Arquivo: `src/components/ui/image-crop-dialog/ImageCropDialog.tsx`

### Mudanca 1: Habilitar linhas do stencil

```text
ANTES:
stencilProps={{
  handlers: false,
  lines: false,
  movable: false,
  resizable: false,
}}

DEPOIS:
stencilProps={{
  handlers: false,
  lines: true,
  movable: false,
  resizable: false,
}}
```

- `lines: true` mostra a borda do crop (linhas brancas semi-transparentes nos 4 lados)
- `handlers: false` permanece (FixedCropper nao permite redimensionar stencil)
- `movable: false` permanece (o usuario move a imagem, nao o stencil)
- `resizable: false` permanece (tamanho fixo definido por `stencilSize`)

### Mudanca 2: Fundo transparente no cropper

Adicionar override CSS para remover o fundo preto do `.advanced-cropper`, permitindo o xadrez do div pai ser visivel.

Opcao escolhida: adicionar uma classe CSS customizada ao `className` do FixedCropper que sobrescreve `background: black` para `background: transparent`.

```text
ANTES:
className="absolute inset-0"

DEPOIS:
className="absolute inset-0"
style={{ background: 'transparent' }}
```

Nota: `style` tem prioridade sobre classes CSS, entao sobrescreve o `background: black` da classe `.advanced-cropper` sem precisar de `!important`.

Alternativa: usar `className` com uma classe Tailwind `[&.advanced-cropper]:bg-transparent`, porem `style` inline e mais direto e nao depende de especificidade CSS.

### Mudanca 3: Nenhuma - overlay ja funciona

O overlay (`.advanced-cropper-stencil-overlay`) JA esta configurado corretamente com `rgba(0,0,0,0.5)`. Com o fundo transparente, ele automaticamente mostrara o xadrez escurecido fora da area de crop.

---

## Resultado Visual Esperado

```text
+---------------------------+
|  /////// XADREZ ////////  |  <- Xadrez escurecido (overlay 50% preto)
|  ///////  (dimmed) /////  |
|  +---------+----------+   |
|  |         |          |   |  <- Borda do crop (linhas brancas)
|  |    IMAGEM VISIVEL   |  |  <- Area de crop (imagem nitida)
|  |                     |  |
|  +---------------------+  |
|  /////// XADREZ ////////  |  <- Xadrez escurecido (overlay 50% preto)
|  ///////  (dimmed) /////  |
+---------------------------+
     [- zoom slider +] 100%
   [ Cancelar ]    [ Salvar ]
```

Exatamente como o Cakto: xadrez visivel acima/abaixo/lados, borda clara no crop, imagem no centro.

---

## Analise de Solucoes (RISE V3 Secao 4.4)

### Solucao A: Override com `style={{ background: 'transparent' }}` + `lines: true`
- Manutenibilidade: 10/10 (inline style explicito, nao depende de CSS externo)
- Zero DT: 10/10 (correcao cirurgica, 2 linhas)
- Arquitetura: 10/10 (usa API nativa do componente)
- Escalabilidade: 10/10 (funciona com qualquer preset)
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**

### Solucao B: Criar CSS global para `.advanced-cropper` override
- Manutenibilidade: 7/10 (CSS global pode conflitar com outros croppers)
- Zero DT: 8/10 (depende de especificidade CSS)
- Arquitetura: 6/10 (CSS global viola encapsulamento)
- Escalabilidade: 7/10 (pode precisar de scoping)
- Seguranca: 10/10
- **NOTA FINAL: 7.4/10**

### DECISAO: Solucao A (Nota 10.0)
Inline style e direto, explicito, e nao cria dependencias de CSS global.

---

## Validacao de Sucesso

1. Abrir crop dialog - xadrez visivel acima e abaixo da imagem
2. Borda do crop claramente visivel (linhas brancas)
3. Area fora do crop mostra xadrez com escurecimento (overlay)
4. Imagem aparece nitida dentro da area de crop
5. Zoom/pan continuam funcionando
6. Salvar produz arquivo correto
