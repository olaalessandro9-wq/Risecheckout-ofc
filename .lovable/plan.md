
# Limitar "Maximo" a 16 Meses

## Diagnostico da Raiz

O preset "Maximo" usa `getMaxRange()` em `src/lib/date-range/service.ts` (linha 161-174), que define o inicio como `maxStartDate` -- por padrao `2020-01-01`. Isso gera ~2200 dias de dados no grafico, resultando na visualizacao bagunçada que aparece na screenshot (Jan/20 ate Fev/26 com labels sobrepostos e dados inuteis).

A doenca e: o `maxStartDate` e um valor fixo absoluto em vez de um valor relativo ao momento atual. A cura e: substituir por um calculo dinamico de "16 meses atras".

## Analise de Solucoes

### Solucao A: Mudar apenas o `DEFAULT_DATE_RANGE_CONFIG.maxStartDate`

Trocar o valor fixo `2020-01-01` por `new Date()` com calculo de 16 meses atras.

- Manutenibilidade: 4/10 (o `maxStartDate` e avaliado uma unica vez no momento do import do modulo -- se a app ficar aberta por dias, o valor fica stale)
- Zero DT: 3/10 (bug latente: valor calculado no module load, nao no momento da chamada)
- Arquitetura: 3/10 (viola o principio de que configuracoes estaticas devem ser estaticas)
- Escalabilidade: 5/10
- Seguranca: 10/10
- **NOTA FINAL: 4.4/10**

### Solucao B: Adicionar `maxMonthsBack` ao config + calculo dinamico em `getMaxRange`

Adicionar um campo `maxMonthsBack: number` no `DateRangeConfig` (default: 16). O `getMaxRange()` calcula `now - maxMonthsBack meses` dinamicamente a cada chamada. Remover o campo `maxStartDate` que se torna obsoleto.

- Manutenibilidade: 10/10 (calculo dinamico, sempre correto independente de quando e chamado)
- Zero DT: 10/10 (sem valores stale, sem dependencia de module load time)
- Arquitetura: 10/10 (config declarativa com um numero, calculo no service -- separacao perfeita)
- Escalabilidade: 10/10 (mudar de 16 para 24 meses = trocar um numero)
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**

### Solucao C: Limitar apenas no chart (filtrar dados no frontend)

Manter a query buscando desde 2020 e cortar os dados no componente.

- Manutenibilidade: 3/10 (busca dados desnecessarios do banco)
- Zero DT: 2/10 (desperdicio de bandwidth e processamento)
- Arquitetura: 2/10 (o frontend nao deveria decidir a janela temporal -- isso e responsabilidade do service)
- Escalabilidade: 1/10 (conforme dados crescem, performance degrada)
- Seguranca: 10/10
- **NOTA FINAL: 3.0/10**

### DECISAO: Solucao B (Nota 10.0)

As outras soluçoes tratam sintomas. A Solucao B resolve na raiz: o service calcula dinamicamente a janela de 16 meses a cada chamada, sem valores stale e sem buscar dados desnecessarios do banco.

---

## Plano de Execucao

### Arquivo 1: `src/lib/date-range/types.ts`

**1. Adicionar campo `maxMonthsBack` ao `DateRangeConfig`**

Novo campo opcional com default de 16:

```text
interface DateRangeConfig {
  readonly timezone: IANATimezone;
  readonly referenceDate?: Date;
  readonly maxMonthsBack: number;  // NOVO (substitui maxStartDate)
}
```

**2. Atualizar `DEFAULT_DATE_RANGE_CONFIG`**

Substituir `maxStartDate: new Date('2020-01-01...')` por `maxMonthsBack: 16`.

**3. Remover campo `maxStartDate`** do `DateRangeConfig`

Campo obsoleto -- substituido por `maxMonthsBack`.

### Arquivo 2: `src/lib/date-range/service.ts`

**1. Reescrever `getMaxRange`** (linhas 161-174)

Calcular `startDate` dinamicamente: `now.setMonth(now.getMonth() - this.config.maxMonthsBack)`.

Antes:
```text
private getMaxRange(now: Date): DateRangeOutput {
  const maxStart = this.config.maxStartDate || new Date('2020-01-01...');
  // ...
}
```

Depois:
```text
private getMaxRange(now: Date): DateRangeOutput {
  const startDate = new Date(now);
  startDate.setMonth(startDate.getMonth() - this.config.maxMonthsBack);

  const startBoundaries = this.timezoneService.getDateBoundaries(startDate);
  const endBoundaries = this.timezoneService.getDateBoundaries(now);

  return {
    startISO: startBoundaries.startOfDay,
    endISO: endBoundaries.endOfDay,
    startDate: new Date(startBoundaries.startOfDay),
    endDate: new Date(endBoundaries.endOfDay),
    timezone: this.config.timezone,
    preset: 'max',
  };
}
```

Nota: agora usa `getDateBoundaries` para o start tambem (antes usava `maxStart.toISOString()` diretamente, que nao passava pelo timezone service -- isso era uma inconsistencia sutil).

### Arquivo 3: `src/lib/date-range/__tests__/service.test.ts` e `service.test.ts`

Atualizar os testes de "max" para refletir o novo comportamento (16 meses atras em vez de 2020-01-01).

### Nenhuma mudanca necessaria em:
- `chartAxisUtils.ts` -- Tier 3 (46+ dias) com Mon/YY ja lida corretamente com ~487 dias (16 meses)
- `useDashboardAnalytics.ts` -- consome `dateRange.startISO/endISO` que ja vem corretos do service
- `useDateRangeState.ts` -- chama `dateRangeService.getRange('max')` que retornara o novo range
- `index.ts` -- exports permanecem iguais

## Resultado Visual Esperado

| Periodo | Antes | Depois |
|---------|-------|--------|
| Maximo | Jan/20 Abr/20 ... Out/25 Fev/26 (~73 meses, labels sobrepostos) | Out/24 Nov/24 Dez/24 Jan/25 ... Jan/26 Fev/26 (16 meses, labels claros) |

Com 16 meses (~487 dias) e Mon/YY a 58px, em um chart de ~900px: maxTicks = floor(900/58) = 15. Step = ceil(16/15) = 2. Resultado: ~8 labels distribuidos uniformemente -- limpo e legivel.

## Arvore de Arquivos

```text
src/lib/date-range/
  types.ts              -- EDITAR (maxStartDate -> maxMonthsBack)
  service.ts            -- EDITAR (reescrever getMaxRange)
  __tests__/service.test.ts  -- EDITAR (atualizar testes de max)
  service.test.ts       -- EDITAR (atualizar testes de max)
```

4 arquivos editados. Zero arquivos novos.
