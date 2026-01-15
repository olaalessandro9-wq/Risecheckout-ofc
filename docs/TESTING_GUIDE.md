# 🧪 Guia de Testes - RiseCheckout

**Última atualização:** 15 de Janeiro de 2026  
**Status:** ✅ Nova arquitetura em produção

---

## 📋 Pré-Requisitos

- [ ] Código compilando sem erros (`npm run build`)
- [ ] Servidor de desenvolvimento rodando (`npm run dev`)
- [ ] Acesso ao painel de admin
- [ ] Produto de teste criado

---

## 🧪 Testes Automatizados

Os testes automatizados estão implementados para as Edge Functions críticas:

```bash
# Executar todos os testes
supabase functions test

# Executar testes específicos
supabase functions test create-order
supabase functions test mercadopago-webhook
```

Ver: [ARQUITETURA_TESTES_AUTOMATIZADOS.md](./ARQUITETURA_TESTES_AUTOMATIZADOS.md)

---

## 🧪 Testes Manuais: Configuração de Gateways

### Acessar Painel de Produto

1. Faça login no painel
2. Vá em **Produtos**
3. Clique em um produto existente (ou crie um novo)
4. Vá na aba **Configurações**

### Verificar UI de Gateways

**O que você DEVE ver:**
- ✅ Seção "Gateway de pagamento" com cards dinâmicos
- ✅ **PIX**: PushinPay, Mercado Pago, Asaas como opções
- ✅ **Cartão**: Mercado Pago, Stripe, Asaas como opções
- ✅ Indicador de credenciais configuradas (verde ou amarelo)

### Testar Seleção de Gateway

1. Selecione **PushinPay** para PIX
2. Selecione **Mercado Pago** para Cartão
3. Clique em **Salvar Alterações**
4. Recarregue a página
5. Verifique se as seleções foram mantidas

**Resultado Esperado:** ✅ Configurações salvas corretamente

---

## 💳 Testes Manuais: Checkout Público

### Abrir Checkout Público

1. Copie o link do checkout do produto
2. Abra em uma aba anônima (Ctrl+Shift+N)

### Testar Formulário de PIX

1. Selecione **PIX** como método de pagamento
2. Preencha os dados pessoais
3. Clique em **Finalizar Compra**

**Resultado Esperado:**
- ✅ Formulário valida campos
- ✅ Redireciona para página de PIX
- ✅ QR Code é gerado

### Testar Formulário de Cartão

1. Selecione **Cartão de Crédito**
2. Verifique se o formulário aparece

**O que você DEVE ver:**
- ✅ Campos de cartão (número, validade, CVV)
- ✅ Campo "Nome do Titular"
- ✅ Campo "CPF/CNPJ"
- ✅ Select de "Parcelas"
- ✅ Selo de segurança

### Dados de Teste (Mercado Pago)

```
Número: 5031 4332 1540 6351 (Mastercard)
Validade: 11/25
CVV: 123
Nome: APRO
CPF: 123.456.789-09
Parcelas: 1x
```

---

## 📊 Testes de Cenários Especiais

### Order Bumps

1. Adicione um Order Bump ao produto
2. Abra o checkout
3. Selecione o Order Bump
4. Finalize a compra

**Resultado Esperado:** ✅ Valor total atualizado corretamente

### Cupom de Desconto

1. Crie um cupom de desconto
2. Aplique no checkout
3. Finalize a compra

**Resultado Esperado:** ✅ Desconto aplicado corretamente

### Mobile

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

### Checkout Público - Cartão
- [ ] Formulário de cartão aparece
- [ ] Campos funcionam corretamente
- [ ] Validação de CPF funciona
- [ ] Parcelas são exibidas
- [ ] Pagamento é processado
- [ ] Redirecionamento funciona

### Cenários Especiais
- [ ] Order Bumps funcionam
- [ ] Cupons funcionam
- [ ] Mobile funciona
- [ ] Nenhum erro no console

---

## 🐛 Problemas Comuns e Soluções

### Problema: Iframes do Mercado Pago não carregam

**Solução:**
1. Verificar se a public key está configurada
2. Verificar console para erros do SDK
3. Verificar se o domínio está autorizado no Mercado Pago

### Problema: Erro "Gateway não inicializado"

**Solução:**
1. Aguardar iframes carregarem completamente
2. Verificar logs no console

---

**Data de Criação:** 17/12/2024  
**Última Atualização:** 15/01/2026
