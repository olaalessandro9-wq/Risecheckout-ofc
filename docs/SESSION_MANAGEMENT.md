# Session Management Module

> **Versão:** 1.0.0  
> **Status:** RISE Protocol V3 Compliant  
> **Última Atualização:** 2026-01-19

## Visão Geral

Sistema completo de gestão de sessões que permite aos usuários:
- Listar todas as sessões ativas com informações de dispositivo
- Revogar sessões específicas
- Logout global (revoke all)
- Revogar outras sessões mantendo a atual

## Endpoints

### POST /session-manager

**Headers:** Cookie com `__Host-buyer_access` ou `__Host-producer_access`

| Action | Payload | Descrição |
|--------|---------|-----------|
| `list` | `{ action: "list" }` | Lista sessões ativas |
| `revoke` | `{ action: "revoke", sessionId: "uuid" }` | Revoga sessão específica |
| `revoke-all` | `{ action: "revoke-all" }` | Logout de todos os dispositivos |
| `revoke-others` | `{ action: "revoke-others" }` | Revoga outras sessões |

## Módulo Shared

Localizado em `supabase/functions/_shared/session-management/`:

- `types.ts` - Interfaces TypeScript
- `device-parser.ts` - Análise de User-Agent
- `session-manager.ts` - Operações de sessão
- `index.ts` - Entry point

## Resposta de Listagem

```json
{
  "success": true,
  "sessions": [
    {
      "id": "uuid",
      "createdAt": "2026-01-19T...",
      "lastActivityAt": "2026-01-19T...",
      "expiresAt": "2026-01-26T...",
      "ipAddress": "192.168.1.1",
      "isCurrent": true,
      "device": {
        "type": "desktop",
        "browser": "Chrome",
        "os": "Windows 10"
      }
    }
  ],
  "totalActive": 3
}
```
