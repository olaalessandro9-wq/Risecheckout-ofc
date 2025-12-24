# Análise Completa da Documentação OAuth do Mercado Pago

## Data: 20/11/2025

## 1. Fluxos OAuth Disponíveis

O Mercado Pago oferece **3 tipos de fluxos** para obter Access Token:

### 1.1 Authorization Code (OAuth para terceiros)
- **Uso:** Quando se quer usar credenciais para acessar recursos **em nome de terceiros**
- **Características:**
  - Requer intervenção do vendedor para autorizar explicitamente
  - Usa redirecionamento via navegador
  - Retorna um `code` que deve ser trocado por Access Token
  - O `code` tem validade de **10 minutos**
  - O Access Token tem validade de **180 dias (6 meses)**
  - Retorna também um `refresh_token` para renovação

### 1.2 Client Credentials (OAuth próprio)
- **Uso:** Quando se quer usar credenciais para acessar recursos **em nome próprio**
- **Características:**
  - Não requer interação do usuário
  - Aplicação não pode atuar em nome de terceiros
  - Access Token tem validade de **6 horas**
  - Deve ser renovado antes da expiração

### 1.3 Refresh Token (Renovação)
- **Uso:** Para renovar Access Token expirado do fluxo Authorization Code
- **Características:**
  - Evita nova interação com o usuário
  - Só funciona se o scope `offline_access` foi solicitado
  - Cada renovação gera um novo `access_token` E um novo `refresh_token`

---

## 2. Endpoint de Token

**URL:** `POST https://api.mercadopago.com/oauth/token`

### 2.1 Parâmetros Obrigatórios

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `client_secret` | String | Chave privada da aplicação (OBRIGATÓRIO) |
| `client_id` | String | ID único da aplicação (OBRIGATÓRIO) |
| `grant_type` | String | Tipo de operação: `authorization_code`, `refresh_token` ou `client_credentials` |

### 2.2 Parâmetros Condicionais

| Parâmetro | Quando usar | Descrição |
|-----------|-------------|-----------|
| `code` | `grant_type=authorization_code` | Código de autorização recebido (validade 10 min) |
| `redirect_uri` | `grant_type=authorization_code` | URL de redirecionamento configurada na aplicação |
| `code_verifier` | Se PKCE habilitado | Código verificador para PKCE |
| `refresh_token` | `grant_type=refresh_token` | Token para renovação |
| `test_token` | Para testes | `true` para gerar credenciais de sandbox |

---

## 3. Erros Possíveis

### 3.1 Error: `invalid_client`
**Descrição:** O `client_id` e/ou `client_secret` fornecidos são inválidos.

**Possíveis causas:**
1. Credenciais incorretas ou copiadas erradas
2. Credenciais de ambiente errado (sandbox vs production)
3. Credenciais revogadas ou expiradas
4. Aplicação não publicada/ativa

### 3.2 Error: `invalid_grant`
**Descrição:** Várias razões possíveis:
- `authorization_code` ou `refresh_token` inválidos
- Códigos expirados (code expira em 10 minutos)
- Códigos revogados
- Códigos enviados incorretamente
- Códigos pertencem a outro cliente
- `redirect_uri` não corresponde ao configurado

### 3.3 Error: `invalid_scope`
**Descrição:** Escopo inválido, desconhecido ou mal formado.

**Valores permitidos:**
- `offline_access`
- `write`
- `read`

### 3.4 Error: `invalid_request`
**Descrição:** Requisição mal formada:
- Falta parâmetro obrigatório
- Parâmetro não suportado
- Valor duplicado
- Formato incorreto

### 3.5 Error: `unsupported_grant_type`
**Descrição:** `grant_type` inválido.

**Valores permitidos:**
- `authorization_code`
- `refresh_token`
- `client_credentials`

---

## 4. PKCE (Proof Key for Code Exchange)

### 4.1 O que é?
Protocolo de segurança **opcional mas recomendado** que adiciona camada extra de proteção.

### 4.2 Como funciona?
1. Gera um `code_verifier` (43-128 caracteres aleatórios)
2. Cria `code_challenge` a partir do `code_verifier`:
   - **S256:** Aplica SHA256 + BASE64URL encoding
   - **Plain:** Usa o mesmo valor do `code_verifier`
3. Envia `code_challenge` e `code_challenge_method` na URL de autorização
4. Envia `code_verifier` ao trocar o code por token

### 4.3 Habilitação
- Deve ser habilitado na tela "Detalhes de aplicação"
- Quando habilitado, torna `code_challenge` e `code_method` **obrigatórios**

---

## 5. URL de Autorização

### 5.1 Formato Básico
```
https://auth.mercadopago.com/authorization?client_id=APP_ID&response_type=code&platform_id=mp&state=RANDOM_ID&redirect_uri=YOUR_URL
```

### 5.2 Com PKCE
```
https://auth.mercadopago.com/authorization?response_type=code&client_id=$APP_ID&redirect_uri=$YOUR_URL&code_challenge=$CODE_CHALLENGE&code_challenge_method=$CODE_METHOD
```

### 5.3 Parâmetros

| Parâmetro | Descrição |
|-----------|-----------|
| `client_id` | ID da aplicação |
| `response_type` | Sempre `code` |
| `platform_id` | Sempre `mp` |
| `state` | Identificador único para cada tentativa (segurança) |
| `redirect_uri` | URL configurada na aplicação (deve ser exata) |
| `code_challenge` | (Opcional) Challenge do PKCE |
| `code_challenge_method` | (Opcional) Método: `S256` ou `Plain` |

---

## 6. Resposta de Sucesso

```json
{
  "access_token": "<REDACTED>",
  "token_type": "bearer",
  "expires_in": 15552000,
  "scope": "read write offline_access",
  "user_id": "<REDACTED>",
  "refresh_token": "<REDACTED>",
  "public_key": "<REDACTED>",
  "live_mode": true
}
```

---

## 7. Análise do Problema Atual

### 7.1 Erro Recebido
```
invalid_client_id or client_secret
```

### 7.2 Credenciais Usadas
- **Client ID:** `<CONFIGURE_NO_DASHBOARD>`
- **Client Secret:** `<CONFIGURE_NO_DASHBOARD>`
- **Access Token:** `<CONFIGURE_NO_DASHBOARD>`
- **Public Key:** `<CONFIGURE_NO_DASHBOARD>`

### 7.3 Hipóteses

#### ✅ Já Testado e Descartado:
1. ❌ Credenciais copiadas erradas (verificado múltiplas vezes)
2. ❌ Problema de browser (testado em múltiplos navegadores)
3. ❌ Problema de conta (testado com conta do amigo também)
4. ❌ JWT bloqueando (já desabilitado)

#### 🔍 Hipóteses Restantes:

**A. Aplicação não está publicada/ativa para OAuth**
- Marketplace foi ativado, mas OAuth pode precisar de aprovação separada
- Verificar se há algum status de "pendente" ou "em revisão"

**B. Credenciais são de API, não de OAuth**
- No Mercado Pago pode haver diferença entre:
  - Credenciais de API (Access Token + Public Key) ✅ Funcionando
  - Credenciais de OAuth (Client ID + Client Secret) ❌ Não funcionando
- Pode ser necessário gerar credenciais OAuth específicas

**C. Redirect URI não corresponde exatamente**
- Documentação diz: "se a URL não corresponder exatamente à configuração do aplicativo"
- Verificar se há diferenças sutis (http vs https, trailing slash, etc)

**D. PKCE está habilitado mas não está sendo enviado**
- Se PKCE foi habilitado no dashboard, `code_challenge` se torna obrigatório
- Verificar se PKCE está habilitado na aplicação

**E. Aplicação precisa de aprovação para modo Marketplace**
- Marketplace foi ativado, mas OAuth pode precisar de revisão/aprovação
- Pode estar em modo "teste" e não "produção"

---

## 8. Próximos Passos Recomendados

### 8.1 Verificações no Dashboard
1. ✅ Verificar se PKCE está habilitado → Se sim, implementar
2. ✅ Verificar status da aplicação (ativa, pendente, em revisão)
3. ✅ Verificar se há seção específica de "OAuth" com credenciais separadas
4. ✅ Verificar redirect_uri configurado (copiar exatamente)
5. ✅ Verificar se há logs de tentativas de OAuth no dashboard

### 8.2 Testes
1. ✅ Implementar PKCE se estiver habilitado
2. ✅ Testar com `test_token=true` para sandbox
3. ✅ Verificar se há diferença entre credenciais de teste e produção

### 8.3 Suporte
Se nada funcionar, contatar suporte do Mercado Pago com:
- Client ID da aplicação
- Timestamp das tentativas
- Logs de erro completos
- Confirmação de que Marketplace está ativo
