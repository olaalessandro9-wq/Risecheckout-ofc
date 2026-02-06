

# Fix: Texto do Cronometro Truncado no Mobile

## Diagnostico: Causa Raiz

No arquivo `src/features/checkout-builder/components/CountdownTimer/CountdownTimer.tsx`, linhas 94-105, o texto do cronometro tem um `maxWidth: '40%'` hard-coded:

```tsx
<span 
  className="text-base lg:text-lg font-medium"
  style={{
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '40%',       // <-- CAUSA RAIZ: Limita arbitrariamente a 40%
    display: 'inline-block',
  }}
>
```

**Problemas:**
1. `maxWidth: '40%'` e um valor arbitrario que ignora o espaco real disponivel
2. `whiteSpace: 'nowrap'` impede qualquer quebra de linha
3. `display: 'inline-block'` dentro de um `flex` container nao e necessario -- o flex ja controla o layout
4. O `overflow: 'hidden'` + `textOverflow: 'ellipsis'` corta o texto antes de ele tentar usar o espaco disponivel

**Como deveria funcionar:** O container e `flex` com 3 filhos:
- Tempo (`flex-shrink-0`) - tamanho fixo
- Icone (`flex-shrink-0`) - tamanho fixo
- Texto - deveria ocupar TODO o espaco restante (`flex-1 min-w-0`)

Usando `flex-1 min-w-0` no texto, ele ocupa automaticamente o espaco que sobra apos o tempo e o icone, sem precisar de um `maxWidth` arbitrario.

## Analise de Solucoes

### Solucao A: Aumentar `maxWidth` de 40% para 60%

Trocar `maxWidth: '40%'` por `maxWidth: '60%'`.

- Manutenibilidade: 4/10 (continua com valor magico arbitrario)
- Zero DT: 3/10 (vai quebrar em algum outro tamanho de tela ou com texto mais longo)
- Arquitetura: 3/10 (nao usa o modelo flex corretamente)
- Escalabilidade: 3/10 (qualquer texto diferente pode estourar)
- Seguranca: 10/10
- **NOTA FINAL: 3.8/10**

### Solucao B: Usar `flex-1 min-w-0` com `truncate` (Flexbox correto)

Remover os estilos inline (`maxWidth`, `display`, `overflow`, `textOverflow`, `whiteSpace`) e substituir por classes Tailwind semanticas: `flex-1 min-w-0 truncate`. O texto ocupa todo o espaco restante apos os elementos fixos (tempo + icone), e so trunca quando realmente nao cabe.

- Manutenibilidade: 10/10 (usa flexbox semantico, sem valores magicos)
- Zero DT: 10/10 (funciona para qualquer tamanho de texto e viewport)
- Arquitetura: 10/10 (uso correto de flex-1 min-w-0, padrao ja usado no projeto)
- Escalabilidade: 10/10 (adicionando mais texto ou mudando fontes, o layout se adapta)
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**

### DECISAO: Solucao B (Nota 10.0)

A Solucao A perpetua o problema com outro valor magico. A Solucao B elimina a causa raiz usando o modelo flexbox corretamente, consistente com o padrao `min-w-0 truncate` ja adotado no projeto (como no fix do OrderBump feito anteriormente).

---

## Plano de Execucao

### EDITAR `src/features/checkout-builder/components/CountdownTimer/CountdownTimer.tsx`

**Linhas 92-106** - Substituir o bloco do texto:

**De** (bug):
```tsx
{/* Texto */}
{(isFinished ? finishedText : activeText) && (
  <span 
    className="text-base lg:text-lg font-medium"
    style={{
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      maxWidth: '40%',
      display: 'inline-block',
    }}
  >
    {isFinished ? finishedText : activeText}
  </span>
)}
```

**Para** (corrigido):
```tsx
{/* Texto */}
{(isFinished ? finishedText : activeText) && (
  <span className="text-base lg:text-lg font-medium flex-1 min-w-0 truncate">
    {isFinished ? finishedText : activeText}
  </span>
)}
```

**Alteracoes aplicadas:**
- Removido `style={{...}}` inline com valores magicos (`maxWidth: '40%'`, `display: 'inline-block'`, etc.)
- Adicionado `flex-1`: o texto ocupa todo o espaco restante apos tempo e icone
- Adicionado `min-w-0`: permite que o texto encolha abaixo do seu tamanho intrinseco (obrigatorio em flex containers)
- Adicionado `truncate`: aplica `overflow: hidden`, `text-overflow: ellipsis` e `white-space: nowrap` via Tailwind -- so trunca quando REALMENTE nao ha espaco

### Nenhum outro arquivo precisa de alteracao

O componente `CountdownTimer` e "burro" (UI pura) e nao depende de nenhum outro arquivo para esta correcao. O `TimerView.tsx`, `CheckoutComponentRenderer.tsx`, e os testes continuam funcionando sem alteracao.

---

## Arvore de Arquivos

```text
src/
  features/
    checkout-builder/
      components/
        CountdownTimer/
          CountdownTimer.tsx    -- EDITAR (linhas 92-106: flex-1 min-w-0 truncate)
```

## Comportamento Esperado Apos Fix

| Cenario | Antes (Bug) | Depois (Fix) |
|---------|-------------|--------------|
| Mobile (375px) - "Oferta por tempo limitado" | Trunca em "Oferta por tempo..." | Exibe completo |
| Mobile (320px) - Texto muito longo | Trunca em limite arbitrario de 40% | Trunca somente quando realmente nao cabe |
| Desktop (1920px) | OK (40% e suficiente) | OK (flex-1 ocupa espaco restante) |
| Texto curto ("Promo!") | OK | OK |
| Texto vazio | OK (nao renderiza) | OK (nao renderiza) |

## Checkpoint de Qualidade RISE V3

| Pergunta | Resposta |
|----------|----------|
| Esta e a MELHOR solucao possivel? | Sim - flex-1 min-w-0 truncate |
| Existe alguma solucao com nota maior? | Nao |
| Isso cria divida tecnica? | Zero |
| Precisaremos "melhorar depois"? | Nao |
| O codigo sobrevive 10 anos sem refatoracao? | Sim |
| Estou escolhendo isso por ser mais rapido? | Nao |

