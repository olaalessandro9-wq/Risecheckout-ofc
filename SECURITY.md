# Política de Segurança

## 🔒 Versões Suportadas

Atualmente, as seguintes versões do RiseCheckout recebem atualizações de segurança:

| Versão | Suportada          |
| ------ | ------------------ |
| main   | :white_check_mark: |
| < main | :x:                |

## 🛡️ Reportar uma Vulnerabilidade

Se você descobrir uma vulnerabilidade de segurança no RiseCheckout, por favor, reporte-a de forma responsável:

### Como Reportar

1. **NÃO** abra uma issue pública no GitHub
2. Envie um email para: **[SEU_EMAIL_DE_SEGURANÇA]**
3. Inclua:
   - Descrição detalhada da vulnerabilidade
   - Passos para reproduzir
   - Impacto potencial
   - Sugestões de correção (se houver)

### O Que Esperar

- **Confirmação:** Você receberá uma confirmação em até 48 horas
- **Avaliação:** Avaliaremos a vulnerabilidade em até 7 dias
- **Correção:** Vulnerabilidades críticas serão corrigidas em até 30 dias
- **Divulgação:** Após a correção, publicaremos um advisory de segurança

### Recompensas

Atualmente, não oferecemos um programa de bug bounty formal, mas:
- Reconheceremos publicamente sua contribuição (se desejar)
- Você será creditado no changelog da correção
- Consideraremos recompensas caso a caso para vulnerabilidades críticas

## 🔐 Práticas de Segurança

O RiseCheckout implementa as seguintes práticas de segurança:

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

- Autenticação via Supabase Auth (JWT)
- Multi-Factor Authentication (MFA) disponível
- Row Level Security (RLS) em todas as tabelas
- Rate limiting em endpoints críticos

### Proteção de Dados

- Secrets armazenados no Supabase Vault
- HTTPS obrigatório em produção
- Criptografia em trânsito e em repouso
- Validação de senhas contra base de dados de vazamentos

### Monitoramento

- Logging de eventos de segurança
- Alertas para atividades suspeitas
- Auditoria de acessos

## 📚 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/going-into-prod#security)
- [GitHub Security Advisories](https://github.com/olaalessandro9-wq/risecheckout-84776/security/advisories)

## 📞 Contato

Para questões de segurança que não sejam vulnerabilidades:
- Email: **[SEU_EMAIL]**
- GitHub Discussions: [Link para Discussions]

---

**Última atualização:** 16 de Dezembro de 2025  
**Versão da Política:** 1.0
