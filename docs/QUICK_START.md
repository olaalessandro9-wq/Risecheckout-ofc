# 🚀 Início Rápido - Testar e Limpar

**Objetivo:** Começar a testar agora e remover código antigo o mais rápido possível

---

## ⚡ Resumo de 3 Minutos

### 1️⃣ AGORA (Hoje)

```bash
cd /home/ubuntu/risecheckout-84776

# Feature flags já estão ativados! ✅
# Apenas inicie o servidor
npm run dev
```

**Testar:**
1. Abra `http://localhost:5173/produtos/editar/{product-id}`
2. Vá na aba **Configurações**
3. Veja a nova UI de gateways
4. Teste o checkout público

---

### 2️⃣ ESTA SEMANA (Próximos 7 dias)

**Completar todos os testes:**
- [ ] Configuração de gateways
- [ ] Checkout com PIX
- [ ] Checkout com Cartão
- [ ] Validações
- [ ] Mobile

**Guia completo:** `docs/TESTING_GUIDE.md`

---

### 3️⃣ PRÓXIMA SEMANA (Após 7-14 dias)

**Se tudo estiver funcionando:**

```bash
# Verificar arquivos não usados
./scripts/check-unused-files.sh

# Remover código antigo
./scripts/cleanup-old-files.sh
```

**Guia completo:** `docs/CLEANUP_GUIDE.md`

---

## 📁 Documentação Completa

| Documento | Quando Usar |
|-----------|-------------|
| `TESTING_GUIDE.md` | **AGORA** - Guia de testes detalhado |
| `CLEANUP_GUIDE.md` | **DEPOIS** - Remover código antigo |
| `AUDIT_REPORT.md` | Referência - Relatório de qualidade |
| `MIGRATION_PLAN.md` | Referência - Plano de migração |
| `PRODUCTION_CHECKLIST.md` | Referência - Checklist de produção |

---

## 🎯 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ HOJE: Testar em Desenvolvimento                             │
│ ✅ Feature flags ativados                                   │
│ ✅ Servidor rodando                                         │
│ ✅ Testar configuração de gateways                          │
│ ✅ Testar checkout completo                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ ESTA SEMANA: Validar Completamente                          │
│ ✅ Todos os testes do TESTING_GUIDE.md                      │
│ ✅ Nenhum bug encontrado                                    │
│ ✅ Checkout funciona perfeitamente                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PRÓXIMA SEMANA: Deploy em Produção                          │
│ ✅ Fazer deploy                                             │
│ ✅ Monitorar por 7-14 dias                                  │
│ ✅ Verificar métricas                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ APÓS VALIDAÇÃO: Limpar Código Antigo                        │
│ ✅ ./scripts/check-unused-files.sh                          │
│ ✅ ./scripts/cleanup-old-files.sh                           │
│ ✅ Commitar e fazer deploy                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist Rápido

### Hoje
- [ ] Feature flags ativados (já está ✅)
- [ ] Servidor rodando
- [ ] Nova UI aparece
- [ ] Checkout funciona

### Esta Semana
- [ ] Todos os testes passaram
- [ ] Nenhum bug crítico
- [ ] Pronto para produção

### Próxima Semana
- [ ] Deploy em produção
- [ ] Monitorando métricas
- [ ] Tudo estável

### Após Validação
- [ ] Código antigo removido
- [ ] Feature flags removidos
- [ ] Código limpo

---

## 🆘 Precisa de Ajuda?

### Problema: Nova UI não aparece

**Solução:**
```bash
# Limpar cache do navegador
Ctrl+Shift+Delete

# Forçar reload
Ctrl+Shift+R

# Verificar feature flags
cat src/config/feature-flags.ts | grep "USE_NEW"
```

### Problema: Checkout não funciona

**Solução:**
1. Abrir DevTools (F12)
2. Ver erros no console
3. Verificar se credenciais do Mercado Pago estão configuradas
4. Consultar `TESTING_GUIDE.md` seção "Problemas Comuns"

---

## 📞 Suporte

- **Documentação:** `docs/`
- **Scripts:** `scripts/`
- **Auditoria:** `docs/AUDIT_REPORT.md`

---

**Boa sorte! 🚀**
