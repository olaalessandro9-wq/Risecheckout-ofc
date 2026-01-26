
# Plano: Corrigir Variáveis CSS Ausentes na Página PIX

## Diagnóstico do Bug (Root Cause Analysis)

### Problema Identificado
Os componentes da página de pagamento PIX estão usando **variáveis CSS que NÃO EXISTEM** no `index.css`. Quando uma variável CSS não existe, o navegador usa o valor padrão (transparente/nenhum), resultando em texto invisível sobre fundo branco.

### Mapeamento de Variáveis

| Variável USADA (Inexistente) | Efeito Visual |
|------------------------------|---------------|
| `--payment-card-text-primary` | Texto invisível (branco sobre branco) |
| `--payment-card-text-secondary` | Texto invisível |
| `--payment-card-text-muted` | Texto invisível |
| `--payment-card-bg-muted` | Fundo transparente nos badges |
| `--payment-input-border` | Input sem borda |
| `--payment-input-bg` | Input transparente |
| `--payment-progress-bg` | Barra de progresso invisível |
| `--payment-progress-fill` | Preenchimento invisível |
| `--payment-success-hover` | Hover do botão quebrado |
| `--payment-error` | Ícone de erro invisível |
| `--payment-qr-bg` | QR sem fundo |
| `--payment-qr-border` | QR sem borda |

### Variáveis EXISTENTES no CSS
```css
--payment-bg: 222 47% 11%;           /* gray-900 (fundo escuro) */
--payment-card-bg: 0 0% 100%;        /* white (card branco) */
--payment-card-elevated: 210 40% 96%; /* gray-50 */
--payment-text-primary: 0 0% 100%;   /* white - Para fundo escuro */
--payment-text-dark: 224 71% 4%;     /* gray-900 - Para fundo claro */
--payment-text-secondary: 220 9% 46%; /* gray-600 */
--payment-text-muted: 220 9% 46%;    /* gray-700 */
--payment-border: 220 13% 91%;       /* gray-200 */
--payment-success: 142 76% 36%;      /* green-600 */
```

---

## Análise de Soluções (RISE V3)

### Solução A: Adicionar as Variáveis Ausentes ao CSS
- Criar todas as 12 variáveis que faltam no `index.css`
- Componentes continuam como estão
- **Manutenibilidade**: 6/10 - Duplicação de variáveis (card-text-primary vs text-dark)
- **Zero DT**: 5/10 - Inconsistência com padrão existente (text-dark foi criado para isso)
- **Arquitetura**: 4/10 - Viola DRY, variáveis semânticas duplicadas
- **NOTA FINAL: 5.0/10**

### Solução B: Corrigir Componentes para Usar Variáveis Existentes (RISE V3 10.0/10)
- Os componentes devem usar as variáveis JÁ EXISTENTES
- Para texto dentro do card branco: usar `--payment-text-dark` (não text-primary que é branco)
- Adicionar APENAS as variáveis semânticas que realmente faltam
- **Manutenibilidade**: 10/10 - Usa variáveis semânticas corretas
- **Zero DT**: 10/10 - Alinha com design system existente
- **Arquitetura**: 10/10 - Single Source of Truth respeitado
- **Escalabilidade**: 10/10 - Consistência com todo o sistema
- **Segurança**: 10/10 - Componente de pagamento com 0 falhas visuais
- **NOTA FINAL: 10.0/10**

### DECISÃO: Solução B (Nota 10.0/10)

---

## Especificação Técnica

### 1. Completar Design Tokens no index.css

**Arquivo:** `src/index.css` (na seção PAYMENT PAGES DESIGN TOKENS)

```css
/* Payment Background Tokens */
--payment-bg: 222 47% 11%;             /* gray-900 */
--payment-card-bg: 0 0% 100%;          /* white */
--payment-card-elevated: 210 40% 96%;  /* gray-50 */
--payment-card-muted: 210 40% 96%;     /* gray-50 (para badges/chips) */

/* Payment Text Tokens - CORRIGIDO */
--payment-text-primary: 0 0% 100%;     /* white - Para fundo ESCURO */
--payment-text-dark: 224 71% 4%;       /* gray-900 - Para fundo CLARO */
--payment-text-secondary: 220 9% 46%;  /* gray-600 */
--payment-text-muted: 220 9% 60%;      /* gray-500 */

/* Payment Input Tokens - NOVOS */
--payment-input-bg: 0 0% 100%;         /* white */
--payment-input-border: 220 13% 85%;   /* gray-300 */

/* Payment Border Tokens */
--payment-border: 220 13% 91%;         /* gray-200 */
--payment-border-dark: 220 13% 80%;    /* gray-300 */

/* Payment Progress Bar Tokens - NOVOS */
--payment-progress-bg: 220 13% 91%;    /* gray-200 */
--payment-progress-fill: 142 76% 36%;  /* green-600 */

/* Payment QR Code Tokens - NOVOS */
--payment-qr-bg: 0 0% 100%;            /* white */
--payment-qr-border: 220 13% 91%;      /* gray-200 */

/* Payment Status Tokens */
--payment-success: 142 76% 36%;        /* green-600 */
--payment-success-hover: 142 76% 30%;  /* green-700 */
--payment-success-light: 142 77% 73%;  /* green-300 */
--payment-error: 0 84% 60%;            /* red-500 */
```

### 2. Corrigir Componentes (Usar Variáveis Corretas)

**Problema Central:** Dentro do card branco, o texto deve usar `--payment-text-dark` (cinza escuro), NÃO `--payment-text-primary` (branco).

| Componente | Variável ERRADA | Variável CORRETA |
|------------|-----------------|------------------|
| PixWaitingState | `--payment-card-text-primary` | `--payment-text-dark` |
| PixWaitingState | `--payment-card-text-secondary` | `--payment-text-secondary` |
| PixInstructions | `--payment-card-text-primary` | `--payment-text-dark` |
| PixInstructions | `--payment-card-text-secondary` | `--payment-text-secondary` |
| PixInstructions | `--payment-card-bg-muted` | `--payment-card-muted` |
| PixCopyButton | `--payment-card-text-primary` | `--payment-text-dark` |
| PixProgressBar | `--payment-card-text-secondary` | `--payment-text-secondary` |
| PixProgressBar | `--payment-card-bg-muted` | `--payment-card-muted` |
| PixPaidState | `--payment-card-text-primary` | `--payment-text-dark` |
| PixPaidState | `--payment-card-text-secondary` | `--payment-text-secondary` |
| PixExpiredState | `--payment-card-text-primary` | `--payment-text-dark` |
| PixExpiredState | `--payment-card-text-secondary` | `--payment-text-secondary` |
| PixErrorState | `--payment-card-text-*` | `--payment-text-dark/secondary/muted` |
| PixVerifyButton | `--payment-card-text-primary` | `--payment-text-dark` |

---

## Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/index.css` | MODIFICAR | Adicionar tokens ausentes (input, progress, qr, error, hover) |
| `src/pages/pix-payment/components/PixWaitingState.tsx` | MODIFICAR | Corrigir variáveis de texto |
| `src/pages/pix-payment/components/PixInstructions.tsx` | MODIFICAR | Corrigir variáveis de texto e bg |
| `src/pages/pix-payment/components/PixCopyButton.tsx` | MODIFICAR | Corrigir variáveis de texto e input |
| `src/pages/pix-payment/components/PixProgressBar.tsx` | MODIFICAR | Corrigir variáveis de texto e progress |
| `src/pages/pix-payment/components/PixQrCodeDisplay.tsx` | MODIFICAR | Usar tokens existentes (já correto) |
| `src/pages/pix-payment/components/PixPaidState.tsx` | MODIFICAR | Corrigir variáveis de texto |
| `src/pages/pix-payment/components/PixExpiredState.tsx` | MODIFICAR | Corrigir variáveis de texto |
| `src/pages/pix-payment/components/PixErrorState.tsx` | MODIFICAR | Corrigir variáveis de texto e error |
| `src/pages/pix-payment/components/PixVerifyButton.tsx` | MODIFICAR | Corrigir variáveis de texto |
| `src/pages/pix-payment/components/PixLoadingState.tsx` | VERIFICAR | Já usa tokens corretos (fundo escuro) |

---

## Resultado Visual Esperado

```text
┌─────────────────────────────────────────────────────────────────┐
│                    ANTES (Bug)                                   │
├─────────────────────────────────────────────────────────────────┤
│  [Card Branco]                                                   │
│                                                                  │
│  (Texto invisível - branco sobre branco)                        │
│                                                                  │
│  [████████████████████████████] ← Barra invisível               │
│                                                                  │
│  [QR CODE]  ← Sem borda/fundo                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    DEPOIS (Corrigido)                            │
├─────────────────────────────────────────────────────────────────┤
│  [Card Branco]                                                   │
│                                                                  │
│  Aqui está o PIX copia e cola  ← Texto cinza escuro visível     │
│                                                                  │
│  [████████████░░░░░░░░░░░░░░░] ← Barra verde sobre cinza        │
│                                                                  │
│  [QR CODE com borda]  ← Fundo branco, borda cinza               │
│                                                                  │
│  Para realizar o pagamento:  ← Texto visível                    │
│  1. Abra o aplicativo do seu banco                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Lógica de Cores (Design System)

```text
CONTEXTO                    VARIÁVEL DE TEXTO A USAR
─────────────────────────────────────────────────────
Fundo ESCURO (payment-bg)   → --payment-text-primary (branco)
Fundo CLARO (payment-card)  → --payment-text-dark (cinza escuro)
Texto secundário            → --payment-text-secondary (cinza médio)
Texto terciário             → --payment-text-muted (cinza claro)
```

---

## Verificação RISE V3

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade | 10/10 | Usa design system existente, tokens semânticos |
| Zero DT | 10/10 | Corrige raiz do problema (variáveis inexistentes) |
| Arquitetura | 10/10 | SSOT respeitado, Clean Architecture |
| Escalabilidade | 10/10 | Tokens reutilizáveis em futuras páginas de pagamento |
| Segurança | 10/10 | Zero falhas visuais em fluxo crítico de pagamento |
| **NOTA FINAL** | **10.0/10** | Alinhado 100% com RISE Protocol V3 |

---

## Tempo Estimado
**30 minutos**
