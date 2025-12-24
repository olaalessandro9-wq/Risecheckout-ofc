# 🧪 Guia de Testes - Nova Arquitetura Multi-Gateway

**Ambiente:** Desenvolvimento  
**Objetivo:** Validar nova arquitetura antes de remover código antigo

---

## 📋 Pré-Requisitos

- [ ] Código compilando sem erros
- [ ] Servidor de desenvolvimento rodando
- [ ] Acesso ao painel de admin
- [ ] Produto de teste criado

---

## 🚀 Passo 1: Ativar Feature Flags

### 1.1. Editar Arquivo de Feature Flags

**Arquivo:** `src/config/feature-flags.ts`

**Mudanças:**
```typescript
// ANTES (linhas 27-28)
USE_NEW_PAYMENT_ARCHITECTURE: isDevelopment ? true : false,
USE_NEW_GATEWAY_CONFIG_UI: isDevelopment ? true : false,

// DEPOIS (forçar ativação em dev)
USE_NEW_PAYMENT_ARCHITECTURE: true,
USE_NEW_GATEWAY_CONFIG_UI: true,
```

### 1.2. Salvar e Recarregar

```bash
# O Vite deve recarregar automaticamente
# Se não, reinicie o servidor:
npm run dev
```

### 1.3. Verificar Ativação

Abra o console do navegador e digite:
```javascript
// Isso deve retornar true
console.log(import.meta.env.DEV)
```

---

## 🧪 Passo 2: Testar Configuração de Gateways

### 2.1. Acessar Painel de Produto

1. Faça login no painel
2. Vá em **Produtos**
3. Clique em um produto existente (ou crie um novo)
4. Vá na aba **Configurações**

### 2.2. Verificar Nova UI

**O que você DEVE ver:**
- ✅ Seção "Gateway de pagamento" com cards dinâmicos
- ✅ **PIX**: PushinPay e Mercado Pago como opções
- ✅ **Cartão**: Mercado Pago selecionado
- ✅ **Stripe** e **PagSeguro** aparecem como "Em breve"
- ✅ Indicador de credenciais configuradas (verde ou amarelo)

**O que você NÃO deve ver:**
- ❌ "Outros gateways - Em breve" hardcoded
- ❌ Taxas hardcoded no JSX
- ❌ Apenas Mercado Pago como opção

### 2.3. Testar Seleção de Gateway

1. Selecione **PushinPay** para PIX
2. Selecione **Mercado Pago** para Cartão
3. Clique em **Salvar Alterações**
4. Recarregue a página
5. Verifique se as seleções foram mantidas

**Resultado Esperado:** ✅ Configurações salvas corretamente

---

## 💳 Passo 3: Testar Checkout Público

### 3.1. Abrir Checkout Público

1. Copie o link do checkout do produto
2. Abra em uma aba anônima (Ctrl+Shift+N)
3. Ou use: `http://localhost:5173/checkout/{checkout-id}`

### 3.2. Testar Formulário de PIX

1. Selecione **PIX** como método de pagamento
2. Preencha os dados pessoais
3. Clique em **Finalizar Compra**

**Resultado Esperado:**
- ✅ Formulário valida campos
- ✅ Redireciona para página de PIX
- ✅ QR Code é gerado

### 3.3. Testar Formulário de Cartão

1. Volte ao checkout
2. Selecione **Cartão de Crédito**
3. Verifique se o formulário aparece

**O que você DEVE ver:**
- ✅ 3 iframes do Mercado Pago (número, validade, CVV)
- ✅ Campo "Nome do Titular" (customizado)
- ✅ Campo "CPF/CNPJ" (customizado)
- ✅ Select de "Parcelas" (customizado)
- ✅ Selo de segurança

**O que você NÃO deve ver:**
- ❌ Erro no console
- ❌ Campos duplicados
- ❌ Layout quebrado

### 3.4. Testar Validação de Cartão

**Preencha com dados de teste:**
```
Número: 5031 4332 1540 6351 (Mastercard)
Validade: 11/25
CVV: 123
Nome: APRO
CPF: 123.456.789-09
Parcelas: 1x
```

**Clique em "Finalizar Compra"**

**Resultado Esperado:**
- ✅ Formulário valida todos os campos
- ✅ Cria token do cartão
- ✅ Processa pagamento
- ✅ Redireciona para página de sucesso

### 3.5. Testar Validação de Erros

**Teste 1: Campos vazios**
1. Deixe campos em branco
2. Clique em "Finalizar Compra"
3. **Esperado:** Mensagens de erro aparecem

**Teste 2: CPF inválido**
1. Digite: `111.111.111-11`
2. Clique em "Finalizar Compra"
3. **Esperado:** "CPF/CNPJ inválido"

**Teste 3: Nome curto**
1. Digite: `AB`
2. Clique em "Finalizar Compra"
3. **Esperado:** "Nome deve ter no mínimo 3 caracteres"

---

## 🔍 Passo 4: Verificar Console do Navegador

### 4.1. Abrir DevTools

Pressione `F12` ou `Ctrl+Shift+I`

### 4.2. Verificar Erros

**O que você NÃO deve ver:**
- ❌ Erros em vermelho
- ❌ Warnings sobre componentes não encontrados
- ❌ Warnings sobre props faltando

**O que você PODE ver (normal):**
- ⚠️ Logs de debug do Mercado Pago
- ⚠️ Logs de tracking (Facebook, Google Ads)

---

## 📊 Passo 5: Testar em Diferentes Cenários

### 5.1. Testar com Order Bumps

1. Adicione um Order Bump ao produto
2. Abra o checkout
3. Selecione o Order Bump
4. Finalize a compra

**Resultado Esperado:** ✅ Valor total atualizado corretamente

### 5.2. Testar com Cupom de Desconto

1. Crie um cupom de desconto
2. Aplique no checkout
3. Finalize a compra

**Resultado Esperado:** ✅ Desconto aplicado corretamente

### 5.3. Testar em Mobile

1. Abra DevTools (F12)
2. Clique no ícone de dispositivo móvel
3. Selecione "iPhone 12 Pro"
4. Teste o fluxo completo

**Resultado Esperado:** ✅ Layout responsivo funciona

---

## ✅ Checklist de Validação

### Configuração de Gateways
- [ ] Nova UI aparece na aba Configurações
- [ ] Gateways são renderizados dinamicamente
- [ ] Seleção de gateway funciona
- [ ] Configurações são salvas corretamente
- [ ] Indicador de credenciais funciona

### Checkout Público - PIX
- [ ] Formulário de PIX funciona
- [ ] Validação de campos funciona
- [ ] QR Code é gerado
- [ ] Tracking funciona (Facebook, Google Ads)

### Checkout Público - Cartão
- [ ] Formulário de cartão aparece
- [ ] 3 iframes do Mercado Pago carregam
- [ ] Campos customizados funcionam
- [ ] Validação de CPF funciona
- [ ] Validação de nome funciona
- [ ] Parcelas são exibidas
- [ ] Token é criado
- [ ] Pagamento é processado
- [ ] Redirecionamento funciona

### Cenários Especiais
- [ ] Order Bumps funcionam
- [ ] Cupons funcionam
- [ ] Mobile funciona
- [ ] Nenhum erro no console

---

## 🐛 Problemas Comuns e Soluções

### Problema 1: Feature flags não ativam

**Sintoma:** Ainda vejo a UI antiga

**Solução:**
```bash
# Limpar cache do navegador
Ctrl+Shift+Delete → Limpar cache

# Ou forçar reload
Ctrl+Shift+R
```

### Problema 2: Iframes do Mercado Pago não carregam

**Sintoma:** Campos de cartão não aparecem

**Solução:**
1. Verificar se a public key está configurada
2. Verificar console para erros do SDK
3. Verificar se o domínio está autorizado no Mercado Pago

### Problema 3: Erro "Gateway não inicializado"

**Sintoma:** Erro ao clicar em "Finalizar Compra"

**Solução:**
1. Aguardar iframes carregarem completamente
2. Verificar se `onMount` foi chamado
3. Verificar logs no console

---

## 📝 Registro de Testes

Use esta tabela para registrar seus testes:

| Data | Teste | Status | Observações |
|------|-------|--------|-------------|
| __/__ | Configuração de Gateways | ⬜ | |
| __/__ | Checkout PIX | ⬜ | |
| __/__ | Checkout Cartão | ⬜ | |
| __/__ | Validação de Erros | ⬜ | |
| __/__ | Order Bumps | ⬜ | |
| __/__ | Cupons | ⬜ | |
| __/__ | Mobile | ⬜ | |

**Legenda:** ⬜ Não testado | ✅ Passou | ❌ Falhou

---

## 🎯 Próximo Passo

Após completar todos os testes com sucesso:

1. ✅ Marcar todos os itens do checklist
2. ✅ Registrar na tabela de testes
3. ✅ Prosseguir para remoção de código antigo

**Arquivo:** `docs/CLEANUP_GUIDE.md`

---

**Data de Criação:** 17/12/2024  
**Última Atualização:** 17/12/2024
