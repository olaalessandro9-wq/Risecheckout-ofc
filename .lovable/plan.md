

## Reescrita Completa do Gráfico do Dashboard

### Análise do Problema

O gráfico atual (`RevenueChart.tsx`) apresenta os seguintes problemas:

| Problema | Causa Técnica |
|----------|---------------|
| **Performance ruim em monitores grandes** | Uso de `LineChart` do Recharts com muitos elementos DOM (dots visíveis sempre) |
| **Cor verde** | Usa `hsl(var(--success))` que é verde no tema |
| **Dots sempre visíveis** | Configuração `dot` sempre ativa |
| **Sem efeito de área** | Usa `LineChart` em vez de `AreaChart` |
| **Animações pesadas** | `framer-motion` + animações do Recharts simultâneas |

### Solução Proposta

Reescrever o componente de gráfico com as seguintes otimizações:

#### 1. Migrar de `LineChart` para `AreaChart`

**Antes:**
```tsx
<LineChart>
  <Line type="monotone" ... />
</LineChart>
```

**Depois:**
```tsx
<AreaChart>
  <defs>
    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#004fff" stopOpacity={0.3} />
      <stop offset="100%" stopColor="#004fff" stopOpacity={0} />
    </linearGradient>
  </defs>
  <Area type="monotone" fill="url(#areaGradient)" stroke="#004fff" ... />
</AreaChart>
```

#### 2. Cores Azuis (Padrão RISE)

| Elemento | Cor |
|----------|-----|
| Linha | `#004fff` (azul primário RISE) |
| Gradiente topo | `#004fff` com 30% opacidade |
| Gradiente base | `#004fff` com 0% opacidade |
| Dot hover | `#004fff` sólido |

#### 3. Dots Invisíveis por Padrão

```tsx
dot={false}  // Invisível por padrão
activeDot={{
  r: 6,
  fill: "#004fff",
  stroke: "#fff",
  strokeWidth: 2,
}}  // Aparece só no hover
```

#### 4. Otimizações de Performance

| Otimização | Implementação |
|------------|---------------|
| **CSS Containment** | `contain: layout style paint` no container |
| **Remoção de motion.div** | Remover wrapper de animação completamente |
| **Debounce agressivo** | `debounce={500}` no ResponsiveContainer |
| **Grid simplificado** | Menos linhas verticais, apenas horizontais |
| **useMemo para gradientId** | ID único para evitar conflitos em múltiplos gráficos |

#### 5. Atualização do Context

Atualizar `UltrawidePerformanceContext.tsx` para refletir as novas cores azuis.

### Arquivos a Modificar

```
src/
├── modules/dashboard/components/Charts/
│   └── RevenueChart.tsx          ← REESCREVER COMPLETAMENTE
├── contexts/
│   └── UltrawidePerformanceContext.tsx  ← Atualizar cores para azul
```

### Detalhes Técnicos

#### RevenueChart.tsx - Nova Implementação

```tsx
// Imports otimizados (sem framer-motion)
import { useMemo, useId } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Constantes de cor
const CHART_COLOR = "#004fff";
const CHART_COLOR_LIGHT = "rgba(0, 79, 255, 0.3)";
const CHART_COLOR_TRANSPARENT = "rgba(0, 79, 255, 0)";

// Gradient com ID único por instância
const gradientId = useId();

// Uso
<defs>
  <linearGradient id={`area-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor={CHART_COLOR} stopOpacity={0.3} />
    <stop offset="100%" stopColor={CHART_COLOR} stopOpacity={0} />
  </linearGradient>
</defs>
<Area
  type="monotone"
  dataKey="value"
  stroke={CHART_COLOR}
  fill={`url(#area-${gradientId})`}
  strokeWidth={2}
  dot={false}
  activeDot={{ r: 6, fill: CHART_COLOR, stroke: "#fff", strokeWidth: 2 }}
/>
```

#### UltrawidePerformanceContext.tsx - Cores Atualizadas

```tsx
// Trocar todas referências de hsl(var(--success)) por #004fff

const defaultChartConfig = {
  stroke: "#004fff",
  activeDot: {
    fill: "#004fff",
    stroke: "#fff",
  },
  // ...
};
```

### Resultado Esperado

- **Cor azul** na linha e efeito de área com gradiente
- **Dots invisíveis** por padrão, aparecem só no hover
- **Performance otimizada** sem animações pesadas
- **Efeito de área** embaixo da linha (como nos prints de referência)
- **Sistema inteligente de ticks** mantido

