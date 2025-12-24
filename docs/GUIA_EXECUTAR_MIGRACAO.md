# Guia: Como Executar a Migração de Credenciais

**Autor:** Manus AI  
**Data:** 12 de Dezembro de 2025

---

## 📋 Passo a Passo

### **Passo 1: Fazer Login no RiseCheckout**

1. Acesse: https://risecheckout.com (ou seu domínio)
2. Faça login com suas credenciais
3. Certifique-se de que está logado com sucesso

---

### **Passo 2: Abrir o Console do DevTools**

**Windows/Linux:**
- Pressione `F12` ou `Ctrl + Shift + J`

**Mac:**
- Pressione `Cmd + Option + J`

Você verá uma janela abrir na parte inferior ou lateral do navegador.

---

### **Passo 3: Clicar na Aba "Console"**

No DevTools, clique na aba **"Console"** (geralmente a segunda aba).

Você verá uma área onde pode digitar comandos JavaScript.

---

### **Passo 4: Copiar o Script**

Copie **TODO** o script abaixo (clique no botão de copiar ou selecione tudo):

```javascript
/**
 * Script de Migração de Credenciais para o Vault
 * 
 * INSTRUÇÕES:
 * 1. Faça login no RiseCheckout
 * 2. Abra o Console do DevTools (F12 > Console)
 * 3. Cole este script completo
 * 4. Pressione Enter
 * 5. Aguarde o resultado
 * 
 * O script irá:
 * - Buscar seu token JWT automaticamente
 * - Chamar a Edge Function de migração
 * - Mostrar o resultado detalhado
 */

(async function migrarCredenciaisParaVault() {
  console.log('🚀 Iniciando migração de credenciais para o Vault...\n');
  
  try {
    // 1. Buscar o token JWT do Local Storage
    console.log('📋 Passo 1: Buscando token de autenticação...');
    
    const authKey = Object.keys(localStorage).find(key => 
      key.includes('auth-token') && key.includes('wivbtmtgpsxupfjwwovf')
    );
    
    if (!authKey) {
      console.error('❌ Erro: Token de autenticação não encontrado!');
      console.log('💡 Certifique-se de que você está logado no RiseCheckout.');
      return;
    }
    
    const authData = JSON.parse(localStorage.getItem(authKey));
    const token = authData?.access_token;
    
    if (!token) {
      console.error('❌ Erro: Access token não encontrado no Local Storage!');
      return;
    }
    
    console.log('✅ Token encontrado!\n');
    
    // 2. Chamar a Edge Function de migração
    console.log('📋 Passo 2: Executando migração...');
    console.log('⏳ Aguarde, isso pode levar alguns segundos...\n');
    
    const response = await fetch(
      'https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/migrate-credentials-to-vault',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // 3. Processar resposta
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na migração:', response.status, response.statusText);
      console.error('Detalhes:', errorText);
      return;
    }
    
    const result = await response.json();
    
    // 4. Mostrar resultado
    console.log('✅ Migração concluída com sucesso!\n');
    console.log('📊 RESUMO:');
    console.log(`   Total de integrações: ${result.summary.total}`);
    console.log(`   ✅ Sucesso: ${result.summary.success}`);
    console.log(`   ❌ Erros: ${result.summary.errors}\n`);
    
    if (result.results && result.results.length > 0) {
      console.log('📋 DETALHES POR INTEGRAÇÃO:\n');
      
      result.results.forEach((item, index) => {
        const statusEmoji = item.status === 'success' ? '✅' : '❌';
        console.log(`${index + 1}. ${statusEmoji} ${item.integration_type.toUpperCase()}`);
        console.log(`   Vendor ID: ${item.vendor_id}`);
        
        if (item.secrets_migrated && item.secrets_migrated.length > 0) {
          console.log(`   Secrets migrados: ${item.secrets_migrated.join(', ')}`);
        } else {
          console.log(`   Nenhum secret encontrado para migrar`);
        }
        
        if (item.error) {
          console.log(`   ⚠️ Erro: ${item.error}`);
        }
        console.log('');
      });
    }
    
    console.log('🎉 MIGRAÇÃO FINALIZADA!');
    console.log('');
    console.log('📝 PRÓXIMOS PASSOS:');
    console.log('1. Faça um teste de compra com cartão');
    console.log('2. Verifique os logs da função mercadopago-create-payment');
    console.log('3. Procure por: "Usando credenciais de produção (Vault)"');
    console.log('');
    console.log('Se aparecer essa mensagem, está tudo funcionando! ✅');
    
  } catch (error) {
    console.error('❌ Erro inesperado durante a migração:', error);
    console.error('Detalhes:', error.message);
  }
})();
```

---

### **Passo 5: Colar no Console**

1. Clique dentro da área do Console (onde tem o cursor piscando)
2. Cole o script (Ctrl+V ou Cmd+V)
3. Pressione **Enter**

---

### **Passo 6: Aguardar o Resultado**

O script vai executar automaticamente e mostrar mensagens no console:

```
🚀 Iniciando migração de credenciais para o Vault...

📋 Passo 1: Buscando token de autenticação...
✅ Token encontrado!

📋 Passo 2: Executando migração...
⏳ Aguarde, isso pode levar alguns segundos...

✅ Migração concluída com sucesso!

📊 RESUMO:
   Total de integrações: 3
   ✅ Sucesso: 3
   ❌ Erros: 0

📋 DETALHES POR INTEGRAÇÃO:

1. ✅ MERCADOPAGO
   Vendor ID: abc-123
   Secrets migrados: access_token, refresh_token

2. ✅ PUSHINPAY
   Vendor ID: abc-123
   Secrets migrados: api_token

3. ✅ FACEBOOK
   Vendor ID: abc-123
   Secrets migrados: access_token

🎉 MIGRAÇÃO FINALIZADA!
```

---

## ✅ Como Saber se Funcionou?

### **Teste 1: Fazer uma Compra**

1. Acesse um checkout
2. Faça uma compra de teste com cartão
3. Verifique se o pagamento foi processado

### **Teste 2: Verificar os Logs**

1. Acesse: https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/functions/mercadopago-create-payment/logs
2. Procure pela mensagem: `"Usando credenciais de produção (Vault)"`
3. Se aparecer, está funcionando! ✅

---

## 🆘 Troubleshooting

### **Erro: "Token de autenticação não encontrado"**

**Solução:** Certifique-se de que você está logado no RiseCheckout antes de executar o script.

---

### **Erro: "Access token não encontrado no Local Storage"**

**Solução:** Faça logout e login novamente, depois execute o script.

---

### **Erro: 401 Unauthorized**

**Solução:** Seu token expirou. Faça logout e login novamente.

---

### **Erro: 500 Internal Server Error**

**Solução:** Pode ser um problema temporário. Aguarde 1 minuto e tente novamente.

---

## 📞 Precisa de Ajuda?

Se tiver qualquer problema, me avise que eu te ajudo! 🚀
