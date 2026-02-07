
# Melhoria do Eixo X do Grafico: Formatacao Inteligente de Ticks

## Diagnostico

O problema esta no `RevenueChart.tsx`, linhas 225-235. O eixo X (XAxis) usa a configuracao:

```typescript
interval={isUltrawide ? "preserveStartEnd" : "preserveEnd"}
minTickGap={isUltrawide ? 100 : 50}
```

O Recharts recebe os valores raw como labels do eixo X e decide automaticamente quais ticks mostrar, resultando em:

- **Horario (1 dia)**: Mostra "00:00", "02:00", "04:00", "06:00"... pulando horas impares
- **Diario (7 dias)**: Mostra "2026-01-15", "2026-01-16"... no formato raw ISO, ilegivel
- **Diario (30 dias)**: Pula varios dias e mostra YYYY-MM-DD cru
- **Maximo**: Comportamento imprevisivel com muitos pontos

A raiz do problema e dupla:
1. Nenhum `tickFormatter` e aplicado ao XAxis (labels exibidos como raw strings)
2. O `interval` automatico do Recharts e impreciso -- ele decide quais ticks pular baseado em heuristica interna

## Analise de Solucoes

### Solucao A: Apenas adicionar `tickFormatter` ao XAxis

- Manutenibilidade: 5/10 (resolve a formatacao mas nao o skip de ticks)
- Zero DT: 4/10 (o interval automatico continua imprevisivel)
- Arquitetura: 4/10 (meia solucao)
- Escalabilidade: 4/10 (nao se adapta a diferentes periodos)
- Seguranca: 10/10
- **NOTA FINAL: 4.6/10**

### Solucao B: Sistema inteligente de ticks com auto-deteccao de granularidade

Criar um sistema que:
1. Detecta automaticamente se os dados sao horarios ou diarios (pelo formato do campo `date`)
2. Calcula os ticks explicitamente (quais labels mostrar) baseado na quantidade de dados e largura do grafico
3. Formata cada tick de acordo com a granularidade
4. Aplica o mesmo formato ao tooltip

- Manutenibilidade: 10/10 (logica centralizada em funcoes puras testadas)
- Zero DT: 10/10 (controle total sobre quais ticks aparecem)
- Arquitetura: 10/10 (auto-deteccao funciona para Dashboard e Admin, sem prop extra)
- Escalabilidade: 10/10 (adaptavel a qualquer periodo, e responsivo a largura)
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**

### DECISAO: Solucao B (Nota 10.0)

A Solucao A resolve apenas metade do problema. A Solucao B garante controle total e formatacao perfeita em todos os cenarios.

---

## Plano de Execucao

### Fase 1: Criar utilidade de X-Axis Ticks

**CRIAR** `src/modules/dashboard/utils/chartAxisUtils.ts` (~80 linhas)

Funcoes puras que calculam os ticks e formatadores:

```typescript
type ChartTimeMode = "hourly" | "daily";

// Auto-detecta pela formato do campo date
function detectTimeMode(data): ChartTimeMode

// Calcula quais ticks exibir e como formata-los
function calculateXAxisConfig(data, mode, chartWidth): {
  ticks: string[];
  formatter: (value: string) => string;
}
```

**Logica por granularidade:**

| Modo | Dados | Ticks Exibidos | Formato |
|------|-------|----------------|---------|
| Horario | 24 pontos ("00:00"..."23:00") | A cada 3h: 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00 | "00h", "03h", "06h"... |
| Diario (2-7 dias) | 2-7 pontos ("2026-01-15") | Todos os dias | "15/01", "16/01"... |
| Diario (8-14 dias) | 8-14 pontos | A cada 2 dias | "15/01", "17/01"... |
| Diario (15-31 dias) | 15-31 pontos | ~8-10 ticks distribuidos | "15 Jan", "20 Jan"... |
| Diario (>31 dias) | 32+ pontos | ~6-8 ticks distribuidos | "Jan", "Fev", "Mar"... |

A funcao tambem considera a largura do grafico (`chartWidth`) para ajustar a quantidade de ticks dinamicamente -- em telas menores, menos ticks.

### Fase 2: Criar formatador de tooltip

No mesmo arquivo, adicionar:

```typescript
function formatTooltipLabel(value: string, mode: ChartTimeMode): string
```

| Modo | Input | Output |
|------|-------|--------|
| Horario | "09:00" | "09:00" |
| Diario | "2026-01-15" | "15/01/2026" |

### Fase 3: Integrar no RevenueChart

**EDITAR** `src/modules/dashboard/components/Charts/RevenueChart.tsx`

Mudancas:
1. Importar `detectTimeMode`, `calculateXAxisConfig`, `formatTooltipLabel`
2. No componente, usar `useMemo` para calcular a configuracao do XAxis:
   ```typescript
   const timeMode = useMemo(() => detectTimeMode(data), [data]);
   const xAxisConfig = useMemo(
     () => calculateXAxisConfig(data, timeMode, width),
     [data, timeMode, width]
   );
   ```
3. Atualizar o `XAxis` para usar ticks explicitos e formatter:
   ```typescript
   <XAxis
     dataKey="date"
     ticks={xAxisConfig.ticks}
     tickFormatter={xAxisConfig.formatter}
     interval={0}  // Mostrar TODOS os ticks que nos calculamos
     ...
   />
   ```
4. Atualizar o `CustomTooltip` para formatar o label:
   ```typescript
   <p>{formatTooltipLabel(label, timeMode)}</p>
   ```

### Fase 4: Atualizar barrel exports

**EDITAR** `src/modules/dashboard/utils/index.ts`

Adicionar export do novo modulo:
```typescript
export { detectTimeMode, calculateXAxisConfig, formatTooltipLabel } from "./chartAxisUtils";
```

## Arvore de Arquivos

```text
src/modules/dashboard/
  utils/
    chartAxisUtils.ts              -- CRIAR (logica de ticks e formatacao)
    index.ts                       -- EDITAR (adicionar exports)
  components/Charts/
    RevenueChart.tsx               -- EDITAR (integrar sistema de ticks)
```

## Resultado Visual Esperado

| Periodo | Antes (eixo X) | Depois (eixo X) |
|---------|----------------|-----------------|
| Hoje | "00:00 02:00 04:00 06:00..." (pula horas) | "00h  03h  06h  09h  12h  15h  18h  21h" |
| Ontem | Mesmo problema | Mesmo formato horario correto |
| 7 dias | "2026-01-10 2026-01-12..." (raw ISO) | "10/01  11/01  12/01  13/01  14/01  15/01  16/01" |
| 30 dias | "2026-01-01 2026-01-08..." (pula muitos) | "01 Jan  05 Jan  10 Jan  15 Jan  20 Jan  25 Jan  30 Jan" |
| Maximo | Imprevisivel | "Jan  Fev  Mar  Abr  Mai  Jun..." |
| Custom (1 dia) | Igual "Hoje" | Formato horario correto |

O tooltip tambem sera formatado: "2026-01-15" vira "15/01/2026" e "09:00" permanece "09:00".

Ambos os consumidores (`Dashboard` e `AdminFinanceTab`) se beneficiam automaticamente sem nenhuma alteracao, pois a deteccao e feita internamente no `RevenueChart`.
