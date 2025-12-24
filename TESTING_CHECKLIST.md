# Checklist de Testes - Integração PushinPay

## 📋 Pré-requisitos

- [ ] Migrações SQL aplicadas no banco de dados
- [ ] Edge Functions implantadas no Supabase
- [ ] Variáveis de ambiente configuradas
- [ ] Webhook configurado no painel da PushinPay
- [ ] Chave de criptografia gerada e configurada

## 🔐 Testes de Segurança

### Criptografia

- [ ] Token é criptografado antes de salvar no banco
- [ ] Token criptografado não pode ser lido diretamente
- [ ] Descriptografia funciona corretamente nas Edge Functions
- [ ] Token mascarado (`••••••••`) é exibido na UI

### Row-Level Security (RLS)

- [ ] Usuário A não consegue acessar configurações do usuário B
- [ ] Cliente não consegue ler `payments_map` diretamente
- [ ] Edge Functions (service_role) conseguem acessar todas as tabelas

### Validações

- [ ] Valor mínimo de R$ 0,50 é validado
- [ ] Taxa máxima de 50% é validada
- [ ] Token vazio retorna erro apropriado
- [ ] orderId inválido retorna 404

## 🏪 Testes de Configuração (Página Financeiro)

### Primeira Configuração

- [ ] Campos vazios inicialmente
- [ ] Placeholder correto no campo de token
- [ ] Ambiente padrão é "Sandbox"
- [ ] Taxa padrão é 0%

### Salvar Configuração

- [ ] Token é salvo com sucesso
- [ ] Mensagem de sucesso é exibida
- [ ] Ambiente é salvo corretamente
- [ ] Taxa é salva corretamente

### Atualizar Configuração

- [ ] Token mascarado é exibido ao recarregar
- [ ] Placeholder indica "Token configurado"
- [ ] Deixar token vazio mantém o anterior
- [ ] Informar novo token atualiza corretamente

### Botão Mostrar/Ocultar

- [ ] Botão "Mostrar" revela o token digitado
- [ ] Botão "Ocultar" esconde o token
- [ ] Estado é mantido durante a digitação

## 💳 Testes de Pagamento PIX (Sandbox)

### Criação de Cobrança

- [ ] QR Code é gerado corretamente
- [ ] QR Code Base64 é válido
- [ ] Código PIX copiável é exibido
- [ ] Botão "Copiar" funciona
- [ ] Mensagem "Copiado!" aparece ao copiar

### Split de Pagamento

- [ ] Split é calculado corretamente (ex: 10% de R$ 100 = R$ 10)
- [ ] Split não excede 50% do valor
- [ ] Split de 0% não adiciona split_rules
- [ ] Split é creditado na conta da plataforma

### Polling de Status

- [ ] Polling inicia automaticamente
- [ ] Polling consulta a cada 7 segundos
- [ ] Ícone de loading é exibido durante polling
- [ ] Polling para após pagamento confirmado
- [ ] Polling para após 5 minutos (timeout)

### Atualização de Status

- [ ] Status "created" exibe ícone de relógio
- [ ] Status "paid" exibe ícone de check verde
- [ ] Status "expired" exibe ícone de X vermelho
- [ ] Status "canceled" exibe ícone de X vermelho

### Webhook

- [ ] Webhook recebe notificação da PushinPay
- [ ] Status do pedido é atualizado no banco
- [ ] Atualização via webhook é mais rápida que polling
- [ ] Webhook é idempotente (não duplica atualizações)

## 🎨 Testes de UI/UX

### Responsividade

- [ ] Layout funciona em desktop (1920x1080)
- [ ] Layout funciona em tablet (768x1024)
- [ ] Layout funciona em mobile (375x667)
- [ ] QR Code é visível em todas as resoluções

### Tema Light/Dark

- [ ] Componente respeita tema light
- [ ] Componente respeita tema dark
- [ ] Cores são legíveis em ambos os temas
- [ ] Transição entre temas é suave

### Mensagens de Erro

- [ ] "Token inválido" é exibida corretamente
- [ ] "Valor mínimo é R$ 0,50" é exibida corretamente
- [ ] "Split não pode exceder 50%" é exibida corretamente
- [ ] "Configuração não encontrada" é exibida corretamente
- [ ] "Muitas tentativas" (429) é exibida corretamente
- [ ] "Serviço indisponível" (5xx) é exibida corretamente

### Aviso Legal

- [ ] Aviso da PushinPay é exibido
- [ ] Texto está correto e legível
- [ ] Aviso está posicionado adequadamente

## 🔄 Testes de Fluxo Completo (Sandbox)

### Fluxo Feliz

1. [ ] Vendedor configura token em Financeiro
2. [ ] Cliente cria um pedido
3. [ ] Cliente escolhe PIX como forma de pagamento
4. [ ] QR Code é gerado
5. [ ] Cliente "paga" via app de testes
6. [ ] Status é atualizado para "paid"
7. [ ] Cliente é redirecionado para página de sucesso
8. [ ] Split é creditado na conta da plataforma

### Fluxo de Erro - Token Inválido

1. [ ] Vendedor configura token inválido
2. [ ] Cliente tenta criar cobrança PIX
3. [ ] Erro "Token inválido" é exibido
4. [ ] Cliente não vê QR Code
5. [ ] Pedido permanece com status "pending"

### Fluxo de Erro - Valor Baixo

1. [ ] Cliente cria pedido de R$ 0,30
2. [ ] Cliente escolhe PIX
3. [ ] Erro "Valor mínimo é R$ 0,50" é exibido
4. [ ] QR Code não é gerado

### Fluxo de Timeout

1. [ ] Cliente gera QR Code
2. [ ] Cliente não paga
3. [ ] Polling continua por 5 minutos
4. [ ] Após 5 minutos, mensagem de timeout é exibida
5. [ ] Cliente pode tentar novamente

## 🚀 Testes de Produção

### Pré-Deploy

- [ ] Todos os testes de Sandbox passaram
- [ ] Webhook está configurado corretamente
- [ ] Variáveis de ambiente de produção estão corretas
- [ ] Backup do banco de dados foi feito

### Transação Real

- [ ] Vendedor configura token de produção
- [ ] Cliente cria pedido de valor baixo (ex: R$ 1,00)
- [ ] QR Code é gerado
- [ ] Cliente paga via app bancário real
- [ ] Status é atualizado para "paid"
- [ ] Split é creditado na conta da plataforma
- [ ] Valores estão corretos no painel da PushinPay

### Monitoramento

- [ ] Logs das Edge Functions estão sendo gerados
- [ ] Erros são capturados e logados
- [ ] Performance está adequada (< 2s para gerar QR)
- [ ] Webhook está respondendo em < 1s

## 📊 Testes de Performance

### Carga

- [ ] 10 cobranças simultâneas são processadas
- [ ] 50 cobranças simultâneas são processadas
- [ ] Tempo de resposta permanece < 3s

### Concorrência

- [ ] Múltiplos vendedores podem criar cobranças simultaneamente
- [ ] Webhooks simultâneos não causam race conditions
- [ ] Polling de múltiplos pedidos não sobrecarrega

## 🔍 Testes de Edge Cases

### Dados Inválidos

- [ ] orderId null retorna erro
- [ ] value negativo retorna erro
- [ ] value não numérico retorna erro
- [ ] environment inválido retorna erro
- [ ] platform_fee_percent > 100 retorna erro

### Rede

- [ ] Timeout da PushinPay é tratado
- [ ] Erro de rede é tratado
- [ ] Retry automático funciona (429)

### Banco de Dados

- [ ] Erro de conexão é tratado
- [ ] Constraint violation é tratada
- [ ] Transação é rollback em caso de erro

## ✅ Critérios de Aceitação

Para considerar a integração completa e pronta para produção:

- [ ] 100% dos testes de segurança passaram
- [ ] 100% dos testes de configuração passaram
- [ ] 100% dos testes de pagamento (Sandbox) passaram
- [ ] 100% dos testes de UI/UX passaram
- [ ] 100% dos testes de fluxo completo passaram
- [ ] Pelo menos 1 transação real foi testada com sucesso
- [ ] Documentação está completa e atualizada
- [ ] Equipe foi treinada no uso da integração

## 📝 Relatório de Testes

Após completar os testes, preencha:

- **Data dos testes**: _______________
- **Ambiente testado**: [ ] Sandbox [ ] Produção
- **Testes passados**: _____ / _____
- **Testes falhados**: _____ / _____
- **Bugs encontrados**: _____
- **Aprovado para produção**: [ ] Sim [ ] Não

**Observações**:
_______________________________________________________
_______________________________________________________
_______________________________________________________
