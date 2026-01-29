
# Plano: Prefetch de Chunk no Hover de Produto

## Diagnóstico Confirmado

O delay de ~2 segundos ao clicar em um produto pela primeira vez ocorre porque:

1. O `ProductEdit` usa `lazyWithRetry()` (code splitting)
2. O chunk contém o módulo de produtos completo (~100KB+ estimado):
   - ProductContext + State Machine
   - 8 abas de edição (General, Checkout, Upsell, etc.)
   - MembersAreaLayout
3. **Nenhum prefetch** existe quando o usuário faz hover sobre a linha do produto

```text
FLUXO ATUAL (LENTO):
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuario clica na linha do produto                           │
│ 2. URL muda para /dashboard/produtos/editar?id=xxx             │
│ 3. React Router tenta renderizar <ProductEdit />               │
│ 4. SUSPENSE: Precisa baixar chunk JS (1-2 segundos)            │
│ 5. Chunk carrega, ProductEdit renderiza                        │
│                                                                 │
│ RESULTADO: Usuario vê lista por 2 segundos apos clicar         │
└─────────────────────────────────────────────────────────────────┘

FLUXO DESEJADO (INSTANTANEO):
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuario faz HOVER na linha do produto                       │
│ 2. Prefetch do chunk ProductEdit inicia (background)           │
│ 3. Chunk carrega enquanto usuario move o mouse                 │
│ 4. Usuario clica na linha                                      │
│ 5. Chunk ja esta em cache, navegacao INSTANTANEA               │
│                                                                 │
│ RESULTADO: Zero delay percebido                                │
└─────────────────────────────────────────────────────────────────┘
```

## Analise de Solucoes (RISE V3 Secao 4.4)

### Solucao A: Prefetch no Hover da Linha (ProductRow)
- Manutenibilidade: 10/10 (logica isolada no componente)
- Zero DT: 10/10 (resolve pela raiz)
- Arquitetura: 10/10 (segue padrao existente do SidebarItem)
- Escalabilidade: 10/10 (aplicavel a qualquer lista)
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 30 minutos

### Solucao B: Eager Loading (remover lazyWithRetry)
- Manutenibilidade: 5/10 (aumenta bundle inicial)
- Zero DT: 6/10 (resolve, mas cria problema novo)
- Arquitetura: 4/10 (viola code splitting)
- Escalabilidade: 3/10 (bundle cresce indefinidamente)
- Seguranca: 10/10
- **NOTA FINAL: 5.6/10**
- Tempo estimado: 5 minutos

### Solucao C: Prefetch Global na Pagina de Produtos
- Manutenibilidade: 7/10 (prefetch cego)
- Zero DT: 8/10 (funciona, mas despertica bandwidth)
- Arquitetura: 6/10 (prefetch mesmo sem intencao de navegar)
- Escalabilidade: 6/10 (baixa todos os chunks)
- Seguranca: 10/10
- **NOTA FINAL: 7.4/10**
- Tempo estimado: 20 minutos

### DECISAO: Solucao A (Nota 10.0/10)

Adicionar prefetch no `onMouseEnter` do `ProductRow.tsx`, seguindo exatamente o padrao ja estabelecido em `SidebarItem.tsx`.

## Implementacao Tecnica

### 1. Atualizar ProductRow.tsx

Adicionar `onMouseEnter` para prefetch do chunk `ProductEdit`:

```typescript
// Adicionar import
import { useCallback } from "react";

// Prefetch function
const prefetchProductEdit = () => {
  // Prefetch chunk JS do ProductEdit
  import("@/pages/ProductEdit");
};

// No componente
<tr 
  className="border-b border-border hover:bg-muted/20 transition-colors cursor-pointer"
  onClick={() => onEdit(product.id)}
  onMouseEnter={prefetchProductEdit}
>
```

### 2. Otimizacao: Prefetch Unico (Debounced)

Para evitar multiplos imports, usar um flag de controle:

```typescript
// Fora do componente (module-level)
let prefetched = false;

const prefetchProductEdit = () => {
  if (prefetched) return;
  prefetched = true;
  import("@/pages/ProductEdit");
};
```

### 3. Documentar Padrao

Adicionar ao CODING_STANDARDS.md a regra de prefetch em listas.

## Arquivos a Modificar

| Arquivo | Modificacao |
|---------|-------------|
| `src/components/products/products-table/ProductRow.tsx` | Adicionar onMouseEnter com prefetch |
| `docs/CODING_STANDARDS.md` | Documentar padrao de prefetch em listas |

## Validacao

Apos implementacao:
1. Navegar para /dashboard/produtos
2. Fazer hover sobre uma linha de produto (DevTools Network mostra chunk carregando)
3. Clicar no produto
4. Navegacao deve ser INSTANTANEA (< 100ms)

## Conformidade RISE V3

| Criterio | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade Infinita | 10/10 | Padrao consistente com SidebarItem |
| Zero Divida Tecnica | 10/10 | Resolve causa raiz sem workarounds |
| Arquitetura Correta | 10/10 | Segue padrao de prefetch existente |
| Escalabilidade | 10/10 | Aplicavel a qualquer lista interativa |
| Seguranca | 10/10 | Sem impacto |
| **NOTA FINAL** | **10.0/10** | |
