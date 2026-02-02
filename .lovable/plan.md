

# Atualizar rise-api-proxy.js para Versao de Seguranca

## Problema Identificado

O arquivo `docs/cloudflare-worker/rise-api-proxy.js` no repositorio ainda contem vulnerabilidades de seguranca:

### Codigo Atual (VULNERAVEL)

```javascript
// Lines 11-15: EXPLICIT_ORIGINS com dominios externos
const EXPLICIT_ORIGINS = [
  "https://biz-bridge-bliss.lovable.app",
  "https://kindred-sell-hub.lovable.app",
];

// Lines 20-21: Verifica origens explicitas
if (EXPLICIT_ORIGINS.includes(origin)) return true;

// Lines 37-38: Permite QUALQUER .lovable.app (FALHA CRITICA)
if (origin.endsWith(".lovable.app")) return true;
```

### Riscos

| Vulnerabilidade | Impacto |
|-----------------|---------|
| `*.lovable.app` wildcard | Qualquer projeto Lovable pode fazer requests |
| EXPLICIT_ORIGINS | Dominios desnecessarios permitidos |

## Solucao

Atualizar o arquivo para a versao de producao deployada na Cloudflare, removendo:

1. Array `EXPLICIT_ORIGINS` (deletar completamente)
2. Check de `EXPLICIT_ORIGINS.includes(origin)` (deletar)
3. Check de `.lovable.app` wildcard (deletar)

### Codigo Final (SEGURO)

```javascript
function isAllowedOrigin(origin) {
  if (!origin) return false;
  
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    
    // UNICA REGRA: risecheckout.com e *.risecheckout.com
    if (hostname === MAIN_DOMAIN) return true;
    if (hostname.endsWith("." + MAIN_DOMAIN)) return true;
  } catch (e) {
    return false;
  }
  
  return false;
}
```

## Mudancas Especificas

| Linha(s) | Acao | Descricao |
|----------|------|-----------|
| 11-15 | DELETE | Remover `EXPLICIT_ORIGINS` array |
| 17-41 | REPLACE | Reescrever `isAllowedOrigin()` simplificada |

## Resultado

O repositorio ficara sincronizado com a versao de producao deployada na Cloudflare, garantindo:

- Somente `risecheckout.com` e `*.risecheckout.com` podem fazer requests
- Zero dominios externos permitidos
- Codigo documentado em sync com infraestrutura

---

## Secao Tecnica

### Arquivo a Modificar

`docs/cloudflare-worker/rise-api-proxy.js`

### Diff Previsto

```diff
- // Origins explicitamente permitidos (para dominios externos)
- const EXPLICIT_ORIGINS = [
-   "https://biz-bridge-bliss.lovable.app",
-   "https://kindred-sell-hub.lovable.app",
- ];
-
  function isAllowedOrigin(origin) {
    if (!origin) return false;
-   
-   // 1. Verificar origens explicitas
-   if (EXPLICIT_ORIGINS.includes(origin)) return true;
-   
-   // 2. Permitir qualquer subdominio de risecheckout.com (incluindo www)
+
    try {
      const url = new URL(origin);
      const hostname = url.hostname;
-     
-     // Match exato do dominio root
+
+     // Permitir risecheckout.com e *.risecheckout.com
      if (hostname === MAIN_DOMAIN) return true;
-     
-     // Match de qualquer subdominio (*.risecheckout.com)
      if (hostname.endsWith("." + MAIN_DOMAIN)) return true;
    } catch (e) {
      return false;
    }
-   
-   // 3. Permitir previews do Lovable (*.lovable.app)
-   if (origin.endsWith(".lovable.app")) return true;
-   
+
    return false;
  }
```

