# 🔐 Política de Segurança - RiseCheckout

## 🔒 Versões Suportadas

| Versão | Suportada          |
| ------ | ------------------ |
| main   | ✅ Suporte ativo    |
| develop| ⚠️ Apenas desenvolvimento |
| < 1.0  | ❌ Não suportada    |

## 🛡️ Reportar uma Vulnerabilidade

Se você descobrir uma vulnerabilidade de segurança no RiseCheckout, por favor, reporte-a de forma responsável.

### Como Reportar

1. **NÃO** abra uma issue pública no GitHub
2. **Email**: Envie detalhes para security@risecheckout.com
3. **Inclua**:
   - Descrição detalhada da vulnerabilidade
   - Passos para reproduzir
   - Impacto potencial
   - Sugestões de correção (se houver)

### Timeline de Resposta

| Etapa | Prazo |
|-------|-------|
| Confirmação inicial | 24 horas |
| Avaliação preliminar | 48 horas |
| Atualização de status | 7 dias |
| Correção para críticos | 14 dias |

### O Que Qualifica como Vulnerabilidade

- Bypasses de autenticação/autorização
- Exposição ou vazamento de dados
- SQL injection, XSS, CSRF
- Secrets ou credenciais expostos
- Bypasses de políticas RLS
- Vulnerabilidades em processamento de pagamentos
- Sequestro de sessão

### Fora do Escopo

- Ataques de negação de serviço (DoS)
- Engenharia social
- Segurança física
- Issues em dependências (reportar upstream)
- Issues já conhecidos

## 🔐 Práticas de Segurança

### Conformidade com OWASP Top 10

- ✅ **A01:2021 – Broken Access Control:** Row Level Security (RLS) em todas as tabelas
- ✅ **A02:2021 – Cryptographic Failures:** HTTPS obrigatório, secrets no Vault
- ✅ **A03:2021 – Injection:** ORM com prepared statements, validação de entrada
- ✅ **A04:2021 – Insecure Design:** Validação no servidor, cálculo de preços no backend
- ✅ **A05:2021 – Security Misconfiguration:** Headers de segurança, CSP, rate limiting
- ✅ **A06:2021 – Vulnerable Components:** Dependabot ativo, auditorias regulares
- ✅ **A07:2021 – Authentication Failures:** Supabase Auth, MFA, rate limiting
- ✅ **A08:2021 – Integrity Failures:** Lock files, validação de webhooks com HMAC
- ✅ **A09:2021 – Logging Failures:** Logging de eventos de segurança
- ✅ **A10:2021 – SSRF:** Não há funcionalidade que busca recursos remotos

### Autenticação e Autorização

- ✅ Autenticação via Supabase Auth (JWT)
- ✅ Multi-Factor Authentication (MFA) disponível
- ✅ Row Level Security (RLS) em todas as tabelas
- ✅ Rate limiting em endpoints críticos

### Proteção de Dados

- ✅ Secrets armazenados no Supabase Vault
- ✅ HTTPS obrigatório em produção
- ✅ Criptografia em trânsito e em repouso
- ✅ Validação de senhas contra base de dados de vazamentos

### Gerenciamento de Secrets

- ✅ Nenhum secret hardcoded no código
- ✅ TruffleHog scanning em CI/CD (verified secrets only)
- ✅ Pre-commit hooks para detecção local
- ✅ Rotação trimestral de secrets

### Segurança de Código

- ✅ Validação de entrada com schemas Zod
- ✅ Sanitização de saída com DOMPurify
- ✅ Análise estática com CodeQL
- ✅ Scanning de vulnerabilidades em dependências

### Monitoramento

- ✅ Logging de eventos de segurança
- ✅ Alertas para atividades suspeitas
- ✅ Auditoria de acessos

## 📋 Checklist de Segurança para Contribuidores

Antes de submeter um PR:

```
[ ] Nenhum secret, API key ou token no código
[ ] Nenhum secret em logs ou mensagens de erro
[ ] Políticas RLS revisadas para novas tabelas
[ ] Validação de entrada em todos os inputs do usuário
[ ] CORS configurado corretamente
[ ] Mensagens de erro não vazam informações sensíveis
[ ] gitleaks passa localmente
```

## 🚨 Resposta a Incidentes

### Se Você Suspeitar de uma Brecha

1. **Imediatamente** rotacione credenciais afetadas
2. **Documente** a linha do tempo dos eventos
3. **Avalie** o escopo da exposição
4. **Notifique** usuários afetados se necessário
5. **Reporte** para security@risecheckout.com

### Guia de Rotação de Secrets

| Tipo de Secret | Frequência de Rotação | Localização |
|----------------|----------------------|-------------|
| Service Role Key | Imediato se exposto | Supabase Dashboard |
| API Keys | Trimestral | Dashboard do Provider |
| Webhook Secrets | Trimestral | Supabase Vault |
| JWT Secrets | Anual | Supabase Dashboard |

## 📚 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)

## 📞 Contato

- **Issues de Segurança**: security@risecheckout.com
- **Questões Gerais**: support@risecheckout.com

---

**Última atualização:** 25 de Dezembro de 2025
**Versão da Política:** 2.0
