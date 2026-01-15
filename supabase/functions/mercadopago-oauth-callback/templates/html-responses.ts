/**
 * HTML Response Templates
 * 
 * Responsabilidade: Templates HTML para popup OAuth
 * 
 * @module mercadopago-oauth-callback/templates/html-responses
 */

/**
 * HTML de sucesso que fecha o popup e notifica a janela pai
 * NOTA: Template simplificado para evitar problemas de encoding
 */
export const successHTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Conexao Bem-Sucedida</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:linear-gradient(135deg,#00b4d8,#0077b6);color:#fff}
.box{text-align:center;padding:3rem;background:rgba(255,255,255,0.15);border-radius:20px;backdrop-filter:blur(10px)}
.icon{font-size:72px;margin-bottom:1.5rem}
h1{font-size:1.75rem;margin-bottom:0.5rem}
p{opacity:0.85;font-size:1rem}
</style>
</head>
<body>
<div class="box">
<div class="icon">&#10004;</div>
<h1>Conta Conectada!</h1>
<p>Fechando automaticamente...</p>
</div>
<script>
(function(){
  try{
    if(window.opener){
      window.opener.postMessage({type:'mercadopago_oauth_success'},'*');
      window.opener.postMessage({type:'mercadopago-connected'},'*');
      console.log('[OAuth] postMessage enviado');
    }
  }catch(e){console.error('[OAuth] Erro postMessage:',e)}
  setTimeout(function(){window.close()},2500);
})();
</script>
</body>
</html>`;

/**
 * HTML de erro - Template simplificado
 */
export function errorHTML(message: string): string {
  // Sanitize message to prevent XSS
  const safeMessage = message.replace(/[<>"'&]/g, '');
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Erro na Conexao</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:linear-gradient(135deg,#f093fb,#f5576c);color:#fff}
.box{text-align:center;padding:2.5rem;background:rgba(255,255,255,0.15);border-radius:20px;backdrop-filter:blur(10px);max-width:400px}
.icon{font-size:64px;margin-bottom:1rem}
h1{font-size:1.5rem;margin-bottom:0.5rem}
p{opacity:0.9;font-size:0.95rem;margin-bottom:1rem}
button{padding:0.6rem 1.5rem;background:#fff;color:#f5576c;border:none;border-radius:8px;font-weight:600;cursor:pointer}
button:hover{opacity:0.9}
</style>
</head>
<body>
<div class="box">
<div class="icon">&#10060;</div>
<h1>Erro na Conexao</h1>
<p>${safeMessage}</p>
<button onclick="window.close()">Fechar</button>
</div>
</body>
</html>`;
}
