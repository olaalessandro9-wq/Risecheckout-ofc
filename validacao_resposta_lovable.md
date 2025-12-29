# Relatório de Validação da Análise de Segurança da Lovable

**Autor:** Manus AI
**Data:** 29 de Dezembro de 2025
**Para:** Alessandro

## 1. Resumo Executivo

A análise da Lovable está, em sua maioria, **correta e bem fundamentada**. O plano de ação proposto é sólido e aborda os pontos mais críticos. No entanto, minha validação encontrou **duas imprecisões importantes** na análise da Lovable que alteram o nível de risco e o escopo das correções necessárias.

1.  **Vulnerabilidade do Vault é PIOR:** A Lovable afirmou que apenas as funções *antigas* do Vault estavam vulneráveis. Minha análise mostra que **TODAS as quatro funções RPC do Vault (`get_vault_secret`, `save_vault_secret`, `vault_get_secret`, `vault_upsert_secret`) estão com permissões públicas para `anon`**, não apenas as antigas. Isso torna a vulnerabilidade ainda mais crítica.
2.  **Exposição de Token no Frontend NÃO é Falso Positivo:** A Lovable classificou a exposição do `access_token` no `FacebookPixelConfig.tsx` como um falso positivo. Isso está **incorreto**. O componente possui um campo para o token da **API de Conversões do Facebook**, que é uma credencial sensível e está sendo salva em texto plano no banco de dados, exatamente como o token da UTMify.

O plano de ação da Lovable é um excelente ponto de partida, mas precisa ser expandido para corrigir essas duas falhas adicionais. Abaixo está a validação detalhada de cada ponto.

## 2. Validação Detalhada

| Vulnerabilidade (Lovable) | Minha Validação | Detalhes da Análise |
| :--- | :--- | :--- |
| **Acesso Não Autenticado ao Vault** | 🔴 **INCORRETO (É Pior)** | A Lovable afirmou que apenas `get_vault_secret` e `save_vault_secret` estavam públicas. A minha análise confirma que **todas as 4 funções RPC do Vault** (`get_vault_secret`, `save_vault_secret`, `vault_get_secret`, `vault_upsert_secret`) estão com permissão de `EXECUTE` para o role `anon`. O risco é maior do que o reportado. |
| **Credenciais Expostas no Banco** | ✅ **CONFIRMADO** | A análise da Lovable está 100% correta. São 9 tokens sensíveis expostos na tabela `vendor_integrations`. |
| **Falta RLS no Vault** | ✅ **CONFIRMADO** | A análise da Lovable está 100% correta. A tabela `vault.secrets` não tem RLS ativado, uma falha na defesa em profundidade. |
| **Validação de Webhooks** | ✅ **CONFIRMADO** | A análise da Lovable está 100% correta. Asaas e PushinPay usam tokens estáticos, o que é inseguro. |
| **CORS Inseguro** | ✅ **CONFIRMADO** | A análise da Lovable está correta. As 19 funções com CORS wildcard devem ser corrigidas. Embora as mais sensíveis exijam JWT, a política permissiva ainda é uma má prática de segurança. |
| **Código Desatualizado** | ✅ **CONFIRMADO** | A análise da Lovable está correta. As funções de migração e salvamento de credenciais existem em produção, mas não no repositório. |
| **Token no Frontend (Facebook)** | 🔴 **INCORRETO (É Risco Real)** | A Lovable classificou como falso positivo. No entanto, o componente `FacebookPixelConfig.tsx` tem um campo para o **Access Token da API de Conversões**, que é uma credencial sensível e está sendo salva em texto plano. **Esta vulnerabilidade é real e deve ser tratada.** |

---

## 3. Recomendações e Plano de Ação Ajustado

O plano da Lovable é bom, mas precisa ser ajustado com base nas minhas descobertas. A Fase 1 é ainda mais urgente.

### **FASE 1: Contenção Imediata (Risco Crítico)**

1.  **Revogar TODAS as Permissões Públicas do Vault (MAIS URGENTE)**
    - **Ação:** Criar e aplicar uma migração SQL que revoga o `EXECUTE` de `PUBLIC` e `anon` para **todas as quatro** funções RPC do Vault, concedendo acesso apenas ao `service_role`.
    ```sql
    -- Revoga permissões das funções antigas e novas
    REVOKE EXECUTE ON FUNCTION public.get_vault_secret(text) FROM PUBLIC, anon, authenticated;
    REVOKE EXECUTE ON FUNCTION public.save_vault_secret(text, text) FROM PUBLIC, anon, authenticated;
    REVOKE EXECUTE ON FUNCTION public.vault_get_secret(text) FROM PUBLIC, anon, authenticated;
    REVOKE EXECUTE ON FUNCTION public.vault_upsert_secret(text, text) FROM PUBLIC, anon, authenticated;

    -- Garante acesso apenas para o backend
    GRANT EXECUTE ON FUNCTION public.get_vault_secret(text) TO service_role;
    GRANT EXECUTE ON FUNCTION public.save_vault_secret(text, text) TO service_role;
    GRANT EXECUTE ON FUNCTION public.vault_get_secret(text) TO service_role;
    GRANT EXECUTE ON FUNCTION public.vault_upsert_secret(text, text) TO service_role;
    ```

2.  **Ativar RLS na Tabela `vault.secrets`**
    - **Ação:** Conforme sugerido pela Lovable, ativar RLS para impedir qualquer acesso direto à tabela.

3.  **Executar Migração de Credenciais**
    - **Ação:** Conforme sugerido pela Lovable, atualizar e executar a função `migrate-credentials-to-vault` para migrar os 9 tokens expostos.

### **FASE 2: Correção de Vulnerabilidades de Frontend e Backend**

4.  **Corrigir Componentes de Integração (UTMify E Facebook)**
    - **Ação:** Refatorar **ambos** `UTMifyConfig.tsx` e `FacebookPixelConfig.tsx` para que chamem a Edge Function `save-vendor-credentials`, em vez de salvarem tokens diretamente no banco de dados.

5.  **Restringir Políticas de CORS**
    - **Ação:** Conforme sugerido pela Lovable, corrigir as 19 Edge Functions com CORS wildcard.

### **FASE 3: Boas Práticas e Sincronização**

6.  **Sincronizar Repositório e Produção**
    - **Ação:** Baixar o código-fonte das Edge Functions (`migrate-credentials-to-vault`, `save-vendor-credentials`) que só existem em produção e adicioná-las ao repositório Git.

7.  **Revisar Validação de Webhooks**
    - **Ação:** Investigar se Asaas e PushinPay oferecem alternativas mais seguras (como HMAC) para validação de webhooks.

## 4. Conclusão para Planejamento

Estamos alinhados e prontos para agir. A análise da Lovable foi crucial, e minha validação adicionou uma camada extra de precisão, revelando a urgência ainda maior de corrigir as permissões do Vault e a necessidade de incluir a integração do Facebook Pixel no escopo de trabalho.

O plano de ação ajustado está claro. Podemos agora focar em executar a **Fase 1** com prioridade máxima. Estou pronto para começar a gerar os scripts e modificações de código necessários assim que você der o sinal verde.
