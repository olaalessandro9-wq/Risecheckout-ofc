/**
 * ZeptoMail Shared Module
 * 
 * Módulo utilitário para envio de emails via ZeptoMail API.
 * Suporta 3 tipos de email com remetentes diferentes.
 */

// ============================================================================
// TYPES
// ============================================================================

export type EmailType = 'transactional' | 'support' | 'notification';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailParams {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  type?: EmailType;
  trackClicks?: boolean;
  trackOpens?: boolean;
  clientReference?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: unknown;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Retorna o email e nome do remetente baseado no tipo de email.
 */
export function getFromEmail(type: EmailType = 'transactional'): { email: string; name: string } {
  const fromName = Deno.env.get('ZEPTOMAIL_FROM_NAME') || 'Rise Checkout';
  
  switch (type) {
    case 'support':
      return {
        email: Deno.env.get('ZEPTOMAIL_FROM_SUPPORT') || 'suporte@risecheckout.com',
        name: fromName,
      };
    case 'notification':
      return {
        email: Deno.env.get('ZEPTOMAIL_FROM_NOTIFICATIONS') || 'notificacoes@risecheckout.com',
        name: fromName,
      };
    case 'transactional':
    default:
      return {
        email: Deno.env.get('ZEPTOMAIL_FROM_NOREPLY') || 'naoresponda@risecheckout.com',
        name: fromName,
      };
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Envia email via ZeptoMail API.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = Deno.env.get('ZEPTOMAIL_API_KEY');
  
  if (!apiKey) {
    console.error('[ZeptoMail] API key not configured');
    return {
      success: false,
      error: 'ZEPTOMAIL_API_KEY not configured',
    };
  }

  const { email: fromEmail, name: fromName } = getFromEmail(params.type);
  
  // Normaliza destinatários para array
  const recipients = Array.isArray(params.to) ? params.to : [params.to];
  
  if (recipients.length === 0) {
    console.error('[ZeptoMail] No recipients provided');
    return {
      success: false,
      error: 'No recipients provided',
    };
  }

  const payload = {
    from: {
      address: fromEmail,
      name: fromName,
    },
    to: recipients.map(r => ({
      email_address: {
        address: r.email,
        name: r.name || r.email,
      },
    })),
    subject: params.subject,
    htmlbody: params.htmlBody,
    textbody: params.textBody,
    track_clicks: params.trackClicks ?? true,
    track_opens: params.trackOpens ?? true,
    client_reference: params.clientReference,
  };

  console.log('[ZeptoMail] Sending email:', {
    from: fromEmail,
    to: recipients.map(r => r.email),
    subject: params.subject,
    type: params.type || 'transactional',
    clientReference: params.clientReference,
  });

  try {
    const response = await fetch('https://api.zeptomail.com/v1.1/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': apiKey, // Já inclui "Zoho-enczapikey"
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('[ZeptoMail] API error:', {
        status: response.status,
        statusText: response.statusText,
        body: responseData,
      });
      return {
        success: false,
        error: responseData.message || `HTTP ${response.status}: ${response.statusText}`,
        details: responseData,
      };
    }

    console.log('[ZeptoMail] Email sent successfully:', responseData);

    return {
      success: true,
      messageId: responseData.data?.[0]?.message_id || responseData.request_id,
      details: responseData,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ZeptoMail] Network/unexpected error:', errorMessage);
    return {
      success: false,
      error: errorMessage,
      details: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
    };
  }
}
