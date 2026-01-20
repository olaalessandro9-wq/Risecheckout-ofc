> **⚠️ DOCUMENTO DE ARQUIVO**  
> Este documento é um registro histórico de Dezembro de 2024.  
> Muitas informações podem estar desatualizadas (ex: `cors.ts` → `cors-v2.ts`).  
> Para a documentação atual, consulte a pasta `docs/` principal.

# Relatório de Auditoria de Segurança e Plano de Ação: RiseCheckout

**Autor:** Manus AI
**Data:** 29 de Dezembro de 2025
**Para:** Lovable

## 1. Resumo Executivo

Esta auditoria foi conduzida para validar as descobertas do relatório de segurança inicial da Lovable AI e para realizar uma análise independente e proativa de vulnerabilidades no projeto RiseCheckout. A análise confirma a **criticidade** dos problemas apontados e revela **novas vulnerabilidades de alto risco** que necessitam de atenção imediata antes da entrada do projeto em produção.

**A vulnerabilidade mais crítica encontrada, não reportada anteriormente, é o acesso público a funções que podem ler segredos do Supabase Vault, permitindo que usuários não autenticados (`anon`) potencialmente acessem credenciais sensíveis.**

Este documento detalha todas as vulnerabilidades, valida as descobertas anteriores e apresenta um plano de ação consolidado e priorizado para a correção completa do sistema.

| Categoria da Vulnerabilidade | Nível de Risco | Status |
| :--- | :--- | :--- |
| **[NOVO]** Acesso Não Autenticado a Segredos do Vault | 🔴 **Crítico** | Não corrigido |
| Credenciais Expostas no Banco de Dados | 🔴 **Crítico** | Não corrigido |
| **[NOVO]** Falta de RLS na Tabela de Segredos do Vault | 🟠 **Alto** | Não corrigido |
| **[NOVO]** Validação Incompleta de Webhooks | 🟠 **Alto** | Não corrigido |
| **[NOVO]** Política de CORS Insegura | 🟡 **Médio** | Não corrigido |
| Código Desatualizado no Repositório Local | 🟡 **Médio** | Não corrigido |
| Exposição de Access Token no Frontend | 🔵 **Baixo** | Não corrigido |

---

## 2. Validação do Relatório da Lovable AI

A análise confirma que todas as vulnerabilidades apontadas no relatório da Lovable AI são precisas e representam um risco real.

### 2.1. Credenciais em Texto Plano (Confirmado)

- **Vulnerabilidade:** Tokens de API (MercadoPago, Stripe, Asaas, UTMify) estão armazenados em texto plano na coluna `config` da tabela `vendor_integrations`.
- **Validação:** Uma consulta direta ao banco de dados confirma a presença de `access_token`, `refresh_token` e `api_key` em formato de texto legível. O componente `UTMifyConfig.tsx` também confirma que salva o `api_token` diretamente no banco de dados, sem passar pelo Vault.
- **Risco:** 🔴 **Crítico**. Qualquer acesso não autorizado ao banco de dados, seja por um exploit, um backup vazado ou um acesso indevido de um desenvolvedor, resulta no comprometimento total das contas de pagamento dos vendedores.

### 2.2. Funções de Migração e Salvamento (Confirmado com Observações)

- **Observação:** Foi detectada uma **discrepância entre o código no repositório GitHub e o que está em produção** no Supabase. As funções `migrate-credentials-to-vault` e `save-vendor-credentials` **existem no ambiente de produção**, mas não no repositório local. Isso representa um risco de processo, pois o código-fonte não é a "fonte da verdade".
- **Validação:**
    - A função `migrate-credentials-to-vault` em produção está incompleta, não incluindo a lógica para migrar tokens do **Stripe** e **Asaas**, como suspeitado pela Lovable.
    - A função `save-vendor-credentials` existe em produção e parece funcionar corretamente, separando dados públicos e sensíveis.
    - As funções de callback OAuth (`mercadopago-oauth-callback` e `stripe-connect-oauth`) já utilizam uma função para salvar no Vault, porém, a implementação dessa função (`saveCredentialsToVault`) não foi encontrada no arquivo `_shared/vault-credentials.ts` (que não existe), mas sim dentro de `_shared/platform-config.ts` sob o nome `getVendorCredentials`, o que indica uma refatoração incompleta ou mal documentada.

---

## 3. Novas Vulnerabilidades Descobertas

### 3.1. [CRÍTICO] Acesso Não Autenticado a Segredos do Vault

- **Vulnerabilidade:** As funções RPC `get_vault_secret` e `vault_get_secret` têm permissão de execução para o role `anon`. Isso significa que um usuário **não autenticado** pode chamar essas funções diretamente via API.
- **Risco:** 🔴 **Crítico**. Embora um atacante precise adivinhar o nome exato de um segredo (ex: `vendor_[UUID]_mercadopago_access_token`), isso é trivial para segredos de plataforma (ex: `INTERNAL_WEBHOOK_SECRET`) e factível para segredos de vendedor através de scripts automatizados. Esta falha anula completamente a proteção oferecida pelo Vault.

### 3.2. [ALTO] Ausência de RLS na Tabela `vault.secrets`

- **Vulnerabilidade:** A tabela `vault.secrets`, que armazena os segredos criptografados, não possui Row-Level Security (RLS) ativado. 
- **Risco:** 🟠 **Alto**. Embora o acesso seja primariamente por funções `SECURITY DEFINER`, esta é uma falha na defesa em profundidade. Se uma outra vulnerabilidade (como uma injeção de SQL em uma função privilegiada) permitir a um atacante executar código como um superusuário, ele poderia ler todos os segredos da tabela sem restrições.

### 3.3. [ALTO] Validação Incompleta de Assinatura de Webhooks

- **Vulnerabilidade:** Os webhooks do **Asaas** e **PushinPay** não utilizam validação criptográfica de assinatura (HMAC). A autenticação depende de um token estático enviado no cabeçalho (`asaas-access-token`).
- **Risco:** 🟠 **Alto**. Tokens estáticos são vulneráveis a ataques de replay e podem vazar em logs ou serem interceptados. Um atacante que obtenha o token pode forjar webhooks, resultando em criação de pedidos falsos, atualização incorreta de status de pagamento e potencial fraude financeira.

### 3.4. [MÉDIO] Política de CORS Excessivamente Permissiva

- **Vulnerabilidade:** Pelo menos 19 Edge Functions, incluindo `get-users-with-emails` e `manage-user-role`, estão configuradas com `Access-Control-Allow-Origin: '*'`. 
- **Risco:** 🟡 **Médio**. Isso permite que qualquer site na internet faça requisições a esses endpoints. Se uma dessas funções for chamada a partir de um navegador e tiver uma falha de autenticação, ela pode ser explorada via Cross-Site Request Forgery (CSRF) ou usada para extrair dados. Todas as funções que não são webhooks públicos devem ter o CORS restrito aos domínios do frontend da aplicação.

### 3.5. [BAIXO] Potencial Exposição de Tokens no Frontend

- **Vulnerabilidade:** O código do frontend em `FacebookPixelConfig.tsx` e `TestModeConfig.tsx` manipula `access_token` no estado do componente React. 
- **Risco:** 🔵 **Baixo**. Embora estes possam ser tokens de curta duração ou com escopo limitado, é uma má prática. Tokens sensíveis nunca devem ser expostos ou manipulados no lado do cliente, pois podem ser extraídos por extensões maliciosas do navegador ou ataques de XSS.

---

## 4. Plano de Ação Consolidado

O plano a seguir é priorizado por criticidade para garantir a estabilização da segurança da plataforma.

### **FASE 1: Contenção Imediata (Risco Crítico)**

1.  **Revogar Permissões de Funções do Vault (Responsável: Desenvolvedor Backend)**
    - **Ação:** Executar SQL para revogar o acesso do role `anon` e `authenticated` às funções `get_vault_secret` e `vault_get_secret`. Apenas o role `service_role` deve ter permissão.
    ```sql
    REVOKE EXECUTE ON FUNCTION public.get_vault_secret FROM anon, authenticated;
    REVOKE EXECUTE ON FUNCTION public.vault_get_secret FROM anon, authenticated;
    ```

2.  **Ativar RLS na Tabela `vault.secrets` (Responsável: Desenvolvedor Backend)**
    - **Ação:** Ativar RLS na tabela e criar uma política que bloqueie todo o acesso por padrão.
    ```sql
    ALTER TABLE vault.secrets ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Block All Access" ON vault.secrets FOR ALL USING (false);
    ```

3.  **Atualizar e Executar a Migração de Credenciais (Responsável: Manus AI & Desenvolvedor)**
    - **Ação:**
        1.  Atualizar a Edge Function `migrate-credentials-to-vault` em produção para incluir a lógica de migração para **Stripe** e **Asaas** e usar `vault_upsert_secret` para idempotência.
        2.  Executar a função com `{"dryRun": false, "includeInactive": true}` para migrar todos os 9 tokens expostos.
        3.  Validar que a coluna `config` na tabela `vendor_integrations` foi limpa e que os segredos agora existem no Vault.

### **FASE 2: Correção de Vulnerabilidades (Risco Alto e Médio)**

4.  **Refatorar o Componente `UTMifyConfig.tsx` (Responsável: Desenvolvedor Frontend)**
    - **Ação:** Modificar o componente para chamar a Edge Function `save-vendor-credentials` em vez de salvar o `api_token` diretamente no banco de dados, conforme sugerido no relatório da Lovable.

5.  **Implementar Validação de Webhooks (Responsável: Desenvolvedor Backend)**
    - **Ação:**
        - Para o **Asaas**, implementar a validação do token de verificação (`asaas-webhook-token`) em vez do token de acesso.
        - Para o **PushinPay**, contatar o suporte para verificar se oferecem um mecanismo de assinatura HMAC. Se não, registrar a fragilidade como um risco aceito.

6.  **Restringir Políticas de CORS (Responsável: Desenvolvedor Backend)**
    - **Ação:** Revisar todas as 19 Edge Functions com CORS wildcard. Para cada uma, substituir `*` por uma lista de origens permitidas (ex: `https://risecheckout.com`, `http://localhost:5173`), seguindo o exemplo da função `create-order`.

### **FASE 3: Boas Práticas e Refinamento (Risco Baixo e Processos)**

7.  **Sincronizar Repositório e Produção (Responsável: DevOps/Desenvolvedor)**
    - **Ação:** Baixar o código-fonte das Edge Functions de produção (`migrate-credentials-to-vault`, `save-vendor-credentials`) e comitá-lo ao repositório GitHub para garantir que o Git seja a fonte da verdade.

8.  **Refatorar Manipulação de Tokens no Frontend (Responsável: Desenvolvedor Frontend)**
    - **Ação:** Revisar `FacebookPixelConfig.tsx` e `TestModeConfig.tsx`. Garantir que os `access_token` manipulados não sejam sensíveis. Se forem, refatorar a lógica para que eles nunca saiam do backend.

9.  **Revisão de Segurança Contínua**
    - **Ação:** Agendar auditorias de segurança recorrentes e integrar ferramentas de análise estática de segurança (SAST) no pipeline de CI/CD para detectar novas vulnerabilidades automaticamente.

---

## 5. Conclusão

O projeto RiseCheckout possui uma base arquitetônica sólida, mas as vulnerabilidades identificadas, especialmente o acesso não autenticado aos segredos do Vault, representam um risco inaceitável para um ambiente de produção. A execução do plano de ação proposto, na ordem de prioridade definida, é fundamental para mitigar esses riscos e garantir a segurança e a integridade da plataforma e de seus usuários. 
