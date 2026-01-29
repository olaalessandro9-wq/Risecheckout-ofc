
# Plano: Correção dos Testes com Falhas

## ✅ STATUS: CONCLUÍDO

**Data de conclusão:** 2026-01-29

---

## Análise de Soluções (RISE V3 Seção 4.4)

### Solução A: Silenciar erros com try-catch ou skip tests
- Manutenibilidade: 2/10 (esconde problemas reais)
- Zero DT: 1/10 (cria dívida técnica massiva)
- Arquitetura: 2/10 (viola princípio de testes)
- Escalabilidade: 2/10 (problemas acumulam)
- Segurança: 3/10 (reduz cobertura)
- **NOTA FINAL: 2.0/10**
- Tempo estimado: 5 minutos

### Solução B: Corrigir testes refatorando para testar corretamente ✅ IMPLEMENTADA
- Manutenibilidade: 10/10 (testes corretos e confiáveis)
- Zero DT: 10/10 (nenhuma dívida)
- Arquitetura: 10/10 (testa o que importa)
- Escalabilidade: 10/10 (fácil adicionar novos testes)
- Segurança: 10/10 (cobertura completa)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 45 minutos

### DECISÃO: Solução B (Nota 10.0/10)
Solução A é proibida pelo protocolo RISE V3 - nunca silenciamos erros.

---

## Correções Implementadas

### 1. ✅ `src/lib/lazyWithRetry.ts`
- **MODIFICADO**: Exportou a função `isNetworkError()` para permitir testes unitários diretos

### 2. ✅ `src/lib/__tests__/lazyWithRetry.test.ts`
- **REESCRITO**: Removidos todos os testes que usavam `_init()` (propriedade interna do React não acessível)
- **ADICIONADO**: 12 testes para `isNetworkError()` exportada
- **MANTIDO**: 8 testes para `isChunkLoadError()` (já funcionavam)
- **RESULTADO**: 20 testes passando

### 3. ✅ `src/lib/__tests__/uploadUtils.test.ts`
- **CORRIGIDO**: Uso de `vi.advanceTimersByTimeAsync()` para timers assíncronos
- **CORRIGIDO**: Padrão de catch antecipado para evitar unhandled rejections
- **CORRIGIDO**: Type assertions para erros em catch blocks
- **RESULTADO**: 18 testes passando

### 4. ✅ `src/lib/token-manager/__tests__/cross-tab-lock.acquisition.test.ts`
- **REESCRITO**: Mock do `BroadcastChannel` como classe real com getters/setters
- **RESULTADO**: 16 testes passando, zero warnings de mock

### 5. ✅ `src/lib/token-manager/__tests__/cross-tab-lock.broadcast.test.ts`
- **REESCRITO**: Mock do `BroadcastChannel` como classe real com getters/setters
- **RESULTADO**: 11 testes passando, zero warnings de mock

---

## Resultado Final

| Métrica | Antes | Depois |
|---------|-------|--------|
| Testes lazyWithRetry | ~17 (falhando) | 20 (passando) |
| Testes uploadUtils | 18 (5 falhando) | 18 (passando) |
| Testes cross-tab-lock acquisition | 16 (2 falhando) | 16 (passando) |
| Testes cross-tab-lock broadcast | 11 (4 falhando) | 11 (passando) |
| Warnings de mock | Vários | Zero |
| @ts-expect-error | 6 | 0 |

---

## Validação RISE V3

| Critério | Status |
|----------|--------|
| Limite 300 linhas | ✅ Todos arquivos dentro do limite |
| Zero `any` | ✅ Nenhum tipo any usado |
| Zero `@ts-expect-error` | ✅ Removidos todos (eram usados para _init) |
| Zero frases proibidas | ✅ Nenhuma |
| SRP | ✅ Cada arquivo testa um módulo |
| Cobertura mantida | ✅ Testa APIs públicas relevantes |
