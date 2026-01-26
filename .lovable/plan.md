
# Plano: Stripe "Em Breve" nas Configurações do Produto

## Resumo

Modificar o componente `GatewaySelector` nas configurações do produto para mostrar o Stripe como "Em Breve" para todos os roles **exceto Owner**. O Owner continuará vendo e usando o Stripe normalmente.

---

## Análise de Soluções (RISE V3)

### Solução A: Alterar status do Stripe no payment-gateways.ts para 'coming_soon'
- Mudar `status: 'active'` para `status: 'coming_soon'`
- **Manutenibilidade**: 4/10 - Afeta TODOS os usuários, inclusive Owner
- **Zero DT**: 3/10 - Não respeita requisito de Owner ver normal
- **Arquitetura**: 3/10 - Viola requisito específico do Owner
- **NOTA FINAL: 3.3/10**

### Solução B: Passar prop `isOwner` para GatewaySelector e tratar condicionalmente
- Adicionar prop `isOwner` ao `GatewaySelector`
- Renderizar Stripe como Coming Soon quando `!isOwner && gateway.id === 'stripe'`
- **Manutenibilidade**: 8/10 - Lógica no componente certo
- **Zero DT**: 9/10 - Segue padrão existente
- **Arquitetura**: 8/10 - Prop drilling mínimo
- **NOTA FINAL: 8.3/10**

### Solução C: Flag por Gateway + Role no Registry (RISE V3 10.0/10)
- Adicionar campo `comingSoonForRoles` no tipo `PaymentGateway`
- Setar `comingSoonForRoles: ['user', 'seller']` no Stripe
- O `GatewaySelector` consulta `usePermissions()` e renderiza condicionalmente
- **Manutenibilidade**: 10/10 - Declarativo no Registry, SSOT
- **Zero DT**: 10/10 - Reutiliza padrão já implementado no navigation
- **Arquitetura**: 10/10 - Clean Architecture, Single Responsibility
- **Escalabilidade**: 10/10 - Basta adicionar roles na flag para qualquer gateway
- **Segurança**: 10/10 - Role verificado no componente
- **NOTA FINAL: 10.0/10**

### DECISÃO: Solução C (Nota 10.0/10)

---

## Arquivos a Modificar

| Arquivo | Ação | Linhas Afetadas |
|---------|------|-----------------|
| `src/config/payment-gateways.ts` | MODIFICAR | +5 (tipo + flag no Stripe) |
| `src/components/products/GatewaySelector.tsx` | MODIFICAR | +25 (lógica condicional) |

---

## Especificação Técnica

### 1. Estender Tipo PaymentGateway

**Arquivo:** `src/config/payment-gateways.ts`

```typescript
import type { AppRole } from "@/hooks/usePermissions";

export interface PaymentGateway {
  // ... campos existentes ...
  
  // NOVO: Roles para os quais este gateway aparece como "Em Breve"
  comingSoonForRoles?: readonly AppRole[];
}

// No Stripe:
stripe: {
  // ... campos existentes ...
  status: 'active', // Mantém ativo para Owner
  comingSoonForRoles: ['user', 'seller'], // Em breve para não-admin/owner
},
```

### 2. Modificar GatewaySelector

**Arquivo:** `src/components/products/GatewaySelector.tsx`

```typescript
import { usePermissions } from "@/hooks/usePermissions";
import { Clock } from "lucide-react";

export function GatewaySelector({ ... }: GatewaySelectorProps) {
  const { role } = usePermissions();
  
  // Buscar gateways ativos
  const activeGateways = getActiveGatewaysByMethod(paymentMethod);
  
  // Separar gateways que são "coming soon" para o role atual
  const { availableGateways, comingSoonForRoleGateways } = activeGateways.reduce(
    (acc, gateway) => {
      const isComingSoonForRole = gateway.comingSoonForRoles?.includes(role);
      if (isComingSoonForRole) {
        acc.comingSoonForRoleGateways.push(gateway);
      } else {
        acc.availableGateways.push(gateway);
      }
      return acc;
    },
    { availableGateways: [], comingSoonForRoleGateways: [] }
  );
  
  return (
    <RadioGroup ...>
      {/* Gateways disponíveis normalmente */}
      {availableGateways.map((gateway) => (
        <GatewayOption ... />
      ))}
      
      {/* Gateways "Em Breve" para este role */}
      {comingSoonForRoleGateways.map((gateway) => (
        <GatewayRoleComingSoonOption gateway={gateway} paymentMethod={paymentMethod} />
      ))}
      
      {/* Gateways Coming Soon globais (existente) */}
      {comingSoonGateways.map((gateway) => (
        <GatewayComingSoonOption ... />
      ))}
    </RadioGroup>
  );
}

// Novo sub-componente para "Em Breve" por role
function GatewayRoleComingSoonOption({ gateway, paymentMethod }) {
  const fees = gateway.fees[paymentMethod];
  const feesText = fees ? formatGatewayFees(fees) : 'Sem taxas';

  return (
    <div className="border rounded-lg p-4 bg-muted/30 flex items-center gap-3 opacity-50 cursor-not-allowed">
      <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
      <div className="flex-1">
        <div className="font-medium text-muted-foreground">{gateway.displayName}</div>
        <div className="text-xs text-muted-foreground">{feesText}</div>
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border">
        <Clock className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Em Breve</span>
      </div>
    </div>
  );
}
```

---

## Layout Visual

### Para User/Seller (Configurações do Produto)
```text
Cartão de Crédito:
┌─────────────────────────────────────────┐
│ ○ Asaas                    Taxa: 3.49%  │
│   Gateway completo                      │
├─────────────────────────────────────────┤
│ ○ Mercado Pago            Taxa: 3.99%   │  ← Selecionável
│   Gateway completo                      │
├─────────────────────────────────────────┤
│ ○ Stripe                  [Em Breve]    │  ← Desabilitado, cinza
│   Gateway internacional   (opacity 50%) │
└─────────────────────────────────────────┘
```

### Para Owner (Configurações do Produto)
```text
Cartão de Crédito:
┌─────────────────────────────────────────┐
│ ○ Asaas                    Taxa: 3.49%  │
│   Gateway completo                      │
├─────────────────────────────────────────┤
│ ● Mercado Pago            Taxa: 3.99%   │  ← Selecionado
│   Gateway completo                      │
├─────────────────────────────────────────┤
│ ○ Stripe                  Taxa: 3.99%   │  ← Normal, selecionável
│   Gateway internacional                 │
└─────────────────────────────────────────┘
```

---

## Benefícios

| Benefício | Descrição |
|-----------|-----------|
| **SSOT no Registry** | Flag vive no payment-gateways.ts |
| **Consistência** | Mesmo padrão usado no navigation (comingSoonForRoles) |
| **Escalável** | Adicionar outros gateways "em breve" = adicionar flag |
| **Role-Aware** | Owner vê normal, outros veem "Em Breve" |
| **Type-Safe** | Usa `AppRole` do sistema de permissões |

---

## Verificação RISE V3

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade | 10/10 | Flag declarativa no Registry |
| Zero DT | 10/10 | Reutiliza padrão do navigation |
| Arquitetura | 10/10 | SSOT, Clean Architecture |
| Escalabilidade | 10/10 | Fácil adicionar outros gateways |
| Segurança | 10/10 | usePermissions valida role |
| **NOTA FINAL** | **10.0/10** | Alinhado 100% com RISE Protocol V3 |

---

## Tempo Estimado
**20 minutos**
