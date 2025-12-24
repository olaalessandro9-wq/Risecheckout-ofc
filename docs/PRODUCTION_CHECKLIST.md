# ✅ Checklist de Ativação em Produção

## 📋 Pré-Requisitos

### Ambiente de Desenvolvimento
- [ ] Todas as alterações commitadas
- [ ] Branch atualizada com main/master
- [ ] Build local passa sem erros
- [ ] TypeScript compila sem erros

### Testes Funcionais
- [ ] Checkout com PIX funciona
- [ ] Checkout com Cartão (Mercado Pago) funciona
- [ ] Configuração de gateway no produto funciona
- [ ] Validação de CPF/CNPJ funciona
- [ ] Parcelas são exibidas corretamente
- [ ] Erros são tratados e exibidos

### Testes de Regressão
- [ ] Order bumps funcionam
- [ ] Cupons funcionam
- [ ] Tracking funciona (Facebook, Google Ads, etc.)
- [ ] Redirecionamento para /success funciona
- [ ] Redirecionamento para /pix funciona

---

## 🚀 Ativação

### Passo 1: Ativar Feature Flags

Editar `src/config/feature-flags.ts`:

```typescript
// Mudar de:
USE_NEW_PAYMENT_ARCHITECTURE: isDevelopment ? true : false,
USE_NEW_GATEWAY_CONFIG_UI: isDevelopment ? true : false,

// Para:
USE_NEW_PAYMENT_ARCHITECTURE: true,
USE_NEW_GATEWAY_CONFIG_UI: true,
```

### Passo 2: Commit e Push

```bash
git add src/config/feature-flags.ts
git commit -m "feat: ativar nova arquitetura multi-gateway em produção"
git push origin main
```

### Passo 3: Deploy

Aguardar deploy automático ou executar manualmente.

### Passo 4: Validação Pós-Deploy

- [ ] Site carrega corretamente
- [ ] Checkout funciona
- [ ] Configurações de produto funcionam
- [ ] Nenhum erro no console

---

## 📊 Monitoramento (Primeiras 24h)

### A Cada Hora
- [ ] Verificar logs de erro
- [ ] Verificar taxa de conversão
- [ ] Verificar feedback de usuários

### A Cada 6 Horas
- [ ] Comparar métricas com baseline
- [ ] Verificar se há padrões de erro
- [ ] Avaliar necessidade de rollback

### Após 24 Horas
- [ ] Relatório de métricas
- [ ] Decisão: continuar ou rollback
- [ ] Comunicar equipe

---

## 🔄 Rollback (Se Necessário)

### Opção Rápida: Desativar Feature Flags

```typescript
// Em src/config/feature-flags.ts
USE_NEW_PAYMENT_ARCHITECTURE: false,
USE_NEW_GATEWAY_CONFIG_UI: false,
```

```bash
git add src/config/feature-flags.ts
git commit -m "fix: rollback nova arquitetura - problema identificado"
git push origin main
```

### Opção Completa: Reverter Commit

```bash
git revert HEAD
git push origin main
```

---

## 📝 Notas

### Cartões de Teste (Mercado Pago)

```
Mastercard: 5031 4332 1540 6351
Visa: 4235 6477 2802 5682
CVV: 123
Validade: 11/25
Nome: APRO (para aprovar)
CPF: 123.456.789-09
```

### Contatos de Emergência

- **Desenvolvedor:** [Nome]
- **Suporte:** [Email]

---

**Data de Criação:** 17/12/2024
**Última Atualização:** 17/12/2024
