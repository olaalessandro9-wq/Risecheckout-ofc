import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface RevenueChartProps {
  title: string;
  data: Array<{ date: string; value: number }>;
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl p-4 shadow-xl">
        <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-card-foreground tracking-tight flex items-center gap-1">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor: 'hsl(var(--success))'}} />
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function RevenueChart({ title, data, isLoading = false }: RevenueChartProps) {
  // Calcular domínio dinâmico do eixo Y para melhor visualização
  const getYAxisDomain = () => {
    if (!data || data.length === 0) return [0, 'auto'];
    
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    
    // Se todos os valores forem zero, usar escala padrão
    if (maxValue === 0) return [0, 'auto'];
    
    // Calcular margem de 10% para dar respiro visual
    const range = maxValue - minValue;
    const margin = range * 0.1;
    
    // Se a variação for muito pequena (menos de 5% do valor máximo),
    // usar uma margem fixa para mostrar melhor as variações
    const effectiveMargin = range < maxValue * 0.05 ? maxValue * 0.05 : margin;
    
    const yMin = Math.max(0, minValue - effectiveMargin);
    const yMax = maxValue + effectiveMargin;
    
    return [Math.floor(yMin), Math.ceil(yMax)];
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative h-full"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent rounded-2xl blur-2xl opacity-50" />
      <div className="relative h-full bg-card/40 backdrop-blur-xl border border-border/50 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-border transition-all duration-300 flex flex-col">
        <div className="flex items-center justify-between mb-4 md:mb-6 lg:mb-8">
          <h3 className="text-base md:text-lg font-bold text-card-foreground tracking-tight flex items-center gap-2 md:gap-3">
            <div className="flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-lg ring-1" style={{backgroundColor: 'hsl(var(--success) / 0.1)', borderColor: 'hsl(var(--success) / 0.2)'}}>
              <div className="h-3 md:h-4 w-0.5 md:w-1 rounded-full" style={{backgroundColor: 'hsl(var(--success))'}} />
            </div>
            {title}
          </h3>
        </div>

        <div className="flex-1 min-h-[200px] md:min-h-[250px] lg:min-h-[300px]">
          {isLoading ? (
            <div className="space-y-4 h-full flex flex-col justify-center">
              <Skeleton className="h-[200px] w-full bg-muted/20" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" opacity={0.2} vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--chart-axis))"
                  style={{ fontSize: '11px', fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="hsl(var(--chart-axis))"
                  style={{ fontSize: '11px', fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  domain={getYAxisDomain()}
                  tickFormatter={(value) => {
                    // Formatar valores grandes de forma compacta (ex: 2.5k, 10k)
                    if (value >= 1000) {
                      return `R$ ${(value / 1000).toFixed(1)}k`;
                    }
                    return `R$ ${value}`;
                  }}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: 'hsl(var(--success))', strokeWidth: 1, strokeDasharray: '4 4', strokeOpacity: 0.3 }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--success))"
                  strokeWidth={3}
                  filter="url(#glow)"
                  dot={{
                    r: 4,
                    strokeWidth: 2,
                    stroke: "hsl(var(--success))",
                    fill: "hsl(var(--card))",
                  }}
                  activeDot={{
                    r: 8,
                    strokeWidth: 3,
                    stroke: "hsl(var(--success) / 0.3)",
                    fill: "hsl(var(--success))",
                    filter: "drop-shadow(0 0 10px hsl(var(--success) / 0.8))"
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </motion.div>
  );
}
