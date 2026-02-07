

# Correcao Raiz: Exibir TODOS os Dias no Eixo X

## Diagnostico da Doenca (Root Cause)

O problema NAO esta no algoritmo de distribuicao (`selectWithConsistentStep`). O problema esta na **decisao arquitetural de PULAR ticks para periodos curtos**. O sistema foi desenhado para SEMPRE decidir quais ticks pular, quando para periodos de ate ~45 dias, a resposta correta e: **nao pular NENHUM**.

A funcao `calculateDailyTicks` (linha 161-184) chama `selectWithConsistentStep` incondicionalmente. Independente de quantos dias existam, ela tenta "encaixar" dentro de um `maxTicks` calculado. Isso e a doenca. O sintoma e os dias faltando.

O segundo fator e o formato dos labels. "8 Jan" ocupa ~40px. Com 30 labels a 40px = 1200px. Em charts com menos de 1200px de largura, os labels se sobrepoem. A solucao correta nao e pular dias -- e **usar um formato mais compacto** que permita mostrar TODOS.

## Analise de Solucoes

### Solucao A: Aumentar o threshold do `selectWithConsistentStep`

- Manutenibilidade: 5/10 (nao resolve o problema em telas menores)
- Zero DT: 3/10 (em telas < 1200px, 30 labels de "8 Jan" vao se sobrepor)
- Arquitetura: 3/10 (continua tratando o sintoma, nao a doenca)
- Escalabilidade: 3/10 (quebra em resoluces menores)
- Seguranca: 10/10
- **NOTA FINAL: 4.0/10**

### Solucao B: Formato compacto adaptativo + exibicao total para periodos curtos

Redesenhar `calculateDailyTicks` com duas faixas claras:

1. **Periodos curtos (ate 45 dias)**: Mostrar TODOS os ticks, sem excecao. Usar formato compacto: numero do dia ("8", "9", "10"), com nome do mes apenas quando o mes muda ("1 Fev"). Isso garante ~15px por label, cabendo 45 labels em 675px (qualquer tela).

2. **Periodos longos (46+ dias)**: Usar `selectWithConsistentStep` com formatos "DD Mon" ou "Mon/YY".

- Manutenibilidade: 10/10 (logica clara: curto = tudo, longo = distribuicao)
- Zero DT: 10/10 (funciona em qualquer largura de tela)
- Arquitetura: 10/10 (resolve a doenca: a decisao de pular so existe para ranges longos)
- Escalabilidade: 10/10 (45 labels a 15px = 675px, cabe ate em mobile landscape)
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**

### DECISAO: Solucao B (Nota 10.0)

A Solucao A trata o sintoma (ajustar threshold). A Solucao B trata a doenca (eliminar a decisao de pular para periodos curtos e usar formato que garante que tudo cabe).

---

## Plano de Execucao

### Arquivo: `src/modules/dashboard/utils/chartAxisUtils.ts`

**1. Novo formatador compacto para periodos curtos**

Criar funcao `getCompactDailyFormatter` que retorna:
- Numero do dia para a maioria dos ticks: "8", "9", "10"...
- Dia + mes abreviado quando o mes muda: "1 Fev"
- Dia + mes no primeiro tick se nao comecar no dia 1: "8 Jan"

Exemplos de resultado visual para 30 dias (8 Jan a 6 Fev):

```text
8 Jan  9  10  11  12  13  14  15  16  17  18  19  20  21  22  23  24  25  26  27  28  29  30  31  1 Fev  2  3  4  5  6
```

Cada label ocupa ~12-15px (numeros) ou ~35px (com mes). Total: ~28 * 15 + 2 * 35 = 490px. Cabe em qualquer tela.

**2. Refatorar `calculateDailyTicks`**

Substituir a logica atual por duas faixas:

```text
if (count <= 45) {
  // TODOS os ticks, formato compacto
  return { ticks: allDates, formatter: getCompactDailyFormatter(allDates) };
}

// Periodos longos: distribuicao + formato "DD Mon" ou "Mon/YY"
const maxTicks = getMaxTicks(chartWidth, estimatedLabelWidth);
const ticks = selectWithConsistentStep(allDates, maxTicks);
return { ticks, formatter: getDailyFormatter(count) };
```

**3. Atualizar `getDailyFormatter` thresholds**

Como periodos <= 45 dias agora usam o formato compacto, os thresholds de `getDailyFormatter` mudam:

| Range | Formato |
|-------|---------|
| <= 45 dias | Compacto (dia + mes em transicoes) -- novo formatador |
| 46-90 dias | "DD Mon" ("15 Jan") |
| 91+ dias | "Mon/YY" ("Jan/26") |

**4. Nenhuma mudanca necessaria em:**
- `calculateHourlyTicks` -- ja esta correto com intervalos naturais
- `selectWithConsistentStep` -- continua sendo usado para ranges longos
- `RevenueChart.tsx` -- nao precisa de alteracoes
- `index.ts` -- exports ja existem

## Resultado Visual Esperado

| Periodo | Ticks no Eixo X |
|---------|----------------|
| Hoje (24h) | 00h 01h 02h 03h ... 23h (todos, ja funciona) |
| Ontem (24h) | 00h 01h 02h 03h ... 23h (todos, ja funciona) |
| 7 dias | 31/01 01/02 02/02 03/02 04/02 05/02 06/02 (todos, ja funciona) |
| 30 dias | 8 Jan 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 1 Fev 2 3 4 5 6 (TODOS) |
| Maximo (anos) | Jan/25 Abr/25 Jul/25 Out/25 Jan/26 (distribuidos) |

## Arvore de Arquivos

```text
src/modules/dashboard/utils/
  chartAxisUtils.ts   -- EDITAR (refatorar calculateDailyTicks + novo formatador compacto)
```

1 arquivo editado. Zero arquivos novos.

