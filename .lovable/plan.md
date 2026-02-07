
# Correcao: Componentes Mobile Nao Renderizados no Checkout Publico

## Diagnostico (Causa Raiz Confirmada)

O cronometro adicionado no builder mobile esta **corretamente persistido no banco de dados**. Confirmado via query direta:

```text
checkout_id: 5884a6c4-42d7-40c7-9790-c4a274745046
is_mobile_synced: false
mobile_top_components: [{ type: "timer", id: "component-1770422671347-...", content: {...} }]
top_components: [] (desktop vazio)
```

O problema esta em **3 camadas** do pipeline de dados no frontend que **descartam silenciosamente** os campos `mobile_top_components` e `mobile_bottom_components`:

### Camada 1: Zod Schema (Contract)
O `CheckoutSchema` em `resolveAndLoadResponse.schema.ts` define os campos do checkout que sao aceitos. Os campos `mobile_top_components` e `mobile_bottom_components` **NAO estao declarados**. O `z.object()` do Zod remove chaves desconhecidas por padrao (`strip` mode), entao esses campos sao **silenciosamente descartados** durante a validacao do response da API.

### Camada 2: Interface TypeScript (UI Model)
O `CheckoutUIModel` em `mapResolveAndLoad.ts` nao declara `mobile_top_components` nem `mobile_bottom_components`.

### Camada 3: Mapper (Object Construction)
A funcao `mapResolveAndLoad` constroi o objeto `checkoutUI` explicitamente campo a campo (linhas 185-199) e nao inclui os campos mobile.

### Resultado
Quando o `CheckoutPublicContent.tsx` tenta acessar:
```text
const checkoutAny = checkout as unknown as Record<string, unknown>;
const mobileTopRaw = checkoutAny.mobile_top_components; // SEMPRE undefined!
```
O campo nao existe no objeto porque foi removido 3 camadas antes. O `hasMobileComponents` e sempre `false`, entao o checkout publico **sempre usa os componentes desktop**, ignorando completamente o layout mobile independente.

## O Que Sera Feito

### 1. Adicionar campos mobile ao Zod Schema (Contract)

**Arquivo:** `src/modules/checkout-public/contracts/resolveAndLoadResponse.schema.ts`

Adicionar `mobile_top_components` e `mobile_bottom_components` ao `CheckoutSchema`:
```text
mobile_top_components: z.unknown().nullable().optional(),
mobile_bottom_components: z.unknown().nullable().optional(),
```
Ambos opcionais para nao quebrar checkouts antigos que nao tem esses campos.

### 2. Adicionar campos mobile ao UI Model (Interface)

**Arquivo:** `src/modules/checkout-public/mappers/mapResolveAndLoad.ts`

Adicionar ao `CheckoutUIModel`:
```text
mobile_top_components?: unknown[];
mobile_bottom_components?: unknown[];
```

### 3. Mapear campos mobile no Mapper

**Arquivo:** `src/modules/checkout-public/mappers/mapResolveAndLoad.ts`

Na construcao do `checkoutUI` (linhas 185-199), adicionar:
```text
mobile_top_components: parseJsonSafely(checkout.mobile_top_components, []),
mobile_bottom_components: parseJsonSafely(checkout.mobile_bottom_components, []),
```

### 4. Eliminar cast inseguro no CheckoutPublicContent

**Arquivo:** `src/modules/checkout-public/components/CheckoutPublicContent.tsx`

Remover o cast `as unknown as Record<string, unknown>` e acessar os campos diretamente do `checkout` tipado, agora que eles existem na interface:
```text
// ANTES (inseguro):
const checkoutAny = checkout as unknown as Record<string, unknown>;
const mobileTopRaw = checkoutAny.mobile_top_components;

// DEPOIS (tipado):
const mobileTopRaw = checkout.mobile_top_components;
const mobileBottomRaw = checkout.mobile_bottom_components;
```

## Secao Tecnica

### Arquivos alterados (3 arquivos)

```text
src/modules/checkout-public/contracts/resolveAndLoadResponse.schema.ts  (Zod schema)
src/modules/checkout-public/mappers/mapResolveAndLoad.ts                (interface + mapper)
src/modules/checkout-public/components/CheckoutPublicContent.tsx        (remover cast inseguro)
```

### Fluxo corrigido

```text
[API Response]
  mobile_top_components: [{timer}]
  mobile_bottom_components: []
       |
       v
[Zod Validation] -- ANTES: campos removidos (strip mode)
                 -- DEPOIS: campos preservados (declarados no schema)
       |
       v
[Mapper] -- ANTES: campos nao mapeados para CheckoutUIModel
         -- DEPOIS: campos explicitamente mapeados
       |
       v
[CheckoutPublicContent] -- ANTES: cast inseguro, sempre undefined
                        -- DEPOIS: acesso direto tipado, dados presentes
       |
       v
[isMobileDevice && hasMobileComponents] --> TRUE no mobile
       |
       v
[Renderiza componentes mobile (cronometro)]
```

### Impacto

- Zero breaking changes para checkouts existentes (campos opcionais com default [])
- O checkout desktop continua usando `top_components` / `bottom_components`
- Apenas dispositivos mobile (viewport < 768px) com componentes mobile independentes serao afetados
- Checkouts com `is_mobile_synced: true` continuam sem mobile_top/bottom (arrays vazios no banco), logo o fallback para desktop funciona normalmente
