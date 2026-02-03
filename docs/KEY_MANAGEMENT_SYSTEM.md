# Key Management System (KMS)

> **Versão:** 1.0.0  
> **Status:** RISE Protocol V3 Compliant  
> **Última Atualização:** 2026-01-19

## Visão Geral

O KMS do RiseCheckout é um sistema de gerenciamento de chaves de criptografia que suporta:

- **Versionamento de Chaves**: Múltiplas versões de chaves podem coexistir
- **Rotação Segura**: Re-criptografia de dados existentes em batches
- **Backward Compatibility**: Descriptografia automática de dados em versões anteriores
- **Audit Trail**: Log completo de todas as operações de rotação

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     KMS Module                               │
├─────────────────────────────────────────────────────────────┤
│  index.ts          - Entry point & convenience functions     │
│  types.ts          - TypeScript interfaces                   │
│  encryptor.ts      - AES-256-GCM encryption                 │
│  decryptor.ts      - Multi-version decryption               │
│  env-key-provider.ts - Environment-based key retrieval      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Tables                            │
├─────────────────────────────────────────────────────────────┤
│  encryption_key_versions  - Registry of key versions         │
│  key_rotation_log         - Audit log of rotation operations │
└─────────────────────────────────────────────────────────────┘
```

## Formato de Dados Criptografados

### Legacy (v1)
```
base64(iv:ciphertext:tag)
```

### Versioned (v2+)
```
ENC_V{version}:{base64(iv:ciphertext:tag)}
```

**Exemplos:**
- Legacy: `YWJjZGVmZ2hpams...` (base64 direto)
- v2: `ENC_V2:YWJjZGVmZ2hpams...`
- v3: `ENC_V3:YWJjZGVmZ2hpams...`

## Configuração de Secrets

### Variáveis de Ambiente Necessárias

| Secret | Descrição | Obrigatório |
|--------|-----------|-------------|
| `BUYER_ENCRYPTION_KEY` | Chave v1 (legacy/ativa) | ✅ Sim |
| `BUYER_ENCRYPTION_KEY_V2` | Chave v2 | Quando rotacionar |
| `BUYER_ENCRYPTION_KEY_V3` | Chave v3 | Quando rotacionar |

### Formato da Chave
- **Algoritmo**: AES-256-GCM
- **Tamanho**: 32 bytes (256 bits)
- **Encoding**: Base64

**Gerando uma nova chave:**
```bash
# Usando OpenSSL
openssl rand -base64 32

# Usando Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Uso do Módulo

### Importação

```typescript
import {
  encrypt,
  decrypt,
  safeDecrypt,
  needsReEncryption,
  reEncrypt,
  isEncrypted,
  getEncryptedVersion,
} from "../_shared/kms/index.ts";
```

### Criptografar

```typescript
// Criptografa com a versão ativa atual
const encrypted = await encrypt("dados sensíveis");
// Resultado: "ENC_V1:YWJjZGVmZ2hpams..."
```

### Descriptografar

```typescript
// Descriptografa automaticamente qualquer versão
const decrypted = await decrypt(encrypted);
// Resultado: "dados sensíveis"

// Versão segura (não lança exceção)
const safe = await safeDecrypt(encrypted);
// Resultado: "dados sensíveis" ou null
```

### Verificar Versão

```typescript
import { createLogger } from "../_shared/logger.ts";
const log = createLogger("KMS");

if (isEncrypted(value)) {
  const version = getEncryptedVersion(value);
  log.debug(`Encrypted with version: ${version}`);
}
```

### Verificar Necessidade de Re-criptografia

```typescript
if (await needsReEncryption(encrypted)) {
  const updated = await reEncrypt(encrypted);
}
```

## Processo de Rotação de Chaves

### Passo 1: Preparar Nova Chave

1. Gere uma nova chave de 256 bits
2. Adicione como secret: `BUYER_ENCRYPTION_KEY_V{N}`
3. Chame o endpoint de preparação:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/key-rotation-executor \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "prepare", "newVersion": 2}'
```

### Passo 2: Executar Rotação

```bash
curl -X POST https://your-project.supabase.co/functions/v1/key-rotation-executor \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "rotate", "targetVersion": 2, "batchSize": 100}'
```

### Passo 3: Ativar Nova Versão

```bash
curl -X POST https://your-project.supabase.co/functions/v1/key-rotation-executor \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "activate", "version": 2}'
```

### Passo 4: Verificar Status

```bash
curl -X POST https://your-project.supabase.co/functions/v1/key-rotation-executor \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "status"}'
```

## Tabelas Configuradas para Rotação

| Tabela | Colunas Criptografadas | Primary Key |
|--------|------------------------|-------------|
| `users` | `document_encrypted` | `id` |

Para adicionar novas tabelas, edite `DEFAULT_ROTATION_CONFIG` em `types.ts`.

## Tabelas do Banco de Dados

### encryption_key_versions

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | SERIAL | ID interno |
| `version` | INTEGER | Número da versão (1, 2, 3...) |
| `key_identifier` | TEXT | Nome do secret (ex: BUYER_ENCRYPTION_KEY_V2) |
| `algorithm` | TEXT | Algoritmo usado (AES-256-GCM) |
| `status` | TEXT | pending, rotating, active, deprecated, revoked |
| `created_at` | TIMESTAMPTZ | Quando foi criada |
| `activated_at` | TIMESTAMPTZ | Quando foi ativada |
| `deprecated_at` | TIMESTAMPTZ | Quando foi deprecada |
| `revoked_at` | TIMESTAMPTZ | Quando foi revogada |
| `expires_at` | TIMESTAMPTZ | Expiração opcional |
| `metadata` | JSONB | Metadados adicionais |

### key_rotation_log

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID do log |
| `action` | TEXT | Ação executada |
| `from_version` | INTEGER | Versão de origem |
| `to_version` | INTEGER | Versão de destino |
| `status` | TEXT | running, completed, failed |
| `records_processed` | INTEGER | Registros processados |
| `records_failed` | INTEGER | Registros com falha |
| `started_at` | TIMESTAMPTZ | Início da operação |
| `completed_at` | TIMESTAMPTZ | Fim da operação |
| `error_message` | TEXT | Mensagem de erro (se houver) |
| `metadata` | JSONB | Metadados adicionais |

## Funções SQL Auxiliares

| Função | Descrição |
|--------|-----------|
| `get_active_key_version()` | Retorna a versão ativa atual |
| `register_key_version(...)` | Registra nova versão de chave |
| `activate_key_version(...)` | Ativa uma versão específica |
| `start_key_rotation_log(...)` | Inicia log de rotação |
| `update_key_rotation_progress(...)` | Atualiza progresso |
| `complete_key_rotation(...)` | Finaliza rotação |

## Segurança

### RLS Policies

- Tabelas `encryption_key_versions` e `key_rotation_log` têm RLS habilitado
- Apenas `service_role` pode acessar (via Edge Functions)
- Nenhum acesso direto do frontend

### Boas Práticas

1. **Nunca exponha chaves no frontend**
2. **Rotacione chaves regularmente** (recomendado: a cada 90 dias)
3. **Mantenha chaves antigas** até confirmar que todos os dados foram migrados
4. **Monitore os logs** de rotação para identificar falhas
5. **Teste em ambiente de staging** antes de rotacionar em produção

## Troubleshooting

### Erro: "Secret not configured"

A chave para a versão especificada não existe nos secrets do Supabase.

**Solução:** Adicione o secret `BUYER_ENCRYPTION_KEY_V{N}` nas configurações de Edge Functions.

### Erro: "Target version not available"

A versão de destino não foi preparada ou não tem chave disponível.

**Solução:** Execute o passo "prepare" antes de "rotate".

### Rotação com falhas

Alguns registros falharam durante a rotação.

**Solução:** 
1. Verifique os logs detalhados
2. Identifique registros corrompidos
3. Corrija manualmente se necessário
4. Re-execute a rotação

## Changelog

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0.0 | 2026-01-19 | Implementação inicial do KMS |
