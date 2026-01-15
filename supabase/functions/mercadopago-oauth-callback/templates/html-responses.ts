/**
 * HTML Response Templates
 * 
 * Responsabilidade: Templates HTML para popup OAuth
 * 
 * @module mercadopago-oauth-callback/templates/html-responses
 */

/**
 * HTML de sucesso que fecha o popup e notifica a janela pai
 */
export const successHTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conexão Bem-Sucedida</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      backdrop-filter: blur(10px);
    }
    .checkmark {
      font-size: 64px;
      margin-bottom: 1rem;
    }
    h1 { margin: 0 0 0.5rem 0; font-size: 24px; }
    p { margin: 0; opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="checkmark">✅</div>
    <h1>Conta Conectada!</h1>
    <p>Esta janela será fechada automaticamente...</p>
  </div>
  <script>
    // Notificar janela pai sobre sucesso
    if (window.opener) {
      window.opener.postMessage({ type: 'mercadopago_oauth_success' }, '*');
    }
    
    // Fechar janela após 2 segundos
    setTimeout(() => {
      window.close();
    }, 2000);
  </script>
</body>
</html>`;

/**
 * HTML de erro
 */
export function errorHTML(message: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Erro na Conexão</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      backdrop-filter: blur(10px);
      max-width: 400px;
    }
    .icon { font-size: 64px; margin-bottom: 1rem; }
    h1 { margin: 0 0 0.5rem 0; font-size: 24px; }
    p { margin: 0; opacity: 0.9; font-size: 14px; }
    button {
      margin-top: 1rem;
      padding: 0.5rem 1.5rem;
      background: white;
      color: #f5576c;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">❌</div>
    <h1>Erro na Conexão</h1>
    <p>${message}</p>
    <button onclick="window.close()">Fechar</button>
  </div>
</body>
</html>`;
}
