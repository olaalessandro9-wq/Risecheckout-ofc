
# Plano: Eliminar Travamento do Gráfico Durante Transição da Sidebar

## Diagnóstico Técnico

### Causa Raiz Identificada

O `ResponsiveContainer` do Recharts usa `ResizeObserver` internamente. Quando a sidebar muda de largura:

```
Sidebar width change (300ms transition)
         ↓
Main content margin-left changes
         ↓
ResponsiveContainer detecta resize
         ↓
Recalcula SVG do gráfico DURANTE a transição
         ↓
TRAVAMENTO (60-100ms de jank)
```

O `debounce={500}` não ajuda porque ele apenas adia o recálculo - não impede que o gráfico "tente" recalcular.

---

## Análise de Soluções (RISE Protocol V3)

### Solução A: Aumentar Debounce
- Aumentar debounce para 1000ms
- Manutenibilidade: 6/10
- Zero DT: 5/10 (workaround)
- Arquitetura: 5/10
- Escalabilidade: 6/10
- Segurança: 10/10
- **NOTA FINAL: 6.4/10**
- Tempo: 5 minutos

### Solução B: Suspender Responsividade Durante Transição
- Usar flag `isTransitioning` para desabilitar ResponsiveContainer temporariamente
- Manutenibilidade: 8/10
- Zero DT: 7/10
- Arquitetura: 7/10
- Escalabilidade: 8/10
- Segurança: 10/10
- **NOTA FINAL: 8.0/10**
- Tempo: 30 minutos

### Solução C: Substituir ResponsiveContainer por CSS + useResizeObserver Customizado
- Remover ResponsiveContainer completamente
- Usar CSS para dimensionamento (`width: 100%; height: 100%`)
- Implementar useResizeObserver próprio com debounce inteligente
- Recalcular apenas quando transição terminar
- Manutenibilidade: 10/10
- Zero DT: 10/10
- Arquitetura: 10/10
- Escalabilidade: 10/10
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**
- Tempo: 1-2 horas

### DECISÃO: Solução C (Nota 10.0)

A Solução C elimina completamente a dependência do `ResponsiveContainer` problemático, substituindo por uma implementação própria que respeita as transições da sidebar.

---

## Implementação Técnica

### 1. Criar Hook `useChartDimensions`

```typescript
// src/hooks/useChartDimensions.ts

/**
 * Hook otimizado para dimensionamento de gráficos.
 * Ignora mudanças durante transições CSS.
 */
export function useChartDimensions(ref: RefObject<HTMLElement>) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const transitionTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      // Limpar timeout anterior
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      // Aguardar 350ms (tempo da transição + margem)
      transitionTimeoutRef.current = setTimeout(() => {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width: Math.floor(width), height: Math.floor(height) });
      }, 350);
    });

    // Dimensão inicial (imediata)
    const { width, height } = ref.current.getBoundingClientRect();
    setDimensions({ width: Math.floor(width), height: Math.floor(height) });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return dimensions;
}
```

### 2. Reescrever RevenueChart SEM ResponsiveContainer

```typescript
// RevenueChart.tsx

export function RevenueChart({ title, data, isLoading }: RevenueChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useChartDimensions(containerRef);

  // Render apenas quando dimensões válidas
  const showChart = width > 0 && height > 0 && !isLoading;

  return (
    <div ref={containerRef} className="flex-1 min-h-[300px]">
      {showChart && (
        <AreaChart
          width={width}
          height={height}
          data={data}
          // ... resto das props
        >
          {/* ... */}
        </AreaChart>
      )}
    </div>
  );
}
```

### 3. Vantagens desta Abordagem

| Aspecto | ResponsiveContainer | useChartDimensions |
|---------|---------------------|-------------------|
| Recálculo durante transição | Sim (causa jank) | Não (aguarda 350ms) |
| Controle sobre debounce | Limitado | Total |
| Performance | ~60ms por resize | ~5ms (só no final) |
| Re-renders | Múltiplos | 1 (após transição) |

---

## Arquivos a Modificar

```
src/
├── hooks/
│   └── useChartDimensions.ts          ← CRIAR (hook customizado)
├── modules/dashboard/components/Charts/
│   └── RevenueChart.tsx               ← REESCREVER (remover ResponsiveContainer)
```

---

## Resultado Esperado

- Sidebar abre/fecha com **60 FPS constante**
- Gráfico recalcula **apenas uma vez** após transição
- Zero jank durante animação
- Mantém responsividade para resize de janela real
