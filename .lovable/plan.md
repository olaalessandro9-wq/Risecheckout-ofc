
# Permitir Owner Conectar Mercado Pago via OAuth

## Problema

O Owner precisa trocar sua conta Mercado Pago, mas a pagina `OwnerGateways.tsx` e somente leitura (exibe cards estaticos sem botao de conexao). Alem disso, o backend tem uma inconsistencia critica: a Edge Function `mercadopago-create-payment` ja busca credenciais do Vault primeiro (e funcionaria com OAuth), mas a Edge Function `mercadopago-webhook` usa `getGatewayCredentials()` que para o Owner **sempre** busca dos Secrets, ignorando completamente o Vault/vendor_integrations.

## Analise de Solucoes

### Solucao A: Redirecionar Owner para a pagina de Vendors (Financeiro)

- Manutenibilidade: 4/10 -- confunde responsabilidades entre Owner e Vendor
- Zero DT: 3/10 -- Owner usando fluxo de Vendor cria ambiguidade sobre fonte de credenciais
- Arquitetura: 3/10 -- viola separacao de responsabilidades Owner vs Vendor
- Escalabilidade: 4/10 -- futuras mudancas no fluxo Vendor afetam Owner
- Seguranca: 8/10
- **NOTA FINAL: 4.0/10**

### Solucao B: Adicionar botao OAuth exclusivo para MercadoPago na pagina OwnerGateways + unificar backend

- Manutenibilidade: 10/10 -- Owner tem seu proprio fluxo, independente do Vendor
- Zero DT: 10/10 -- backend unificado: Vault > Secrets (cascata consistente)
- Arquitetura: 10/10 -- respeita separacao Owner/Vendor, backend usa single credential resolution strategy
- Escalabilidade: 10/10 -- padrao extensivel para qualquer gateway futuro que precise OAuth
- Seguranca: 10/10 -- OAuth e mais seguro que secrets estaticos, Vault tem audit logging
- **NOTA FINAL: 10.0/10**

### DECISAO: Solucao B (Nota 10.0)

A Solucao A e inferior porque mistura responsabilidades entre Owner e Vendor, criando acoplamento indesejado e confusao sobre qual fonte de credenciais esta ativa.

## O que sera feito

### 1. Backend: Unificar resolucao de credenciais em `gateway-credentials.ts`

**Arquivo:** `supabase/functions/_shared/gateway-credentials.ts`

Atualmente, o bloco `if (isOwner)` vai direto para Secrets. A mudanca introduz uma **cascata de prioridade para MercadoPago do Owner**:

1. Primeiro, tenta buscar do Vault (via `getVendorCredentials`) -- caso o Owner tenha conectado via OAuth
2. Se nao encontrar no Vault, faz fallback para os Secrets globais (comportamento atual)

Para os demais gateways (asaas, pushinpay, stripe), o comportamento permanece identico: somente Secrets.

Isso resolve a inconsistencia onde `mercadopago-create-payment` ja usava Vault-first mas `mercadopago-webhook` nao.

### 2. Frontend: Adicionar botao OAuth para MercadoPago no `OwnerGatewayCard`

**Arquivo:** `src/components/financeiro/OwnerGatewayCard.tsx`

Adicionar prop opcional `onConnect` que, quando presente, renderiza um botao "Reconectar" ao lado dos badges. Somente o card do Mercado Pago tera esse botao.

### 3. Frontend: Integrar hook de conexao OAuth na pagina `OwnerGateways.tsx`

**Arquivo:** `src/pages/owner/OwnerGateways.tsx`

- Importar e usar `useMercadoPagoConnection` (mesmo hook que os Vendors usam)
- Passar `onConnect` para o `OwnerGatewayCard` do MercadoPago
- Apos conexao bem-sucedida, exibir toast de confirmacao

### 4. Backend: Garantir que o webhook tambem resolve corretamente

Como o `mercadopago-webhook` usa `getGatewayCredentials`, a mudanca no passo 1 automaticamente corrige o webhook. Nenhuma alteracao adicional necessaria no webhook.

## Secao Tecnica

### Arquivos alterados (3 arquivos, 0 criados, 0 deletados)

```text
supabase/functions/_shared/gateway-credentials.ts   (cascata Vault > Secrets para Owner + MercadoPago)
src/components/financeiro/OwnerGatewayCard.tsx       (prop onConnect + botao Reconectar)
src/pages/owner/OwnerGateways.tsx                    (integrar hook OAuth para MercadoPago)
```

### Detalhe da mudanca em `gateway-credentials.ts`

No bloco `if (isOwner)`, especificamente para `case 'mercadopago'`:

```text
ANTES:
  case 'mercadopago': {
    const secrets = OWNER_GATEWAY_SECRETS.mercadopago;
    const accessToken = Deno.env.get(secrets.accessToken);
    // ... retorna credentials dos Secrets
  }

DEPOIS:
  case 'mercadopago': {
    // PRIORIDADE 1: Vault (OAuth) -- Owner pode ter conectado via OAuth
    const vaultResult = await getVendorCredentials(supabase, vendorId, 'mercadopago');
    if (vaultResult.success && vaultResult.credentials?.access_token) {
      credentials.access_token = vaultResult.credentials.access_token;
      credentials.accessToken = vaultResult.credentials.access_token;
      // Buscar collector_id do vendor_integrations
      const { data: vi } = await supabase
        .from('vendor_integrations')
        .select('config')
        .eq('vendor_id', vendorId)
        .eq('integration_type', 'MERCADOPAGO')
        .eq('active', true)
        .maybeSingle();
      if (vi?.config) {
        const viConfig = vi.config as Record<string, unknown>;
        credentials.collector_id = viConfig.user_id as string || viConfig.collector_id as string;
        credentials.collectorId = credentials.collector_id;
      }
      credentials.source = 'vendor_integration'; // indica que veio do OAuth
      break;
    }

    // PRIORIDADE 2: Secrets globais (fallback)
    const secrets = OWNER_GATEWAY_SECRETS.mercadopago;
    const accessToken = Deno.env.get(secrets.accessToken);
    // ... comportamento atual mantido integralmente
  }
```

### Detalhe da mudanca em `OwnerGatewayCard.tsx`

```text
interface OwnerGatewayCardProps {
  // ... props existentes
  onConnect?: () => void;       // Callback para reconexao OAuth
  connecting?: boolean;         // Estado de loading durante OAuth
}

// Renderiza botao "Reconectar" apenas quando onConnect esta presente
```

### Detalhe da mudanca em `OwnerGateways.tsx`

```text
import { useMercadoPagoConnection } from "@/integrations/gateways/mercadopago/hooks/useMercadoPagoConnection";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

// Dentro do componente:
const { user } = useUnifiedAuth();
const { connectingOAuth, handleConnectOAuth } = useMercadoPagoConnection({
  userId: user?.id,
  onConnectionChange: () => toast.success('Mercado Pago reconectado!'),
});

// No map de gateways, para mercadopago:
<OwnerGatewayCard
  ...
  onConnect={gatewayId === 'mercadopago' ? handleConnectOAuth : undefined}
  connecting={gatewayId === 'mercadopago' ? connectingOAuth : false}
/>
```

### Fluxo apos implementacao

```text
[Owner clica "Reconectar"] 
  --> [init-oauth (backend gera URL + state)]
  --> [Popup MercadoPago abre]
  --> [Usuario autoriza nova conta]
  --> [mercadopago-oauth-callback]
    --> [Salva access_token no Vault]
    --> [Salva metadados em vendor_integrations]
  --> [Redirect success]

[Pagamento futuro]
  --> [mercadopago-create-payment] 
    --> [getVendorCredentials (Vault)] --> ENCONTRA --> usa OAuth token
  
  --> [mercadopago-webhook]
    --> [getGatewayCredentials]
      --> [isOwner + mercadopago]
        --> [Vault PRIMEIRO] --> ENCONTRA --> usa OAuth token
        --> [Se nao: fallback para Secrets]
```

### Impacto

- Os demais gateways (Asaas, PushinPay, Stripe) continuam exclusivamente via Secrets para o Owner
- A cascata Vault > Secrets garante retrocompatibilidade: se o Owner nunca conectou via OAuth, os Secrets continuam funcionando normalmente
- O webhook passa a usar as credenciais corretas (da nova conta) automaticamente
- Zero breaking changes para Vendors (fluxo deles permanece identico)
