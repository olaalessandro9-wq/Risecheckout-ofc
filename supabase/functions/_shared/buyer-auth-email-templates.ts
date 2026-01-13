/**
 * Buyer Auth Email Templates
 * 
 * Templates de email para autenticação de compradores
 * Separado para manter arquivos < 300 linhas
 */

// ============================================
// RESET PASSWORD EMAIL
// ============================================
export function generateResetEmailHtml(name: string | null, resetLink: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0b; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #141416; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); width: 50px; height: 50px; border-radius: 12px; line-height: 50px; color: white; font-weight: bold; font-size: 24px;">R</div>
                  <h1 style="color: white; margin: 20px 0 0 0; font-size: 24px; font-weight: 600;">RiseCheckout</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px;">
                  <h2 style="color: white; margin: 0 0 20px 0; font-size: 20px;">Olá${name ? `, ${name}` : ''}!</h2>
                  <p style="color: #94a3b8; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                    Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                          Redefinir Senha
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="color: #64748b; margin: 20px 0; font-size: 14px;">
                    Este link expira em <strong style="color: #94a3b8;">1 hora</strong>.
                  </p>
                  <p style="color: #64748b; margin: 20px 0 0 0; font-size: 14px;">
                    Se você não solicitou esta alteração, ignore este email. Sua senha permanecerá a mesma.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px 40px 40px; border-top: 1px solid rgba(255,255,255,0.1);">
                  <p style="color: #64748b; margin: 0; font-size: 12px; text-align: center;">
                    © 2025 RiseCheckout Inc. Todos os direitos reservados.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function generateResetEmailText(name: string | null, resetLink: string): string {
  return `
Olá${name ? `, ${name}` : ''}!

Recebemos uma solicitação para redefinir sua senha.

Clique no link abaixo para criar uma nova senha:
${resetLink}

Este link expira em 1 hora.

Se você não solicitou esta alteração, ignore este email.

Atenciosamente,
Equipe RiseCheckout
  `;
}
