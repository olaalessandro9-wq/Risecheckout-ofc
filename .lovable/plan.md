
# Fix: Titulo de Order Bump Sobrepondo no Resumo do Pedido

## Diagnostico: Causa Raiz

No componente `SharedOrderSummary.tsx` (linhas 228-234), a row do order bump usa `flex justify-between items-center` mas o nome do bump (`<p>`) nao possui nenhum controle de overflow:

```tsx
// CODIGO ATUAL (BUG) - Linha 228-235
<div className="flex-1 flex justify-between items-center">
  <p className="text-sm pr-4" style={{ color: design.colors.secondaryText }}>
    {bump.name}    // <-- SEM min-w-0, SEM truncate, SEM line-clamp
  </p>
  <span className="font-medium whitespace-nowrap" style={{ color: design.colors.primaryText }}>
    R$ 10,00
  </span>
</div>
```

**Problemas especificos:**
1. O `<p>` nao tem `min-w-0` -- em flex containers, o texto nao respeita os limites do parent
2. Nao ha `line-clamp` ou `truncate` -- texto infinito expande a row
3. O preco tem `whitespace-nowrap` (correto), mas o nome empurra o preco para fora do container
4. O `flex justify-between items-center` forca tudo em uma unica linha sem overflow control

**Nota:** O `EditorPaymentSection.tsx` ja aplica `line-clamp-1` nos bumps (linhas 264 e 364), mas de forma inconsistente com o componente compartilhado.

## Analise de Solucoes

### Solucao A: Aplicar `truncate` simples (1 linha com ellipsis)

Adicionar `truncate min-w-0` ao `<p>` do nome do bump.

- Manutenibilidade: 7/10 (resolve o overflow, mas corta nomes que caberiam em 2 linhas)
- Zero DT: 8/10
- Arquitetura: 7/10 (inconsistente com o pedido do usuario de "primeiro vai pra linha de baixo")
- Escalabilidade: 8/10
- Seguranca: 10/10
- **NOTA FINAL: 7.6/10**

### Solucao B: Reestruturar layout com `line-clamp-2` e alinhamento vertical

Mudar o layout do bump row para:
- Nome ocupa a largura disponivel (com `min-w-0`)
- `line-clamp-2`: permite ate 2 linhas de texto, com ellipsis na segunda
- Preco alinhado ao topo, fixo a direita, nunca empurrado
- Reestruturar de `flex items-center` para `flex items-start` (preco fica no topo da row)

- Manutenibilidade: 10/10 (semantica clara, consistente com o `EditorPaymentSection`)
- Zero DT: 10/10 (comportamento previsivel para qualquer tamanho de titulo)
- Arquitetura: 10/10 (respeita o pedido: "vai pra linha de baixo, se for muito grande, 3 pontinhos")
- Escalabilidade: 10/10 (funciona para nomes de 1 caractere ate 200+)
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**

### DECISAO: Solucao B (Nota 10.0)

A Solucao A corta nomes que caberiam em 2 linhas desnecessariamente. A Solucao B implementa exatamente o comportamento pedido: texto passa para a segunda linha primeiro, e so trunca com "..." se exceder 2 linhas.

---

## Plano de Execucao

### 1. EDITAR `src/components/checkout/shared/SharedOrderSummary.tsx` - Linhas 228-235

**De** (bug):
```tsx
<div className="flex-1 flex justify-between items-center">
  <p className="text-sm pr-4" style={{ color: design.colors.secondaryText }}>
    {bump.name}
  </p>
  <span className="font-medium whitespace-nowrap" style={{ color: design.colors.primaryText }}>
    R$ {(Number(bump.price) / 100).toFixed(2).replace('.', ',')}
  </span>
</div>
```

**Para** (corrigido):
```tsx
<div className="flex-1 flex justify-between items-start gap-3 min-w-0">
  <p className="text-sm min-w-0 line-clamp-2" style={{ color: design.colors.secondaryText }}>
    {bump.name}
  </p>
  <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: design.colors.primaryText }}>
    R$ {(Number(bump.price) / 100).toFixed(2).replace('.', ',')}
  </span>
</div>
```

**Alteracoes CSS aplicadas:**
- `items-center` para `items-start`: preco alinha ao topo quando o titulo quebra linha
- Adicionado `gap-3`: espaco consistente entre nome e preco (substitui o `pr-4` no `<p>`)
- Adicionado `min-w-0` no container flex E no `<p>`: permite que o texto respeite os limites do container
- Adicionado `line-clamp-2` no `<p>`: permite ate 2 linhas, trunca com "..." na segunda
- Removido `pr-4` do `<p>`: substituido pelo `gap-3` no container (melhor semantica flex)
- Adicionado `flex-shrink-0` no preco: garante que o preco nunca encolhe

### Nenhum outro arquivo precisa de alteracao

O `EditorPaymentSection.tsx` ja possui `line-clamp-1` nos bumps (linhas 264 e 364) e `min-w-0` no container (linhas 262 e 362). A inconsistencia e que la usa `line-clamp-1` e o SSOT nao tinha nenhum. Apos o fix, o SSOT tera `line-clamp-2` (mais generoso, permite wrap antes de truncar), que e o comportamento correto para o checkout publico onde o espaco e maior.

---

## Arvore de Arquivos

```text
src/
  components/
    checkout/
      shared/
        SharedOrderSummary.tsx    -- EDITAR (linhas 228-235: adicionar line-clamp-2 e min-w-0)
```

## Comportamento Esperado Apos Fix

| Cenario | Antes (Bug) | Depois (Fix) |
|---------|-------------|--------------|
| Titulo curto (ex: "Ebook") | OK | OK (1 linha) |
| Titulo medio (ex: "Curso Completo de React") | OK | OK (1 linha, cabe) |
| Titulo longo (ex: 60 chars) | Overflow, preco sai da tela | Quebra para 2a linha, preco alinhado |
| Titulo muito longo (ex: 150+ chars) | Overflow total, layout quebrado | 2 linhas + "..." no final |

## Checkpoint de Qualidade RISE V3

| Pergunta | Resposta |
|----------|----------|
| Esta e a MELHOR solucao possivel? | Sim - line-clamp-2 com min-w-0 e layout items-start |
| Existe alguma solucao com nota maior? | Nao |
| Isso cria divida tecnica? | Zero |
| Precisaremos "melhorar depois"? | Nao |
| O codigo sobrevive 10 anos sem refatoracao? | Sim |
| Estou escolhendo isso por ser mais rapido? | Nao |
