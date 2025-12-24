# Mercado Pago Gateway Module

**Módulo**: `src/integrations/gateways/mercadopago`  
**Status**: ✅ Completo e Funcional  
**Versão**: 2.0 (Refatorado)

---

## 📋 Visão Geral

Este módulo implementa a integração completa do **Mercado Pago Gateway** no RiseCheckout seguindo a arquitetura modular baseada em Feature Folders. O Mercado Pago é o gateway de pagamento principal, suportando cartão de crédito e PIX.

### Estrutura do Módulo

```
src/integrations/gateways/mercadopago/
├── index.ts              # Barrel export (interface pública)
├── types.ts              # Tipos e interfaces TypeScript
├── api.ts                # Chamadas de API
├── hooks.ts              # Hooks React customizados
├── Brick.tsx             # Componente Brick (API de alto nível)
├── components/
│   └── CardForm.tsx      # Formulário customizado (API de baixo nível)
└── README.md             # Este arquivo
```

---

## 🚀 Como Usar

### 1. Import Centralizado

```typescript
import * as MercadoPago from "@/integrations/gateways/mercadopago";
```

### 2. Carregar Configuração

```typescript
const { data: mpIntegration } = MercadoPago.useMercadoPagoConfig(vendorId);
```

### 3. Verificar Disponibilidade

```typescript
const isAvailable = MercadoPago.useMercadoPagoAvailable(mpIntegration);
```

### 4. Inicializar Mercado Pago

```typescript
const isInitialized = MercadoPago.useMercadoPagoInit(mpIntegration?.config?.public_key);
```

### 5. Renderizar Formulário de Cartão

#### Opção A: CardForm (Recomendado para Checkout)

Formulário customizado com controle total sobre validação e UX.

```typescript
const cardFormRef = useRef<MercadoPago.CardFormRef>(null);

// Renderizar
<MercadoPago.CardForm
  ref={cardFormRef}
  amount={amount}
  mercadoPagoPublicKey={mpIntegration.config.public_key}
  payerEmail={email}
  loading={processing}
  onSubmit={handleCardSubmit}
/>

// Submeter de fora
await cardFormRef.current?.submit();
```

**Características:**
- ✅ Controle total sobre validação
- ✅ Campos customizados (Nome, CPF)
- ✅ Seleção manual de parcelas
- ✅ Ref para submit externo
- ✅ Validação granular por campo

#### Opção B: Brick (Para Casos Simples)

Componente oficial do Mercado Pago com menos customização.

```typescript
<MercadoPago.Brick
  integration={mpIntegration}
  onPaymentReady={() => console.log("Pronto")}
  onPaymentSubmit={(data) => handlePayment(data)}
  onPaymentError={(error) => console.error(error)}
/>
```

**Características:**
- ✅ Implementação rápida
- ✅ API oficial do MP
- ⚠️ Menos controle sobre UX
- ⚠️ Sem ref para submit externo

### 6. Processar Pagamento

```typescript
const result = await MercadoPago.processPayment(
  vendorId,
  orderId,
  token,
  paymentMethodId,
  installments,
  amount,
  email
);
```

---

## 📚 Documentação Detalhada

### types.ts

Define as interfaces TypeScript:

- **MercadoPagoConfig**: Configuração (Public Key, Access Token)
- **MercadoPagoIntegration**: Integração do vendedor
- **MercadoPagoPaymentResponse**: Resposta de pagamento
- **CardFormRef**: Interface para ref do CardForm

### api.ts

Funções para interagir com a API:

- `createPreference()` - Cria preferência de pagamento (PIX)
- `processPayment()` - Processa pagamento com cartão
- `getPayment()` - Obtém informações de um pagamento
- `isValidConfig()` - Valida configuração
- `initializeMercadoPago()` - Inicializa SDK

### hooks.ts

Hooks React:

- `useMercadoPagoConfig(vendorId)` - Carregar config do banco (cache 5 min)
- `useMercadoPagoInit(publicKey)` - Inicializar SDK
- `useMercadoPagoAvailable(integration)` - Verificar disponibilidade
- `useMercadoPagoBrick(props)` - Hook para CardForm (baixo nível)

### components/CardForm.tsx

Componente de formulário customizado:

- Usa Card Form API do Mercado Pago (baixo nível)
- Campos: Número, Validade, CVV, Nome, CPF, Parcelas
- Validação granular por campo
- Ref para submit externo
- Formatação automática de CPF/CNPJ

### Brick.tsx

Componente Brick oficial:

- Usa Brick Builder API do Mercado Pago (alto nível)
- Renderiza formulário completo gerenciado pelo MP
- Callbacks para eventos (onReady, onSubmit, onError)

---

## 🔧 Configuração no Banco de Dados

A configuração é armazenada em `vendor_integrations`:

```json
{
  "vendor_id": "uuid-do-vendedor",
  "integration_type": "MERCADOPAGO_GATEWAY",
  "active": true,
  "config": {
    "public_key": "APP_USR-1234567890...",
    "access_token": "APP_USR-...",
    "enabled": true
  }
}
```

### Campos

- **public_key**: Public Key do Mercado Pago (obrigatório, frontend)
- **access_token**: Access Token (obrigatório, backend only)
- **enabled**: Se o gateway está ativado

---

## 💳 Fluxo de Pagamento com Cartão

```
PublicCheckout.tsx
    ↓
useMercadoPagoConfig(vendorId)
    ↓ (Query ao Supabase)
vendor_integrations table
    ↓
useMercadoPagoInit(publicKey)
    ↓
PaymentSection.tsx
    ↓
<MercadoPago.CardForm ref={...} />
    ↓
useMercadoPagoBrick() hook
    ↓
Formulário renderizado (iframes do MP)
    ↓
cardFormRef.current.submit()
    ↓
Token gerado pelo SDK
    ↓
processPayment(...) via Edge Function
    ↓
API do Mercado Pago
    ↓
Resposta de pagamento
```

---

## 🔄 Histórico de Migração

### v2.0 (29/11/2025) - Refatoração Completa

**Migrado de:**
- `src/hooks/useMercadoPagoBrick.ts` → `hooks.ts`
- `src/components/payment/CustomCardForm.tsx` → `components/CardForm.tsx`

**Mudanças:**
- ✅ Organização modular completa
- ✅ Barrel export em `index.ts`
- ✅ Documentação atualizada
- ✅ Dois componentes disponíveis (CardForm e Brick)
- ✅ Imports centralizados via namespace

**Arquivos removidos:**
- ❌ `src/hooks/useMercadoPagoBrick.ts`
- ❌ `src/components/payment/CustomCardForm.tsx`
- ❌ Backups `CustomCardForm.tsx.backup-*`

### v1.0 (Anterior) - Estrutura Inicial

- Criação da estrutura base
- Implementação do Brick.tsx
- Hooks básicos

---

## 🧪 Testes

### Teste 1: Verificar SDK Carregada

```javascript
// Console do navegador
console.log(window.MercadoPago);
// Deve retornar: ƒ MercadoPago(...)
```

### Teste 2: Verificar Logs

```javascript
// Console do navegador
// Procure por:
// [MercadoPago] ✅ SDK carregada e inicializada
// [useMercadoPagoBrick] Inicializando SDK...
```

### Teste 3: Testar Pagamento

1. Preencher formulário com cartão de teste
2. Verificar validação de campos
3. Submeter pagamento
4. Verificar criação do pedido no banco

**Cartões de Teste:**
- Aprovado: `5031 4332 1540 6351` (CVV: 123, Validade: qualquer futura)
- Recusado: `5031 7557 3453 0604`

---

## 🔐 Segurança

- ✅ Public Key armazenada no banco (RLS protegido)
- ✅ Access Token armazenado no banco (backend only)
- ✅ Tokenização de cartão via SDK (dados sensíveis não trafegam)
- ✅ Chamadas de pagamento via Edge Function (backend)
- ✅ RLS protege dados de outros vendedores
- ⚠️ **TODO**: Criptografar Access Token no banco

---

## 🐛 Troubleshooting

### Problema: "Integração não encontrada"
**Solução**: Verificar se existe registro em `vendor_integrations` com `integration_type="MERCADOPAGO_GATEWAY"` e `active=true`

### Problema: "Formulário não renderiza"
**Solução**: 
1. Verificar se `public_key` está correto
2. Verificar console para logs de erro
3. Verificar se SDK foi carregada (`window.MercadoPago`)

### Problema: "MercadoPago SDK não está carregada"
**Solução**: 
1. Verificar se script foi carregado (Network tab)
2. Verificar bloqueadores de script
3. Verificar console para erros de rede

### Problema: "Validação falhou sem erros"
**Solução**: 
1. Verificar se todos os campos obrigatórios estão preenchidos
2. Verificar formato de CPF/CNPJ
3. Verificar seleção de parcelas

---

## 📝 Changelog

### v2.0 (29/11/2025)
- ✅ Migração completa para arquitetura modular
- ✅ CardForm movido para `components/`
- ✅ useMercadoPagoBrick integrado em `hooks.ts`
- ✅ Documentação atualizada
- ✅ Limpeza de arquivos obsoletos

### v1.0 (Anterior)
- ✅ Implementação inicial
- ✅ Suporte a Brick (Cartão)
- ✅ Suporte a Preferências (PIX)

---

## 👨‍💻 Autor

Implementado como parte da Refatoração Modular do RiseCheckout.

**Arquitetura**: Feature Folders  
**Padrão**: Barrel Exports  
**Status**: ✅ Produção

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte este README
2. Verifique `types.ts` para interfaces
3. Leia código comentado em cada arquivo
4. Consulte documentação oficial do Mercado Pago
