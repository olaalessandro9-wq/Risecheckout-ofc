/**
 * Testing Infrastructure - Mock HTTP Responses
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Standardized HTTP response library for contract tests.
 * Includes gateway-specific responses for payment integrations.
 * 
 * @module _shared/testing/mock-responses
 * @version 1.0.0
 */

// ============================================================================
// CORS HEADERS
// ============================================================================

/**
 * Standard CORS headers for edge function responses
 */
export const defaultCorsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-producer-session-token, x-internal-secret",
  "Access-Control-Max-Age": "86400",
};

/**
 * Creates CORS headers with custom origin
 */
export function createCorsHeaders(origin = "*"): Record<string, string> {
  return {
    ...defaultCorsHeaders,
    "Access-Control-Allow-Origin": origin,
  };
}

// ============================================================================
// SUCCESS RESPONSES
// ============================================================================

/**
 * Creates a JSON response with status 200
 */
export function jsonResponse(
  data: unknown,
  corsHeaders: Record<string, string> = defaultCorsHeaders,
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Creates a success response with { success: true, ...data }
 */
export function successResponse(
  data: Record<string, unknown> = {},
  corsHeaders: Record<string, string> = defaultCorsHeaders
): Response {
  return jsonResponse({ success: true, ...data }, corsHeaders, 200);
}

/**
 * Creates a created response (201) with { success: true, ...data }
 */
export function createdResponse(
  data: Record<string, unknown> = {},
  corsHeaders: Record<string, string> = defaultCorsHeaders
): Response {
  return jsonResponse({ success: true, ...data }, corsHeaders, 201);
}

/**
 * Creates a no content response (204)
 */
export function noContentResponse(
  corsHeaders: Record<string, string> = defaultCorsHeaders
): Response {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// ============================================================================
// ERROR RESPONSES
// ============================================================================

/**
 * Creates an error response with { success: false, error: message }
 */
export function errorResponse(
  message: string,
  corsHeaders: Record<string, string> = defaultCorsHeaders,
  status = 400
): Response {
  return jsonResponse({ success: false, error: message }, corsHeaders, status);
}

/**
 * Creates a bad request response (400)
 */
export function badRequestResponse(
  message = "Bad request",
  corsHeaders: Record<string, string> = defaultCorsHeaders
): Response {
  return errorResponse(message, corsHeaders, 400);
}

/**
 * Creates an unauthorized response (401)
 */
export function unauthorizedResponse(
  message = "Não autorizado",
  corsHeaders: Record<string, string> = defaultCorsHeaders
): Response {
  return errorResponse(message, corsHeaders, 401);
}

/**
 * Creates a forbidden response (403)
 */
export function forbiddenResponse(
  message = "Acesso negado",
  corsHeaders: Record<string, string> = defaultCorsHeaders
): Response {
  return errorResponse(message, corsHeaders, 403);
}

/**
 * Creates a not found response (404)
 */
export function notFoundResponse(
  message = "Não encontrado",
  corsHeaders: Record<string, string> = defaultCorsHeaders
): Response {
  return errorResponse(message, corsHeaders, 404);
}

/**
 * Creates a conflict response (409)
 */
export function conflictResponse(
  message = "Conflito",
  corsHeaders: Record<string, string> = defaultCorsHeaders
): Response {
  return errorResponse(message, corsHeaders, 409);
}

/**
 * Creates an unprocessable entity response (422)
 */
export function validationErrorResponse(
  message = "Dados inválidos",
  corsHeaders: Record<string, string> = defaultCorsHeaders
): Response {
  return errorResponse(message, corsHeaders, 422);
}

/**
 * Creates a rate limit response (429)
 */
export function rateLimitResponse(
  retryAfter = 60,
  corsHeaders: Record<string, string> = defaultCorsHeaders
): Response {
  return jsonResponse(
    { success: false, error: "Too many requests", retryAfter },
    { ...corsHeaders, "Retry-After": String(retryAfter) },
    429
  );
}

/**
 * Creates an internal server error response (500)
 */
export function serverErrorResponse(
  message = "Erro interno do servidor",
  corsHeaders: Record<string, string> = defaultCorsHeaders
): Response {
  return errorResponse(message, corsHeaders, 500);
}

// ============================================================================
// CORS PREFLIGHT
// ============================================================================

/**
 * Creates a CORS preflight response (OPTIONS)
 */
export function corsOptionsResponse(
  corsHeaders: Record<string, string> = defaultCorsHeaders
): Response {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// ============================================================================
// GATEWAY-SPECIFIC RESPONSES
// ============================================================================

/**
 * PushinPay gateway mock responses
 */
export const PushinPayResponses = {
  /**
   * Successful PIX creation response
   */
  pixCreated(transactionId: string, qrCode: string, pixCode: string) {
    return {
      id: transactionId,
      status: "pending",
      qr_code: qrCode,
      qr_code_text: pixCode,
      amount: 10000,
      created_at: new Date().toISOString(),
    };
  },

  /**
   * PIX received webhook payload
   */
  pixReceivedWebhook(transactionId: string, orderId: string) {
    return {
      event: "pix.received",
      data: {
        id: transactionId,
        reference_id: orderId,
        status: "paid",
        amount: 10000,
        paid_at: new Date().toISOString(),
      },
    };
  },

  /**
   * PIX expired webhook payload
   */
  pixExpiredWebhook(transactionId: string, orderId: string) {
    return {
      event: "pix.expired",
      data: {
        id: transactionId,
        reference_id: orderId,
        status: "expired",
        expired_at: new Date().toISOString(),
      },
    };
  },

  /**
   * Error response
   */
  error(message: string, code = "PUSHINPAY_ERROR") {
    return { error: { code, message } };
  },
};

/**
 * MercadoPago gateway mock responses
 */
export const MercadoPagoResponses = {
  /**
   * Successful payment creation response
   */
  paymentCreated(paymentId: string) {
    return {
      id: paymentId,
      status: "pending",
      status_detail: "pending_waiting_payment",
      transaction_amount: 100.0,
      date_created: new Date().toISOString(),
      point_of_interaction: {
        transaction_data: {
          qr_code: "00020126580014br.gov.bcb.pix...",
          qr_code_base64: "data:image/png;base64,...",
          ticket_url: "https://www.mercadopago.com/...",
        },
      },
    };
  },

  /**
   * Payment approved webhook payload
   */
  paymentApprovedWebhook(paymentId: string) {
    return {
      action: "payment.updated",
      api_version: "v1",
      data: { id: paymentId },
      date_created: new Date().toISOString(),
      id: crypto.randomUUID(),
      live_mode: false,
      type: "payment",
      user_id: "123456789",
    };
  },

  /**
   * Payment details (for GET request)
   */
  paymentDetails(paymentId: string, status: "approved" | "pending" | "rejected") {
    return {
      id: paymentId,
      status,
      status_detail: status === "approved" ? "accredited" : "pending_waiting_payment",
      transaction_amount: 100.0,
      date_approved: status === "approved" ? new Date().toISOString() : null,
      external_reference: "order-123",
      metadata: { order_id: "order-123" },
    };
  },

  /**
   * Error response
   */
  error(message: string, status = 400) {
    return { message, error: "bad_request", status };
  },
};

/**
 * Asaas gateway mock responses
 */
export const AsaasResponses = {
  /**
   * Successful payment creation response
   */
  paymentCreated(paymentId: string) {
    return {
      id: paymentId,
      dateCreated: new Date().toISOString().split("T")[0],
      customer: "cus_000000000000",
      value: 100.0,
      netValue: 97.0,
      billingType: "PIX",
      status: "PENDING",
      invoiceUrl: `https://sandbox.asaas.com/i/${paymentId}`,
      bankSlipUrl: null,
      invoiceNumber: "00001",
    };
  },

  /**
   * PIX QR code response
   */
  pixQrCode(paymentId: string) {
    return {
      encodedImage: "data:image/png;base64,...",
      payload: "00020126580014br.gov.bcb.pix...",
      expirationDate: new Date(Date.now() + 3600000).toISOString(),
    };
  },

  /**
   * Payment received webhook payload
   */
  paymentReceivedWebhook(paymentId: string) {
    return {
      event: "PAYMENT_RECEIVED",
      payment: {
        id: paymentId,
        customer: "cus_000000000000",
        value: 100.0,
        netValue: 97.0,
        billingType: "PIX",
        status: "RECEIVED",
        confirmedDate: new Date().toISOString().split("T")[0],
        externalReference: "order-123",
      },
    };
  },

  /**
   * Payment overdue webhook payload
   */
  paymentOverdueWebhook(paymentId: string) {
    return {
      event: "PAYMENT_OVERDUE",
      payment: {
        id: paymentId,
        status: "OVERDUE",
        externalReference: "order-123",
      },
    };
  },

  /**
   * Error response
   */
  error(message: string, code = "invalid_request") {
    return {
      errors: [{ code, description: message }],
    };
  },
};

/**
 * Stripe gateway mock responses
 */
export const StripeResponses = {
  /**
   * Successful payment intent creation
   */
  paymentIntentCreated(intentId: string) {
    return {
      id: intentId,
      object: "payment_intent",
      amount: 10000,
      currency: "brl",
      status: "requires_payment_method",
      client_secret: `${intentId}_secret_xxx`,
      created: Math.floor(Date.now() / 1000),
    };
  },

  /**
   * Payment intent succeeded webhook
   */
  paymentSucceededWebhook(intentId: string) {
    return {
      id: `evt_${crypto.randomUUID().replace(/-/g, "")}`,
      object: "event",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: intentId,
          status: "succeeded",
          amount: 10000,
          metadata: { order_id: "order-123" },
        },
      },
    };
  },

  /**
   * Error response
   */
  error(message: string, type = "invalid_request_error") {
    return {
      error: {
        type,
        message,
        code: "resource_missing",
      },
    };
  },
};

// ============================================================================
// GATEWAY RESPONSES NAMESPACE
// ============================================================================

/**
 * All gateway responses in a single namespace
 */
export const GatewayResponses = {
  pushinpay: PushinPayResponses,
  mercadopago: MercadoPagoResponses,
  asaas: AsaasResponses,
  stripe: StripeResponses,
} as const;
