
# Plano: Adicionar Badge "Em Breve" no Stripe (Gateways)

## Resumo

Marcar o gateway Stripe como "Em Breve" em todo o sistema, mostrando badge visual e desabilitando interações. A alteração será feita no **Gateway Registry** (SSOT) e os componentes reagirão automaticamente.

---

## Análise de Soluções (RISE V3)

### Solução A: Hard-code no componente OwnerGatewayCard
- Adicionar lógica `if (name === 'Stripe')` no componente
- **Manutenibilidade**: 3/10 - Viola DRY, lógica espalhada
- **Zero DT**: 2/10 - Hard-code de nome
- **Arquitetura**: 2/10 - Ignora o Gateway Registry
- **NOTA FINAL: 2.3/10**

### Solução B: Usar status existente no GATEWAY_REGISTRY (SSOT)
- Alterar `status: 'active'` → `status: 'coming_soon'` no Stripe
- Passar `status` para os componentes
- Componentes renderizam badge "Em Breve" e desabilitam interação quando `status === 'coming_soon'`
- **Manutenibilidade**: 10/10 - SSOT respeitado
- **Zero DT**: 10/10 - Usa tipo já existente `GatewayStatus`
- **Arquitetura**: 10/10 - Clean Architecture
- **Escalabilidade**: 10/10 - Basta mudar status no Registry para qualquer gateway
- **Segurança**: 10/10 - N/A
- **NOTA FINAL: 10.0/10**

### DECISÃO: Solução B (Nota 10.0/10)

---

## Arquivos a Modificar

| Arquivo | Ação | Linhas |
|---------|------|--------|
| `src/config/gateways/registry.ts` | MODIFICAR | +1 (status do Stripe) |
| `src/components/financeiro/OwnerGatewayCard.tsx` | MODIFICAR | +15 |
| `src/components/financeiro/PaymentCard.tsx` | MODIFICAR | +20 |
| `src/pages/owner/OwnerGateways.tsx` | MODIFICAR | +2 (passar status) |
| `src/modules/financeiro/components/GatewayList.tsx` | MODIFICAR | +2 (passar status) |

---

## Especificação Técnica

### 1. Alterar Status do Stripe no Registry

**Arquivo:** `src/config/gateways/registry.ts`

```typescript
stripe: {
  id: 'stripe',
  integrationType: 'STRIPE',
  name: 'Stripe',
  description: 'Cartão de Crédito e PIX',
  icon: CreditCard,
  iconColor: '#635BFF',
  status: 'coming_soon', // ALTERADO de 'active'
  // ... resto permanece igual
}
```

### 2. Modificar OwnerGatewayCard

**Arquivo:** `src/components/financeiro/OwnerGatewayCard.tsx`

```typescript
interface OwnerGatewayCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  status?: GatewayStatus; // NOVO
}

export function OwnerGatewayCard({
  name,
  description,
  icon: Icon,
  iconColor = "#6366f1",
  status = 'active', // NOVO - default para retrocompatibilidade
}: OwnerGatewayCardProps) {
  const isComingSoon = status === 'coming_soon';
  
  return (
    <div className={cn(
      "relative flex items-center gap-4 p-5 rounded-lg border border-border bg-card w-full",
      isComingSoon && "opacity-60"
    )}>
      {/* ... ícone e conteúdo ... */}
      
      {/* Badges condicionais */}
      {isComingSoon ? (
        <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            Em Breve
          </span>
        </div>
      ) : (
        <>
          {/* Badges existentes: Integrado via Secrets + Produção */}
        </>
      )}
    </div>
  );
}
```

### 3. Modificar PaymentCard

**Arquivo:** `src/components/financeiro/PaymentCard.tsx`

```typescript
interface PaymentCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  connected?: boolean;
  status?: GatewayStatus; // NOVO
  onClick: () => void;
}

export function PaymentCard({ 
  name, 
  description, 
  icon: Icon, 
  iconColor = "#6366f1",
  connected = false,
  status = 'active', // NOVO
  onClick 
}: PaymentCardProps) {
  const isComingSoon = status === 'coming_soon';
  
  return (
    <button
      onClick={isComingSoon ? undefined : onClick} // Desabilita clique
      disabled={isComingSoon}
      className={cn(
        "group relative flex items-center gap-4 p-5 rounded-lg border ...",
        isComingSoon && "opacity-60 cursor-not-allowed hover:scale-100"
      )}
    >
      {/* ... conteúdo ... */}
      
      {/* Status Badge */}
      {isComingSoon ? (
        <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Em Breve</span>
        </div>
      ) : connected ? (
        // Badge Conectado existente
      ) : (
        // Badge Não Conectado existente
      )}
      
      {/* Seta - esconde quando coming_soon */}
      {!isComingSoon && (
        <div className="flex-shrink-0 ...">
          <svg ... />
        </div>
      )}
    </button>
  );
}
```

### 4. Atualizar Componentes Consumidores

**OwnerGateways.tsx:**
```typescript
<OwnerGatewayCard
  key={gatewayId}
  name={gateway.name}
  description={gateway.description}
  icon={gateway.icon}
  iconColor={gateway.iconColor}
  status={gateway.status} // NOVO
/>
```

**GatewayList.tsx:**
```typescript
<PaymentCard
  key={gatewayId}
  name={gateway.name}
  description={gateway.description}
  icon={gateway.icon}
  iconColor={gateway.iconColor}
  connected={status.connected}
  status={gateway.status} // NOVO
  onClick={() => onSelect(gatewayId)}
/>
```

---

## Layout Visual

### OwnerGateways - Stripe "Em Breve"
```text
┌─────────────────────────────────────────────────────────────────┐
│  [💳] Stripe                           [Em Breve] (cinza)       │
│       Cartão de Crédito e PIX          (sem badges verdes)      │
│       (opacity: 60%)                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Gateways Ativos (mantém comportamento atual)
```text
┌─────────────────────────────────────────────────────────────────┐
│  [💳] Asaas         [✓ Integrado via Secrets] [✓ Produção]    │
│       PIX e Cartão de Crédito                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Dados (SSOT)

```text
GATEWAY_REGISTRY (SSOT)
    │
    ├── stripe.status = 'coming_soon'
    │
    ▼
OwnerGateways.tsx
    │
    └── gateway.status → OwnerGatewayCard
            │
            └── status === 'coming_soon' → Render "Em Breve" badge
                                         → opacity: 60%
                                         → Sem badges de "Produção"
```

---

## Benefícios

| Benefício | Descrição |
|-----------|-----------|
| **SSOT Respeitado** | Status vive no Gateway Registry |
| **Zero Duplicação** | Uma alteração no Registry afeta toda a UI |
| **Escalável** | Para adicionar outro gateway "em breve", basta mudar status |
| **Type-Safe** | Usa `GatewayStatus` já definido |
| **Retrocompatível** | Default `status = 'active'` mantém gateways existentes |

---

## Verificação RISE V3

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade | 10/10 | SSOT no Registry, componentes reagem |
| Zero DT | 10/10 | Usa tipo existente `GatewayStatus` |
| Arquitetura | 10/10 | Clean Architecture, Single Source of Truth |
| Escalabilidade | 10/10 | Mudar qualquer gateway = mudar 1 linha |
| Segurança | 10/10 | N/A para esta feature |
| **NOTA FINAL** | **10.0/10** | Alinhado 100% com RISE Protocol V3 |

---

## Tempo Estimado
**20 minutos**
