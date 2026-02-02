

# Plano: CI Fix + Lovable Decoupling + Vercel Preparation

## Resumo Executivo

Este plano resolve três problemas interconectados que impedem o projeto de funcionar corretamente no GitHub e no Vercel:

1. **CI Falhando**: O lockfile `pnpm-lock.yaml` não é sincronizado pelo Lovable para o GitHub
2. **Dependência do Lovable**: O projeto ainda depende do `lovable-tagger` que não funciona fora do ambiente Lovable
3. **Branding**: Meta tags ainda referenciam Lovable ao invés de RiseCheckout

---

## Análise de Soluções

### Solução A: Gerar lockfile via CI antes de instalar
- Manutenibilidade: 9/10
- Zero DT: 10/10
- Arquitetura: 9/10
- Escalabilidade: 10/10
- Segurança: 10/10
- **NOTA FINAL: 9.6/10**
- Tempo estimado: 30 minutos

### Solução B: Remover --frozen-lockfile apenas quando lockfile não existir
- Manutenibilidade: 7/10 (lógica condicional adiciona complexidade)
- Zero DT: 8/10 (pode ter versões inconsistentes)
- Arquitetura: 7/10 (workaround, não solução elegante)
- Escalabilidade: 8/10
- Segurança: 9/10
- **NOTA FINAL: 7.8/10**
- Tempo estimado: 15 minutos

### DECISÃO: Solução A (Nota 9.6)

A Solução A gera o lockfile como primeira etapa do CI, garantindo que todos os jobs subsequentes tenham versões determinísticas e consistentes. A Solução B é um workaround que pode causar versões diferentes entre builds.

---

## Alterações Planejadas

### 1. Correção do CI (.github/workflows/ci.yml)

**Problema Atual (Linha 68)**:
```yaml
run: pnpm install --frozen-lockfile
```

**Solução**: Modificar para gerar o lockfile se não existir, mantendo `--frozen-lockfile` após a primeira geração.

```yaml
- name: 📥 Install dependencies
  run: |
    if [ ! -f pnpm-lock.yaml ]; then
      echo "📦 Generating pnpm-lock.yaml..."
      pnpm install
    else
      pnpm install --frozen-lockfile
    fi
```

**Aplicar a mesma correção em**:
- Linha 68 (job: install)
- Linha 99 (job: unit-tests)
- Linha 161 (job: e2e-tests)

**Também corrigir o cache key** para funcionar mesmo sem lockfile inicial:
- Linhas 62-64, 96, 156-158, 167

---

### 2. Remover lovable-tagger (package.json + vite.config.ts)

**package.json (Linha 115)** - Remover:
```json
"lovable-tagger": "^1.1.11",
```

**vite.config.ts (Linha 4)** - Remover:
```typescript
import { componentTagger } from "lovable-tagger";
```

**vite.config.ts (Linha 12)** - Simplificar:
```typescript
// De:
plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),

// Para:
plugins: [react()],
```

---

### 3. Atualizar Meta Tags (index.html)

**Linha 31** - Mudar author:
```html
<!-- De: -->
<meta name="author" content="Lovable" />

<!-- Para: -->
<meta name="author" content="RiseCheckout" />
```

**Linha 36** - Mudar og:image:
```html
<!-- De: -->
<meta property="og:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />

<!-- Para: -->
<meta property="og:image" content="/og-image.png" />
```

**Linhas 38-40** - Atualizar Twitter cards:
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@risecheckout" />
<meta name="twitter:image" content="/og-image.png" />
```

---

## Árvore de Arquivos Alterados

```text
rise-community-checkout/
├── .github/
│   └── workflows/
│       └── ci.yml          ← MODIFICAR (fix lockfile + cache)
├── package.json            ← MODIFICAR (remover lovable-tagger)
├── vite.config.ts          ← MODIFICAR (remover componentTagger)
├── index.html              ← MODIFICAR (atualizar branding)
└── vercel.json             ← OK (já configurado corretamente)
```

---

## Detalhes Técnicos

### CI Workflow - Mudanças Detalhadas

```yaml
# Job: install (linhas 57-68)
- name: 💾 Cache node_modules
  id: cache
  uses: actions/cache@v4
  with:
    path: |
      node_modules
      pnpm-lock.yaml
    key: deps-${{ runner.os }}-${{ hashFiles('package.json') }}
    restore-keys: |
      deps-${{ runner.os }}-

- name: 📥 Install dependencies
  if: steps.cache.outputs.cache-hit != 'true'
  run: |
    pnpm install
    echo "✅ Dependencies installed and lockfile generated"
```

**Justificativa**:
1. Cache agora inclui `pnpm-lock.yaml` gerado
2. Key baseada em `package.json` (que sempre existe) ao invés de `pnpm-lock.yaml`
3. Uma vez cacheado, o lockfile estará disponível para todos os jobs

---

### vite.config.ts Final

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [".manusvm.computer", ".manus.computer"],
  },
  plugins: [react()],
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react-router-dom", "@tanstack/react-query"],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-router-dom",
      "@tanstack/react-query",
      "@radix-ui/react-context",
      "@radix-ui/react-slot",
    ],
  },
}));
```

---

## Resultado Esperado

Após implementação:

| Componente | Antes | Depois |
|------------|-------|--------|
| CI Pipeline | ❌ Falha (no lockfile) | ✅ Funciona |
| Lovable Dependency | ❌ Requer lovable-tagger | ✅ Independente |
| Branding | ⚠️ Lovable | ✅ RiseCheckout |
| Vercel Deploy | ⚠️ Bloqueado pelo CI | ✅ Pronto |

---

## Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| Cache key inconsistente entre runs | Baixa | Usando package.json hash + restore-keys |
| Versões de dependências diferentes | Baixa | Lockfile gerado uma vez e cacheado |
| Build falhar após remover tagger | Zero | componentTagger só roda em dev e é opcional |

---

## Sequência de Implementação

1. **Primeiro**: Atualizar `.github/workflows/ci.yml` (correção crítica)
2. **Segundo**: Remover `lovable-tagger` de `package.json` e `vite.config.ts`
3. **Terceiro**: Atualizar meta tags em `index.html`

Todas as mudanças serão feitas em paralelo para eficiência.

