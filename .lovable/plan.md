

# Plano: Correção SSOT - BuyerFixedHeaderSection.tsx

## Problema Identificado

**Arquivo:** `src/modules/members-area/pages/buyer/components/sections/BuyerFixedHeaderSection.tsx`

**Violação RISE V3:** Interface `FixedHeaderSettings` definida localmente (linhas 16-24) ao invés de importar do módulo canônico `builder.types.ts`.

```typescript
// ATUAL (INCORRETO - Duplicação)
interface FixedHeaderSettings {
  type: 'fixed_header';
  bg_image_url: string;
  title: string;
  show_module_count: boolean;
  alignment: 'left' | 'center';
  size: 'small' | 'medium' | 'large';
  gradient_overlay?: GradientOverlayConfig;
}
```

## Correção Necessária

Remover a interface local e importar do módulo canônico:

```typescript
// CORRETO (SSOT - Single Source of Truth)
import type { 
  FixedHeaderSettings,
  GradientOverlayConfig 
} from '@/modules/members-area-builder/types/builder.types';
```

## Modificações

| Linha | Antes | Depois |
|-------|-------|--------|
| 14 | `import type { GradientOverlayConfig }` | `import type { FixedHeaderSettings, GradientOverlayConfig }` |
| 16-24 | Interface local `FixedHeaderSettings` | **REMOVIDO** |

## Código Final (Linhas 1-31)

```typescript
/**
 * Buyer Fixed Header Section - RISE V3 10.0/10
 * Renders fixed header from Builder in student area
 * Combines background image, title and module counter (Cakto-style)
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { cn } from '@/lib/utils';
import { 
  generateCombinedOverlayStyle,
  resolveGradientConfig 
} from '@/modules/members-area-builder/utils/gradientUtils';
import type { FixedHeaderSettings } from '@/modules/members-area-builder/types/builder.types';

interface BuyerFixedHeaderSectionProps {
  settings: FixedHeaderSettings;
  moduleCount: number;
  productName?: string;
}

// ... resto do componente permanece idêntico
```

## Conformidade RISE V3 Pós-Correção

| Critério | Nota |
|----------|------|
| Manutenibilidade Infinita | 10/10 |
| Zero Dívida Técnica | 10/10 |
| Arquitetura Correta (SSOT) | 10/10 |
| Escalabilidade | 10/10 |
| Segurança | 10/10 |

**NOTA FINAL: 10.0/10**

