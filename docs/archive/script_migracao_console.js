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
