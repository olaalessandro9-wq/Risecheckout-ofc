> **📅 DOCUMENTO ARQUIVADO**  
> Este documento foi movido para arquivo em 21/01/2026.  
> Para a arquitetura atual, consulte [`docs/TRACKING_MODULE.md`](../../TRACKING_MODULE.md).

---

# Integração com Utmify (ARQUIVADO)

## Visão Geral

Sistema completo de integração com a plataforma Utmify para tracking de conversões e comissões de afiliados.

## Arquitetura

```
┌─────────────────┐
│  PushingPay     │
│  (Gateway)      │
└────────┬────────┘
         │ Webhook
         ▼
┌─────────────────────────────────┐
│  /webhook-pushingpay            │
│  (Edge Function)                │
│  - Valida HMAC                  │
│  - Registra evento              │
│  - Chama Utmify se aprovado     │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  /forward-to-utmify             │
│  (Edge Function)                │
│  - Busca configuração           │
│  - Converte formato             │
│  - Envia para Utmify API        │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Utmify API     │
│  (Tracking)     │
└─────────────────┘
```

## Componentes

### 1. Tabela `vendor_integrations`

Armazena configurações de integração por vendor:

```sql
CREATE TABLE vendor_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Exemplo de config para Utmify:**
```json
{
  "api_token": "utmify_abc123xyz",
  "send_on_approved": true,
  "send_on_completed": false
}
```

---

> **Nota:** O restante deste documento foi preservado para referência histórica.  
> Para a implementação atual, consulte `docs/TRACKING_MODULE.md`.
