# Análise da Arquitetura Atual - ProductEdit.tsx

**Data:** 30 de Novembro de 2025  
**Arquivo Analisado:** `src/pages/ProductEdit.tsx`  
**Linhas de Código:** 1.828 linhas

---

## 1. Visão Geral do Problema

O arquivo `ProductEdit.tsx` é um **monólito de 1.828 linhas** que gerencia todas as abas de edição de produtos. Ele está fazendo o papel de "telefonista", passando dados entre abas através de props e estados locais.

### Abas Existentes (8 abas)

1. **Geral** - Informações básicas do produto
2. **Configurações** - Configurações de pagamento e checkout
3. **Order Bump** - Produtos adicionais
4. **Upsell / Downsell** - Ofertas pós-compra
5. **Checkout** - Páginas de checkout personalizadas
6. **Cupons** - Cupons de desconto
7. **Afiliados** - Sistema de afiliação
8. **Links** - Links de pagamento

---

## 2. Problemas Identificados

### 2.1 Estados Locais Excessivos

**Total de `useState` encontrados:** 35 estados diferentes

**Categorias de Estados:**

#### Estados da Aba Geral (7 estados)
```typescript
const [generalData, setGeneralData] = useState({...});
const [generalModified, setGeneralModified] = useState(false);
const [imageModified, setImageModified] = useState(false);
const [pendingImageRemoval, setPendingImageRemoval] = useState(false);
const [imageUrl, setImageUrl] = useState("");
const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
const [errors, setErrors] = useState({...});
```

#### Estados de Configurações (4 estados)
```typescript
const [paymentSettings, setPaymentSettings] = useState({...});
const [paymentSettingsModified, setPaymentSettingsModified] = useState(false);
const [checkoutFields, setCheckoutFields] = useState({...});
const [checkoutFieldsModified, setCheckoutFieldsModified] = useState(false);
```

#### Estados de Order Bump (3 estados)
```typescript
const [orderBumpDialogOpen, setOrderBumpDialogOpen] = useState(false);
const [orderBumpKey, setOrderBumpKey] = useState(0);
const [editingOrderBump, setEditingOrderBump] = useState<any>(null);
```

#### Estados de Upsell/Downsell (3 estados)
```typescript
const [upsellSettings, setUpsellSettings] = useState({...});
const [upsellModified, setUpsellModified] = useState(false);
const [offers, setOffers] = useState<Offer[]>([]);
```

#### Estados de Checkout (3 estados)
```typescript
const [checkouts, setCheckouts] = useState<Checkout[]>([]);
const [checkoutConfigDialogOpen, setCheckoutConfigDialogOpen] = useState(false);
const [editingCheckout, setEditingCheckout] = useState<Checkout | null>(null);
```

#### Estados de Cupons (3 estados)
```typescript
const [coupons, setCoupons] = useState<Coupon[]>([]);
const [couponDialogOpen, setCouponDialogOpen] = useState(false);
const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
```

#### Estados de Afiliados (2 estados)
```typescript
const [affiliateSettings, setAffiliateSettings] = useState({...});
const [affiliateModified, setAffiliateModified] = useState(false);
```

#### Estados de Links (2 estados)
```typescript
const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
const [checkoutLinks, setCheckoutLinks] = useState<any[]>([]);
```

#### Estados Globais/UI (8 estados)
```typescript
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [editPriceDialogOpen, setEditPriceDialogOpen] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [offersModified, setOffersModified] = useState(false);
const [currentCheckoutLinkIds, setCurrentCheckoutLinkIds] = useState<string[]>([]);
const [availableOffers, setAvailableOffers] = useState<Array<{...}>>([]);
const [activeTab, setActiveTab] = useState<string>("geral");
const [settingsModified, setSettingsModified] = useState(false);
```

### 2.2 Falta de Sincronização

**Problema:** Quando o usuário muda o preço na aba **Geral**, as abas **Links**, **Checkout** e **Cupons** não atualizam automaticamente.

**Causa:** Cada aba tem seu próprio estado local e não há um mecanismo de sincronização.

**Exemplo do Problema:**
1. Usuário muda preço de R$ 47,00 para R$ 97,00 na aba Geral
2. Salva as alterações
3. Vai para aba Links
4. Links ainda mostram R$ 47,00 (dados desatualizados)
5. Usuário precisa recarregar a página manualmente

### 2.3 Prop Drilling

**Problema:** Dados do produto precisam ser passados por múltiplos níveis de componentes.

**Exemplo:**
```
ProductEdit (tem product)
  └─> Tabs
      └─> TabsContent "links"
          └─> LinksTable (precisa de product.price)
              └─> LinksRow (precisa de product.price)
```

### 2.4 Código Duplicado

**Problema:** Lógica de carregamento de dados repetida para cada aba.

**Funções de Load Identificadas:**
```typescript
loadPaymentLinks()    // ~86 linhas
loadCheckouts()       // ~40 linhas
loadCoupons()         // ~20 linhas
loadOrderBumps()      // (não mostrado no trecho)
loadOffers()          // (não mostrado no trecho)
loadAvailableOffers() // (não mostrado no trecho)
```

Todas essas funções:
- Fazem queries ao Supabase
- Tratam erros da mesma forma
- Atualizam estados locais
- São chamadas no mesmo `useEffect`

### 2.5 Dificuldade de Manutenção

**Métricas:**
- **1.828 linhas** em um único arquivo
- **35 estados** locais diferentes
- **8 abas** misturadas no mesmo componente
- **~10 funções** de carregamento de dados
- **Múltiplos `useEffect`** com dependências complexas

**Impacto:**
- Difícil encontrar código específico de uma aba
- Risco alto de quebrar uma aba ao modificar outra
- Onboarding de novos desenvolvedores muito lento
- Testes unitários praticamente impossíveis

---

## 3. Hook Atual: useProduct

**Arquivo:** `src/hooks/useProduct.tsx` (239 linhas)

### Responsabilidades Atuais

1. ✅ Carregar produto do banco
2. ✅ Salvar produto (criar/atualizar)
3. ✅ Deletar produto
4. ✅ Upload de imagem
5. ✅ Validação de campos obrigatórios

### Limitações

1. ❌ Não gerencia ofertas (offers)
2. ❌ Não gerencia order bumps
3. ❌ Não gerencia checkouts
4. ❌ Não gerencia cupons
5. ❌ Não gerencia links de pagamento
6. ❌ Não gerencia configurações de afiliados
7. ❌ Não sincroniza dados entre abas

**Conclusão:** O `useProduct` atual é muito limitado. Ele só gerencia os dados básicos do produto (tabela `products`), mas não gerencia as entidades relacionadas.

---

## 4. Estrutura de Dados Relacionadas

### Tabelas do Banco de Dados

```
products (tabela principal)
├── offers (1:N)
│   └── payment_links (1:N)
│       └── checkout_links (N:N)
│           └── checkouts (N:1)
├── order_bumps (N:N via product_bumps)
├── coupons (N:N via coupon_products)
└── affiliate_settings (1:1)
```

### Dependências Entre Abas

**Aba Geral → Todas as outras abas**
- Nome do produto usado em Links, Checkout
- Preço base usado em Offers, Links, Cupons
- Imagem usada em Checkout

**Aba Configurações → Checkout**
- Campos de formulário (CPF, telefone, etc.)
- Métodos de pagamento (PIX, cartão)

**Aba Upsell/Downsell → Links**
- Ofertas criadas aparecem nos links

**Aba Checkout → Links**
- Checkouts criados podem ser associados a links

---

## 5. Solução Proposta: Context API + Modularização

### 5.1 Arquitetura Nova

```
src/modules/products/
├── context/
│   └── ProductContext.tsx          # Estado global do produto
├── hooks/
│   ├── useProductData.ts           # Hook para dados do produto
│   ├── useOffers.ts                # Hook para ofertas
│   ├── useOrderBumps.ts            # Hook para order bumps
│   ├── useCheckouts.ts             # Hook para checkouts
│   ├── useCoupons.ts               # Hook para cupons
│   ├── usePaymentLinks.ts          # Hook para links
│   └── useAffiliateSettings.ts     # Hook para afiliados
├── tabs/
│   ├── GeneralTab.tsx              # Aba Geral (isolada)
│   ├── SettingsTab.tsx             # Aba Configurações
│   ├── OrderBumpTab.tsx            # Aba Order Bump
│   ├── UpsellTab.tsx               # Aba Upsell/Downsell
│   ├── CheckoutTab.tsx             # Aba Checkout
│   ├── CouponsTab.tsx              # Aba Cupons
│   ├── AffiliatesTab.tsx           # Aba Afiliados
│   └── LinksTab.tsx                # Aba Links
├── components/
│   ├── ProductHeader.tsx           # Cabeçalho com botão salvar
│   └── ProductTabs.tsx             # Wrapper das abas
└── types/
    └── product.types.ts            # Interfaces TypeScript
```

### 5.2 ProductContext - O Cérebro

```typescript
interface ProductContextState {
  // Dados do produto
  product: ProductData | null;
  offers: Offer[];
  orderBumps: OrderBump[];
  checkouts: Checkout[];
  coupons: Coupon[];
  paymentLinks: PaymentLink[];
  affiliateSettings: AffiliateSettings | null;
  
  // Estados de loading
  loading: boolean;
  saving: boolean;
  
  // Funções de atualização
  updateProduct: (field: string, value: any) => void;
  saveProduct: () => Promise<void>;
  deleteProduct: () => Promise<boolean>;
  
  // Funções de refresh
  refreshOffers: () => Promise<void>;
  refreshOrderBumps: () => Promise<void>;
  refreshCheckouts: () => Promise<void>;
  refreshCoupons: () => Promise<void>;
  refreshPaymentLinks: () => Promise<void>;
  refreshAll: () => Promise<void>;
}
```

### 5.3 Benefícios da Nova Arquitetura

**1. Sincronização Automática**
- Mudar preço na aba Geral → Atualiza automaticamente em Links, Checkout, Cupons
- Criar oferta na aba Upsell → Aparece instantaneamente na aba Links

**2. Código Modular**
- Cada aba em seu próprio arquivo (~200 linhas cada)
- Fácil adicionar novas abas (Afiliados, Cupons)
- Fácil testar cada aba isoladamente

**3. Eliminação de Prop Drilling**
- Componentes consomem dados diretamente do Context
- Não precisa passar props por 5 níveis

**4. Manutenibilidade**
- Encontrar código de uma aba: abrir arquivo específico
- Modificar aba Geral: zero risco de quebrar aba Links
- Onboarding de novos devs: muito mais rápido

**5. Performance**
- Carregamento lazy de dados (só carrega aba quando usuário clica)
- Re-renders otimizados (só componentes afetados)

---

## 6. Plano de Migração

### Fase 1: Criar Estrutura Base
1. Criar pasta `src/modules/products/`
2. Criar `ProductContext.tsx` com estado básico
3. Criar `ProductProvider` wrapper
4. Criar interfaces TypeScript

### Fase 2: Migrar Aba Geral
1. Criar `GeneralTab.tsx`
2. Mover lógica de generalData para o Context
3. Testar salvamento
4. Validar sincronização com outras abas

### Fase 3: Migrar Abas Restantes (Paralelo)
1. Criar cada arquivo de aba
2. Mover estados específicos para hooks dedicados
3. Conectar com Context
4. Testar isoladamente

### Fase 4: Cleanup
1. Remover código antigo do ProductEdit.tsx
2. ProductEdit.tsx vira apenas wrapper (50 linhas)
3. Remover estados não utilizados
4. Atualizar documentação

### Fase 5: Validação
1. Testar todas as abas em desenvolvimento
2. Validar sincronização de dados
3. Deploy em produção
4. Monitorar erros

---

## 7. Comparação: Antes vs. Depois

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Linhas ProductEdit.tsx | 1.828 | ~100 | -94% |
| Estados locais | 35 | 0 | -100% |
| Arquivos | 1 | 15+ | Modular |
| Prop drilling levels | 5 | 0 | -100% |
| Sincronização | Manual | Automática | ↑↑↑ |
| Tempo adicionar aba | ~4h | ~1h | -75% |
| Testabilidade | Impossível | Fácil | ↑↑↑ |
| Risco de bugs | Alto | Baixo | ↓↓↓ |

---

## 8. Riscos e Mitigações

### Risco 1: Quebrar Funcionalidades Existentes
**Mitigação:** Migração incremental, testar cada aba antes de remover código antigo

### Risco 2: Performance (Context re-renders)
**Mitigação:** Usar `useMemo` e `useCallback`, dividir Context em múltiplos se necessário

### Risco 3: Complexidade do Context
**Mitigação:** Documentar bem, criar hooks específicos para cada funcionalidade

### Risco 4: Tempo de Desenvolvimento
**Mitigação:** Fazer em sprints, priorizar abas mais críticas primeiro

---

## 9. Priorização de Abas

### Alta Prioridade (Migrar Primeiro)
1. **Geral** - Base de tudo, afeta todas as outras
2. **Links** - Precisa sincronizar com Geral e Ofertas
3. **Checkout** - Precisa sincronizar com Geral

### Média Prioridade
4. **Upsell/Downsell** - Ofertas afetam Links
5. **Order Bump** - Já tem componente no builder
6. **Configurações** - Afeta Checkout

### Baixa Prioridade (Podem Esperar)
7. **Cupons** - Menos usado
8. **Afiliados** - Funcionalidade futura

---

## 10. Próximos Passos

1. ✅ **Análise Concluída** - Este documento
2. ⏳ **Aprovação do Usuário** - Aguardando autorização
3. 🔄 **Criar Estrutura Base** - ProductContext + pastas
4. 🔄 **Migrar Aba Geral** - Primeira aba (proof of concept)
5. 🔄 **Migrar Abas Restantes** - Uma por vez
6. 🔄 **Cleanup e Validação** - Remover código antigo
7. 🔄 **Deploy e Monitoramento** - Produção

---

**Conclusão:** A refatoração é **necessária e urgente**. O código atual está insustentável e vai dificultar muito a adição de novas funcionalidades (Afiliados, Cupons avançados, etc.). A solução proposta pelo Gemini com Context API é a abordagem correta e vai resolver todos os problemas identificados.
