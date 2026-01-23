# Fase 6: Limpeza de Código Legado - Progresso

## ✅ Completado

### Fase 6.1: Edge Functions Convertidas para Proxy
- [x] `buyer-auth/index.ts` → Proxy para `unified-auth`
- [x] `producer-auth/index.ts` → Proxy para `unified-auth`

### Fase 6.2: Frontend Migrado
- [x] `BuyerRecuperarSenha.tsx` → Usa `api.publicCall("unified-auth/...")`
- [x] `useSetupAccess.ts` → Usa `unifiedTokenService` e `unified-auth/validate`

### Fase 6.2: Token Services Atualizados
- [x] `token-manager/service.ts` → `unifiedTokenService` como principal, legados marcados como `@deprecated`
- [x] `token-manager/refresh.ts` → Todos os tipos usam `unified-auth/refresh`

## ⏳ Pendente (Fase 6.3+)

### Arquivos Legados para Deletar (após 30 dias de proxy estável)
- `_shared/buyer-auth-handlers.ts`
- `_shared/buyer-auth-handlers-extended.ts`
- `_shared/buyer-auth-producer-handlers.ts`
- `_shared/buyer-auth-refresh-handler.ts`
- `_shared/producer-auth-handlers.ts`
- `_shared/producer-auth-reset-handlers.ts`
- `_shared/producer-auth-refresh-handler.ts`

### Tabelas Legadas para Arquivar (após 90 dias)
- `producer_sessions` → `_archive_producer_sessions_2026`
- `buyer_sessions` → `_archive_buyer_sessions_2026`

## Resumo da Arquitetura Atual

```
Frontend                    Edge Functions
─────────────────────────────────────────────────
useUnifiedAuth      ──────► unified-auth (SSOT)
unifiedTokenService ──────► unified-auth/refresh

BuyerRecuperarSenha ──────► unified-auth/password-reset-request
useSetupAccess      ──────► unified-auth/validate

buyer-auth/*        ──────► PROXY → unified-auth/*
producer-auth/*     ──────► PROXY → unified-auth/*
```

Última atualização: 2026-01-23
