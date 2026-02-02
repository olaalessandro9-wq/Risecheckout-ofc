
# Plano: Integrar Vercel Analytics e Speed Insights

## Resumo Executivo

Integração dos componentes de monitoramento da Vercel no projeto React/Vite para coletar métricas de visitantes, page views e Core Web Vitals.

---

## Análise de Soluções

### Solução A: Import direto no App.tsx
- Manutenibilidade: 10/10 - Componentes da Vercel são self-contained
- Zero DT: 10/10 - Implementação oficial documentada
- Arquitetura: 10/10 - Componentes ficam no nível mais alto da árvore
- Escalabilidade: 10/10 - Sem impacto de performance
- Segurança: 10/10 - Nenhum dado sensível exposto
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 2 minutos

### DECISÃO: Solução A (Nota 10.0)
Única solução viável e oficialmente documentada pela Vercel.

---

## Implementação

### Passo 1: Instalação dos Pacotes

```bash
npm i @vercel/analytics @vercel/speed-insights
```

### Passo 2: Modificação do App.tsx

Adicionar os imports corretos para **React** (não Next.js):

```typescript
// Vercel Monitoring (React/Vite)
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
```

### Passo 3: Adicionar Componentes

Os componentes serão adicionados dentro do `App()`, após o `RouterProvider`:

```tsx
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AppErrorBoundary>
          <BusyProvider>
            <TooltipProvider>
              <RouterProvider router={router} />
            </TooltipProvider>
          </BusyProvider>
        </AppErrorBoundary>
      </HelmetProvider>
      
      {/* Vercel Monitoring - Apenas em produção na Vercel */}
      <Analytics />
      <SpeedInsights />
    </QueryClientProvider>
  );
}
```

---

## Arquivos Modificados

```
src/
└── App.tsx          ← Adicionar imports + componentes
```

---

## Detalhes Técnicos

| Item | Valor |
|------|-------|
| Pacotes | `@vercel/analytics`, `@vercel/speed-insights` |
| Import Analytics | `@vercel/analytics/react` (NÃO `/next`) |
| Import Speed | `@vercel/speed-insights/react` (NÃO `/next`) |
| Posição | Após `RouterProvider`, dentro do `QueryClientProvider` |

---

## Comportamento

- **Em desenvolvimento (localhost)**: Componentes são injetados mas não enviam dados
- **Em produção (Vercel)**: Dados são coletados automaticamente
- **Fora da Vercel**: Componentes são ignorados silenciosamente

---

## Resultado Esperado

Após o deploy:
1. **Analytics Tab** → Mostrará Visitors, Page Views, Bounce Rate
2. **Speed Insights Tab** → Mostrará LCP, FID, CLS, TTFB por rota
