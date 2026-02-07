

# Correcao: Mobile Components + Timer Truncation no Checkout Publico

## Diagnostico da Causa Raiz (Root Cause Analysis)

### Problema 1: Componentes mobile NAO aparecem no checkout publico

O arquivo `CheckoutPublicContent.tsx` (linha 334) usa:

```text
const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;
```

Isso esta dentro de um `useMemo` cujas dependencias sao apenas dados do checkout. `window.innerWidth` NAO e uma dependencia reativa do React. O resultado:

- A deteccao mobile e computada UMA VEZ quando os dados do checkout chegam
- NUNCA recomputa quando o viewport muda
- Em cenarios como DevTools responsive mode, o valor fica stale

O projeto ja possui o hook `useIsMobile()` em `src/hooks/use-mobile.tsx` que:
- Usa `window.matchMedia` (API correta do browser)
- Reage a mudancas de viewport via evento `change`
- Retorna um boolean reativo
- Ja e usado em outros pontos do projeto

Mas esse hook NAO esta sendo usado no `CheckoutPublicContent`.

### Problema 2: Texto do cronometro cortado com "..."

O arquivo `CountdownTimer.tsx` (linhas 74-98) tem DOIS problemas que se sobrepoe:

1. **Container** (linha 80): `overflow: 'hidden'` no inline style -- corta TUDO que ultrapassa
2. **Texto** (linha 94): `truncate` class aplica `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` -- IMPEDE quebra de linha

O layout flex `[TEMPO] [ICONE] [TEXTO]` comprime o texto em telas mobile porque tempo e icone sao `flex-shrink-0`. O texto deveria QUEBRAR EM MULTIPLAS LINHAS, nao truncar com "...".

### Problema 3 (Bonus): backgroundImage NUNCA funciona no checkout publico

O `CheckoutPublicContent` coloca `backgroundImage` dentro de `customization.design.backgroundImage`, mas o `CheckoutPublicLayout` le de `customization.backgroundImage` (raiz). Resultado: imagens de fundo NUNCA aparecem no checkout publico.

---

## Analise de Solucoes

### Problema 1: Mobile Detection

#### Solucao A: Usar `useIsMobile()` existente + adicionar como dependencia do useMemo

- Manutenibilidade: 10/10 (reutiliza hook existente, DRY)
- Zero DT: 10/10 (deteccao reativa, correta em todos os cenarios)
- Arquitetura: 10/10 (segue padrao do projeto, Single Responsibility)
- Escalabilidade: 10/10 (hook centralizado, facil de manter)
- Seguranca: 10/10 (sem impacto)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 15 minutos

#### Solucao B: Criar novo listener matchMedia inline no componente

- Manutenibilidade: 7/10 (duplica logica existente no hook)
- Zero DT: 8/10 (viola DRY -- 2 pontos de manutencao para mesma logica)
- Arquitetura: 6/10 (ignora abstracoes existentes)
- Escalabilidade: 7/10 (cada novo componente precisaria do mesmo codigo)
- Seguranca: 10/10
- **NOTA FINAL: 7.4/10**

### DECISAO: Solucao A (Nota 10.0)

A Solucao B e inferior porque duplica logica ja existente, violando DRY e criando dois pontos de manutencao para a mesma funcionalidade.

---

### Problema 2: Timer Truncation

#### Solucao A: Remover `truncate`, permitir wrapping natural do texto

- Substituir `truncate` por `whitespace-normal` (permite quebra de linha)
- Remover `overflow: 'hidden'` do container (permite conteudo fluir)
- O texto ocupa o espaco disponivel e quebra quando necessario
- Manutenibilidade: 10/10
- Zero DT: 10/10
- Arquitetura: 10/10 (respeita o fluxo natural do CSS)
- Escalabilidade: 10/10
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**

#### Solucao B: Reduzir font-size do texto em mobile

- Manutenibilidade: 7/10 (pode precisar de ajustes futuros para textos de tamanhos variados)
- Zero DT: 6/10 (nao resolve a raiz -- com textos longos, truncaria novamente)
- Arquitetura: 5/10 (trata sintoma, nao causa)
- Escalabilidade: 5/10 (cada novo tamanho de texto exigiria novo breakpoint)
- Seguranca: 10/10
- **NOTA FINAL: 6.4/10**

### DECISAO: Solucao A (Nota 10.0)

A Solucao B trata o sintoma mas nao a causa. Textos longos ainda truncariam. Permitir wrapping e a solucao arquiteturalmente correta.

---

### Problema 3: backgroundImage

#### Solucao A: Mover backgroundImage para a raiz do objeto customization

- Corrigir em `CheckoutPublicContent.tsx` para passar `backgroundImage` na raiz do objeto, alinhado com o contrato esperado pelo `CheckoutPublicLayout`
- Manutenibilidade: 10/10
- Zero DT: 10/10
- Arquitetura: 10/10 (alinha dados com contrato da interface)
- Escalabilidade: 10/10
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**

#### Solucao B: Alterar CheckoutPublicLayout para ler de customization.design.backgroundImage

- Manutenibilidade: 7/10 (acopla layout a estrutura interna de dados do design)
- Zero DT: 7/10 (mistura responsabilidades -- layout nao deveria conhecer a estrutura de design)
- Arquitetura: 6/10 (viola interface declarada)
- Escalabilidade: 7/10
- Seguranca: 10/10
- **NOTA FINAL: 7.2/10**

### DECISAO: Solucao A (Nota 10.0)

---

## Plano de Correcao

### Arquivo 1: `src/modules/checkout-public/components/CheckoutPublicContent.tsx`

**3 correcoes:**

1. **Import `useIsMobile`** no topo do arquivo
2. **Chamar `useIsMobile()` ANTES do early return** (linha 169) -- obrigatorio por regras de React Hooks
3. **Reescrever o `useMemo` de customization** (linhas 317-355):
   - Substituir `window.innerWidth < 768` por `isMobile`
   - Adicionar `isMobile` na lista de dependencias
   - Mover `backgroundImage` para a raiz do objeto retornado (fora de `design`)
   - Remover a propriedade `design` do customization (dado morto -- nunca consumido pelo layout)

### Arquivo 2: `src/features/checkout-builder/components/CountdownTimer/CountdownTimer.tsx`

**2 correcoes:**

1. **Container** (linha 80): Remover `overflow: 'hidden'` do inline style
2. **Texto** (linha 94): Substituir `truncate` por classes que permitam wrapping natural

---

## Secao Tecnica

### Arquivos modificados (resumo)

| Arquivo | Alteracao | Tipo |
|---------|-----------|------|
| `CheckoutPublicContent.tsx` | useIsMobile + fix backgroundImage path | Correcao arquitetural |
| `CountdownTimer.tsx` | Remover truncate + overflow hidden | Correcao de CSS |

### Verificacao de Protocol RISE V3

| Checkpoint | Status |
|------------|--------|
| Melhor solucao possivel? | Sim -- nota 10.0 em todos os 3 problemas |
| Cria divida tecnica? | Zero |
| Precisaremos "melhorar depois"? | Nao |
| Codigo sobrevive 10 anos? | Sim -- usa padroes reativos corretos e CSS semantico |
| Escolhido por ser mais rapido? | Nao -- escolhido por ser arquiteturalmente correto |

### Codigo morto eliminado

| Item removido | Razao |
|---------------|-------|
| `customization.design` | Nunca consumido pelo `CheckoutPublicLayout` -- propriedade fantasma |
| `overflow: 'hidden'` no timer | Impedia renderizacao correta do conteudo |
| `truncate` no timer text | Forcava truncamento desnecessario |

### Impacto em funcionalidade

- Componentes mobile do builder agora aparecem corretamente no checkout publico
- Cronometro exibe texto completo em todas as resolucoes
- Background images agora funcionam no checkout publico (bonus)

