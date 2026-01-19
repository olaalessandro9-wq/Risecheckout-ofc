# Session Management Module

> **Versão:** 2.0.0  
> **Status:** RISE Protocol V3 Compliant (10.0/10)  
> **Última Atualização:** 2026-01-19

## Visão Geral

Sistema completo de gestão de sessões que permite aos usuários visualizar e controlar todas as suas sessões ativas em diferentes dispositivos. Suporta tanto producers (dashboard) quanto buyers (área de membros).

## Arquitetura

```
supabase/functions/session-manager/
├── index.ts                    # Router principal

supabase/functions/_shared/session-management/
├── index.ts                    # Entry point do módulo
├── types.ts                    # Interfaces TypeScript
├── device-parser.ts            # Análise de User-Agent
└── session-manager.ts          # Operações de sessão
```

## Fluxo de Autenticação

```
┌─────────────────────────────────────────────────────────────────┐
│                     SESSION MANAGEMENT FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Request                                                         │
│     │                                                            │
│     ▼                                                            │
│  ┌─────────────────────────────────────────┐                    │
│  │  Cookie Reader                           │                    │
│  │  - __Host-buyer_access (Buyer)          │                    │
│  │  - __Host-producer_access (Producer)    │                    │
│  └─────────────────────────────────────────┘                    │
│     │                                                            │
│     ▼                                                            │
│  ┌─────────────────────────────────────────┐                    │
│  │  Session Validation                      │                    │
│  │  - Verify token in database             │                    │
│  │  - Check expiration                     │                    │
│  │  - Update last_activity_at              │                    │
│  └─────────────────────────────────────────┘                    │
│     │                                                            │
│     ▼                                                            │
│  ┌─────────────────────────────────────────┐                    │
│  │  Action Router                           │                    │
│  │  - list / revoke / revoke-all / revoke-others │              │
│  └─────────────────────────────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Endpoints

### POST /session-manager

**Headers:** Cookie com `__Host-buyer_access` ou `__Host-producer_access`

| Action | Payload | Descrição |
|--------|---------|-----------|
| `list` | `{ action: "list" }` | Lista todas as sessões ativas |
| `revoke` | `{ action: "revoke", sessionId: "uuid" }` | Revoga sessão específica |
| `revoke-all` | `{ action: "revoke-all" }` | Logout de todos os dispositivos |
| `revoke-others` | `{ action: "revoke-others" }` | Revoga outras sessões |

## Tipos TypeScript

### SessionInfo

```typescript
interface SessionInfo {
  id: string;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  isCurrent: boolean;
  device: DeviceInfo;
}
```

### DeviceInfo

```typescript
interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
}
```

### SessionManagementRequest

```typescript
type SessionManagementRequest =
  | { action: 'list' }
  | { action: 'revoke'; sessionId: string }
  | { action: 'revoke-all' }
  | { action: 'revoke-others' };
```

## Tabelas do Banco de Dados

### producer_sessions

```sql
CREATE TABLE producer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID NOT NULL REFERENCES profiles(id),
  session_token TEXT NOT NULL UNIQUE,
  refresh_token TEXT,
  ip_address TEXT,
  user_agent TEXT,
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT now()
);
```

### buyer_sessions

```sql
CREATE TABLE buyer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES buyer_profiles(id),
  session_token TEXT NOT NULL UNIQUE,
  refresh_token TEXT,
  previous_refresh_token TEXT,
  ip_address TEXT,
  user_agent TEXT,
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  access_token_expires_at TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT now()
);
```

## Device Parser

O módulo `device-parser.ts` analisa o User-Agent para extrair informações do dispositivo.

### Browsers Detectados

- Chrome, Firefox, Safari, Edge, Opera, Samsung Internet, Brave, Vivaldi

### Sistemas Operacionais Detectados

- Windows 10/11, macOS, iOS, Android, Linux, Chrome OS

### Tipos de Dispositivo

- `desktop`: Computadores e laptops
- `mobile`: Smartphones
- `tablet`: Tablets e iPads
- `unknown`: Dispositivos não identificados

### Exemplo de Parsing

```typescript
parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...');
// Retorna:
// {
//   type: 'desktop',
//   browser: 'Chrome',
//   os: 'Windows 10'
// }
```

## Respostas da API

### Listagem de Sessões

```json
{
  "success": true,
  "sessions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2026-01-19T10:00:00Z",
      "lastActivityAt": "2026-01-19T15:30:00Z",
      "expiresAt": "2026-01-26T10:00:00Z",
      "ipAddress": "192.168.1.1",
      "isCurrent": true,
      "device": {
        "type": "desktop",
        "browser": "Chrome",
        "os": "Windows 10"
      }
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "createdAt": "2026-01-18T08:00:00Z",
      "lastActivityAt": "2026-01-18T20:00:00Z",
      "expiresAt": "2026-01-25T08:00:00Z",
      "ipAddress": "10.0.0.50",
      "isCurrent": false,
      "device": {
        "type": "mobile",
        "browser": "Safari",
        "os": "iOS"
      }
    }
  ],
  "totalActive": 2
}
```

### Revogação de Sessão

```json
{
  "success": true,
  "message": "Session revoked successfully",
  "revokedSessionId": "550e8400-e29b-41d4-a716-446655440001"
}
```

### Revogação de Todas

```json
{
  "success": true,
  "message": "All sessions revoked",
  "revokedCount": 5
}
```

## RLS Policies

### producer_sessions

```sql
-- Producers podem ver suas próprias sessões
CREATE POLICY "Producers can view own sessions"
ON producer_sessions FOR SELECT
USING (producer_id = auth.uid());

-- Apenas service_role pode modificar
CREATE POLICY "Service role manages sessions"
ON producer_sessions FOR ALL
TO service_role
USING (true);
```

### buyer_sessions

```sql
-- Buyers podem ver suas próprias sessões
CREATE POLICY "Buyers can view own sessions"
ON buyer_sessions FOR SELECT
USING (buyer_id IN (
  SELECT id FROM buyer_profiles 
  WHERE id = buyer_id
));

-- Apenas service_role pode modificar
CREATE POLICY "Service role manages buyer sessions"
ON buyer_sessions FOR ALL
TO service_role
USING (true);
```

## Segurança

### Cookies httpOnly

Todos os tokens de sessão são armazenados em cookies httpOnly:

```
__Host-buyer_access   - Token de acesso do buyer
__Host-buyer_refresh  - Token de refresh do buyer
__Host-producer_access - Token de acesso do producer
__Host-producer_refresh - Token de refresh do producer
```

### Atributos de Cookie

- `HttpOnly`: Previne acesso via JavaScript (XSS protection)
- `Secure`: Apenas HTTPS
- `SameSite=None`: Permite cross-origin (necessário para preview)
- `Partitioned`: CHIPS compliance
- `__Host-` prefix: Garante cookie seguro

### Proteções Implementadas

1. **Revogação não permite sessão atual**: Não é possível revogar a própria sessão via `revoke`
2. **Validação de propriedade**: Só pode revogar sessões do próprio usuário
3. **Expiração automática**: Sessões expiradas são ignoradas nas listagens
4. **Invalidação em cascata**: `revoke-all` invalida todas as sessões imediatamente

## Uso no Frontend

### Hook de Sessões (Exemplo)

```typescript
// src/hooks/useSessionManagement.ts
import { supabase } from '@/integrations/supabase/client';

export function useSessionManagement() {
  const listSessions = async () => {
    const { data, error } = await supabase.functions.invoke('session-manager', {
      body: { action: 'list' }
    });
    return { data, error };
  };

  const revokeSession = async (sessionId: string) => {
    const { data, error } = await supabase.functions.invoke('session-manager', {
      body: { action: 'revoke', sessionId }
    });
    return { data, error };
  };

  const revokeAllSessions = async () => {
    const { data, error } = await supabase.functions.invoke('session-manager', {
      body: { action: 'revoke-all' }
    });
    return { data, error };
  };

  return { listSessions, revokeSession, revokeAllSessions };
}
```

## Changelog

| Data | Versão | Alterações |
|------|--------|------------|
| 2026-01-19 | 2.0.0 | Documentação expandida com arquitetura, tipos, RLS e exemplos |
| 2026-01-19 | 1.0.0 | Documento inicial |
