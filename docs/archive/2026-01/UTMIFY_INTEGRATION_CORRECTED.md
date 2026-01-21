> **📅 DOCUMENTO ARQUIVADO**  
> Este documento foi movido para arquivo em 21/01/2026.  
> Para a arquitetura atual, consulte [`docs/TRACKING_MODULE.md`](../../TRACKING_MODULE.md).

---

# Integração Utmify - Correções Aplicadas (ARQUIVADO)

## ✅ Correções Implementadas (Commit d6b76ae)

### 1. **Comissão Sempre 0 (Produtor Recebe 100%)**

**Antes (ERRADO):**
```typescript
const userCommission = order.amount_cents - gatewayFee;
```

**Depois (CORRETO):**
```typescript
const userCommission = 0; // TODO: implementar taxa configurável por produto
```

---

> **Nota:** O restante deste documento foi preservado para referência histórica.  
> Para a implementação atual, consulte `docs/TRACKING_MODULE.md`.
