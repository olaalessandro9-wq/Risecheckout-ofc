

# Reformatar Eixo X: DD/MM para 7 e 30 dias

## Requisito do Usuario

| Periodo | Formato | Exibicao |
|---------|---------|----------|
| Hoje / Ontem | "00h", "01h", ... | Manter como esta |
| Ultimos 7 dias | "31/01", "01/02", ... | Todos os dias (cabe perfeitamente) |
| Ultimos 30 dias | "01/01", "03/01", "05/01", ... | 1 dia sim, 1 dia nao (step=2) |
| Maximo (anos) | "Jan/26", "Abr/26", ... | Manter como esta |

## Analise de Solucoes

### Solucao A: Condicional dentro de `calculateDailyTicks` com threshold fixo

Dividir `calculateDailyTicks` em 3 faixas claras baseadas em `count`:

1. `count <= 14`: Todos os ticks, formato "DD/MM"
2. `15 <= count <= 45`: Step fixo de 2 (1 sim, 1 nao), formato "DD/MM"
3. `count > 45`: `selectWithConsistentStep` + "DD Mon" ou "Mon/YY"

- Manutenibilidade: 10/10 (3 faixas com logica cristalina, zero ambiguidade)
- Zero DT: 10/10 (cada faixa e auto-contida, sem dependencia de largura de tela para ranges curtos)
- Arquitetura: 10/10 (eliminacao total da funcao `getCompactDailyFormatter` que nao e mais necessaria)
- Escalabilidade: 10/10 (step=2 para 30 dias = 15 labels a ~45px = 675px, cabe em qualquer tela)
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**

### Solucao B: Manter `getCompactDailyFormatter` e adicionar logica de step condicional

Reutilizar o formatador compacto existente e adicionar step=2 para 30 dias.

- Manutenibilidade: 6/10 (mantem codigo morto -- o formatador compacto nao sera mais usado)
- Zero DT: 6/10 (formatador compacto existe mas nunca e chamado -- confusao futura)
- Arquitetura: 5/10 (viola Single Responsibility -- duas estrategias de formatacao coexistindo sem necessidade)
- Escalabilidade: 10/10
- Seguranca: 10/10
- **NOTA FINAL: 7.0/10**

### DECISAO: Solucao A (Nota 10.0)

A Solucao B mantem codigo morto (`getCompactDailyFormatter` e `SHORT_RANGE_THRESHOLD`) que nunca sera chamado. A Solucao A remove tudo que nao e necessario e implementa a logica com 3 faixas claras e auto-documentadas.

---

## Plano de Execucao

### Arquivo: `src/modules/dashboard/utils/chartAxisUtils.ts`

**1. REMOVER** `SHORT_RANGE_THRESHOLD` (linhas 158-166)

Constante nao sera mais usada.

**2. REMOVER** `getCompactDailyFormatter` (linhas 168-214)

Funcao inteira nao sera mais usada. O formato agora e sempre "DD/MM" para ranges curtos e medios.

**3. REESCREVER** `calculateDailyTicks` (linhas 227-249)

Nova logica com 3 faixas:

```text
function calculateDailyTicks(data, chartWidth): XAxisConfig {
  const count = data.length;
  const allDates = data.map(d => d.date);
  const ddmmFormatter = getDDMMFormatter();

  // Faixa 1: ate 14 dias (cobre "7 dias") -- TODOS os ticks
  if (count <= 14) {
    return { ticks: [...allDates], formatter: ddmmFormatter };
  }

  // Faixa 2: 15-45 dias (cobre "30 dias") -- step fixo de 2
  if (count <= 45) {
    const ticks: string[] = [];
    for (let i = 0; i < allDates.length; i += 2) {
      ticks.push(allDates[i]);
    }
    return { ticks, formatter: ddmmFormatter };
  }

  // Faixa 3: 46+ dias (cobre "maximo") -- distribuicao inteligente
  const estimatedLabelWidth = count <= 90 ? 55 : 58;
  const maxTicks = getMaxTicks(chartWidth, estimatedLabelWidth);
  const ticks = selectWithConsistentStep(allDates, maxTicks);
  return { ticks, formatter: getDailyFormatter(count) };
}
```

**4. CRIAR** `getDDMMFormatter` (funcao nova, simples)

Formatador "DD/MM" usado pelas faixas 1 e 2:

```text
function getDDMMFormatter(): (value: string) => string {
  return (value: string): string => {
    const parts = value.split("-");
    if (parts.length < 3) return value;
    return `${parts[2]}/${parts[1]}`;
  };
}
```

**5. ATUALIZAR** `getDailyFormatter` (linhas 260-281)

Como agora so e chamada para `count > 45`, os thresholds permanecem iguais (46-90 = "DD Mon", 91+ = "Mon/YY"). Nenhuma mudanca no corpo, apenas no JSDoc.

**6. Nenhuma mudanca necessaria em:**
- `calculateHourlyTicks` -- ja esta correto com intervalos naturais
- `selectWithConsistentStep` -- continua sendo usado para ranges longos
- `RevenueChart.tsx` -- nao precisa de alteracoes
- `index.ts` -- exports ja existem

## Resultado Visual Esperado

| Periodo | Ticks no Eixo X |
|---------|----------------|
| Hoje (24h) | 00h 01h 02h ... 23h (sem mudanca) |
| Ontem (24h) | 00h 01h 02h ... 23h (sem mudanca) |
| 7 dias | 31/01 01/02 02/02 03/02 04/02 05/02 06/02 (TODOS, formato DD/MM) |
| 30 dias | 08/01 10/01 12/01 14/01 ... 30/01 01/02 03/02 05/02 (step=2, formato DD/MM) |
| Maximo | Jan/25 Abr/25 Jul/25 Out/25 Jan/26 (sem mudanca) |

## Arvore de Arquivos

```text
src/modules/dashboard/utils/
  chartAxisUtils.ts   -- EDITAR (remover codigo morto + reescrever calculateDailyTicks + nova getDDMMFormatter)
```

1 arquivo editado. Zero arquivos novos.

